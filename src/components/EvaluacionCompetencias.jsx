import { useState, useRef, useEffect } from 'react'
import { generarPerfil } from '../services/geminiService'
import { procesarPDFMATE } from '../services/pdfProcessor'
import { jsPDF } from 'jspdf'
import './EvaluacionCompetencias.css'

const STORAGE_KEY = 'mate_evaluacion_progreso'

const COMPETENCIAS = [
  {
    id: 'mentalidad_agil',
    nombre: 'Mentalidad Ágil (Adaptabilidad)',
    categoria: 'PERSONAL',
    preguntas: [
      '¿Cómo responde el asesor ante cambios en procesos, herramientas o formas de trabajo?',
      '¿Qué actitud muestra cuando se enfrenta a situaciones nuevas o inciertas?',
      '¿De qué manera se adapta a nuevas cuentas, tecnologías o metodologías?',
      '¿Propone mejoras o soluciones cuando se presentan cambios?'
    ]
  },
  {
    id: 'foco_data',
    nombre: 'Foco en Data (Análisis y Resolución de Problemas)',
    categoria: 'LOGRO Y ACCIÓN',
    preguntas: [
      '¿Cómo utiliza el asesor los datos e indicadores para tomar decisiones?',
      '¿Qué hace cuando identifica un desvío en sus métricas o resultados?',
      '¿Busca causas raíz cuando algo no funciona como se espera?',
      '¿Propone acciones basadas en evidencia o datos concretos?'
    ]
  },
  {
    id: 'comunicacion_digital',
    nombre: 'Comunicación Digital (Comunicación Efectiva)',
    categoria: 'RELACIONAL',
    preguntas: [
      '¿Cómo se comunica el asesor en entornos digitales (chat, email, videollamadas)?',
      '¿Adapta su mensaje según el canal y la audiencia?',
      '¿Escucha activamente y valida que el otro entendió su mensaje?',
      '¿Mantiene una comunicación clara, oportuna y empática?'
    ]
  },
  {
    id: 'learning_agility',
    nombre: 'Learning Agility (Espíritu Emprendedor)',
    categoria: 'LOGRO Y ACCIÓN',
    preguntas: [
      '¿Cómo demuestra el asesor su capacidad de aprender continuamente?',
      '¿Qué actitud tiene frente al feedback y las oportunidades de mejora?',
      '¿Se anima a probar nuevas formas de hacer las cosas?',
      '¿Comparte lo que aprende con otros miembros del equipo?'
    ]
  },
  {
    id: 'colaboracion_remota',
    nombre: 'Colaboración Remota (Trabajo en Equipo)',
    categoria: 'RELACIONAL',
    preguntas: [
      '¿Cómo colabora el asesor con sus compañeros en entornos remotos o híbridos?',
      '¿Participa activamente en espacios virtuales de trabajo en equipo?',
      '¿Comparte información y recursos de manera efectiva con otros?',
      '¿Contribuye a mantener la cohesión del equipo a distancia?'
    ]
  },
  {
    id: 'mindset_digital',
    nombre: 'Mindset Digital (Innovación)',
    categoria: 'NEGOCIO',
    preguntas: [
      '¿Cómo utiliza el asesor las herramientas digitales para mejorar su trabajo?',
      '¿Propone o implementa mejoras tecnológicas en sus procesos?',
      '¿Qué actitud tiene hacia la innovación y las nuevas tecnologías?',
      '¿Automatiza tareas o busca formas más eficientes de trabajar?'
    ]
  },
  {
    id: 'liderazgo_konecta',
    nombre: 'Liderazgo Konecta',
    categoria: 'NEGOCIO',
    preguntas: [
      '¿Cómo influye positivamente el asesor en su equipo o área?',
      '¿Escucha activamente y brinda feedback constructivo?',
      '¿Promueve el desarrollo y bienestar de las personas?',
      '¿Toma decisiones basadas en datos sin perder de vista a las personas?'
    ]
  },
  {
    id: 'engagement',
    nombre: 'Engagement (Compromiso Laboral)',
    categoria: 'PERSONAL',
    preguntas: [
      '¿Cómo demuestra el asesor su compromiso con el trabajo y los objetivos del equipo?',
      '¿Se involucra activamente más allá de sus tareas asignadas?',
      '¿Qué nivel de energía y entusiasmo transmite en su trabajo diario?',
      '¿Participa en iniciativas de mejora continua o proyectos del equipo?'
    ]
  },
  {
    id: 'confianza',
    nombre: 'Confianza (Integridad)',
    categoria: 'PERSONAL',
    preguntas: [
      '¿Cómo genera el asesor confianza en clientes, compañeros y líderes?',
      '¿Es coherente entre lo que dice y lo que hace?',
      '¿Cumple con los compromisos que asume?',
      '¿Cómo maneja la información confidencial y respeta a los demás?'
    ]
  },
  {
    id: 'experiencia_cliente',
    nombre: 'Experiencia del Cliente (CX)',
    categoria: 'NEGOCIO',
    preguntas: [
      '¿Cómo genera el asesor experiencias positivas en cada interacción con el cliente?',
      '¿Se anticipa a las necesidades del cliente o solo responde cuando se lo solicitan?',
      '¿Qué nivel de empatía y vocación de servicio demuestra?',
      '¿Transforma situaciones difíciles en experiencias positivas?'
    ]
  },
  {
    id: 'orientacion_resultados',
    nombre: 'Orientación a Resultados',
    categoria: 'LOGRO Y ACCIÓN',
    preguntas: [
      '¿Cómo se enfoca el asesor en lograr los objetivos con eficiencia y calidad?',
      '¿Prioriza las acciones que generan mayor valor?',
      '¿Qué hace cuando se enfrenta a obstáculos para alcanzar sus metas?',
      '¿Hace seguimiento de sus avances y ajusta cuando es necesario?'
    ]
  },
  {
    id: 'orientacion_comercial',
    nombre: 'Orientación Comercial / Mercado',
    categoria: 'NEGOCIO',
    preguntas: [
      '¿Cómo detecta el asesor oportunidades que aporten valor al negocio?',
      '¿Entiende las necesidades reales de los clientes y propone soluciones?',
      '¿Piensa estratégicamente sobre el impacto de su trabajo en el negocio?',
      '¿Genera valor tanto para el cliente como para Konecta?'
    ]
  },
  {
    id: 'prospectiva_estrategica',
    nombre: 'Prospectiva Estratégica (Visión Estratégica)',
    categoria: 'NEGOCIO',
    preguntas: [
      '¿Cómo anticipa el asesor escenarios futuros y tendencias del mercado?',
      '¿Considera el impacto de las decisiones a largo plazo?',
      '¿Integra conocimiento del mercado y la dinámica organizacional en su trabajo?',
      '¿Diseña estrategias sostenibles y adaptables?'
    ]
  }
]

