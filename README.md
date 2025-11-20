# Sistema de Evaluación de Competencias - MATE

Sistema web para evaluar competencias de asesores y líderes basado en el Manual de Desarrollo de Competencias de Konecta CONO SUR 2025, utilizando IA generativa de Google Gemini para generar perfiles completos y planes de desarrollo.

## 🚀 Características Principales

### Evaluación Flexible
- **Soporte para Asesores y Líderes**: El sistema adapta las competencias según el tipo de evaluación
- **Carga de MATE Anterior**: Permite cargar un PDF del MATE anterior para comparar y evaluar la evolución
- **Detección Automática de Categorías**: Identifica automáticamente si las competencias estaban en "Mantener", "Alentar", "Transformar" o "Evitar" en el MATE anterior
- **Métricas Adicionales**: Campo para incluir métricas del evaluado para comparaciones más completas

### Evaluación Inteligente
- **Preguntas Disparadoras**: Preguntas específicas por competencia basadas en el manual de Konecta
- **Preguntas de Profundización**: Cuando una competencia mejora o empeora, se muestran preguntas adicionales para entender mejor el cambio
- **Comparación con MATE Anterior**: Visualización clara de la evolución de cada competencia
- **Análisis por Categorías**: Organización de competencias en 4 categorías (PERSONAL, RELACIONAL, LOGRO Y ACCIÓN, NEGOCIO)

### Generación con IA
- **Perfil Completo**: Generación automática de perfil detallado usando Google Gemini AI
- **Plan de Trabajo Automático**: Generación de objetivos SMART para el próximo semestre
- **PDF Profesional**: Descarga del perfil en PDF con formato profesional y jerarquías visuales claras
- **Análisis Comparativo**: Comparación automática con el MATE anterior cuando está disponible

### Experiencia de Usuario
- **Interfaz Moderna**: Diseño limpio y profesional
- **Progreso Guardado**: El sistema guarda automáticamente el progreso en localStorage
- **Botón de Reinicio**: Opción para reiniciar la evaluación en cualquier momento
- **Modal de Confirmación**: Confirmación clara antes de acciones destructivas
- **Responsive Design**: Funciona perfectamente en dispositivos móviles y tablets

## 📋 Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/gastongithubb/mate-evaluacion-competencias.git
cd mate-evaluacion-competencias
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar API keys de Gemini**:
```bash
cp .env.example .env
# Editar .env y agregar tus API keys de Gemini
# Puedes obtenerlas en: https://makersuite.google.com/app/apikey
```

4. **Iniciar el servidor de desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

**Nota:** El sistema soporta múltiples API keys de Gemini (hasta 4) para evitar límites de rate. Configura las keys en el archivo `.env` usando las variables `VITE_GEMINI_API_KEY_1` a `VITE_GEMINI_API_KEY_4`.

## 🎯 Uso

### Flujo de Evaluación

1. **Ingresar Nombre**: Ingresa el nombre completo del evaluado
2. **Seleccionar Tipo**: Elige si la evaluación es para un "Asesor" o un "Líder"
3. **MATE Anterior (Opcional)**:
   - Indica si el evaluado tiene un MATE anterior
   - Si tiene, carga el PDF del MATE anterior
   - El sistema procesará automáticamente la información y mostrará un resumen
4. **Métricas (Opcional)**: Ingresa métricas adicionales del evaluado para comparaciones más completas
5. **Responder Preguntas**: 
   - Si hay MATE anterior, primero indica la evolución de cada competencia (Mantiene, Mejora, Empeora)
   - Responde las preguntas disparadoras para cada competencia
   - Si una competencia mejora o empeora, responde también las preguntas de profundización
6. **Generar Perfil**: Haz clic en "Generar Perfil" para obtener el análisis completo con IA
7. **Revisar y Descargar**: Revisa el perfil generado y descárgalo en PDF

### Botón de Reiniciar

El botón "Reiniciar MATE" está disponible en todas las vistas (excepto en la pantalla inicial) y permite:
- Limpiar todos los datos guardados
- Reiniciar la evaluación desde el principio
- Confirmación mediante modal antes de proceder

## 📊 Estructura de Competencias

El sistema está basado en el **Manual de Desarrollo de Competencias de Konecta CONO SUR 2025** e incluye las siguientes 13 competencias organizadas en 4 categorías:

### PERSONAL
- **Mentalidad Ágil (Adaptabilidad)**: Capacidad de adaptarse a cambios y nuevas situaciones
- **Engagement (Compromiso Laboral)**: Nivel de compromiso y participación activa
- **Confianza (Integridad)**: Credibilidad y coherencia en acciones y decisiones

