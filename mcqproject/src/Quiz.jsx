import { useState, useRef } from 'react';
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
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(() => {
    const stored = parseInt(localStorage.getItem('maxStreak'), 10);
    return Number.isFinite(stored) ? stored : 0;
  });
  const [achievement, setAchievement] = useState('');
  const audioCtxRef = useRef(null);

  const question = questions[current];

  const playTone = (freq) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.start();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* ignore audio errors */
    }
  };

  const handleOption = (index) => {
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null) return;
    if (selected === question.answer) {
      setScore(score + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
        localStorage.setItem('maxStreak', String(newStreak));
      }
      if ([3, 5, 10].includes(newStreak)) {
        const msg = `${newStreak} correct in a row!`;
        setAchievement(msg);
        setTimeout(() => setAchievement(''), 3000);
      }
      playTone(880);
    } else {
      setStreak(0);
      playTone(440);
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
    setStreak(0);
    setAchievement('');
  };

  const share = () => {
    const text = `I scored ${score}/${questions.length} with a best streak of ${maxStreak} on MCQ Practice!`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => alert('Result copied to clipboard'));
    }
  };

  if (finished) {
    return (
      <div className="result card">
        <h2>Your Score</h2>
        <p>
          {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
        <p>Best streak: {maxStreak}</p>
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
        <button onClick={share}>Share</button>
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
      <div className="scoreboard">
        <span>Score: {score}</span>
        <span>Streak: {streak}</span>
        <span>Best: {maxStreak}</span>
      </div>
      {achievement && <div className="achievement">🏆 {achievement}</div>}
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
