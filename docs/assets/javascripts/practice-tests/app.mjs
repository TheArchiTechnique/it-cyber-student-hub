import { certifications } from './registry.mjs';
import { validateBank, eligibleQuestions, validateConfig, createSession, answer, finalizeAnswer, toggleFlag, submit, grade, loadSession, saveSession, resourceURL } from './engine.mjs';

const $ = id => document.getElementById(id);
const docsBase = new URL('../../../', location.href);
const dataBase = new URL('assets/data/practice-tests/', docsBase);
const storage = {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key)
};
let exam, bank, session = null, pendingAction = null;
const domainInputs = new Map(), objectiveInputs = new Map();

function node(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') element.className = value;
    else if (value !== false && value != null) element.setAttribute(key, value === true ? '' : value);
  }
  element.append(...children.filter(child => child != null));
  return element;
}

function persist() {
  $('save-status').textContent = saveSession(storage, session)
    ? 'Progress is saved in this browser.'
    : 'Browser storage is unavailable or full. Keep this tab open; a refresh may lose your progress.';
}

function getConfig() {
  const config = {
    certification: exam.id, mode: 'practice',
    domains: [...domainInputs].filter(([, input]) => input.checked).map(([id]) => id),
    objectives: [...objectiveInputs].filter(([, input]) => input.checked && !input.disabled).map(([id]) => id),
    count: 1, showAnswers: $('show-answers').checked,
    showExplanations: $('show-explanations').checked, feedback: $('feedback-timing').value
  };
  config.count = $('count-preset').value === 'all' ? eligibleQuestions(exam, bank, config).length
    : Number($('count-preset').value === 'custom' ? $('custom-count').value : $('count-preset').value);
  return config;
}

function updateConfiguration() {
  for (const objective of exam.objectives) {
    const input = objectiveInputs.get(objective.id);
    input.disabled = !domainInputs.get(objective.domain).checked || !bank.questions.some(q => q.objectives.includes(objective.id));
  }
  if (!$('show-answers').checked) $('show-explanations').checked = false;
  $('show-explanations').disabled = !$('show-answers').checked;
  $('feedback-timing').disabled = !$('show-answers').checked;
  const config = getConfig(), available = eligibleQuestions(exam, bank, config).length;
  const selected = new Set(eligibleQuestions(exam, bank, config).flatMap(q => q.objectives));
  $('available').textContent = `${available} validated questions available across ${selected.size} selected objectives.`;
  for (const option of $('count-preset').options) {
    if (/^\d+$/.test(option.value)) option.disabled = Number(option.value) > available;
    if (option.value === 'all') option.textContent = `All available (${available})`;
  }
  $('custom-count-field').hidden = $('count-preset').value !== 'custom';
  $('custom-count').disabled = $('count-preset').value !== 'custom';
  $('custom-count').max = String(available);
  $('use-available').hidden = !available || (Number.isInteger(config.count) && config.count >= 1 && config.count <= available);
  $('use-available').textContent = `Use ${available} available questions`;
  const error = validateConfig(exam, bank, config);
  $('config-error').textContent = error || '';
  $('start-test').disabled = Boolean(error);
}

function buildConfiguration() {
  domainInputs.clear(); objectiveInputs.clear(); $('domain-options').replaceChildren();
  for (const domain of exam.domains) {
    const available = bank.questions.filter(q => q.domain === domain.id).length;
    const input = node('input', { type: 'checkbox', id: `domain-${domain.id}`, value: domain.id, checked: available > 0, disabled: !available });
    domainInputs.set(domain.id, input);
    const title = node('label', { class: 'check', for: input.id }, input, node('span', {}, `${domain.id} ${domain.name} (${available} questions)`));
    const objectives = node('div', { class: 'objectives' });
    for (const objective of exam.objectives.filter(o => o.domain === domain.id)) {
      const count = bank.questions.filter(q => q.objectives.includes(objective.id)).length;
      const check = node('input', { type: 'checkbox', id: `objective-${objective.id}`, value: objective.id, checked: count > 0, disabled: !count });
      objectiveInputs.set(objective.id, check);
      check.addEventListener('change', updateConfiguration);
      objectives.append(node('label', { class: 'check', for: check.id }, check, node('span', {}, `${objective.id} ${objective.name} (${count ? `${count} question${count === 1 ? '' : 's'}` : 'no questions yet'})`)));
    }
    const details = node('details', {}, node('summary', {}, `Choose objectives in ${domain.name}`), objectives);
    input.addEventListener('change', () => {
      for (const objective of exam.objectives.filter(o => o.domain === domain.id)) objectiveInputs.get(objective.id).checked = input.checked && bank.questions.some(q => q.objectives.includes(objective.id));
      updateConfiguration();
    });
    $('domain-options').append(node('div', { class: 'domain-block' }, title, details));
  }
  updateConfiguration();
}

