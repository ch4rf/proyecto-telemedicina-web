const express = require('express');
const router = express.Router();
const tiposDuracionController = require('../controllers/tiposDuracionController');

router.get('/', tiposDuracionController.obtenerTiposDuracion);
router.post('/', tiposDuracionController.crearTiposDuracion);
router.put('/:id', tiposDuracionController.editarTiposDuracion);
router.delete('/:id', tiposDuracionController.eliminarTiposDuracion);

module.exports = router;