from descoberta import *
import time

lista_dispositivos = encontrar_dispositivos()
quant_dispositivos = len(lista_dispositivos)

print('Quantidade de dispositivos encontrados:', quant_dispositivos, '\n')

if quant_dispositivos != 0:

    while True:
        for disp in lista_dispositivos:
            disp.ping()
            disp.describe()
        
        time.sleep(2)
else:
    print('Nenhum dispositivo encontrado na rede!')