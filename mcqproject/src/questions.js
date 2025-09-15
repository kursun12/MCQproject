import rawSet1 from './assets/_MConverter.eu_1-30.json' assert { type: 'json' };
import rawSet2 from './assets/_MConverter.eu_31-60.json' assert { type: 'json' };
import rawSet3 from './assets/_MConverter.eu_61-90.json' assert { type: 'json' };
import rawSet4 from './assets/_MConverter.eu_91-120.json' assert { type: 'json' };
import rawSet5 from './assets/_MConverter.eu_youtube50.json' assert { type: 'json' };
import rawSet6 from './assets/_MConverter.eu_121-150.json' assert { type: 'json' };
import rawSet7 from './assets/_MConverter.eu_151-180.json' assert { type: 'json' };
import rawSet8 from './assets/_MConverter.eu_181-210.json' assert { type: 'json' };
import rawSet9 from './assets/_MConverter.eu_211-254.json' assert { type: 'json' };
import { generateId } from './utils/id.js';

// Prepare bundled sets while ensuring each question is unique across
// the entire collection. The original JSON files contain an `id`
// field, but those identifiers collide between sets which causes the
// app to over-count questions. We ignore those ids and generate our own
// unique ids at load time, deduping by question content.

const rawBundledSets = [
  { name: 'Set 1', data: rawSet1 },
  { name: 'Set 2', data: rawSet2 },
  { name: 'Set 3', data: rawSet3 },
  { name: 'Set 4', data: rawSet4 },
  { name: 'YouTube 50', data: rawSet5 },
  { name: 'Set 6', data: rawSet6 },
  { name: 'Set 7', data: rawSet7 },
  { name: 'Set 8', data: rawSet8 },
  { name: 'Set 9', data: rawSet9 },
];

// Map used to keep track of unique questions keyed by their content
// (excluding any ids or set assignments).
const uniqueQuestions = new Map();

const bundledSets = rawBundledSets.map(({ name, data }) => {
  const processed = data.map((q) => {
    // Strip the incoming id and derive a stable key based on question content.
    // We also drop any set information when computing the key so that the same
    // question appearing in multiple sets maps to a single entry.
    const { id, set, ...rest } = q;
    const key = JSON.stringify(rest);
    let existing = uniqueQuestions.get(key);
    if (!existing) {
      // First time we've seen this question: assign a new unique id and retain
      // the set name as the source for display purposes.
      existing = { ...rest, id: generateId(), set: name };
      uniqueQuestions.set(key, existing);
    }
    return existing;
  });
  return { name, data: processed };
});

// Flatten the unique questions for backward compatibility with areas of the
// app that expect a single array of default questions.
const defaultQuestions = Array.from(uniqueQuestions.values());

// Export each processed set individually for tests and for the initial
// localStorage population routine.
const [
  { data: set1 },
  { data: set2 },
  { data: set3 },
  { data: set4 },
  { data: set5 },
  { data: set6 },
  { data: set7 },
  { data: set8 },
  { data: set9 },
] = bundledSets;

export default defaultQuestions;
export {
  set1,
  set2,
  set3,
  set4,
  set5,
  set6,
  set7,
  set8,
  set9,
  bundledSets,
};

