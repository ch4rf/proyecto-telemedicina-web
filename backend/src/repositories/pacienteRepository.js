const pool = require('../config/db');

const getPacienteById = async (idPaciente) => {
    const result = await pool.query(
        `SELECT p.id_paciente, p.nombres, p.apellidos, p.telefono, u.correo
         FROM pacientes p
         JOIN usuarios u ON p.id_paciente = u.id_usuario
         WHERE p.id_paciente = $1`,
        [idPaciente]
    );
    return result.rows[0];
};

const getCitasByPaciente = async (idPaciente) => {
    const result = await pool.query(
        `SELECT c.id_cita, c.fecha_hora, c.estado, c.url_videollamada, 
                m.id_medico, m.nombres AS medico_nombres, m.apellidos AS medico_apellidos, m.especialidad
         FROM citas c
         JOIN medicos m ON c.id_medico = m.id_medico
         WHERE c.id_paciente = $1
         ORDER BY c.fecha_hora ASC`,
        [idPaciente]
    );
    return result.rows;
};

const getAllPacientes = async () => {
    const result = await pool.query(
        `SELECT p.id_paciente, p.nombres, p.apellidos, p.telefono, u.correo
         FROM pacientes p
         JOIN usuarios u ON p.id_paciente = u.id_usuario
         ORDER BY p.nombres ASC`
    );
    return result.rows;
};

module.exports = { getPacienteById, getCitasByPaciente, getAllPacientes };
