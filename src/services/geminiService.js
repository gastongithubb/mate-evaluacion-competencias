import { GoogleGenerativeAI } from '@google/generative-ai'

// Obtener múltiples API keys desde variables de entorno
const GEMINI_API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4
].filter(key => key && key.trim() !== '') // Filtrar keys vacías

// Log informativo al cargar (solo en desarrollo)
if (import.meta.env.DEV) {
  if (GEMINI_API_KEYS.length === 0) {
    console.warn('⚠️  No se encontraron API keys de Gemini. Configura VITE_GEMINI_API_KEY_1, etc. en tu archivo .env')
  } else {
    console.log(`✅ ${GEMINI_API_KEYS.length} API key(s) de Gemini configurada(s)`)
  }
}

// Inicializar clientes para cada API key
const geminiClients = GEMINI_API_KEYS.map(key => new GoogleGenerativeAI(key))

// Contador para rotar entre API keys
let currentKeyIndex = 0
const keyErrors = new Map() // Track errores de cada key

// Caché simple en memoria
const cache = new Map()
const CACHE_TTL = 3600000 // 1 hora en milisegundos

// Generar hash para caché
function generateCacheKey(prompt, nombreAsesor) {
  return `${prompt.substring(0, 50)}_${nombreAsesor}`.replace(/\s+/g, '_')
}

// Obtener la siguiente API key disponible (rotación inteligente)
function getNextAvailableKey() {
  if (geminiClients.length === 0) {
    throw new Error('No hay API keys configuradas. Configura VITE_GEMINI_API_KEY_1, VITE_GEMINI_API_KEY_2, etc. en tu archivo .env')
  }
  
  // Buscar key con menos errores recientes
  let bestKeyIndex = currentKeyIndex
  let minErrors = keyErrors.get(currentKeyIndex) || 0
  
  for (let i = 0; i < geminiClients.length; i++) {
    const errors = keyErrors.get(i) || 0
    if (errors < minErrors) {
      minErrors = errors
      bestKeyIndex = i
    }
  }
  
  currentKeyIndex = bestKeyIndex
  return bestKeyIndex
}

// Generar con Gemini usando rotación de API keys
async function generarConGemini(prompt, keyIndex) {
  const modelos = [
    'gemini-2.5-flash',      // Más rápido, menos tokens
    'gemini-2.5-pro',        // Máxima calidad
    'gemini-2.0-flash',      // Alternativa
    'gemini-2.5-flash-lite'  // Más rápido
  ]
  
  const client = geminiClients[keyIndex]
  
  for (const modelo of modelos) {
    try {
      const model = client.getGenerativeModel({ model: modelo })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const texto = response.text()
      
      // Resetear contador de errores si fue exitoso
      keyErrors.set(keyIndex, 0)
      
      return texto
    } catch (error) {
      // Si es error 404 (modelo no encontrado), intentar siguiente modelo
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        continue
      }
      
      // Si es error de rate limit o quota, marcar esta key y rotar
      if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('limit'))) {
        console.warn(`⚠️  Rate limit en API Key ${keyIndex + 1}, rotando...`)
        keyErrors.set(keyIndex, (keyErrors.get(keyIndex) || 0) + 1)
        throw new Error('RATE_LIMIT')
      }
      
      // Otro tipo de error, lanzar
      throw error
    }
  }
  
  throw new Error('Todos los modelos de Gemini fallaron')
}

export async function generarPerfil(prompt, nombreAsesor) {
  // Verificar caché
  const cacheKey = generateCacheKey(prompt, nombreAsesor)
  const cached = cache.get(cacheKey)
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('✅ Perfil obtenido desde caché')
    return cached.perfil
  }
  
  // Limpiar caché expirado periódicamente
  if (Math.random() < 0.1) { // 10% de las veces
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key)
      }
    }
  }
  
  const maxIntentos = geminiClients.length * 2 // Intentar cada key hasta 2 veces
  let intentos = 0
  
  while (intentos < maxIntentos) {
    const keyIndex = getNextAvailableKey()
    
    try {
      console.log(`🔄 Intentando con API Key ${keyIndex + 1}/${geminiClients.length}...`)
      const resultado = await generarConGemini(prompt, keyIndex)
      console.log(`✅ Éxito con API Key ${keyIndex + 1}`)
      
      // Guardar en caché
      cache.set(cacheKey, {
        perfil: resultado,
        timestamp: Date.now()
      })
      
      return resultado
    } catch (error) {
      if (error.message === 'RATE_LIMIT') {
        // Rotar a siguiente key
        currentKeyIndex = (currentKeyIndex + 1) % geminiClients.length
        intentos++
        console.log(`⏭️  Rotando a siguiente API key...`)
        continue
      }
      
      console.error(`❌ Error con API Key ${keyIndex + 1}:`, error.message)
      keyErrors.set(keyIndex, (keyErrors.get(keyIndex) || 0) + 1)
      intentos++
      
      // Si hay más keys, intentar siguiente
      if (intentos < maxIntentos) {
        currentKeyIndex = (currentKeyIndex + 1) % geminiClients.length
        continue
      }
    }
  }
  
  throw new Error('Todas las API keys de Gemini han alcanzado sus límites. Por favor, intenta más tarde.')
}

