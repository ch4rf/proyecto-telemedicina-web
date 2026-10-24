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
    console.log('--- INICIANDO TEST DE CONSULTAS Y RECETAS (5.1.4) ---');
    let testCitaId = null;

    try {
        // 1. Obtener un médico y un paciente de la base de datos
        const medicoRes = await pool.query("SELECT id_usuario FROM usuarios WHERE rol = 'MEDICO' LIMIT 1;");
        const pacienteRes = await pool.query("SELECT id_usuario FROM usuarios WHERE rol = 'PACIENTE' LIMIT 1;");

        if (medicoRes.rows.length === 0 || pacienteRes.rows.length === 0) {
            throw new Error('Se requiere al menos un médico y un paciente en la base de datos.');
        }

        const idMedico = medicoRes.rows[0].id_usuario;
        const idPaciente = pacienteRes.rows[0].id_usuario;

        // 2. Crear una cita de prueba en estado PROGRAMADA
        const citaRes = await pool.query(`
            INSERT INTO citas (id_paciente, id_medico, fecha_hora, estado, url_videollamada)
            VALUES ($1, $2, NOW() + INTERVAL '1 hour', 'PROGRAMADA', 'test-sala-123')
            RETURNING id_cita;
        `, [idPaciente, idMedico]);

        testCitaId = citaRes.rows[0].id_cita;
        console.log(`Paso 1: Cita de prueba creada: ${testCitaId} (PROGRAMADA)`);

        // 3. Tokens JWT para Médico y Paciente
        const tokenMedico = jwt.sign({ id: idMedico, rol: 'MEDICO' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const tokenPaciente = jwt.sign({ id: idPaciente, rol: 'PACIENTE' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 4. Probar POST /api/consultas (Emitir diagnóstico y receta)
        const payloadConsulta = {
            id_cita: testCitaId,
            diagnostico: 'Faringoamigdalitis aguda con hipertrofia amigdalina leve',
            notas_clinicas: 'Paciente refiere 3 días con dolor odinofágico y febrícula.',
            duracion_minutos: 18,
            medicamentos: [
                { nombre: 'Amoxicilina 500mg', dosis: '1 cápsula', frecuencia: 'Cada 8 horas', duracion: '7 días' },
                { nombre: 'Ibuprofeno 400mg', dosis: '1 tableta', frecuencia: 'Cada 8 horas con comida', duracion: '3 días' }
            ],
            indicaciones_generales: 'Reposo relativo e hidratación abundante con líquidos tibios.'
        };

        const postRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/consultas',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenMedico}`
            }
        }, payloadConsulta);

        console.log(`Paso 2: POST /api/consultas -> Status ${postRes.status}`);
        if (postRes.status !== 201 || !postRes.data.ok) {
            throw new Error(`Fallo al emitir consulta: ${JSON.stringify(postRes.data)}`);
        }
        console.log(`   Resultado: Consulta registrada ID ${postRes.data.data.consulta.id_consulta}. Receta ID: ${postRes.data.data.receta.id_receta}`);

        // 5. Verificar que la cita cambió a COMPLETADA
        const checkCita = await pool.query('SELECT estado FROM citas WHERE id_cita = $1;', [testCitaId]);
        console.log(`Paso 3: Verificación de estado de cita en BD: ${checkCita.rows[0].estado} (Esperado: COMPLETADA)`);
        if (checkCita.rows[0].estado !== 'COMPLETADA') {
            throw new Error('La cita no cambió a COMPLETADA');
        }

        // 6. Probar GET /api/consultas/cita/:id_cita
        const getCitaRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: `/api/consultas/cita/${testCitaId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenPaciente}`
            }
        });
        console.log(`Paso 4: GET /api/consultas/cita/${testCitaId} -> Status ${getCitaRes.status}`);
        if (getCitaRes.status !== 200 || !getCitaRes.data.ok) {
            throw new Error(`Fallo al consultar expediente por cita: ${JSON.stringify(getCitaRes.data)}`);
        }
        console.log(`   Resultado: Diagnóstico devuelto: "${getCitaRes.data.data.diagnostico}"`);

        // 7. Probar GET /api/consultas/recetas (Listado de recetas para el paciente)
        const getRecetasRes = await httpRequest({
            hostname: 'localhost',
            port: process.env.PORT || 4000,
            path: '/api/consultas/recetas',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenPaciente}`
            }
        });
        console.log(`Paso 5: GET /api/consultas/recetas (Paciente) -> Status ${getRecetasRes.status}`);
        if (getRecetasRes.status !== 200 || !getRecetasRes.data.ok) {
            throw new Error(`Fallo al listar recetas: ${JSON.stringify(getRecetasRes.data)}`);
        }
        console.log(`   Resultado: Total de recetas del paciente: ${getRecetasRes.data.total}`);

        console.log('--- TEST COMPLETADO CON ÉXITO: 5.1.4 FUNCIONANDO AL 100% ---');
    } catch (err) {
        console.error('ERROR EN EL TEST:', err.message);
    } finally {
        if (testCitaId) {
            await pool.query('DELETE FROM consultas WHERE id_cita = $1;', [testCitaId]);
            await pool.query('DELETE FROM citas WHERE id_cita = $1;', [testCitaId]);
            console.log('Limpieza: Cita de prueba y registros asociados eliminados con éxito.');
        }
        await pool.end();
    }
}

runTests();
