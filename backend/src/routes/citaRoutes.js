const express = require('express');
const router = express.Router();
const { crearCita, accederVideollamada, getMisCitas, getDetalleCita } = require('../controllers/citaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, getMisCitas);
router.post('/agendar', crearCita);
router.get('/:id/videollamada', accederVideollamada);
router.get('/:id', verificarToken, getDetalleCita);

module.exports = router;
