export const URL_BASE_ACTIVIDADES = '/api/actividades';

export const fetchConfiguracion = async () => {
    const res = await fetch(URL_BASE_ACTIVIDADES + '/configuracion');
    return await res.json();
};

export const fetchActividades = async () => {
    const res = await fetch(URL_BASE_ACTIVIDADES);
    return await res.json();
};

export const fetchMiembros = async () => {
    const res = await fetch('/api/miembros');
    return await res.json();
};

export const saveActividad = async (datos, idActividadEnEdicion) => {
    const metodo = idActividadEnEdicion ? 'PUT' : 'POST';
    const url = idActividadEnEdicion 
                ? URL_BASE_ACTIVIDADES + '/' + idActividadEnEdicion 
                : URL_BASE_ACTIVIDADES;

    const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return respuesta;
};

export const deleteActividad = async (id) => {
    const res = await fetch(URL_BASE_ACTIVIDADES + '/' + id, { method: 'DELETE' });
    return res;
};