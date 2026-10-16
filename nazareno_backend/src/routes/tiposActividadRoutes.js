const express = require('express');
const router = express.Router();
const tiposActividadController = require('../controllers/tiposActividadController');

router.get('/', tiposActividadController.obtenerTiposActividad);
router.post('/', tiposActividadController.crearTiposActividad);
router.put('/:id', tiposActividadController.editarTiposActividad);
router.delete('/:id', tiposActividadController.eliminarTiposActividad);

module.exports = router;