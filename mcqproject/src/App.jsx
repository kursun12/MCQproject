import './App.css';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Quiz from './Quiz.jsx';
import LandingPage from './LandingPage.jsx';
import Settings from './Settings.jsx';
import ImportQuestions from './Import.jsx';

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <div className="app">
        <h1>MCQ Practice</h1>
        <nav className="nav">
          <div className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            <NavLink to="/import">Questions</NavLink>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </nav>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/import" element={<ImportQuestions />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

