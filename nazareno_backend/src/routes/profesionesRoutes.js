const express = require('express');
const router = express.Router();
const profesionesController = require('../controllers/profesionesController');

router.get('/', profesionesController.obtenerProfesiones);
router.post('/', profesionesController.crearProfesion);
router.put('/:id', profesionesController.editarProfesion);
router.delete('/:id', profesionesController.eliminarProfesion);

module.exports = router;