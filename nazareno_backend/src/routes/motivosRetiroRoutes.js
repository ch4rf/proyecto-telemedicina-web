const express = require('express');
const router = express.Router();
const motivosRetiroController = require('../controllers/motivosRetiroController');

router.get('/', motivosRetiroController.obtenerMotivosRetiro);
router.post('/', motivosRetiroController.crearMotivosRetiro);
router.put('/:id', motivosRetiroController.editarMotivosRetiro);
router.delete('/:id', motivosRetiroController.eliminarMotivosRetiro);

module.exports = router;