# Network Monitor

Aplicação em Python para descobrir e monitorar dispositivos de uma rede local, com histórico de medições em MySQL e um dashboard web para acompanhar tudo em tempo real.

O projeto registra a disponibilidade dos dispositivos, a latência e a perda de pacotes ao longo do tempo.

## Funcionalidades

**Coleta (Python)**

- Descoberta de dispositivos na rede local por ARP.
- Seleção manual da interface de rede usada na descoberta.
- Identificação dos dispositivos por endereço IP e MAC.
- Monitoramento periódico por ping (ICMP), com medição de latência.
- Cálculo da porcentagem de perda de pacotes.
- Armazenamento dos dispositivos e do histórico de medições no MySQL.
- Reconhecimento de dispositivos já cadastrados (pelo MAC), evitando duplicatas.

**API (FastAPI)**

- Expõe os dados do banco em formato JSON para o dashboard.

**Dashboard (HTML, CSS e JavaScript)**

- Visão geral com total de dispositivos, online, offline, latência média e gráfico da latência atual de cada dispositivo.
- Tabela de dispositivos com busca por nome, IP ou MAC e filtro por status.
- Possibilidade de renomear dispositivos (o nome fica salvo no navegador).
- Histórico de latência por dispositivo, com mínima, média, máxima e perda de pacotes.
- Atualização automática a cada 5 segundos.
- Avisos quando a API está fora do ar ou quando as medições estão desatualizadas (coleta parada).

## Tecnologias utilizadas

- Python
- Scapy: descoberta de dispositivos por ARP.
- Subprocess: execução do comando ping.
- MySQL e MySQL Connector/Python: armazenamento e acesso aos dados.
- Python-dotenv: variáveis de ambiente.
- FastAPI e Uvicorn: API.
- Chart.js: gráficos do dashboard.
- Npcap: captura e envio de pacotes no Windows.

## Estrutura do projeto

```text
Network-Monitor/
│
├── main.py            # coleta: descoberta + monitoramento
├── dispositivo.py     # classe Dispositivo (ping, latência, perda de pacotes)
├── descoberta.py      # descoberta de dispositivos por ARP
├── database.py        # conexão e consultas ao MySQL
├── api.py             # API FastAPI
├── iniciar_api.bat    # inicia a API no Windows
├── index.html         # dashboard
├── script.js          # lógica do dashboard
├── style.css          # estilo do dashboard
├── requirements.txt
├── .env               # credenciais do banco (não vai para o GitHub)
├── .gitignore
└── README.md
```

## Pré-requisitos

- Python 3
- MySQL Server
- Npcap
- Bibliotecas listadas em `requirements.txt`
- Windows (o ping usa `-n` e a leitura da latência espera a saída em português: `tempo=XXms`)

## Instalação

1. Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

2. Entre na pasta do projeto:

```bash
cd Network-Monitor
```

3. Instale as dependências:

```bash
python -m pip install -r requirements.txt
```

## Configuração do banco de dados

Com o MySQL Server em execução, crie o banco de dados:

```sql
CREATE DATABASE network_monitor;
USE network_monitor;
```

Tabela de dispositivos:

```sql
CREATE TABLE dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45),
    mac VARCHAR(17)
);
```

Tabela de medições:

```sql
CREATE TABLE medicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT,
    status VARCHAR(10),
    latencia DECIMAL(8,2),
    hora DATETIME,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com os dados de acesso ao MySQL:

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=seu_banco
```

**Importante:** o `.env` contém informações sensíveis e não deve ser enviado ao GitHub. Confirme que ele está no `.gitignore`.

## Execução

São três partes, cada uma em sua janela. O MySQL precisa estar ligado.

**1. Coleta dos dados**

```bash
python main.py
```

O programa lista as interfaces de rede para você escolher, descobre os dispositivos e passa a medi-los a cada 2 segundos, gravando tudo no banco. Pode exigir execução como administrador no Windows.

**2. API**

Dê dois cliques em `iniciar_api.bat` ou rode:

```bash
python -m uvicorn api:app
```

A API fica em `http://127.0.0.1:8000`. Se abrir esse endereço no navegador e aparecer "Minha api está no ar!", ela está funcionando.

**3. Dashboard**

Abra o `index.html` no navegador, com a API já rodando. Os arquivos `index.html`, `script.js` e `style.css` precisam estar na mesma pasta.

## Rotas da API

| Rota | Retorno |
|---|---|
| `GET /` | Mensagem de teste |
| `GET /dispositivos` | Lista de dispositivos (`id`, `ip`, `mac`) |
| `GET /medicoes` | Todas as medições |
| `GET /atual/{id}` | Última medição do dispositivo (`status`, `latencia`, `hora`) |
| `GET /historico/{id}` | Todas as medições do dispositivo |

Se o banco não conectar, as rotas retornam `{"mensagem": "Não foi possível conectar ao banco de dados!"}` e o dashboard mostra o aviso.

## Organização do código

- `main.py`: coordena a coleta e o monitoramento.
- `dispositivo.py`: classe `Dispositivo`, com ping, latência e perda de pacotes.
- `descoberta.py`: descoberta de dispositivos na rede local com Scapy e ARP.
- `database.py`: conexão com o MySQL, gravação e consultas.
- `api.py`: rotas que entregam os dados ao dashboard.
- `index.html`, `script.js`, `style.css`: interface do dashboard.

## Observações

- A descoberta ARP vale só para a rede local e não encontra dispositivos em outras redes separadas por roteador.
- A sub-rede está fixa em `192.168.1.0/24` no `descoberta.py`. Se sua rede for diferente, altere ali.
- Para mudar o endereço da API ou o intervalo de atualização do dashboard, edite o objeto `PADRAO` no começo do `script.js`.
- O dashboard só mostra dados novos enquanto o `main.py` estiver rodando. Se ele parar, aparece um aviso de medições desatualizadas.
- O histórico guarda uma medição por dispositivo a cada 2 segundos, então a tabela `medicoes` cresce rápido.

## Autor

Desenvolvido como projeto pessoal de aprendizado e portfólio, envolvendo programação Python, redes de computadores, bancos de dados relacionais e desenvolvimento web.
