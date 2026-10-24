import React, { useState } from 'react';
import { 
  Activity, ShieldCheck, User, Lock, Stethoscope, UserCheck, 
  Loader2, KeyRound, X, CheckCircle2, ArrowRight, UserPlus, Phone, Mail 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const [rol, setRol] = useState('PACIENTE'); // 'PACIENTE' o 'MEDICO'
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [cargandoSubmit, setCargandoSubmit] = useState(false);

  // Estados para el Modal de Recuperación de Contraseña (Tarea 5.3.4)
  const [mostrarModalRecuperacion, setMostrarModalRecuperacion] = useState(false);
  const [pasoRecuperacion, setPasoRecuperacion] = useState(1);
  const [correoRecup, setCorreoRecup] = useState('');
  const [codigoRecup, setCodigoRecup] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorModalRecup, setErrorModalRecup] = useState('');
  const [exitoModalRecup, setExitoModalRecup] = useState('');
  const [cargandoModalRecup, setCargandoModalRecup] = useState(false);

  // Estados para el Modal de Registro de Usuarios (Tarea 5.3.5)
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [rolRegistro, setRolRegistro] = useState('PACIENTE');
  const [regNombres, setRegNombres] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regEspecialidad, setRegEspecialidad] = useState('Medicina General');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmarPassword, setRegConfirmarPassword] = useState('');
  const [errorModalRegistro, setErrorModalRegistro] = useState('');
  const [exitoModalRegistro, setExitoModalRegistro] = useState('');
  const [cargandoModalRegistro, setCargandoModalRegistro] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Al cargar la vista, recuperar correo y rol recordados si existen en localStorage
  React.useEffect(() => {
    const correoGuardado = localStorage.getItem('recordar_correo');
    const rolGuardado = localStorage.getItem('recordar_rol');
    if (correoGuardado) {
      setCorreo(correoGuardado);
      setRecordar(true);
    }
    if (rolGuardado === 'PACIENTE' || rolGuardado === 'MEDICO') {
      setRol(rolGuardado);
    }
  }, []);

  // Cambio de rol con limpieza de estados residuales
  const handleCambioRol = (nuevoRol) => {
    setRol(nuevoRol);
    setMensajeError('');
  };

  // Validación y envío real de Login (Tarea 5.3.2)
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setMensajeError('');

    if (!correo.trim() || !password.trim()) {
      setMensajeError('Por favor, ingrese su correo electrónico y contraseña.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      setMensajeError('El correo ingresado no tiene un formato válido (ejemplo: usuario@dominio.com).');
      return;
    }

    try {
      setCargandoSubmit(true);

      const res = await api.post('/auth/login', {
        correo: correo.trim().toLowerCase(),
        password: password
      });

      if (res.rol !== rol) {
        const rolCorrecto = res.rol === 'PACIENTE' ? 'Paciente' : 'Médico';
        const pestañaCorrecta = res.rol === 'PACIENTE' ? 'Portal Paciente' : 'Portal Médico';
        setMensajeError(`Esta cuenta está registrada como ${rolCorrecto}. Por favor seleccione la pestaña "${pestañaCorrecta}" para ingresar.`);
        setCargandoSubmit(false);
        return;
      }

      // Guardado de credenciales recordadas y sesión en AuthContext (Tarea 5.3.3)
      if (recordar) {
        localStorage.setItem('recordar_correo', correo.trim().toLowerCase());
        localStorage.setItem('recordar_rol', rol);
      } else {
        localStorage.removeItem('recordar_correo');
        localStorage.removeItem('recordar_rol');
      }

      login(res.token, res.usuario, recordar);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error de autenticación:', err.message);
      setMensajeError(err.message || 'Error al conectar con el servidor de autenticación.');
    } finally {
      setCargandoSubmit(false);
    }
  };

  // Flujo de Recuperación Paso 1: Solicitar Código (Tarea 5.3.4)
  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setErrorModalRecup('');
    setExitoModalRecup('');

    if (!correoRecup.trim()) {
      setErrorModalRecup('Ingrese su correo electrónico registrado.');
      return;
    }

    try {
      setCargandoModalRecup(true);
      const res = await api.post('/auth/forgot-password', { correo: correoRecup.trim().toLowerCase() });
      setExitoModalRecup(`Código de verificación: ${res.codigo_simulado || 'enviado al correo'}. Ingréselo abajo.`);
      if (res.codigo_simulado) {
        setCodigoRecup(res.codigo_simulado);
      }
      setPasoRecuperacion(2);
    } catch (err) {
      setErrorModalRecup(err.message || 'No se pudo generar el código de recuperación.');
    } finally {
      setCargandoModalRecup(false);
    }
  };

  // Flujo de Recuperación Paso 2: Restablecer Contraseña (Tarea 5.3.4)
  const handleRestablecerPassword = async (e) => {
    e.preventDefault();
    setErrorModalRecup('');
    setExitoModalRecup('');

    if (!codigoRecup.trim() || !nuevoPassword.trim() || !confirmarPassword.trim()) {
      setErrorModalRecup('Complete todos los campos para continuar.');
      return;
    }

    if (nuevoPassword !== confirmarPassword) {
      setErrorModalRecup('Las contraseñas no coinciden. Verifique e intente nuevamente.');
      return;
    }

    if (nuevoPassword.length < 3) {
      setErrorModalRecup('La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    try {
      setCargandoModalRecup(true);
      const res = await api.post('/auth/reset-password', {
        correo: correoRecup.trim().toLowerCase(),
        codigo: codigoRecup.trim(),
        nuevoPassword: nuevoPassword
      });

      setExitoModalRecup(res.mensaje || 'Contraseña actualizada con éxito.');
      setTimeout(() => {
        setMostrarModalRecuperacion(false);
        setCorreo(correoRecup);
        setPassword('');
        setPasoRecuperacion(1);
        setExitoModalRecup('');
        setErrorModalRecup('');
      }, 2000);
    } catch (err) {
      setErrorModalRecup(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setCargandoModalRecup(false);
    }
  };

  // Flujo de Registro de Nuevos Usuarios (Tarea 5.3.5)
  const handleRegistroUsuario = async (e) => {
    e.preventDefault();
    setErrorModalRegistro('');
    setExitoModalRegistro('');

    // Validaciones
    if (!regNombres.trim() || !regApellidos.trim() || !regCorreo.trim() || !regTelefono.trim() || !regPassword.trim()) {
      setErrorModalRegistro('Por favor complete todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regCorreo.trim())) {
      setErrorModalRegistro('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (regPassword !== regConfirmarPassword) {
      setErrorModalRegistro('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (regPassword.length < 3) {
      setErrorModalRegistro('La contraseña debe tener un mínimo de 3 caracteres.');
      return;
    }

    try {
      setCargandoModalRegistro(true);

      const payload = {
        correo: regCorreo.trim().toLowerCase(),
        password: regPassword,
        rol: rolRegistro,
        nombres: regNombres.trim(),
        apellidos: regApellidos.trim(),
        telefono: regTelefono.trim(),
        especialidad: rolRegistro === 'MEDICO' ? regEspecialidad : undefined
      };

      await api.post('/auth/register', payload);

      setExitoModalRegistro('Registro completado exitosamente. Preparando inicio de sesión...');
      
      setTimeout(() => {
        setMostrarModalRegistro(false);
        setRol(rolRegistro);
        setCorreo(regCorreo.trim().toLowerCase());
        setPassword('');
        setExitoModalRegistro('');
        setErrorModalRegistro('');
        // Limpiar formulario de registro
        setRegNombres('');
        setRegApellidos('');
        setRegCorreo('');
        setRegTelefono('');
        setRegPassword('');
        setRegConfirmarPassword('');
      }, 1800);

    } catch (err) {
      setErrorModalRegistro(err.message || 'Ocurrió un error al procesar el registro.');
    } finally {
      setCargandoModalRegistro(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Panel Izquierdo - Branding (Oculto en móviles) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-14">
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
          <div className="mb-10 lg:hidden flex items-center gap-3 text-slate-900">
            <Activity className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-semibold tracking-tight">NovaSalud</span>
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
            {rol === 'PACIENTE' ? 'Portal del Paciente' : 'Portal Médico'}
          </h2>
          <p className="text-slate-500 mb-8 text-sm sm:text-base">
            {rol === 'PACIENTE' 
              ? 'Ingrese sus credenciales para gestionar citas y consultar sus recetas médicas.'
              : 'Acceso exclusivo para personal de salud acreditado y gestión de consultas virtuales.'}
          </p>

          {/* Selector de Rol Dinámico */}
          <div className="flex p-1 bg-slate-200/60 rounded-lg mb-8">
            <button 
              type="button"
              onClick={() => handleCambioRol('PACIENTE')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                rol === 'PACIENTE' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Portal Paciente</span>
            </button>
            <button 
              type="button"
              onClick={() => handleCambioRol('MEDICO')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                rol === 'MEDICO' 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Portal Médico</span>
            </button>
          </div>

          {/* Alerta Visual de Errores */}
          {mensajeError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3 shadow-sm animate-fadeIn">
              <span className="font-bold text-red-500 text-base leading-none">•</span>
              <span className="flex-1">{mensajeError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {rol === 'PACIENTE' ? 'Correo Electrónico del Paciente' : 'Correo Institucional del Médico'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={correo}
                  disabled={cargandoSubmit}
                  onChange={(e) => { setCorreo(e.target.value); setMensajeError(''); }}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder={rol === 'PACIENTE' ? 'paciente@test.com' : 'medico@test.com'}
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
                  value={password}
                  disabled={cargandoSubmit}
                  onChange={(e) => { setPassword(e.target.value); setMensajeError(''); }}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  checked={recordar}
                  disabled={cargandoSubmit}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer transition-colors" 
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">Recordar sesión</label>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setMostrarModalRecuperacion(true);
                  setCorreoRecup(correo);
                  setErrorModalRecup('');
                  setExitoModalRecup('');
                  setPasoRecuperacion(1);
                }}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={cargandoSubmit}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all mt-8 disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              {cargandoSubmit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <span>{rol === 'PACIENTE' ? 'Ingresar como Paciente' : 'Ingresar como Médico'}</span>
              )}
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                ¿No tiene una cuenta?{' '}
                <button 
                  type="button"
                  onClick={() => {
                    setMostrarModalRegistro(true);
                    setRolRegistro(rol); // Sugerir el rol actual
                    setErrorModalRegistro('');
                    setExitoModalRegistro('');
                  }}
                  className="font-medium text-teal-600 hover:text-teal-700 transition-colors bg-transparent border-none p-0 cursor-pointer underline"
                >
                  Solicite acceso aquí
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña (Tarea 5.3.4) */}
      {mostrarModalRecuperacion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200 relative animate-fadeIn">
            <button 
              type="button"
              onClick={() => setMostrarModalRecuperacion(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Restablecer Contraseña</h3>
                <p className="text-xs text-slate-500">
                  {pasoRecuperacion === 1 ? 'Paso 1 de 2: Verificación' : 'Paso 2 de 2: Nueva Clave'}
                </p>
              </div>
            </div>

            {errorModalRecup && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-600">
                {errorModalRecup}
              </div>
            )}

            {exitoModalRecup && (
              <div className="mb-4 p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs sm:text-sm text-teal-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
                <span>{exitoModalRecup}</span>
              </div>
            )}

            {pasoRecuperacion === 1 ? (
              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ingrese el correo electrónico asociado a su cuenta. El sistema generará un código de verificación con vigencia de 15 minutos.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Registrado
                  </label>
                  <input 
                    type="email"
                    value={correoRecup}
                    onChange={(e) => setCorreoRecup(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargandoModalRecup}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {cargandoModalRecup ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <>
                      <span>Generar Código</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRestablecerPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código de 6 Dígitos
                  </label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={codigoRecup}
                    onChange={(e) => setCodigoRecup(e.target.value)}
                    placeholder="123456"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-mono tracking-widest text-lg font-bold outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nueva Contraseña
                  </label>
                  <input 
                    type="password"
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input 
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasoRecuperacion(1)}
                    className="w-1/3 py-3 border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoModalRecup}
                    className="w-2/3 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    {cargandoModalRecup ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>Guardar Nueva Clave</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Usuarios (Tarea 5.3.5) */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 relative animate-fadeIn my-8">
            <button 
              type="button"
              onClick={() => setMostrarModalRegistro(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Solicitud de Acceso Clínico</h3>
                <p className="text-xs text-slate-500">Cree su cuenta institucional en la plataforma</p>
              </div>
            </div>

            {/* Selector de Rol en Registro */}
            <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button 
                type="button"
                onClick={() => setRolRegistro('PACIENTE')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                  rolRegistro === 'PACIENTE' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Cuenta Paciente
              </button>
              <button 
                type="button"
                onClick={() => setRolRegistro('MEDICO')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                  rolRegistro === 'MEDICO' 
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Cuenta Médico
              </button>
            </div>

            {errorModalRegistro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {errorModalRegistro}
              </div>
            )}

            {exitoModalRegistro && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{exitoModalRegistro}</span>
              </div>
            )}

            <form onSubmit={handleRegistroUsuario} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input 
                    type="text"
                    value={regNombres}
                    onChange={(e) => setRegNombres(e.target.value)}
                    placeholder="Ej. Roberto"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Apellidos *
                  </label>
                  <input 
                    type="text"
                    value={regApellidos}
                    onChange={(e) => setRegApellidos(e.target.value)}
                    placeholder="Ej. Martínez"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico *
                  </label>
                  <input 
                    type="email"
                    value={regCorreo}
                    onChange={(e) => setRegCorreo(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono de Contacto *
                  </label>
                  <input 
                    type="tel"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    placeholder="555-0192"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              {rolRegistro === 'MEDICO' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Especialidad Médica *
                  </label>
                  <select
                    value={regEspecialidad}
                    onChange={(e) => setRegEspecialidad(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  >
                    <option value="Medicina General">Medicina General</option>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Neurología">Neurología</option>
                    <option value="Traumatología">Traumatología</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contraseña *
                  </label>
                  <input 
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmar Contraseña *
                  </label>
                  <input 
                    type="password"
                    value={regConfirmarPassword}
                    onChange={(e) => setRegConfirmarPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={cargandoModalRegistro}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {cargandoModalRegistro ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <span>Registrar Cuenta</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
