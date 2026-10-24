const express = require('express');
const router = express.Router();
const busquedaController = require('../controllers/busquedaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, (req, res) => busquedaController.buscar(req, res));

module.exports = router;
