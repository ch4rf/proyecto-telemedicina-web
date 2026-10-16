const pool = require('../config/db');

// Obtener todos los miembros con catálogos asociados
const getAllMiembros = async () => {
  const query = `
    SELECT 
      m.id_miembro,
      m.nombres,
      m.apellidos,
      m.dpi,
      m.telefono,
      m.correo,
      m.id_genero,     
      m.id_profesion,  
      m.id_estado,
      m.id_motivo_retiro, 
      m.id_familia,
      m.id_recepcion,        
      m.rol_familiar,        
      f.nombre_familia,
      f.calle_avenida,
      f.referencia_casa,
      cz.nombre_zona AS zona,
      cg.descripcion AS genero,
      cp.descripcion AS profesion,
      cem.descripcion AS estado_miembro,
      cmr.descripcion AS motivo_retiro,
      ctr.descripcion AS tipo_recepcion,
      TO_CHAR(m.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
      TO_CHAR(m.fecha_bautismo, 'YYYY-MM-DD') AS fecha_bautismo,
      TO_CHAR(m.fecha_recepcion, 'YYYY-MM-DD') AS fecha_recepcion,
      TO_CHAR(m.fecha_retiro, 'YYYY-MM-DD') AS fecha_retiro
    FROM miembros m
    LEFT JOIN familias f ON m.id_familia = f.id_familia
    LEFT JOIN cat_zonas_sectores cz ON f.id_zona = cz.id_zona
    LEFT JOIN cat_genero cg ON m.id_genero = cg.id_genero
    LEFT JOIN cat_profesiones cp ON m.id_profesion = cp.id_profesion
    LEFT JOIN cat_estado_miembro cem ON m.id_estado = cem.id_estado
    LEFT JOIN cat_motivo_retiro cmr ON m.id_motivo_retiro = cmr.id_motivo
    LEFT JOIN cat_tipo_recepcion ctr ON m.id_recepcion = ctr.id_recepcion
    ORDER BY m.id_miembro ASC;
  `;
  const resultado = await pool.query(query);
  return resultado.rows;
};

// Insertar un nuevo miembro
const insertMiembro = async (datos) => {
  const { 
    nombres, apellidos, dpi, telefono, correo, 
    id_genero, id_profesion, id_estado, fecha_nacimiento,
    fecha_bautismo, id_familia, id_recepcion, fecha_recepcion,
    id_motivo_retiro, fecha_retiro 
  } = datos;

  const query = `
    INSERT INTO miembros (
      nombres, apellidos, dpi, telefono, correo, 
      id_genero, id_profesion, id_estado, fecha_nacimiento,
      fecha_bautismo, id_familia, id_recepcion, fecha_recepcion,
      id_motivo_retiro, fecha_retiro
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
    RETURNING *;
  `;
  const valores = [
    nombres, apellidos, dpi, telefono, correo, 
    id_genero, id_profesion, id_estado, fecha_nacimiento,
    fecha_bautismo, id_familia, id_recepcion, fecha_recepcion,
    id_motivo_retiro, fecha_retiro
  ];

  const resultado = await pool.query(query, valores);
  return resultado.rows[0];
};

// Actualizar un miembro existente por ID
const updateMiembro = async (id, datos) => {
  const { 
    nombres, apellidos, dpi, telefono, correo, 
    id_genero, id_profesion, id_estado, fecha_nacimiento,
    fecha_bautismo, id_familia, id_recepcion, fecha_recepcion,
    id_motivo_retiro, fecha_retiro 
  } = datos;

  const query = `
    UPDATE miembros 
    SET nombres = $1, apellidos = $2, dpi = $3, telefono = $4, correo = $5, 
        id_genero = $6, id_profesion = $7, id_estado = $8, fecha_nacimiento = $9,
        fecha_bautismo = $10, id_familia = $11, id_recepcion = $12, fecha_recepcion = $13,
        id_motivo_retiro = $14, fecha_retiro = $15
    WHERE id_miembro = $16 
    RETURNING *;
  `;
  const valores = [
    nombres, apellidos, dpi, telefono, correo, 
    id_genero, id_profesion, id_estado, fecha_nacimiento,
    fecha_bautismo, id_familia, id_recepcion, fecha_recepcion,
    id_motivo_retiro, fecha_retiro, id
  ];

  const resultado = await pool.query(query, valores);
  return resultado.rows[0] || null;
};

// Eliminar un miembro por ID
const deleteMiembro = async (id) => {
  const query = 'DELETE FROM miembros WHERE id_miembro = $1 RETURNING *;';
  const resultado = await pool.query(query, [id]);
  return resultado.rows[0] || null;
};

// Obtener ministerios activos asociados a un miembro
const getMinisteriosActivosByMiembroId = async (id) => {
  const query = `
    SELECT 
      cm.nombre AS nombre_ministerio, 
      mmh.cargo
    FROM miembros_ministerios_historial mmh
    INNER JOIN cat_ministerios cm ON mmh.id_ministerio = cm.id_ministerio
    WHERE mmh.id_miembro = $1 AND mmh.estado_activo = TRUE
    ORDER BY mmh.fecha_inicio DESC;
  `;
  const resultado = await pool.query(query, [id]);
  return resultado.rows;
};

module.exports = {
  getAllMiembros,
  insertMiembro,
  updateMiembro,
  deleteMiembro,
  getMinisteriosActivosByMiembroId
};