import subprocess
import re
from datetime import datetime

class Dispositivo():

    def __init__(self, mac, ip):
        self.mac = mac
        self.ip = ip
        self.status = None
        self.latencia = None
        self.hora = None
        self.total_pings = 0
        self.pings_sucesso = 0
        self.pings_falha = 0
        self.perda_pacotes = 0

    def ping(self):
##### Pingar o ip correspondido e retornar se o dispositivo está conectado e a latência #####

        resultado = subprocess.run(['ping', '-n', '1', self.ip], capture_output=True, text=True)
        self.hora = datetime.now()
        self.total_pings = self.total_pings + 1
    
        if resultado.returncode == 0:
            self.pings_sucesso = self.pings_sucesso + 1
            self.status = 'Online'

            lt = re.search(r'(?:tempo|time)\s*([=<])\s*(\d+)\s*ms', resultado.stdout)

            if lt != None:
                self.latencia = 0.5 if lt.group(1) == '<' else int(lt.group(2))
            else:
                self.latencia = None
        
        else:
            self.pings_falha = self.pings_falha + 1
            self.status = 'Offline'
            self.latencia = None

        self.calcula_perda_pacotes()

    def calcula_perda_pacotes(self):
        if self.total_pings != 0:
            self.perda_pacotes = (self.pings_falha/self.total_pings)*100
        else:
            self.perda_pacotes = 0

    def describe(self):
        print('MAC:', self.mac)
        print('IP:', self.ip)
        print('Status: ' + self.status)
        if self.latencia != None:
            print('Latência: ' + str(self.latencia))
        else:
            print('Latência desconhecida')
        print('Horário:', self.hora)
        print('Pings com sucesso:', self.pings_sucesso)
        print(f'Perda de pacotes: {self.perda_pacotes:.2f}%')
        print()