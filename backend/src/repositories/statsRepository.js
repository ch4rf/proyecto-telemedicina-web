const pool = require('../config/db');

class StatsRepository {
    async obtenerMetricas(id_usuario, rol) {
        // 1. Conteo de citas activas (PROGRAMADA)
        const queryCitasActivas = rol === 'PACIENTE'
            ? 'SELECT COUNT(*)::int AS total FROM citas WHERE id_paciente = $1 AND estado = \'PROGRAMADA\';'
            : 'SELECT COUNT(*)::int AS total FROM citas WHERE id_medico = $1 AND estado = \'PROGRAMADA\';';

        // 2. Conteo de recetas emitidas o recibidas
        const queryRecetas = rol === 'PACIENTE'
            ? `SELECT COUNT(*)::int AS total 
               FROM recetas r 
               JOIN consultas c ON r.id_consulta = c.id_consulta 
               JOIN citas ci ON c.id_cita = ci.id_cita 
               WHERE ci.id_paciente = $1;`
            : `SELECT COUNT(*)::int AS total 
               FROM recetas r 
               JOIN consultas c ON r.id_consulta = c.id_consulta 
               JOIN citas ci ON c.id_cita = ci.id_cita 
               WHERE ci.id_medico = $1;`;

        // 3. Conteo de videollamadas programadas para la fecha actual
        const queryVideollamadasHoy = rol === 'PACIENTE'
            ? `SELECT COUNT(*)::int AS total 
               FROM citas 
               WHERE id_paciente = $1 
                 AND estado = 'PROGRAMADA' 
                 AND DATE(fecha_hora) = CURRENT_DATE;`
            : `SELECT COUNT(*)::int AS total 
               FROM citas 
               WHERE id_medico = $1 
                 AND estado = 'PROGRAMADA' 
                 AND DATE(fecha_hora) = CURRENT_DATE;`;

        // 4. Próxima cita más inmediata
        const queryProximaCita = rol === 'PACIENTE'
            ? `SELECT c.id_cita, c.fecha_hora, c.estado, c.url_videollamada,
                      m.nombres AS medico_nombres, m.apellidos AS medico_apellidos, m.especialidad
               FROM citas c
               JOIN medicos m ON c.id_medico = m.id_medico
               WHERE c.id_paciente = $1 
                 AND c.estado = 'PROGRAMADA'
                 AND c.fecha_hora >= (NOW() - INTERVAL '10 minutes')
               ORDER BY c.fecha_hora ASC
               LIMIT 1;`
            : `SELECT c.id_cita, c.fecha_hora, c.estado, c.url_videollamada,
                      p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos
               FROM citas c
               JOIN pacientes p ON c.id_paciente = p.id_paciente
               WHERE c.id_medico = $1 
                 AND c.estado = 'PROGRAMADA'
                 AND c.fecha_hora >= (NOW() - INTERVAL '10 minutes')
               ORDER BY c.fecha_hora ASC
               LIMIT 1;`;

        const [citasRes, recetasRes, hoyRes, proximaRes] = await Promise.all([
            pool.query(queryCitasActivas, [id_usuario]),
            pool.query(queryRecetas, [id_usuario]),
            pool.query(queryVideollamadasHoy, [id_usuario]),
            pool.query(queryProximaCita, [id_usuario])
        ]);

        return {
            citas_activas: citasRes.rows[0].total,
            recetas_totales: recetasRes.rows[0].total,
            videollamadas_hoy: hoyRes.rows[0].total,
            proxima_cita: proximaRes.rows[0] || null
        };
    }
}

module.exports = new StatsRepository();
