import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../docs/assets/javascripts/practice-tests/engine.mjs';
import { WHITEBOARD_TEXT_LIMIT, WHITEBOARD_MIN_SIZE, restoreWhiteboard, constrainWhiteboardBounds } from '../docs/assets/javascripts/practice-tests/whiteboard-state.mjs';
import { certifications } from '../docs/assets/javascripts/practice-tests/registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, 'docs/assets/data/practice-tests', file)));
const exam = read('a-plus-core-2.json'), bank = read('a-plus-core-2-questions.json');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'docs/assets/data/pbqs.json')));
const copy = value => JSON.parse(JSON.stringify(value));
const config = (patch = {}) => ({ certification: exam.id, mode: 'practice', domains: exam.domains.map(d => d.id), objectives: exam.objectives.map(o => o.id), count: 24, feedback: 'end', showAnswers: true, showExplanations: true, ...patch });
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const fresh = (patch, seed = 10) => E.createSession(exam, bank, config(patch), seeded(seed));

assert.deepEqual(E.validateBank(exam, bank), []);
assert.equal(bank.questions.length, 24);
assert.equal(exam.objectives.length, 36);
assert.equal(certifications.length, 5);
assert.equal(certifications.filter(c => c.bank && c.metadata).length, 1);
assert.equal(new Set(bank.questions.map(q => q.stem)).size, 24);
for (const domain of exam.domains) assert.equal(bank.questions.filter(q => q.domain === domain.id).length, 6);
assert.equal(bank.questions.filter(q => q.type === 'multiple').length, 2);
for (const q of bank.questions) {
  assert.ok(q.explanation.length >= 150, `${q.id}: meaningful overall explanation`);
  for (const c of q.choices) assert.ok(c.explanation.length >= 60, `${q.id}/${c.id}: meaningful individual explanation`);
  for (const resource of q.resources) {
    const target = path.resolve(root, 'docs', resource.path.split('#')[0]);
    assert.ok(target.startsWith(path.join(root, 'docs') + path.sep));
    assert.ok(fs.existsSync(target), `Missing Hub resource: ${resource.path}`);
    const publishedPBQ = catalog.activities?.some(activity => `${activity.activityPath}README.md` === resource.path && activity.status === 'published');
    assert.ok(publishedPBQ || /kind: resource/.test(fs.readFileSync(target, 'utf8')), `Unpublished resource: ${resource.path}`);
  }
}
// Corrupt or incomplete banks must fail instead of becoming student tests.
for (const mutate of [
  b => b.questions.push(copy(b.questions[0])), b => { b.questions[0].objectives = ['9.1']; },
  b => { b.questions[0].domain = '8.0'; }, b => { delete b.questions[0].correct; },
  b => { b.questions[0].correct = ['bogus']; }, b => { b.questions[0].choices[0].explanation = ''; },
  b => { b.questions[0].choices[0].id = b.questions[0].choices[1].id; },
  b => { b.questions[0].resources = [{ title: 'bad', path: '../../private.md' }]; },
  b => { b.questions[0].validation.sources = []; }, b => { b.questions[0].type = 'pbq'; },
  b => { b.questions[0] = null; }, b => { b.questions[0].choices[0] = null; },
  b => { b.questions[0].status = 'draft'; }, b => { b.questions[0].explanation = ''; }
]) { const invalid = copy(bank); mutate(invalid); assert.ok(E.validateBank(exam, invalid).length); }

for (const domain of exam.domains) {
  const selected = config({ domains: [domain.id], objectives: exam.objectives.filter(o => o.domain === domain.id).map(o => o.id), count: 6 });
  assert.equal(E.validateConfig(exam, bank, selected), null);
  assert.ok(E.createSession(exam, bank, selected).questionIds.every(id => bank.questions.find(q => q.id === id).domain === domain.id));
}
for (const objectives of [['1.5'], ['2.1', '2.2'], ['1.9', '4.10']]) {
  const c = config({ objectives, count: 1 });
  const expected = bank.questions.filter(q => q.objectives.some(id => objectives.includes(id)));
  assert.deepEqual(E.eligibleQuestions(exam, bank, c).map(q => q.id), expected.map(q => q.id));
}
for (const patch of [{ count: 25 }, { count: 0 }, { count: 1.5 }, { domains: [] }, { objectives: [] }, { objectives: ['9.9'] }, { domains: ['4.0'], objectives: ['1.1'] }, { mode: 'certification' }, { showAnswers: false }, { feedback: 'invalid' }, { certification: 'cysa-plus' }]) assert.ok(E.validateConfig(exam, bank, config(patch)));

