import { useState, useEffect, useMemo } from 'react';
import Modal from './components/Modal.jsx';
import { toast } from './utils/toast.js';

function ImportQuestions() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
  });
  const [sets, setSets] = useState([]);
  const [newSetName, setNewSetName] = useState('');
  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
    explanation: '',
    setIds: [],
  });
  const [search, setSearch] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // library | editor | sets
  const [showNew, setShowNew] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragSrc, setDragSrc] = useState(null); // 'edit' | 'new'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [restoreDraftAvailable, setRestoreDraftAvailable] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  const moveItem = (arr, from, to) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const remapAnswers = (answers, from, to) => {
    // When option moves, update indices in answers accordingly
    return answers.map((i) => {
      if (i === from) return to;
      if (from < to && i > from && i <= to) return i - 1;
      if (to < from && i >= to && i < from) return i + 1;
      return i;
    }).sort((a,b)=>a-b);
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('questions') || '[]');
      const normalized = Array.isArray(stored)
        ? stored.map((q) => normalizeQuestion(q))
        : [];
      setQuestions(normalized);
    } catch {
      setQuestions([]);
    }
    try {
      const storedSets = JSON.parse(localStorage.getItem('sets') || '[]');
      setSets(Array.isArray(storedSets) ? storedSets : []);
    } catch {
      setSets([]);
    }
  }, []);

  const normalizeQuestion = (q) => {
    const answers = Array.isArray(q.answers)
      ? q.answers
      : Array.isArray(q.answer)
      ? q.answer
      : Number.isFinite(q.answer)
      ? [q.answer]
      : [];
    // Ensure unique, in-range indices
    const validAnswers = Array.from(new Set(answers)).filter(
      (i) => Number.isInteger(i) && i >= 0 && i < (q.options?.length || 0)
    );
    return {
      id: q.id ?? Date.now(),
      question: q.question ?? '',
      options: q.options || [],
      answers: validAnswers,
      // Keep single answer for backward compatibility
      answer: validAnswers.length > 0 ? validAnswers[0] : 0,
      explanation: q.explanation || '',
    };
  };

  const persistQuestions = (arr) => {
    setQuestions(arr);
    localStorage.setItem('questions', JSON.stringify(arr));
    pruneSets(arr);
  };

  const persistSets = (arr) => {
    setSets(arr);
    localStorage.setItem('sets', JSON.stringify(arr));
  };

  const pruneSets = (updatedQuestions) => {
    const ids = new Set(updatedQuestions.map((q) => q.id));
    const cleaned = sets.map((s) => ({
      ...s,
      questionIds: (s.questionIds || []).filter((id) => ids.has(id)),
    }));
    persistSets(cleaned);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        const questionsWithIds = parsed.map((q, idx) =>
          normalizeQuestion({ ...q, id: q.id ?? Date.now() + idx })
        );
        persistQuestions(questionsWithIds);
        setError('');
        toast('Imported questions');
      } catch (err) {
        console.error(err);
        setError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    const normalized = normalizeQuestion(q);
    setDraft({
      question: normalized.question,
      options: [...normalized.options],
      answers: [...normalized.answers],
    });
    setActiveTab('editor');
  };

  const importFromText = () => {
    try {
      const parsed = JSON.parse(pasteText);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of question objects');
      const questionsWithIds = parsed.map((q, idx) =>
        normalizeQuestion({ ...q, id: q.id ?? Date.now() + idx })
      );
      persistQuestions(questionsWithIds);
      setPasteError('');
      setShowPaste(false);
      setPasteText('');
      toast(`Imported ${questionsWithIds.length} questions`);
    } catch (err) {
      console.error(err);
      setPasteError(err.message || 'Failed to parse JSON');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActiveTab('library');
  };

  const saveEdit = () => {
    const updated = questions.map((q) =>
      q.id === editingId
        ? normalizeQuestion({ ...q, ...draft, id: q.id })
        : q
    );
    persistQuestions(updated);
    setEditingId(null);
    toast('Saved changes');
  };

  const deleteQuestion = (id) => {
    const updated = questions.filter((q) => q.id !== id);
    persistQuestions(updated);
    toast('Question deleted');
  };

  const addQuestion = () => {
    const id = Date.now();
    const q = normalizeQuestion({ ...newQ, id });
    const updated = [...questions, q];
    persistQuestions(updated);
    if (newQ.setIds.length > 0) {
      const updatedSets = sets.map((s) =>
        newQ.setIds.includes(s.id)
          ? { ...s, questionIds: Array.from(new Set([...(s.questionIds || []), id])) }
          : s
      );
      persistSets(updatedSets);
    }
    setNewQ({ question: '', options: ['', '', '', ''], answers: [], explanation: '', setIds: [] });
    setShowNew(false);
  };

  const addSet = () => {
    const name = newSetName.trim();
    if (!name) return;
    const id = Date.now();
    const newSets = [...sets, { id, name, questionIds: [] }];
    persistSets(newSets);
    setNewSetName('');
    toast('Set created');
  };

  const renameSet = (id, name) => {
    const newSets = sets.map((s) => (s.id === id ? { ...s, name } : s));
    persistSets(newSets);
  };

  const deleteSet = (id) => {
    const newSets = sets.filter((s) => s.id !== id);
    persistSets(newSets);
  };

  const toggleQuestionInSet = (setId, qId, checked) => {
    const newSets = sets.map((s) => {
      if (s.id !== setId) return s;
      const current = new Set(s.questionIds || []);
      if (checked) current.add(qId);
      else current.delete(qId);
      return { ...s, questionIds: Array.from(current) };
    });
    persistSets(newSets);
    toast(checked? 'Added to set' : 'Removed from set');
  };

  const toggleNewQSet = (setId, checked) => {
    const cur = new Set(newQ.setIds || []);
    if (checked) cur.add(setId);
    else cur.delete(setId);
    setNewQ({ ...newQ, setIds: Array.from(cur) });
  };

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (filterSet) {
        const s = sets.find((x) => x.id === Number(filterSet));
        if (!s || !(s.questionIds || []).includes(q.id)) return false;
      }
      if (!term) return true;
      return (
        q.question.toLowerCase().includes(term) ||
        (q.options||[]).some((o) => String(o).toLowerCase().includes(term))
      );
    });
  }, [search, filterSet, questions, sets]);

  // ----- Draft autosave for New Question modal -----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('draftNewQuestion') || 'null');
      if (saved) setRestoreDraftAvailable(true);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('draftNewQuestion', JSON.stringify(newQ)); } catch {}
  }, [newQ]);
  const restoreDraft = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('draftNewQuestion') || 'null');
      if (saved) setNewQ(saved);
    } catch {}
  };

  // ----- Batch selection helpers (Library) -----
  const toggleSelect = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id); else next.delete(id);
    setSelectedIds(next);
  };
  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredQuestions.forEach(q => next.add(q.id));
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());
  const batchDelete = () => {
    if (selectedIds.size === 0) return;
    const updated = questions.filter(q => !selectedIds.has(q.id));
    persistQuestions(updated);
    setSelectedIds(new Set());
  };
  const batchAssign = (setId) => {
    const newSets = sets.map(s => {
      if (s.id !== setId) return s;
      const current = new Set(s.questionIds || []);
      selectedIds.forEach(id => current.add(id));
      return { ...s, questionIds: Array.from(current) };
    });
    persistSets(newSets);
  };

  const removeDraftOption = (idx) => {
    const opts = draft.options.filter((_, i) => i !== idx);
    const ans = draft.answers.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i));
    setDraft({ ...draft, options: opts, answers: ans });
  };

  const removeNewQOption = (idx) => {
    const opts = newQ.options.filter((_, i) => i !== idx);
    const ans = newQ.answers.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i));
    setNewQ({ ...newQ, options: opts, answers: ans });
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Questions</h2>
      <div className="tabs">
        <button className={`tab ${activeTab==='library'?'active':''}`} onClick={()=>setActiveTab('library')}>Library</button>
        <button className={`tab ${activeTab==='editor'?'active':''}`} onClick={()=>setActiveTab('editor')}>Editor</button>
        <button className={`tab ${activeTab==='sets'?'active':''}`} onClick={()=>setActiveTab('sets')}>Sets</button>
      </div>

      {activeTab==='library' && (
        <div>
          <div className="toolbar">
            <button className="btn-outline" onClick={() => document.querySelector('#fileJson').click()}>📁 Import JSON</button>
            <input id="fileJson" type="file" accept=".json" onChange={handleFile} style={{display:'none'}} />
            <button className="btn-outline" onClick={()=>{ setShowPaste(true); setPasteError(''); }}>📋 Paste JSON</button>
            <input type="search" placeholder="Search questions" value={search} onChange={(e)=>setSearch(e.target.value)} />
            {sets.length>0 && (
              <select value={filterSet} onChange={(e)=>setFilterSet(e.target.value)}>
                <option value="">All sets</option>
                {sets.map((s)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            )}
            <span className="chip">Total: {questions.length}</span>
            <button onClick={()=>{ setShowNew(true); }}>+ New</button>
            {selectedIds.size>0 && (
              <>
                <button className="btn-danger" onClick={batchDelete}>Delete selected ({selectedIds.size})</button>
                {sets.length>0 && (
                  <select onChange={(e)=>{ const sid=Number(e.target.value); if(!sid) return; batchAssign(sid); e.target.value=''; }}>
                    <option value="">Assign selected to…</option>
                    {sets.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                )}
                <button className="btn-ghost" onClick={clearSelection}>Clear selection</button>
              </>
            )}
            {selectedIds.size===0 && filteredQuestions.length>0 && (
              <button className="btn-ghost" onClick={selectAllFiltered}>Select all (filtered)</button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {filteredQuestions.length > 0 ? (
            <ul className="question-list">
              {filteredQuestions.map((q) => (
                <li key={q.id} className="question-item" style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <input type="checkbox" checked={selectedIds.has(q.id)} onChange={(e)=>toggleSelect(q.id, e.target.checked)} />
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px',width:'100%'}}>
                    <div style={{flex:1}}>
                      <p style={{margin:'4px 0'}}>{q.question}</p>
                      {sets.length > 0 && (
                        <div className="badges">
                          {sets.filter((s)=>(s.questionIds||[]).includes(q.id)).map((s)=>(
                            <span key={s.id} className="badge-set">{s.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      {sets.length>0 && (
                        <select onChange={(e)=>{ const sid=Number(e.target.value); if(!sid) return; toggleQuestionInSet(sid, q.id, true); e.target.value=''; }}>
                          <option value="">Assign to set…</option>
                          {sets.filter((s)=>!(s.questionIds||[]).includes(q.id)).map((s)=>(<option value={s.id} key={s.id}>{s.name}</option>))}
                        </select>
                      )}
                      <button className="btn-ghost" onClick={() => startEdit(q)}>Edit</button>
                      <button className="btn-danger" onClick={() => deleteQuestion(q.id)}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No questions match your filters.</p>
          )}
        </div>
      )}

      {activeTab==='editor' && (
        <div className="two-col">
          <div className="card" style={{padding:'12px'}}>
            <h3 style={{marginTop:0}}>{editingId? 'Edit Question' : 'New Question'}</h3>
            {/* Validation hints */}
            {(() => {
              const o = (editingId? draft.options : newQ.options).filter(Boolean);
              const a = (editingId? draft.answers : newQ.answers);
              const ok = o.length >= 4 && a.length >= 1 && a.every(i=>i<o.length);
              return (
                <div className="chips" style={{marginBottom:8}}>
                  <span className={`chip ${o.length>=4?'accent':''}`}>≥4 options</span>
                  <span className={`chip ${a.length>=1?'accent':''}`}>≥1 correct</span>
                  {!ok && <span className="chip">Fill all required</span>}
                </div>
              );
            })()}
            <textarea
              placeholder="Question text"
              value={editingId? draft.question : newQ.question}
              onChange={(e) => editingId? setDraft({ ...draft, question: e.target.value }) : setNewQ({ ...newQ, question: e.target.value })}
            />
            <input
              type="text"
              placeholder="Explanation (optional)"
              value={editingId? (draft.explanation||'') : (newQ.explanation||'')}
              onChange={(e) => editingId? setDraft({ ...draft, explanation: e.target.value }) : setNewQ({ ...newQ, explanation: e.target.value })}
              style={{marginTop:8}}
            />
          </div>
          <div className="card" style={{padding:'12px'}}>
            <h3 style={{marginTop:0}}>Options</h3>
            {(editingId? draft.options : newQ.options).map((opt, idx) => (
              <div key={idx}
                   draggable
                   onDragStart={()=>{ setDragIdx(idx); setDragSrc(editingId? 'edit':'new'); }}
                   onDragOver={(e)=>e.preventDefault()}
                   onDrop={()=>{
                     if (dragIdx===null) return;
                     const src = dragSrc;
                     if (editingId && src==='edit') {
                       const moved = moveItem(draft.options, dragIdx, idx);
                       const mapped = remapAnswers(draft.answers, dragIdx, idx);
                       setDraft({...draft, options:moved, answers:mapped});
                     } else if (!editingId && src==='new') {
                       const moved = moveItem(newQ.options, dragIdx, idx);
                       const mapped = remapAnswers(newQ.answers, dragIdx, idx);
                       setNewQ({...newQ, options:moved, answers:mapped});
                     }
                     setDragIdx(null); setDragSrc(null);
                   }}
                   style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:6, cursor:'grab'}}>
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    if (editingId) {
                      const opts = [...draft.options]; opts[idx] = e.target.value; setDraft({ ...draft, options: opts });
                    } else {
                      const opts = [...newQ.options]; opts[idx] = e.target.value; setNewQ({ ...newQ, options: opts });
                    }
                  }}
                  style={{flex:1}}
                />
                <label className="toggle" title="Mark correct">
                  <input
                    type="checkbox"
                    checked={(editingId? draft.answers : newQ.answers).includes(idx)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (editingId) {
                        const set = new Set(draft.answers); if (checked) set.add(idx); else set.delete(idx);
                        setDraft({ ...draft, answers: Array.from(set).sort((a,b)=>a-b) });
                      } else {
                        const set = new Set(newQ.answers); if (checked) set.add(idx); else set.delete(idx);
                        setNewQ({ ...newQ, answers: Array.from(set).sort((a,b)=>a-b) });
                      }
                    }}
                  />
                </label>
                <button className="btn-ghost" onClick={() => (editingId? removeDraftOption(idx) : removeNewQOption(idx))}>✖</button>
              </div>
            ))}
            <button className="btn-outline" onClick={() => (editingId? setDraft({ ...draft, options: [...draft.options, ''] }) : setNewQ({ ...newQ, options: [...newQ.options, ''] }))}>+ Option</button>
            <div style={{marginTop:10}}>
              {sets.length>0 && <p className="muted" style={{marginBottom:6}}>Assign to set(s)</p>}
              <div className="chips">
                {sets.map((s)=>{
                  const assigned = editingId? (s.questionIds||[]).includes(editingId) : (newQ.setIds||[]).includes(s.id);
                  return (
                    <button key={s.id} className={`chip ${assigned? 'accent':''}`} onClick={()=>{
                      if (editingId) toggleQuestionInSet(s.id, editingId, !assigned);
                      else toggleNewQSet(s.id, !assigned);
                    }}>{s.name}</button>
                  );
                })}
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:12}}>
              {editingId? (
                <>
                  <button onClick={saveEdit}>Save</button>
                  <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  {restoreDraftAvailable && <button className="btn-ghost" onClick={restoreDraft}>Restore draft</button>}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab==='sets' && (
        <div>
          <div className="toolbar">
            <input type="text" placeholder="New set name" value={newSetName} onChange={(e)=>setNewSetName(e.target.value)} />
            <button onClick={addSet}>+ Add Set</button>
          </div>
          {sets.length ? (
            <ul className="set-list">
              {sets.map((s) => (
                <li key={s.id} className="card" style={{padding:'10px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'8px',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <input type="text" value={s.name} onChange={(e)=>renameSet(s.id, e.target.value)} />
                    <span className="chip">{(s.questionIds||[]).length} items</span>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button className="btn-danger" onClick={()=>deleteSet(s.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No sets yet — create one above.</p>
          )}
        </div>
      )}

      <Modal
        open={showNew}
        onClose={()=>setShowNew(false)}
        title="New Question"
        footer={[
          <button key="add" onClick={addQuestion}>Add</button>,
          <button key="cancel" className="btn-ghost" onClick={()=>setShowNew(false)}>Cancel</button>
        ]}
      >
        <textarea placeholder="Question text" value={newQ.question} onChange={(e)=>setNewQ({...newQ, question:e.target.value})} />
        {newQ.options.map((opt, idx)=>(
          <div key={idx} style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
            <input type="text" placeholder={`Option ${idx+1}`} value={opt} onChange={(e)=>{ const opts=[...newQ.options]; opts[idx]=e.target.value; setNewQ({...newQ, options: opts}); }} style={{flex:1}} />
            <label className="toggle" title="Correct"><input type="checkbox" checked={newQ.answers.includes(idx)} onChange={(e)=>{ const set=new Set(newQ.answers); if(e.target.checked) set.add(idx); else set.delete(idx); setNewQ({...newQ, answers:[...set].sort((a,b)=>a-b)}); }} /></label>
            <button className="btn-ghost" onClick={()=>removeNewQOption(idx)}>✖</button>
          </div>
        ))}
        <button className="btn-outline" onClick={()=>setNewQ({...newQ, options:[...newQ.options, '']})}>+ Option</button>
        {sets.length>0 && (
          <div style={{marginTop:10}}>
            <p className="muted" style={{marginBottom:6}}>Assign to set(s)</p>
            <div className="chips">
              {sets.map((s)=>{
                const assigned=(newQ.setIds||[]).includes(s.id);
                return <button key={s.id} className={`chip ${assigned?'accent':''}`} onClick={()=>toggleNewQSet(s.id, !assigned)}>{s.name}</button>
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showPaste}
        onClose={()=>setShowPaste(false)}
        title="Paste JSON Questions"
        footer={[
          <button key="import" onClick={importFromText} disabled={!pasteText.trim()}>Import</button>,
          <button key="cancel" className="btn-ghost" onClick={()=>setShowPaste(false)}>Cancel</button>
        ]}
      >
        <p className="muted" style={{marginTop:0}}>Paste an array of question objects like: [{`{ question, options[], answer, explanation?, tags? }`}]</p>
        <textarea
          placeholder='[\n  {"question":"...","options":["A","B","C","D"],"answer":1,"explanation":"...","tags":["tag"]}\n]'
          value={pasteText}
          onChange={(e)=>setPasteText(e.target.value)}
          style={{minHeight:180}}
        />
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
          <span className="muted">{pasteText.length} chars</span>
          {pasteError && <span style={{color:'var(--danger)'}}>{pasteError}</span>}
        </div>
      </Modal>
    </div>
  );
}

export default ImportQuestions;
