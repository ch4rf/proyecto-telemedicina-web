import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorOff, FileText, 
  Pill, Save, Loader2, AlertCircle, Camera, CheckCircle2, User, Mail, Phone,
  Stethoscope, Activity, Plus, Trash2, Clock, ChevronDown, ChevronUp,
  MessageSquare, Send, X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

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

  // Referencias y estados WebRTC / Socket.io en Tiempo Real (Tarea 8.2.1 y 8.2.2)
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const candidatosPendientesRef = useRef([]);
  const [remotoConectado, setRemotoConectado] = useState(false);
  const [nombreRemoto, setNombreRemoto] = useState('');
  const [remotoCamaraActiva, setRemotoCamaraActiva] = useState(true);
  const [remotoMicActivo, setRemotoMicActivo] = useState(true);
  const [remotoCompartiendoPantalla, setRemotoCompartiendoPantalla] = useState(false);
  const [remotoSalioDeLlamada, setRemotoSalioDeLlamada] = useState(false);

  // Estados y referencias del Chat Clínico en Vivo (Tarea 8.2.2)
  const [mostrarChat, setMostrarChat] = useState(false);
  const mostrarChatRef = useRef(false);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [textoMensajeChat, setTextoMensajeChat] = useState('');
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const chatFinRef = useRef(null);

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

  // Estados de Historial Clínico Previo del Paciente (Tarea 7.2.2)
  const [historialPrevio, setHistorialPrevio] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mostrarHistorialPrevio, setMostrarHistorialPrevio] = useState(false);

  // Estados de Autocompletado del Catálogo de Medicamentos (Tarea 7.3.3)
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState([]);
  const [indiceAutocompleteActivo, setIndiceAutocompleteActivo] = useState(null);

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

    // 5. Cerrar conexión WebRTC y desconectar Socket.io de la sala
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('[Videollamada] Error al cerrar peerConnection:', e);
      }
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    if (socketRef.current) {
      try {
        socketRef.current.emit('salir-sala');
        socketRef.current.disconnect();
      } catch (e) {
        console.warn('[Videollamada] Error al desconectar socket:', e);
      }
      socketRef.current = null;
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

  // Tarea 7.3.3: Búsqueda y autocompletado con el catálogo de medicamentos en PostgreSQL / OpenFDA
  useEffect(() => {
    if (!isMedico) return;
    let cancelado = false;
    api.get('/consultas/medicamentos/catalogo?q=')
      .then(res => {
        const lista = Array.isArray(res) ? res : (res?.data || []);
        if (!cancelado) setCatalogoMedicamentos(lista);
      })
      .catch(err => console.warn('[Videollamada] Aviso al cargar catálogo de medicamentos:', err.message));
    return () => { cancelado = true; };
  }, [isMedico]);

  const handleCambioNombreMedicamento = async (index, valor) => {
    actualizarMedicamento(index, 'nombre', valor);
    setIndiceAutocompleteActivo(index);
    if (valor && valor.trim().length >= 2) {
      try {
        const res = await api.get(`/consultas/medicamentos/catalogo?q=${encodeURIComponent(valor.trim())}`);
        const lista = Array.isArray(res) ? res : (res?.data || []);
        if (lista.length > 0) {
          setCatalogoMedicamentos(lista);
        }
      } catch (err) {
        console.warn('[Videollamada] Error buscando en catálogo:', err.message);
      }
    }
  };

  const seleccionarMedicamentoCatalogo = (index, item) => {
    setMedicamentos(prev => {
      const copia = [...prev];
      copia[index] = {
        nombre: item.nombre_comercial || '',
        dosis: item.dosis_recomendada || copia[index].dosis || '',
        frecuencia: item.frecuencia_recomendada || copia[index].frecuencia || '',
        duracion: item.duracion_recomendada || copia[index].duracion || ''
      };
      return copia;
    });
    setIndiceAutocompleteActivo(null);
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
          const citaActiva = lista.find(c => c.estado === 'PROGRAMADA');
          if (citaActiva) {
            const resDetalle = await api.get(`/citas/${citaActiva.id_cita}`);
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

  // Tarea 7.2.2: Cargar historial clínico de consultas previas del paciente (RF-13 y RN-05)
  useEffect(() => {
    let cancelado = false;
    const cargarHistorialPaciente = async () => {
      if (!cita?.id_paciente) return;
      try {
        setCargandoHistorial(true);
        const res = await api.get(`/consultas/paciente/${cita.id_paciente}/historial`);
        const lista = Array.isArray(res) ? res : (res?.data || []);
        if (!cancelado) {
          setHistorialPrevio(lista);
        }
      } catch (err) {
        console.warn('[Videollamada] No se pudo cargar el historial clínico previo:', err.message);
      } finally {
        if (!cancelado) setCargandoHistorial(false);
      }
    };
    cargarHistorialPaciente();
    return () => {
      cancelado = true;
    };
  }, [cita?.id_paciente]);

  // Si la cita está CANCELADA, liberar cámara/micrófono de inmediato
  useEffect(() => {
    if (cita?.estado === 'CANCELADA') {
      liberarTodosLosDispositivos();
    }
  }, [cita?.estado]);

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

    if (socketRef.current) {
      socketRef.current.emit('estado-medios', {
        roomId: cita?.url_videollamada || cita?.id_cita || roomId,
        camaraActiva,
        micActivo: nuevoEstado,
        compartiendoPantalla
      });
    }
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

    if (socketRef.current) {
      socketRef.current.emit('estado-medios', {
        roomId: cita?.url_videollamada || cita?.id_cita || roomId,
        camaraActiva: nuevoEstado,
        micActivo,
        compartiendoPantalla
      });
    }
  };

  // Tarea 5.5.3 y Tarea 8.2.2: Transmisión de Pantalla mediante getDisplayMedia y reemplazo de pista en vivo (replaceTrack)
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

      const videoTrack = screenStream.getVideoTracks()[0];

      // Tarea 8.2.2: Enviar el video de la pantalla compartida en tiempo real al otro participante
      if (videoTrack && peerConnectionRef.current) {
        try {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        } catch (errReplace) {
          console.warn('[WebRTC] No se pudo reemplazar el track por pantalla compartida:', errReplace);
        }
      }

      if (socketRef.current) {
        socketRef.current.emit('estado-medios', {
          roomId: cita?.url_videollamada || cita?.id_cita || roomId,
          camaraActiva,
          micActivo,
          compartiendoPantalla: true
        });
      }

      // Sincronizar detención cuando el usuario pulsa el botón nativo del navegador ("Dejar de compartir")
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

  const detenerCompartirPantalla = async () => {
    if (screenStreamRef.current) {
      detenerStreamTotal(screenStreamRef.current);
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setCompartiendoPantalla(false);

    // Tarea 8.2.2: Restaurar la pista de cámara web en la conexión WebRTC cuando deja de compartir pantalla
    if (peerConnectionRef.current && streamRef.current) {
      const camTrack = streamRef.current.getVideoTracks()[0] || null;
      if (camTrack) {
        try {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(camTrack);
          }
        } catch (errRestore) {
          console.warn('[WebRTC] Error al restaurar pista de cámara:', errRestore);
        }
      }
    }

    if (socketRef.current) {
      socketRef.current.emit('estado-medios', {
        roomId: cita?.url_videollamada || cita?.id_cita || roomId,
        camaraActiva,
        micActivo,
        compartiendoPantalla: false
      });
    }
  };

  const toggleCompartirPantalla = () => {
    if (compartiendoPantalla) {
      detenerCompartirPantalla();
    } else {
      iniciarCompartirPantalla();
    }
  };

  // Tarea 8.2.2: Control de apertura y envío de mensajes del Chat Clínico en Vivo
  const togglePanelChat = () => {
    setMostrarChat(prev => {
      const nuevo = !prev;
      mostrarChatRef.current = nuevo;
      if (nuevo) {
        setMensajesNoLeidos(0);
      }
      return nuevo;
    });
  };

  const handleEnviarMensajeChat = (e) => {
    e.preventDefault();
    const texto = textoMensajeChat.trim();
    if (!texto || !socketRef.current) return;

    const codigoSala = cita?.url_videollamada || cita?.id_cita || roomId;
    const nombreAutor = usuario?.nombres
      ? `${usuario.nombres} ${usuario.apellidos || ''}`.trim()
      : (isMedico ? 'Médico' : 'Paciente');

    socketRef.current.emit('mensaje-chat', {
      roomId: codigoSala,
      texto,
      autor: nombreAutor,
      rol: usuario?.rol || (isMedico ? 'MEDICO' : 'PACIENTE'),
      hora: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
    });

    setTextoMensajeChat('');
  };

  useEffect(() => {
    if (mostrarChat && chatFinRef.current) {
      chatFinRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajesChat, mostrarChat]);

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

  // Asegurar la asignación del stream remoto al elemento <video ref={remoteVideoRef}>
  useEffect(() => {
    if (remotoConectado && remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remotoConectado, remotoCamaraActiva, compartiendoPantalla]);

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

  // Tarea 8.2.1 y 8.2.2: Conexión P2P en Tiempo Real (WebRTC + Socket.io) y Chat Clínico entre Médico y Paciente
  const codigoSalaCanonico = cita?.url_videollamada || cita?.id_cita || roomId;

  useEffect(() => {
    if (cargandoCita || estadoPermiso === 'iniciando' || !codigoSalaCanonico || cita?.estado === 'CANCELADA') {
      return;
    }

    let activo = true;
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    const datosUsuarioLocal = {
      nombre: usuario?.nombres ? `${usuario.nombres} ${usuario.apellidos || ''}`.trim() : (isMedico ? 'Médico' : 'Paciente'),
      rol: usuario?.rol || (isMedico ? 'MEDICO' : 'PACIENTE')
    };

    const procesarCandidatosPendientes = async (pc) => {
      while (candidatosPendientesRef.current.length > 0) {
        const cand = candidatosPendientesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('[WebRTC] Error al agregar candidato ICE pendiente:', err);
        }
      }
    };

    const crearPeerConnection = (targetSocketId) => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      const streamRemoto = new MediaStream();
      remoteStreamRef.current = streamRemoto;

      // Adjuntar pistas locales de cámara/micrófono (o pantalla si está compartiendo)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current);
        });
        if (screenStreamRef.current) {
          const screenTrack = screenStreamRef.current.getVideoTracks()[0];
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (screenTrack && sender) {
            sender.replaceTrack(screenTrack).catch(() => {});
          }
        }
      } else {
        // Si en esta ventana no hay cámara disponible (ej. usada por otro navegador en la misma PC), habilitar recepción de video/audio
        try {
          pc.addTransceiver('video', { direction: 'recvonly' });
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch (e) {
          console.warn('[WebRTC] Aviso al agregar transceivers:', e);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket.connected) {
          socket.emit('webrtc-ice-candidate', {
            roomId: codigoSalaCanonico,
            to: targetSocketId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        if (!activo) return;
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
        } else if (event.track) {
          streamRemoto.addTrack(event.track);
          remoteStreamRef.current = streamRemoto;
        }
        setRemotoConectado(true);
        if (remoteVideoRef.current && remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (!activo) return;
        if (pc.connectionState === 'connected') {
          setRemotoConectado(true);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setRemotoConectado(false);
        }
      };

      return pc;
    };

    socket.on('connect', () => {
      socket.emit('unirse-sala', {
        roomId: codigoSalaCanonico,
        usuario: datosUsuarioLocal
      });
    });

    // Cuando entramos y ya había otro participante en la sala -> iniciamos la oferta WebRTC
    socket.on('usuarios-en-sala', async ({ participantes }) => {
      if (!activo || !Array.isArray(participantes) || participantes.length === 0) return;
      const otro = participantes[0];
      if (otro?.usuario?.nombre) {
        setNombreRemoto(otro.usuario.nombre);
      }
      setRemotoSalioDeLlamada(false);
      setRemotoConectado(true);

      try {
        const pc = crearPeerConnection(otro.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', {
          roomId: codigoSalaCanonico,
          to: otro.socketId,
          offer: pc.localDescription
        });
        socket.emit('estado-medios', {
          roomId: codigoSalaCanonico,
          camaraActiva: Boolean(streamRef.current && camaraActiva),
          micActivo: Boolean(streamRef.current && micActivo),
          compartiendoPantalla: Boolean(screenStreamRef.current)
        });
      } catch (err) {
        console.error('[WebRTC] Error creando oferta SDP:', err);
      }
    });

    // Cuando un nuevo participante se une después de nosotros
    socket.on('usuario-conectado', ({ usuario: infoRemoto }) => {
      if (!activo) return;
      if (infoRemoto?.nombre) {
        setNombreRemoto(infoRemoto.nombre);
      }
      setRemotoConectado(true);
      socket.emit('estado-medios', {
        roomId: codigoSalaCanonico,
        camaraActiva: Boolean(streamRef.current && camaraActiva),
        micActivo: Boolean(streamRef.current && micActivo),
        compartiendoPantalla: Boolean(screenStreamRef.current)
      });
    });

    // Recibir oferta SDP y responder con answer SDP
    socket.on('webrtc-offer', async ({ from, offer, usuario: infoRemoto }) => {
      if (!activo || !offer) return;
      if (infoRemoto?.nombre) {
        setNombreRemoto(infoRemoto.nombre);
      }
      setRemotoConectado(true);

      try {
        const pc = crearPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await procesarCandidatosPendientes(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          roomId: codigoSalaCanonico,
          to: from,
          answer: pc.localDescription
        });
        socket.emit('estado-medios', {
          roomId: codigoSalaCanonico,
          camaraActiva: Boolean(streamRef.current && camaraActiva),
          micActivo: Boolean(streamRef.current && micActivo),
          compartiendoPantalla: Boolean(screenStreamRef.current)
        });
      } catch (err) {
        console.error('[WebRTC] Error procesando oferta SDP:', err);
      }
    });

    // Recibir respuesta SDP
    socket.on('webrtc-answer', async ({ answer, usuario: infoRemoto }) => {
      if (!activo || !answer || !peerConnectionRef.current) return;
      if (infoRemoto?.nombre) {
        setNombreRemoto(infoRemoto.nombre);
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await procesarCandidatosPendientes(peerConnectionRef.current);
      } catch (err) {
        console.error('[WebRTC] Error estableciendo respuesta SDP:', err);
      }
    });

    // Recibir candidato ICE
    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (!activo || !candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error agregando candidato ICE:', err);
        }
      } else {
        candidatosPendientesRef.current.push(candidate);
      }
    });

    // Sincronización de estado de cámara/micrófono/pantalla del otro participante
    socket.on('estado-medios-remoto', ({ camaraActiva: camRemota, micActivo: micRemoto, compartiendoPantalla: pantallaRemota }) => {
      if (!activo) return;
      if (typeof camRemota === 'boolean') setRemotoCamaraActiva(camRemota);
      if (typeof micRemoto === 'boolean') setRemotoMicActivo(micRemoto);
      if (typeof pantallaRemota === 'boolean') setRemotoCompartiendoPantalla(pantallaRemota);
    });

    // Tarea 8.2.2: Recepción de mensajes del Chat Clínico en Tiempo Real
    socket.on('nuevo-mensaje-chat', (mensaje) => {
      if (!activo || !mensaje) return;
      setMensajesChat(prev => [...prev, mensaje]);
      if (!mostrarChatRef.current && mensaje.senderSocketId !== socket.id) {
        setMensajesNoLeidos(prev => prev + 1);
      }
    });

    // Cuando el otro participante sale o se desconecta
    socket.on('usuario-desconectado', ({ usuario: infoRemoto }) => {
      if (!activo) return;
      if (infoRemoto?.nombre) {
        setNombreRemoto(infoRemoto.nombre);
      }
      setRemotoConectado(false);
      setRemotoCompartiendoPantalla(false);
      setRemotoSalioDeLlamada(true);
      if (!activo) return;
      setRemotoConectado(false);
      setRemotoCompartiendoPantalla(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      remoteStreamRef.current = null;
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }
    });

    return () => {
      activo = false;
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch {}
        peerConnectionRef.current = null;
      }
      try {
        socket.emit('salir-sala');
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [cargandoCita, estadoPermiso, codigoSalaCanonico, cita?.estado]);

  return (
    <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">
      {cita?.estado === 'CANCELADA' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sala Virtual Cerrada (Cita Cancelada)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {cita.cancelado_por === 'MEDICO'
                ? 'Esta cita médica fue cancelada por el médico especialista. La sala de videoconsulta ya no se encuentra disponible.'
                : cita.cancelado_por === 'PACIENTE'
                ? 'Esta cita médica fue cancelada por el paciente. La sala de videoconsulta ya no se encuentra disponible.'
                : 'Esta cita médica fue cancelada y la sala de videoconsulta ya no se encuentra disponible.'}
            </p>
            <button
              type="button"
              onClick={() => {
                liberarTodosLosDispositivos();
                navigate('/dashboard', { replace: true });
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Volver al Panel Principal
            </button>
          </div>
        </div>
      )}
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

        {/* Video Principal (Remoto o Pantalla Compartida - Tarea 5.5.3 y Tarea 8.2.1) */}
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
          ) : remotoConectado ? (
            <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${remotoCompartiendoPantalla ? 'object-contain bg-black' : 'object-cover'} ${
                  remotoCamaraActiva || remotoCompartiendoPantalla ? 'block' : 'hidden'
                }`}
              />

              {!remotoCamaraActiva && !remotoCompartiendoPantalla && (
                <div className="flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                  <div className="w-24 h-24 rounded-full bg-slate-800/90 border-2 border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-2xl mb-3 shadow-xl">
                    {(nombreRemoto || (isMedico ? cita?.paciente_nombres : cita?.medico_nombres) || 'PR')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <p className="text-base font-semibold text-white">
                    {nombreRemoto || (isMedico
                      ? `${cita?.paciente_nombres || 'Paciente'} ${cita?.paciente_apellidos || ''}`.trim()
                      : `Dr(a). ${cita?.medico_nombres || 'Médico'} ${cita?.medico_apellidos || ''}`.trim())}
                  </p>
                  <span className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <VideoOff className="w-3.5 h-3.5 text-amber-400" /> Conectado en la sala (cámara apagada)
                  </span>
                </div>
              )}

              {/* Badge flotante del participante remoto */}
              <div className="absolute top-20 left-6 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2.5 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-semibold text-white">
                  {nombreRemoto || (isMedico
                    ? `${cita?.paciente_nombres || 'Paciente'} ${cita?.paciente_apellidos || ''}`.trim()
                    : `Dr(a). ${cita?.medico_nombres || 'Médico'} ${cita?.medico_apellidos || ''}`.trim())}
                </span>
                {remotoCompartiendoPantalla && (
                  <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-md text-[10px] font-semibold flex items-center gap-1">
                    <MonitorUp className="w-3 h-3" /> Compartiendo pantalla
                  </span>
                )}
                {!remotoMicActivo && (
                  <span className="text-rose-400 inline-flex items-center" title="Micrófono remoto silenciado">
                    <MicOff className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <VideoOff className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">
                {remotoSalioDeLlamada
                  ? (isMedico
                      ? 'El paciente ha finalizado / salido de la videollamada.'
                      : 'El médico ha finalizado / salido de la videollamada.')
                  : 'Esperando conexión de cámara remota...'}
              </p>
            </div>
          )}

          {/* Panel Flotante de Chat Clínico en Vivo (Tarea 8.2.2) */}
          {mostrarChat && (
            <div className="absolute bottom-28 left-6 w-80 sm:w-96 h-96 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-30 animate-fadeIn">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Chat de la Consulta</h4>
                    <p className="text-[10px] text-slate-400">Mensajes en tiempo real en esta sala</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={togglePanelChat}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {mensajesChat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs font-medium text-slate-400">Sin mensajes todavía</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Envía un mensaje para comunicarte por escrito durante la videoconsulta.
                    </p>
                  </div>
                ) : (
                  mensajesChat.map((msg, idx) => {
                    const esMio = msg.senderSocketId === socketRef.current?.id;
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {esMio ? 'Tú' : msg.autor}
                          </span>
                          <span className="text-[9px] text-slate-500">{msg.hora}</span>
                        </div>
                        <div
                          className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                            esMio
                              ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          {msg.texto}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatFinRef} />
              </div>

              <form
                onSubmit={handleEnviarMensajeChat}
                className="p-2.5 bg-slate-800/80 border-t border-slate-700 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textoMensajeChat}
                  onChange={(e) => setTextoMensajeChat(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!textoMensajeChat.trim()}
                  className="p-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                  title="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
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

        {/* Controles Inferiores (Tarea 5.5.2 y Tarea 8.2.2) */}
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

          {/* Botón Compartir Pantalla (Tarea 5.5.3 y Tarea 8.2.2) */}
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

          {/* Botón Chat Clínico en Vivo (Tarea 8.2.2) */}
          <button
            type="button"
            onClick={togglePanelChat}
            title={mostrarChat ? "Cerrar chat de la sala" : "Abrir chat de la sala"}
            className={`p-4 rounded-full transition-all border relative cursor-pointer ${
              mostrarChat
                ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-500 shadow-lg shadow-teal-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            <MessageSquare className="w-6 h-6" />
            {mensajesNoLeidos > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                {mensajesNoLeidos}
              </span>
            )}
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

          {/* Historial de Consultas Previas del Paciente (Tarea 7.2.2 - RF-13 / RN-05) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarHistorialPrevio(prev => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Ver Historial de Consultas Previas ({historialPrevio.length})
              </span>
              {mostrarHistorialPrevio ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {mostrarHistorialPrevio && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 space-y-2.5 max-h-60 overflow-y-auto">
                {cargandoHistorial ? (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Cargando consultas previas...</span>
                  </div>
                ) : historialPrevio.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Este paciente no registra consultas clínicas previas.
                  </p>
                ) : (
                  historialPrevio.map((item, idx) => {
                    let meds = item.medicamentos || [];
                    if (typeof meds === 'string') {
                      try { meds = JSON.parse(meds); } catch { meds = []; }
                    }
                    const fechaStr = item.fecha_atencion || item.fecha_hora
                      ? new Date(item.fecha_atencion || item.fecha_hora).toLocaleDateString('es-GT', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })
                      : 'Sin fecha';

                    return (
                      <div key={item.id_consulta || idx} className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-teal-700">{fechaStr}</span>
                          <span className="text-slate-500 font-medium">
                            Dr(a). {item.medico_nombres} {item.medico_apellidos}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800">
                          <span className="font-semibold text-slate-700">Diagnóstico:</span> {item.diagnostico || 'Sin diagnóstico'}
                        </p>
                        {item.notas_clinicas && (
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            <span className="font-semibold text-slate-700">Notas:</span> {item.notas_clinicas}
                          </p>
                        )}
                        {Array.isArray(meds) && meds.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {meds.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-[10px] font-medium"
                              >
                                <Pill className="w-2.5 h-2.5" />
                                {m.nombre}{m.dosis ? ` (${m.dosis})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
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
                      onFocus={() => setIndiceAutocompleteActivo(idx)}
                      onBlur={() => setTimeout(() => setIndiceAutocompleteActivo(prev => prev === idx ? null : prev), 180)}
                      onChange={(e) => handleCambioNombreMedicamento(idx, e.target.value)}
                      placeholder="Nombre del fármaco (Ej. Paracetamol 500mg)" 
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs text-slate-800"
                    />
                    {indiceAutocompleteActivo === idx && (() => {
                      const filtro = (med.nombre || '').trim().toLowerCase();
                      const sugerencias = catalogoMedicamentos.filter(item =>
                        !filtro ||
                        item.nombre_comercial?.toLowerCase().includes(filtro) ||
                        item.principio_activo?.toLowerCase().includes(filtro)
                      ).slice(0, 6);

                      if (sugerencias.length === 0) return null;

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                          {sugerencias.map((item, sIdx) => (
                            <button
                              key={item.id_medicamento || sIdx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                seleccionarMedicamentoCatalogo(idx, item);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-teal-50/70 transition-colors cursor-pointer flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">{item.nombre_comercial}</p>
                                <p className="text-[10px] text-slate-500">
                                  {item.principio_activo} • {item.dosis_recomendada} ({item.frecuencia_recomendada})
                                </p>
                              </div>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded">
                                Autocompletar
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
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