const orders = new Set(), positions = new Map(bank.questions.map(q => [q.id, new Set()]));
for (let seed = 1; seed <= 200; seed++) {
  const state = fresh({}, seed), original = copy(state);
  assert.equal(new Set(state.questionIds).size, 24);
  orders.add(state.questionIds.join(','));
  for (const id of state.questionIds) {
    const q = bank.questions.find(q => q.id === id);
    assert.deepEqual([...state.choiceOrder[id]].sort(), q.choices.map(c => c.id).sort());
    if (q.type === 'single') positions.get(id).add(state.choiceOrder[id].indexOf(q.correct[0]));
    assert.equal(E.answer(state, bank, id, q.correct), true);
  }
  assert.equal(E.grade(state, exam, bank).percentage, 100);
  const restored = E.restoreSession(copy(original), exam, bank);
  assert.deepEqual(restored, original);
}
assert.equal(orders.size, 200);
for (const q of bank.questions.filter(q => q.type === 'single')) assert.equal(positions.get(q.id).size, 4);

const solved = fresh();
for (const q of bank.questions) E.answer(solved, bank, q.id, q.correct);
assert.deepEqual([E.grade(solved, exam, bank).correct, E.grade(solved, exam, bank).incorrect, E.grade(solved, exam, bank).unanswered], [24, 0, 0]);
for (const domain of E.grade(solved, exam, bank).domains) assert.equal(domain.correct, 6);
const blank = E.grade(fresh(), exam, bank);
assert.deepEqual([blank.correct, blank.incorrect, blank.unanswered, blank.percentage], [0, 0, 24, 0]);
const wrong = fresh();
for (const q of bank.questions) E.answer(wrong, bank, q.id, [q.choices.find(c => !q.correct.includes(c.id)).id]);
assert.deepEqual([E.grade(wrong, exam, bank).correct, E.grade(wrong, exam, bank).incorrect], [0, 24]);
for (const q of bank.questions.filter(q => q.type === 'multiple')) {
  for (const a of q.choices) for (const b of q.choices) if (a.id !== b.id) {
    const state = fresh(); E.answer(state, bank, q.id, [a.id, b.id]);
    assert.equal(E.grade(state, exam, bank).correct, q.correct.includes(a.id) && q.correct.includes(b.id) ? 1 : 0);
  }
  const partial = fresh(); E.answer(partial, bank, q.id, [q.correct[0]]);
  assert.equal(E.grade(partial, exam, bank).correct, 0);
  assert.equal(E.answer(partial, bank, q.id, q.choices.map(c => c.id)), false);
}

