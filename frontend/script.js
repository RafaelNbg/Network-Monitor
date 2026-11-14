/* ==============================
   CONFIGURAÇÕES
============================== */

// Para mudar o endereço da API ou o intervalo de atualização (segundos), edite aqui
const PADRAO = { apiUrl: "http://127.0.0.1:8000", intervalo: 5, limite: 100 };

function lerStorage(chave, padrao) {
    try {
        return JSON.parse(localStorage.getItem(chave)) ?? padrao;
    } catch {
        return padrao;
    }
}

function salvarStorage(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch { /* storage indisponível: segue sem salvar */ }
}

let config = { ...PADRAO, limite: lerStorage("nm_limite", PADRAO.limite) };
let nomes = lerStorage("nm_nomes", {});      // nomes personalizados: { id: "Nome" }

const LIMITE_SEM_MEDICAO_S = 60;             // acima disso, considera que o main.py parou


/* ==============================
   ELEMENTOS DO HTML
============================== */

const $ = id => document.getElementById(id);

const tabela = $("lista-dispositivos");
const botaoAtualizar = $("atualizar");
const busca = $("busca");
const filtroStatus = $("filtro-status");
const seletor = $("selecionar-dispositivo");
const seletorLimite = $("limite-historico");
const mensagemGrafico = $("mensagem-grafico");
const mensagemVisao = $("mensagem-visao");
const aviso = $("aviso");

const linksMenu = document.querySelectorAll(".sidebar nav a");
const paginas = document.querySelectorAll(".pagina");

let dispositivos = [];       // lista com a medição atual de cada um
let paginaAtual = "visao-geral";
let graficoVisao = null;
let graficoLatencia = null;
let carregando = false;
let timer = null;


/* ==============================
   REQUISIÇÃO À API
============================== */

async function buscar(caminho) {

    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 8000);

    try {
        const url = config.apiUrl.replace(/\/+$/, "") + caminho;
        const resposta = await fetch(url, { signal: controle.signal });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        // A API devolve {"mensagem": ...} quando o banco não conecta
        if (dados && !Array.isArray(dados) && dados.mensagem) {
            throw new Error(dados.mensagem);
        }

        return dados;

    } finally {
        clearTimeout(limite);
    }
}


/* ==============================
   FUNÇÕES AUXILIARES
============================== */

