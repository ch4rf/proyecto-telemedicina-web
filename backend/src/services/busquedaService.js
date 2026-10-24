const busquedaRepository = require('../repositories/busquedaRepository');

class BusquedaService {
    async ejecutarBusqueda(termino, id_usuario, rol) {
        if (!termino || termino.trim().length === 0) {
            return { medicos: [], citas: [] };
        }

        const queryLimpio = termino.trim();
        const [medicos, citas] = await Promise.all([
            busquedaRepository.buscarMedicos(queryLimpio),
            busquedaRepository.buscarCitas(id_usuario, rol, queryLimpio)
        ]);

        return {
            medicos,
            citas
        };
    }
}

module.exports = new BusquedaService();
