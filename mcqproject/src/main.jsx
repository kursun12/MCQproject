import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {
  set1,
  set2,
  set3,
  set4,
  set5,
  set6,
  set7,
  set8,
  set9,
} from './questions.js';
import { syncLocalStorage } from './utils/storage.js';

// On first load, populate localStorage with the bundled question sets so
// users have a ready-to-use library without needing to import anything.
const defaultSets = { set1, set2, set3, set4, set5, set6, set7, set8, set9 };
const allQuestions = [
  ...set1,
  ...set2,
  ...set3,
  ...set4,
  ...set5,
  ...set6,
  ...set7,
  ...set8,
  ...set9,
];
const LS_Q_KEY = 'questions';
const LS_S_KEY = 'sets';

syncLocalStorage(defaultSets, allQuestions, localStorage, LS_Q_KEY, LS_S_KEY);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// PWA: basic service worker registration (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `/sw.js?ts=${Date.now()}`;
    navigator.serviceWorker.register(swUrl);
  });
}
