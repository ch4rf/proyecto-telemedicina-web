// ==========================================
// FAMILIAS - MÓDULO API
// ==========================================
var URL_BASE_FAMILIAS = '/api/familias';

export var fetchFamilias = async function() {
    var res = await fetch(URL_BASE_FAMILIAS);
    return await res.json();
};

export var fetchZonas = async function() {
    var respuesta = await fetch('/api/zonas');
    return await respuesta.json();
};

export var fetchIntegrantes = async function(idFamilia) {
    var respuesta = await fetch(URL_BASE_FAMILIAS + '/' + idFamilia + '/miembros');
    return respuesta;
};

export var fetchMiembros = async function() {
    var res = await fetch('/api/miembros');
    return await res.json();
};

export var saveFamilia = async function(datos, modoEdicion, idFamiliaActual) {
    var urlDestino = URL_BASE_FAMILIAS;
    var metodoHTTP = 'POST';

    if (modoEdicion) {
        urlDestino = URL_BASE_FAMILIAS + '/' + idFamiliaActual;
        metodoHTTP = 'PUT';
    }

    var respuesta = await fetch(urlDestino, {
        method: metodoHTTP,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return respuesta;
};

export var deleteFamilia = async function(id) {
    var res = await fetch(URL_BASE_FAMILIAS + '/' + id, { method: 'DELETE' });
    return res;
};

export var updateMiembro = async function(idMiembro, datos) {
    var respuesta = await fetch('/api/miembros/' + idMiembro, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return respuesta;
};