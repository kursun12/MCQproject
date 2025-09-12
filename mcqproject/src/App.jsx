import './App.css';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Quiz from './Quiz.jsx';
import LandingPage from './LandingPage.jsx';
import Settings from './Settings.jsx';
import ImportQuestions from './Import.jsx';
import Review from './Review.jsx';
import RepeatBuilder from './RepeatBuilder.jsx';
import Toaster from './components/Toaster.jsx';
import HelpOverlay from './components/HelpOverlay.jsx';
import { loadKeymap } from './utils/keymap.js';

function ModeBadge() {
  const location = useLocation();
  const path = location.pathname;
  const mode = path === '/' ? 'Home' : path.replace('/', '').replace(/^[a-z]/, (m) => m.toUpperCase());
  return <span className="badge" title="Current mode" style={{ marginLeft: '0.5rem' }}>{mode}</span>;
}

function App() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
  );

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const keymap = loadKeymap();
      if (e.key === keymap.help) setShowHelp(true);
      if (e.key === keymap.close) setShowHelp(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <h1>
          MCQ Practice <span style={{fontSize: '0.7em', opacity: 0.7}}>v2025.09</span>
          <ModeBadge />
        </h1>
        <nav className="nav">
          <div className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/repeat">Repeat</NavLink>
            <NavLink to="/review">Review</NavLink>
            <NavLink to="/review?bookmarks=1">Bookmarks</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            <NavLink to="/import">Questions</NavLink>
          </div>
          <div className="mode-and-progress">
            <div className="bar top-progress"><div style={{ width: '0%' }}></div></div>
            <button className="theme-toggle icon-btn" onClick={toggleTheme}>
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/repeat" element={<RepeatBuilder />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/import" element={<ImportQuestions />} />
        </Routes>
        <Toaster />
        <HelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;

