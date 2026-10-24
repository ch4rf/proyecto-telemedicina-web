require('dotenv').config();
const http = require('http');
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
    console.log('--- INICIANDO TEST DE REGISTRO DE USUARIOS (5.3.5) ---');
    const correoPaciente = 'nuevo.paciente@test.com';
    const correoMedico = 'nuevo.medico@test.com';

    try {
        // 1. Registro de Paciente
        const regPacRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo: correoPaciente,
            password: 'clave_segura_123',
            rol: 'PACIENTE',
            nombres: 'Carlos',
            apellidos: 'Mendoza',
            telefono: '555-8833'
        });

        console.log(`Paso 1: Registro Paciente -> Status ${regPacRes.status}`);
        if (regPacRes.status !== 201 || regPacRes.data.rol !== 'PACIENTE') {
            throw new Error(`Fallo en registro paciente: ${JSON.stringify(regPacRes.data)}`);
        }
        console.log('   Resultado: Paciente registrado correctamente.');

        // 2. Registro de Médico
        const regMedRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo: correoMedico,
            password: 'clave_medico_456',
            rol: 'MEDICO',
            nombres: 'Dr. Roberto',
            apellidos: 'Sánchez',
            telefono: '555-9922',
            especialidad: 'Pediatría'
        });

        console.log(`Paso 2: Registro Médico -> Status ${regMedRes.status}`);
        if (regMedRes.status !== 201 || regMedRes.data.rol !== 'MEDICO') {
            throw new Error(`Fallo en registro médico: ${JSON.stringify(regMedRes.data)}`);
        }
        console.log('   Resultado: Médico registrado con especialidad Pediatría.');

        // 3. Comprobar Login del nuevo paciente
        const loginPacRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo: correoPaciente,
            password: 'clave_segura_123'
        });
        console.log(`Paso 3: Login Paciente -> Status ${loginPacRes.status} (Nombre devuelto: ${loginPacRes.data.usuario?.nombres})`);
        if (loginPacRes.status !== 200) throw new Error('Fallo en login de nuevo paciente');

        // 4. Comprobar Login del nuevo médico
        const loginMedRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            correo: correoMedico,
            password: 'clave_medico_456'
        });
        console.log(`Paso 4: Login Médico -> Status ${loginMedRes.status} (Especialidad: ${loginMedRes.data.usuario?.especialidad})`);
        if (loginMedRes.status !== 200) throw new Error('Fallo en login de nuevo médico');

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.3.5 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        // Limpieza de cuentas creadas
        await pool.query('DELETE FROM usuarios WHERE correo IN ($1, $2);', [correoPaciente, correoMedico]);
        console.log('Limpieza: Cuentas de prueba eliminadas de PostgreSQL.');
        await pool.end();
    }
}

runTests();
