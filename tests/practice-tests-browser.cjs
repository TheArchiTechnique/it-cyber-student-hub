const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const bank = require('../docs/assets/data/practice-tests/a-plus-core-2-questions.json');
const KEY = 'student-hub.exam.session.v1';

async function whiteboardFlow(p, state, shot) {
  const tool = name => p.getByRole('button', { name, exact: true });
  const panel = p.locator('.exam-whiteboard'), notes = p.getByRole('textbox', { name: 'Exam notes' });
  const snapshot = s => Object.fromEntries(['answers', 'flags', 'current', 'status', 'finalized', 'questionIds', 'choiceOrder'].map(key => [key, s[key]]));
  const unchanged = async before => assert.deepEqual(snapshot(await state()), snapshot(before), 'Tools must not alter examination responses, flags, position, or scoring inputs');
  const noOverlap = async () => {
    const box = await panel.boundingBox();
    for (const selector of ['#new-test', '#flag', '#previous', '#next', '#submit-test', '#check-answer']) {
      const control = p.locator(selector);
      if (!await control.isVisible()) continue;
      const b = await control.boundingBox();
      assert.ok(box.x + box.width <= b.x + 1 || b.x + b.width <= box.x + 1 || box.y + box.height <= b.y + 1 || b.y + b.height <= box.y + 1, `${selector} obscured by whiteboard`);
    }
  };
  const technical = 'ipconfig /all\n  IPv4 Address . . : 192.0.2.25\n\tDNS: 192.0.2.53\nC:\\Users\\Student\n<img src=x onerror=alert(1)>\n';
  const first = await state(), firstQuestion = bank.questions.find(q => q.id === first.questionIds[0]);
  for (const id of firstQuestion.correct) await p.locator(`#answer-options input[value="${id}"]`).check();
  await p.locator('#flag').click();
  const before = await state();
  assert.equal(await tool('Whiteboard').count(), 1);
  await tool('Whiteboard').click(); await panel.waitFor({ state: 'visible' });
  assert.equal(await notes.evaluate(el => el === document.activeElement), true);
  await notes.fill(technical);
  assert.equal((await state()).tools.whiteboard.text, technical);
  assert.equal(await panel.locator('img').count(), 0, 'Pasted markup stays plain text');
  await unchanged(before); await noOverlap();

  // Native keyboard clipboard operations retain technical line breaks, tabs and spaces.
  await notes.press('Control+A'); await notes.press('Control+C'); await notes.press('Control+X');
  assert.equal(await notes.inputValue(), ''); await notes.press('Control+V');
  assert.equal(await notes.inputValue(), technical);
  const initialBounds = (await state()).tools.whiteboard.bounds;
  const title = tool('Move Whiteboard'), titleBox = await title.boundingBox();
  await p.mouse.move(titleBox.x + 40, titleBox.y + 20); await p.mouse.down();
  await p.mouse.move(titleBox.x - 24, titleBox.y + 36, { steps: 8 }); await p.mouse.up();
  assert.ok((await state()).tools.whiteboard.bounds.x < initialBounds.x, 'Pointer dragging moves the panel');
  await title.focus(); const moved = (await state()).tools.whiteboard.bounds;
  await p.keyboard.press('ArrowLeft'); assert.equal((await state()).tools.whiteboard.bounds.x, Math.max(0, moved.x - 16));
  const resize = tool('Resize Whiteboard'), handle = await resize.boundingBox();
  const oldSize = (await state()).tools.whiteboard.bounds;
  await p.mouse.move(handle.x + 20, handle.y + 20); await p.mouse.down();
  await p.mouse.move(handle.x - 12, handle.y + 30, { steps: 8 }); await p.mouse.up();
  assert.ok((await state()).tools.whiteboard.bounds.width < oldSize.width, 'Pointer resizing changes panel size');
  await resize.focus(); const resized = (await state()).tools.whiteboard.bounds;
  await p.keyboard.press('ArrowLeft'); assert.equal((await state()).tools.whiteboard.bounds.width, Math.max(280, resized.width - 16));
  await unchanged(before); await noOverlap();
  const dimensions = (await state()).tools.whiteboard.bounds;
  await tool('Minimize Whiteboard').click(); assert.equal(await notes.isVisible(), false);
  await tool('Restore Whiteboard').click(); assert.equal(await notes.inputValue(), technical);
  assert.deepEqual((await state()).tools.whiteboard.bounds, dimensions);
  await tool('Close Whiteboard').click(); assert.equal(await panel.isVisible(), false);
  assert.equal(await tool('Whiteboard').evaluate(el => el === document.activeElement), true);
  await tool('Whiteboard').click(); assert.equal(await notes.inputValue(), technical);
  await tool('Whiteboard').click(); assert.equal(await panel.isVisible(), false);
  await tool('Whiteboard').click();

  // Cancel and Escape leave notes intact; confirmed clear touches only tool text.
  const clear = panel.getByRole('button', { name: 'Clear Notes', exact: true });
  const dialog = p.locator('.whiteboard-confirmation');
  await clear.click(); assert.equal(await dialog.getByRole('button', { name: 'Cancel', exact: true }).evaluate(el => el === document.activeElement), true);
  for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true); }
  await p.keyboard.press('Escape'); assert.equal(await notes.inputValue(), technical);
  await clear.click(); await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); assert.equal(await notes.inputValue(), technical);
  await clear.click(); await dialog.getByRole('button', { name: 'Clear Notes', exact: true }).click();
  assert.equal(await notes.inputValue(), ''); await unchanged(before);
  await notes.fill(technical);
  await tool('Minimize Whiteboard').click(); const checkpoint = await state();
  await p.reload(); await panel.waitFor({ state: 'visible' });
  await unchanged(checkpoint); assert.deepEqual((await state()).tools.whiteboard, checkpoint.tools.whiteboard);
  await tool('Restore Whiteboard').click(); assert.equal(await notes.inputValue(), technical);
  await tool('Dock Whiteboard').click(); assert.equal(await panel.getAttribute('data-docked'), 'true');
  await p.reload(); await panel.waitFor({ state: 'visible' }); assert.equal(await panel.getAttribute('data-docked'), 'true');
  await tool('Float Whiteboard').click(); assert.equal(await panel.getAttribute('data-docked'), 'false');

  // Copy actual examination evidence, then navigate without remounting the tool.
  const evidenceIndex = first.questionIds.findIndex(id => bank.questions.find(q => q.id === id).evidence);
  await p.locator('#question-navigator button').nth(evidenceIndex).click();
  const evidence = p.locator('#question-body pre'), output = await evidence.innerText();
  await evidence.focus();
  await evidence.evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await p.keyboard.press('Control+C'); await notes.focus(); await notes.press('Control+End'); await notes.press('Control+V');
  assert.equal(await notes.inputValue(), technical + output);
  const navigation = p.locator(await p.locator('#next').isDisabled() ? '#previous' : '#next');
  await navigation.focus(); await p.keyboard.press('Enter');
  assert.equal(await notes.inputValue(), technical + output, 'Keyboard navigation works with the nonmodal whiteboard');
  for (const type of ['single', 'multiple']) {
    const index = first.questionIds.findIndex(id => bank.questions.find(q => q.id === id).type === type);
    await p.locator('#question-navigator button').nth(index).click();
    const question = bank.questions.find(q => q.id === first.questionIds[index]);
    for (const id of question.correct) await p.locator(`#answer-options input[value="${id}"]`).check();
    const selected = await state();
    await notes.fill(technical + output); await unchanged(selected);
    assert.equal(await notes.inputValue(), technical + output);
  }
  await p.locator('#question-navigator button').first().click();
  const expected = await state();

  // The native limit and defensive handling cap oversized pastes without resetting the attempt.
  await notes.fill('x'.repeat(199995));
  await p.evaluate(async () => navigator.clipboard.writeText('12345678901234567890'));
  await notes.focus(); await notes.press('Control+End'); await notes.press('Control+V');
  assert.equal((await notes.inputValue()).length, 200000);
  assert.equal((await state()).tools.whiteboard.text.length, 200000);
  assert.match(await panel.locator('.whiteboard-limit').innerText(), /limit/);
  await notes.press('a'); assert.equal((await notes.inputValue()).length, 200000);
  await notes.evaluate(el => { el.value = 'z'.repeat(200001); el.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal((await state()).tools.whiteboard.text.length, 200000);
  await notes.fill(technical); await unchanged(expected);

  // Corrupt tool geometry must recover independently of valid examination state.
  for (const bounds of [{ x: -99999, y: 99999, width: 99999, height: 99999 }, { x: 'bad', y: null, width: -4, height: 0 }, { x: 1, y: -100, width: -1, height: 2 }]) {
    await p.evaluate(({ key, bounds }) => { const s = JSON.parse(localStorage.getItem(key)); s.tools.whiteboard.bounds = bounds; localStorage.setItem(key, JSON.stringify(s)); }, { key: KEY, bounds });
    await p.reload(); await panel.waitFor({ state: 'visible' });
    const b = (await state()).tools.whiteboard.bounds;
    const a = await p.locator('#exam-question-content').boundingBox();
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= a.width + 1 && b.y + b.height <= a.height + 1);
    assert.equal(await notes.inputValue(), technical); await unchanged(expected); await noOverlap();
  }
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.waitForFunction(width => document.querySelector('.exam-whiteboard').dataset.docked === String(width <= 850), width);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await noOverlap();
    for (const dark of [false, true]) {
      if ((await p.locator('body').getAttribute('data-md-color-scheme') === 'slate') !== dark) await p.locator('#theme-toggle').click();
      await panel.scrollIntoViewIfNeeded();
      await shot(p, `whiteboard-${width}-${dark ? 'dark' : 'light'}`);
      assert.equal(await notes.inputValue(), technical);
    }
    await p.locator('#theme-toggle').click();
    await tool('Minimize Whiteboard').click(); await tool('Restore Whiteboard').click();
    assert.equal(await notes.inputValue(), technical);
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  await notes.focus(); await p.keyboard.press('Escape'); assert.equal(await panel.isVisible(), false);
  await p.locator('#flag').click();
}

