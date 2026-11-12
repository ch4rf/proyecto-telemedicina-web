// Gestor compartido de conexion por Cable USB (Web Serial API) para el lector RFID ESP32
// Permite usar el lector fisico en cualquier computadora o en el despliegue en la nube (Azure)
// sin necesidad de configurar Wi-Fi ni IPs locales.
import { api } from '../services/api';

let puertoActual = null;
let lectorStream = null;
let conectado = false;
const suscriptores = new Set();

const notificarCambio = () => {
  suscriptores.forEach((cb) => {
    try {
      cb(conectado);
    } catch {
      // ignorar errores de callback
    }
  });
};

export const esWebSerialSoportado = () =>
  typeof navigator !== 'undefined' && 'serial' in navigator;

export const obtenerEstadoSerialRfid = () => conectado;

export const suscribirEstadoSerialRfid = (callback) => {
  suscriptores.add(callback);
  callback(conectado);
  return () => suscriptores.delete(callback);
};

const procesarLineaSerial = async (linea) => {
  const match = linea.match(/UID\s+leido:\s*([0-9A-Fa-f]{8,20})/i);
  if (!match) return;

  const uid = match[1].toUpperCase().trim();
  try {
    await api.post('/rfid/lectura-usb', { uid });
  } catch (err) {
    console.warn('[RFID USB] Error enviando UID al servidor:', err.message);
  }
};

export const conectarSerialRfid = async () => {
  if (!esWebSerialSoportado()) {
    throw new Error('Tu navegador no soporta Web Serial. Usa Google Chrome o Microsoft Edge.');
  }

  if (conectado && puertoActual) {
    return true;
  }

  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  // Evitar que el chip USB-Serial (CP2102 / CH340) mantenga en reset al ESP32
  if (typeof port.setSignals === 'function') {
    await port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
  }

  puertoActual = port;
  conectado = true;
  notificarCambio();

  // Escuchar desconexion fisica del cable USB
  const onDisconnect = (event) => {
    if (event.target === puertoActual) {
      desconectarSerialRfid();
    }
  };
  navigator.serial.addEventListener('disconnect', onDisconnect);

  // Bucle de lectura continua del puerto serie USB
  (async () => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (puertoActual && puertoActual.readable) {
        const reader = puertoActual.readable.getReader();
        lectorStream = reader;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lineas = buffer.split(/\r?\n/);
              buffer = lineas.pop() || '';
              for (const linea of lineas) {
                if (linea.trim()) {
                  procesarLineaSerial(linea.trim());
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch {
      // El puerto se cerro o se desconecto el cable
    } finally {
      navigator.serial.removeEventListener('disconnect', onDisconnect);
      puertoActual = null;
      lectorStream = null;
      conectado = false;
      notificarCambio();
    }
  })();

  return true;
};

export const desconectarSerialRfid = async () => {
  try {
    if (lectorStream) {
      await lectorStream.cancel().catch(() => {});
      lectorStream = null;
    }
    if (puertoActual) {
      await puertoActual.close().catch(() => {});
      puertoActual = null;
    }
  } finally {
    conectado = false;
    notificarCambio();
  }
};
