const pool = require('../config/db');

class BusquedaRepository {
    async buscarMedicos(termino) {
        const query = `
            SELECT m.id_medico, m.nombres, m.apellidos, m.especialidad, m.disponibilidad, u.correo
            FROM medicos m
            JOIN usuarios u ON m.id_medico = u.id_usuario
            WHERE u.activo = TRUE 
              AND (
                  m.nombres ILIKE $1 
                  OR m.apellidos ILIKE $1 
                  OR m.especialidad ILIKE $1
              )
            ORDER BY m.apellidos ASC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query, [`%${termino}%`]);
        return rows;
    }

    async buscarCitas(id_usuario, rol, termino) {
        let query = '';
        let params = [];

        if (rol === 'PACIENTE') {
            query = `
                SELECT c.id_cita, c.fecha_hora, c.estado, c.url_videollamada,
                       m.nombres AS medico_nombres, m.apellidos AS medico_apellidos, m.especialidad
                FROM citas c
                JOIN medicos m ON c.id_medico = m.id_medico
                WHERE c.id_paciente = $1
                  AND (
                      m.nombres ILIKE $2 
                      OR m.apellidos ILIKE $2 
                      OR m.especialidad ILIKE $2
                      OR c.estado ILIKE $2
                  )
                ORDER BY c.fecha_hora DESC
                LIMIT 10;
            `;
            params = [id_usuario, `%${termino}%`];
        } else if (rol === 'MEDICO') {
            query = `
                SELECT c.id_cita, c.fecha_hora, c.estado, c.url_videollamada,
                       p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos, p.telefono
                FROM citas c
                JOIN pacientes p ON c.id_paciente = p.id_paciente
                WHERE c.id_medico = $1
                  AND (
                      p.nombres ILIKE $2 
                      OR p.apellidos ILIKE $2 
                      OR c.estado ILIKE $2
                  )
                ORDER BY c.fecha_hora DESC
                LIMIT 10;
            `;
            params = [id_usuario, `%${termino}%`];
        } else {
            return [];
        }

        const { rows } = await pool.query(query, params);
        return rows;
    }
}

module.exports = new BusquedaRepository();
