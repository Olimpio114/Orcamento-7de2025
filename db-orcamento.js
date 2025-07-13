

  // db-orcamento.js - Definição do banco de dados Dexie.js para o Orçamento Doméstico

const dbOrcamento = new Dexie('BudgetDB');

// Define a versão 1 do esquema para o banco de dados de orçamento
// A store 'monthlyBudgets' terá uma chave primária 'yearMonth' (ex: "2025-01")
// e campos para ano, mês e o objeto de dados completo do orçamento para aquele mês.
dbOrcamento.version(1).stores({
    monthlyBudgets: 'yearMonth, year, month, data'
    // 'yearMonth': Será o índice e a chave única (ex: "2025-01")
    // 'year, month': Índices adicionais para consultas por ano ou mês
    // 'data': O objeto JSON que conterá todos os valores de receitas e despesas para o mês.
});

dbOrcamento.open().catch(function (err) {
    console.error("Falha ao abrir o banco de dados de orçamento: " + err.stack || err);
});