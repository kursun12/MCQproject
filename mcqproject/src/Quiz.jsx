import { useState } from 'react';
import questions from './questions';

function Quiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  const handleOption = (index) => {
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null) return;
    if (selected === question.answer) {
      setScore(score + 1);
    }
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
  };

  if (finished) {
    return (
      <div className="result card">
        <h2>Your Score</h2>
        <p>
          {score} / {questions.length}
        </p>
        <button onClick={restart}>Restart</button>
      </div>
    );
  }

  return (
    <div className="quiz card">
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
      <button className="next" onClick={handleNext} disabled={selected === null}>
        {current + 1 === questions.length ? 'Finish' : 'Next'}
      </button>
    </div>
  );
}

export default Quiz;
