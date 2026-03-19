import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Remove splash loader once React mounts
const splash = document.getElementById('splash-loader')
if (splash) {
  splash.style.transition = 'opacity 0.3s ease-out'
  splash.style.opacity = '0'
  setTimeout(() => splash.remove(), 300)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
