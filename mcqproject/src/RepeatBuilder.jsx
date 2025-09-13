import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadRepeatSettings, saveRepeatSettings } from './repeat/settings';

export default function RepeatBuilder() {
  const navigate = useNavigate();
  const [source, setSource] = useState('entire');
  const [setId, setSetId] = useState('');
  const [tags, setTags] = useState([]);
  const [count, setCount] = useState('10');
  const [cfg, setCfg] = useState(() => loadRepeatSettings());
  const [allSets, setAllSets] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    try { setAllSets(JSON.parse(localStorage.getItem('sets')||'[]')); } catch { setAllSets([]); }
    try {
      const q = JSON.parse(localStorage.getItem('questions')||'[]');
      const t = new Set(); q.forEach(it => (it.tags||[]).forEach(tag=>t.add(tag)));
      setAllTags([...t]);
    } catch { setAllTags([]); }
  }, []);


  const start = (e) => {
    e.preventDefault();
    saveRepeatSettings(cfg);
    const params = new URLSearchParams();
    params.set('mode','repeat');
    params.set('source', source);
    if (setId) params.set('setId', setId);
    if (tags.length) params.set('tags', tags.join(','));
    if (count) params.set('count', count);
    navigate('/quiz?'+params.toString());
  };

  return (
    <div className="card" style={{maxWidth:900, margin:'0 auto'}}>
      <h2 style={{marginTop:0}}>Repeat Adaptive</h2>
      <p className="muted">Build a repeat set and tweak mastery/cooldown. Wrong answers repeat until mastered.</p>
      <form onSubmit={start}>
        <div className="grid-2">
          <div className="card" style={{padding:'12px'}}>
            <h3 style={{marginTop:0}}>Source</h3>
            <label><input type="radio" name="src" checked={source==='entire'} onChange={()=>setSource('entire')} /> Entire set/pool</label><br />
            <label><input type="radio" name="src" checked={source==='lastWrong'} onChange={()=>setSource('lastWrong')} /> Wrong from last session</label><br />
            <label><input type="radio" name="src" checked={source==='everWrong'} onChange={()=>setSource('everWrong')} /> Wrong ever</label><br />
            <label><input type="radio" name="src" checked={source==='byTags'} onChange={()=>setSource('byTags')} /> By tags</label>
            {source==='byTags' && (
              <div style={{marginTop:8}}>
                <div className="chips">
                  {allTags.map(t => (
                    <button type="button" key={t} className={`chip ${tags.includes(t)?'accent':''}`} onClick={()=>{
                      setTags(prev => prev.includes(t)? prev.filter(x=>x!==t) : [...prev, t]);
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{marginTop:8}}>
              <label style={{display:'block', marginBottom:4}}>Choose set</label>
              <div className="chips">
                <button type="button" className={`chip ${!setId ? 'accent' : ''}`} onClick={()=>setSetId('')}>All sets</button>
                {allSets.map(s => (
                  <button type="button" key={s.id} className={`chip ${String(setId)===String(s.id)?'accent':''}`} onClick={()=>setSetId(s.id)}>
                    {s.name} ({(s.questionIds||[]).length})
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginTop:8}}>
              <label>Count <input type="number" min="1" value={count} onChange={(e)=>setCount(e.target.value)} /></label>
            </div>
          </div>
          <div className="card" style={{padding:'12px'}}>
            <h3 style={{marginTop:0}}>Mastery & Cooldown</h3>
            <p className="soft-hint" style={{marginTop:-6}}>Control how questions are mastered and when they return.</p>
            <div className="grid-2">
              <label>Mastery type
                <select value={cfg.masteryType} onChange={(e)=>setCfg({...cfg, masteryType:e.target.value})}>
                  <option value="consecutive">Consecutive</option>
                  <option value="ratio">3 of last 4</option>
                </select>
                <small className="soft-hint">Consecutive requires a streak; ratio looks at the last four attempts.</small>
              </label>
              <label>Target
                <input type="number" min="1" value={cfg.masteryTarget} onChange={(e)=>setCfg({...cfg, masteryTarget:parseInt(e.target.value,10)||1})} />
                <small className="soft-hint">Required correct answers (e.g. 2 in a row or 3 of last 4).</small>
              </label>
              <label>Cooldown (s)
                <input type="number" min="0" value={cfg.cooldownSeconds} onChange={(e)=>setCfg({...cfg, cooldownSeconds:parseInt(e.target.value,10)||0})} />
                <small className="soft-hint">Minimum seconds before the question can appear again.</small>
              </label>
              <label>Leech threshold
                <input type="number" min="1" value={cfg.leechThreshold} onChange={(e)=>setCfg({...cfg, leechThreshold:parseInt(e.target.value,10)||1})} />
                <small className="soft-hint">Wrong attempts before a question is flagged as a leech.</small>
              </label>
            </div>
            <div className="chips" style={{marginTop:8}}>
              <label className="toggle" title="Must select all correct options. Extra choices count as wrong"><input type="checkbox" checked={cfg.strictMultiAnswer} onChange={(e)=>setCfg({...cfg, strictMultiAnswer:e.target.checked})} /> Strict multi-answer</label>
              <label className="toggle" title="Award partial points for multi-answer questions"><input type="checkbox" checked={cfg.partialCreditMode} onChange={(e)=>setCfg({...cfg, partialCreditMode:e.target.checked})} /> Partial credit</label>
              <label className="toggle" title="Automatically show explanation after a wrong answer"><input type="checkbox" checked={cfg.autoRevealExplanationOnError} onChange={(e)=>setCfg({...cfg, autoRevealExplanationOnError:e.target.checked})} /> Auto-show explanation on wrong</label>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
          <button type="submit" style={{flex:1,minWidth:140}}>Start Repeat</button>
        </div>
      </form>
    </div>
  );
}

