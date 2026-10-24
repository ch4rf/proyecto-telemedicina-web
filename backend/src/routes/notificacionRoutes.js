const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ambas rutas protegidas con verificación de JWT
router.get('/', verificarToken, (req, res) => notificacionController.getNotificaciones(req, res));
router.patch('/:id/leida', verificarToken, (req, res) => notificacionController.marcarLeida(req, res));

module.exports = router;
