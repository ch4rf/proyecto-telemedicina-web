// Lector RFID en la pantalla de Login
// Pregunta al backend cada segundo si alguien paso su tarjeta por el ESP32
import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function LectorRfid() {
  const [estado, setEstado] = useState('esperando'); // esperando | ok | invalida
  const [mensaje, setMensaje] = useState('Acerque su tarjeta al lector para ingresar');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    let entrando = false;

    const revisar = async () => {
      if (entrando) return;
      try {
        const res = await api.get('/rfid/estado');

        if (res.estado === 'ok') {
          entrando = true;
          const nombre = `${res.usuario?.nombres || ''} ${res.usuario?.apellidos || ''}`.trim();
          setEstado('ok');
          setMensaje(`Bienvenido, ${nombre || res.usuario?.correo}`);

          // esperamos un momento para que se vea quien entro
          setTimeout(() => {
            login(res.token, res.usuario, false);
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else if (res.estado === 'invalida') {
          setEstado('invalida');
          setMensaje(`Tarjeta no registrada (${res.uid})`);
          setTimeout(() => {
            setEstado('esperando');
            setMensaje('Acerque su tarjeta al lector para ingresar');
          }, 3000);
        }
      } catch {
        // si el servidor no responde no hacemos nada, se vuelve a intentar
      }
    };

    const intervalo = setInterval(revisar, 1000);
    return () => clearInterval(intervalo);
  }, [login, navigate]);

  const colores = {
    esperando: 'bg-slate-50 border-slate-200 text-slate-600',
    ok: 'bg-teal-50 border-teal-200 text-teal-700',
    invalida: 'bg-red-50 border-red-200 text-red-700'
  };

  return (
    <div className={`mb-6 p-4 border rounded-xl flex items-center gap-3 text-sm transition-colors ${colores[estado]}`}>
      {estado === 'ok' && <CheckCircle2 className="w-6 h-6 shrink-0 text-teal-600" />}
      {estado === 'invalida' && <XCircle className="w-6 h-6 shrink-0 text-red-500" />}
      {estado === 'esperando' && <CreditCard className="w-6 h-6 shrink-0 text-teal-600 animate-pulse" />}
      <div>
        <p className="font-semibold">{estado === 'esperando' ? 'Ingreso con tarjeta' : mensaje}</p>
        {estado === 'esperando' && <p className="text-xs text-slate-500">{mensaje}</p>}
      </div>
    </div>
  );
}
