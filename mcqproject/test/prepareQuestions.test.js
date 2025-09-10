import { test } from 'node:test';
import assert from 'node:assert';
import prepareQuestions from '../src/utils/prepareQuestions.js';

const sample = [
  { id: 1, question: 'Q1', options: ['a', 'b'], answer: 0 },
  { id: 2, question: 'Q2', options: ['c', 'd'], answer: 1 },
  { id: 3, question: 'Q3', options: ['e', 'f'], answer: 0 },
];

test('slices to requested count', () => {
  const res = prepareQuestions(sample, 2, false, false, () => 0.5);
  assert.strictEqual(res.length, 2);
  assert.deepStrictEqual(res[0], sample[0]);
});

test('shuffles questions deterministically', () => {
  const rand = (() => { let i = 0; const vals = [0.9, 0.1, 0.5]; return () => vals[i++]; })();
  const res = prepareQuestions(sample, 3, true, false, rand);
  assert.notDeepStrictEqual(res.map((q) => q.id), sample.map((q) => q.id));
});

test('shuffles options and updates answer index', () => {
  const rand = () => 0.2; // forces swap of first two options
  const res = prepareQuestions(sample.slice(0,1), 1, false, true, rand);
  assert.deepStrictEqual(res[0].options, ['b', 'a']);
  assert.strictEqual(res[0].answer, 1);
});
