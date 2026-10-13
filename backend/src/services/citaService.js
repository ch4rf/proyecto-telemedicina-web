const crypto = require('crypto');
const citaRepository = require('../repositories/citaRepository');

const agendarCita = async (citaData) => {
    const { idPaciente, idMedico, fechaHora } = citaData;
    const fechaCita = new Date(fechaHora);
    const ahora = new Date();
    
    if (fechaCita < ahora) throw new Error('No se pueden agendar citas en fechas u horas pasadas');
    
    const isOverlap = await citaRepository.checkOverlappingCita(idMedico, fechaHora);
    if (isOverlap) throw new Error('El médico ya tiene una cita programada en ese horario exacto');

    // Generar URL única y segura para la videollamada
    const urlVideollamada = crypto.randomBytes(16).toString('hex');

    return await citaRepository.createCita({ idPaciente, idMedico, fechaHora, urlVideollamada });
};

const obtenerAccesoVideollamada = async (idCita) => {
    const cita = await citaRepository.getCitaById(idCita);
    if (!cita) throw new Error('Cita no encontrada');
    if (cita.estado !== 'PROGRAMADA') throw new Error('La cita no está activa');

    // Regla RN-04: Solo habilitar 10 min antes
    const fechaCita = new Date(cita.fecha_hora);
    const ahora = new Date();
    // Diferencia en minutos
    const diferenciaMinutos = (fechaCita - ahora) / (1000 * 60);

    if (diferenciaMinutos > 10) {
        throw new Error(`La sala de espera aún no está abierta. Faltan ${Math.ceil(diferenciaMinutos - 10)} minutos para que se habilite.`);
    }

    return { 
        url_acceso: `/sala/${cita.url_videollamada}`, 
        mensaje: 'Acceso concedido a la sala virtual' 
    };
};

module.exports = { agendarCita, obtenerAccesoVideollamada };
