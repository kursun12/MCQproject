import { useState, useEffect } from 'react';

function Settings() {
  const [numQuestions, setNumQuestions] = useState(() => {
    const stored = parseInt(localStorage.getItem('numQuestions'), 10);
    return Number.isFinite(stored) ? stored : 3;
  });
  const [shuffleQs, setShuffleQs] = useState(() => localStorage.getItem('shuffleQs') === 'true');
  const [shuffleOpts, setShuffleOpts] = useState(() => localStorage.getItem('shuffleOpts') === 'true');

  useEffect(() => {
    localStorage.setItem('shuffleQs', shuffleQs);
  }, [shuffleQs]);

  useEffect(() => {
    localStorage.setItem('shuffleOpts', shuffleOpts);
  }, [shuffleOpts]);

  useEffect(() => {
    localStorage.setItem('numQuestions', numQuestions);
  }, [numQuestions]);

  const count = (() => {
    try {
      return JSON.parse(localStorage.getItem('questions') || '[]').length;
    } catch {
      return 0;
    }
  })();

  const clearQuestions = () => {
    if (window.confirm('Delete all questions?')) {
      localStorage.removeItem('questions');
      window.location.reload();
    }
  };

  return (
    <div className="card">
      <h2>Settings</h2>
      <label>
        Number of questions
        <input
          type="number"
          min="1"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={shuffleQs}
          onChange={(e) => setShuffleQs(e.target.checked)}
        />
        Shuffle questions
      </label>
      <label>
        <input
          type="checkbox"
          checked={shuffleOpts}
          onChange={(e) => setShuffleOpts(e.target.checked)}
        />
        Shuffle options
      </label>
      <p>Loaded questions: {count}</p>
      {count > 0 && <button onClick={clearQuestions}>Clear All</button>}
    </div>
  );
}

export default Settings;
