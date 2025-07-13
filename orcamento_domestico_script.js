// orcamento_domestico_script.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado e orcamento_domestico_script.js iniciado.');

    // Seletores de elementos do DOM
    const menuItems = document.querySelectorAll('.menu-item');
    const budgetSections = document.querySelectorAll('.budget-section');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');

    // Seletores para o footer de resumo global
    const summaryTotalReceitaSpan = document.getElementById('summary-total-receita');
    const summaryTotalDespesasSpan = document.getElementById('summary-total-despesas');
    const summaryResultadoSpan = document.getElementById('summary-resultado');

    // Seletores para a nova tabela de Resumo
    const resumoReceitaSpan = document.getElementById('resumo-receita');
    const resumoAlimentacaoSpan = document.getElementById('resumo-alimentacao');
    const resumoMoradiaSpan = document.getElementById('resumo-moradia');
    const resumoEducacaoSpan = document.getElementById('resumo-educacao');
    const resumoSaudeSpan = document.getElementById('resumo-saude');
    const resumoPessoaisSpan = document.getElementById('resumo-pessoais');
	const resumoTransporteSpan = document.getElementById('resumo-transporte');
    const resumoLazerSpan = document.getElementById('resumo-lazer');
    const resumoServicoFinanceiroSpan = document.getElementById('resumo-servico-financeiro');
    const resumoTotalDespesasGeralSpan = document.getElementById('resumo-total-despesas-geral');
    const resumoResultadoFinalSpan = document.getElementById('resumo-resultado-final');


    let currentMonth;
    let currentYear;

    // --- Funções de UI e Navegação ---

    // Função para mostrar a seção correta e ocultar as outras
    function showSection(targetId) {
        budgetSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
        // Scroll to top of content area after section change
        document.querySelector('.content').scrollTop = 0;
    }

    // Adiciona evento de clique aos itens do menu
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Evita o comportamento padrão do link

            // Remove a classe 'active' de todos os itens do menu
            menuItems.forEach(link => link.classList.remove('active'));

            // Adiciona a classe 'active' ao item clicado
            item.classList.add('active');

            // Mostra a seção correspondente
            const targetId = item.dataset.target; // Obtém o ID do atributo data-target
            showSection(targetId);
        });
    });

    // Função para inicializar os seletores de mês e ano
    function initializeMonthYearSelectors() {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const current = new Date();
        const defaultMonth = current.getMonth(); // 0-indexed
        const defaultYear = current.getFullYear();

        // Popular meses
        monthSelect.innerHTML = months.map((month, index) =>
            `<option value="${index + 1}" ${index === defaultMonth ? 'selected' : ''}>${month}</option>`
        ).join('');

        // Popular anos (ex: de 2020 até 5 anos no futuro)
        for (let i = 2020; i <= defaultYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === defaultYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }

        currentMonth = defaultMonth + 1;
        currentYear = defaultYear;

        monthSelect.addEventListener('change', (event) => {
            currentMonth = parseInt(event.target.value);
            loadBudgetForCurrentMonthYear();
        });

        yearSelect.addEventListener('change', (event) => {
            currentYear = parseInt(event.target.value);
            loadBudgetForCurrentMonthYear();
        });
    }

    // --- Funções de Armazenamento (IndexedDB) ---

    // Função para salvar os dados do orçamento no IndexedDB
    async function saveBudgetData() {
        const budgetData = {};
        budgetSections.forEach(section => {
            const sectionId = section.id;
            // Excluímos a seção de resumo do salvamento, pois ela é apenas um display dos totais
            if (sectionId === 'resumo-section') {
                return;
            }

            const dataRows = section.querySelectorAll('tbody tr');
            const rowsData = [];

            dataRows.forEach(row => {
                const rowValues = {};
                // Get headers from the current section's thead, excluding the last one ('Ações')
                const headers = Array.from(section.querySelectorAll('thead th:not(:last-child)')).map(th => th.textContent.trim());
                const inputsInRow = row.querySelectorAll('input[type="number"]');

                inputsInRow.forEach((input, index) => {
                    const headerKey = headers[index]; // Use the header text as key
                    if (headerKey) {
                        rowValues[headerKey] = parseFloat(input.value) || 0;
                    }
                });
                if (Object.keys(rowValues).length > 0) {
                    rowsData.push(rowValues);
                }
            });
            budgetData[sectionId] = rowsData;
        });


        const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        try {
            await dbOrcamento.monthlyBudgets.put({
                yearMonth: yearMonth,
                year: currentYear,
                month: currentMonth,
                data: budgetData
            });
            console.log(`Dados do orçamento para ${yearMonth} salvos com sucesso.`);
        } catch (error) {
            console.error("Erro ao salvar dados do orçamento:", error);
        }
    }


    // Função para carregar os dados do orçamento do IndexedDB
    async function loadBudgetData() {
        const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        try {
            const monthlyBudget = await dbOrcamento.monthlyBudgets.get(yearMonth);
            if (monthlyBudget && monthlyBudget.data) {
                console.log(`Dados do orçamento para ${yearMonth} carregados.`, monthlyBudget.data);

                budgetSections.forEach(section => {
                    const sectionId = section.id;
                    // Ignora a seção de resumo
                    if (sectionId === 'resumo-section') {
                        return;
                    }

                    const tableBody = section.querySelector('tbody');
                    // Limpa todas as linhas existentes
                    if (tableBody) {
                        while (tableBody.firstChild) {
                            tableBody.removeChild(tableBody.firstChild);
                        }
                    }

                    const loadedSectionData = monthlyBudget.data[sectionId] || [];

                    if (loadedSectionData.length > 0) {
                        loadedSectionData.forEach(rowData => {
                            const newRow = createHorizontalExpenseRow(sectionId, rowData); // Usa a função genérica para todas as seções
                            tableBody.appendChild(newRow);
                        });
                    } else {
                         // Se não houver dados carregados para a seção, adicione uma linha padrão (vazia)
                        const newRow = createHorizontalExpenseRow(sectionId, {}); // Objeto vazio para valores iniciais 0
                        tableBody.appendChild(newRow);
                    }
                });
            } else {
                console.log(`Nenhum dado encontrado para ${yearMonth}. Resetando campos.`);

                // Se não houver dados, resetar todos os campos para 0 e garantir uma linha base
                budgetSections.forEach(section => {
                    const sectionId = section.id;
                    if (sectionId === 'resumo-section') { // Ignora a seção de resumo
                        return;
                    }
                    const tableBody = section.querySelector('tbody');
                    if (tableBody) {
                         while (tableBody.firstChild) {
                            tableBody.removeChild(tableBody.firstChild);
                        }
                        const newRow = createHorizontalExpenseRow(sectionId, {});
                        tableBody.appendChild(newRow);
                    }
                });
            }
            // Re-anexar listeners e recalcular totais após carregar/resetar os dados e recriar as linhas
            attachInputListeners();
            attachRemoveRowListeners();
            calculateTotals();
        } catch (error) {
            console.error("Erro ao carregar dados do orçamento:", error);
        }
    }

    // --- Funções de Cálculo e Atualização de Totais ---

    // Função para calcular e atualizar os totais
    function calculateTotals() {
        let totalReceitaGlobal = 0;
        let totalDespesasGlobal = 0;

        // Objeto para armazenar os totais de cada seção (para a tabela de resumo)
        const sectionTotals = {};

        budgetSections.forEach(section => {
            const sectionId = section.id;
            // Ignora a seção de resumo nos cálculos de input, pois ela é apenas um display dos totais
            if (sectionId === 'resumo-section') {
                return;
            }

            const inputs = section.querySelectorAll('input[type="number"]');
            const sectionTotalSpan = section.querySelector(`#total-${sectionId.replace('-section', '')}`); // Correct ID for total span
            // This is for the total in the table footer, which might have a different ID pattern
            // For example, if total-alimentacao-section is the ID, it needs to be `#total-alimentacao-section`
            // Let's refine this to target the correct span based on user's HTML for consistency
            const specificSectionTotalSpan = section.querySelector(`#total-${sectionId}`);
            let currentSectionTotal = 0;

            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                currentSectionTotal += value;
            });

            // Armazena o total da seção
            sectionTotals[sectionId] = currentSectionTotal;

            // Atualiza o total geral da seção (no footer de cada tabela)
            // Priorize o span com o ID exato como 'total-alimentacao-section'
            if (specificSectionTotalSpan) {
                specificSectionTotalSpan.textContent = currentSectionTotal.toFixed(2);
            } else if (sectionTotalSpan) { // Fallback for older ID pattern if any
                sectionTotalSpan.textContent = currentSectionTotal.toFixed(2);
            }


            // Acumula para os totais globais
            if (sectionId === 'receita-section') {
                totalReceitaGlobal += currentSectionTotal;
            } else {
                totalDespesasGlobal += currentSectionTotal;
            }
        });

        const resultadoGlobal = totalReceitaGlobal - totalDespesasGlobal;

        // Atualiza os spans no footer de resumo global
        summaryTotalReceitaSpan.textContent = `R$ ${totalReceitaGlobal.toFixed(2)}`;
        summaryTotalDespesasSpan.textContent = `R$ ${totalDespesasGlobal.toFixed(2)}`;
        summaryResultadoSpan.textContent = `R$ ${resultadoGlobal.toFixed(2)}`;

        // Atualiza a cor do resultado global
        if (resultadoGlobal < 0) {
            summaryResultadoSpan.style.color = 'red';
        } else if (resultadoGlobal > 0) {
            summaryResultadoSpan.style.color = 'green';
        } else {
            summaryResultadoSpan.style.color = ''; // Cor padrão
        }

        // --- Atualiza a Tabela de Resumo de Gastos ---
        resumoReceitaSpan.textContent = sectionTotals['receita-section'] ? sectionTotals['receita-section'].toFixed(2) : '0.00';
        resumoAlimentacaoSpan.textContent = sectionTotals['alimentacao-section'] ? sectionTotals['alimentacao-section'].toFixed(2) : '0.00';
        resumoMoradiaSpan.textContent = sectionTotals['moradia-section'] ? sectionTotals['moradia-section'].toFixed(2) : '0.00';
        resumoEducacaoSpan.textContent = sectionTotals['educacao-section'] ? sectionTotals['educacao-section'].toFixed(2) : '0.00';
        resumoSaudeSpan.textContent = sectionTotals['saude-section'] ? sectionTotals['saude-section'].toFixed(2) : '0.00';
        resumoPessoaisSpan.textContent = sectionTotals['pessoais-section'] ? sectionTotals['pessoais-section'].toFixed(2) : '0.00';
		
		    resumoTransporteSpan.textContent = sectionTotals['transporte-section'] ? sectionTotals['transporte-section'].toFixed(2) : '0.00';
		
        resumoLazerSpan.textContent = sectionTotals['lazer-section'] ? sectionTotals['lazer-section'].toFixed(2) : '0.00';
        resumoServicoFinanceiroSpan.textContent = sectionTotals['servico-financeiro-section'] ? sectionTotals['servico-financeiro-section'].toFixed(2) : '0.00';

        // Atualiza os totais na tabela de resumo (rodapé)
        resumoTotalDespesasGeralSpan.textContent = totalDespesasGlobal.toFixed(2);
        resumoResultadoFinalSpan.textContent = resultadoGlobal.toFixed(2);

        // Atualiza a cor do resultado final na tabela de resumo
        if (resultadoGlobal < 0) {
            resumoResultadoFinalSpan.style.color = 'red';
        } else if (resultadoGlobal > 0) {
            resumoResultadoFinalSpan.style.color = 'green';
        } else {
            resumoResultadoFinalSpan.style.color = ''; // Cor padrão
        }
    }


    // --- Funções de Manipulação de Linhas (Adicionar/Remover) ---

    // Função para criar uma nova linha para as seções (Receita e Despesas - padrão horizontal)
    function createHorizontalExpenseRow(sectionId, initialValues = {}) {
        const newRow = document.createElement('tr');
        const section = document.getElementById(sectionId);
        // Get headers excluding the last one ('Ações')
        const headers = Array.from(section.querySelectorAll('thead th:not(:last-child)')).map(th => th.textContent.trim());

        headers.forEach(headerText => {
            const newCell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.value = initialValues[headerText] !== undefined ? initialValues[headerText] : 0;
            input.classList.add('despesa-input');
            newCell.appendChild(input);
            newRow.appendChild(newCell);
        });

        // Add the remove button cell
        const removeButtonCell = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.classList.add('remove-horizontal-row-button');
        removeButtonCell.appendChild(removeButton);
        newRow.appendChild(removeButtonCell);

        return newRow;
    }


    // Função para anexar listeners de INPUT a todos os campos de número
    function attachInputListeners() {
        // Remover listeners antigos para evitar duplicação em elementos recriados
        document.querySelectorAll('.despesa-input').forEach(input => {
            input.removeEventListener('input', handleInputChange);
        });
        // Adicionar novos listeners
        document.querySelectorAll('.despesa-input').forEach(input => {
            input.addEventListener('input', handleInputChange);
        });
    }

    // Handler para eventos de input
    function handleInputChange() {
        calculateTotals();
        saveBudgetData();
    }

    // Função para anexar listeners de REMOVER LINHA
    function attachRemoveRowListeners() {
        // Remover listeners antigos para evitar duplicação em elementos recriados
        document.querySelectorAll('.remove-horizontal-row-button').forEach(button => {
            button.removeEventListener('click', handleRemoveRow);
        });
        // Adicionar novos listeners
        document.querySelectorAll('.remove-horizontal-row-button').forEach(button => {
            button.addEventListener('click', handleRemoveRow);
        });
    }

    // Handler para eventos de remover linha
    function handleRemoveRow(event) {
        const rowToRemove = event.target.closest('tr');
        if (rowToRemove) {
            // Get the tbody of the row to check if it's the last one
            const tableBody = rowToRemove.closest('tbody');
            // If it's the last row of *any* section, just reset values to 0 instead of removing the row.
            // This ensures there's always at least one editable row.
            if (tableBody.children.length === 1) {
                rowToRemove.querySelectorAll('input[type="number"]').forEach(input => {
                    input.value = 0;
                });
            } else {
                rowToRemove.remove();
            }
            calculateTotals();
            saveBudgetData();
        }
    }

    // Lógica para o botão "Adicionar Linha"
    const addRowButtons = document.querySelectorAll('.add-row-button');
    addRowButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const section = event.target.closest('section.budget-section');
            const sectionId = section.id;
            const tableBody = section.querySelector('tbody');

            const newRow = createHorizontalExpenseRow(sectionId); // Agora genérico para todas as seções
            tableBody.appendChild(newRow);

            // Re-anexar listeners para os novos campos e botões
            attachInputListeners();
            attachRemoveRowListeners();
            calculateTotals(); // Recalcula os totais imediatamente
            saveBudgetData(); // Salva os dados com a nova linha
        });
    });

    // --- Inicialização da Página ---

    // Função para carregar o orçamento para o mês e ano selecionados
    async function loadBudgetForCurrentMonthYear() {
        console.log(`Carregando orçamento para ${currentMonth}/${currentYear}...`);
        await loadBudgetData(); // Esta função já chama calculateTotals, attachInputListeners e attachRemoveRowListeners
    }

    // Inicializa a página
    initializeMonthYearSelectors();
    // Mostra a seção de Receita por padrão ao carregar a página
    showSection('receita-section');
    // Carrega os dados iniciais ou reseta e calcula os totais
    loadBudgetForCurrentMonthYear();
});