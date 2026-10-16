import { fetchFamilias, fetchZonas, fetchIntegrantes, fetchMiembros, saveFamilia, deleteFamilia, updateMiembro } from './js/api.js';
import { renderizarMenu, initSidebarEvents } from '../../core/sidebar.js';
import { dibujarTabla, mostrarCargandoIntegrantes, dibujarIntegrantes, mostrarErrorIntegrantes, initTableEvents, initIntegrantesEvents } from './js/table.js';
import { llenarSelectZonas, abrirFormularioEdicion, cerrarFormulario, initFormEvents, abrirModalAsignacion, cerrarModalAsignacion, initAsignacionEvents } from './js/formModal.js';
import { initPdfReportEvents } from './js/pdfReport.js';

// ==========================================
// ESTADO GLOBAL DEL MÓDULO
// ==========================================
var state = {
    datosGlobalesFamilias: [],
    modoEdicion: false,
    idFamiliaActual: null,
    idFamiliaSeleccionada: null,
    miembrosLibresGlobales: []
};

// ==========================================
// FUNCIONES DE CARGA
// ==========================================
var cargarFamilias = async function() {
    try {
        state.datosGlobalesFamilias = await fetchFamilias();
        dibujarTabla(state.datosGlobalesFamilias);
    } catch (error) { console.error(error); }
};

var cargarIntegrantes = async function(idFamilia) {
    mostrarCargandoIntegrantes();
    try {
        var respuesta = await fetchIntegrantes(idFamilia);
        if (respuesta.ok) {
            var integrantes = await respuesta.json();
            dibujarIntegrantes(integrantes);
        } else {
            var errorInfo = await respuesta.json().catch(function() { return {}; });
            console.error("Fallo del servidor:", respuesta.status, errorInfo);
            mostrarErrorIntegrantes('Error ' + respuesta.status + ': Revisa que la ruta GET \'/:id/miembros\' exista en familiasRoutes.js');
        }
    } catch (error) {
        console.error("Error al cargar integrantes:", error);
        mostrarErrorIntegrantes('Error de conexión con el servidor.');
    }
};

