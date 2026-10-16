// ==========================================
// CAPA CONTROLLER - DASHBOARD
// ==========================================
const dashboardService = require('../services/dashboardService');

// GET: Obtener todas las estadísticas para el panel
const cargarEstadisticas = async (req, res) => {
  try {
    const stats = await dashboardService.obtenerEstadisticasGlobales();
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar las estadísticas del dashboard' });
  }
};

module.exports = {
  cargarEstadisticas
};