import mysql.connector
from dotenv import load_dotenv
import os

def conectar_ao_banco_de_dados():
    try:
        load_dotenv()
        conexao = mysql.connector.connect(
            host = os.getenv('DB_HOST'),
            user = os.getenv('DB_USER'),
            password = os.getenv('DB_PASSWORD'),
            database = os.getenv('DB_DATABASE')
        )

        if conexao.is_connected():
            print('Conectado ao banco de dados com sucesso!')

        return conexao

    except mysql.connector.Error as erro:
        print('Falha na conexão:', erro)
        
        return None

def adicionar_ao_banco(dispositivo, conexao):
    #Verifica se o endereço mac já havia sido registrado anteriormente ou se é um novo dispositivo
    comando = "SELECT id FROM dispositivos WHERE mac = %s" 
    cursor = conexao.cursor()
    cursor.execute(comando, (dispositivo.mac,))
    resposta = cursor.fetchone()

    #Se não tiver sido adicionado, cria-se um novo
    if resposta == None:
        comando1 = "INSERT INTO dispositivos (ip, mac) VALUES (%s, %s)"
        comando2 = "INSERT INTO medicoes (dispositivo_id, status, latencia, hora) VALUES (%s, %s, %s, %s)"

        cursor.execute(comando1, (dispositivo.ip, dispositivo.mac))
        cursor.execute(comando2, (cursor.lastrowid, dispositivo.status, dispositivo.latencia, dispositivo.hora))

    #Se já tiver sido criado anteriormente, apenas atualiza as medições dele e não a tabela dispositivos
    else:
        comando2 = "INSERT INTO medicoes (dispositivo_id, status, latencia, hora) VALUES (%s, %s, %s, %s)"
        cursor.execute(comando2, (resposta[0], dispositivo.status, dispositivo.latencia, dispositivo.hora))

    conexao.commit()
    cursor.close()

def consultar_banco(tabela, conexao):
    tabelas_permitidas = ["dispositivos", "medicoes"]

    if tabela in tabelas_permitidas:
        comando = f"SELECT * FROM {tabela}"
        cursor = conexao.cursor(dictionary=True)
        cursor.execute(comando)
        resposta = cursor.fetchall()
        cursor.close()
        
        return resposta

def consultar_historico_dispositivo(id, conexao):
    comando = "SELECT status, latencia, hora FROM medicoes WHERE dispositivo_id = %s;"
    cursor = conexao.cursor(dictionary=True)
    cursor.execute(comando, (id,))  
    resposta = cursor.fetchall()
    cursor.close()

    return resposta

def consultar_ultima_medicao(id, conexao):
    comando = "SELECT status, latencia, hora FROM medicoes WHERE dispositivo_id = %s ORDER BY hora DESC LIMIT 1"
    cursor = conexao.cursor(dictionary=True)
    cursor.execute(comando, (id,))  
    resposta = cursor.fetchone()
    cursor.close()
    
    return resposta

def consultar_medicao_por_datahora(id, horainicio, horafim, conexao):
    comando = "SELECT status, latencia, hora FROM medicoes WHERE dispositivo_id = %s AND hora >= %s AND hora <= %s"
    cursor = conexao.cursor(dictionary=True)
    cursor.execute(comando, (id, horainicio, horafim))  
    resposta = cursor.fetchall()
    cursor.close()
    
    return resposta