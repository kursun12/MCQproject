import { useState } from 'react';
import defaultQuestions from './questions';

function Quiz() {
  const [questions] = useState(() => {
    try {
      const stored = localStorage.getItem('questions');
      const parsed = stored ? JSON.parse(stored) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore parse errors and fall back to defaults
    }
    return defaultQuestions;
  });
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const question = questions[current];

  const handleOption = (index) => {
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null) return;
    if (selected === question.answer) {
      setScore(score + 1);
    }
    setAnswers([...answers, selected]);
    setSelected(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    return (
      <div className="result card">
        <h2>Your Score</h2>
        <p>
          {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
        <ul className="review">
          {questions.map((q, idx) => (
            <li key={q.id} className="review-question">
              <p>{q.question}</p>
              <p>
                Your answer:{' '}
                <span
                  className={
                    answers[idx] === q.answer ? 'correct' : 'incorrect'
                  }
                >
                  {q.options[answers[idx]]}
                </span>
              </p>
              {answers[idx] !== q.answer && (
                <p>
                  Correct answer: <span className="correct">{q.options[q.answer]}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
        <button onClick={restart}>Restart</button>
      </div>
    );
  }

  return (
    <div className="quiz card">
      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: `${(current / questions.length) * 100}%` }}
        ></div>
      </div>
      <h2>
        Question {current + 1} of {questions.length}
      </h2>
      <p className="question">{question.question}</p>
      <ul className="options">
        {question.options.map((opt, idx) => (
          <li key={idx} className="option">
            <label className={selected === idx ? 'selected' : ''}>
              <input
                type="radio"
                name="option"
                value={idx}
                checked={selected === idx}
                onChange={() => handleOption(idx)}
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>
      {selected !== null && (
        <p className="explanation">{question.explanation}</p>
      )}
      <button className="next" onClick={handleNext} disabled={selected === null}>
        {current + 1 === questions.length ? 'Finish' : 'Next'}
      </button>
    </div>
  );
}

export default Quiz;
