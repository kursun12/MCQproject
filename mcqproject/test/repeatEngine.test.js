import { beforeEach, describe, expect, it } from 'vitest';
import { RepeatEngine } from '../src/repeat/engine.js';
import { DEFAULT_REPEAT_SETTINGS, saveRepeatSettings } from '../src/repeat/settings.js';

const mockStorage = () => {
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
};

describe('RepeatEngine', () => {
  beforeEach(() => {
    globalThis.localStorage = mockStorage();
    saveRepeatSettings(DEFAULT_REPEAT_SETTINGS);
  });

  it('continues when all items are cooling down', () => {
    const questions = [{ id: 1 }, { id: 2 }];
    const eng = new RepeatEngine(questions);
    const first = eng.next();
    expect(first).toBeTruthy();
    eng.onShow(first);
    eng.onGrade(first, false);
    const second = eng.next();
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    eng.onShow(second);
    eng.onGrade(second, false);
    const third = eng.next();
    expect(third).toBeTruthy();
  });
});
