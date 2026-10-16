// ==========================================
// MIEMBROS - FORMULARIO, PERFIL Y LÓGICA REACTIVA
// ==========================================

// --- LLENADO DE CATÁLOGOS ---
export var llenarCatalogosFormulario = function(catalogos) {
    var selectEstado = document.getElementById('selectEstado');
    selectEstado.innerHTML = '<option value="" selected disabled>-- Seleccione --</option>';
    catalogos.estados.forEach(function(e) {
        selectEstado.innerHTML += '<option value="' + (e.id_estado || e.id) + '">' + e.descripcion + '</option>';
    });

    var sGen = document.getElementById('selectGenero');
    sGen.innerHTML = '<option value="" selected disabled>-- Seleccione --</option>';
    catalogos.generos.forEach(function(g) {
        sGen.innerHTML += '<option value="' + (g.id_genero || g.id) + '">' + g.descripcion + '</option>';
    });

    var sProf = document.getElementById('selectProfesion');
    sProf.innerHTML = '<option value="" selected>-- Sin asignar --</option>';
    catalogos.profesiones.forEach(function(p) {
        sProf.innerHTML += '<option value="' + (p.id_profesion || p.id) + '">' + p.descripcion + '</option>';
    });

    var sFam = document.getElementById('selectFamilia');
    sFam.innerHTML = '<option value="" selected>-- Sin asignar --</option>';
    catalogos.familias.forEach(function(f) {
        sFam.innerHTML += '<option value="' + f.id_familia + '">' + f.nombre_familia + ' (' + (f.zona || 'Sin Zona') + ')</option>';
    });

    var sRec = document.getElementById('selectRecepcion');
    sRec.innerHTML = '<option value="" selected disabled>-- Seleccione --</option>';
    catalogos.recepciones.forEach(function(r) {
        sRec.innerHTML += '<option value="' + (r.id_recepcion || r.id) + '">' + r.descripcion + '</option>';
    });

    var sMot = document.getElementById('selectMotivoRetiro');
    sMot.innerHTML = '<option value="" selected disabled>-- Seleccione --</option>';
    catalogos.motivos.forEach(function(m) {
        sMot.innerHTML += '<option value="' + (m.id_motivo || m.id) + '">' + m.descripcion + '</option>';
    });
};

// --- HELPER: LLENAR CAMPOS COMUNES ---
var llenarCamposComunes = function(miembro) {
    document.getElementById('inputNombres').value = miembro.nombres || '';
    document.getElementById('inputApellidos').value = miembro.apellidos || '';
    document.getElementById('inputDpi').value = miembro.dpi || '';
    document.getElementById('inputNacimiento').value = miembro.fecha_nacimiento || '';
    document.getElementById('inputBautismo').value = miembro.fecha_bautismo || '';
    document.getElementById('inputTelefono').value = miembro.telefono || '';
    document.getElementById('inputCorreo').value = miembro.correo || '';
    document.getElementById('inputRecepcion').value = miembro.fecha_recepcion || '';
    document.getElementById('selectFamilia').value = miembro.id_familia || '';
    document.getElementById('selectRecepcion').value = miembro.id_recepcion || '';

    if (miembro.id_genero) document.getElementById('selectGenero').value = miembro.id_genero;
    if (miembro.id_profesion) document.getElementById('selectProfesion').value = miembro.id_profesion;
    if (miembro.id_familia) document.getElementById('selectFamilia').value = miembro.id_familia;
    if (miembro.id_recepcion) document.getElementById('selectRecepcion').value = miembro.id_recepcion;
};

// --- APERTURA PARA NUEVO ---
export var abrirFormularioNuevo = function() {
    document.getElementById('tituloFormulario').textContent = 'Registro de Miembro';
    document.getElementById('formularioMiembro').reset();
    document.getElementById('contenedorRetiro').classList.add('oculto');
    document.getElementById('vistaTabla').classList.add('oculto');
    document.getElementById('vistaFormulario').classList.remove('oculto');
};

// --- APERTURA PARA EDICIÓN ---
export var abrirFormularioEdicion = function(miembro) {
    document.getElementById('tituloFormulario').textContent = 'Editar Registro de Miembro';
    llenarCamposComunes(miembro);

    document.getElementById('inputFechaRetiro').value = miembro.fecha_retiro || '';
    if (miembro.id_motivo_retiro) document.getElementById('selectMotivoRetiro').value = miembro.id_motivo_retiro;

    var selectEstadoForm = document.getElementById('selectEstado');
    if (miembro.id_estado) {
        selectEstadoForm.value = miembro.id_estado;
        selectEstadoForm.dispatchEvent(new Event('change'));
    }

    document.getElementById('vistaTabla').classList.add('oculto');
    document.getElementById('vistaFormulario').classList.remove('oculto');
    console.log("Formulario debería estar visible ahora");
};

// --- APERTURA PARA BAJA ---
export var abrirFormularioBaja = function(miembro) {
    document.getElementById('tituloFormulario').textContent = 'Dar de Baja a Miembro';
    llenarCamposComunes(miembro);

    var selectEstadoForm = document.getElementById('selectEstado');
    var opcionesEstado = Array.from(selectEstadoForm.options);
    var opcionRetirado = opcionesEstado.find(function(op) {
        return op.text.toLowerCase().trim() === 'retirado';
    });

    if (opcionRetirado) {
        selectEstadoForm.value = opcionRetirado.value;
        selectEstadoForm.dispatchEvent(new Event('change'));
    }

    document.getElementById('vistaTabla').classList.add('oculto');
    document.getElementById('vistaFormulario').classList.remove('oculto');
};

