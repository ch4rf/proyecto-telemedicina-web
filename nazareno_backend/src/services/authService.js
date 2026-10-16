const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');

// Validar credenciales y generar sesión JWT
const autenticarUsuario = async (nombreUsuario, password) => {
  const usuario = await authRepository.findUserByUsername(nombreUsuario);

  if (!usuario) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const secretKey = process.env.JWT_SECRET || 'MI_CLAVE_SECRETA_IGLESIA';
  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, id_rol: usuario.id_rol },
    secretKey,
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.nombre_rol
    }
  };
};

module.exports = {
  autenticarUsuario
};