import { describe, expect, it } from 'vitest';
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
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}

const defaultSets = { set1, set2, set3, set4, set5, set6, set7, set8, set9 };
const allQuestions = defaultQuestions;

describe('syncLocalStorage', () => {
  it('initializes empty storage with all default data', () => {
    const storage = createMockStorage();
    syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');
    const savedSets = JSON.parse(storage.getItem('s'));
    const savedQuestions = JSON.parse(storage.getItem('q'));
    expect(savedSets).toHaveLength(9);
    expect(savedQuestions).toHaveLength(allQuestions.length);
  });

  it('adds new sets and questions without duplication', () => {
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
    expect(ids).toStrictEqual([
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
    expect(savedQuestions).toHaveLength(allQuestions.length);
  });

  it('keeps default set membership stable across repeated syncs', () => {
    const storage = createMockStorage();
    syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');
    const firstQuestions = JSON.parse(storage.getItem('q'));
    const firstSets = JSON.parse(storage.getItem('s'));

    syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

    const secondQuestions = JSON.parse(storage.getItem('q'));
    const secondSets = JSON.parse(storage.getItem('s'));

    expect(secondQuestions).toHaveLength(firstQuestions.length);
    firstSets.forEach((set) => {
      const next = secondSets.find((entry) => entry.id === set.id);
      expect(next).toBeDefined();
      const expected = [...(set.questionIds || [])].sort();
      const actual = [...(next.questionIds || [])].sort();
      expect(actual).toStrictEqual(expected);
    });
  });

  it('treats redundant answers array as the same question', () => {
    const storage = createMockStorage();
    syncLocalStorage(defaultSets, allQuestions, storage, 'q', 's');

    const baselineQuestions = JSON.parse(storage.getItem('q'));
    const baselineSets = JSON.parse(storage.getItem('s'));
    const baselineCounts = Object.fromEntries(
      baselineSets.map((set) => [set.id, (set.questionIds || []).length]),
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

    expect(nextQuestions).toHaveLength(baselineQuestions.length);
    nextSets.forEach((set) => {
      if (baselineCounts[set.id] !== undefined) {
        expect((set.questionIds || []).length).toBe(baselineCounts[set.id]);
      }
    });
  });
});
