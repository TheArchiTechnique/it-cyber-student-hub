// Item IDs stay stable when an author reorders a session.
export function freshDay() {
  return { read: false, cards: {}, drafts: {}, lastQuiz: null, retry: false, responses: {}, reviewed: false, flags: {} };
}

export function storageKey(plan, day) {
  return ['student-hub', 'study-plan', plan.certification, plan.exam, plan.series, 'day', day].join(':');
}

export function matches(question, value) {
  if (question.caseSensitive) return question.answers.includes(value.trim());
  if (question.answerFormat === 'command') {
    const command = value.trim().toLowerCase().replace(/\s+/g, ' ');
    return question.answers.some(answer => answer.toLowerCase() === command);
  }
  const normalize = text => text.trim().normalize('NFKC').toLowerCase().replace(/[\s‐‑–-]+/g, ' ');
  return question.answers.some(answer => normalize(answer) === normalize(value));
}

export function cardOrder(cards, marks) {
  const priority = card => ({ review: 0, known: 2 }[marks[card.id]] ?? 1);
  return [...cards].sort((a, b) => priority(a) - priority(b));
}

export function summary(session, state) {
  if (session.type) {
    const last = state.records?.at(-1);
    return {
      complete: Boolean(last),
      status: last ? 'Completed' : state.capstoneDraft ? 'In progress' : 'Not started',
      flags: last?.objectives || []
    };
  }
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
  return { activities, count, complete: count === 4, status, flags: [...flags], score: correct.length };
}

// Each objective keeps the evidence used to recommend it. Domain weight breaks ties.
export function reviewTargets(plan, sessions, read, rehearsal, balanced) {
  const evidence = new Map();
  function add(id, reason) {
    if (!plan.objectives[id]) return;
    if (!evidence.has(id)) evidence.set(id, new Set());
    evidence.get(id).add(reason);
  }
  for (const id of rehearsal?.objectives || []) add(id, 'Exam review');
  for (const [number, session] of sessions) {
    const state = read(number);
    if (session.type) {
      if (session.type === 'readiness') {
        for (const id of state.records?.at(-1)?.objectives || []) add(id, 'Readiness review');
      }
      continue;
    }
    for (const [id, marked] of Object.entries(state.flags)) if (marked) add(id, 'Manual flag');
    for (const card of session.cards) if (state.cards[card.id] === 'review') add(card.objective, 'Flashcard');
    for (const q of session.quiz) {
      if (state.lastQuiz && !matches(q, state.lastQuiz[q.id] || '')) add(q.objective, 'Quiz miss');
    }
  }
  const weight = id => plan.domains.find(d => d.id === plan.objectives[id].domain).weight;
  const targets = [...evidence].map(([id, reasons]) => ({ id, reasons: [...reasons] }));
  targets.sort((a, b) => b.reasons.length - a.reasons.length ||
    Number(b.reasons.includes('Exam review')) - Number(a.reasons.includes('Exam review')) ||
    weight(b.id) - weight(a.id) || a.id.localeCompare(b.id, 'en', { numeric: true }));
  for (const domain of rehearsal?.domains || []) {
    if (targets.some(t => plan.objectives[t.id].domain === domain)) continue;
    const id = balanced.find(id => plan.objectives[id].domain === domain);
    if (id) targets.push({ id, reasons: ['Sample from selected exam domain'] });
  }
  return targets.length ? targets : balanced.map(id => ({ id, reasons: ['Balanced review'] }));
}

export function readinessOutcome(checks, record, rehearsal) {
  const technical = Object.keys(checks['Technical readiness']);
  const gaps = technical.filter(id => record[id] === 'Needs work');
  if (gaps.length >= 2 || record.gaps === 'Needs work') return 'Significant objective gaps remain';
  // A stored rehearsal percentage is an integer from the exam results or the manual score field.
  const percentage = Number(String(rehearsal?.percentage ?? '').trim());
  const meetsPracticeFloor = Number.isInteger(percentage) && percentage >= 50 && percentage <= 100;
  if (!meetsPracticeFloor || record.objectives?.length || record.independence !== 'Independently' ||
      Object.values(checks).some(group => Object.keys(group).some(id => record[id] !== 'Demonstrated'))) {
    return 'Additional targeted review recommended';
  }
  return 'Ready to schedule or attempt the exam';
}
