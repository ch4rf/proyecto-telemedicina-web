const pool = require('../config/db');

const getAllMedicos = async (especialidad = null) => {
    let query = `SELECT id_medico, nombres, apellidos, especialidad, disponibilidad FROM medicos`;
    const params = [];
    if (especialidad) {
        query += ` WHERE especialidad = $1`;
        params.push(especialidad);
    }
    const result = await pool.query(query, params);
    return result.rows;
};

const getCitasByMedico = async (idMedico) => {
    const result = await pool.query(
        `SELECT c.id_cita, c.fecha_hora, c.estado, c.cancelado_por, c.url_videollamada, 
                p.id_paciente, p.nombres AS paciente_nombres, p.apellidos AS paciente_apellidos
         FROM citas c
         JOIN pacientes p ON c.id_paciente = p.id_paciente
         WHERE c.id_medico = $1
         ORDER BY c.fecha_hora ASC`,
        [idMedico]
    );
    return result.rows;
};

module.exports = { getAllMedicos, getCitasByMedico };
