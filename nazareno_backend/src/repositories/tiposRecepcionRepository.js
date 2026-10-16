const pool = require('../config/db');

// Obtener catalogo de tipos de recepcion ordenado alfabeticamente
const getAllTiposRecepcion = async () => {
  const query = 'SELECT id_recepcion AS id, descripcion FROM cat_tipo_recepcion ORDER BY descripcion ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo tipo de recepcion
const insertTipoRecepcion = async (descripcion) => {
  const query = 'INSERT INTO cat_tipo_recepcion (descripcion) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [descripcion]);
  return resultado.rows[0];
};

// Actualizar un tipo de recepcion por ID
const updateTipoRecepcion = async (id, descripcion) => {
  const query = 'UPDATE cat_tipo_recepcion SET descripcion = $1 WHERE id_recepcion = $2 RETURNING *;';
  const resultado = await pool.query(query, [descripcion, id]);
  return resultado.rows[0] || null;
};

// Eliminar un tipo de recepcion por ID
const deleteTipoRecepcion = async (id) => {
  const query = 'DELETE FROM cat_tipo_recepcion WHERE id_recepcion = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllTiposRecepcion,
  insertTipoRecepcion,
  updateTipoRecepcion,
  deleteTipoRecepcion
};