import assert from 'node:assert/strict';
import { networkCapstoneChecks } from './network-plus-capstone-browser.mjs';
import { matches } from '../docs/assets/javascripts/study-plans/progress.mjs';

export async function networkPlanChecks(browser, root) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const certification = new URL('certifications/comptia/network-plus/', root);
  const app = new URL('study-plan/app/', certification);
  const data = new URL('assets/data/study-plans/n10-009/', root);
  const get = async url => {
    const response = await page.request.get(url.href);
    assert.equal(response.status(), 200, url.href);
    return response;
  };
  const open = async (url, hash) => page.goto(url.href + '#' + hash);
  const button = name => page.getByRole('button', { name, exact: true });
  const active = kind => page.locator('.study-nav').getByRole('link', { name: kind, exact: true });
  try {
    const plan = await (await get(new URL('plan.json', data))).json();
    const ids = [8, 4, 5, 3, 5].flatMap((count, d) => Array.from({ length: count }, (_, i) => (d + 1) + '.' + (i + 1)));
    assert.deepEqual(Object.keys(plan.objectives), ids);
    assert.deepEqual(plan.domains.map(domain => domain.weight), [23, 20, 19, 14, 24]);
    assert.deepEqual(new Set(plan.days.slice(0, 12).flatMap(day => day.objectives)), new Set(ids));
    assert.deepEqual(plan.days.map(day => day.minutes), [100, 120, 120, 120, 120, 120, 105, 100, 100, 120, 120, 120, 120, 75]);
    const coreApp = new URL('certifications/comptia/a-plus-core-2/study-plan/app/', root);
    await open(coreApp, 'day-1/review');
    await button('Mark review complete').click();
    await page.goto(certification.href);
    await page.locator('.hub-page').getByRole('link', { name: 'Start Studying', exact: true }).click();
    await page.locator('.hub-page').getByRole('link', { name: '14-Day Certification Study Plan' }).press('Enter');
    await page.locator('.plan-grid').waitFor();
    const available = plan.days.filter(day => day.session);
    assert.deepEqual(available.map(day => day.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    assert.equal(await page.locator('.plan-grid article').count(), 14);
    assert.equal(await page.locator('.plan-grid .open').count(), 14);
    assert.equal(await page.locator('#edition').innerText(), 'CompTIA Network+ · N10-009 · V9');
    // An edition with a scheduled capstone still returns direct links to the calendar.
    const partial = structuredClone(plan);
    delete partial.days[13].session;
    const planURL = new URL('plan.json', data).href;
    await page.route(planURL, route => route.fulfill({ json: partial }));
    await page.reload();
    await page.locator('.plan-grid').waitFor();
    assert.equal(await page.locator('.plan-grid article').nth(13).locator('.open').count(), 0);
    await open(app, 'day-14/review');
    await page.getByRole('heading', { name: 'Study calendar' }).waitFor();
    await page.unroute(planURL);
    await page.reload();
    for (const objective of Object.values(plan.objectives)) {
      const url = new URL(objective.reading, app);
      assert.ok((await (await get(url)).text()).includes('id="' + url.hash.slice(1) + '"'), objective.reading);
    }
    const listing = await (await get(certification)).text();
    for (const [, href] of Object.values(plan.resources)) {
      const url = new URL(href, root);
      if (url.origin === root.origin) await get(url);
      else assert.ok(listing.includes(url.href), url.href);
    }
    for (const day of available.slice(0, 12)) {
      const session = await (await get(new URL(day.session, data))).json();
      assert.equal(Object.values(session.minutes).reduce((sum, minutes) => sum + minutes, 0), day.minutes);
      for (const [, href] of session.sources) {
        const url = new URL(href, app);
        if (url.origin !== root.origin) continue;
        const html = await (await get(url)).text();
        if (url.hash) assert.ok(html.includes('id="' + url.hash.slice(1) + '"'), href);
      }
      for (const items of [session.review, session.cards, session.quiz, session.worksheet]) {
        assert.deepEqual(new Set(items.map(item => item.objective)), new Set(day.objectives));
      }
      for (const items of [session.cards, session.quiz, session.worksheet]) {
        assert.equal(new Set(items.map(item => item.id)).size, items.length);
      }
      await open(app, 'calendar');
      await page.getByRole('link', { name: 'Open Day ' + day.number, exact: true }).press('Enter');
      await button('Mark review complete').click();
      const hrefs = await page.locator('.topic-list a').evaluateAll(links => links.map(link => link.href));
      assert.deepEqual(hrefs, day.resources.map(key => new URL(plan.resources[key][1], root).href));
      await active('Flashcards').press('Enter');
      for (const card of session.cards) {
        await page.getByRole('heading', { name: card.prompt, exact: true }).waitFor();
        await button('Reveal answer').press('Enter');
        await page.getByText(card.answer, { exact: true }).waitFor();
        await button('Known').press('Enter');
      }
      await active('Recall quiz').click();
      for (const q of session.quiz) {
        assert.ok(q.answers.every(answer => matches(q, answer)) && !matches(q, 'incorrect'));
        await page.locator('#answer-' + q.id).fill(q.answers.at(-1));
      }
      if (day.number >= 4) {
        const first = session.quiz[0];
        await page.locator('#answer-' + first.id).fill('incorrect');
        await button('Check answers').click();
        assert.equal(await page.locator('#feedback-' + first.id).innerText(), 'Review this answer. ' + first.answers[0] + '. ' + first.explanation);
        await button('Retry quiz').click();
        for (const q of session.quiz) await page.locator('#answer-' + q.id).fill(q.answers[0]);
      }
      await button('Check answers').click();
      await page.reload();
      assert.equal(await page.locator('#quiz-score').innerText(), 'Last attempt: ' + session.quiz.length + ' / ' + session.quiz.length);
      for (const q of session.quiz) assert.ok((await page.locator('#feedback-' + q.id).innerText()).includes(q.explanation));
      await active('Worksheet').click();
      for (const [index, task] of session.worksheet.entries()) {
        assert.ok(['Factual', 'Example'].includes(task.type), task.id);
        assert.ok(task.prompt.trim() && !['Factual', 'Example'].includes(task.prompt)
          && task.source.trim() && task.key.trim(), task.id);
        await page.getByRole('textbox', { name: (index + 1) + '. ' + task.prompt, exact: true }).waitFor();
      }
      for (const task of session.worksheet) await page.locator('#answer-' + task.id).fill('My reasoning for ' + task.id);
      await button('Complete worksheet and review key').click();
      await page.getByText('Completed · 4 of 4 activities completed').waitFor();
      for (const task of session.worksheet) assert.ok((await page.locator('.feedback').allTextContents()).some(text => text.includes(task.key)));
      await page.evaluate(() => { window.print = () => dispatchEvent(new Event('beforeprint')); });
      for (const [label, filled] of [['Print blank worksheet', false], ['Print my responses', true]]) {
        await button(label).click();
        await page.emulateMedia({ media: 'print' });
        assert.ok(await page.locator('#print-sheet').isVisible());
        assert.equal(await page.locator('.print-item').count(), session.worksheet.length);
        const printed = await page.locator('#print-sheet').innerText();
        assert.equal(printed.includes('My reasoning'), filled);
        for (const task of session.worksheet) assert.ok(printed.includes(task.prompt), 'Day ' + day.number + ' print: ' + task.id);
        await page.emulateMedia({ media: 'screen' });
        await page.evaluate(() => dispatchEvent(new Event('afterprint')));
      }
    }
    await open(app, 'calendar');
    await page.getByText('12 of 14 days completed · 14 interactive sessions available').waitFor();
    const reopened = await context.newPage();
    await reopened.goto(app.href);
    await reopened.getByText('12 of 14 days completed · 14 interactive sessions available').waitFor();
    await reopened.close();
    await networkCapstoneChecks(page, plan, root, app, coreApp);
    await open(app, 'day-1/review');
    page.once('dialog', dialog => dialog.accept());
    await button('Reset this day').click();
    await page.getByText('Not started · 0 of 4 activities completed').waitFor();
    await open(coreApp, 'day-1/review');
    await button('Mark review unread').waitFor();
    await open(app, 'day-2/review');
    await page.getByText('Completed · 4 of 4 activities completed').waitFor();
    await page.setViewportSize({ width: 320, height: 720 });
    await page.locator('#theme').click();
    for (const view of ['calendar', 'day-1/review', 'day-2/cards', 'day-3/quiz', 'day-3/worksheet', 'day-4/worksheet', 'day-5/quiz', 'day-6/review', 'day-7/cards', 'day-8/review', 'day-8/quiz', 'day-8/worksheet', 'day-9/quiz', 'day-10/review', 'day-11/quiz', 'day-12/worksheet', 'day-13/review', 'day-14/review']) {
      await open(app, view);
      await page.locator('#view .panel').first().waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), view);
    }
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
