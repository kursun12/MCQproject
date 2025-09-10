import { useState } from 'react';

function Settings() {
  const [numQuestions, setNumQuestions] = useState(3);

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
    </div>
  );
}

export default Settings;
