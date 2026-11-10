import {PLACE_VALUES, STEPS, calculate, checkStep, freshWork, sanitizeWork, parseIPv4, parsePrefix} from './engine.mjs';

const KEY = 'student-hub-network-plus-subnetting-v1';
const $ = id => document.getElementById(id);
const ROWS = {ip: 'IP address', mask: 'Subnet mask', network: 'AND result / Network ID', wildcard: 'Wildcard mask', broadcast: 'OR result / upper boundary'};
const ANSWERS = {mask: 'Subnet mask', network: 'Network address (Network ID)', broadcast: 'Broadcast address', first: 'First usable address', last: 'Last usable address', total: 'Total addresses', usable: 'Usable hosts'};
const HINTS = [
  'Fill the first prefix-length positions with 1, then the remaining positions with 0. Convert each mask octet back to decimal.',
  'Convert each decimal IP octet separately. Add the place values for its 1 positions and retain all eight digits.',
  'Compare the IP and mask one column at a time. Only 1 AND 1 produces 1. Every host position becomes 0.',
  'Convert the AND result to four decimal octets. This is the lowest address in the block.',
  'Invert every mask bit: 1 becomes 0 and 0 becomes 1. The wildcard identifies the host positions.',
  'OR the Network ID with the wildcard. A 1 in either input produces 1. Convert the upper boundary to decimal for the conventional broadcast address.',
  'For a conventional subnet, add 1 to the Network ID and subtract 1 from the broadcast. Use complete addresses when crossing an octet boundary.',
  'Count host bits: 32 minus the prefix. Total addresses are 2 raised to that count; subtract 2 for conventional usable hosts.'
];
// A fixed progression of calculation examples, not a scored question generator.
const EXAMPLES = [
  ['192.168.50.173',27], ['172.16.5.200',23], ['10.42.200.9',16], ['172.20.7.201',22],
  ['192.168.8.206',24], ['192.168.30.179',25], ['192.168.10.130',26],
  ['10.20.30.77',28], ['172.16.254.219',29], ['192.0.2.253',30], ['192.0.2.10',31], ['192.0.2.10',32]
];
let storageUnavailable = false;
let work;
try { work = sanitizeWork(JSON.parse(localStorage.getItem(KEY))); } catch { work = freshWork(); storageUnavailable = true; }
let selected = null;
let reports = [];
let pending = null;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(work)); }
  catch { storageUnavailable = true; }
  $('save-note').textContent = storageUnavailable
    ? 'Browser saving is unavailable. Your work remains available while this page is open.'
    : 'Your workspace is saved in this browser.';
}

function switchSection(section, focus = false, anchor = null) {
  if (!['lesson', 'workspace', 'reference'].includes(section)) return;
  for (const name of ['lesson', 'workspace', 'reference']) {
    $(name).hidden = name !== section;
    $(`${name}-tab`).setAttribute('aria-selected', String(name === section));
    $(`${name}-tab`).tabIndex = name === section ? 0 : -1;
  }
  history.replaceState(null, '', anchor ? `#lesson-${anchor}` : `#${section}`);
  if (focus) $(`${section}-tab`).focus();
  if (anchor) $(`lesson-${anchor}`)?.scrollIntoView({block: 'start'});
  else window.scrollTo({top: 0});
}

document.querySelectorAll('[role=tab]').forEach(tab => {
  tab.addEventListener('click', () => switchSection(tab.getAttribute('aria-controls')));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const names = ['lesson', 'workspace', 'reference'];
    const index = names.indexOf(tab.getAttribute('aria-controls'));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    switchSection(names[next], true);
  });
});
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => switchSection(button.dataset.open, true)));
document.querySelectorAll('[data-lesson]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); switchSection('lesson', true, link.dataset.lesson);
}));

