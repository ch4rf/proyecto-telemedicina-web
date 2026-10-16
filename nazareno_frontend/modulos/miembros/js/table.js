// ==========================================
// MIEMBROS - TABLA Y FILTROS
// ==========================================
export var llenarFiltroEstado = function(estados) {
    var selectEstadoFiltro = document.getElementById('filtroEstado');
    selectEstadoFiltro.innerHTML = '<option value="todos">-- Todos los Estados --</option>';
    estados.forEach(function(e) {
        selectEstadoFiltro.innerHTML += '<option value="' + (e.id_estado || e.id) + '">' + e.descripcion + '</option>';
    });
};

export var dibujarTabla = function(datos) {
    var cuerpoTabla = document.getElementById('cuerpoTablaMiembros');
    cuerpoTabla.innerHTML = '';
    document.getElementById('contadorMiembros').textContent = datos.length + ' miembros';

    var correlativo = 1;

    datos.forEach(function(item) {
        var estado = item.estado_miembro || 'Desconocido';
        var colorEstado = '#0369a1';
        var bgEstado = '#e0f2fe';
        if (estado.toLowerCase().includes('retirado')) { colorEstado = '#b91c1c'; bgEstado = '#fee2e2'; }
        if (estado.toLowerCase().includes('activo')) { colorEstado = '#15803d'; bgEstado = '#dcfce3'; }

        var telefonoStr = item.telefono || '<span style="color:#9ca3af">N/A</span>';

        var fila = '<tr>' +
            '<td><strong>' + correlativo + '</strong></td>' +
            '<td>' + item.nombres + ' ' + item.apellidos + '</td>' +
            '<td>' + telefonoStr + '</td>' +
            '<td><span style="background:' + bgEstado + '; color:' + colorEstado + '; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">' + estado + '</span></td>' +
            '<td>' +
                '<button data-id="' + item.id_miembro + '" class="btn-icono btn-icono-ver btn-perfil" title="Ver Perfil"><i class="fas fa-eye"></i></button>' +
                '<button data-id="' + item.id_miembro + '" class="btn-icono btn-icono-editar btn-editar" title="Editar"><i class="fas fa-pen"></i></button>' +
                '<button data-id="' + item.id_miembro + '" class="btn-icono btn-icono-borrar btn-baja" title="Dar de Baja"><i class="fas fa-user-minus"></i></button>' +
            '</td>' +
        '</tr>';
        cuerpoTabla.innerHTML += fila;
        correlativo++;
    });
};

export var initTableEvents = function(callbacks) {
    var cuerpoTabla = document.getElementById('cuerpoTablaMiembros');

    cuerpoTabla.addEventListener('click', function(e) {
        var btnPerfil = e.target.closest('.btn-perfil');
        if (btnPerfil) {
            callbacks.onPerfil(btnPerfil.getAttribute('data-id'));
            return;
        }

        var botonEditar = e.target.closest('.btn-editar');
        if (botonEditar) {
            callbacks.onEdit(botonEditar.getAttribute('data-id'));
            return;
        }

        var botonBaja = e.target.closest('.btn-baja');
        if (botonBaja) {
            callbacks.onBaja(botonBaja.getAttribute('data-id'));
        }
    });
};

export var initFilterEvents = function(callbacks) {
    document.getElementById('filtroEstado').addEventListener('change', function(e) {
        callbacks.onFilterChange(e.target.value);
    });
};