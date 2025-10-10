import { describe, expect, it } from 'vitest';
import {
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

const allSets = { set1, set2, set3, set4, set5, set6, set7, set8, set9 };

describe('default question sets', () => {
  it('have expected lengths', () => {
    expect(set1).toHaveLength(30);
    expect(set2).toHaveLength(28);
    expect(set3).toHaveLength(29);
    expect(set4).toHaveLength(26);
    expect(set5).toHaveLength(50);
    expect(set6).toHaveLength(23);
    expect(set7).toHaveLength(29);
    expect(set8).toHaveLength(23);
    expect(set9).toHaveLength(35);
  });

  it('ensure each question contains an explanation', () => {
    Object.values(allSets).forEach((set) => {
      set.forEach((q) => {
        expect(typeof q.explanation).toBe('string');
        expect(q.explanation.length).toBeGreaterThan(0);
      });
    });
  });
});
