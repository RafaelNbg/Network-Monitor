from scapy.all import *
from dispositivo import Dispositivo

def encontrar_dispositivos():
    #Seleciono minha interface de rede para se comunicar com os dispositivos
    interface = conf.ifaces.dev_from_index(6)
    #Construo o pacote
    pacote = Ether(dst='ff:ff:ff:ff:ff:ff') / ARP(pdst='192.168.1.0/24')

    #Envio o pacote com a função srp, a resposta é uma tupla com os respondidos e não respondidos
    respondidos, nao_respondidos = srp(
        pacote,
        iface = interface,
        timeout = 3,
        verbose = True #É bom colocar em false depois se não quiser poluir
    )

    dispositivos = []
    for enviado, respondido in respondidos:
        dispositivo = Dispositivo(str(respondido.hwsrc), str(respondido.psrc))
        dispositivos.append(dispositivo)

    return dispositivos