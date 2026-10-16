const express = require('express');
const router = express.Router();
const tiposRecepcionController = require('../controllers/tiposRecepcionController');

router.get('/', tiposRecepcionController.obtenerTiposRecepcion);
router.post('/', tiposRecepcionController.crearTiposRecepcion);
router.put('/:id', tiposRecepcionController.editarTiposRecepcion);
router.delete('/:id', tiposRecepcionController.eliminarTiposRecepcion);

module.exports = router;