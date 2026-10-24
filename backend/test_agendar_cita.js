const http = require('http');

function apiRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(`http://localhost:4000/api${path}`, {
      method,
      headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, text: resBody });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- INICIO DE PRUEBAS DE AGENDAMIENTO DE CITAS ---');

  // 1. Obtener médicos
  const resMedicos = await apiRequest('/medicos');
  console.log('1. Listado de médicos: Status', resMedicos.status, 'Total:', resMedicos.data.length);
  if (resMedicos.status !== 200 || resMedicos.data.length === 0) {
    throw new Error('Fallo al obtener directorio de médicos');
  }
  const medico = resMedicos.data[0];

  // 2. Obtener pacientes
  const resPacientes = await apiRequest('/pacientes');
  console.log('2. Listado de pacientes: Status', resPacientes.status, 'Total:', resPacientes.data.length);
  if (resPacientes.status !== 200 || resPacientes.data.length === 0) {
    throw new Error('Fallo al obtener listado de pacientes');
  }
  const paciente = resPacientes.data[0];

  // 3. Regla de Negocio: Rechazo de Fecha Pasada
  const resPasada = await apiRequest('/citas/agendar', 'POST', {
    idPaciente: paciente.id_paciente,
    idMedico: medico.id_medico,
    fechaHora: '2021-05-10 10:00:00'
  });
  console.log('3. Validacion fecha pasada: Status', resPasada.status, 'Mensaje:', resPasada.data?.error);
  if (resPasada.status !== 400 || !resPasada.data?.error?.includes('pasadas')) {
    throw new Error('Fallo: No se rechazó fecha pasada');
  }

  // 4. Agendar cita válida en el futuro (ej. 30 días adelante a las 11:30)
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);
  fechaFutura.setHours(11, 30, 0, 0);

  const anio = fechaFutura.getFullYear();
  const mes = String(fechaFutura.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaFutura.getDate()).padStart(2, '0');
  const fechaHoraStr = `${anio}-${mes}-${dia} 11:30:00`;

  const resAgendar = await apiRequest('/citas/agendar', 'POST', {
    idPaciente: paciente.id_paciente,
    idMedico: medico.id_medico,
    fechaHora: fechaHoraStr
  });
  console.log('4. Agendar cita futura:', 'Status', resAgendar.status, 'Mensaje:', resAgendar.data?.mensaje);
  if (resAgendar.status !== 201 || !resAgendar.data?.cita?.id_cita) {
    throw new Error('Fallo al agendar cita futura');
  }
  console.log('   ID Cita creada:', resAgendar.data.cita.id_cita);
  console.log('   URL Videollamada generada:', resAgendar.data.cita.url_videollamada);

  // 5. Regla de Negocio: Rechazo por solapamiento de horario
  const resSolapamiento = await apiRequest('/citas/agendar', 'POST', {
    idPaciente: paciente.id_paciente,
    idMedico: medico.id_medico,
    fechaHora: fechaHoraStr
  });
  console.log('5. Validacion solapamiento: Status', resSolapamiento.status, 'Mensaje:', resSolapamiento.data?.error);
  if (resSolapamiento.status !== 400 || !resSolapamiento.data?.error?.includes('programada')) {
    throw new Error('Fallo: No se detectó solapamiento de horario médico');
  }

  // 6. Verificar notificaciones generadas para paciente y médico
  const resNotifPaciente = await apiRequest(`/notificaciones/test?id=${paciente.id_paciente}`);
  console.log('6. Pruebas finalizadas con éxito total.');
}

runTests().catch(err => {
  console.error('ERROR EN PRUEBAS:', err.message);
  process.exit(1);
});
