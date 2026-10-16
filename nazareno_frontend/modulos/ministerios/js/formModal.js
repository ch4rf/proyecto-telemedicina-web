// ==========================================
// MINISTERIOS - MODALES (CRUD, ASIGNACIÓN, ARCHIVO)
// ==========================================

// --- RENDERIZADO: TABLA ARCHIVO ---
var renderizarTablaArchivo = function(datosHistorial, anioSeleccionado) {
    var cuerpoArchivo = document.getElementById('cuerpoTablaArchivo');
    cuerpoArchivo.innerHTML = '';

    var datosFiltrados = datosHistorial.filter(function(item) { return item.anio_gestion === anioSeleccionado; });

    datosFiltrados.forEach(function(item) {
        var periodo = item.estado_activo
            ? item.fecha_inicio + ' - <span style="color:#15803d; font-weight:bold;">Presente</span>'
            : item.fecha_inicio + ' al ' + item.fecha_fin;

        cuerpoArchivo.innerHTML += '<tr>' +
            '<td><strong>' + item.nombres + '</strong> ' + item.apellidos + '</td>' +
            '<td><span style="color:#475569;">' + item.cargo + '</span></td>' +
            '<td style="font-size: 13px;">' + periodo + '</td>' +
        '</tr>';
    });
};

// --- RENDERIZADO: LISTA BUSCADOR ASIGNACIÓN ---
export var renderizarListaBuscador = function(datos) {
    var listaBuscador = document.getElementById('listaBuscadorMiembros');
    listaBuscador.innerHTML = '';

    datos.forEach(function(m) {
        listaBuscador.innerHTML += '<li class="item-checkbox" style="display:flex; flex-direction:column; padding:10px; border-bottom: 1px solid #e2e8f0;">' +
            '<label style="display:flex; align-items:center; gap:12px; cursor:pointer; width:100%;">' +
                '<input type="checkbox" class="check-miembro-libre" value="' + m.id_miembro + '" onchange="toggleInputCargo(this)">' +
                '<span style="font-size: 14px; color:#334155;"><strong>' + m.nombres + '</strong> ' + m.apellidos + '</span>' +
            '</label>' +
            '<input type="text" id="cargo_' + m.id_miembro + '" class="input-estilizado" placeholder="Escribe su cargo (Ej. Vocal, Ujier...)" style="display:none; margin-top:8px; width:90%; align-self:flex-end; font-size:13px; padding:6px; background-color: #fff;">' +
        '</li>';
    });
};

// --- GLOBAL: TOGGLE INPUT CARGO ---
window.toggleInputCargo = function(checkbox) {
    var inputCargo = document.getElementById('cargo_' + checkbox.value);
    if (checkbox.checked) {
        inputCargo.style.display = 'block';
        inputCargo.focus();
    } else {
        inputCargo.style.display = 'none';
        inputCargo.value = '';
    }
};

// --- POBLAR MODAL ARCHIVO (BOTONES DE AÑO) ---
export var poblarModalArchivo = function(datosHistorial) {
    var contenedorAnios = document.getElementById('contenedorAnios');
    contenedorAnios.innerHTML = '';

    var aniosSet = {};
    var anios = [];
    datosHistorial.forEach(function(item) {
        if (item.anio_gestion && !aniosSet[item.anio_gestion]) {
            aniosSet[item.anio_gestion] = true;
            anios.push(item.anio_gestion);
        }
    });
    anios.sort(function(a, b) { return b - a; });

    if (anios.length === 0) {
        contenedorAnios.innerHTML = '<p style="color:#94a3b8; font-size:13px; padding:10px;">No hay historial registrado.</p>';
        document.getElementById('cuerpoTablaArchivo').innerHTML = '<tr><td colspan="3" style="text-align:center; color:#9ca3af;">Archivo vacío</td></tr>';
        return;
    }

    anios.forEach(function(anio, index) {
        var btn = document.createElement('button');
        btn.className = 'btn-anio' + (index === 0 ? ' activo' : '');
        btn.innerHTML = '<i class="fas fa-calendar-alt" style="margin-right:8px;"></i> Gestión ' + anio;
        btn.onclick = function() {
            document.querySelectorAll('.btn-anio').forEach(function(b) { b.classList.remove('activo'); });
            btn.classList.add('activo');
            renderizarTablaArchivo(datosHistorial, anio);
        };
        contenedorAnios.appendChild(btn);
    });

    renderizarTablaArchivo(datosHistorial, anios[0]);
};