// ==========================================
// INICIALIZACIÓN (ORQUESTADOR)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {

    // 1. Sidebar
    renderizarMenu();
    initSidebarEvents();

    // 2. Tabla principal (maestro-detalle + acciones)
    initTableEvents({
        onRowSelect: function(idFamilia) {
            state.idFamiliaSeleccionada = idFamilia;
            var familia = state.datosGlobalesFamilias.find(function(f) { return f.id_familia == idFamilia; });
            document.getElementById('nombreFamiliaSeleccionada').textContent = familia.nombre_familia;
            
            cargarIntegrantes(idFamilia);
        },

        onEdit: function(id) {
            var f = state.datosGlobalesFamilias.find(function(item) { return item.id_familia == id; });
            if (!f) return;
            state.modoEdicion = true;
            state.idFamiliaActual = id;
            abrirFormularioEdicion(f);
        },

        onDelete: async function(id) {
            var confirmacion = await Swal.fire({
                title: '¿Eliminar familia?',
                text: 'Solo procederá si no tiene miembros adentro.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Eliminar'
            });
            if (!confirmacion.isConfirmed) return;

            try {
                var res = await deleteFamilia(id);
                if (res.ok) {
                    Swal.fire({ title: '¡Eliminada!', icon: 'success', timer: 1200, showConfirmButton: false });
                    cargarFamilias();
                } else {
                    var err = await res.json();
                    Swal.fire('Atención', err.mensaje, 'warning');
                }
            } catch (error) { console.error(error); }
        }
    });

    // 3. Tabla de integrantes (quitar miembro)
    initIntegrantesEvents({
        onQuitarIntegrante: async function(idMiembro) {
            var confirmacion = await Swal.fire({
                title: '¿Desvincular miembro?',
                text: 'El miembro ya no pertenecerá a esta familia ni heredará su dirección.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, quitar',
                cancelButtonText: 'Cancelar'
            });
            if (!confirmacion.isConfirmed) return;

            try {
                var todos = await fetchMiembros();
                var m = todos.find(function(item) { return item.id_miembro == idMiembro; });
                if (!m) return;

                var paqueteDatos = {
                    nombres: m.nombres, apellidos: m.apellidos, dpi: m.dpi,
                    fecha_nacimiento: m.fecha_nacimiento, fecha_bautismo: m.fecha_bautismo,
                    telefono: m.telefono, correo: m.correo, id_genero: m.id_genero,
                    id_profesion: m.id_profesion, id_estado: m.id_estado,
                    id_familia: null,
                    id_recepcion: m.id_recepcion, fecha_recepcion: m.fecha_recepcion,
                    id_motivo_retiro: m.id_motivo_retiro, fecha_retiro: m.fecha_retiro
                };

                var respuesta = await updateMiembro(idMiembro, paqueteDatos);
                if (respuesta.ok) {
                    Swal.fire({ title: '¡Desvinculado!', icon: 'success', timer: 1200, showConfirmButton: false });
                    cargarIntegrantes(state.idFamiliaSeleccionada);
                }
            } catch (error) { console.error(error); }
        }
    });

    // 4. Formulario familia (nuevo, cancelar, submit)
    initFormEvents({
        onSubmit: async function(datos) {
            try {
                var respuesta = await saveFamilia(datos, state.modoEdicion, state.idFamiliaActual);
                if (respuesta.ok) {
                    Swal.fire({
                        title: state.modoEdicion ? '¡Actualizada!' : '¡Registrada!',
                        icon: 'success', timer: 1500, showConfirmButton: false
                    });
                    cerrarFormulario();
                    state.modoEdicion = false;
                    state.idFamiliaActual = null;
                    cargarFamilias();
                }
            } catch (error) { console.error(error); }
        }
    });

    // 5. Asignación múltiple de miembros
    initAsignacionEvents({
        onAbrirAsignacion: async function() {
            if (!state.idFamiliaSeleccionada) return;
            try {
                var miembros = await fetchMiembros();
                state.miembrosLibresGlobales = miembros.filter(function(m) { return !m.id_familia; });

                if (state.miembrosLibresGlobales.length === 0) {
                    Swal.fire('Atención', 'No hay miembros libres sin familia en el sistema.', 'info');
                    return;
                }
                abrirModalAsignacion(state.miembrosLibresGlobales);
            } catch (error) { console.error(error); }
        },

        onGuardarAsignacion: async function(idsParaVincular) {
            try {
                Swal.fire({ title: 'Vinculando...', allowOutsideClick: false, didOpen: function() { Swal.showLoading(); } });

                var peticiones = idsParaVincular.map(function(idStr) {
                    var m = state.miembrosLibresGlobales.find(function(item) { return item.id_miembro == idStr; });
                    var paqueteDatos = {
                        nombres: m.nombres, apellidos: m.apellidos, dpi: m.dpi,
                        fecha_nacimiento: m.fecha_nacimiento, fecha_bautismo: m.fecha_bautismo,
                        telefono: m.telefono, correo: m.correo, id_genero: m.id_genero,
                        id_profesion: m.id_profesion, id_estado: m.id_estado,
                        id_familia: parseInt(state.idFamiliaSeleccionada),
                        id_recepcion: m.id_recepcion, fecha_recepcion: m.fecha_recepcion,
                        id_motivo_retiro: m.id_motivo_retiro, fecha_retiro: m.fecha_retiro,
                        rol_familiar: m.rol_familiar
                    };
                    return updateMiembro(idStr, paqueteDatos);
                });

                await Promise.all(peticiones);

                Swal.fire({
                    title: '¡Familia Actualizada!',
                    text: 'Se integraron ' + idsParaVincular.length + ' miembros correctamente.',
                    icon: 'success', timer: 1500, showConfirmButton: false
                });
                cerrarModalAsignacion();
                cargarIntegrantes(state.idFamiliaSeleccionada);
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Hubo un problema de conexión al vincular.', 'error');
            }
        }
    }, function() { return state; });

    // 6. Reporte PDF
    initPdfReportEvents(function() { return state; });

    // 7. Arranque
    fetchZonas().then(function(zonas) { llenarSelectZonas(zonas); }).catch(function(e) { console.error(e); });
    cargarFamilias();
});
