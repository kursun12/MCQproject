import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_REPEAT_SETTINGS,
  loadRepeatSettings,
  normalizeRepeatSettings,
  saveRepeatSettings,
} from '../src/repeat/settings.js';

function createStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('repeat settings', () => {
  beforeEach(() => {
    globalThis.localStorage = createStorage();
  });

  it('normalizes legacy target and streak values to the consecutive contract', () => {
    const normalized = normalizeRepeatSettings({
      masteryType: 'streak',
      target: 4,
    });

    expect(normalized.masteryType).toBe('consecutive');
    expect(normalized.masteryTarget).toBe(4);
  });

  it('loads and saves the current settings shape', () => {
    saveRepeatSettings({ masteryTarget: 3, masteryType: 'ratio' });
    expect(loadRepeatSettings()).toMatchObject({
      ...DEFAULT_REPEAT_SETTINGS,
      masteryTarget: 3,
      masteryType: 'ratio',
    });
  });
});
