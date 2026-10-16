// ==========================================
// MIEMBROS - REPORTE PDF (DIRECTORIO)
// ==========================================
export var initPdfReportEvents = function(stateProvider) {
    var modalReporteMiembros = document.getElementById('modalReporteMiembros');
    var selectEstadoRep = document.getElementById('selectFiltroEstadoRep');
    var selectGeneroRep = document.getElementById('selectFiltroGeneroRep');
    var selectProfesionRep = document.getElementById('selectFiltroProfesionRep');
    var listaMiembrosReporte = document.getElementById('listaMiembrosReporte');
    var checkTodosMiembrosRep = document.getElementById('checkTodosMiembrosRep');
    var contadorMiembrosRep = document.getElementById('contadorMiembrosRep');

    // --- RENDERIZAR LISTA ---
    var renderizarListaMiembrosRep = function(datosFiltrados) {
        listaMiembrosReporte.innerHTML = '';
        contadorMiembrosRep.textContent = datosFiltrados.length + ' miembros encontrados';
        checkTodosMiembrosRep.checked = false;

        if (datosFiltrados.length === 0) {
            listaMiembrosReporte.innerHTML = '<li style="text-align:center; padding:15px; color:#94a3b8;">No se encontraron coincidencias con los filtros.</li>';
            return;
        }

        datosFiltrados.forEach(function(m) {
            var estadoStr = (m.estado_miembro || 'Desconocido').toUpperCase();
            var colorEstado = '#0369a1';
            if (estadoStr.includes('RETIRADO')) colorEstado = '#b91c1c';
            if (estadoStr.includes('ACTIVO')) colorEstado = '#15803d';

            listaMiembrosReporte.innerHTML += '<li class="item-checkbox">' +
                '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%; padding:10px;">' +
                    '<input type="checkbox" class="check-miembro-reporte" value="' + m.id_miembro + '" style="width: 16px; height: 16px; cursor:pointer;">' +
                    '<div style="display:flex; flex-direction:column; gap:2px;">' +
                        '<span style="font-size: 14px; color:#334155;"><strong>' + m.nombres + ' ' + m.apellidos + '</strong></span>' +
                        '<span style="font-size: 12px; color:#64748b;">' +
                            (m.genero || 'N/A') + ' | Prof: ' + (m.profesion || 'N/A') + ' | <span style="color:' + colorEstado + '; font-weight:600;">' + estadoStr + '</span>' +
                        '</span>' +
                    '</div>' +
                '</label>' +
            '</li>';
        });
    };

    // --- MOTOR DE FILTROS CRUZADOS ---
    var filtrarBaseDatosMiembrosRep = function() {
        var state = stateProvider();
        var estadoId = selectEstadoRep.value;
        var generoId = selectGeneroRep.value;
        var profesionId = selectProfesionRep.value;

        var filtradas = state.datosGlobalesMiembros.filter(function(m) {
            var pasaEstado = (estadoId === 'TODOS') || (m.id_estado == estadoId);
            var pasaGenero = (generoId === 'TODOS') || (m.id_genero == generoId);
            var pasaProfesion = (profesionId === 'TODOS') || (m.id_profesion == profesionId);
            return pasaEstado && pasaGenero && pasaProfesion;
        });

        renderizarListaMiembrosRep(filtradas);
    };

    // --- HELPER: LIMPIAR PLACEHOLDER ---
    var limpiarOpcionPlaceholder = function(html) {
        return html.replace(/<option value="" selected[^>]*>.*?<\/option>/i, '');
    };

    // --- ABRIR MODAL ---
    document.getElementById('btnAbrirModalReporteMiembros').addEventListener('click', function() {
        var state = stateProvider();
        if (state.datosGlobalesMiembros.length === 0) {
            return Swal.fire('Atención', 'No hay miembros registrados en el sistema.', 'info');
        }

        selectEstadoRep.innerHTML = '<option value="TODOS">Todos los estados</option>' + limpiarOpcionPlaceholder(document.getElementById('selectEstado').innerHTML);
        selectGeneroRep.innerHTML = '<option value="TODOS">Todos los géneros</option>' + limpiarOpcionPlaceholder(document.getElementById('selectGenero').innerHTML);
        selectProfesionRep.innerHTML = '<option value="TODOS">Todas las profesiones</option>' + limpiarOpcionPlaceholder(document.getElementById('selectProfesion').innerHTML);

        selectEstadoRep.value = 'TODOS';
        selectGeneroRep.value = 'TODOS';
        selectProfesionRep.value = 'TODOS';
        checkTodosMiembrosRep.checked = false;

        renderizarListaMiembrosRep(state.datosGlobalesMiembros);
        modalReporteMiembros.classList.add('modal-activo');
    });

    // --- CERRAR MODAL ---
    var cerrarModalMiembrosRep = function() { modalReporteMiembros.classList.remove('modal-activo'); };
    document.getElementById('btnCancelarReporteMiembros').addEventListener('click', cerrarModalMiembrosRep);

    // --- EVENTOS DE FILTROS ---
    selectEstadoRep.addEventListener('change', filtrarBaseDatosMiembrosRep);
    selectGeneroRep.addEventListener('change', filtrarBaseDatosMiembrosRep);
    selectProfesionRep.addEventListener('change', filtrarBaseDatosMiembrosRep);

    // --- SELECCIÓN MAESTRA ---
    checkTodosMiembrosRep.addEventListener('change', function(e) {
        document.querySelectorAll('.check-miembro-reporte').forEach(function(cb) { cb.checked = e.target.checked; });
    });

    // --- EXPORTAR PDF ---
    document.getElementById('btnExportarPDFMiembros').addEventListener('click', function() {
        var state = stateProvider();
        var checkboxesMarcados = document.querySelectorAll('.check-miembro-reporte:checked');

        if (checkboxesMarcados.length === 0) {
            return Swal.fire('Atención', 'Debes seleccionar al menos un miembro para imprimir el directorio.', 'warning');
        }

        var idsSeleccionados = Array.from(checkboxesMarcados).map(function(cb) { return cb.value; });
        var miembrosParaImprimir = state.datosGlobalesMiembros.filter(function(m) {
            return idsSeleccionados.includes(m.id_miembro.toString());
        });

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // COLORES UNIFICADOS PARA EL REPORTE
        var colorPrincipal = [30, 58, 138];
        var colorTexto = [71, 85, 105];

        // --- ENCABEZADO ---
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
        doc.text('Directorio General de Miembros', 14, 20);

        var fechaActual = new Date().toLocaleDateString('es-GT');
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('Generado el: ' + fechaActual + ' | Registros listados: ' + miembrosParaImprimir.length, 14, 26);

        var txtEst = selectEstadoRep.options[selectEstadoRep.selectedIndex].text;
        var txtGen = selectGeneroRep.options[selectGeneroRep.selectedIndex].text;
        var txtProf = selectProfesionRep.options[selectProfesionRep.selectedIndex].text;
        doc.text('Filtros -> Estado: ' + txtEst + ' | Género: ' + txtGen + ' | Profesión: ' + txtProf, 14, 32);

        // --- DATOS ---
        var encabezados = ['Nombre Completo', 'Edad y Género', 'Contacto', 'Familia / Dirección', 'Estado'];

        var filasTabla = miembrosParaImprimir.map(function(m) {
            var edadText = 'N/A';
            if (m.fecha_nacimiento) {
                var nac = new Date(m.fecha_nacimiento + 'T00:00:00');
                var hoy = new Date();
                var edad = hoy.getFullYear() - nac.getFullYear();
                var mMes = hoy.getMonth() - nac.getMonth();
                if (mMes < 0 || (mMes === 0 && hoy.getDate() < nac.getDate())) edad--;
                edadText = edad + ' años';
            }

            var contactoStr = '';
            if (m.telefono) contactoStr += 'Tel: ' + m.telefono + '\n';
            if (m.correo) contactoStr += m.correo;
            if (!contactoStr) contactoStr = 'N/A';

            var direccionArmada = 'Sin familia / Dirección no registrada';
            var textoFamilia = m.nombre_familia ? m.nombre_familia : '';

            if (m.calle_avenida) {
                var referencia = m.referencia_casa ? ', ' + m.referencia_casa : '';
                var valorAsentamiento = m.asentamiento || m.zona;
                var textoAsentamiento = valorAsentamiento ? '(Sector: ' + valorAsentamiento + ')' : '';
                var direccionFisica = (m.calle_avenida + referencia + ' ' + textoAsentamiento).trim();
                direccionArmada = textoFamilia ? textoFamilia + '\n' + direccionFisica : direccionFisica;
            } else if (textoFamilia) {
                direccionArmada = textoFamilia + '\n(Dirección no registrada)';
            }

            return [
                m.nombres + ' ' + m.apellidos,
                edadText + '\n' + (m.genero || ''),
                contactoStr.trim(),
                direccionArmada,
                (m.estado_miembro || 'Desconocido').toUpperCase()
            ];
        });

        // --- RENDERIZAR TABLA ---
        doc.autoTable({
            startY: 38,
            head: [encabezados],
            body: filasTabla,
            theme: 'grid',
            tableWidth: doc.internal.pageSize.width - 28,
            headStyles: {
                fillColor: colorPrincipal,
                textColor: 255,
                fontStyle: 'bold'
            },
            bodyStyles: { textColor: colorTexto, fontSize: 9, valign: 'middle' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold' }
            },
            margin: { top: 38, left: 14, right: 14 },
            didDrawPage: function(data) {
                var pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
                doc.text('Página ' + data.pageNumber + ' de ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
                doc.text('Gestión Nazareno', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
            }
        });

        // --- DESCARGA ---
        var fechaArchivo = new Date().toLocaleDateString('es-GT').replace(/\//g, '-');
        var prefijo = selectEstadoRep.value !== 'TODOS' ? txtEst.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
        var nombreArchivo = 'Directorio_Miembros_' + prefijo + '_' + fechaArchivo + '.pdf';

        doc.save(nombreArchivo);
        cerrarModalMiembrosRep();
    });
};