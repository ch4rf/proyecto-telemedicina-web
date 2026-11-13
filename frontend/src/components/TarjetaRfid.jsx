import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Trash2, LogIn, AlertCircle, Calendar, Usb, Wifi } from 'lucide-react';
import { api } from '../services/api';
import {
  esWebSerialSoportado,
  conectarSerialRfid,
  desconectarSerialRfid,
  suscribirEstadoSerialRfid
} from '../utils/lectorSerialRfid';

const obtenerClienteId = () => {
  let id = localStorage.getItem('rfid_cliente_id');
  if (!id) {
    id = 'cli_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('rfid_cliente_id', id);
  }
  return id;
};

export default function TarjetaRfid() {
  const [tarjeta, setTarjeta] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(20);
  const [confirmarPerdida, setConfirmarPerdida] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [accesos, setAccesos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [usbConectado, setUsbConectado] = useState(false);
  const [wifiActivo, setWifiActivo] = useState(false);
  const clienteId = obtenerClienteId();

  useEffect(() => {
    const cancelar = suscribirEstadoSerialRfid(setUsbConectado);
    return cancelar;
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await api.get('/rfid/mi-tarjeta');
      setTarjeta(res.tarjeta);
      setRegistrando(res.registrando);
      return res;
    } catch {
      return null;
    }
  };

  const cargarAccesos = async () => {
    try {
      const res = await api.get('/rfid/accesos');
      setAccesos(res.data || []);
    } catch {
      // Se omite en caso de desconexion temporal
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarAccesos();
    const intervalo = setInterval(cargarAccesos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!registrando) return;
    const intervalo = setInterval(async () => {
      setSegundosRestantes((prev) => (prev > 1 ? prev - 1 : 0));
      const res = await cargarDatos();
      if (res && !res.registrando) {
        if (res.tarjeta) {
          setMensaje(`Tarjeta registrada exitosamente: ${res.tarjeta.uid_tarjeta}`);
        } else {
          setError('No se detectó ninguna tarjeta en los 20 segundos, intente de nuevo.');
        }
        cargarAccesos();
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [registrando]);

  const registrarTarjeta = async () => {
    setMensaje('');
    setError('');
    setConfirmarPerdida(false);
    try {
      // Si la conexion es por WiFi se avisa al backend
      try {
        await api.post('/rfid/esperar-wifi', { clienteId });
        setWifiActivo(true);
      } catch {
        // Modo local activo
      }
      const res = await api.post('/rfid/registrar', {});
      setMensaje(res.mensaje);
      setSegundosRestantes(20);
      setRegistrando(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const reportarPerdida = async () => {
    setMensaje('');
    setError('');
    try {
      setDesactivando(true);
      const res = await api.delete('/rfid/mi-tarjeta');
      setMensaje(res.mensaje);
      setConfirmarPerdida(false);
      cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setDesactivando(false);
    }
  };

  const handleToggleUsb = async () => {
    setError('');
    try {
      if (usbConectado) {
        await desconectarSerialRfid();
      } else {
        await conectarSerialRfid();
      }
    } catch {
      // Seleccion cancelada
    }
  };

  const handleToggleWifi = async () => {
    try {
      if (wifiActivo) {
        await api.post('/rfid/cancelar-wifi', { clienteId });
        setWifiActivo(false);
      } else {
        await api.post('/rfid/esperar-wifi', { clienteId });
        setWifiActivo(true);
      }
    } catch {
      // Error de enlace
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Mi tarjeta de acceso</h3>
              <p className="text-xs text-slate-500">
                {usbConectado
                  ? 'Modo hibrido activo con lector por cable USB y red WiFi'
                  : 'Ingreso rapido con el lector RFID por red WiFi o cable USB'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleWifi}
              title={wifiActivo ? 'Desactivar escucha remota por WiFi' : 'Habilitar recepcion remota por red WiFi'}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                wifiActivo
                  ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-teal-600" />
              <span>{wifiActivo ? 'WiFi Activo' : 'Conectar WiFi'}</span>
            </button>

            {esWebSerialSoportado() && (
              <button
                type="button"
                onClick={handleToggleUsb}
                title={usbConectado ? 'Desconectar cable USB' : 'Conectar lector directamente por cable USB'}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  usbConectado
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Usb className="w-3.5 h-3.5 text-teal-600" />
                <span>{usbConectado ? 'USB Activo' : 'Conectar USB'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 space-y-1">
          <p className="text-sm text-slate-600">
            Tarjeta:{' '}
            <span className="font-mono font-bold text-slate-900">
              {tarjeta ? tarjeta.uid_tarjeta : 'Sin tarjeta registrada'}
            </span>
          </p>
          {tarjeta?.fecha_registro && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Vinculada el {new Date(tarjeta.fecha_registro).toLocaleString('es-GT')}
              </span>
            </p>
          )}
        </div>

        {mensaje && <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700 font-medium">{mensaje}</div>}
        {error && <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-medium">{error}</div>}

        {confirmarPerdida && tarjeta && (
          <div className="mb-4 p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5 animate-fadeIn">
            <div className="flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">¿Seguro que deseas reportar la pérdida de esta tarjeta?</p>
                <p className="text-rose-600 mt-0.5">
                  La tarjeta <span className="font-mono font-semibold">{tarjeta.uid_tarjeta}</span> quedará desactivada de inmediato y ya no servirá para ingresar.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={desactivando}
                onClick={() => setConfirmarPerdida(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={desactivando}
                onClick={reportarPerdida}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {desactivando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Sí, desactivar tarjeta</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={registrarTarjeta}
            disabled={registrando}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 cursor-pointer transition-colors"
          >
            {registrando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Esperando tarjeta: {segundosRestantes} segundos</span>
              </>
            ) : (
              <span>{tarjeta ? 'Cambiar tarjeta' : 'Registrar tarjeta'}</span>
            )}
          </button>
          {tarjeta && !confirmarPerdida && (
            <button
              type="button"
              onClick={() => {
                setMensaje('');
                setError('');
                setConfirmarPerdida(true);
              }}
              className="flex-1 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reportar pérdida</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Últimos accesos con tarjeta</h3>
            <p className="text-xs text-slate-500">Se actualiza solo cada 5 segundos</p>
          </div>
        </div>

        {accesos.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay accesos registrados.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-64 overflow-auto">
            {accesos.map((a) => (
              <li key={a.id_acceso} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    {a.nombres ? `${a.nombres} ${a.apellidos}` : `Tarjeta no vinculada: ${a.uid_tarjeta}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.fecha).toLocaleString('es-GT')}{a.rol ? ` · ${a.rol === 'MEDICO' ? 'Médico' : a.rol === 'PACIENTE' ? 'Paciente' : a.rol}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  a.resultado === 'PERMITIDO'
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : a.resultado === 'DENEGADO'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {a.resultado}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
