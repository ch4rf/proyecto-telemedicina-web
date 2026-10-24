const consultaService = require('../services/consultaService');

class ConsultaController {
    async finalizarConsulta(req, res) {
        try {
            const id_medico = req.usuario.id;
            const datos = req.body;
            const resultado = await consultaService.registrarAtencion(id_medico, datos);
            return res.status(201).json({
                ok: true,
                mensaje: 'Consulta registrada y receta emitida exitosamente',
                data: resultado
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }

    async getConsultaPorCita(req, res) {
        try {
            const { id_cita } = req.params;
            const resultado = await consultaService.consultarPorCita(id_cita);
            return res.status(200).json({
                ok: true,
                data: resultado
            });
        } catch (error) {
            return res.status(404).json({
                ok: false,
                error: error.message
            });
        }
    }

    async getMisRecetas(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            const recetas = await consultaService.listarRecetas(id_usuario, rol);
            return res.status(200).json({
                ok: true,
                total: recetas.length,
                data: recetas
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }

    async guardarNotas(req, res) {
        try {
            const id_medico = req.usuario.id;
            const resultado = await consultaService.guardarNotas(id_medico, req.body);
            return res.status(200).json({
                ok: true,
                mensaje: 'Notas clínicas guardadas con éxito',
                data: resultado
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }
}

module.exports = new ConsultaController();
