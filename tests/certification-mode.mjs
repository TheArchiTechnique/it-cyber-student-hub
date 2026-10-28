import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../docs/assets/javascripts/practice-tests/engine.mjs';
import { createExamClock, formatTime } from '../docs/assets/javascripts/practice-tests/exam-clock.mjs';

const read = file => JSON.parse(fs.readFileSync(new URL(`../docs/assets/data/practice-tests/${file}`, import.meta.url)));
const exam = read('a-plus-core-2.json'), bank = read('a-plus-core-2-questions.json');
const copy = value => JSON.parse(JSON.stringify(value));
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const start = Date.parse('2026-10-27T12:00:00Z'), duration = 90 * 60000;
const fresh = (seed = 1) => E.createSession(exam, bank, E.certificationConfig(exam), seeded(seed), start);
const allocation = E.allocateDomains(exam.domains, 90);
assert.deepEqual(allocation.map(d => d.count), [25, 25, 21, 19]);
assert.equal(E.certificationAvailability(exam, bank).available, true);
assert.deepEqual(E.allocateDomains(['a', 'b', 'c', 'd'].map(id => ({ id, weight: 25 })), 3).map(d => d.count), [1, 1, 1, 0], 'Ties use metadata order');
assert.deepEqual(E.allocateDomains([{ id: 'a', weight: 40 }, { id: 'b', weight: 35 }, { id: 'c', weight: 25 }], 7).map(d => d.count), [3, 2, 2]);
for (const [domains, count] of [[exam.domains, 0], [exam.domains, 1.5], [[{ id: 'a', weight: 50 }], 10], [[{ id: 'a', weight: -1 }, { id: 'b', weight: 101 }], 10], [[{ id: 'a', weight: 50 }, { id: 'a', weight: 50 }], 10]]) assert.throws(() => E.allocateDomains(domains, count));

const subsets = new Set(), orders = new Set(), seen = new Set(), positions = new Map(bank.questions.map(q => [q.id, new Set()]));
for (let seed = 1; seed <= 200; seed++) {
  const s = fresh(seed);
  assert.equal(s.questionIds.length, 90); assert.equal(new Set(s.questionIds).size, 90);
  assert.equal(s.startedAt, start); assert.equal(s.deadline, start + duration);
  orders.add(s.questionIds.join(',')); subsets.add([...s.questionIds].sort().join(','));
  const selected = s.questionIds.map(id => bank.questions.find(q => q.id === id));
  for (const d of allocation) assert.equal(selected.filter(q => q.domain === d.id).length, d.count);
  for (const o of exam.objectives) assert.ok(selected.some(q => q.objectives.includes(o.id)), `Coverage: ${o.id}`);
  for (const q of selected) {
    seen.add(q.id);
    assert.ok(['single', 'multiple'].includes(q.type) && q.status === 'validated');
    assert.deepEqual([...s.choiceOrder[q.id]].sort(), q.choices.map(c => c.id).sort());
    if (q.type === 'single') positions.get(q.id).add(s.choiceOrder[q.id].indexOf(q.correct[0]));
    assert.equal(E.answer(s, bank, q.id, q.correct, start + 1000), true);
    assert.deepEqual(E.feedbackPolicy(s, q.id), { answers: false, explanations: false });
  }
  for (const d of ['1.0', '2.0', '4.0']) {
    const coverage = exam.objectives.filter(o => o.domain === d).map(o => selected.filter(q => q.objectives.includes(o.id)).length);
    assert.ok(Math.max(...coverage) - Math.min(...coverage) <= 1, `Balanced objectives in ${d}`);
  }
  assert.equal(selected.filter(q => q.objectives.includes('3.1')).length, 6);
  assert.equal(E.grade(s, exam, bank), null, 'Active certification attempts do not expose scores');
  assert.equal(E.submit(s, start + 1000), true);
  assert.equal(E.grade(s, exam, bank).percentage, 100);
  assert.deepEqual(E.restoreSession(copy(s), exam, bank, start + 2000), s);
}
assert.equal(orders.size, 200); assert.equal(subsets.size, 200); assert.equal(seen.size, 104);
for (const q of bank.questions.filter(q => q.type === 'single')) assert.equal(positions.get(q.id).size, 4);

