const pool = require('../config/db');

// Obtener catalogo de zonas ordenado alfabeticamente
const getAllZonas = async () => {
  const query = 'SELECT id_zona AS id, nombre_zona AS descripcion FROM cat_zonas_sectores ORDER BY nombre_zona ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar una nueva zona
const insertZona = async (nombreZona) => {
  const query = 'INSERT INTO cat_zonas_sectores (nombre_zona) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [nombreZona]);
  return resultado.rows[0];
};

// Actualizar una zona existente por ID
const updateZona = async (id, nombreZona) => {
  const query = 'UPDATE cat_zonas_sectores SET nombre_zona = $1 WHERE id_zona = $2 RETURNING *;';
  const resultado = await pool.query(query, [nombreZona, id]);
  return resultado.rows[0] || null;
};

// Eliminar una zona por ID
const deleteZona = async (id) => {
  const query = 'DELETE FROM cat_zonas_sectores WHERE id_zona = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllZonas,
  insertZona,
  updateZona,
  deleteZona
};