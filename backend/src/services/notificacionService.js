const notificacionRepository = require('../repositories/notificacionRepository');

class NotificacionService {
    async listarPorUsuario(id_usuario) {
        if (!id_usuario) {
            throw new Error('El ID de usuario es obligatorio');
        }
        return await notificacionRepository.obtenerPorUsuario(id_usuario);
    }

    async marcarComoLeida(id_notificacion, id_usuario) {
        if (!id_notificacion || !id_usuario) {
            throw new Error('Parámetros insuficientes para actualizar la notificación');
        }
        const notificacionActualizada = await notificacionRepository.marcarLeida(id_notificacion, id_usuario);
        if (!notificacionActualizada) {
            throw new Error('Notificación no encontrada o no pertenece al usuario autenticado');
        }
        return notificacionActualizada;
    }

    async registrarNotificacion(id_usuario, titulo, mensaje, tipo) {
        if (!id_usuario || !titulo || !mensaje) {
            throw new Error('Datos incompletos para crear la notificación');
        }
        return await notificacionRepository.crear(id_usuario, titulo, mensaje, tipo);
    }
}

module.exports = new NotificacionService();
