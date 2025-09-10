import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Quiz from './Quiz.jsx';
import LandingPage from './LandingPage.jsx';
import Settings from './Settings.jsx';
import ImportQuestions from './Import.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <h1>MCQ Practice</h1>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/quiz">Quiz</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/import">Import</Link>
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