function revealTest() {
  $('setup').hidden = true; $('exam').hidden = false;
  $('exam-label').textContent = `${exam.title} (${exam.examVersion}) · Practice`;
  $('results').hidden = session.status !== 'submitted';
  if (session.status === 'submitted') renderResults();
  renderQuestion();
}

function renderNavigator() {
  const count = session.questionIds.filter(id => session.answers[id]?.length).length;
  $('progress').max = session.questionIds.length; $('progress').value = count;
  $('progress-text').textContent = `${count} of ${session.questionIds.length} answered · ${session.flags.length} flagged`;
  $('question-navigator').replaceChildren(...session.questionIds.map((id, index) => {
    const answered = Boolean(session.answers[id]?.length), flagged = session.flags.includes(id);
    const button = node('button', { type: 'button', 'aria-label': `Question ${index + 1}, ${answered ? 'answered' : 'unanswered'}${flagged ? ', flagged' : ''}`, 'aria-current': index === session.current ? 'step' : null }, `${index + 1}${answered ? ' ✓' : ''}${flagged ? ' F' : ''}`);
    button.addEventListener('click', () => navigate(index)); return button;
  }));
  $('flag').setAttribute('aria-pressed', String(session.flags.includes(session.questionIds[session.current])));
  $('flag').textContent = session.flags.includes(session.questionIds[session.current]) ? 'Remove Flag' : 'Flag for Review';
  $('flag').disabled = session.status === 'submitted';
  $('submit-test').hidden = session.status === 'submitted';
}

function navigate(index) {
  if (index < 0 || index >= session.questionIds.length) return;
  session.current = index; persist(); renderQuestion(); $('question-title').focus();
}

function renderQuestion() {
  const q = bank.questions.find(item => item.id === session.questionIds[session.current]);
  const locked = session.status === 'submitted' || session.finalized.includes(q.id);
  $('question-position').textContent = `Question ${session.current + 1} of ${session.questionIds.length}`;
  $('question-title').textContent = session.status === 'submitted' ? `Review question ${session.current + 1}` : `Question ${session.current + 1}`;
  $('question-body').replaceChildren(node('p', {}, q.stem));
  if (q.evidence) $('question-body').append(node('pre', { tabindex: '0', 'aria-label': 'Technical evidence' }, q.evidence));
  $('answer-instructions').textContent = q.type === 'multiple' ? `Select ${q.correct.length} answers. All required choices must be correct for credit.` : 'Select one answer.';
  const options = session.choiceOrder[q.id].map((id, index) => {
    const choice = q.choices.find(c => c.id === id);
    const input = node('input', { type: q.type === 'single' ? 'radio' : 'checkbox', name: 'answer', value: id, id: `choice-${id}`, checked: session.answers[q.id]?.includes(id), disabled: locked });
    input.addEventListener('change', () => {
      const selected = [...$('answer-options').querySelectorAll('input:checked')].map(item => item.value);
      if (!answer(session, bank, q.id, selected)) {
        input.checked = !input.checked;
        $('answer-status').textContent = `Choose no more than ${q.correct.length} answers.`;
        return;
      }
      persist(); renderNavigator(); updateAnswerStatus(q, locked);
    });
    return node('label', { class: 'answer-choice', for: input.id }, input, node('span', {}, `${String.fromCharCode(65 + index)}. ${choice.text}`));
  });
  $('answer-options').replaceChildren(...options);
  $('previous').disabled = session.current === 0;
  $('next').disabled = session.current === session.questionIds.length - 1;
  $('check-answer').hidden = session.status === 'submitted' || session.config.feedback !== 'immediate' || !session.config.showAnswers || locked;
  updateAnswerStatus(q, locked); renderNavigator(); renderFeedback(q);
}

function updateAnswerStatus(q, locked) {
  const count = session.answers[q.id]?.length || 0;
  $('answer-status').textContent = locked ? (session.status === 'submitted' ? 'Submitted response. Answers can no longer be changed.' : 'Feedback revealed. This response is locked.')
    : count ? `Answer saved${q.type === 'multiple' ? ` · ${count} of ${q.correct.length} selected` : ''}. You can change it until it is finalized.` : 'No answer selected.';
  $('check-answer').disabled = count !== q.correct.length;
}

