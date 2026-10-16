const pool = require('../config/db');

// Obtener catalogo de profesiones ordenado alfabeticamente
const getAllProfesiones = async () => {
  const query = 'SELECT id_profesion AS id, descripcion FROM cat_profesiones ORDER BY descripcion ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar una nueva profesion
const insertProfesion = async (descripcion) => {
  const query = 'INSERT INTO cat_profesiones (descripcion) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [descripcion]);
  return resultado.rows[0];
};

// Actualizar una profesion por ID
const updateProfesion = async (id, descripcion) => {
  const query = 'UPDATE cat_profesiones SET descripcion = $1 WHERE id_profesion = $2 RETURNING *;';
  const resultado = await pool.query(query, [descripcion, id]);
  return resultado.rows[0] || null;
};

// Eliminar una profesion por ID
const deleteProfesion = async (id) => {
  const query = 'DELETE FROM cat_profesiones WHERE id_profesion = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllProfesiones,
  insertProfesion,
  updateProfesion,
  deleteProfesion
};