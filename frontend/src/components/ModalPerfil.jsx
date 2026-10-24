import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Shield, HeartPulse, Stethoscope, 
  Loader2, CheckCircle2, AlertCircle, Save, Calendar
} from 'lucide-react';
import { api } from '../services/api';

export default function ModalPerfil({ isOpen, onClose, usuario, onPerfilActualizado }) {
  const isPatient = usuario?.rol === 'PACIENTE';

  // Estados del Formulario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Datos clínicos para pacientes
  const [tipoSangre, setTipoSangre] = useState('');
  const [alergias, setAlergias] = useState('');
  const [antecedentes, setAntecedentes] = useState('');

  // Especialidad para médicos
  const [especialidad, setEspecialidad] = useState('');

  // Estados de control
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Cargar información fresca de la base de datos al abrir el modal
  useEffect(() => {
    if (!isOpen) {
      setMensajeExito('');
      setMensajeError('');
      return;
    }

    const cargarPerfilFresco = async () => {
      try {
        setCargandoDatos(true);
        setMensajeError('');
        const res = await api.get('/usuarios/perfil');
        if (res?.ok && res?.data) {
          const u = res.data;
          setNombres(u.nombres || '');
          setApellidos(u.apellidos || '');
          setCorreo(u.correo || '');
          setTelefono(u.telefono || '');

          if (u.rol === 'PACIENTE') {
            const clinicos = typeof u.datos_clinicos === 'object' && u.datos_clinicos !== null 
              ? u.datos_clinicos 
              : {};
            setTipoSangre(clinicos.tipo_sangre || '');
            setAlergias(Array.isArray(clinicos.alergias) ? clinicos.alergias.join(', ') : (clinicos.alergias || ''));
            setAntecedentes(clinicos.antecedentes || '');
          } else if (u.rol === 'MEDICO') {
            setEspecialidad(u.especialidad || 'Medicina General');
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err.message);
        setMensajeError('No se pudo cargar la información del perfil.');
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarPerfilFresco();
  }, [isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeError('');
    setMensajeExito('');

    if (!nombres.trim() || !apellidos.trim()) {
      setMensajeError('Los nombres y apellidos son obligatorios.');
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim()
      };

      if (isPatient) {
        payload.telefono = telefono.trim();
        payload.datos_clinicos = {
          tipo_sangre: tipoSangre,
          alergias: alergias.trim(),
          antecedentes: antecedentes.trim()
        };
      } else {
        payload.especialidad = especialidad.trim();
      }

      const res = await api.put('/usuarios/perfil', payload);

      if (res?.ok && res?.data) {
        setMensajeExito('Información de perfil actualizada con éxito.');
        if (onPerfilActualizado) {
          onPerfilActualizado(res.data);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMensajeError(res?.error || 'No fue posible guardar los cambios.');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err.message);
      setMensajeError(err.message || 'Error de conexión al actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = nombres && apellidos 
    ? `${nombres[0]}${apellidos[0]}`.toUpperCase() 
    : usuario?.correo?.substring(0, 2).toUpperCase() || 'US';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200 shadow-sm">
              {iniciales}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Mi Perfil</h3>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isPatient 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  {isPatient ? 'Paciente' : 'Médico Especialista'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{correo}</p>
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

        {/* Cuerpo del Formulario */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Mensajes de Alerta */}
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {cargandoDatos ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span>Cargando expediente personal...</span>
            </div>
          ) : (
            <form id="form-perfil" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sección de Datos Personales */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" /> Datos Personales
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres</label>
                    <input 
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos</label>
                    <input 
                      type="text"
                      required
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input 
                      type="email"
                      readOnly
                      disabled
                      value={correo}
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-100/70 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed outline-none"
                      title="El correo electrónico es el identificador principal de inicio de sesión"
                    />
                  </div>
                </div>

                {isPatient && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input 
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej. 555-0192"
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección Clínica para Pacientes */}
              {isPatient && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Expediente Clínico Base
                  </p>
                  
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Sangre</label>
                        <select 
                          value={tipoSangre}
                          onChange={(e) => setTipoSangre(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        >
                          <option value="">Seleccionar tipo...</option>
                          <option value="O+">O Positivo (O+)</option>
                          <option value="O-">O Negativo (O-)</option>
                          <option value="A+">A Positivo (A+)</option>
                          <option value="A-">A Negativo (A-)</option>
                          <option value="B+">B Positivo (B+)</option>
                          <option value="B-">B Negativo (B-)</option>
                          <option value="AB+">AB Positivo (AB+)</option>
                          <option value="AB-">AB Negativo (AB-)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Alergias Conocidas</label>
                        <input 
                          type="text"
                          value={alergias}
                          onChange={(e) => setAlergias(e.target.value)}
                          placeholder="Ej. Penicilina, AINEs, Polen"
                          className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Antecedentes Médicos Relevantes</label>
                      <textarea 
                        rows={2}
                        value={antecedentes}
                        onChange={(e) => setAntecedentes(e.target.value)}
                        placeholder="Ej. Hipertensión arterial en tratamiento, cirugía de apéndice en 2021..."
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sección Profesional para Médicos */}
              {!isPatient && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Especialidad Médica
                  </p>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidad Principal</label>
                    <select 
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    >
                      <option value="Medicina General">Medicina General</option>
                      <option value="Cardiología">Cardiología</option>
                      <option value="Pediatría">Pediatría</option>
                      <option value="Dermatología">Dermatología</option>
                      <option value="Neurología">Neurología</option>
                      <option value="Ginecología">Ginecología</option>
                      <option value="Traumatología">Traumatología</option>
                    </select>
                  </div>
                </div>
              )}

            </form>
          )}

        </div>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            type="button"
            disabled={guardando}
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          
          <button 
            type="submit"
            form="form-perfil"
            disabled={guardando || cargandoDatos}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
