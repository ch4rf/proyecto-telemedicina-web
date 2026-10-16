// ==========================================
// FAMILIAS - TABLA PRINCIPAL + INTEGRANTES
// ==========================================
export var dibujarTabla = function(datos) {
    var cuerpoTabla = document.getElementById('cuerpoTablaFamilias');
    cuerpoTabla.innerHTML = '';
    document.getElementById('contadorFamilias').textContent = datos.length;
    var correlativo = 1;

    datos.forEach(function(item) {
        var zona = item.zona || 'N/A';
        var fila = '<tr class="fila-familia" data-id="' + item.id_familia + '">' +
            '<td><strong>' + correlativo + '</strong></td>' +
            '<td><strong>' + item.nombre_familia + '</strong></td>' +
            '<td>' + zona + '</td>' +
            '<td>' +
                '<button data-id="' + item.id_familia + '" class="btn-icono btn-icono-editar btn-editar" title="Editar"><i class="fas fa-pen"></i></button>' +
                '<button data-id="' + item.id_familia + '" class="btn-icono btn-icono-borrar btn-borrar" title="Eliminar"><i class="fas fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
        cuerpoTabla.innerHTML += fila;
        correlativo++;
    });
};

export var mostrarCargandoIntegrantes = function() {
    document.getElementById('cuerpoTablaIntegrantes').innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Buscando integrantes...</td></tr>';
};

export var dibujarIntegrantes = function(integrantes) {
    var cuerpoIntegrantes = document.getElementById('cuerpoTablaIntegrantes');
    cuerpoIntegrantes.innerHTML = '';

    if (integrantes.length === 0) {
        cuerpoIntegrantes.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding:15px;">No hay miembros en esta familia.</td></tr>';
        return;
    }

    integrantes.forEach(function(integ) {
        cuerpoIntegrantes.innerHTML += '<tr>' +
            '<td><strong>' + integ.nombres + '</strong></td>' +
            '<td>' + integ.apellidos + '</td>' +
            '<td>' + (integ.telefono || 'N/A') + '</td>' +
            '<td>' +
                '<button data-id="' + integ.id_miembro + '" class="btn-icono btn-icono-borrar btn-quitar-integrante" title="Quitar de la Familia">' +
                    '<i class="fas fa-times-circle"></i>' +
                '</button>' +
            '</td>' +
        '</tr>';
    });
};

export var mostrarErrorIntegrantes = function(mensaje) {
    document.getElementById('cuerpoTablaIntegrantes').innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:#dc2626; padding:15px;">' + mensaje + '</td></tr>';
};

export var initTableEvents = function(callbacks) {
    var cuerpoTabla = document.getElementById('cuerpoTablaFamilias');

    cuerpoTabla.addEventListener('click', function(e) {
        var btnEditar = e.target.closest('.btn-editar');
        if (btnEditar) {
            callbacks.onEdit(btnEditar.getAttribute('data-id'));
            return;
        }

        var btnBorrar = e.target.closest('.btn-borrar');
        if (btnBorrar) {
            callbacks.onDelete(btnBorrar.getAttribute('data-id'));
            return;
        }

        // Selección de fila (maestro-detalle)
        var fila = e.target.closest('.fila-familia');
        if (fila) {
            document.querySelectorAll('.fila-familia').forEach(function(r) {
                r.classList.remove('fila-activa');
            });
            fila.classList.add('fila-activa');
            callbacks.onRowSelect(fila.getAttribute('data-id'));
        }
    });
};

export var initIntegrantesEvents = function(callbacks) {
    document.getElementById('cuerpoTablaIntegrantes').addEventListener('click', function(e) {
        var btnQuitar = e.target.closest('.btn-quitar-integrante');
        if (btnQuitar) {
            callbacks.onQuitarIntegrante(btnQuitar.getAttribute('data-id'));
        }
    });
};