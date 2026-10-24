require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const pool = require('./src/config/db');

function httpRequest(options) {
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
        req.end();
    });
}

async function runTests() {
    console.log('--- INICIANDO TEST DE ESTADÍSTICAS DASHBOARD (5.1.5) ---');
    try {
        const pacienteRes = await pool.query("SELECT id_usuario FROM usuarios WHERE rol = 'PACIENTE' LIMIT 1;");
        const medicoRes = await pool.query("SELECT id_usuario FROM usuarios WHERE rol = 'MEDICO' LIMIT 1;");

        if (pacienteRes.rows.length === 0 || medicoRes.rows.length === 0) {
            throw new Error('Faltan usuarios de prueba en la base de datos');
        }

        const idPaciente = pacienteRes.rows[0].id_usuario;
        const idMedico = medicoRes.rows[0].id_usuario;

        const tokenPaciente = jwt.sign({ id: idPaciente, rol: 'PACIENTE' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const tokenMedico = jwt.sign({ id: idMedico, rol: 'MEDICO' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 1. Probar métricas para Paciente
        const statsPacienteRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/dashboard/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenPaciente}`
            }
        });

        console.log(`Paso 1: GET /api/dashboard/stats (Paciente) -> Status ${statsPacienteRes.status}`);
        if (statsPacienteRes.status !== 200 || !statsPacienteRes.data.ok) {
            throw new Error(`Fallo en estadísticas del paciente: ${JSON.stringify(statsPacienteRes.data)}`);
        }
        const dataP = statsPacienteRes.data.data;
        console.log(`   Resultado: Citas Activas: ${dataP.citas_activas}, Recetas Totales: ${dataP.recetas_totales}, Videollamadas Hoy: ${dataP.videollamadas_hoy}`);

        // 2. Probar métricas para Médico
        const statsMedicoRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/dashboard/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenMedico}`
            }
        });

        console.log(`Paso 2: GET /api/dashboard/stats (Médico) -> Status ${statsMedicoRes.status}`);
        if (statsMedicoRes.status !== 200 || !statsMedicoRes.data.ok) {
            throw new Error(`Fallo en estadísticas del médico: ${JSON.stringify(statsMedicoRes.data)}`);
        }
        const dataM = statsMedicoRes.data.data;
        console.log(`   Resultado: Citas Activas: ${dataM.citas_activas}, Recetas Totales: ${dataM.recetas_totales}, Videollamadas Hoy: ${dataM.videollamadas_hoy}`);

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.1.5 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        await pool.end();
    }
}

runTests();
