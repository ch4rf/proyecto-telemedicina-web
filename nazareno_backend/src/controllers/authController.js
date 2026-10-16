const authService = require('../services/authService');

// POST: Iniciar sesión
const login = async (req, res) => {
  try {
    const { nombre_usuario, password } = req.body;
    const resultado = await authService.autenticarUsuario(nombre_usuario, password);

    res.status(200).json({
      mensaje: 'Login exitoso',
      token: resultado.token,
      usuario: resultado.usuario
    });
  } catch (error) {
    const status = error.status || 500;
    const mensaje = error.status ? error.message : 'Error interno en el servidor';

    if (!error.status) {
      console.error('Error en proceso de login:', error);
    }

    res.status(status).json({ mensaje });
  }
};

module.exports = { login };