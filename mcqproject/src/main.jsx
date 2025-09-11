import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: basic service worker registration (works in build/preview)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try { navigator.serviceWorker.register('/sw.js'); } catch {}
  });
}
