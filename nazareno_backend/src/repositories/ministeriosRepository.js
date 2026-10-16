const pool = require('../config/db');

// Obtener todos los ministerios ordenados por nombre
const getAllMinisterios = async () => {
  const query = 'SELECT * FROM cat_ministerios ORDER BY nombre ASC;';
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo ministerio
const insertMinisterio = async (nombre) => {
  const query = 'INSERT INTO cat_ministerios (nombre) VALUES ($1) RETURNING *;';
  const resultado = await pool.query(query, [nombre]);
  return resultado.rows[0];
};

// Actualizar el nombre de un ministerio
const updateMinisterio = async (id, nombre) => {
  const query = 'UPDATE cat_ministerios SET nombre = $1 WHERE id_ministerio = $2 RETURNING *;';
  const resultado = await pool.query(query, [nombre, id]);
  return resultado.rows[0] || null;
};

// Eliminar un ministerio por ID
const deleteMinisterio = async (id) => {
  const query = 'DELETE FROM cat_ministerios WHERE id_ministerio = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

// Obtener historial de asignaciones según filtro (activos, año o todos)
const getHistorialByMinisterioId = async (id, filtro) => {
  let query = `
    SELECT 
      h.id_historial,
      m.id_miembro,
      m.nombres,
      m.apellidos,
      m.telefono,
      h.cargo,
      h.estado_activo,
      TO_CHAR(h.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
      TO_CHAR(h.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
      TO_CHAR(h.fecha_inicio, 'YYYY') AS anio_gestion
    FROM miembros_ministerios_historial h
    JOIN miembros m ON h.id_miembro = m.id_miembro
    WHERE h.id_ministerio = $1
  `;
  const valores = [id];

  if (filtro === 'activos') {
    query += ' AND h.estado_activo = TRUE';
  } else if (filtro && filtro !== 'todos') {
    query += ' AND EXTRACT(YEAR FROM h.fecha_inicio) = $2';
    valores.push(filtro);
  }

  query += ' ORDER BY h.estado_activo DESC, h.fecha_inicio DESC, m.nombres ASC;';

  const resultado = await pool.query(query, valores);
  return resultado.rows;
};

// Vincular un miembro a un ministerio
const insertMiembroMinisterio = async (datos) => {
  const { id_ministerio, id_miembro, cargo, fecha_inicio } = datos;
  const query = `
    INSERT INTO miembros_ministerios_historial 
    (id_ministerio, id_miembro, cargo, fecha_inicio, estado_activo) 
    VALUES ($1, $2, $3, $4, TRUE) 
    RETURNING *;
  `;
  const valores = [id_ministerio, id_miembro, cargo, fecha_inicio];
  const resultado = await pool.query(query, valores);
  return resultado.rows[0];
};

// Dar de baja a un miembro de su ciclo en un ministerio
const updateBajaMinisterio = async (idHistorial, fechaFin) => {
  const query = `
    UPDATE miembros_ministerios_historial 
    SET estado_activo = FALSE, fecha_fin = $1 
    WHERE id_historial = $2 
    RETURNING *;
  `;
  const resultado = await pool.query(query, [fechaFin, idHistorial]);
  return resultado.rows[0] || null;
};

module.exports = {
  getAllMinisterios,
  insertMinisterio,
  updateMinisterio,
  deleteMinisterio,
  getHistorialByMinisterioId,
  insertMiembroMinisterio,
  updateBajaMinisterio
};