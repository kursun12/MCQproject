import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from './components/Modal.jsx';
import { toast } from './utils/toast.js';
import { generateId } from './utils/id.js';
import { moveItem, remapAnswers, normalizeQuestion, prepareImport, ensureUniqueIds } from './utils/importUtils.js';
import { apiClient } from './utils/apiClient.js';

function ImportQuestions() {
  const optionalApiConfigured = !import.meta.env.DEV || Boolean(import.meta.env.VITE_API_BASE_URL);
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
    explanation: '',
    image: '',
  });
  const [sets, setSets] = useState([]);
  const [newSetName, setNewSetName] = useState('');
  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', ''],
    answers: [],
    explanation: '',
    image: '',
    setIds: [],
  });
  const [search, setSearch] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [assignFilter, setAssignFilter] = useState('all'); // all | assigned | unassigned
  const [activeTab, setActiveTab] = useState('library'); // library | editor | sets
  const [showNew, setShowNew] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragSrc, setDragSrc] = useState(null); // 'edit' | 'new'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [restoreDraftAvailable, setRestoreDraftAvailable] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const questionAssignments = useMemo(() => {
    // Build a map of questionId -> [setId, ...]. Use strings for
    // keys/values to avoid number/string mismatches which previously
    // broke filtering when set IDs were non-numeric.
    const map = new Map();
    sets.forEach((s) => {
      const sid = String(s.id);
      (s.questionIds || []).forEach((id) => {
        const qid = String(id);
        if (!map.has(qid)) map.set(qid, []);
        map.get(qid).push(sid);
      });
    });
    return map;
  }, [sets]);
  const [importBuffer, setImportBuffer] = useState([]);
  const [importSetIds, setImportSetIds] = useState([]);
  const [showImportAssign, setShowImportAssign] = useState(false);
  const [serverSets, setServerSets] = useState([]);
  const [selectedServerSet, setSelectedServerSet] = useState('');
  const [serverSetStatus, setServerSetStatus] = useState(optionalApiConfigured ? 'idle' : 'unavailable');
  const [serverSetMessage, setServerSetMessage] = useState(
    optionalApiConfigured
      ? ''
      : 'Server import is optional. Add VITE_API_BASE_URL or run the API to import server-hosted banks during local development.',
  );
  const serverFetchAttemptedRef = useRef(false);
  const prepareForImport = useCallback((incoming) => prepareImport(incoming, questions), [questions]);
  const generateUniqueBuffer = useCallback((incoming) => ensureUniqueIds(questions, incoming), [questions]);

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

  useEffect(() => {
    if (!optionalApiConfigured || serverFetchAttemptedRef.current) return;
    serverFetchAttemptedRef.current = true;
    setServerSetStatus('loading');
    apiClient
      .get('/api/questionsets')
      .then((data) => {
        if (Array.isArray(data)) {
          setServerSets(data);
          setServerSetStatus('ready');
          setServerSetMessage(
            data.length === 0
              ? 'The server API is available but no server-hosted question banks were found.'
              : '',
          );
          return;
        }
        setServerSetStatus('unavailable');
        setServerSetMessage('The optional server API returned an unexpected response.');
      })
      .catch((err) => {
        setServerSets([]);
        setServerSetStatus('unavailable');
        setServerSetMessage(
          err?.status === 404
            ? 'Server import is unavailable at this origin. Start the optional API or configure VITE_API_BASE_URL to enable it.'
            : 'Unable to reach the optional server import API right now.',
        );
      });
  }, [optionalApiConfigured]);

  const persistQuestions = (updater) => {
    setQuestions((prev) => {
      const arr = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('questions', JSON.stringify(arr));
      pruneSets(arr);
      return arr;
    });
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
    if (showImportAssign) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        const prepared = prepareForImport(parsed);
        setImportBuffer(prepared);
        setImportSetIds([]);
        setShowImportAssign(true);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const importFromServer = async () => {
    if (showImportAssign || !selectedServerSet) return;
    try {
      const parsed = await apiClient.get('/api/questionsets?name=' + encodeURIComponent(selectedServerSet));
      if (!Array.isArray(parsed)) throw new Error('Invalid format');
      const prepared = prepareForImport(parsed);
      setImportBuffer(prepared);
      setImportSetIds([]);
      setShowImportAssign(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to import the selected server question bank');
    }
  };

  const startEdit = useCallback((q) => {
    setEditingId(q.id);
    const normalized = normalizeQuestion(q);
    setDraft({
      question: normalized.question,
      options: [...normalized.options],
      answers: [...normalized.answers],
      explanation: normalized.explanation || '',
      image: normalized.image || '',
    });
    setActiveTab('editor');
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && !editingId) {
      const q = questions.find((x) => String(x.id) === String(editId));
      if (q) startEdit(q);
    }
  }, [location.search, questions, editingId, startEdit]);

  const importFromText = () => {
    if (showImportAssign) return;
    try {
      const parsed = JSON.parse(pasteText);
      if (!Array.isArray(parsed))
        throw new Error('JSON must be an array of question objects');
      const prepared = prepareForImport(parsed);
      setImportBuffer(prepared);
      setImportSetIds([]);
      setShowImportAssign(true);
      setPasteError('');
      setShowPaste(false);
      setPasteText('');
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
    const id = generateId();
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
    setNewQ({ question: '', options: ['', '', '', ''], answers: [], explanation: '', image: '', setIds: [] });
    setShowNew(false);
  };

  const addSet = () => {
    const name = newSetName.trim();
    if (!name) return;
    const id = generateId();
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
    const targetSet = sets.find((s) => String(s.id) === String(setId));
    const newSets = sets.map((s) => {
      if (String(s.id) !== String(setId)) return s;
      const current = new Set(s.questionIds || []);
      if (checked) current.add(qId);
      else current.delete(qId);
      return { ...s, questionIds: Array.from(current) };
    });
    persistSets(newSets);
    const action = checked ? 'Added to' : 'Removed from';
    toast(targetSet ? `${action} ${targetSet.name}` : checked ? 'Added to set' : 'Removed from set');
  };

  const toggleNewQSet = (setId, checked) => {
    const cur = new Set(newQ.setIds || []);
    if (checked) cur.add(setId);
    else cur.delete(setId);
    setNewQ({ ...newQ, setIds: Array.from(cur) });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      if (editingId) setDraft((d) => ({ ...d, image: data }));
      else setNewQ((q) => ({ ...q, image: data }));
    };
    reader.readAsDataURL(file);
  };

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      const assignedTo = questionAssignments.get(String(q.id)) || [];
      const isAssigned = assignedTo.length > 0;
      if (assignFilter === 'assigned' && !isAssigned) return false;
      if (assignFilter === 'unassigned' && isAssigned) return false;
      if (filterSet && !assignedTo.includes(String(filterSet))) return false;
      if (!term) return true;
      return (
        q.question.toLowerCase().includes(term) ||
        (q.options || []).some((o) => String(o).toLowerCase().includes(term))
      );
    });
  }, [search, filterSet, questions, questionAssignments, assignFilter]);
  const hasQuestions = questions.length > 0;
  const hasActiveLibraryFilters = Boolean(search.trim() || filterSet || assignFilter !== 'all');

  // ----- Draft autosave for New Question modal -----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('draftNewQuestion') || 'null');
      if (saved) setRestoreDraftAvailable(true);
    } catch { /* empty */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('draftNewQuestion', JSON.stringify(newQ)); } catch { /* empty */ }
  }, [newQ]);
  const restoreDraft = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('draftNewQuestion') || 'null');
      if (saved) setNewQ(saved);
    } catch { /* empty */ }
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
    const targetSet = sets.find((s) => String(s.id) === String(setId));
    const newSets = sets.map(s => {
      if (String(s.id) !== String(setId)) return s;
      const current = new Set(s.questionIds || []);
      selectedIds.forEach(id => current.add(id));
      return { ...s, questionIds: Array.from(current) };
    });
    persistSets(newSets);
    if (targetSet) {
      toast(`Assigned ${selectedIds.size} question${selectedIds.size === 1 ? '' : 's'} to ${targetSet.name}`);
    }
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

  const toggleImportSet = (setId) => {
    const next = new Set(importSetIds);
    if (next.has(setId)) next.delete(setId); else next.add(setId);
    setImportSetIds(Array.from(next));
  };

  const confirmImport = () => {
    if (importBuffer.length === 0) return;
    const uniqueBuffer = generateUniqueBuffer(importBuffer);

    // Store questions first
    persistQuestions((prev) => [...prev, ...uniqueBuffer]);

    // Assign imported questions to selected set(s)
    if (importSetIds.length > 0) {
      setSets((prev) => {
        const updated = prev.map((s) => {
          if (!importSetIds.includes(s.id)) return s;
          const current = new Set(s.questionIds || []);
          uniqueBuffer.forEach((q) => current.add(q.id));
          return { ...s, questionIds: Array.from(current) };
        });
        localStorage.setItem('sets', JSON.stringify(updated));
        return updated;
      });
    }

    // Feedback
    const assignedSets = sets
      .filter((s) => importSetIds.includes(s.id))
      .map((s) => s.name)
      .join(', ');
    const msg = importSetIds.length > 0
      ? `Imported ${uniqueBuffer.length} questions into '${assignedSets || 'selected set(s)'}'`
      : `Imported ${uniqueBuffer.length} questions (Unassigned)`;
    toast(msg);

    setImportBuffer([]);
    setImportSetIds([]);
    setShowImportAssign(false);
  };

  const cancelImport = () => {
    setImportBuffer([]);
    setImportSetIds([]);
    setShowImportAssign(false);
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Questions</h2>
      <div className="tabs" role="tablist" aria-label="Question tools">
        <button type="button" role="tab" aria-selected={activeTab==='library'} className={`tab ${activeTab==='library'?'active':''}`} onClick={()=>setActiveTab('library')}>Library</button>
        <button type="button" role="tab" aria-selected={activeTab==='editor'} className={`tab ${activeTab==='editor'?'active':''}`} onClick={()=>setActiveTab('editor')}>Editor</button>
        <button type="button" role="tab" aria-selected={activeTab==='sets'} className={`tab ${activeTab==='sets'?'active':''}`} onClick={()=>setActiveTab('sets')}>Sets</button>
      </div>

      {activeTab==='library' && (
        <div>
          <div className="toolbar">
            <button type="button" className="btn-outline" onClick={() => document.querySelector('#fileJson').click()}>📁 Import JSON</button>
            <input id="fileJson" type="file" accept=".json" onChange={handleFile} style={{display:'none'}} />
            <button type="button" className="btn-outline" onClick={()=>{ setShowPaste(true); setPasteError(''); }}>📋 Paste JSON</button>
            {serverSetStatus === 'ready' && serverSets.length > 0 && (
              <>
                <select
                  aria-label="Server question bank"
                  value={selectedServerSet}
                  onChange={(e)=>setSelectedServerSet(e.target.value)}
                >
                  <option value="">Select set</option>
                  {serverSets.map((s)=>(<option key={s} value={s}>{s}</option>))}
                </select>
                <button type="button" className="btn-outline" onClick={importFromServer} disabled={!selectedServerSet}>🌐 Import</button>
              </>
            )}
            {serverSetStatus === 'loading' && <span className="muted">Loading server banks…</span>}
            {serverSetStatus === 'unavailable' && serverSetMessage && (
              <span className="muted" role="status">{serverSetMessage}</span>
            )}
            {serverSetStatus === 'ready' && serverSets.length === 0 && serverSetMessage && (
              <span className="muted" role="status">{serverSetMessage}</span>
            )}
            <input aria-label="Search questions" type="search" placeholder="Search questions" value={search} onChange={(e)=>setSearch(e.target.value)} />
            {sets.length>0 && (
              <select aria-label="Filter by set" value={filterSet} onChange={(e)=>setFilterSet(e.target.value)}>
                <option value="">All sets</option>
                {sets.map((s)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            )}
            <select aria-label="Assignment filter" value={assignFilter} onChange={(e)=>setAssignFilter(e.target.value)} title="Assignment filter">
              <option value="all">All (assigned + unassigned)</option>
              <option value="assigned">Assigned only</option>
              <option value="unassigned">Unassigned only</option>
            </select>
            <span className="chip">Total: {questions.length}</span>
            <button type="button" onClick={()=>{ setShowNew(true); }}>+ New</button>
            {selectedIds.size>0 && (
              <>
                <button type="button" className="btn-danger" onClick={batchDelete}>Delete selected ({selectedIds.size})</button>
                {sets.length>0 && (
                  <select
                    aria-label="Assign selected to set"
                    onChange={(e)=>{ const sid=e.target.value; if(!sid) return; batchAssign(sid); e.target.value=''; }}
                  >
                    <option value="">Assign selected to…</option>
                    {sets.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                )}
                <button type="button" className="btn-ghost" onClick={clearSelection}>Clear selection</button>
              </>
            )}
            {selectedIds.size===0 && filteredQuestions.length>0 && (
              <button type="button" className="btn-ghost" onClick={selectAllFiltered}>Select all (filtered)</button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {filteredQuestions.length > 0 ? (
            <ul className="question-list">
              {filteredQuestions.map((q) => (
                <li key={q.id} className="question-item question-row">
                  <input
                    type="checkbox"
                    aria-label={`Select question ${q.id}`}
                    checked={selectedIds.has(q.id)}
                    onChange={(e)=>toggleSelect(q.id, e.target.checked)}
                  />
                  <div className="question-row__main">
                    <div className="question-row__content">
                      <p style={{margin:'4px 0'}}>{q.question}</p>
                      {sets.length > 0 && (
                        <div className="badges">
                          {sets.filter((s)=>(s.questionIds||[]).includes(q.id)).map((s)=>(
                            <span key={s.id} className="badge-set">{s.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="question-row__actions">
                      {sets.length>0 && (
                        <select
                          aria-label={`Assign question ${q.id} to set`}
                          onChange={(e)=>{ const sid=e.target.value; if(!sid) return; toggleQuestionInSet(sid, q.id, true); e.target.value=''; }}
                        >
                          <option value="">Assign to set…</option>
                          {sets.filter((s)=>!(s.questionIds||[]).includes(q.id)).map((s)=>(<option value={s.id} key={s.id}>{s.name}</option>))}
                        </select>
                      )}
                      <button type="button" className="btn-ghost" onClick={() => startEdit(q)}>Edit</button>
                      <button type="button" className="btn-danger" onClick={() => deleteQuestion(q.id)}>Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              {hasQuestions ? (
                <>
                  <p className="muted">No questions match the current filters.</p>
                  {hasActiveLibraryFilters && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setSearch('');
                        setFilterSet('');
                        setAssignFilter('all');
                      }}
                    >
                      Reset filters
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="muted">No questions are stored in this library yet.</p>
                  <div className="chips">
                    <button type="button" className="btn-outline" onClick={() => document.querySelector('#fileJson').click()}>Import JSON</button>
                    <button type="button" className="btn-ghost" onClick={()=>{ setShowPaste(true); setPasteError(''); }}>Paste JSON</button>
                    <button type="button" onClick={()=>setShowNew(true)}>Create question</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab==='editor' && (
        <div className="two-col">
          <div className="card" style={{padding:'0'}}>
            <div className="editor-actions">
              <div className="soft-hint">{editingId? 'Editing question' : 'New Question'} • Markdown & KaTeX supported</div>
              {(() => {
                const o = (editingId? draft.options : newQ.options).filter(v=>String(v||'').trim()!=='');
                const a = (editingId? draft.answers : newQ.answers);
                const valid = o.length >= 4 && a.length >= 1 && a.every(i=>i<o.length);
                return (
                  <div style={{display:'flex',gap:8}}>
                    {editingId? (
                      <>
                        <button type="button" disabled={!valid} onClick={saveEdit}>Save</button>
                        <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" disabled={!valid} onClick={addQuestion}>Add</button>
                        {restoreDraftAvailable && <button type="button" className="btn-ghost" onClick={restoreDraft}>Restore draft</button>}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            <div style={{padding:'12px'}}>
              {/* Validation chips */}
              {(() => {
                const o = (editingId? draft.options : newQ.options).filter(v=>String(v||'').trim()!=='');
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
              <div style={{marginTop:8}}>
                {(editingId ? draft.image : newQ.image) ? (
                  <div>
                    <img src={editingId ? draft.image : newQ.image} alt="preview" style={{maxWidth:'100%'}} />
                    <button className="btn-ghost" onClick={() => editingId ? setDraft({ ...draft, image: '' }) : setNewQ({ ...newQ, image: '' })} style={{marginTop:6}}>Remove image</button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                )}
              </div>
              <div className="template-row">
                <button type="button" className="btn-ghost" onClick={()=>{
                  const base=[ 'True','False' ];
                  if (editingId) setDraft({...draft, options: base, answers:[0]}); else setNewQ({...newQ, options: base, answers:[0]});
                }}>True/False</button>
                <button type="button" className="btn-ghost" onClick={()=>{
                  const base=['Option 1','Option 2','Option 3','Option 4'];
                  if (editingId) setDraft({...draft, options: base, answers:[0]}); else setNewQ({...newQ, options: base, answers:[0]});
                }}>4-Option Single</button>
                <button type="button" className="btn-ghost" onClick={()=>{
                  const base=['Item 1','Item 2','Item 3','Item 4'];
                  if (editingId) setDraft({...draft, options: base, answers:[0,1]}); else setNewQ({...newQ, options: base, answers:[0,1]});
                }}>Multi (2 correct)</button>
              </div>
            </div>
          </div>
          <div className="card" style={{padding:'12px'}}>
            <h3 style={{marginTop:0}}>Options</h3>
            {(editingId? draft.options : newQ.options).map((opt, idx) => (
              <div key={idx}
                   className="opt-row"
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
                   style={{cursor:'grab'}}>
                <span className="opt-letter">{String.fromCharCode(65+idx)}</span>
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
                  onKeyDown={(e)=>{
                    if (e.key==='Enter') {
                      if (editingId) setDraft({...draft, options:[...draft.options, '']}); else setNewQ({...newQ, options:[...newQ.options, '']});
                    }
                  }}
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
                <button type="button" className="btn-ghost" onClick={() => (editingId? removeDraftOption(idx) : removeNewQOption(idx))}>✖</button>
              </div>
            ))}
            <button type="button" className="btn-outline" onClick={() => (editingId? setDraft({ ...draft, options: [...draft.options, ''] }) : setNewQ({ ...newQ, options: [...newQ.options, ''] }))}>+ Option</button>
            <div style={{marginTop:10}}>
              {sets.length>0 && <p className="muted" style={{marginBottom:6}}>Assign to set(s)</p>}
              <div className="chips">
                {sets.map((s)=>{
                  const assigned = editingId? (s.questionIds||[]).includes(editingId) : (newQ.setIds||[]).includes(s.id);
                  return (
                    <button type="button" key={s.id} className={`chip ${assigned? 'accent':''}`} onClick={()=>{
                      if (editingId) toggleQuestionInSet(s.id, editingId, !assigned);
                      else toggleNewQSet(s.id, !assigned);
                    }}>{s.name}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='sets' && (
        <div>
          <div className="toolbar">
            <input type="text" placeholder="New set name" value={newSetName} onChange={(e)=>setNewSetName(e.target.value)} />
            <button type="button" onClick={addSet}>+ Add Set</button>
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
                    <button type="button" className="btn-danger" onClick={()=>deleteSet(s.id)}>Delete</button>
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
        {newQ.image ? (
          <div style={{marginTop:6}}>
            <img src={newQ.image} alt="preview" style={{maxWidth:'100%'}} />
            <button className="btn-ghost" onClick={()=>setNewQ({...newQ, image:''})} style={{marginTop:6}}>Remove image</button>
          </div>
        ) : (
          <div style={{marginTop:6}}><input type="file" accept="image/*" onChange={handleImageChange} /></div>
        )}
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

      <Modal
        open={showImportAssign}
        onClose={cancelImport}
        title="Assign imported questions"
        footer={[
          <button key="import" onClick={confirmImport}>Import</button>,
          <button key="cancel" className="btn-ghost" onClick={cancelImport}>Cancel</button>
        ]}
      >
        <p className="muted" style={{marginTop:0}}>Imported {importBuffer.length} question(s). Assign to set(s) or leave unassigned.</p>
        {sets.length>0 ? (
          <div className="chips">
            {sets.map(s => {
              const active = importSetIds.includes(s.id);
              return (
                <button key={s.id} className={`chip ${active?'accent':''}`} onClick={()=>toggleImportSet(s.id)}>{s.name}</button>
              );
            })}
          </div>
        ) : (
          <p className="muted">No sets available</p>
        )}
      </Modal>
    </div>
  );
}

export default ImportQuestions;


