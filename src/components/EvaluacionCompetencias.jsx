import { useState, useRef, useEffect } from 'react'
import { generarPerfil } from '../services/geminiService'
import { procesarPDFMATE } from '../services/pdfProcessor'
import { jsPDF } from 'jspdf'
import './EvaluacionCompetencias.css'

const STORAGE_KEY = 'mate_evaluacion_progreso'

// Preguntas adicionales para profundizar en mejora/empeora
const PREGUNTAS_PROFUNDIZACION = {
  mejora: [
    '¿Qué acciones específicas tomó el asesor que llevaron a esta mejora?',
    '¿Qué factores del entorno o del equipo contribuyeron a este avance?',
    '¿Cómo se puede mantener y potenciar esta mejora en el futuro?',
    '¿Qué recursos o apoyo adicional necesitaría para seguir mejorando?'
  ],
  empeora: [
    '¿Qué factores específicos causaron este retroceso?',
    '¿Hubo cambios en el entorno, procesos o equipo que impactaron negativamente?',
    '¿Qué acciones se pueden tomar para revertir esta situación?',
    '¿Qué tipo de apoyo o recursos necesita el asesor para recuperar el nivel anterior?'
  ]
}

// Competencias que son solo para Líderes (no para Asesores)
const COMPETENCIAS_SOLO_LIDERES = [
  'colaboracion_remota',
  'mindset_digital',
  'liderazgo_konecta',
  'prospectiva_estrategica'
]

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

