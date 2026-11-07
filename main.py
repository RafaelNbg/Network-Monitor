from dispositivo import Dispositivo
import time

Google = Dispositivo('Google', '8.8.8.8')
Cloudflare = Dispositivo('Cloudflare', '1.1.1.1')

dispositivos = [Google, Cloudflare]

while True:
    for disp in dispositivos:
        disp.ping()
        disp.describe()
    
    time.sleep(2)