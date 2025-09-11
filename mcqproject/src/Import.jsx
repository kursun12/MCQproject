import { useState, useEffect } from 'react';

function ImportQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
  });
  const [sets, setSets] = useState([]);
  const [newSetName, setNewSetName] = useState('');
  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
    explanation: '',
    setIds: [],
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('questions') || '[]');
      const normalized = Array.isArray(stored)
        ? stored.map((q) => normalizeQuestion(q))
        : [];
      setQuestions(normalized);
    } catch {
      setQuestions([]);
    }
    try {
      const storedSets = JSON.parse(localStorage.getItem('sets') || '[]');
      setSets(Array.isArray(storedSets) ? storedSets : []);
    } catch {
      setSets([]);
    }
  }, []);

  const normalizeQuestion = (q) => {
    const answers = Array.isArray(q.answers)
      ? q.answers
      : Array.isArray(q.answer)
      ? q.answer
      : Number.isFinite(q.answer)
      ? [q.answer]
      : [];
    // Ensure unique, in-range indices
    const validAnswers = Array.from(new Set(answers)).filter(
      (i) => Number.isInteger(i) && i >= 0 && i < (q.options?.length || 0)
    );
    return {
      id: q.id ?? Date.now(),
      question: q.question ?? '',
      options: q.options || [],
      answers: validAnswers,
      // Keep single answer for backward compatibility
      answer: validAnswers.length > 0 ? validAnswers[0] : 0,
      explanation: q.explanation || '',
    };
  };

  const persistQuestions = (arr) => {
    setQuestions(arr);
    localStorage.setItem('questions', JSON.stringify(arr));
    pruneSets(arr);
  };

  const persistSets = (arr) => {
    setSets(arr);
    localStorage.setItem('sets', JSON.stringify(arr));
  };

  const pruneSets = (updatedQuestions) => {
    const ids = new Set(updatedQuestions.map((q) => q.id));
    const cleaned = sets.map((s) => ({
      ...s,
      questionIds: (s.questionIds || []).filter((id) => ids.has(id)),
    }));
    persistSets(cleaned);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        const questionsWithIds = parsed.map((q, idx) =>
          normalizeQuestion({ ...q, id: q.id ?? Date.now() + idx })
        );
        persistQuestions(questionsWithIds);
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
    const normalized = normalizeQuestion(q);
    setDraft({
      question: normalized.question,
      options: [...normalized.options],
      answers: [...normalized.answers],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    const updated = questions.map((q) =>
      q.id === editingId
        ? normalizeQuestion({ ...q, ...draft, id: q.id })
        : q
    );
    persistQuestions(updated);
    setEditingId(null);
  };

  const deleteQuestion = (id) => {
    const updated = questions.filter((q) => q.id !== id);
    persistQuestions(updated);
  };

  const addQuestion = () => {
    const id = Date.now();
    const q = normalizeQuestion({ ...newQ, id });
    const updated = [...questions, q];
    persistQuestions(updated);
    if (newQ.setIds.length > 0) {
      const updatedSets = sets.map((s) =>
        newQ.setIds.includes(s.id)
          ? { ...s, questionIds: Array.from(new Set([...(s.questionIds || []), id])) }
          : s
      );
      persistSets(updatedSets);
    }
    setNewQ({ question: '', options: ['', '', '', ''], answers: [], explanation: '', setIds: [] });
  };

  const addSet = () => {
    const name = newSetName.trim();
    if (!name) return;
    const id = Date.now();
    const newSets = [...sets, { id, name, questionIds: [] }];
    persistSets(newSets);
    setNewSetName('');
  };

  const renameSet = (id, name) => {
    const newSets = sets.map((s) => (s.id === id ? { ...s, name } : s));
    persistSets(newSets);
  };

  const deleteSet = (id) => {
    const newSets = sets.filter((s) => s.id !== id);
    persistSets(newSets);
  };

  const toggleQuestionInSet = (setId, qId, checked) => {
    const newSets = sets.map((s) => {
      if (s.id !== setId) return s;
      const current = new Set(s.questionIds || []);
      if (checked) current.add(qId);
      else current.delete(qId);
      return { ...s, questionIds: Array.from(current) };
    });
    persistSets(newSets);
  };

  const toggleNewQSet = (setId, checked) => {
    const cur = new Set(newQ.setIds || []);
    if (checked) cur.add(setId);
    else cur.delete(setId);
    setNewQ({ ...newQ, setIds: Array.from(cur) });
  };

  return (
    <div className="card">
      <h2>Questions</h2>
      <input type="file" accept=".json" onChange={handleFile} />
      {error && <p className="error">{error}</p>}
      {questions.length > 0 && <p>Loaded {questions.length} questions.</p>}
      <hr />
      <h3>Add Question Manually</h3>
      <textarea
        placeholder="Question text"
        value={newQ.question}
        onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
      />
      {newQ.options.map((opt, idx) => (
        <div key={idx}>
          <input
            type="text"
            placeholder={`Option ${idx + 1}`}
            value={opt}
            onChange={(e) => {
              const opts = [...newQ.options];
              opts[idx] = e.target.value;
              setNewQ({ ...newQ, options: opts });
            }}
          />
          <label>
            <input
              type="checkbox"
              checked={newQ.answers.includes(idx)}
              onChange={(e) => {
                const set = new Set(newQ.answers);
                if (e.target.checked) set.add(idx);
                else set.delete(idx);
                setNewQ({ ...newQ, answers: Array.from(set).sort((a,b)=>a-b) });
              }}
            />
            Correct
          </label>
        </div>
      ))}
      <button onClick={() => setNewQ({ ...newQ, options: [...newQ.options, ''] })}>+ Option</button>
      <div>
        <input
          type="text"
          placeholder="Explanation (optional)"
          value={newQ.explanation}
          onChange={(e) => setNewQ({ ...newQ, explanation: e.target.value })}
        />
      </div>
      {sets.length > 0 && (
        <div>
          <p>Assign to set(s):</p>
          {sets.map((s) => (
            <label key={s.id} style={{ marginRight: '1rem' }}>
              <input
                type="checkbox"
                checked={newQ.setIds.includes(s.id)}
                onChange={(e) => toggleNewQSet(s.id, e.target.checked)}
              />
              {s.name}
            </label>
          ))}
        </div>
      )}
      <button onClick={addQuestion}>Add Question</button>

      <hr />
      <h3>Manage Sets</h3>
      <div>
        <input
          type="text"
          placeholder="New set name"
          value={newSetName}
          onChange={(e) => setNewSetName(e.target.value)}
        />
        <button onClick={addSet}>Add Set</button>
      </div>
      {sets.length > 0 && (
        <ul className="set-list">
          {sets.map((s) => (
            <li key={s.id}>
              <input
                type="text"
                value={s.name}
                onChange={(e) => renameSet(s.id, e.target.value)}
              />
              <span style={{ marginLeft: '0.5rem' }}>({(s.questionIds || []).length} questions)</span>
              <button onClick={() => deleteSet(s.id)} style={{ marginLeft: '0.5rem' }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
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
                          type="checkbox"
                          name={`answer-${idx}`}
                          checked={draft.answers.includes(idx)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const set = new Set(draft.answers);
                            if (checked) set.add(idx);
                            else set.delete(idx);
                            setDraft({ ...draft, answers: Array.from(set).sort((a,b)=>a-b) });
                          }}
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                  {sets.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p>Set membership:</p>
                      {sets.map((s) => (
                        <label key={s.id} style={{ marginRight: '1rem' }}>
                          <input
                            type="checkbox"
                            checked={(s.questionIds || []).includes(q.id)}
                            onChange={(e) => toggleQuestionInSet(s.id, q.id, e.target.checked)}
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <div>
                  <p>{q.question}</p>
                  {sets.length > 0 && (
                    <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
                      Sets: {
                        sets
                          .filter((s) => (s.questionIds || []).includes(q.id))
                          .map((s) => s.name)
                          .join(', ') || '—'
                      }
                    </p>
                  )}
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
