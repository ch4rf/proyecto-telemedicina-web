const pool = require('../config/db');

// Obtener todas las familias con el nombre de su zona
const getAllFamilias = async () => {
  const query = `
    SELECT 
      f.id_familia,
      f.primer_apellido,
      f.segundo_apellido,
      f.nombre_familia,
      f.id_zona,
      cz.nombre_zona AS zona,
      f.calle_avenida,
      f.referencia_casa,
      TO_CHAR(f.fecha_registro, 'YYYY-MM-DD HH24:MI') AS fecha_registro
    FROM familias f
    LEFT JOIN cat_zonas_sectores cz ON f.id_zona = cz.id_zona
    ORDER BY f.id_familia ASC;
  `;
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar una nueva familia
const insertFamilia = async (datos) => {
  const { primer_apellido, segundo_apellido, nombre_familia, id_zona, calle_avenida, referencia_casa } = datos;
  const query = `
    INSERT INTO familias (primer_apellido, segundo_apellido, nombre_familia, id_zona, calle_avenida, referencia_casa) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *;
  `;
  const valores = [primer_apellido, segundo_apellido, nombre_familia, id_zona, calle_avenida, referencia_casa];
  const resultado = await pool.query(query, valores);
  return resultado.rows[0];
};

// Actualizar una familia existente por ID
const updateFamilia = async (id, datos) => {
  const { primer_apellido, segundo_apellido, nombre_familia, id_zona, calle_avenida, referencia_casa } = datos;
  const query = `
    UPDATE familias 
    SET primer_apellido = $1, segundo_apellido = $2, nombre_familia = $3, 
        id_zona = $4, calle_avenida = $5, referencia_casa = $6
    WHERE id_familia = $7 
    RETURNING *;
  `;
  const valores = [primer_apellido, segundo_apellido, nombre_familia, id_zona, calle_avenida, referencia_casa, id];
  const resultado = await pool.query(query, valores);
  return resultado.rows[0] || null;
};

// Eliminar una familia por ID
const deleteFamilia = async (id) => {
  const query = 'DELETE FROM familias WHERE id_familia = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

// Obtener integrantes asociados a una familia
const getIntegrantesByFamiliaId = async (id) => {
  const query = `
    SELECT 
      m.id_miembro,
      m.nombres,
      m.apellidos,
      m.rol_familiar,
      m.telefono,
      m.id_genero,     
      m.id_profesion,  
      m.id_estado,
      m.id_recepcion,
      m.id_motivo_retiro,
      m.dpi,
      TO_CHAR(m.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
      TO_CHAR(m.fecha_bautismo, 'YYYY-MM-DD') AS fecha_bautismo,
      TO_CHAR(m.fecha_recepcion, 'YYYY-MM-DD') AS fecha_recepcion,
      TO_CHAR(m.fecha_retiro, 'YYYY-MM-DD') AS fecha_retiro
    FROM miembros m
    WHERE m.id_familia = $1
    ORDER BY m.id_miembro ASC;
  `;
  const resultado = await pool.query(query, [id]);
  return resultado.rows;
};

module.exports = {
  getAllFamilias,
  insertFamilia,
  updateFamilia,
  deleteFamilia,
  getIntegrantesByFamiliaId
};