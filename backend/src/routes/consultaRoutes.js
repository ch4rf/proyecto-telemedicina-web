const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Finalizar videollamada y emitir receta (médico)
router.post('/', verificarToken, (req, res) => consultaController.finalizarConsulta(req, res));

// Obtener catálogo de medicamentos desde PostgreSQL / OpenFDA (Punto 4 de la Guía)
router.get('/medicamentos/catalogo', verificarToken, (req, res) => consultaController.getCatalogoMedicamentos(req, res));

// Obtener detalles de consulta y receta de una cita en particular
router.get('/cita/:id_cita', verificarToken, (req, res) => consultaController.getConsultaPorCita(req, res));

// Guardar o actualizar notas y diagnóstico clínico (médico)
router.put('/notas', verificarToken, (req, res) => consultaController.guardarNotas(req, res));

// Obtener todas las recetas asociadas al usuario autenticado (paciente o médico)
router.get('/recetas', verificarToken, (req, res) => consultaController.getMisRecetas(req, res));

// Obtener historial clínico previo de un paciente (médico asignado según RN-05 o propio paciente)
router.get('/paciente/:idPaciente/historial', verificarToken, (req, res) => consultaController.getHistorialPaciente(req, res));

module.exports = router;
