// Pure session logic, shared by every examination interface.
import { restoreWhiteboard } from './whiteboard-state.mjs';
import { allocateDomains, sampleObjectives } from './exam-policy.mjs';
export { allocateDomains } from './exam-policy.mjs';
export const SESSION_VERSION = 2;
// Keep the key so version-1 Practice Mode attempts can be migrated explicitly.
export const STORAGE_KEY = 'student-hub.exam.session.v1';
export const questionTypes = ['single', 'multiple'];

const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const sameSet = (a, b) => unique(a) && a.length === b.length && a.every(id => b.includes(id));
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const time = value => Number.isSafeInteger(value) && value >= 0;
const isCertification = session => session?.config?.mode === 'certification';

export function validateBank(exam, bank) {
  const errors = [];
  const fail = message => errors.push(message);
  if (!object(exam) || !object(bank)) return ['Missing examination metadata or bank'];
  if (exam.id !== bank.certification || exam.examVersion !== bank.examVersion) fail('Bank exam mismatch');
  if (!text(bank.version) || !Array.isArray(bank.questions) || !bank.questions.length) return [...errors, 'Empty or unversioned bank'];
  const domains = exam.domains || [], objectives = exam.objectives || [];
  if (!unique(domains.map(d => d.id)) || !unique(objectives.map(o => o.id))) fail('Duplicate metadata identifiers');
  if (domains.reduce((n, d) => n + d.weight, 0) !== 100) fail('Invalid domain weights');
  for (const objective of objectives) if (!domains.some(d => d.id === objective.domain)) fail(`Invalid metadata domain ${objective.id}`);
  const ids = new Set();
  for (const q of bank.questions) {
    if (!object(q)) { fail('Malformed question record'); continue; }
    const label = q.id || '(missing ID)';
    if (!text(q.id) || ids.has(q.id)) fail(`Duplicate/missing question ID ${label}`);
    ids.add(q.id);
    if (q.certification !== exam.id || q.examVersion !== exam.examVersion) fail(`Exam mismatch ${label}`);
    if (!domains.some(d => d.id === q.domain)) fail(`Invalid domain ${label}`);
    if (!Array.isArray(q.objectives) || !q.objectives.length || !unique(q.objectives) || q.objectives.some(id => !objectives.some(o => o.id === id && o.domain === q.domain))) fail(`Invalid objectives ${label}`);
    if (!questionTypes.includes(q.type) || !text(q.stem) || !text(q.explanation)) fail(`Invalid content/type ${label}`);
    if (!Array.isArray(q.choices) || q.choices.length < 4) { fail(`Missing choices ${label}`); continue; }
    if (q.choices.some(c => !object(c))) { fail(`Malformed choices ${label}`); continue; }
    if (!unique(q.choices.map(c => c.id)) || !unique(q.choices.map(c => c.text)) || q.choices.some(c => !text(c.id) || !text(c.text) || !text(c.explanation))) fail(`Invalid choices/rationales ${label}`);
    if (!unique(q.correct) || !q.correct.length || q.correct.some(id => !q.choices.some(c => c.id === id))) fail(`Invalid correct IDs ${label}`);
    if (q.type === 'single' && q.correct?.length !== 1) fail(`Invalid single-answer count ${label}`);
    if (q.type === 'multiple' && (!Array.isArray(q.correct) || q.correct.length < 2 || q.correct.length >= q.choices.length)) fail(`Invalid multiple-answer count ${label}`);
    if (!['foundation', 'applied', 'analysis'].includes(q.difficulty)) fail(`Invalid difficulty ${label}`);
    if (q.status !== 'validated' || !object(q.validation) || !/^\d{4}-\d{2}-\d{2}$/.test(q.validation.checkedOn) || !text(q.validation.review) || !Array.isArray(q.validation.sources) || !q.validation.sources.length || q.validation.sources.some(s => !object(s) || !text(s.title) || !/^https:\/\//.test(s.url))) fail(`Missing validation ${label}`);
    if (!Array.isArray(q.resources) || q.resources.some(r => !object(r) || !text(r.title) || !/^[a-z0-9][a-z0-9/_-]*(?:README)?\.md(?:#[a-z0-9-]+)?$/.test(r.path) || r.path.includes('..'))) fail(`Invalid resources ${label}`);
  }
  return errors;
}

export function eligibleQuestions(exam, bank, config) {
  const objectives = exam.objectives.filter(o => config.domains.includes(o.domain) && config.objectives.includes(o.id)).map(o => o.id);
  return bank.questions.filter(q => q.status === 'validated' && questionTypes.includes(q.type) && q.certification === exam.id && q.examVersion === exam.examVersion && config.domains.includes(q.domain) && q.objectives.some(id => objectives.includes(id)));
}

export function certificationConfig(exam) {
  return {
    certification: exam.id, mode: 'certification',
    domains: exam.domains.map(d => d.id), objectives: exam.objectives.map(o => o.id),
    count: exam.certificationMode?.questionCount, durationMinutes: exam.certificationMode?.minutes,
    feedback: 'end', showAnswers: true, showExplanations: true
  };
}

export function certificationAvailability(exam, bank) {
  const unavailable = reason => ({ available: false, reason, allocation: [] });
  const policy = exam?.certificationMode;
  if (!policy?.implemented) return unavailable('Certification Mode is not available for this examination version.');
  if (!Number.isInteger(policy.questionCount) || policy.questionCount < 1
      || !Number.isInteger(policy.maximumQuestions) || policy.questionCount > policy.maximumQuestions
      || !Number.isFinite(policy.minutes) || policy.minutes <= 0 || !time(policy.minutes * 60000)) {
    return unavailable('This examination has an invalid question-count or time-limit configuration.');
  }
  let allocation;
  try { allocation = allocateDomains(exam.domains, policy.questionCount); }
  catch (error) { return unavailable(error.message); }
  if (validateBank(exam, bank).length) return unavailable('The question bank must pass validation before this simulation can start.');
  const eligible = eligibleQuestions(exam, bank, certificationConfig(exam));
  for (const domain of allocation) {
    const pool = eligible.filter(q => q.domain === domain.id);
    if (pool.length < domain.count) return unavailable(`${domain.name} requires ${domain.count} validated MCQs; only ${pool.length} are available.`);
    if (domain.count && exam.objectives.some(o => o.domain === domain.id && !pool.some(q => q.objectives.includes(o.id)))) {
      return unavailable(`${domain.name} needs validated MCQ coverage for every objective before this simulation can start.`);
    }
  }
  return { available: true, reason: '', allocation };
}

export function shuffle(items, random = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function validateConfig(exam, bank, config) {
  if (!object(config) || config.certification !== exam.id || !['practice', 'certification'].includes(config.mode)) return 'Select an available examination mode and certification.';
  if (config.mode === 'certification') {
    const expected = certificationConfig(exam), availability = certificationAvailability(exam, bank);
    if (!availability.available) return availability.reason;
    if (!sameSet(config.domains, expected.domains) || !sameSet(config.objectives, expected.objectives)
        || config.count !== expected.count || config.durationMinutes !== expected.durationMinutes
        || config.feedback !== 'end' || config.showAnswers !== true || config.showExplanations !== true) {
      return 'Certification Mode uses fixed examination settings and post-exam feedback.';
    }
    return null;
  }
  if (!unique(config.domains) || !config.domains.length || config.domains.some(id => !exam.domains.some(d => d.id === id))) return 'Select at least one domain.';
  if (!unique(config.objectives) || !config.objectives.length || config.objectives.some(id => !exam.objectives.some(o => o.id === id && config.domains.includes(o.domain)))) return 'Select objectives within the selected domains.';
  if (typeof config.showAnswers !== 'boolean' || typeof config.showExplanations !== 'boolean' || (config.showExplanations && !config.showAnswers)) return 'Explanations require correct-answer feedback.';
  if (!['end', 'immediate'].includes(config.feedback)) return 'Choose a feedback timing.';
  const available = eligibleQuestions(exam, bank, config).length;
  if (!Number.isInteger(config.count) || config.count < 1 || config.count > available) return `Choose 1 to ${available} questions for these objectives.`;
  return null;
}

export function createSession(exam, bank, config, random = Math.random, now = Date.now()) {
  const error = validateConfig(exam, bank, config);
  if (error) throw new Error(error);
  if (!time(now)) throw new Error('The examination start time is invalid.');
  const eligible = eligibleQuestions(exam, bank, config);
  const selected = config.mode === 'certification'
    ? allocateDomains(exam.domains, config.count).flatMap(domain => sampleObjectives(
      eligible.filter(q => q.domain === domain.id), exam.objectives.filter(o => o.domain === domain.id).map(o => o.id), domain.count, random))
    : shuffle(eligible, random).slice(0, config.count);
  const questions = config.mode === 'certification' ? shuffle(selected, random) : selected;
  return {
    version: SESSION_VERSION, bankVersion: bank.version, examVersion: exam.examVersion,
    id: globalThis.crypto?.randomUUID?.() || `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    config: clone(config), createdAt: now, startedAt: now,
    deadline: config.mode === 'certification' ? now + config.durationMinutes * 60000 : null,
    submittedAt: null, submissionReason: null, status: 'active',
    questionIds: questions.map(q => q.id),
    choiceOrder: Object.fromEntries(questions.map(q => [q.id, shuffle(q.choices.map(c => c.id), random)])),
    answers: Object.fromEntries(questions.map(q => [q.id, []])), flags: [], finalized: [], current: 0,
    // Tool state is session-owned and never participates in selection or scoring.
    tools: { whiteboard: restoreWhiteboard(null) }
  };
}

export function answer(session, bank, questionId, choiceIds, now = Date.now()) {
  expireSession(session, now);
  if (session.status !== 'active' || session.finalized.includes(questionId)) return false;
  const q = bank.questions.find(item => item.id === questionId);
  if (!q || !session.questionIds.includes(questionId) || !unique(choiceIds) || choiceIds.some(id => !q.choices.some(c => c.id === id)) || choiceIds.length > (q.type === 'single' ? 1 : q.correct.length)) return false;
  session.answers[questionId] = [...choiceIds];
  return true;
}

export function finalizeAnswer(session, questionId, now = Date.now()) {
  expireSession(session, now);
  if (isCertification(session)) return false;
  if (session.status !== 'active' || session.config.feedback !== 'immediate' || !session.config.showAnswers || !session.answers[questionId]?.length || session.finalized.includes(questionId)) return false;
  session.finalized.push(questionId);
  return true;
}

export function toggleFlag(session, questionId, now = Date.now()) {
  expireSession(session, now);
  if (session.status !== 'active' || !session.questionIds.includes(questionId)) return false;
  session.flags = session.flags.includes(questionId) ? session.flags.filter(id => id !== questionId) : [...session.flags, questionId];
  return true;
}

export function submit(session, now = Date.now()) {
  if (session.status !== 'active' || !time(now)) return false;
  const expired = isCertification(session) && now >= session.deadline;
  session.status = 'submitted';
  session.submittedAt = expired ? session.deadline : Math.max(session.startedAt, now);
  session.submissionReason = expired ? 'expired' : 'manual';
  return true;
}

export function expireSession(session, now = Date.now()) {
  return Boolean(session && isCertification(session) && session.status === 'active'
    && time(now) && now >= session.deadline && submit(session, now));
}

export function remainingTime(session, now = Date.now()) {
  if (!isCertification(session)) return null;
  const end = session.status === 'submitted' ? session.submittedAt : now;
  return Math.max(0, Math.min(session.deadline - session.startedAt, session.deadline - end));
}

export function timeUsed(session, now = Date.now()) {
  const elapsed = Math.max(0, (session.status === 'submitted' ? session.submittedAt : now) - session.startedAt);
  return isCertification(session) ? Math.min(elapsed, session.deadline - session.startedAt) : elapsed;
}

export function timeWarning(session, now = Date.now()) {
  if (!isCertification(session) || session.status !== 'active') return null;
  const remaining = remainingTime(session, now);
  return remaining > 0 ? remaining <= 60000 ? 1 : remaining <= 300000 ? 5 : null : null;
}

export function feedbackPolicy(session, questionId) {
  const visible = isCertification(session) ? session.status === 'submitted'
    : session.config.showAnswers && (session.status === 'submitted' || session.finalized.includes(questionId));
  return { answers: Boolean(visible), explanations: Boolean(visible && (isCertification(session) || session.config.showExplanations)) };
}

export function grade(session, exam, bank) {
  if (isCertification(session) && session.status !== 'submitted') return null;
  const rows = session.questionIds.map(id => {
    const q = bank.questions.find(item => item.id === id), selected = session.answers[id] || [];
    return { id, domain: q.domain, objectives: q.objectives, answered: selected.length > 0, correct: sameSet(selected, q.correct), flagged: session.flags.includes(id) };
  });
  const totals = list => ({ total: list.length, correct: list.filter(r => r.correct).length, incorrect: list.filter(r => r.answered && !r.correct).length, unanswered: list.filter(r => !r.answered).length });
  const score = totals(rows);
  return { ...score, percentage: Math.round(score.correct / score.total * 100), rows,
    domains: exam.domains.map(d => ({ ...d, ...totals(rows.filter(r => r.domain === d.id)) })).filter(d => d.total),
    objectives: exam.objectives.map(o => ({ ...o, ...totals(rows.filter(r => r.objectives.includes(o.id))) })).filter(o => o.total) };
}

export function restoreSession(raw, exam, bank, now = Date.now()) {
  if (!object(raw) || ![1, SESSION_VERSION].includes(raw.version) || raw.bankVersion !== bank.version || raw.examVersion !== exam.examVersion || !text(raw.id) || validateConfig(exam, bank, raw.config)) return null;
  const legacy = raw.version === 1, certification = isCertification(raw);
  if (legacy && (certification || raw.deadline != null)) return null;
  const startedAt = legacy ? raw.createdAt : raw.startedAt;
  const reason = legacy ? raw.status === 'submitted' ? 'manual' : null : raw.submissionReason;
  if (!['active', 'submitted'].includes(raw.status) || !time(raw.createdAt) || !time(startedAt) || startedAt !== raw.createdAt) return null;
  if (raw.status === 'active' && (raw.submittedAt != null || reason != null)) return null;
  if (raw.status === 'submitted' && (!time(raw.submittedAt) || raw.submittedAt < startedAt || !['manual', 'expired'].includes(reason))) return null;
  if (certification) {
    if (!time(raw.deadline) || raw.deadline !== startedAt + raw.config.durationMinutes * 60000 || !time(now)) return null;
    if (raw.status === 'submitted' && (reason === 'expired' ? raw.submittedAt !== raw.deadline : raw.submittedAt >= raw.deadline)) return null;
  } else if (raw.deadline != null || reason === 'expired') return null;
  if (!unique(raw.questionIds) || raw.questionIds.length !== raw.config.count || !object(raw.choiceOrder) || !object(raw.answers)) return null;
  const eligible = new Set(eligibleQuestions(exam, bank, raw.config).map(q => q.id));
  for (const id of raw.questionIds) {
    if (!eligible.has(id)) return null;
    const q = bank.questions.find(item => item.id === id);
    if (!Array.isArray(raw.choiceOrder[id]) || !sameSet(raw.choiceOrder[id], q.choices.map(c => c.id))) return null;
    const selected = raw.answers[id] || [];
    if (!unique(selected) || selected.some(choice => !q.choices.some(c => c.id === choice)) || selected.length > (q.type === 'single' ? 1 : q.correct.length)) return null;
  }
  if (certification) {
    const questions = raw.questionIds.map(id => bank.questions.find(q => q.id === id));
    for (const domain of allocateDomains(exam.domains, raw.config.count)) {
      const selected = questions.filter(q => q.domain === domain.id), objectives = exam.objectives.filter(o => o.domain === domain.id);
      if (selected.length !== domain.count) return null;
      if (domain.count >= objectives.length && objectives.some(o => !selected.some(q => q.objectives.includes(o.id)))) return null;
    }
  }
  if (!unique(raw.flags) || !unique(raw.finalized) || [...raw.flags, ...raw.finalized].some(id => !raw.questionIds.includes(id)) || raw.finalized.some(id => !raw.answers[id]?.length)) return null;
  if (raw.finalized.length && (certification || raw.config.feedback !== 'immediate' || !raw.config.showAnswers)) return null;
  if (!Number.isInteger(raw.current) || raw.current < 0 || raw.current >= raw.questionIds.length) return null;
  const session = {
    version: SESSION_VERSION, bankVersion: bank.version, examVersion: exam.examVersion,
    id: raw.id, config: clone(raw.config), createdAt: raw.createdAt, startedAt,
    deadline: certification ? raw.deadline : null, submissionReason: reason,
    submittedAt: raw.status === 'submitted' ? raw.submittedAt : null, status: raw.status,
    questionIds: [...raw.questionIds], choiceOrder: {}, answers: {}, flags: [...raw.flags], finalized: [...raw.finalized], current: raw.current,
    tools: { whiteboard: restoreWhiteboard(raw.tools?.whiteboard) }
  };
  for (const id of session.questionIds) { session.choiceOrder[id] = [...raw.choiceOrder[id]]; session.answers[id] = [...(raw.answers[id] || [])]; }
  expireSession(session, now);
  return session;
}

export function loadSession(storage, exam, bank, now = Date.now()) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { session: null, notice: '', available: true };
    const session = restoreSession(JSON.parse(raw), exam, bank, now);
    const notice = session?.submissionReason === 'expired' ? 'Your saved exam reached its deadline and has been submitted as expired.' : 'Your saved test has been restored.';
    return { session, notice: session ? notice : 'The saved test is incompatible with this question bank or examination settings. Start a new test.', available: true };
  } catch { return { session: null, notice: 'The saved test could not be read. You can start a new test.', available: false }; }
}

export function saveSession(storage, session) {
  try { if (session) storage.setItem(STORAGE_KEY, JSON.stringify(session)); else storage.removeItem(STORAGE_KEY); return true; }
  catch { return false; }
}

export function resourceURL(path, docsBase) {
  return new URL(path.replace(/README\.md(?=#|$)/, '').replace(/\.md(?=#|$)/, '/'), docsBase).href;
}
