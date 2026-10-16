const pool = require('../config/db');

const getDatosFormulario = async () => {
  const [tipos, duraciones, lugares, ministerios] = await Promise.all([
    pool.query('SELECT * FROM cat_tipo_actividad'),
    pool.query('SELECT * FROM cat_tipo_duracion'),
    pool.query('SELECT * FROM cat_lugares_iglesia'),
    pool.query('SELECT id_ministerio, nombre FROM cat_ministerios')
  ]);

  return {
    tipos: tipos.rows,
    duraciones: duraciones.rows,
    lugares: lugares.rows,
    ministerios: ministerios.rows
  };
};

const getAllActividades = async () => {
  const query = `
    SELECT a.*, t.descripcion as tipo_actividad, min.nombre as ministerio, 
           l.nombre as lugar, m.nombres, m.apellidos, d.descripcion as duracion_descripcion
    FROM actividades a
    LEFT JOIN cat_tipo_actividad t ON a.id_tipo = t.id_tipo
    LEFT JOIN cat_ministerios min ON a.id_ministerio = min.id_ministerio
    LEFT JOIN cat_lugares_iglesia l ON a.id_lugar = l.id_lugar
    LEFT JOIN miembros m ON a.id_miembro_anfitrion = m.id_miembro
    LEFT JOIN cat_tipo_duracion d ON a.id_tipo_duracion = d.id_tipo_duracion
    ORDER BY a.fecha ASC, a.hora_inicio ASC
  `;
  const resultado = await pool.query(query);
  return resultado.rows;
};

const insertActividad = async (datos) => {
  const { 
    id_ministerio, id_tipo, fecha, id_tipo_duracion, 
    hora_inicio, hora_fin, id_lugar, id_miembro_anfitrion 
  } = datos;

  const textSql = `
    INSERT INTO actividades 
    (id_ministerio, id_tipo, fecha, id_tipo_duracion, hora_inicio, hora_fin, id_lugar, id_miembro_anfitrion) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
  `;
  const valores = [id_ministerio, id_tipo, fecha, id_tipo_duracion, hora_inicio, hora_fin, id_lugar, id_miembro_anfitrion];
  
  const resultado = await pool.query(textSql, valores);
  return resultado.rows[0];
};

const deleteActividad = async (id) => {
  const resultado = await pool.query('DELETE FROM actividades WHERE id_actividad = $1', [id]);
  return resultado.rowCount > 0;
};

const updateActividad = async (id, datos) => {
  const { 
    id_ministerio, id_tipo, fecha, id_tipo_duracion, 
    hora_inicio, hora_fin, id_lugar, id_miembro_anfitrion 
  } = datos;

  const textSql = `
    UPDATE actividades 
    SET id_ministerio = $1, 
        id_tipo = $2, 
        fecha = $3, 
        id_tipo_duracion = $4, 
        hora_inicio = $5, 
        hora_fin = $6, 
        id_lugar = $7, 
        id_miembro_anfitrion = $8
    WHERE id_actividad = $9
    RETURNING *;
  `;
  const valores = [
    id_ministerio, id_tipo, fecha, id_tipo_duracion, 
    hora_inicio, hora_fin, id_lugar, id_miembro_anfitrion, 
    id
  ];

  const resultado = await pool.query(textSql, valores);
  return resultado.rows[0];
};

module.exports = {
  getDatosFormulario,
  getAllActividades,
  insertActividad,
  deleteActividad,
  updateActividad
};