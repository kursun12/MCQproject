function toFiniteInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
}

export function getQuestionAnswers(question) {
  const rawAnswers = Array.isArray(question?.answers)
    ? question.answers
    : Array.isArray(question?.answer)
    ? question.answer
    : Number.isFinite(question?.answer)
    ? [question.answer]
    : Array.isArray(question?.correct)
    ? question.correct
    : Number.isFinite(question?.correct)
    ? [question.correct]
    : [];

  return Array.from(
    new Set(
      rawAnswers
        .map(toFiniteInteger)
        .filter((value) => value !== null),
    ),
  ).sort((a, b) => a - b);
}

export function getAnswerTexts(question, indexes = []) {
  const options = Array.isArray(question?.options) ? question.options : [];
  return indexes
    .map((index) => options[index])
    .filter((value) => typeof value === 'string' && value.length > 0);
}

export function getAnswerLetters(indexes = []) {
  return indexes
    .map((index) => toFiniteInteger(index))
    .filter((value) => value !== null && value >= 0)
    .map((value) => String.fromCharCode(65 + value));
}
