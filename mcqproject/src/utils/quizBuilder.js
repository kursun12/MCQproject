function safeParse(storage, key, fallback) {
  try {
    const value = storage?.getItem?.(key);
    if (value == null) return fallback;
    const parsed = JSON.parse(value);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function withDefaultIds(dataset = []) {
  return dataset.map((question, index) => ({
    ...question,
    id: question?.id ?? index + 1,
    options: Array.isArray(question?.options) ? [...question.options] : [],
  }));
}

export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleCopy(arr) {
  return shuffleArray([...arr]);
}

function buildFilterParams(searchParams) {
  return {
    setId: searchParams.get('setId'),
    hardMode: searchParams.get('hard') === 'true',
    tags: (searchParams.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    count: Number.parseInt(searchParams.get('count') || '', 10),
  };
}

export function buildQuestionPool({
  mode = 'practice',
  searchParams = new URLSearchParams(),
  storage = typeof window !== 'undefined' ? window.localStorage : null,
  dataset = [],
}) {
  const baseDataset = Array.isArray(dataset) && dataset.length > 0 ? withDefaultIds(dataset) : [];
  const storedQuestions = safeParse(storage, 'questions', []);
  let questions = Array.isArray(storedQuestions) && storedQuestions.length
    ? withDefaultIds(storedQuestions)
    : [...baseDataset];

  const retryIds = safeParse(storage, 'retryIds', null);
  if (Array.isArray(retryIds) && retryIds.length) {
    const retrySet = new Set(retryIds);
    questions = questions.filter((q) => retrySet.has(q.id));
    storage?.removeItem?.('retryIds');
  }

  const { setId, hardMode, tags, count } = buildFilterParams(searchParams);

  if (setId === 'bookmarks') {
    const bookmarks = safeParse(storage, 'bookmarks', []);
    const bookmarkIds = new Set((Array.isArray(bookmarks) ? bookmarks : []).map((id) => Number(id)));
    questions = questions.filter((q) => bookmarkIds.has(Number(q.id)));
  } else if (setId && setId !== 'all') {
    const sets = safeParse(storage, 'sets', []);
    const match = (Array.isArray(sets) ? sets : []).find((s) => String(s.id) === String(setId));
    if (match) {
      const allowed = new Set(match.questionIds || []);
      questions = questions.filter((q) => allowed.has(q.id));
    }
  }

  if (tags.length > 0) {
    questions = questions.filter((q) => Array.isArray(q.tags) && q.tags.some((tag) => tags.includes(tag)));
  }

  if (hardMode) {
    const stats = safeParse(storage, 'stats', {});
    questions = questions.filter((q) => {
      const record = stats?.[q.id];
      if (!record) return false;
      const attempts = Number(record.attempts || 0);
      const fails = Number(record.fails || 0);
      if (fails < 3) return false;
      return fails / Math.max(1, attempts) >= 0.6;
    });
  }

  const shuffleQs = storage?.getItem?.('shuffleQs') === 'true';
  if (shuffleQs) {
    questions = shuffleCopy(questions);
  }

  const limit = Number.isFinite(count) && count > 0 ? count : null;
  if (limit && mode !== 'repeat') {
    questions = questions.slice(0, limit);
  }

  const shuffleOpts = storage?.getItem?.('shuffleOpts') === 'true';
  const mapped = questions.map((q) => {
    const optionIndexes = [...Array(q.options.length).keys()];
    return {
      ...q,
      _order: shuffleOpts ? shuffleCopy(optionIndexes) : optionIndexes,
    };
  });

  if (mapped.length > 0) {
    return mapped;
  }

  return baseDataset.map((q) => ({
    ...q,
    _order: [...Array(q.options.length).keys()],
  }));
}
