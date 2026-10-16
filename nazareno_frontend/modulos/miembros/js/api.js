// ==========================================
// MIEMBROS - MÓDULO API
// ==========================================
var URL_BASE_MIEMBROS = '/api/miembros';

export var fetchMiembros = async function() {
    var res = await fetch(URL_BASE_MIEMBROS);
    return await res.json();
};

export var fetchCatalogos = async function() {
    var resultados = await Promise.all([
        fetch('/api/estados'),
        fetch('/api/generos'),
        fetch('/api/profesiones'),
        fetch('/api/tipos-recepcion'),
        fetch('/api/motivos-retiro'),
        fetch('/api/familias')
    ]);

    return {
        estados: resultados[0].ok ? await resultados[0].json() : [],
        generos: resultados[1].ok ? await resultados[1].json() : [],
        profesiones: resultados[2].ok ? await resultados[2].json() : [],
        recepciones: resultados[3].ok ? await resultados[3].json() : [],
        motivos: resultados[4].ok ? await resultados[4].json() : [],
        familias: resultados[5].ok ? await resultados[5].json() : []
    };
};

export var fetchMinisteriosMiembro = async function(idMiembro) {
    var res = await fetch('/api/miembros/' + idMiembro + '/ministerios');
    return res;
};

export var saveMiembro = async function(datos, modoEdicion, idMiembroActual) {
    var urlDestino = URL_BASE_MIEMBROS;
    var metodoHTTP = 'POST';

    if (modoEdicion) {
        urlDestino = URL_BASE_MIEMBROS + '/' + idMiembroActual;
        metodoHTTP = 'PUT';
    }

    var respuesta = await fetch(urlDestino, {
        method: metodoHTTP,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return respuesta;
};