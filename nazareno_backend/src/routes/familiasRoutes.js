const express = require('express');
const router = express.Router();
const familiasController = require('../controllers/familiasController');

router.get('/', familiasController.obtenerFamilias);
router.post('/', familiasController.crearFamilia);
router.put('/:id', familiasController.actualizarFamilia);
router.delete('/:id', familiasController.eliminarFamilia);
router.get('/:id/miembros', familiasController.obtenerIntegrantesFamilia);

module.exports = router;