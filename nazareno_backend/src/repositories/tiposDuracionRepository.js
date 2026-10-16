const pool = require('../config/db');

// Obtener catalogo de tipos de duracion ordenado alfabeticamente
const getAllTiposDuracion = async () => {
  const query = 'SELECT id_tipo_duracion AS id, descripcion, requiere_hora FROM cat_tipo_duracion ORDER BY descripcion ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo tipo de duracion
const insertTipoDuracion = async (descripcion, requiereHora) => {
  const query = 'INSERT INTO cat_tipo_duracion (descripcion, requiere_hora) VALUES ($1, $2) RETURNING *;';
  const resultado = await pool.query(query, [descripcion, requiereHora]);
  return resultado.rows[0];
};

// Actualizar un tipo de duracion por ID
const updateTipoDuracion = async (id, descripcion, requiereHora) => {
  const query = 'UPDATE cat_tipo_duracion SET descripcion = $1, requiere_hora = $2 WHERE id_tipo_duracion = $3 RETURNING *;';
  const resultado = await pool.query(query, [descripcion, requiereHora, id]);
  return resultado.rows[0] || null;
};

// Eliminar un tipo de duracion por ID
const deleteTipoDuracion = async (id) => {
  const query = 'DELETE FROM cat_tipo_duracion WHERE id_tipo_duracion = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllTiposDuracion,
  insertTipoDuracion,
  updateTipoDuracion,
  deleteTipoDuracion
};