function criar(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function nomeDe(d) {
    return nomes[d.id] || `Dispositivo ${d.id}`;
}

function formatarMs(valor) {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return "--";
    return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " ms";
}

function formatarHora(hora) {
    const data = new Date(hora);
    if (Number.isNaN(data.getTime())) return "--";
    return data.toLocaleTimeString("pt-BR");
}

function formatarDataHora(hora) {
    const data = new Date(hora);
    if (Number.isNaN(data.getTime())) return "--";
    return data.toLocaleString("pt-BR");
}

function latenciaValida(medicao) {
    return medicao && medicao.latencia !== null && medicao.latencia !== undefined;
}

function mostrarAviso(texto) {
    aviso.textContent = texto || "";
    aviso.hidden = !texto;
}

function definirConexao(estado, texto) {
    $("status-conexao").className = "connection-status " + estado;
    $("texto-conexao").textContent = texto;
}


/* ==============================
   CARREGAR DISPOSITIVOS
============================== */

async function atualizar() {

    if (carregando) return;

    carregando = true;
    botaoAtualizar.disabled = true;
    botaoAtualizar.textContent = "Atualizando...";

    try {

        const lista = await buscar("/dispositivos");

        // Uma requisição por dispositivo, todas em paralelo
        const medicoes = await Promise.all(
            lista.map(d => buscar(`/atual/${d.id}`).catch(() => null))
        );

        dispositivos = lista.map((d, i) => ({ ...d, medicao: medicoes[i] }));

        definirConexao("ok", "API conectada · " + formatarHora(new Date()));

        verificarColeta();
        renderizarTudo();

    } catch (erro) {

        console.error("Erro ao carregar dispositivos:", erro);

        definirConexao("erro", "API desconectada");

        mostrarAviso(
            `Não foi possível obter dados de ${config.apiUrl} (${erro.message}). ` +
            "Confira se a API está rodando (iniciar_api.bat) e se o MySQL está ativo."
        );

        if (dispositivos.length === 0) {
            tabela.replaceChildren(linhaMensagem("Erro ao carregar dispositivos."));
        }

    } finally {

        carregando = false;
        botaoAtualizar.disabled = false;
        botaoAtualizar.textContent = "Atualizar dados";

    }

}

// Avisa se as medições mais recentes são antigas (main.py parado)
function verificarColeta() {

    if (dispositivos.length === 0) {
        mostrarAviso("Nenhum dispositivo cadastrado ainda. Execute o main.py para descobrir e monitorar a rede.");
        return;
    }

    const horas = dispositivos
        .filter(d => d.medicao && d.medicao.hora)
        .map(d => new Date(d.medicao.hora).getTime());

    if (horas.length === 0) {
        mostrarAviso("Ainda não há medições registradas. Execute o main.py para iniciar o monitoramento.");
        return;
    }

    const idade = (Date.now() - Math.max(...horas)) / 1000;

    if (idade > LIMITE_SEM_MEDICAO_S) {
        mostrarAviso("A última medição foi há mais de 1 minuto. O main.py pode estar parado, então os dados abaixo podem estar desatualizados.");
    } else {
        mostrarAviso("");
    }

}


/* ==============================
   RENDERIZAÇÃO
============================== */

function renderizarTudo() {
    renderizarMetricas();
    renderizarTabela();
    renderizarGraficoVisao();
    renderizarSeletor();
}

function renderizarMetricas() {

    const online = dispositivos.filter(d => d.medicao?.status === "Online").length;
    const offline = dispositivos.filter(d => d.medicao?.status === "Offline").length;

    const latencias = dispositivos
        .filter(d => d.medicao?.status === "Online" && latenciaValida(d.medicao))
        .map(d => Number(d.medicao.latencia));

    const media = latencias.length
        ? latencias.reduce((a, b) => a + b, 0) / latencias.length
        : null;

    $("total-dispositivos").textContent = dispositivos.length;
    $("dispositivos-online").textContent = online;
    $("dispositivos-offline").textContent = offline;
    $("latencia-media").textContent = formatarMs(media);

}

function linhaMensagem(texto) {
    const linha = document.createElement("tr");
    const celula = criar("td", "vazio", texto);
    celula.colSpan = 7;
    linha.appendChild(celula);
    return linha;
}

function renderizarTabela() {

    const texto = busca.value.trim().toLowerCase();
    const status = filtroStatus.value;

    const filtrados = dispositivos.filter(d => {
        const status_d = d.medicao?.status || "";
        const combina = [nomeDe(d), d.ip, d.mac].some(v => String(v).toLowerCase().includes(texto));
        return combina && (!status || status_d === status);
    });

    $("resumo-tabela").textContent =
        `${filtrados.length} de ${dispositivos.length} dispositivos`;

    if (filtrados.length === 0) {
        tabela.replaceChildren(linhaMensagem(
            dispositivos.length === 0
                ? "Nenhum dispositivo encontrado."
                : "Nenhum dispositivo corresponde ao filtro."
        ));
        return;
    }

    const linhas = filtrados.map(d => {

        const medicao = d.medicao;
        const status = medicao ? medicao.status : "--";

        const linha = document.createElement("tr");

        // Nome
        linha.appendChild(criar("td", "", nomeDe(d)));

        // IP e MAC
        linha.appendChild(criar("td", "mono", d.ip));
        linha.appendChild(criar("td", "mono", d.mac));

        // Status
        const colunaStatus = document.createElement("td");
        const indicador = criar("span", "status", status);
        if (status === "Online") indicador.classList.add("online");
        if (status === "Offline") indicador.classList.add("offline");
        colunaStatus.appendChild(indicador);
        linha.appendChild(colunaStatus);

        // Latência e hora da medição
        linha.appendChild(criar("td", "", formatarMs(medicao?.latencia)));
        linha.appendChild(criar("td", "", medicao?.hora ? formatarDataHora(medicao.hora) : "--"));

        // Ações
        const colunaAcoes = criar("td", "acoes");

        const botaoHistorico = criar("button", "link-botao", "Histórico");
        botaoHistorico.type = "button";
        botaoHistorico.addEventListener("click", () => abrirHistorico(d.id));

        const botaoNome = criar("button", "link-botao", "Renomear");
        botaoNome.type = "button";
        botaoNome.addEventListener("click", () => renomear(d));

        colunaAcoes.append(botaoHistorico, botaoNome);
        linha.appendChild(colunaAcoes);

        return linha;
    });

    tabela.replaceChildren(...linhas);

}

function renomear(d) {

    const novo = prompt("Nome do dispositivo (deixe vazio para o nome padrão):", nomes[d.id] || "");

    if (novo === null) return;

    if (novo.trim()) {
        nomes[d.id] = novo.trim();
    } else {
        delete nomes[d.id];
    }

    salvarStorage("nm_nomes", nomes);
    renderizarTudo();

    if (seletor.value) carregarHistorico(true);

}


/* ==============================
   OPÇÕES BASE DOS GRÁFICOS
============================== */

function opcoesGrafico(tituloY) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { labels: { color: "#e8eef7" } }
        },
        scales: {
            x: {
                ticks: { color: "#8998ad", maxTicksLimit: 10, maxRotation: 0 },
                grid: { color: "rgba(137, 152, 173, 0.10)" }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: tituloY, color: "#8998ad" },
                ticks: { color: "#8998ad" },
                grid: { color: "rgba(137, 152, 173, 0.10)" }
            }
        }
    };
}

