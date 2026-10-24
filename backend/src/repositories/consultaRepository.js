const pool = require('../config/db');

class ConsultaRepository {
    async crearConsultaYReceta(datos) {
        const {
            id_cita,
            diagnostico,
            notas_clinicas,
            duracion_minutos = 15,
            medicamentos = [],
            indicaciones_generales = ''
        } = datos;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener la cita y verificar su existencia
            const citaRes = await client.query(
                'SELECT id_cita, id_paciente, id_medico, estado FROM citas WHERE id_cita = $1 FOR UPDATE',
                [id_cita]
            );
            if (citaRes.rows.length === 0) {
                throw new Error('La cita especificada no existe');
            }
            const cita = citaRes.rows[0];

            // 2. Insertar o actualizar en la tabla consultas
            const consultaRes = await client.query(
                `INSERT INTO consultas (id_cita, diagnostico, notas_clinicas, duracion_minutos)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id_cita) DO UPDATE SET
                     diagnostico = EXCLUDED.diagnostico,
                     notas_clinicas = EXCLUDED.notas_clinicas,
                     duracion_minutos = EXCLUDED.duracion_minutos,
                     updated_at = CURRENT_TIMESTAMP
                 RETURNING id_consulta, id_cita, diagnostico, notas_clinicas, duracion_minutos, fecha_atencion, created_at;`,
                [id_cita, diagnostico, notas_clinicas, duracion_minutos]
            );
            const consulta = consultaRes.rows[0];

            // 3. Insertar en la tabla recetas si hay medicamentos o indicaciones
            let receta = null;
            if (Array.isArray(medicamentos) && medicamentos.length > 0) {
                const recetaRes = await client.query(
                    `INSERT INTO recetas (id_consulta, medicamentos, indicaciones_generales)
                     VALUES ($1, $2, $3)
                     RETURNING id_receta, id_consulta, medicamentos, indicaciones_generales, created_at;`,
                    [consulta.id_consulta, JSON.stringify(medicamentos), indicaciones_generales]
                );
                receta = recetaRes.rows[0];
            }

            // 4. Actualizar el estado de la cita a COMPLETADA
            await client.query(
                `UPDATE citas SET estado = 'COMPLETADA', updated_at = CURRENT_TIMESTAMP WHERE id_cita = $1;`,
                [id_cita]
            );

            // 5. Generar notificación automática para el paciente
            await client.query(
                `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo)
                 VALUES ($1, $2, $3, 'RECETA');`,
                [
                    cita.id_paciente,
                    'Consulta Finalizada y Receta Emitida',
                    'Su médico ha finalizado la sesión clínica. Ya puede consultar su diagnóstico y receta en el portal.'
                ]
            );

            await client.query('COMMIT');
            return { consulta, receta };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async obtenerPorCita(id_cita) {
        const query = `
            SELECT c.id_consulta, c.id_cita, c.diagnostico, c.notas_clinicas, c.duracion_minutos, c.fecha_atencion,
                   r.id_receta, r.medicamentos, r.indicaciones_generales,
                   ci.fecha_hora, ci.estado,
                   m.nombres AS medico_nombres, m.apellidos AS medico_apellidos, m.especialidad,
                   p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos
            FROM consultas c
            JOIN citas ci ON c.id_cita = ci.id_cita
            JOIN medicos m ON ci.id_medico = m.id_medico
            JOIN pacientes p ON ci.id_paciente = p.id_paciente
            LEFT JOIN recetas r ON c.id_consulta = r.id_consulta
            WHERE c.id_cita = $1;
        `;
        const { rows } = await pool.query(query, [id_cita]);
        return rows[0] || null;
    }

    async obtenerRecetasPorUsuario(id_usuario, rol) {
        let query = '';
        if (rol === 'PACIENTE') {
            query = `
                SELECT r.id_receta, r.medicamentos, r.indicaciones_generales, r.created_at,
                       c.diagnostico,
                       ci.id_cita, ci.fecha_hora,
                       m.nombres AS medico_nombres, m.apellidos AS medico_apellidos, m.especialidad
                FROM recetas r
                JOIN consultas c ON r.id_consulta = c.id_consulta
                JOIN citas ci ON c.id_cita = ci.id_cita
                JOIN medicos m ON ci.id_medico = m.id_medico
                WHERE ci.id_paciente = $1
                ORDER BY r.created_at DESC;
            `;
        } else if (rol === 'MEDICO') {
            query = `
                SELECT r.id_receta, r.medicamentos, r.indicaciones_generales, r.created_at,
                       c.diagnostico,
                       ci.id_cita, ci.fecha_hora,
                       p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos
                FROM recetas r
                JOIN consultas c ON r.id_consulta = c.id_consulta
                JOIN citas ci ON c.id_cita = ci.id_cita
                JOIN pacientes p ON ci.id_paciente = p.id_paciente
                WHERE ci.id_medico = $1
                ORDER BY r.created_at DESC;
            `;
        } else {
            return [];
        }

        const { rows } = await pool.query(query, [id_usuario]);
        return rows;
    }

    async guardarNotasDiagnostico(datos) {
        const {
            id_cita,
            diagnostico = '',
            notas_clinicas = '',
            duracion_minutos = 0
        } = datos;

        const query = `
            INSERT INTO consultas (id_cita, diagnostico, notas_clinicas, duracion_minutos)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id_cita) 
            DO UPDATE SET 
                diagnostico = EXCLUDED.diagnostico,
                notas_clinicas = EXCLUDED.notas_clinicas,
                duracion_minutos = EXCLUDED.duracion_minutos,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id_consulta, id_cita, diagnostico, notas_clinicas, duracion_minutos, updated_at;
        `;
        const { rows } = await pool.query(query, [id_cita, diagnostico, notas_clinicas, duracion_minutos]);
        return rows[0];
    }
}

module.exports = new ConsultaRepository();
