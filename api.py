from fastapi import FastAPI
from database import *
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def inicio():
    return "Minha api está no ar!"

@app.get("/dispositivos")
def mostrar_dispositivos():

    conexao = conectar_ao_banco_de_dados()

    if conexao is not None:
        resposta = consultar_banco("dispositivos", conexao)
        conexao.close()
        return resposta

    else:
        return {"mensagem": "Não foi possível conectar ao banco de dados!"}

@app.get("/medicoes")
def mostrar_medicoes():

    conexao = conectar_ao_banco_de_dados()

    if conexao is not None:
        resposta = consultar_banco("medicoes", conexao)
        conexao.close()
        return resposta

    else:
        return {"mensagem": "Não foi possível conectar ao banco de dados!"}

@app.get("/historico/{id}")
def historico_dispositivo(id):

    conexao = conectar_ao_banco_de_dados()

    if conexao is not None:
        resposta = consultar_historico_dispositivo(id, conexao)
        conexao.close()

        return resposta

    else:
        return {"mensagem": "Não foi possível conectar ao banco de dados!"}

@app.get("/atual/{id}")
def medicao_atual(id):

    conexao = conectar_ao_banco_de_dados()

    if conexao is not None:
        resposta = consultar_ultima_medicao(id, conexao)
        conexao.close()

        return resposta

    else:
        return {"mensagem": "Não foi possível conectar ao banco de dados!"}

@app.get("/hora/{id}")
def medicao_hora(id, horainicio, horafim):
     
     conexao = conectar_ao_banco_de_dados()

     if conexao is not None:
         resposta = consultar_medicao_por_datahora(id, horainicio, horafim, conexao)
         conexao.close()

         return resposta
     else:
         return {"mensagem": "Não foi possível conectar ao banco de dados!"}