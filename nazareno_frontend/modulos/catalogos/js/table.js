// ==========================================
// CATÁLOGOS - RENDERIZADO DE TABLA
// ==========================================
export var dibujarTabla = function(datos, endpoint) {
    var cuerpoTabla = document.getElementById('cuerpoTablaCatalogos');
    var encabezadoTabla = document.querySelector('.tabla-estilizada thead tr');

    // Adaptamos los encabezados según la tabla activa
    if (endpoint === 'lugares') {
        encabezadoTabla.innerHTML = '<th>No.</th><th>Nombre</th><th>¿Requiere Anfitrión?</th><th>Acciones</th>';
    } else if (endpoint === 'tipos-duracion') {
        encabezadoTabla.innerHTML = '<th>No.</th><th>Descripción</th><th>¿Requiere Hora?</th><th>Acciones</th>';
    } else {
        encabezadoTabla.innerHTML = '<th>No.</th><th>Descripción</th><th>Acciones</th>';
    }

    cuerpoTabla.innerHTML = '';
    var contadorVisual = 1;

    datos.forEach(function(item) {
        var columnaExtra = '';

        if (endpoint === 'lugares') {
            columnaExtra = '<td>' + (item.requiere_anfitrion ? 'Sí' : 'No') + '</td>';
        } else if (endpoint === 'tipos-duracion') {
            columnaExtra = '<td>' + (item.requiere_hora ? 'Sí' : 'No') + '</td>';
        }

        var fila = '<tr>' +
            '<td><strong>' + contadorVisual + '</strong></td>' +
            '<td>' + (item.nombre || item.descripcion) + '</td>' +
            columnaExtra +
            '<td>' +
                '<button data-id="' + item.id + '" class="btn-icono btn-icono-editar btn-editar" title="Editar">' +
                    '<i class="fas fa-pen"></i>' +
                '</button>' +
                '<button data-id="' + item.id + '" class="btn-icono btn-icono-borrar btn-borrar" title="Eliminar">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</td>' +
        '</tr>';

        cuerpoTabla.innerHTML += fila;
        contadorVisual++;
    });
};

export var initTableEvents = function(callbacks) {
    var cuerpoTabla = document.getElementById('cuerpoTablaCatalogos');

    cuerpoTabla.addEventListener('click', function(evento) {
        // --- ACCIÓN: EDITAR ---
        var botonEditar = evento.target.closest('.btn-editar');
        if (botonEditar) {
            var idReal = botonEditar.getAttribute('data-id');
            callbacks.onEdit(idReal);
            return;
        }

        // --- ACCIÓN: BORRAR ---
        var botonBorrar = evento.target.closest('.btn-borrar');
        if (botonBorrar) {
            var idReal = botonBorrar.getAttribute('data-id');
            callbacks.onDelete(idReal);
        }
    });
};