import { hubURL, node, link, button, panel } from './ui.mjs';
import { renderCapstone } from './capstone.mjs';
import { freshDay, storageKey, matches, cardOrder, summary } from './progress.mjs';

const view = document.querySelector('#view');
const heading = document.querySelector('#heading');
const paper = document.querySelector('#print-sheet');
const planURL = new URL(document.body.dataset.plan, document.baseURI);
const activities = { review: 'Topic review', cards: 'Flashcards', quiz: 'Recall quiz', worksheet: 'Worksheet' };
const sessions = new Map();
const memory = new Map();
// Keep the original stored value so retrying a failed write cannot overwrite a newer tab.
const unsavedDays = new Map();
let plan;
let printMode = 'blank';

function route(day, activity = 'review', id = '') {
  return '#day-' + day + '/' + activity + (id ? '/' + id : '');
}
function warning() {
  document.querySelector('#storage-note').textContent = 'Browser storage is unavailable. Progress is available in this tab until you reload or leave.';
}
function read(day) {
  if (memory.has(day)) return memory.get(day);
  let data = freshDay();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(plan, day)));
    if (saved) data = { ...data, ...saved };
  } catch { warning(); }
  memory.set(day, data);
  return data;
}
// Merge each edit into the latest saved day so independent edits in other tabs survive.
function change(day, edit) {
  const key = storageKey(plan, day);
  let state = read(day);
  let stored;
  try {
    stored = localStorage.getItem(key);
    if (!unsavedDays.has(day)) state = { ...freshDay(), ...JSON.parse(stored) };
  } catch { warning(); }
  edit(state);
  memory.set(day, state);
  if (unsavedDays.has(day) && unsavedDays.get(day) !== stored) return state;
  try {
    localStorage.setItem(key, JSON.stringify(state));
    unsavedDays.delete(day);
  } catch {
    unsavedDays.set(day, stored);
    warning();
  }
  return state;
}
function reading(id) {
  const objective = plan.objectives[id];
  return link(id + ' ' + objective.name, objective.reading);
}
function resourceLinks(day) {
  const list = node('ul', undefined, 'topic-list');
  for (const key of day.resources) {
    const [name, path] = plan.resources[key];
    const li = node('li');
    li.append(link(name, hubURL(path)));
    list.append(li);
  }
  return list;
}
function objectivesLabel(day) {
  return day.objectives.length === Object.keys(plan.objectives).length
    ? 'All ' + day.objectives.length + ' objectives across all domains'
    : 'Objectives ' + day.objectives.join(', ');
}
function coverage() {
  const map = node('details', undefined, 'panel coverage');
  map.append(node('summary', 'Objective coverage map'));
  for (const domain of plan.domains) {
    map.append(node('h3', domain.name + ' · ' + domain.weight + '%'));
    for (const obj of Object.values(plan.objectives).filter(o => o.domain === domain.id)) {
      const detail = node('details');
      detail.append(node('summary', obj.id + ' ' + obj.name), node('p', obj.skill + ' · ' + obj.workload + ' workload'), node('p', obj.scope), reading(obj.id));
      for (const day of plan.days.filter(d => d.objectives.includes(obj.id))) {
        const line = node('p');
        line.append('Day ' + day.number + ' · ' + day.title + '. ');
        const session = sessions.get(day.number);
        if (session?.type) line.append(link(day.title, route(day.number)));
        else if (session) {
          for (const kind of ['cards', 'quiz', 'worksheet']) {
            const items = session[kind].filter(item => item.objective === obj.id);
            if (items.length) line.append(link(activities[kind] + ' (' + items.length + ')', route(day.number, kind, items[0].id)), ' ');
          }
        } else line.append('Scheduled only.');
        detail.append(line);
      }
      map.append(detail);
    }
  }
  return map;
}
function calendar() {
  heading.textContent = '14-Day Study Plan';
  const intro = panel('Study calendar');
  const completed = [...sessions].filter(([day, session]) => summary(session, read(day)).status === 'Completed').length;
  const flagged = new Set([...sessions].flatMap(([day, session]) => summary(session, read(day)).flags));
  intro.append(node('p', 'Use this two-week review after coursework. Start with the objectives, recall each topic without notes, then apply it to a support decision.'),
    node('p', completed + ' of ' + plan.days.length + ' days completed · ' + sessions.size + ' interactive sessions available', 'status'),
    node('p', flagged.size ? 'Objectives to revisit: ' + [...flagged].join(', ') : 'Your quiz misses, unfamiliar cards and flagged objectives will appear here.'),
    link('Official objectives · document ' + plan.revision, plan.source));
  const grid = node('div', undefined, 'plan-grid');
  for (const day of plan.days) {
    const session = sessions.get(day.number);
    const section = node('article', undefined, 'panel');
    section.append(node('p', 'Day ' + day.number + ' · ' + day.minutes + ' min', 'eyebrow'), node('h2', day.title),
      node('p', objectivesLabel(day), 'muted'), node('p', day.goal), node('p', day.recall));
    if (session) {
      section.append(node('p', summary(session, read(day.number)).status, 'status'),
        node('p', session.type === 'rehearsal' ? 'Timed exam · Error analysis' : session.type === 'readiness' ? 'Targeted recall · Practical exercise · Readiness review' : 'Topic review · Flashcards · Recall quiz · Worksheet', 'muted'));
      const open = link('Open Day ' + day.number, route(day.number));
      open.className = 'open';
      section.append(open);
    } else {
      section.append(node('p', 'Not started · Scheduled only', 'muted'));
      const related = node('details');
      related.append(node('summary', 'Related Hub resources'), resourceLinks(day));
      section.append(related);
    }
    grid.append(section);
  }
  view.append(intro, grid, coverage());
}
function reviewDay(day, session) {
  const section = panel('Review the objectives');
  for (const item of session.review) {
    section.append(node('h3', item.title), node('p', item.text), reading(item.objective), node('hr'));
  }
  const mark = button(read(day.number).read ? 'Mark review unread' : 'Mark review complete', () => {
    change(day.number, s => { s.read = !s.read; });
    render('read-toggle');
  });
  mark.id = 'read-toggle';
  section.append(mark);
  const references = panel('Readings and optional practice');
  references.append(resourceLinks(day));
  for (const [name, url] of session.sources) references.append(link(name, url), node('br'));
  view.append(section, references);
}
function flashcards(day, session, target) {
  const section = panel('Flashcards');
  const body = node('div');
  const queue = cardOrder(session.cards, read(day.number).cards);
  let index = Math.max(0, queue.findIndex(card => card.id === target));
  function show(focus = false) {
    const card = queue[index];
    const marks = read(day.number).cards;
    const known = Object.values(marks).filter(value => value === 'known').length;
    body.replaceChildren();
    const prompt = node('h3', card.prompt);
    prompt.tabIndex = -1;
    const face = node('div', undefined, 'card-face');
    const state = { known: 'Known', review: 'Needs review' }[marks[card.id]] || 'Unrated';
    face.append(node('p', 'Card ' + (index + 1) + ' of ' + queue.length + ' · Objective ' + card.objective + ' · ' + state, 'muted'), prompt);
    const controls = node('div', undefined, 'inline-controls');
    const advance = () => {
      index = (index + 1) % queue.length;
      if (!index) queue.splice(0, queue.length, ...cardOrder(session.cards, read(day.number).cards));
      show(true);
    };
    const reveal = button('Reveal answer', () => {
      const answer = node('p', card.answer);
      answer.tabIndex = -1;
      face.append(answer);
      controls.replaceChildren();
      for (const [label, value] of [['Needs review', 'review'], ['Known', 'known']]) {
        controls.append(button(label, () => {
          change(day.number, s => { s.cards[card.id] = value; });
          progress(day, session);
          advance();
        }));
      }
      controls.append(button('Next card', advance));
      answer.focus();
    });
    controls.append(reveal, button('Next card', advance));
    body.append(node('p', known + ' of ' + queue.length + ' known. Each round begins with cards marked for review.'), face, controls);
    if (focus) prompt.focus();
  }
  section.append(body);
  view.append(section);
  show();
}
function quiz(day, session) {
  const state = read(day.number);
  const locked = Boolean(state.lastQuiz) && !state.retry;
  const section = panel('Fill-in-the-blank quiz');
  const form = node('form');
  section.append(node('p', 'Enter a response for every blank, then check your answers.'));
  if (state.lastQuiz) {
    const score = node('p', 'Last attempt: ' + summary(session, state).score + ' / ' + session.quiz.length, 'status');
    score.id = 'quiz-score';
    score.tabIndex = -1;
    section.append(score);
  }
  for (const [index, q] of session.quiz.entries()) {
    const item = node('div', undefined, 'item');
    const input = node('input');
    input.id = 'answer-' + q.id;
    input.required = true;
    input.pattern = '.*\\S.*';
    input.readOnly = locked;
    input.value = (locked ? state.lastQuiz : state.drafts)[q.id] || '';
    input.addEventListener('input', () => {
      change(day.number, s => { s.drafts[q.id] = input.value; });
      progress(day, session);
    });
    const label = node('label', (index + 1) + '. ' + q.prompt);
    label.htmlFor = input.id;
    item.append(node('span', 'Objective ' + q.objective, 'muted'), label, input);
    if (locked) {
      const verdict = matches(q, input.value) ? 'Correct. ' : 'Review this answer. ';
      const feedback = node('p', verdict + q.answers[0] + '. ' + q.explanation, 'feedback');
      feedback.id = 'feedback-' + q.id;
      input.setAttribute('aria-describedby', feedback.id);
      item.append(feedback);
    }
    form.append(item);
  }
  if (locked) {
    const retry = button('Retry quiz', () => {
      change(day.number, s => { s.retry = true; s.drafts = {}; });
      render('answer-' + session.quiz[0].id);
    });
    retry.id = 'quiz-result';
    form.append(retry);
  } else {
    const submit = node('button', 'Check answers', 'primary');
    submit.type = 'submit';
    form.append(submit);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (locked) return;
    const answers = Object.fromEntries(session.quiz.map(q => [q.id, form.querySelector('#answer-' + q.id).value]));
    change(day.number, s => { s.lastQuiz = answers; s.retry = false; });
    render('quiz-score');
  });
  section.append(form);
  view.append(section);
}
function preparePrint(day, session, mode) {
  paper.replaceChildren(node('h1', plan.certification + ' · Day ' + day.number), node('p', day.title + ' · Student worksheet'));
  for (const [i, task] of session.worksheet.entries()) {
    const item = node('section', undefined, 'print-item');
    item.append(node('h2', (i + 1) + '. ' + task.prompt), node('p', 'Objective ' + task.objective),
      mode === 'answers' ? node('p', read(day.number).responses[task.id] || ' ', 'printed-answer') : node('div', undefined, 'write-space'));
    paper.append(item);
  }
}
function worksheet(day, session) {
  const state = read(day.number);
  const section = panel('Student worksheet');
  section.append(node('p', 'Write your answers, then compare them with the key. Flag any objective you need to revisit.'));
  const tools = node('div', undefined, 'inline-controls');
  for (const [label, mode] of [['Print blank worksheet', 'blank'], ['Print my responses', 'answers']]) {
    tools.append(button(label, () => {
      printMode = mode;
      preparePrint(day, session, mode);
      window.print();
    }));
  }
  section.append(tools);
  const form = node('form');
  for (const [i, task] of session.worksheet.entries()) {
    const item = node('div', undefined, 'item');
    const input = node('textarea');
    input.id = 'answer-' + task.id;
    input.value = state.responses[task.id] || '';
    input.required = true;
    input.readOnly = state.reviewed;
    const label = node('label', (i + 1) + '. ' + task.prompt);
    label.htmlFor = input.id;
    input.addEventListener('input', () => {
      input.setCustomValidity(input.value.trim() ? '' : 'Enter a response.');
      change(day.number, s => { s.responses[task.id] = input.value; });
      progress(day, session);
    });
    const source = session.sources.find(([name]) => name === task.source);
    const hint = node('p', undefined, 'muted');
    if (source) hint.append(link(source[0], source[1]));
    else hint.textContent = task.source;
    item.append(reading(task.objective), label, hint, input);
    if (state.reviewed) item.append(node('p', (task.type === 'Factual' ? 'Factual answer: ' : 'Example response: ') + task.key, 'feedback'));
    form.append(item);
  }
  if (state.reviewed) {
    const edit = button('Edit worksheet responses', () => {
      change(day.number, s => { s.reviewed = false; });
      render('answer-' + session.worksheet[0].id);
    });
    edit.id = 'worksheet-key';
    form.append(edit);
  } else {
    const submit = node('button', 'Complete worksheet and review key', 'primary');
    submit.type = 'submit';
    form.append(submit);
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    for (const input of form.querySelectorAll('textarea')) {
      if (!input.value.trim()) {
        input.setCustomValidity('Enter a response.');
        input.reportValidity();
        return;
      }
    }
    change(day.number, s => { s.reviewed = true; });
    render('worksheet-key');
  });
  section.append(form);
  view.append(section);
}
function progress(day, session) {
  const section = document.querySelector('#day-progress');
  const current = summary(session, read(day.number));
  section.replaceChildren(node('h2', 'Daily progress'), node('p', current.status + ' · ' + current.count + ' of 4 activities completed', 'status'));
  for (const [key, done] of Object.entries(current.activities)) {
    section.append(node('span', activities[key] + (done ? ' ✓' : ' ○') + '   '));
  }
  section.append(node('p', current.flags.length ? 'Revisit objectives ' + current.flags.join(', ') + '. Retry missed questions or rate reviewed cards again.' : 'You can flag an objective for another study session.'));
  for (const id of day.objectives) {
    const marked = Boolean(read(day.number).flags[id]);
    const flag = button((marked ? 'Clear my flag for ' : 'Flag ') + id, () => {
      change(day.number, s => { s.flags[id] = !s.flags[id]; });
      progress(day, session);
      document.getElementById('flag-' + id).focus();
    });
    flag.id = 'flag-' + id;
    flag.setAttribute('aria-pressed', String(marked));
    section.append(flag, ' ');
  }
  section.append(button('Reset this day', () => {
    if (!confirm('Erase all saved answers, ratings and progress for Day ' + day.number + '?')) return;
    change(day.number, s => Object.assign(s, freshDay()));
    render('heading');
  }));
}
function render(focusId) {
  paper.replaceChildren();
  view.replaceChildren();
  const parts = location.hash.match(/^#day-(\d+)\/(review|cards|quiz|worksheet)(?:\/([\w-]+))?$/);
  const day = parts && plan.days.find(d => d.number === Number(parts[1]));
  if (!day || !sessions.has(day.number)) {
    calendar();
  } else if (sessions.get(day.number).type) {
    heading.textContent = 'Day ' + day.number + ' · ' + day.title;
    renderCapstone(day, sessions.get(day.number), { plan, sessions, view, read, change, reading, route, render });
  } else {
    const [, , kind, target] = parts;
    const session = sessions.get(day.number);
    heading.textContent = 'Day ' + day.number + ' · ' + day.title;
    const overview = panel('Today’s objectives');
    overview.append(node('p', day.minutes + ' minutes · ' + day.goal));
    for (const id of day.objectives) overview.append(reading(id), node('br'));
    overview.append(node('p', day.recall));
    const m = session.minutes;
    overview.append(node('p', 'Suggested timing: reading ' + m.reading + ' min, flashcards ' + m.cards +
      ', quiz ' + m.quiz + ', worksheet ' + m.worksheet + ', then ' + m.application +
      ' min for practical review or weak topics.', 'muted'));
    const nav = node('nav', undefined, 'study-nav');
    nav.setAttribute('aria-label', 'Daily activities');
    for (const [key, label] of Object.entries(activities)) {
      const a = link(label, route(day.number, key));
      if (key === kind) a.setAttribute('aria-current', 'page');
      nav.append(a);
    }
    overview.append(nav);
    view.append(overview);
    ({ review: reviewDay, cards: flashcards, quiz, worksheet })[kind](day, session, target);
    const daily = node('section', undefined, 'panel');
    daily.id = 'day-progress';
    view.append(daily, link('Return to study calendar', '#calendar'));
    progress(day, session);
    if (target && (!focusId || focusId === 'heading') && ['quiz', 'worksheet'].includes(kind)) focusId = 'answer-' + target;
  }
  if (focusId) (document.getElementById(focusId) || heading).focus();
}
async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Study content unavailable');
  return response.json();
}
async function start() {
  plan = await json(planURL);
  await Promise.all(plan.days.filter(day => day.session).map(async day => {
    sessions.set(day.number, await json(new URL(day.session, planURL)));
  }));
  document.querySelector('#edition').textContent = plan.certification + ' · ' + plan.exam + ' · ' + plan.series;
  render();
  window.addEventListener('hashchange', () => render('heading'));
  window.addEventListener('storage', event => {
    const day = plan.days.find(d => storageKey(plan, d.number) === event.key);
    if (!day && event.key !== null) return;
    if (day && unsavedDays.has(day.number)) return;
    if (day) memory.delete(day.number);
    else for (const number of memory.keys()) if (!unsavedDays.has(number)) memory.delete(number);

    const active = Number(location.hash.match(/^#day-(\d+)/)?.[1]);
    if (!day || !active || active === day.number || sessions.get(active)?.type === 'readiness') render();
  });
  window.addEventListener('beforeprint', () => {
    const day = plan.days.find(d => location.hash.split('/')[0] === '#day-' + d.number);
    if (day && sessions.get(day.number)?.worksheet) preparePrint(day, sessions.get(day.number), printMode);
  });
  window.addEventListener('afterprint', () => {
    printMode = 'blank';
    paper.replaceChildren();
  });
}
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});
const theme = document.querySelector('#theme');
function setTheme(dark) {
  document.body.dataset.mdColorScheme = dark ? 'slate' : 'default';
  theme.setAttribute('aria-pressed', String(dark));
}
setTheme(matchMedia('(prefers-color-scheme: dark)').matches);
theme.addEventListener('click', () => setTheme(theme.getAttribute('aria-pressed') !== 'true'));
start().catch(() => { view.textContent = 'The study plan could not load. Refresh the page to try again.'; });
