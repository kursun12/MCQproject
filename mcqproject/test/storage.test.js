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

test('keeps default set membership stable across repeated syncs', () => {
  const storage = createMockStorage();
  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');
  const firstQuestions = JSON.parse(storage.getItem('q'));
  const firstSets = JSON.parse(storage.getItem('s'));

  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

  const secondQuestions = JSON.parse(storage.getItem('q'));
  const secondSets = JSON.parse(storage.getItem('s'));

  assert.strictEqual(secondQuestions.length, firstQuestions.length);
  firstSets.forEach((set) => {
    const next = secondSets.find((s) => s.id === set.id);
    assert.ok(next, `missing set ${set.id}`);
    const expected = [...(set.questionIds || [])].sort();
    const actual = [...(next.questionIds || [])].sort();
    assert.deepStrictEqual(actual, expected);
  });
});

test('treats redundant answers array as the same question', () => {
  const storage = createMockStorage();
  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

  const baselineQuestions = JSON.parse(storage.getItem('q'));
  const baselineSets = JSON.parse(storage.getItem('s'));
  const baselineCounts = Object.fromEntries(
    baselineSets.map((s) => [s.id, (s.questionIds || []).length]),
  );

  const modified = baselineQuestions.map((q) => ({
    ...q,
    answers: Array.isArray(q.answers)
      ? q.answers
      : Array.isArray(q.answer)
      ? q.answer
      : [q.answer],
  }));
  storage.setItem('q', JSON.stringify(modified));

  syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

  const nextQuestions = JSON.parse(storage.getItem('q'));
  const nextSets = JSON.parse(storage.getItem('s'));

  assert.strictEqual(nextQuestions.length, baselineQuestions.length);
  nextSets.forEach((set) => {
    const expected = baselineCounts[set.id];
    if (expected !== undefined) {
      assert.strictEqual((set.questionIds || []).length, expected);
    }
  });
});
