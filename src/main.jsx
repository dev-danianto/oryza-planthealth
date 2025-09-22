import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'



const container = document.getElementById('root')
if (!container) {
  console.error('Root container #root not found')
} else {
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error || e.message)
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
})
