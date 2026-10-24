const pacienteRepository = require('../repositories/pacienteRepository');

const obtenerPerfil = async (idPaciente) => {
    const paciente = await pacienteRepository.getPacienteById(idPaciente);
    if (!paciente) throw new Error('Paciente no encontrado');
    return paciente;
};

const obtenerHistorialCitas = async (idPaciente) => {
    // Aquí podríamos aplicar reglas de negocio adicionales si fuera necesario
    const citas = await pacienteRepository.getCitasByPaciente(idPaciente);
    return citas;
};

const listarPacientes = async () => {
    return await pacienteRepository.getAllPacientes();
};

module.exports = { obtenerPerfil, obtenerHistorialCitas, listarPacientes };
