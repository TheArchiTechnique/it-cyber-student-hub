(function () {
  'use strict';
  const M = window.CablingModel, A = window.CablingArt, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const e = A.esc;
  let state = M.fresh(), selected = null, storageOK = true;
  try { state = M.sanitize(JSON.parse(localStorage.getItem(M.KEY))); } catch { /* A new attempt also recovers unreadable saved data. */ }
  const say = message => { $('#status').textContent = message; };
  function save() {
    try { localStorage.setItem(M.KEY, JSON.stringify(state)); storageOK = true; }
    catch { storageOK = false; }
    $('#save-status').textContent = storageOK ? 'Progress is saved in this browser, including after refresh.' : 'Progress cannot be saved in this browser. Keep this page open to retain this attempt.';
  }
  function optionList(options) {
    return '<option value="">Choose an answer</option>' + Object.entries(options).sort((a,b) => a[1].localeCompare(b[1])).map(([id, name]) => `<option value="${e(id)}">${e(name)}</option>`).join('');
  }
  function answerSelect(id, label) {
    return `<label for="answer-${e(id)}">${e(label)}<select id="answer-${e(id)}" data-answer="${e(id)}">${optionList(M.byId[id].options)}</select></label>`;
  }
  function tray(selector, kind, items) {
    $(selector).innerHTML = Object.entries(items).map(([id, name]) => `<button class="pick" draggable="true" data-kind="${kind}" data-item="${e(id)}" aria-pressed="false">${kind === 'media' ? A.cable(id) : kind === 'component' && id !== 'ups' ? A.unit(id) : ''}<span>${e(name)}</span></button>`).join('');
  }
  function setTab(id, focus) {
    for (const tab of $$('.tabs [role=tab]')) {
      const active = tab.id === id;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      $('#' + tab.getAttribute('aria-controls')).hidden = !active;
      if (active && focus) tab.focus();
    }
  }
  function rack() {
    const room = M.rooms.find(r => r.id === state.room);
    $('#rack-title').textContent = room.name + ' rack';
    $('#room-note').textContent = room.note;
    $('#room-picker').value = room.id;
    $('#rack-units').innerHTML = room.bays.map((type, i) => {
      const id = room.id + '-' + i, label = 'Unit ' + 'ABC'[i];
      return `<div class="rack-unit"><button class="rack-target" data-target="${id}" aria-label="Place a component label on ${e(room.name)} ${label}">${A.unit(type)}<span>${label} · <span data-unit-label="${id}">Unidentified</span></span></button>${answerSelect(id, label + ' identification')}</div>`;
    }).join('') + '<svg id="rack-wires" aria-hidden="true"></svg>';
    requestAnimationFrame(rackWires);
  }
  function rackWires() {
    const host = $('#rack-units'), wires = $('#rack-wires');
    if (!wires || !host.clientWidth) return;
    const room = M.rooms.find(r => r.id === state.room), origin = host.getBoundingClientRect();
    const port = (type, x, y) => {
      const index = room.bays.indexOf(type), box = $(`[data-target="${room.id}-${index}"] svg`).getBoundingClientRect();
      return { x:box.left-origin.left-host.clientLeft+x*box.width/520, y:box.top-origin.top-host.clientTop+y*box.height/112 };
    };
    const a = port('copper',98,56), b = port('switch',156,56), c = port('fiber',77,52), d = port('switch',434,47);
    const path = (p,q,gutter) => `<path d="M${p.x} ${p.y}H${gutter}V${q.y}H${q.x}" fill="none" stroke="#526778" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    wires.setAttribute('viewBox',`0 0 ${host.clientWidth} ${host.clientHeight}`);
    wires.innerHTML = path(a,b,3) + path(c,d,6);
  }
  function render() {
    const done = Object.keys(state.answers).length;
    $('#progress').textContent = done + ' / ' + M.tasks.length + ' answered';
    for (const select of $$('[data-answer]')) {
      select.value = state.answers[select.dataset.answer] || '';
      select.disabled = state.submitted;
    }
    for (const room of M.rooms) {
      const target = $(`[data-room="${room.id}"]`), value = state.answers[room.id];
      target.textContent = value === 'mdf' ? 'MDF' : value === 'idf' ? 'IDF' : M.roomRoles[value] || 'Assign role';
      target.setAttribute('aria-label', room.name + ': ' + (M.roomRoles[value] || 'no role selected') + '. Inspect rack or place a room label.');
      target.setAttribute('aria-pressed', String(state.room === room.id));
      target.classList.toggle('filled', Boolean(value));
    }
    for (const route of M.routes) {
      const target = $(`#route-targets [data-target="${route.id}"]`), value = state.answers[route.id];
      target.textContent = route.id.toUpperCase() + ' · ' + (M.media[value] || 'Select media');
      target.classList.toggle('filled', Boolean(value));
      const line = $(`[data-route-line="${route.id}"]`);
      line.setAttribute('stroke-dasharray', value ? '' : '8 5');
    }
    for (const label of $$('[data-unit-label]')) label.textContent = M.components[state.answers[label.dataset.unitLabel]] || 'Unidentified';
    for (const label of $$('[data-cable-label]')) label.textContent = M.media[state.answers[label.dataset.cableLabel]] || 'Place selected cable here';
    for (const pick of $$('.pick')) {
      pick.setAttribute('aria-pressed', String(Boolean(selected && selected.kind === pick.dataset.kind && selected.value === pick.dataset.item)));
      pick.disabled = state.submitted;
      pick.draggable = !state.submitted;
    }
    for (const target of $$('[data-target]:not([data-room])')) target.disabled = state.submitted;
    $('#cancel-selection').disabled = !selected;
    $('#submit').disabled = state.submitted;
    $('#results').hidden = !state.submitted;
    save();
  }
  function choose(item) {
    if (state.submitted) return;
    selected = selected && selected.kind === item.kind && selected.value === item.value ? null : item;
    render();
    say(selected ? (item.kind === 'role' ? M.roomRoles[item.value] : item.kind === 'component' ? M.components[item.value] : M.media[item.value]) + ' selected. Choose a matching target. Escape cancels.' : 'Selection cancelled.');
  }
  function assign(id, value) {
    if (state.submitted) return;
    const task = M.byId[id];
    if (!task || (value && !Object.hasOwn(task.options, value))) { say('That item does not fit this target. Select a room label, rack component, or cable for the matching target.'); return; }
    if (value) state.answers[id] = value; else delete state.answers[id];
    selected = null;
    render();
    say(task.name + ': ' + (task.options[value] || 'answer cleared') + '.');
  }
  function target(id, item) {
    if (item && !state.submitted) assign(id, item.value);
    else if (!M.rooms.some(r => r.id === id) && !state.submitted) {
      const select = $(`[data-answer="${id}"]`);
      if (select) { select.scrollIntoView({block:'center'}); select.focus(); }
    }
    if (M.rooms.some(r => r.id === id)) { state.room = id; rack(); render(); }
  }
  function feedback(focus) {
    const result = M.grade(state), groups = [...new Set(M.tasks.map(t => t.group))];
    $('#results').innerHTML = `<div class="results-heading"><div class="score">${result.score} / ${result.total}</div><div><h2>${result.score === result.total ? 'Installation complete' : 'Installation review'}</h2><p>Each decision earns one point independently. Review the evidence for each selection.</p></div></div>` + groups.map(group => {
      const decisions = result.decisions.filter(d => d.group === group);
      return `<section class="group-result"><h3>${e(group)} · ${decisions.filter(d => d.correct).length} / ${decisions.length}</h3><div class="review-grid">` + decisions.map(d => `<article class="feedback ${d.correct ? 'good' : 'bad'}"><h3>${d.correct ? 'Correct' : d.selected ? 'Incorrect' : 'Unanswered'} · ${e(d.name)}</h3><p>Your answer: <strong>${e(d.options[d.selected] || 'No answer selected')}</strong></p><p>Appropriate answer${d.accept.length > 1 ? 's' : ''}: <strong>${d.accept.map(id => e(d.options[id])).join(' or ')}</strong></p><p>${e(d.why)}</p></article>`).join('') + '</div></section>';
    }).join('') + '<button id="retry" class="primary retry">Continue editing</button>';
    $('#results').hidden = false;
    if (focus) { $('#results').scrollIntoView({block:'start'}); $('#results').focus(); }
  }
  tray('#role-tray', 'role', M.roomRoles);
  tray('#component-tray', 'component', M.components);
  tray('#cable-tray', 'media', M.media);
  $('#building-art').innerHTML = A.building();
  $('#lesson-building').innerHTML = A.building(true);
  for (const type of ['copper', 'fiber', 'switch']) $('#lesson-' + type).innerHTML = A.unit(type);
  $('#room-targets').innerHTML = M.rooms.map(r => `<button class="room-target" data-room="${r.id}" data-target="${r.id}" aria-pressed="false">Assign role</button>`).join('');
  $('#route-targets').innerHTML = M.routes.map(r => `<button class="route-target" data-target="${r.id}" aria-label="Select media for ${e(r.name)}">${r.id.toUpperCase()} · Select media</button>`).join('');
  $('#room-controls').innerHTML = M.rooms.map(r => `<div class="room-choice">${answerSelect(r.id, r.name + ' distribution role')}</div>`).join('');
  $('#room-picker').innerHTML = M.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  const card = r => `<article class="decision" id="job-${r.id}"><h3>${e(r.name)}</h3><p>${e(r.requirement)}</p><button class="place-cable" data-target="${r.id}"><span data-cable-label="${r.id}">Place selected cable here</span></button>${answerSelect(r.id, 'Media for ' + r.id.toUpperCase())}</article>`;
  $('#route-controls').innerHTML = M.routes.map(card).join('');
  $('#patch-controls').innerHTML = M.patches.map(card).join('');
  $('#rating-control').innerHTML = answerSelect('h2-rating', 'H2 jacket rating') + '<p>Apply the stated environmental-air return requirement independently of the chosen media.</p>';
  rack(); render();
  new ResizeObserver(rackWires).observe($('#rack-units'));
  if (state.submitted) feedback(false);
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.item) choose({kind:button.dataset.kind, value:button.dataset.item});
    else if (button.dataset.target) target(button.dataset.target, selected);
    else if (button.id === 'retry') { state.submitted = false; $('#results').innerHTML = ''; render(); say('Continue editing. Your current answers are retained.'); $('#submit').focus(); }
  });
  document.addEventListener('change', event => {
    if (event.target.dataset.answer) assign(event.target.dataset.answer, event.target.value);
    if (event.target.id === 'room-picker') { state.room = event.target.value; rack(); render(); say('Inspecting ' + M.rooms.find(r => r.id === state.room).name + '.'); }
  });
  $$('.tabs [role=tab]').forEach(tab => {
    tab.addEventListener('click', () => setTab(tab.id, false));
    tab.addEventListener('keydown', event => {
      if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        event.preventDefault();
        setTab(event.key === 'Home' ? 'activity-tab' : event.key === 'End' ? 'lesson-tab' : tab.id === 'activity-tab' ? 'lesson-tab' : 'activity-tab', true);
      }
    });
  });
  $('#cancel-selection').addEventListener('click', () => { selected = null; render(); say('Selection cancelled.'); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected) { selected = null; render(); say('Selection cancelled.'); }
  });
  document.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-item]');
    if (!item || state.submitted) { event.preventDefault(); return; }
    selected = {kind:item.dataset.kind, value:item.dataset.item};
    event.dataTransfer.setData('text/plain', JSON.stringify(selected)); event.dataTransfer.effectAllowed = 'copy';
    render();
  });
  document.addEventListener('dragover', event => {
    const drop = event.target.closest('[data-target]');
    if (drop && !state.submitted) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; drop.classList.add('drop-over'); }
  });
  document.addEventListener('dragleave', event => { event.target.closest('[data-target]')?.classList.remove('drop-over'); });
  document.addEventListener('drop', event => {
    const drop = event.target.closest('[data-target]');
    if (!drop || state.submitted) return;
    event.preventDefault(); drop.classList.remove('drop-over');
    try {
      const item = JSON.parse(event.dataTransfer.getData('text/plain'));
      const options = {role:M.roomRoles, component:M.components, media:M.media}[item.kind];
      if (options && typeof item.value === 'string' && Object.hasOwn(options,item.value)) target(drop.dataset.target, item);
      else say('Select an item from the installation inventory.');
    } catch { say('Select an item from the installation inventory.'); }
  });
  document.addEventListener('dragend', () => { selected = null; $$('.drop-over').forEach(n => n.classList.remove('drop-over')); render(); });
  $('#submit').addEventListener('click', () => { state.submitted = true; selected = null; render(); feedback(true); say('Installation submitted. Results and explanations are available below.'); });
  $('#reset').addEventListener('click', () => $('#confirm').showModal());
  $('#keep').addEventListener('click', () => $('#confirm').close());
  $('#confirm-reset').addEventListener('click', () => {
    state = M.fresh(); selected = null; $('#confirm').close(); $('#results').innerHTML = ''; rack(); render(); say('Installation reset. All answers and results are cleared.'); $('#reset').focus();
  });
})();
