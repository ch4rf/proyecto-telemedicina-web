import { fetchConfiguracion, fetchActividades, fetchMiembros, saveActividad, deleteActividad } from './js/api.js';
import { renderizarMenu, initSidebarEvents } from '../../core/sidebar.js';
import { aplicarFiltros, initTableEvents } from './js/table.js';
import { initFormModalEvents, abrirModalParaEdicion, cerrarModalActividad } from './js/formModal.js';
import { initPdfReportEvents } from './js/pdfReport.js';

// ==========================================
// ESTADO GLOBAL DEL MÓDULO
// ==========================================
const state = {
    datosGlobalesActividades: [],
    configuracionFormulario: {},
    listaMiembros: [],
    idActividadEnEdicion: null,
    idMiembroSeleccionado: null
};

// ==========================================
// CARGA DE DATOS (API)
// ==========================================
const cargarDatosIniciales = async () => {
    try {
        const selectRango = document.getElementById('filtroRango');
        if (selectRango) {
            selectRango.value = 'mes_actual';
        }

        state.configuracionFormulario = await fetchConfiguracion();
        state.listaMiembros = await fetchMiembros();
        await cargarActividades();
    } catch (error) {
        console.error("Error al iniciar:", error);
    }
};

const cargarActividades = async () => {
    try {
        state.datosGlobalesActividades = await fetchActividades();
        aplicarFiltros(state.datosGlobalesActividades);
    } catch (error) {
        console.error("Error al cargar las actividades:", error);
    }
};

// ==========================================
// INICIALIZACIÓN PRINCIPAL (ORQUESTADOR)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar
    renderizarMenu();
    initSidebarEvents();

    // 2. Tabla y Filtros
    initTableEvents({
        onFilterChange: () => aplicarFiltros(state.datosGlobalesActividades),
        onDelete: async (id) => {
            const confirmacion = await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esta acción.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (confirmacion.isConfirmed) {
                try {
                    const res = await deleteActividad(id);
                    if (res.ok) {
                        Swal.fire('¡Eliminado!', 'La actividad ha sido borrada.', 'success');
                        await cargarActividades(); 
                    }
                } catch (error) {
                    console.error("Error al eliminar:", error);
                    Swal.fire('Error', 'Hubo un problema al eliminar.', 'error');
                }
            }
        },
        onEdit: (id) => {
            state.idActividadEnEdicion = id;
            const actividad = state.datosGlobalesActividades.find(a => a.id_actividad == id);

            if (actividad) {
                if (actividad.id_miembro_anfitrion) {
                    state.idMiembroSeleccionado = actividad.id_miembro_anfitrion;
                } else {
                    state.idMiembroSeleccionado = null;
                }
                abrirModalParaEdicion(actividad, state.configuracionFormulario);
            }
        }
    });

    // 3. Modal de Formulario
    initFormModalEvents({
        onNuevaActividad: () => {
            state.idActividadEnEdicion = null;
            state.idMiembroSeleccionado = null;
        },
        onCancel: () => {
            state.idMiembroSeleccionado = null;
        },
        onAnfitrionSelect: (idMiembro) => {
            state.idMiembroSeleccionado = idMiembro;
        },
        onSubmit: async (datos) => {
            try {
                const respuesta = await saveActividad(datos, state.idActividadEnEdicion);

                if (respuesta.ok) {
                    Swal.fire({ 
                        title: '¡Éxito!', 
                        text: state.idActividadEnEdicion ? 'Actividad actualizada.' : 'Actividad programada.', 
                        icon: 'success', 
                        timer: 1500, 
                        showConfirmButton: false 
                    });
                    state.idMiembroSeleccionado = null; 
                    cerrarModalActividad();
                    await cargarActividades();
                }
            } catch (error) {
                console.error("Error al guardar:", error);
            }
        }
    }, () => state); // Usamos un "getter" callback para asegurar que los submódulos reciban datos frescos

    // 4. Modal de Reporte PDF
    initPdfReportEvents(() => state);

    // 5. Arranque
    cargarDatosIniciales();
});