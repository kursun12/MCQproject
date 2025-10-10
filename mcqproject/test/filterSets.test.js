import { describe, expect, it } from 'vitest';

function filterQuestions(questions, sets, filterSet) {
  const map = new Map();
  sets.forEach((s) => {
    const sid = String(s.id);
    (s.questionIds || []).forEach((id) => {
      const qid = String(id);
      if (!map.has(qid)) map.set(qid, []);
      map.get(qid).push(sid);
    });
  });
  return questions.filter((q) => {
    const assignedTo = map.get(String(q.id)) || [];
    if (filterSet && !assignedTo.includes(String(filterSet))) return false;
    return true;
  });
}

describe('filterQuestions', () => {
  it('filters questions by set id regardless of id type', () => {
    const questions = [{ id: 1, question: 'Q1', options: [], answers: [] }];
    const sets = [{ id: 'abc', questionIds: [1] }];
    const res = filterQuestions(questions, sets, 'abc');
    expect(res).toHaveLength(1);
    const none = filterQuestions(questions, sets, 'xyz');
    expect(none).toHaveLength(0);
  });
});
