import { fetchCatalogo, saveCatalogo, deleteCatalogo } from './js/api.js';
import { renderizarMenu, initSidebarEvents } from '../../core/sidebar.js';
import { dibujarTabla, initTableEvents } from './js/table.js';
import { abrirModalNuevo, abrirModalEdicion, cerrarModal, armarPayload, initFormModalEvents } from './js/formModal.js';

// ==========================================
// ESTADO GLOBAL DEL MÓDULO
// ==========================================
var state = {
    modoEdicion: false,
    idEdicion: null,
    datosGlobales: []
};

// ==========================================
// CARGA DE DATOS
// ==========================================
var cargarDatosDinamicos = async function() {
    var selector = document.getElementById('selectorCatalogo');
    var tituloTabla = document.getElementById('tituloCatalogo');
    var endpoint = selector.value;
    var textoSeleccionado = selector.options[selector.selectedIndex].text;

    tituloTabla.textContent = 'Catálogo de ' + textoSeleccionado;

    try {
        var datos = await fetchCatalogo(endpoint);
        state.datosGlobales = datos;
        dibujarTabla(datos, endpoint);
    } catch (error) {
        console.error('Error al cargar ' + endpoint + ':', error);
        var cuerpoTabla = document.getElementById('cuerpoTablaCatalogos');
        cuerpoTabla.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error de conexión</td></tr>';
    }
};

// ==========================================
// INICIALIZACIÓN (ORQUESTADOR)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {

    // 1. Sidebar
    renderizarMenu();
    initSidebarEvents();

    // 2. Selector de catálogo
    var selector = document.getElementById('selectorCatalogo');
    selector.addEventListener('change', cargarDatosDinamicos);

    // 3. Eventos de tabla (editar / borrar)
    initTableEvents({
        onEdit: function(idReal) {
            var endpoint = document.getElementById('selectorCatalogo').value;
            state.modoEdicion = true;
            state.idEdicion = idReal;

            var registroActual = state.datosGlobales.find(function(item) {
                return item.id == idReal;
            });

            if (registroActual) {
                abrirModalEdicion(registroActual, endpoint);
            }
        },

        onDelete: async function(idReal) {
            var endpoint = document.getElementById('selectorCatalogo').value;

            var confirmacion = await Swal.fire({
                title: '¿Eliminar registro?',
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
                cancelButtonText: 'Cancelar',
                background: '#ffffff'
            });

            if (!confirmacion.isConfirmed) return;

            try {
                var respuesta = await deleteCatalogo(endpoint, idReal);
                var datosRespuesta = await respuesta.json();

                if (respuesta.ok) {
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El registro ha sido borrado del catálogo.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    cargarDatosDinamicos();
                } else {
                    Swal.fire('Atención', datosRespuesta.mensaje, 'error');
                }
            } catch (error) {
                console.error('Error al intentar eliminar:', error);
                Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
            }
        }
    });

    // 4. Eventos del modal (nuevo, cancelar, submit)
    initFormModalEvents({
        onNuevo: function() {
            var endpoint = document.getElementById('selectorCatalogo').value;
            state.modoEdicion = false;
            state.idEdicion = null;
            abrirModalNuevo(endpoint);
        },

        onSubmit: async function() {
            var endpoint = document.getElementById('selectorCatalogo').value;
            var datosParaEnviar = armarPayload(endpoint);

            try {
                var respuesta = await saveCatalogo(endpoint, datosParaEnviar, state.modoEdicion, state.idEdicion);

                if (respuesta.ok) {
                    cerrarModal();
                    Swal.fire({
                        title: state.modoEdicion ? '¡Actualizado!' : '¡Guardado!',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    cargarDatosDinamicos();
                } else {
                    var datosError = await respuesta.json();
                    Swal.fire('Error', datosError.mensaje || 'Hubo un error en la base de datos.', 'error');
                }
            } catch (error) {
                console.error('Error al procesar la solicitud del formulario:', error);
                Swal.fire('Error de Conexión', 'No se pudo comunicar con el servidor.', 'error');
            }
        }
    });

    // 5. Arranque
    cargarDatosDinamicos();
});