const express = require('express');
const router = express.Router();
const actividadesController = require('../controllers/actividadesController');

router.get('/configuracion', actividadesController.cargarDatosFormulario);
router.get('/', actividadesController.listarActividades);
router.post('/', actividadesController.guardarActividad);
router.put('/:id', actividadesController.actualizarActividad);
router.delete('/:id', actividadesController.eliminarActividad);

module.exports = router;