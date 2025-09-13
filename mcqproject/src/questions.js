import set1 from './assets/_MConverter.eu_1-30.json' with { type: 'json' };
import set2 from './assets/_MConverter.eu_31-60.json' with { type: 'json' };
import set3 from './assets/_MConverter.eu_61-90.json' with { type: 'json' };
import set4 from './assets/_MConverter.eu_91-120.json' with { type: 'json' };
import set5 from './assets/_MConverter.eu_youtube50.json' with { type: 'json' };

// Combine all bundled sets into a single array for backward compatibility.
const defaultQuestions = [...set1, ...set2, ...set3, ...set4, ...set5];

export default defaultQuestions;
export { set1, set2, set3, set4, set5 };

