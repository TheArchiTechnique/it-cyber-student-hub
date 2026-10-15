(function () {
  'use strict';
  const M = window.WindowsTroubleshooting, $ = id => document.getElementById(id);
  let state = M.fresh(), confirmKind = 'reset', returnFocus = null, historyIndex = 0;
  const drafts = ['', '', '', ''];
  try { const saved = localStorage.getItem(M.KEY); if (saved) state = M.restore(JSON.parse(saved)); } catch (_) { /* In-session use remains available. */ }
  const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function pc() { return state.pcs[state.selected]; }
  function save() {
    try { localStorage.setItem(M.KEY, JSON.stringify(state)); $('save-status').textContent = 'Progress saved in this browser.'; }
    catch (_) { $('save-status').textContent = 'Browser storage is unavailable. You can continue in this session.'; }
  }
  function resource(href, label) { const a = element('a', '', label); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function renderCards() {
    const s = M.scenario(state.seed);
    $('workstations').replaceChildren(...state.pcs.map((run, i) => {
      const ticket = M.ticket(s, i), button = element('button', 'workstation'); button.type = 'button'; button.dataset.pc = i;
      button.setAttribute('aria-pressed', String(state.selected === i)); button.setAttribute('aria-controls', 'ticket');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 56 56'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><rect x="6" y="7" width="43" height="30" rx="3"/><path d="M28 37v10m-12 0h24M12 14h31"/></g>';
      const text = element('span'); text.append(element('strong', '', `PC ${i + 1} · ${s.pcs[i].host}`), element('span', 'summary', ticket.title), element('span', 'pc-state', state.submitted ? 'Submitted' : `${Number(Boolean(run.cause)) + Number(Boolean(run.action))} of 2 findings selected`));
      button.append(svg, text);
      button.addEventListener('click', () => { drafts[state.selected] = $('command').value; state.selected = i; render(); save(); $('workstations').querySelector(`[data-pc="${i}"]`).focus(); });
      return button;
    }));
    $('progress').textContent = `${state.pcs.filter(p => p.cause && p.action).length} of 4 PCs have both findings${state.submitted ? ' · Submitted' : ''}`;
  }
  function entry(command, output) {
    const wrap = element('div', 'terminal-entry');
    if (command) wrap.append(element('div', 'terminal-prompt', 'C:\\> ' + command));
    wrap.append(element('pre', '', output)); return wrap;
  }
  function renderTranscript() {
    $('output').replaceChildren(entry('', 'Microsoft Windows [Version 10.0.26100]\nWindows Command Prompt simulation. Type HELP for supported syntax.'));
    for (const e of pc().transcript) $('output').append(entry(e.command, e.output));
    $('output').scrollTop = $('output').scrollHeight;
  }
  function options(key, group) {
    const select = $(key); select.replaceChildren(new Option('Select an option', ''));
    for (const id of pc().orders[key]) select.add(new Option(M.choices[group][key].find(c => c[0] === id)[1], id));
    select.value = pc()[key]; select.disabled = state.submitted;
  }
  function renderContext() {
    $('console-context').textContent = pc().elevated ? 'Administrator · simulated' : 'Standard console · simulated';
    $('system-controls').hidden = state.selected !== 3;
    $('elevate').textContent = pc().elevated ? 'Administrator console active' : 'Run as administrator (simulated)';
    $('elevate').disabled = pc().elevated || state.submitted;
    $('restart').hidden = !pc().scheduledDisk; $('restart').disabled = state.submitted;
    $('repair-status').textContent = pc().scheduledDisk ? 'Volume check scheduled. Repairs remain pending until the approved simulated restart.' : pc().diskRepaired ? 'The simulated restart and volume check completed. Verify with a new check.' : pc().pendingDisk ? 'The terminal is waiting for a Y or N response to the scheduling prompt.' : '';
    $('command').disabled = state.submitted; $('run').disabled = state.submitted;
  }
  function renderResults() {
    $('results').hidden = !state.submitted; $('results').replaceChildren();
    if (!state.submitted) return;
    const grade = M.grade(state), s = M.scenario(state.seed), heading = element('h2', '', 'Help-desk findings'); heading.id = 'score-title';
    $('results').append(heading, element('p', 'score', `${grade.score} / 12 points`), element('p', '', 'Points assess your investigation and recommendations. A selected recommendation does not mean the repair has been performed.'));
    const grid = element('div', 'review-grid');
    grid.append(...grade.rows.map((row, i) => {
      const group = M.ticket(s, i).group, run = state.pcs[i], feedback = M.feedback(state, i), card = element('article', `feedback${row.points === 3 ? ' good' : ''}`);
      const label = (key, value) => M.choices[group][key].find(c => c[0] === value)?.[1] || 'No selection';
      card.append(element('h3', '', `PC ${i + 1} · ${s.pcs[i].host} · ${row.points} / 3`));
      const list = element('ul');
      list.append(element('li', '', `Diagnostic evidence: ${row.diagnostic ? '1 / 1 · Relevant results gathered' : '0 / 1 · More diagnostic evidence needed'}`), element('li', '', `Diagnosis: ${row.cause ? '1 / 1' : '0 / 1'} · ${label('cause', run.cause)}`), element('li', '', `Remediation: ${row.action ? '1 / 1' : '0 / 1'} · ${label('action', run.action)}`));
      card.append(list);
      if (!row.cause) card.append(element('p', '', 'Supported diagnosis: ' + label('cause', row.expected)));
      if (!row.action) card.append(element('p', '', 'Appropriate remediation: ' + label('action', row.expected)));
      card.append(element('p', '', feedback.text));
      const link = element('p'); link.append(resource(feedback.ref, feedback.label)); card.append(link); return card;
    }));
    $('results').append(grid);
  }
  function render() {
    const s = M.scenario(state.seed), ticket = M.ticket(s, state.selected);
    renderCards();
    $('ticket-id').textContent = `WORKSTATION ${state.selected + 1} OF 4`;
    $('ticket-title').textContent = s.pcs[state.selected].host + ' · ' + ticket.title;
    $('symptom').textContent = ticket.symptom;
    $('facts').replaceChildren(...ticket.facts.map(f => element('li', '', f)));
    $('terminal-title').textContent = s.pcs[state.selected].host + ' · Command Prompt';
    options('cause', ticket.group); options('action', ticket.group);
    $('command').value = drafts[state.selected]; historyIndex = pc().history.length;
    renderTranscript(); renderContext(); renderResults();
    $('submit').hidden = state.submitted; $('retry').hidden = !state.submitted;
  }
  for (const key of ['cause', 'action']) $(key).addEventListener('change', () => { if (state.submitted) return; pc()[key] = $(key).value; renderCards(); save(); });
  $('terminal-form').addEventListener('submit', event => {
    event.preventDefault(); if (state.submitted) return;
    const input = $('command').value.trim(); if (!input) return;
    const output = M.execute(state, state.selected, input);
    if (input.toLowerCase() === 'cls' || pc().transcript.length === 32) renderTranscript();
    else { $('output').append(entry(input, output)); $('output').scrollTop = $('output').scrollHeight; }
    $('command').value = ''; drafts[state.selected] = ''; historyIndex = pc().history.length;
    renderContext(); save(); $('command').focus();
  });
  $('command').addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const history = pc().history;
    if (historyIndex === history.length) drafts[state.selected] = $('command').value;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    $('command').value = historyIndex === history.length ? drafts[state.selected] : history[historyIndex];
  });
  $('elevate').onclick = () => { if (state.submitted || state.selected !== 3) return; pc().elevated = true; renderContext(); save(); $('command').focus(); };
  $('restart').onclick = () => { if (M.restart(state, state.selected)) { renderTranscript(); renderContext(); save(); $('command').focus(); } };
  $('submit').onclick = () => { drafts[state.selected] = $('command').value; state.submitted = true; render(); save(); $('results').focus(); $('results').scrollIntoView({ block: 'start' }); };
  $('retry').onclick = () => { state.submitted = false; render(); save(); $('cause').focus(); };
  function confirm(kind) {
    confirmKind = kind; returnFocus = $(kind === 'reset' ? 'reset' : 'new-scenario');
    $('confirm-title').textContent = kind === 'reset' ? 'Reset this attempt?' : 'Start a new scenario?';
    $('confirm-description').textContent = kind === 'reset' ? 'Restore the same four tickets to their initial states, clear all findings and command history, and reshuffle choices.' : 'Replace all four tickets with new workstation details and fault variants. Current progress will be cleared.';
    $('confirm-action').textContent = kind === 'reset' ? 'Reset attempt' : 'New Scenario'; $('confirm').showModal(); $('keep').focus();
  }
  $('reset').onclick = () => confirm('reset'); $('new-scenario').onclick = () => confirm('new');
  $('keep').onclick = () => $('confirm').close();
  $('confirm-action').onclick = () => { state = confirmKind === 'reset' ? M.initial(state.seed, Math.floor(Math.random() * 1000000000)) : M.fresh(state); drafts.fill(''); $('confirm').close(); render(); save(); };
  $('confirm').addEventListener('close', () => returnFocus?.focus());
  function showTab(id, focus = false) {
    for (const name of ['activity', 'lesson']) { const active = name === id; $(name).hidden = !active; $(name + '-tab').setAttribute('aria-selected', String(active)); $(name + '-tab').tabIndex = active ? 0 : -1; }
    if (focus) $(id + '-tab').focus();
  }
  for (const [i, name] of ['activity', 'lesson'].entries()) {
    $(name + '-tab').onclick = () => showTab(name);
    $(name + '-tab').addEventListener('keydown', event => { let target; if (['ArrowLeft', 'ArrowRight'].includes(event.key)) target = 1 - i; if (event.key === 'Home') target = 0; if (event.key === 'End') target = 1; if (target !== undefined) { event.preventDefault(); showTab(['activity', 'lesson'][target], true); } });
  }
  render(); save();
})();