async function browser(base) {
  const b = await chromium.launch({ headless: true, executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const route = '/practice/tests/app/';
  const shot = async (p, name) => {
    if (!process.env.EXAM_QA_SCREENSHOT_DIR) return;
    fs.mkdirSync(process.env.EXAM_QA_SCREENSHOT_DIR, { recursive: true });
    await p.screenshot({ path: path.join(process.env.EXAM_QA_SCREENSHOT_DIR, name + '.png'), fullPage: true });
  };
  try {
    for (const prefix of ['', '/it-cyber-student-hub']) {
      const context = await b.newContext({ viewport: { width: 1440, height: 1000 } }), p = await context.newPage();
      const errors = [], missing = [];
      p.on('pageerror', e => errors.push(e.message));
      p.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) missing.push(response.url()); });
      const state = () => p.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
      const click = id => p.locator('#' + id).click();
      const overflow = async () => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Horizontal overflow at ${p.viewportSize().width}px`);
      const reset = async () => { await click('new-test'); await click('confirm-action'); await p.locator('#setup').waitFor({ state: 'visible' }); };
      const start = async (count = 'all') => { await p.locator('#count-preset').selectOption(count); await click('start-test'); await p.locator('#exam').waitFor({ state: 'visible' }); };
      const go = index => p.locator('#question-navigator button').nth(index).click();
      const onlyObjective = async id => {
        await click('select-none');
        await p.locator(`[id="domain-${id.split('.')[0]}.0"]`).check();
        const block = p.locator('.domain-block').filter({ has: p.locator(`[id="objective-${id}"]`) });
        await block.locator('summary').click();
        const inputs = block.locator('.objectives input');
        for (let i = 0; i < await inputs.count(); i++) if (!await inputs.nth(i).isDisabled()) await inputs.nth(i).uncheck();
        await p.locator(`[id="objective-${id}"]`).check();
      };
      await p.goto(base + prefix + route);
      await p.locator('#setup').waitFor({ state: 'visible' });
      assert.equal(await p.locator('#certification option').count(), 1);
      assert.equal(await p.getByRole('button', { name: 'Whiteboard', exact: true }).count(), 0);
      assert.equal(await p.getByRole('button', { name: 'Certification Mode', exact: true }).count(), 0);
      assert.match(await p.locator('#available').innerText(), /24 validated/);
      assert.equal(await p.locator('[id="objective-1.2"]').isDisabled(), true, 'No empty objectives can be launched');
      await overflow();
      if (!prefix) await shot(p, 'practice-setup-desktop');
      await click('select-none'); assert.equal(await p.locator('#start-test').isDisabled(), true);
      await p.locator('[id="domain-2.0"]').check();
      assert.match(await p.locator('#available').innerText(), /6 validated/);
      assert.equal(await p.locator('#count-preset option[value="10"]').isDisabled(), true);
      await click('use-available'); assert.equal(await p.locator('#start-test').isDisabled(), false);
      await p.locator('[id="domain-1.0"]').check(); assert.match(await p.locator('#available').innerText(), /12 validated/);
      await onlyObjective('2.2'); assert.match(await p.locator('#available').innerText(), /2 validated/);
      await click('select-all');
      await p.locator('#count-preset').selectOption('custom');
      for (const value of ['0', '1.5', '99']) { await p.locator('#custom-count').fill(value); assert.equal(await p.locator('#start-test').isDisabled(), true); }
      await click('use-available');
      await start();
      const first = await state(); assert.equal(first.questionIds.length, 24);
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await whiteboardFlow(p, state, prefix ? async () => {} : shot);
      assert.equal(await p.locator('#feedback').isVisible(), false);
      assert.equal(await p.locator('#previous').isDisabled(), true);
      assert.equal(await p.locator('#choices legend').innerText().then(t => /Select (one|2)/.test(t)), true);
      for (let index = 0; index < 24; index++) {
        await go(index);
        const id = first.questionIds[index], q = bank.questions.find(q => q.id === id);
        assert.equal(await p.locator('#question-body').innerText().then(t => t.includes('Objectives:')), false);
        for (const answer of q.correct) await p.locator(`#answer-options input[value="${answer}"]`).check();
        if (index < 2) await click('flag');
        assert.equal(await p.locator('#feedback').isVisible(), false, 'End feedback must stay hidden');
        if (index === 8) {
          const checkpoint = await state();
          await p.evaluate(key => { const s = JSON.parse(localStorage.getItem(key)); s.tools.whiteboard.text = 'diagnostic notes\n  preserved spacing'; localStorage.setItem(key, JSON.stringify(s)); }, KEY);
          await p.reload(); await p.locator('#exam').waitFor({ state: 'visible' });
          const restored = await state();
          for (const key of ['questionIds', 'choiceOrder', 'answers', 'flags', 'current']) assert.deepEqual(restored[key], checkpoint[key]);
          assert.equal(restored.tools.whiteboard.text, 'diagnostic notes\n  preserved spacing');
        }
      }
      assert.match(await p.locator('#progress-text').innerText(), /24 of 24 answered · 2 flagged/);
      assert.equal(await p.locator('#next').isDisabled(), true);
      await p.getByRole('button', { name: 'Whiteboard', exact: true }).click();
      await p.getByRole('textbox', { name: 'Exam notes' }).fill('Notes persist through submission and review.');
      await click('submit-test');
      assert.equal(await p.locator('#cancel-action').evaluate(el => el === document.activeElement), true);
      for (let i = 0; i < 8; i++) { await p.keyboard.press('Tab'); assert.equal(await p.locator('#confirmation').evaluate(el => el.contains(document.activeElement)), true); }
      await p.keyboard.press('Escape'); assert.equal((await state()).status, 'active');
      await click('submit-test'); await click('confirm-action');
      assert.equal(await p.locator('#results .score').innerText(), '100%');
      assert.match(await p.locator('#results').innerText(), /24 correct · 0 incorrect · 0 unanswered · 24 total/);
      assert.equal(await p.locator('#results table').count(), 2);
      assert.equal(await p.locator('#feedback .rationale').count(), 4);
      assert.equal(await p.locator('#flag').isDisabled(), true);
      assert.equal(await p.locator('.exam-whiteboard').isVisible(), true);
      assert.equal(await p.getByRole('textbox', { name: 'Exam notes' }).inputValue(), 'Notes persist through submission and review.');
      await p.getByRole('textbox', { name: 'Exam notes' }).fill('Review notes do not affect scores.');
      assert.equal(await p.locator('#results .score').innerText(), '100%');
      await p.getByRole('button', { name: 'Close Whiteboard', exact: true }).click();
      for (const resource of new Set(bank.questions.flatMap(q => q.resources.map(r => r.path)))) {
        const [file, fragment] = resource.split('#');
        const href = file.replace(/README\.md$/, '').replace(/\.md$/, '/');
        const response = await context.request.get(base + prefix + '/' + href);
        assert.equal(response.status(), 200, href);
        if (fragment) assert.ok((await response.text()).includes(`id="${fragment}"`), `Missing anchor ${resource}`);
      }
      for (const width of [320, 390, 768, 1440]) { await p.setViewportSize({ width, height: 1000 }); await overflow(); }
      if (!prefix) await shot(p, 'practice-results-desktop');
      await p.reload(); await p.locator('#results').waitFor({ state: 'visible' }); assert.equal(await p.locator('#results .score').innerText(), '100%');
      await click('new-test'); await click('cancel-action'); assert.equal((await state()).status, 'submitted');
      await reset(); assert.equal(await state(), null);

      // Immediate feedback commits explicitly, locks the answer, and survives refresh.
      await onlyObjective('1.5'); await p.locator('#feedback-timing').selectOption('immediate'); await start();
      const immediate = await state(); assert.notEqual(immediate.id, first.id); assert.equal(immediate.tools.whiteboard.text, '');
      assert.equal(immediate.tools.whiteboard.visible, false); assert.equal(immediate.tools.whiteboard.bounds, null);
      assert.equal(immediate.tools.whiteboard.minimized, false); assert.equal(immediate.tools.whiteboard.docked, false);
      const command = bank.questions.find(q => q.id === immediate.questionIds[0]);
      const wrong = command.choices.find(c => !command.correct.includes(c.id)).id;
      await p.locator(`#answer-options input[value="${wrong}"]`).focus(); await p.keyboard.press('Space');
      assert.equal(await p.locator('#feedback').isVisible(), false);
      await p.locator(`#answer-options input[value="${command.correct[0]}"]`).check();
      await click('check-answer'); assert.equal(await p.locator('#feedback').isVisible(), true);
      assert.equal(await p.locator('#answer-options input:disabled').count(), 4);
      await p.reload(); await p.locator('#feedback').waitFor({ state: 'visible' }); assert.equal(await p.locator('#answer-options input:disabled').count(), 4);
      await click('submit-test'); await click('confirm-action'); assert.equal(await p.locator('#results .score').innerText(), '100%');
      await reset();

      // Correct answers without explanations; a partially selected multi-response earns zero.
      await onlyObjective('2.1'); await p.locator('#show-explanations').uncheck(); await p.locator('#feedback-timing').selectOption('end'); await start();
      await p.locator('#answer-options input[value="a"]').check();
      await click('submit-test'); await click('confirm-action');
      assert.equal(await p.locator('#results .score').innerText(), '0%');
      assert.match(await p.locator('#results').innerText(), /0 correct · 1 incorrect · 0 unanswered/);
      assert.equal(await p.locator('#feedback').isVisible(), true); assert.equal(await p.locator('#feedback .rationale').count(), 0);
      await reset();

      // Hidden feedback stays hidden in results; incomplete submission requires confirmation.
      await onlyObjective('1.9'); await p.locator('#show-answers').uncheck();
      assert.equal(await p.locator('#show-explanations').isChecked(), false); assert.equal(await p.locator('#show-explanations').isDisabled(), true);
      assert.equal(await p.locator('#feedback-timing').isDisabled(), true);
      await start(); await click('submit-test'); assert.match(await p.locator('#confirmation-text').innerText(), /1 question is unanswered/);
      await click('cancel-action'); assert.equal((await state()).status, 'active');
      await click('submit-test'); await click('confirm-action');
      assert.match(await p.locator('#results').innerText(), /0 correct · 0 incorrect · 1 unanswered/);
      assert.equal(await p.locator('#feedback').isVisible(), false); assert.equal(await p.locator('#feedback').innerText(), '');
      await reset();

      // Layout, touch-sized targets, dark theme, and readable technical output.
      await p.locator('#show-answers').check(); await p.locator('#show-explanations').check();
      for (const width of [320, 390, 768, 1440]) { await p.setViewportSize({ width, height: 900 }); await overflow(); }
      await onlyObjective('1.9'); await start();
      assert.match(await p.locator('#question-body pre').innerText(), /-rw-r-----/);
      for (const width of [320, 390, 768, 1440]) { await p.setViewportSize({ width, height: 900 }); await overflow(); }
      await p.setViewportSize({ width: 390, height: 844 });
      if (!prefix) await shot(p, 'practice-question-mobile');
      await click('theme-toggle'); assert.equal(await p.locator('body').getAttribute('data-md-color-scheme'), 'slate'); await overflow();
      if (!prefix) await shot(p, 'practice-question-mobile-dark');
      await click('theme-toggle');

      // Stale/corrupt sessions recover to configuration without reusing old progress.
      const stale = await state(); stale.bankVersion = 'old';
      for (const raw of [JSON.stringify(stale), '{broken', JSON.stringify({ version: 99 })]) {
        await p.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: KEY, raw }); await p.reload();
        await p.locator('#setup').waitFor({ state: 'visible' }); assert.match(await p.locator('#notice').innerText(), /saved test/i);
      }
      await p.goto(base + prefix + '/certifications/comptia/a-plus-core-2/');
      await p.locator('.hub-page a').filter({ hasText: /^A\+ Core 2 Practice Test$/ }).click();
      assert.ok(p.url().endsWith('/practice/tests/'));
      await p.getByRole('link', { name: 'Launch A+ Core 2 Practice Test', exact: true }).click();
      assert.ok(p.url().endsWith(route) || p.url().endsWith(route + 'index.html'));
      await p.locator('#setup').waitFor({ state: 'visible' });
      await click('select-all'); await start();
      await p.getByRole('link', { name: 'A+ Core 2', exact: true }).click(); assert.ok(p.url().endsWith('/certifications/comptia/a-plus-core-2/'));
      assert.deepEqual(errors, []); assert.deepEqual(missing, []); await context.close();
    }

    const blocked = await b.newContext(), p = await blocked.newPage();
    await p.addInitScript(() => { for (const key of ['getItem', 'setItem', 'removeItem']) Storage.prototype[key] = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
    await p.goto(base + route); await p.locator('#setup').waitFor({ state: 'visible' });
    await p.locator('#start-test').click(); await p.locator('#exam').waitFor({ state: 'visible' }); assert.match(await p.locator('#save-status').innerText(), /unavailable/);
    await p.getByRole('button', { name: 'Whiteboard', exact: true }).click();
    await p.getByRole('textbox', { name: 'Exam notes' }).fill('Unsaved notes remain usable in memory.');
    assert.match(await p.locator('.whiteboard-save').innerText(), /could not be saved/);
    await p.getByRole('button', { name: 'Close Whiteboard', exact: true }).click();
    await p.getByRole('button', { name: 'Whiteboard', exact: true }).click();
    assert.equal(await p.getByRole('textbox', { name: 'Exam notes' }).inputValue(), 'Unsaved notes remain usable in memory.');
    await p.getByRole('button', { name: 'Close Whiteboard', exact: true }).click();
    await p.locator('#answer-options input').first().check(); await p.locator('#submit-test').click(); await p.locator('#confirm-action').click(); await p.locator('#results').waitFor({ state: 'visible' });
    await blocked.close();
    const quota = await b.newContext(), full = await quota.newPage();
    await full.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
    await full.goto(base + route); await full.locator('#start-test').click();
    await full.getByRole('button', { name: 'Whiteboard', exact: true }).click();
    await full.getByRole('textbox', { name: 'Exam notes' }).fill('Quota failure preserves current notes.');
    assert.match(await full.locator('.whiteboard-save').innerText(), /unavailable or full/);
    await quota.close();
    const nojs = await b.newContext({ javaScriptEnabled: false }), plain = await nojs.newPage();
    await plain.goto(base + route); assert.match(await plain.locator('noscript').innerText(), /JavaScript is required/); await nojs.close();
    const touch = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), mobile = await touch.newPage();
    await mobile.goto(base + route); await mobile.locator('#setup').waitFor({ state: 'visible' });
    await mobile.locator('#start-test').tap(); await mobile.locator('#answer-options label').first().tap(); await mobile.locator('#flag').tap(); assert.equal(await mobile.locator('#flag').getAttribute('aria-pressed'), 'true');
    await mobile.getByRole('button', { name: 'Whiteboard', exact: true }).tap();
    await mobile.getByRole('textbox', { name: 'Exam notes' }).fill('Touch notes\n  retain spacing');
    assert.equal(await mobile.locator('.exam-whiteboard').getAttribute('data-docked'), 'true');
    await mobile.getByRole('button', { name: 'Minimize Whiteboard', exact: true }).tap();
    await mobile.getByRole('button', { name: 'Restore Whiteboard', exact: true }).tap();
    assert.equal(await mobile.getByRole('textbox', { name: 'Exam notes' }).inputValue(), 'Touch notes\n  retain spacing');
    await mobile.getByRole('button', { name: 'Close Whiteboard', exact: true }).tap();
    assert.equal(await mobile.locator('#flag').getAttribute('aria-pressed'), 'true');
    await touch.close();
    console.log('PASS browser: practice-test regression plus floating/docked whiteboard, pointer/keyboard movement and resizing, native clipboard formatting and inert markup, clear confirmation/cancellation, navigation/answer/flag/scoring independence, refresh and geometry recovery, new-attempt isolation, 200,000-character cap, denied/full storage, and light/dark 320/390/768/1440px layouts at root and project URL prefixes.');
  } finally { await b.close(); }
}

if (process.argv.includes('--local')) {
  const site = path.resolve(__dirname, '../site'), mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/, '');
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = path.resolve(site, '.' + decodeURIComponent(pathname));
    if (!target.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, data) => { if (error) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream'); res.end(data); });
  });
  server.listen(0, '127.0.0.1', () => browser(`http://127.0.0.1:${server.address().port}`).catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close()));
} else if (process.env.EXAM_BASE_URL) browser(process.env.EXAM_BASE_URL).catch(error => { console.error(error); process.exitCode = 1; });
else throw new Error('Use --local after mkdocs build, or provide EXAM_BASE_URL.');
