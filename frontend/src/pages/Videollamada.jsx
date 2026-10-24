import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorOff, FileText, 
  Pill, Save, Loader2, AlertCircle, Camera, CheckCircle2, User, Mail, Phone,
  Stethoscope, Activity, Plus, Trash2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Videollamada() {
  const navigate = useNavigate();
  const { id: roomId } = useParams();
  const { usuario } = useAuth();

  const isMedico = usuario?.rol === 'MEDICO';

  // Referencias multimedia locales
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Registro de todos los MediaStreams para prevenir dispositivos huérfanos o fugas
  const activeStreamsRef = useRef(new Set());

  // Referencias para Compartir Pantalla (Tarea 5.5.3)
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Estados de control multimedia (Tarea 5.5.1 y 5.5.2)
  const [estadoPermiso, setEstadoPermiso] = useState('iniciando'); // 'iniciando' | 'concedido' | 'denegado'
  const [errorMultimedia, setErrorMultimedia] = useState('');
  const [micActivo, setMicActivo] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(true);

  // Estados del Expediente Clínico Dinámico y Cita (Tarea 5.5.6)
  const [cita, setCita] = useState(null);
  const [cargandoCita, setCargandoCita] = useState(true);
  const [diagnostico, setDiagnostico] = useState('');
  const [notasClinicas, setNotasClinicas] = useState('');
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [mensajeNotasGuardadas, setMensajeNotasGuardadas] = useState('');

  // Estados de Receta Médica Dinámica (Tarea 5.5.7)
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', frecuencia: '', duracion: '' }
  ]);
  const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
  const [emitirRecetaCargando, setEmitirRecetaCargando] = useState(false);
  const [mensajeRecetaExito, setMensajeRecetaExito] = useState(false);
  const [errorReceta, setErrorReceta] = useState('');

  // Estado de Compartir Pantalla (Tarea 5.5.3)
  const [compartiendoPantalla, setCompartiendoPantalla] = useState(false);

  // Estados del Cronómetro en Vivo (Tarea 5.5.4)
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

  // Estados de Colgar Llamada (Tarea 5.5.5)
  const [mostrarConfirmacionColgar, setMostrarConfirmacionColgar] = useState(false);

  // Detención segura de un stream específico y remoción del registro
  const detenerStreamTotal = (stream) => {
    if (!stream) return;
    try {
      if (typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[Videollamada] Error al detener track:', e);
          }
        });
      }
    } catch (e) {
      console.warn('[Videollamada] Error al procesar tracks:', e);
    }
    activeStreamsRef.current.delete(stream);
  };

  // Liberación absoluta e irrevocable de todo el hardware de captura (cámara, micrófono, pantalla)
  const liberarTodosLosDispositivos = () => {
    // 1. Detener streams registrados en activeStreamsRef
    activeStreamsRef.current.forEach(stream => {
      detenerStreamTotal(stream);
    });
    activeStreamsRef.current.clear();

    // 2. Detener stream de cámara/micrófono directo
    if (streamRef.current) {
      detenerStreamTotal(streamRef.current);
      streamRef.current = null;
    }

    // 3. Detener stream de pantalla compartida si estuviera activo
    if (screenStreamRef.current) {
      detenerStreamTotal(screenStreamRef.current);
      screenStreamRef.current = null;
    }

    // 4. Detener tracks que pudieran estar asignados directamente al elemento video DOM
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      detenerStreamTotal(localVideoRef.current.srcObject);
      localVideoRef.current.srcObject = null;
    }
    if (screenVideoRef.current && screenVideoRef.current.srcObject) {
      detenerStreamTotal(screenVideoRef.current.srcObject);
      screenVideoRef.current.srcObject = null;
    }
  };

  // Tarea 5.5.5: Liberación de recursos y colgar llamada de forma segura
  const handleSolicitarColgar = () => {
    setMostrarConfirmacionColgar(true);
  };

  const ejecutarColgar = () => {
    liberarTodosLosDispositivos();
    setCompartiendoPantalla(false);
    setCamaraActiva(false);
    setMicActivo(false);
    setMostrarConfirmacionColgar(false);
    navigate('/dashboard', { replace: true });
  };

  // Tarea 5.5.7: Métodos de gestión de la lista dinámica de medicamentos
  const agregarMedicamento = () => {
    setMedicamentos(prev => [...prev, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
  };

  const eliminarMedicamento = (index) => {
    if (medicamentos.length <= 1) {
      setMedicamentos([{ nombre: '', dosis: '', frecuencia: '', duracion: '' }]);
      return;
    }
    setMedicamentos(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarMedicamento = (index, campo, valor) => {
    setMedicamentos(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Tarea 5.5.7: Emisión formal de la consulta y receta médica en base de datos
  const handleFinalizarYEmitirReceta = async () => {
    if (!cita?.id_cita) return;

    if (!diagnostico.trim()) {
      setErrorReceta('Por favor ingrese un diagnóstico clínico antes de finalizar y emitir la receta.');
      return;
    }

    const medicamentosValidos = medicamentos
      .filter(m => m.nombre && m.nombre.trim().length > 0)
      .map(m => ({
        nombre: m.nombre.trim(),
        dosis: m.dosis ? m.dosis.trim() : '',
        frecuencia: m.frecuencia ? m.frecuencia.trim() : '',
        duracion: m.duracion ? m.duracion.trim() : ''
      }));

    try {
      setEmitirRecetaCargando(true);
      setErrorReceta('');
      const duracionMin = Math.max(1, Math.ceil(segundosTranscurridos / 60));

      await api.post('/consultas', {
        id_cita: cita.id_cita,
        diagnostico: diagnostico.trim(),
        notas_clinicas: notasClinicas.trim(),
        duracion_minutos: duracionMin,
        medicamentos: medicamentosValidos,
        indicaciones_generales: indicacionesGenerales.trim()
      });

      setMensajeRecetaExito(true);

      // Liberar todo el hardware multimedia antes de salir
      liberarTodosLosDispositivos();

      // Breve pausa para mostrar mensaje de éxito y redirigir al Dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('[Videollamada] Error al finalizar consulta y emitir receta:', err);
      setErrorReceta(err.message || 'Error al emitir receta y completar cita');
      setEmitirRecetaCargando(false);
    }
  };

  // Tarea 5.5.6: Carga dinámica del expediente de la cita y del paciente
  useEffect(() => {
    let cancelado = false;

    const cargarExpediente = async () => {
      try {
        setCargandoCita(true);
        if (roomId) {
          const res = await api.get(`/citas/${roomId}`);
          const data = res?.data || res;
          if (!cancelado && data) {
            setCita(data);
            if (data.diagnostico) setDiagnostico(data.diagnostico);
            if (data.notas_clinicas) setNotasClinicas(data.notas_clinicas);
            if (data.medicamentos) {
              let meds = data.medicamentos;
              if (typeof meds === 'string') {
                try { meds = JSON.parse(meds); } catch {}
              }
              if (Array.isArray(meds) && meds.length > 0) {
                setMedicamentos(meds);
              }
            }
            if (data.indicaciones_generales) {
              setIndicacionesGenerales(data.indicaciones_generales);
            }
          }
        } else {
          // Si entró directo a /sala sin :id, busca su cita activa
          const resCitas = await api.get('/citas');
          const lista = Array.isArray(resCitas) ? resCitas : (resCitas?.data || []);
          if (lista.length > 0) {
            const resDetalle = await api.get(`/citas/${lista[0].id_cita}`);
            const data = resDetalle?.data || resDetalle;
            if (!cancelado && data) {
              setCita(data);
              if (data.diagnostico) setDiagnostico(data.diagnostico);
              if (data.notas_clinicas) setNotasClinicas(data.notas_clinicas);
              if (data.medicamentos) {
                let meds = data.medicamentos;
                if (typeof meds === 'string') {
                  try { meds = JSON.parse(meds); } catch {}
                }
                if (Array.isArray(meds) && meds.length > 0) {
                  setMedicamentos(meds);
                }
              }
              if (data.indicaciones_generales) {
                setIndicacionesGenerales(data.indicaciones_generales);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Videollamada] Error al cargar expediente:', err.message);
      } finally {
        if (!cancelado) setCargandoCita(false);
      }
    };

    cargarExpediente();

    return () => {
      cancelado = true;
    };
  }, [roomId]);

  // Tarea 5.5.6: Persistencia de notas clínicas y diagnóstico en BD
  const handleGuardarNotas = async () => {
    if (!cita?.id_cita) return;
    try {
      setGuardandoNotas(true);
      setMensajeNotasGuardadas('');
      const duracionMin = Math.max(1, Math.ceil(segundosTranscurridos / 60));

      await api.put('/consultas/notas', {
        id_cita: cita.id_cita,
        diagnostico: diagnostico.trim() || 'En evaluación clínica',
        notas_clinicas: notasClinicas.trim(),
        duracion_minutos: duracionMin
      });

      setMensajeNotasGuardadas('Notas guardadas en BD');
      setTimeout(() => setMensajeNotasGuardadas(''), 3000);
    } catch (err) {
      console.error('Error al guardar notas:', err);
      alert('Error al guardar notas: ' + err.message);
    } finally {
      setGuardandoNotas(false);
    }
  };

  // Renderizado seguro de antecedentes clínicos (JSONB en PostgreSQL)
  const renderDatosClinicos = (datos) => {
    if (!datos) return <span className="text-slate-400 italic">Sin antecedentes registrados</span>;

    let datosObj = datos;
    if (typeof datos === 'string') {
      try {
        datosObj = JSON.parse(datos);
      } catch {
        return <span className="text-slate-600">{datos}</span>;
      }
    }

    if (typeof datosObj !== 'object' || datosObj === null) {
      return <span className="text-slate-600">{String(datosObj)}</span>;
    }

    const alergias = Array.isArray(datosObj.alergias) 
      ? datosObj.alergias.join(', ') 
      : (datosObj.alergias || null);
    const tipoSangre = datosObj.tipo_sangre || datosObj.tipoSangre || null;
    const antecedentes = datosObj.antecedentes || null;

    return (
      <div className="space-y-1 mt-1 text-xs text-slate-600">
        {tipoSangre && (
          <p className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Tipo de Sangre:</span>
            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 font-bold rounded text-[11px] border border-rose-100">
              {tipoSangre}
            </span>
          </p>
        )}
        {alergias && (
          <p className="flex items-start gap-1.5">
            <span className="font-semibold text-slate-700">Alergias:</span>
            <span className="text-rose-600 font-medium">{alergias}</span>
          </p>
        )}
        {antecedentes && (
          <p className="flex items-start gap-1.5">
            <span className="font-semibold text-slate-700">Condiciones:</span>
            <span className="text-slate-600">{antecedentes}</span>
          </p>
        )}
      </div>
    );
  };

  // Intervalo activo de medición de duración de la sesión
  useEffect(() => {
    const cronometroInterval = setInterval(() => {
      setSegundosTranscurridos(prev => prev + 1);
    }, 1000);

    return () => clearInterval(cronometroInterval);
  }, []);

  // Formato HH:MM:SS para el cronómetro
  const formatearCronometro = (totalSegundos) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(horas)}:${pad(minutos)}:${pad(segs)}`;
  };

  // Tarea 5.5.2: Control en tiempo real de Micrófono
  const toggleMicrofono = () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const nuevoEstado = !micActivo;
    audioTracks.forEach(track => {
      track.enabled = nuevoEstado;
    });
    setMicActivo(nuevoEstado);
  };

  // Tarea 5.5.2: Control en tiempo real de Cámara
  const toggleCamara = () => {
    if (!streamRef.current) return;
    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const nuevoEstado = !camaraActiva;
    videoTracks.forEach(track => {
      track.enabled = nuevoEstado;
    });
    setCamaraActiva(nuevoEstado);

    if (nuevoEstado && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  };

  // Tarea 5.5.3: Transmisión de Pantalla mediante getDisplayMedia
  const iniciarCompartirPantalla = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Tu navegador no soporta la función de captura de pantalla (getDisplayMedia).');
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      activeStreamsRef.current.add(screenStream);
      screenStreamRef.current = screenStream;
      setCompartiendoPantalla(true);

      // Sincronizar detención cuando el usuario pulsa el botón nativo del navegador ("Dejar de compartir")
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          detenerCompartirPantalla();
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        console.log('[Videollamada] Selección de pantalla cancelada por el usuario');
      } else {
        console.error('[Videollamada] Error al compartir pantalla:', err);
      }
    }
  };

  const detenerCompartirPantalla = () => {
    if (screenStreamRef.current) {
      detenerStreamTotal(screenStreamRef.current);
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setCompartiendoPantalla(false);
  };

  const toggleCompartirPantalla = () => {
    if (compartiendoPantalla) {
      detenerCompartirPantalla();
    } else {
      iniciarCompartirPantalla();
    }
  };

  // Asegurar la asignación del stream de pantalla cuando el video se renderiza
  useEffect(() => {
    if (compartiendoPantalla && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [compartiendoPantalla]);

  // Asegurar la asignación y reproducción del stream de la cámara local PiP
  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      if (localVideoRef.current.srcObject !== streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [estadoPermiso, camaraActiva]);

  // Tarea 5.5.1: Captura Multimedia Real mediante getUserMedia con Blindaje Anti-Fugas
  useEffect(() => {
    let montado = true;

    const iniciarCapturaMultimedia = async () => {
      try {
        setEstadoPermiso('iniciando');
        setErrorMultimedia('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador no soporta la API WebRTC de captura de medios.');
        }

        // Solicitud de acceso a cámara y micrófono
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });

        // Si el componente se desmontó mientras el navegador pedía permiso o iniciaba el hardware
        if (!montado) {
          console.log('[Videollamada] Componente desmontado durante getUserMedia. Deteniendo pistas de hardware inmediatamente.');
          detenerStreamTotal(stream);
          return;
        }

        // Si ya existía un stream previo en la referencia, detenerlo para evitar dispositivos duplicados
        if (streamRef.current && streamRef.current !== stream) {
          detenerStreamTotal(streamRef.current);
        }

        activeStreamsRef.current.add(stream);
        streamRef.current = stream;

        // Asignación del stream al elemento de video PiP
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        setEstadoPermiso('concedido');
      } catch (err) {
        if (!montado) return;
        console.warn('[Videollamada] Excepción al capturar cámara/micrófono:', err.name, err.message);
        setEstadoPermiso('denegado');

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMultimedia('Permiso denegado por el usuario o navegador.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMultimedia('No se detectó cámara o micrófono disponible.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setErrorMultimedia('La cámara o micrófono ya está siendo usado por otra aplicación.');
        } else {
          setErrorMultimedia(err.message || 'Error al conectar con dispositivos multimedia.');
        }
      }
    };

    iniciarCapturaMultimedia();

    // Listeners de ventana para apagar la cámara y micrófono si se recarga o cierra el navegador
    const onWindowUnload = () => {
      liberarTodosLosDispositivos();
    };
    window.addEventListener('beforeunload', onWindowUnload);
    window.addEventListener('pagehide', onWindowUnload);

    // Limpieza estricta al desmontar el componente (navegación o colgado)
    return () => {
      montado = false;
      window.removeEventListener('beforeunload', onWindowUnload);
      window.removeEventListener('pagehide', onWindowUnload);
      liberarTodosLosDispositivos();
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">
      {/* Panel Izquierdo - Video (60%) */}
      <div className="flex-1 flex flex-col relative">
        {/* Header Video */}
        <div className="h-16 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/80 shadow-xs">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <span className="text-white font-mono font-semibold text-xs sm:text-sm tracking-wider">
                {formatearCronometro(segundosTranscurridos)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">En directo</span>
          </div>
          <div className="text-slate-300 font-medium bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700 text-xs sm:text-sm">
            {cargandoCita ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> Cargando datos...
              </span>
            ) : cita ? (
              isMedico 
                ? `Paciente: ${cita.paciente_nombres} ${cita.paciente_apellidos}`
                : `Dr. ${cita.medico_nombres} ${cita.medico_apellidos} (${cita.especialidad || 'Especialista'})`
            ) : (
              isMedico ? 'Paciente en Consulta' : 'Consulta con Médico Especialista'
            )}
            {roomId && <span className="ml-2 font-mono text-teal-400 text-xs">({roomId.substring(0, 8)})</span>}
          </div>
        </div>

        {/* Video Principal (Remoto o Pantalla Compartida - Tarea 5.5.3) */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {compartiendoPantalla ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              {/* Badge flotante de estado de pantalla compartida */}
              <div className="absolute top-20 left-6 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-3 z-10 animate-fadeIn">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                  <MonitorUp className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Transmitiendo tu pantalla</p>
                  <p className="text-[10px] text-slate-400">Tu pantalla se comparte en tiempo real con la consulta</p>
                </div>
                <button
                  type="button"
                  onClick={detenerCompartirPantalla}
                  className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Dejar de compartir
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <VideoOff className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">Esperando conexión de cámara remota...</p>
            </div>
          )}

          {/* Video Secundario - Cámara Local PiP (Tarea 5.5.1) */}
          <div className="absolute bottom-28 right-8 w-60 h-40 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center group hover:border-teal-500 transition-all z-20">
            {/* El video local se mantiene siempre montado en el DOM para preservar el stream y srcObject */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                estadoPermiso === 'concedido' && camaraActiva ? 'block' : 'hidden'
              }`}
            />

            {/* Fallback cuando la cámara está apagada voluntariamente por el usuario */}
            {estadoPermiso === 'concedido' && !camaraActiva && (
              <div className="flex flex-col items-center justify-center p-3 text-center bg-slate-900 w-full h-full animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm mb-1.5 border border-slate-700 shadow-inner">
                  {usuario?.nombres ? usuario.nombres.substring(0, 2).toUpperCase() : 'TU'}
                </div>
                <span className="text-[11px] font-medium text-slate-400">Cámara desactivada</span>
              </div>
            )}

            {/* Estado conectando */}
            {estadoPermiso === 'iniciando' && (
              <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                <span className="text-xs font-medium text-slate-300">Conectando cámara...</span>
              </div>
            )}

            {/* Estado denegado o error */}
            {estadoPermiso === 'denegado' && (
              <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400">
                <VideoOff className="w-8 h-8 text-rose-500/80 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">Cámara Inactiva</span>
                {errorMultimedia && (
                  <p className="text-[10px] text-amber-400/90 mt-1 line-clamp-2 px-1 text-center">
                    {errorMultimedia}
                  </p>
                )}
              </div>
            )}

            {/* Badge de Estado del Usuario Local en el PiP */}
            <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] text-white font-medium flex items-center gap-1.5 border border-slate-700/80 shadow-xs">
              <div className={`w-2 h-2 rounded-full ${
                estadoPermiso === 'concedido' && camaraActiva
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' 
                  : estadoPermiso === 'concedido' && !camaraActiva
                  ? 'bg-amber-400'
                  : estadoPermiso === 'iniciando'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`} />
              <span>{usuario?.nombres ? `${usuario.nombres} (Tú)` : 'Mi Cámara'}</span>
              {!micActivo && (
                <span className="text-rose-400 ml-0.5 inline-flex items-center" title="Micrófono silenciado">
                  <MicOff className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controles Inferiores (Tarea 5.5.2) */}
        <div className="h-24 bg-slate-900 flex items-center justify-center gap-6 px-6 absolute bottom-0 w-full border-t border-slate-800 z-30">
          {/* Botón Silenciar / Activar Micrófono */}
          <button 
            type="button"
            onClick={toggleMicrofono}
            disabled={estadoPermiso !== 'concedido'}
            title={micActivo ? "Silenciar micrófono" : "Activar micrófono"}
            className={`p-4 rounded-full transition-all border cursor-pointer ${
              !micActivo 
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-500'
            } ${estadoPermiso !== 'concedido' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {micActivo ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Botón Apagar / Encender Cámara */}
          <button 
            type="button"
            onClick={toggleCamara}
            disabled={estadoPermiso !== 'concedido'}
            title={camaraActiva ? "Apagar cámara" : "Encender cámara"}
            className={`p-4 rounded-full transition-all border cursor-pointer ${
              !camaraActiva 
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-500'
            } ${estadoPermiso !== 'concedido' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {camaraActiva ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Botón Compartir Pantalla (Tarea 5.5.3) */}
          <button 
            type="button"
            onClick={toggleCompartirPantalla}
            title={compartiendoPantalla ? "Dejar de compartir pantalla" : "Compartir pantalla"}
            className={`p-4 rounded-full transition-all border hidden sm:block cursor-pointer ${
              compartiendoPantalla
                ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-500 shadow-lg shadow-teal-600/30 ring-2 ring-teal-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            {compartiendoPantalla ? <MonitorOff className="w-6 h-6" /> : <MonitorUp className="w-6 h-6" />}
          </button>

          {/* Botón Colgar (Tarea 5.5.5) */}
          <button 
            type="button"
            onClick={handleSolicitarColgar}
            className="p-4 bg-rose-600 hover:bg-rose-500 rounded-full text-white transition-all shadow-lg shadow-rose-600/20 hover:scale-105 cursor-pointer"
            title="Colgar y volver al Dashboard"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Panel Derecho - Notas Clínicas (40%) */}
      <div className="w-[450px] bg-white flex flex-col border-l border-slate-200 z-20 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Expediente en Curso</h2>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Ficha del Paciente (Tarea 5.5.6) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 flex items-center gap-1">
                <User className="w-3 h-3" /> Ficha del Paciente
              </span>
              {cita?.estado && (
                <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {cita.estado}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {cita ? `${cita.paciente_nombres} ${cita.paciente_apellidos}` : 'Cargando información del paciente...'}
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                {cita?.paciente_correo && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {cita.paciente_correo}
                  </span>
                )}
                {cita?.paciente_telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {cita.paciente_telefono}
                  </span>
                )}
              </div>
            </div>

            {cita?.paciente_datos_clinicos && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">Antecedentes Clínicos:</span>
                {renderDatosClinicos(cita.paciente_datos_clinicos)}
              </div>
            )}
          </div>

          {/* Diagnóstico Principal (Tarea 5.5.6) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" /> Diagnóstico Principal
              </span>
              {isMedico && (
                <span className="text-[10px] text-teal-600 font-normal">Obligatorio</span>
              )}
            </label>
            {isMedico ? (
              <input
                type="text"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Ej. Faringitis aguda de origen viral..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all shadow-xs text-slate-800"
              />
            ) : (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {diagnostico || 'Evaluación clínica en progreso por el médico especialista'}
              </p>
            )}
          </div>

          {/* Notas Clínicas y Síntomas Reportados (Tarea 5.5.6) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Observaciones y Síntomas
              </label>
              {mensajeNotasGuardadas && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {mensajeNotasGuardadas}
                </span>
              )}
            </div>
            {isMedico ? (
              <>
                <textarea 
                  value={notasClinicas}
                  onChange={(e) => setNotasClinicas(e.target.value)}
                  className="w-full h-32 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none resize-none text-sm text-slate-700 transition-all shadow-inner"
                  placeholder="Escriba las observaciones clínicas, síntomas reportados y evolución del paciente aquí..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleGuardarNotas}
                    disabled={guardandoNotas || !cita}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {guardandoNotas ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> : <Save className="w-3.5 h-3.5 text-teal-600" />}
                    <span>{guardandoNotas ? 'Guardando en BD...' : 'Guardar Notas Clínicas'}</span>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                {notasClinicas || 'Sin notas clínicas registradas todavía.'}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Receta Médica Dinámica (Tarea 5.5.7) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Pill className="w-4 h-4 text-teal-600" /> Receta Médica Oficial
            </label>
            
            {isMedico ? (
              <div className="space-y-3">
                {medicamentos.map((med, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-600" /> Medicamento #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarMedicamento(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar este medicamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={med.nombre}
                      onChange={(e) => actualizarMedicamento(idx, 'nombre', e.target.value)}
                      placeholder="Nombre del fármaco (Ej. Paracetamol 500mg)" 
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs text-slate-800"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={med.dosis}
                        onChange={(e) => actualizarMedicamento(idx, 'dosis', e.target.value)}
                        placeholder="Dosis (Ej. 1 tab)" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs text-slate-800"
                      />
                      <input 
                        type="text" 
                        value={med.frecuencia}
                        onChange={(e) => actualizarMedicamento(idx, 'frecuencia', e.target.value)}
                        placeholder="Frecuencia (c/8h)" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs text-slate-800"
                      />
                      <input 
                        type="text" 
                        value={med.duracion}
                        onChange={(e) => actualizarMedicamento(idx, 'duracion', e.target.value)}
                        placeholder="Duración (3 días)" 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs text-slate-800"
                      />
                    </div>
                  </div>
                ))}

                <button 
                  type="button"
                  onClick={agregarMedicamento}
                  className="w-full py-2.5 border-2 border-dashed border-teal-200 text-teal-700 rounded-xl text-xs font-semibold hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir otro medicamento
                </button>

                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Indicaciones Generales y Cuidados
                  </label>
                  <textarea
                    value={indicacionesGenerales}
                    onChange={(e) => setIndicacionesGenerales(e.target.value)}
                    rows={2}
                    placeholder="Ej. Abundante hidratación oral, reposo relativo durante 48 horas..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none resize-none text-slate-700 shadow-inner"
                  />
                </div>

                {errorReceta && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorReceta}</span>
                  </div>
                )}

                {mensajeRecetaExito && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 animate-fadeIn font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Receta emitida y consulta completada con éxito. Redirigiendo...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {cita?.estado === 'COMPLETADA' || medicamentos.some(m => m.nombre) ? (
                  <>
                    {medicamentos.filter(m => m.nombre).length > 0 ? (
                      <div className="space-y-2">
                        {medicamentos.filter(m => m.nombre).map((m, idx) => (
                          <div key={idx} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                            <p className="font-bold text-slate-800 text-xs">{m.nombre}</p>
                            <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-2">
                              {m.dosis && <span><strong>Dosis:</strong> {m.dosis}</span>}
                              {m.frecuencia && <span><strong>Frecuencia:</strong> {m.frecuencia}</span>}
                              {m.duracion && <span><strong>Duración:</strong> {m.duracion}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No se prescribieron medicamentos farmacológicos adicionales.</p>
                    )}
                    {indicacionesGenerales && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <strong>Indicaciones generales:</strong> {indicacionesGenerales}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-1">
                    <Pill className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Receta en curso</p>
                    <p className="text-[11px] text-slate-400">
                      El médico tratante emitirá su receta electrónica oficial al culminar la sesión.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón Guardar / Finalizar y Emitir Receta (Tarea 5.5.7) */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {isMedico ? (
            cita?.estado === 'COMPLETADA' ? (
              <button 
                type="button"
                disabled
                className="w-full py-3.5 bg-slate-200 text-slate-500 rounded-xl font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Consulta Completada
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleFinalizarYEmitirReceta}
                disabled={emitirRecetaCargando || !cita}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                {emitirRecetaCargando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Emitiendo Receta y Finalizando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Finalizar y Emitir Receta</span>
                  </>
                )}
              </button>
            )
          ) : (
            <button 
              type="button"
              onClick={handleSolicitarColgar}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <PhoneOff className="w-5 h-5 text-rose-400" />
              <span>Finalizar Llamada</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmación para Colgar (Tarea 5.5.5) */}
      {mostrarConfirmacionColgar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMostrarConfirmacionColgar(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 animate-scaleUp text-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <PhoneOff className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center">
              ¿Deseas finalizar la llamada?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              Se liberarán de inmediato la cámara y el micrófono de tu dispositivo y regresarás de forma segura al Panel Principal.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionColgar(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Continuar Consulta
              </button>
              <button
                type="button"
                onClick={ejecutarColgar}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Colgar y Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