function renderFeedback(q) {
  const visible = session.config.showAnswers && (session.status === 'submitted' || session.finalized.includes(q.id));
  $('feedback').hidden = !visible; $('feedback').replaceChildren();
  if (!visible) return;
  const row = grade(session, exam, bank).rows.find(r => r.id === q.id);
  $('feedback').append(node('h3', {}, row.correct ? 'Correct' : row.answered ? 'Incorrect' : 'Unanswered'));
  const correct = session.choiceOrder[q.id].filter(id => q.correct.includes(id)).map(id => {
    const index = session.choiceOrder[q.id].indexOf(id); return `${String.fromCharCode(65 + index)}. ${q.choices.find(c => c.id === id).text}`;
  });
  $('feedback').append(node('p', {}, `Correct answer${correct.length > 1 ? 's' : ''}: ${correct.join('; ')}`));
  if (session.status === 'submitted') $('feedback').append(node('p', { class: 'muted' }, `${q.domain} ${exam.domains.find(d => d.id === q.domain).name} · Objectives: ${q.objectives.join(', ')}`));
  if (!session.config.showExplanations) return;
  $('feedback').append(node('h3', {}, 'Why this answer fits'), node('p', {}, q.explanation));
  for (const [index, id] of session.choiceOrder[q.id].entries()) {
    const choice = q.choices.find(c => c.id === id);
    $('feedback').append(node('div', { class: 'rationale' }, node('strong', {}, `${String.fromCharCode(65 + index)}. ${choice.text}${q.correct.includes(id) ? ' (Correct)' : ''}`), node('p', {}, choice.explanation)));
  }
  if (q.resources.length) $('feedback').append(node('h3', {}, 'Continue learning'), node('ul', {}, ...q.resources.map(resource => node('li', {}, node('a', { href: resourceURL(resource.path, docsBase), target: '_blank', rel: 'noopener' }, resource.title)))));
}

function scoreTable(title, rows, name) {
  const table = node('table', {}, node('caption', {}, title), node('thead', {}, node('tr', {}, ...['Area', 'Correct', 'Incorrect', 'Unanswered', 'Total'].map(label => node('th', { scope: 'col' }, label)))),
    node('tbody', {}, ...rows.map(row => node('tr', {}, node('th', { scope: 'row' }, name(row)), ...[row.correct, row.incorrect, row.unanswered, row.total].map(n => node('td', {}, String(n)))))));
  return node('div', { class: 'table-scroll', tabindex: '0', 'aria-label': title }, table);
}

function renderResults() {
  const score = grade(session, exam, bank);
  $('results').replaceChildren(node('h2', { id: 'results-title', tabindex: '-1' }, 'Practice results'), node('p', { class: 'score' }, `${score.percentage}%`),
    node('p', {}, `${score.correct} correct · ${score.incorrect} incorrect · ${score.unanswered} unanswered · ${score.total} total`),
    node('p', { class: 'muted' }, 'Each question is worth one point. Multiple-response questions require the entire correct set; no partial credit is awarded. This is a practice percentage, not a CompTIA scaled score.'),
    scoreTable('Performance by domain', score.domains, row => `${row.id} ${row.name}`),
    scoreTable('Performance by objective', score.objectives, row => `${row.id} ${row.name}`),
    node('p', { class: 'muted' }, 'Use missed questions to guide further study. This small sample cannot establish mastery of a domain. Objectives without sampled questions are not assessed.'));
  const missed = score.domains.filter(d => d.correct < d.total).map(d => d.name);
  if (missed.length) $('results').append(node('p', {}, `Areas to revisit in this test: ${missed.join(', ')}.`));
  const flagged = session.questionIds.map((id, index) => session.flags.includes(id) ? index + 1 : null).filter(Boolean);
  $('results').append(node('p', {}, `Flagged for review: ${flagged.length ? flagged.join(', ') : 'none'}. All ${score.total} questions are available in the question navigator below.`));
  if (!session.config.showAnswers) $('results').append(node('p', { class: 'muted' }, 'Correct answers and explanations are hidden by your selected settings. Review shows your submitted selections.'));
  else if (!session.config.showExplanations) $('results').append(node('p', { class: 'muted' }, 'Correct answers are available in review. Explanations are hidden by your selected settings.'));
}

function confirmAction(title, message, label, callback) {
  $('confirmation-title').textContent = title; $('confirmation-text').textContent = message; $('confirm-action').textContent = label;
  pendingAction = callback; $('confirmation').showModal(); $('cancel-action').focus();
}

