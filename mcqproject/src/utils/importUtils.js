import { generateId } from './id.js';

function uniqueSortedAnswers(rawAnswers = [], optionLength = 0) {
  const answers = Array.isArray(rawAnswers)
    ? rawAnswers
    : Array.isArray(rawAnswers?.answers)
    ? rawAnswers.answers
    : Array.isArray(rawAnswers?.answer)
    ? rawAnswers.answer
    : Number.isFinite(rawAnswers?.answer)
    ? [rawAnswers.answer]
    : Array.isArray(rawAnswers?.correct)
    ? rawAnswers.correct
    : Number.isFinite(rawAnswers?.correct)
    ? [rawAnswers.correct]
    : [];
  return Array.from(new Set(answers))
    .filter((value) => Number.isInteger(value) && value >= 0 && value < optionLength)
    .sort((a, b) => a - b);
}

export function normalizeQuestion(rawQuestion, idFactory = generateId) {
  const {
    id,
    question = '',
    options: rawOptions,
    explanation = '',
    image = '',
    answers: rawAnswers,
    answer: rawAnswer,
    correct: rawCorrect,
    ...rest
  } = rawQuestion || {};
  delete rest.setIds;
  const options = Array.isArray(rawOptions) ? [...rawOptions] : [];
  const answers = uniqueSortedAnswers(
    { answers: rawAnswers, answer: rawAnswer, correct: rawCorrect },
    options.length,
  );

  return {
    ...rest,
    id: id ?? idFactory(),
    question,
    options,
    answers,
    answer: answers.length > 0 ? answers[0] : 0,
    explanation,
    image,
  };
}

export function ensureUniqueIds(existingQuestions, candidateQuestions, idFactory = generateId) {
  const seen = new Set((existingQuestions || []).map((q) => String(q?.id)));
  return candidateQuestions.map((item) => {
    let id = item.id;
    while (!id || seen.has(String(id))) {
      id = idFactory();
    }
    seen.add(String(id));
    return { ...item, id };
  });
}

export function prepareImport(rawQuestions, existingQuestions = [], idFactory = generateId) {
  const normalized = rawQuestions.map((raw) => normalizeQuestion({ ...raw, id: idFactory() }, idFactory));
  return ensureUniqueIds(existingQuestions, normalized, idFactory);
}

export function moveItem(array, fromIndex, toIndex) {
  const next = [...array];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function remapAnswers(answers, fromIndex, toIndex) {
  return [...answers]
    .map((optionIndex) => {
      if (optionIndex === fromIndex) return toIndex;
      if (fromIndex < toIndex && optionIndex > fromIndex && optionIndex <= toIndex) return optionIndex - 1;
      if (toIndex < fromIndex && optionIndex >= toIndex && optionIndex < fromIndex) return optionIndex + 1;
      return optionIndex;
    })
    .sort((a, b) => a - b);
}
