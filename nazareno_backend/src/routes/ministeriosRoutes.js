const express = require('express');
const router = express.Router();
const ministeriosController = require('../controllers/ministeriosController');

// Rutas para el CRUD del catálogo de Ministerios
router.get('/', ministeriosController.obtenerMinisterios);
router.post('/', ministeriosController.crearMinisterio);
router.put('/:id', ministeriosController.actualizarMinisterio);
router.delete('/:id', ministeriosController.eliminarMinisterio);

// Rutas para el Historial y Asignaciones
router.get('/:id/historial', ministeriosController.obtenerHistorialMinisterio);
router.post('/vincular', ministeriosController.vincularMiembroMinisterio);
router.put('/historial/:id_historial', ministeriosController.darDeBajaMinisterio);

module.exports = router;