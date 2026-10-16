const express = require('express');
const router = express.Router();

router.use('/zonas', require('./zonasRoutes'));
router.use('/ministerios', require('./ministeriosRoutes'));
router.use('/profesiones', require('./profesionesRoutes'));
router.use('/motivos-retiro', require('./motivosRetiroRoutes'));
router.use('/tipos-actividad', require('./tiposActividadRoutes'));
router.use('/tipos-recepcion', require('./tiposRecepcionRoutes'));
router.use('/lugares', require('./lugaresRoutes'));
router.use('/tipos-duracion', require('./tiposDuracionRoutes'));
router.use('/estados', require('./estadosRoutes'));
router.use('/generos', require('./generosRoutes'));
router.use('/miembros', require('./miembrosRoutes'));
router.use('/familias', require('./familiasRoutes'));
router.use('/actividades', require('./actividadesRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
