const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./prado_vision.db');

db.serialize(() => {
    // 1. Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT,
        endereco TEXT,
        observacao TEXT
    )`);

    // 2. Produtos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        unidade TEXT, -- 'un' ou 'kg'
        valor_compra REAL,
        valor_venda REAL,
        estoque_atual REAL DEFAULT 0
    )`);

    // 3. Histórico de Renovação de Estoque
    db.run(`CREATE TABLE IF NOT EXISTS estoque_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER,
        quantidade REAL,
        data_renovacao TEXT,
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);

    // 4. Cabeçalho da Venda
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        data_venda TEXT,
        total_venda REAL,
        total_lucro REAL,
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);

    // 5. Itens da Venda (Para múltiplos produtos por venda)
    db.run(`CREATE TABLE IF NOT EXISTS venda_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER,
        produto_id INTEGER,
        quantidade REAL,
        preco_unitario REAL,
        lucro_unitario REAL,
        FOREIGN KEY(venda_id) REFERENCES vendas(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);
});

module.exports = db;