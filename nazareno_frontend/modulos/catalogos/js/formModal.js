// ==========================================
// CATÁLOGOS - MODAL DE FORMULARIO
// ==========================================
export var abrirModalNuevo = function(endpoint) {
    var modal = document.getElementById('modalRegistro');
    var tituloModal = document.getElementById('tituloModal');
    var inputTexto = document.getElementById('inputTexto');
    var contenedorBooleano = document.getElementById('contenedorBooleano');
    var inputBooleano = document.getElementById('inputBooleano');
    var textoBooleano = document.getElementById('textoBooleano');

    tituloModal.textContent = 'Nuevo Registro';
    inputTexto.value = '';
    inputBooleano.checked = false;

    if (endpoint === 'lugares') {
        contenedorBooleano.classList.remove('oculto');
        textoBooleano.textContent = '¿Requiere Anfitrión?';
    } else if (endpoint === 'tipos-duracion') {
        contenedorBooleano.classList.remove('oculto');
        textoBooleano.textContent = '¿Requiere Hora?';
    } else {
        contenedorBooleano.classList.add('oculto');
    }

    modal.classList.add('modal-activo');
};

export var abrirModalEdicion = function(registro, endpoint) {
    var modal = document.getElementById('modalRegistro');
    var tituloModal = document.getElementById('tituloModal');
    var inputTexto = document.getElementById('inputTexto');
    var contenedorBooleano = document.getElementById('contenedorBooleano');
    var inputBooleano = document.getElementById('inputBooleano');
    var textoBooleano = document.getElementById('textoBooleano');

    tituloModal.textContent = 'Editar Registro';
    inputTexto.value = registro.nombre || registro.descripcion;

    if (endpoint === 'lugares') {
        contenedorBooleano.classList.remove('oculto');
        textoBooleano.textContent = '¿Requiere Anfitrión?';
        inputBooleano.checked = registro.requiere_anfitrion;
    } else if (endpoint === 'tipos-duracion') {
        contenedorBooleano.classList.remove('oculto');
        textoBooleano.textContent = '¿Requiere Hora?';
        inputBooleano.checked = registro.requiere_hora;
    } else {
        contenedorBooleano.classList.add('oculto');
        inputBooleano.checked = false;
    }

    modal.classList.add('modal-activo');
};

export var cerrarModal = function() {
    document.getElementById('modalRegistro').classList.remove('modal-activo');
};

export var armarPayload = function(endpoint) {
    var inputTexto = document.getElementById('inputTexto');
    var inputBooleano = document.getElementById('inputBooleano');
    var datosParaEnviar = {};

    if (endpoint === 'zonas') {
        datosParaEnviar = { nombre_zona: inputTexto.value };
    }
    else if (endpoint === 'lugares') {
        datosParaEnviar = { nombre: inputTexto.value, requiere_anfitrion: inputBooleano.checked };
    }
    else if (endpoint === 'tipos-duracion') {
        datosParaEnviar = { descripcion: inputTexto.value, requiere_hora: inputBooleano.checked };
    }
    else {
        datosParaEnviar = { descripcion: inputTexto.value };
    }

    return datosParaEnviar;
};

export var initFormModalEvents = function(callbacks) {
    var btnNuevo = document.getElementById('btnNuevoRegistro');
    var btnCancelar = document.getElementById('btnCancelar');
    var formulario = document.getElementById('formularioRegistro');

    btnNuevo.addEventListener('click', function() {
        callbacks.onNuevo();
    });

    btnCancelar.addEventListener('click', function() {
        cerrarModal();
    });

    formulario.addEventListener('submit', function(evento) {
        evento.preventDefault();
        callbacks.onSubmit();
    });
};