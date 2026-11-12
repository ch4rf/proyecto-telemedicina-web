const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfidController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Lo usa el ESP32 (protegido con la clave del lector)
router.post('/lectura', rfidController.recibirLectura);

// Lo usa la pagina de Login para entrar con tarjeta
router.get('/estado', rfidController.estadoLogin);

// Con sesion iniciada
router.get('/mi-tarjeta', verificarToken, rfidController.miTarjeta);
router.post('/registrar', verificarToken, rfidController.iniciarRegistro);
router.delete('/mi-tarjeta', verificarToken, rfidController.reportarPerdida);
router.get('/accesos', verificarToken, rfidController.listarAccesos);

module.exports = router;
