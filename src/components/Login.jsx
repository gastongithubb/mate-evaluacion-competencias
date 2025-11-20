import { useState, useEffect } from 'react'
import './Login.css'

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@konecta.com'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  useEffect(() => {
    // Cargar el script de Google Identity Services
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        setGoogleLoaded(true)
      }
      script.onerror = () => {
        setError('Error al cargar el servicio de Google. Por favor, recarga la página.')
      }
      document.head.appendChild(script)
    } else {
      setGoogleLoaded(true)
    }
  }, [])

  const handleGoogleSignIn = () => {
    setError('')
    
    if (!GOOGLE_CLIENT_ID) {
      setError('Error de configuración: No se ha configurado el Google Client ID. Por favor, verifica tu archivo .env')
      return
    }

    if (!googleLoaded || !window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setError('El servicio de Google aún no está cargado. Por favor, espera un momento e intenta nuevamente.')
      return
    }

    setLoading(true)

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          try {
            // Verificar si hay error en la respuesta
            if (tokenResponse.error) {
              throw new Error(tokenResponse.error)
            }

            if (!tokenResponse.access_token) {
              throw new Error('No se recibió token de acceso')
            }

            // Obtener información del usuario desde la API de Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`
              }
            })

            if (!userInfoResponse.ok) {
              const errorText = await userInfoResponse.text()
              throw new Error(`Error al obtener información del usuario: ${userInfoResponse.status} - ${errorText}`)
            }

            const userInfo = await userInfoResponse.json()
            const userEmail = userInfo.email

            // Validar que se obtuvo el email
            if (!userEmail) {
              throw new Error('No se pudo obtener el correo electrónico del usuario')
            }

            // Validar que el correo sea del dominio permitido
            if (!userEmail.toLowerCase().endsWith(ALLOWED_DOMAIN.toLowerCase())) {
              setError(`Solo se permiten correos con dominio ${ALLOWED_DOMAIN}. Tu correo (${userEmail}) no está autorizado.`)
              setLoading(false)
              return
            }

            // Guardar sesión en localStorage
            const userData = {
              email: userEmail.toLowerCase(),
              name: userInfo.name || userEmail,
              picture: userInfo.picture || '',
              loginTime: new Date().toISOString()
            }
            
            localStorage.setItem('mate_user', JSON.stringify(userData))
            localStorage.setItem('mate_authenticated', 'true')
            
            // Llamar al callback de login
            onLogin(userData)
          } catch (err) {
            console.error('Error en el callback de Google OAuth:', err)
            setError(err.message || 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.')
            setLoading(false)
          }
        }
      })

      // Solicitar el token de acceso
      tokenClient.requestAccessToken()
    } catch (err) {
      console.error('Error al inicializar Google OAuth:', err)
      setError('Error al iniciar sesión con Google. Por favor, intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.svg" alt="MATE Logo" className="login-logo" />
          <h1>Evaluación de Competencias</h1>
          <p className="login-subtitle">Sistema MATE - Konecta</p>
        </div>
        
        <div className="login-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleSignIn}
            disabled={loading || !GOOGLE_CLIENT_ID || !googleLoaded}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Iniciar sesión con Google</span>
              </>
            )}
          </button>

          {!GOOGLE_CLIENT_ID && (
            <p className="config-warning">
              ⚠️ No se ha configurado el Google Client ID. Por favor, agrega VITE_GOOGLE_CLIENT_ID en tu archivo .env
            </p>
          )}
        </div>

        <div className="login-footer">
          <p className="login-info">
            Solo personal autorizado de Konecta puede acceder a este sistema.
          </p>
          <p className="login-info-small">
            Debes usar una cuenta de Google con dominio {ALLOWED_DOMAIN}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
