import { node, link, panel, button } from './ui.mjs';
import { matches, reviewTargets, readinessOutcome } from './progress.mjs';

const hubURL = path => new URL(document.body.dataset.hub + path, document.baseURI);
const latest = state => state.records?.at(-1);

function field(form, key, title, options) {
  const label = node('label', title, 'cap-field');
  const control = node(options ? 'select' : 'textarea');
  if (options) {
    control.add(new Option('Choose an answer', ''));
    for (const [value, text] of options) control.add(new Option(text, value));
  }
  control.name = key;
  control.required = true;
  label.append(control);
  form.append(label);
  return control;
}

function check(parent, key, value, title) {
  const control = node('input');
  control.type = 'checkbox';
  control.name = key;
  control.value = value;
  const label = node('label', undefined, 'cap-check');
  label.append(control, ' ', title);
  parent.append(label);
  return control;
}

function listChecks(form, title, key, entries) {
  const group = node('fieldset');
  group.append(node('legend', title));
  for (const [id, label] of entries) check(group, key, id, label);
  form.append(group);
}

function objectiveChoices(form, plan, title) {
  const details = node('details');
  details.append(node('summary', title));
  for (const group of plan.domains) {
    const objectives = Object.values(plan.objectives).filter(o => o.domain === group.id);
    listChecks(details, group.name, 'objectives', objectives.map(o => [o.id, o.id + ' ' + o.name]));
  }
  form.append(details);
}

function practiceOptions(plan, readiness) {
  return Object.keys(readiness.practicals).map(key => [key, plan.resources[key][0]]);
}

async function completedExam(plan) {
  const [{ certifications }, { grade, loadSession }] = await Promise.all([
    import('../practice-tests/registry.mjs'), import('../practice-tests/engine.mjs')
  ]);
  const version = certifications.find(c => c.examVersion === plan.exam && c.bank);
  if (!version) return null;
  const [exam, bank] = await Promise.all([version.metadata, version.bank].map(async path => {
    const response = await fetch(hubURL('assets/data/practice-tests/' + path));
    if (!response.ok) throw Error('Practice data unavailable');
    return response.json();
  }));
  const { session } = loadSession(localStorage, exam, bank);
  if (session?.config.mode !== 'certification' || session.status !== 'submitted') return null;
  return { id: session.id, score: grade(session, exam, bank) };
}

function rehearsalForm(form, session, context, save, refresh) {
  const { plan, sessions, read } = context;
  for (const instruction of session.instructions) form.append(node('p', instruction));
  const launch = link('Open Core 2 practice exam (new tab)', hubURL(session.examPath));
  launch.target = '_blank';
  launch.rel = 'noopener';
  form.append(launch, node('h3', 'Error analysis · ' + session.minutes.analysis + ' minutes'),
    node('p', 'Copy the percentage from your submitted results, or import the latest completed Certification Mode attempt from this browser. Select the domains and objectives you want to revisit. You can adjust imported selections.'));
  const notice = node('p');
  notice.setAttribute('role', 'status');
  const load = button('Import completed exam result', async () => {
    load.disabled = true;
    try {
      const result = await completedExam(plan);
      if (!load.isConnected) return;
      if (!result) {
        notice.textContent = 'No completed Core 2 Certification Mode result is available here. Finish the timed exam or enter your result below.';
      } else if (read(13).records?.some(entry => entry.examId === result.id)) {
        notice.textContent = 'This exam is already recorded. Complete a new timed attempt to import another result.';
      } else {
        const { score } = result;
        save(draft => Object.assign(draft, {
          examId: result.id, percentage: String(score.percentage),
          domains: score.domains.filter(row => row.correct < row.total).map(row => row.id),
          objectives: score.objectives.filter(row => row.correct < row.total).map(row => row.id)
        }));
        refresh();
        notice.textContent = 'Imported ' + score.percentage + '%. Review the suggested areas and complete your reflection.';
      }
    } catch { notice.textContent = 'The saved result could not be read. Enter the percentage shown in your exam results.'; }
    finally { load.disabled = false; }
  });
  form.append(load, notice);
  check(form, 'examDone', 'yes', 'I completed the timed Core 2 Certification Mode exam.').required = true;
  const label = node('label', 'Practice exam percentage (0–100)', 'cap-field');
  const score = node('input');
  Object.assign(score, { type: 'number', name: 'percentage', min: '0', max: '100', step: '1', required: true });
  label.append(score);
  form.append(label);
  listChecks(form, 'Domains to revisit', 'domains', plan.domains.map(d => [d.id, d.name + ' · ' + d.weight + '%']));
  objectiveChoices(form, plan, 'Select missed objectives, if identifiable');
  form.append(node('p', 'Record three priorities. If you had fewer than three misses, use uncertain answers or skills to verify.'));
  for (const n of [1, 2, 3]) field(form, 'priority' + n, 'Review priority ' + n);
  listChecks(form, 'Which difficulties did you observe? Choose the PBQ reason only for a separate practical exercise.', 'causes', session.causes.map(c => [c, c]));
  field(form, 'reason', 'Which clue changed your answer, and what would you do in a similar scenario?');
  field(form, 'resources', 'Which learning resources will you revisit, and what will you use them to check?');
  field(form, 'practice', 'Practical exercise to retry', practiceOptions(plan, sessions.get(14)));
}

