const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Obtiene el token JWT almacenado en localStorage o sessionStorage.
 */
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Obtiene los datos del usuario almacenados en sesión.
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Guarda el token y el usuario en almacenamiento persistente o de sesión.
 */
export const setStoredSession = (token, usuario, recordar = false) => {
  const storage = recordar ? localStorage : sessionStorage;
  // Limpiar primero ambos para evitar duplicados
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');

  storage.setItem('token', token);
  storage.setItem('usuario', JSON.stringify(usuario));
};

/**
 * Limpia cualquier sesión activa en el navegador.
 */
export const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
};

/**
 * Cliente HTTP base con inyección automática de Bearer Token y manejo de errores.
 */
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Error al interpretar la respuesta del servidor' };
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.mensaje || `Error del servidor (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};

export default api;
