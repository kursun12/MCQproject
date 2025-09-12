import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const [selectedSet, setSelectedSet] = useState(null);
  const countOptions = [10, 20, 25, 30];
  let qCount = 0, bmCount = 0;
  try { qCount = JSON.parse(localStorage.getItem('questions')||'[]').length; } catch { /* ignore */ }
  try { bmCount = JSON.parse(localStorage.getItem('bookmarks')||'[]').length; } catch { /* ignore */ }
  let session=null; try { session = JSON.parse(localStorage.getItem('mcqSession')||'null'); } catch { /* ignore */ }
  let sets=[]; try { sets = JSON.parse(localStorage.getItem('sets')||'[]'); } catch { /* ignore */ }
  return (
    <div>
      <div className="hero card">
        <h2>Welcome to MCQ Practice</h2>
        <p>Drill smarter with modes, streaks, and clean design.</p>
        <div className="badges" style={{justifyContent:'center', marginTop:8}}>
          <span className="chip">Questions: {qCount}</span>
          <span className="chip">Bookmarks: {bmCount}</span>
        </div>
        {session && session.questions?.length>0 && (
          <div style={{marginTop:12}}>
            <Link to={`/quiz?mode=${encodeURIComponent(session.mode||'practice')}`}>
              <button>Continue last session</button>
            </Link>
          </div>
        )}
      </div>
      <div className="menu-grid">
        <Link to="/quiz?mode=practice" className="menu-card">
          <strong>Practice</strong>
          <span className="muted">Instant feedback, streaks, badges</span>
        </Link>
        <Link to="/quiz?mode=test" className="menu-card">
          <strong>Test</strong>
          <span className="muted">No feedback until finish</span>
        </Link>
        <Link to="/quiz?mode=challenge" className="menu-card">
          <strong>Challenge</strong>
          <span className="muted">Points, speed bonus</span>
        </Link>
        <Link to="/review" className="menu-card">
          <strong>Review</strong>
          <span className="muted">Browse, search, filter, retry incorrect</span>
        </Link>
        <Link to="/import" className="menu-card">
          <strong>Questions</strong>
          <span className="muted">Library • Editor • Sets</span>
        </Link>
        <Link to="/settings" className="menu-card">
          <strong>Settings</strong>
          <span className="muted">Display, shuffle, partial credit</span>
        </Link>
      </div>
      {sets?.length>0 && (
        <div className="card" style={{marginTop:12,padding:'12px'}}>
          <div className="section-title"><strong>Quick sets</strong><span className="muted">Jump straight into a topic</span></div>
          <div className="chips">
            {sets.slice(0,6).map((s)=>{
              const count=(s.questionIds||[]).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${selectedSet===s.id?'accent':''}`}
                  onClick={()=>setSelectedSet(selectedSet===s.id?null:s.id)}
                >
                  {s.name} • {count}
                </button>
              );
            })}
          </div>
          {selectedSet && (
            <div className="chips" style={{marginTop:8}}>
              {countOptions
                .filter(n => n <= (sets.find(x=>x.id===selectedSet)?.questionIds?.length || 0))
                .map(n => (
                  <button
                    key={n}
                    type="button"
                    className="chip"
                    onClick={()=>navigate(`/quiz?mode=practice&setId=${encodeURIComponent(selectedSet)}&count=${n}`)}
                  >
                    {n}
                  </button>
                ))}
              <button
                type="button"
                className="chip"
                onClick={()=>navigate(`/quiz?mode=practice&setId=${encodeURIComponent(selectedSet)}`)}
              >
                All
              </button>
            </div>
          )}
        </div>
      )}
      <div className="card" style={{marginTop:12,padding:'12px'}}>
        <div className="section-title"><strong>Hard questions</strong><span className="muted">Focus on what you struggle with</span></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input id="hardCount" type="number" min="1" placeholder="Count (optional)" />
          <button onClick={()=>{ const v=document.getElementById('hardCount').value; navigate(`/quiz?mode=practice&hard=true&count=${encodeURIComponent(v||'')}`); }}>Start Hard</button>
        </div>
      </div>
      <div className="card" style={{marginTop:12,padding:'12px'}}>
        <div className="section-title"><strong>Shortcuts</strong><span className="muted">Power user keys</span></div>
        <div className="chips">
          <span className="kbd">1–9</span> <span className="muted">select</span>
          <span className="kbd">Enter</span> <span className="muted">submit/next</span>
          <span className="kbd">/</span> <span className="muted">search</span>
          <span className="kbd">b</span> <span className="muted">bookmark</span>
          <span className="kbd">?</span> <span className="muted">help</span>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
