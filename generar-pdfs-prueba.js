// Script para generar PDFs de prueba para asesores y líderes
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para generar PDF (basada en handleDescargarPDF del componente)
function generarPDF(perfilGenerado, nombrePersona, tipoEvaluacion, datosMATEAnterior = null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Configurar fuente y colores
  doc.setFontSize(20);
  doc.setTextColor(15, 15, 114); // #0F0F72
  doc.setFont('helvetica', 'bold');
  
  // Título
  doc.text('Perfil de Competencias Generado', margin, yPos);
  yPos += 10;

  // Información de la persona
  doc.setFontSize(14);
  doc.setTextColor(40, 0, 200); // #2800c8
  doc.setFont('helvetica', 'normal');
  const tipoTexto = tipoEvaluacion === 'asesor' ? 'Asesor' : 'Líder';
  doc.text(`${tipoTexto}: ${nombrePersona}`, margin, yPos);
  yPos += 8;

  if (datosMATEAnterior) {
    doc.setFontSize(10);
    doc.setTextColor(166, 135, 255); // #A687FF
    doc.text(`Comparado con MATE anterior (${datosMATEAnterior.periodo || 'período anterior'})`, margin, yPos);
    yPos += 10;
  }

  // Contenido del perfil
  const lineas = perfilGenerado.split('\n');
  const lineHeight = 6;
  const lineHeightSmall = 5;

  lineas.forEach((lineaOriginal) => {
    if (yPos > pageHeight - margin - 15) {
      doc.addPage();
      yPos = margin;
    }

    let linea = lineaOriginal.trim();
    
    if (!linea || /^[-=_*]{3,}$/.test(linea)) {
      yPos += lineHeightSmall;
      return;
    }

    // Títulos principales
    if (/^##\s+/.test(linea) || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(linea)) {
      yPos += 5;
      linea = linea.replace(/^##\s+/, '').replace(/^\d+\.\s+/, '');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 15, 114);
      const lineasTexto = doc.splitTextToSize(linea, maxWidth);
      lineasTexto.forEach((l) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(l, margin, yPos);
        yPos += lineHeight + 2;
      });
      doc.setDrawColor(166, 135, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 3;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      return;
    }

    // Subtítulos
    if (/^###\s+/.test(linea) || (linea.endsWith(':') && linea.length < 70 && !linea.startsWith('-') && !linea.startsWith('•'))) {
      yPos += 3;
      linea = linea.replace(/^###\s+/, '');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 0, 200);
      const lineasTexto = doc.splitTextToSize(linea, maxWidth);
      lineasTexto.forEach((l) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(l, margin, yPos);
        yPos += lineHeight + 1;
      });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      return;
    }

    // Niveles de competencia
    if (/Nivel:\s*(Excelente Desarrollo|Desarrollado|Necesita Desarrollo)/i.test(linea)) {
      yPos += 2;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      if (/Excelente Desarrollo/i.test(linea)) {
        doc.setTextColor(46, 125, 50);
      } else if (/Desarrollado/i.test(linea)) {
        doc.setTextColor(25, 118, 210);
      } else {
        doc.setTextColor(211, 47, 47);
      }
      linea = linea.replace(/\*\*/g, '').replace(/Nivel:\s*/i, 'Nivel: ');
      const lineasTexto = doc.splitTextToSize(linea, maxWidth);
      lineasTexto.forEach((l) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(l, margin, yPos);
        yPos += lineHeight + 1;
      });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      return;
    }

    // Listas
    if ((linea.startsWith('-') || linea.startsWith('•') || linea.startsWith('*')) && !linea.startsWith('**')) {
      linea = linea.replace(/^[-•*]\s*/, '');
      linea = linea.replace(/\*\*([^*]+)\*\*/g, '$1');
      linea = linea.replace(/\*([^*]+)\*/g, '$1');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text('•', margin, yPos);
      const lineasTexto = doc.splitTextToSize(linea, maxWidth - 10);
      lineasTexto.forEach((l) => {
        if (yPos > pageHeight - margin - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(l, margin + 5, yPos);
        yPos += lineHeight;
      });
      return;
    }

    // Texto normal
    linea = linea.replace(/^#+\s*/, '').replace(/^[-=_*]{2,}\s*/, '');
    
    const partes = linea.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    let xPos = margin;
    
    partes.forEach((parte) => {
      if (!parte) return;
      
      if (parte.startsWith('**') && parte.endsWith('**')) {
        const texto = parte.slice(2, -2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const width = doc.getTextWidth(texto);
        if (xPos + width > pageWidth - margin) {
          yPos += lineHeight;
          xPos = margin;
        }
        doc.text(texto, xPos, yPos);
        xPos += width;
      } else if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
        const texto = parte.slice(1, -1);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const width = doc.getTextWidth(texto);
        if (xPos + width > pageWidth - margin) {
          yPos += lineHeight;
          xPos = margin;
        }
        doc.text(texto, xPos, yPos);
        xPos += width;
      } else if (parte.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const lineasTexto = doc.splitTextToSize(parte, maxWidth - (xPos - margin));
        lineasTexto.forEach((l, idx) => {
          if (yPos > pageHeight - margin - 10) {
            doc.addPage();
            yPos = margin;
            xPos = margin;
          }
          doc.text(l, xPos, yPos);
          yPos += lineHeight;
          xPos = margin;
        });
        xPos = margin;
      }
    });
    
    if (xPos > margin) {
      yPos += lineHeight;
    }
  });

  return doc;
}

// Perfil de prueba para ASESOR
const perfilAsesor = `## 1. RESUMEN EJECUTIVO

Este perfil evalúa las competencias de Juan Pérez como asesor en Konecta. El análisis se centra en 9 competencias clave que son relevantes para el rol de asesor, excluyendo las competencias de liderazgo que aplican únicamente a roles de liderazgo.

### Perfil General

Juan Pérez demuestra un perfil sólido en competencias fundamentales para el rol de asesor. Muestra fortalezas destacadas en áreas de comunicación y orientación al cliente, con oportunidades de desarrollo en análisis de datos y adaptabilidad.

**Nivel General: Desarrollado**

### Competencias Evaluadas

- Mentalidad Ágil (Adaptabilidad)
- Foco en Data (Análisis y Resolución de Problemas)
- Comunicación Digital (Comunicación Efectiva)
- Learning Agility (Espíritu Emprendedor)
- Engagement (Compromiso Laboral)
- Confianza (Integridad)
- Experiencia del Cliente (CX)
- Orientación a Resultados
- Orientación Comercial / Mercado

## 2. EVALUACIÓN DETALLADA POR COMPETENCIA

### Mentalidad Ágil (Adaptabilidad)
**Nivel: Desarrollado**

Juan muestra una buena capacidad de adaptación ante cambios en procesos y herramientas. Se adapta bien a nuevas cuentas y metodologías, aunque a veces requiere tiempo adicional para asimilar cambios complejos. Propone mejoras ocasionales cuando identifica oportunidades.

**Fortalezas:**
- Se adapta positivamente a cambios en herramientas digitales
- Mantiene actitud constructiva ante situaciones nuevas
- Acepta feedback y ajusta su forma de trabajar

**Áreas de Oportunidad:**
- Desarrollar mayor proactividad en la propuesta de mejoras
- Acelerar el tiempo de adaptación a cambios complejos
- Anticiparse mejor a posibles cambios

### Foco en Data (Análisis y Resolución de Problemas)
**Nivel: Necesita Desarrollo**

Juan utiliza los datos básicos para su trabajo diario, pero tiene oportunidades de mejora en el análisis profundo y la identificación de causas raíz. Cuando identifica desvíos, busca apoyo del líder en lugar de investigar primero por su cuenta.

**Fortalezas:**
- Consulta regularmente sus métricas de desempeño
- Reconoce cuando hay desvíos en sus resultados

**Áreas de Oportunidad:**
- Desarrollar análisis más profundo de datos
- Buscar causas raíz de manera independiente
- Proponer acciones basadas en evidencia de forma más frecuente
- Utilizar datos para anticipar problemas

### Comunicación Digital (Comunicación Efectiva)
**Nivel: Excelente Desarrollo**

Juan destaca en comunicación digital. Se comunica de manera clara, oportuna y empática en todos los canales. Adapta su mensaje según la audiencia y valida que el receptor haya entendido correctamente.

**Fortalezas:**
- Comunicación clara y profesional en chat, email y videollamadas
- Excelente capacidad de escucha activa
- Adapta el tono y contenido según el contexto
- Valida comprensión de manera proactiva

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Compartir mejores prácticas con el equipo

### Learning Agility (Espíritu Emprendedor)
**Nivel: Desarrollado**

Juan demuestra buena disposición para aprender continuamente. Acepta feedback de manera constructiva y está abierto a probar nuevas formas de trabajar. Comparte aprendizajes con el equipo de manera regular.

**Fortalezas:**
- Actitud positiva hacia el aprendizaje continuo
- Acepta feedback constructivo
- Comparte conocimientos con compañeros

**Áreas de Oportunidad:**
- Buscar activamente nuevas oportunidades de aprendizaje
- Aplicar aprendizajes de manera más rápida
- Experimentar más con nuevas metodologías

### Engagement (Compromiso Laboral)
**Nivel: Desarrollado**

Juan muestra buen compromiso con su trabajo y los objetivos del equipo. Se involucra en sus tareas asignadas y participa en iniciativas del equipo cuando se le solicita.

**Fortalezas:**
- Cumple con sus responsabilidades de manera consistente
- Muestra energía positiva en su trabajo diario
- Participa en actividades del equipo

**Áreas de Oportunidad:**
- Involucrarse más proactivamente en iniciativas de mejora
- Proponer ideas y proyectos por iniciativa propia
- Aumentar su nivel de energía y entusiasmo

### Confianza (Integridad)
**Nivel: Excelente Desarrollo**

Juan genera alta confianza en clientes, compañeros y líderes. Es coherente entre lo que dice y hace, cumple con sus compromisos y maneja la información de manera confidencial y respetuosa.

**Fortalezas:**
- Coherencia total entre palabras y acciones
- Cumplimiento consistente de compromisos
- Manejo ético de información confidencial
- Respeta a todos los miembros del equipo

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Ser ejemplo para otros miembros del equipo

### Experiencia del Cliente (CX)
**Nivel: Excelente Desarrollo**

Juan genera experiencias positivas en cada interacción con el cliente. Se anticipa a necesidades, demuestra alta empatía y vocación de servicio, y transforma situaciones difíciles en experiencias positivas.

**Fortalezas:**
- Excelente capacidad de anticipación a necesidades del cliente
- Alta empatía y vocación de servicio
- Transforma situaciones complejas en experiencias positivas
- Genera alta satisfacción del cliente

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Documentar y compartir mejores prácticas

### Orientación a Resultados
**Nivel: Desarrollado**

Juan se enfoca en lograr objetivos con eficiencia y calidad. Prioriza acciones que generan valor y hace seguimiento de sus avances, ajustando cuando es necesario.

**Fortalezas:**
- Enfoque claro en objetivos
- Prioriza acciones de valor
- Hace seguimiento de avances

**Áreas de Oportunidad:**
- Desarrollar mayor agilidad en la resolución de obstáculos
- Aumentar la eficiencia en procesos rutinarios
- Establecer metas más desafiantes

### Orientación Comercial / Mercado
**Nivel: Desarrollado**

Juan detecta oportunidades que aportan valor al negocio y entiende las necesidades reales de los clientes. Piensa estratégicamente sobre el impacto de su trabajo.

**Fortalezas:**
- Identifica oportunidades comerciales
- Entiende necesidades del cliente
- Genera valor para cliente y Konecta

**Áreas de Oportunidad:**
- Desarrollar mayor visión estratégica del negocio
- Proponer soluciones más innovadoras
- Anticipar tendencias del mercado

## 3. FORTALEZAS IDENTIFICADAS

### Por Categoría

**PERSONAL:**
- Confianza e Integridad (Excelente Desarrollo)
- Engagement sólido (Desarrollado)

**RELACIONAL:**
- Comunicación Digital excepcional (Excelente Desarrollo)

**LOGRO Y ACCIÓN:**
- Learning Agility positiva (Desarrollado)
- Orientación a Resultados consistente (Desarrollado)

**NEGOCIO:**
- Experiencia del Cliente destacada (Excelente Desarrollo)
- Orientación Comercial adecuada (Desarrollado)

## 4. ÁREAS DE OPORTUNIDAD

### Prioridad Alta

1. **Foco en Data**: Desarrollar análisis más profundo y capacidad de identificar causas raíz de manera independiente.

2. **Mentalidad Ágil**: Acelerar tiempo de adaptación y aumentar proactividad en propuesta de mejoras.

### Prioridad Media

3. **Learning Agility**: Buscar activamente nuevas oportunidades de aprendizaje y aplicar conocimientos más rápidamente.

4. **Orientación a Resultados**: Desarrollar mayor agilidad en resolución de obstáculos y aumentar eficiencia.

## 5. PLAN DE DESARROLLO

### Acciones Concretas

1. **Capacitación en Análisis de Datos**
   - Curso de Excel avanzado y herramientas de análisis
   - Práctica en identificación de causas raíz
   - Plazo: 2 meses

2. **Desarrollo de Adaptabilidad**
   - Participación en proyectos de cambio
   - Mentoría en gestión de cambios
   - Plazo: 3 meses

3. **Fortalecimiento de Learning Agility**
   - Participación en comunidades de práctica
   - Lectura de casos de estudio
   - Plazo: Continuo

## 6. PLAN DE TRABAJO Y OBJETIVOS PARA EL PRÓXIMO SEMESTRE

### Objetivos SMART

**Objetivo 1: Mejorar Análisis de Datos**
- **Específico**: Desarrollar capacidad de análisis profundo de datos e identificación independiente de causas raíz
- **Medible**: Completar 3 análisis de causas raíz sin apoyo del líder en el próximo semestre
- **Alcanzable**: Con capacitación y práctica guiada
- **Relevante**: Fundamental para mejorar desempeño y autonomía
- **Tiempo**: 6 meses

**Objetivo 2: Acelerar Adaptabilidad**
- **Específico**: Reducir tiempo de adaptación a cambios complejos en un 30%
- **Medible**: Tiempo de adaptación medido en días
- **Alcanzable**: Con práctica y mentoría
- **Relevante**: Mejora eficiencia y proactividad
- **Tiempo**: 6 meses

**Objetivo 3: Incrementar Proactividad**
- **Específico**: Proponer al menos 2 mejoras por trimestre
- **Medible**: Número de propuestas documentadas
- **Alcanzable**: Con desarrollo de pensamiento crítico
- **Relevante**: Contribuye a mejora continua
- **Tiempo**: 6 meses

### Métricas de Seguimiento

- Análisis de causas raíz realizados: 0/3
- Tiempo promedio de adaptación: Medición mensual
- Propuestas de mejora: 0/4 (2 por trimestre)
- Satisfacción del cliente: Mantener >90%
- Cumplimiento de objetivos: Revisión trimestral`;

// Perfil de prueba para LÍDER
const perfilLider = `## 1. RESUMEN EJECUTIVO

Este perfil evalúa las competencias de María González como líder en Konecta. El análisis incluye las 13 competencias del Manual de Competencias, incluyendo las competencias específicas de liderazgo que son exclusivas para roles de liderazgo.

### Perfil General

María González demuestra un perfil de liderazgo sólido y completo. Destaca en competencias de liderazgo, comunicación y visión estratégica. Muestra fortalezas en gestión de equipos y desarrollo de personas, con oportunidades de mejora en análisis de datos y adaptabilidad operativa.

**Nivel General: Desarrollado con Excelencia en Liderazgo**

### Competencias Evaluadas

- Mentalidad Ágil (Adaptabilidad)
- Foco en Data (Análisis y Resolución de Problemas)
- Comunicación Digital (Comunicación Efectiva)
- Learning Agility (Espíritu Emprendedor)
- Colaboración Remota (Trabajo en Equipo)
- Mindset Digital (Innovación)
- Liderazgo Konecta
- Engagement (Compromiso Laboral)
- Confianza (Integridad)
- Experiencia del Cliente (CX)
- Orientación a Resultados
- Orientación Comercial / Mercado
- Prospectiva Estratégica (Visión Estratégica)

## 2. EVALUACIÓN DETALLADA POR COMPETENCIA

### Mentalidad Ágil (Adaptabilidad)
**Nivel: Desarrollado**

María muestra buena capacidad de adaptación y lidera cambios de manera efectiva. Gestiona bien las transiciones del equipo y comunica cambios de manera clara.

**Fortalezas:**
- Lidera cambios organizacionales con éxito
- Adapta estrategias según contexto
- Gestiona resistencia al cambio en el equipo

**Áreas de Oportunidad:**
- Anticipar cambios con mayor anticipación
- Desarrollar planes de contingencia más robustos

### Foco en Data (Análisis y Resolución de Problemas)
**Nivel: Desarrollado**

María utiliza datos para la toma de decisiones estratégicas. Analiza tendencias y toma decisiones basadas en evidencia, aunque podría profundizar más en análisis predictivo.

**Fortalezas:**
- Toma decisiones basadas en datos
- Analiza tendencias y patrones
- Utiliza dashboards y reportes efectivamente

**Áreas de Oportunidad:**
- Desarrollar análisis predictivo más avanzado
- Implementar análisis de causa raíz más sistemático

### Comunicación Digital (Comunicación Efectiva)
**Nivel: Excelente Desarrollo**

María es una comunicadora excepcional. Comunica de manera clara, inspiradora y efectiva en todos los canales. Adapta su mensaje según la audiencia y genera engagement en el equipo.

**Fortalezas:**
- Comunicación clara e inspiradora
- Excelente manejo de diferentes canales
- Genera engagement y alineación
- Escucha activa y feedback constructivo

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Desarrollar habilidades de storytelling

### Learning Agility (Espíritu Emprendedor)
**Nivel: Excelente Desarrollo**

María demuestra alta capacidad de aprendizaje continuo. Aprende rápidamente de experiencias, comparte conocimiento y fomenta cultura de aprendizaje en el equipo.

**Fortalezas:**
- Aprendizaje rápido y efectivo
- Comparte conocimiento generosamente
- Fomenta cultura de aprendizaje
- Aplica aprendizajes de manera innovadora

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Crear más espacios de aprendizaje colaborativo

### Colaboración Remota (Trabajo en Equipo)
**Nivel: Excelente Desarrollo**

María lidera equipos remotos de manera excepcional. Fomenta colaboración efectiva, mantiene cohesión del equipo y crea espacios virtuales de trabajo productivos.

**Fortalezas:**
- Lidera equipos remotos con excelencia
- Fomenta colaboración efectiva
- Mantiene cohesión y sentido de pertenencia
- Crea espacios virtuales productivos

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Compartir mejores prácticas con otros líderes

### Mindset Digital (Innovación)
**Nivel: Excelente Desarrollo**

María es una líder innovadora. Utiliza herramientas digitales de manera avanzada, propone e implementa mejoras tecnológicas y fomenta innovación en el equipo.

**Fortalezas:**
- Utiliza herramientas digitales avanzadas
- Propone e implementa mejoras tecnológicas
- Fomenta innovación en el equipo
- Automatiza procesos de manera efectiva

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Explorar tecnologías emergentes

### Liderazgo Konecta
**Nivel: Excelente Desarrollo**

María es una líder excepcional que encarna los valores de Konecta. Influye positivamente, desarrolla personas, toma decisiones basadas en datos sin perder de vista a las personas y promueve bienestar del equipo.

**Fortalezas:**
- Influencia positiva y liderazgo inspirador
- Desarrollo activo de personas del equipo
- Decisiones equilibradas (datos + personas)
- Promueve bienestar y desarrollo profesional
- Feedback constructivo y desarrollo de talento

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Desarrollar otros líderes en el equipo

### Engagement (Compromiso Laboral)
**Nivel: Excelente Desarrollo**

María muestra compromiso excepcional. Se involucra activamente, transmite energía positiva y participa en iniciativas estratégicas de la organización.

**Fortalezas:**
- Compromiso excepcional con la organización
- Involucramiento activo en iniciativas estratégicas
- Transmite energía y entusiasmo
- Participa en proyectos de mejora continua

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia

### Confianza (Integridad)
**Nivel: Excelente Desarrollo**

María genera confianza total. Es coherente, cumple compromisos y maneja información con total integridad y respeto.

**Fortalezas:**
- Coherencia total entre palabras y acciones
- Cumplimiento consistente de compromisos
- Manejo ético de información
- Respeta y valora a todas las personas

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia

### Experiencia del Cliente (CX)
**Nivel: Excelente Desarrollo**

María lidera iniciativas de experiencia del cliente de manera excepcional. Se anticipa a necesidades, fomenta cultura de servicio y transforma experiencias complejas en positivas.

**Fortalezas:**
- Lidera iniciativas de CX exitosas
- Se anticipa a necesidades del cliente
- Fomenta cultura de servicio en el equipo
- Transforma experiencias complejas

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia

### Orientación a Resultados
**Nivel: Excelente Desarrollo**

María logra resultados excepcionales. Se enfoca en objetivos estratégicos, prioriza acciones de alto valor y supera obstáculos de manera efectiva.

**Fortalezas:**
- Logra resultados excepcionales
- Enfoque estratégico en objetivos
- Prioriza acciones de alto valor
- Supera obstáculos efectivamente

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia

### Orientación Comercial / Mercado
**Nivel: Excelente Desarrollo**

María tiene visión comercial excepcional. Detecta oportunidades estratégicas, entiende profundamente el mercado y genera valor significativo para clientes y Konecta.

**Fortalezas:**
- Visión comercial estratégica
- Detecta oportunidades de negocio
- Entiende profundamente el mercado
- Genera valor significativo

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia

### Prospectiva Estratégica (Visión Estratégica)
**Nivel: Excelente Desarrollo**

María demuestra visión estratégica excepcional. Anticipa escenarios futuros, considera impacto a largo plazo y diseña estrategias sostenibles y adaptables.

**Fortalezas:**
- Visión estratégica excepcional
- Anticipa escenarios futuros
- Considera impacto a largo plazo
- Diseña estrategias sostenibles
- Integra conocimiento de mercado y organización

**Áreas de Oportunidad:**
- Mantener este nivel de excelencia
- Desarrollar visión aún más amplia

## 3. FORTALEZAS IDENTIFICADAS

### Por Categoría

**PERSONAL:**
- Confianza e Integridad (Excelente Desarrollo)
- Engagement excepcional (Excelente Desarrollo)

**RELACIONAL:**
- Comunicación Digital excepcional (Excelente Desarrollo)
- Colaboración Remota excepcional (Excelente Desarrollo)

**LOGRO Y ACCIÓN:**
- Learning Agility excepcional (Excelente Desarrollo)
- Orientación a Resultados excepcional (Excelente Desarrollo)
- Foco en Data sólido (Desarrollado)

**NEGOCIO:**
- Liderazgo Konecta excepcional (Excelente Desarrollo)
- Mindset Digital excepcional (Excelente Desarrollo)
- Experiencia del Cliente excepcional (Excelente Desarrollo)
- Orientación Comercial excepcional (Excelente Desarrollo)
- Prospectiva Estratégica excepcional (Excelente Desarrollo)

## 4. ÁREAS DE OPORTUNIDAD

### Prioridad Baja

1. **Foco en Data**: Desarrollar análisis predictivo más avanzado e implementar análisis de causa raíz más sistemático.

2. **Mentalidad Ágil**: Anticipar cambios con mayor anticipación y desarrollar planes de contingencia más robustos.

## 5. PLAN DE DESARROLLO

### Acciones Concretas

1. **Capacitación en Análisis Predictivo**
   - Curso de análisis predictivo y machine learning aplicado
   - Implementación de modelos predictivos
   - Plazo: 4 meses

2. **Desarrollo de Anticipación Estratégica**
   - Participación en ejercicios de planificación estratégica
   - Desarrollo de escenarios futuros
   - Plazo: Continuo

## 6. PLAN DE TRABAJO Y OBJETIVOS PARA EL PRÓXIMO SEMESTRE

### Objetivos SMART

**Objetivo 1: Implementar Análisis Predictivo**
- **Específico**: Desarrollar e implementar modelos predictivos para anticipar tendencias y problemas
- **Medible**: Implementar 2 modelos predictivos funcionales en el próximo semestre
- **Alcanzable**: Con capacitación y recursos adecuados
- **Relevante**: Mejora toma de decisiones estratégicas
- **Tiempo**: 6 meses

**Objetivo 2: Desarrollar Anticipación Estratégica**
- **Específico**: Crear y mantener escenarios futuros actualizados trimestralmente
- **Medible**: 2 escenarios futuros documentados por trimestre
- **Alcanzable**: Con metodología y práctica
- **Relevante**: Fortalece prospectiva estratégica
- **Tiempo**: 6 meses

**Objetivo 3: Desarrollar Otros Líderes**
- **Específico**: Desarrollar al menos 2 líderes del equipo en competencias de liderazgo
- **Medible**: 2 líderes con plan de desarrollo activo
- **Alcanzable**: Con mentoría y recursos
- **Relevante**: Fortalece capacidad organizacional
- **Tiempo**: 6 meses

### Métricas de Seguimiento

- Modelos predictivos implementados: 0/2
- Escenarios futuros documentados: 0/4 (2 por trimestre)
- Líderes en desarrollo: 0/2
- Resultados del equipo: Mantener o superar objetivos
- Satisfacción del equipo: Mantener >85%
- Cumplimiento de objetivos: Revisión trimestral`;

// Generar PDF para Asesor
console.log('Generando PDF para Asesor...');
const pdfAsesor = generarPDF(perfilAsesor, 'Juan Pérez', 'asesor');
const nombreArchivoAsesor = 'Perfil_Competencias_Juan_Perez_Asesor.pdf';
pdfAsesor.save(path.join(__dirname, nombreArchivoAsesor));
console.log(`✅ PDF generado: ${nombreArchivoAsesor}`);

// Generar PDF para Líder
console.log('\nGenerando PDF para Líder...');
const pdfLider = generarPDF(perfilLider, 'María González', 'lider');
const nombreArchivoLider = 'Perfil_Competencias_Maria_Gonzalez_Lider.pdf';
pdfLider.save(path.join(__dirname, nombreArchivoLider));
console.log(`✅ PDF generado: ${nombreArchivoLider}`);

console.log('\n✅ Ambos PDFs generados exitosamente en el directorio raíz del proyecto');

