export const initPdfReportEvents = (stateProvider) => {
    const modalReporteAct = document.getElementById('modalReporteActividades');
    const selectFechaRep = document.getElementById('selectFiltroFechaRep');
    const contenedorFechasRep = document.getElementById('contenedorFechasRep');
    const inputDesdeRep = document.getElementById('inputFechaDesdeRep');
    const inputHastaRep = document.getElementById('inputFechaHastaRep');
    const selectMinRep = document.getElementById('selectFiltroMinRep');
    const selectTipoRep = document.getElementById('selectFiltroTipoRep');
    const listaActividadesRep = document.getElementById('listaActividadesRep');
    const checkTodasActRep = document.getElementById('checkTodasActividadesRep');
    const contadorActRep = document.getElementById('contadorActividadesRep');

    let actividadesFiltradasRep = [];

    const renderizarListaActRep = (datos) => {
        listaActividadesRep.innerHTML = '';
        contadorActRep.textContent = datos.length + ' actividades encontradas';
        checkTodasActRep.checked = false;

        if (datos.length === 0) {
            listaActividadesRep.innerHTML = '<li style="text-align:center; padding:15px; color:#94a3b8;">No se encontraron actividades en este periodo.</li>';
            return;
        }

        datos.forEach(a => {
            const fechaObj = new Date(a.fecha.split('T')[0] + 'T00:00:00');
            const strFecha = fechaObj.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
            const strHora = a.hora_inicio ? a.hora_inicio.substring(0,5) : 'Indefinido';
            const tipo = a.tipo_actividad || '---';
            const ministerio = a.ministerio || '---';

            listaActividadesRep.innerHTML += '<li class="item-checkbox">' +
                '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%; padding:10px; border-bottom: 1px solid #f1f5f9;">' +
                    '<input type="checkbox" class="check-act-reporte" value="' + a.id_actividad + '" style="width: 16px; height: 16px; cursor:pointer;">' +
                    '<div style="display:flex; flex-direction:column; gap:2px;">' +
                        '<span style="font-size: 14px; color:#334155;"><strong>' + tipo + ' - ' + ministerio + '</strong></span>' +
                        '<span style="font-size: 12px; color:#10b981; font-weight: 600;">' +
                            '<i class="far fa-calendar-alt"></i> ' + strFecha + ' | <i class="far fa-clock"></i> ' + strHora +
                        '</span>' +
                    '</div>' +
                '</label>' +
            '</li>';
        });
    };

    const filtrarBaseDatosActRep = () => {
        const state = stateProvider();
        const rango = selectFechaRep.value;
        const desde = inputDesdeRep.value;
        const hasta = inputHastaRep.value;
        const minId = selectMinRep.value;
        const tipoId = selectTipoRep.value;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); 

        actividadesFiltradasRep = state.datosGlobalesActividades.filter(a => {
            const pasaMin = minId === 'TODOS' || a.id_ministerio == minId;
            const pasaTipo = tipoId === 'TODOS' || a.id_tipo == tipoId;
            if (!pasaMin || !pasaTipo) return false;

            if (!a.fecha) return false;
            
            const fechaAct = new Date(a.fecha.split('T')[0] + 'T00:00:00');

            if (rango === 'historico') return true;
            
            if (rango === 'mes_actual') {
                const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                return fechaAct >= primerDia && fechaAct <= ultimoDia;
            }
            
            if (rango === 'proximos_30') {
                const limite = new Date(hoy);
                limite.setDate(hoy.getDate() + 30);
                return fechaAct >= hoy && fechaAct <= limite;
            }
            
            if (rango === 'personalizado') {
                if (!desde || !hasta) return false; 
                const d = new Date(desde + 'T00:00:00');
                const h = new Date(hasta + 'T00:00:00');
                return fechaAct >= d && fechaAct <= h;
            }
            
            return true;
        });

        actividadesFiltradasRep.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        renderizarListaActRep(actividadesFiltradasRep);
    };

    document.getElementById('btnAbrirModalReporteAct').addEventListener('click', () => {
        const state = stateProvider();
        if (state.datosGlobalesActividades.length === 0) {
            return Swal.fire('Atención', 'No hay actividades registradas en el sistema.', 'info');
        }

        selectMinRep.innerHTML = '<option value="TODOS">-- Todos los Ministerios --</option>' +
            state.configuracionFormulario.ministerios.map(m => '<option value="' + m.id_ministerio + '">' + m.nombre + '</option>').join('');
            
        selectTipoRep.innerHTML = '<option value="TODOS">-- Todos los Tipos --</option>' +
            state.configuracionFormulario.tipos.map(t => '<option value="' + t.id_tipo + '">' + t.descripcion + '</option>').join('');

        selectFechaRep.value = 'mes_actual';
        contenedorFechasRep.classList.add('oculto');
        inputDesdeRep.value = '';
        inputHastaRep.value = '';
        selectMinRep.value = 'TODOS';
        selectTipoRep.value = 'TODOS';
        checkTodasActRep.checked = false;

        filtrarBaseDatosActRep();
        modalReporteAct.classList.add('modal-activo');
    });

    const cerrarModalActRep = () => modalReporteAct.classList.remove('modal-activo');
    document.getElementById('btnCancelarReporteAct').addEventListener('click', cerrarModalActRep);

    selectFechaRep.addEventListener('change', (e) => {
        if (e.target.value === 'personalizado') {
            contenedorFechasRep.classList.remove('oculto');
        } else {
            contenedorFechasRep.classList.add('oculto');
            filtrarBaseDatosActRep();
        }
    });

    inputDesdeRep.addEventListener('change', filtrarBaseDatosActRep);
    inputHastaRep.addEventListener('change', filtrarBaseDatosActRep);
    selectMinRep.addEventListener('change', filtrarBaseDatosActRep);
    selectTipoRep.addEventListener('change', filtrarBaseDatosActRep);

    checkTodasActRep.addEventListener('change', (e) => {
        document.querySelectorAll('.check-act-reporte').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('btnExportarPDFAct').addEventListener('click', () => {
        const marcados = document.querySelectorAll('.check-act-reporte:checked');
        if (marcados.length === 0) return Swal.fire('Atención', 'Selecciona al menos una actividad para imprimir.', 'warning');

        const ids = Array.from(marcados).map(cb => cb.value);
        const paraImprimir = actividadesFiltradasRep.filter(a => ids.includes(a.id_actividad.toString()));

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // COLORES UNIFICADOS PARA EL REPORTE
        const colorPrincipal = [30, 58, 138]; // Azul corporativo elegante
        const colorTexto = [71, 85, 105];     // Gris pizarra para textos

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colorPrincipal);
        doc.text('Agenda de Actividades', 14, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colorTexto);
        doc.text('Generado el: ' + new Date().toLocaleDateString('es-GT') + ' | Eventos programados: ' + paraImprimir.length, 14, 26);

        const txtFec = selectFechaRep.options[selectFechaRep.selectedIndex].text;
        const txtMin = selectMinRep.options[selectMinRep.selectedIndex].text;
        doc.text('Periodo: ' + txtFec + ' | Ministerio: ' + txtMin, 14, 32);

        const cuerpoTabla = [];
        let fechaActual = "";

        paraImprimir.forEach(a => {
            const fechaObj = new Date(a.fecha.split('T')[0] + 'T00:00:00');
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

            if (fechaFormateada !== fechaActual) {
                // Fila que agrupa por fecha
                cuerpoTabla.push([{ 
                    content: fechaFormateada, 
                    colSpan: 4, 
                    styles: { fillColor: [241, 245, 249], textColor: colorPrincipal, fontStyle: 'bold', halign: 'left' } 
                }]);
                fechaActual = fechaFormateada;
            }

            const horario = a.hora_inicio ? a.hora_inicio.substring(0,5) + ' a ' + a.hora_fin.substring(0,5) : 'Indefinido';
            let lugarStr = a.lugar || 'N/A';
            if (a.nombres) lugarStr += '\n(Anf: ' + a.nombres + ')';

            cuerpoTabla.push([
                horario,
                a.tipo_actividad || '---',
                a.ministerio || '---',
                lugarStr
            ]);
        });

        doc.autoTable({
            startY: 38,
            head: [['Horario', 'Actividad', 'Ministerio Organizador', 'Lugar / Sede']],
            body: cuerpoTabla,
            theme: 'grid',
            tableWidth: doc.internal.pageSize.width - 28, 
            headStyles: { fillColor: colorPrincipal, textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: colorTexto, fontSize: 9, valign: 'middle' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 },
                1: { cellWidth: 45 },
                2: { cellWidth: 45 }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(...colorTexto);
                doc.text('Página ' + data.pageNumber + ' de ' + pageCount, 14, doc.internal.pageSize.height - 10);
                doc.text('Gestión Nazareno', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
            }
        });

        let prefijo = selectMinRep.value !== 'TODOS' ? txtMin.replace(/[^a-zA-Z0-9]/g, '_') : 'General';
        doc.save('Agenda_' + prefijo + '_' + new Date().toLocaleDateString('es-GT').replace(/\//g, '-') + '.pdf');
        
        cerrarModalActRep();
    });
};