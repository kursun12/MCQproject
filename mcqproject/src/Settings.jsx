import { useState, useEffect } from 'react';
import { toast } from './utils/toast.js';
import { loadRepeatSettings, saveRepeatSettings } from './repeat/settings';
import { loadKeymap, saveKeymap, defaultKeymap } from './utils/keymap.js';

function Settings() {
  const [numQuestions, setNumQuestions] = useState(() => {
    const stored = Number.parseInt(localStorage.getItem('defaultQuestionCount') || '3', 10);
    return Number.isFinite(stored) && stored > 0 ? stored : 3;
  });
  const [shuffleQs, setShuffleQs] = useState(() => localStorage.getItem('shuffleQs') === 'true');
  const [shuffleOpts, setShuffleOpts] = useState(() => localStorage.getItem('shuffleOpts') === 'true');
  const [instantReveal, setInstantReveal] = useState(() => localStorage.getItem('instantReveal') === 'true');
  const [feedbackTrigger, setFeedbackTrigger] = useState(() => localStorage.getItem('feedbackTrigger') || 'onNext');
  const [testQuick, setTestQuick] = useState(() => localStorage.getItem('testQuick') === 'true');
  const [testNoChange, setTestNoChange] = useState(() => localStorage.getItem('testNoChange') === 'true');
  const [partialCredit, setPartialCredit] = useState(() => localStorage.getItem('partialCredit') === 'true');
  const [repeatCfg, setRepeatCfg] = useState(() => loadRepeatSettings());
  const [keymap, setKeymap] = useState(() => loadKeymap());

  useEffect(() => {
    localStorage.setItem('defaultQuestionCount', String(numQuestions));
  }, [numQuestions]);
  useEffect(() => {
    localStorage.setItem('shuffleQs', shuffleQs);
  }, [shuffleQs]);
  useEffect(() => {
    localStorage.setItem('shuffleOpts', shuffleOpts);
  }, [shuffleOpts]);
  useEffect(() => {
    localStorage.setItem('instantReveal', instantReveal);
  }, [instantReveal]);
  useEffect(() => {
    localStorage.setItem('partialCredit', partialCredit);
  }, [partialCredit]);
  useEffect(() => {
    localStorage.setItem('feedbackTrigger', feedbackTrigger);
  }, [feedbackTrigger]);
  useEffect(() => {
    localStorage.setItem('testQuick', testQuick);
  }, [testQuick]);
  useEffect(() => {
    localStorage.setItem('testNoChange', testNoChange);
  }, [testNoChange]);
  useEffect(() => { saveRepeatSettings(repeatCfg); }, [repeatCfg]);
  useEffect(() => { saveKeymap(keymap); }, [keymap]);

  const loadedQuestionCount = (() => {
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
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="muted">Tune your session experience. Changes save automatically.</p>
      </div>
      <div className="settings-grid">
        <section className="settings-panel card">
          <h3>Session</h3>
          <div className="settings-field">
            <label htmlFor="settings-question-count">Number of questions</label>
            <input
              id="settings-question-count"
              type="number"
              min="1"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value) || 1)}
            />
          </div>
          <div className="settings-stack">
            <label className="toggle">
              <input
                type="checkbox"
                checked={shuffleQs}
                onChange={(e) => { setShuffleQs(e.target.checked); toast('Shuffle questions updated'); }}
              />
              Shuffle questions
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={shuffleOpts}
                onChange={(e) => { setShuffleOpts(e.target.checked); toast('Shuffle options updated'); }}
              />
              Shuffle options
            </label>
          </div>
          <div className="settings-field">
            <label htmlFor="settings-feedback">Feedback timing</label>
            <select
              id="settings-feedback"
              value={feedbackTrigger}
              onChange={(e) => { setFeedbackTrigger(e.target.value); toast('Feedback timing updated'); }}
            >
              <option value="onSelect">On select (single immediately; multi when all chosen)</option>
              <option value="onNext">On Next (press to reveal, then continue)</option>
            </select>
          </div>
          <div className="settings-stack">
            <label className="toggle">
              <input
                type="checkbox"
                checked={instantReveal}
                onChange={(e) => { setInstantReveal(e.target.checked); toast('Explanation visibility updated'); }}
              />
              Show explanation after reveal
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={partialCredit}
                onChange={(e) => { setPartialCredit(e.target.checked); toast('Partial credit updated'); }}
              />
              Partial credit (multi)
            </label>
          </div>
          <div className="settings-box">
            <strong>Test mode options</strong>
            <label className="toggle">
              <input
                type="checkbox"
                checked={testQuick}
                onChange={(e) => { setTestQuick(e.target.checked); toast('Test quick mode updated'); }}
              />
              Quick mode (single-tap answers advance)
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={testNoChange}
                onChange={(e) => { setTestNoChange(e.target.checked); toast('Answer change lock updated'); }}
              />
              Lock answers (can&apos;t change once selected)
            </label>
          </div>
        </section>

        <section className="settings-panel card">
          <h3>Data</h3>
          <p className="muted">Loaded questions: {loadedQuestionCount}</p>
          <button className="btn-danger" onClick={clearQuestions}>
            Clear All
          </button>
        </section>

        <section className="settings-panel card">
          <h3>Repeat Adaptive</h3>
          <div className="settings-grid-small">
            <div className="settings-field">
              <label htmlFor="settings-mastery">Mastery type</label>
              <select
                id="settings-mastery"
                value={repeatCfg.masteryType}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, masteryType: e.target.value })}
              >
                <option value="consecutive">Consecutive</option>
                <option value="ratio">3 of last 4</option>
              </select>
            </div>
            <div className="settings-field">
              <label htmlFor="settings-target">Target</label>
              <input
                id="settings-target"
                type="number"
                min="1"
                value={repeatCfg.masteryTarget}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, masteryTarget: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-cooldown">Cooldown (s)</label>
              <input
                id="settings-cooldown"
                type="number"
                min="0"
                value={repeatCfg.cooldownSeconds}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, cooldownSeconds: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-leech">Leech threshold</label>
              <input
                id="settings-leech"
                type="number"
                min="0"
                value={repeatCfg.leechThreshold}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, leechThreshold: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="settings-stack">
            <label className="toggle">
              <input
                type="checkbox"
                checked={repeatCfg.strictMultiAnswer}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, strictMultiAnswer: e.target.checked })}
              />
              Strict multi-answer
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={repeatCfg.partialCreditMode}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, partialCreditMode: e.target.checked })}
              />
              Partial credit
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={repeatCfg.autoRevealExplanationOnError}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, autoRevealExplanationOnError: e.target.checked })}
              />
              Auto-show explanation on wrong
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={repeatCfg.autoSkipOnWrong}
                onChange={(e) => setRepeatCfg({ ...repeatCfg, autoSkipOnWrong: e.target.checked })}
              />
              Auto-skip on wrong
            </label>
          </div>
        </section>

        <section className="settings-panel settings-panel--wide card">
          <h3>Keyboard</h3>
          <p className="muted">Click a field, then press a key.</p>
          <div className="settings-keymap">
            {keymap.options.map((k, i) => (
              <label key={i} htmlFor={`settings-key-${i}`}>
                Option {i + 1}
                <input
                  id={`settings-key-${i}`}
                  type="text"
                  value={k}
                  onKeyDown={(e) => {
                    e.preventDefault();
                    const opts = [...keymap.options];
                    opts[i] = e.key;
                    setKeymap({ ...keymap, options: opts });
                    toast('Shortcut updated');
                  }}
                  onChange={() => {}}
                />
              </label>
            ))}
            <label htmlFor="settings-key-next">
              Next
              <input
                id="settings-key-next"
                type="text"
                value={keymap.next}
                onKeyDown={(e) => {
                  e.preventDefault();
                  setKeymap({ ...keymap, next: e.key });
                  toast('Shortcut updated');
                }}
                onChange={() => {}}
              />
            </label>
            <label htmlFor="settings-key-prev">
              Prev
              <input
                id="settings-key-prev"
                type="text"
                value={keymap.prev}
                onKeyDown={(e) => {
                  e.preventDefault();
                  setKeymap({ ...keymap, prev: e.key });
                  toast('Shortcut updated');
                }}
                onChange={() => {}}
              />
            </label>
            <label htmlFor="settings-key-nextAlt">
              Alt Next
              <input
                id="settings-key-nextAlt"
                type="text"
                value={keymap.nextAlt}
                onKeyDown={(e) => {
                  e.preventDefault();
                  setKeymap({ ...keymap, nextAlt: e.key });
                  toast('Shortcut updated');
                }}
                onChange={() => {}}
              />
            </label>
            <label htmlFor="settings-key-help">
              Help
              <input
                id="settings-key-help"
                type="text"
                value={keymap.help}
                onKeyDown={(e) => {
                  e.preventDefault();
                  setKeymap({ ...keymap, help: e.key });
                  toast('Shortcut updated');
                }}
                onChange={() => {}}
              />
            </label>
            <label htmlFor="settings-key-close">
              Close
              <input
                id="settings-key-close"
                type="text"
                value={keymap.close}
                onKeyDown={(e) => {
                  e.preventDefault();
                  setKeymap({ ...keymap, close: e.key });
                  toast('Shortcut updated');
                }}
                onChange={() => {}}
              />
            </label>
          </div>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              setKeymap(defaultKeymap);
              toast('Shortcuts reset');
            }}
          >
            Reset Defaults
          </button>
        </section>
      </div>
    </div>
  );
}

export default Settings;
