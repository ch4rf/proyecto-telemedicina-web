const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint para obtener las métricas de las tarjetas y la próxima cita del usuario conectado
router.get('/stats', verificarToken, (req, res) => statsController.getEstadisticas(req, res));

module.exports = router;
