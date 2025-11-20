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

export function extraerDatosMATE(texto) {
  const datos = {
    nombreAsesor: '',
    periodo: '',
    competencias: {},
    metricas: {
      kpis: [], // Array de KPIs extraídos del PDF
      comentarios: '', // Comentarios generales
      pasa: '' // Pasa
    }
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
  
  // Extraer métricas: KPI, Comentarios y Pasa
  const metricasExtraidas = extraerMetricas(texto)
  if (metricasExtraidas) {
    datos.metricas = metricasExtraidas
  }
  
  // Buscar secciones de categorías en el PDF (MANTENER, ALENTAR, TRANSFORMAR, EVITAR)
  // Estas secciones aparecen como títulos y luego listan competencias debajo
  const seccionesCategorias = {
    mantener: [],
    alentar: [],
    transformar: [],
    evitar: []
  }
  
  // Normalizar espacios múltiples a espacios simples para facilitar la búsqueda
  const textoNormalizado = texto.replace(/\s+/g, ' ')
  
  // Buscar secciones con títulos como "MANTENER", "ALENTAR", etc.
  // Buscar patrones más flexibles que incluyan "FORTALEZA: MANTENER", "MANTENER:", etc.
  // El PDF puede tener formato: "FORTALEZA: MANTENER" o simplemente "MANTENER"
  // También buscar variaciones como "FORTALEZA MANTENER" (sin dos puntos)
  // Buscar tanto con "FORTALEZA:" como sin él
  const patronesSeccion = [
    /FORTALEZA\s*:\s*(MANTENER|ALENTAR|TRANSFORMAR|EVITAR)/gi,
    /(?:^|\n|\.)\s*(MANTENER|ALENTAR|TRANSFORMAR|EVITAR)\s*(?:[:•\-]|$|\n|\.|¿|\?)/gmi
  ]
  
  let matchSeccion
  const posicionesSecciones = []
  
  // Buscar con ambos patrones
  patronesSeccion.forEach(patron => {
    while ((matchSeccion = patron.exec(textoNormalizado)) !== null) {
      const categoriaNombre = matchSeccion[1].toLowerCase()
      const inicioSeccion = matchSeccion.index + matchSeccion[0].length
      
      // Verificar que no sea una duplicada (misma posición aproximada)
      const yaExiste = posicionesSecciones.some(pos => 
        Math.abs(pos.inicio - inicioSeccion) < 50
      )
      
      if (!yaExiste) {
        posicionesSecciones.push({
          categoria: categoriaNombre,
          inicio: inicioSeccion,
          fin: null
        })
      }
    }
  })
  
  // Ordenar por posición
  posicionesSecciones.sort((a, b) => a.inicio - b.inicio)
  
  // Determinar el fin de cada sección (inicio de la siguiente sección de categoría o fin del texto)
  for (let i = 0; i < posicionesSecciones.length; i++) {
    if (i < posicionesSecciones.length - 1) {
      posicionesSecciones[i].fin = posicionesSecciones[i + 1].inicio
    } else {
      // Para la última sección, buscar hasta encontrar otra sección conocida o fin del documento
      const siguienteSeccion = texto.indexOf('\n', posicionesSecciones[i].inicio + 5000)
      posicionesSecciones[i].fin = siguienteSeccion !== -1 ? siguienteSeccion : texto.length
    }
  }
  
  // Para cada sección, buscar competencias que aparecen en ella
  // Buscar competencias que aparecen después del título de la sección y antes de la siguiente
  posicionesSecciones.forEach(seccion => {
    // Usar texto normalizado para buscar competencias
    const contenidoSeccion = textoNormalizado.substring(seccion.inicio, Math.min(seccion.inicio + 10000, seccion.fin))
    
    // Buscar competencias en esta sección buscando el patrón "COMPETENCIA - Nivel X:"
    // que aparezca después del título de la sección
    const patronCompetenciaEnSeccion = /([A-ZÁÉÍÓÚÑ\s]+(?:\([^\)]+\))?)\s*-\s*Nivel\s+\d+:/gi
    let matchComp
    
    while ((matchComp = patronCompetenciaEnSeccion.exec(contenidoSeccion)) !== null) {
      const nombreCompetenciaEncontrada = matchComp[1].trim().toUpperCase()
      let idCompetenciaEncontrada = null
      
      // Limpiar el nombre de espacios extra
      const nombreLimpio = nombreCompetenciaEncontrada.replace(/\s+/g, ' ').trim()
      
      // Mapear el nombre encontrado a un ID
      for (const [nombrePDF, id] of Object.entries(MAPEO_COMPETENCIAS)) {
        const nombrePDFUpper = nombrePDF.toUpperCase()
        const nombreLimpioUpper = nombreLimpio.toUpperCase()
        
        // Comparación más flexible
        if (nombreLimpioUpper === nombrePDFUpper || 
            nombreLimpioUpper.includes(nombrePDFUpper) || 
            nombrePDFUpper.includes(nombreLimpioUpper) ||
            // También buscar sin espacios
            nombreLimpioUpper.replace(/\s/g, '') === nombrePDFUpper.replace(/\s/g, '')) {
          idCompetenciaEncontrada = id
          break
        }
      }
      
      // Si no se encontró por mapeo exacto, buscar por palabras clave
      if (!idCompetenciaEncontrada) {
        const nombreUpper = nombreLimpio.toUpperCase()
        
        if (nombreUpper.includes('MENTALIDAD') && (nombreUpper.includes('ÁGIL') || nombreUpper.includes('AGIL'))) {
          idCompetenciaEncontrada = 'mentalidad_agil'
        } else if (nombreUpper.includes('FOCO') && nombreUpper.includes('DATA')) {
          idCompetenciaEncontrada = 'foco_data'
        } else if (nombreUpper.includes('COMUNICACIÓN') || nombreUpper.includes('COMUNICACION')) {
          if (nombreUpper.includes('DIGITAL')) {
            idCompetenciaEncontrada = 'comunicacion_digital'
          }
        } else if (nombreUpper.includes('LEARNING') && nombreUpper.includes('AGILITY')) {
          idCompetenciaEncontrada = 'learning_agility'
        } else if (nombreUpper.includes('COLABORACIÓN') || nombreUpper.includes('COLABORACION') || nombreUpper.includes('REMOTA')) {
          idCompetenciaEncontrada = 'colaboracion_remota'
        } else if (nombreUpper.includes('MINDSET') && nombreUpper.includes('DIGITAL')) {
          idCompetenciaEncontrada = 'mindset_digital'
        } else if (nombreUpper.includes('LIDERAZGO')) {
          idCompetenciaEncontrada = 'liderazgo_konecta'
        } else if (nombreUpper.includes('ENGAGEMENT')) {
          idCompetenciaEncontrada = 'engagement'
        } else if (nombreUpper.includes('CONFIANZA')) {
          idCompetenciaEncontrada = 'confianza'
        } else if (nombreUpper === 'CX' || nombreUpper.includes('EXPERIENCIA') || nombreUpper.includes('CLIENTE')) {
          idCompetenciaEncontrada = 'experiencia_cliente'
        } else if (nombreUpper.includes('RESULTADOS') || nombreUpper.includes('RESUL')) {
          idCompetenciaEncontrada = 'orientacion_resultados'
        } else if (nombreUpper.includes('MERCADO') || nombreUpper.includes('COMERCIAL')) {
          idCompetenciaEncontrada = 'orientacion_comercial'
        } else if (nombreUpper.includes('PROSPECTIVA') || nombreUpper.includes('ESTRATÉGICA') || nombreUpper.includes('ESTRATEGICA')) {
          idCompetenciaEncontrada = 'prospectiva_estrategica'
        }
      }
      
      // Si encontramos el ID, agregarlo a la sección
      if (idCompetenciaEncontrada && !seccionesCategorias[seccion.categoria].includes(idCompetenciaEncontrada)) {
        seccionesCategorias[seccion.categoria].push(idCompetenciaEncontrada)
      }
    }
  })
  
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
    
    // Detectar categoría: Mantener, Alentar, Transformar, Evitar
    // La categoría se determina por la sección del PDF donde aparece la competencia
    let categoria = null
    let idCompetenciaTemp = null
    
    // Intentar mapear esta competencia a un ID
    for (const [nombrePDF, id] of Object.entries(MAPEO_COMPETENCIAS)) {
      const nombrePDFUpper = nombrePDF.toUpperCase()
      const nombreCompUpper = nombreCompetencia.toUpperCase()
      if (nombreCompUpper === nombrePDFUpper || 
          nombreCompUpper.includes(nombrePDFUpper) || 
          nombrePDFUpper.includes(nombreCompUpper)) {
        idCompetenciaTemp = id
        break
      }
    }
    
    // Si no se encontró por mapeo exacto, buscar por palabras clave
    if (!idCompetenciaTemp) {
      const nombreUpper = nombreCompetencia.toUpperCase()
      
      if (nombreUpper.includes('MENTALIDAD') && nombreUpper.includes('ÁGIL')) {
        idCompetenciaTemp = 'mentalidad_agil'
      } else if (nombreUpper.includes('FOCO') && nombreUpper.includes('DATA')) {
        idCompetenciaTemp = 'foco_data'
      } else if (nombreUpper.includes('COMUNICACIÓN') && nombreUpper.includes('DIGITAL')) {
        idCompetenciaTemp = 'comunicacion_digital'
      } else if (nombreUpper.includes('LEARNING') && nombreUpper.includes('AGILITY')) {
        idCompetenciaTemp = 'learning_agility'
      } else if (nombreUpper.includes('COLABORACIÓN') || nombreUpper.includes('REMOTA')) {
        idCompetenciaTemp = 'colaboracion_remota'
      } else if (nombreUpper.includes('MINDSET') && nombreUpper.includes('DIGITAL')) {
        idCompetenciaTemp = 'mindset_digital'
      } else if (nombreUpper.includes('LIDERAZGO')) {
        idCompetenciaTemp = 'liderazgo_konecta'
      } else if (nombreUpper === 'ENGAGEMENT' || nombreUpper.includes('ENGAGEMENT')) {
        idCompetenciaTemp = 'engagement'
      } else if (nombreUpper === 'CONFIANZA' || nombreUpper.includes('CONFIANZA')) {
        idCompetenciaTemp = 'confianza'
      } else if (nombreUpper === 'CX' || nombreUpper.includes('EXPERIENCIA') || nombreUpper.includes('CLIENTE')) {
        idCompetenciaTemp = 'experiencia_cliente'
      } else if (nombreUpper.includes('RESULTADOS') || nombreUpper.includes('RESUL')) {
        idCompetenciaTemp = 'orientacion_resultados'
      } else if (nombreUpper === 'MERCADO' || nombreUpper.includes('COMERCIAL')) {
        idCompetenciaTemp = 'orientacion_comercial'
      } else if (nombreUpper.includes('PROSPECTIVA') || nombreUpper.includes('ESTRATÉGICA')) {
        idCompetenciaTemp = 'prospectiva_estrategica'
      }
    }
    
    // Si encontramos el ID, buscar en qué sección está
    if (idCompetenciaTemp) {
      for (const [cat, ids] of Object.entries(seccionesCategorias)) {
        if (ids.includes(idCompetenciaTemp)) {
          categoria = cat
          break
        }
      }
    }
    
    // Si aún no se encontró, buscar en el contexto cercano de la competencia
    // para ver si hay una sección de categoría cerca
    if (!categoria) {
      // Buscar hacia atrás desde la competencia para encontrar la sección más cercana
      const textoAntes = texto.substring(Math.max(0, inicio - 2000), inicio)
      const patronSeccionCercana = /(?:^|\n)\s*(MANTENER|ALENTAR|TRANSFORMAR|EVITAR)\s*(?:[:•\-]|$|\n|\.)/gmi
      const matches = [...textoAntes.matchAll(patronSeccionCercana)]
      
      if (matches.length > 0) {
        // Tomar la sección más cercana (última encontrada antes de la competencia)
        const seccionCercana = matches[matches.length - 1][1].toLowerCase()
        categoria = seccionCercana
      }
    }
    
    competenciasEncontradas.push({
      nombre: nombreCompetencia,
      nivel,
      descripcion,
      observaciones,
      categoria
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
        observaciones: comp.observaciones,
        categoria: comp.categoria // Mantener, Alentar, Transformar, Evitar
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

// Función para extraer métricas (KPI, Comentarios, Pasa) del PDF
function extraerMetricas(texto) {
  const textoNormalizado = texto.replace(/\s+/g, ' ')
  const resultado = {
    kpis: [],
    comentarios: '',
    pasa: ''
  }
  
  // Buscar sección de KPI y extraer KPIs individuales
  let textoKPI = ''
  
  // Buscar texto de la sección KPI
  const indiceKPI = textoNormalizado.search(/KPI[s]?\s*[:\-•]?/i)
  if (indiceKPI !== -1) {
    const matchKPI = textoNormalizado.match(/KPI[s]?\s*[:\-•]?\s*/i)
    const inicioContenido = indiceKPI + (matchKPI ? matchKPI[0].length : 4)
    const textoDespuesKPI = textoNormalizado.substring(inicioContenido)
    
    // Buscar hasta encontrar "COMENTARIOS" o "PASA" o un límite razonable
    const indices = [
      textoDespuesKPI.search(/COMENTARIOS?\s*[:\-•]/i),
      textoDespuesKPI.search(/PASA\s*[:\-•]/i),
      textoDespuesKPI.search(/\n\s*[A-ZÁÉÍÓÚÑ]{8,}\s*[:\-•]/)
    ].filter(idx => idx !== -1 && idx > 0)
    
    const finKPI = indices.length > 0 ? Math.min(...indices) : Math.min(1000, textoDespuesKPI.length)
    
    if (finKPI > 10) {
      textoKPI = textoDespuesKPI.substring(0, finKPI).trim()
    }
  }
  
  // KPIs específicos a buscar: NPS, PEC, TMO
  const kpisEspecificos = ['NPS', 'PEC', 'TMO']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  
  // Extraer KPIs individuales del texto buscando los KPIs específicos
  if (textoKPI) {
    kpisEspecificos.forEach(kpiNombre => {
      // Buscar el KPI en el texto
      if (new RegExp(kpiNombre, 'i').test(textoKPI)) {
        // Buscar líneas que contengan el KPI
        const lineas = textoKPI.split(/\n/)
        let lineaConKPI = lineas.find(linea => new RegExp(kpiNombre, 'i').test(linea))
        
        if (!lineaConKPI) {
          // Si no se encuentra en una sola línea, buscar en el contexto completo
          const indiceKPI = textoKPI.search(new RegExp(kpiNombre, 'i'))
          if (indiceKPI !== -1) {
            const inicioContexto = Math.max(0, indiceKPI - 200)
            const finContexto = Math.min(textoKPI.length, indiceKPI + 500)
            lineaConKPI = textoKPI.substring(inicioContexto, finContexto)
          }
        }
        
        if (lineaConKPI) {
          // Extraer el texto completo para mostrar en la vista comparativa
          const textoPDF = lineaConKPI.trim()
          
          // Buscar mes en el texto (buscar el último mes mencionado)
          let mesEncontrado = ''
          let mesIndex = -1
          meses.forEach((mes, index) => {
            const regexMes = new RegExp(mes, 'i')
            const match = textoPDF.match(regexMes)
            if (match && (mesIndex === -1 || match.index > mesIndex)) {
              mesEncontrado = mes
              mesIndex = match.index
            }
          })
          
          // Buscar valor de Pasa (SÍ o NO) asociado al KPI
          // Buscar "Pasa" seguido de SÍ o NO cerca del KPI
          let pasaEncontrado = ''
          const regexPasa = /Pasa\s*(?:[:•\-]?)\s*(SI|SÍ|NO|Si|No)/i
          const matchPasa = textoPDF.match(regexPasa)
          if (matchPasa) {
            const pasaValue = matchPasa[1].toUpperCase()
            pasaEncontrado = (pasaValue === 'SI' || pasaValue === 'SÍ') ? 'SÍ' : 'NO'
          } else {
            // Buscar en líneas cercanas después del KPI
            const indiceKPI = textoPDF.indexOf(kpiNombre)
            if (indiceKPI !== -1) {
              const textoDespues = textoPDF.substring(indiceKPI + kpiNombre.length)
              const matchPasaDespues = textoDespues.match(regexPasa)
              if (matchPasaDespues) {
                const pasaValue = matchPasaDespues[1].toUpperCase()
                pasaEncontrado = (pasaValue === 'SI' || pasaValue === 'SÍ') ? 'SÍ' : 'NO'
              }
            }
          }
          
          // Verificar que no se haya agregado ya este KPI
          const yaExiste = resultado.kpis.some(k => k.nombre === kpiNombre)
          if (!yaExiste) {
            resultado.kpis.push({
              nombrePDF: textoPDF, // Texto extraído del PDF para mostrar
              nombre: kpiNombre, // KPI seleccionado (NPS, PEC, TMO)
              mes: mesEncontrado || '',
              pasa: pasaEncontrado || ''
            })
          }
        }
      }
    })
  }
  
  // Buscar sección de Comentarios
  const indiceComentarios = textoNormalizado.search(/COMENTARIOS?\s*[:\-•]?/i)
  if (indiceComentarios !== -1) {
    const matchComentarios = textoNormalizado.match(/COMENTARIOS?\s*[:\-•]?\s*/i)
    const inicioContenido = indiceComentarios + (matchComentarios ? matchComentarios[0].length : 11)
    const textoDespuesComentarios = textoNormalizado.substring(inicioContenido)
    
    // Buscar hasta encontrar "PASA" o un límite razonable
    const indices = [
      textoDespuesComentarios.search(/PASA\s*[:\-•]/i),
      textoDespuesComentarios.search(/\n\s*[A-ZÁÉÍÓÚÑ]{8,}\s*[:\-•]/)
    ].filter(idx => idx !== -1 && idx > 0)
    
    const finComentarios = indices.length > 0 ? Math.min(...indices) : Math.min(500, textoDespuesComentarios.length)
    
    if (finComentarios > 10) {
      resultado.comentarios = textoDespuesComentarios.substring(0, finComentarios).trim()
    }
  }
  
  // Buscar sección de Pasa
  const indicePasa = textoNormalizado.search(/PASA\s*[:\-•]?/i)
  if (indicePasa !== -1) {
    const matchPasa = textoNormalizado.match(/PASA\s*[:\-•]?\s*/i)
    const inicioContenido = indicePasa + (matchPasa ? matchPasa[0].length : 4)
    const textoDespuesPasa = textoNormalizado.substring(inicioContenido)
    
    // Buscar hasta encontrar otra sección o un límite razonable
    const finPasaMatch = textoDespuesPasa.search(/\n\s*[A-ZÁÉÍÓÚÑ]{8,}\s*[:\-•]/)
    const finPasa = finPasaMatch !== -1 && finPasaMatch > 2 ? finPasaMatch : Math.min(300, textoDespuesPasa.length)
    
    if (finPasa > 2) {
      resultado.pasa = textoDespuesPasa.substring(0, finPasa).trim()
    }
  }
  
  // Retornar resultado si hay algo encontrado
  if (resultado.kpis.length > 0 || resultado.comentarios || resultado.pasa) {
    return resultado
  }
  
  return null
}

