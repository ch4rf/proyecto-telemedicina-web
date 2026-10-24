const express = require('express');
const router = express.Router();
const { getPerfil, getHistorialCitas, getPacientes } = require('../controllers/pacienteController');

router.get('/', getPacientes);
router.get('/:id', getPerfil);
router.get('/:id/citas', getHistorialCitas);

module.exports = router;
