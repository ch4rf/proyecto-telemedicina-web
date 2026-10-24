require('dotenv').config();
const http = require('http');
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

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
    console.log('--- INICIANDO TEST DE RECUPERACIÓN DE CONTRASEÑA (5.3.4) ---');
    try {
        const correo = 'paciente@test.com';

        // 1. Probar POST /api/auth/forgot-password
        const forgotRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/forgot-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { correo });

        console.log(`Paso 1: POST /api/auth/forgot-password -> Status ${forgotRes.status}`);
        if (forgotRes.status !== 200 || !forgotRes.data.ok) {
            throw new Error(`Fallo en forgot-password: ${JSON.stringify(forgotRes.data)}`);
        }
        const codigo = forgotRes.data.codigo_simulado;
        console.log(`   Resultado: Código de verificación generado: ${codigo}`);

        // 2. Probar POST /api/auth/reset-password con clave temporal 'clave_nueva_2026'
        const resetRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/reset-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo,
            codigo,
            nuevoPassword: 'clave_nueva_2026'
        });

        console.log(`Paso 2: POST /api/auth/reset-password -> Status ${resetRes.status}`);
        if (resetRes.status !== 200 || !resetRes.data.ok) {
            throw new Error(`Fallo en reset-password: ${JSON.stringify(resetRes.data)}`);
        }
        console.log(`   Resultado: ${resetRes.data.mensaje}`);

        // 3. Probar Login con la nueva clave
        const loginNuevoRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo,
            password: 'clave_nueva_2026'
        });

        console.log(`Paso 3: Login con nueva contraseña -> Status ${loginNuevoRes.status}`);
        if (loginNuevoRes.status !== 200 || !loginNuevoRes.data.token) {
            throw new Error('No se pudo iniciar sesión con la nueva contraseña');
        }
        console.log('   Resultado: Login con nueva clave exitoso.');

        // 4. Restaurar la contraseña original '123'
        const salt = await bcrypt.genSalt(10);
        const originalHash = await bcrypt.hash('123', salt);
        await pool.query('UPDATE usuarios SET password_hash = $1 WHERE correo = $2;', [originalHash, correo]);
        console.log('Limpieza: Contraseña original "123" restaurada en la base de datos.');

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.3.4 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        await pool.end();
    }
}

runTests();
