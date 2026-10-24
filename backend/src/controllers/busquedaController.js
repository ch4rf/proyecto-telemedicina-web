const busquedaService = require('../services/busquedaService');

class BusquedaController {
    async buscar(req, res) {
        try {
            const { q } = req.query;
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;

            const resultados = await busquedaService.ejecutarBusqueda(q, id_usuario, rol);
            return res.status(200).json({
                ok: true,
                termino: q || '',
                data: resultados
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }
}

module.exports = new BusquedaController();
