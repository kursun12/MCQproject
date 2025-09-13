import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { set1, set2, set3, set4, set5 } from './questions.js';

// On first load, populate localStorage with the bundled question sets so
// users have a ready-to-use library without needing to import anything.
const defaultSets = { set1, set2, set3, set4, set5 };
const allQuestions = [...set1, ...set2, ...set3, ...set4, ...set5];
const LS_Q_KEY = 'questions';
const LS_S_KEY = 'sets';

if (!localStorage.getItem(LS_Q_KEY)) {
  try {
    localStorage.setItem(LS_Q_KEY, JSON.stringify(allQuestions));
  } catch {
    // Ignore write errors (e.g., storage disabled)
  }
}

if (!localStorage.getItem(LS_S_KEY)) {
  try {
    const sets = Object.entries(defaultSets).map(([name, arr]) => ({
      id: name,
      name,
      questionIds: arr.map((q) => q.id),
    }));
    localStorage.setItem(LS_S_KEY, JSON.stringify(sets));
  } catch {
    // Ignore write errors
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// PWA: basic service worker registration (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
