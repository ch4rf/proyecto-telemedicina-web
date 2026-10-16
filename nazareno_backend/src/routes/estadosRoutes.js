const express = require('express');
const router = express.Router();
const estadosController = require('../controllers/estadosController');

router.get('/', estadosController.obtenerEstados);

module.exports = router;