function buildInputs() {
  for (const [key, name] of Object.entries(ROWS)) {
    const row = element('tr'); row.dataset.row = key;
    const heading = element('th', name); heading.scope = 'row'; row.append(heading);
    for (let i = 0; i < 4; i++) {
      const cell = element('td');
      const weights = element('div', undefined, 'weights'); weights.setAttribute('aria-hidden', 'true');
      PLACE_VALUES.forEach(value => weights.append(element('span', String(value))));
      const input = element('input'); input.id = `${key}-${i}`; input.className = 'binary-input';
      input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 8; input.autocomplete = 'off'; input.spellcheck = false;
      input.setAttribute('aria-label', `${name}, octet ${i + 1}`);
      input.dataset.row = key; input.dataset.octet = i;
      input.addEventListener('focus', () => {
        selected = {row: key, octet: i};
        document.querySelectorAll('.binary-input').forEach(node => node.classList.toggle('selected', node === input));
        renderPad();
      });
      const strip = element('div', undefined, 'bit-strip'); strip.id = `${key}-${i}-strip`; strip.setAttribute('aria-hidden', 'true');
      cell.append(weights, input, strip); row.append(cell);
    }
    $('binary-rows').append(row);
  }
  for (const [key, name] of Object.entries(ANSWERS)) {
    const label = element('label', name); label.htmlFor = `answer-${key}`;
    const input = element('input'); input.id = `answer-${key}`; input.type = 'text'; input.maxLength = 32;
    input.autocomplete = 'off'; input.spellcheck = false; input.dataset.answer = key;
    input.setAttribute('aria-describedby', 'answer-note');
    if (['total', 'usable'].includes(key)) input.inputMode = 'numeric';
    label.append(input); $('final-answers').append(label);
  }
  for (let i = 0; i < 8; i++) {
    const button = element('button'); button.type = 'button'; button.dataset.bit = i;
    button.addEventListener('focus', () => highlightBit(i));
    button.addEventListener('mouseenter', () => highlightBit(i));
    button.addEventListener('mouseleave', () => highlightBit(null));
    button.addEventListener('blur', () => highlightBit(null));
    button.addEventListener('click', () => {
      if (!selected) return;
      const {row, octet} = selected;
      const value = work.binary[row][octet];
      if (!/^[01]{0,8}$/.test(value)) {
        showMessage('Use only 0 and 1 in this octet before toggling a bit.'); return;
      }
      const bits = [...value.padEnd(8, '0')];
      bits[i] = bits[i] === '1' ? '0' : '1'; work.binary[row][octet] = bits.join('');
      $(`${row}-${octet}`).value = work.binary[row][octet];
      edited('binary', row); highlightBit(i);
    });
    $('bit-buttons').append(button);
  }
  STEPS.forEach((step, i) => {
    const item = element('li');
    const button = element('button'); button.type = 'button';
    button.addEventListener('click', () => { work.step = i; clearReview(); render(); save(); });
    item.append(button); $('step-list').append(item);
  });
}

function populateInputs() {
  $('given-ip').value = work.ip; $('given-prefix').value = `/${work.prefix}`; $('mode').value = work.mode;
  for (const row of Object.keys(ROWS)) for (let i = 0; i < 4; i++) $(`${row}-${i}`).value = work.binary[row][i];
  for (const key of Object.keys(ANSWERS)) $(`answer-${key}`).value = work.answers[key];
  $('current-example').textContent = `Current calculation: ${work.ip}/${work.prefix}`;
  const kind = calculate(work.ip, work.prefix).kind;
  $('special-note').hidden = kind === 'conventional';
  $('special-note').textContent = kind === 'point-to-point'
    ? '/31 exception: treat this as a point-to-point link with 2 usable endpoints. Network ID names the lower boundary here. OR gives the upper endpoint, not a directed broadcast. Enter N/A for decimal broadcast.'
    : '/32 exception: this is one address, such as a host route. Lower and upper boundaries and both usable-range entries are that same address. Enter N/A for decimal broadcast and 1 for both counts.';
  selected = null; document.querySelectorAll('.binary-input').forEach(node => node.classList.remove('selected'));
  render();
}

