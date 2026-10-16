import { fetchMiembros, fetchCatalogos, fetchMinisteriosMiembro, saveMiembro } from './js/api.js';
import { renderizarMenu, initSidebarEvents } from '../../core/sidebar.js';
import { llenarFiltroEstado, dibujarTabla, initTableEvents, initFilterEvents } from './js/table.js';
import { llenarCatalogosFormulario, abrirFormularioNuevo, abrirFormularioEdicion, abrirFormularioBaja, cerrarFormulario, abrirPerfil, actualizarMinisteriosPerfil, initFormEvents } from './js/formModal.js';
import { initPdfReportEvents } from './js/pdfReport.js';

// ==========================================
// ESTADO GLOBAL DEL MÓDULO
// ==========================================
var state = {
    datosGlobalesMiembros: [],
    modoEdicion: false,
    idMiembroActual: null
};

// ==========================================
// FUNCIONES DE CARGA
// ==========================================
var cargarMiembros = async function() {
    try {
        state.datosGlobalesMiembros = await fetchMiembros();
        dibujarTabla(state.datosGlobalesMiembros);
    } catch (error) { console.error('Error:', error); }
};

// ==========================================
// INICIALIZACIÓN (ORQUESTADOR)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {

    // 1. Sidebar
    renderizarMenu();
    initSidebarEvents();

    // 2. Catálogos
    fetchCatalogos().then(function(catalogos) {
        llenarFiltroEstado(catalogos.estados);
        llenarCatalogosFormulario(catalogos);
    }).catch(function(error) {
        console.error('Error al cargar catálogos en los combobox', error);
    });

    // 3. Eventos de tabla (perfil, editar, baja)
    initTableEvents({
        onPerfil: async function(id) {
            var miembro = state.datosGlobalesMiembros.find(function(m) { return m.id_miembro == id; });
            abrirPerfil(miembro);

            try {
                var resMin = await fetchMinisteriosMiembro(id);
                if (resMin.ok) {
                    var ministerios = await resMin.json();
                    if (ministerios.length > 0) {
                        var texto = ministerios.map(function(m) {
                            return m.nombre_ministerio + ' (' + (m.cargo || 'Servidor') + ')';
                        }).join(', ');
                        actualizarMinisteriosPerfil(texto);
                    } else {
                        actualizarMinisteriosPerfil('Sin asignaciones');
                    }
                } else {
                    actualizarMinisteriosPerfil('Error al consultar ministerios.');
                }
            } catch (error) {
                actualizarMinisteriosPerfil('Falla de conexión al buscar ministerios.');
            }
        },

        onEdit: function(id) {
            var miembro = state.datosGlobalesMiembros.find(function(m) { return m.id_miembro == id; });
            if (!miembro) return;
            state.modoEdicion = true;
            state.idMiembroActual = id;
            abrirFormularioEdicion(miembro);
        },

        onBaja: async function(id) {
            var miembro = state.datosGlobalesMiembros.find(function(m) { return m.id_miembro == id; });
            if (!miembro) return;

            var confirmacion = await Swal.fire({
                title: '¿Dar de baja a este miembro?',
                text: 'Se abrirá su expediente para que registres el motivo y la fecha de retiro.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#b91c1c',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Proceder a la baja',
                cancelButtonText: 'Cancelar'
            });
            if (!confirmacion.isConfirmed) return;

            state.modoEdicion = true;
            state.idMiembroActual = id;
            abrirFormularioBaja(miembro);
        }
    });

    // 4. Filtro de estado
    initFilterEvents({
        onFilterChange: function(estadoId) {
            if (estadoId === 'todos') {
                dibujarTabla(state.datosGlobalesMiembros);
            } else {
                var filtrados = state.datosGlobalesMiembros.filter(function(m) { return m.id_estado == estadoId; });
                dibujarTabla(filtrados);
            }
        }
    });

    // 5. Formulario y perfil
    initFormEvents({
        onMostrarFormulario: function() {
            state.modoEdicion = false;
            state.idMiembroActual = null;
            abrirFormularioNuevo();
        },

        onCancelarFormulario: function() {
            cerrarFormulario();
            state.modoEdicion = false;
            state.idMiembroActual = null;
        },

        onSubmit: async function(datos) {
            try {
                var respuesta = await saveMiembro(datos, state.modoEdicion, state.idMiembroActual);
                if (respuesta.ok) {
                    Swal.fire({
                        title: state.modoEdicion ? '¡Actualizado!' : '¡Registrado!',
                        text: 'Los datos del miembro han sido guardados con éxito.',
                        icon: 'success', timer: 1500, showConfirmButton: false
                    });
                    cerrarFormulario();
                    state.modoEdicion = false;
                    state.idMiembroActual = null;
                    cargarMiembros();
                } else {
                    var errorDB = await respuesta.json();
                    Swal.fire('Error', errorDB.mensaje || 'Error en la base de datos.', 'error');
                }
            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                Swal.fire('Error de Conexión', 'No se pudo comunicar con el servidor.', 'error');
            }
        }
    });

    // 6. Reporte PDF
    initPdfReportEvents(function() { return state; });

    // 7. Arranque
    cargarMiembros();
});