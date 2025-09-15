export function syncLocalStorage(defaultSets, allQuestions, storage, questionsKey = 'questions', setsKey = 'sets') {
  let existingQuestions = [];
  try {
    existingQuestions = JSON.parse(storage.getItem(questionsKey) || '[]');
  } catch {
    existingQuestions = [];
  }
  const qMap = new Map();
  // Seed map with any previously stored questions, deduping by content and
  // ignoring ids which may collide across bundled sets.
  for (const q of existingQuestions) {
    const { id: _id, set: _set, ...rest } = q;
    const key = JSON.stringify(rest);
    if (!qMap.has(key)) qMap.set(key, q);
  }
  // Merge in bundled questions using the same content-based key.
  for (const q of allQuestions) {
    const { id: _id, set: _set, ...rest } = q;
    const key = JSON.stringify(rest);
    if (!qMap.has(key)) qMap.set(key, q);
  }
  try {
    storage.setItem(questionsKey, JSON.stringify([...qMap.values()]));
  } catch {
    /* ignore write errors */
  }

  let existingSets = [];
  try {
    existingSets = JSON.parse(storage.getItem(setsKey) || '[]');
  } catch {
    existingSets = [];
  }
  const sMap = new Map(existingSets.map((s) => [s.id, s]));
  for (const [name, arr] of Object.entries(defaultSets)) {
    if (!sMap.has(name)) {
      sMap.set(name, {
        id: name,
        name,
        questionIds: arr.map((q) => q.id),
      });
    } else {
      const existing = sMap.get(name);
      const ids = new Set(existing.questionIds);
      for (const q of arr) {
        ids.add(q.id);
      }
      existing.questionIds = Array.from(ids);
    }
  }
  try {
    storage.setItem(setsKey, JSON.stringify([...sMap.values()]));
  } catch {
    /* ignore write errors */
  }
}
