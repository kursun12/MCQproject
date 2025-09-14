import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from './utils/toast.js';
import { ensureKatex, renderMDKaTeX } from './utils/katex';

function loadSession() {
  try { return JSON.parse(localStorage.getItem('mcqSession') || '{}'); } catch { return {}; }
}

export default function Review() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialBookmarked = params.get('bookmarks') === '1' || params.get('bookmarks') === 'true';

  const [session, setSession] = useState(loadSession());
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(initialBookmarked);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setOnlyBookmarked(
      params.get('bookmarks') === '1' || params.get('bookmarks') === 'true'
    );
  }, [location.search]);

  useEffect(() => {
    const h = () => setSession(loadSession());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  useEffect(() => { ensureKatex(); }, []);

  const allQuestions = session.questions || [];
  const bookmarks = new Set(session.bookmarks || []);
  const results = session.results || [];

  const tags = useMemo(() => {
    const s = new Set();
    allQuestions.forEach((q) => (q.tags || []).forEach((t) => s.add(t)));
    return [''].concat([...s]);
  }, [allQuestions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allQuestions.filter((it) => {
      if (onlyBookmarked && !bookmarks.has(it.id)) return false;
      if (tag && !(it.tags || []).includes(tag)) return false;
      if (!q) return true;
      return (
        it.question.toLowerCase().includes(q) ||
        (it.options || []).some((o) => String(o).toLowerCase().includes(q))
      );
    });
  }, [allQuestions, bookmarks, onlyBookmarked, tag, query]);

  const toggleBookmark = (id) => {
    setSession((prev) => {
      const set = new Set(prev.bookmarks || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const updated = { ...prev, bookmarks: [...set] };
      try {
        localStorage.setItem('bookmarks', JSON.stringify(updated.bookmarks));
        localStorage.setItem('mcqSession', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const retryIncorrect = () => {
    const ids = (results || [])
      .filter((r) => !r.isCorrect)
      .map((r) => allQuestions[r.index]?.id)
      .filter(Boolean);
    if (ids.length === 0) {
      toast('No incorrect questions to retry.');
      return;
    }
    try { localStorage.setItem('retryIds', JSON.stringify(ids)); } catch { /* ignore */ }
    window.location.href = `/quiz?mode=${encodeURIComponent(session.mode || 'practice')}`;
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

  return (
    <div className="card">
      <h2>{onlyBookmarked ? 'Bookmarks' : 'Review'}</h2>
      <div className="toolbar" style={{marginBottom:'8px'}}>
        <input placeholder="Search" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <select value={tag} onChange={(e)=>setTag(e.target.value)}>
          {tags.map((t) => (
            <option key={t} value={t}>{t||'All tags'}</option>
          ))}
        </select>
        <label className="toggle"><input type="checkbox" checked={onlyBookmarked} onChange={(e)=>setOnlyBookmarked(e.target.checked)} /> Bookmarked</label>
        <button className="btn-outline" onClick={retryIncorrect}>Retry Incorrect Only</button>
        <button className="btn-ghost" onClick={exportCSV}>Export CSV</button>
        <button className="btn-ghost" onClick={exportJSON}>Export JSON</button>
      </div>
      <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px'}}>
        {filtered.map((q) => {
          const idx = allQuestions.findIndex((x) => x.id === q.id);
          const res = results[idx];
          const your = (res?.selected || []).map((n) => q.options[n]).join(', ');
          const corr = (q.correct || []).map((n) => q.options[n]).join(', ');
          return (
            <li key={q.id} className={`card ${res?.isCorrect? 'status-correct':'status-incorrect'}`} style={{padding:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                  <strong>Q{idx+1}. <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(q.question)}}></span></strong>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggleBookmark(q.id)}
                    title="Toggle bookmark"
                  >
                    {bookmarks.has(q.id) ? '★' : '☆'}
                  </button>
                </div>
                <span className="badge">{(q.tags||[]).join(', ')||'—'}</span>
              </div>
              <div style={{marginTop:'6px'}}>
                <div><strong>Your:</strong> <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(your || '—')}}></span></div>
                <div><strong>Correct:</strong> <span dangerouslySetInnerHTML={{__html: renderMDKaTeX(corr)}}></span></div>
                {q.explanation && <div style={{marginTop:'6px'}} className="muted" dangerouslySetInnerHTML={{__html: renderMDKaTeX(q.explanation)}}></div>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
