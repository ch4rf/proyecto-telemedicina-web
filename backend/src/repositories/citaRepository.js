const pool = require('../config/db');

// Asegurar que la columna cancelado_por exista en bases de datos ya creadas
pool.query(`ALTER TABLE citas ADD COLUMN IF NOT EXISTS cancelado_por VARCHAR(20);`).catch(() => {});

const checkOverlappingCita = async (idMedico, fechaHora) => {
    const result = await pool.query(
        `SELECT id_cita FROM citas 
         WHERE id_medico = $1 
         AND fecha_hora = $2::timestamp 
         AND estado = 'PROGRAMADA'`,
        [idMedico, fechaHora]
    );
    return result.rows.length > 0;
};

const createCita = async (citaData) => {
    const { idPaciente, idMedico, fechaHora, urlVideollamada } = citaData;
    const result = await pool.query(
        `INSERT INTO citas (id_paciente, id_medico, fecha_hora, estado, url_videollamada, enlace_generado_en) 
         VALUES ($1, $2, $3, 'PROGRAMADA', $4, NOW()) RETURNING *`,
        [idPaciente, idMedico, fechaHora, urlVideollamada]
    );
    return result.rows[0];
};

const getCitaById = async (idCita) => {
    const result = await pool.query(
        `SELECT * FROM citas WHERE id_cita::text = $1 OR url_videollamada = $1`, 
        [idCita]
    );
    return result.rows[0];
};

const getCitaDetalleById = async (idCita) => {
    const query = `
        SELECT 
            c.id_cita,
            c.id_paciente,
            c.id_medico,
            c.fecha_hora,
            c.estado,
            c.cancelado_por,
            c.url_videollamada,
            c.enlace_generado_en,
            c.created_at,
            -- Paciente
            p.nombres AS paciente_nombres,
            p.apellidos AS paciente_apellidos,
            p.telefono AS paciente_telefono,
            up.correo AS paciente_correo,
            p.datos_clinicos AS paciente_datos_clinicos,
            -- Medico
            m.nombres AS medico_nombres,
            m.apellidos AS medico_apellidos,
            m.especialidad,
            um.correo AS medico_correo,
            -- Consulta y Receta (si existen)
            con.id_consulta,
            con.diagnostico,
            con.notas_clinicas,
            con.duracion_minutos,
            r.id_receta,
            r.medicamentos,
            r.indicaciones_generales
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        JOIN usuarios up ON p.id_paciente = up.id_usuario
        JOIN medicos m ON c.id_medico = m.id_medico
        JOIN usuarios um ON m.id_medico = um.id_usuario
        LEFT JOIN consultas con ON con.id_cita = c.id_cita
        LEFT JOIN recetas r ON r.id_consulta = con.id_consulta
        WHERE c.id_cita::text = $1 OR c.url_videollamada = $1;
    `;
    const result = await pool.query(query, [idCita]);
    return result.rows[0] || null;
};

const cancelarCitaPorId = async (idCita, canceladoPor = null) => {
    await pool.query(`ALTER TABLE citas ADD COLUMN IF NOT EXISTS cancelado_por VARCHAR(20);`);
    const result = await pool.query(
        `UPDATE citas 
         SET estado = 'CANCELADA', cancelado_por = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id_cita = $1 
         RETURNING *`,
        [idCita, canceladoPor]
    );
    return result.rows[0] || null;
};

module.exports = { checkOverlappingCita, createCita, getCitaById, getCitaDetalleById, cancelarCitaPorId };
