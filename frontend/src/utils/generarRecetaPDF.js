/**
 * Utilidad para generar y descargar directamente en archivo PDF una Receta Médica Oficial (RF-16).
 * Renderiza el documento clínico en alta resolución y empaqueta un binario PDF 1.4 válido
 * para descarga directa en un solo clic, sin abrir ventanas emergentes ni cuadros de impresión.
 */

import { api } from '../services/api';

const dividirTextoEnLineas = (ctx, texto, maxWidth) => {
  const limpio = String(texto || '').replace(/\r/g, '');
  const parrafos = limpio.split('\n');
  const lineas = [];

  for (const parrafo of parrafos) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) {
      lineas.push('');
      continue;
    }
    let lineaActual = palabras[0];
    for (let i = 1; i < palabras.length; i++) {
      const prueba = `${lineaActual} ${palabras[i]}`;
      if (ctx.measureText(prueba).width <= maxWidth) {
        lineaActual = prueba;
      } else {
        lineas.push(lineaActual);
        lineaActual = palabras[i];
      }
    }
    lineas.push(lineaActual);
  }
  return lineas;
};

const dibujarRectanguloRedondeado = (ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 1) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
};

const construirBinarioPDFDesdeJPEG = (jpegBytes, imgWidth, imgHeight) => {
  const encoder = new TextEncoder();
  const pageWidth = 595.28; // A4 puntos (72 dpi)
  const pageHeight = 841.89;

  const partes = [];
  const offsets = [0];
  let longitudActual = 0;

  const agregarTexto = (str) => {
    const bytes = encoder.encode(str);
    partes.push(bytes);
    longitudActual += bytes.length;
  };

  const agregarBytes = (bytes) => {
    partes.push(bytes);
    longitudActual += bytes.length;
  };

  // Cabecera PDF 1.4
  agregarTexto('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Objeto 1: Catálogo
  offsets[1] = longitudActual;
  agregarTexto('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Objeto 2: Árbol de páginas
  offsets[2] = longitudActual;
  agregarTexto('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Objeto 3: Página A4
  offsets[3] = longitudActual;
  agregarTexto(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Objeto 4: Imagen JPEG XObject
  offsets[4] = longitudActual;
  agregarTexto(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  agregarBytes(jpegBytes);
  agregarTexto('\nendstream\nendobj\n');

  // Objeto 5: Contenido de la página (dibujar imagen en tamaño A4 completo)
  const contenidoStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = longitudActual;
  agregarTexto(
    `5 0 obj\n<< /Length ${contenidoStream.length} >>\nstream\n${contenidoStream}endstream\nendobj\n`
  );

  // Tabla XREF
  const inicioXref = longitudActual;
  agregarTexto('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    agregarTexto(`${offsetStr} 00000 n \n`);
  }

  // Trailer
  agregarTexto(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);

  // Unir todas las partes en un único Uint8Array
  const totalBytes = new Uint8Array(longitudActual);
  let cursor = 0;
  for (const parte of partes) {
    totalBytes.set(parte, cursor);
    cursor += parte.length;
  }
  return totalBytes;
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
  const nombreMedicoRaw = datos.medico_nombres
    ? `${datos.medico_nombres} ${datos.medico_apellidos || ''}`.trim()
    : usuarioActual?.rol === 'MEDICO'
    ? `${usuarioActual.nombres || ''} ${usuarioActual.apellidos || ''}`.trim()
    : 'Médico Especialista';
  const nombreMedico = nombreMedicoRaw.startsWith('Dr') ? nombreMedicoRaw : `Dr. ${nombreMedicoRaw}`;
  const especialidad = datos.especialidad || usuarioActual?.especialidad || 'Medicina General';

  // Datos del Paciente
  const nombrePaciente = datos.paciente_nombres
    ? `${datos.paciente_nombres} ${datos.paciente_apellidos || ''}`.trim()
    : usuarioActual?.rol === 'PACIENTE'
    ? `${usuarioActual.nombres || ''} ${usuarioActual.apellidos || ''}`.trim()
    : 'Paciente Registrado';

  const diagnostico = datos.diagnostico || 'Consulta médica general';
  const indicaciones =
    datos.indicaciones_generales ||
    'Seguir el tratamiento según las dosis y horarios indicados por su médico.';

  // Normalizar lista de medicamentos
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

  // Crear lienzo A4 en alta resolución (1240 x 1754 px)
  const W = 1240;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo blanco de la hoja
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Franja superior corporativa NovaSalud
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(0, 0, W, 16);

  const marginX = 80;
  const contentW = W - marginX * 2;
  let y = 76;

  // Cabecera: Marca y Folio
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
  ctx.fillText('NovaSalud Telemedicina', marginX, y);

  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Plataforma Clínica de Atención Médica y Prescripción Digital', marginX, y + 32);

  // Badge de Folio a la derecha
  const badgeText = `RECETA MÉDICA #${folio}`;
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  const badgeW = Math.max(250, ctx.measureText(badgeText).width + 36);
  const badgeX = W - marginX - badgeW;
  dibujarRectanguloRedondeado(ctx, badgeX, y - 30, badgeW, 40, 20, '#f0fdfa', '#99f6e4', 2);
  ctx.fillStyle = '#0f766e';
  ctx.fillText(badgeText, badgeX + 18, y - 4);

  // Fecha debajo del folio
  ctx.fillStyle = '#64748b';
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  const fechaW = ctx.measureText(fechaFormateada).width;
  ctx.fillText(fechaFormateada, W - marginX - fechaW, y + 32);

  y += 62;
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(W - marginX, y);
  ctx.stroke();

  // Tarjetas de Médico y Paciente
  y += 32;
  const cardGap = 28;
  const cardW = (contentW - cardGap) / 2;
  const cardH = 128;

  // Tarjeta Médico
  dibujarRectanguloRedondeado(ctx, marginX, y, cardW, cardH, 16, '#f8fafc', '#e2e8f0', 1.5);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('MÉDICO PRESCRIPTOR', marginX + 24, y + 34);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText(nombreMedico, marginX + 24, y + 68);
  ctx.fillStyle = '#475569';
  ctx.font = '17px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`Especialidad: ${especialidad}`, marginX + 24, y + 98);

  // Tarjeta Paciente
  const pacX = marginX + cardW + cardGap;
  dibujarRectanguloRedondeado(ctx, pacX, y, cardW, cardH, 16, '#f8fafc', '#e2e8f0', 1.5);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DATOS DEL PACIENTE', pacX + 24, y + 34);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText(nombrePaciente, pacX + 24, y + 68);
  ctx.fillStyle = '#475569';
  ctx.font = '17px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Modalidad: Teleconsulta Certificada', pacX + 24, y + 98);

  y += cardH + 40;

  // Sección: Diagnóstico Clínico
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText('DIAGNÓSTICO CLÍNICO', marginX, y);
  y += 14;

  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  const lineasDiag = dividirTextoEnLineas(ctx, diagnostico, contentW - 48).slice(0, 4);
  const diagBoxH = Math.max(68, lineasDiag.length * 28 + 32);
  dibujarRectanguloRedondeado(ctx, marginX, y, contentW, diagBoxH, 14, '#f0fdfa', '#99f6e4', 1.5);
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(marginX, y, 8, diagBoxH);

  ctx.fillStyle = '#134e4a';
  lineasDiag.forEach((linea, idx) => {
    ctx.fillText(linea, marginX + 24, y + 38 + idx * 28);
  });

  y += diagBoxH + 40;

  // Sección: Tabla de Medicamentos (Rp/)
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PRESCRIPCIÓN FARMACOLÓGICA (Rp/)', marginX, y);
  y += 16;

  const colWidths = [60, 390, 210, 220, 200]; // suma = 1080 = contentW
  const headerH = 48;
  dibujarRectanguloRedondeado(ctx, marginX, y, contentW, headerH, 10, '#f1f5f9', '#cbd5e1', 1.5);

  const headers = ['#', 'MEDICAMENTO', 'DOSIS', 'FRECUENCIA', 'DURACIÓN'];
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  let colX = marginX;
  headers.forEach((hText, i) => {
    ctx.fillText(hText, colX + 16, y + 30);
    colX += colWidths[i];
  });
  y += headerH;

  if (listaMeds.length === 0) {
    const emptyH = 64;
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(marginX, y, contentW, emptyH);
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 17px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Sin medicamentos específicos registrados en esta prescripción.', marginX + 24, y + 38);
    y += emptyH;
  } else {
    listaMeds.slice(0, 10).forEach((med, idx) => {
      const rowH = 56;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(marginX, y, contentW, rowH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(marginX, y, contentW, rowH);

      let cx = marginX;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(idx + 1), cx + 16, y + 35);
      cx += colWidths[0];

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(med.nombre || 'Medicamento').slice(0, 36), cx + 16, y + 35);
      cx += colWidths[1];

      ctx.fillStyle = '#334155';
      ctx.font = '17px "Segoe UI", Arial, sans-serif';
      ctx.fillText(String(med.dosis || 'Según indicación').slice(0, 22), cx + 16, y + 35);
      cx += colWidths[2];

      ctx.fillText(String(med.frecuencia || 'Según indicación').slice(0, 22), cx + 16, y + 35);
      cx += colWidths[3];

      ctx.fillText(String(med.duracion || 'Según evolución').slice(0, 20), cx + 16, y + 35);
      y += rowH;
    });
  }

  y += 40;

  // Sección: Indicaciones Generales y Recomendaciones
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText('INDICACIONES GENERALES Y RECOMENDACIONES', marginX, y);
  y += 14;

  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  const lineasInd = dividirTextoEnLineas(ctx, indicaciones, contentW - 48).slice(0, 6);
  const indBoxH = Math.max(96, lineasInd.length * 28 + 36);
  dibujarRectanguloRedondeado(ctx, marginX, y, contentW, indBoxH, 14, '#f8fafc', '#e2e8f0', 1.5);

  ctx.fillStyle = '#334155';
  lineasInd.forEach((linea, idx) => {
    ctx.fillText(linea, marginX + 24, y + 38 + idx * 28);
  });

  // Pie de página y Firma Digital
  const footerY = H - 170;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(marginX, footerY);
  ctx.lineTo(W - marginX, footerY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Documento Clínico Digital Verificado', marginX, footerY + 42);

  ctx.fillStyle = '#64748b';
  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `Emitido electrónicamente a través del Sistema de Telemedicina NovaSalud. Folio: #${folio}.`,
    marginX,
    footerY + 68
  );

  // Línea de firma a la derecha
  const sigW = 320;
  const sigX = W - marginX - sigW;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX, footerY + 55);
  ctx.lineTo(sigX + sigW, footerY + 55);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
  const medW = ctx.measureText(nombreMedico).width;
  ctx.fillText(nombreMedico, sigX + (sigW - medW) / 2, footerY + 82);

  ctx.fillStyle = '#64748b';
  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  const subFirma = `${especialidad} - Firma Digital`;
  const subW = ctx.measureText(subFirma).width;
  ctx.fillText(subFirma, sigX + (sigW - subW) / 2, footerY + 106);

  // Exportar lienzo como JPEG y construir archivo PDF binario
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64Data = dataUrl.split(',')[1];
  const binaryStr = window.atob(base64Data);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  const pdfBytes = construirBinarioPDFDesdeJPEG(jpegBytes, W, H);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Receta_NovaSalud_${folio}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  setTimeout(() => URL.revokeObjectURL(url), 5000);

  // Registrar notificación de descarga de receta para paciente y médico
  api.post('/consultas/recetas/notificar-descarga', {
    folio,
    id_cita: datos.id_cita || null
  })
    .then(() => {
      window.dispatchEvent(new Event('notificaciones-actualizadas'));
    })
    .catch((err) => {
      console.warn('[generarRecetaPDF] Aviso al registrar notificación de descarga:', err.message);
    });
};

export default generarRecetaPDF;
