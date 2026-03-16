const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- ROTAS DE CLIENTES ---
app.post('/clientes', (req, res) => {
    const { nome, telefone, endereco, observacao } = req.body;
    db.run(`INSERT INTO clientes (nome, telefone, endereco, observacao) VALUES (?,?,?,?)`, 
    [nome, telefone, endereco, observacao], () => res.json({success: true}));
});

app.get('/clientes', (req, res) => {
    db.all(`SELECT * FROM clientes`, [], (err, rows) => res.json(rows));
});

// --- ROTAS DE PRODUTOS E ESTOQUE ---
app.post('/produtos', (req, res) => {
    const { nome, unidade, valor_compra, valor_venda, estoque_inicial } = req.body;
    db.run(`INSERT INTO produtos (nome, unidade, valor_compra, valor_venda, estoque_atual) VALUES (?,?,?,?,?)`,
    [nome, unidade, valor_compra, valor_venda, estoque_inicial], () => res.json({success: true}));
});

app.post('/produtos/estoque', (req, res) => {
    const { produto_id, quantidade } = req.body;
    const data = new Date().toLocaleString();
    db.serialize(() => {
        db.run(`UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?`, [quantidade, produto_id]);
        db.run(`INSERT INTO estoque_log (produto_id, quantidade, data_renovacao) VALUES (?,?,?)`, [produto_id, quantidade, data]);
        res.json({success: true});
    });
});

app.get('/produtos', (req, res) => {
    db.all(`SELECT *, (valor_venda - valor_compra) as lucro_unitario FROM produtos`, [], (err, rows) => res.json(rows));
});

// --- ROTA DE VENDA (COMPLEXA) ---
app.post('/vendas', (req, res) => {
    const { cliente_id, itens, total_venda, total_lucro } = req.body;
    const data = new Date().toLocaleString();

    db.run(`INSERT INTO vendas (cliente_id, data_venda, total_venda, total_lucro) VALUES (?,?,?,?)`,
    [cliente_id, data, total_venda, total_lucro], function(err) {
        const venda_id = this.lastID;
        
        itens.forEach(item => {
            db.run(`INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, lucro_unitario) VALUES (?,?,?,?,?)`,
            [venda_id, item.produto_id, item.quantidade, item.preco_venda, (item.preco_venda - item.preco_compra)]);
            
            db.run(`UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?`, [item.quantidade, item.produto_id]);
        });
        res.json({ success: true, venda_id });
    });
});

// --- DASHBOARD ---
app.get('/dashboard', (req, res) => {
    const sql = `SELECT SUM(total_venda) as faturamento, SUM(total_lucro) as lucro FROM vendas`;
    db.get(sql, [], (err, row) => res.json(row));
});

app.listen(3000, () => console.log("Prado Vision Pro rodando em http://localhost:3000"));