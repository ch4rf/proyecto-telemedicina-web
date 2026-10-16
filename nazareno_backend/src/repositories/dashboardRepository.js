const pool = require('../config/db');

const getKpis = async () => {
  // 1. Unimos miembros con cat_estado_miembro
  const queryActivos = `
    SELECT COUNT(*) AS total 
    FROM miembros m
    INNER JOIN cat_estado_miembro e ON m.id_estado = e.id_estado
    WHERE e.descripcion ILIKE '%activo%'`;
    
  const queryFamilias = `SELECT COUNT(*) AS total FROM familias`;
  
  // 2. Usamos tu tabla miembros_ministerios_historial
  const queryServidores = `
    SELECT COUNT(DISTINCT id_miembro) AS total 
    FROM miembros_ministerios_historial 
    WHERE estado_activo = true`;

  const [activos, familias, servidores] = await Promise.all([
    pool.query(queryActivos),
    pool.query(queryFamilias),
    pool.query(queryServidores)
  ]);

  return {
    miembrosActivos: parseInt(activos.rows[0].total || 0),
    familiasRegistradas: parseInt(familias.rows[0].total || 0),
    servidoresActivos: parseInt(servidores.rows[0].total || 0)
  };
};

const getDistribucionGenero = async () => {
  // 3. Unimos con cat_genero
  const query = `
    SELECT g.descripcion AS genero, COUNT(m.id_miembro) AS total
    FROM miembros m
    INNER JOIN cat_genero g ON m.id_genero = g.id_genero
    GROUP BY g.descripcion`;
  const resultado = await pool.query(query);
  return resultado.rows;
};

const getDistribucionEdades = async () => {
  const query = `
    SELECT 
      SUM(CASE WHEN date_part('year', age(fecha_nacimiento)) <= 12 THEN 1 ELSE 0 END) AS ninos,
      SUM(CASE WHEN date_part('year', age(fecha_nacimiento)) BETWEEN 13 AND 25 THEN 1 ELSE 0 END) AS jovenes,
      SUM(CASE WHEN date_part('year', age(fecha_nacimiento)) BETWEEN 26 AND 59 THEN 1 ELSE 0 END) AS adultos,
      SUM(CASE WHEN date_part('year', age(fecha_nacimiento)) >= 60 THEN 1 ELSE 0 END) AS adultos_mayores
    FROM miembros 
    WHERE fecha_nacimiento IS NOT NULL`;
  const resultado = await pool.query(query);
  return resultado.rows[0];
};

const getZonasFamilias = async () => {
  // 4. Unimos con cat_zonas_sectores
  const query = `
    SELECT COALESCE(z.nombre_zona, 'Sin Zona') AS zona, COUNT(*) AS total
    FROM familias f
    LEFT JOIN cat_zonas_sectores z ON f.id_zona = z.id_zona
    GROUP BY z.nombre_zona
    ORDER BY total DESC
    LIMIT 5`;
  const resultado = await pool.query(query);
  return resultado.rows;
};

const getTopMinisterios = async () => {
  // 5. Unimos cat_ministerios con miembros_ministerios_historial
  const query = `
    SELECT min.nombre, COUNT(h.id_historial) AS total_servidores
    FROM cat_ministerios min
    INNER JOIN miembros_ministerios_historial h ON min.id_ministerio = h.id_ministerio
    WHERE h.estado_activo = true
    GROUP BY min.nombre
    ORDER BY total_servidores DESC
    LIMIT 5`;
  const resultado = await pool.query(query);
  return resultado.rows;
};

const getAltasBajasAnio = async () => {
  const queryAltas = `
    SELECT EXTRACT(MONTH FROM fecha_recepcion) AS mes, COUNT(*) AS total
    FROM miembros 
    WHERE EXTRACT(YEAR FROM fecha_recepcion) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY mes ORDER BY mes`;
      
  const queryBajas = `
    SELECT EXTRACT(MONTH FROM fecha_retiro) AS mes, COUNT(*) AS total
    FROM miembros 
    WHERE EXTRACT(YEAR FROM fecha_retiro) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY mes ORDER BY mes`;

  const [altas, bajas] = await Promise.all([
    pool.query(queryAltas), 
    pool.query(queryBajas)
  ]);
  
  return { altas: altas.rows, bajas: bajas.rows };
};

const getCumpleanosMes = async () => {
  const query = `
    SELECT nombres, apellidos, EXTRACT(DAY FROM fecha_nacimiento) AS dia 
    FROM miembros 
    WHERE EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
    ORDER BY dia ASC`;
  const resultado = await pool.query(query);
  return resultado.rows;
};

const getProximasActividades = async () => {
  // 6. Buscamos el "título" usando la descripción del tipo de actividad, y la "fecha"
  const query = `
    SELECT t.descripcion AS titulo, a.fecha AS fecha_inicio 
    FROM actividades a
    INNER JOIN cat_tipo_actividad t ON a.id_tipo = t.id_tipo
    WHERE a.fecha >= CURRENT_DATE 
    ORDER BY a.fecha ASC 
    LIMIT 4`;
  const resultado = await pool.query(query);
  return resultado.rows;
};

module.exports = {
  getKpis,
  getDistribucionGenero,
  getDistribucionEdades,
  getZonasFamilias,
  getTopMinisterios,
  getAltasBajasAnio,
  getCumpleanosMes,
  getProximasActividades
};