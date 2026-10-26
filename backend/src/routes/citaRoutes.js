const express = require('express');
const router = express.Router();
const { crearCita, accederVideollamada, getMisCitas, getDetalleCita, cancelarCita } = require('../controllers/citaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { validarAgendarCita } = require('../middlewares/validateMiddleware');

router.get('/', verificarToken, getMisCitas);
router.post('/agendar', verificarToken, validarAgendarCita, crearCita);
router.get('/:id/videollamada', verificarToken, accederVideollamada);
router.patch('/:id/cancelar', verificarToken, cancelarCita);
router.get('/:id', verificarToken, getDetalleCita);

module.exports = router;
