import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from './utils/toast.js';
import { ensureKatex, renderMDKaTeX } from './utils/katex';
import defaultQuestions from './questions';

function loadSession() {
  try {
    const data = JSON.parse(localStorage.getItem('mcqSession') || '{}');
    if (data && Array.isArray(data.bookmarks)) {
      data.bookmarks = data.bookmarks.map(Number);
    }
    return data;
  } catch {
    return {};
  }
}

export default function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialBookmarked = params.get('bookmarks') === '1' || params.get('bookmarks') === 'true';

  const [session, setSession] = useState(loadSession());
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [onlyBookmarked, setOnlyBookmarked] = useState(initialBookmarked);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const b = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      return new Set(Array.isArray(b) ? b.map(Number) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setOnlyBookmarked(
      params.get('bookmarks') === '1' || params.get('bookmarks') === 'true'
    );
  }, [location.search]);

  useEffect(() => {
    const h = () => {
      setSession(loadSession());
      try {
        const b = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        setBookmarks(new Set(Array.isArray(b) ? b.map(Number) : []));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  useEffect(() => { ensureKatex(); }, []);

  const allQuestions = useMemo(() => {
    if (onlyBookmarked) {
      let dataset = defaultQuestions;
      try {
        const raw = localStorage.getItem('questions');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) dataset = parsed;
        }
      } catch {
        /* keep defaults */
      }
      return dataset.map((q, idx) => ({ ...q, id: q.id ?? idx + 1 }));
    }
    return session.questions || [];
  }, [onlyBookmarked, session]);
  const results = session.results || [];

  const tags = useMemo(() => {
    const s = new Set();
    allQuestions.forEach((q) => (q.tags || []).forEach((t) => s.add(t)));
    return [''].concat([...s]);
  }, [allQuestions]);

  const sets = useMemo(() => {
    const s = new Set();
    allQuestions.forEach((q) => q.set && s.add(q.set));
    return [''].concat([...s]);
  }, [allQuestions]);

  const difficulties = useMemo(() => {
    const s = new Set();
    allQuestions.forEach((q) => q.difficulty && s.add(q.difficulty));
    return [''].concat([...s]);
  }, [allQuestions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allQuestions.filter((it) => {
      if (onlyBookmarked && !bookmarks.has(it.id)) return false;
      if (tag && !(it.tags || []).includes(tag)) return false;
      if (setFilter && it.set !== setFilter) return false;
      if (difficulty && it.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        it.question.toLowerCase().includes(q) ||
        (it.options || []).some((o) => String(o).toLowerCase().includes(q))
      );
    });
  }, [allQuestions, bookmarks, onlyBookmarked, tag, setFilter, difficulty, query]);

  const toggleBookmark = (id) => {
    const idNum = Number(id);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(idNum)) next.delete(idNum);
      else next.add(idNum);
      try { localStorage.setItem('bookmarks', JSON.stringify([...next])); } catch {
        /* ignore */
      }
      return next;
    });
    setSession((prev) => {
      const set = new Set((prev.bookmarks || []).map(Number));
      if (set.has(idNum)) set.delete(idNum);
      else set.add(idNum);
      const updated = { ...prev, bookmarks: [...set] };
      try { localStorage.setItem('mcqSession', JSON.stringify(updated)); } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const retryIncorrect = () => {
    const incorrect = (results || [])
      .filter((r) => !r.isCorrect)
      .map((r) => session.questions?.[r.index])
      .filter(Boolean);
    if (incorrect.length === 0) {
      toast('No incorrect questions to retry.');
      return;
    }
    const payload = {
      mode: session.mode || 'practice',
      current: 0,
      questions: incorrect,
      results: [],
      bookmarks: session.bookmarks || [],
      notes: session.notes || {},
      score: 0,
      points: 0,
      times: [],
    };
    try { localStorage.setItem('mcqSession', JSON.stringify(payload)); } catch { /* ignore */ }
    navigate(`/quiz?mode=${encodeURIComponent(session.mode || 'practice')}&resume=1`);
  };

  const retryOne = (q) => {
    const payload = {
      mode: session.mode || 'practice',
      current: 0,
      questions: [q],
      results: [],
      bookmarks: session.bookmarks || [],
      notes: session.notes || {},
      score: 0,
      points: 0,
      times: [],
    };
    try { localStorage.setItem('mcqSession', JSON.stringify(payload)); } catch { /* ignore */ }
    navigate(`/quiz?mode=${encodeURIComponent(session.mode || 'practice')}&resume=1`);
  };

  const exportQuestion = (q) => {
    const blob = new Blob([JSON.stringify(q, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `q${q.id}.json`;
    a.click();
    toast(`Exported q${q.id}.json`);
  };

  const exportCSV = () => {
    let csv = 'Question,YourAnswer,Correct,Explanation,Tags\n';
    (session.questions||[]).forEach((q, i) => {
      const sel=(results[i]?.selected||[]).map(n=>String.fromCharCode(65+n)).join('');
      const ans=(q.correct||[]).map(n=>String.fromCharCode(65+n)).join('');
      const tags=(q.tags||[]).join('|');
      csv += `"${q.question?.replace(/"/g,'""')}",${sel},${ans},"${(q.explanation||'').replace(/"/g,'""')}","${tags}"\n`;
    });
    const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='review.csv'; a.click();
    toast('Exported review.csv');
  };

  const exportJSON = () => {
    const blob=new Blob([JSON.stringify(session,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='review.json'; a.click();
    toast('Exported review.json');
  };

  const progressBySet = useMemo(() => {
    const map = {};
    allQuestions.forEach((q, idx) => {
      if (!bookmarks.has(q.id)) return;
      const s = q.set || 'Unknown';
      if (!map[s]) map[s] = { total: 0, wrong: 0 };
      map[s].total++;
      if (results[idx] && !results[idx].isCorrect) map[s].wrong++;
    });
    return map;
  }, [allQuestions, bookmarks, results]);

  return (
    <div className="card">
      <h2>{onlyBookmarked ? 'Bookmarks' : 'Review'}</h2>
      <div className="toolbar" style={{marginBottom:'8px',display:'flex',flexWrap:'wrap',gap:'6px'}}>
        <input placeholder="Search" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <select value={tag} onChange={(e)=>setTag(e.target.value)}>
          {tags.map((t) => (
            <option key={t} value={t}>{t||'All tags'}</option>
          ))}
        </select>
        <select value={setFilter} onChange={(e)=>setSetFilter(e.target.value)}>
          {sets.map((s) => (
            <option key={s} value={s}>{s||'All sets'}</option>
          ))}
        </select>
        <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
          {difficulties.map((d) => (
            <option key={d} value={d}>{d||'All difficulties'}</option>
          ))}
        </select>
        <label className="toggle"><input type="checkbox" checked={onlyBookmarked} onChange={(e)=>setOnlyBookmarked(e.target.checked)} /> Bookmarked</label>
        <button className="btn-ghost" onClick={()=>setCompact(c=>!c)}>{compact?'Detailed':'Compact'} View</button>
        <button className="btn-outline" onClick={retryIncorrect}>Retry Incorrect Only</button>
        <button className="btn-ghost" onClick={exportCSV}>Export CSV</button>
        <button className="btn-ghost" onClick={exportJSON}>Export JSON</button>
      </div>
      <div className="progress-summary" style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'8px'}}>
        {Object.entries(progressBySet).map(([s,data]) => (
          <span key={s} className="badge">{`${s}: ${data.total} (${data.wrong} wrong)`}</span>
        ))}
      </div>
      <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px'}}>
        {filtered.map((q) => {
          const idx = allQuestions.findIndex((x) => x.id === q.id);
          const res = results[idx];
          const your = (res?.selected || []).map((n) => q.options[n]).join(', ');
          const corr = (q.correct || []).map((n) => q.options[n]).join(', ');
          const snippet = q.question.length > 120 ? q.question.slice(0,120)+'…' : q.question;
          const isExpanded = expanded.has(q.id);
          const liClass = compact ? 'bookmark-item compact' : 'bookmark-item card';
          return (
            <li key={q.id} className={liClass} style={compact?{padding:'6px 0'}:{padding:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>toggleExpand(q.id)}>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <strong>Q{idx+1}.</strong>
                  <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(snippet)}}></span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  {q.set && <span className="badge">{q.set}</span>}
                  <div style={{display:'flex',gap:'4px'}} onClick={(e)=>e.stopPropagation()}>
                    {onlyBookmarked ? (
                      <button type="button" className="icon-btn" onClick={()=>toggleBookmark(q.id)} title="Remove bookmark">✕</button>
                    ) : (
                      <button type="button" className="icon-btn" onClick={()=>toggleBookmark(q.id)} title="Toggle bookmark">{bookmarks.has(q.id)?'★':'☆'}</button>
                    )}
                    <button type="button" className="icon-btn" onClick={()=>retryOne(q)} title="Retry">↻</button>
                    <button type="button" className="icon-btn" onClick={()=>exportQuestion(q)} title="Export">⤓</button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div style={{marginTop:'6px'}}>
                  <div><strong>Your:</strong> <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(your || '—')}}></span></div>
                  <div><strong>Correct:</strong> <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(corr)}}></span></div>
                  {q.explanation && <div style={{marginTop:'6px'}} className="muted" dangerouslySetInnerHTML={{__html: renderMDKaTeX(q.explanation)}}></div>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
