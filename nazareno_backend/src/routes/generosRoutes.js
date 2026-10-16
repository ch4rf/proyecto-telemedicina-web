const express = require('express');
const router = express.Router();
const generosController = require('../controllers/generosController');

router.get('/', generosController.obtenerGeneros);

module.exports = router;