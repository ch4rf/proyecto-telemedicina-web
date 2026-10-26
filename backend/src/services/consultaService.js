const consultaRepository = require('../repositories/consultaRepository');
const citaRepository = require('../repositories/citaRepository');

class ConsultaService {
    async registrarAtencion(id_medico, datos) {
        const { id_cita, diagnostico } = datos;

        if (!id_cita) {
            throw new Error('El identificador de la cita es obligatorio');
        }
        if (!diagnostico || diagnostico.trim().length === 0) {
            throw new Error('El diagnóstico clínico es obligatorio para finalizar la consulta');
        }

        const cita = await citaRepository.getCitaById(id_cita);
        if (!cita) {
            throw new Error('Cita no encontrada');
        }

        if (cita.id_medico !== id_medico) {
            throw new Error('Solo el médico asignado a esta cita puede emitir el expediente y receta');
        }

        if (cita.estado === 'COMPLETADA') {
            throw new Error('Esta cita ya ha sido completada previamente');
        }

        datos.id_cita = cita.id_cita;
        return await consultaRepository.crearConsultaYReceta(datos);
    }

    async consultarPorCita(id_cita) {
        if (!id_cita) {
            throw new Error('ID de cita requerido');
        }
        const registro = await consultaRepository.obtenerPorCita(id_cita);
        if (!registro) {
            throw new Error('No se encontró expediente registrado para esta cita');
        }
        return registro;
    }

    async listarRecetas(id_usuario, rol) {
        return await consultaRepository.obtenerRecetasPorUsuario(id_usuario, rol);
    }

    async guardarNotas(id_medico, datos) {
        const { id_cita, diagnostico, notas_clinicas, duracion_minutos } = datos;
        if (!id_cita) {
            throw new Error('El ID de cita es requerido');
        }
        const cita = await citaRepository.getCitaById(id_cita);
        if (!cita) {
            throw new Error('Cita no encontrada');
        }
        if (cita.id_medico !== id_medico) {
            throw new Error('Solo el médico asignado puede editar las notas clínicas');
        }
        return await consultaRepository.guardarNotasDiagnostico({
            id_cita: cita.id_cita,
            diagnostico: diagnostico || 'En evaluación clínica',
            notas_clinicas: notas_clinicas || '',
            duracion_minutos: duracion_minutos || 0
        });
    }

    async obtenerHistorialPaciente(id_paciente, id_usuario, rol) {
        const idPacienteLimpio = id_paciente ? String(id_paciente).trim() : '';
        if (!idPacienteLimpio) {
            throw new Error('ID de paciente inválido');
        }

        if (rol === 'PACIENTE') {
            if (String(id_usuario) !== idPacienteLimpio) {
                throw new Error('No tiene autorización para consultar el historial clínico de otro paciente');
            }
        } else if (rol === 'MEDICO') {
            // RN-05: Un médico solo puede consultar el historial clínico de los pacientes que tienen citas asignadas con él
            const tieneRelacion = await consultaRepository.verificarRelacionMedicoPaciente(id_usuario, idPacienteLimpio);
            if (!tieneRelacion) {
                throw new Error('Acceso restringido (RN-05): Solo puede consultar el historial clínico de pacientes con citas asignadas a usted');
            }
        } else {
            throw new Error('Rol no autorizado para consultar historial clínico');
        }

        return await consultaRepository.obtenerHistorialPorPaciente(idPacienteLimpio);
    }
}

module.exports = new ConsultaService();
