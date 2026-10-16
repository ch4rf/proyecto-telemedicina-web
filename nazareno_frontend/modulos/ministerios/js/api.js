// ==========================================
// MINISTERIOS - MÓDULO API
// ==========================================
var URL_BASE_MINISTERIOS = '/api/ministerios';

export var fetchMinisterios = async function() {
    var res = await fetch(URL_BASE_MINISTERIOS);
    return await res.json();
};

export var saveMinisterio = async function(nombre, modoEdicion, id) {
    var url = URL_BASE_MINISTERIOS;
    var metodo = 'POST';
    if (modoEdicion) { url = URL_BASE_MINISTERIOS + '/' + id; metodo = 'PUT'; }

    var res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre })
    });
    return res;
};

export var deleteMinisterio = async function(id) {
    var res = await fetch(URL_BASE_MINISTERIOS + '/' + id, { method: 'DELETE' });
    return res;
};

export var fetchHistorial = async function(idMin, filtro) {
    var res = await fetch(URL_BASE_MINISTERIOS + '/' + idMin + '/historial?filtro=' + filtro);
    return await res.json();
};

export var cerrarCiclo = async function(idHistorial, fechaFin) {
    var res = await fetch(URL_BASE_MINISTERIOS + '/historial/' + idHistorial, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_fin: fechaFin })
    });
    return res;
};

export var vincularMiembro = async function(datos) {
    var res = await fetch(URL_BASE_MINISTERIOS + '/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return res;
};

export var fetchMiembros = async function() {
    var res = await fetch('/api/miembros');
    return await res.json();
};