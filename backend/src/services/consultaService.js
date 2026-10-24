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
}

module.exports = new ConsultaService();
