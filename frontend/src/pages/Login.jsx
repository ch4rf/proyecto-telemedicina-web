import React, { useState } from 'react';
import { Activity, ShieldCheck, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isPatient, setIsPatient] = useState(true);
  const navigate = useNavigate();

  // Función temporal para simular el inicio de sesión
  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Panel Izquierdo - Branding (Oculto en móviles) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-14">
        {/* Gradiente sutil de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/30 to-slate-900/90 z-0"></div>
        
        <div className="relative z-10 flex items-center gap-3 text-white">
          <Activity className="w-8 h-8 text-teal-400" />
          <span className="text-2xl font-semibold tracking-tight">NovaSalud</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-light text-white mb-6 leading-tight">
            Gestión clínica <br/>
            <span className="font-semibold text-teal-400">segura y centralizada.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Acceda a expedientes integrados, gestione agendas médicas y realice consultas virtuales bajo los más altos estándares de privacidad.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-slate-500 text-sm">
          <ShieldCheck className="w-5 h-5 text-teal-500/70" />
          <span>Plataforma encriptada de extremo a extremo</span>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Autenticación */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo visible solo en móviles */}
          <div className="mb-10 lg:hidden flex items-center gap-3 text-slate-900">
            <Activity className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-semibold tracking-tight">NovaSalud</span>
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">Acceso al Portal</h2>
          <p className="text-slate-500 mb-8 text-sm sm:text-base">Por favor, ingrese sus credenciales institucionales para continuar.</p>

          {/* Selector de Rol Elegante */}
          <div className="flex p-1 bg-slate-200/60 rounded-lg mb-8">
            <button 
              onClick={() => setIsPatient(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isPatient ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Portal Paciente
            </button>
            <button 
              onClick={() => setIsPatient(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${!isPatient ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Portal Médico
            </button>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 shadow-sm"
                  placeholder="ejemplo@institucion.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer transition-colors" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">Recordar sesión</label>
              </div>
              <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">¿Olvidó su contraseña?</a>
            </div>

            <button 
              type="button" 
              onClick={handleLogin}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all mt-8"
            >
              Ingresar al Sistema
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                ¿No tiene una cuenta? <a href="#" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">Solicite acceso aquí</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
