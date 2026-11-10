from descoberta import *
from database import *
import time

conexao = conectar_ao_banco_de_dados()

if conexao != None:
    try:
        lista_dispositivos = encontrar_dispositivos()
        quant_dispositivos = len(lista_dispositivos)

        print('\nQuantidade de dispositivos encontrados:', quant_dispositivos, '\n')

        if quant_dispositivos != 0:

            while True:
                for disp in lista_dispositivos:
                    disp.ping()
                    disp.describe()
                    adicionar_ao_banco(disp, conexao)
                
                time.sleep(2)
        else:
            print('Nenhum dispositivo encontrado na rede!')

    finally:
        conexao.close()
        print('Conexão com o banco de dados encerrada!')