for (const patch of [{ count: 89 }, { durationMinutes: 120 }, { domains: ['1.0'] }, { objectives: ['1.1'] }, { feedback: 'immediate' }, { showAnswers: false }, { showExplanations: false }]) {
  const config = { ...E.certificationConfig(exam), ...patch };
  assert.ok(E.validateConfig(exam, bank, config)); assert.throws(() => E.createSession(exam, bank, config));
}
const sparse = { ...bank, questions: [...bank.questions.filter(q => q.domain === '1.0').slice(0, 24), ...bank.questions.filter(q => q.domain !== '1.0')] };
assert.match(E.certificationAvailability(exam, sparse).reason, /Operating Systems requires 25.*only 24/);
assert.throws(() => E.createSession(exam, sparse, E.certificationConfig(exam)));
const gap = { ...bank, questions: bank.questions.filter(q => !q.objectives.includes('1.1')) };
assert.match(E.certificationAvailability(exam, gap).reason, /every objective/);
assert.equal(E.certificationAvailability({ ...exam, certificationMode: { ...exam.certificationMode, implemented: false } }, bank).available, false);
for (const patch of [{ questionCount: 91 }, { minutes: 0 }, { questionCount: 0 }]) assert.equal(E.certificationAvailability({ ...exam, certificationMode: { ...exam.certificationMode, ...patch } }, bank).available, false);
for (const mutate of [b => { b.questions[0].type = 'pbq'; }, b => { b.questions[0].status = 'draft'; }]) {
  const invalid = copy(bank); mutate(invalid);
  assert.equal(E.certificationAvailability(exam, invalid).available, false);
  assert.ok(!E.eligibleQuestions(exam, invalid, E.certificationConfig(exam)).some(q => q.id === invalid.questions[0].id));
}

// Another version, time limit, domain count, and total use the same policies.
const other = { ...exam, id: 'fixture', examVersion: 'FIX-1', domains: [{ id: 'a', name: 'A', weight: 60 }, { id: 'b', name: 'B', weight: 40 }],
  objectives: [{ id: 'a.1', domain: 'a' }, { id: 'b.1', domain: 'b' }], certificationMode: { implemented: true, questionCount: 10, maximumQuestions: 12, minutes: 30 } };
const otherBank = { ...bank, certification: other.id, examVersion: other.examVersion, questions: Array.from({ length: 16 }, (_, i) => ({ ...copy(bank.questions[0]),
  id: `fixture-${i}`, certification: other.id, examVersion: other.examVersion, domain: i < 8 ? 'a' : 'b', objectives: [i < 8 ? 'a.1' : 'b.1'] })) };
const generic = E.createSession(other, otherBank, E.certificationConfig(other), seeded(2), start);
assert.equal(generic.deadline - generic.startedAt, 30 * 60000);
assert.deepEqual(['a', 'b'].map(d => generic.questionIds.filter(id => otherBank.questions.find(q => q.id === id).domain === d).length), [6, 4]);

const s = fresh(), first = s.questionIds[0], q = bank.questions.find(q => q.id === first);
assert.equal(E.remainingTime(s, start), duration); assert.equal(E.timeUsed(s, start), 0);
assert.equal(E.timeWarning(s, start + duration - 300001), null);
assert.equal(E.timeWarning(s, start + duration - 300000), 5);
assert.equal(E.timeWarning(s, start + duration - 60001), 5);
assert.equal(E.timeWarning(s, start + duration - 60000), 1);
assert.equal(E.timeWarning(s, s.deadline), null);
assert.equal(E.finalizeAnswer(s, first, start + 1000), false);
const tampered = copy(s); tampered.config.feedback = 'immediate'; tampered.finalized = [first];
assert.equal(E.finalizeAnswer(tampered, first, start + 1000), false);
assert.deepEqual(E.feedbackPolicy(tampered, first), { answers: false, explanations: false });
assert.equal(E.grade(tampered, exam, bank), null);
assert.equal(E.answer(s, bank, first, q.correct, s.deadline - 1), true);
E.toggleFlag(s, first, s.deadline - 1); s.tools.whiteboard.text = 'Keep these notes\n  with this attempt.';
const snapshot = copy(s);
assert.equal(E.expireSession(s, s.deadline), true);
assert.equal(s.submissionReason, 'expired'); assert.equal(s.submittedAt, s.deadline);
assert.equal(E.timeUsed(s, s.deadline + 100000), duration); assert.equal(E.remainingTime(s, s.deadline + 100000), 0);
assert.equal(E.grade(s, exam, bank).correct, 1);
assert.deepEqual(E.feedbackPolicy(s, first), { answers: true, explanations: true });
const submitted = copy(s);
assert.equal(E.submit(s, s.deadline + 1), false); assert.equal(E.expireSession(s, s.deadline + 1), false);
assert.equal(E.answer(s, bank, first, [], s.deadline + 1), false); assert.equal(E.toggleFlag(s, first, s.deadline + 1), false);
assert.deepEqual(s, submitted, 'Submission and expiry are a single immutable transition');
const overdue = E.restoreSession(snapshot, exam, bank, snapshot.deadline + 60000);
assert.deepEqual(overdue, submitted); assert.equal(snapshot.status, 'active', 'Restore must not mutate the persisted input');
assert.deepEqual(E.restoreSession(snapshot, exam, bank, snapshot.deadline - 1), snapshot);
for (const method of ['answer', 'toggleFlag', 'finalizeAnswer']) {
  const late = copy(snapshot), args = method === 'answer' ? [late, bank, first, [], late.deadline] : [late, first, late.deadline];
  assert.equal(E[method](...args), false); assert.equal(late.submissionReason, 'expired');
  assert.deepEqual(late.answers, snapshot.answers);
}
const manual = fresh(); E.submit(manual, start + 45000);
assert.equal(manual.submissionReason, 'manual'); assert.equal(E.timeUsed(manual, start + duration + 1), 45000);
assert.deepEqual(E.restoreSession(manual, exam, bank, start + duration + 1), manual, 'Submitted exams do not later become expired');
for (const mutate of [
  s => { s.deadline += 60000; }, s => { delete s.deadline; }, s => { delete s.startedAt; }, s => { s.submissionReason = 'manual'; },
  s => { s.version = 1; }, s => { s.config.mode = 'practice'; }, s => { s.finalized = [first]; },
  s => { s.questionIds[1] = s.questionIds[0]; }, s => { s.choiceOrder[first] = ['a']; }
]) { const broken = copy(snapshot); mutate(broken); assert.equal(E.restoreSession(broken, exam, bank, start), null); }
const swapped = copy(snapshot), replace = swapped.questionIds.find(id => bank.questions.find(q => q.id === id).domain === '1.0');
const replacement = bank.questions.find(q => q.domain === '3.0' && !swapped.questionIds.includes(q.id));
swapped.questionIds[swapped.questionIds.indexOf(replace)] = replacement.id;
swapped.choiceOrder[replacement.id] = replacement.choices.map(c => c.id); swapped.answers[replacement.id] = [];
swapped.flags = []; swapped.finalized = [];
assert.equal(E.restoreSession(swapped, exam, bank, start), null, 'Restore rejects a wrong domain allocation');

