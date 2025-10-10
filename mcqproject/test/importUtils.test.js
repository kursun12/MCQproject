import { describe, expect, it } from 'vitest';
import { normalizeQuestion, ensureUniqueIds, prepareImport, moveItem, remapAnswers } from '../src/utils/importUtils.js';

const sampleQuestion = {
  id: 1,
  question: 'Q?',
  options: ['A', 'B', 'C'],
  answers: [2, 1, 1, 2],
  explanation: 'Because',
  image: 'img.png',
};

describe('importUtils', () => {
  it('normalises question shape and filters invalid answers', () => {
    const normalized = normalizeQuestion({ ...sampleQuestion, answers: [0, 5, '2'] }, () => 'g1');
    expect(normalized).toMatchObject({
      id: 1,
      question: 'Q?',
      options: ['A', 'B', 'C'],
      answers: [0],
      answer: 0,
      explanation: 'Because',
      image: 'img.png',
    });
  });

  it('ensures unique ids when collisions occur', () => {
    let tick = 0;
    const generator = () => `g${++tick}`;
    const next = ensureUniqueIds([{ id: 1 }, { id: 2 }], [
      { id: 2, question: 'Existing' },
      { id: null, question: 'New' },
    ], generator);
    const ids = next.map((q) => q.id);
    expect(ids).toEqual(['g1', 'g2']);
  });

  it('prepares imported questions with fresh ids', () => {
    let tick = 10;
    const generator = () => `n${++tick}`;
    const prepared = prepareImport([{ question: 'New', options: ['1'] }], [{ id: 'a' }], generator);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].id).toBe('n11');
    expect(prepared[0].options).toEqual(['1']);
  });

  it('moves array items immutably', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
  });

  it('remaps answer indices when options move', () => {
    const remappedForward = remapAnswers([0, 2], 0, 2);
    expect(remappedForward).toEqual([1, 2]);
    const remappedBackward = remapAnswers([1, 2], 2, 0);
    expect(remappedBackward).toEqual([0, 2]);
  });
});
