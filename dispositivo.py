import subprocess
import re

class Dispositivo():

    def __init__(self, nome, ip):
        self.nome = nome
        self.ip = ip
        self.status = None
        self.latencia = None

    def ping(self):
##### Pingar o ip correspondido e retornar se o dispositivo está conectado e a latência #####

        resultado = subprocess.run(['ping', '-n', '1', self.ip], capture_output=True, text=True)
    
        if resultado.returncode == 0:
            lt = re.search(r'tempo=(\d+)ms', resultado.stdout)
            self.latencia = int(lt.group(1))
            self.status = 'Online'
        
        else:
            self.status = 'Offline'
            self.latencia = None

    def describe(self):
        print('Nome: ' + self.nome)
        print('IP: ' + self.ip)
        print('Status: ' + self.status)
        print('Latência: ' + str(self.latencia))
        print()