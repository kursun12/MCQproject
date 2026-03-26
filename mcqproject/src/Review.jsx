import { useEffect, useMemo, useState } from 'react';
import { useCertification } from './context/CertificationContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from './utils/toast.js';
import { ensureKatex, renderMDKaTeX } from './utils/katex';
import { getAnswerLetters, getAnswerTexts, getQuestionAnswers } from './utils/question.js';

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
  const { certification } = useCertification();
  const params = new URLSearchParams(location.search);
  const initialBookmarked = params.get('bookmarks') === '1' || params.get('bookmarks') === 'true';

  const [session, setSession] = useState(loadSession());
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('date');
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
      let dataset = certification?.questions || [];
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
  }, [onlyBookmarked, session, certification]);
  const results = useMemo(() => session.results || [], [session.results]);

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
    const arr = allQuestions.filter((it) => {
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
    arr.sort((a, b) => {
      if (sortBy === 'set') return (a.set || '').localeCompare(b.set || '');
      if (sortBy === 'difficulty')
        return (a.difficulty || '').localeCompare(b.difficulty || '');
      return 0;
    });
    return arr;
  }, [allQuestions, bookmarks, onlyBookmarked, tag, setFilter, difficulty, query, sortBy]);
  const hasReviewData = allQuestions.length > 0;
  const hasActiveFilters = Boolean(query.trim() || tag || setFilter || difficulty || onlyBookmarked !== initialBookmarked);

  const clearFilters = () => {
    setQuery('');
    setTag('');
    setSetFilter('');
    setDifficulty('');
    setSortBy('date');
    setOnlyBookmarked(initialBookmarked);
  };

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
    // Exclude the question ID from the exported JSON to avoid clashes
    // when re-importing into other instances.
    const { id, ...rest } = q;
    const blob = new Blob([JSON.stringify(rest, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `q${id}.json`;
    a.click();
    toast(`Exported q${id}.json`);
  };

  const exportCSV = () => {
    let csv = 'Question,YourAnswer,Correct,Explanation,Tags\n';
    (session.questions||[]).forEach((q, i) => {
      const sel = getAnswerLetters(results[i]?.selected || []).join('');
      const ans = getAnswerLetters(getQuestionAnswers(q)).join('');
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

  const totalSets = Object.keys(progressBySet).length;
  const totalWrong = Object.values(progressBySet).reduce((a, b) => a + b.wrong, 0);

  return (
    <div className="review-page">
      <div className="review-header">
        <div>
          <h2>Review</h2>
          <p className="muted">
            Search completed sessions, retry mistakes, and manage bookmarked questions.
          </p>
        </div>
        {hasActiveFilters && (
          <button type="button" className="btn-ghost" onClick={clearFilters}>
            Reset review filters
          </button>
        )}
      </div>
      <div className="bookmarks-layout">
        <aside className="bm-sidebar card">
          <input
            aria-label="Search review questions"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="review-sidebar-section">
            <h3>Tags</h3>
            <div className="chips">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`chip ${tag === t ? 'accent' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="review-sidebar-section">
            <h3>Sets</h3>
            <div className="chips">
              {sets.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`chip ${setFilter === s ? 'accent' : ''}`}
                  onClick={() => setSetFilter(s)}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="review-sidebar-section">
            <h3>Difficulty</h3>
            <div className="chips">
              {difficulties.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={`chip ${difficulty === d ? 'accent' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d || 'All'}
                </button>
              ))}
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyBookmarked}
              onChange={(e) => setOnlyBookmarked(e.target.checked)}
            />
            Only bookmarked questions
          </label>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setCompact((c) => !c)}
          >
            {compact ? 'Use detailed cards' : 'Use compact cards'}
          </button>
        </aside>
        <section className="bm-main">
          <div className="review-toolbar">
            <label className="sr-only" htmlFor="review-sort">Sort review questions</label>
            <select id="review-sort" aria-label="Sort review questions" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">By Date</option>
              <option value="set">By Set</option>
              <option value="difficulty">By Difficulty</option>
            </select>
            <button type="button" className="btn primary" onClick={retryIncorrect}>
              Retry Incorrect Only
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={exportCSV}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={exportJSON}
            >
              Export JSON
            </button>
          </div>
          <div className="card progress-card">
            <div>
              {totalSets} sets bookmarked, {totalWrong} incorrect left to retry
            </div>
            {totalSets === 0 ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                Bookmark questions to see progress by set.
              </p>
            ) : Object.entries(progressBySet).map(([s, data]) => {
              const pct = ((data.total - data.wrong) / data.total) * 100;
              return (
                <div key={s} className="progress-row">
                  <span>{s}</span>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: pct + '%' }}
                    ></div>
                  </div>
                  <span>
                    {data.total - data.wrong}/{data.total}
                  </span>
                </div>
              );
            })}
          </div>
          {!hasReviewData ? (
            <div className="card empty-state empty-state--center">
              <p className="muted">No completed session is available yet.</p>
              <button type="button" onClick={() => navigate('/quiz?mode=practice')}>
                Start a practice quiz
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <p className="muted">No review questions match the current filters.</p>
              <button type="button" className="btn-ghost" onClick={clearFilters}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className="question-grid">
          {filtered.map((q) => {
            const idx = allQuestions.findIndex((x) => x.id === q.id);
            const res = results[idx];
            const your = getAnswerTexts(q, res?.selected || []).join(', ');
            const corr = getAnswerTexts(q, getQuestionAnswers(q)).join(', ');
            const snippet =
              q.question.length > 120
                ? q.question.slice(0, 120) + '…'
                : q.question;
            const isExpanded = expanded.has(q.id);
            const status = res
              ? res.isCorrect
                ? 'correct'
                : 'incorrect'
              : 'unanswered';
            return (
              <div
                key={q.id}
                className={`question-card ${compact ? '' : 'card'}`}
              >
                <button
                  type="button"
                  className="qc-header qc-header-btn"
                  onClick={() => toggleExpand(q.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle review details for question ${idx + 1}`}
                >
                  <div className="qc-top">
                    <strong>Q{idx + 1}</strong>
                    {q.set && <span className="chip">{q.set}</span>}
                  </div>
                  <div className="qc-tags">
                    <span className={`chip status ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {q.difficulty && (
                      <span
                        className={`chip difficulty ${q.difficulty?.toLowerCase?.()}`}
                      >
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                  <div
                    className="qc-question"
                    dangerouslySetInnerHTML={{
                      __html: renderMDKaTeX(snippet),
                    }}
                  ></div>
                </button>
                <div className="qc-actions review-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => retryOne(q)}
                    aria-label={`Retry question ${idx + 1}`}
                    title="Retry"
                  >
                    🔄
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggleBookmark(q.id)}
                    aria-label={bookmarks.has(q.id) ? `Remove bookmark from question ${idx + 1}` : `Bookmark question ${idx + 1}`}
                    title={bookmarks.has(q.id) ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {bookmarks.has(q.id) ? '⭐' : '☆'}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => exportQuestion(q)}
                    aria-label={`Export question ${idx + 1}`}
                    title="Export"
                  >
                    ⬇️
                  </button>
                </div>
                {isExpanded && (
                  <div className="qc-extra">
                    <div>
                      <strong>Your:</strong>{' '}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderMDKaTeX(your || '—'),
                        }}
                      ></span>
                    </div>
                    <div>
                      <strong>Correct:</strong>{' '}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderMDKaTeX(corr),
                        }}
                      ></span>
                    </div>
                    {q.explanation && (
                      <div
                        style={{ marginTop: '6px' }}
                        className="muted"
                        dangerouslySetInnerHTML={{
                          __html: renderMDKaTeX(q.explanation),
                        }}
                      ></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
