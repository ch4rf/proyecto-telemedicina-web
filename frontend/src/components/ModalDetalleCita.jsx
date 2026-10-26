import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Stethoscope, User, Video, 
  FileText, CheckCircle2, AlertCircle, Loader2, Copy, Check, 
  ExternalLink, ShieldCheck, Pill, Phone, Mail, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { generarRecetaPDF } from '../utils/generarRecetaPDF';

export default function ModalDetalleCita({
  isOpen,
  onClose,
  idCita,
  usuario,
  onCitaActualizada
}) {
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState('');

  // Carga del detalle al abrir el modal o cambiar idCita
  useEffect(() => {
    if (!isOpen || !idCita) {
      setCita(null);
      setError('');
      setCargando(false);
      setConfirmarCancelacion(false);
      setCancelando(false);
      setErrorCancelacion('');
      return;
    }

    const cargarDetalle = async () => {
      try {
        setCargando(true);
        setError('');
        setConfirmarCancelacion(false);
        setErrorCancelacion('');
        const res = await api.get(`/citas/${idCita}`);
        const data = res?.data || res;
        setCita(data);
      } catch (err) {
        console.error('Error al obtener detalle de la cita:', err);
        setError(err.message || 'No fue posible cargar los datos de la cita médica.');
      } finally {
        setCargando(false);
      }
    };

    cargarDetalle();
  }, [isOpen, idCita]);

  if (!isOpen) return null;

  const isMedico = usuario?.rol === 'MEDICO';

  // Manejador para copiar la URL de la sala al portapapeles
  const handleCopiarEnlace = () => {
    if (!cita?.url_videollamada) return;
    const urlCompleta = `${window.location.origin}/sala/${cita.url_videollamada}`;
    navigator.clipboard.writeText(urlCompleta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Manejador para ingresar a la sala de videollamada
  const handleEntrarSala = () => {
    if (!cita?.url_videollamada) return;
    onClose();
    navigate(`/sala/${cita.url_videollamada}`);
  };

  // Manejador para cancelar la cita (Tarea 6.1.4 - Regla RN-03)
  const handleCancelarCita = async () => {
    if (!cita?.id_cita) return;
    try {
      setCancelando(true);
      setErrorCancelacion('');
      await api.patch(`/citas/${cita.id_cita}/cancelar`);
      setCita(prev => prev ? { ...prev, estado: 'CANCELADA', cancelado_por: usuario?.rol, sala_habilitada: false } : prev);
      setConfirmarCancelacion(false);
      if (onCitaActualizada) {
        onCitaActualizada();
      }
    } catch (err) {
      setErrorCancelacion(err.message || 'No fue posible cancelar la cita.');
    } finally {
      setCancelando(false);
    }
  };

  // Formateadores de fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderizado seguro de antecedentes / datos clínicos (JSONB en PostgreSQL)
  const renderDatosClinicos = (datos) => {
    if (!datos) return null;

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
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md border border-rose-100 text-[11px]">
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
        {!tipoSangre && !alergias && !antecedentes && (
          <p className="text-slate-500 italic">
            {Object.keys(datosObj).length > 0 ? JSON.stringify(datosObj) : 'Sin antecedentes registrados'}
          </p>
        )}
      </div>
    );
  };

  // Renderizado seguro de medicamentos prescritos (JSONB en PostgreSQL)
  const renderMedicamentos = (meds) => {
    if (!meds) return null;

    let list = meds;
    if (typeof meds === 'string') {
      try {
        list = JSON.parse(meds);
      } catch {
        return <p className="text-slate-600 text-xs">{meds}</p>;
      }
    }

    if (Array.isArray(list) && list.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {list.map((m, idx) => (
            <div key={idx} className="p-2.5 bg-white rounded-lg border border-emerald-100 shadow-xs">
              <p className="font-bold text-slate-800 text-xs">{m.nombre || `Medicamento #${idx + 1}`}</p>
              <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                {m.dosis && <p><span className="font-medium text-slate-700">Dosis:</span> {m.dosis}</p>}
                {m.frecuencia && <p><span className="font-medium text-slate-700">Frecuencia:</span> {m.frecuencia}</p>}
                {m.duracion && <p><span className="font-medium text-slate-700">Duración:</span> {m.duracion}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof list === 'object') {
      return <p className="text-slate-600 text-xs">{JSON.stringify(list)}</p>;
    }

    return <p className="text-slate-600 text-xs">{String(list)}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo difuminado */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor Principal del Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scaleUp">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Detalles de la Cita Médica</h3>
              <p className="text-xs text-slate-400">
                {idCita ? `Identificador: #${idCita.substring(0, 8)}...` : 'Consulta de información clínica'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cita && (
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
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-600">
          
          {/* Estado de Carga */}
          {cargando && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm font-medium">Obteniendo expediente y estado de la sala...</p>
            </div>
          )}

          {/* Estado de Error */}
          {!cargando && error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Error al cargar la cita</h4>
                <p className="text-xs mt-1 text-rose-600">{error}</p>
              </div>
            </div>
          )}

          {/* Contenido de la Cita */}
          {!cargando && !error && cita && (
            <>
              {/* Tarjeta 1: Fecha y Horario */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs">
                    <Calendar className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Fecha de Consulta</span>
                    <p className="font-bold text-slate-800 capitalize">
                      {formatearFecha(cita.fecha_hora)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Horario Fijado</span>
                    <p className="font-bold text-slate-800">
                      {formatearHora(cita.fecha_hora)} hrs
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Participantes de la Consulta (Médico y Paciente) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Especialista */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 text-teal-700 font-semibold text-xs uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4" />
                    <span>Médico Especialista</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Dr. {cita.medico_nombres} {cita.medico_apellidos}
                  </h4>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                    {cita.especialidad || 'Medicina General'}
                  </span>
                  {cita.medico_correo && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cita.medico_correo}</span>
                    </p>
                  )}
                </div>

                {/* Paciente */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-xs uppercase tracking-wider">
                    <User className="w-4 h-4" />
                    <span>Datos del Paciente</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {cita.paciente_nombres} {cita.paciente_apellidos}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {cita.paciente_correo && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cita.paciente_correo}</span>
                      </p>
                    )}
                    {cita.paciente_telefono && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cita.paciente_telefono}</span>
                      </p>
                    )}
                  </div>
                  {cita.paciente_datos_clinicos && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600 block mb-0.5">Ficha / Antecedentes:</span>
                      {renderDatosClinicos(cita.paciente_datos_clinicos)}
                    </div>
                  )}
                </div>

              </div>

              {/* Tarjeta 3: Sala Virtual y Cumplimiento RN-04 */}
              {cita.estado === 'PROGRAMADA' && (
                <div className={`border rounded-2xl p-5 ${
                  cita.sala_habilitada 
                    ? 'bg-teal-50/50 border-teal-200' 
                    : 'bg-amber-50/50 border-amber-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        cita.sala_habilitada 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'bg-amber-500 text-white shadow-sm'
                      }`}>
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {cita.sala_habilitada ? 'Sala Virtual Disponible' : 'Sala de Espera Virtual (RN-04)'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {cita.sala_habilitada 
                            ? isMedico 
                              ? 'Como médico asignado, tienes acceso prioritario para configurar y preparar tu consultorio virtual.' 
                              : 'La sala de consulta está habilitada. Puedes ingresar y conectarte con tu especialista ahora.'
                            : `Conforme a las reglas de atención (RN-04), el acceso para el paciente se habilitará 10 minutos antes de la hora pactada. Faltan aproximadamente ${cita.minutos_para_apertura} minutos.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y enlace de la sala */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCopiarEnlace}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Copiar enlace directo de la videollamada"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copiado ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
                      </button>

                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {cita.url_videollamada}
                      </span>
                    </div>

                    {cita.sala_habilitada ? (
                      <button
                        type="button"
                        onClick={handleEntrarSala}
                        className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Entrar a Videollamada</span>
                      </button>
                    ) : (
                      <div className="text-xs font-semibold text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Apertura en {cita.minutos_para_apertura} min</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tarjeta 4: Resumen Clínico si la cita está COMPLETADA */}
              {cita.estado === 'COMPLETADA' && (
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Resumen Clínico de la Consulta Finalizada</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                      <span className="font-bold text-slate-700 block mb-1">Diagnóstico Médico:</span>
                      <p className="text-slate-600 leading-relaxed">
                        {cita.diagnostico || 'Diagnóstico registrado en el expediente clínico del paciente.'}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                      <span className="font-bold text-slate-700 block mb-1">Observaciones / Notas Clínicas:</span>
                      <p className="text-slate-600 leading-relaxed">
                        {cita.notas_clinicas || 'Sin notas adicionales.'}
                      </p>
                    </div>
                  </div>

                  {/* Receta asociada si existe */}
                  {(cita.medicamentos || cita.indicaciones_generales) && (
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-teal-800">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <span>Prescripción Médica Emitida</span>
                        <button
                          type="button"
                          onClick={() => generarRecetaPDF(cita, usuario)}
                          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Descargar PDF</span>
                        </button>
                      </div>
                      {cita.medicamentos && (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">Medicamentos: </span>
                          {renderMedicamentos(cita.medicamentos)}
                        </div>
                      )}
                      {cita.indicaciones_generales && (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">Indicaciones: </span>
                          <span className="text-slate-600">{cita.indicaciones_generales}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Aviso o error de cancelación (Tarea 6.1.4) */}
              {errorCancelacion && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{errorCancelacion}</p>
                </div>
              )}

              {/* Confirmación de cancelación (Tarea 6.1.4) */}
              {cita.estado === 'PROGRAMADA' && confirmarCancelacion && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-xs text-rose-800">
                    <p className="font-bold">¿Estás seguro de que deseas cancelar esta cita?</p>
                    <p className="text-rose-600 mt-0.5">Esta acción notificará automáticamente a la otra parte y liberará el horario.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={cancelando}
                      onClick={() => { setConfirmarCancelacion(false); setErrorCancelacion(''); }}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      No, conservar
                    </button>
                    <button
                      type="button"
                      disabled={cancelando}
                      onClick={handleCancelarCita}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {cancelando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Sí, cancelar cita</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tarjeta 5: Si la cita fue CANCELADA */}
              {cita.estado === 'CANCELADA' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs">
                    {cita.cancelado_por === 'MEDICO' ? (
                      <><strong>Cancelado por el médico:</strong> Esta cita médica fue cancelada por el especialista. Si necesitas atención, te sugerimos agendar una nueva teleconsulta en otro horario disponible.</>
                    ) : cita.cancelado_por === 'PACIENTE' ? (
                      <><strong>Cancelado por el paciente:</strong> Esta cita médica fue cancelada por solicitud del paciente.</>
                    ) : (
                      'Esta cita médica fue cancelada. Si necesitas atención, te sugerimos agendar una nueva teleconsulta en el horario disponible de tu especialista.'
                    )}
                  </p>
                </div>
              )}

            </>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Telemedicina Segura y Cifrada</span>
          </div>

          <div className="flex items-center gap-3">
            {cita && cita.estado === 'PROGRAMADA' && !confirmarCancelacion && (
              <button
                type="button"
                onClick={() => { setConfirmarCancelacion(true); setErrorCancelacion(''); }}
                className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar Cita
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            {cita && cita.estado === 'PROGRAMADA' && cita.sala_habilitada && (
              <button
                type="button"
                onClick={handleEntrarSala}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Ingresar a Sala</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