function recallLinks(section, targets, context) {
  const { plan, sessions, read, route, reading } = context;
  const fallback = targets[0].reasons.includes('Balanced review');
  section.append(node('p', fallback
    ? 'No weak areas have been recorded. Sample one objective from each domain. Recall a principle from memory and check it against the objective breakdown.'
    : 'Start with objectives supported by several signals, then exam selections. Domain weight breaks ties. Explain a missed decision from memory before checking the answer.'));
  for (const { id, reasons } of targets) {
    const item = node('details', undefined, 'item');
    item.append(node('summary', id + ' ' + plan.objectives[id].name + ' · ' + reasons.join(', ')), reading(id));
    for (const day of plan.days.filter(d => d.objectives.includes(id))) {
      const source = sessions.get(day.number);
      if (!source || source.type) continue;
      const state = read(day.number);
      const row = node('p', 'Day ' + day.number + ' · ');
      for (const [kind, label] of [['cards', 'Flashcards'], ['quiz', 'Quiz'], ['worksheet', 'Worksheet']]) {
        const items = source[kind].filter(i => i.objective === id);
        const target = items.find(i => kind === 'cards' && state.cards[i.id] === 'review' ||
          kind === 'quiz' && state.lastQuiz && !matches(i, state.lastQuiz[i.id] || '')) || items[0];
        if (target) row.append(link(label, route(day.number, kind, target.id)), ' ');
      }
      item.append(row);
    }
    section.append(item);
  }
}

