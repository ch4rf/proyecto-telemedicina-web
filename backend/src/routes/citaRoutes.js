const express = require('express');
const router = express.Router();
const { crearCita, accederVideollamada } = require('../controllers/citaController');

router.post('/agendar', crearCita);
router.get('/:id/videollamada', accederVideollamada);

module.exports = router;
