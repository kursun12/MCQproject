import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gradePartial, gradeStrict, gradeLenient, toPoints } from './utils/scoring';
import { toast } from './utils/toast.js';
import { ensureKatex, renderMDKaTeX } from './utils/katex';
import Hotspot from './components/Hotspot.jsx';
import defaultQuestions from './questions';
import { RepeatEngine } from './repeat/engine';
import { loadKeymap } from './utils/keymap.js';

// Shuffle helpers need to be defined before they're used in buildQuestions.
// Previously these were declared later in the component which meant enabling
// shuffle options attempted to invoke an uninitialized function, triggering a
// runtime ReferenceError and rendering a blank screen.
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleCopy(arr) {
  return shuffleArray([...arr]);
}

function Quiz() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') || 'practice'; // practice | test | challenge
  const buildQuestions = () => {
    // Load dataset safely without throwing
    let dataset = defaultQuestions;
    const raw = localStorage.getItem('questions');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) dataset = parsed;
      } catch {/* keep defaults */}
    }

    // Normalize
    let arr = dataset.map((q, idx) => ({
      ...q,
      id: q.id ?? idx + 1,
      options: Array.isArray(q.options) ? q.options : [],
    }));

    // Retry subset
    try {
      const retryIds = JSON.parse(localStorage.getItem('retryIds') || 'null');
      if (Array.isArray(retryIds) && retryIds.length) {
        const idSet = new Set(retryIds);
        arr = arr.filter(q => idSet.has(q.id));
        localStorage.removeItem('retryIds');
      }
    } catch { /* ignore */ }

    // Filters
    try {
      const url = new URL(window.location.href);
      const setId = url.searchParams.get('setId');
      const hard = url.searchParams.get('hard') === 'true';
      const tagsParam = url.searchParams.get('tags');
      const countParam = parseInt(url.searchParams.get('count'), 10);
      if (setId === 'bookmarks') {
        try {
          const bm = JSON.parse(localStorage.getItem('bookmarks') || '[]');
          const idSet = new Set(bm);
          arr = arr.filter((q) => idSet.has(q.id));
        } catch { /* ignore */ }
      } else if (setId) {
        try {
          const setsLS = JSON.parse(localStorage.getItem('sets') || '[]');
          const s = setsLS.find((x) => String(x.id) === String(setId));
          if (s) {
            const idSet = new Set(s.questionIds || []);
            arr = arr.filter((q) => idSet.has(q.id));
          }
        } catch { /* ignore */ }
      }
      if (tagsParam) {
        const tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.length) {
          arr = arr.filter((q) => Array.isArray(q.tags) && q.tags.some((t) => tags.includes(t)));
        }
      }
      if (hard) {
        try {
          const stats = JSON.parse(localStorage.getItem('stats')||'{}');
          arr = arr.filter(q => { const st = stats[q.id]; return st && st.fails >= 3 && (st.fails / Math.max(1,(st.attempts||0))) >= 0.6; });
        } catch { /* ignore */ }
      }
      const shuffleQs = localStorage.getItem('shuffleQs') === 'true';
      if (shuffleQs) arr = shuffleCopy(arr);
      const limit = Number.isFinite(countParam) && countParam > 0 ? countParam : null;
      if (limit && mode !== 'repeat') arr = arr.slice(0, limit);
    } catch { /* ignore */ }

    const shuffleOpts = localStorage.getItem('shuffleOpts') === 'true';
    const mapped = arr.map((q) => ({
      ...q,
      _order: shuffleOpts ? shuffleArray([...Array(q.options.length).keys()]) : [...Array(q.options.length).keys()],
    }));
    // Guard: ensure we never return empty if dataset existed
    return mapped.length > 0 ? mapped : defaultQuestions.map((q, idx) => ({ ...q, id: q.id ?? idx + 1, _order: [...Array(q.options.length).keys()] }));
  };

  const [questions, setQuestions] = useState(() => buildQuestions());
  const engineRef = useRef(null);
  const byIdRef = useRef(new Map());
  const [repeatAttempted, setRepeatAttempted] = useState(0);
  const [repeatSourceLabel, setRepeatSourceLabel] = useState('');
  const [current, setCurrent] = useState(0);
  // Store selected indices as an array for both single/multi
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [times, setTimes] = useState([]); // seconds per question
  const [qStart, setQStart] = useState(() => performance.now());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(() => {
    const stored = parseInt(localStorage.getItem('maxStreak'), 10);
    return Number.isFinite(stored) ? stored : 0;
  });
  const [achievement, setAchievement] = useState('');
  const instantReveal = useMemo(() => localStorage.getItem('instantReveal') === 'true', []);
  const feedbackTrigger = useMemo(() => localStorage.getItem('feedbackTrigger') || 'onNext', []);
  const [revealed, setRevealed] = useState(false);
  const [forceExplain, setForceExplain] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const testQuick = useMemo(() => localStorage.getItem('testQuick') === 'true', []);
  const testNoChange = useMemo(() => localStorage.getItem('testNoChange') === 'true', []);
  const [expandedRows, setExpandedRows] = useState({});
  const [resSort, setResSort] = useState({ key: 'idx', dir: 'asc' });
  const [resIncorrectOnly, setResIncorrectOnly] = useState(false);
  const [resSearch, setResSearch] = useState('');
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const b = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      return new Set(Array.isArray(b) ? b : []);
    } catch { return new Set(); }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notes') || '{}'); } catch { return {}; }
  });
  const audioCtxRef = useRef(null);

  const repeatRemaining = engineRef.current ? engineRef.current.queue.length : 0;
  const repeatDynamicTotal = repeatAttempted + repeatRemaining;

  // Persist initial session skeleton
  useEffect(() => {
    const payload = { mode, current, questions, results: [], bookmarks: [...bookmarks], notes };
    try { localStorage.setItem('mcqSession', JSON.stringify(payload)); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Rebuild questions on route change (e.g., after toggling settings and navigating back)
  useEffect(() => {
    setQuestions(buildQuestions());
    setCurrent(0);
  }, [location.pathname, location.search]);
  useEffect(() => { ensureKatex(); }, []);
  useEffect(() => {
    if (current >= questions.length) setCurrent(0);
  }, [questions.length]);
  // Initialize Repeat Engine when session parameters change
  useEffect(() => {
    byIdRef.current = new Map(questions.map(q => [q.id, q]));
    if (mode === 'repeat') {
      let pool = [];
      let filterMastered = true;
      try {
        const url = new URL(window.location.href);
        const source = url.searchParams.get('source');
        const tagsParam = url.searchParams.get('tags');
        const countParam = parseInt(url.searchParams.get('count'), 10);
        if (source === 'lastWrong') {
          const sess = JSON.parse(localStorage.getItem('mcqSession') || '{}');
          const wrongIdx = (sess.results || []).filter(r => !r.isCorrect).map(r => r.index || 0);
          pool = wrongIdx.map(i => (questions[i] || {}).id).filter(Boolean);
          setRepeatSourceLabel('Last session (wrong)');
        } else if (source === 'everWrong') {
          const stats = JSON.parse(localStorage.getItem('repeatStats') || '{}');
          pool = questions.filter(q => (stats[q.id]?.wrong || 0) > 0).map(q => q.id);
          setRepeatSourceLabel('All-time wrong');
        } else if (source === 'byTags') {
          pool = questions.map(q => q.id);
          setRepeatSourceLabel(tagsParam ? `Tags: ${tagsParam}` : 'Selected tags');
        } else {
          pool = questions.map(q => q.id);
          setRepeatSourceLabel('Entire pool');
        }
        if (Number.isFinite(countParam) && countParam > 0) {
          const stats = JSON.parse(localStorage.getItem('repeatStats') || '{}');
          const unmastered = pool.filter(id => !(stats[id]?.mastered));
          const mastered = pool.filter(id => stats[id]?.mastered);
          shuffleArray(unmastered);
          shuffleArray(mastered);
          pool = unmastered.concat(mastered).slice(0, countParam);
          filterMastered = false; // we intentionally included mastered items if needed
        }
      } catch {
        pool = questions.map(q => q.id);
        setRepeatSourceLabel('Entire pool');
      }
      const eng = new RepeatEngine(questions, pool, { filterMastered });
      engineRef.current = eng;
      setRepeatAttempted(0);
      setFinished(false);
      const first = eng.next();
      if (first) {
        const qobj = byIdRef.current.get(first);
        if (qobj) {
          setQuestions([qobj]);
          setCurrent(0);
          eng.onShow(first);
        } else {
          setFinished(true);
        }
      } else {
        setFinished(true);
      }
    } else {
      engineRef.current = null;
    }
  }, [mode, location.search]);

  const question = questions[current];
  const noQuestions = !question;
  const correct = Array.isArray(question.answers)
    ? question.answers
    : Array.isArray(question.answer)
    ? question.answer
    : Number.isFinite(question.answer)
    ? [question.answer]
    : [];
  const isMulti = correct.length > 1;

  // Update header progress CSS var
  const progress = Math.round((current / Math.max(1, questions.length)) * 100);
  useMemo(() => {
    try { document.documentElement.style.setProperty('--app-progress', progress + '%'); } catch { /* ignore */ }
    return null;
  }, [progress]);

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
    if (mode === 'test' && testNoChange && selected.length > 0) return; // lock once selected
    if (isMulti) {
      const set = new Set(selected);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      const nextSel = Array.from(set).sort((a, b) => a - b);
      setSelected(nextSel);
      if (feedbackTrigger === 'onSelect' && mode !== 'test') {
        if (nextSel.length === correct.length) {
          if (mode === 'repeat') {
            const settings = engineRef.current?.settings || {};
            const strictMode = settings.strictMultiAnswer !== false;
            const ok = strictMode ? gradeStrict(nextSel, correct) : gradeLenient(nextSel, correct);
            if (!ok && settings.autoRevealExplanationOnError) setForceExplain(true);
          }
          setRevealed(true);
        }
      }
    } else {
      setSelected([index]);
      if (mode === 'test' && testQuick) {
        // In test quick mode for single-answer: auto-advance immediately
        setTimeout(() => handleNext(), 10);
        return;
      }
      if (feedbackTrigger === 'onSelect' && mode !== 'test') {
        if (mode === 'repeat') {
          const settings = engineRef.current?.settings || {};
          const strictMode = settings.strictMultiAnswer !== false;
          const ok = strictMode ? gradeStrict([index], correct) : gradeLenient([index], correct);
          if (!ok && settings.autoRevealExplanationOnError) setForceExplain(true);
        }
        setRevealed(true);
      }
    }
  };

  const saveSession = (nextState = {}) => {
    const payload = {
      mode,
      current,
      questions,
      results: answers.map((sel, i) => ({ index: i, selected: sel, isCorrect: gradeStrict(sel, getCorrect(questions[i])) === 1 })),
      bookmarks: [...bookmarks],
      notes,
      score,
      points,
      ...nextState,
    };
    localStorage.setItem('mcqSession', JSON.stringify(payload));
  };
  // Stats for hard questions
  const updateStats = (id, ok) => {
    try {
      const stats = JSON.parse(localStorage.getItem('stats')||'{}');
      const s = stats[id] || { attempts:0, fails:0, last:0 };
      s.attempts += 1; if (!ok) s.fails += 1; s.last = Date.now();
      stats[id] = s; localStorage.setItem('stats', JSON.stringify(stats));
    } catch { /* ignore */ }
  };

  const getCorrect = (q) => (
    Array.isArray(q.answers) ? q.answers : Array.isArray(q.answer) ? q.answer : [q.answer]
  );

  const handleNext = () => {
    if (!selected || selected.length === 0) return;
    const settings = mode === 'repeat' ? (engineRef.current?.settings || {}) : {};
    const strictMode = mode === 'repeat' ? settings.strictMultiAnswer !== false : true;
    const strict = strictMode ? gradeStrict(selected, correct) : gradeLenient(selected, correct);
    const partialMode = mode === 'repeat'
      ? !!settings.partialCreditMode
      : localStorage.getItem('partialCredit') === 'true';
    const partial = partialMode ? gradePartial(selected, correct) : strict;
    if (!revealed && feedbackTrigger === 'onNext' && mode !== 'test') {
      if (mode === 'repeat' && strict === 0 && settings.autoRevealExplanationOnError) {
        setForceExplain(true);
      }
      setRevealed(true);
      return;
    }
    if (!awaitingNext) {
      // Record time for current question
      try {
        const dt = Math.max(0, (performance.now() - qStart) / 1000);
        setTimes((t) => [...t, dt]);
      } catch { /* ignore */ }
      if (mode !== 'test') {
        if (strict === 1) {
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
      }
      // track stats
      updateStats(question.id, strict === 1);
      if (mode === 'challenge') {
        const delta = toPoints(partial) + Math.max(0, 25 - Math.floor((performance.now() % 25000) / 1000));
        setPoints(points + delta);
      }
      setAnswers([...answers, selected]);
      if (mode === 'repeat') {
        const eng = engineRef.current;
        if (eng) {
          eng.onGrade(question.id, strict === 1);
          setRepeatAttempted(v=>v+1);
        }
      }
    }
    if (mode === 'repeat' && strict === 0 && !settings.autoSkipOnWrong && !awaitingNext) {
      setAwaitingNext(true);
      return;
    }
    setSelected([]);
    setRevealed(false);
    setForceExplain(false);
    setAwaitingNext(false);
    if (mode === 'repeat') {
      const eng = engineRef.current;
      if (eng) {
        const nid = eng.next();
        if (!nid) {
          setFinished(true);
        } else {
          const qobj = byIdRef.current.get(nid);
          if (qobj) {
            setQuestions(prev => [...prev, qobj]);
            setCurrent(prev => prev + 1);
            setQStart(performance.now());
            eng.onShow(nid);
          } else {
            setFinished(true);
          }
        }
      } else {
        setFinished(true);
      }
    } else {
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
        setQStart(performance.now());
      } else {
        setFinished(true);
      }
    }
    saveSession({ current: Math.min(current + 1, questions.length - 1) });
  };

  const toggleBookmark = () => {
    const id = question.id;
    const next = new Set(bookmarks);
    if (next.has(id)) next.delete(id); else next.add(id);
    setBookmarks(next);
    localStorage.setItem('bookmarks', JSON.stringify([...next]));
    localStorage.setItem('mcqSession', JSON.stringify({
      ...(JSON.parse(localStorage.getItem('mcqSession')||'{}')),
      bookmarks: [...next],
    }));
    toast(next.has(id) ? 'Bookmarked' : 'Removed bookmark');
  };

  const addNote = () => {
    const id = question.id;
    const value = prompt('Add a note for this question', notes[id] || '');
    if (value === null) return;
    const next = { ...notes, [id]: value };
    setNotes(next);
    localStorage.setItem('notes', JSON.stringify(next));
    localStorage.setItem('mcqSession', JSON.stringify({
      ...(JSON.parse(localStorage.getItem('mcqSession')||'{}')),
      notes: next,
    }));
    toast(value ? 'Note saved' : 'Note cleared');
  };

  // Keyboard shortcuts are customizable via Settings
  useEffect(() => {
    const onKey = (e) => {
      if (!question) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const keymap = loadKeymap();
      const optsLen = Array.isArray(question.options) ? question.options.length : 0;
      const order = (Array.isArray(question._order) && question._order.length === optsLen && question._order.every(i => Number.isInteger(i) && i >= 0 && i < optsLen))
        ? question._order
        : [...Array(optsLen).keys()];
      const idx = keymap.options.indexOf(e.key);
      if (idx !== -1 && idx < optsLen) {
        const optIdx = order[idx];
        handleOption(optIdx);
      } else if (e.key === keymap.next) {
        handleNext();
      } else if (e.key === keymap.nextAlt) {
        if (selected.length > 0) handleNext();
      } else if (e.key === keymap.prev) {
        if (current > 0) { setCurrent(current - 1); setSelected([]); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, selected, handleNext, current]);

  const restart = (newQuestions = questions) => {
    setQuestions(newQuestions);
    setCurrent(0);
    setSelected([]);
    setScore(0);
    setPoints(0);
    setFinished(false);
    setAnswers([]);
    setTimes([]);
    setStreak(0);
    setAchievement('');
    localStorage.removeItem('retryIds');
  };

  const retryIncorrect = () => {
    const subset = questions.filter((q, i) => {
      const corr = Array.isArray(q.correct)
        ? q.correct
        : Array.isArray(q.answers)
        ? q.answers
        : Array.isArray(q.answer)
        ? q.answer
        : Number.isFinite(q.answer)
        ? [q.answer]
        : [];
      const sel = Array.isArray(answers[i]) ? answers[i] : [];
      const ok =
        sel.length === corr.length && corr.every((n) => sel.includes(n));
      return !ok;
    });
    if (subset.length === 0) {
      alert('No incorrect answers to retry.');
      return;
    }
    restart(subset);
  };

  // Auto-finish convenience: if feedback is onSelect and on last question, grade shortly after reveal
  useEffect(() => {
    if (feedbackTrigger === 'onSelect' && mode !== 'test' && revealed && current === questions.length - 1 && selected.length > 0) {
      const t = setTimeout(() => {
        // Only proceed if still revealed and on the same question
        if (revealed && current === questions.length - 1) {
          handleNext();
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [revealed, feedbackTrigger, mode, current, questions.length, selected.length]);

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
    const partialMode = localStorage.getItem('partialCredit') === 'true';
    let partialSum = 0;
    if (partialMode) {
      questions.forEach((q, i) => {
        const corr = Array.isArray(q.answers) ? q.answers : Array.isArray(q.answer) ? q.answer : [q.answer];
        partialSum += gradePartial(answers[i] || [], corr);
      });
    }
    const totalTime = (times || []).reduce((s, n) => s + (n || 0), 0);
    const avgTime = questions.length ? totalTime / questions.length : 0;

    // Build rows for table with sorting and filtering
    let rows = questions.map((q, idx) => {
      const corr = Array.isArray(q.answers) ? q.answers : Array.isArray(q.answer) ? q.answer : [q.answer];
      const sel = Array.isArray(answers[idx]) ? answers[idx] : [];
      const selSet = new Set(sel);
      const corSet = new Set(corr);
      const ok = selSet.size === corSet.size && [...corSet].every((i) => selSet.has(i));
      const renderOpts = (arr) => arr.map((i) => q.options[i]).join(', ');
      return {
        idx: idx + 1,
        text: q.question,
        your: renderOpts(sel) || '—',
        correct: renderOpts(corr),
        ok,
        tags: (q.tags || []).join(', '),
        time: times[idx] ? Number(times[idx]).toFixed(1) : '—',
      };
    });

    // Filter by incorrect only and search
    if (resIncorrectOnly) rows = rows.filter(r => !r.ok);
    if (resSearch.trim()) {
      const term = resSearch.trim().toLowerCase();
      rows = rows.filter(r => r.text.toLowerCase().includes(term) || r.correct.toLowerCase().includes(term) || r.your.toLowerCase().includes(term));
    }
    // Sort
    rows.sort((a,b)=>{
      const k = resSort.key;
      const dir = resSort.dir === 'asc' ? 1 : -1;
      if (k === 'idx') return (a.idx - b.idx) * dir;
      if (k === 'ok') return ((a.ok?1:0)-(b.ok?1:0)) * dir;
      if (k === 'time') return ((parseFloat(a.time)||0) - (parseFloat(b.time)||0)) * dir;
      return String(a[k]||'').localeCompare(String(b[k]||'')) * dir;
    });
    return (
      <div className="result card">
        <h2>Your Results</h2>
        <p>
          {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
        </p>
        {partialMode && (
          <p>Partial credit: {partialSum.toFixed(2)} / {questions.length}</p>
        )}
        {mode==='challenge' && <p>Points: {points}</p>}
        <p>Best streak: {maxStreak}</p>
        <div className="summary-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',margin:'10px 0'}}>
          <div className="card" style={{padding:'10px'}}>
            <div className="muted">Score</div>
            <div style={{fontSize:'1.3rem',fontWeight:700}}>{Math.round((score/questions.length)*100)}%</div>
          </div>
          <div className="card" style={{padding:'10px'}}>
            <div className="muted">Correct</div>
            <div style={{fontSize:'1.3rem',fontWeight:700}}>{score} / {questions.length}</div>
          </div>
          <div className="card" style={{padding:'10px'}}>
            <div className="muted">Time</div>
            <div style={{fontSize:'1.3rem',fontWeight:700}}>{formatTime(totalTime)}</div>
            <div className="muted" style={{fontSize:'.85rem'}}>Avg {avgTime.toFixed(1)}s / q</div>
          </div>
          <div className="card" style={{padding:'10px'}}>
            <div className="muted">Streak</div>
            <div style={{fontSize:'1.3rem',fontWeight:700}}>{maxStreak}</div>
          </div>
        </div>
        <div style={{margin:'8px 0'}}>
          {score===questions.length && <span className="badge" title="All answers correct">Perfect!</span>}
          {maxStreak>=5 && <span className="badge" style={{marginLeft:6}}>Streak {maxStreak}🔥</span>}
          {points>=3000 && <span className="badge" style={{marginLeft:6}}>Fast Learner</span>}
        </div>
        <div className="card" style={{overflow:'auto', marginTop:8, position:'relative'}}>
          <div style={{position:'sticky', top:0, background:'var(--card-bg)', padding:'8px', display:'flex', gap:'8px', zIndex:1, borderBottom:'1px solid var(--border-color)', alignItems:'center', flexWrap:'wrap'}}>
            <button onClick={restart}>Restart</button>
            <button onClick={retryIncorrect}>Retry Incorrect</button>
            <button onClick={() => { window.location.href = '/review'; }}>Open Review</button>
            <button className="btn-ghost" onClick={() => { exportResultsCSV(questions, answers); toast('Exported results.csv'); }}>Export CSV</button>
            <button className="btn-ghost" onClick={() => exportStateJSON(questions, answers, mode, points)}>Export State</button>
            <label className="toggle" style={{marginLeft:'auto'}}>
              <input type="checkbox" checked={resIncorrectOnly} onChange={(e)=>setResIncorrectOnly(e.target.checked)} /> Incorrect only
            </label>
            <input type="search" placeholder="Search" value={resSearch} onChange={(e)=>setResSearch(e.target.value)} />
          </div>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'idx', dir: s.key==='idx'&&s.dir==='asc'?'desc':'asc'}))}>#</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'text', dir: s.key==='text'&&s.dir==='asc'?'desc':'asc'}))}>Question</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'your', dir: s.key==='your'&&s.dir==='asc'?'desc':'asc'}))}>Yours</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'correct', dir: s.key==='correct'&&s.dir==='asc'?'desc':'asc'}))}>Correct</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'tags', dir: s.key==='tags'&&s.dir==='asc'?'desc':'asc'}))}>Tags</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'time', dir: s.key==='time'&&s.dir==='asc'?'desc':'asc'}))}>Time (s)</th>
                <th style={{cursor:'pointer'}} onClick={()=>setResSort(s=>({key:'ok', dir: s.key==='ok'&&s.dir==='asc'?'desc':'asc'}))}>✓</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.ok? 'status-correct':'status-incorrect'}>
                  <td>{r.idx}</td>
                  <td>
                    <div
                      className={!expandedRows[i] ? 'clamp-2' : ''}
                      onClick={()=>setExpandedRows((m)=>({...m,[i]:!m[i]}))}
                      style={{cursor:'pointer'}}
                      title={!expandedRows[i] ? 'Click to expand' : 'Click to collapse'}
                    >
                      {r.text}
                    </div>
                  </td>
                  <td>{r.your}</td>
                  <td>{r.correct}</td>
                  <td>{r.tags || '—'}</td>
                  <td style={{textAlign:'right'}}>{r.time}</td>
                  <td>{r.ok? '✓':'✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accuracy by tag */}
        <div className="card" style={{marginTop:8,padding:'10px'}}>
          <div className="section-title"><strong>Accuracy by tag</strong></div>
          <div className="chips">
            {(() => {
              const map = new Map();
              rows.forEach((r) => {
                const tags = (r.tags || '').split(',').map(s=>s.trim()).filter(Boolean);
                if (tags.length===0) tags.push('(none)');
                tags.forEach((t) => {
                  const cur = map.get(t) || { total:0, ok:0 };
                  cur.total += 1; if (r.ok) cur.ok += 1; map.set(t, cur);
                });
              });
              return [...map.entries()].map(([t,v]) => (
                <span key={t} className="chip">{t}: {Math.round((v.ok/v.total)*100)}% ({v.ok}/{v.total})</span>
              ));
            })()}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap', marginTop:8}}>
          <button onClick={restart}>Restart</button>
          <button onClick={() => { window.location.href = '/review'; }}>Open Review</button>
          <button onClick={share}>Share</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz card">
      {mode==='repeat' && <div className="badge">Repeat Adaptive</div>}
      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: mode==='repeat' ? `${(repeatAttempted / Math.max(1, repeatDynamicTotal)) * 100}%` : `${(current / questions.length) * 100}%` }}
        ></div>
      </div>
      <div className="scoreboard">
        <span>Score: {score}</span>
        <span>Streak: {streak}</span>
        <span>Best: {maxStreak}</span>
        {mode==='repeat' && engineRef.current && (
          <>
            <span>Progress: {repeatAttempted}/{repeatDynamicTotal}</span>
            <span>Remaining: {repeatRemaining}</span>
          </>
        )}
      </div>
      {noQuestions && (
        <div className="muted" style={{marginTop:6}}>No questions available. Check your import or filters.</div>
      )}
      <div className="muted" style={{marginTop:4}}>
        {mode==='repeat' ? (
          <>Repeat set: {repeatSourceLabel || 'Custom'}. Progress {repeatAttempted}/{Math.max(1, repeatDynamicTotal)}. Cooldown and anti back‑to‑back applied.</>
        ) : (
          <>Feedback: {mode==='test' ? 'Hidden until end' : (feedbackTrigger==='onNext' ? 'Reveal, then Next' : (isMulti ? 'Reveal when all chosen' : 'Reveal on select'))}{instantReveal && mode!=='test' ? ' • Explanation after reveal' : ''}</>
        )}
      </div>
      {achievement && <div className="achievement">🏆 {achievement}</div>}
      {!noQuestions && (
      <h2>
        {mode==='repeat' ? (
          <>Item {repeatAttempted + 1} of {Math.max(1, repeatDynamicTotal)}</>
        ) : (
          <>Question {current + 1} of {questions.length}</>
        )}
        <button
          type="button"
          onClick={toggleBookmark}
          className="icon-btn"
          style={{ marginLeft: '0.5rem' }}
          title="Bookmark"
        >
          {bookmarks.has(question.id) ? '★' : '☆'}
        </button>
        <button
          type="button"
          onClick={addNote}
          className="icon-btn"
          style={{ marginLeft: '0.25rem' }}
          title="Add note"
        >
          📝
        </button>
      </h2>
      )}
      {!noQuestions && isMulti && (
        <div className="badge" aria-hidden="true" style={{display:'inline-block',marginBottom:'6px'}}>Select ALL that apply · Choose {correct.length}</div>
      )}
      {!noQuestions && <p className="question" dangerouslySetInnerHTML={{__html: renderMDKaTeX(question.question)}}></p>}
      {!noQuestions && question.type === 'hotspot' && question.media?.src ? (
        <div style={{marginBottom:'10px'}}>
          <Hotspot src={question.media.src} zones={question.media.zones||[]} selected={selected} onSelect={handleOption} />
        </div>
      ) : null}
      {!noQuestions && (
      <ul className="options">
        {(() => {
          const optsLen = Array.isArray(question.options) ? question.options.length : 0;
          const order = (Array.isArray(question._order) && question._order.length===optsLen && question._order.every(i => Number.isInteger(i) && i>=0 && i<optsLen))
            ? question._order
            : [...Array(optsLen).keys()];
          return order.map((optIdx, idx) => {
          const isSel = selected.includes(optIdx);
          const isCor = correct.includes(optIdx);
          const show = revealed && mode !== 'test';
          const labelCls = show ? (isCor ? 'correct' : (isSel ? 'incorrect' : '')) : (isSel ? 'selected' : '');
          return (
            <li key={idx} className="option">
              <label className={labelCls}>
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  name="option"
                  value={optIdx}
                  checked={isSel}
                  onChange={() => handleOption(optIdx)}
                />
                <span className="opt-bubble">{String.fromCharCode(65 + idx)}</span>
                <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(question.options[optIdx] ?? '')}}></span>
              </label>
            </li>
          );
          });
        })()}
      </ul>
      )}
      {!noQuestions && revealed && mode!=='test' && (instantReveal || forceExplain) && (
        <p className="explanation" dangerouslySetInnerHTML={{__html: renderMDKaTeX(question.explanation||'')}}></p>
      )}
      {!noQuestions && (
      <button className="next" onClick={handleNext} disabled={selected.length === 0}>
        {(!revealed && feedbackTrigger==='onNext' && mode!=='test')
          ? 'Reveal'
          : (current + 1 === questions.length ? 'Finish' : (mode==='test' ? 'Save' : 'Next'))}
      </button>
      )}
    </div>
  );
}

export default Quiz;

// Helpers
function exportResultsCSV(questions, answers){
  let csv='Question,YourAnswer,Correct,Explanation\n';
  questions.forEach((q,i)=>{
    const sel=(answers[i]||[]).map(n=>String.fromCharCode(65+n)).join('');
    const ans=(Array.isArray(q.answers)?q.answers:Array.isArray(q.answer)?q.answer:[q.answer]).map(n=>String.fromCharCode(65+n)).join('');
    csv+=`"${q.question.replace(/"/g,'""')}",${sel},${ans},"${(q.explanation||'').replace(/"/g,'""')}"\n`;
  });
  const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='results.csv'; a.click();
}

function exportStateJSON(questions, answers, mode, points){
  const data={
    mode,
    timestamp: Date.now(),
    points,
    questions,
    answers,
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mcq-state.json'; a.click();
}

function formatTime(sec = 0){
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60).toString().padStart(2,'0');
  const ss = (s % 60).toString().padStart(2,'0');
  return `${m}:${ss}`;
}
