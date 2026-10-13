const http = require('http');

const API_URL = 'http://localhost:4000/api';

const fetchAPI = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: `/api${path}`,
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const runTests = async () => {
    console.log('--- INICIANDO PRUEBAS AUTOMATIZADAS ---\n');

    try {
        // 1. Registro Paciente
        console.log('1. Registrando Paciente...');
        const resPaciente = await fetchAPI('/auth/register', 'POST', {
            correo: 'paciente@test.com', password: '123', rol: 'PACIENTE', nombres: 'Juan', apellidos: 'Pérez', telefono: '555-000'
        });
        console.log(resPaciente.data);

        // 2. Registro Médico
        console.log('\n2. Registrando Médico...');
        const resMedico = await fetchAPI('/auth/register', 'POST', {
            correo: 'medico@test.com', password: '123', rol: 'MEDICO', nombres: 'Dra. María', apellidos: 'Gómez', especialidad: 'Cardiología'
        });
        console.log(resMedico.data);

        // 3. Obtener Médicos
        console.log('\n3. Consultando Lista de Médicos...');
        const resMedicosList = await fetchAPI('/medicos', 'GET');
        console.log(`Médicos encontrados: ${resMedicosList.data.length}`);
        
        // Obtener IDs asumiendo que los usuarios fueron creados exitosamente
        // Necesitamos extraer los IDs haciendo login primero para obtener el token o a través del endpoint de paciente/médico si estuviera disponible.
        // Dado que nuestra API actual no devuelve los IDs en el listado de médicos directamente sin autenticación,
        // tomaremos el ID del resultado de la lista de médicos.
        const idMedico = resMedicosList.data[0].id_medico;

        // Necesitamos el ID del paciente, vamos a hacer login rápido para simular, pero el JWT no lo implementamos bloqueante aún en las rutas.
        // Simularemos creando una cita usando una query manual a la BD para extraer el ID del paciente.
        const { Pool } = require('pg');
        require('dotenv').config();
        const pool = new Pool({
            user: process.env.DB_USER, host: process.env.DB_HOST, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: process.env.DB_PORT
        });
        const patRes = await pool.query('SELECT id_paciente FROM pacientes LIMIT 1');
        const idPaciente = patRes.rows[0].id_paciente;

        // 4. Agendar Cita (Mañana)
        console.log('\n4. Agendando Cita (Mañana)...');
        let manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const resCita = await fetchAPI('/citas/agendar', 'POST', {
            idPaciente, idMedico, fechaHora: manana.toISOString()
        });
        console.log(resCita.data);
        const idCita = resCita.data.cita.id_cita;

        // 5. Intentar entrar a videollamada (Faltan más de 10 min)
        console.log('\n5. Intentando acceder a Videollamada (RN-04) - Debería ser Denegado...');
        const resVideoFallida = await fetchAPI(`/citas/${idCita}/videollamada`, 'GET');
        console.log(resVideoFallida.data);

        // 6. Agendar Cita (En 5 minutos)
        console.log('\n6. Agendando Cita (En 5 minutos)...');
        let en5Min = new Date();
        en5Min.setMinutes(en5Min.getMinutes() + 5);
        const resCitaAceptada = await fetchAPI('/citas/agendar', 'POST', {
            idPaciente, idMedico, fechaHora: en5Min.toISOString()
        });
        console.log(resCitaAceptada.data);
        const idCitaActiva = resCitaAceptada.data.cita.id_cita;

        // 7. Intentar entrar a videollamada de nuevo
        console.log('\n7. Intentando acceder a Videollamada (RN-04) - Debería ser Concedido...');
        const resVideoOk = await fetchAPI(`/citas/${idCitaActiva}/videollamada`, 'GET');
        console.log(resVideoOk.data);

        pool.end();
        console.log('\n--- PRUEBAS FINALIZADAS EXITOSAMENTE ---');
    } catch (e) {
        console.error('Error en pruebas:', e);
    }
};

runTests();