function readinessForm(form, session, context, rehearsal) {
  const { plan, sessions, read, route } = context;
  if (rehearsal) {
    form.append(node('p', 'Latest rehearsal: ' + rehearsal.percentage + '%. Your priorities: ' +
      [rehearsal.priority1, rehearsal.priority2, rehearsal.priority3].join(' · ')),
      node('p', 'Resources you chose: ' + rehearsal.resources));
  } else form.append(link('Record a timed rehearsal on Day 13', route(13)));
  const targets = reviewTargets(plan, sessions, read, rehearsal, session.balanced);
  recallLinks(form, targets, context);
  field(form, 'recall', 'Which objective did you revisit, and what could you explain without notes?');
  form.append(node('h3', 'Practical troubleshooting · ' + session.minutes.practical + ' minutes'),
    node('p', 'Complete one exercise. Identify the evidence, choose the next action and explain why an alternative would be unnecessary.'));
  const options = practiceOptions(plan, session);
  const recommended = [];
  if (rehearsal && Object.hasOwn(session.practicals, rehearsal.practice)) recommended.push(rehearsal.practice);
  for (const target of targets) {
    for (const [key, objectives] of Object.entries(session.practicals)) {
      if (objectives.includes(target.id) && !recommended.includes(key)) recommended.push(key);
    }
  }
  const list = node('ul');
  const ordered = [...new Set([...recommended, ...options.map(([key]) => key)])];
  for (const key of ordered) {
    const li = node('li');
    li.append(link(plan.resources[key][0], hubURL(plan.resources[key][1])));
    if (key === rehearsal?.practice) li.append(' · Your Day 13 choice');
    else if (recommended.includes(key)) li.append(' · Matches a review topic');
    list.append(li);
  }
  form.append(list);
  field(form, 'practice', 'Exercise completed', options);
  field(form, 'independence', 'How did you solve it?', ['Independently', 'With guidance', 'Completed using a walkthrough'].map(v => [v, v]));
  field(form, 'evidence', 'What evidence did you use, what did you try, and what result did you observe?');
  form.append(node('h3', 'Exam-readiness review · ' + session.minutes.decision + ' minutes'), link('Official Core 2 exam objectives', plan.source),
    node('p', 'Use your rehearsal and practical evidence for each answer. For appointment and ID requirements, check your booking confirmation and testing provider instructions.'),
    node('p', 'A missing rehearsal score or a score below 50% triggers further review in the Hub. Reaching 50% alone establishes no readiness level. The ready recommendation also requires independent practical work, demonstrated skills on every checklist item and no objectives you identify as unresolved in this final review. CompTIA reports a passing score of 700 on a 100–900 scale. There is no direct conversion from this practice percentage.'));
  for (const [group, questions] of Object.entries(session.checks)) {
    const set = node('fieldset');
    set.append(node('legend', group));
    for (const [key, prompt] of Object.entries(questions)) {
      field(set, key, prompt, ['Demonstrated', 'Needs practice', 'Needs work'].map(v => [v, v]));
    }
    form.append(set);
  }
  objectiveChoices(form, plan, 'Select any objectives that still need work after this review');
  field(form, 'next', 'What will you do next, when, and how will you verify improvement or confirm your exam arrangements?');
}

function history(section, records, session, plan) {
  const labels = {
    domains: 'Domains to revisit', objectives: 'Objectives to revisit', priority1: 'First priority',
    priority2: 'Second priority', priority3: 'Third priority', causes: 'Reasons for mistakes',
    reason: 'Evidence and reasoning', resources: 'Resources to revisit', practice: 'Practical exercise',
    recall: 'Recall evidence', independence: 'Level of assistance', evidence: 'Practical result', next: 'Next study or exam step',
    ...Object.assign({}, ...Object.values(session.checks || {}))
  };
  records.forEach((record, i) => {
    const detail = node('details', undefined, 'item');
    const result = session.type === 'rehearsal' ? record.percentage + '%' : record.outcome;
    detail.append(node('summary', 'Attempt ' + (i + 1) + ' · ' + result + ' · ' + new Date(record.savedAt).toLocaleDateString()));
    if (record.rehearsalNumber) detail.append(node('p', 'Based on rehearsal ' + record.rehearsalNumber + ' (' + record.rehearsalPercentage + '%).'));
    const terms = node('dl');
    for (const [key, label] of Object.entries(labels)) {
      if (!(key in record)) continue;
      let value = record[key];
      if (Array.isArray(value)) value = value.join(', ') || 'None selected';
      if (key === 'practice') value = plan.resources[value]?.[0] || value;
      terms.append(node('dt', label), node('dd', value));
    }
    detail.append(terms);
    section.append(detail);
  });
}

