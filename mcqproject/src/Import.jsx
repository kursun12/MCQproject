import { useState } from 'react';

function ImportQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = reader.result.trim().split(/\r?\n/).filter(Boolean);
        const [, ...data] = rows; // drop header
        const parsed = data.map((row, idx) => {
          const cols = row.split(',');
          const answer = ['A', 'B', 'C', 'D'].indexOf(
            cols[5]?.trim().toUpperCase()
          );
          return {
            id: idx + 1,
            question: cols[0],
            options: cols.slice(1, 5),
            answer,
          };
        });
        setQuestions(parsed);
        localStorage.setItem('questions', JSON.stringify(parsed));
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="card">
      <h2>Import Questions</h2>
      <input type="file" accept=".csv" onChange={handleFile} />
      {error && <p className="error">{error}</p>}
      {questions.length > 0 && <p>Loaded {questions.length} questions.</p>}
      {questions.length > 0 && (
        <ul>
          {questions.map((q) => (
            <li key={q.id}>{q.question}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ImportQuestions;
