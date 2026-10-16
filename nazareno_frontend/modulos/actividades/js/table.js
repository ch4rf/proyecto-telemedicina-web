export const dibujarTabla = (datos) => {
    const cuerpoTabla = document.getElementById('cuerpoTablaActividades');
    cuerpoTabla.innerHTML = '';
    
    if (datos.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay actividades.</td></tr>';
        return;
    }

    datos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    let fechaActual = '';

    datos.forEach(item => {
        const fechaObj = new Date(item.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });

        if (fechaActual !== fechaFormateada) {
            fechaActual = fechaFormateada;
            cuerpoTabla.innerHTML += '<tr style="background-color: #f8fafc;">' +
                '<td colspan="6" style="padding: 12px 15px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0;">' +
                    '<i class="fas fa-calendar-day" style="margin-right:8px; color: #2563eb;"></i> ' + fechaFormateada.toUpperCase() +
                '</td>' +
            '</tr>';
        }

        const anfitrionHtml = item.nombres ? '<br><small style="color:#64748b;">(Anf: ' + item.nombres + ')</small>' : '';
        const horarioStr = item.hora_inicio ? item.hora_inicio.substring(0,5) + ' - ' + item.hora_fin.substring(0,5) : '---';
        const tipoActividad = item.tipo_actividad || '---';
        const ministerio = item.ministerio || '---';
        const lugar = item.lugar || '---';
        const duracionDescripcion = item.duracion_descripcion || '---';

        cuerpoTabla.innerHTML += '<tr>' +
            '<td>' + tipoActividad + '</td>' +
            '<td>' + ministerio + '</td>' +
            '<td>' + lugar + ' ' + anfitrionHtml + '</td>' +
            '<td>' + duracionDescripcion + '</td>' +
            '<td>' + horarioStr + '</td>' +
            '<td style="text-align: center;">' +
                '<button class="btn-icono btn-icono-editar" data-id="' + item.id_actividad + '" title="Editar"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-icono btn-icono-borrar" data-id="' + item.id_actividad + '" title="Eliminar"><i class="fas fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    });
};

export const aplicarFiltros = (datosGlobalesActividades) => {
    const texto = document.getElementById('filtroTexto').value.toLowerCase();
    const rango = document.getElementById('filtroRango').value;
    
    const fechaDesde = document.getElementById('filtroDesde').value;
    const fechaHasta = document.getElementById('filtroHasta').value;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const filtrados = datosGlobalesActividades.filter(item => {
        const tipo = item.tipo_actividad || '';
        const min = item.ministerio || '';
        const nom = item.nombres || '';

        const matchTexto = 
            tipo.toLowerCase().includes(texto) || 
            min.toLowerCase().includes(texto) ||
            nom.toLowerCase().includes(texto);

        let matchFecha = true;
        
        if (item.fecha) {
            const fechaActividad = new Date(item.fecha.split('T')[0] + 'T00:00:00');

            if (rango === 'mes_actual') {
                const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                matchFecha = fechaActividad >= primerDiaMes && fechaActividad <= ultimoDiaMes;
            } 
            else if (rango === 'proximos_7') {
                const limite7Dias = new Date(hoy);
                limite7Dias.setDate(hoy.getDate() + 7);
                matchFecha = fechaActividad >= hoy && fechaActividad <= limite7Dias;
            } 
            else if (rango === 'manual') {
                if (fechaDesde && fechaHasta) {
                    const inicio = new Date(fechaDesde + 'T00:00:00');
                    const fin = new Date(fechaHasta + 'T00:00:00');
                    matchFecha = fechaActividad >= inicio && fechaActividad <= fin;
                } else {
                    matchFecha = false; 
                }
            }
        }

        return matchTexto && matchFecha;
    });

    dibujarTabla(filtrados);
};

export const initTableEvents = (callbacks) => {
    const filtroTexto = document.getElementById('filtroTexto');
    const filtroRango = document.getElementById('filtroRango');
    const contenedorManual = document.getElementById('contenedorManual');
    const inputFiltroDesde = document.getElementById('filtroDesde');
    const inputFiltroHasta = document.getElementById('filtroHasta');
    const cuerpoTabla = document.getElementById('cuerpoTablaActividades');

    filtroTexto.addEventListener('input', callbacks.onFilterChange);
    
    filtroRango.addEventListener('change', (e) => {
        if (e.target.value === 'manual') {
            contenedorManual.classList.remove('oculto');
        } else {
            contenedorManual.classList.add('oculto');
            callbacks.onFilterChange();
        }
    });

    inputFiltroDesde.addEventListener('change', callbacks.onFilterChange);
    inputFiltroHasta.addEventListener('change', callbacks.onFilterChange);

    cuerpoTabla.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-icono-editar');
        const btnBorrar = e.target.closest('.btn-icono-borrar');

        if (btnBorrar) {
            const id = btnBorrar.getAttribute('data-id');
            callbacks.onDelete(id);
        }

        if (btnEditar) {
            const id = btnEditar.getAttribute('data-id');
            callbacks.onEdit(id);
        }
    });
};