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

const findUserProfileById = async (id_usuario) => {
    const userRes = await pool.query(
        'SELECT id_usuario, correo, rol, activo, fecha_registro FROM usuarios WHERE id_usuario = $1',
        [id_usuario]
    );
    if (userRes.rows.length === 0) return null;

    const user = userRes.rows[0];

    if (user.rol === 'PACIENTE') {
        const pacienteRes = await pool.query(
            'SELECT nombres, apellidos, telefono, datos_clinicos FROM pacientes WHERE id_paciente = $1',
            [id_usuario]
        );
        return { ...user, ...(pacienteRes.rows[0] || {}) };
    } else if (user.rol === 'MEDICO') {
        const medicoRes = await pool.query(
            'SELECT nombres, apellidos, especialidad, disponibilidad FROM medicos WHERE id_medico = $1',
            [id_usuario]
        );
        return { ...user, ...(medicoRes.rows[0] || {}) };
    }

    return user;
};

const updateUserProfile = async (id_usuario, datos) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const userRes = await client.query('SELECT rol FROM usuarios WHERE id_usuario = $1', [id_usuario]);
        if (userRes.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        const rol = userRes.rows[0].rol;

        if (rol === 'PACIENTE') {
            await client.query(
                `UPDATE pacientes 
                 SET nombres = COALESCE($1, nombres),
                     apellidos = COALESCE($2, apellidos),
                     telefono = COALESCE($3, telefono),
                     datos_clinicos = COALESCE($4, datos_clinicos),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_paciente = $5`,
                [datos.nombres, datos.apellidos, datos.telefono, datos.datos_clinicos ? JSON.stringify(datos.datos_clinicos) : null, id_usuario]
            );
        } else if (rol === 'MEDICO') {
            await client.query(
                `UPDATE medicos 
                 SET nombres = COALESCE($1, nombres),
                     apellidos = COALESCE($2, apellidos),
                     especialidad = COALESCE($3, especialidad),
                     disponibilidad = COALESCE($4, disponibilidad),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_medico = $5`,
                [datos.nombres, datos.apellidos, datos.especialidad, datos.disponibilidad ? JSON.stringify(datos.disponibilidad) : null, id_usuario]
            );
        }

        await client.query('UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id_usuario = $1', [id_usuario]);
        await client.query('COMMIT');

        return await findUserProfileById(id_usuario);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const guardarTokenRecuperacion = async (correo, token) => {
    const result = await pool.query(
        `UPDATE usuarios 
         SET token_recuperacion = $1, expiracion_token = (CURRENT_TIMESTAMP + INTERVAL '15 minutes'), updated_at = CURRENT_TIMESTAMP
         WHERE correo = $2 AND activo = TRUE
         RETURNING id_usuario, correo;`,
        [token, correo]
    );
    return result.rows[0] || null;
};

const actualizarPasswordPorToken = async (correo, token, passwordHash) => {
    const result = await pool.query(
        `UPDATE usuarios 
         SET password_hash = $1, token_recuperacion = NULL, expiracion_token = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE correo = $2 AND token_recuperacion = $3 AND expiracion_token > NOW() AND activo = TRUE
         RETURNING id_usuario, correo;`,
        [passwordHash, correo, token]
    );
    return result.rows[0] || null;
};

module.exports = {
    findUserByEmail,
    createUserAndRole,
    findUserProfileById,
    updateUserProfile,
    guardarTokenRecuperacion,
    actualizarPasswordPorToken
};
