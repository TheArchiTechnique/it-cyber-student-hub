// Pure session logic, shared by every examination interface.
export const SESSION_VERSION = 1;
export const STORAGE_KEY = 'student-hub.exam.session.v1';
export const questionTypes = ['single', 'multiple'];

const unique = values => Array.isArray(values) && new Set(values).size === values.length;
const sameSet = (a, b) => unique(a) && a.length === b.length && a.every(id => b.includes(id));
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;

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
  return bank.questions.filter(q => q.status === 'validated' && q.certification === exam.id && q.examVersion === exam.examVersion && config.domains.includes(q.domain) && q.objectives.some(id => objectives.includes(id)));
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
  if (!object(config) || config.certification !== exam.id || config.mode !== 'practice') return 'Select an available practice certification.';
  if (!unique(config.domains) || !config.domains.length || config.domains.some(id => !exam.domains.some(d => d.id === id))) return 'Select at least one domain.';
  if (!unique(config.objectives) || !config.objectives.length || config.objectives.some(id => !exam.objectives.some(o => o.id === id && config.domains.includes(o.domain)))) return 'Select objectives within the selected domains.';
  if (typeof config.showAnswers !== 'boolean' || typeof config.showExplanations !== 'boolean' || (config.showExplanations && !config.showAnswers)) return 'Explanations require correct-answer feedback.';
  if (!['end', 'immediate'].includes(config.feedback)) return 'Choose a feedback timing.';
  const available = eligibleQuestions(exam, bank, config).length;
  if (!Number.isInteger(config.count) || config.count < 1 || config.count > available) return `Choose 1 to ${available} questions for these objectives.`;
  return null;
}

export function createSession(exam, bank, config, random = Math.random) {
  const error = validateConfig(exam, bank, config);
  if (error) throw new Error(error);
  const questions = shuffle(eligibleQuestions(exam, bank, config), random).slice(0, config.count);
  return {
    version: SESSION_VERSION, bankVersion: bank.version, examVersion: exam.examVersion,
    id: globalThis.crypto?.randomUUID?.() || `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    config: clone(config), createdAt: Date.now(), submittedAt: null, status: 'active',
    questionIds: questions.map(q => q.id),
    choiceOrder: Object.fromEntries(questions.map(q => [q.id, shuffle(q.choices.map(c => c.id), random)])),
    answers: Object.fromEntries(questions.map(q => [q.id, []])), flags: [], finalized: [], current: 0,
    // Tool state is session-owned and never participates in selection or scoring.
    tools: { whiteboard: { text: '', visible: false, minimized: false, bounds: null } }
  };
}

export function answer(session, bank, questionId, choiceIds) {
  if (session.status !== 'active' || session.finalized.includes(questionId)) return false;
  const q = bank.questions.find(item => item.id === questionId);
  if (!q || !session.questionIds.includes(questionId) || !unique(choiceIds) || choiceIds.some(id => !q.choices.some(c => c.id === id)) || choiceIds.length > (q.type === 'single' ? 1 : q.correct.length)) return false;
  session.answers[questionId] = [...choiceIds];
  return true;
}

export function finalizeAnswer(session, questionId) {
  if (session.status !== 'active' || session.config.feedback !== 'immediate' || !session.config.showAnswers || !session.answers[questionId]?.length || session.finalized.includes(questionId)) return false;
  session.finalized.push(questionId);
  return true;
}

export function toggleFlag(session, questionId) {
  if (session.status !== 'active' || !session.questionIds.includes(questionId)) return false;
  session.flags = session.flags.includes(questionId) ? session.flags.filter(id => id !== questionId) : [...session.flags, questionId];
  return true;
}

export function submit(session) {
  if (session.status !== 'active') return false;
  session.status = 'submitted'; session.submittedAt = Date.now(); return true;
}

export function grade(session, exam, bank) {
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

export function restoreSession(raw, exam, bank) {
  if (!object(raw) || raw.version !== SESSION_VERSION || raw.bankVersion !== bank.version || raw.examVersion !== exam.examVersion || !text(raw.id) || validateConfig(exam, bank, raw.config)) return null;
  if (!['active', 'submitted'].includes(raw.status) || !Number.isFinite(raw.createdAt) || (raw.status === 'submitted' && !Number.isFinite(raw.submittedAt))) return null;
  if (!unique(raw.questionIds) || raw.questionIds.length !== raw.config.count || !object(raw.choiceOrder) || !object(raw.answers)) return null;
  const eligible = new Set(eligibleQuestions(exam, bank, raw.config).map(q => q.id));
  for (const id of raw.questionIds) {
    if (!eligible.has(id)) return null;
    const q = bank.questions.find(item => item.id === id);
    if (!Array.isArray(raw.choiceOrder[id]) || !sameSet(raw.choiceOrder[id], q.choices.map(c => c.id))) return null;
    const selected = raw.answers[id] || [];
    if (!unique(selected) || selected.some(choice => !q.choices.some(c => c.id === choice)) || selected.length > (q.type === 'single' ? 1 : q.correct.length)) return null;
  }
  if (!unique(raw.flags) || !unique(raw.finalized) || [...raw.flags, ...raw.finalized].some(id => !raw.questionIds.includes(id)) || raw.finalized.some(id => !raw.answers[id]?.length)) return null;
  if (raw.finalized.length && (raw.config.feedback !== 'immediate' || !raw.config.showAnswers)) return null;
  if (!Number.isInteger(raw.current) || raw.current < 0 || raw.current >= raw.questionIds.length) return null;
  const session = {
    version: SESSION_VERSION, bankVersion: bank.version, examVersion: exam.examVersion,
    id: raw.id, config: clone(raw.config), createdAt: raw.createdAt,
    submittedAt: raw.status === 'submitted' ? raw.submittedAt : null, status: raw.status,
    questionIds: [...raw.questionIds], choiceOrder: {}, answers: {}, flags: [...raw.flags], finalized: [...raw.finalized], current: raw.current,
    tools: { whiteboard: { text: '', visible: false, minimized: false, bounds: null } }
  };
  for (const id of session.questionIds) { session.choiceOrder[id] = [...raw.choiceOrder[id]]; session.answers[id] = [...(raw.answers[id] || [])]; }
  const notes = raw.tools?.whiteboard;
  if (object(notes)) {
    session.tools.whiteboard.text = typeof notes.text === 'string' ? notes.text.slice(0, 200000) : '';
    session.tools.whiteboard.visible = notes.visible === true;
    session.tools.whiteboard.minimized = notes.minimized === true;
    if (object(notes.bounds) && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(notes.bounds[key]))) session.tools.whiteboard.bounds = Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, notes.bounds[key]]));
  }
  return session;
}

export function loadSession(storage, exam, bank) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { session: null, notice: '', available: true };
    const session = restoreSession(JSON.parse(raw), exam, bank);
    return { session, notice: session ? 'Your saved test has been restored.' : 'The saved test is incompatible with this question bank. Start a new test.', available: true };
  } catch { return { session: null, notice: 'The saved test could not be read. You can start a new test.', available: false }; }
}

export function saveSession(storage, session) {
  try { if (session) storage.setItem(STORAGE_KEY, JSON.stringify(session)); else storage.removeItem(STORAGE_KEY); return true; }
  catch { return false; }
}

export function resourceURL(path, docsBase) {
  return new URL(path.replace(/README\.md(?=#|$)/, '').replace(/\.md(?=#|$)/, '/'), docsBase).href;
}
