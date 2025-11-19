// Mapeo de nombres de competencias del PDF a los IDs del sistema
const MAPEO_COMPETENCIAS = {
  'MENTALIDAD ÁGIL': 'mentalidad_agil',
  'FOCO EN DATA': 'foco_data',
  'COMUNICACIÓN DIGITAL': 'comunicacion_digital',
  'LEARNING AGILITY': 'learning_agility',
  'COLABORACIÓN REMOTA': 'colaboracion_remota',
  'MINDSET DIGITAL': 'mindset_digital',
  'LIDERAZGO KONECTA': 'liderazgo_konecta',
  'ENGAGEMENT': 'engagement',
  'CONFIANZA': 'confianza',
  'EXPERIENCIA DEL CLIENTE': 'experiencia_cliente',
  'CX': 'experiencia_cliente',
  'ORIENTACIÓN A RESULTADOS': 'orientacion_resultados',
  'ORIENTACIÓN A LOS RESUL TADOS': 'orientacion_resultados',
  'ORIENTACIÓN COMERCIAL': 'orientacion_comercial',
  'MERCADO': 'orientacion_comercial',
  'PROSPECTIVA ESTRATÉGICA': 'prospectiva_estrategica'
}

export async function procesarPDFMATE(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        // Importar pdfjs-dist dinámicamente
        const pdfjsLib = await import('pdfjs-dist')
        
        // Configurar el worker usando CDN como fallback
        if (typeof window !== 'undefined') {
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
          } catch (e) {
            // Fallback a versión específica
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          }
        }
        
        const arrayBuffer = e.target.result
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        
        let textoCompleto = ''
        
        // Extraer texto de todas las páginas
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          textoCompleto += pageText + '\n'
        }
        
        // Procesar el texto para extraer información
        const datosMATE = extraerDatosMATE(textoCompleto)
        resolve(datosMATE)
      } catch (error) {
        console.error('Error procesando PDF:', error)
        reject(new Error('Error al procesar el PDF. Asegúrate de que sea un archivo MATE válido.'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

function extraerDatosMATE(texto) {
  const datos = {
    nombreAsesor: '',
    periodo: '',
    competencias: {}
  }
  
  // Extraer nombre
  const nombreMatch = texto.match(/NOMBRE Y\s+APELLIDO([A-Z,\s]+?)(?:\s+DNI|\n)/i)
  if (nombreMatch) {
    datos.nombreAsesor = nombreMatch[1].trim()
  }
  
  // Extraer período
  const periodoMatch = texto.match(/PERIODO\s+([^\n]+)/i)
  if (periodoMatch) {
    datos.periodo = periodoMatch[1].trim()
  }
  
  // Extraer competencias con niveles y observaciones
  // El formato es: COMPETENCIA - Nivel X: descripción Observaciones: observaciones
  // Primero buscar todas las competencias con su nivel
  const patronCompetencia = /([A-ZÁÉÍÓÚÑ\s]+(?:\([^\)]+\))?)\s*-\s*Nivel\s+(\d+):/gi
  
  let match
  const competenciasEncontradas = []
  
  while ((match = patronCompetencia.exec(texto)) !== null) {
    const nombreCompetencia = match[1].trim().toUpperCase()
    const nivel = parseInt(match[2])
    const inicio = match.index
    const fin = match.index + match[0].length
    
    // Buscar la descripción hasta "Observaciones:" o la siguiente competencia
    const textoRestante = texto.substring(fin)
    
    // Buscar dónde terminan las observaciones (siguiente competencia o sección)
    const finSeccion = textoRestante.search(/[A-ZÁÉÍÓÚÑ\s]+(?:\([^\)]+\))?\s*-\s*Nivel\s+\d+:|FORTALEZA:/i)
    const textoSeccion = finSeccion !== -1 
      ? textoRestante.substring(0, finSeccion)
      : textoRestante.substring(0, 500)
    
    // Separar descripción y observaciones
    const obsIndex = textoSeccion.search(/Observaciones:/i)
    let descripcion = ''
    let observaciones = ''
    
    if (obsIndex !== -1) {
      descripcion = textoSeccion.substring(0, obsIndex).trim()
      observaciones = textoSeccion.substring(obsIndex + 'Observaciones:'.length).trim()
    } else {
      descripcion = textoSeccion.trim()
    }
    
    competenciasEncontradas.push({
      nombre: nombreCompetencia,
      nivel,
      descripcion,
      observaciones
    })
  }
  
  // Mapear cada competencia encontrada a su ID
  competenciasEncontradas.forEach(comp => {
    let idCompetencia = null
    
    // Primero intentar mapeo exacto
    for (const [nombrePDF, id] of Object.entries(MAPEO_COMPETENCIAS)) {
      const nombrePDFUpper = nombrePDF.toUpperCase()
      const nombreCompUpper = comp.nombre.toUpperCase()
      
      // Comparación exacta o si uno contiene al otro
      if (nombreCompUpper === nombrePDFUpper || 
          nombreCompUpper.includes(nombrePDFUpper) || 
          nombrePDFUpper.includes(nombreCompUpper)) {
        idCompetencia = id
        break
      }
    }
    
    // Si no se encuentra, buscar por palabras clave
    if (!idCompetencia) {
      const nombreUpper = comp.nombre.toUpperCase()
      
      if (nombreUpper.includes('MENTALIDAD') && nombreUpper.includes('ÁGIL')) {
        idCompetencia = 'mentalidad_agil'
      } else if (nombreUpper.includes('FOCO') && nombreUpper.includes('DATA')) {
        idCompetencia = 'foco_data'
      } else if (nombreUpper.includes('COMUNICACIÓN') && nombreUpper.includes('DIGITAL')) {
        idCompetencia = 'comunicacion_digital'
      } else if (nombreUpper.includes('LEARNING') && nombreUpper.includes('AGILITY')) {
        idCompetencia = 'learning_agility'
      } else if (nombreUpper.includes('COLABORACIÓN') || nombreUpper.includes('REMOTA')) {
        idCompetencia = 'colaboracion_remota'
      } else if (nombreUpper.includes('MINDSET') && nombreUpper.includes('DIGITAL')) {
        idCompetencia = 'mindset_digital'
      } else if (nombreUpper.includes('LIDERAZGO')) {
        idCompetencia = 'liderazgo_konecta'
      } else if (nombreUpper === 'ENGAGEMENT' || nombreUpper.includes('ENGAGEMENT')) {
        idCompetencia = 'engagement'
      } else if (nombreUpper === 'CONFIANZA' || nombreUpper.includes('CONFIANZA')) {
        idCompetencia = 'confianza'
      } else if (nombreUpper === 'CX' || nombreUpper.includes('EXPERIENCIA') || nombreUpper.includes('CLIENTE')) {
        idCompetencia = 'experiencia_cliente'
      } else if (nombreUpper.includes('RESULTADOS') || nombreUpper.includes('RESUL')) {
        idCompetencia = 'orientacion_resultados'
      } else if (nombreUpper === 'MERCADO' || nombreUpper.includes('COMERCIAL')) {
        idCompetencia = 'orientacion_comercial'
      } else if (nombreUpper.includes('PROSPECTIVA') || nombreUpper.includes('ESTRATÉGICA')) {
        idCompetencia = 'prospectiva_estrategica'
      }
    }
    
    if (idCompetencia) {
      datos.competencias[idCompetencia] = {
        nivel: comp.nivel,
        descripcion: comp.descripcion,
        observaciones: comp.observaciones
      }
    } else {
      // Log para debug si no se encuentra mapeo
      console.log(`Competencia no mapeada: "${comp.nombre}" - Nivel ${comp.nivel}`)
    }
  })
  
  console.log(`Competencias procesadas: ${Object.keys(datos.competencias).length}`)
  console.log(`Competencias encontradas en PDF: ${competenciasEncontradas.length}`)
  
  return datos
}

