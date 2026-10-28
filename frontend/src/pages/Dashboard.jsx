import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, LayoutDashboard, CalendarDays, Users, FileText, LogOut, 
  Search, Bell, User, X, Loader2, Stethoscope, Clock, CheckCircle2, Check,
  Menu, Filter, Pill, ChevronRight, Video, Calendar, ArrowRight, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ModalPerfil from '../components/ModalPerfil';
import ModalAgendarCita from '../components/ModalAgendarCita';
import ModalDetalleCita from '../components/ModalDetalleCita';
import ErrorBoundary from '../components/ErrorBoundary';
import { generarRecetaPDF } from '../utils/generarRecetaPDF';

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, logout, actualizarPerfilLocal } = useAuth();
  
  // Detección automática del rol desde la sesión activa
  const isPatient = usuario?.rol === 'PACIENTE';

  // Estados del Buscador en Vivo (Tarea 5.4.2)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState({ medicos: [], citas: [] });
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const buscadorRef = useRef(null);

  // Estados de Notificaciones Interactivas (Tarea 5.4.3)
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const notificacionesRef = useRef(null);

  // Carga inicial de notificaciones desde el backend
  const cargarNotificaciones = async () => {
    try {
      setCargandoNotificaciones(true);
      const res = await api.get('/notificaciones');
      if (res?.ok && Array.isArray(res.data)) {
        setNotificaciones(res.data);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err.message);
    } finally {
      setCargandoNotificaciones(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  useEffect(() => {
    const handleRefrescarNotif = () => cargarNotificaciones();
    window.addEventListener('notificaciones-actualizadas', handleRefrescarNotif);
    return () => window.removeEventListener('notificaciones-actualizadas', handleRefrescarNotif);
  }, []);

  // Marcar notificación individual como leída
  const handleMarcarLeida = async (id_notificacion, e) => {
    if (e) e.stopPropagation();
    // Actualización optimista inmediata en UI
    setNotificaciones(prev =>
      prev.map(n => n.id_notificacion === id_notificacion ? { ...n, leido: true } : n)
    );
    try {
      await api.patch(`/notificaciones/${id_notificacion}/leida`);
    } catch (err) {
      console.error('Error al marcar notificación:', err.message);
      cargarNotificaciones();
    }
  };

  // Marcar todas las notificaciones como leídas
  const handleMarcarTodasLeidas = async () => {
    const noLeidas = notificaciones.filter(n => !n.leido);
    if (noLeidas.length === 0) return;
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    try {
      await Promise.all(noLeidas.map(n => api.patch(`/notificaciones/${n.id_notificacion}/leida`)));
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err.message);
      cargarNotificaciones();
    }
  };

  const conteoNoLeidas = notificaciones.filter(n => !n.leido).length;

  // Estado y datos del Perfil de Usuario (Tarea 5.4.4)
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);
  const inicialesUsuario = usuario?.nombres && usuario?.apellidos
    ? `${usuario.nombres[0]}${usuario.apellidos[0]}`.toUpperCase()
    : usuario?.nombres
    ? usuario.nombres.substring(0, 2).toUpperCase()
    : usuario?.correo
    ? usuario.correo.substring(0, 2).toUpperCase()
    : 'US';

  // Estados del Modal de Agendamiento de Citas (Tarea 5.4.8)
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [medicoPreseleccionado, setMedicoPreseleccionado] = useState(null);

  const handleAbrirAgendarCita = (medico = null) => {
    setMedicoPreseleccionado(medico);
    setModalAgendarAbierto(true);
  };

  // Estados del Modal de Detalles de Cita y Videollamada (Tarea 5.4.9)
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState(null);

  const handleAbrirDetalleCita = (idCita) => {
    setCitaSeleccionadaId(idCita);
    setModalDetalleAbierto(true);
  };

  const handleCitaAgendada = () => {
    cargarCitas();
    cargarMetricas();
    cargarNotificaciones();
  };

  // Manejador de búsqueda con debounce
  useEffect(() => {
    if (!terminoBusqueda.trim()) {
      setResultadosBusqueda({ medicos: [], citas: [] });
      setCargandoBusqueda(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCargandoBusqueda(true);
        const res = await api.get(`/buscar?q=${encodeURIComponent(terminoBusqueda.trim())}`);
        if (res?.ok && res?.data) {
          setResultadosBusqueda(res.data);
        }
      } catch (err) {
        console.error('Error al ejecutar búsqueda:', err.message);
      } finally {
        setCargandoBusqueda(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [terminoBusqueda]);

  // Cerrar buscador o notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setBusquedaAbierta(false);
      }
      if (notificacionesRef.current && !notificacionesRef.current.contains(event.target)) {
        setNotificacionesAbiertas(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // Control de Vistas Activas y Navegación Lateral (Tarea 5.4.5)
  const [vistaActiva, setVistaActiva] = useState('panel'); // 'panel' | 'citas' | 'directorio' | 'expedientes'
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // Estados de datos de vistas
  const [citasList, setCitasList] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [filtroEstadoCita, setFiltroEstadoCita] = useState('TODAS');

  const [medicosList, setMedicosList] = useState([]);
  const [cargandoMedicos, setCargandoMedicos] = useState(false);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('TODAS');

  const [recetasList, setRecetasList] = useState([]);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);

  // Estados de Catálogo de Medicamentos para el Médico (Tarea M.3)
  const [catalogoList, setCatalogoList] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [nuevoMed, setNuevoMed] = useState({
    nombre_comercial: '',
    principio_activo: '',
    presentacion: '',
    dosis_recomendada: '',
    frecuencia_recomendada: '',
    duracion_recomendada: ''
  });
  const [guardandoMed, setGuardandoMed] = useState(false);
  const [sincronizandoFDA, setSincronizandoFDA] = useState(false);
  const [mensajeCatalogo, setMensajeCatalogo] = useState('');
  const [errorCatalogo, setErrorCatalogo] = useState('');

  // Estados de Métricas y KPIs (Tarea 5.4.6)
  const [metricas, setMetricas] = useState({
    citas_activas: 0,
    recetas_totales: 0,
    videollamadas_hoy: 0,
    proxima_cita: null
  });
  const [cargandoMetricas, setCargandoMetricas] = useState(false);

  // Funciones de carga de datos para cada vista
  const cargarMetricas = async () => {
    try {
      setCargandoMetricas(true);
      const res = await api.get('/dashboard/stats');
      console.log('[Dashboard] Respuesta /dashboard/stats:', res);
      const datos = res?.data || (res?.citas_activas !== undefined ? res : null);
      if (datos) {
        setMetricas(datos);
      }
    } catch (err) {
      console.error('[Dashboard] Error al cargar métricas:', err.message);
    } finally {
      setCargandoMetricas(false);
    }
  };

  const cargarCitas = async () => {
    try {
      setCargandoCitas(true);
      const res = await api.get('/citas');
      console.log('[Dashboard] Respuesta /api/citas:', res);
      const lista = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setCitasList(lista);
    } catch (err) {
      console.error('[Dashboard] Error al cargar citas:', err.message);
    } finally {
      setCargandoCitas(false);
    }
  };

  const cargarMedicos = async () => {
    try {
      setCargandoMedicos(true);
      const res = await api.get('/medicos');
      if (Array.isArray(res)) {
        setMedicosList(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setMedicosList(res.data);
      }
    } catch (err) {
      console.error('Error al cargar directorio médico:', err.message);
    } finally {
      setCargandoMedicos(false);
    }
  };

  const cargarRecetas = async () => {
    try {
      setCargandoRecetas(true);
      const res = await api.get('/consultas/recetas');
      if (res?.ok && Array.isArray(res.data)) {
        setRecetasList(res.data);
      }
    } catch (err) {
      console.error('Error al cargar recetas:', err.message);
    } finally {
      setCargandoRecetas(false);
    }
  };

  const cargarCatalogo = async (termino = '', sincronizar = false) => {
    try {
      setCargandoCatalogo(true);
      const syncParam = sincronizar ? '&sync=true' : '';
      const res = await api.get(`/consultas/medicamentos/catalogo?q=${encodeURIComponent(termino)}${syncParam}`);
      const lista = Array.isArray(res) ? res : (res?.data || []);
      setCatalogoList(lista);
    } catch (err) {
      console.error('Error al cargar catálogo de medicamentos:', err.message);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const handleImportarOpenFDA = async () => {
    setMensajeCatalogo('');
    setErrorCatalogo('');
    if (!busquedaCatalogo || busquedaCatalogo.trim().length < 3) {
      setErrorCatalogo('Escribe al menos 3 letras en el buscador (ej. Aspirin, Naproxen) para importar desde OpenFDA.');
      return;
    }
    try {
      setSincronizandoFDA(true);
      await cargarCatalogo(busquedaCatalogo.trim(), true);
      setMensajeCatalogo(`Sincronización con OpenFDA completada para "${busquedaCatalogo.trim()}". Los resultados fueron procesados y guardados en PostgreSQL.`);
      setTimeout(() => setMensajeCatalogo(''), 5000);
    } catch (err) {
      setErrorCatalogo(err.message || 'Error al sincronizar con OpenFDA');
    } finally {
      setSincronizandoFDA(false);
    }
  };

  const handleEliminarMedicamentoCatalogo = async (idMedicamento, nombreComercial) => {
    if (!idMedicamento) return;
    setMensajeCatalogo('');
    setErrorCatalogo('');
    try {
      await api.delete(`/consultas/medicamentos/catalogo/${idMedicamento}`);
      setCatalogoList(prev => prev.filter(item => item.id_medicamento !== idMedicamento));
      setMensajeCatalogo(`"${nombreComercial}" fue eliminado correctamente del catálogo en PostgreSQL.`);
      setTimeout(() => setMensajeCatalogo(''), 4000);
    } catch (err) {
      setErrorCatalogo(err.message || 'Error al eliminar medicamento del catálogo');
    }
  };

  const handleAgregarMedicamentoCatalogo = async (e) => {
    e.preventDefault();
    setMensajeCatalogo('');
    setErrorCatalogo('');
    if (!nuevoMed.nombre_comercial.trim() || !nuevoMed.principio_activo.trim()) {
      setErrorCatalogo('El nombre comercial y el principio activo son obligatorios.');
      return;
    }
    try {
      setGuardandoMed(true);
      await api.post('/consultas/medicamentos/catalogo', nuevoMed);
      setMensajeCatalogo(`"${nuevoMed.nombre_comercial}" fue agregado exitosamente al catálogo en PostgreSQL.`);
      setNuevoMed({
        nombre_comercial: '',
        principio_activo: '',
        presentacion: '',
        dosis_recomendada: '',
        frecuencia_recomendada: '',
        duracion_recomendada: ''
      });
      cargarCatalogo(busquedaCatalogo);
      cargarNotificaciones();
      setTimeout(() => setMensajeCatalogo(''), 4000);
    } catch (err) {
      setErrorCatalogo(err.message || 'Error al registrar medicamento');
    } finally {
      setGuardandoMed(false);
    }
  };

  // Carga inicial y reactiva cada vez que cambia el usuario autenticado
  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarCitas();
      cargarMetricas();
      cargarNotificaciones();
    }
  }, [usuario?.id_usuario]);

  useEffect(() => {
    if (vistaActiva === 'panel') {
      cargarMetricas();
      cargarCitas();
    } else if (vistaActiva === 'citas') {
      cargarCitas();
    } else if (vistaActiva === 'directorio') {
      cargarMedicos();
    } else if (vistaActiva === 'expedientes') {
      cargarRecetas();
    } else if (vistaActiva === 'catalogo') {
      cargarCatalogo(busquedaCatalogo);
    }
  }, [vistaActiva]);

  // Citas programadas ordenadas por fecha más cercana
  const citasProgramadas = citasList
    .filter(c => c.estado === 'PROGRAMADA')
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  // Próxima cita más inmediata (desde métricas del backend o lista de citas activas) (Tarea 5.4.7)
  const proximaCita = (metricas.proxima_cita && metricas.proxima_cita.estado === 'PROGRAMADA' && (!citasList.length || citasProgramadas.some(c => c.id_cita === metricas.proxima_cita.id_cita)))
    ? metricas.proxima_cita
    : (citasProgramadas[0] || null);

  // Saludo contextual personalizado para el Banner (Tarea 5.4.7)
  const nombreUsuario = usuario?.nombres 
    ? `${usuario.nombres} ${usuario.apellidos || ''}`.trim()
    : (usuario?.correo || 'Usuario');

  const saludoUsuario = isPatient
    ? `Bienvenido de nuevo, ${nombreUsuario}`
    : `Bienvenido de nuevo, ${usuario?.nombres?.startsWith('Dr') ? nombreUsuario : `Dr. ${nombreUsuario}`}`;

  // Control de Cierre de Sesión seguro (Tarea 5.4.1)
  const handleCerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar Lateral Escritorio (Menú Oscuro) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Activity className="w-6 h-6 text-teal-400 mr-2" />
          <span className="text-xl font-semibold text-white tracking-tight">NovaSalud</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <button 
            type="button"
            onClick={() => setVistaActiva('panel')}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
              vistaActiva === 'panel' 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Panel Principal</span>
          </button>

          <button 
            type="button"
            onClick={() => setVistaActiva('citas')}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
              vistaActiva === 'citas' 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>Mis Citas</span>
          </button>

          {isPatient && (
            <button 
              type="button"
              onClick={() => setVistaActiva('directorio')}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                vistaActiva === 'directorio' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Directorio Médico</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => setVistaActiva('expedientes')}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
              vistaActiva === 'expedientes' 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>{isPatient ? 'Mis Recetas' : 'Expedientes'}</span>
          </button>
          {!isPatient && (
            <button
              type="button"
              onClick={() => setVistaActiva('catalogo')}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                vistaActiva === 'catalogo'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span>Catálogo Médico</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            type="button"
            onClick={handleCerrarSesion}
            className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Drawer Móvil del Menú Lateral */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuMovilAbierto(false)}
          ></div>
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10 animate-scaleUp">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-teal-400" />
                <span className="text-xl font-semibold text-white tracking-tight">NovaSalud</span>
              </div>
              <button 
                type="button"
                onClick={() => setMenuMovilAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              <button
                type="button"
                onClick={() => { setVistaActiva('panel'); setMenuMovilAbierto(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                  vistaActiva === 'panel'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Panel Principal</span>
              </button>

              <button
                type="button"
                onClick={() => { setVistaActiva('citas'); setMenuMovilAbierto(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                  vistaActiva === 'citas'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
                <span>Mis Citas</span>
              </button>

              {isPatient && (
                <button
                  type="button"
                  onClick={() => { setVistaActiva('directorio'); setMenuMovilAbierto(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                    vistaActiva === 'directorio'
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Directorio Médico</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { setVistaActiva('expedientes'); setMenuMovilAbierto(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                  vistaActiva === 'expedientes'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>{isPatient ? 'Mis Recetas' : 'Expedientes'}</span>
              </button>
              {!isPatient && (
            <button
              type="button"
              onClick={() => setVistaActiva('catalogo')}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all cursor-pointer ${
                vistaActiva === 'catalogo'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <Pill className="w-5 h-5" />
              <span>Catálogo Médico</span>
            </button>
          )}
        </nav>

            <div className="p-4 border-t border-slate-800">
              <button 
                type="button"
                onClick={handleCerrarSesion}
                className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header Superior (Buscador, Notificaciones y Perfil) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-30 relative shadow-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <button 
              type="button"
              onClick={() => setMenuMovilAbierto(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 hidden sm:block">
              {vistaActiva === 'panel' && 'Inicio'}
              {vistaActiva === 'citas' && 'Mis Citas Médicas'}
              {vistaActiva === 'directorio' && 'Directorio Médico'}
              {vistaActiva === 'expedientes' && (isPatient ? 'Mis Recetas y Diagnósticos' : 'Expedientes Clínicos')}
              {vistaActiva === 'catalogo' && 'Catálogo Clínico de Medicamentos'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Buscador Interactivo en Tiempo Real (Tarea 5.4.2) */}
            <div ref={buscadorRef} className="relative flex items-center">
              {busquedaAbierta ? (
                <div className="relative flex items-center w-64 sm:w-80 md:w-96 transition-all duration-300">
                  <Search className="w-4 h-4 text-teal-600 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                    placeholder="Buscar médico, especialidad o cita..."
                    className="w-full pl-9 pr-8 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-full text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 shadow-inner"
                  />
                  {cargandoBusqueda ? (
                    <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-2.5" />
                  ) : (
                    <button 
                      type="button"
                      onClick={() => { setBusquedaAbierta(false); setTerminoBusqueda(''); }}
                      className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => {
                    setBusquedaAbierta(true);
                    setNotificacionesAbiertas(false);
                  }}
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all cursor-pointer"
                  title="Buscar médicos o citas"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}

              {/* Menú Flotante de Resultados en Tiempo Real */}
              {busquedaAbierta && terminoBusqueda.trim().length > 0 && (
                <div className="absolute top-12 right-0 sm:left-0 sm:right-auto w-72 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fadeIn max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Resultados para "{terminoBusqueda}"
                    </span>
                    {cargandoBusqueda && (
                      <span className="text-xs text-teal-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </div>

                  {/* Médicos encontrados */}
                  {resultadosBusqueda.medicos && resultadosBusqueda.medicos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Médicos ({resultadosBusqueda.medicos.length})
                      </p>
                      <div className="space-y-1.5">
                        {resultadosBusqueda.medicos.map(med => (
                          <div 
                            key={med.id_medico} 
                            onClick={() => {
                              setBusquedaAbierta(false);
                              if (isPatient) {
                                handleAbrirAgendarCita(med);
                              }
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{med.nombres} {med.apellidos}</p>
                              <p className="text-xs text-teal-600 font-medium">{med.especialidad}</p>
                            </div>
                            <span className="text-[11px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold">
                              {isPatient ? 'Agendar' : 'Disponible'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citas encontradas */}
                  {resultadosBusqueda.citas && resultadosBusqueda.citas.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Citas ({resultadosBusqueda.citas.length})
                      </p>
                      <div className="space-y-1.5">
                        {resultadosBusqueda.citas.map(cita => (
                          <div 
                            key={cita.id_cita} 
                            onClick={() => {
                              setBusquedaAbierta(false);
                              handleAbrirDetalleCita(cita.id_cita);
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {isPatient 
                                  ? `${cita.medico_nombres || ''} ${cita.medico_apellidos || ''}` 
                                  : `${cita.paciente_nombres || ''} ${cita.paciente_apellidos || ''}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(cita.fecha_hora).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                              {cita.estado === 'CANCELADA'
                              ? cita.cancelado_por === 'MEDICO'
                                ? 'CANCELADO POR MÉDICO'
                                : cita.cancelado_por === 'PACIENTE'
                                ? 'CANCELADO POR PACIENTE'
                                : 'CANCELADA'
                              : cita.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sin coincidencias */}
                  {!cargandoBusqueda && 
                   (!resultadosBusqueda.medicos || resultadosBusqueda.medicos.length === 0) && 
                   (!resultadosBusqueda.citas || resultadosBusqueda.citas.length === 0) && (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No se encontraron médicos ni citas que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Centro de Notificaciones Interactivo (Tarea 5.4.3) */}
            <div ref={notificacionesRef} className="relative flex items-center">
              <button 
                type="button"
                onClick={() => {
                  setNotificacionesAbiertas(!notificacionesAbiertas);
                  setBusquedaAbierta(false);
                }}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all relative cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {conteoNoLeidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm">
                    {conteoNoLeidas > 9 ? '9+' : conteoNoLeidas}
                  </span>
                )}
              </button>

              {/* Menú Desplegable de Notificaciones */}
              {notificacionesAbiertas && (
                <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fadeIn max-h-[28rem] flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">Notificaciones</span>
                      {conteoNoLeidas > 0 && (
                        <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {conteoNoLeidas} nueva{conteoNoLeidas > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {conteoNoLeidas > 0 && (
                      <button 
                        type="button"
                        onClick={handleMarcarTodasLeidas}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium cursor-pointer"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {cargandoNotificaciones ? (
                      <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        <span>Cargando avisos...</span>
                      </div>
                    ) : notificaciones.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No tienes notificaciones en este momento.
                      </div>
                    ) : (
                      notificaciones.map(notif => (
                        <div 
                          key={notif.id_notificacion}
                          className={`p-3 rounded-xl transition-colors flex items-start gap-3 my-1 ${
                            !notif.leido ? 'bg-teal-50/40 hover:bg-teal-50/70 border-l-2 border-teal-500' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                            notif.tipo === 'RECETA' 
                              ? 'bg-blue-50 text-blue-600' 
                              : notif.tipo === 'CITA' 
                              ? 'bg-teal-50 text-teal-600' 
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {notif.tipo === 'RECETA' ? (
                              <FileText className="w-4 h-4" />
                            ) : notif.tipo === 'CITA' ? (
                              <CalendarDays className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold truncate ${!notif.leido ? 'text-slate-900' : 'text-slate-700'}`}>
                                {notif.titulo}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(notif.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {notif.mensaje}
                            </p>
                            {!notif.leido && (
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => handleMarcarLeida(notif.id_notificacion, e)}
                                  className="text-[11px] font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Marcar como leída
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar Interactivo con Iniciales Dinámicas (Tarea 5.4.4) */}
            <button
              type="button"
              onClick={() => setModalPerfilAbierto(true)}
              className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm ml-2 border border-teal-200 cursor-pointer hover:ring-2 hover:ring-teal-500/50 transition-all shadow-sm"
              title="Ver y editar perfil de usuario"
            >
              {inicialesUsuario}
            </button>
          </div>
        </header>

        {/* Área de Trabajo (Vistas Dinámicas) */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          
          {/* VISTA 1: Panel Principal */}
          {vistaActiva === 'panel' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
              
              {/* Tarjeta de Bienvenida Principal (Tarea 5.4.7) */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-teal-50 to-blue-50 opacity-50 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {saludoUsuario}
                  </h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    {proximaCita ? (
                      isPatient ? (
                        <>Tu próxima cita con <strong>{proximaCita.medico_nombres || 'tu especialista'} {proximaCita.medico_apellidos || ''}</strong> ({proximaCita.especialidad || 'Consulta Médica'}) está programada para el <strong>{new Date(proximaCita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> a las <strong>{new Date(proximaCita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong>.</>
                      ) : (
                        <>Tu próxima videoconsulta con el paciente <strong>{proximaCita.paciente_nombres || 'Paciente'} {proximaCita.paciente_apellidos || ''}</strong> está programada para el <strong>{new Date(proximaCita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> a las <strong>{new Date(proximaCita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong>.</>
                      )
                    ) : (
                      'No tienes consultas médicas pendientes en este momento. Puedes agendar una nueva teleconsulta o revisar tu historial médico.'
                    )}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    if (isPatient) {
                      handleAbrirAgendarCita(null);
                    } else {
                      setVistaActiva('citas');
                    }
                  }}
                  className="relative z-10 whitespace-nowrap px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isPatient ? 'Agendar Nueva Cita' : 'Ver Mi Agenda'}
                </button>
              </div>

              {/* Grid de Estadísticas y KPIs Reales (Tarea 5.4.6) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* KPI 1: Citas Activas */}
                <div 
                  onClick={() => {
                    setFiltroEstadoCita('PROGRAMADA');
                    setVistaActiva('citas');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group cursor-pointer flex items-start gap-5 relative overflow-hidden"
                  title="Haz clic para ver las citas activas"
                >
                  <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Citas Activas</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                      {cargandoMetricas ? (
                        <span className="inline-block w-8 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
                      ) : (
                        metricas.citas_activas
                      )}
                    </p>
                    <p className="text-xs text-teal-600 font-medium mt-1.5 flex items-center gap-1">
                      <span>Ver citas programadas</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </div>
                
                {/* KPI 2: Recetas Emitidas */}
                <div 
                  onClick={() => setVistaActiva('expedientes')}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer flex items-start gap-5 relative overflow-hidden"
                  title="Haz clic para ver tus recetas y diagnósticos"
                >
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {isPatient ? 'Recetas Recibidas' : 'Recetas Emitidas'}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                      {cargandoMetricas ? (
                        <span className="inline-block w-8 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
                      ) : (
                        metricas.recetas_totales
                      )}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1">
                      <span>Ver expedientes clínicos</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </div>
                
                {/* KPI 3: Videollamadas Hoy */}
                <div 
                  onClick={() => {
                    setFiltroEstadoCita('TODAS');
                    setVistaActiva('citas');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer flex items-start gap-5 relative overflow-hidden"
                  title="Haz clic para ver consultas de hoy"
                >
                  <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Videollamadas Hoy</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                      {cargandoMetricas ? (
                        <span className="inline-block w-8 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
                      ) : (
                        metricas.videollamadas_hoy
                      )}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
                      <span>Consultas del día</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                  </div>
                </div>

              </div>

              {/* Sección Inferior - Próxima Actividad (Tarea 5.4.7) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800">Próxima Actividad</h4>
                  {proximaCita && (
                    <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full border border-teal-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      Confirmada en Agenda
                    </span>
                  )}
                </div>

                {proximaCita ? (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center border border-teal-100 font-bold text-lg shadow-inner flex-shrink-0">
                        {isPatient 
                          ? (proximaCita.medico_nombres?.[0] || 'D') + (proximaCita.medico_apellidos?.[0] || 'R')
                          : (proximaCita.paciente_nombres?.[0] || 'P') + (proximaCita.paciente_apellidos?.[0] || 'A')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-base">
                            {isPatient 
                              ? `${proximaCita.medico_nombres || 'Dr.'} ${proximaCita.medico_apellidos || ''}` 
                              : `${proximaCita.paciente_nombres || 'Paciente'} ${proximaCita.paciente_apellidos || ''}`}
                          </h5>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                            {proximaCita.estado}
                          </span>
                        </div>
                        <p className="text-xs text-teal-600 font-medium mt-0.5">
                          {isPatient ? (proximaCita.especialidad || 'Consulta Médica General') : 'Consulta Virtual de Telemedicina'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Sala Virtual Segura con Cifrado Punto a Punto</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <p className="font-bold text-slate-900 text-base">
                          {new Date(proximaCita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {new Date(proximaCita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleAbrirDetalleCita(proximaCita.id_cita)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 cursor-pointer"
                        >
                          Ver Detalles
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => navigate(`/sala/${proximaCita.url_videollamada}`)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Entrar a Sala</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm shadow-sm">
                    <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No tienes próximas actividades programadas en este momento.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isPatient ? 'Agenda una nueva consulta desde el directorio de especialistas.' : 'Las nuevas citas solicitadas aparecerán aquí.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Sección Inferior 2 - Listado de Agenda / Citas Programadas en el Dashboard Principal */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">
                      {isPatient ? 'Mis Consultas Médicas' : 'Agenda de Pacientes'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isPatient 
                        ? 'Todas tus consultas médicas registradas en la plataforma' 
                        : 'Pacientes con cita médica programada en tu agenda'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVistaActiva('citas')}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 hover:bg-teal-100/60 transition-colors"
                  >
                    <span>Ver todas ({citasList.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {cargandoCitas ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    <span className="text-xs">Cargando citas médicas...</span>
                  </div>
                ) : citasList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-sm">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No hay citas registradas en tu historial</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isPatient 
                        ? 'Agenda una teleconsulta para comenzar tu atención médica virtual.' 
                        : 'Las citas que los pacientes agenden contigo aparecerán listadas aquí.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasList.map(cita => (
                      <div 
                        key={cita.id_cita}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100 flex-shrink-0">
                            {isPatient 
                              ? (cita.medico_nombres?.[0] || 'D') + (cita.medico_apellidos?.[0] || 'R')
                              : (cita.paciente_nombres?.[0] || 'P') + (cita.paciente_apellidos?.[0] || 'A')}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-800">
                              {isPatient 
                                ? `${cita.medico_nombres || 'Dr.'} ${cita.medico_apellidos || ''}` 
                                : `${cita.paciente_nombres || 'Paciente'} ${cita.paciente_apellidos || ''}`}
                            </h5>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span className="text-teal-600 font-semibold">
                                {isPatient 
                                  ? (cita.especialidad || 'Consulta Médica General') 
                                  : 'Consulta Virtual de Telemedicina'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(cita.fecha_hora).toLocaleString('es-ES', { 
                                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            cita.estado === 'PROGRAMADA' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : cita.estado === 'COMPLETADA' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {cita.estado === 'CANCELADA'
                              ? cita.cancelado_por === 'MEDICO'
                                ? 'CANCELADO POR MÉDICO'
                                : cita.cancelado_por === 'PACIENTE'
                                ? 'CANCELADO POR PACIENTE'
                                : 'CANCELADA'
                              : cita.estado}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAbrirDetalleCita(cita.id_cita)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 cursor-pointer"
                          >
                            Ver Detalles
                          </button>

                          {cita.estado === 'PROGRAMADA' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/sala/${cita.url_videollamada}`)}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Entrar a Sala</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VISTA 2: Mis Citas */}
          {vistaActiva === 'citas' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Mis Citas Médicas</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {isPatient 
                      ? 'Consulta tus citas programadas, historial de atenciones y salas de videoconsulta.' 
                      : 'Agenda médica de atenciones virtuales y seguimiento a pacientes.'}
                  </p>
                </div>
                {isPatient && (
                  <button 
                    type="button"
                    onClick={() => handleAbrirAgendarCita(null)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar Cita</span>
                  </button>
                )}
              </div>

              {/* Filtros de estado */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['TODAS', 'PROGRAMADA', 'COMPLETADA', 'CANCELADA'].map(filtro => (
                  <button
                    key={filtro}
                    type="button"
                    onClick={() => setFiltroEstadoCita(filtro)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      filtroEstadoCita === filtro
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {filtro === 'TODAS' ? 'Todas las Citas' : filtro}
                  </button>
                ))}
              </div>

              {/* Listado de Citas */}
              {cargandoCitas ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="text-sm">Cargando citas médicas desde la base de datos...</span>
                </div>
              ) : citasList.filter(c => filtroEstadoCita === 'TODAS' || c.estado === filtroEstadoCita).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-700">No se encontraron citas</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    No tienes registros en la categoría seleccionada.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {citasList
                    .filter(c => filtroEstadoCita === 'TODAS' || c.estado === filtroEstadoCita)
                    .map(cita => (
                      <div 
                        key={cita.id_cita}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base border border-teal-100 flex-shrink-0">
                            {isPatient 
                              ? (cita.medico_nombres?.[0] || 'M') 
                              : (cita.paciente_nombres?.[0] || 'P')}
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-slate-800">
                              {isPatient 
                                ? `${cita.medico_nombres || 'Dr.'} ${cita.medico_apellidos || ''}` 
                                : `${cita.paciente_nombres || 'Paciente'} ${cita.paciente_apellidos || ''}`}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500">
                              <span className="text-teal-600 font-medium">{cita.especialidad || 'Consulta Médica'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(cita.fecha_hora).toLocaleString('es-ES', { 
                                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            cita.estado === 'PROGRAMADA' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : cita.estado === 'COMPLETADA' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {cita.estado === 'CANCELADA'
                              ? cita.cancelado_por === 'MEDICO'
                                ? 'CANCELADO POR MÉDICO'
                                : cita.cancelado_por === 'PACIENTE'
                                ? 'CANCELADO POR PACIENTE'
                                : 'CANCELADA'
                              : cita.estado}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAbrirDetalleCita(cita.id_cita)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 cursor-pointer"
                          >
                            Ver Detalles
                          </button>

                          {cita.estado === 'PROGRAMADA' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/sala/${cita.url_videollamada}`)}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Entrar a Sala</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: Directorio Médico */}
          {vistaActiva === 'directorio' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800">Directorio de Especialistas</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Encuentra médicos colegiados certificados disponibles para teleconsulta y atención virtual.
                </p>
              </div>

              {/* Filtro por especialidad */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['TODAS', 'Cardiología', 'Medicina General', 'Pediatría', 'Dermatología', 'Neurología'].map(esp => (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => setFiltroEspecialidad(esp)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      filtroEspecialidad === esp
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {esp === 'TODAS' ? 'Todas las Especialidades' : esp}
                  </button>
                ))}
              </div>

              {/* Grid de médicos */}
              {cargandoMedicos ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="text-sm">Consultando especialistas en la base de datos...</span>
                </div>
              ) : medicosList.filter(m => filtroEspecialidad === 'TODAS' || m.especialidad === filtroEspecialidad).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-700">No hay especialistas disponibles</h4>
                  <p className="text-xs text-slate-400 mt-1">Pronto se sumarán nuevos especialistas en esta área médica.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {medicosList
                    .filter(m => filtroEspecialidad === 'TODAS' || m.especialidad === filtroEspecialidad)
                    .map(med => (
                      <div 
                        key={med.id_medico}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-100 shadow-inner">
                              {med.nombres?.[0] || 'D'}{med.apellidos?.[0] || 'R'}
                            </div>
                            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Disponible
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-800">{med.nombres} {med.apellidos}</h4>
                          <p className="text-xs font-semibold text-teal-600 mt-0.5">{med.especialidad}</p>
                          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                            Médico especialista activo con disponibilidad de atención remota por videollamada y emisión de recetas oficiales.
                          </p>
                          {Array.isArray(med.disponibilidad) && med.disponibilidad.length > 0 && (
                            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">Atención: </span>
                              {med.disponibilidad.map(d => d.dia).join(', ')} ({med.disponibilidad[0].hora_inicio} - {med.disponibilidad[0].hora_fin} hrs)
                            </div>
                          )}
                          <p className="hidden">
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Consulta Virtual HD</span>
                          <button
                            type="button"
                            onClick={() => handleAbrirAgendarCita(med)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            Agendar Cita
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA 5: Catálogo Clínico de Medicamentos (Exclusivo Médico - Tarea M.3) */}
          {!isPatient && vistaActiva === 'catalogo' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Catálogo Clínico de Medicamentos</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Administra el vademécum de medicamentos almacenado en PostgreSQL para el autocompletado en tus consultas y recetas.
                  </p>
                </div>
                <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  Total registrados: {catalogoList.length}
                </span>
              </div>

              {/* Formulario para Agregar Nuevo Medicamento */}
              <form
                onSubmit={handleAgregarMedicamentoCatalogo}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Registrar Nuevo Medicamento en el Catálogo</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Se guardará en PostgreSQL para futuras recetas</span>
                </div>

                {mensajeCatalogo && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{mensajeCatalogo}</span>
                  </div>
                )}

                {errorCatalogo && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {errorCatalogo}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      value={nuevoMed.nombre_comercial}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, nombre_comercial: e.target.value }))}
                      placeholder="Ej. Sertal Compuesto 125mg"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Principio Activo *</label>
                    <input
                      type="text"
                      required
                      value={nuevoMed.principio_activo}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, principio_activo: e.target.value }))}
                      placeholder="Ej. Propinoxato + Clonixinato de Lisina"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Presentación</label>
                    <input
                      type="text"
                      value={nuevoMed.presentacion}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, presentacion: e.target.value }))}
                      placeholder="Ej. Tabletas recubiertas"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Dosis Habitual Sugerida</label>
                    <input
                      type="text"
                      value={nuevoMed.dosis_recomendada}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, dosis_recomendada: e.target.value }))}
                      placeholder="Ej. 1 tableta (125mg)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Frecuencia Sugerida</label>
                    <input
                      type="text"
                      value={nuevoMed.frecuencia_recomendada}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, frecuencia_recomendada: e.target.value }))}
                      placeholder="Ej. Cada 8 horas"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Duración Sugerida</label>
                    <input
                      type="text"
                      value={nuevoMed.duracion_recomendada}
                      onChange={(e) => setNuevoMed(prev => ({ ...prev, duracion_recomendada: e.target.value }))}
                      placeholder="Ej. 3 a 5 días"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={guardandoMed}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {guardandoMed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                    <span>{guardandoMed ? 'Guardando en PostgreSQL...' : 'Agregar Medicamento al Catálogo'}</span>
                  </button>
                </div>
              </form>

              {/* Buscador y Listado del Catálogo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-800">Medicamentos Disponibles en Base de Datos</h4>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={busquedaCatalogo}
                        onChange={(e) => {
                          setBusquedaCatalogo(e.target.value);
                          cargarCatalogo(e.target.value, false);
                        }}
                        placeholder="Filtrar catálogo o buscar fármaco..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none text-slate-800"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleImportarOpenFDA}
                      disabled={sincronizandoFDA}
                      title="Consultar la API pública de OpenFDA y guardar resultados en PostgreSQL"
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
                    >
                      {sincronizandoFDA ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <Activity className="w-3.5 h-3.5 text-teal-400" />}
                      <span>{sincronizandoFDA ? 'Sincronizando...' : 'Importar de OpenFDA'}</span>
                    </button>
                  </div>
                </div>

                {cargandoCatalogo ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    <span className="text-xs">Consultando catálogo de medicamentos...</span>
                  </div>
                ) : catalogoList.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron medicamentos con ese criterio.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {catalogoList.map((item, idx) => (
                      <div
                        key={item.id_medicamento || idx}
                        className="p-4 rounded-xl border border-slate-200 hover:border-teal-200 bg-slate-50/50 flex flex-col justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-sm font-bold text-slate-800">{item.nombre_comercial}</h5>
                            <p className="text-xs text-teal-700 font-medium">{item.principio_activo}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                              {item.fuente || 'PostgreSQL'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleEliminarMedicamentoCatalogo(item.id_medicamento, item.nombre_comercial)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar medicamento del catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 grid grid-cols-2 gap-1 pt-2 border-t border-slate-200/60">
                          <span><strong>Presentación:</strong> {item.presentacion || 'N/A'}</span>
                          <span><strong>Dosis:</strong> {item.dosis_recomendada || 'N/A'}</span>
                          <span><strong>Frecuencia:</strong> {item.frecuencia_recomendada || 'N/A'}</span>
                          <span><strong>Duración:</strong> {item.duracion_recomendada || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA 4: Expedientes y Recetas */}
          {vistaActiva === 'expedientes' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800">
                  {isPatient ? 'Mis Recetas y Diagnósticos' : 'Expedientes Clínicos y Recetas Emitidas'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Historial médico de consultas completadas, diagnósticos y recetas electrónicas emitidas en la plataforma.
                </p>
              </div>

              {/* Lista de recetas y expedientes */}
              {cargandoRecetas ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="text-sm">Cargando expedientes clínicos desde la base de datos...</span>
                </div>
              ) : recetasList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-700">Sin recetas registradas</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {isPatient 
                      ? 'Aún no cuentas con recetas emitidas. Al finalizar una videoconsulta médica, aparecerán aquí.' 
                      : 'No has emitido recetas clínicas aún.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {recetasList.map(receta => (
                    <div 
                      key={receta.id_receta}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Cabecera de la receta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-800">
                              {receta.medico_nombres ? `${receta.medico_nombres} ${receta.medico_apellidos}` : 'Atención Médica'}
                            </h4>
                            <p className="text-xs text-teal-600 font-medium">{receta.especialidad || 'Telemedicina'}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-semibold text-slate-600 block">
                            {new Date(receta.created_at).toLocaleDateString('es-ES', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {receta.id_receta.substring(0, 8)}</span>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => generarRecetaPDF(receta, usuario)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Descargar Receta PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Diagnóstico */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico Médico</p>
                        <p className="text-sm font-semibold text-slate-800">{receta.diagnostico || 'Evaluación médica general completada'}</p>
                      </div>

                      {/* Medicamentos prescritos */}
                      {receta.medicamentos && receta.medicamentos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescripción Farmacológica
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {receta.medicamentos.map((med, idx) => (
                              <div key={idx} className="p-3.5 bg-teal-50/30 border border-teal-100 rounded-xl">
                                <p className="text-sm font-bold text-slate-800">{med.nombre}</p>
                                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                                  <p><span className="font-semibold text-slate-700">Dosis:</span> {med.dosis}</p>
                                  <p><span className="font-semibold text-slate-700">Frecuencia:</span> {med.frecuencia}</p>
                                  <p><span className="font-semibold text-slate-700">Duración:</span> {med.duracion}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Indicaciones Generales */}
                      {receta.indicaciones_generales && (
                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Indicaciones Generales: </span>
                          {receta.indicaciones_generales}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Modal de Perfil de Usuario (Tarea 5.4.4) */}
      <ModalPerfil
        isOpen={modalPerfilAbierto}
        onClose={() => setModalPerfilAbierto(false)}
        usuario={usuario}
        onPerfilActualizado={(datosActualizados) => {
          actualizarPerfilLocal(datosActualizados);
        }}
      />

      {/* Modal de Agendamiento de Citas (Tarea 5.4.8) */}
      <ModalAgendarCita
        isOpen={modalAgendarAbierto}
        onClose={() => {
          setModalAgendarAbierto(false);
          setMedicoPreseleccionado(null);
        }}
        medicoPreseleccionado={medicoPreseleccionado}
        usuario={usuario}
        onCitaAgendada={handleCitaAgendada}
      />

      {/* Modal de Detalles de Cita y Videollamada (Tarea 5.4.9) */}
      <ErrorBoundary>
        <ModalDetalleCita
          isOpen={modalDetalleAbierto}
          onClose={() => {
            setModalDetalleAbierto(false);
            setCitaSeleccionadaId(null);
          }}
          idCita={citaSeleccionadaId}
          onCitaActualizada={handleCitaAgendada}
          usuario={usuario}
        />
      </ErrorBoundary>
    </div>
  );
}