function chartDisponivel() {
    return typeof Chart !== "undefined";
}


/* ==============================
   GRÁFICO DA VISÃO GERAL
============================== */

function renderizarGraficoVisao() {

    if (!chartDisponivel()) {
        mensagemVisao.textContent = "A biblioteca Chart.js não foi carregada. Verifique sua conexão com a internet.";
        return;
    }

    const comMedicao = dispositivos.filter(d => d.medicao);

    if (comMedicao.length === 0) {
        if (graficoVisao) { graficoVisao.destroy(); graficoVisao = null; }
        mensagemVisao.textContent = "Ainda não há medições para exibir.";
        return;
    }

    const rotulos = comMedicao.map(nomeDe);
    const valores = comMedicao.map(d => d.medicao.status === "Online" ? Number(d.medicao.latencia ?? 0) : 0);
    const cores = comMedicao.map(d => d.medicao.status === "Online" ? "#35d49a" : "#ff647c");

    if (graficoVisao) {

        graficoVisao.data.labels = rotulos;
        graficoVisao.data.datasets[0].data = valores;
        graficoVisao.data.datasets[0].backgroundColor = cores;
        graficoVisao.update();

    } else {

        const opcoes = opcoesGrafico("Latência (ms)");
        opcoes.plugins.legend.display = false;

        graficoVisao = new Chart($("grafico-visao"), {
            type: "bar",
            data: {
                labels: rotulos,
                datasets: [{ label: "Latência (ms)", data: valores, backgroundColor: cores, borderRadius: 4 }]
            },
            options: opcoes
        });

    }

    const offline = comMedicao.filter(d => d.medicao.status === "Offline").length;
    mensagemVisao.textContent = offline
        ? `${offline} dispositivo(s) offline aparecem com barra zerada.`
        : "Todos os dispositivos estão respondendo.";

}


/* ==============================
   HISTÓRICO
============================== */

// Só recria as opções se a lista mudou, para não fechar o menu durante a atualização automática
function renderizarSeletor() {

    const assinatura = dispositivos.map(d => `${d.id}|${nomeDe(d)}|${d.ip}`).join(";");

    if (seletor.dataset.assinatura === assinatura) return;

    const selecionado = seletor.value;

    seletor.replaceChildren(new Option("Selecione um dispositivo", ""));

    for (const d of dispositivos) {
        seletor.appendChild(new Option(`${nomeDe(d)} - ${d.ip}`, d.id));
    }

    seletor.dataset.assinatura = assinatura;

    if ([...seletor.options].some(o => o.value === selecionado)) {
        seletor.value = selecionado;
    }

}

function abrirHistorico(id) {
    seletor.value = id;
    location.hash = "historico";   // dispara irPara(), que carrega o histórico
}

function limparHistorico(mensagem) {

    mensagemGrafico.textContent = mensagem;

    if (graficoLatencia) {
        graficoLatencia.destroy();
        graficoLatencia = null;
    }

    for (const id of ["stat-medicoes", "stat-min", "stat-media", "stat-max", "stat-perda"]) {
        $(id).textContent = "--";
    }

}

