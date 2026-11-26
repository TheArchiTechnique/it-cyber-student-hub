import assert from 'node:assert/strict';
import { storageKey } from '../docs/assets/javascripts/study-plans/progress.mjs';

export async function networkCapstoneChecks(page, plan, root, app, coreApp) {
  const btn = name => page.getByRole('button', { name, exact: true });
  const input = name => page.locator('[name="' + name + '"]');
  const state = n => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey(plan, n));
  const open = async n => {
    await page.goto(app.href + '#day-' + n + '/review');
    await page.locator('.capstone').waitFor();
  };
  const objective = (name, id) => page.locator('[name="' + name + '"][value="' + id + '"]');
  const score = input('percentage');
  const additional = 'Additional targeted review recommended';
  const significant = 'Significant objective gaps remain';
  const ready = 'Ready to schedule or attempt the exam';
  const cases = (await (await page.request.get(new URL('assets/data/study-plans/n10-009/day-14.json', root).href)).json()).practicals;
  const practicalKeys = ['pdu', 'cabling', 'subnet', 'lab1', 'vlan', 'route', 'dhcp', 'dns', 'acl', 'capture', 'ip-fault', 'wifi', 'soho', 'voip',
    'cloud-cases', 'recovery-cases', 'access-cases', 'security-cases'];
  assert.deepEqual(new Set(Object.keys(cases)), new Set(practicalKeys));
  assert.deepEqual(new Set(Object.values(cases).flat()), new Set(Object.keys(plan.objectives)));
  for (const [key, ids] of Object.entries(cases)) {
    assert.ok(ids.length);
    const hash = new URL(plan.resources[key][1], root).hash;
    if (!hash) continue;
    const day = plan.days.find(d => hash === '#day-' + d.number + '/worksheet');
    assert.ok(day, hash);
    const response = await page.request.get(new URL('assets/data/study-plans/n10-009/' + day.session, root).href);
    const { worksheet } = await response.json();
    assert.ok(ids.every(id => worksheet.some(item => item.objective === id)), key);
  }

  // Use the same browser storage for both certifications.
  await page.goto(coreApp.href + '#day-13/review');
  await score.fill('92');
  await input('priority1').fill('Core 2 hardware review');
  await input('examDone').check();
  await input('priority2').fill('Windows startup repair');
  await input('priority3').fill('Recovery tools');
  await input('reason').fill('I missed the recovery environment clue.');
  await input('resources').fill('Review the Windows recovery exercise.');
  await input('practice').selectOption('boot');
  await page.getByLabel('Misread the scenario', { exact: true }).check();
  await btn('Save exam review').click();
  await page.getByText('Saved exam reviews').waitFor();
  const corePlan = await (await page.request.get(new URL('assets/data/study-plans/220-1202/plan.json', root).href)).json();
  const coreKey = storageKey(corePlan, 13);
  const coreSnapshot = await page.evaluate(key => localStorage.getItem(key), coreKey);

  async function assess(outcome, independence = 'Independently', unresolved = false) {
    await input('recall').fill('Calculate a subnet boundary without a prefix table.');
    await input('practice').selectOption('subnet');
    await input('independence').selectOption(independence);
    await input('evidence').fill('Used the prefix to calculate the boundary and checked a second address from the same block.');
    for (const select of await page.locator('fieldset select').all()) await select.selectOption('Demonstrated');
    if (outcome === significant) {
      await input('subnet').selectOption('Needs work');
      await input('tools').selectOption('Needs work');
    }
    if (unresolved) {
      await page.getByText('Select any objectives that still need work after this review').click();
      await objective('objectives', '1.7').check();
    }
    await input('next').fill('Repeat the subnetting lab Friday on an unfamiliar prefix and verify by recalculating the host range.');
    await page.reload();
    assert.equal(await input('independence').inputValue(), independence);
    await btn('Save readiness review').click();
    await page.getByText(outcome, { exact: true }).waitFor();
    return (await state(14)).records.at(-1);
  }

  await open(14);
  const balanced = page.locator('.capstone summary').filter({ hasText: 'Balanced review' });
  assert.deepEqual((await balanced.allTextContents()).map(s => s.split(' ')[0]), ['1.7', '2.2', '3.4', '4.3', '5.3']);
  for (const target of await balanced.all()) {
    await target.click();
    const item = target.locator('..');
    for (const label of ['Flashcards', 'Quiz', 'Worksheet']) assert.ok(await item.getByRole('link', { name: label, exact: true }).count());
    assert.match(await item.locator('a').first().getAttribute('href'), /objective-breakdown\/#/);
  }
  const missing = await assess(additional);
  assert.equal(missing.rehearsalNumber, 0);

  await open(13);
  await page.getByText('Choose a timed CompTIA Network+ N10-009 practice exam', { exact: false }).waitFor();
  assert.equal(await btn('Import completed exam result').count(), 0);
  assert.equal(await page.locator('.capstone a[href*="practice/tests"]').count(), 0);
  assert.doesNotMatch(await page.locator('.capstone').innerText(), /Core 2|220-1202/);
  assert.equal(await score.inputValue(), '');
  assert.equal(await input('priority1').inputValue(), '');
  assert.deepEqual(await input('domains').evaluateAll(cs => cs.map(c => c.value)), plan.domains.map(d => d.id));
  assert.deepEqual(await input('objectives').evaluateAll(cs => cs.map(c => c.value)), Object.keys(plan.objectives));
  assert.deepEqual(new Set(await input('practice').locator('option').evaluateAll(cs => cs.slice(1).map(c => c.value))), new Set(practicalKeys));
  const analysis = async () => {
    await input('priority1').fill('Interpret access-port membership');
    await input('priority2').fill('Read an interface error counter');
    await input('priority3').fill('Test a return path');
    await input('reason').fill('I attributed a missing return route to DNS despite the successful lookup.');
    await input('resources').fill('Revisit the routing table and reproduce the return-path decision.');
    await input('practice').selectOption('route');
    await page.getByLabel('Misinterpreted command output', { exact: true }).check();
  };
  await analysis();
  await btn('Save exam review').click();
  assert.equal((await state(13)).records, undefined);
  await page.reload();
  assert.equal(await input('practice').inputValue(), 'route');
  await input('examDone').check();
  for (const invalid of ['-1', '101', '74.5']) {
    await score.fill(invalid);
    await btn('Save exam review').click();
    assert.equal(await score.evaluate(el => el.validity.valid), false);
    assert.equal((await state(13)).records, undefined);
  }
  for (const valid of ['0', '100']) {
    await score.fill(valid);
    assert.ok(await score.evaluate(el => el.validity.valid));
  }
  await score.fill('');
  await btn('Save exam review').click();
  await page.getByText('Saved exam reviews').waitFor();
  const noScore = (await state(13)).records[0];
  assert.equal(noScore.percentage, '');
  await page.getByText(/Attempt 1 · Percentage unavailable/).waitFor();
  await open(14);
  await btn('Repeat readiness review').click();
  await page.getByText(/Latest rehearsal: Percentage unavailable/).waitFor();
  assert.equal((await assess(additional)).rehearsalNumber, 1);

  await open(13);
  await btn('Record another exam attempt').click();
  await analysis();
  await input('examDone').check();
  await score.fill('83');
  await objective('domains', '4.0').check();
  await page.getByText('Select missed objectives, if identifiable').click();
  await objective('objectives', '2.1').check();
  await btn('Save exam review').click();
  await page.getByText('Saved exam reviews').waitFor();
  assert.deepEqual((await state(13)).records[0], noScore);
  await open(14);
  await btn('Repeat readiness review').click();
  await page.getByText(/Latest rehearsal: 83%/).waitFor();
  for (const [id, why] of [['2.1', 'Exam review'], ['4.3', 'Sample from selected exam domain']]) {
    assert.equal(await page.locator('.capstone summary').filter({ hasText: id }).filter({ hasText: why }).count(), 1);
  }
  assert.equal(await page.locator('.capstone li').first().getByRole('link').getAttribute('href'), new URL(plan.resources.route[1], root).href);
  assert.match(await page.locator('.capstone li').first().innerText(), /Your Day 13 choice/);
  for (const key of practicalKeys) {
    assert.equal(await page.locator('.capstone li').getByRole('link', { name: plan.resources[key][0], exact: true }).getAttribute('href'), new URL(plan.resources[key][1], root).href);
  }
  assert.deepEqual((await assess(additional, 'Independently', true)).objectives, ['1.7']);
  await btn('Repeat readiness review').click();
  await assess(significant, 'Completed using a walkthrough');
  await btn('Repeat readiness review').click();
  await assess(additional, 'With guidance');
  await btn('Repeat readiness review').click();
  const final = await assess(ready);
  assert.equal(final.rehearsalNumber, 2);
  assert.equal(final.rehearsalPercentage, '83');
  await page.reload();
  assert.equal((await state(14)).records.length, 6);
  assert.deepEqual((await state(14)).records[0], missing);
  await page.getByRole('link', { name: 'Return to study calendar' }).click();
  await page.getByText('14 of 14 days completed · 14 interactive sessions available').waitFor();

  // Mark real lesson items, then follow each resulting link back to its source.
  await page.goto(app.href + '#day-10/cards');
  await btn('Reveal answer').click();
  await btn('Needs review').click();
  await page.goto(app.href + '#day-12/quiz');
  await btn('Retry quiz').click();
  const previous = (await state(12)).lastQuiz;
  for (const [id, value] of Object.entries(previous)) await page.locator('#answer-' + id).fill(value);
  await page.locator('.item input').first().fill('uncertain');
  await btn('Check answers').click();
  await page.goto(app.href + '#day-11/worksheet');
  await btn('Flag 4.2').click();
  await open(14);
  for (const [reason, label, path] of [['Flashcard', 'Flashcards', '#day-10/cards/'], ['Quiz miss', 'Quiz', '#day-12/quiz/'], ['Manual flag', 'Worksheet', '#day-11/worksheet/']]) {
    const target = page.locator('.capstone details').filter({ has: page.locator('summary', { hasText: reason }) }).first();
    await target.locator('summary').click();
    const link = target.getByRole('link', { name: label, exact: true }).and(target.locator('a[href^="' + path + '"]'));
    await link.click();
    assert.ok(new URL(page.url()).hash.startsWith(path));
    await open(14);
  }
  await page.goto(coreApp.href + '#day-13/review');
  await page.getByText(/Attempt 1 · 92%/).click();
  await page.getByText('Core 2 hardware review', { exact: true }).waitFor();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), coreKey), coreSnapshot);
  assert.equal(await page.locator('.capstone summary').filter({ hasText: /Attempt / }).count(), 1);
}
