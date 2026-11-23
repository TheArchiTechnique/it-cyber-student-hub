// Item IDs stay stable when an author reorders a session.
export function freshDay() {
  return { read: false, cards: {}, drafts: {}, lastQuiz: null, retry: false, responses: {}, reviewed: false, flags: {} };
}

export function storageKey(plan, day) {
  return ['student-hub', 'study-plan', plan.certification, plan.exam, plan.series, 'day', day].join(':');
}

export function matches(question, value) {
  const normalize = text => text.trim().normalize('NFKC').toLowerCase().replace(/[\s‐‑–-]+/g, ' ');
  return question.answers.some(answer => normalize(answer) === normalize(value));
}

export function cardOrder(cards, marks) {
  const priority = card => ({ review: 0, known: 2 }[marks[card.id]] ?? 1);
  return [...cards].sort((a, b) => priority(a) - priority(b));
}

export function summary(session, state) {
  const flags = new Set(Object.keys(state.flags).filter(id => state.flags[id]));
  const marked = session.cards.filter(card => state.cards[card.id]);
  for (const card of marked) if (state.cards[card.id] === 'review') flags.add(card.objective);
  const correct = session.quiz.filter(q => state.lastQuiz && matches(q, state.lastQuiz[q.id] || ''));
  if (state.lastQuiz) {
    for (const q of session.quiz) if (!correct.includes(q)) flags.add(q.objective);
  }
  const activities = {
    review: state.read,
    cards: marked.length === session.cards.length,
    quiz: Boolean(state.lastQuiz) && !state.retry,
    worksheet: state.reviewed
  };
  const count = Object.values(activities).filter(Boolean).length;
  const started = count || marked.length || Object.values(state.drafts).some(Boolean) || Object.values(state.responses).some(Boolean);
  let status = started ? 'In progress' : 'Not started';
  if (count === 4) status = 'Completed';
  if (flags.size) status = 'Needs review';
  return { activities, count, status, flags: [...flags], score: correct.length };
}
