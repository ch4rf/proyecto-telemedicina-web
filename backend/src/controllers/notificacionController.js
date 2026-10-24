const notificacionService = require('../services/notificacionService');

class NotificacionController {
    async getNotificaciones(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const notificaciones = await notificacionService.listarPorUsuario(id_usuario);
            return res.status(200).json({
                ok: true,
                total: notificaciones.length,
                data: notificaciones
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }

    async marcarLeida(req, res) {
        try {
            const id_usuario = req.usuario.id;
            const { id } = req.params;
            const notificacion = await notificacionService.marcarComoLeida(id, id_usuario);
            return res.status(200).json({
                ok: true,
                mensaje: 'Notificación marcada como leída',
                data: notificacion
            });
        } catch (error) {
            return res.status(400).json({
                ok: false,
                error: error.message
            });
        }
    }
}

module.exports = new NotificacionController();
