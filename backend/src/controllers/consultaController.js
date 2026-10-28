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

    async getHistorialPaciente(req, res) {
        try {
            const { idPaciente } = req.params;
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            const historial = await consultaService.obtenerHistorialPaciente(idPaciente, id_usuario, rol);
            return res.status(200).json({
                ok: true,
                total: historial.length,
                data: historial
            });
        } catch (error) {
            const status = error.message.includes('Acceso restringido') || error.message.includes('No tiene autorización') ? 403 : 400;
            return res.status(status).json({
                ok: false,
                error: error.message
            });
        }
    }

    async getCatalogoMedicamentos(req, res) {
        try {
            const q = req.query.q || '';
            const sincronizar = req.query.sync === 'true';
            const catalogo = await consultaService.buscarCatalogoMedicamentos(q, sincronizar);
            return res.status(200).json({
                ok: true,
                total: catalogo.length,
                data: catalogo
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }

    async crearMedicamentoCatalogo(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            const nuevo = await consultaService.agregarMedicamentoCatalogo(id_usuario, rol, req.body);
            return res.status(201).json({
                ok: true,
                mensaje: 'Medicamento registrado exitosamente en el catálogo',
                data: nuevo
            });
        } catch (error) {
            const status = error.message.includes('Solo los médicos') ? 403 : 400;
            return res.status(status).json({
                ok: false,
                error: error.message
            });
        }
    }

    async eliminarMedicamentoCatalogo(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            const { id } = req.params;
            const eliminado = await consultaService.eliminarMedicamentoCatalogo(id_usuario, rol, id);
            return res.status(200).json({
                ok: true,
                mensaje: 'Medicamento eliminado del catálogo',
                data: eliminado
            });
        } catch (error) {
            const status = error.message.includes('Solo los médicos') ? 403 : 400;
            return res.status(status).json({
                ok: false,
                error: error.message
            });
        }
    }

    async notificarDescargaReceta(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const rol = req.usuario.rol;
            const notif = await consultaService.registrarDescargaReceta(id_usuario, rol, req.body);
            return res.status(201).json({
                ok: true,
                mensaje: 'Notificación de descarga registrada',
                data: notif
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
