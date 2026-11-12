// Repositorio del lector RFID (ESP32 + RC522)
// Solo usa tablas NUEVAS (tarjetas_rfid y accesos_rfid), no modifica las existentes
const pool = require('../config/db');

let tablasListas = false;

// Crea las tablas la primera vez que se usan (igual que el catalogo de medicamentos)
const asegurarTablas = async () => {
    if (tablasListas) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS tarjetas_rfid (
            uid_tarjeta VARCHAR(20) PRIMARY KEY,
            id_usuario UUID NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS accesos_rfid (
            id_acceso SERIAL PRIMARY KEY,
            uid_tarjeta VARCHAR(20) NOT NULL,
            id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
            resultado VARCHAR(20) NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    tablasListas = true;
};

// Busca a que usuario (activo) le pertenece una tarjeta
const buscarUsuarioPorTarjeta = async (uid) => {
    await asegurarTablas();
    const result = await pool.query(
        `SELECT u.id_usuario, u.rol, u.correo,
                COALESCE(p.nombres, m.nombres, '') AS nombres,
                COALESCE(p.apellidos, m.apellidos, '') AS apellidos
         FROM tarjetas_rfid t
         JOIN usuarios u ON u.id_usuario = t.id_usuario
         LEFT JOIN pacientes p ON p.id_paciente = u.id_usuario
         LEFT JOIN medicos m ON m.id_medico = u.id_usuario
         WHERE t.uid_tarjeta = $1 AND u.activo = TRUE`,
        [uid]
    );
    return result.rows[0] || null;
};

// Tarjeta que tiene asignada un usuario
const buscarTarjetaDeUsuario = async (id_usuario) => {
    await asegurarTablas();
    const result = await pool.query(
        'SELECT uid_tarjeta, fecha_registro FROM tarjetas_rfid WHERE id_usuario = $1',
        [id_usuario]
    );
    return result.rows[0] || null;
};

// Ver si una tarjeta ya es de alguien
const tarjetaEnUso = async (uid) => {
    await asegurarTablas();
    const result = await pool.query('SELECT id_usuario FROM tarjetas_rfid WHERE uid_tarjeta = $1', [uid]);
    return result.rows[0] || null;
};

// Asigna una tarjeta a un usuario (si ya tenia otra, se reemplaza)
const asignarTarjeta = async (uid, id_usuario) => {
    await asegurarTablas();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM tarjetas_rfid WHERE id_usuario = $1', [id_usuario]);
        await client.query(
            'INSERT INTO tarjetas_rfid (uid_tarjeta, id_usuario) VALUES ($1, $2)',
            [uid, id_usuario]
        );
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Quitar la tarjeta (cuando se reporta como perdida)
const quitarTarjeta = async (id_usuario) => {
    await asegurarTablas();
    const result = await pool.query(
        'DELETE FROM tarjetas_rfid WHERE id_usuario = $1 RETURNING uid_tarjeta',
        [id_usuario]
    );
    return result.rows[0] || null;
};

// Guardar en la bitacora cada vez que pasan una tarjeta
const registrarAcceso = async (uid, id_usuario, resultado) => {
    await asegurarTablas();
    await pool.query(
        'INSERT INTO accesos_rfid (uid_tarjeta, id_usuario, resultado) VALUES ($1, $2, $3)',
        [uid, id_usuario, resultado]
    );
};

// Ultimos accesos con el nombre de quien entro
// si se manda id_usuario, solo trae los de ese usuario
const ultimosAccesos = async (limite, id_usuario) => {
    await asegurarTablas();
    let sql = `
        SELECT a.id_acceso, a.uid_tarjeta, a.resultado, a.fecha, u.rol,
               COALESCE(p.nombres, m.nombres, '') AS nombres,
               COALESCE(p.apellidos, m.apellidos, '') AS apellidos
        FROM accesos_rfid a
        LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
        LEFT JOIN pacientes p ON p.id_paciente = a.id_usuario
        LEFT JOIN medicos m ON m.id_medico = a.id_usuario`;
    const params = [];

    if (id_usuario) {
        sql += ' WHERE a.id_usuario = $1';
        params.push(id_usuario);
    }

    sql += ` ORDER BY a.fecha DESC LIMIT ${Number(limite) || 10}`;
    const result = await pool.query(sql, params);
    return result.rows;
};

module.exports = {
    asegurarTablas,
    buscarUsuarioPorTarjeta,
    buscarTarjetaDeUsuario,
    tarjetaEnUso,
    asignarTarjeta,
    quitarTarjeta,
    registrarAcceso,
    ultimosAccesos
};
