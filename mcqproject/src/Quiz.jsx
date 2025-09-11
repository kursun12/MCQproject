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
  // Store selected indices as an array for both single/multi
  const [selected, setSelected] = useState([]);
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
  const correct = Array.isArray(question.answers)
    ? question.answers
    : Array.isArray(question.answer)
    ? question.answer
    : Number.isFinite(question.answer)
    ? [question.answer]
    : [];
  const isMulti = correct.length > 1;

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
    if (isMulti) {
      const set = new Set(selected);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      setSelected(Array.from(set).sort((a, b) => a - b));
    } else {
      setSelected([index]);
    }
  };

  const handleNext = () => {
    if (!selected || selected.length === 0) return;
    const selSet = new Set(selected);
    const corSet = new Set(correct);
    const isCorrect = selSet.size === corSet.size && [...corSet].every((i) => selSet.has(i));
    if (isCorrect) {
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
    setSelected([]);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected([]);
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
          {questions.map((q, idx) => {
            const corr = Array.isArray(q.answers)
              ? q.answers
              : Array.isArray(q.answer)
              ? q.answer
              : Number.isFinite(q.answer)
              ? [q.answer]
              : [];
            const sel = Array.isArray(answers[idx]) ? answers[idx] : [];
            const selSet = new Set(sel);
            const corSet = new Set(corr);
            const correctMatch = selSet.size === corSet.size && [...corSet].every((i) => selSet.has(i));
            const renderOpts = (arr) => arr.map((i) => q.options[i]).join(', ');
            return (
              <li key={q.id} className="review-question">
                <p>{q.question}</p>
                <p>
                  Your answer:{' '}
                  <span className={correctMatch ? 'correct' : 'incorrect'}>
                    {renderOpts(sel)}
                  </span>
                </p>
                {!correctMatch && (
                  <p>
                    Correct answer{corr.length > 1 ? 's' : ''}:{' '}
                    <span className="correct">{renderOpts(corr)}</span>
                  </p>
                )}
              </li>
            );
          })}
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
            <label className={selected.includes(idx) ? 'selected' : ''}>
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                name="option"
                value={idx}
                checked={selected.includes(idx)}
                onChange={() => handleOption(idx)}
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>
      {selected.length > 0 && (
        <p className="explanation">{question.explanation}</p>
      )}
      <button className="next" onClick={handleNext} disabled={selected.length === 0}>
        {current + 1 === questions.length ? 'Finish' : 'Next'}
      </button>
    </div>
  );
}

export default Quiz;
