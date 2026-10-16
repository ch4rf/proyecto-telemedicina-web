const express = require('express');
const router = express.Router();

// Importamos el controlador (ajusta los ../ según tu estructura)
const miembrosController = require('../controllers/miembrosController');

// Definimos la ruta GET base
router.get('/', miembrosController.obtenerMiembros);
router.get('/:id/ministerios', miembrosController.obtenerMinisteriosDeMiembro);
router.post('/', miembrosController.crearMiembro);
router.put('/:id', miembrosController.actualizarMiembro);
router.delete('/:id', miembrosController.eliminarMiembro);

module.exports = router;