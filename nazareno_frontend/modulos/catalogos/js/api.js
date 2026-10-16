// ==========================================
// CATÁLOGOS - MÓDULO API
// ==========================================
var URL_BASE = '/api/';

export var fetchCatalogo = async function(endpoint) {
    var respuesta = await fetch(URL_BASE + endpoint);
    return await respuesta.json();
};

export var saveCatalogo = async function(endpoint, datos, modoEdicion, idEdicion) {
    var urlDestino = URL_BASE + endpoint;
    var metodoHTTP = 'POST';

    if (modoEdicion) {
        urlDestino = URL_BASE + endpoint + '/' + idEdicion;
        metodoHTTP = 'PUT';
    }

    var respuesta = await fetch(urlDestino, {
        method: metodoHTTP,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    return respuesta;
};

export var deleteCatalogo = async function(endpoint, id) {
    var respuesta = await fetch(URL_BASE + endpoint + '/' + id, { method: 'DELETE' });
    return respuesta;
};