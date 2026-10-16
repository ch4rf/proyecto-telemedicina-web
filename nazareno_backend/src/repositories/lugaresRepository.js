const pool = require('../config/db');

// Obtener todos los lugares ordenados por nombre
const getAllLugares = async () => {
  const query = 'SELECT id_lugar AS id, nombre, requiere_anfitrion FROM cat_lugares_iglesia ORDER BY nombre ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo lugar
const insertLugar = async (nombre, requiereAnfitrion) => {
  const query = 'INSERT INTO cat_lugares_iglesia (nombre, requiere_anfitrion) VALUES ($1, $2) RETURNING *;';
  const resultado = await pool.query(query, [nombre, requiereAnfitrion]);
  return resultado.rows[0];
};

// Actualizar un lugar existente por ID
const updateLugar = async (id, nombre, requiereAnfitrion) => {
  const query = 'UPDATE cat_lugares_iglesia SET nombre = $1, requiere_anfitrion = $2 WHERE id_lugar = $3 RETURNING *;';
  const resultado = await pool.query(query, [nombre, requiereAnfitrion, id]);
  return resultado.rows[0] || null;
};

// Eliminar un lugar por ID
const deleteLugar = async (id) => {
  const query = 'DELETE FROM cat_lugares_iglesia WHERE id_lugar = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllLugares,
  insertLugar,
  updateLugar,
  deleteLugar
};