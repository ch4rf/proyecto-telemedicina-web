const pool = require('../config/db');

// Obtener usuario por nombre de usuario con su rol asociado
const findUserByUsername = async (nombreUsuario) => {
  const query = `
    SELECT u.*, r.nombre_rol 
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.nombre_usuario = $1
  `;
  const result = await pool.query(query, [nombreUsuario]);
  return result.rows[0] || null;
};

module.exports = {
  findUserByUsername
};