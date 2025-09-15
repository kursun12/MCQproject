import set1 from './assets/_MConverter.eu_1-30.json' with { type: 'json' };
import set2 from './assets/_MConverter.eu_31-60.json' with { type: 'json' };
import set3 from './assets/_MConverter.eu_61-90.json' with { type: 'json' };
import set4 from './assets/_MConverter.eu_91-120.json' with { type: 'json' };
import set5 from './assets/_MConverter.eu_youtube50.json' with { type: 'json' };
import set6 from './assets/_MConverter.eu_121-150.json' with { type: 'json' };
import set7 from './assets/_MConverter.eu_151-180.json' with { type: 'json' };
import set8 from './assets/_MConverter.eu_181-210.json' with { type: 'json' };
import set9 from './assets/_MConverter.eu_211-254.json' with { type: 'json' };

// Map each bundled set to include a `source` label so the UI
// can display where a question originated (e.g. "Set 1", "YouTube 50").
// This metadata powers filtering and progress indicators on the
// bookmarks/review pages.
const bundledSets = [
  { name: 'Set 1', data: set1 },
  { name: 'Set 2', data: set2 },
  { name: 'Set 3', data: set3 },
  { name: 'Set 4', data: set4 },
  { name: 'YouTube 50', data: set5 },
  { name: 'Set 6', data: set6 },
  { name: 'Set 7', data: set7 },
  { name: 'Set 8', data: set8 },
  { name: 'Set 9', data: set9 }
];

// Combine all bundled sets into a single array for backward compatibility.
const defaultQuestions = bundledSets.flatMap(({ name, data }) =>
  data.map((q) => ({ ...q, set: name }))
);

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
  bundledSets
};

