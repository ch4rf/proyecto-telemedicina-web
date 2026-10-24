const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'super_secreto_para_jwt_123!';
        const decodificado = jwt.verify(token, secret);
        req.usuario = decodificado; // Contiene { id: user.id_usuario, rol: user.rol }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = { verificarToken };
