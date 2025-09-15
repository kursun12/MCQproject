import { test } from 'node:test';
import assert from 'node:assert';
import defaultQuestions, {
  set1,
  set2,
  set3,
  set4,
  set5,
  set6,
  set7,
  set8,
  set9,
} from '../src/questions.js';
import { syncLocalStorage } from '../src/utils/storage.js';

function createMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  };
}

const defaultSets = { set1, set2, set3, set4, set5, set6, set7, set8, set9 };
const allQuestions = defaultQuestions;

test('initializes empty storage with all default data', () => {
  const storage = createMockStorage();
  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');
  const savedSets = JSON.parse(storage.getItem('s'));
  const savedQuestions = JSON.parse(storage.getItem('q'));
  assert.strictEqual(savedSets.length, 9);
  assert.strictEqual(savedQuestions.length, allQuestions.length);
});

test('adds new sets and questions without duplication', () => {
  const storage = createMockStorage();
  const initialQuestions = [...set1, ...set2, ...set3, ...set4, ...set5];
  const initialSets = Object.entries({ set1, set2, set3, set4, set5 }).map(
    ([id, arr]) => ({
      id,
      name: id,
      questionIds: arr.map((q) => q.id),
    }),
  );
  storage.setItem('q', JSON.stringify(initialQuestions));
  storage.setItem('s', JSON.stringify(initialSets));

  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

  const savedSets = JSON.parse(storage.getItem('s'));
  const ids = savedSets.map((s) => s.id);
  assert.deepStrictEqual(ids, [
    'set1',
    'set2',
    'set3',
    'set4',
    'set5',
    'set6',
    'set7',
    'set8',
    'set9',
  ]);
  const savedQuestions = JSON.parse(storage.getItem('q'));
  assert.strictEqual(savedQuestions.length, allQuestions.length);
});
