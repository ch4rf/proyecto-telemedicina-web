const statsService = require('../services/statsService');

class StatsController {
    async getEstadisticas(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            console.log(`[statsController.getEstadisticas] User: ${id_usuario}, Rol: ${rol}`);
            const data = await statsService.calcularMetricas(id_usuario, rol);
            console.log(`[statsController.getEstadisticas] Citas activas: ${data.citas_activas}`);
            return res.status(200).json({
                ok: true,
                data
            });
        } catch (error) {
            console.error('Error al calcular estadísticas:', error.message);
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }
}

module.exports = new StatsController();
