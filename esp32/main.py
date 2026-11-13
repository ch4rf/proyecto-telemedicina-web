# Proyecto: Login con RFID para el sistema de Telemedicina (NovaSalud)
# Arquitectura de Computadoras 2
# ESP32 + RC522 en MicroPython (Modo Hibrido: Wi-Fi hacia Azure + Cable USB Directo)
# Lee el numero (UID) de la tarjeta, lo envia por USB (Serial) y por Wi-Fi al servidor en la nube

import network
import time
from machine import Pin
from mfrc522 import MFRC522
import config

try:
    import urequests as requests
except ImportError:
    import requests

# led azul del ESP32
led = Pin(2, Pin.OUT)

# pines igual que en el dibujo de conexiones
lector = MFRC522(sck=18, mosi=23, miso=19, rst=22, cs=5)
wifi = network.WLAN(network.STA_IF)
wifi_disponible = False
ultimo_intento_wifi = 0


def obtener_redes_configuradas():
    redes = []
    if hasattr(config, "REDES_WIFI") and isinstance(config.REDES_WIFI, list):
        for item in config.REDES_WIFI:
            if isinstance(item, (tuple, list)) and len(item) == 2:
                ssid, clave = item
                if ssid and ssid != "TU_WIFI":
                    redes.append((ssid, clave))
    ssid_principal = getattr(config, "WIFI_NOMBRE", "")
    clave_principal = getattr(config, "WIFI_CLAVE", "")
    if ssid_principal and ssid_principal != "TU_WIFI":
        if (ssid_principal, clave_principal) not in redes:
            redes.insert(0, (ssid_principal, clave_principal))
    return redes


def conectar_wifi():
    global wifi_disponible, ultimo_intento_wifi
    ultimo_intento_wifi = time.time()

    redes = obtener_redes_configuradas()
    if not redes:
        print("Modo Cable USB Directo activo (sin Wi-Fi configurado)")
        wifi_disponible = False
        return False

    wifi.active(True)
    if wifi.isconnected():
        wifi_disponible = True
        return True

    # Escanear redes cercanas para priorizar las que esten encendidas
    redes_visibles = set()
    try:
        escaneo = wifi.scan()
        for r in escaneo:
            try:
                redes_visibles.add(r[0].decode("utf-8"))
            except Exception:
                pass
    except Exception:
        pass

    # Filtrar primero las redes que aparecen en el escaneo; si no aparece ninguna, probar todas
    candidatas = [ item for item in redes if item[0] in redes_visibles ]
    if not candidatas:
        candidatas = redes

    for ssid, clave in candidatas:
        print("Conectando a WiFi:", ssid, end="")
        try:
            wifi.disconnect()
        except Exception:
            pass
        try:
            wifi.connect(ssid, clave)
        except Exception:
            continue

        intentos = 0
        while not wifi.isconnected() and intentos < 16:
            print(".", end="")
            time.sleep(0.5)
            intentos += 1

        if wifi.isconnected():
            print("\nConectado a " + ssid + "! IP del ESP32:", wifi.ifconfig()[0])
            print("Servidor destino:", config.SERVIDOR)
            wifi_disponible = True
            return True
        else:
            print("\nNo se pudo conectar a", ssid)

    print("WiFi no disponible por ahora. Funcionando en Modo Cable USB Directo.")
    wifi_disponible = False
    return False


def leer_tarjeta():
    # devuelve el UID en texto (ej. "D67908F0") o None si no hay tarjeta
    stat, tipo = lector.request(lector.REQIDL)
    if stat != lector.OK:
        return None
    stat, uid = lector.anticoll()
    if stat != lector.OK:
        return None
    texto = ""
    for b in uid[0:4]:
        texto += "{:02X}".format(b)
    return texto


def parpadear(veces):
    for i in range(veces):
        led.on()
        time.sleep(0.15)
        led.off()
        time.sleep(0.15)


def enviar_uid(uid):
    try:
        r = requests.post(
            config.SERVIDOR,
            json={"uid": uid},
            headers={"x-clave-esp32": config.CLAVE_ESP32}
        )
        datos = r.json()
        r.close()

        # mostrar quien entra
        print("-------------------------------")
        if datos.get("ok"):
            print(">> ACCESO PERMITIDO (Wi-Fi -> Azure)")
            print(">> " + datos.get("mensaje", ""))
            if datos.get("rol"):
                print(">> Rol: " + datos.get("rol"))
            led.on()
            time.sleep(1)
            led.off()
        else:
            print(">> ACCESO DENEGADO (Wi-Fi -> Azure)")
            print(">> " + datos.get("mensaje", ""))
            parpadear(3)
        print("-------------------------------")
    except Exception as e:
        print("Aviso WiFi (usando respaldo USB):", e)


# ------------------ programa principal ------------------
print("Version del RC522:", hex(lector.version()))
if lector.version() in (0x00, 0xFF):
    print("OJO: el RC522 no responde, revisa los cables")

conectar_wifi()
print("Acerque una tarjeta...")

while True:
    uid = leer_tarjeta()
    if uid:
        # 1. Siempre imprime el UID por el cable USB (para Web Serial API en cualquier PC/Azure)
        print("UID leido:", uid)
        led.on()
        time.sleep(0.2)
        led.off()

        # 2. Si el WiFi no estaba conectado al inicio, reintenta conectar antes de enviar
        if not wifi.isconnected() and (time.time() - ultimo_intento_wifi) > 15:
            conectar_wifi()

        # 3. Si el WiFi esta conectado, tambien lo envia por red al servidor en Azure
        if wifi.isconnected():
            enviar_uid(uid)

        time.sleep(1.3)  # para no leer la misma tarjeta varias veces

    time.sleep(0.1)
