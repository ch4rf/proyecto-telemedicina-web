// ==========================================
// FAMILIAS - REPORTE PDF (CENSO FAMILIAR)
// ==========================================
import { fetchMiembros } from './api.js';

export var initPdfReportEvents = function(stateProvider) {
    var modalReporte = document.getElementById('modalReporteFamilias');
    var selectFiltroZona = document.getElementById('selectFiltroZonaReporte');
    var inputBuscarReporte = document.getElementById('inputBuscarFamiliaReporte');
    var listaFamiliasReporte = document.getElementById('listaFamiliasReporte');
    var checkSeleccionarTodas = document.getElementById('checkSeleccionarTodasReporte');
    var contadorFamiliasFiltradas = document.getElementById('contadorFamiliasFiltradas');

    var miembrosParaReporte = [];

    // --- RENDERIZAR LISTA CON CHECKBOXES ---
    var renderizarListaReporte = function(datosFiltrados) {
        listaFamiliasReporte.innerHTML = '';
        contadorFamiliasFiltradas.textContent = datosFiltrados.length + ' familias encontradas';
        checkSeleccionarTodas.checked = false;

        if (datosFiltrados.length === 0) {
            listaFamiliasReporte.innerHTML = '<li style="text-align:center; padding:15px; color:#94a3b8;">No se encontraron coincidencias.</li>';
            return;
        }

        datosFiltrados.forEach(function(f) {
            var zonaText = f.zona || 'N/A';
            var direccion = [f.calle_avenida, f.referencia_casa].filter(Boolean).join(' - ') || 'Sin dirección específica';

            listaFamiliasReporte.innerHTML += '<li class="item-checkbox">' +
                '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%; padding:10px;">' +
                    '<input type="checkbox" class="check-familia-reporte" value="' + f.id_familia + '" style="width: 16px; height: 16px; cursor:pointer;">' +
                    '<div style="display:flex; flex-direction:column;">' +
                        '<span style="font-size: 14px; color:#334155;"><strong>' + f.nombre_familia + '</strong></span>' +
                        '<span style="font-size: 12px; color:#64748b;"><i class="fas fa-map-marker-alt"></i> ' + zonaText + ' | ' + direccion + '</span>' +
                    '</div>' +
                '</label>' +
            '</li>';
        });
    };

    // --- MOTOR DE FILTROS ---
    var filtrarBaseDatosReporte = function() {
        var state = stateProvider();
        var texto = inputBuscarReporte.value.toLowerCase().trim();
        var zonaId = selectFiltroZona.value;

        var filtradas = state.datosGlobalesFamilias.filter(function(f) {
            var strBusqueda = (f.nombre_familia + ' ' + (f.calle_avenida || '') + ' ' + (f.referencia_casa || '')).toLowerCase();
            var pasaFiltroTexto = strBusqueda.includes(texto);
            var pasaFiltroZona = (zonaId === 'TODOS') || (f.id_zona == zonaId);
            return pasaFiltroTexto && pasaFiltroZona;
        });

        renderizarListaReporte(filtradas);
    };

    // --- ABRIR MODAL ---
    document.getElementById('btnAbrirModalReporte').addEventListener('click', async function() {
        var state = stateProvider();
        if (state.datosGlobalesFamilias.length === 0) {
            return Swal.fire('Atención', 'No hay familias registradas para exportar.', 'info');
        }

        try {
            miembrosParaReporte = await fetchMiembros();
        } catch (error) {
            console.error("Error al precargar miembros:", error);
        }

        var opcionesOriginales = document.getElementById('selectZona').innerHTML;
        var opcionPlaceholder = '<option value="" selected="" disabled="">-- Seleccione Asentamiento / Sector --</option>';
        selectFiltroZona.innerHTML = '<option value="TODOS">Todos los sectores</option>' + opcionesOriginales.replace(opcionPlaceholder, '');

        inputBuscarReporte.value = '';
        selectFiltroZona.value = 'TODOS';
        checkSeleccionarTodas.checked = false;

        renderizarListaReporte(state.datosGlobalesFamilias);
        modalReporte.classList.add('modal-activo');
    });

    // --- CERRAR MODAL ---
    var cerrarModalReporte = function() { modalReporte.classList.remove('modal-activo'); };
    document.getElementById('btnCancelarReporte').addEventListener('click', cerrarModalReporte);

    // --- EVENTOS DE FILTROS ---
    inputBuscarReporte.addEventListener('input', filtrarBaseDatosReporte);
    selectFiltroZona.addEventListener('change', filtrarBaseDatosReporte);

    // --- SELECCIÓN MAESTRA ---
    checkSeleccionarTodas.addEventListener('change', function(e) {
        document.querySelectorAll('.check-familia-reporte').forEach(function(cb) { cb.checked = e.target.checked; });
    });

    // --- EXPORTAR PDF ---
    document.getElementById('btnExportarPDF').addEventListener('click', function() {
        var state = stateProvider();
        var checkboxesMarcados = document.querySelectorAll('.check-familia-reporte:checked');

        if (checkboxesMarcados.length === 0) {
            return Swal.fire('Atención', 'Debes seleccionar al menos una familia de la lista para imprimir el reporte.', 'warning');
        }

        var idsSeleccionados = Array.from(checkboxesMarcados).map(function(cb) { return cb.value; });
        var familiasParaImprimir = state.datosGlobalesFamilias.filter(function(f) {
            return idsSeleccionados.includes(f.id_familia.toString());
        });

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // COLORES UNIFICADOS PARA EL REPORTE
        var colorPrincipal = [30, 58, 138];
        var colorTexto = [71, 85, 105];

        // --- ENCABEZADO GLOBAL ---
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
        doc.text('Censo y Directorio Familiar', 14, 20);

        var fechaActual = new Date().toLocaleDateString('es-GT');
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('Generado el: ' + fechaActual, 14, 26);
        doc.text('Familias listadas: ' + familiasParaImprimir.length, 14, 31);

        var cursorY = 40;

        var addFooter = function(data) {
            var pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text('Página ' + data.pageNumber + ' de ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
            doc.text('Gestión Nazareno', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        };

        // --- ITERACIÓN POR FAMILIAS ---
        familiasParaImprimir.forEach(function(f) {
            if (cursorY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                cursorY = 20;
            }

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
            doc.text(f.nombre_familia, 14, cursorY);

            cursorY += 5;
            var zonaText = f.zona || 'N/A';
            var direccion = [f.calle_avenida, f.referencia_casa].filter(Boolean).join(' - ') || 'Dirección no especificada';

            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text('Ubicación: ' + zonaText + ' | ' + direccion, 14, cursorY);

            cursorY += 6;

            var integrantes = miembrosParaReporte.filter(function(m) { return m.id_familia == f.id_familia; });

            if (integrantes.length === 0) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(156, 163, 175);
                doc.text("No hay integrantes registrados en esta familia.", 14, cursorY);
                cursorY += 15;
            } else {
                var encabezadosMiembros = ["Nombre Completo", "Teléfono", "Fecha Nac."];
                var filasMiembros = integrantes.map(function(m) {
                    var fechaNacFormatted = 'N/A';
                    if (m.fecha_nacimiento) {
                        var fechaObj = new Date(m.fecha_nacimiento + 'T00:00:00');
                        if (!isNaN(fechaObj)) fechaNacFormatted = fechaObj.toLocaleDateString('es-GT');
                    }
                    return [
                        m.nombres + ' ' + m.apellidos,
                        m.telefono || 'N/A',
                        fechaNacFormatted
                    ];
                });

                doc.autoTable({
                    startY: cursorY,
                    head: [encabezadosMiembros],
                    body: filasMiembros,
                    theme: 'grid',
                    headStyles: {
                        fillColor: colorPrincipal,
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    bodyStyles: { textColor: colorTexto, fontSize: 9 },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    margin: { left: 14, right: 14 },
                    didDrawPage: addFooter
                });

                cursorY = doc.lastAutoTable.finalY + 15;
            }
        });

        // --- DESCARGA ---
        var fechaArchivo = new Date().toLocaleDateString('es-GT').replace(/\//g, '-');
        var nombreArchivo = 'Censo_Familiar_' + fechaArchivo + '.pdf';

        if (selectFiltroZona.value !== 'TODOS') {
            var textoSector = selectFiltroZona.options[selectFiltroZona.selectedIndex].text.replace(/\s+/g, '_');
            nombreArchivo = 'Censo_' + textoSector + '_' + fechaArchivo + '.pdf';
        }

        doc.save(nombreArchivo);
        cerrarModalReporte();
    });
};