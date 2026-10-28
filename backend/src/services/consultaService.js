const consultaRepository = require('../repositories/consultaRepository');
const citaRepository = require('../repositories/citaRepository');
const medicamentoRepository = require('../repositories/medicamentoRepository');
const notificacionRepository = require('../repositories/notificacionRepository');

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

    async buscarCatalogoMedicamentos(termino = '', sincronizarExterno = false) {
        const q = String(termino || '').trim();

        // Si el médico solicita explícitamente sincronizar desde la fuente externa OpenFDA (Punto 4 de la Guía),
        // se consulta la API pública, se procesan los datos, se almacenan en PostgreSQL y se devuelven al usuario.
        if (sincronizarExterno && q.length >= 3 && typeof fetch === 'function') {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4500);
                const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(q)}"+openfda.generic_name:"${encodeURIComponent(q)}"&limit=3`;
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);

                if (response.ok) {
                    const json = await response.json();
                    const items = Array.isArray(json.results) ? json.results : [];
                    for (const item of items) {
                        const brand = item.openfda?.brand_name?.[0];
                        const generic = item.openfda?.generic_name?.[0];
                        const route = item.openfda?.route?.[0] || 'Oral';
                        if (brand || generic) {
                            const nombreComercial = String(brand || generic).slice(0, 180);
                            const principioActivo = String(generic || brand).slice(0, 180);
                            await medicamentoRepository.guardarMedicamentoExterno({
                                nombre_comercial: nombreComercial,
                                principio_activo: principioActivo,
                                presentacion: `Vía ${route}`,
                                dosis_recomendada: '1 unidad (según indicación)',
                                frecuencia_recomendada: 'Cada 8 a 12 horas',
                                duracion_recomendada: '5 días',
                                fuente: 'OpenFDA API'
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn('[ConsultaService] Aviso al consultar OpenFDA API:', err.message);
            }
        }

        return await medicamentoRepository.buscarPorTermino(q);
    }

    async agregarMedicamentoCatalogo(id_usuario, rol, datos) {
        if (rol !== 'MEDICO') {
            throw new Error('Solo los médicos especialistas pueden agregar medicamentos al catálogo clínico');
        }

        const nombre_comercial = String(datos.nombre_comercial || '').trim();
        const principio_activo = String(datos.principio_activo || '').trim();
        const presentacion = String(datos.presentacion || 'Tabletas / Cápsulas').trim();
        const dosis_recomendada = String(datos.dosis_recomendada || '1 unidad').trim();
        const frecuencia_recomendada = String(datos.frecuencia_recomendada || 'Cada 8 horas').trim();
        const duracion_recomendada = String(datos.duracion_recomendada || '5 días').trim();

        if (!nombre_comercial || !principio_activo) {
            throw new Error('El nombre comercial y el principio activo son obligatorios');
        }

        const nuevoMed = await medicamentoRepository.guardarMedicamentoExterno({
            nombre_comercial,
            principio_activo,
            presentacion,
            dosis_recomendada,
            frecuencia_recomendada,
            duracion_recomendada,
            fuente: 'Catálogo Médico NovaSalud'
        });

        try {
            await notificacionRepository.crear(
                id_usuario,
                'Medicamento Agregado al Catálogo',
                `Has registrado "${nombre_comercial}" (${principio_activo}) exitosamente en el catálogo clínico.`,
                'INFO'
            );
        } catch (err) {
            console.warn('Aviso al crear notificación de catálogo:', err.message);
        }

        return nuevoMed;
    }

    async eliminarMedicamentoCatalogo(id_usuario, rol, id_medicamento) {
        if (rol !== 'MEDICO') {
            throw new Error('Solo los médicos especialistas pueden eliminar medicamentos del catálogo');
        }
        const idLimpio = String(id_medicamento || '').trim();
        if (!idLimpio) {
            throw new Error('ID de medicamento requerido');
        }
        const eliminado = await medicamentoRepository.eliminarPorId(idLimpio);
        if (!eliminado) {
            throw new Error('Medicamento no encontrado en el catálogo');
        }
        return eliminado;
    }

    async registrarDescargaReceta(id_usuario, rol, datos = {}) {
        const folio = String(datos.folio || 'REC').trim();
        const id_cita = datos.id_cita || null;

        // 1. Notificar al usuario que realizó la descarga (paciente o médico)
        const notifUsuario = await notificacionRepository.crear(
            id_usuario,
            'Receta Médica Descargada (PDF)',
            `Has descargado exitosamente el documento oficial en PDF de la receta médica #${folio}.`,
            'RECETA'
        );

        // 2. Si viene id_cita, notificar también a la contraparte (médico o paciente) como en el agendamiento de citas
        if (id_cita) {
            try {
                const cita = await citaRepository.getCitaById(id_cita);
                if (cita) {
                    const idContraparte = rol === 'PACIENTE' ? cita.id_medico : cita.id_paciente;
                    if (idContraparte && String(idContraparte) !== String(id_usuario)) {
                        const actor = rol === 'PACIENTE' ? 'El paciente' : 'El médico especialista';
                        await notificacionRepository.crear(
                            idContraparte,
                            'Descarga de Receta Médica',
                            `${actor} ha descargado en PDF la receta médica #${folio} asociada a su consulta.`,
                            'RECETA'
                        );
                    }
                }
            } catch (err) {
                console.warn('Aviso al notificar contraparte por descarga de receta:', err.message);
            }
        }

        return notifUsuario;
    }
}

module.exports = new ConsultaService();
