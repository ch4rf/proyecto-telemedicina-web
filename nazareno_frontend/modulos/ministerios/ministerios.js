import { fetchMinisterios, saveMinisterio, deleteMinisterio, fetchHistorial, cerrarCiclo, vincularMiembro, fetchMiembros } from './js/api.js';
import { renderizarMenu, initSidebarEvents } from '../../core/sidebar.js';
import { dibujarTablaMinisterios, dibujarHistorial, mostrarCargandoHistorial, resetearVistaDetalle, initTableMinisteriosEvents, initHistorialEvents } from './js/table.js';
import { abrirModalEditarMin, cerrarModalMinisterio, abrirModalAsignacion, cerrarModalAsignacion, renderizarListaBuscador, abrirModalArchivoCargando, poblarModalArchivo, initModalMinisterioEvents, initAsignacionEvents, initArchivoEvents } from './js/formModal.js';
import { initPdfReportEvents } from './js/pdfReport.js';

// ==========================================
// ESTADO GLOBAL DEL MÓDULO
// ==========================================
var state = {
    idMinisterioSeleccionado: null,
    nombreMinisterioSeleccionado: '',
    miembrosGlobales: [],
    integrantesActivosLocal: [],
    datosHistorialCompleto: [],
    modoEdicionMin: false,
    idMinEditar: null
};

// ==========================================
// FUNCIONES DE CARGA
// ==========================================
var cargarMinisterios = async function() {
    try {
        var ministerios = await fetchMinisterios();
        dibujarTablaMinisterios(ministerios);
    } catch (error) { console.error(error); }
};

var cargarHistorialActivos = async function(idMin) {
    mostrarCargandoHistorial();
    state.integrantesActivosLocal = [];
    try {
        var data = await fetchHistorial(idMin, 'activos');
        state.integrantesActivosLocal = dibujarHistorial(data);
    } catch (error) { console.error(error); }
};

// ==========================================
// INICIALIZACIÓN (ORQUESTADOR)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {

    // 1. Sidebar
    renderizarMenu();
    initSidebarEvents();

    // 2. Tabla Ministerios (maestro)
    initTableMinisteriosEvents({
        onSeleccionarMin: function(idMin, nombreMin) {
            state.idMinisterioSeleccionado = idMin;
            state.nombreMinisterioSeleccionado = nombreMin;
            document.getElementById('nombreMinisterioSeleccionado').textContent = nombreMin;
            document.getElementById('nombreMinArchivo').textContent = nombreMin;
            
            
            cargarHistorialActivos(idMin);
        },

        onEditarMin: function(id, nombre) {
            state.modoEdicionMin = true;
            state.idMinEditar = id;
            abrirModalEditarMin(id, nombre);
        },

        onBorrarMin: async function(id) {
            var confirmacion = await Swal.fire({
                title: '¿Eliminar Ministerio?',
                text: 'Solo se podrá borrar si no tiene a nadie asignado.',
                icon: 'warning', showCancelButton: true,
                confirmButtonColor: '#dc2626', confirmButtonText: 'Eliminar'
            });
            if (!confirmacion.isConfirmed) return;

            try {
                var res = await deleteMinisterio(id);
                if (res.ok) {
                    Swal.fire('Eliminado', '', 'success');
                    if (state.idMinisterioSeleccionado == id) {
                        state.idMinisterioSeleccionado = null;
                        resetearVistaDetalle();
                    }
                    cargarMinisterios();
                } else {
                    var err = await res.json();
                    Swal.fire('Atención', err.mensaje, 'warning');
                }
            } catch (error) { console.error(error); }
        }
    });

    // 3. Historial (detalle activos — baja)
    initHistorialEvents({
        onBajaHistorial: async function(idHistorial) {
            var resultado = await Swal.fire({
                title: 'Cerrar Ciclo Eclesiástico',
                text: 'Ingresa la fecha en que dejó el cargo:',
                input: 'date',
                inputValue: new Date().toISOString().split('T')[0],
                showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Dar de Baja'
            });

            if (resultado.isConfirmed && resultado.value) {
                await cerrarCiclo(idHistorial, resultado.value);
                cargarHistorialActivos(state.idMinisterioSeleccionado);
            }
        }
    });

    // 4. Modal CRUD Ministerio
    initModalMinisterioEvents({
        onNuevoMin: function() {
            state.modoEdicionMin = false;
            state.idMinEditar = null;
        },

        onGuardarMin: async function(nombre) {
            try {
                var res = await saveMinisterio(nombre, state.modoEdicionMin, state.idMinEditar);
                if (res.ok) {
                    cerrarModalMinisterio();
                    Swal.fire(state.modoEdicionMin ? 'Actualizado' : 'Creado', '', 'success');
                    cargarMinisterios();
                }
            } catch (error) { console.error(error); }
        }
    });

    // 5. Modal Asignación
    initAsignacionEvents({
        onAbrirAsignacion: async function() {
            if (!state.idMinisterioSeleccionado) return;
            var todos = await fetchMiembros();
            state.miembrosGlobales = todos.filter(function(m) {
                return !state.integrantesActivosLocal.includes(m.id_miembro);
            });
            abrirModalAsignacion(state.miembrosGlobales);
        },

        onGuardarAsignacion: async function(asignaciones, fecha) {
            Swal.fire({ title: 'Vinculando...', allowOutsideClick: false, didOpen: function() { Swal.showLoading(); } });

            var peticiones = asignaciones.map(function(asig) {
                return vincularMiembro({
                    id_ministerio: state.idMinisterioSeleccionado,
                    id_miembro: asig.id_miembro,
                    cargo: asig.cargo,
                    fecha_inicio: fecha
                });
            });

            await Promise.all(peticiones);
            Swal.fire({ title: '¡Asignados!', icon: 'success', timer: 1200, showConfirmButton: false });
            cerrarModalAsignacion();
            cargarHistorialActivos(state.idMinisterioSeleccionado);
        }
    }, function() { return state; });

    // 6. Modal Archivo Histórico
    initArchivoEvents({
        onAbrirArchivo: async function() {
            if (!state.idMinisterioSeleccionado) {
                Swal.fire({
                    title: 'Seleccione un Ministerio',
                    text: 'Primero debes seleccionar un ministerio para ver su archivo histórico.',
                    icon: 'info',
                    confirmButtonColor: '#f59e0b'
                });
                return;
            }
            abrirModalArchivoCargando(state.nombreMinisterioSeleccionado);

            try {
                state.datosHistorialCompleto = await fetchHistorial(state.idMinisterioSeleccionado, 'todos');
                poblarModalArchivo(state.datosHistorialCompleto);
            } catch (error) { console.error(error); }
        }
    });

    // 7. Reporte PDF
    initPdfReportEvents();

    // 8. Arranque
    cargarMinisterios();
});
