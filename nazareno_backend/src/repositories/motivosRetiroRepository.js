const pool = require('../config/db');

// Obtener catálogo de motivos de retiro ordenado por descripción
const getAllMotivosRetiro = async () => {
  const query = 'SELECT id_motivo AS id, descripcion FROM cat_motivo_retiro ORDER BY descripcion ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo motivo de retiro
const insertMotivoRetiro = async (descripcion) => {
  const query = 'INSERT INTO cat_motivo_retiro (descripcion) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [descripcion]);
  return resultado.rows[0];
};

// Actualizar un motivo de retiro por ID
const updateMotivoRetiro = async (id, descripcion) => {
  const query = 'UPDATE cat_motivo_retiro SET descripcion = $1 WHERE id_motivo = $2 RETURNING *;';
  const resultado = await pool.query(query, [descripcion, id]);
  return resultado.rows[0] || null;
};

// Eliminar un motivo de retiro por ID
const deleteMotivoRetiro = async (id) => {
  const query = 'DELETE FROM cat_motivo_retiro WHERE id_motivo = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllMotivosRetiro,
  insertMotivoRetiro,
  updateMotivoRetiro,
  deleteMotivoRetiro
};