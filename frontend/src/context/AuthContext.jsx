import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getStoredUser, setStoredSession, clearStoredSession, api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar la aplicación, verificar si existe una sesión válida
  useEffect(() => {
    const inicializarSesion = async () => {
      const storedToken = getToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUsuario(storedUser);

        // Opcional: Validar el token y refrescar el perfil en segundo plano
        try {
          const res = await api.get('/usuarios/perfil');
          if (res?.ok && res?.data) {
            setUsuario(res.data);
            const isLocal = !!localStorage.getItem('token');
            setStoredSession(storedToken, res.data, isLocal);
          }
        } catch (err) {
          console.warn('Sesión previa inválida o expirada:', err.message);
          clearStoredSession();
          setToken(null);
          setUsuario(null);
        }
      }
      setCargando(false);
    };

    inicializarSesion();
  }, []);

  const login = (jwtToken, datosUsuario, recordar = false) => {
    setToken(jwtToken);
    setUsuario(datosUsuario);
    setStoredSession(jwtToken, datosUsuario, recordar);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    clearStoredSession();
  };

  const actualizarPerfilLocal = (nuevosDatos) => {
    setUsuario(prev => {
      const actualizado = { ...prev, ...nuevosDatos };
      const isLocal = !!localStorage.getItem('token');
      const currentToken = getToken();
      if (currentToken) {
        setStoredSession(currentToken, actualizado, isLocal);
      }
      return actualizado;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        isAuthenticated: !!token,
        login,
        logout,
        actualizarPerfilLocal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
