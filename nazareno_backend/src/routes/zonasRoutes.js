const express = require('express');
const router = express.Router();
const zonasController = require('../controllers/zonasController');

// GET /api/zonas -> Leer
router.get('/', zonasController.obtenerZonas);

// POST /api/zonas -> Crear
router.post('/', zonasController.crearZona);

// PUT /api/zonas/:id -> Editar (El :id es una variable dinámica en la URL)
router.put('/:id', zonasController.editarZona);

// DELETE /api/zonas/:id -> Borrar
router.delete('/:id', zonasController.eliminarZona);

module.exports = router;