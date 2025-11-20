import { useState, useEffect, useRef } from 'react'
import EvaluacionCompetencias from './components/EvaluacionCompetencias'
import Login from './components/Login'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const reiniciarMATERef = useRef(null)

  useEffect(() => {
    // Verificar si hay sesión guardada
    const authenticated = localStorage.getItem('mate_authenticated')
    const userData = localStorage.getItem('mate_user')

    if (authenticated === 'true' && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error al parsear datos de usuario:', error)
        localStorage.removeItem('mate_authenticated')
        localStorage.removeItem('mate_user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('mate_authenticated')
    localStorage.removeItem('mate_user')
    setIsAuthenticated(false)
    setUser(null)
  }

  const handleReiniciarMATE = () => {
    // Llamar a la función de reinicio de EvaluacionCompetencias si existe
    if (reiniciarMATERef.current) {
      reiniciarMATERef.current()
    }
  }

  if (loading) {
    return (
      <>
        <Navbar user={user} onLogout={null} onReiniciarMATE={null} showReiniciar={false} />
        <div className="app loading">
          <div className="loading-spinner">Cargando...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar 
        user={user} 
        onLogout={isAuthenticated ? handleLogout : null} 
        onReiniciarMATE={isAuthenticated ? handleReiniciarMATE : null} 
        showReiniciar={isAuthenticated}
      />
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app">
          <EvaluacionCompetencias user={user} onLogout={handleLogout} onReiniciarMATE={reiniciarMATERef} />
        </div>
      )}
    </>
  )
}

export default App