async function carregarHistorico(silencioso = false) {

    const id = seletor.value;

    if (!id) {
        limparHistorico("Selecione um dispositivo para visualizar seu histórico.");
        return;
    }

    if (!chartDisponivel()) {
        limparHistorico("A biblioteca Chart.js não foi carregada. Verifique sua conexão com a internet.");
        return;
    }

    try {

        if (!silencioso) mensagemGrafico.textContent = "Carregando histórico...";

        let historico = await buscar(`/historico/${id}`);

        // Ignora a resposta se o usuário trocou de dispositivo enquanto carregava
        if (id !== seletor.value) return;

        historico = historico
            .filter(m => m.hora)
            .sort((a, b) => new Date(a.hora) - new Date(b.hora));

        const limite = Number(seletorLimite.value);
        if (limite > 0) historico = historico.slice(-limite);

        if (historico.length === 0) {
            limparHistorico("Não existem medições para este dispositivo.");
            return;
        }

        const rotulos = historico.map(m => formatarHora(m.hora));
        const latencias = historico.map(m => latenciaValida(m) ? Number(m.latencia) : null);
        const quedas = historico.map(m => m.status === "Offline" ? 0 : null);

        // Estatísticas
        const validas = latencias.filter(v => v !== null);
        const falhas = historico.filter(m => m.status === "Offline").length;

        $("stat-medicoes").textContent = historico.length;
        $("stat-min").textContent = validas.length ? formatarMs(Math.min(...validas)) : "--";
        $("stat-media").textContent = validas.length ? formatarMs(validas.reduce((a, b) => a + b, 0) / validas.length) : "--";
        $("stat-max").textContent = validas.length ? formatarMs(Math.max(...validas)) : "--";
        $("stat-perda").textContent = ((falhas / historico.length) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

        // Gráfico: atualiza no lugar para não piscar a cada atualização automática
        if (graficoLatencia) {

            graficoLatencia.data.labels = rotulos;
            graficoLatencia.data.datasets[0].data = latencias;
            graficoLatencia.data.datasets[1].data = quedas;
            graficoLatencia.update();

        } else {

            graficoLatencia = new Chart($("grafico-latencia"), {
                type: "line",
                data: {
                    labels: rotulos,
                    datasets: [
                        {
                            label: "Latência (ms)",
                            data: latencias,
                            borderColor: "#22c5d9",
                            backgroundColor: "rgba(34, 197, 217, 0.12)",
                            borderWidth: 2,
                            pointRadius: 2,
                            pointBackgroundColor: "#22c5d9",
                            tension: 0.3,
                            fill: true,
                            spanGaps: false
                        },
                        {
                            label: "Sem resposta",
                            data: quedas,
                            showLine: false,
                            borderColor: "#ff647c",
                            backgroundColor: "#ff647c",
                            pointStyle: "crossRot",
                            pointRadius: 6,
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: opcoesGrafico("Latência (ms)")
            });

        }

        mensagemGrafico.textContent =
            `${historico.length} medições de ${nomes[id] || "Dispositivo " + id}. Os X vermelhos marcam momentos sem resposta.`;

    } catch (erro) {

        console.error("Erro ao carregar histórico:", erro);
        limparHistorico("Não foi possível carregar o histórico: " + erro.message);

    }

}

seletor.addEventListener("change", () => carregarHistorico());

seletorLimite.addEventListener("change", () => {
    config.limite = Number(seletorLimite.value);
    salvarStorage("nm_limite", config.limite);
    carregarHistorico();
});


/* ==============================
   NAVEGAÇÃO ENTRE ABAS (usa o # da URL)
============================== */

function irPara(chave) {

    const link = [...linksMenu].find(l => l.dataset.pagina === chave) || linksMenu[0];

    paginaAtual = link.dataset.pagina;

    paginas.forEach(p => p.classList.toggle("ativa", p.id === "pagina-" + paginaAtual));
    linksMenu.forEach(l => l.classList.toggle("active", l === link));

    $("titulo-pagina").textContent = link.dataset.titulo;
    $("subtitulo-pagina").textContent = link.dataset.subtitulo;

    if (paginaAtual === "historico" && seletor.value) {
        carregarHistorico();
    }

    // O canvas escondido tem tamanho 0: recalcula ao exibir
    graficoVisao?.resize();
    graficoLatencia?.resize();

}

window.addEventListener("hashchange", () => irPara(location.hash.slice(1)));


/* ==============================
   FILTROS E BOTÃO ATUALIZAR
============================== */

busca.addEventListener("input", renderizarTabela);
filtroStatus.addEventListener("change", renderizarTabela);
botaoAtualizar.addEventListener("click", atualizar);


/* ==============================
   ATUALIZAÇÃO AUTOMÁTICA
============================== */

async function ciclo() {

    if (document.hidden) return;   // pausa com a aba em segundo plano

    await atualizar();

    if (paginaAtual === "historico" && seletor.value) {
        carregarHistorico(true);
    }

}

function iniciarTimer() {
    clearInterval(timer);
    timer = setInterval(ciclo, config.intervalo * 1000);
}


/* ==============================
   INICIALIZAÇÃO
============================== */

seletorLimite.value = String(config.limite);
irPara(location.hash.slice(1));
iniciarTimer();
atualizar();
