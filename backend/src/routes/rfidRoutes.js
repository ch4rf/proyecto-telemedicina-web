const express = require('express');
const router = express.Router();
const rfidController = require('../controllers/rfidController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Lo usa el ESP32 por Wi-Fi (protegido con la clave del lector)
router.post('/lectura', rfidController.recibirLectura);

// Lo usa el navegador cuando el ESP32 esta conectado por Cable USB (Web Serial API)
router.post('/lectura-usb', rfidController.recibirLecturaUsb);

// Lo usa la pagina de Login para entrar con tarjeta
router.get('/estado', rfidController.estadoLogin);

// Control de recepcion remota por WiFi para multiples computadoras
router.post('/esperar-wifi', rfidController.activarEsperaWifi);
router.post('/cancelar-wifi', rfidController.cancelarEsperaWifi);

// Con sesion iniciada
router.get('/mi-tarjeta', verificarToken, rfidController.miTarjeta);
router.post('/registrar', verificarToken, rfidController.iniciarRegistro);
router.delete('/mi-tarjeta', verificarToken, rfidController.reportarPerdida);
router.get('/accesos', verificarToken, rfidController.listarAccesos);

module.exports = router;
