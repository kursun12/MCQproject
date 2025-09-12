import { useState, useEffect } from 'react';
import { toast } from './utils/toast.js';
import { loadRepeatSettings, saveRepeatSettings } from './repeat/settings';
import { loadKeymap, saveKeymap, defaultKeymap } from './utils/keymap.js';

function Settings() {
  const [numQuestions, setNumQuestions] = useState(3);
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
      <h2 style={{marginTop:0}}>Settings</h2>
      <p className="muted" style={{marginTop:-6}}>Tune your session experience. Changes save automatically.</p>
      <div className="grid-2" style={{marginTop:12}}>
        <div className="card" style={{padding:'12px'}}>
          <h3 style={{marginTop:0}}>Session</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <label>Number of questions
              <input
                type="number"
                min="1"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                style={{marginLeft:8}}
              />
            </label>
            <label className="toggle"><input type="checkbox" checked={shuffleQs} onChange={(e)=>{ setShuffleQs(e.target.checked); toast('Shuffle questions updated'); }} /> Shuffle questions</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={shuffleOpts}
                onChange={(e) => {
                  setShuffleOpts(e.target.checked);
                  toast('Shuffle options updated');
                }}
              />{' '}
              Shuffle options
            </label>
            <label>Feedback timing
              <select value={feedbackTrigger} onChange={(e)=>{ setFeedbackTrigger(e.target.value); toast('Feedback timing updated'); }} style={{marginLeft:8}}>
                <option value="onSelect">On select (single immediately; multi when all chosen)</option>
                <option value="onNext">On Next (press to reveal, then continue)</option>
              </select>
            </label>
            <label className="toggle"><input type="checkbox" checked={instantReveal} onChange={(e)=>{ setInstantReveal(e.target.checked); toast('Explanation visibility updated'); }} /> Show explanation after reveal</label>
            <label className="toggle"><input type="checkbox" checked={partialCredit} onChange={(e)=>{ setPartialCredit(e.target.checked); toast('Partial credit updated'); }} /> Partial credit (multi)</label>
            <div className="card" style={{padding:'10px'}}>
              <strong>Test mode options</strong>
              <div style={{height:6}} />
              <label className="toggle"><input type="checkbox" checked={testQuick} onChange={(e)=>{ setTestQuick(e.target.checked); toast('Test quick mode updated'); }} /> Quick mode (single‑tap answers advance)</label>
              <label className="toggle"><input type="checkbox" checked={testNoChange} onChange={(e)=>{ setTestNoChange(e.target.checked); toast('Answer change lock updated'); }} /> Lock answers (can’t change once selected)</label>
            </div>
          </div>
        </div>
        <div className="card" style={{padding:'12px'}}>
          <h3 style={{marginTop:0}}>Data</h3>
          <p className="muted">Loaded questions: <strong>{count}</strong></p>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {count > 0 && <button className="btn-danger" onClick={clearQuestions}>Clear All</button>}
          </div>
        </div>
        <div className="card" style={{padding:'12px'}}>
          <h3 style={{marginTop:0}}>Repeat Adaptive</h3>
          <div className="grid-2">
            <label>Mastery type
              <select value={repeatCfg.masteryType} onChange={(e)=>{ setRepeatCfg({...repeatCfg, masteryType:e.target.value}); toast('Mastery type updated'); }}>
                <option value="consecutive">Consecutive</option>
                <option value="ratio">3 of last 4</option>
              </select>
            </label>
            <label>Target
              <input type="number" min="1" value={repeatCfg.masteryTarget} onChange={(e)=>{ setRepeatCfg({...repeatCfg, masteryTarget:parseInt(e.target.value,10)||1}); }} />
            </label>
            <label>Cooldown (s)
              <input type="number" min="0" value={repeatCfg.cooldownSeconds} onChange={(e)=>{ setRepeatCfg({...repeatCfg, cooldownSeconds:parseInt(e.target.value,10)||0}); }} />
            </label>
            <label>Leech threshold
              <input type="number" min="1" value={repeatCfg.leechThreshold} onChange={(e)=>{ setRepeatCfg({...repeatCfg, leechThreshold:parseInt(e.target.value,10)||1}); }} />
            </label>
          </div>
          <div className="chips" style={{marginTop:8}}>
            <label className="toggle"><input type="checkbox" checked={repeatCfg.strictMultiAnswer} onChange={(e)=>setRepeatCfg({...repeatCfg, strictMultiAnswer:e.target.checked})} /> Strict multi-answer</label>
            <label className="toggle"><input type="checkbox" checked={repeatCfg.partialCreditMode} onChange={(e)=>setRepeatCfg({...repeatCfg, partialCreditMode:e.target.checked})} /> Partial credit</label>
          <label className="toggle"><input type="checkbox" checked={repeatCfg.autoRevealExplanationOnError} onChange={(e)=>setRepeatCfg({...repeatCfg, autoRevealExplanationOnError:e.target.checked})} /> Auto-show explanation on wrong</label>
          <label className="toggle"><input type="checkbox" checked={repeatCfg.autoSkipOnWrong} onChange={(e)=>setRepeatCfg({...repeatCfg, autoSkipOnWrong:e.target.checked})} /> Auto-skip on wrong</label>
          </div>
        </div>
        <div className="card" style={{padding:'12px'}}>
          <h3 style={{marginTop:0}}>Keyboard</h3>
          <p className="muted" style={{marginTop:-6}}>Click a field then press a key.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
            {keymap.options.map((k, i) => (
              <label key={i}>Option {i + 1}
                <input
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
            <label>Next
              <input
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
            <label>Prev
              <input
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
            <label>Alt Next
              <input
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
            <label>Help
              <input
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
            <label>Close
              <input
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
          <button className="btn-ghost" style={{marginTop:8}} onClick={() => { setKeymap(defaultKeymap); toast('Shortcuts reset'); }}>Reset Defaults</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
