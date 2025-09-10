export default function exportCsv(questions, answers, score) {
  const header = 'Question,Your Answer,Correct Answer\n';
  const rows = questions.map((q, i) => {
    const your = q.options[answers[i]] ?? '';
    const correct = q.options[q.answer];
    const esc = (str) => String(str).replace(/"/g, '""');
    return `"${esc(q.question)}","${esc(your)}","${esc(correct)}"`;
  });
  const footer = `Score,${score}/${questions.length}`;
  return `${header}${rows.join('\n')}\n${footer}\n`;
}
