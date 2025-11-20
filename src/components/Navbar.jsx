import { useState, useEffect, useRef } from 'react'
import './Navbar.css'

function Navbar({ user, onLogout, onReiniciarMATE, showReiniciar = true }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleEmailClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleLogout = () => {
    setIsDropdownOpen(false)
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src="/logo.svg" alt="MATE Logo" className="navbar-logo" />
        <span className="navbar-title">MATE</span>
      </div>
      <div className="navbar-right">
        {showReiniciar && onReiniciarMATE && (
          <button 
            className="navbar-btn navbar-btn-reiniciar"
            onClick={onReiniciarMATE}
            title="Reiniciar MATE - Borrar todos los datos"
          >
            <svg className="navbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Reiniciar MATE</span>
          </button>
        )}
        {user && (
          <div className="navbar-user" ref={dropdownRef}>
            <button 
              className="navbar-email-btn"
              onClick={handleEmailClick}
              title="Menú de usuario"
            >
              <span className="navbar-email">{user.email}</span>
              <svg 
                className={`navbar-email-chevron ${isDropdownOpen ? 'open' : ''}`}
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="navbar-dropdown">
                {onLogout && (
                  <button 
                    className="navbar-dropdown-item"
                    onClick={handleLogout}
                  >
                    <svg className="navbar-dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

