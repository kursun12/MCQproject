import { describe, expect, it } from 'vitest';
import { getAnswerLetters, getAnswerTexts, getQuestionAnswers } from '../src/utils/question.js';

describe('question utils', () => {
  it('normalizes correct answers across supported shapes', () => {
    expect(getQuestionAnswers({ answers: [2, 1, 1] })).toEqual([1, 2]);
    expect(getQuestionAnswers({ answer: [3, 0] })).toEqual([0, 3]);
    expect(getQuestionAnswers({ answer: 2 })).toEqual([2]);
    expect(getQuestionAnswers({ correct: [1, 0] })).toEqual([0, 1]);
    expect(getQuestionAnswers({ correct: 4 })).toEqual([4]);
  });

  it('maps answer indexes to visible labels and text', () => {
    const question = {
      options: ['Alpha', 'Beta', 'Gamma'],
    };

    expect(getAnswerTexts(question, [0, 2])).toEqual(['Alpha', 'Gamma']);
    expect(getAnswerLetters([0, 2])).toEqual(['A', 'C']);
  });
});
