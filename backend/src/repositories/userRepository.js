const pool = require('../config/db');

const findUserByEmail = async (correo) => {
    const result = await pool.query(
        'SELECT id_usuario, password_hash, rol FROM usuarios WHERE correo = $1 AND activo = true', 
        [correo]
    );
    return result.rows[0];
};

const createUserAndRole = async (userData) => {
    const { correo, passwordHash, rol, nombres, apellidos, telefono, especialidad } = userData;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Insertar en tabla usuarios
        const newUser = await client.query(
            'INSERT INTO usuarios (correo, password_hash, rol) VALUES ($1, $2, $3) RETURNING id_usuario',
            [correo, passwordHash, rol]
        );
        const userId = newUser.rows[0].id_usuario;

        // Insertar en tabla hija correspondiente
        if (rol === 'PACIENTE') {
            await client.query(
                'INSERT INTO pacientes (id_paciente, nombres, apellidos, telefono) VALUES ($1, $2, $3, $4)',
                [userId, nombres, apellidos, telefono]
            );
        } else if (rol === 'MEDICO') {
            await client.query(
                'INSERT INTO medicos (id_medico, nombres, apellidos, especialidad) VALUES ($1, $2, $3, $4)',
                [userId, nombres, apellidos, especialidad]
            );
        }

        await client.query('COMMIT');
        return userId;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { findUserByEmail, createUserAndRole };
