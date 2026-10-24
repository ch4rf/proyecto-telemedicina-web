const statsRepository = require('../repositories/statsRepository');

class StatsService {
    async calcularMetricas(id_usuario, rol) {
        if (!id_usuario || !rol) {
            throw new Error('Parámetros de autenticación requeridos para calcular estadísticas');
        }
        return await statsRepository.obtenerMetricas(id_usuario, rol);
    }
}

module.exports = new StatsService();
