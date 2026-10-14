(function () {
  'use strict';
  const { scenarios, fields, score, shuffle } = window.NetworkConfiguration;
  const $ = id => document.getElementById(id);
  const states = new Map();
  let current = scenarios[0];
  const icons = {
    cloud: '<path d="M13 37h28a10 10 0 0 0 0-20 15 15 0 0 0-28-3 12 12 0 0 0 0 23Z"/>',
    router: '<rect x="6" y="25" width="44" height="20" rx="5"/><path d="M13 25V9m30 16V9M15 35h4m5 0h4m5 0h4"/>',
    computer: '<rect x="6" y="7" width="43" height="30" rx="3"/><path d="M28 37v10m-12 0h24"/>',
    wifi: '<path d="M5 16a35 35 0 0 1 46 0M12 25a24 24 0 0 1 32 0m-24 9a12 12 0 0 1 16 0"/><circle cx="28" cy="43" r="2"/>',
    web: '<rect x="5" y="6" width="46" height="44" rx="4"/><path d="M5 16h46m-38-5h2m4 0h2m4 0h2M18 30h20m-20 9h15"/>',
    firewall: '<rect x="5" y="7" width="46" height="42" rx="3"/><path d="M5 21h46M5 35h46M21 7v14m17 0v14M21 35v14"/>',
    printer: '<path d="M15 21V7h26v14M15 37H7V21h42v16h-8"/><rect x="15" y="30" width="26" height="19"/><path d="M20 38h16m-16 5h16M39 26h3"/>',
    server: '<rect x="12" y="5" width="32" height="46" rx="4"/><path d="M12 20h32M12 35h32m-23-23h3m-3 15h3m-3 15h3m11-30h3m-3 15h3m-3 15h3"/>'
  };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function freshState(scenario) {
    return { answers: {}, submitted: false, orders: Object.fromEntries(fields(scenario).map(field => [field.id, shuffle(field.options)])) };
  }
  function state() {
    if (!states.has(current.id)) states.set(current.id, freshState(current));
    return states.get(current.id);
  }
  function updateProgress() {
    const count = fields(current).filter(field => state().answers[field.id]).length;
    $('progress').textContent = `${count} of ${fields(current).length} choices selected${state().submitted ? ' · Submitted' : ''}`;
  }
  function render() {
    const run = state();
    $('case-number').textContent = `SCENARIO ${scenarios.indexOf(current) + 1} OF ${scenarios.length}`;
    $('case-title').textContent = current.title;
    $('requirement').textContent = current.requirement;
    $('facts').replaceChildren(...current.facts.map(text => element('li', '', text)));
    $('diagram').className = `diagram ${current.id}`;
    $('nodes').replaceChildren(...current.nodes.map(node => {
      const card = element('article', `device device-${node.id}`);
      card.id = `node-${node.id}`;
      const heading = element('div', 'device-head');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 56 56');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('class', 'device-icon');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2.5');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = icons[node.icon];
      heading.append(svg, element('h3', '', node.title));
      card.append(heading, element('p', 'device-note', node.note));
      if (node.fields.length) {
        const controls = element('div', 'device-fields');
        controls.append(...node.fields.map(field => {
          const wrap = element('div', 'field');
          wrap.dataset.decision = field.id;
          const id = `choice-${field.id}`;
          const label = element('label', '', field.label);
          label.htmlFor = id;
          const select = element('select');
          select.id = id;
          select.name = field.id;
          select.disabled = run.submitted;
          select.append(new Option('Select an option', ''), ...run.orders[field.id].map(choice => new Option(choice, choice)));
          select.value = run.answers[field.id] || '';
          select.addEventListener('change', () => {
            if (select.value) run.answers[field.id] = select.value;
            else delete run.answers[field.id];
            updateProgress();
          });
          wrap.append(label, select);
          if (run.submitted) {
            const correct = run.answers[field.id] === field.answer;
            wrap.classList.add(correct ? 'correct' : 'incorrect');
            const feedback = element('span', 'field-state', correct ? 'Correct' : run.answers[field.id] ? 'Incorrect' : 'Unanswered');
            feedback.id = `state-${field.id}`;
            select.setAttribute('aria-describedby', feedback.id);
            wrap.append(feedback);
          }
          return wrap;
        }));
        card.append(controls);
      }
      return card;
    }));
    $('submit').hidden = run.submitted;
    $('retry').hidden = !run.submitted;
    $('results').hidden = !run.submitted;
    $('results').replaceChildren();
    if (run.submitted) renderResults();
    updateProgress();
    requestAnimationFrame(drawConnections);
  }
  function renderResults() {
    const result = score(current, state().answers);
    const title = element('h2', '', 'Configuration results');
    title.id = 'score-title';
    $('results').append(title, element('p', 'score', `${result.earned} / ${result.possible} points · ${result.percent}%`),
      element('p', '', 'Review each choice below. Retry selections keeps your choices so you can adjust them; Reset scenario clears this scenario and reshuffles choices.'));
    const list = element('div', 'result-list');
    list.append(...result.decisions.map(field => {
      const card = element('article', `result-item ${field.correct ? 'correct' : 'incorrect'}`);
      card.append(element('h3', '', `${field.correct ? 'Correct' : field.selected ? 'Incorrect' : 'Unanswered'} · ${field.label}`),
        element('p', '', `Your selection: ${field.selected || 'No selection'}`));
      if (!field.correct) card.append(element('p', '', `Correct selection: ${field.answer}`));
      card.append(element('p', '', field.explanation));
      return card;
    }));
    $('results').append(list);
  }
  function drawConnections() {
    if ($('activity').hidden) return;
    const bounds = $('diagram').getBoundingClientRect();
    const svg = $('connections');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.replaceChildren(...current.links.map(([from, to, type]) => {
      const a = $(`node-${from}`).getBoundingClientRect();
      const b = $(`node-${to}`).getBoundingClientRect();
      let d;
      if (Math.abs(a.top - b.top) < 8) {
        const y1 = a.top - bounds.top + Math.min(a.height, b.height) / 2;
        const x1 = a.right - bounds.left;
        const x2 = b.left - bounds.left;
        d = `M ${x1} ${y1} H ${x2}`;
      } else if (matchMedia('(max-width:600px)').matches && a.bottom + 36 < b.top) {
        // Route past intervening cards at the outer edge of a stacked diagram.
        const x1 = a.left - bounds.left + a.width / 2;
        const y1 = a.bottom - bounds.top;
        const x2 = b.left - bounds.left + b.width / 2;
        const y2 = b.top - bounds.top;
        const lane = type === 'wireless' ? bounds.width - 7 : 7;
        d = `M ${x1} ${y1} V ${y1 + 12} H ${lane} V ${y2 - 12} H ${x2} V ${y2}`;
      } else {
        const x1 = a.left - bounds.left + a.width / 2;
        const y1 = a.bottom - bounds.top;
        const x2 = b.left - bounds.left + b.width / 2;
        const y2 = b.top - bounds.top;
        const mid = (y1 + y2) / 2;
        d = `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`;
      }
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', type);
      return path;
    }));
  }
  function showTab(id, focus = false) {
    for (const tab of ['activity', 'lesson']) {
      const active = tab === id;
      $(tab).hidden = !active;
      $(`${tab}-tab`).setAttribute('aria-selected', String(active));
      $(`${tab}-tab`).tabIndex = active ? 0 : -1;
    }
    if (focus) $(`${id}-tab`).focus();
    if (id === 'activity') requestAnimationFrame(drawConnections);
  }
  for (const [index, id] of ['activity', 'lesson'].entries()) {
    $(`${id}-tab`).addEventListener('click', () => showTab(id));
    $(`${id}-tab`).addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') target = 1 - index;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = 1;
      if (target !== undefined) { event.preventDefault(); showTab(['activity', 'lesson'][target], true); }
    });
  }
  $('scenario').append(...scenarios.map((scenario, index) => new Option(`${index + 1} · ${scenario.title}`, scenario.id)));
  $('scenario').addEventListener('change', () => { current = scenarios.find(scenario => scenario.id === $('scenario').value); render(); });
  $('configuration').addEventListener('submit', event => {
    event.preventDefault();
    if (state().submitted) return;
    state().submitted = true;
    render();
    $('results').focus();
  });
  $('retry').addEventListener('click', () => { state().submitted = false; render(); $('nodes').querySelector('select').focus(); });
  $('reset').addEventListener('click', () => { states.set(current.id, freshState(current)); render(); $('nodes').querySelector('select').focus(); });
  new ResizeObserver(drawConnections).observe($('diagram'));
  render();
})();
