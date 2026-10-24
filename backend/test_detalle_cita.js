const API_URL = 'http://localhost:4000/api';

async function testDetalleCita() {
    console.log('--- INICIANDO TEST DEL ENDPOINT GET /api/citas/:id ---');

    try {
        // 1. Iniciar sesión como Medico Estuardo
        console.log('\n1. Autenticando Medico Estuardo (estuardo@email.com)...');
        const loginMedicoRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: 'estuardo@email.com', password: '123' })
        });
        const loginMedicoData = await loginMedicoRes.json();
        const tokenMedico = loginMedicoData.token;
        console.log(`Medico autenticado: ${loginMedicoData.usuario.nombre} (${loginMedicoData.usuario.rol})`);

        // 2. Iniciar sesión como Paciente Juan Pérez
        console.log('\n2. Autenticando Paciente Juan (paciente@test.com)...');
        const loginPacienteRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: 'paciente@test.com', password: '123' })
        });
        const loginPacienteData = await loginPacienteRes.json();
        const tokenPaciente = loginPacienteData.token;
        console.log(`Paciente autenticado: ${loginPacienteData.usuario.nombre} (${loginPacienteData.usuario.rol})`);

        // 3. Iniciar sesión como Tercero no involucrado (Josue)
        console.log('\n3. Autenticando Tercero (josue@email.com)...');
        const loginTerceroRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: 'josue@email.com', password: '123' })
        });
        const loginTerceroData = await loginTerceroRes.json();
        const tokenTercero = loginTerceroData.token;
        console.log(`Tercero autenticado: ${loginTerceroData.usuario.nombre} (${loginTerceroData.usuario.rol})`);

        // 4. Obtener citas del médico
        console.log('\n4. Obteniendo citas de la agenda...');
        const misCitasRes = await fetch(`${API_URL}/citas`, {
            headers: { Authorization: `Bearer ${tokenMedico}` }
        });
        const misCitasData = await misCitasRes.json();

        if (!misCitasData.data || misCitasData.data.length === 0) {
            console.log('No hay citas disponibles para probar.');
            return;
        }

        const citaTest = misCitasData.data[0];
        console.log(`Cita seleccionada para pruebas: ID=${citaTest.id_cita}, Fecha=${citaTest.fecha_hora}, Estado=${citaTest.estado}`);

        // 5. Test Medico consultando detalle (debe tener acceso siempre según RN-04)
        console.log('\n5. Probando consulta como Médico asignado...');
        const detalleMedicoRes = await fetch(`${API_URL}/citas/${citaTest.id_cita}`, {
            headers: { Authorization: `Bearer ${tokenMedico}` }
        });
        const detalleMedicoData = await detalleMedicoRes.json();
        console.log(`Status Medico: ${detalleMedicoRes.status}`);
        console.log('Datos de respuesta Medico:');
        console.log({
            id_cita: detalleMedicoData.data?.id_cita,
            paciente: `${detalleMedicoData.data?.paciente_nombres} ${detalleMedicoData.data?.paciente_apellidos}`,
            medico: `${detalleMedicoData.data?.medico_nombres} ${detalleMedicoData.data?.medico_apellidos}`,
            especialidad: detalleMedicoData.data?.especialidad,
            estado: detalleMedicoData.data?.estado,
            sala_habilitada: detalleMedicoData.data?.sala_habilitada,
            enlace_videollamada: detalleMedicoData.data?.enlace_videollamada,
            minutos_para_apertura: detalleMedicoData.data?.minutos_para_apertura
        });

        // 6. Test Paciente asignado consultando detalle
        console.log('\n6. Probando consulta como Paciente asignado...');
        const detallePacienteRes = await fetch(`${API_URL}/citas/${citaTest.id_cita}`, {
            headers: { Authorization: `Bearer ${tokenPaciente}` }
        });
        const detallePacienteData = await detallePacienteRes.json();
        console.log(`Status Paciente: ${detallePacienteRes.status}`);
        console.log({
            id_cita: detallePacienteData.data?.id_cita,
            sala_habilitada: detallePacienteData.data?.sala_habilitada,
            minutos_para_apertura: detallePacienteData.data?.minutos_para_apertura,
            error: detallePacienteData.error
        });

        // 7. Test Tercero no involucrado (debe dar 403 Forbidden)
        console.log('\n7. Probando consulta como Tercero no involucrado (esperado 403 Forbidden)...');
        const detalleTerceroRes = await fetch(`${API_URL}/citas/${citaTest.id_cita}`, {
            headers: { Authorization: `Bearer ${tokenTercero}` }
        });
        const detalleTerceroData = await detalleTerceroRes.json();
        console.log(`Status Tercero: ${detalleTerceroRes.status} (esperado 403)`);
        console.log('Mensaje:', detalleTerceroData.error);

        // 8. Test Cita inexistente (debe dar 404 Not Found)
        console.log('\n8. Probando ID de cita inexistente (esperado 404 Not Found)...');
        const detalle404Res = await fetch(`${API_URL}/citas/a0000000-0000-0000-0000-000000000000`, {
            headers: { Authorization: `Bearer ${tokenMedico}` }
        });
        const detalle404Data = await detalle404Res.json();
        console.log(`Status 404: ${detalle404Res.status} (esperado 404)`);
        console.log('Mensaje:', detalle404Data.error);

        console.log('\n--- PRUEBAS 5.4.9.A COMPLETADAS CON EXITO ---');
    } catch (error) {
        console.error('Fallo en testDetalleCita:', error);
    }
}

testDetalleCita();
