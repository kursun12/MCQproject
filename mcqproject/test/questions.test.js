import { test } from 'node:test';
import assert from 'node:assert';
import { set1, set2, set3, set4, set5 } from '../src/questions.js';

const allSets = { set1, set2, set3, set4, set5 };

test('default sets have expected lengths', () => {
  assert.strictEqual(set1.length, 30);
  assert.strictEqual(set2.length, 28);
  assert.strictEqual(set3.length, 29);
  assert.strictEqual(set4.length, 26);
  assert.strictEqual(set5.length, 50);
});

test('each question includes an explanation', () => {
  for (const set of Object.values(allSets)) {
    for (const q of set) {
      assert.strictEqual(typeof q.explanation, 'string');
      assert.notStrictEqual(q.explanation.length, 0);
    }
  }
});
