// Controlador del lector RFID (ESP32 + RC522)
// Soporta recepcion hibrida: por Wi-Fi (HTTP directo del ESP32) y por Cable USB (Web Serial API desde el navegador)
const jwt = require('jsonwebtoken');
const rfidRepository = require('../repositories/rfidRepository');
const userRepository = require('../repositories/userRepository');

// clave que debe mandar el ESP32 para que nadie mas pueda mandar tarjetas falsas
const CLAVE_ESP32 = process.env.RFID_CLAVE || 'clave_esp32_123';

// Variables en memoria
let ultimaLectura = null;    // { uid, hora } -> ultima tarjeta que paso por el lector para login
let modoRegistro = null;     // { id_usuario, hora } -> alguien esta registrando su tarjeta
let ultimaProcesada = null;  // { uid, hora, respuesta } -> evita duplicados si Wi-Fi y USB reportan al mismo tiempo

const esReciente = (hora, segundos) => (Date.now() - hora) < segundos * 1000;

const nombreCompleto = (u) => `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.correo;

// Procesamiento centralizado de una lectura de tarjeta (sea por Wi-Fi o por Cable USB)
const procesarUidTarjeta = async (uid) => {
    // Si la misma tarjeta ya fue procesada hace menos de 2.5 segundos (ej. llego por Wi-Fi y por USB a la vez),
    // devolvemos la misma respuesta sin duplicar registros en la bitacora
    if (ultimaProcesada && ultimaProcesada.uid === uid && esReciente(ultimaProcesada.hora, 2.5)) {
        return ultimaProcesada.respuesta;
    }

    console.log(`[RFID] Tarjeta leida: ${uid}`);

    // 1. Si alguien esta registrando su tarjeta, esta lectura es para el
    if (modoRegistro && esReciente(modoRegistro.hora, 20)) {
        const idUsuario = modoRegistro.id_usuario;
        modoRegistro = null;

        const duenio = await rfidRepository.tarjetaEnUso(uid);
        if (duenio && duenio.id_usuario !== idUsuario) {
            const resp = { ok: false, modo: 'registro', mensaje: 'Esa tarjeta ya pertenece a otro usuario' };
            ultimaProcesada = { uid, hora: Date.now(), respuesta: resp };
            return resp;
        }

        await rfidRepository.asignarTarjeta(uid, idUsuario);
        await rfidRepository.registrarAcceso(uid, idUsuario, 'REGISTRO');
        console.log(`[RFID] Tarjeta ${uid} registrada`);
        const resp = { ok: true, modo: 'registro', uid, mensaje: 'Tarjeta registrada' };
        ultimaProcesada = { uid, hora: Date.now(), respuesta: resp };
        return resp;
    }

    // 2. Si no, es un intento de inicio de sesion
    ultimaLectura = { uid, hora: Date.now() };

    const usuario = await rfidRepository.buscarUsuarioPorTarjeta(uid);
    if (!usuario) {
        await rfidRepository.registrarAcceso(uid, null, 'DENEGADO');
        console.log(`[RFID] Acceso DENEGADO (${uid})`);
        const resp = { ok: false, modo: 'login', uid, mensaje: 'Tarjeta no registrada' };
        ultimaProcesada = { uid, hora: Date.now(), respuesta: resp };
        return resp;
    }

    await rfidRepository.registrarAcceso(uid, usuario.id_usuario, 'PERMITIDO');
    const nombre = nombreCompleto(usuario);
    console.log(`[RFID] Acceso PERMITIDO: ${nombre} (${usuario.rol})`);

    const resp = { ok: true, modo: 'login', uid, mensaje: `Bienvenido, ${nombre}`, nombre, rol: usuario.rol };
    ultimaProcesada = { uid, hora: Date.now(), respuesta: resp };
    return resp;
};

// ======================================================
// POST /api/rfid/lectura  -> lo llama el ESP32 por Wi-Fi
// ======================================================
const recibirLectura = async (req, res) => {
    try {
        if (req.headers['x-clave-esp32'] !== CLAVE_ESP32) {
            return res.status(401).json({ ok: false, mensaje: 'Clave del lector incorrecta' });
        }

        let uid = String(req.body.uid || '').toUpperCase().trim();
        if (!/^[0-9A-F]{8,20}$/.test(uid)) {
            return res.status(400).json({ ok: false, mensaje: 'UID invalido' });
        }

        const resultado = await procesarUidTarjeta(uid);
        res.json(resultado);
    } catch (error) {
        console.error('Error en lectura RFID (Wi-Fi):', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

// ======================================================
// POST /api/rfid/lectura-usb -> lo llama el navegador cuando lee el ESP32 por Cable USB (Web Serial)
// ======================================================
const recibirLecturaUsb = async (req, res) => {
    try {
        let uid = String(req.body.uid || '').toUpperCase().trim();
        if (!/^[0-9A-F]{8,20}$/.test(uid)) {
            return res.status(400).json({ ok: false, mensaje: 'UID invalido' });
        }

        const resultado = await procesarUidTarjeta(uid);
        res.json(resultado);
    } catch (error) {
        console.error('Error en lectura RFID (USB):', error.message);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

// ======================================================
// GET /api/rfid/estado  -> la pagina de Login pregunta cada segundo
// ======================================================
const estadoLogin = async (req, res) => {
    try {
        if (!ultimaLectura || !esReciente(ultimaLectura.hora, 5)) {
            return res.json({ estado: 'esperando' });
        }

        const uid = ultimaLectura.uid;
        ultimaLectura = null; // se usa una sola vez

        const usuario = await rfidRepository.buscarUsuarioPorTarjeta(uid);
        if (!usuario) {
            return res.json({ estado: 'invalida', uid });
        }

        // mismo token que genera el login normal (authService)
        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol },
            process.env.JWT_SECRET || 'super_secreto_para_jwt_123!',
            { expiresIn: '8h' }
        );
        const perfil = await userRepository.findUserProfileById(usuario.id_usuario);

        res.json({ estado: 'ok', mensaje: 'Login exitoso', token, rol: usuario.rol, usuario: perfil });
    } catch (error) {
        console.error('Error en estado RFID:', error.message);
        res.status(500).json({ estado: 'error', error: 'Error interno del servidor' });
    }
};

// ======================================================
// Rutas con sesion iniciada (token)
// ======================================================

// GET /api/rfid/mi-tarjeta
const miTarjeta = async (req, res) => {
    try {
        const tarjeta = await rfidRepository.buscarTarjetaDeUsuario(req.usuario.id);
        const registrando = !!(modoRegistro && modoRegistro.id_usuario === req.usuario.id && esReciente(modoRegistro.hora, 20));
        res.json({ ok: true, tarjeta, registrando });
    } catch (error) {
        console.error('Error en mi-tarjeta:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/rfid/registrar -> los siguientes 20 segundos la tarjeta que pase sera de este usuario
const iniciarRegistro = (req, res) => {
    modoRegistro = { id_usuario: req.usuario.id, hora: Date.now() };
    res.json({ ok: true, mensaje: 'Pase su tarjeta por el lector (tiene 20 segundos)' });
};

// DELETE /api/rfid/mi-tarjeta -> reportar tarjeta perdida
const reportarPerdida = async (req, res) => {
    try {
        const borrada = await rfidRepository.quitarTarjeta(req.usuario.id);
        if (!borrada) {
            return res.status(400).json({ error: 'No tiene ninguna tarjeta registrada' });
        }
        res.json({ ok: true, mensaje: 'Tarjeta desactivada, ya no podrá usarse para ingresar' });
    } catch (error) {
        console.error('Error al quitar tarjeta:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// GET /api/rfid/accesos -> quien ha entrado con tarjeta
// el paciente solo ve los suyos, medico/admin ve todos
const listarAccesos = async (req, res) => {
    try {
        const soloMios = req.usuario.rol === 'PACIENTE' ? req.usuario.id : null;
        const accesos = await rfidRepository.ultimosAccesos(10, soloMios);
        res.json({ ok: true, data: accesos });
    } catch (error) {
        console.error('Error al listar accesos:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    recibirLectura,
    recibirLecturaUsb,
    estadoLogin,
    miTarjeta,
    iniciarRegistro,
    reportarPerdida,
    listarAccesos
};
