const crypto = require('crypto');
const citaRepository = require('../repositories/citaRepository');
const pacienteRepository = require('../repositories/pacienteRepository');
const medicoRepository = require('../repositories/medicoRepository');
const notificacionRepository = require('../repositories/notificacionRepository');

const agendarCita = async (citaData) => {
    const { idPaciente, idMedico, fechaHora } = citaData;
    const fechaCita = new Date(fechaHora);
    const ahora = new Date();
    
    if (fechaCita < ahora) throw new Error('No se pueden agendar citas en fechas u horas pasadas');
    
    const isOverlap = await citaRepository.checkOverlappingCita(idMedico, fechaHora);
    if (isOverlap) throw new Error('El médico ya tiene una cita programada en ese horario exacto');

    // Generar URL única y segura para la videollamada
    const urlVideollamada = crypto.randomBytes(16).toString('hex');

    const nuevaCita = await citaRepository.createCita({ idPaciente, idMedico, fechaHora, urlVideollamada });

    // Notificaciones automáticas de confirmación
    try {
        const fechaTexto = fechaCita.toLocaleDateString('es-ES', { 
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
        });
        await notificacionRepository.crear(
            idPaciente,
            'Cita Médica Agendada',
            `Tu cita ha sido programada con éxito para el ${fechaTexto}.`,
            'CITA'
        );
        await notificacionRepository.crear(
            idMedico,
            'Nueva Cita en Agenda',
            `Tienes una nueva teleconsulta agendada para el ${fechaTexto}.`,
            'CITA'
        );
    } catch (notifErr) {
        console.warn('Advertencia al registrar notificación de cita:', notifErr.message);
    }

    return nuevaCita;
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

const obtenerMisCitas = async (idUsuario, rol) => {
    if (rol === 'PACIENTE') {
        return await pacienteRepository.getCitasByPaciente(idUsuario);
    } else if (rol === 'MEDICO') {
        return await medicoRepository.getCitasByMedico(idUsuario);
    }
    return [];
};

const obtenerDetalleCita = async (idCita, idUsuario, rol) => {
    const cita = await citaRepository.getCitaDetalleById(idCita);
    if (!cita) {
        throw new Error('Cita no encontrada');
    }

    // Regla de Autorización: El usuario debe ser el paciente o el médico asignado a la cita
    if (cita.id_paciente !== idUsuario && cita.id_medico !== idUsuario) {
        throw new Error('No tienes autorización para consultar los detalles de esta cita');
    }

    // Regla de Negocio RN-04: Disponibilidad de Sala Virtual (10 minutos antes o médico)
    const fechaCita = new Date(cita.fecha_hora);
    const ahora = new Date();
    const diferenciaMinutos = (fechaCita - ahora) / (1000 * 60);

    // El médico siempre puede acceder a preparar su sala, el paciente accede 10 min antes
    const salaHabilitada = cita.estado === 'PROGRAMADA' && (rol === 'MEDICO' || diferenciaMinutos <= 10);
    const minutosParaApertura = diferenciaMinutos > 10 ? Math.ceil(diferenciaMinutos - 10) : 0;

    return {
        ...cita,
        sala_habilitada: salaHabilitada,
        minutos_para_apertura: minutosParaApertura,
        enlace_videollamada: `/sala/${cita.url_videollamada}`
    };
};

module.exports = { agendarCita, obtenerAccesoVideollamada, obtenerMisCitas, obtenerDetalleCita };
