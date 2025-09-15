export function syncLocalStorage(defaultSets, allQuestions, storage, questionsKey = 'questions', setsKey = 'sets') {
  let existingQuestions = [];
  try {
    existingQuestions = JSON.parse(storage.getItem(questionsKey) || '[]');
  } catch {
    existingQuestions = [];
  }
  const qSet = new Set(existingQuestions.map((q) => JSON.stringify(q)));
  for (const q of allQuestions) {
    const str = JSON.stringify(q);
    if (!qSet.has(str)) {
      qSet.add(str);
      existingQuestions.push(q);
    }
  }
  try {
    storage.setItem(questionsKey, JSON.stringify(existingQuestions));
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
