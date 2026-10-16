const express = require('express');
const router = express.Router();
const lugaresController = require('../controllers/lugaresController');

router.get('/', lugaresController.obtenerLugares);
router.post('/', lugaresController.crearLugares);
router.put('/:id', lugaresController.editarLugares);
router.delete('/:id', lugaresController.eliminarLugares);

module.exports = router;