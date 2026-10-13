const authService = require('../services/authService');

// Controlador para el registro
const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error en el registro:', error.message);
        if (error.message === 'El correo ya está en uso') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Controlador para el login
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;
        const result = await authService.loginUser(correo, password);
        res.json({ mensaje: 'Login exitoso', ...result });
    } catch (error) {
        console.error('Error en login:', error.message);
        if (error.message.includes('Credenciales inválidas')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { register, login };
