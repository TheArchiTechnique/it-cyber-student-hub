import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STORAGE_KEY } from '../docs/assets/javascripts/practice-tests/engine.mjs';
import { storageKey } from '../docs/assets/javascripts/study-plans/progress.mjs';

export async function capstoneFlow(page, plan, app, noOverflow) {
  const btn = name => page.getByRole('button', { name, exact: true });
  const control = name => page.locator('[name="' + name + '"]');
  const state = number => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey(plan, number));
  const open = async n => {
    await page.goto(app.href + '#day-' + n + '/review');
    await page.locator('.capstone').waitFor();
  };
  await open(14);
  assert.equal(await page.locator('.capstone summary').filter({ hasText: 'Balanced review' }).count(), 4);
  assert.ok(await noOverflow());
  await open(13);
  await btn('Save exam review').press('Enter');
  assert.equal(await state(13), null);
  for (const stored of [null, '{"status":"submitted"}']) {
    if (stored) await page.evaluate(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, stored]);
    await btn('Import completed exam result').click();
    await page.waitForFunction(() => ![...document.querySelectorAll('button')].find(b => b.textContent === 'Import completed exam result').disabled);
    await page.getByText('No completed Core 2 Certification Mode result', { exact: false }).waitFor();
    assert.equal(await control('percentage').inputValue(), '');
    assert.equal(await state(13), null);
  }
  await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEY);
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open Core 2 practice exam (new tab)' }).press('Enter');
  const exam = await popup;
  await exam.locator('#mode-certification').click();
  await exam.locator('#start-exam').click();
  await btn('Import completed exam result').click();
  await page.getByText('No completed Core 2 Certification Mode result', { exact: false }).waitFor();
  assert.equal(await state(13), null);
  const bank = JSON.parse(await readFile(new URL('../docs/assets/data/practice-tests/a-plus-core-2-questions.json', import.meta.url)));
  const ids = await exam.evaluate(key => JSON.parse(localStorage.getItem(key)).questionIds, STORAGE_KEY);
  assert.equal(ids.length, 90);
  const questions = ids.map(id => bank.questions.find(q => q.id === id));
  const missed = questions[0];
  for (const [i, question] of questions.entries()) {
    await exam.locator('#question-navigator button').nth(i).click();
    const choices = i ? question.correct : [question.choices.find(c => !question.correct.includes(c.id)).id];
    for (const choice of choices) await exam.locator('#answer-options input[value="' + choice + '"]').check();
  }
  await exam.locator('#submit-test').click();
  await exam.locator('#confirm-action').click();
  const percentage = (await exam.locator('#results .score').innerText()).replace('%', '');
  await exam.close();

  await btn('Import completed exam result').click();
  await page.getByText('Imported ' + percentage + '%', { exact: false }).waitFor();
  assert.equal(await control('percentage').inputValue(), percentage);
  assert.equal(await control('examDone').isChecked(), false);
  assert.equal(percentage, '99');
  assert.deepEqual((await state(13)).capstoneDraft.domains, [missed.domain]);
  assert.deepEqual(new Set((await state(13)).capstoneDraft.objectives), new Set(missed.objectives));
  await page.locator('[name=domains][value="' + missed.domain + '"]').uncheck();
  await btn('Import completed exam result').click();
  await page.getByText('This result is already in your draft.', { exact: false }).waitFor();
  assert.deepEqual((await state(13)).capstoneDraft.domains, []);
  const fillAnalysis = async () => {
    await control('examDone').check();
    for (const n of [1, 2, 3]) await control('priority' + n).fill('Review decision ' + n);
    await control('reason').fill('I confused the symptom with the cause.');
    await control('resources').fill('Check the Windows objective breakdown and retry the scenario.');
    await control('practice').selectOption('bsod');
    await page.getByLabel('Misread the scenario', { exact: true }).check();
  };
  await fillAnalysis();
  await open(14);
  await open(13);
  await page.reload();
  assert.equal(await control('priority2').inputValue(), 'Review decision 2');
  await btn('Save exam review').click();
  await page.getByText('Saved exam reviews').waitFor();
  const first = (await state(13)).records[0];
  assert.equal(first.percentage, percentage);
  assert.ok(first.examId);
  await btn('Record another exam attempt').click();
  await btn('Import completed exam result').click();
  await page.getByText('This exam is already recorded.', { exact: false }).waitFor();
  assert.equal(await control('percentage').inputValue(), '');
  await control('percentage').fill('86');
  await page.getByText('Select missed objectives, if identifiable', { exact: true }).click();
  await page.locator('[name=objectives][value="3.1"]').check();
  await page.locator('[name=domains][value="3.0"]').check();
  await fillAnalysis();
  await btn('Save exam review').click();
  await page.getByText('Saved exam reviews').waitFor();
  assert.deepEqual((await state(13)).records[0], first);
  assert.deepEqual((await state(13)).records[1].objectives, ['3.1']);

  await page.getByRole('link', { name: 'Continue to Day 14' }).press('Enter');
  const target = page.locator('details').filter({ has: page.locator('summary', { hasText: '3.1' }) }).first();
  await target.locator('summary').click();
  assert.match(await target.locator('summary').innerText(), /Exam review/);
  assert.match(await target.getByRole('link', { name: 'Quiz', exact: true }).getAttribute('href'), /#day-10\/quiz\//);
  assert.equal(await page.locator('li').filter({ hasText: 'Your Day 13 choice' }).getByRole('link').getAttribute('href'),
    new URL(plan.resources.bsod[1], new URL('../../../../../', app)).href);
  await target.getByRole('link', { name: 'Quiz', exact: true }).press('Enter');
  await page.locator('.study-nav [aria-current=page]').filter({ hasText: 'Recall quiz' }).waitFor();
  await page.waitForFunction(() => document.activeElement.id.startsWith('answer-'));
  await open(14);
  await control('recall').fill('I compared the stop code and the time of the restart.');
  await control('practice').selectOption('bsod');
  await control('independence').selectOption('With guidance');
  await control('evidence').fill('I checked the log before choosing a repair.');
  for (const c of await page.locator('fieldset select').all()) await c.selectOption('Demonstrated');
  await page.getByText('Select any objectives that still need work after this review').click();
  await page.locator('[name=objectives][value="2.8"]').check();
  await control('next').fill('Retry without hints on Thursday and explain the evidence.');
  await page.reload();
  assert.equal(await control('independence').inputValue(), 'With guidance');
  await btn('Save readiness review').press('Enter');
  await page.getByText('Additional targeted review recommended', { exact: true }).waitFor();
  const assessment = (await state(14)).records[0];
  assert.deepEqual(assessment.objectives, ['2.8']);
  assert.equal(await page.locator('.capstone summary').filter({ hasText: '2.8' }).filter({ hasText: 'Readiness review' }).count(), 1);
  assert.equal(assessment.rehearsalNumber, 2);
  assert.equal(assessment.rehearsalPercentage, '86');
  await btn('Repeat readiness review').click();
  assert.equal(await control('recall').inputValue(), '');
  assert.deepEqual((await state(14)).records[0], assessment);
  for (const name of ['recall', 'evidence', 'next']) await control(name).fill('I repeated the task and verified the result.');
  await control('practice').selectOption('bsod');
  await control('independence').selectOption('Independently');
  for (const c of await page.locator('fieldset select').all()) await c.selectOption('Demonstrated');
  await btn('Save readiness review').press('Enter');
  await page.getByText('Ready to schedule or attempt the exam', { exact: true }).waitFor();
  assert.equal((await state(14)).records.length, 2);
  assert.deepEqual((await state(14)).records[0], assessment);
  assert.ok(await noOverflow());
  await page.getByRole('link', { name: 'Return to study calendar' }).click();
  await page.getByText('13 of 14 days completed · 14 interactive sessions available').waitFor();
  for (const n of [13, 14]) {
    const card = page.locator('.plan-grid article').filter({ has: page.getByRole('link', { name: 'Open Day ' + n, exact: true }) });
    assert.equal(await card.locator('.status').textContent(), 'Completed');
  }
}