function render() {
  const independent = work.mode === 'independent';
  $('step-list').hidden = independent; $('step-help').hidden = independent; $('next-step').hidden = independent;
  $('check').textContent = independent ? 'Check Work' : 'Check Step';
  $('next-step').disabled = work.step === STEPS.length - 1;
  $('step-title').textContent = `Step ${work.step + 1}: ${STEPS[work.step].title}`;
  $('step-instruction').textContent = HINTS[work.step];
  if (work.prefix >= 31 && work.step >= 5) $('step-instruction').textContent += ' Apply the exception described in Given information.';
  const completed = work.verified.filter(i => checkStep(work, i).correct);
  $('progress-text').textContent = `${completed.length} of 8 operations checked correctly${completed.length === 8 ? '. Calculation complete.' : '.'}`;
  STEPS.forEach((step, i) => {
    const button = $('step-list').children[i].firstElementChild;
    button.textContent = `${completed.includes(i) ? '✓ ' : ''}${i + 1}. ${step.title}`;
    if (i === work.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    button.classList.toggle('complete', completed.includes(i));
  });
  $('show-solution').disabled = independent ? work.attempted.length !== 8 : !work.attempted.includes(work.step);
  renderMarks(); renderPad();
}

function renderMarks() {
  const checkedFields = new Set();
  const issues = new Map();
  for (const {index, report} of reports) {
    for (const row of STEPS[index].binary) for (let i = 0; i < 4; i++) checkedFields.add(`${row}-${i}`);
    for (const key of STEPS[index].answers) checkedFields.add(`answer-${key}`);
    for (const issue of report.issues) issues.set(issue.field, issue);
  }
  for (const row of Object.keys(ROWS)) for (let i = 0; i < 4; i++) {
    const field = `${row}-${i}`; const issue = issues.get(field);
    $(field).setAttribute('aria-invalid', String(Boolean(issue)));
    if (issue) $(field).setAttribute('aria-describedby', 'feedback'); else $(field).removeAttribute('aria-describedby');
    const strip = $(`${field}-strip`); strip.replaceChildren();
    for (let bit = 0; bit < 8; bit++) {
      const network = i * 8 + bit < work.prefix;
      const cell = element('span', work.binary[row][i][bit] || '·', network ? 'network-bit' : 'host-bit');
      cell.dataset.column = i * 8 + bit;
      cell.title = `${network ? 'Network' : 'Host'} bit, position ${bit + 1}, value ${PLACE_VALUES[bit]}`;
      if (issue?.bits.includes(bit)) cell.classList.add('bit-error');
      else if (checkedFields.has(field) && !issue) cell.classList.add('bit-ok');
      strip.append(cell);
    }
  }
  for (const key of Object.keys(ANSWERS)) {
    const input = $(`answer-${key}`);
    input.setAttribute('aria-invalid', String(issues.has(input.id)));
    input.setAttribute('aria-describedby', issues.has(input.id) ? 'answer-note feedback' : 'answer-note');
  }
}

function renderPad() {
  $('bit-editor-title').textContent = selected ? `Editing ${ROWS[selected.row]} · octet ${selected.octet + 1}` : 'Select a binary octet to edit its bits.';
  [...$('bit-buttons').children].forEach((button, i) => {
    button.disabled = !selected;
    const value = selected ? work.binary[selected.row][selected.octet][i] : undefined;
    const role = selected && selected.octet * 8 + i < work.prefix ? 'N' : 'H';
    button.replaceChildren(element('span', value === '0' || value === '1' ? value : '·'), element('small', `${PLACE_VALUES[i]}${selected ? ` · ${role}` : ''}`));
    button.setAttribute('aria-label', `Toggle bit ${i + 1}, place value ${PLACE_VALUES[i]}${selected ? `, ${role === 'N' ? 'network' : 'host'} position, currently ${value || 'blank'}` : ''}`);
    button.setAttribute('aria-pressed', String(value === '1'));
  });
}

function highlightBit(bit) {
  document.querySelectorAll('[data-column]').forEach(node => node.classList.toggle('active-bit', Boolean(selected && bit !== null && Number(node.dataset.column) === selected.octet * 8 + bit)));
}

function clearReview() {
  reports = []; $('feedback').hidden = true; $('solution').hidden = true;
}
function edited(kind, key) {
  work.verified = work.verified.filter(index => !STEPS[index][kind].includes(key));
  clearReview(); render(); save();
}

$('binary-rows').addEventListener('input', event => {
  const input = event.target; if (!input.dataset.row) return;
  work.binary[input.dataset.row][Number(input.dataset.octet)] = input.value;
  edited('binary', input.dataset.row);
});
$('binary-rows').addEventListener('paste', event => {
  const input = event.target; if (!input.dataset.row) return;
  const text = event.clipboardData.getData('text').trim();
  const groups = /^[01]{32}$/.test(text) ? text.match(/.{8}/g) : text.split(/[.\s]+/);
  if (groups.length === 4 && groups.every(octet => /^[01]{8}$/.test(octet))) {
    event.preventDefault();
    work.binary[input.dataset.row] = groups;
    groups.forEach((value, i) => { $(`${input.dataset.row}-${i}`).value = value; });
    edited('binary', input.dataset.row);
  } else if (!/^[01]{1,8}$/.test(text)) {
    event.preventDefault(); showMessage('Paste eight binary digits for one octet, or exactly four groups of eight for the entire row.');
  }
});
$('final-answers').addEventListener('input', event => {
  if (!event.target.dataset.answer) return;
  work.answers[event.target.dataset.answer] = event.target.value;
  edited('answers', event.target.dataset.answer);
});

function showMessage(message) {
  $('feedback').replaceChildren(element('p', message)); $('feedback').className = 'feedback'; $('feedback').hidden = false;
}

$('check').addEventListener('click', () => {
  const indexes = work.mode === 'independent' ? STEPS.map((_, i) => i) : [work.step];
  work.attempted = [...new Set([...work.attempted, ...indexes])];
  reports = indexes.map(index => ({index, report: checkStep(work, index)}));
  work.verified = [...new Set([...work.verified.filter(index => !indexes.includes(index)), ...reports.filter(value => value.report.correct).map(value => value.index)])];
  const good = reports.every(value => value.report.correct);
  const feedback = $('feedback'); feedback.replaceChildren();
  feedback.append(element('h3', good ? '✓ Calculation checked correctly' : '× Revisit these operations'));
  const list = element('ul');
  for (const {index, report} of reports) {
    if (report.correct) list.append(element('li', `✓ ${STEPS[index].title}: correct.`));
    else for (const issue of report.issues) {
      const item = element('li');
      const link = element('a', `${issue.row ? ROWS[issue.row] : ANSWERS[issue.field.replace('answer-', '')]}: ${issue.message}`);
      link.href = `#${issue.field}`;
      link.addEventListener('click', event => { event.preventDefault(); $(issue.field).focus(); });
      item.append(link); list.append(item);
    }
  }
  feedback.append(list);
  if (!good) feedback.append(element('p', 'Retry the highlighted positions, or reveal the process with Show Solution. Your entries stay editable.'));
  feedback.className = `feedback${good ? ' good' : ''}`; feedback.hidden = false;
  $('solution').hidden = true; render(); save();
});

function addProcess(section, index, result) {
  const box = element('div'); box.append(element('h3', `${index + 1}. ${STEPS[index].title}`));
  const joined = row => result.binary[row].join('.');
  let description, process;
  switch (index) {
    case 0:
      description = `${result.prefix} leading network bits become 1; ${result.hostBits} host bits become 0. Convert each octet with the place values.`;
      process = `Mask     ${joined('mask')}\nDecimal  ${result.mask}`; break;
    case 1:
      description = 'Build each eight-bit value from the included place values. Leading zeros keep the octets aligned.';
      process = result.binary.ip.map((bits, i) => `${result.ip.split('.')[i]} = ${[...bits].flatMap((b, j) => b === '1' ? [PLACE_VALUES[j]] : []).join(' + ') || '0'} = ${bits}`).join('\n'); break;
    case 2:
      description = 'Only 1 AND 1 is 1. Network positions keep their IP bit; host positions become 0.';
      process = `IP       ${joined('ip')}\nMask     ${joined('mask')}\nAND      ${joined('network')}`; break;
    case 3:
      description = 'Add the place values in each AND-result octet. This identifies the block’s lower boundary.';
      process = `AND      ${joined('network')}\nNetwork  ${result.network}`; break;
    case 4:
      description = 'Invert every mask bit. Wildcard 1s mark the host positions; network positions are 0.';
      process = `Mask     ${joined('mask')}\nWildcard ${joined('wildcard')}\nDecimal  ${result.wildcard}`; break;
    case 5:
      description = 'OR sets a position to 1 when either input is 1. The Network ID has zeros in all host positions, so adding the wildcard gives the same upper boundary.';
      process = `Network  ${joined('network')}\nWildcard ${joined('wildcard')}\nOR       ${joined('broadcast')}\n${result.network} + ${result.wildcard} = ${result.upperAddress}\nBroadcast answer: ${result.broadcast || 'N/A (no directed broadcast for this block)'}`; break;
    case 6:
      description = result.kind === 'conventional' ? 'Exclude the conventional network and broadcast addresses.' : result.kind === 'point-to-point' ? 'Both /31 addresses are point-to-point endpoints. Do not subtract two.' : 'The /32 represents one address. Both range entries name it.';
      process = result.kind === 'conventional' ? `Network + 1:   ${result.network} + 1 = ${result.first}\nBroadcast − 1: ${result.broadcast} − 1 = ${result.last}` : `First: ${result.first}\nLast:  ${result.last}`; break;
    case 7:
      description = result.kind === 'conventional' ? 'Each host bit doubles the combinations. Reserve two addresses for conventional network and broadcast roles.' : 'Apply the special block convention rather than the conventional subtraction-of-two formula.';
      process = `Host bits = 32 − ${result.prefix} = ${result.hostBits}\nTotal = 2^${result.hostBits} = ${result.total}\nUsable = ${result.kind === 'conventional' ? `${result.total} − 2 = ` : ''}${result.usable}`; break;
  }
  box.append(element('p', description), element('pre', process, 'binary-demo')); section.append(box);
}

$('show-solution').addEventListener('click', () => {
  if ($('show-solution').disabled) return;
  const section = $('solution'); section.replaceChildren();
  const heading = element('h2', 'Solution process'); heading.id = 'solution-title'; section.append(heading);
  section.append(element('p', 'Compare the process with your own work. Your answer fields have not been filled or changed.'));
  const result = calculate(work.ip, work.prefix);
  const indexes = work.mode === 'independent' ? STEPS.map((_, i) => i) : [work.step];
  indexes.forEach(index => addProcess(section, index, result));
  section.hidden = false;
});
$('mode').addEventListener('change', () => { work.mode = $('mode').value; clearReview(); render(); save(); });
$('next-step').addEventListener('click', () => { work.step = Math.min(7, work.step + 1); clearReview(); render(); save(); });
$('review-step').addEventListener('click', () => switchSection('lesson', true, STEPS[work.step].lesson));

function hasWork() { return Object.values(work.binary).flat().some(Boolean) || Object.values(work.answers).some(Boolean) || work.attempted.length > 0; }
function replaceWork(ip, prefix, exampleIndex, message) {
  const apply = () => {
    const mode = work.mode;
    work = {...freshWork(exampleIndex), ip, prefix, mode};
    clearReview(); populateInputs(); save();
    $('given-error').textContent = ''; $('given-ip').removeAttribute('aria-invalid'); $('given-prefix').removeAttribute('aria-invalid');
  };
  if (!hasWork()) { apply(); return; }
  pending = apply;
  $('replace-description').textContent = message;
  $('replace-dialog').showModal();
}
$('cancel-replace').addEventListener('click', () => { pending = null; $('replace-dialog').close(); });
$('replace-dialog').addEventListener('cancel', () => { pending = null; });
$('confirm-replace').addEventListener('click', () => { $('replace-dialog').close(); pending?.(); pending = null; });
$('reset').addEventListener('click', () => replaceWork(work.ip, work.prefix, work.exampleIndex, 'Reset clears your entries and checks for this address. Keep my work returns without changes.'));
$('new-example').addEventListener('click', () => {
  const index = (work.exampleIndex + 1) % EXAMPLES.length;
  replaceWork(...EXAMPLES[index], index, 'New Example clears your current entries and opens the next address in the example set.');
});
$('given-form').addEventListener('submit', event => {
  event.preventDefault();
  let ip, prefix;
  $('given-ip').removeAttribute('aria-invalid'); $('given-prefix').removeAttribute('aria-invalid');
  try { ip = parseIPv4($('given-ip').value).join('.'); }
  catch (error) { $('given-ip').setAttribute('aria-invalid', 'true'); $('given-error').textContent = error.message; $('given-ip').focus(); return; }
  try { prefix = parsePrefix($('given-prefix').value); }
  catch (error) { $('given-prefix').setAttribute('aria-invalid', 'true'); $('given-error').textContent = error.message; $('given-prefix').focus(); return; }
  if (ip === work.ip && prefix === work.prefix) { $('given-error').textContent = 'Already using these values. Your entries are preserved.'; return; }
  replaceWork(ip, prefix, work.exampleIndex, `Use ${ip}/${prefix} and clear the entries for the current calculation?`);
});

buildInputs(); populateInputs(); save();
const hash = location.hash.slice(1);
if (hash.startsWith('lesson-')) switchSection('lesson', false, hash.slice(7));
else switchSection(['lesson', 'workspace', 'reference'].includes(hash) ? hash : 'lesson');
window.addEventListener('hashchange', () => {
  const name = location.hash.slice(1);
  if (name.startsWith('lesson-')) switchSection('lesson', false, name.slice(7));
  else if (['lesson', 'workspace', 'reference'].includes(name)) switchSection(name);
});