// Exact-set scoring applies unchanged to multi-response items inside timed attempts.
const multiSession = fresh(5), multi = bank.questions.find(q => q.type === 'multiple' && multiSession.questionIds.includes(q.id));
assert.equal(E.answer(multiSession, bank, multi.id, [multi.correct[0]], start + 1000), true);
assert.equal(E.answer(multiSession, bank, multi.id, multi.choices.map(c => c.id), start + 1000), false);
E.submit(multiSession, start + 2000); assert.equal(E.grade(multiSession, exam, bank).correct, 0);
const complete = fresh(5); E.answer(complete, bank, multi.id, multi.correct, start + 1000); E.submit(complete, start + 2000);
assert.equal(E.grade(complete, exam, bank).correct, 1);

const practiceConfig = { ...E.certificationConfig(exam), mode: 'practice', count: 4 };
delete practiceConfig.durationMinutes;
const legacy = E.createSession(exam, bank, practiceConfig, seeded(5), start);
legacy.version = 1; delete legacy.startedAt; delete legacy.deadline; delete legacy.submissionReason;
legacy.answers[legacy.questionIds[0]] = bank.questions.find(q => q.id === legacy.questionIds[0]).correct;
legacy.flags = [legacy.questionIds[0]]; legacy.tools.whiteboard.text = 'Legacy practice notes';
for (const status of ['active', 'submitted']) {
  const raw = copy(legacy); raw.status = status; raw.submittedAt = status === 'submitted' ? start + 1000 : null;
  const migrated = E.restoreSession(raw, exam, bank, start + duration + 1);
  assert.equal(migrated.version, 2); assert.equal(migrated.config.mode, 'practice'); assert.equal(migrated.deadline, null);
  assert.equal(migrated.status, status); assert.deepEqual(migrated.answers, raw.answers); assert.deepEqual(migrated.flags, raw.flags);
  assert.equal(migrated.tools.whiteboard.text, raw.tools.whiteboard.text); assert.equal(raw.version, 1);
}
const next = fresh(2); assert.notEqual(next.id, snapshot.id); assert.notDeepEqual(next.questionIds, snapshot.questionIds);
assert.equal(next.tools.whiteboard.text, ''); assert.deepEqual(next.flags, []); assert.ok(Object.values(next.answers).every(a => !a.length));

let wall = start, mono = 0; const clock = createExamClock(() => wall, () => mono);
assert.equal(clock(), start); wall += 5000; mono += 5000; assert.equal(clock(), start + 5000);
wall -= 3600000; mono += 2000; assert.equal(clock(), start + 7000, 'An in-tab wall-clock rollback cannot pause elapsed time');
wall = start + duration + 1; assert.ok(clock() > snapshot.deadline, 'Wall time catches up after sleep');
assert.equal(formatTime(duration), '90:00'); assert.equal(formatTime(1), '0:01'); assert.equal(formatTime(0), '0:00');
console.log('PASS certification engine: 90 unique MCQs, 25/25/21/19 largest-remainder allocation, objective-balanced sampling, 200 distinct subsets, all answer positions, unavailable/unsupported banks, fixed settings, second-exam metadata, deadline and interaction boundaries, idempotent manual/expired submission, review-only feedback and scoring, exact multi-response credit, v1 Practice migration, fresh tools, and monotonic/wall clock behavior.');
