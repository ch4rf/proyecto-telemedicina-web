// ==========================================
// MINISTERIOS - REPORTE PDF (SERVIDORES)
// ==========================================
import { fetchMinisterios, fetchHistorial } from './api.js';

export var initPdfReportEvents = function() {
    var modalReporteMin = document.getElementById('modalReporteMinisterios');
    var selectFiltroMin = document.getElementById('selectFiltroMinisterioReporte');
    var selectFiltroEstado = document.getElementById('selectFiltroEstadoReporte');
    var selectFiltroAnio = document.getElementById('selectFiltroAnioReporte');
    var contenedorFiltroAnio = document.getElementById('contenedorFiltroAnioReporte');
    var listaServidoresReporte = document.getElementById('listaServidoresReporte');
    var checkTodosMin = document.getElementById('checkSeleccionarTodosMinReporte');
    var contadorServidores = document.getElementById('contadorServidoresFiltrados');

    var datosCompletosServidores = [];
    var ministeriosParaFiltro = [];

    // --- RENDERIZAR LISTA ---
    var renderizarListaReporteMin = function(datosFiltrados) {
        listaServidoresReporte.innerHTML = '';
        contadorServidores.textContent = datosFiltrados.length + ' servidores encontrados';
        checkTodosMin.checked = false;

        if (datosFiltrados.length === 0) {
            listaServidoresReporte.innerHTML = '<li style="text-align:center; padding:15px; color:#94a3b8;">No hay servidores que coincidan con los filtros.</li>';
            return;
        }

        datosFiltrados.forEach(function(s) {
            var estadoBadge = s.estado_activo
                ? '<span style="color:#15803d; font-weight:bold; font-size:11px;">ACTIVO</span>'
                : '<span style="color:#b91c1c; font-weight:bold; font-size:11px;">BAJA</span>';
            var periodo = s.estado_activo ? s.fecha_inicio + ' a Presente' : s.fecha_inicio + ' al ' + (s.fecha_fin || 'N/A');

            listaServidoresReporte.innerHTML += '<li class="item-checkbox">' +
                '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%; padding:10px;">' +
                    '<input type="checkbox" class="check-servidor-reporte" value="' + s.id_historial + '" style="width: 16px; height: 16px; cursor:pointer;">' +
                    '<div style="display:flex; flex-direction:column;">' +
                        '<span style="font-size: 14px; color:#334155;"><strong>' + s.nombres + ' ' + s.apellidos + '</strong> - <span style="color:#8b5cf6;">' + s.cargo + '</span></span>' +
                        '<span style="font-size: 12px; color:#64748b;">' + s.nombre_ministerio + ' | ' + estadoBadge + ' | ' + periodo + '</span>' +
                    '</div>' +
                '</label>' +
            '</li>';
        });
    };

    // --- MOTOR DE FILTROS ---
    var filtrarBaseDatosReporteMin = function() {
        var minId = selectFiltroMin.value;
        var estado = selectFiltroEstado.value;
        var anio = selectFiltroAnio.value;

        if (estado === 'HISTORICO' || estado === 'TODOS') {
            contenedorFiltroAnio.classList.remove('oculto');
        } else {
            contenedorFiltroAnio.classList.add('oculto');
        }

        var filtradas = datosCompletosServidores.filter(function(s) {
            var pasaMin = (minId === 'TODOS') || (s.id_ministerio == minId);

            var pasaEstado = false;
            if (estado === 'TODOS') pasaEstado = true;
            if (estado === 'ACTIVOS' && s.estado_activo) pasaEstado = true;
            if (estado === 'HISTORICO' && !s.estado_activo) pasaEstado = true;

            var pasaAnio = true;
            if ((estado === 'HISTORICO' || estado === 'TODOS') && anio !== 'TODOS') {
                pasaAnio = (s.anio_gestion == anio);
            }

            return pasaMin && pasaEstado && pasaAnio;
        });

        renderizarListaReporteMin(filtradas);
    };

    // --- ABRIR MODAL ---
    document.getElementById('btnAbrirModalReporteMin').addEventListener('click', async function() {
        try {
            Swal.fire({ title: 'Cargando datos...', allowOutsideClick: false, didOpen: function() { Swal.showLoading(); } });

            ministeriosParaFiltro = await fetchMinisterios();

            if (ministeriosParaFiltro.length === 0) {
                Swal.close();
                return Swal.fire('Atención', 'No hay ministerios registrados.', 'info');
            }

            selectFiltroMin.innerHTML = '<option value="TODOS">Todos los Ministerios</option>';
            ministeriosParaFiltro.forEach(function(m) {
                selectFiltroMin.innerHTML += '<option value="' + m.id_ministerio + '">' + m.nombre + '</option>';
            });

            var peticiones = ministeriosParaFiltro.map(function(m) {
                return fetchHistorial(m.id_ministerio, 'todos');
            });

            var resultadosMultiples = await Promise.all(peticiones);

            datosCompletosServidores = [];
            resultadosMultiples.forEach(function(historialMin, index) {
                var nombreMinisterio = ministeriosParaFiltro[index].nombre;
                var idMinisterio = ministeriosParaFiltro[index].id_ministerio;

                historialMin.forEach(function(registro) {
                    var copia = {};
                    for (var key in registro) { copia[key] = registro[key]; }
                    copia.nombre_ministerio = nombreMinisterio;
                    copia.id_ministerio = idMinisterio;
                    datosCompletosServidores.push(copia);
                });
            });

            var aniosSet = {};
            var anios = [];
            datosCompletosServidores.forEach(function(item) {
                if (item.anio_gestion && !aniosSet[item.anio_gestion]) {
                    aniosSet[item.anio_gestion] = true;
                    anios.push(item.anio_gestion);
                }
            });
            anios.sort(function(a, b) { return b - a; });

            selectFiltroAnio.innerHTML = '<option value="TODOS">Todos los años</option>';
            anios.forEach(function(anio) {
                selectFiltroAnio.innerHTML += '<option value="' + anio + '">' + anio + '</option>';
            });

            Swal.close();

            selectFiltroEstado.value = 'ACTIVOS';
            contenedorFiltroAnio.classList.add('oculto');
            selectFiltroAnio.value = 'TODOS';
            checkTodosMin.checked = false;

            filtrarBaseDatosReporteMin();
            modalReporteMin.classList.add('modal-activo');

        } catch (error) {
            console.error('Error al precargar datos:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos del servidor.', 'error');
        }
    });

    // --- CERRAR MODAL ---
    var cerrarModalReporteMin = function() { modalReporteMin.classList.remove('modal-activo'); };
    document.getElementById('btnCancelarReporteMin').addEventListener('click', cerrarModalReporteMin);

    // --- EVENTOS FILTROS ---
    selectFiltroMin.addEventListener('change', filtrarBaseDatosReporteMin);
    selectFiltroEstado.addEventListener('change', filtrarBaseDatosReporteMin);
    selectFiltroAnio.addEventListener('change', filtrarBaseDatosReporteMin);

    // --- SELECCIÓN MAESTRA ---
    checkTodosMin.addEventListener('change', function(e) {
        document.querySelectorAll('.check-servidor-reporte').forEach(function(cb) { cb.checked = e.target.checked; });
    });

    // --- EXPORTAR PDF ---
    document.getElementById('btnExportarPDFMin').addEventListener('click', function() {
        var checkboxesMarcados = document.querySelectorAll('.check-servidor-reporte:checked');

        if (checkboxesMarcados.length === 0) {
            return Swal.fire('Atención', 'Debes seleccionar al menos un servidor para imprimir.', 'warning');
        }

        var idsSeleccionados = Array.from(checkboxesMarcados).map(function(cb) { return cb.value; });
        var servidoresParaImprimir = datosCompletosServidores.filter(function(s) {
            return idsSeleccionados.includes(s.id_historial.toString());
        });

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // COLORES UNIFICADOS PARA EL REPORTE
        var colorPrincipal = [30, 58, 138];
        var colorTexto = [71, 85, 105];

        // --- ENCABEZADO ---
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
        doc.text('Directorio de Servidores', 14, 20);

        var fechaActual = new Date().toLocaleDateString('es-GT');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('Generado el: ' + fechaActual, 14, 26);

        var textoEstado = selectFiltroEstado.options[selectFiltroEstado.selectedIndex].text;
        doc.text('Filtro aplicado: ' + textoEstado, 14, 31);

        var cursorY = 40;

        var addFooter = function(data) {
            var pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text('Página ' + data.pageNumber + ' de ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
            doc.text('Gestión Nazareno', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        };

        // --- AGRUPAR POR MINISTERIO ---
        var ministeriosUnicosSet = {};
        var ministeriosUnicos = [];
        servidoresParaImprimir.forEach(function(s) {
            if (!ministeriosUnicosSet[s.id_ministerio]) {
                ministeriosUnicosSet[s.id_ministerio] = true;
                ministeriosUnicos.push(s.id_ministerio);
            }
        });

        ministeriosUnicos.forEach(function(idMin) {
            var servidoresDelMin = servidoresParaImprimir.filter(function(s) { return s.id_ministerio == idMin; });
            if (servidoresDelMin.length === 0) return;

            var nombreMin = servidoresDelMin[0].nombre_ministerio;

            if (cursorY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                cursorY = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
            doc.text(nombreMin, 14, cursorY);

            cursorY += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text('Total de registros en tabla: ' + servidoresDelMin.length, 14, cursorY);

            cursorY += 6;

            var encabezados = ['Estado', 'Nombre Completo', 'Cargo', 'Período'];
            var filas = servidoresDelMin.map(function(s) {
                var estado = s.estado_activo ? 'ACTIVO' : 'BAJA';
                var periodo = s.estado_activo ? s.fecha_inicio + ' a Presente' : s.fecha_inicio + ' al ' + (s.fecha_fin || 'N/A');
                return [estado, s.nombres + ' ' + s.apellidos, s.cargo, periodo];
            });

            doc.autoTable({
                startY: cursorY,
                head: [encabezados],
                body: filas,
                theme: 'grid',
                headStyles: { fillColor: colorPrincipal, textColor: 255, fontStyle: 'bold' },
                bodyStyles: { textColor: colorTexto, fontSize: 9 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 }, 2: { cellWidth: 35 } },
                margin: { left: 14, right: 14 },
                didDrawPage: addFooter
            });

            cursorY = doc.lastAutoTable.finalY + 15;
        });

        // --- DESCARGA ---
        var fechaStr = new Date().toLocaleDateString('es-GT').replace(/\//g, '-');
        var prefijoMin = 'General';
        if (selectFiltroMin.value !== 'TODOS') {
            prefijoMin = selectFiltroMin.options[selectFiltroMin.selectedIndex].text.replace(/\s+/g, '_');
        }
        var sufijoEstado = selectFiltroEstado.value.toLowerCase();
        var nombreArchivo = 'Reporte_' + prefijoMin + '_' + sufijoEstado + '_' + fechaStr + '.pdf';

        doc.save(nombreArchivo);
        cerrarModalReporteMin();
    });
};