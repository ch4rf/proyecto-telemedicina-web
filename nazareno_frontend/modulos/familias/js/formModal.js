// ==========================================
// FAMILIAS - FORMULARIO Y MODAL ASIGNACIÓN
// ==========================================
export var llenarSelectZonas = function(zonas) {
    var selectZona = document.getElementById('selectZona');
    selectZona.innerHTML = '<option value="" selected disabled>-- Seleccione Asentamiento / Sector --</option>';
    zonas.forEach(function(z) {
        selectZona.innerHTML += '<option value="' + (z.id_zona || z.id) + '">' + (z.nombre_zona || z.descripcion) + '</option>';
    });
};

export var abrirFormularioEdicion = function(familia) {
    document.getElementById('tituloFormulario').textContent = 'Editar Familia';
    document.getElementById('inputPrimerApellido').value = familia.primer_apellido || '';
    document.getElementById('inputSegundoApellido').value = familia.segundo_apellido || '';
    document.getElementById('inputNombreFamilia').value = familia.nombre_familia || '';
    document.getElementById('inputCalle').value = familia.calle_avenida || '';
    document.getElementById('inputReferencia').value = familia.referencia_casa || '';
    if (familia.id_zona) document.getElementById('selectZona').value = familia.id_zona;

    document.getElementById('vistaTabla').classList.add('oculto');
    document.getElementById('vistaFormulario').classList.remove('oculto');
};

export var cerrarFormulario = function() {
    document.getElementById('vistaFormulario').classList.add('oculto');
    document.getElementById('vistaTabla').classList.remove('oculto');
    document.getElementById('formularioFamilia').reset();
};

export var armarPayload = function() {
    return {
        nombre_familia: document.getElementById('inputNombreFamilia').value,
        primer_apellido: document.getElementById('inputPrimerApellido').value,
        segundo_apellido: document.getElementById('inputSegundoApellido').value || null,
        id_zona: parseInt(document.getElementById('selectZona').value),
        calle_avenida: document.getElementById('inputCalle').value || null,
        referencia_casa: document.getElementById('inputReferencia').value || null
    };
};

export var renderizarListaLibres = function(datos) {
    var listaMiembros = document.getElementById('listaMiembrosLibres');
    listaMiembros.innerHTML = '';

    if (datos.length === 0) {
        listaMiembros.innerHTML = '<li style="text-align:center; padding:15px; color:#94a3b8;">No se encontraron coincidencias.</li>';
        return;
    }

    datos.forEach(function(m) {
        listaMiembros.innerHTML += '<li class="item-checkbox">' +
            '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%; padding:10px;">' +
                '<input type="checkbox" class="check-miembro-libre" value="' + m.id_miembro + '" style="width: 16px; height: 16px; cursor:pointer;">' +
                '<span style="font-size: 14px; color:#334155;"><strong>' + m.nombres + '</strong> ' + m.apellidos + '</span>' +
            '</label>' +
        '</li>';
    });
};

export var abrirModalAsignacion = function(miembrosLibres) {
    document.getElementById('inputBuscarMiembroLibre').value = '';
    renderizarListaLibres(miembrosLibres);
    document.getElementById('modalAsignacionMultiple').classList.add('modal-activo');
};

export var cerrarModalAsignacion = function() {
    document.getElementById('modalAsignacionMultiple').classList.remove('modal-activo');
};

export var initFormEvents = function(callbacks) {
    var inputPrimerApellido = document.getElementById('inputPrimerApellido');
    var inputSegundoApellido = document.getElementById('inputSegundoApellido');
    var inputNombreFamilia = document.getElementById('inputNombreFamilia');

    // Auto-generar nombre de familia
    var generarNombreFamilia = function() {
        var ape1 = inputPrimerApellido.value.trim();
        var ape2 = inputSegundoApellido.value.trim();
        inputNombreFamilia.value = (ape1 || ape2) ? ('Familia ' + ape1 + ' ' + ape2).trim() : '';
    };
    inputPrimerApellido.addEventListener('input', generarNombreFamilia);
    inputSegundoApellido.addEventListener('input', generarNombreFamilia);

    // Mostrar formulario nuevo
    document.getElementById('btnMostrarFormulario').addEventListener('click', function() {
        document.getElementById('vistaTabla').classList.add('oculto');
        document.getElementById('vistaFormulario').classList.remove('oculto');
    });

    // Cancelar formulario
    document.getElementById('btnCancelarFormulario').addEventListener('click', function() {
        cerrarFormulario();
    });

    // Submit
    document.getElementById('formularioFamilia').addEventListener('submit', function(evento) {
        evento.preventDefault();
        callbacks.onSubmit(armarPayload());
    });
};

export var initAsignacionEvents = function(callbacks, stateProvider) {
    // Abrir modal
    document.getElementById('btnAsignarMiembro').addEventListener('click', function() {
        var state = stateProvider();
        if (!state.idFamiliaSeleccionada) {
            Swal.fire({
                title: 'Seleccione una Familia',
                text: 'Primero debes seleccionar una familia de la lista para poder asignarle integrantes.',
                icon: 'info',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        callbacks.onAbrirAsignacion();
    });

    // Buscador reactivo
    document.getElementById('inputBuscarMiembroLibre').addEventListener('input', function(e) {
        var state = stateProvider();
        var textoBuscado = e.target.value.toLowerCase().trim();
        var filtrados = state.miembrosLibresGlobales.filter(function(m) {
            return m.nombres.toLowerCase().includes(textoBuscado) ||
                   m.apellidos.toLowerCase().includes(textoBuscado);
        });
        renderizarListaLibres(filtrados);
    });

    // Cerrar modal
    document.getElementById('btnCerrarModalAsignacion').addEventListener('click', cerrarModalAsignacion);
    document.getElementById('btnCancelarAsignacion').addEventListener('click', cerrarModalAsignacion);

    // Guardar vinculación
    document.getElementById('btnGuardarAsignacionMultiple').addEventListener('click', function() {
        var checkboxesMarcados = document.querySelectorAll('.check-miembro-libre:checked');
        if (checkboxesMarcados.length === 0) {
            Swal.fire('Atención', 'Debes marcar al menos a un miembro de la lista.', 'warning');
            return;
        }
        var idsParaVincular = Array.from(checkboxesMarcados).map(function(cb) { return cb.value; });
        callbacks.onGuardarAsignacion(idsParaVincular);
    });
};