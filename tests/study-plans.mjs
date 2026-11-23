import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshDay, storageKey, matches, cardOrder, summary } from '../docs/assets/javascripts/study-plans/progress.mjs';

const data = new URL('../docs/assets/data/study-plans/220-1202/', import.meta.url);
const load = async file => JSON.parse(await readFile(new URL(file, data), 'utf8'));
const plan = await load('plan.json');
const ids = [11, 11, 4, 10].flatMap((length, d) => Array.from({ length }, (_, i) => (d + 1) + '.' + (i + 1)));
assert.deepEqual(Object.keys(plan.objectives).sort(), ids.sort());
assert.deepEqual(plan.domains.map(d => d.weight), [28, 28, 23, 21]);
assert.deepEqual(plan.days.map(d => d.number), Array.from({ length: 14 }, (_, i) => i + 1));
assert.deepEqual(new Set(plan.days.slice(0, 12).flatMap(d => d.objectives)), new Set(ids));
assert.deepEqual(plan.days.filter(d => d.session).map(d => d.number), [1, 2, 3, 4, 5, 6]);
assert.notEqual(storageKey(plan, 1), storageKey({ ...plan, exam: '220-1102' }, 1));
assert.deepEqual(plan.days.slice(3, 6).map(d => [d.minutes, d.objectives]), [
  [120, ['1.5', '1.7', '4.9']],
  [105, ['1.8', '1.9']],
  [100, ['1.10', '1.11', '4.2', '4.8']]
]);
for (const day of plan.days) {
  assert.ok(day.minutes >= 75 && day.minutes <= 120);
  assert.ok(day.goal && day.recall && day.resources.every(key => plan.resources[key]));
  assert.ok(day.objectives.every(id => ids.includes(id)));
  if (!day.session) continue;
  const session = await load(day.session);
  assert.equal(Object.values(session.minutes).reduce((a, b) => a + b), day.minutes);
  assert.equal(session.cards.length, 12);
  assert.equal(session.quiz.length, 8);
  assert.equal(session.worksheet.length, 8);
  for (const items of [session.cards, session.quiz, session.worksheet]) {
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
    assert.deepEqual(new Set(items.map(item => item.objective)), new Set(day.objectives));
  }
  assert.deepEqual(new Set(session.review.map(item => item.objective)), new Set(day.objectives));
  for (const card of session.cards) assert.ok(card.prompt.trim() && card.answer.trim());
  for (const task of session.worksheet) {
    assert.ok(task.prompt.trim() && task.key.trim() && task.source.trim());
    assert.ok(['Factual', 'Example'].includes(task.type));
  }
  const state = freshDay();
  assert.equal(summary(session, state).status, 'Not started');
  for (const q of session.quiz) {
    assert.ok(q.explanation && q.prompt.includes('____'));
    assert.ok(q.answers.length && q.answers.every(answer => answer.trim()));
    for (const answer of q.answers) {
      assert.ok(matches(q, '  ' + answer + ' '));
      const alternateCase = answer === answer.toUpperCase() ? answer.toLowerCase() : answer.toUpperCase();
      assert.equal(matches(q, alternateCase), !q.caseSensitive);
    }
    assert.ok(!matches(q, ''));
    assert.ok(!matches(q, 'unrelated answer'));
  }
  if (day.number === 5) {
    const library = session.quiz.find(q => q.id === 'library');
    assert.ok(matches(library, '~/Library'));
    assert.ok(!matches(library, '/Library'));
  }
  state.lastQuiz = Object.fromEntries(session.quiz.map(q => [q.id, q.answers[0]]));
  state.read = state.reviewed = true;
  state.cards = Object.fromEntries(session.cards.map(card => [card.id, 'known']));
  assert.equal(summary(session, state).status, 'Completed');
  const last = session.cards.at(-1);
  state.cards[last.id] = 'review';
  assert.equal(cardOrder(session.cards, state.cards)[0], last);
  assert.deepEqual(summary(session, state).flags, [last.objective]);
  state.cards[last.id] = 'known';
  state.lastQuiz[session.quiz[0].id] = 'incorrect';
  assert.equal(summary(session, state).score, 7);
  assert.equal(summary(session, state).status, 'Needs review');
  state.retry = true;
  assert.equal(summary(session, state).activities.quiz, false);
}
console.log('Passed study-plan schedule, objective mapping, item validation, grading, review priority and version isolation.');
