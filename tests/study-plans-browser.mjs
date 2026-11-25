import { networkPlanChecks } from './network-plus-study-plan-browser.mjs';
import { integrationChecks } from './study-plans-integration-browser.mjs';
import { capstoneFlow } from './study-plans-capstone-browser.mjs';
// Serve a built site locally and pass its root URL (including any project prefix).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import { storageKey } from '../docs/assets/javascripts/study-plans/progress.mjs';

const root = new URL(process.argv[2] || 'http://127.0.0.1:8000/');
const app = new URL('certifications/comptia/a-plus-core-2/study-plan/app/', root);
const data = new URL('../docs/assets/data/study-plans/220-1202/', import.meta.url);
const plan = JSON.parse(await readFile(new URL('plan.json', data)));
const engine = { chromium, firefox, webkit }[process.env.STUDY_PLAN_BROWSER || 'chromium'];
const browser = await engine.launch(engine === chromium ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', r => new URL(r.request().url()).origin === root.origin ? r.continue() : r.abort());
  const btn = name => page.getByRole('button', { name, exact: true });
  const nav = name => page.locator('.study-nav').getByRole('link', { name, exact: true });
  const hubLink = name => page.locator('.hub-page').getByRole('link', { name, exact: true });
  await page.goto(new URL('certifications/', root).href);
  await hubLink('CompTIA').click();
  await hubLink('A+ Core 2').click();
  await hubLink('Start Studying').click();
  await hubLink('14-Day Certification Study Plan').press('Enter');
  await page.locator('.plan-grid').waitFor();
  assert.equal(await page.locator('.plan-grid article').count(), 14);
  assert.equal(await page.locator('.plan-grid .open').count(), 14);
  assert.ok([app.pathname, app.pathname + 'index.html'].includes(new URL(page.url()).pathname));
  for (const [index, day] of plan.days.entries()) {
    const card = page.locator('.plan-grid article').nth(index);
    assert.equal(await card.locator('h2').textContent(), day.title);
    assert.ok((await card.innerText()).includes(day.minutes + ' min'));
    assert.ok((await card.innerText()).includes(day.goal));
    assert.ok((await card.innerText()).includes(day.objectives.length === 36 ? 'All 36 objectives' : day.objectives.join(', ')));
  }
  const readDay = number => page.evaluate(key => localStorage.getItem(key), storageKey(plan, number));
  let previousDays;
  let daysSevenToNine;
  for (const day of plan.days.slice(0, 12)) {
    const session = JSON.parse(await readFile(new URL(day.session, data)));
    const number = day.number;
    if (number === 10) {
      daysSevenToNine = await Promise.all([7, 8, 9].map(readDay));
      assert.ok(daysSevenToNine.every(Boolean));
    }
    if (number === 7) {
      previousDays = await Promise.all([1, 2, 3, 4, 5, 6].map(readDay));
      assert.ok(previousDays.every(Boolean));
    }
    await page.getByRole('link', { name: 'Open Day ' + number, exact: true }).press('Enter');
    await btn('Mark review complete').click();
    await nav('Flashcards').press('Enter');
    for (let i = 0; i < session.cards.length; i++) {
      await btn('Reveal answer').press('Enter');
      await btn(i === 0 ? 'Needs review' : 'Known').press('Enter');
    }
    await page.reload();
    await page.getByText('11 of 12 known.', { exact: false }).waitFor();
    assert.equal(await page.locator('.card-face h3').textContent(), session.cards[0].prompt);
    await btn('Reveal answer').click();
    await btn('Known').click();
    await nav('Recall quiz').click();
    assert.equal(await page.locator('.feedback').count(), 0);
    for (const [i, q] of session.quiz.entries()) {
      const answer = q.answers.at(-1);
      const variant = q.caseSensitive ? answer : answer.toUpperCase();
      await page.locator('#answer-' + q.id).fill(i === 0 ? 'incorrect' : variant);
    }
    await btn('Check answers').click();
    await page.getByText('Last attempt: 7 / 8').waitFor();
    await page.reload();
    await page.getByText('Last attempt: 7 / 8').waitFor();
    const feedback = await page.locator('.feedback').first().textContent();
    assert.match(feedback, /Review this answer/);
    assert.ok(feedback.includes(session.quiz[0].explanation));
    await page.getByText('Revisit objectives ' + session.quiz[0].objective + '.', { exact: false }).waitFor();
    await btn('Retry quiz').click();
    for (const q of session.quiz) await page.locator('#answer-' + q.id).fill(q.answers[0]);
    await btn('Check answers').click();
    await page.getByText('Last attempt: 8 / 8').waitFor();
    await nav('Worksheet').click();
    const fields = page.locator('textarea');
    await fields.first().fill('My saved response <check>\nSecond line.');
    await page.reload();
    assert.equal(await fields.first().inputValue(), 'My saved response <check>\nSecond line.');
    await btn('Complete worksheet and review key').click();
    assert.equal(await page.locator('.feedback').count(), 0);
    for (let i = 1; i < session.worksheet.length; i++) await fields.nth(i).fill('Practice response ' + i);
    await btn('Complete worksheet and review key').click();
    assert.equal(await page.locator('.feedback').count(), session.worksheet.length);
    await page.getByText('Completed · 4 of 4 activities completed').waitFor();
    await page.evaluate(() => { window.print = () => dispatchEvent(new Event('beforeprint')); });
    for (const [control, filled] of [['Print blank worksheet', false], ['Print my responses', true]]) {
      await btn(control).click();
      await page.emulateMedia({ media: 'print' });
      const sheet = page.locator('#print-sheet');
      assert.ok(await sheet.isVisible());
      assert.equal(await page.locator('#main').isVisible(), false);
      const printed = await sheet.innerText();
      assert.equal(printed.includes('My saved response <check>\nSecond line.'), filled);
      for (const task of session.worksheet) {
        assert.ok(printed.includes(task.prompt));
        assert.ok(!printed.includes(task.key));
      }
      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    }
    await btn('Flag ' + day.objectives[0]).click();
    await page.getByText('Needs review · 4 of 4 activities completed').waitFor();
    await page.reload();
    await btn('Clear my flag for ' + day.objectives[0]).click();
    await page.getByRole('link', { name: 'Return to study calendar' }).click();
  }
  await page.reload();
  assert.deepEqual(await Promise.all([1, 2, 3, 4, 5, 6].map(readDay)), previousDays);
  assert.deepEqual(await Promise.all([7, 8, 9].map(readDay)), daysSevenToNine);
  await page.getByText('12 of 14 days completed · 14 interactive sessions available').waitFor();
  await page.setViewportSize({ width: 320, height: 700 });
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.ok(await noOverflow());
  for (const number of [4, 5, 6, 7, 8, 9, 10, 11, 12, 2]) {
    await page.getByRole('link', { name: 'Open Day ' + number, exact: true }).click();
    for (const activity of ['Topic review', 'Flashcards', 'Recall quiz', 'Worksheet']) {
      await nav(activity).press('Enter');
      await page.locator('.study-nav a[aria-current="page"]').filter({ hasText: activity }).waitFor();
      assert.ok(await noOverflow(), 'Day ' + number + ' ' + activity);
    }
    if (number !== 2) await page.getByRole('link', { name: 'Return to study calendar' }).click();
  }
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  assert.ok(page.url().endsWith('/worksheet'));
  page.once('dialog', dialog => dialog.dismiss());
  await btn('Reset this day').click();
  await page.getByText('Completed · 4 of 4 activities completed').waitFor();
  page.once('dialog', dialog => dialog.accept());
  await btn('Reset this day').click();
  await page.getByText('Not started · 0 of 4 activities completed').waitFor();
  await page.getByRole('link', { name: 'Return to study calendar' }).click();
  await page.getByText('11 of 14 days completed · 14 interactive sessions available').waitFor();
  const earlier = await Promise.all(plan.days.slice(0, 12).map(d => readDay(d.number)));
  await capstoneFlow(page, plan, app, noOverflow);
  assert.deepEqual(await Promise.all(plan.days.slice(0, 12).map(d => readDay(d.number))), earlier);
  for (const obj of Object.values(plan.objectives)) {
    const target = new URL(obj.reading, app);
    const response = await page.request.get(target.href);
    assert.equal(response.status(), 200);
    assert.ok((await response.text()).includes('id="' + target.hash.slice(1) + '"'), obj.id);
  }
  for (const [, href] of Object.values(plan.resources)) assert.equal((await page.request.get(new URL(href, root).href)).status(), 200);
  assert.deepEqual(errors, []);
  await integrationChecks(browser, root, app, plan, JSON.parse(await readFile(new URL(plan.days[0].session, data))));
  await networkPlanChecks(browser, root);
  console.log('Passed Network+ sessions, reading anchors, resource links and cross-certification reset isolation.');
  console.log('Passed all fourteen sessions, mobile and desktop, keyboard navigation, grading, persistence, reset, worksheet print modes and resource links.');
} finally {
  await browser.close();
}
