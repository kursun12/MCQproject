import { loadRepeatSettings } from './settings.js';

export class RepeatEngine {
  // opts.filterMastered controls whether items already marked as mastered
  // are excluded from the initial queue. Defaults to true for backward
  // compatibility but can be disabled when the caller wants to include
  // previously mastered items (e.g. when a fixed count of questions is
  // requested).
  constructor(allQuestions, poolIds, opts = {}) {
    this.all = allQuestions;
    this.byId = new Map(allQuestions.map(q => [q.id, q]));
    this.settings = loadRepeatSettings();
    this.stats = loadStats();
    const filterMastered = opts.filterMastered !== false;
    const masterFilter = (id) => !(this.stats[id]?.mastered);
    const base = (poolIds && poolIds.length ? poolIds : allQuestions.map(q=>q.id)).filter(id => this.byId.has(id));
    this.queue = filterMastered ? base.filter(masterFilter) : [...base];
    this.due = new Map();
    const now = Date.now();
    this.queue.forEach(id => this.due.set(id, now));
    this.history = []; // recent ids to avoid back-to-back
    this.sessionRepeats = new Map();
  }

  eligibleIds(now = Date.now()) {
    const s = this.settings;
    return this.queue.filter(id => {
      const last = this.history[this.history.length-1];
      if (s.maxBackToBackRepeats > 0 && last === id) return false;
      const due = this.due.get(id) || 0;
      return due <= now && (this.sessionRepeats.get(id)||0) < s.sessionMaxRepeatsPerItem;
    });
  }

  pickNext() {
    let ids = this.eligibleIds();
    if (ids.length === 0) {
      // All cards are cooling down. Pick the one with the earliest due date
      // so sessions don't terminate prematurely. This effectively ignores
      // cooldown if the queue is exhausted.
      const soonest = [...this.queue].sort((a, b) => (this.due.get(a) || 0) - (this.due.get(b) || 0))[0];
      if (!soonest) return null;
      ids = [soonest];
    }
    // priority: higher wrong rate, lower streak, older lastSeen
    ids.sort((a,b) => {
      const sa = this.stats[a] || {}; const sb = this.stats[b] || {};
      const wrA = (sa.wrong||0) / Math.max(1,(sa.seen||0));
      const wrB = (sb.wrong||0) / Math.max(1,(sb.seen||0));
      if (wrA !== wrB) return wrB - wrA;
      const stA = sa.correctStreak||0; const stB = sb.correctStreak||0;
      if (stA !== stB) return stA - stB;
      return (sa.lastSeenAt||0) - (sb.lastSeenAt||0);
    });
    const id = ids[0];
    this.history.push(id); if (this.history.length > 5) this.history.shift();
    return id;
  }

  next() { return this.pickNext(); }

  onShow(id) {
    const s = this.stats[id] || (this.stats[id] = baseStats());
    s.seen += 1; s.lastSeenAt = Date.now(); saveStats(this.stats);
  }

  onGrade(id, correct) {
    const s = this.stats[id] || (this.stats[id] = baseStats());
    if (correct) { s.correctStreak += 1; } else { s.correctStreak = 0; s.wrong += 1; }
    s.lastOutcome = correct ? 'correct' : 'wrong';
    // mastery
    const cfg = this.settings;
    if (cfg.masteryType === 'consecutive') {
      if (s.correctStreak >= cfg.masteryTarget) s.mastered = true;
    }
    // simple ratio: last 4 attempts stored in s.window
    s.window = s.window || [];
    s.window.push(correct ? 1 : 0); if (s.window.length > Math.max(4, cfg.masteryTarget)) s.window.shift();
    if (cfg.masteryType === 'ratio') {
      const need = cfg.masteryTarget; // interpret as 3 meaning 3 of last 4
      const lastN = 4; const sum = s.window.slice(-lastN).reduce((a,b)=>a+b,0);
      if (sum >= need) s.mastered = true;
    }
    // leech
    if (!correct && (s.wrong >= cfg.leechThreshold)) {
      s.leech = true; s.leechCount = (s.leechCount||0)+1;
    }
    saveStats(this.stats);

    // requeue or remove
    const idx = this.queue.indexOf(id);
    if (s.mastered) {
      if (idx >= 0) this.queue.splice(idx,1);
      return;
    }
    // spacing
    const now = Date.now();
    let nextDue = now + cfg.cooldownSeconds*1000;
    if (cfg.spacingCurve === 'short') {
      const box = Math.min(3, Math.max(0, s.box || 0));
      const steps = [30, 90, 180, 600]; // seconds
      nextDue = now + (correct ? steps[Math.min(3, box+1)] : steps[0]) * 1000;
      s.box = correct ? Math.min(3, box+1) : 0;
    }
    this.due.set(id, nextDue);
    this.sessionRepeats.set(id, (this.sessionRepeats.get(id)||0)+1);
  }
}

function baseStats(){ return { seen:0, wrong:0, correctStreak:0, lastOutcome:null, lastSeenAt:0, mastered:false, leech:false, leechCount:0, window:[] }; }

function loadStats(){ try { return JSON.parse(localStorage.getItem('repeatStats')||'{}'); } catch { return {}; } }
function saveStats(obj){ try { localStorage.setItem('repeatStats', JSON.stringify(obj)); } catch { /* empty */ } }

