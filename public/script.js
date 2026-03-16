let carrinho = [];
let produtosDados = [];

// Navegação entre abas
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    carregarDados();
}

// Salvar Cliente
async function salvarCliente() {
    const dados = {
        nome: document.getElementById('c-nome').value,
        telefone: document.getElementById('c-tel').value,
        endereco: document.getElementById('c-end').value,
        observacao: document.getElementById('c-obs').value
    };
    await fetch('/clientes', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    alert("Cliente salvo!");
    location.reload();
}

// Salvar Produto
async function salvarProduto() {
    const dados = {
        nome: document.getElementById('p-nome').value,
        unidade: document.getElementById('p-un').value,
        valor_compra: parseFloat(document.getElementById('p-compra').value),
        valor_venda: parseFloat(document.getElementById('p-venda').value),
        estoque_inicial: parseFloat(document.getElementById('p-estoque').value)
    };
    await fetch('/produtos', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    alert("Produto salvo!");
    location.reload();
}

// Carregar Dados Iniciais
async function carregarDados() {
    // Clientes
    const resC = await fetch('/clientes');
    const clientes = await resC.json();
    document.getElementById('venda-cliente').innerHTML = '<option value="">Selecione o Cliente</option>' + 
        clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    // Produtos
    const resP = await fetch('/produtos');
    produtosDados = await resP.json();
    document.getElementById('venda-produto').innerHTML = '<option value="">Escolha o Produto</option>' + 
        produtosDados.map(p => `<option value="${p.id}">${p.nome} (${p.unidade}) - R$ ${p.valor_venda}</option>`).join('');

    // Lista de Estoque na Aba Produtos
    document.getElementById('lista-produtos-estoque').innerHTML = produtosDados.map(p => `
        <div class="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
            <div>
                <p class="font-bold">${p.nome}</p>
                <p class="text-xs text-gray-400">Estoque: ${p.estoque_atual} ${p.unidade} | Lucro Unit: R$ ${p.lucro_unitario.toFixed(2)}</p>
            </div>
            <button onclick="renovarEstoque(${p.id})" class="text-blue-600 text-xs font-bold">+ Renovar</button>
        </div>
    `).join('');

    // Dash
    const resD = await fetch('/dashboard');
    const dash = await resD.json();
    document.getElementById('dash-faturamento').innerText = `R$ ${(dash.faturamento || 0).toFixed(2)}`;
    document.getElementById('dash_lucro').innerText = `R$ ${(dash.lucro || 0).toFixed(2)}`;
}

// Logica do Carrinho
function addItemCarrinho() {
    const pId = document.getElementById('venda-produto').value;
    const qtd = parseFloat(document.getElementById('venda-qtd').value);
    const prod = produtosDados.find(p => p.id == pId);

    if(!prod || !qtd) return;

    carrinho.push({
        produto_id: prod.id,
        nome: prod.nome,
        quantidade: qtd,
        preco_venda: prod.valor_venda,
        preco_compra: prod.valor_compra,
        subtotal: qtd * prod.valor_venda,
        lucro: qtd * (prod.valor_venda - prod.valor_compra)
    });
    renderCarrinho();
}

function renderCarrinho() {
    const corpo = document.getElementById('carrinho-corpo');
    let total = 0, lucro = 0;
    corpo.innerHTML = carrinho.map(item => {
        total += item.subtotal;
        lucro += item.lucro;
        return `<tr class="border-b text-sm"><td class="py-2">${item.nome}</td><td>${item.quantidade}</td><td>R$ ${item.preco_venda}</td><td>R$ ${item.subtotal.toFixed(2)}</td></tr>`;
    }).join('');
    document.getElementById('venda-total').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('venda-lucro').innerText = `R$ ${lucro.toFixed(2)}`;
}

async function finalizarVenda() {
    const clienteId = document.getElementById('venda-cliente').value;
    if(!clienteId || carrinho.length == 0) return alert("Selecione o cliente e adicione itens!");

    const totalVenda = carrinho.reduce((a, b) => a + b.subtotal, 0);
    const totalLucro = carrinho.reduce((a, b) => a + b.lucro, 0);

    const res = await fetch('/vendas', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cliente_id: clienteId, itens: carrinho, total_venda: totalVenda, total_lucro: totalLucro })
    });

    if(res.ok) {
        alert("Venda Finalizada! Gerando Recibo...");
        window.print(); // Ativa a impressão do recibo
        location.reload();
    }
}

async function renovarEstoque(id) {
    const qtd = prompt("Quantidade a adicionar:");
    if(!qtd) return;
    await fetch('/produtos/estoque', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ produto_id: id, quantidade: parseFloat(qtd) })
    });
    carregarDados();
}

window.onload = carregarDados;