$('theme-toggle').addEventListener('click', () => {
  const dark = document.body.dataset.mdColorScheme !== 'slate';
  document.body.dataset.mdColorScheme = dark ? 'slate' : 'default';
  $('theme-toggle').setAttribute('aria-pressed', String(dark)); $('theme-toggle').textContent = dark ? 'Light theme' : 'Dark theme';
});
$('cancel-action').addEventListener('click', () => { pendingAction = null; $('confirmation').close(); });
$('confirmation').addEventListener('cancel', () => { pendingAction = null; });
$('confirmation').addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const first = $('cancel-action'), last = $('confirm-action');
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
$('confirm-action').addEventListener('click', () => { const callback = pendingAction; pendingAction = null; $('confirmation').close(); callback?.(); });
$('select-all').addEventListener('click', () => { for (const input of domainInputs.values()) input.checked = !input.disabled; for (const [id, input] of objectiveInputs) input.checked = bank.questions.some(q => q.objectives.includes(id)); updateConfiguration(); });
$('select-none').addEventListener('click', () => { for (const input of [...domainInputs.values(), ...objectiveInputs.values()]) input.checked = false; updateConfiguration(); });
for (const id of ['count-preset', 'custom-count', 'show-answers', 'show-explanations', 'feedback-timing']) $(id).addEventListener(id === 'custom-count' ? 'input' : 'change', updateConfiguration);
$('use-available').addEventListener('click', () => { $('count-preset').value = 'all'; updateConfiguration(); });
$('configuration').addEventListener('submit', event => {
  event.preventDefault(); const config = getConfig(), error = validateConfig(exam, bank, config);
  if (error) { $('config-error').textContent = error; return; }
  session = createSession(exam, bank, config); $('notice').textContent = ''; persist(); revealTest(); $('question-title').focus();
});
$('flag').addEventListener('click', () => { toggleFlag(session, session.questionIds[session.current]); persist(); renderNavigator(); });
$('previous').addEventListener('click', () => navigate(session.current - 1));
$('next').addEventListener('click', () => navigate(session.current + 1));
$('check-answer').addEventListener('click', () => {
  if (finalizeAnswer(session, session.questionIds[session.current])) { persist(); renderQuestion(); $('feedback').setAttribute('tabindex', '-1'); $('feedback').focus(); }
});
$('submit-test').addEventListener('click', () => {
  const unanswered = session.questionIds.filter(id => !session.answers[id]?.length).length;
  confirmAction('Submit this test?', `${unanswered ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered and will receive no credit. ` : ''}Submission locks all responses.`, 'Submit Test', () => {
    submit(session); persist(); revealTest(); $('results-title').focus();
  });
});
$('new-test').addEventListener('click', () => confirmAction('Start a new test?', 'This discards the current test. Your next test starts with a fresh session.', 'Start New Test', () => {
  session = null; persist(); $('exam').hidden = true; $('setup').hidden = false;
  $('results').replaceChildren(); $('feedback').replaceChildren(); $('notice').textContent = '';
  buildConfiguration(); $('setup-title').focus();
}));

async function loadCertification(id) {
  const item = certifications.find(cert => cert.id === id && cert.metadata && cert.bank);
  if (!item) throw new Error('This certification does not have a validated bank yet.');
  const read = async file => { const response = await fetch(new URL(file, dataBase)); if (!response.ok) throw new Error('Practice data could not be loaded.'); return response.json(); };
  [exam, bank] = await Promise.all([read(item.metadata), read(item.bank)]);
  const errors = validateBank(exam, bank);
  if (errors.length) throw new Error('The question bank did not pass validation.');
  $('certification-link').href = new URL(`certifications/comptia/${exam.id}/`, docsBase).href;
  $('certification-link').textContent = exam.title.replace('CompTIA ', '');
  buildConfiguration();
}

async function start() {
  const available = certifications.filter(cert => cert.metadata && cert.bank);
  $('certification').replaceChildren(...available.map(cert => node('option', { value: cert.id }, `${cert.title} (${cert.examVersion})`)));
  // Only implemented banks are selectable; future registry entries have no launch UI.
  await loadCertification(available[0].id);
  const saved = loadSession(storage, exam, bank);
  session = saved.session; $('notice').textContent = saved.notice;
  if (!saved.available) $('save-status').textContent = 'Saved progress is unavailable. Keep this tab open if browser storage is blocked.';
  $('setup').hidden = Boolean(session);
  if (session) revealTest();
  $('certification').addEventListener('change', async () => { try { await loadCertification($('certification').value); } catch (error) { $('notice').textContent = error.message; $('start-test').disabled = true; } });
}

start().catch(error => { $('notice').textContent = `${error.message} Reload the page to try again, or return to the Practice Tests overview.`; });
