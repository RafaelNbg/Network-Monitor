# Network Monitor

Aplicação desenvolvida em Python para descoberta e monitoramento de dispositivos conectados a uma rede local, com armazenamento histórico das medições em um banco de dados MySQL.

O projeto tem como objetivo monitorar a disponibilidade dos dispositivos, registrar informações de latência e acompanhar a perda de pacotes ao longo do tempo.

## Funcionalidades

- Descoberta de dispositivos na rede local utilizando o protocolo ARP.
- Seleção manual da interface de rede utilizada na descoberta.
- Identificação dos dispositivos por endereço IP e endereço MAC.
- Monitoramento periódico da disponibilidade dos dispositivos por meio de requisições ICMP (Ping).
- Medição e registro da latência.
- Cálculo percentual de perda de pacotes.
- Armazenamento das informações dos dispositivos e do histórico de medições em um banco de dados MySQL.
- Identificação de dispositivos já cadastrados para evitar registros duplicados.

## Tecnologias utilizadas

- Python
- Scapy – descoberta de dispositivos por meio de requisições ARP.
- Subprocess – execução de comandos Ping.
- MySQL – armazenamento dos dispositivos e das medições.
- MySQL Connector/Python – comunicação entre Python e MySQL.
- Python-dotenv – gerenciamento de variáveis de ambiente.
- Npcap – suporte à captura e transmissão de pacotes de rede no Windows.

## Estrutura do projeto

```text
Network-Monitor/
│
├── main.py
├── dispositivo.py
├── descoberta.py
├── database.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- Python 3.
- MySQL Server.
- Npcap.
- Bibliotecas Python listadas em `requirements.txt`.

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

Com o MySQL Server instalado e em execução, crie o banco de dados:

```sql
CREATE DATABASE network_monitor;
USE network_monitor;
```

Crie a tabela responsável pelo cadastro dos dispositivos:

```sql
CREATE TABLE dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45),
    mac VARCHAR(17)
);
```

Em seguida, crie a tabela responsável pelo armazenamento das medições:

```sql
CREATE TABLE medicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT,
    status VARCHAR(10),
    latencia DECIMAL(5,2),
    hora DATETIME,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

**Importante:** o arquivo `.env` contém informações sensíveis e não deve ser enviado ao GitHub. Ele já deve estar listado no `.gitignore`.

## Execução

Após configurar o banco de dados e as variáveis de ambiente, execute:

```bash
python main.py
```

O programa apresentará as interfaces de rede disponíveis para seleção. Após a escolha, será realizada a descoberta dos dispositivos da rede e iniciado o monitoramento periódico.

As informações coletadas serão exibidas no terminal e armazenadas no banco de dados MySQL.

## Organização do código

O projeto foi dividido em módulos para separar as responsabilidades:

- `main.py`: coordena a execução da aplicação e o fluxo principal de monitoramento.
- `dispositivo.py`: contém a classe `Dispositivo`, responsável pelas informações e operações de monitoramento de cada dispositivo.
- `descoberta.py`: realiza a descoberta de dispositivos na rede local utilizando Scapy e ARP.
- `database.py`: gerencia a conexão com o MySQL e o armazenamento dos dados.

## Observações

- A descoberta ARP é limitada à rede local e não identifica diretamente dispositivos em outras redes separadas por roteadores.
- A descoberta atual utiliza a sub-rede `192.168.1.0/24`.
- A execução de operações de descoberta e monitoramento de rede pode exigir privilégios de administrador no Windows.

## Autor

Desenvolvido como projeto pessoal de aprendizado e portfólio, envolvendo programação Python, redes de computadores e bancos de dados relacionais.