export function renderCapstone(day, session, context) {
  const { plan, view, read, change, route, render } = context;
  const isExam = session.type === 'rehearsal';
  const state = read(day.number);
  const records = state.records || [];
  const rehearsal = latest(read(13));
  const section = panel(isExam ? 'Timed certification simulation · ' + session.minutes.exam + ' minutes' : 'Weak-area recall · ' + session.minutes.recall + ' minutes');
  section.classList.add('capstone');
  section.append(node('p', day.minutes + ' minutes · ' + day.goal));
  const recent = records.at(-1);
  if (recent) {
    section.append(node('h3', isExam ? 'Saved exam reviews' : 'Saved readiness reviews'));
    if (!isExam) {
      section.append(node('p', recent.outcome, 'status'),
        node('p', 'This advisory reflects the evidence you recorded for this attempt. Use it to plan your next study session or exam arrangements.'),
        node('p', recent.outcome === 'Significant objective gaps remain'
          ? 'Choose one unresolved skill, revisit its study day, then apply it to a new scenario before your next rehearsal.'
          : recent.outcome === 'Additional targeted review recommended'
            ? 'Revisit the areas you marked, complete a practical task independently and repeat the review with your latest timed result.'
            : 'Confirm the exam code, appointment and testing requirements with your provider.'),
        node('p', 'Your next step: ' + recent.next));
      if (recent.rehearsalNumber !== (read(13).records?.length || 0)) {
        section.append(node('p', 'A newer rehearsal is available. Repeat the readiness review to assess that attempt.'));
      }
    }
    history(section, records, session, plan);
  }
  if (recent && !state.capstoneDraft) {
    section.append(button(isExam ? 'Record another exam attempt' : 'Repeat readiness review', () => {
      change(day.number, s => { s.capstoneDraft ??= {}; });
      render('heading');
    }));
    if (!isExam) recallLinks(section, reviewTargets(plan, context.sessions, read, rehearsal, session.balanced), context);
  } else {
    const form = node('form');
    const save = edit => change(day.number, s => {
      if ((s.records?.length || 0) !== records.length) return;
      s.capstoneDraft ??= {};
      edit(s.capstoneDraft);
    });
    const refresh = () => {
      const draft = read(day.number).capstoneDraft || {};
      for (const control of form.elements) {
        if (!control.name) continue;
        const value = draft[control.name];
        if (control.type === 'checkbox') control.checked = control.name === 'examDone' ? Boolean(value) : Boolean(value?.includes(control.value));
        else control.value = value ?? '';
      }
    };
    if (isExam) rehearsalForm(form, session, context, save, refresh);
    else readinessForm(form, session, context, rehearsal);
    refresh();
    form.addEventListener('input', event => {
      const c = event.target;
      if (!c.name) return;
      c.setCustomValidity('');
      if (c.name === 'causes') {
        const causes = [...form.querySelectorAll('input[name=causes]')];
        const none = causes.at(-1);
        causes[0].setCustomValidity('');
        if (c.checked && c === none) causes.slice(0, -1).forEach(box => { box.checked = false; });
        else if (c.checked) none.checked = false;
      }
      save(draft => {
        if (c.name === 'causes') {
          draft.causes = [...form.querySelectorAll('input[name=causes]:checked')].map(box => box.value);
        } else if (c.type === 'checkbox' && c.name !== 'examDone') {
          const selected = new Set(draft[c.name]);
          if (c.checked) selected.add(c.value);
          else selected.delete(c.value);
          draft[c.name] = [...selected];
        } else draft[c.name] = c.type === 'checkbox' ? c.checked : c.value;
      });
    });
    const submit = node('button', isExam ? 'Save exam review' : 'Save readiness review', 'primary');
    submit.type = 'submit';
    form.append(submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      for (const control of form.querySelectorAll('textarea')) {
        if (control.value.trim()) continue;
        control.setCustomValidity('Enter a response.');
        control.reportValidity();
        return;
      }
      if (isExam && !form.querySelector('input[name=causes]:checked')) {
        const first = form.querySelector('input[name=causes]');
        first.setCustomValidity('Select a reason or indicate that no errors were identified.');
        first.reportValidity();
        return;
      }
      change(day.number, s => {
        if (!s.capstoneDraft || (s.records?.length || 0) !== records.length) return;
        const record = { ...s.capstoneDraft, savedAt: new Date().toISOString() };
        if (!isExam) {
          record.rehearsalNumber = read(13).records?.length || 0;
          record.rehearsalPercentage = rehearsal?.percentage;
          record.outcome = readinessOutcome(session.checks, record, rehearsal);
        }
        s.records = [...(s.records || []), record];
        delete s.capstoneDraft;
      });
      render('heading');
    });
    section.append(form);
  }
  view.append(section, link(isExam ? 'Continue to Day 14' : 'Return to Day 13 exam review', route(isExam ? 14 : 13)),
    link('Return to study calendar', '#calendar'));
}
