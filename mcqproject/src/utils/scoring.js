export function gradeStrict(selected, correct) {
  const a = [...(selected || [])].sort((x, y) => x - y);
  const b = [...(correct || [])].sort((x, y) => x - y);
  if (a.length !== b.length) return 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return 0;
  return 1;
}

// Partial credit: (# correct chosen / total correct) – (# wrong chosen / total correct), clamped [0,1]
export function gradePartial(selected, correct) {
  const sel = new Set(selected || []);
  const cor = new Set(correct || []);
  const total = cor.size || 1;
  let good = 0;
  let bad = 0;
  sel.forEach((i) => {
    if (cor.has(i)) good += 1;
    else bad += 1;
  });
  const score = Math.max(0, Math.min(1, good / total - bad / total));
  return score;
}

export function toPoints(score, maxPoints = 1000) {
  return Math.round(score * maxPoints);
}

