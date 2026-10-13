import React from 'react';
import { Mic, Video, VideoOff, PhoneOff, MonitorUp, FileText, Pill, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Videollamada() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">
      {/* Panel Izquierdo - Video (60%) */}
      <div className="flex-1 flex flex-col relative">
        {/* Header Video */}
        <div className="h-16 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]"></div>
            <span className="text-white font-medium">00:14:22</span>
          </div>
          <div className="text-slate-300 font-medium bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
            Paciente: Juan Pérez (28 años)
          </div>
        </div>

        {/* Video Principal (Paciente) */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
          <div className="text-slate-500 flex flex-col items-center">
            <VideoOff className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">Esperando conexión de cámara...</p>
          </div>

          {/* Video Secundario (Médico - PiP) */}
          <div className="absolute bottom-28 right-8 w-56 h-36 bg-slate-800 rounded-xl border-2 border-slate-600 shadow-2xl overflow-hidden flex items-center justify-center group cursor-pointer hover:border-teal-500 transition-colors">
            <span className="text-slate-400 text-sm group-hover:text-teal-400">Mi Cámara</span>
          </div>
        </div>

        {/* Controles Inferiores */}
        <div className="h-24 bg-slate-900 flex items-center justify-center gap-6 px-6 absolute bottom-0 w-full border-t border-slate-800">
          <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors border border-slate-700 hover:border-slate-500">
            <Mic className="w-6 h-6" />
          </button>
          <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors border border-slate-700 hover:border-slate-500">
            <Video className="w-6 h-6" />
          </button>
          <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors border border-slate-700 hover:border-slate-500 hidden sm:block">
            <MonitorUp className="w-6 h-6" />
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all shadow-lg shadow-red-600/20 hover:scale-105"
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

        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Notas */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <FileText className="w-4 h-4 text-teal-600" /> Notas de Diagnóstico
            </label>
            <textarea 
              className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none resize-none text-sm text-slate-700 transition-all shadow-inner"
              placeholder="Escriba las observaciones clínicas, síntomas reportados y diagnóstico aquí..."
            ></textarea>
          </div>

          <hr className="border-slate-100" />

          {/* Receta */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Pill className="w-4 h-4 text-teal-600" /> Receta Médica
            </label>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Medicamento (Ej. Paracetamol 500mg)" 
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm transition-all"
              />
              <input 
                type="text" 
                placeholder="Indicaciones (Ej. 1 pastilla cada 8 hrs por 3 días)" 
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm transition-all"
              />
              <button className="w-full py-3 mt-2 border-2 border-dashed border-teal-200 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2">
                + Añadir otro medicamento
              </button>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
            <Save className="w-5 h-5" /> Finalizar y Emitir Receta
          </button>
        </div>
      </div>
    </div>
  );
}
