const OMIT_KEYS = new Set(['id', 'set', 'setIds']);

function normalizeAnswers(q) {
  const arr = Array.isArray(q.answers)
    ? q.answers
    : Array.isArray(q.answer)
    ? q.answer
    : Number.isFinite(q.answer)
    ? [q.answer]
    : [];
  return Array.from(
    new Set(
      arr
        .map((n) => {
          const num = Number(n);
          return Number.isFinite(num) ? num : null;
        })
        .filter((n) => n !== null),
    ),
  ).sort((a, b) => a - b);
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const obj = {};
    for (const [key, val] of entries) {
      obj[key] = canonicalize(val);
    }
    return obj;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value) : value;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;
  return value;
}

function buildQuestionIdentity(q) {
  const base = {};
  for (const [key, value] of Object.entries(q)) {
    if (OMIT_KEYS.has(key) || key === 'answer' || key === 'answers') continue;
    if (value === undefined) continue;
    base[key] = value;
  }
  const answers = normalizeAnswers(q);
  if (answers.length) base.answers = answers;
  return canonicalize(base);
}

function questionKey(q) {
  return JSON.stringify(buildQuestionIdentity(q));
}

export function syncLocalStorage(defaultSets, allQuestions, storage, questionsKey = 'questions', setsKey = 'sets') {
  let existingQuestions = [];
  try {
    existingQuestions = JSON.parse(storage.getItem(questionsKey) || '[]');
  } catch {
    existingQuestions = [];
  }

  const qMap = new Map();

  for (const q of existingQuestions) {
    const key = questionKey(q);
    if (!qMap.has(key)) qMap.set(key, q);
  }

  for (const q of allQuestions) {
    const key = questionKey(q);
    if (!qMap.has(key)) {
      qMap.set(key, q);
    }
  }

  const mergedQuestions = [...qMap.values()];
  const validIds = new Set(mergedQuestions.map((q) => q.id));

  try {
    storage.setItem(questionsKey, JSON.stringify(mergedQuestions));
  } catch {
    /* ignore write errors */
  }

  let existingSets = [];
  try {
    existingSets = JSON.parse(storage.getItem(setsKey) || '[]');
  } catch {
    existingSets = [];
  }

  const sMap = new Map(
    existingSets.map((s) => [
      s.id,
      {
        ...s,
        questionIds: Array.isArray(s.questionIds) ? [...s.questionIds] : [],
      },
    ]),
  );

  const identityToId = new Map();
  for (const q of mergedQuestions) {
    identityToId.set(questionKey(q), q.id);
  }

  for (const [name, arr] of Object.entries(defaultSets)) {
    const canonicalIds = arr
      .map((q) => identityToId.get(questionKey(q)))
      .filter((id) => id !== undefined);

    if (!sMap.has(name)) {
      sMap.set(name, {
        id: name,
        name,
        questionIds: canonicalIds,
      });
    } else {
      const existing = sMap.get(name);
      const baseIds = Array.isArray(existing.questionIds)
        ? existing.questionIds.filter((id) => validIds.has(id))
        : [];
      const nextIds = [...baseIds];
      for (const id of canonicalIds) {
        if (!nextIds.includes(id)) nextIds.push(id);
      }
      existing.questionIds = nextIds;
      if (!existing.name) existing.name = name;
    }
  }

  const sanitizedSets = [...sMap.values()].map((set) => ({
    ...set,
    questionIds: (set.questionIds || []).filter((id) => validIds.has(id)),
  }));

  try {
    storage.setItem(setsKey, JSON.stringify(sanitizedSets));
  } catch {
    /* ignore write errors */
  }
}
