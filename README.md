# Sistema de Evaluación de Competencias - MATE

Sistema web para evaluar competencias de asesores basado en el Manual de Competencias, utilizando IA generativa de Google Gemini.

## Características

- Formulario simple para ingresar el nombre del asesor
- Preguntas disparadoras organizadas por competencias
- Generación automática de perfil de competencias usando Gemini AI
- Interfaz limpia y profesional

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar API keys de Gemini:
```bash
cp .env.example .env
# Editar .env y agregar tus API keys de Gemini
# Puedes obtenerlas en: https://makersuite.google.com/app/apikey
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

**Nota:** El sistema soporta múltiples API keys de Gemini (hasta 4) para evitar límites de rate. Configura las keys en el archivo `.env` usando las variables `VITE_GEMINI_API_KEY_1` a `VITE_GEMINI_API_KEY_4`.

## Uso

1. Ingresa el nombre del asesor a evaluar
2. Responde las preguntas disparadoras para cada competencia
3. Haz clic en "Generar Perfil" para obtener el análisis completo
4. Revisa el perfil generado por la IA

## Estructura de Competencias

El sistema está basado en el Manual de Desarrollo de Competencias de Konecta CONO SUR 2025 e incluye las siguientes 13 competencias organizadas en 4 categorías:

### PERSONAL
- Mentalidad Ágil (Adaptabilidad)
- Engagement (Compromiso Laboral)
- Confianza (Integridad)

### RELACIONAL
- Comunicación Digital (Comunicación Efectiva)
- Colaboración Remota (Trabajo en Equipo)

### LOGRO Y ACCIÓN
- Foco en Data (Análisis y Resolución de Problemas)
- Learning Agility (Espíritu Emprendedor)
- Orientación a Resultados

### NEGOCIO
- Mindset Digital (Innovación)
- Liderazgo Konecta
- Experiencia del Cliente (CX)
- Orientación Comercial / Mercado
- Prospectiva Estratégica (Visión Estratégica)

## Tecnologías

- React 18
- Vite
- Google Generative AI (Gemini)