const immediate = fresh({ feedback: 'immediate' }), id = immediate.questionIds[0], q = bank.questions.find(q => q.id === id);
assert.equal(E.finalizeAnswer(immediate, id), false);
E.answer(immediate, bank, id, q.correct); E.finalizeAnswer(immediate, id);
assert.equal(E.answer(immediate, bank, id, []), false, 'Revealed answers are immutable');
E.toggleFlag(immediate, id); immediate.current = 2;
immediate.tools.whiteboard = { text: 'ipconfig /all\n  Host Name . . : LAB\n\tDNS', visible: true, minimized: true, bounds: { x: 15, y: 40, width: 350, height: 320 }, docked: false };
assert.deepEqual(E.restoreSession(copy(immediate), exam, bank), immediate);
const scoreBefore = E.grade(immediate, exam, bank);
immediate.tools.whiteboard.text += '\nnotes cannot award points';
assert.deepEqual(E.grade(immediate, exam, bank), scoreBefore);
const another = fresh(); assert.notEqual(another.id, immediate.id); assert.equal(another.tools.whiteboard.text, '');
another.tools.whiteboard.text = 'independent attempt';
assert.notEqual(immediate.tools.whiteboard.text, another.tools.whiteboard.text);
const oldSchema = copy(immediate); delete oldSchema.tools.whiteboard.docked;
assert.equal(E.restoreSession(oldSchema, exam, bank).tools.whiteboard.docked, false, 'Phase 1 sessions resume without a schema reset');
for (const value of [null, [], 'notes', { text: 123, visible: 'true', minimized: 1, docked: 'yes', bounds: { x: 0, y: 0, width: '400', height: 300 } }]) {
  assert.deepEqual(restoreWhiteboard(value), restoreWhiteboard(null));
}
assert.equal(restoreWhiteboard({ text: 'x'.repeat(WHITEBOARD_TEXT_LIMIT + 5) }).text.length, WHITEBOARD_TEXT_LIMIT);
assert.equal(restoreWhiteboard({ bounds: { x: NaN, y: 0, width: Infinity, height: 320 } }).bounds, null);
for (const area of [{ width: 900, height: 600 }, { width: 280, height: 300 }, { width: 240, height: 180 }]) {
  for (const bounds of [null, { x: -500, y: 50000, width: 90000, height: 10000 }, { x: 100, y: -50, width: -1, height: 0 }, { x: 1, y: 2, width: NaN, height: Infinity }, { x: 40, y: 20, width: 320, height: 340 }]) {
    const b = constrainWhiteboardBounds(bounds, area);
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= area.width && b.y + b.height <= area.height);
    assert.ok(b.width >= Math.min(WHITEBOARD_MIN_SIZE.width, area.width) && b.height >= Math.min(WHITEBOARD_MIN_SIZE.height, area.height));
  }
}
const dockedState = copy(immediate); dockedState.tools.whiteboard.docked = true;
assert.equal(E.restoreSession(dockedState, exam, bank).tools.whiteboard.docked, true);
E.submit(immediate); assert.equal(E.answer(immediate, bank, id, []), false); assert.equal(E.toggleFlag(immediate, id), false);
assert.equal(E.submit(immediate), false);
assert.deepEqual(E.restoreSession(copy(immediate), exam, bank), immediate);
const scoreInjected = copy(wrong); scoreInjected.score = 100; scoreInjected.percentage = 100;
assert.equal(E.grade(E.restoreSession(scoreInjected, exam, bank), exam, bank).correct, 0);
for (const mutate of [
  s => { s.bankVersion = 'older'; }, s => { s.version = 99; }, s => { s.examVersion = '220-1102'; },
  s => { s.questionIds[1] = s.questionIds[0]; }, s => { s.choiceOrder[s.questionIds[0]] = ['a']; },
  s => { s.answers[s.questionIds[0]] = ['bogus']; }, s => { s.current = 24; },
  s => { s.flags = ['not-in-session']; }, s => { s.finalized = [s.questionIds[0]]; },
  s => { s.status = 'graded'; }, s => { s.questionIds = 'string'; }, s => { s.config.objectives = null; }
]) { const state = fresh(); mutate(state); assert.equal(E.restoreSession(state, exam, bank), null); }

const memory = new Map(), storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
assert.equal(E.saveSession(storage, immediate), true);
assert.deepEqual(E.loadSession(storage, exam, bank).session, immediate);
storage.setItem(E.STORAGE_KEY, '{corrupt'); assert.equal(E.loadSession(storage, exam, bank).session, null);
E.saveSession(storage, null); assert.equal(memory.size, 0);
const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
assert.equal(E.loadSession(denied, exam, bank).available, false); assert.equal(E.saveSession(denied, solved), false);
for (const prefix of ['/', '/it-cyber-student-hub/']) {
  assert.equal(E.resourceURL('reference/linux-commands.md', `https://example.test${prefix}`), `https://example.test${prefix}reference/linux-commands/`);
  assert.equal(E.resourceURL('practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/README.md', `https://example.test${prefix}`), `https://example.test${prefix}practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/`);
}
console.log('PASS practice tests: 24 validated questions, 36 objective identifiers, local resources, invalid banks/configs, 200 shuffled sessions, every answer position, exact multi-response scoring, locks, immutable submission, restore/corruption, tool isolation, storage denial, and project-safe URLs.');
