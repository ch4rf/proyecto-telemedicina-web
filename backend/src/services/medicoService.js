const medicoRepository = require('../repositories/medicoRepository');

const listarMedicos = async (especialidad) => {
    return await medicoRepository.getAllMedicos(especialidad);
};

const obtenerAgenda = async (idMedico) => {
    return await medicoRepository.getCitasByMedico(idMedico);
};

module.exports = { listarMedicos, obtenerAgenda };
