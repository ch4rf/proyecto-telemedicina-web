const pool = require('../config/db');

const checkOverlappingCita = async (idMedico, fechaHora) => {
    const result = await pool.query(
        `SELECT id_cita FROM citas 
         WHERE id_medico = $1 
         AND fecha_hora = $2 
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
    const result = await pool.query(`SELECT * FROM citas WHERE id_cita = $1`, [idCita]);
    return result.rows[0];
};

module.exports = { checkOverlappingCita, createCita, getCitaById };
