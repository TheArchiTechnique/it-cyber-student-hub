const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { whiteboardFlow } = require('./practice-tests-browser.cjs');
const bank = require('../docs/assets/data/practice-tests/a-plus-core-2-questions.json');
const KEY = 'student-hub.exam.session.v1', duration = 90 * 60000;
const route = '/practice/tests/app/';
const question = id => bank.questions.find(q => q.id === id);
const seconds = text => text.split(':').reduce((total, n) => total * 60 + Number(n), 0);

async function noFeedback(p) {
  assert.equal(await p.locator('#feedback').isVisible(), false);
  assert.equal(await p.locator('#feedback').textContent(), '');
  assert.equal(await p.locator('#results').textContent(), '');
  assert.equal(await p.locator('#exam .score, #exam .rationale, #exam a').count(), 0);
  assert.equal(await p.locator('#check-answer').isVisible(), false);
  assert.ok(!/Objectives:/.test(await p.locator('#question-body').textContent()));
  for (const label of await p.locator('#question-navigator button').evaluateAll(items => items.map(el => el.getAttribute('aria-label')))) assert.ok(!/correct|incorrect/i.test(label));
}

async function browser(base) {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const shot = async (p, name) => {
    if (!process.env.EXAM_QA_SCREENSHOT_DIR) return;
    fs.mkdirSync(process.env.EXAM_QA_SCREENSHOT_DIR, { recursive: true });
    await p.screenshot({ path: path.join(process.env.EXAM_QA_SCREENSHOT_DIR, `certification-${name}.png`), fullPage: true });
  };
  try {
    for (const prefix of ['', '/it-cyber-student-hub']) {
      const context = await b.newContext({ viewport: { width: 1440, height: 1000 } }), p = await context.newPage();
      const errors = [], missing = [];
      p.on('pageerror', e => errors.push(e.message));
      p.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) missing.push(r.url()); });
      await p.clock.install({ time: new Date('2026-10-27T12:00:00Z') });
      const state = () => p.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      const click = id => p.locator('#' + id).click();
      const go = index => p.locator('#question-navigator button').nth(index).click();
      const start = async () => { await click('start-exam'); await p.locator('#exam').waitFor({ state: 'visible' }); };
      const reset = async () => { await click('new-test'); await click('confirm-action'); await p.locator('#setup').waitFor({ state: 'visible' }); };
      const toRemaining = async remaining => {
        const delta = (await state()).deadline - await p.evaluate(() => Date.now()) - remaining;
        assert.ok(delta > 0); await p.clock.fastForward(delta);
      };
      await p.goto(base + prefix + route); await p.locator('#setup').waitFor({ state: 'visible' });
      await p.locator('#show-answers').uncheck();
      await click('mode-certification');
      assert.equal(await p.locator('#configuration').isVisible(), false);
      assert.equal(await p.locator('#certification-intro').isVisible(), true);
      assert.match(await p.locator('#certification-facts').innerText(), /220-1202/);
      assert.match(await p.locator('#certification-facts').innerText(), /90 MCQs/);
      assert.match(await p.locator('#certification-facts').innerText(), /90 minutes/);
      assert.deepEqual(await p.locator('#certification-allocation tbody tr td:last-child').allTextContents(), ['25', '25', '21', '19']);
      assert.equal(await p.locator('#start-exam').isDisabled(), false);
      assert.equal(await state(), null);
      await p.clock.fastForward(60000); assert.equal(await state(), null, 'Reading the introduction must not start the clock');
      if (!prefix) await shot(p, 'introduction');
      await start(); const initial = await state();
      assert.equal(initial.version, 2); assert.equal(initial.config.mode, 'certification');
      assert.equal(initial.questionIds.length, 90); assert.equal(new Set(initial.questionIds).size, 90);
      assert.equal(initial.deadline - initial.startedAt, duration);
      assert.equal(initial.config.showAnswers, true, 'Practice feedback preferences do not override the exam policy');
      assert.equal(initial.config.feedback, 'end');
      assert.deepEqual(['1.0', '2.0', '3.0', '4.0'].map(d => initial.questionIds.filter(id => question(id).domain === d).length), [25, 25, 21, 19]);
      assert.match(await p.locator('#exam-label').innerText(), /MCQ-only/);
      await noFeedback(p);

      // Skip, flag, return, and change a selected answer without revealing correctness.
      const singleIndex = initial.questionIds.findIndex(id => question(id).type === 'single'), single = question(initial.questionIds[singleIndex]);
      await go(singleIndex); await p.locator(`#answer-options input[value="${single.correct[0]}"]`).check();
      const wrong = single.choices.find(c => !single.correct.includes(c.id)).id;
      await p.locator(`#answer-options input[value="${wrong}"]`).check();
      assert.deepEqual((await state()).answers[single.id], [wrong]);
      await click('flag'); await go(89); assert.equal(await p.locator('#next').isDisabled(), true);
      await click('previous'); await go(singleIndex); assert.equal(await p.locator(`#answer-options input[value="${wrong}"]`).isChecked(), true);
      await p.evaluate(() => {
        document.getElementById('feedback-timing').value = 'immediate';
        document.getElementById('show-answers').checked = true;
        document.getElementById('show-explanations').checked = true;
        document.getElementById('feedback-timing').dispatchEvent(new Event('change'));
        document.getElementById('check-answer').click();
        document.getElementById('mode-practice').click();
      });
      assert.equal((await state()).id, initial.id); assert.deepEqual((await state()).finalized, []);
      await noFeedback(p);
      await p.locator(`#answer-options input[value="${single.correct[0]}"]`).check();
      if (!prefix) {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await whiteboardFlow(p, state, shot);
      }
      // Every selected item is answered using the displayed, shuffled stable IDs.
      for (let i = 0; i < 90; i++) {
        await go(i); const q = question(initial.questionIds[i]);
        if (q.type === 'multiple') while (await p.locator('#answer-options input:checked').count()) await p.locator('#answer-options input:checked').first().uncheck();
        for (const id of q.correct) await p.locator(`#answer-options input[value="${id}"]`).check();
      }
      await noFeedback(p);
      await go(0); await p.getByRole('button', { name: 'Whiteboard', exact: true }).click();
      const notes = p.getByRole('textbox', { name: 'Exam notes' });
      await notes.fill('Timed examination notes\n  127.0.0.1:8181\n\tPreserve spacing');
      const before = seconds(await p.locator('#time-remaining').innerText());
      await p.clock.fastForward(5000);
      assert.ok(seconds(await p.locator('#time-remaining').innerText()) <= before - 5);
      const checkpoint = await state();
      assert.equal(checkpoint.deadline, initial.deadline);
      await p.reload(); await p.locator('.exam-whiteboard').waitFor({ state: 'visible' });
      const restored = await state();
      for (const key of ['questionIds', 'choiceOrder', 'answers', 'flags', 'current', 'deadline', 'startedAt', 'tools']) assert.deepEqual(restored[key], checkpoint[key]);
      await noFeedback(p);

      // A jump without interval callbacks models returning after background inactivity.
      const current = await p.evaluate(() => Date.now());
      await p.clock.setSystemTime(current + 120000);
      await p.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); });
      assert.equal((await state()).deadline, initial.deadline);
      assert.ok(seconds(await p.locator('#time-remaining').innerText()) <= before - 125);
      for (const width of [320, 390, 768, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        for (const dark of [false, true]) {
          if ((await p.locator('body').getAttribute('data-md-color-scheme') === 'slate') !== dark) await click('theme-toggle');
          await notes.scrollIntoViewIfNeeded();
          const clock = await p.locator('#exam-clock').boundingBox();
          assert.ok(clock.y >= 0 && clock.y + clock.height <= 900 && clock.x >= 0 && clock.x + clock.width <= width, 'Timer remains readable with notes open');
          assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
          if (!prefix) await shot(p, `exam-${width}-${dark ? 'dark' : 'light'}`);
        }
      }
      await p.setViewportSize({ width: 1440, height: 1000 });
      await p.getByRole('button', { name: 'Close Whiteboard', exact: true }).click();
      await click('new-test'); await click('cancel-action'); assert.equal((await state()).id, initial.id);
      await click('submit-test');
      assert.match(await p.locator('#confirmation-text').innerText(), /90 total questions · 90 answered · 0 unanswered/);
      assert.match(await p.locator('#confirmation-text').innerText(), new RegExp(`${(await state()).flags.length} flagged`));
      assert.match(await p.locator('#confirmation-time').innerText(), /Time remaining: \d+:\d\d/);
      await click('cancel-action'); await noFeedback(p);
      await click('submit-test'); await click('confirm-action');
      assert.equal(await p.locator('#results .score').innerText(), '100%');
      assert.match(await p.locator('#results').innerText(), /90 correct · 0 incorrect · 0 unanswered · 90 total/);
      assert.match(await p.locator('#results-title').innerText(), /Student Hub practice/);
      assert.match(await p.locator('#exam-outcome').innerText(), /submitted manually.*Time used:/);
      assert.equal(await p.locator('#results table').count(), 2);
      assert.equal(await p.locator('#feedback .rationale').count(), 4);
      assert.ok(await p.locator('#feedback a').count() > 0);
      for (const href of await p.locator('#feedback a').evaluateAll(links => links.map(a => a.href))) assert.ok(href.startsWith(base + prefix + '/'));
      assert.equal(await p.locator('#answer-options input:disabled').count(), 4);
      const manual = await state(), finalClock = await p.locator('#time-remaining').innerText();
      await p.clock.fastForward(duration);
      assert.deepEqual(await state(), manual); assert.equal(await p.locator('#time-remaining').innerText(), finalClock);
      if (!prefix) await shot(p, 'manual-results');

      // A new attempt gets fresh ordering, responses, notes, and a new start deadline.
      await reset(); assert.equal(await state(), null);
      await p.clock.fastForward(30000); assert.equal(await state(), null);
      await start(); const second = await state();
      assert.notEqual(second.id, initial.id); assert.notDeepEqual(second.questionIds, initial.questionIds);
      assert.ok(second.deadline > initial.deadline); assert.equal(second.deadline - second.startedAt, duration);
      assert.equal(second.tools.whiteboard.text, ''); assert.deepEqual(second.flags, []);
      assert.ok(Object.values(second.answers).every(a => !a.length));
      const single2 = second.questionIds.findIndex(id => question(id).type === 'single');
      await go(single2); await p.locator(`#answer-options input[value="${question(second.questionIds[single2]).correct[0]}"]`).check();
      const multiIndex = second.questionIds.findIndex(id => question(id).type === 'multiple'), multi = question(second.questionIds[multiIndex]);
      await go(multiIndex); await p.locator(`#answer-options input[value="${multi.correct[0]}"]`).check(); await click('flag');
      await p.getByRole('button', { name: 'Whiteboard', exact: true }).click(); await notes.fill('Notes survive automatic submission.');
      await toRemaining(300000); await p.waitForFunction(() => document.getElementById('time-warning').textContent.includes('Five minutes'));
      assert.equal(await p.locator('dialog[open]').count(), 0); assert.equal(await p.locator('#answer-options input:disabled').count(), 0);
      await toRemaining(60000); await p.waitForFunction(() => document.getElementById('time-warning').textContent.includes('One minute'));
      if (prefix) await p.locator('.exam-whiteboard').getByRole('button', { name: 'Clear Notes', exact: true }).click();
      else { await p.getByRole('button', { name: 'Close Whiteboard', exact: true }).click(); await click('submit-test'); }
      assert.equal(await p.locator('dialog[open]').count(), 1);
      await p.clock.setSystemTime(second.deadline + 10000);
      await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await p.locator('#results').waitFor({ state: 'visible' });
      assert.equal(await p.locator('dialog[open]').count(), 0, 'Expiry dismisses pending confirmation rather than waiting for it');
      assert.match(await p.locator('#exam-outcome').innerText(), /Time expired.*90:00 of 90:00/);
      assert.match(await p.locator('#results').innerText(), /1 correct · 1 incorrect · 88 unanswered · 90 total/);
      const expired = await state(); assert.equal(expired.submissionReason, 'expired'); assert.equal(expired.submittedAt, second.deadline);
      assert.equal(expired.tools.whiteboard.text, 'Notes survive automatic submission.');
      await p.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); document.getElementById('submit-test').click(); });
      await p.clock.fastForward(1000); assert.deepEqual(await state(), expired);
      await p.reload(); await p.locator('#results').waitFor({ state: 'visible' }); assert.deepEqual(await state(), expired);

      // Close the browsing context and restore its persisted data in another context after the deadline.
      await reset(); await start(); const saved = await state();
      await p.getByRole('button', { name: 'Whiteboard', exact: true }).click(); await notes.fill('Reopen after closing the browser.');
      const stored = await context.storageState();
      assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
      const reopenedContext = await b.newContext({ storageState: stored }), reopened = await reopenedContext.newPage();
      await reopened.clock.install({ time: saved.deadline + 60000 });
      await reopened.goto(base + prefix + route); await reopened.locator('#results').waitFor({ state: 'visible' });
      const recovered = await reopened.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      assert.equal(recovered.deadline, saved.deadline); assert.equal(recovered.submissionReason, 'expired');
      assert.equal(recovered.submittedAt, saved.deadline); assert.equal(recovered.tools.whiteboard.text, 'Reopen after closing the browser.');
      assert.equal(await reopened.locator('#time-remaining').innerText(), '90:00');
      await reopenedContext.close();
      console.log(`PASS certification browser ${prefix || '/'}: weighted 90-item completion, feedback isolation, changed responses, deadline persistence, background time jump, all layouts/themes, shared whiteboard, manual submission, warnings, modal-safe expiry, exact partial credit, and closed-context recovery.`);
    }

    const unavailable = await b.newContext(), u = await unavailable.newPage();
    const sparse = { ...bank, questions: [...bank.questions.filter(q => q.domain === '1.0').slice(0, 24), ...bank.questions.filter(q => q.domain !== '1.0')] };
    await unavailable.route('**/a-plus-core-2-questions.json', r => r.fulfill({ json: sparse }));
    await u.goto(base + route); await u.locator('#setup').waitFor({ state: 'visible' });
    await u.locator('#mode-certification').click(); assert.equal(await u.locator('#start-exam').isDisabled(), true);
    assert.match(await u.locator('#certification-availability').innerText(), /requires 25.*only 24/);
    assert.equal(await u.evaluate(key => localStorage.getItem(key), KEY), null);
    await u.locator('#mode-practice').click(); assert.equal(await u.locator('#start-test').isDisabled(), false);
    await unavailable.close();

    // Actual v1-shaped Practice Mode state migrates without becoming a timed exam.
    const legacyContext = await b.newContext(), legacyPage = await legacyContext.newPage();
    await legacyPage.goto(base + route); await legacyPage.locator('#start-test').click();
    await legacyPage.getByRole('button', { name: 'Whiteboard', exact: true }).click();
    await legacyPage.getByRole('textbox', { name: 'Exam notes' }).fill('Version 1 practice notes');
    const legacy = await legacyPage.evaluate(key => {
      const s = JSON.parse(localStorage.getItem(key)); s.version = 1; delete s.startedAt; delete s.deadline; delete s.submissionReason;
      localStorage.setItem(key, JSON.stringify(s)); return s;
    }, KEY);
    await legacyPage.reload(); await legacyPage.locator('#exam').waitFor({ state: 'visible' });
    const migrated = await legacyPage.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    assert.equal(migrated.version, 2); assert.equal(migrated.config.mode, 'practice'); assert.equal(migrated.deadline, null);
    assert.deepEqual(migrated.questionIds, legacy.questionIds); assert.equal(migrated.tools.whiteboard.text, 'Version 1 practice notes');
    assert.equal(await legacyPage.locator('#exam-clock').isVisible(), false); await legacyContext.close();

    for (const denied of [true, false]) {
      const context = await b.newContext(), p = await context.newPage();
      await p.clock.install({ time: new Date('2026-10-27T12:00:00Z') });
      await p.addInitScript(denied => {
        for (const key of denied ? ['getItem', 'setItem', 'removeItem'] : ['setItem']) Storage.prototype[key] = () => { throw new DOMException('Unavailable', denied ? 'SecurityError' : 'QuotaExceededError'); };
      }, denied);
      await p.goto(base + route); await p.locator('#setup').waitFor({ state: 'visible' });
      await p.locator('#mode-certification').click(); await p.locator('#start-exam').click();
      assert.match(await p.locator('#save-status').innerText(), /unavailable or full/);
      await p.locator('#answer-options input').first().check(); assert.match(await p.locator('#answer-status').innerText(), /recorded in memory/);
      await p.getByRole('button', { name: 'Whiteboard', exact: true }).click(); await p.getByRole('textbox', { name: 'Exam notes' }).fill('Unsaved exam notes');
      assert.match(await p.locator('.whiteboard-save').innerText(), /could not be saved/);
      await p.clock.fastForward(duration + 1000); await p.locator('#results').waitFor({ state: 'visible' });
      assert.match(await p.locator('#exam-outcome').innerText(), /Time expired/); await context.close();
    }
    console.log('PASS certification availability, explicit v1 Practice migration, denied/full storage, and in-memory expiry.');
  } finally { await b.close(); }
}

if (process.argv.includes('--local')) {
  const site = path.resolve(__dirname, '../site'), mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/, '');
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = path.resolve(site, '.' + decodeURIComponent(pathname));
    if (!target.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, data) => { if (error) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream'); res.end(data); });
  });
  server.listen(0, '127.0.0.1', () => browser(`http://127.0.0.1:${server.address().port}`).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close()));
} else throw new Error('Use --local after a strict MkDocs build.');
