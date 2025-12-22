import jsPDF from 'jspdf'

export interface DatosPDF {
  zona: {
    nombre: string
  }
  escuela: {
    nombre: string
    direccion?: string
  }
  obra: {
    nombre: string
    numero_obra?: string
    nro_de_expte?: string
    estado: string
    fecha_inicio_prevista?: string
    fecha_fin_prevista?: string
    fecha_inicio_real?: string
    fecha_fin_real?: string
  }
  tareas: Array<{
    nombre: string
    descripcion: string
    estado: string
    avance: number
    cantidad_total?: number
    cantidad_inicial?: number
    presupuesto?: number
    unidad_medida?: string
    empresa?: string
    fecha_inicio_prevista?: string
    fecha_fin_prevista?: string
    fecha_inicio?: string
    fecha_fin?: string
  }>
  avanceTotal: number
}

export function generarResumenPDF(datos: DatosPDF): void {
  const doc = new jsPDF()
  
  // Configuración de fuentes y colores
  doc.setFontSize(20)
  doc.setTextColor(0, 51, 102) // Azul oscuro para títulos
  
  // Título principal
  doc.text('RESUMEN COMPLETO DE OBRA', 105, 20, { align: 'center' })
  
  // Línea separadora
  doc.setDrawColor(0, 51, 102)
  doc.setLineWidth(0.5)
  doc.line(20, 25, 190, 25)
  
  // Información jerárquica
  let yPosition = 35
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  
  // Zona
  doc.setFont('helvetica', 'bold')
  doc.text(`Zona: ${datos.zona.nombre}`, 20, yPosition)
  yPosition += 10
  
  // Escuela
  doc.text(`Escuela: ${datos.escuela.nombre}`, 20, yPosition)
  yPosition += 7
  if (datos.escuela.direccion) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Dirección: ${datos.escuela.direccion}`, 20, yPosition)
    yPosition += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  }
  
  // Obra
  doc.text(`Obra: ${datos.obra.nombre}`, 20, yPosition)
  yPosition += 7
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  if (datos.obra.numero_obra) {
    doc.text(`Número: ${datos.obra.numero_obra}`, 20, yPosition)
    yPosition += 6
  }
  if (datos.obra.nro_de_expte) {
    doc.text(`Expediente: ${datos.obra.nro_de_expte}`, 20, yPosition)
    yPosition += 6
  }
  doc.text(`Estado: ${datos.obra.estado}`, 20, yPosition)
  yPosition += 6
  
  if (datos.obra.fecha_inicio_prevista) {
    doc.text(`Inicio Previsto: ${formatearFecha(datos.obra.fecha_inicio_prevista)}`, 20, yPosition)
    yPosition += 6
  }
  if (datos.obra.fecha_fin_prevista) {
    doc.text(`Fin Previsto: ${formatearFecha(datos.obra.fecha_fin_prevista)}`, 20, yPosition)
    yPosition += 6
  }
  if (datos.obra.fecha_inicio_real) {
    doc.text(`Inicio Real: ${formatearFecha(datos.obra.fecha_inicio_real)}`, 20, yPosition)
    yPosition += 6
  }
  if (datos.obra.fecha_fin_real) {
    doc.text(`Fin Real: ${formatearFecha(datos.obra.fecha_fin_real)}`, 20, yPosition)
    yPosition += 6
  }
  
  yPosition += 5
  
  // Avance total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 102, 0) // Verde para avance
  doc.text(`AVANCE TOTAL DE LA OBRA: ${datos.avanceTotal}%`, 20, yPosition)
  yPosition += 10
  
  // Línea separadora antes de tareas
  doc.setDrawColor(0, 51, 102)
  doc.line(20, yPosition, 190, yPosition)
  yPosition += 10
  
  // Título de tareas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(0, 51, 102)
  doc.text(`TAREAS (${datos.tareas.length})`, 20, yPosition)
  yPosition += 10
  
  // Lista de tareas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  datos.tareas.forEach((tarea, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Título de tarea
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`${index + 1}. ${tarea.nombre}`, 20, yPosition)
    yPosition += 6
    
    // Detalles de tarea
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    if (tarea.descripcion) {
      const descripcionLines = doc.splitTextToSize(tarea.descripcion, 170)
      descripcionLines.forEach((line: string) => {
        doc.text(line, 25, yPosition)
        yPosition += 4
      })
    }
    
    yPosition += 2
    
    // Información adicional
    const infoTarea = [
      `Estado: ${tarea.estado}`,
      `Avance: ${tarea.avance}%`,
      tarea.unidad_medida && `Unidad: ${tarea.unidad_medida}`,
      tarea.cantidad_total && `Cantidad: ${tarea.cantidad_inicial || 0}/${tarea.cantidad_total}`,
      tarea.presupuesto && `Presupuesto: $${tarea.presupuesto.toLocaleString()}`,
      tarea.empresa && `Empresa: ${tarea.empresa}`,
      tarea.fecha_inicio_prevista && `Inicio Prev: ${formatearFecha(tarea.fecha_inicio_prevista)}`,
      tarea.fecha_fin_prevista && `Fin Prev: ${formatearFecha(tarea.fecha_fin_prevista)}`,
      tarea.fecha_inicio && `Inicio Real: ${formatearFecha(tarea.fecha_inicio)}`,
      tarea.fecha_fin && `Fin Real: ${formatearFecha(tarea.fecha_fin)}`
    ].filter(Boolean)
    
    infoTarea.forEach((info: string) => {
      doc.text(info, 25, yPosition)
      yPosition += 4
    })
    
    yPosition += 6 // Espacio entre tareas
  })
  
  // Pie de página
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' })
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 105, 290, { align: 'center' })
  }
  
  // Descargar el PDF
  const fileName = `Resumen_Obra_${datos.obra.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

function formatearFecha(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-AR')
  } catch {
    return fecha
  }
}