function EvaluacionCompetencias() {
  const [nombreAsesor, setNombreAsesor] = useState('')
  const [tieneMATEAnterior, setTieneMATEAnterior] = useState(null)
  const [archivoMATE, setArchivoMATE] = useState(null)
  const [datosMATEAnterior, setDatosMATEAnterior] = useState(null)
  const [procesandoPDF, setProcesandoPDF] = useState(false)
  const [paso, setPaso] = useState('inicio') // inicio, mate_anterior, resumen_mate, preguntas, resultado
  const [respuestas, setRespuestas] = useState({})
  const [evoluciones, setEvoluciones] = useState({}) // {competencia_id: {estado: 'mantiene'|'mejora'|'empeora', razon: ''}}
  const [perfilGenerado, setPerfilGenerado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [listoParaGuardar, setListoParaGuardar] = useState(false)
  const fileInputRef = useRef(null)

  // Cargar datos guardados al iniciar (solo una vez)
  useEffect(() => {
    try {
      const datosGuardados = localStorage.getItem(STORAGE_KEY)
      if (datosGuardados) {
        const datos = JSON.parse(datosGuardados)
        setNombreAsesor(datos.nombreAsesor || '')
        setTieneMATEAnterior(datos.tieneMATEAnterior ?? null)
        setDatosMATEAnterior(datos.datosMATEAnterior || null)
        setPaso(datos.paso || 'inicio')
        setRespuestas(datos.respuestas || {})
        setEvoluciones(datos.evoluciones || {})
      }
      // Marcar como listo para guardar después de cargar (o si no hay datos)
      setListoParaGuardar(true)
    } catch (error) {
      console.error('Error al cargar datos guardados:', error)
      localStorage.removeItem(STORAGE_KEY)
      setListoParaGuardar(true)
    }
  }, [])

  // Guardar en localStorage cuando cambien los datos importantes
  useEffect(() => {
    // No guardar si aún no se cargó desde storage o si estamos en inicio/resultado
    if (!listoParaGuardar || paso === 'inicio' || paso === 'resultado') {
      return
    }

    try {
      const datosAGuardar = {
        nombreAsesor,
        tieneMATEAnterior,
        datosMATEAnterior,
        paso,
        respuestas,
        evoluciones
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datosAGuardar))
    } catch (error) {
      console.error('Error al guardar en localStorage:', error)
    }
  }, [nombreAsesor, tieneMATEAnterior, datosMATEAnterior, paso, respuestas, evoluciones, listoParaGuardar])

  const limpiarLocalStorage = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleDescargarPDF = () => {
    if (!perfilGenerado) return

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      let yPos = margin

      // Configurar fuente y colores
      doc.setFontSize(20)
      doc.setTextColor(15, 15, 114) // #0F0F72
      doc.setFont('helvetica', 'bold')
      
      // Título
      doc.text('Perfil de Competencias Generado', margin, yPos)
      yPos += 10

      // Información del asesor
      doc.setFontSize(14)
      doc.setTextColor(40, 0, 200) // #2800c8
      doc.setFont('helvetica', 'normal')
      doc.text(`Asesor: ${nombreAsesor}`, margin, yPos)
      yPos += 8

      if (datosMATEAnterior) {
        doc.setFontSize(10)
        doc.setTextColor(166, 135, 255) // #A687FF
        doc.text(`Comparado con MATE anterior (${datosMATEAnterior.periodo || 'período anterior'})`, margin, yPos)
        yPos += 10
      }

      // Contenido del perfil - limpiar primero
      const perfilLimpio = perfilGenerado
        .split('\n')
        .map(line => {
          let linea = line.trim()
          // Eliminar # de markdown headers
          linea = linea.replace(/^#+\s*/, '')
          // Eliminar líneas que solo contienen guiones o caracteres especiales
          if (/^[-=_*]{3,}$/.test(linea) || /^[-=_*]+$/.test(linea)) {
            return null // Marcar para eliminar
          }
          return linea
        })
        .filter(line => line !== null && line.length > 0) // Eliminar líneas vacías y marcadas
        .join('\n')

      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const lineHeight = 6
      const lines = doc.splitTextToSize(perfilLimpio, maxWidth)

      lines.forEach((line) => {
        // Verificar si necesitamos una nueva página
        if (yPos > pageHeight - margin - 10) {
          doc.addPage()
          yPos = margin
        }

        // Detectar títulos y subtítulos
        const trimmedLine = line.trim()
        
        // Saltar líneas que solo son separadores
        if (/^[-=_*]{2,}$/.test(trimmedLine)) {
          return
        }
        
        if (/^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmedLine) || 
            (trimmedLine.length < 80 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && !trimmedLine.includes(':'))) {
          // Es un título
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(40, 0, 200) // #2800c8
          doc.text(trimmedLine, margin, yPos)
          yPos += lineHeight + 2
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
        } else if (trimmedLine.endsWith(':') && trimmedLine.length < 60) {
          // Es un subtítulo
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(40, 0, 200) // #2800c8
          doc.text(trimmedLine, margin, yPos)
          yPos += lineHeight + 1
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
        } else {
          // Texto normal
          // Procesar negritas (**texto** o *texto*) y limpiar caracteres markdown
          let texto = trimmedLine
            .replace(/^#+\s*/, '') // Eliminar # restantes
            .replace(/^[-=_*]{2,}\s*/, '') // Eliminar separadores markdown
          texto = texto.replace(/\*\*([^*]+)\*\*/g, '$1') // Remover ** pero mantener el texto
          texto = texto.replace(/\*([^*]+)\*/g, '$1') // Remover * pero mantener el texto
          
          if (texto.trim().length > 0) {
            doc.text(texto, margin, yPos)
            yPos += lineHeight
          }
        }
      })

      // Guardar el PDF
      const nombreArchivo = `Perfil_Competencias_${nombreAsesor.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nombreArchivo)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      setError('Error al generar el PDF. Por favor, intenta nuevamente.')
    }
  }

  const handleIniciar = () => {
    if (nombreAsesor.trim()) {
      setPaso('mate_anterior')
    }
  }

  const handleTieneMATEAnterior = (tiene) => {
    setTieneMATEAnterior(tiene)
    if (!tiene) {
      // Si no tiene MATE anterior, ir directo a preguntas
      iniciarPreguntas()
    }
  }

  const handleArchivoSeleccionado = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Por favor, selecciona un archivo PDF válido.')
      return
    }

    setArchivoMATE(file)
    setProcesandoPDF(true)
    setError(null)

    try {
      const datos = await procesarPDFMATE(file)
      setDatosMATEAnterior(datos)
      setProcesandoPDF(false)
    } catch (err) {
      setError(err.message || 'Error al procesar el PDF')
      setProcesandoPDF(false)
    }
  }

  const iniciarPreguntas = () => {
    // Si hay MATE anterior, mostrar resumen primero
    if (datosMATEAnterior && Object.keys(datosMATEAnterior.competencias).length > 0) {
      setPaso('resumen_mate')
    } else {
      setPaso('preguntas')
      inicializarRespuestas()
    }
  }

  const inicializarRespuestas = () => {
    // Inicializar respuestas vacías
    const respuestasIniciales = {}
    const evolucionesIniciales = {}
    
    COMPETENCIAS.forEach(comp => {
      // Si hay MATE anterior, inicializar evolución por competencia (no por pregunta)
      if (datosMATEAnterior?.competencias[comp.id]) {
        evolucionesIniciales[comp.id] = {
          estado: '',
          razon: ''
        }
        // Solo inicializar respuestas si mejora o empeora (se inicializarán cuando se seleccione)
      } else {
        // Si no hay MATE anterior, inicializar todas las respuestas normalmente
        comp.preguntas.forEach((pregunta, idx) => {
          respuestasIniciales[`${comp.id}_${idx}`] = ''
        })
      }
    })
    
    setRespuestas(respuestasIniciales)
    setEvoluciones(evolucionesIniciales)
  }

  const handleContinuarDesdeResumen = () => {
    setPaso('preguntas')
    inicializarRespuestas()
  }

  const handleContinuarConPDF = () => {
    if (datosMATEAnterior) {
      iniciarPreguntas()
    }
  }


  const handleCambiarRespuesta = (key, value) => {
    setRespuestas(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleCambiarEvolucion = (competenciaId, campo, value) => {
    setEvoluciones(prev => {
      const nuevaEvolucion = {
        ...(prev[competenciaId] || {}),
        [campo]: value
      }
      
      // Si cambia el estado y es "mantiene", limpiar las respuestas de esa competencia
      if (campo === 'estado') {
        if (value === 'mantiene') {
          // Limpiar respuestas de esta competencia
          const nuevasRespuestas = { ...respuestas }
          COMPETENCIAS.find(c => c.id === competenciaId)?.preguntas.forEach((_, idx) => {
            delete nuevasRespuestas[`${competenciaId}_${idx}`]
          })
          setRespuestas(nuevasRespuestas)
        } else if (value === 'mejora' || value === 'empeora') {
          // Inicializar respuestas vacías para esta competencia
          const nuevasRespuestas = { ...respuestas }
          COMPETENCIAS.find(c => c.id === competenciaId)?.preguntas.forEach((_, idx) => {
            if (!nuevasRespuestas[`${competenciaId}_${idx}`]) {
              nuevasRespuestas[`${competenciaId}_${idx}`] = ''
            }
          })
          setRespuestas(nuevasRespuestas)
        }
      }
      
      return {
        ...prev,
        [competenciaId]: nuevaEvolucion
      }
    })
  }

  const handleGenerarPerfil = async () => {
    setCargando(true)
    setError(null)

    try {
      // Construir el prompt con las respuestas
      let contextoMATEAnterior = ''
      if (datosMATEAnterior) {
        contextoMATEAnterior = `\n\nINFORMACIÓN DEL MATE ANTERIOR (${datosMATEAnterior.periodo || 'Período anterior'}):\n`
        Object.entries(datosMATEAnterior.competencias).forEach(([id, info]) => {
          const competencia = COMPETENCIAS.find(c => c.id === id)
          if (competencia) {
            contextoMATEAnterior += `\n${competencia.nombre} - Nivel ${info.nivel}:\n`
            if (info.descripcion) contextoMATEAnterior += `Descripción: ${info.descripcion}\n`
            if (info.observaciones) contextoMATEAnterior += `Observaciones: ${info.observaciones}\n`
          }
        })
      }

      const respuestasTexto = COMPETENCIAS.map(comp => {
        const infoAnterior = datosMATEAnterior?.competencias[comp.id]
        const evolucion = evoluciones[comp.id]
        
        let competenciaTexto = `\n\n${comp.nombre} (${comp.categoria}):`
        
        // Si hay MATE anterior, incluir información de evolución
        if (infoAnterior && evolucion) {
          competenciaTexto += `\nEstado en MATE anterior: Nivel ${infoAnterior.nivel}`
          if (infoAnterior.observaciones) {
            competenciaTexto += `\nObservaciones anteriores: ${infoAnterior.observaciones}`
          }
          competenciaTexto += `\nEvolución: ${evolucion.estado}`
          
          // Si mantiene, no hay respuestas
          if (evolucion.estado === 'mantiene') {
            competenciaTexto += `\nEvaluación: Mantiene el mismo nivel del MATE anterior. No se requieren preguntas adicionales.`
          } else {
            // Si mejora o empeora, incluir todas las respuestas
            const respuestasComp = comp.preguntas.map((pregunta, idx) => {
              const key = `${comp.id}_${idx}`
              const respuesta = respuestas[key]
              if (!respuesta) return null
              return `P: ${pregunta}\nR: ${respuesta}`
            }).filter(Boolean).join('\n\n')
            
            if (respuestasComp) {
              competenciaTexto += `\n\n${respuestasComp}`
            }
          }
        } else {
          // Si no hay MATE anterior, respuestas normales
          const respuestasComp = comp.preguntas.map((pregunta, idx) => {
            const key = `${comp.id}_${idx}`
            const respuesta = respuestas[key]
            if (!respuesta) return null
            return `P: ${pregunta}\nR: ${respuesta}`
          }).filter(Boolean).join('\n\n')
          
          if (respuestasComp) {
            competenciaTexto += `\n\n${respuestasComp}`
          }
        }
        
        return competenciaTexto
      }).filter(ct => {
        // Filtrar competencias que tienen contenido (evolución o respuestas)
        return ct.includes('Estado en MATE anterior') || ct.includes('P:') || ct.includes('Evaluación:')
      }).join('\n')

      const prompt = `Eres un experto en evaluación de competencias laborales de Konecta. Basándote en el Manual de Desarrollo de Competencias de Konecta CONO SUR 2025 y las siguientes respuestas del líder sobre el asesor ${nombreAsesor}, genera un perfil completo de competencias.

${contextoMATEAnterior}

El Manual de Competencias de Konecta organiza las competencias en cuatro categorías:
- PERSONAL: Cómo es la persona y cómo se maneja (Mentalidad Ágil, Engagement, Confianza)
- RELACIONAL: Cómo trabaja con otros y se comunica (Comunicación Digital, Colaboración Remota)
- LOGRO Y ACCIÓN: Cómo alcanza resultados (Foco en Data, Learning Agility, Orientación a Resultados)
- NEGOCIO: Foco en el negocio, clientes y contexto (Mindset Digital, Liderazgo Konecta, Experiencia del Cliente, Orientación Comercial, Prospectiva Estratégica)

${datosMATEAnterior ? 'EVALUACIÓN ACTUAL (comparando con MATE anterior):' : 'EVALUACIÓN ACTUAL:'}

${respuestasTexto}

Por favor, genera un perfil detallado y profesional que incluya:
1. Resumen ejecutivo del perfil del asesor${datosMATEAnterior ? ' comparando con el MATE anterior' : ''}
2. Evaluación detallada por cada competencia evaluada, indicando el nivel de desarrollo (Excelente Desarrollo, Desarrollado, o Necesita Desarrollo)${datosMATEAnterior ? ' y la evolución respecto al MATE anterior' : ''}
3. Fortalezas identificadas agrupadas por categoría
4. Áreas de oportunidad con recomendaciones específicas${datosMATEAnterior ? ', destacando mejoras o retrocesos respecto al MATE anterior' : ''}
5. Plan de desarrollo con acciones concretas basadas en el manual${datosMATEAnterior ? ' y considerando la evolución mostrada' : ''}

Formatea la respuesta de manera clara, profesional y estructurada, usando el lenguaje y los criterios del Manual de Competencias de Konecta.`

      const perfil = await generarPerfil(prompt, nombreAsesor)
      setPerfilGenerado(perfil)
      setPaso('resultado')
      // Limpiar localStorage cuando se genera el perfil exitosamente
      limpiarLocalStorage()
    } catch (err) {
      setError('Error al generar el perfil. Por favor, intenta nuevamente.')
      console.error('Error:', err)
    } finally {
      setCargando(false)
    }
  }

  const handleNuevaEvaluacion = () => {
    setNombreAsesor('')
    setTieneMATEAnterior(null)
    setArchivoMATE(null)
    setDatosMATEAnterior(null)
    setPaso('inicio')
    setRespuestas({})
    setEvoluciones({})
    setPerfilGenerado(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    limpiarLocalStorage()
  }

  if (paso === 'inicio') {
    return (
      <div className="evaluacion-container">
        <div className="evaluacion-card">
          <h1>Evaluación de Competencias</h1>
          <p className="subtitulo">Sistema de evaluación basado en el Manual de Competencias</p>
          
          <div className="input-group">
            <label htmlFor="nombre-asesor">Nombre del Asesor</label>
            <input
              id="nombre-asesor"
              type="text"
              value={nombreAsesor}
              onChange={(e) => setNombreAsesor(e.target.value)}
              placeholder="Ingresa el nombre completo del asesor"
              onKeyPress={(e) => e.key === 'Enter' && handleIniciar()}
            />
          </div>

          <button 
            className="btn-primary"
            onClick={handleIniciar}
            disabled={!nombreAsesor.trim()}
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  if (paso === 'mate_anterior') {
    return (
      <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>MATE Anterior</h1>
            <p className="nombre-asesor">Asesor: <strong>{nombreAsesor}</strong></p>
          </div>

          {tieneMATEAnterior === null ? (
            <>
              <p className="pregunta-mate">¿El asesor ya tuvo un MATE anteriormente?</p>
              <div className="opciones-mate">
                <button 
                  className="btn-primary"
                  onClick={() => handleTieneMATEAnterior(true)}
                >
                  Sí
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => handleTieneMATEAnterior(false)}
                >
                  No
                </button>
              </div>
            </>
          ) : tieneMATEAnterior ? (
            <>
              <div className="input-group">
                <label htmlFor="archivo-mate">Cargar MATE Anterior (PDF)</label>
                <input
                  id="archivo-mate"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleArchivoSeleccionado}
                  className="file-input"
                />
                {procesandoPDF && (
                  <p className="procesando">Procesando PDF...</p>
                )}
                {datosMATEAnterior && (
                  <div className="mate-procesado">
                    <p className="success-message">✓ MATE procesado correctamente</p>
                    {datosMATEAnterior.periodo && (
                      <p>Período: {datosMATEAnterior.periodo}</p>
                    )}
                    <p>Competencias encontradas: {Object.keys(datosMATEAnterior.competencias).length}</p>
                  </div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="acciones">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setPaso('inicio')
                    setTieneMATEAnterior(null)
                    setArchivoMATE(null)
                    setDatosMATEAnterior(null)
                  }}
                >
                  Volver
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleContinuarConPDF}
                  disabled={!datosMATEAnterior || procesandoPDF}
                >
                  Continuar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  if (paso === 'resumen_mate') {
    return (
      <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Resumen del MATE Anterior</h1>
            <p className="nombre-asesor">Asesor: <strong>{nombreAsesor}</strong></p>
            {datosMATEAnterior.periodo && (
              <p className="mate-anterior-info">Período: {datosMATEAnterior.periodo}</p>
            )}
          </div>

          <div className="resumen-mate-container">
            <h3>Competencias Evaluadas en el MATE Anterior</h3>
            <div className="competencias-resumen">
              {COMPETENCIAS.map(comp => {
                const infoAnterior = datosMATEAnterior.competencias[comp.id]
                if (!infoAnterior) return null

                return (
                  <div key={comp.id} className="competencia-resumen-item">
                    <div className="competencia-resumen-header">
                      <h4>{comp.nombre}</h4>
                      <span className={`nivel-badge nivel-${infoAnterior.nivel}`}>Nivel {infoAnterior.nivel}</span>
                    </div>
                    {infoAnterior.descripcion && (
                      <p className="descripcion-resumen">{infoAnterior.descripcion.substring(0, 200)}...</p>
                    )}
                    {infoAnterior.observaciones && (
                      <p className="observaciones-resumen">
                        <strong>Observaciones:</strong> {infoAnterior.observaciones}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="acciones">
            <button 
              className="btn-secondary"
              onClick={() => setPaso('mate_anterior')}
            >
              Volver
            </button>
            <button 
              className="btn-primary"
              onClick={handleContinuarDesdeResumen}
            >
              Continuar con Evaluación
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paso === 'preguntas') {
    // Validar que todas las competencias estén evaluadas
    const todasRespondidas = COMPETENCIAS.every(comp => {
      const infoAnterior = datosMATEAnterior?.competencias[comp.id]
      
      if (infoAnterior) {
        // Si hay MATE anterior, validar evolución a nivel de competencia
        const evol = evoluciones[comp.id]
        if (!evol?.estado) return false
        
        // Si mantiene, no necesita respuestas
        if (evol.estado === 'mantiene') return true
        
        // Si mejora o empeora, necesita responder todas las preguntas
        return comp.preguntas.every((_, idx) => {
          const key = `${comp.id}_${idx}`
          return respuestas[key]?.trim() !== ''
        })
      } else {
        // Si no hay MATE anterior, validar respuestas normales
        return comp.preguntas.every((_, idx) => {
          const key = `${comp.id}_${idx}`
          return respuestas[key]?.trim() !== ''
        })
      }
    })
    
    return (
      <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Evaluación de Competencias</h1>
            <p className="nombre-asesor">Asesor: <strong>{nombreAsesor}</strong></p>
            {datosMATEAnterior && (
              <p className="mate-anterior-info">Comparando con MATE anterior ({datosMATEAnterior.periodo || 'período anterior'})</p>
            )}
          </div>

          <div className="preguntas-container">
            {COMPETENCIAS.map((competencia) => {
              const infoAnterior = datosMATEAnterior?.competencias[competencia.id]
              const evolucion = evoluciones[competencia.id]
              const mostrarPreguntas = !infoAnterior || (evolucion?.estado && evolucion.estado !== 'mantiene')
              
              return (
                <div key={competencia.id} className="competencia-section">
                  <div className="competencia-header">
                    <div className="competencia-header-left">
                      <h2 className="competencia-titulo">{competencia.nombre}</h2>
                      {infoAnterior && (
                        <span className={`nivel-badge nivel-${infoAnterior.nivel}`}>
                          MATE Anterior: Nivel {infoAnterior.nivel}
                        </span>
                      )}
                    </div>
                    <span className="competencia-categoria">{competencia.categoria}</span>
                  </div>

                  {infoAnterior && (
                    <div className="mate-anterior-box-competencias">
                      {infoAnterior.observaciones && (
                        <p className="observaciones-anteriores">
                          <strong>Observaciones del MATE anterior:</strong> {infoAnterior.observaciones}
                        </p>
                      )}
                      
                      <div className="evolucion-group-competencias">
                        <label className="label-evolucion">Evolución respecto al MATE anterior:</label>
                        <select
                          value={evolucion?.estado || ''}
                          onChange={(e) => handleCambiarEvolucion(competencia.id, 'estado', e.target.value)}
                          className="select-evolucion"
                        >
                          <option value="">Selecciona...</option>
                          <option value="mantiene">Mantiene</option>
                          <option value="mejora">Mejora</option>
                          <option value="empeora">Empeora</option>
                        </select>
                        
                        {evolucion?.estado === 'mantiene' && (
                          <p className="mensaje-mantiene">
                            No se requieren preguntas adicionales. La competencia se mantiene en el mismo nivel.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mostrarPreguntas && (
                    <div className="preguntas-competencia">
                      {competencia.preguntas.map((pregunta, idx) => {
                        const key = `${competencia.id}_${idx}`
                        return (
                          <div key={key} className="pregunta-item">
                            <label className="pregunta-label">{pregunta}</label>
                            <textarea
                              className="respuesta-textarea"
                              value={respuestas[key] || ''}
                              onChange={(e) => handleCambiarRespuesta(key, e.target.value)}
                              placeholder={
                                infoAnterior && evolucion?.estado === 'mejora'
                                  ? 'Describe cómo mejoró en esta competencia...'
                                  : infoAnterior && evolucion?.estado === 'empeora'
                                  ? 'Explica qué factores causaron el empeoramiento...'
                                  : 'Escribe tu respuesta aquí...'
                              }
                              rows="4"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="acciones">
            <button 
              className="btn-secondary"
              onClick={() => setPaso('mate_anterior')}
            >
              Volver
            </button>
            <button 
              className="btn-primary"
              onClick={handleGenerarPerfil}
              disabled={!todasRespondidas || cargando}
            >
              {cargando ? 'Generando Perfil...' : 'Generar Perfil'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          {cargando && (
            <div className="loading-container">
              <div className="loading-bar">
                <div className="loading-bar-fill"></div>
              </div>
              <p className="loading-text">Generando perfil con IA... Esto puede tomar unos momentos</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (paso === 'resultado') {
    return (
      <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Perfil de Competencias Generado</h1>
            <p className="nombre-asesor">Asesor: <strong>{nombreAsesor}</strong></p>
            {datosMATEAnterior && (
              <p className="mate-anterior-info">Comparado con MATE anterior ({datosMATEAnterior.periodo || 'período anterior'})</p>
            )}
          </div>

          <div className="perfil-container">
            <div className="perfil-contenido">
              {perfilGenerado ? (
                <div className="perfil-texto">
                  {(() => {
                    // Limpiar el texto antes de procesarlo
                    const lineasLimpias = perfilGenerado
                      .split('\n')
                      .map(line => {
                        let linea = line.trim()
                        // Eliminar # de markdown headers
                        linea = linea.replace(/^#+\s*/, '')
                        // Eliminar líneas que solo contienen guiones o caracteres especiales
                        if (/^[-=_*]{3,}$/.test(linea) || /^[-=_*]+$/.test(linea)) {
                          return null // Marcar para eliminar
                        }
                        return linea
                      })
                      .filter(line => line !== null && line.length > 0) // Eliminar líneas vacías y marcadas
                    
                    return lineasLimpias.map((line, i) => {
                      const trimmedLine = line.trim()
                      if (!trimmedLine) return <br key={i} />
                      
                      // Función para convertir asteriscos a negrita
                      const formatearTexto = (texto, lineKey) => {
                        if (!texto) return texto
                        
                        // Limpiar caracteres markdown adicionales
                        let textoLimpio = texto
                          .replace(/^#+\s*/, '') // Eliminar # restantes
                          .replace(/^[-=_*]{2,}\s*/, '') // Eliminar separadores markdown
                        
                        // Primero procesar **texto** (negrita doble)
                        const partes = textoLimpio.split(/(\*\*[^*]+\*\*)/g)
                        const resultado = []
                        let keyCounter = 0
                        
                        partes.forEach((parte) => {
                          if (parte.startsWith('**') && parte.endsWith('**')) {
                            // Es negrita doble
                            resultado.push(<strong key={`${lineKey}-${keyCounter++}`}>{parte.slice(2, -2)}</strong>)
                          } else if (parte) {
                            // Procesar *texto* simple dentro de esta parte
                            const subPartes = parte.split(/(\*[^*]+\*)/g)
                            subPartes.forEach((subParte) => {
                              if (subParte.startsWith('*') && subParte.endsWith('*') && subParte.length > 2) {
                                resultado.push(<strong key={`${lineKey}-${keyCounter++}`}>{subParte.slice(1, -1)}</strong>)
                              } else if (subParte) {
                                resultado.push(subParte)
                              }
                            })
                          }
                        })
                        
                        return resultado.length > 0 ? resultado : textoLimpio
                      }
                      
                      // Detectar títulos principales (números seguidos de punto o texto en mayúsculas corto)
                      if (/^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmedLine) || 
                          (trimmedLine.length < 80 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && !trimmedLine.includes(':'))) {
                        return <h3 key={i} className="perfil-titulo">{formatearTexto(trimmedLine, i)}</h3>
                      }
                      
                      // Detectar subtítulos (texto que termina en : o que es corto y tiene formato especial)
                      if (trimmedLine.endsWith(':') && trimmedLine.length < 60 && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•')) {
                        return <h4 key={i} className="perfil-subtitulo">{formatearTexto(trimmedLine, i)}</h4>
                      }
                      
                      // Detectar listas (pero no líneas que solo son guiones)
                      if ((trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || (trimmedLine.startsWith('*') && !trimmedLine.startsWith('**'))) 
                          && !/^[-•*]{2,}$/.test(trimmedLine)) {
                        const textoLista = trimmedLine.replace(/^[-•*]\s*/, '')
                        return <p key={i} className="perfil-lista">{formatearTexto(textoLista, i)}</p>
                      }
                      
                      // Texto normal
                      return <p key={i}>{formatearTexto(trimmedLine, i)}</p>
                    })
                  })()}
                </div>
              ) : (
                <p>No se pudo generar el perfil.</p>
              )}
            </div>
          </div>

          <div className="acciones">
            <button 
              className="btn-secondary"
              onClick={handleDescargarPDF}
              disabled={!perfilGenerado}
            >
              Descargar PDF
            </button>
            <button 
              className="btn-primary"
              onClick={handleNuevaEvaluacion}
            >
              Nueva Evaluación
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default EvaluacionCompetencias
