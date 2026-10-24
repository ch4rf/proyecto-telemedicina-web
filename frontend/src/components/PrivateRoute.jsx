import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function PrivateRoute({ children, rolesPermitidos }) {
  const { isAuthenticated, cargando, usuario } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Activity className="w-10 h-10 text-teal-400 animate-pulse mb-4" />
        <p className="text-slate-400 text-sm tracking-wide">Validando credenciales clínicas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