### RELACIONAL
- **Comunicación Digital (Comunicación Efectiva)**: Habilidad para comunicarse efectivamente en entornos digitales
- **Colaboración Remota (Trabajo en Equipo)**: ⚠️ Solo para Líderes

### LOGRO Y ACCIÓN
- **Foco en Data (Análisis y Resolución de Problemas)**: Uso de datos para tomar decisiones informadas
- **Learning Agility (Espíritu Emprendedor)**: Capacidad de aprendizaje continuo y adaptación
- **Orientación a Resultados**: Enfoque en alcanzar objetivos y métricas

### NEGOCIO
- **Mindset Digital (Innovación)**: ⚠️ Solo para Líderes
- **Liderazgo Konecta**: ⚠️ Solo para Líderes
- **Experiencia del Cliente (CX)**: Enfoque en la experiencia y satisfacción del cliente
- **Orientación Comercial / Mercado**: Detección de oportunidades de negocio
- **Prospectiva Estratégica (Visión Estratégica)**: ⚠️ Solo para Líderes

⚠️ **Nota**: Las competencias marcadas solo están disponibles para evaluaciones de Líderes.

## 🔄 Comparación con MATE Anterior

Cuando se carga un MATE anterior, el sistema:

1. **Extrae Automáticamente**:
   - Nombre del evaluado
   - Período del MATE anterior
   - Nivel de cada competencia
   - Descripción y observaciones
   - **Categoría** (Mantener, Alentar, Transformar, Evitar)

2. **Muestra un Resumen**: Visualización clara de todas las competencias con sus niveles y categorías

3. **Permite Evaluar Evolución**: Para cada competencia, puedes indicar si:
   - **Mantiene**: El nivel se mantiene igual
   - **Mejora**: El nivel ha mejorado
   - **Empeora**: El nivel ha empeorado

4. **Genera Análisis Comparativo**: El perfil generado incluye comparación detallada con el MATE anterior

## 📄 Generación de PDF

El sistema genera un PDF profesional que incluye:

- **Resumen Ejecutivo**: Visión general del perfil del evaluado
- **Evaluación por Competencia**: 
  - Nivel de desarrollo (Excelente Desarrollo, Desarrollado, Necesita Desarrollo)
  - Evolución respecto al MATE anterior (si aplica)
  - Descripción detallada
- **Fortalezas**: Agrupadas por categoría
- **Áreas de Oportunidad**: Con recomendaciones específicas
- **Plan de Desarrollo**: Acciones concretas basadas en el manual
- **Plan de Trabajo y Objetivos**: Objetivos SMART para el próximo semestre con:
  - Acciones concretas
  - Plazos definidos
  - Métricas de seguimiento

## 🛠️ Tecnologías

- **React 18**: Framework de UI
- **Vite**: Build tool y dev server
- **Google Generative AI (Gemini)**: IA para generación de perfiles
- **jsPDF**: Generación de PDFs en el cliente
- **pdfjs-dist**: Procesamiento de PDFs para extraer información
- **CSS3**: Estilos modernos con animaciones y transiciones

## 📁 Estructura del Proyecto

```
mate-evaluacion-competencias/
├── src/
│   ├── components/
│   │   ├── EvaluacionCompetencias.jsx    # Componente principal
│   │   └── EvaluacionCompetencias.css    # Estilos del componente
│   ├── services/
│   │   ├── geminiService.js              # Servicio de integración con Gemini
│   │   └── pdfProcessor.js               # Procesamiento de PDFs MATE anterior
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── README.md
```

## 🔐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_GEMINI_API_KEY_1=tu_api_key_1
VITE_GEMINI_API_KEY_2=tu_api_key_2
VITE_GEMINI_API_KEY_3=tu_api_key_3
VITE_GEMINI_API_KEY_4=tu_api_key_4
```

## 🚀 Despliegue

El proyecto está configurado para desplegarse en **Vercel**:

1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno en Vercel
3. El despliegue se realizará automáticamente en cada push a `main`

## 📝 Notas Importantes

- El sistema guarda automáticamente el progreso en `localStorage`
- Los PDFs del MATE anterior deben seguir el formato estándar de Konecta
- El sistema detecta automáticamente las categorías (Mantener, Alentar, Transformar, Evitar) del PDF anterior
- El botón "Reiniciar MATE" limpia todo el `localStorage` y reinicia la evaluación

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de Konecta y está destinado para uso interno.

---

**Desarrollado para Konecta CONO SUR 2025**
