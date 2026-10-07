'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../docs/assets/javascripts/hub-analytics.js'), 'utf8');
function boot(pathname, hostname = 'thearchitechnique.github.io') {
  const events = [], handlers = {}, elements = {};
  const document = {
    readyState: 'complete',
    addEventListener(name, fn) { handlers[name] = fn; },
    getElementById(id) { return elements[id] || null; }
  };
  const window = {
    location: { hostname, pathname },
    umami: { track: (name, data) => events.push({ name, data }) },
    setTimeout(fn) { fn(); }
  };
  vm.runInNewContext(script, { window, document });
  function click(id, textContent = '', disabled = false) {
    const target = { id, textContent, disabled,
      closest(selector) { return selector.includes('button') ? this : null; }
    };
    handlers.click?.({ target });
  }
  function result(id, shown, content = '') {
    elements[id] = { hidden: !shown, textContent: content, closest() { return null; } };
  }
  return { events, click, result };
}
const page = '/it-cyber-student-hub/practice/pbqs/a-plus-core-1/wireless-coverage/app/';
const pbq = boot(page);
assert.equal(pbq.events[0].name, 'pbq_launched');
assert.equal(pbq.events[0].data.activity, 'wireless-coverage');
pbq.result('results', false);
pbq.click('submit', 'Submit design');
assert.equal(pbq.events.length, 1, 'Incomplete submits are ignored');
pbq.result('results', true);
pbq.click('submit', 'Submit design');
pbq.click('submit', 'Submit design');
assert.equal(pbq.events.filter(e => e.name === 'pbq_completed').length, 1, 'No duplicate completion');
pbq.click('reset', 'Reset office');
assert.equal(pbq.events.filter(e => e.name === 'pbq_retried').length, 0, 'Opening dialog is not retry');
pbq.result('confirm-title', true, 'Reset office?');
pbq.click('confirm-action', 'Reset office');
pbq.click('submit', 'Submit design');
assert.equal(pbq.events.filter(e => e.name === 'pbq_retried').length, 1);
assert.equal(pbq.events.filter(e => e.name === 'pbq_completed').length, 2);
assert.ok(pbq.events.every(e => !('score' in e.data) && !('answer' in e.data) && !('user' in e.data)));
const ports = boot('/it-cyber-student-hub/practice/pbqs/a-plus-core-1/ports-and-protocols/app/');
ports.result('results', true);
ports.result('results-body', true, '3 of 8 tasks checked.');
ports.click('check', 'Check answers');
assert.equal(ports.events.filter(e => e.name === 'pbq_completed').length, 0);
ports.result('results-body', true, 'Run complete. Review tasks below.');
ports.click('tab-results', 'Results');
assert.equal(ports.events.filter(e => e.name === 'pbq_completed').length, 1);
assert.equal(boot('/it-cyber-student-hub/labs/networking/').events[0].name, 'lab_area_opened');
const lab = boot('/it-cyber-student-hub/labs/networking/packet-capture/');
assert.equal(lab.events[0].name, 'lab_launched');
assert.equal(lab.events[0].data.lab, 'packet-capture');
assert.equal(boot(page, 'localhost').events.length, 0, 'No local development data');
assert.equal(boot('/other-repo/practice/pbqs/a-plus-core-1/wireless-coverage/app/').events.length, 0);
console.log('PASS: PBQ launch/completion/retry, deduplication, lab area/launch, privacy, host isolation');
