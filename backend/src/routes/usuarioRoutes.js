const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/perfil', verificarToken, (req, res) => usuarioController.getPerfil(req, res));
router.put('/perfil', verificarToken, (req, res) => usuarioController.updatePerfil(req, res));

module.exports = router;
