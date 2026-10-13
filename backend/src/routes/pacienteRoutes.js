const express = require('express');
const router = express.Router();
const { getPerfil, getHistorialCitas } = require('../controllers/pacienteController');

router.get('/:id', getPerfil);
router.get('/:id/citas', getHistorialCitas);

module.exports = router;
