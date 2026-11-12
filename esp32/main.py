# Proyecto: Login con RFID para el sistema de Telemedicina (NovaSalud)
# Arquitectura de Computadoras 2
# ESP32 + RC522 en MicroPython (Modo Hibrido: Wi-Fi + Cable USB Directo)
# Lee el numero (UID) de la tarjeta, lo envia por USB (Serial) y si hay Wi-Fi tambien al backend

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
wifi_disponible = False


def conectar_wifi():
    global wifi_disponible
    if not getattr(config, "WIFI_NOMBRE", "") or config.WIFI_NOMBRE == "TU_WIFI":
        print("Modo Cable USB Directo activo (sin Wi-Fi configurado)")
        wifi_disponible = False
        return False

    wifi = network.WLAN(network.STA_IF)
    wifi.active(True)
    if not wifi.isconnected():
        print("Conectando a WiFi", end="")
        try:
            wifi.connect(config.WIFI_NOMBRE, config.WIFI_CLAVE)
        except Exception:
            wifi_disponible = False
            return False
        intentos = 0
        while not wifi.isconnected():
            print(".", end="")
            time.sleep(0.5)
            intentos += 1
            if intentos > 16:
                print("\nWiFi no encontrado. Funcionando en Modo Cable USB Directo.")
                wifi_disponible = False
                return False
    print("\nConectado! IP del ESP32:", wifi.ifconfig()[0])
    wifi_disponible = True
    return True


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
            print(">> ACCESO PERMITIDO")
            print(">> " + datos.get("mensaje", ""))
            if datos.get("rol"):
                print(">> Rol: " + datos.get("rol"))
            led.on()
            time.sleep(1)
            led.off()
        else:
            print(">> ACCESO DENEGADO")
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

        # 2. Si el WiFi esta conectado, tambien lo envia por red al servidor
        if wifi_disponible and network.WLAN(network.STA_IF).isconnected():
            enviar_uid(uid)

        time.sleep(1.3)  # para no leer la misma tarjeta varias veces

    time.sleep(0.1)
