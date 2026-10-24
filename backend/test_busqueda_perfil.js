require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
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
    console.log('--- INICIANDO TEST DE BÚSQUEDA Y PERFIL (5.1.3) ---');
    try {
        // 1. Obtener un usuario de prueba
        const userRes = await pool.query("SELECT id_usuario, correo, rol FROM usuarios WHERE rol = 'PACIENTE' LIMIT 1;");
        if (userRes.rows.length === 0) {
            throw new Error('No se encontró ningún usuario paciente para la prueba');
        }
        const user = userRes.rows[0];

        // 2. Generar token
        const token = jwt.sign(
            { id: user.id_usuario, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 3. Probar GET /api/usuarios/perfil
        const getPerfilRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/usuarios/perfil',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Paso 1: GET /api/usuarios/perfil -> Status ${getPerfilRes.status}`);
        if (getPerfilRes.status !== 200 || !getPerfilRes.data.ok) {
            throw new Error(`Fallo en GET perfil: ${JSON.stringify(getPerfilRes.data)}`);
        }
        const perfilActual = getPerfilRes.data.data;
        console.log(`   Resultado: Perfil obtenido para ${perfilActual.nombres} ${perfilActual.apellidos} (Tel: ${perfilActual.telefono || 'Sin teléfono'})`);

        // 4. Probar PUT /api/usuarios/perfil
        const nuevoTelefono = '555-987-6543';
        const putPerfilRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/usuarios/perfil',
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, { telefono: nuevoTelefono });

        console.log(`Paso 2: PUT /api/usuarios/perfil -> Status ${putPerfilRes.status}`);
        if (putPerfilRes.status !== 200 || !putPerfilRes.data.ok) {
            throw new Error(`Fallo en PUT perfil: ${JSON.stringify(putPerfilRes.data)}`);
        }
        console.log(`   Resultado: Perfil actualizado. Nuevo teléfono en BD: ${putPerfilRes.data.data.telefono}`);

        // 5. Probar GET /api/buscar?q=Cardio o nombre
        const busquedaRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/buscar?q=a',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Paso 3: GET /api/buscar?q=a -> Status ${busquedaRes.status}`);
        if (busquedaRes.status !== 200 || !busquedaRes.data.ok) {
            throw new Error(`Fallo en GET búsqueda: ${JSON.stringify(busquedaRes.data)}`);
        }
        console.log(`   Resultado: Búsqueda ejecutada. Médicos encontrados: ${busquedaRes.data.data.medicos.length}, Citas encontradas: ${busquedaRes.data.data.citas.length}`);

        // 6. Restaurar teléfono original
        await pool.query('UPDATE pacientes SET telefono = $1 WHERE id_paciente = $2;', [perfilActual.telefono, user.id_usuario]);
        console.log('Limpieza: Teléfono original restaurado en la base de datos.');

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.1.3 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        await pool.end();
    }
}

runTests();
