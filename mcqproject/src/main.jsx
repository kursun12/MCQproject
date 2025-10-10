import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { CertificationProvider } from './context/CertificationContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fallbackMessage="Something went wrong while rendering MCQ Practice." onReset={() => window.location.reload()}>
      <CertificationProvider>
        <App />
      </CertificationProvider>
    </ErrorBoundary>
  </StrictMode>,
)
// PWA: basic service worker registration (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `/sw.js?ts=${Date.now()}`;
    navigator.serviceWorker.register(swUrl);
  });
}