function EvaluacionCompetencias({ user, onLogout, onReiniciarMATE }) {
  const [nombreAsesor, setNombreAsesor] = useState('')
  const [tipoEvaluacion, setTipoEvaluacion] = useState(null) // 'asesor' o 'lider'
  const [tieneMATEAnterior, setTieneMATEAnterior] = useState(null)
  const [archivoMATE, setArchivoMATE] = useState(null)
  const [datosMATEAnterior, setDatosMATEAnterior] = useState(null)
  const [procesandoPDF, setProcesandoPDF] = useState(false)
  const [paso, setPaso] = useState('inicio') // inicio, tipo_evaluacion, mate_anterior, resumen_mate, preguntas, resultado
  const [respuestas, setRespuestas] = useState({})
  const [evoluciones, setEvoluciones] = useState({}) // {competencia_id: {estado: 'mantiene'|'mejora'|'empeora', razon: ''}}
  const [perfilGenerado, setPerfilGenerado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [listoParaGuardar, setListoParaGuardar] = useState(false)
  const [metricas, setMetricas] = useState({
    kpis: [], // Array de KPIs: [{ nombrePDF, nombre, valor, comentarios }]
    comentarios: '', // Comentarios generales
    pasa: '' // Pasa
  })
  const [mostrarModalReiniciar, setMostrarModalReiniciar] = useState(false)
  const fileInputRef = useRef(null)

  // Filtrar competencias según el tipo de evaluación
  const competenciasFiltradas = tipoEvaluacion === 'asesor'
    ? COMPETENCIAS.filter(comp => !COMPETENCIAS_SOLO_LIDERES.includes(comp.id))
    : COMPETENCIAS

  // Cargar datos guardados al iniciar (solo una vez)
  useEffect(() => {
    try {
      const datosGuardados = localStorage.getItem(STORAGE_KEY)
      if (datosGuardados) {
        const datos = JSON.parse(datosGuardados)
        setNombreAsesor(datos.nombreAsesor || '')
        setTipoEvaluacion(datos.tipoEvaluacion || null)
        setTieneMATEAnterior(datos.tieneMATEAnterior ?? null)
        setDatosMATEAnterior(datos.datosMATEAnterior || null)
        setPaso(datos.paso || 'inicio')
        setRespuestas(datos.respuestas || {})
        setEvoluciones(datos.evoluciones || {})
        // Manejar migración de formato antiguo (string) a nuevo (objeto)
        if (datos.metricas) {
          if (typeof datos.metricas === 'string') {
            // Formato antiguo: convertir a nuevo formato
            setMetricas({ kpis: [], comentarios: datos.metricas, pasa: '' })
          } else if (typeof datos.metricas === 'object') {
            // Asegurarse de que tenga la estructura correcta
            setMetricas({
              kpis: Array.isArray(datos.metricas.kpis) ? datos.metricas.kpis : [],
              comentarios: datos.metricas.comentarios || '',
              pasa: datos.metricas.pasa || ''
            })
          } else {
            setMetricas({ kpis: [], comentarios: '', pasa: '' })
          }
        } else {
          setMetricas({ kpis: [], comentarios: '', pasa: '' })
        }
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
        tipoEvaluacion,
        tieneMATEAnterior,
        datosMATEAnterior,
        paso,
        respuestas,
        evoluciones,
        metricas
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datosAGuardar))
    } catch (error) {
      console.error('Error al guardar en localStorage:', error)
    }
  }, [nombreAsesor, tipoEvaluacion, tieneMATEAnterior, datosMATEAnterior, paso, respuestas, evoluciones, metricas, listoParaGuardar])

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

      // Contenido del perfil - procesar con mejor detección de jerarquías
      const lineas = perfilGenerado.split('\n')
      const lineHeight = 6
      const lineHeightSmall = 5

      lineas.forEach((lineaOriginal) => {
        // Verificar si necesitamos una nueva página
        if (yPos > pageHeight - margin - 15) {
          doc.addPage()
          yPos = margin
        }

        let linea = lineaOriginal.trim()
        
        // Saltar líneas vacías o separadores
        if (!linea || /^[-=_*]{3,}$/.test(linea)) {
          yPos += lineHeightSmall
          return
        }

        // Detectar títulos principales (## o números seguidos de punto)
        if (/^##\s+/.test(linea) || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(linea)) {
          yPos += 5 // Espacio antes del título
          linea = linea.replace(/^##\s+/, '').replace(/^\d+\.\s+/, '')
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 15, 114) // #0F0F72
          const lineasTexto = doc.splitTextToSize(linea, maxWidth)
          lineasTexto.forEach((l, idx) => {
            if (yPos > pageHeight - margin - 10) {
              doc.addPage()
              yPos = margin
            }
            doc.text(l, margin, yPos)
            yPos += lineHeight + 2
          })
          // Línea decorativa
          doc.setDrawColor(166, 135, 255) // #A687FF
          doc.setLineWidth(0.5)
          doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2)
          yPos += 3
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          return
        }

        // Detectar subtítulos (### o texto que termina en :)
        if (/^###\s+/.test(linea) || (linea.endsWith(':') && linea.length < 70 && !linea.startsWith('-') && !linea.startsWith('•'))) {
          yPos += 3 // Espacio antes del subtítulo
          linea = linea.replace(/^###\s+/, '')
          doc.setFontSize(13)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(40, 0, 200) // #2800c8
          const lineasTexto = doc.splitTextToSize(linea, maxWidth)
          lineasTexto.forEach((l) => {
            if (yPos > pageHeight - margin - 10) {
              doc.addPage()
              yPos = margin
            }
            doc.text(l, margin, yPos)
            yPos += lineHeight + 1
          })
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          return
        }

        // Detectar niveles de competencia destacados
        if (/Nivel:\s*(Excelente Desarrollo|Desarrollado|Necesita Desarrollo)/i.test(linea) ||
            /\*\*Nivel:\*\*\s*(Excelente Desarrollo|Desarrollado|Necesita Desarrollo)/i.test(linea)) {
          yPos += 2
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          // Color según el nivel
          if (/Excelente Desarrollo/i.test(linea)) {
            doc.setTextColor(46, 125, 50) // Verde oscuro
          } else if (/Desarrollado/i.test(linea)) {
            doc.setTextColor(25, 118, 210) // Azul
          } else {
            doc.setTextColor(211, 47, 47) // Rojo
          }
          linea = linea.replace(/\*\*/g, '').replace(/Nivel:\s*/i, 'Nivel: ')
          const lineasTexto = doc.splitTextToSize(linea, maxWidth)
          lineasTexto.forEach((l) => {
            if (yPos > pageHeight - margin - 10) {
              doc.addPage()
              yPos = margin
            }
            doc.text(l, margin, yPos)
            yPos += lineHeight + 1
          })
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          return
        }

        // Detectar listas (viñetas)
        if ((linea.startsWith('-') || linea.startsWith('•') || linea.startsWith('*')) && !linea.startsWith('**')) {
          linea = linea.replace(/^[-•*]\s*/, '')
          // Procesar negritas en listas
          linea = linea.replace(/\*\*([^*]+)\*\*/g, '$1')
          linea = linea.replace(/\*([^*]+)\*/g, '$1')
          
          doc.setFontSize(11)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          
          // Viñeta
          doc.text('•', margin, yPos)
          const lineasTexto = doc.splitTextToSize(linea, maxWidth - 10)
          lineasTexto.forEach((l, idx) => {
            if (yPos > pageHeight - margin - 10) {
              doc.addPage()
              yPos = margin
            }
            doc.text(l, margin + 5, yPos)
            yPos += lineHeight
          })
          return
        }

        // Texto normal
        linea = linea
          .replace(/^#+\s*/, '')
          .replace(/^[-=_*]{2,}\s*/, '')
        
        // Procesar negritas manteniendo el formato
        const partes = linea.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
        let xPos = margin
        
        partes.forEach((parte) => {
          if (!parte) return
          
          if (parte.startsWith('**') && parte.endsWith('**')) {
            // Negrita doble
            const texto = parte.slice(2, -2)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            const width = doc.getTextWidth(texto)
            if (xPos + width > pageWidth - margin) {
              yPos += lineHeight
              xPos = margin
            }
            doc.text(texto, xPos, yPos)
            xPos += width
          } else if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
            // Negrita simple
            const texto = parte.slice(1, -1)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            const width = doc.getTextWidth(texto)
            if (xPos + width > pageWidth - margin) {
              yPos += lineHeight
              xPos = margin
            }
            doc.text(texto, xPos, yPos)
            xPos += width
          } else if (parte.trim()) {
            // Texto normal
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            const lineasTexto = doc.splitTextToSize(parte, maxWidth - (xPos - margin))
            lineasTexto.forEach((l, idx) => {
              if (yPos > pageHeight - margin - 10) {
                doc.addPage()
                yPos = margin
                xPos = margin
              }
              doc.text(l, xPos, yPos)
              yPos += lineHeight
              xPos = margin
            })
            xPos = margin
          }
        })
        
        if (xPos > margin) {
          yPos += lineHeight
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
      setPaso('tipo_evaluacion')
    }
  }

  const handleSeleccionarTipo = (tipo) => {
    setTipoEvaluacion(tipo)
    setPaso('mate_anterior')
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
      
      // Si se extrajeron métricas del PDF, llenar automáticamente el campo de métricas
      if (datos.metricas) {
        setMetricas({
          kpis: datos.metricas.kpis || [],
          comentarios: datos.metricas.comentarios || '',
          pasa: datos.metricas.pasa || ''
        })
      }
      
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
    
    competenciasFiltradas.forEach(comp => {
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
          // Limpiar respuestas de esta competencia (preguntas normales y de profundización)
          const nuevasRespuestas = { ...respuestas }
          competenciasFiltradas.find(c => c.id === competenciaId)?.preguntas.forEach((_, idx) => {
            delete nuevasRespuestas[`${competenciaId}_${idx}`]
          })
          // Limpiar también preguntas de profundización
          const preguntasProfundizacion = PREGUNTAS_PROFUNDIZACION[value] || []
          preguntasProfundizacion.forEach((_, idx) => {
            delete nuevasRespuestas[`${competenciaId}_prof_${idx}`]
          })
          setRespuestas(nuevasRespuestas)
        } else if (value === 'mejora' || value === 'empeora') {
          // Limpiar respuestas de preguntas normales y solo inicializar preguntas de profundización
          const nuevasRespuestas = { ...respuestas }
          // Limpiar preguntas de evaluación normales
          competenciasFiltradas.find(c => c.id === competenciaId)?.preguntas.forEach((_, idx) => {
            delete nuevasRespuestas[`${competenciaId}_${idx}`]
          })
          // Inicializar solo preguntas de profundización
          const preguntasProfundizacion = PREGUNTAS_PROFUNDIZACION[value] || []
          preguntasProfundizacion.forEach((_, idx) => {
            if (!nuevasRespuestas[`${competenciaId}_prof_${idx}`]) {
              nuevasRespuestas[`${competenciaId}_prof_${idx}`] = ''
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
            if (info.categoria) {
              const categoriaTexto = {
                'mantener': 'Mantener',
                'alentar': 'Alentar',
                'transformar': 'Transformar',
                'evitar': 'Evitar'
              }[info.categoria] || info.categoria
              contextoMATEAnterior += `Categoría en MATE anterior: ${categoriaTexto}\n`
            }
            if (info.descripcion) contextoMATEAnterior += `Descripción: ${info.descripcion}\n`
            if (info.observaciones) contextoMATEAnterior += `Observaciones: ${info.observaciones}\n`
          }
        })
      }

      const respuestasTexto = competenciasFiltradas.map(comp => {
        const infoAnterior = datosMATEAnterior?.competencias[comp.id]
        const evolucion = evoluciones[comp.id]
        
        let competenciaTexto = `\n\n${comp.nombre} (${comp.categoria}):`
        
        // Si hay MATE anterior, incluir información de evolución
        if (infoAnterior && evolucion) {
          competenciaTexto += `\nEstado en MATE anterior: Nivel ${infoAnterior.nivel}`
          if (infoAnterior.categoria) {
            const categoriaTexto = {
              'mantener': 'Mantener',
              'alentar': 'Alentar',
              'transformar': 'Transformar',
              'evitar': 'Evitar'
            }[infoAnterior.categoria] || infoAnterior.categoria
            competenciaTexto += `\nCategoría en MATE anterior: ${categoriaTexto}`
          }
          if (infoAnterior.observaciones) {
            competenciaTexto += `\nObservaciones anteriores: ${infoAnterior.observaciones}`
          }
          competenciaTexto += `\nEvolución: ${evolucion.estado}`
          
          // Si mantiene, no hay respuestas
          if (evolucion.estado === 'mantiene') {
            competenciaTexto += `\nEvaluación: Mantiene el mismo nivel del MATE anterior. No se requieren preguntas adicionales.`
          } else {
            // Si mejora o empeora, solo incluir preguntas de profundización (no las de evaluación)
            const preguntasProfundizacion = PREGUNTAS_PROFUNDIZACION[evolucion.estado] || []
            const respuestasProfundizacion = preguntasProfundizacion.map((pregunta, idx) => {
              const key = `${comp.id}_prof_${idx}`
              const respuesta = respuestas[key]
              if (!respuesta) return null
              return `P (Profundización): ${pregunta}\nR: ${respuesta}`
            }).filter(Boolean).join('\n\n')
            
            if (respuestasProfundizacion) {
              competenciaTexto += `\n\nPreguntas de Profundización:\n${respuestasProfundizacion}`
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

      // Construir sección de métricas si están disponibles
      let seccionMetricas = ''
      if (metricas && (Array.isArray(metricas.kpis) && metricas.kpis.length > 0 || metricas.comentarios || metricas.pasa)) {
        const tipoPersona = tipoEvaluacion === 'asesor' ? 'ASESOR' : 'LÍDER'
        let textoMetricas = `\n\nMÉTRICAS DEL ${tipoPersona}:\n`
        
        // Agregar KPIs
        if (Array.isArray(metricas.kpis) && metricas.kpis.length > 0) {
          textoMetricas += '\nKPIs:\n'
          metricas.kpis.forEach(kpi => {
            if (kpi.nombre) {
              textoMetricas += `- ${kpi.nombre}`
              if (kpi.mes) {
                textoMetricas += ` (${kpi.mes})`
              }
              if (kpi.pasa) {
                textoMetricas += ` - Pasa: ${kpi.pasa}`
              }
              textoMetricas += '\n'
            }
          })
        }
        
        // Agregar comentarios generales
        if (metricas.comentarios) {
          textoMetricas += `\nComentarios: ${metricas.comentarios}\n`
        }
        
        // Agregar Pasa
        if (metricas.pasa) {
          textoMetricas += `\nPasa: ${metricas.pasa}\n`
        }
        
        textoMetricas += '\nUtiliza estas métricas para hacer comparaciones más completas y contextualizar el análisis de competencias.'
        seccionMetricas = textoMetricas
      }

      const tipoPersona = tipoEvaluacion === 'asesor' ? 'asesor' : 'líder'
      const prompt = `Eres un experto en evaluación de competencias laborales de Konecta. Basándote en el Manual de Desarrollo de Competencias de Konecta CONO SUR 2025 y las siguientes respuestas del líder sobre el ${tipoPersona} ${nombreAsesor}, genera un perfil completo de competencias.

IMPORTANTE: Esta evaluación está dirigida a un ${tipoPersona === 'asesor' ? 'ASESOR' : 'LÍDER'}. ${tipoEvaluacion === 'asesor' ? 'Las competencias de Liderazgo Konecta, Colaboración Remota, Mindset Digital y Prospectiva Estratégica NO aplican para asesores y no deben ser evaluadas.' : 'Todas las competencias aplican, incluyendo las de liderazgo.'}

${contextoMATEAnterior}${seccionMetricas}

El Manual de Competencias de Konecta organiza las competencias en cuatro categorías:
- PERSONAL: Cómo es la persona y cómo se maneja (Mentalidad Ágil, Engagement, Confianza)
- RELACIONAL: Cómo trabaja con otros y se comunica (Comunicación Digital, Colaboración Remota)
- LOGRO Y ACCIÓN: Cómo alcanza resultados (Foco en Data, Learning Agility, Orientación a Resultados)
- NEGOCIO: Foco en el negocio, clientes y contexto (Mindset Digital, Liderazgo Konecta, Experiencia del Cliente, Orientación Comercial, Prospectiva Estratégica)

${datosMATEAnterior ? 'EVALUACIÓN ACTUAL (comparando con MATE anterior):' : 'EVALUACIÓN ACTUAL:'}

${respuestasTexto}

Por favor, genera un perfil detallado y profesional que incluya:
1. Resumen ejecutivo del perfil del asesor${datosMATEAnterior ? ' comparando con el MATE anterior' : ''}${(Array.isArray(metricas?.kpis) && metricas.kpis.length > 0 || metricas?.comentarios || metricas?.pasa) ? ', incorporando las métricas proporcionadas' : ''}
2. Evaluación detallada por cada competencia evaluada, indicando claramente el nivel de desarrollo (Excelente Desarrollo, Desarrollado, o Necesita Desarrollo)${datosMATEAnterior ? ' y la evolución respecto al MATE anterior' : ''}. Para cada competencia, muestra el nivel de forma visible y destacada.
3. Fortalezas identificadas agrupadas por categoría, destacando las aptitudes más desarrolladas
4. Áreas de oportunidad con recomendaciones específicas${datosMATEAnterior ? ', destacando mejoras o retrocesos respecto al MATE anterior' : ''}
5. Plan de desarrollo con acciones concretas basadas en el manual${datosMATEAnterior ? ' y considerando la evolución mostrada' : ''}
6. PLAN DE TRABAJO Y OBJETIVOS PARA EL PRÓXIMO SEMESTRE: Genera automáticamente un plan de trabajo estructurado con objetivos SMART (Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido) para el próximo semestre, basado en el análisis realizado. Incluye objetivos por competencia que necesite desarrollo, con acciones concretas, plazos y métricas de seguimiento.

IMPORTANTE PARA EL FORMATO:
- Usa jerarquías visuales claras: títulos principales con ##, subtítulos con ###, y secciones bien diferenciadas
- Destaca los niveles de competencia de forma visible (ej: **Nivel: Excelente Desarrollo**)
- Estructura el documento de manera que pueda ser entregado directamente al representante
- Usa listas numeradas o con viñetas para facilitar la lectura
- Separa claramente cada sección con espacios y títulos descriptivos

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
    setTipoEvaluacion(null)
    setTieneMATEAnterior(null)
    setArchivoMATE(null)
    setDatosMATEAnterior(null)
    setPaso('inicio')
    setRespuestas({})
    setEvoluciones({})
    setPerfilGenerado(null)
    setError(null)
    setMetricas({ kpis: [], comentarios: '', pasa: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    limpiarLocalStorage()
  }

  const handleReiniciarMATE = () => {
    setMostrarModalReiniciar(true)
  }

  // Exponer la función de reinicio al componente padre a través del ref
  useEffect(() => {
    if (onReiniciarMATE && typeof onReiniciarMATE === 'object' && 'current' in onReiniciarMATE) {
      onReiniciarMATE.current = handleReiniciarMATE
    }
    return () => {
      if (onReiniciarMATE && typeof onReiniciarMATE === 'object' && 'current' in onReiniciarMATE) {
        onReiniciarMATE.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReiniciarMATE])

  const confirmarReiniciarMATE = () => {
    setNombreAsesor('')
    setTipoEvaluacion(null)
    setTieneMATEAnterior(null)
    setArchivoMATE(null)
    setDatosMATEAnterior(null)
    setPaso('inicio')
    setRespuestas({})
    setEvoluciones({})
    setPerfilGenerado(null)
    setError(null)
    setMetricas({ kpis: [], comentarios: '', pasa: '' })
    setCargando(false)
    setProcesandoPDF(false)
    setListoParaGuardar(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Limpiar todo el localStorage
    localStorage.clear()
    setMostrarModalReiniciar(false)
  }

  const cancelarReiniciarMATE = () => {
    setMostrarModalReiniciar(false)
  }


  // Componente para el modal de confirmación
  const ModalReiniciar = () => {
    if (!mostrarModalReiniciar) return null
    
    return (
      <div className="modal-overlay" onClick={cancelarReiniciarMATE}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-icon-warning">⚠️</div>
            <h2 className="modal-title">¿Reiniciar MATE?</h2>
          </div>
          <div className="modal-body">
            <p>Esta acción eliminará todos los datos guardados, incluyendo:</p>
            <ul className="modal-list">
              <li>Información del evaluado</li>
              <li>Respuestas a las preguntas</li>
              <li>Datos del MATE anterior</li>
              <li>Progreso de la evaluación</li>
            </ul>
            <p className="modal-warning">Esta acción no se puede deshacer.</p>
          </div>
          <div className="modal-actions">
            <button 
              className="btn-modal-cancelar"
              onClick={cancelarReiniciarMATE}
            >
              Cancelar
            </button>
            <button 
              className="btn-modal-confirmar"
              onClick={confirmarReiniciarMATE}
            >
              Sí, reiniciar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paso === 'inicio') {
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
          <div className="evaluacion-card">
          <h1>Evaluación de Competencias</h1>
          <p className="subtitulo">Sistema de evaluación basado en el Manual de Competencias</p>
          
          <div className="input-group">
            <label htmlFor="nombre-asesor">Nombre del Evaluado</label>
            <input
              id="nombre-asesor"
              type="text"
              value={nombreAsesor}
              onChange={(e) => setNombreAsesor(e.target.value)}
              placeholder="Ingresa el nombre completo"
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
      </>
    )
  }

  if (paso === 'tipo_evaluacion') {
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Tipo de Evaluación</h1>
            <p className="nombre-asesor">Evaluado: <strong>{nombreAsesor}</strong></p>
          </div>

          <p className="pregunta-mate">¿El MATE está dirigido a un Asesor o a un Líder?</p>
          
          <div className="opciones-tipo-evaluacion">
            <div className="opcion-tipo-evaluacion">
              <h3>Asesor</h3>
              <p className="descripcion-tipo">
                Evaluación para asesores. Incluye todas las competencias excepto:
                <ul>
                  <li>Colaboración Remota (Trabajo en Equipo)</li>
                  <li>Mindset Digital (Innovación)</li>
                  <li>Liderazgo Konecta</li>
                  <li>Prospectiva Estratégica (Visión Estratégica)</li>
                </ul>
              </p>
              <button 
                className="btn-primary"
                onClick={() => handleSeleccionarTipo('asesor')}
              >
                Seleccionar Asesor
              </button>
            </div>
            
            <div className="opcion-tipo-evaluacion">
              <h3>Líder</h3>
              <p className="descripcion-tipo">
                Evaluación para líderes. Incluye todas las competencias, incluyendo:
                <ul>
                  <li>Colaboración Remota (Trabajo en Equipo)</li>
                  <li>Mindset Digital (Innovación)</li>
                  <li>Liderazgo Konecta</li>
                  <li>Prospectiva Estratégica (Visión Estratégica)</li>
                </ul>
              </p>
              <button 
                className="btn-primary"
                onClick={() => handleSeleccionarTipo('lider')}
              >
                Seleccionar Líder
              </button>
            </div>
          </div>

          <div className="acciones">
            <button 
              className="btn-secondary"
              onClick={() => setPaso('inicio')}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
      </>
    )
  }

  if (paso === 'mate_anterior') {
    // Si no hay tipo de evaluación seleccionado, redirigir a selección de tipo
    if (!tipoEvaluacion) {
      setPaso('tipo_evaluacion')
      return null
    }
    
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
          <div className="evaluacion-card">
            <div className="header-evaluacion">
              <h1>MATE Anterior</h1>
            <p className="nombre-asesor">{tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder'}: <strong>{nombreAsesor}</strong></p>
          </div>

          {tieneMATEAnterior === null ? (
            <>
              <p className="pregunta-mate">¿El {tipoEvaluacion === 'asesor' ? 'asesor' : 'líder'} ya tuvo un MATE anteriormente?</p>
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
                    setPaso('tipo_evaluacion')
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
      </>
    )
  }

  if (paso === 'resumen_mate') {
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Resumen del MATE Anterior</h1>
            <p className="nombre-asesor">{tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder'}: <strong>{nombreAsesor}</strong></p>
            {datosMATEAnterior.periodo && (
              <p className="mate-anterior-info">Período: {datosMATEAnterior.periodo}</p>
            )}
          </div>

          <div className="resumen-mate-container">
            <h3>Competencias Evaluadas en el MATE Anterior</h3>
            <div className="competencias-resumen">
              {competenciasFiltradas.map(comp => {
                const infoAnterior = datosMATEAnterior.competencias[comp.id]
                if (!infoAnterior) return null

                return (
                  <div key={comp.id} className="competencia-resumen-item">
                    <div className="competencia-resumen-header">
                      <h4>{comp.nombre}</h4>
                      <div className="badges-resumen">
                        <span className={`nivel-badge nivel-${infoAnterior.nivel}`}>Nivel {infoAnterior.nivel}</span>
                        {infoAnterior.categoria && (
                          <span className={`categoria-badge categoria-${infoAnterior.categoria}`}>
                            {infoAnterior.categoria === 'mantener' ? 'Mantener' :
                             infoAnterior.categoria === 'alentar' ? 'Alentar' :
                             infoAnterior.categoria === 'transformar' ? 'Transformar' :
                             infoAnterior.categoria === 'evitar' ? 'Evitar' : infoAnterior.categoria}
                          </span>
                        )}
                      </div>
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
              onClick={() => tipoEvaluacion ? setPaso('mate_anterior') : setPaso('tipo_evaluacion')}
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
      </>
    )
  }

  if (paso === 'preguntas') {
    // Validar que todas las competencias estén evaluadas
    const todasRespondidas = competenciasFiltradas.every(comp => {
      const infoAnterior = datosMATEAnterior?.competencias[comp.id]
      
      if (infoAnterior) {
        // Si hay MATE anterior, validar evolución a nivel de competencia
        const evol = evoluciones[comp.id]
        if (!evol?.estado) return false
        
        // Si mantiene, no necesita respuestas
        if (evol.estado === 'mantiene') return true
        
        // Si mejora o empeora, solo necesita responder las preguntas de profundización
        const preguntasProfundizacion = PREGUNTAS_PROFUNDIZACION[evol.estado] || []
        const preguntasProfundizacionCompletas = preguntasProfundizacion.every((_, idx) => {
          const key = `${comp.id}_prof_${idx}`
          return respuestas[key]?.trim() !== ''
        })
        
        return preguntasProfundizacionCompletas
      } else {
        // Si no hay MATE anterior, validar respuestas normales
        return comp.preguntas.every((_, idx) => {
          const key = `${comp.id}_${idx}`
          return respuestas[key]?.trim() !== ''
        })
      }
    })
    
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
          <div className="evaluacion-card">
            <div className="header-evaluacion">
              <h1>Evaluación de Competencias</h1>
              <p className="nombre-asesor">{tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder'}: <strong>{nombreAsesor}</strong></p>
              {datosMATEAnterior && (
                <p className="mate-anterior-info">Comparando con MATE anterior ({datosMATEAnterior.periodo || 'período anterior'})</p>
              )}
            </div>

          <div className="preguntas-container">
            {competenciasFiltradas.map((competencia) => {
              const infoAnterior = datosMATEAnterior?.competencias[competencia.id]
              const evolucion = evoluciones[competencia.id]
              const mostrarPreguntas = !infoAnterior || (evolucion?.estado && evolucion.estado !== 'mantiene')
              
              return (
                <div key={competencia.id} className="competencia-section">
                  <div className="competencia-header">
                    <div className="competencia-header-left">
                      <h2 className="competencia-titulo">{competencia.nombre}</h2>
                      {infoAnterior && (
                        <div className="badges-competencias">
                          <span className={`nivel-badge nivel-${infoAnterior.nivel}`}>
                            MATE Anterior: Nivel {infoAnterior.nivel}
                          </span>
                          {infoAnterior.categoria && (
                            <span className={`categoria-badge categoria-${infoAnterior.categoria}`}>
                              {infoAnterior.categoria === 'mantener' ? 'Mantener' :
                               infoAnterior.categoria === 'alentar' ? 'Alentar' :
                               infoAnterior.categoria === 'transformar' ? 'Transformar' :
                               infoAnterior.categoria === 'evitar' ? 'Evitar' : infoAnterior.categoria}
                            </span>
                          )}
                        </div>
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
                      {/* Si mejora o empeora, solo mostrar preguntas de profundización */}
                      {evolucion?.estado && (evolucion.estado === 'mejora' || evolucion.estado === 'empeora') ? (
                        <div className="preguntas-profundizacion">
                          <h3 className="seccion-preguntas-titulo profundizacion-titulo">
                            Preguntas de Profundización
                            <span className="badge-profundizacion">
                              {evolucion.estado === 'mejora' ? 'Mejora' : 'Empeora'}
                            </span>
                          </h3>
                          <p className="descripcion-profundizacion">
                            Estas preguntas ayudan a entender mejor los factores que influyeron en la evolución de esta competencia.
                          </p>
                          {(PREGUNTAS_PROFUNDIZACION[evolucion.estado] || []).map((pregunta, idx) => {
                            const key = `${competencia.id}_prof_${idx}`
                            return (
                              <div key={key} className="pregunta-item pregunta-profundizacion">
                                <label className="pregunta-label">{pregunta}</label>
                                <textarea
                                  className="respuesta-textarea"
                                  value={respuestas[key] || ''}
                                  onChange={(e) => handleCambiarRespuesta(key, e.target.value)}
                                  placeholder="Escribe tu respuesta aquí..."
                                  rows="4"
                                />
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <>
                          {/* Preguntas de Evaluación (solo cuando no hay mejora/empeora) */}
                          <h3 className="seccion-preguntas-titulo">Preguntas de Evaluación</h3>
                          {competencia.preguntas.map((pregunta, idx) => {
                            const key = `${competencia.id}_${idx}`
                            return (
                              <div key={key} className="pregunta-item">
                                <label className="pregunta-label">{pregunta}</label>
                                <textarea
                                  className="respuesta-textarea"
                                  value={respuestas[key] || ''}
                                  onChange={(e) => handleCambiarRespuesta(key, e.target.value)}
                                  placeholder="Escribe tu respuesta aquí..."
                                  rows="4"
                                />
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Sección de métricas */}
          <div className="metricas-section">
            <h3 className="metricas-titulo">Métricas del {tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder'} (Opcional)</h3>
            <p className="metricas-descripcion">
              {datosMATEAnterior?.metricas?.kpis && Array.isArray(datosMATEAnterior.metricas.kpis) && datosMATEAnterior.metricas.kpis.length > 0 
                ? 'Compara y edita las métricas extraídas del PDF anterior. Selecciona el KPI (NPS, PEC, TMO), ingresa su valor y comentarios.'
                : 'Ingresa métricas del asesor (KPIs: NPS, PEC, TMO) para hacer comparaciones más completas en el análisis.'}
            </p>
            
            {/* Interfaz comparativa de KPIs */}
            {datosMATEAnterior?.metricas?.kpis && Array.isArray(datosMATEAnterior.metricas.kpis) && datosMATEAnterior.metricas.kpis.length > 0 ? (
              <div className="kpis-comparativo-container">
                <h4 className="kpis-subtitulo">KPIs Extraídos del PDF</h4>
                {datosMATEAnterior.metricas.kpis.map((kpiPDF, index) => {
                  const kpiActual = metricas.kpis[index] || {
                    nombrePDF: kpiPDF.nombrePDF || '',
                    nombre: kpiPDF.nombre || '',
                    mes: kpiPDF.mes || '',
                    pasa: kpiPDF.pasa || ''
                  }
                  
                  return (
                    <div key={index} className="kpi-comparativo-item">
                      <div className="kpi-columna-izquierda">
                        <div className="kpi-label">Del PDF anterior:</div>
                        <div className="kpi-pdf-content">{kpiPDF.nombrePDF || 'KPI extraído del PDF'}</div>
                      </div>
                      <div className="kpi-columna-derecha">
                        <div className="kpi-form-group">
                          <label htmlFor={`kpi-nombre-${index}`}>KPI:</label>
                          <select
                            id={`kpi-nombre-${index}`}
                            value={kpiActual.nombre || ''}
                            onChange={(e) => {
                              const nuevosKPIs = [...metricas.kpis]
                              if (!nuevosKPIs[index]) {
                                nuevosKPIs[index] = { ...kpiPDF, nombre: e.target.value }
                              } else {
                                nuevosKPIs[index] = { ...nuevosKPIs[index], nombre: e.target.value }
                              }
                              setMetricas({ ...metricas, kpis: nuevosKPIs })
                            }}
                            className="kpi-select"
                          >
                            <option value="">Seleccionar KPI...</option>
                            <option value="NPS">NPS</option>
                            <option value="PEC">PEC</option>
                            <option value="TMO">TMO</option>
                          </select>
                        </div>
                        <div className="kpi-form-group">
                          <label htmlFor={`kpi-mes-${index}`}>Mes:</label>
                          <select
                            id={`kpi-mes-${index}`}
                            value={kpiActual.mes || ''}
                            onChange={(e) => {
                              const nuevosKPIs = [...metricas.kpis]
                              if (!nuevosKPIs[index]) {
                                nuevosKPIs[index] = { ...kpiPDF, mes: e.target.value }
                              } else {
                                nuevosKPIs[index] = { ...nuevosKPIs[index], mes: e.target.value }
                              }
                              setMetricas({ ...metricas, kpis: nuevosKPIs })
                            }}
                            className="kpi-select"
                          >
                            <option value="">Seleccionar mes...</option>
                            <option value="Enero">Enero</option>
                            <option value="Febrero">Febrero</option>
                            <option value="Marzo">Marzo</option>
                            <option value="Abril">Abril</option>
                            <option value="Mayo">Mayo</option>
                            <option value="Junio">Junio</option>
                            <option value="Julio">Julio</option>
                            <option value="Agosto">Agosto</option>
                            <option value="Septiembre">Septiembre</option>
                            <option value="Octubre">Octubre</option>
                            <option value="Noviembre">Noviembre</option>
                            <option value="Diciembre">Diciembre</option>
                          </select>
                        </div>
                        <div className="kpi-form-group">
                          <label htmlFor={`kpi-pasa-${index}`}>Pasa:</label>
                          <select
                            id={`kpi-pasa-${index}`}
                            value={kpiActual.pasa || ''}
                            onChange={(e) => {
                              const nuevosKPIs = [...metricas.kpis]
                              if (!nuevosKPIs[index]) {
                                nuevosKPIs[index] = { ...kpiPDF, pasa: e.target.value }
                              } else {
                                nuevosKPIs[index] = { ...nuevosKPIs[index], pasa: e.target.value }
                              }
                              setMetricas({ ...metricas, kpis: nuevosKPIs })
                            }}
                            className="kpi-select"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="SÍ">SÍ</option>
                            <option value="NO">NO</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="kpis-vacio">
                <p>No se encontraron KPIs en el PDF anterior. Puedes agregarlos manualmente.</p>
                <button
                  type="button"
                  onClick={() => {
                    const nuevosKPIs = [...metricas.kpis, { nombrePDF: '', nombre: '', mes: '', pasa: '' }]
                    setMetricas({ ...metricas, kpis: nuevosKPIs })
                  }}
                  className="btn-agregar-kpi"
                >
                  + Agregar KPI
                </button>
              </div>
            )}
            
            {/* Agregar KPIs manualmente si no hay PDF */}
            {(!datosMATEAnterior?.metricas?.kpis || !Array.isArray(datosMATEAnterior.metricas.kpis) || datosMATEAnterior.metricas.kpis.length === 0) && Array.isArray(metricas.kpis) && metricas.kpis.length > 0 && (
              <div className="kpis-manuales-container">
                <h4 className="kpis-subtitulo">KPIs Manuales</h4>
                {metricas.kpis.map((kpi, index) => (
                  <div key={index} className="kpi-comparativo-item">
                    <div className="kpi-columna-derecha">
                      <div className="kpi-form-group">
                        <label htmlFor={`kpi-manual-nombre-${index}`}>KPI:</label>
                        <select
                          id={`kpi-manual-nombre-${index}`}
                          value={kpi.nombre || ''}
                          onChange={(e) => {
                            const nuevosKPIs = [...metricas.kpis]
                            nuevosKPIs[index] = { ...nuevosKPIs[index], nombre: e.target.value }
                            setMetricas({ ...metricas, kpis: nuevosKPIs })
                          }}
                          className="kpi-select"
                        >
                          <option value="">Seleccionar KPI...</option>
                          <option value="NPS">NPS</option>
                          <option value="PEC">PEC</option>
                          <option value="TMO">TMO</option>
                        </select>
                      </div>
                      <div className="kpi-form-group">
                        <label htmlFor={`kpi-manual-mes-${index}`}>Mes:</label>
                        <select
                          id={`kpi-manual-mes-${index}`}
                          value={kpi.mes || ''}
                          onChange={(e) => {
                            const nuevosKPIs = [...metricas.kpis]
                            nuevosKPIs[index] = { ...nuevosKPIs[index], mes: e.target.value }
                            setMetricas({ ...metricas, kpis: nuevosKPIs })
                          }}
                          className="kpi-select"
                        >
                          <option value="">Seleccionar mes...</option>
                          <option value="Enero">Enero</option>
                          <option value="Febrero">Febrero</option>
                          <option value="Marzo">Marzo</option>
                          <option value="Abril">Abril</option>
                          <option value="Mayo">Mayo</option>
                          <option value="Junio">Junio</option>
                          <option value="Julio">Julio</option>
                          <option value="Agosto">Agosto</option>
                          <option value="Septiembre">Septiembre</option>
                          <option value="Octubre">Octubre</option>
                          <option value="Noviembre">Noviembre</option>
                          <option value="Diciembre">Diciembre</option>
                        </select>
                      </div>
                      <div className="kpi-form-group">
                        <label htmlFor={`kpi-manual-pasa-${index}`}>Pasa:</label>
                        <select
                          id={`kpi-manual-pasa-${index}`}
                          value={kpi.pasa || ''}
                          onChange={(e) => {
                            const nuevosKPIs = [...metricas.kpis]
                            nuevosKPIs[index] = { ...nuevosKPIs[index], pasa: e.target.value }
                            setMetricas({ ...metricas, kpis: nuevosKPIs })
                          }}
                          className="kpi-select"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="SÍ">SÍ</option>
                          <option value="NO">NO</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevosKPIs = metricas.kpis.filter((_, i) => i !== index)
                          setMetricas({ ...metricas, kpis: nuevosKPIs })
                        }}
                        className="btn-eliminar-kpi"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const nuevosKPIs = [...metricas.kpis, { nombrePDF: '', nombre: '', mes: '', pasa: '' }]
                    setMetricas({ ...metricas, kpis: nuevosKPIs })
                  }}
                  className="btn-agregar-kpi"
                >
                  + Agregar otro KPI
                </button>
              </div>
            )}
            
            {/* Comentarios generales y Pasa */}
            <div className="metricas-adicionales">
              <div className="metricas-adicional-item">
                <label htmlFor="metricas-comentarios">Comentarios Generales:</label>
                <textarea
                  id="metricas-comentarios"
                  value={metricas.comentarios || ''}
                  onChange={(e) => setMetricas({ ...metricas, comentarios: e.target.value })}
                  placeholder="Comentarios generales sobre las métricas..."
                  className="metricas-textarea"
                  rows="3"
                />
              </div>
              <div className="metricas-adicional-item">
                <label htmlFor="metricas-pasa">Pasa:</label>
                <input
                  id="metricas-pasa"
                  type="text"
                  value={metricas.pasa || ''}
                  onChange={(e) => setMetricas({ ...metricas, pasa: e.target.value })}
                  placeholder="Pasa..."
                  className="metricas-input"
                />
              </div>
            </div>
          </div>

          <div className="acciones">
            <button 
              className="btn-secondary"
              onClick={() => tipoEvaluacion ? setPaso('mate_anterior') : setPaso('tipo_evaluacion')}
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
      </>
    )
  }

  if (paso === 'resultado') {
    return (
      <>
        <ModalReiniciar />
        <div className="evaluacion-container">
        <div className="evaluacion-card">
          <div className="header-evaluacion">
            <h1>Perfil de Competencias Generado</h1>
            <p className="nombre-asesor">{tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder'}: <strong>{nombreAsesor}</strong></p>
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
                      
                      // Detectar títulos principales (## o números seguidos de punto)
                      if (/^##\s+/.test(trimmedLine) || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmedLine) || 
                          (trimmedLine.length < 80 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && !trimmedLine.includes(':'))) {
                        const tituloLimpio = trimmedLine.replace(/^##\s+/, '').replace(/^\d+\.\s+/, '')
                        return <h2 key={i} className="perfil-titulo-principal">{formatearTexto(tituloLimpio, i)}</h2>
                      }
                      
                      // Detectar subtítulos (### o texto que termina en :)
                      if (/^###\s+/.test(trimmedLine) || (trimmedLine.endsWith(':') && trimmedLine.length < 70 && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('•'))) {
                        const subtituloLimpio = trimmedLine.replace(/^###\s+/, '')
                        return <h3 key={i} className="perfil-subtitulo">{formatearTexto(subtituloLimpio, i)}</h3>
                      }
                      
                      // Detectar niveles de competencia destacados
                      if (/Nivel:\s*(Excelente Desarrollo|Desarrollado|Necesita Desarrollo)/i.test(trimmedLine)) {
                        let nivelClass = 'nivel-competencia'
                        if (/Excelente Desarrollo/i.test(trimmedLine)) {
                          nivelClass += ' nivel-excelente'
                        } else if (/Desarrollado/i.test(trimmedLine)) {
                          nivelClass += ' nivel-desarrollado'
                        } else {
                          nivelClass += ' nivel-necesita'
                        }
                        return <p key={i} className={nivelClass}><strong>{formatearTexto(trimmedLine, i)}</strong></p>
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
      </>
    )
  }

  return (
    <>
      <ModalReiniciar />
    </>
  )
}

export default EvaluacionCompetencias
