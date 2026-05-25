/**
 * PDF.JS - Generación de PDF del cronograma semanal
 * 
 * Utiliza jsPDF para crear un PDF en orientación landscape
 * con la tabla del cronograma de la semana actual.
 * 
 * Incluye:
 * - Título y fechas de la semana
 * - Encabezado con hipódromos
 * - Una fila por empleado con su asignación diaria
 * - Referencias de colores al final
 * - Fecha de generación
 */

// =======================
// IMPORTACIONES
// =======================

import { jsPDF } from 'jspdf';  // Biblioteca para generar PDFs
import { empleados, TIPOS, TIPOS_AUSENCIA, DIAS_CORTOS, formatDate } from '../data/empleados';

const FRANCO = TIPOS.franco;

/**
 * Genera y descarga un PDF con el cronograma de la semana actual
 * @param {Object} cronograma - Objeto con las asignaciones por fecha
 * @param {Array} ausencias - Array de ausencias [{ legajo, fecha, tipo }]
 */
export function generarPDF(cronograma, ausencias = []) {
  // Crear documento PDF en orientación horizontal (landscape)
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Calcular fechas de la semana actual
  const ahora = new Date();
  const inicioSemana = new Date(ahora);
  
  // Ajustar al lunes de la semana actual (getDay() = 0 es domingo)
  inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1);
  
  // Formatear fechas para el título
  const fechaInicio = inicioSemana.toLocaleDateString('es-AR', { 
    day: '2-digit', month: '2-digit' 
  });
  
  const fechaFin = new Date(inicioSemana);
  fechaFin.setDate(inicioSemana.getDate() + 6);
  
  const fechaFinStr = fechaFin.toLocaleDateString('es-AR', { 
    day: '2-digit', month: '2-digit' 
  });

  // =======================
  // CONFIGURACIÓN DE ESTILOS
  // =======================
  
  const cellWidth = 28;   // Ancho de cada celda de día
  const rowHeight = 14;   // Alto de cada fila
  const startX = 15;      // Posición X inicial
  let y = 20;             // Posición Y actual

  // Título principal
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold'); // negrita
  doc.text('CRONOGRAMA SEMANAL - REUNIONES CÓMPUTOS', 148, 12, { align: 'center' });

  // Subtítulo con rango de fechas
  doc.setFontSize(10);
  doc.text(
    `Semana del ${fechaInicio}/${fechaFin.getMonth() + 1}/${fechaFin.getFullYear()} al ${fechaFinStr}`,
    148, 18, { align: 'center' }
  );

  y = 25;

  // =======================
  // ENCABEZADO DE LA TABLA
  // =======================

  // Fondo del header
  doc.setFillColor(200, 200, 220); // Gris azulado
  doc.rect(startX, y, 250, rowHeight, 'F');

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);

  // Primera fila del header: fechas (número del día)
  doc.text('', startX + 2, y + 8);  // columna "Legajo"
  doc.text('', startX + 20, y + 8); // columna "Empleado"
  
  let x = startX + 55;
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(inicioSemana.getDate() + i);
    
    // Número del día
    doc.text(String(fecha.getDate()), x + cellWidth / 2, y + 5, { align: 'center' });
    
    // Nombre del día (LUN, MAR, etc.)
    doc.setFontSize(8);
    doc.text(DIAS_CORTOS[i], x + cellWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(10);
    
    x += cellWidth;
  }

  y += rowHeight;

  // Segunda fila del header: hipódromos
  doc.setFontSize(8);
  doc.text('Legajo', startX + 2, y + 8);
  doc.text('Empleado', startX + 20, y + 8);

  x = startX + 55;
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(inicioSemana.getDate() + i);
    const fechaStr = formatDate(fecha);
    
    // Obtener hipódromo del día o mostrar "-"
    const hippo = cronograma[fechaStr]?.hipodromo || '-';
    doc.text(hippo, x + cellWidth / 2, y + 8, { align: 'center' });
    
    x += cellWidth;
  }

  y += rowHeight;

  // =======================
  // FILAS DE EMPLEADOS
  // =======================

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);

  // Iterar sobre cada empleado
  empleados.forEach((emp) => {
    const filaY = y;

    // Fondo de la fila
    doc.setFillColor(245, 245, 250);
    doc.rect(startX, filaY, 250, rowHeight, 'F');

    // Mostrar legajo
    doc.setTextColor(0, 0, 0);
    const legajoMostrar = isNaN(parseInt(emp.legajo)) ? '' : String(emp.legajo);
    doc.text(legajoMostrar, startX + 2, filaY + 8);

    // Mostrar nombre formateado: APELLIDO, Nombre
    // Ejemplo: "Raúl Martínez" -> "MARTÍNEZ, Raúl"
    const partes = emp.nombre.split(' ');
    const apellido = partes.length > 1 ? partes[1].toUpperCase() : partes[0].toUpperCase();
    const nombre = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    doc.text(`${apellido}, ${nombre}`, startX + 20, filaY + 8);

    // =======================
    // CELDAS POR CADA DÍA
    // =======================
    
    x = startX + 55;
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const fechaStr = formatDate(fecha);

      const dia = cronograma[fechaStr];
      const aus = ausencias.find(a => a.legajo === emp.legajo && a.fecha === fechaStr);

      let bgColor, texto;

      if (aus) {
        if (aus.tipo === 'otro') {
          bgColor = [255, 220, 220];
          texto = FRANCO.pdf;
        } else {
          const infoAbs = TIPOS_AUSENCIA[aus.tipo];
          bgColor = [235, 224, 210];
          texto = infoAbs?.label || aus.tipo;
        }
      } else {
        const asignacion = dia?.excepciones?.find(a => a.legajo === emp.legajo);
        const tipo = asignacion?.tipo || 'trabaja';
        const info = TIPOS[tipo] || TIPOS.trabaja;

        if (tipo === 'trabaja') bgColor = [220, 255, 220];
        else if (tipo === 'franco') bgColor = [255, 220, 220];
        else if (tipo === 'feriado') bgColor = [220, 230, 255];
        else if (tipo === 'compensatorio') bgColor = [255, 250, 200];
        else bgColor = [220, 255, 220];
        texto = info.pdf;
      }

      doc.setFillColor(...bgColor);
      doc.rect(x + 1, filaY + 1, cellWidth - 2, rowHeight - 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text(texto, x + cellWidth / 2, filaY + 8, { align: 'center' });
      doc.setDrawColor(180, 180, 200);
      doc.rect(x + 1, filaY + 1, cellWidth - 2, rowHeight - 2);

      x += cellWidth;
    }

    // Línea separadora de fila
    doc.setDrawColor(180, 180, 200);
    doc.line(startX, filaY + rowHeight, startX + 250, filaY + rowHeight);

    y += rowHeight;
  });

  // =======================
  // REFERENCIAS DE COLORES
  // =======================

  y += 10;
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Referencias:', startX, y);
  
  doc.setFont(undefined, 'normal');
  const refs = [
    { label: 'TRABAJA', color: [220, 255, 220] },
    { label: 'FRANCO', color: [255, 220, 220] },
    { label: 'FERIADO', color: [220, 230, 255] },
    { label: 'COMPENS.', color: [255, 250, 200] }
  ];

  let rx = startX + 25;
  const refWidth = 24;
  refs.forEach((ref) => {
    // Rectángulo de color
    doc.setFillColor(...ref.color);
    doc.rect(rx, y - 6, refWidth, 16, 'F');
    doc.setDrawColor(180, 180, 200);
    doc.rect(rx, y - 6, refWidth, 16);
    
    // Texto de la referencia
    const lineas = ref.label.split('\n');
    lineas.forEach((linea, idx) => {
      doc.text(linea, rx + refWidth / 2, y - 2 + idx * 6, { align: 'center' });
    });
    rx += refWidth + 4;
  });

  // =======================
  // PIE DE PÁGINA
  // =======================

  // Fecha y hora de generación
  const fechaGen = new Date().toLocaleDateString('es-AR', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${fechaGen}`, 148, 190, { align: 'center' });

  // =======================
  // DESCARGAR PDF
  // =======================

  // Nombre del archivo: cronograma-del-19-al-25-05.pdf
  const fechaIni = String(inicioSemana.getDate()).padStart(2, '0');
  const fechaFinPdf = 
    String(fechaFin.getDate()).padStart(2, '0') + '-' + 
    String(fechaFin.getMonth() + 1).padStart(2, '0') + '-' + 
    fechaFin.getFullYear();
  
  doc.save(`cronograma-del-${fechaIni}-al-${fechaFinPdf}.pdf`);
}