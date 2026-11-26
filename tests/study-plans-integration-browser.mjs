import assert from 'node:assert/strict';
import { storageKey } from '../docs/assets/javascripts/study-plans/progress.mjs';

export async function integrationChecks(browser, root, app, plan, session) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const open = (p, hash) => p.goto(app.href + '#' + hash);
  const activity = (p, title) => p.locator('.study-nav').getByRole('link', { name: title, exact: true });
  const button = title => page.getByRole('button', { name: title, exact: true });
  try {
    const index = await (await page.request.get(new URL('search/search_index.json', root).href)).json();
    for (const cert of ['a-plus-core-2', 'network-plus']) {
      assert.ok(index.docs.some(doc => doc.location.startsWith('certifications/comptia/' + cert + '/') && doc.text.includes('14-Day Certification Study Plan')));
    }
    assert.ok(!index.docs.some(doc => /study-plan\/app\/|assets\/data\/study-plans/.test(doc.location)));
    await open(page, 'day-1/quiz');
    for (const [i, question] of session.quiz.entries()) {
      await page.locator('#answer-' + question.id).fill(i ? question.answers[0] : 'missed');
    }
    await button('Check answers').press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'quiz-score');
    await button('Flag ' + plan.days[0].objectives[0]).click();
    await activity(page, 'Flashcards').click();
    await button('Reveal answer').click();
    await button('Needs review').click();
    await open(page, 'day-14/review');
    for (const [objective, reason] of [[session.cards[0].objective, 'Flashcard'], [session.quiz[0].objective, 'Quiz miss'], [plan.days[0].objectives[0], 'Manual flag']]) {
      await page.locator('.capstone summary').filter({ hasText: objective + ' ' }).filter({ hasText: reason }).waitFor();
    }

    await responsiveChecks(page, app);
    await open(page, 'day-1/worksheet');
    await page.locator('textarea').first().fill('Saved before closing the tab.');
    await page.close();
    const reopened = await context.newPage();
    await open(reopened, 'day-1/worksheet');
    assert.equal(await reopened.locator('textarea').first().inputValue(), 'Saved before closing the tab.');

    // A quota error in this tab must not let a storage event erase its pending input.
    await reopened.evaluate(key => {
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key && !window.allowWrite) throw new DOMException('Quota exceeded', 'QuotaExceededError');
        write.call(this, name, value);
      };
    }, storageKey(plan, 1));
    const note = reopened.locator('textarea').first();
    await note.fill('Unsaved line one\nUnsaved line two');
    await reopened.locator('#storage-note').getByText('Browser storage is unavailable.', { exact: false }).waitFor();
    const peer = await context.newPage();
    await open(peer, 'day-2/review');
    await reopened.evaluate(() => {
      window.peerEdit = new Promise(resolve => window.addEventListener('storage', resolve, { once: true }));
    });
    await peer.getByRole('button', { name: 'Mark review complete' }).click();
    await reopened.evaluate(async () => { await window.peerEdit; });
    assert.ok(await note.evaluate(el => el === document.activeElement));
    await activity(reopened, 'Topic review').click();
    await activity(reopened, 'Worksheet').click();
    assert.equal(await note.inputValue(), 'Unsaved line one\nUnsaved line two');

    // A later retry must preserve a newer edit that another tab saved for this day.
    await open(peer, 'day-1/worksheet');
    await peer.locator('textarea').nth(1).fill('Saved by the other tab.');
    await reopened.evaluate(() => { window.allowWrite = true; });
    await note.fill('My pending changes');
    await peer.reload();
    assert.equal(await peer.locator('textarea').nth(1).inputValue(), 'Saved by the other tab.');
    assert.equal(await note.inputValue(), 'My pending changes');
  } finally {
    await context.close();
  }

  const blocked = await browser.newContext();
  try {
    await blocked.addInitScript(() => {
      for (const method of ['setItem', 'getItem']) Storage.prototype[method] = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    });
    const tab = await blocked.newPage();
    await open(tab, 'day-13/review');
    await tab.getByRole('button', { name: 'Import completed exam result' }).click();
    await tab.locator('.capstone [role=status]').filter({ hasText: /No completed|could not be read/ }).waitFor();
    await tab.locator('[name=percentage]').fill('81');
    await tab.getByRole('link', { name: 'Return to study calendar' }).click();
    await tab.getByRole('link', { name: 'Open Day 13', exact: true }).click();
    assert.equal(await tab.locator('[name=percentage]').inputValue(), '81');
    assert.match(await tab.locator('#storage-note').textContent(), /until you reload/);
  } finally {
    await blocked.close();
  }
}

export async function responsiveChecks(page, app) {
  const screens = [
    ['calendar', '.plan-grid'], ['day-1/review', '.topic-list'], ['day-1/cards', '.card-face'],
    ['day-1/quiz', '#quiz-score'], ['day-1/worksheet', 'textarea'],
    ['day-13/review', '[name=percentage]'], ['day-14/review', '[name=recall]']
  ];
  for (const [hash, selector] of screens) {
    await page.goto(app.href + '#' + hash);
    await page.locator(selector).first().waitFor();
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 850 });
      const wasDark = await page.locator('#theme').getAttribute('aria-pressed') === 'true';
      for (const dark of [!wasDark, wasDark]) {
        await page.locator('#theme').click();
        assert.equal(await page.locator('#theme').getAttribute('aria-pressed'), String(dark));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), hash + ' at ' + width);
        const collisions = await page.evaluate(() => {
          const boxes = [...document.querySelectorAll('.plan-grid article, .study-nav a, .inline-controls button')]
            .filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect());
          return boxes.some((a, i) => boxes.slice(i + 1).some(b => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1));
        });
        assert.equal(collisions, false, hash + ' at ' + width);
      }
    }
  }
}
