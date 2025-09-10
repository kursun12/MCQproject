import { test } from 'node:test';
import assert from 'node:assert';
import { loadState, saveState } from '../src/utils/progress.js';

globalThis.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, val) {
    this.store[key] = String(val);
  },
  removeItem(key) {
    delete this.store[key];
  },
};

test('stores and loads quiz progress', () => {
  saveState({ current: 1, answers: [0], bookmarks: [2] });
  const state = loadState();
  assert.deepStrictEqual(state, { current: 1, answers: [0], bookmarks: [2] });
});
