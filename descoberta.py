from scapy.all import *
from dispositivo import Dispositivo
import psutil
import socket

def encontrar_dispositivos():
    #Seleciono minha interface de rede para se comunicar com os dispositivos
    print('Interfaces disponíveis:')
    for nome in conf.ifaces:
        interface = conf.ifaces[nome]
        print(f'[{interface.index}]', interface.name)
        print(interface.ip)
        print()
    selected = input('Digite o número da interface desejada: ')
    iface = conf.ifaces.dev_from_index(selected)
    
    #Construo o pacote
    pacote = Ether(dst='ff:ff:ff:ff:ff:ff') / ARP(pdst='192.168.1.0/24')

    #Envio o pacote com a função srp, a resposta é uma tupla com os respondidos e não respondidos
    respondidos, nao_respondidos = srp(
        pacote,
        iface = iface,
        timeout = 3,
        verbose = True #É bom colocar em false depois se não quiser poluir
    )

    #Crio uma lista com os dispositivos que responderam à solicitação
    dispositivos = []
    for enviado, respondido in respondidos:
        dispositivo = Dispositivo(str(respondido.hwsrc), str(respondido.psrc))
        dispositivos.append(dispositivo)

    return dispositivos