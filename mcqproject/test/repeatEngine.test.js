import { test } from 'node:test';
import assert from 'node:assert';
import { RepeatEngine } from '../src/repeat/engine.js';
import { DEFAULT_REPEAT_SETTINGS, saveRepeatSettings } from '../src/repeat/settings.js';

// Minimal localStorage mock for Node environment
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; }
};

saveRepeatSettings(DEFAULT_REPEAT_SETTINGS);

const questions = [{ id: 1 }, { id: 2 }];

// After cycling through both questions quickly the engine should still
// provide another question instead of terminating when cooldowns are active.
test('engine continues when all items are cooling down', () => {
  const eng = new RepeatEngine(questions);
  // first question
  const q1 = eng.next();
  assert.ok(q1 !== null);
  eng.onShow(q1);
  eng.onGrade(q1, false); // answered wrong
  // second question
  const q2 = eng.next();
  assert.ok(q2 !== null && q2 !== q1);
  eng.onShow(q2);
  eng.onGrade(q2, false); // answered wrong as well
  // both questions now have future due times but next() should still return one
  const nextId = eng.next();
  assert.ok(nextId !== null);
});
