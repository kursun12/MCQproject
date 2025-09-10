import { test } from 'node:test';
import assert from 'node:assert';
import exportCsv from '../src/utils/exportCsv.js';

const questions = [
  { question: 'Q1', options: ['a', 'b'], answer: 1 },
];
const answers = [1];

test('csv contains headers and score', () => {
  const csv = exportCsv(questions, answers, 1);
  assert.ok(csv.startsWith('Question,Your Answer,Correct Answer'));
  assert.ok(csv.includes('Score,1/1'));
});
