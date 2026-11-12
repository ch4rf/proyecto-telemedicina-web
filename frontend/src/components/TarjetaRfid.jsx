// Panel de la tarjeta RFID dentro del Dashboard
// - Ver mi tarjeta
// - Registrar tarjeta nueva / reportar tarjeta perdida
// - Ver quien ha entrado con tarjeta
import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Trash2, LogIn } from 'lucide-react';
import { api } from '../services/api';

export default function TarjetaRfid() {
  const [tarjeta, setTarjeta] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [accesos, setAccesos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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
      // no pasa nada si falla
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarAccesos();
    // refrescar la lista de accesos cada 5 segundos
    const intervalo = setInterval(cargarAccesos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // mientras esta registrando, revisamos cada segundo si ya paso la tarjeta
  useEffect(() => {
    if (!registrando) return;
    const intervalo = setInterval(async () => {
      const res = await cargarDatos();
      if (res && !res.registrando) {
        if (res.tarjeta) {
          setMensaje(`Tarjeta registrada: ${res.tarjeta.uid_tarjeta}`);
        } else {
          setError('No se detecto ninguna tarjeta, intente de nuevo.');
        }
        cargarAccesos();
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [registrando]);

  const registrarTarjeta = async () => {
    setMensaje('');
    setError('');
    try {
      const res = await api.post('/rfid/registrar', {});
      setMensaje(res.mensaje);
      setRegistrando(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const reportarPerdida = async () => {
    if (!window.confirm('¿Seguro? Su tarjeta actual ya no servira para ingresar.')) return;
    setMensaje('');
    setError('');
    try {
      const res = await api.delete('/rfid/mi-tarjeta');
      setMensaje(res.mensaje);
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Mi tarjeta */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Mi tarjeta de acceso</h3>
            <p className="text-xs text-slate-500">Ingreso rapido con el lector RFID</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Tarjeta:{' '}
          <span className="font-mono font-bold text-slate-900">
            {tarjeta ? tarjeta.uid_tarjeta : 'Sin tarjeta registrada'}
          </span>
        </p>

        {mensaje && <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700">{mensaje}</div>}
        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={registrarTarjeta}
            disabled={registrando}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 cursor-pointer"
          >
            {registrando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Esperando tarjeta...</span>
              </>
            ) : (
              <span>{tarjeta ? 'Cambiar tarjeta' : 'Registrar tarjeta'}</span>
            )}
          </button>
          {tarjeta && (
            <button
              type="button"
              onClick={reportarPerdida}
              className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reportar perdida</span>
            </button>
          )}
        </div>
      </div>

      {/* Quien ha entrado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Ultimos accesos con tarjeta</h3>
            <p className="text-xs text-slate-500">Se actualiza solo cada 5 segundos</p>
          </div>
        </div>

        {accesos.length === 0 ? (
          <p className="text-sm text-slate-500">Todavia no hay accesos registrados.</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-64 overflow-auto">
            {accesos.map((a) => (
              <li key={a.id_acceso} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">
                    {a.nombres ? `${a.nombres} ${a.apellidos}` : `Tarjeta desconocida (${a.uid_tarjeta})`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.fecha).toLocaleString('es-GT')}{a.rol ? ` · ${a.rol === 'MEDICO' ? 'Medico' : a.rol === 'PACIENTE' ? 'Paciente' : a.rol}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  a.resultado === 'PERMITIDO' ? 'bg-teal-50 text-teal-700'
                    : a.resultado === 'DENEGADO' ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-600'
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
