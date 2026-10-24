require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const pool = require('./src/config/db');
const notificacionRepository = require('./src/repositories/notificacionRepository');

// Función auxiliar para peticiones HTTP
function httpRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- INICIANDO TEST DE NOTIFICACIONES ---');
    let testUserId = null;
    let testNotifId = null;

    try {
        // 1. Obtener o crear un usuario para la prueba
        const userRes = await pool.query("SELECT id_usuario, rol FROM usuarios WHERE rol = 'PACIENTE' LIMIT 1;");
        if (userRes.rows.length === 0) {
            throw new Error('No se encontró ningún usuario paciente para ejecutar la prueba.');
        }
        const user = userRes.rows[0];
        testUserId = user.id_usuario;

        // 2. Generar Token JWT de prueba
        const token = jwt.sign(
            { id: testUserId, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 3. Crear una notificación de prueba directamente en BD
        const notif = await notificacionRepository.crear(
            testUserId,
            'Prueba de Cita Confirmada',
            'Su consulta virtual está programada para mañana a las 10:00 AM.',
            'CITA'
        );
        testNotifId = notif.id_notificacion;
        console.log(`Paso 1: Notificación de prueba creada con ID: ${testNotifId} (leido: ${notif.leido})`);

        // 4. Probar GET /api/notificaciones
        const getRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/notificaciones',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Paso 2: GET /api/notificaciones -> Status ${getRes.status}`);
        if (getRes.status !== 200 || !getRes.data.ok) {
            throw new Error(`Fallo en GET: ${JSON.stringify(getRes.data)}`);
        }
        const encontrada = getRes.data.data.find(n => n.id_notificacion === testNotifId);
        if (!encontrada) {
            throw new Error('La notificación recién creada no fue devuelta por la API.');
        }
        console.log(`   Resultado: Notificación recuperada con éxito. Estado leido: ${encontrada.leido}`);

        // 5. Probar PATCH /api/notificaciones/:id/leida
        const patchRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: `/api/notificaciones/${testNotifId}/leida`,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Paso 3: PATCH /api/notificaciones/${testNotifId}/leida -> Status ${patchRes.status}`);
        if (patchRes.status !== 200 || !patchRes.data.ok || patchRes.data.data.leido !== true) {
            throw new Error(`Fallo en PATCH: ${JSON.stringify(patchRes.data)}`);
        }
        console.log(`   Resultado: Notificación marcada como leída exitosamente. Estado leido: ${patchRes.data.data.leido}`);

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.1.2 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        // Limpieza de datos de prueba
        if (testNotifId) {
            await pool.query('DELETE FROM notificaciones WHERE id_notificacion = $1;', [testNotifId]);
            console.log('Limpieza: Notificación de prueba eliminada de la base de datos.');
        }
        await pool.end();
    }
}

runTests();
