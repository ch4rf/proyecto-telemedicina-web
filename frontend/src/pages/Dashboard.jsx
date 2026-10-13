import React, { useState } from 'react';
import { Activity, LayoutDashboard, CalendarDays, Users, FileText, LogOut, Search, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isPatient] = useState(true); // Cambiar a false para ver el texto de Médico

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar Lateral (Menú Oscuro) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Activity className="w-6 h-6 text-teal-400 mr-2" />
          <span className="text-xl font-semibold text-white tracking-tight">NovaSalud</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/10">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Panel Principal</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium">Mis Citas</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            {isPatient ? <Users className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            <span className="font-medium">{isPatient ? 'Directorio Médico' : 'Expedientes'}</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header Superior (Buscador y Perfil) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-10 shadow-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 hidden sm:block">Inicio</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm ml-2 border border-teal-200 cursor-pointer hover:ring-2 hover:ring-teal-500/50 transition-all">
              JP
            </div>
          </div>
        </header>

        {/* Área de Trabajo (Tarjetas) */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Tarjeta de Bienvenida Principal */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-teal-50 to-blue-50 opacity-50 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold text-slate-800">Bienvenido de nuevo, Juan Pérez</h3>
                <p className="text-slate-500 mt-2">Tu próxima cita general está programada para mañana a las 10:00 AM.</p>
              </div>
              <button className="relative z-10 whitespace-nowrap px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg">
                Agendar Nueva Cita
              </button>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex items-start gap-5">
                <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Citas Activas</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">2</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex items-start gap-5">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Recetas Emitidas</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">14</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex items-start gap-5">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Videollamadas Hoy</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">5</p>
                </div>
              </div>

            </div>

            {/* Sección Inferior - Próxima Cita */}
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-4">Próxima Actividad</h4>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                    <User className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Consulta General</h5>
                    <p className="text-sm text-slate-500">Dra. María Gómez • Cardiología</p>
                  </div>
                </div>
                <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-6">
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-slate-900">10:00 AM</p>
                    <p className="text-sm text-slate-500">11 de Octubre, 2026</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-200">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
