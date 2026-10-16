// ==========================================
// MINISTERIOS - TABLAS (MAESTRO + DETALLE)
// ==========================================
export var dibujarTablaMinisterios = function(ministerios) {
    var cuerpoTabla = document.getElementById('cuerpoTablaMinisterios');
    cuerpoTabla.innerHTML = '';

    ministerios.forEach(function(min) {
        cuerpoTabla.innerHTML += '<tr class="fila-familia" data-id="' + min.id_ministerio + '">' +
            '<td style="padding: 12px 15px; display:flex; justify-content:space-between; align-items:center;">' +
                '<div><i class="fas fa-folder-open" style="color:#8b5cf6; margin-right:10px;"></i> <strong>' + min.nombre + '</strong></div>' +
                '<div class="acciones-min">' +
                    '<button class="btn-icono btn-icono-editar btn-editar-min" data-id="' + min.id_ministerio + '" data-nombre="' + min.nombre + '" title="Editar"><i class="fas fa-pen"></i></button>' +
                    '<button class="btn-icono btn-icono-borrar btn-borrar-min" data-id="' + min.id_ministerio + '" title="Eliminar"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    });
};

export var dibujarHistorial = function(data) {
    var cuerpoTabla = document.getElementById('cuerpoTablaHistorial');
    var integrantesActivos = [];
    cuerpoTabla.innerHTML = '';

    if (data.length === 0) {
        cuerpoTabla.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 20px;">No hay servidores activos en este momento.</td></tr>';
        return integrantesActivos;
    }

    data.forEach(function(item) {
        if (item.estado_activo) integrantesActivos.push(item.id_miembro);

        var badge = '<span style="background:#dcfce3; color:#15803d; padding:3px 8px; border-radius:12px; font-size:11px;">ACTIVO</span>';
        var btnBaja = '<button data-id="' + item.id_historial + '" class="btn-icono btn-icono-borrar btn-baja-historial" title="Cerrar Ciclo"><i class="fas fa-power-off"></i></button>';

        cuerpoTabla.innerHTML += '<tr>' +
            '<td>' + badge + '</td>' +
            '<td><strong>' + item.nombres + '</strong> ' + item.apellidos + '</td>' +
            '<td><span style="color:#475569;"><i class="fas fa-tag"></i> ' + item.cargo + '</span></td>' +
            '<td>' + btnBaja + '</td>' +
        '</tr>';
    });

    return integrantesActivos;
};

export var mostrarCargandoHistorial = function() {
    document.getElementById('cuerpoTablaHistorial').innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Buscando servidores...</td></tr>';
};

export var resetearVistaDetalle = function() {
    document.getElementById('nombreMinisterioSeleccionado').textContent = 'Seleccione un Ministerio';
    document.getElementById('btnAbrirArchivo').setAttribute('disabled', 'true');
    document.getElementById('btnAsignarMinisterio').setAttribute('disabled', 'true');
    document.getElementById('cuerpoTablaHistorial').innerHTML =
        '<tr><td colspan="4" style="text-align: center; color: #9ca3af; padding: 30px;">Selecciona un ministerio de la izquierda.</td></tr>';
};

export var initTableMinisteriosEvents = function(callbacks) {
    var cuerpoTabla = document.getElementById('cuerpoTablaMinisterios');

    cuerpoTabla.addEventListener('click', function(e) {
        var btnEditar = e.target.closest('.btn-editar-min');
        if (btnEditar) {
            e.stopPropagation();
            callbacks.onEditarMin(btnEditar.getAttribute('data-id'), btnEditar.getAttribute('data-nombre'));
            return;
        }

        var btnBorrar = e.target.closest('.btn-borrar-min');
        if (btnBorrar) {
            e.stopPropagation();
            callbacks.onBorrarMin(btnBorrar.getAttribute('data-id'));
            return;
        }

        var fila = e.target.closest('.fila-familia');
        if (fila) {
            document.querySelectorAll('.fila-familia').forEach(function(r) {
                r.classList.remove('fila-activa');
                r.style.borderLeft = '';
            });
            fila.classList.add('fila-activa');
            fila.style.borderLeft = '4px solid #8b5cf6';

            var idMin = fila.getAttribute('data-id');
            var nombreMin = fila.querySelector('strong').innerText;
            callbacks.onSeleccionarMin(idMin, nombreMin);
        }
    });
};

export var initHistorialEvents = function(callbacks) {
    document.getElementById('cuerpoTablaHistorial').addEventListener('click', function(e) {
        var btnBaja = e.target.closest('.btn-baja-historial');
        if (btnBaja) {
            callbacks.onBajaHistorial(btnBaja.getAttribute('data-id'));
        }
    });
};