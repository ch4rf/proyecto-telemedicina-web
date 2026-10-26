const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const { validarLogin, validarRegistro, limitarIntentosAuth } = require('../middlewares/validateMiddleware');

// Definir las rutas
router.post('/register', validarRegistro, register);
router.post('/login', limitarIntentosAuth, validarLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
