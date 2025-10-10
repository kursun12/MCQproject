import { describe, expect, it, vi } from 'vitest';
import { buildQuestionPool, shuffleArray } from '../src/utils/quizBuilder.js';

function createStorage(initial = {}) {
  const store = new Map();
  Object.entries(initial).forEach(([key, value]) => {
    store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

describe('buildQuestionPool', () => {
  const dataset = [
    { id: 1, question: 'Q1', options: ['A', 'B'] },
    { id: 2, question: 'Q2', options: ['A', 'B'] },
    { id: 3, question: 'Q3', options: ['A'], tags: ['tagged'] },
  ];

  it('returns stored questions when localStorage has custom data', () => {
    const storage = createStorage({ questions: [{ id: 9, question: 'Stored', options: ['A', 'B'] }] });
    const result = buildQuestionPool({ mode: 'practice', searchParams: new URLSearchParams(), storage, dataset });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(9);
  });

  it('filters by bookmarks', () => {
    const storage = createStorage({ bookmarks: [2] });
    const params = new URLSearchParams('setId=bookmarks');
    const result = buildQuestionPool({ mode: 'practice', searchParams: params, storage, dataset });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('filters by set membership', () => {
    const storage = createStorage({ sets: [{ id: 'custom', questionIds: [3] }] });
    const params = new URLSearchParams('setId=custom');
    const result = buildQuestionPool({ mode: 'practice', searchParams: params, storage, dataset });
    expect(result.map((q) => q.id)).toEqual([3]);
  });

  it('filters by tags and hard stats', () => {
    const storage = createStorage({
      stats: {
        3: { attempts: 5, fails: 4 },
      },
    });
    const params = new URLSearchParams('hard=true&tags=tagged');
    const result = buildQuestionPool({ mode: 'practice', searchParams: params, storage, dataset });
    expect(result.map((q) => q.id)).toEqual([3]);
  });

  it('respects count when not in repeat mode', () => {
    const storage = createStorage();
    const params = new URLSearchParams('count=1');
    const result = buildQuestionPool({ mode: 'practice', searchParams: params, storage, dataset });
    expect(result).toHaveLength(1);
  });

  it('shuffles options when shuffle flag is set', () => {
    const storage = createStorage({ shuffleOpts: 'true' });
    const params = new URLSearchParams();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const [question] = buildQuestionPool({ mode: 'practice', searchParams: params, storage, dataset });
    expect(question._order).not.toEqual([0, 1]);
    randomSpy.mockRestore();
  });
});

// Basic assurance the shuffle helper changes order in-place while returning the same reference
it('shuffleArray mutates in-place for deterministic seeds', () => {
  const randomSpy = vi.spyOn(Math, 'random').mockReturnValueOnce(0.3).mockReturnValueOnce(0.3);
  const arr = [1, 2, 3];
  const result = shuffleArray(arr);
  expect(result).toBe(arr);
  expect(arr).toEqual([2, 3, 1]);
  randomSpy.mockRestore();
});