// --- CERRAR FORMULARIO ---
export var cerrarFormulario = function() {
    document.getElementById('vistaFormulario').classList.add('oculto');
    document.getElementById('vistaTabla').classList.remove('oculto');
    document.getElementById('formularioMiembro').reset();
    document.getElementById('contenedorRetiro').classList.add('oculto');
};

// --- ARMAR PAYLOAD ---
export var armarPayload = function() {
    return {
        nombres: document.getElementById('inputNombres').value,
        apellidos: document.getElementById('inputApellidos').value,
        dpi: document.getElementById('inputDpi').value || null,
        fecha_nacimiento: document.getElementById('inputNacimiento').value || null,
        fecha_bautismo: document.getElementById('inputBautismo').value || null,
        telefono: document.getElementById('inputTelefono').value || null,
        correo: document.getElementById('inputCorreo').value || null,
        id_genero: document.getElementById('selectGenero').value ? parseInt(document.getElementById('selectGenero').value) : null,
        id_profesion: document.getElementById('selectProfesion').value ? parseInt(document.getElementById('selectProfesion').value) : null,
        id_estado: document.getElementById('selectEstado').value ? parseInt(document.getElementById('selectEstado').value) : null,
        id_familia: document.getElementById('selectFamilia').value ? parseInt(document.getElementById('selectFamilia').value) : null,
        id_recepcion: document.getElementById('selectRecepcion').value ? parseInt(document.getElementById('selectRecepcion').value) : null,
        fecha_recepcion: document.getElementById('inputRecepcion').value || null,
        id_motivo_retiro: document.getElementById('selectMotivoRetiro').value ? parseInt(document.getElementById('selectMotivoRetiro').value) : null,
        fecha_retiro: document.getElementById('inputFechaRetiro').value || null
    };
};

// --- PERFIL: ABRIR ---
export var abrirPerfil = function(miembro) {
    document.getElementById('perfilNombre').textContent = miembro.nombres + ' ' + miembro.apellidos;
    document.getElementById('perfilDpi').textContent = miembro.dpi ? 'DPI: ' + miembro.dpi : 'DPI no registrado';
    document.getElementById('perfilEstado').textContent = miembro.estado_miembro || 'Sin estado';

    var direccionStr = miembro.calle_avenida
        ? miembro.calle_avenida + ', ' + (miembro.referencia_casa || '') + ' (Asentamiento: ' + (miembro.zona || 'N/A') + ')'
        : 'Dirección no registrada';
    document.getElementById('perfilFamilia').textContent = miembro.nombre_familia
        ? miembro.nombre_familia + ' - ' + direccionStr
        : 'Sin familia asignada';

    document.getElementById('perfilContacto').innerHTML = 'Tel: ' + (miembro.telefono || 'N/A') + ' <br> Email: ' + (miembro.correo || 'N/A');
    document.getElementById('perfilGenProf').innerHTML = 'Género: ' + (miembro.genero || 'N/A') + ' <br> Profesión: ' + (miembro.profesion || 'N/A');
    document.getElementById('perfilFechas').innerHTML = 'Nacimiento: ' + (miembro.fecha_nacimiento || 'N/A') + ' <br> Bautismo: ' + (miembro.fecha_bautismo || 'N/A') + ' <br> Recepción: ' + (miembro.fecha_recepcion || 'N/A');

    if (miembro.motivo_retiro || miembro.fecha_retiro) {
        document.getElementById('perfilRetiro').innerHTML = 'Motivo: ' + (miembro.motivo_retiro || 'N/A') + ' <br> Fecha: ' + (miembro.fecha_retiro || 'N/A');
    } else {
        document.getElementById('perfilRetiro').textContent = 'N/A';
    }

    document.getElementById('perfilMinisterios').textContent = 'Buscando asignaciones...';
    document.getElementById('modalPerfil').classList.add('modal-activo');
};

// --- PERFIL: ACTUALIZAR MINISTERIOS ---
export var actualizarMinisteriosPerfil = function(texto) {
    document.getElementById('perfilMinisterios').textContent = texto;
};

// --- INICIALIZAR EVENTOS ---
export var initFormEvents = function(callbacks) {
    var selectEstadoForm = document.getElementById('selectEstado');
    var contenedorRetiro = document.getElementById('contenedorRetiro');

    // Lógica reactiva: Retiro
    selectEstadoForm.addEventListener('change', function(e) {
        var opcionSel = e.target.options[e.target.selectedIndex];
        var estadoTexto = opcionSel ? opcionSel.text.toLowerCase().trim() : '';

        if (estadoTexto === 'retirado') {
            contenedorRetiro.classList.remove('oculto');
        } else {
            contenedorRetiro.classList.add('oculto');
            document.getElementById('selectMotivoRetiro').value = '';
            document.getElementById('inputFechaRetiro').value = '';
        }
    });

    // Mostrar formulario nuevo
    document.getElementById('btnMostrarFormulario').addEventListener('click', function() {
        callbacks.onMostrarFormulario();
    });

    // Cancelar
    document.getElementById('btnCancelarFormulario').addEventListener('click', function() {
        callbacks.onCancelarFormulario();
    });

    // Submit
    document.getElementById('formularioMiembro').addEventListener('submit', function(evento) {
        evento.preventDefault();
        callbacks.onSubmit(armarPayload());
    });

    // Perfil: cerrar
    document.getElementById('btnCerrarPerfil').addEventListener('click', function() {
        document.getElementById('modalPerfil').classList.remove('modal-activo');
    });
};