// ==========================================
// EVENTOS: MODAL CRUD MINISTERIO
// ==========================================
export var initModalMinisterioEvents = function(callbacks) {
    document.getElementById('btnAbrirModalNuevoMin').addEventListener('click', function() {
        callbacks.onNuevoMin();
        document.getElementById('tituloModalMin').textContent = 'Nuevo Ministerio';
        document.getElementById('inputNombreMin').value = '';
        document.getElementById('modalFormMinisterio').classList.add('modal-activo');
    });

    document.getElementById('btnCancelarFormMin').addEventListener('click', function() {
        document.getElementById('modalFormMinisterio').classList.remove('modal-activo');
    });

    document.getElementById('btnGuardarMin').addEventListener('click', function() {
        var nombre = document.getElementById('inputNombreMin').value.trim();
        if (!nombre) return Swal.fire('Aviso', 'El nombre no puede estar vacío', 'warning');
        callbacks.onGuardarMin(nombre);
    });
};

export var abrirModalEditarMin = function(id, nombre) {
    document.getElementById('tituloModalMin').textContent = 'Editar Ministerio';
    document.getElementById('inputNombreMin').value = nombre;
    document.getElementById('modalFormMinisterio').classList.add('modal-activo');
};

export var cerrarModalMinisterio = function() {
    document.getElementById('modalFormMinisterio').classList.remove('modal-activo');
};

// ==========================================
// EVENTOS: MODAL ASIGNACIÓN
// ==========================================
export var initAsignacionEvents = function(callbacks, stateProvider) {
    var modalAsignacion = document.getElementById('modalAsignacionMinisterio');
    var inputBuscar = document.getElementById('inputBuscarMiembro');

    document.getElementById('btnAsignarMinisterio').addEventListener('click', function() {
        var state = stateProvider();
        if (!state.idMinisterioSeleccionado) {
            Swal.fire({
                title: 'Seleccione un Ministerio',
                text: 'Primero debes seleccionar un ministerio de la lista para poder asignarle servidores.',
                icon: 'info',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        callbacks.onAbrirAsignacion();
    });

    inputBuscar.addEventListener('input', function(e) {
        var state = stateProvider();
        var t = e.target.value.toLowerCase().trim();
        var filtrados = state.miembrosGlobales.filter(function(m) {
            return m.nombres.toLowerCase().includes(t) || m.apellidos.toLowerCase().includes(t);
        });
        renderizarListaBuscador(filtrados);
    });

    document.getElementById('btnCerrarModalAsignacion').addEventListener('click', function() { modalAsignacion.classList.remove('modal-activo'); });
    document.getElementById('btnCancelarAsignacion').addEventListener('click', function() { modalAsignacion.classList.remove('modal-activo'); });

    document.getElementById('btnGuardarAsignacion').addEventListener('click', function() {
        var marcados = document.querySelectorAll('.check-miembro-libre:checked');
        if (marcados.length === 0) return Swal.fire('Aviso', 'Selecciona al menos un miembro.', 'warning');

        var fecha = document.getElementById('inputFechaInicioCargo').value || new Date().toISOString().split('T')[0];
        var faltanCargos = false;
        var asignaciones = [];

        marcados.forEach(function(cb) {
            var idMiembro = cb.value;
            var cargoEspecifico = document.getElementById('cargo_' + idMiembro).value.trim();
            if (!cargoEspecifico) {
                faltanCargos = true;
            } else {
                asignaciones.push({ id_miembro: idMiembro, cargo: cargoEspecifico });
            }
        });

        if (faltanCargos) {
            return Swal.fire('Aviso', 'Por favor, asegúrate de escribirle un cargo a todos los miembros que marcaste.', 'warning');
        }

        callbacks.onGuardarAsignacion(asignaciones, fecha);
    });
};

export var abrirModalAsignacion = function(miembrosLibres) {
    document.getElementById('inputFechaInicioCargo').value = new Date().toISOString().split('T')[0];
    document.getElementById('inputBuscarMiembro').value = '';
    renderizarListaBuscador(miembrosLibres);
    document.getElementById('modalAsignacionMinisterio').classList.add('modal-activo');
};

export var cerrarModalAsignacion = function() {
    document.getElementById('modalAsignacionMinisterio').classList.remove('modal-activo');
};

// ==========================================
// EVENTOS: MODAL ARCHIVO HISTÓRICO
// ==========================================
export var initArchivoEvents = function(callbacks) {
    document.getElementById('btnAbrirArchivo').addEventListener('click', function() {
        callbacks.onAbrirArchivo();
    });

    document.getElementById('btnCerrarArchivo').addEventListener('click', function() {
        document.getElementById('modalArchivoHistorico').classList.remove('modal-activo');
    });
};

export var abrirModalArchivoCargando = function(nombreMin) {
    document.getElementById('nombreMinArchivo').textContent = nombreMin;
    document.getElementById('cuerpoTablaArchivo').innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando archivo...</td></tr>';
    document.getElementById('contenedorAnios').innerHTML = '';
    document.getElementById('modalArchivoHistorico').classList.add('modal-activo');
};