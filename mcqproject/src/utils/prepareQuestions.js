export function shuffleArray(arr, rand = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function prepareQuestions(questions, count, shuffleQs, shuffleOpts, rand = Math.random) {
  let result = [...questions];
  if (shuffleQs) {
    result = shuffleArray(result, rand);
  }
  if (shuffleOpts) {
    result = result.map((q) => {
      const opts = shuffleArray(q.options, rand);
      const answerText = q.options[q.answer];
      const newAnswer = opts.indexOf(answerText);
      return { ...q, options: opts, answer: newAnswer };
    });
  }
  if (Number.isFinite(count) && count > 0 && count < result.length) {
    result = result.slice(0, count);
  }
  return result;
}
