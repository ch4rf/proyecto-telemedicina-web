/**
 * Utilidad para generar e imprimir/descargar en PDF una Receta Médica Oficial (Tarea 7.1.1 - RF-16)
 * Escapa cadenas de texto para prevenir cualquier inyección HTML/XSS en el documento generado.
 */
const escaparHTML = (texto) => {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generarRecetaPDF = (datos = {}, usuarioActual = null) => {
  const folioRaw = datos.id_receta || datos.id_cita || 'REC-0001';
  const folio = String(folioRaw).substring(0, 8).toUpperCase();

  const fechaRaw = datos.created_at || datos.fecha_hora || new Date().toISOString();
  const fechaFormateada = new Date(fechaRaw).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Datos del Médico
  const nombreMedico = datos.medico_nombres
    ? `${datos.medico_nombres} ${datos.medico_apellidos || ''}`.trim()
    : usuarioActual?.rol === 'MEDICO'
    ? `${usuarioActual.nombres || ''} ${usuarioActual.apellidos || ''}`.trim()
    : 'Médico Especialista';
  const especialidad = datos.especialidad || usuarioActual?.especialidad || 'Medicina General';

  // Datos del Paciente
  const nombrePaciente = datos.paciente_nombres
    ? `${datos.paciente_nombres} ${datos.paciente_apellidos || ''}`.trim()
    : usuarioActual?.rol === 'PACIENTE'
    ? `${usuarioActual.nombres || ''} ${usuarioActual.apellidos || ''}`.trim()
    : 'Paciente Registrado';

  const diagnostico = datos.diagnostico || 'Consulta médica general';
  const indicaciones = datos.indicaciones_generales || 'Seguir el tratamiento según las dosis y horarios indicados por su médico.';

  // Normalizar lista de medicamentos (JSONB o Array)
  let listaMeds = datos.medicamentos || [];
  if (typeof listaMeds === 'string') {
    try {
      listaMeds = JSON.parse(listaMeds);
    } catch {
      listaMeds = [];
    }
  }
  if (!Array.isArray(listaMeds)) {
    listaMeds = [];
  }

  const filasMedicamentosHTML = listaMeds.length > 0
    ? listaMeds.map((med, idx) => `
        <tr>
          <td class="num">${idx + 1}</td>
          <td class="med-name">${escaparHTML(med.nombre || 'Medicamento')}</td>
          <td>${escaparHTML(med.dosis || 'Según indicación')}</td>
          <td>${escaparHTML(med.frecuencia || 'Según indicación')}</td>
          <td>${escaparHTML(med.duracion || 'Según evolución')}</td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="5" style="text-align:center; color:#64748b; padding:16px;">
          Sin medicamentos específicos registrados en esta prescripción.
        </td>
      </tr>
    `;

  const htmlDocumento = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Receta Médica #${escaparHTML(folio)} - NovaSalud</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background: #f8fafc;
          padding: 32px;
        }
        .sheet {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 36px 40px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0d9488;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f766e;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .folio-box {
          text-align: right;
        }
        .folio-badge {
          display: inline-block;
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #99f6e4;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .date-text {
          font-size: 12px;
          color: #475569;
          margin-top: 6px;
          text-transform: capitalize;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .info-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #0d9488;
          margin-bottom: 4px;
        }
        .info-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .info-meta {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
        }
        .section {
          margin-bottom: 22px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #334155;
          margin-bottom: 8px;
        }
        .diagnostico-box {
          background: #f0fdfa;
          border-left: 4px solid #0d9488;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #134e4a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 11px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        tr:last-child td {
          border-bottom: none;
        }
        td.num {
          width: 36px;
          font-weight: 700;
          color: #0d9488;
        }
        td.med-name {
          font-weight: 700;
          color: #0f172a;
        }
        .indicaciones-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 13px;
          line-height: 1.5;
          color: #334155;
        }
        .footer {
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .seal {
          font-size: 11px;
          color: #64748b;
          max-width: 340px;
          line-height: 1.4;
        }
        .signature {
          text-align: center;
          min-width: 220px;
        }
        .sig-line {
          border-top: 1px solid #334155;
          padding-top: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 11px;
          color: #0d9488;
          font-weight: 600;
        }
        .no-print {
          max-width: 800px;
          margin: 0 auto 16px auto;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .btn-print {
          background: #0d9488;
          color: white;
        }
        .btn-close {
          background: #e2e8f0;
          color: #334155;
        }
        @media print {
          body { background: #ffffff; padding: 0; }
          .sheet { border: none; box-shadow: none; padding: 16px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn btn-close" onclick="window.close()">Cerrar ventana</button>
        <button class="btn btn-print" onclick="window.print()">Imprimir / Guardar como PDF</button>
      </div>

      <div class="sheet">
        <div class="header">
          <div>
            <div class="brand-title">NovaSalud Telemedicina</div>
            <div class="brand-sub">Plataforma Clínica de Atención Médica y Prescripción Digital</div>
          </div>
          <div class="folio-box">
            <span class="folio-badge">RECETA MÉDICA #${escaparHTML(folio)}</span>
            <div class="date-text">${escaparHTML(fechaFormateada)}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">Médico Prescriptor</div>
            <div class="info-name">${escaparHTML(nombreMedico.startsWith('Dr') ? nombreMedico : `Dr. ${nombreMedico}`)}</div>
            <div class="info-meta">Especialidad: ${escaparHTML(especialidad)}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Datos del Paciente</div>
            <div class="info-name">${escaparHTML(nombrePaciente)}</div>
            <div class="info-meta">Modalidad: Teleconsulta Certificada</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Diagnóstico Clínico</div>
          <div class="diagnostico-box">${escaparHTML(diagnostico)}</div>
        </div>

        <div class="section">
          <div class="section-title">Prescripción Farmacológica (Rp/)</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              ${filasMedicamentosHTML}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Indicaciones Generales y Recomendaciones</div>
          <div class="indicaciones-box">${escaparHTML(indicaciones)}</div>
        </div>

        <div class="footer">
          <div class="seal">
            <strong>Documento Clínico Digital Verificado</strong><br />
            Emitido electrónicamente a través del Sistema de Telemedicina NovaSalud. Folio de autenticidad: #${escaparHTML(folio)}.
          </div>
          <div class="signature">
            <div class="sig-line">${escaparHTML(nombreMedico.startsWith('Dr') ? nombreMedico : `Dr. ${nombreMedico}`)}</div>
            <div class="sig-sub">${escaparHTML(especialidad)} - Firma Digital</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const ventana = window.open('', '_blank', 'width=900,height=800');
  if (!ventana) {
    alert('Por favor permite las ventanas emergentes en tu navegador para descargar o imprimir la receta en PDF.');
    return;
  }
  ventana.document.open();
  ventana.document.write(htmlDocumento);
  ventana.document.close();
};

export default generarRecetaPDF;
