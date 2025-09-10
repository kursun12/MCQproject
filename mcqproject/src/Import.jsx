import { useState, useEffect } from 'react';

function ImportQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: 0,
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('questions') || '[]');
      setQuestions(stored);
    } catch {
      setQuestions([]);
    }
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        const questionsWithIds = parsed.map((q, idx) => ({
          id: q.id ?? Date.now() + idx,
          question: q.question,
          options: q.options || [],
          answer: q.answer ?? 0,
          explanation: q.explanation || '',
        }));
        setQuestions(questionsWithIds);
        localStorage.setItem('questions', JSON.stringify(questionsWithIds));
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setDraft({ question: q.question, options: [...q.options], answer: q.answer });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    const updated = questions.map((q) =>
      q.id === editingId ? { ...q, ...draft } : q
    );
    setQuestions(updated);
    localStorage.setItem('questions', JSON.stringify(updated));
    setEditingId(null);
  };

  const deleteQuestion = (id) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    localStorage.setItem('questions', JSON.stringify(updated));
  };

  return (
    <div className="card">
      <h2>Questions</h2>
      <input type="file" accept=".json" onChange={handleFile} />
      {error && <p className="error">{error}</p>}
      {questions.length > 0 && <p>Loaded {questions.length} questions.</p>}
      {questions.length > 0 && (
        <ul className="question-list">
          {questions.map((q) => (
            <li key={q.id} className="question-item">
              {editingId === q.id ? (
                <div>
                  <textarea
                    value={draft.question}
                    onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  />
                  {draft.options.map((opt, idx) => (
                    <div key={idx}>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...draft.options];
                          opts[idx] = e.target.value;
                          setDraft({ ...draft, options: opts });
                        }}
                      />
                      <label>
                        <input
                          type="radio"
                          name="answer"
                          checked={draft.answer === idx}
                          onChange={() => setDraft({ ...draft, answer: idx })}
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <div>
                  <p>{q.question}</p>
                  <button onClick={() => startEdit(q)}>Edit</button>
                  <button onClick={() => deleteQuestion(q.id)}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ImportQuestions;
