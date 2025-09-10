import { test } from 'node:test';
import assert from 'node:assert';
import questions from '../src/questions.js';

test('questions array has expected length', () => {
  assert.ok(Array.isArray(questions));
  assert.strictEqual(questions.length, 3);
});

test('each question includes an explanation', () => {
  for (const q of questions) {
    assert.strictEqual(typeof q.explanation, 'string');
    assert.notStrictEqual(q.explanation.length, 0);
  }
});
