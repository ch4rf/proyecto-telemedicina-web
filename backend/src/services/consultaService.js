const consultaRepository = require('../repositories/consultaRepository');
const citaRepository = require('../repositories/citaRepository');
const medicamentoRepository = require('../repositories/medicamentoRepository');

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

    async buscarCatalogoMedicamentos(termino = '') {
        const q = String(termino || '').trim();
        let resultadosLocales = await medicamentoRepository.buscarPorTermino(q);

        // Si el término tiene 3+ caracteres y hay pocos resultados locales, consultar API externa OpenFDA,
        // procesar los datos, almacenarlos en PostgreSQL y devolverlos al usuario (Punto 4 de la Guía)
        if (q.length >= 3 && resultadosLocales.length < 3 && typeof fetch === 'function') {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3500);
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
                    resultadosLocales = await medicamentoRepository.buscarPorTermino(q);
                }
            } catch (err) {
                console.warn('[ConsultaService] Fallback a catálogo local PostgreSQL (OpenFDA no disponible o sin coincidencias):', err.message);
            }
        }

        return resultadosLocales;
    }
}

module.exports = new ConsultaService();
