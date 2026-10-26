import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Stethoscope, User, AlertCircle, 
  CheckCircle2, Loader2, Video, Sparkles, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function ModalAgendarCita({ 
  isOpen, 
  onClose, 
  medicoPreseleccionado = null, 
  onCitaAgendada,
  usuario 
}) {
  const isPatient = usuario?.rol === 'PACIENTE';

  // Fecha de hoy en formato YYYY-MM-DD
  const hoyStr = new Date().toISOString().split('T')[0];

  // Estados del Formulario
  const [medicos, setMedicos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');

  // Estados de control
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Horarios sugeridos
  const horariosSugeridos = [
    '08:30', '09:30', '10:30', '11:30',
    '14:00', '15:00', '16:00', '17:00'
  ];

  // Carga de médicos o pacientes según el rol al abrir el modal
  useEffect(() => {
    if (!isOpen) {
      setMensajeError('');
      setMensajeExito('');
      return;
    }

    const cargarDatos = async () => {
      try {
        setCargandoLista(true);
        setMensajeError('');

        if (isPatient) {
          const resMedicos = await api.get('/medicos');
          const lista = Array.isArray(resMedicos) ? resMedicos : (resMedicos?.data || []);
          setMedicos(lista);

          // Si hay médico preseleccionado (por ejemplo desde el Directorio Médico)
          if (medicoPreseleccionado?.id_medico) {
            setMedicoSeleccionado(medicoPreseleccionado.id_medico);
          } else if (lista.length > 0) {
            setMedicoSeleccionado(lista[0].id_medico);
          }
        } else {
          // Si el usuario es médico, carga lista de pacientes para agendarles cita
          const resPacientes = await api.get('/pacientes');
          const lista = Array.isArray(resPacientes) ? resPacientes : (resPacientes?.data || []);
          setPacientes(lista);
          if (lista.length > 0) {
            setPacienteSeleccionado(lista[0].id_paciente);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos en modal de cita:', err.message);
        setMensajeError('No se pudieron cargar los datos de especialistas.');
      } finally {
        setCargandoLista(false);
      }
    };

    cargarDatos();

    // Establecer fecha por defecto: mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    setFecha(manana.toISOString().split('T')[0]);
    setHora('10:30');
    setMotivo('');
  }, [isOpen, medicoPreseleccionado, isPatient]);

  if (!isOpen) return null;

  // Acceso a datos del médico seleccionado
  const medicoActivo = medicos.find(m => m.id_medico === medicoSeleccionado);
  const pacienteActivo = pacientes.find(p => p.id_paciente === pacienteSeleccionado);

  // Obtener lista normalizada de disponibilidad del médico activo (Tarea 6.2.3)
  const obtenerDisponibilidadMedico = (med) => {
    if (!med?.disponibilidad) return [];
    let disp = med.disponibilidad;
    if (typeof disp === 'string') {
      try { disp = JSON.parse(disp); } catch { return []; }
    }
    return Array.isArray(disp) ? disp : [];
  };
  const disponibilidadActiva = obtenerDisponibilidadMedico(medicoActivo);

  // Atajos rápidos para la fecha
  const aplicarAtajoFecha = (diasAdicionales) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + diasAdicionales);
    setFecha(targetDate.toISOString().split('T')[0]);
  };

  // Envío del Formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    // Validación básica de campos
    const idPacienteFinal = isPatient ? usuario?.id_usuario : pacienteSeleccionado;
    const idMedicoFinal = isPatient ? medicoSeleccionado : usuario?.id_usuario;

    if (!idPacienteFinal) {
      setMensajeError('Debes seleccionar un paciente válido.');
      return;
    }

    if (!idMedicoFinal) {
      setMensajeError('Debes seleccionar un médico especialista.');
      return;
    }

    if (!fecha || !hora) {
      setMensajeError('Por favor selecciona una fecha y una hora para la consulta.');
      return;
    }

    // Validación de fecha/hora futura
    const fechaHoraCita = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();

    if (fechaHoraCita <= ahora) {
      setMensajeError('La fecha y hora de la cita deben ser en el futuro.');
      return;
    }

    // Validación RN-01: Verificar disponibilidad configurada por el médico (Tarea 6.2.3)
    if (isPatient && disponibilidadActiva.length > 0) {
      const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaElegido = nombresDias[fechaHoraCita.getDay()];
      const bloqueDia = disponibilidadActiva.find(
        d => d.dia && d.dia.toLowerCase() === diaElegido.toLowerCase()
      );
      const diasTexto = disponibilidadActiva.map(d => d.dia).join(', ');
      const rangoTexto = `${disponibilidadActiva[0].hora_inicio || '08:00'} a ${disponibilidadActiva[0].hora_fin || '17:00'}`;

      if (!bloqueDia) {
        setMensajeError(`Horario no disponible (RN-01): El especialista atiende los días ${diasTexto} (${rangoTexto} hrs). Seleccionaste ${diaElegido}.`);
        return;
      }

      if (bloqueDia.hora_inicio && bloqueDia.hora_fin) {
        if (hora < bloqueDia.hora_inicio || hora > bloqueDia.hora_fin) {
          setMensajeError(`Horario fuera de rango (RN-01): El especialista atiende los ${diaElegido} de ${bloqueDia.hora_inicio} a ${bloqueDia.hora_fin} hrs.`);
          return;
        }
      }
    }
    if (false) {
      return;
    }

    try {
      setGuardando(true);
      const res = await api.post('/citas/agendar', {
        idPaciente: idPacienteFinal,
        idMedico: idMedicoFinal,
        fechaHora: `${fecha} ${hora}:00`
      });

      setMensajeExito(res?.mensaje || 'Cita agendada con éxito.');

      // Notificar al componente padre para recargar la lista de citas y métricas
      if (typeof onCitaAgendada === 'function') {
        onCitaAgendada(res?.cita);
      }

      // Cerrar modal automáticamente tras breve confirmación
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Error al agendar cita:', err.message);
      setMensajeError(err.message || 'Error al agendar la cita médica.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Agendar Nueva Cita</h3>
              <p className="text-xs text-slate-500">Programa tu atención médica virtual con conexión segura</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Mensajes de Alerta */}
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {cargandoLista ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span>Cargando directorio de especialistas...</span>
            </div>
          ) : (
            <>
              {/* Selector de Especialista / Paciente según Rol */}
              {isPatient ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Médico Especialista
                  </label>
                  <div className="relative">
                    <select
                      value={medicoSeleccionado}
                      onChange={(e) => setMedicoSeleccionado(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {medicos.length === 0 ? (
                        <option value="">No hay médicos registrados</option>
                      ) : (
                        medicos.map((med) => (
                          <option key={med.id_medico} value={med.id_medico}>
                            {med.nombres} {med.apellidos} - {med.especialidad}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>

                  {/* Ficha Resumen del Médico Seleccionado */}
                  {medicoActivo && (
                    <div className="mt-3 p-3 bg-teal-50/60 border border-teal-100 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                        {medicoActivo.nombres?.charAt(0) || 'D'}{medicoActivo.apellidos?.charAt(0) || 'R'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{medicoActivo.nombres} {medicoActivo.apellidos}</p>
                        <p className="text-[11px] font-semibold text-teal-700">{medicoActivo.especialidad}</p>
                        {disponibilidadActiva.length > 0 && (
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Horario: <span className="font-semibold">{disponibilidadActiva.map(d => d.dia).join(', ')}</span> ({disponibilidadActiva[0].hora_inicio} - {disponibilidadActiva[0].hora_fin} hrs)
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium bg-white text-teal-700 px-2.5 py-1 rounded-full border border-teal-200">
                        HD Encriptado
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Seleccionar Paciente
                  </label>
                  <div className="relative">
                    <select
                      value={pacienteSeleccionado}
                      onChange={(e) => setPacienteSeleccionado(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                    >
                      {pacientes.length === 0 ? (
                        <option value="">No hay pacientes registrados</option>
                      ) : (
                        pacientes.map((p) => (
                          <option key={p.id_paciente} value={p.id_paciente}>
                            {p.nombres} {p.apellidos} ({p.correo || p.telefono || 'Sin correo'})
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>

                  {pacienteActivo && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                        {pacienteActivo.nombres?.charAt(0) || 'P'}{pacienteActivo.apellidos?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{pacienteActivo.nombres} {pacienteActivo.apellidos}</p>
                        <p className="text-[11px] text-slate-500">{pacienteActivo.correo || pacienteActivo.telefono || 'Paciente activo'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selector de Fecha y Atajos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fecha de la Consulta
                  </label>
                  <span className="text-[11px] text-slate-400">Mínimo: hoy</span>
                </div>

                <input
                  type="date"
                  min={hoyStr}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                />

                {/* Atajos de Fecha */}
                <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => aplicarAtajoFecha(0)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoFecha(1)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoFecha(2)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    En 2 días
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoFecha(7)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Próxima semana
                  </button>
                </div>
              </div>

              {/* Selector de Hora con Chips y Campo Personalizado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Horario de Atención
                </label>

                {/* Chips de Horarios Sugeridos */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {horariosSugeridos.map((slot) => {
                    const isSelected = hora === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setHora(slot)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {/* Input de Hora Personalizada */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">O elige otra hora:</span>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Motivo de Consulta Opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Motivo o Síntomas (Opcional)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Chequeo de rutina, dolor articular, revisión de receta..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Resumen Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Video className="w-4 h-4 text-teal-600" />
                  <span>Resumen de la Teleconsulta</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modalidad:</span>
                    <span className="font-semibold text-slate-800">Videollamada Encriptada</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha y Hora:</span>
                    <span className="font-semibold text-slate-800">
                      {fecha && hora ? `${fecha} a las ${hora} hrs` : 'Por definir'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sala de Espera:</span>
                    <span className="font-semibold text-teal-600">Se habilita 10 min antes</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || cargandoLista}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Agendando cita...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>Confirmar y Agendar</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
