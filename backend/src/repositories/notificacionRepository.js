const pool = require('../config/db');

class NotificacionRepository {
    async obtenerPorUsuario(id_usuario) {
        const query = `
            SELECT id_notificacion, id_usuario, titulo, mensaje, tipo, leido, created_at
            FROM notificaciones
            WHERE id_usuario = $1
            ORDER BY created_at DESC;
        `;
        const { rows } = await pool.query(query, [id_usuario]);
        return rows;
    }

    async marcarLeida(id_notificacion, id_usuario) {
        const query = `
            UPDATE notificaciones
            SET leido = TRUE
            WHERE id_notificacion = $1 AND id_usuario = $2
            RETURNING id_notificacion, id_usuario, titulo, mensaje, tipo, leido, created_at;
        `;
        const { rows } = await pool.query(query, [id_notificacion, id_usuario]);
        return rows[0] || null;
    }

    async crear(id_usuario, titulo, mensaje, tipo = 'INFO') {
        const query = `
            INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo)
            VALUES ($1, $2, $3, $4)
            RETURNING id_notificacion, id_usuario, titulo, mensaje, tipo, leido, created_at;
        `;
        const { rows } = await pool.query(query, [id_usuario, titulo, mensaje, tipo]);
        return rows[0];
    }
}

module.exports = new NotificacionRepository();
