import { Link, useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  let qCount = 0, bmCount = 0;
  try { qCount = JSON.parse(localStorage.getItem('questions')||'[]').length; } catch {}
  try { bmCount = JSON.parse(localStorage.getItem('bookmarks')||'[]').length; } catch {}
  let session=null; try { session = JSON.parse(localStorage.getItem('mcqSession')||'null'); } catch {}
  let sets=[]; try { sets = JSON.parse(localStorage.getItem('sets')||'[]'); } catch {}
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
            {sets.slice(0,6).map((s)=>(
              <Link key={s.id} to="/review" className="chip">{s.name} • {(s.questionIds||[]).length}</Link>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,marginTop:10,alignItems:'center'}}>
            <form onSubmit={(e)=>{e.preventDefault(); const setId=e.currentTarget.setId.value; const count=e.currentTarget.count.value; if(!setId) return; navigate(`/quiz?mode=practice&setId=${encodeURIComponent(setId)}&count=${encodeURIComponent(count||'')}`);}} style={{display:'contents'}}>
              <select name="setId">
                <option value="">Choose a set…</option>
                {sets.map(s => (<option key={s.id} value={s.id}>{s.name} ({(s.questionIds||[]).length})</option>))}
              </select>
              <input name="count" type="number" min="1" placeholder="Count" />
              <button type="submit">Start Set</button>
            </form>
          </div>
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
