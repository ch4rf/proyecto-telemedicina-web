import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Usb, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export default function LectorRfid({ onRolDetectado }) {
  const [estado, setEstado] = useState('esperando');
  const [mensaje, setMensaje] = useState('Acerque su tarjeta al lector para ingresar');
  const [rolDetectado, setRolDetectado] = useState('');
  const [usbConectado, setUsbConectado] = useState(false);
  const [wifiActivo, setWifiActivo] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const clienteId = obtenerClienteId();

  useEffect(() => {
    const cancelar = suscribirEstadoSerialRfid(setUsbConectado);
    return cancelar;
  }, []);

  useEffect(() => {
    let entrando = false;

    const revisar = async () => {
      if (entrando) return;
      try {
        const url = '/rfid/estado?clienteId=' + encodeURIComponent(clienteId);
        const res = await api.get(url);

        if (res.estado === 'ok') {
          entrando = true;
          const rolUsuario = res.rol || res.usuario?.rol || '';
          const nombre = `${res.usuario?.nombres || ''} ${res.usuario?.apellidos || ''}`.trim();
          if (rolUsuario && onRolDetectado) {
            onRolDetectado(rolUsuario);
          }
          setRolDetectado(rolUsuario);
          setEstado('ok');
          setMensaje(`Bienvenido, ${nombre || res.usuario?.correo}`);

          setTimeout(() => {
            login(res.token, res.usuario, false);
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else if (res.estado === 'invalida') {
          setRolDetectado('');
          setEstado('invalida');
          setMensaje(`Tarjeta no registrada: ${res.uid}`);
          setTimeout(() => {
            setEstado('esperando');
            setMensaje('Acerque su tarjeta al lector para ingresar');
          }, 3000);
        }
      } catch {
        // En caso de corte momentaneo de red se continua la espera
      }
    };

    const intervalo = setInterval(revisar, 1000);
    return () => clearInterval(intervalo);
  }, [clienteId, login, navigate, onRolDetectado]);

  const handleToggleUsb = async () => {
    try {
      if (usbConectado) {
        await desconectarSerialRfid();
      } else {
        await conectarSerialRfid();
      }
    } catch {
      // El usuario cancelo la seleccion de puerto
    }
  };

  const handleToggleWifi = async () => {
    try {
      if (wifiActivo) {
        await api.post('/rfid/cancelar-wifi', { clienteId });
        setWifiActivo(false);
        setMensaje('Acerque su tarjeta al lector para ingresar');
      } else {
        await api.post('/rfid/esperar-wifi', { clienteId });
        setWifiActivo(true);
        setMensaje('Esperando lectura remota por red WiFi');
      }
    } catch {
      // Error de red al solicitar espera remota
    }
  };

  const colores = {
    esperando: 'bg-slate-50 border-slate-200 text-slate-600',
    ok: 'bg-teal-50 border-teal-200 text-teal-700',
    invalida: 'bg-rose-50 border-rose-200 text-rose-700'
  };

  return (
    <div className={`mb-6 p-4 border rounded-xl flex items-center justify-between gap-3 text-sm transition-colors ${colores[estado]}`}>
      <div className="flex items-center gap-3 min-w-0">
        {estado === 'ok' && <CheckCircle2 className="w-6 h-6 shrink-0 text-teal-600" />}
        {estado === 'invalida' && <XCircle className="w-6 h-6 shrink-0 text-rose-500" />}
        {estado === 'esperando' && <CreditCard className="w-6 h-6 shrink-0 text-teal-600 animate-pulse" />}
        <div className="min-w-0">
          <p className="font-semibold truncate">{estado === 'esperando' ? 'Ingreso con tarjeta' : mensaje}</p>
          {estado === 'esperando' && (
            <p className="text-xs text-slate-500 truncate">
              {usbConectado
                ? 'Lector conectado por cable USB'
                : wifiActivo
                ? 'Recepción activa por red WiFi'
                : mensaje}
            </p>
          )}
        </div>
      </div>

      {estado === 'ok' && rolDetectado ? (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
          {rolDetectado === 'MEDICO' ? 'MÉDICO' : rolDetectado === 'PACIENTE' ? 'PACIENTE' : rolDetectado}
        </span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleWifi}
            title={wifiActivo ? 'Desactivar escucha remota por WiFi' : 'Activar inicio de sesion remoto mediante red WiFi'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              wifiActivo
                ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-teal-600" />
            <span>{wifiActivo ? 'WiFi Activo' : 'Conectar WiFi'}</span>
          </button>

          {esWebSerialSoportado() && (
            <button
              type="button"
              onClick={handleToggleUsb}
              title={usbConectado ? 'Desconectar cable USB' : 'Conectar directamente por cable USB'}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                usbConectado
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Usb className="w-3.5 h-3.5 text-teal-600" />
              <span>{usbConectado ? 'USB Activo' : 'Conectar USB'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
