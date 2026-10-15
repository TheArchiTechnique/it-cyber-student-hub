// Run against the actual MkDocs build: node tests/network-configuration-concepts.cjs
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const model = require('../docs/practice/pbqs/a-plus-core-2/network-configuration-concepts/app/model.js');

// Fixed expectations independently state each work order's intended configuration.
const expected = {
  'home-office': {
    wan: '198.51.100.70', 'desktop-ip': '192.168.46.24', gateway: '192.168.46.1',
    'printer-link': 'Router LAN switch port', security: 'WPA3-Personal', apipa: 'APIPA / link-local',
    web: 'HTTPS · TCP 443', dns: 'DNS · TCP/UDP 53'
  },
  'small-business': {
    wan: '192.0.2.146', forward: 'TCP 443 → 10.62.90.25:443', http: 'Block TCP 80',
    'printer-place': 'Staff LAN switch', 'printer-ip': '10.62.14.60', 'dmz-device': 'Booking web server',
    listener: 'HTTPS · TCP 443', 'dmz-access': 'Block new sessions to staff LAN'
  },
  'hosted-service': {
    nat: 'PAT: household sources → WAN address', forward: '172.23.68.88:51820', apipa: '169.254.88.31',
    security: 'WPA2-Personal / AES', 'guest-access': 'Internet only; block household LAN',
    'service-ip': '172.23.68.88', transport: 'UDP'
  }
};
assert.deepEqual(model.scenarios.map(s => s.id), Object.keys(expected));
for (const scenario of model.scenarios) {
  const decisions = model.fields(scenario);
  assert.ok(decisions.length >= 6 && decisions.length <= 8);
  assert.equal(new Set(decisions.map(f => f.id)).size, decisions.length);
  assert.deepEqual(Object.fromEntries(decisions.map(f => [f.id, f.answer])), expected[scenario.id]);
  assert.equal(model.score(scenario, {}).earned, 0);
  assert.equal(model.score(scenario, expected[scenario.id]).earned, decisions.length);
  for (const field of decisions) {
    assert.equal(field.options.filter(option => option === field.answer).length, 1);
    assert.equal(new Set(field.options).size, field.options.length);
    assert.ok(field.explanation.length > 60);
    assert.equal(model.score(scenario, { [field.id]: expected[scenario.id][field.id] }).earned, 1, 'Independent partial credit');
    const wrong = field.options.find(option => option !== field.answer);
    assert.equal(model.score(scenario, { ...expected[scenario.id], [field.id]: wrong }).earned, decisions.length - 1);
  }
  const original = [...decisions[0].options];
  assert.deepEqual(new Set(model.shuffle(original, () => 0)), new Set(original));
  assert.deepEqual(original, decisions[0].options, 'Shuffle never changes authoritative choices');
}

const site = path.resolve(__dirname, '../site');
const prefix = '/it-cyber-student-hub';
const route = '/practice/pbqs/a-plus-core-2/network-configuration-concepts/app/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.startsWith(`${prefix}/`)) pathname = pathname.slice(prefix.length);
    let target = path.resolve(site, `.${pathname}`);
    if (target !== site && !target.startsWith(site + path.sep)) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  async function choose(answers) {
    for (const [id, value] of Object.entries(answers)) await page.locator(`#choice-${id}`).selectOption(value);
  }
  async function clean() {
    assert.equal(await page.locator('#results').isVisible(), false);
    assert.equal(await page.locator('.field-state,.field.correct,.field.incorrect').count(), 0, 'No pre-submission answer indicators');
    assert.equal(await page.locator('#nodes select:disabled').count(), 0);
  }
  async function layout() {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal page overflow');
    const bad = await page.locator('select,button,a[data-pbq-nav]').evaluateAll(nodes => nodes.filter(node => {
      if (!node.getClientRects().length) return false;
      const b = node.getBoundingClientRect();
      const isSharedNav = node.hasAttribute('data-pbq-nav');
      return b.left < -1 || b.right > innerWidth + 1 || b.width < 44 || b.height < (isSharedNav ? 34 : 44);
    }).map(n => n.id || n.outerHTML));
    assert.deepEqual(bad, [], 'Controls fit and provide touch targets');
    assert.equal(await page.locator('#nodes').evaluate(container => {
      const boxes = [...container.children].map(n => n.getBoundingClientRect());
      return boxes.some((a, i) => boxes.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    }), false, 'Device cards do not overlap');
    assert.equal(await page.locator('#connections path').count(), model.scenarios.find(s => s.id === pageScenario).links.length);
    assert.ok((await page.locator('#connections path').first().getAttribute('d')).startsWith('M '));
  }
  let pageScenario = 'home-office';
  try {
    for (const base of [origin, origin + prefix]) {
      await page.goto(base + route);
      assert.equal(await page.locator('#scenario option').count(), 3);
      assert.equal(await page.locator('[data-pbq-nav-container]').count(), 1);
      const nav = page.locator('[data-pbq-nav="certification"]');
      assert.equal(await nav.textContent(), '← A+ Core 2 PBQs');
      assert.equal(await nav.getAttribute('href'), '../../');
      for (const scenario of model.scenarios) {
        pageScenario = scenario.id;
        await page.locator('#scenario').selectOption(scenario.id);
        assert.equal(await page.locator('#nodes select').count(), model.fields(scenario).length);
        await clean();
        // Blank answers submit as zero without a validation trap.
        await page.getByRole('button', { name: 'Submit configuration', exact: true }).press('Enter');
        assert.match(await page.locator('.score').textContent(), /^0 \/ (7|8) points · 0%$/);
        assert.equal(await page.locator('.result-item.incorrect').count(), model.fields(scenario).length);
        assert.equal(await page.locator('#results').evaluate(n => n === document.activeElement), true);
        await page.getByRole('button', { name: 'Retry selections' }).click();
        await clean();
        const answers = Object.entries(expected[scenario.id]);
        await choose(Object.fromEntries(answers.slice(0, 4)));
        await page.locator(`#choice-${answers[4][0]}`).selectOption(model.fields(scenario).find(f => f.id === answers[4][0]).options.find(v => v !== answers[4][1]));
        await page.getByRole('button', { name: 'Submit configuration' }).click();
        assert.match(await page.locator('.score').textContent(), new RegExp(`^4 / ${answers.length} points`));
        assert.equal(await page.locator('.result-item.correct').count(), 4);
        assert.equal(await page.locator('#nodes select:disabled').count(), answers.length);
        assert.equal(await page.locator('.result-item').count(), answers.length);
        await page.getByRole('button', { name: 'Retry selections' }).click();
        assert.equal(await page.locator(`#choice-${answers[0][0]}`).inputValue(), answers[0][1]);
        await clean();
        await choose(expected[scenario.id]);
        await page.getByRole('button', { name: 'Submit configuration' }).click();
        assert.match(await page.locator('.score').textContent(), /100%$/);
        assert.equal(await page.locator('.result-item.incorrect').count(), 0);
        await page.getByRole('tab', { name: 'Lesson', exact: true }).click();
        assert.equal(await page.locator('#lesson article').count(), 8);
        await page.locator('#lesson-tab').press('ArrowLeft');
        assert.equal(await page.locator('#activity-tab').getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator('.score').isVisible(), true);
        await page.getByRole('button', { name: 'Reset scenario' }).click();
        assert.deepEqual(await page.locator('#nodes select').evaluateAll(nodes => nodes.map(n => n.value)), answers.map(() => ''));
        await clean();
        await layout();
      }
    }
    // Scenario switching retains selections and submitted results separately.
    await page.locator('#scenario').selectOption('home-office');
    await choose(expected['home-office']);
    await page.getByRole('button', { name: 'Submit configuration' }).click();
    await page.locator('#scenario').selectOption('small-business');
    await clean();
    await page.locator('#scenario').selectOption('home-office');
    assert.match(await page.locator('.score').textContent(), /100%$/);
    await page.getByRole('button', { name: 'Reset scenario' }).click();
    // Exercise actual keyboard selection and tab behavior.
    await page.locator('#choice-wan').focus();
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.locator('#choice-wan').inputValue(), '');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#choice-desktop-ip').evaluate(n => n === document.activeElement), true);
    await page.locator('#activity-tab').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#lesson-tab').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#activity-tab').getAttribute('aria-selected'), 'true');
    const orders = new Set();
    for (let i = 0; i < 12; i++) {
      await page.getByRole('button', { name: 'Reset scenario' }).click();
      orders.add((await page.locator('#choice-wan option').allTextContents()).join('|'));
    }
    assert.ok(orders.size > 1, 'Choice ordering changes across resets');
    for (const width of [1440, 768, 600, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const scenario of model.scenarios) {
        pageScenario = scenario.id;
        await page.locator('#scenario').selectOption(scenario.id);
        await page.waitForTimeout(50);
        await layout();
        if (process.env.PBQ_SCREENSHOT_DIR && [1440, 390].includes(width)) {
          await fs.mkdir(process.env.PBQ_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.PBQ_SCREENSHOT_DIR, `configuration-${scenario.id}-${width}.png`), fullPage: true });
        }
      }
    }
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touch = await mobile.newPage();
    await touch.goto(origin + prefix + route);
    await touch.locator('#scenario').selectOption('hosted-service');
    for (const [id, value] of Object.entries(expected['hosted-service'])) await touch.locator(`#choice-${id}`).selectOption(value);
    await touch.getByRole('button', { name: 'Submit configuration' }).tap();
    assert.match(await touch.locator('.score').textContent(), /7 \/ 7 points · 100%/);
    assert.equal(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile feedback fits');
    await touch.getByRole('button', { name: 'Retry selections' }).tap();
    await touch.getByRole('tab', { name: 'Lesson', exact: true }).tap();
    assert.equal(await touch.locator('#lesson').isVisible(), true);
    await touch.getByRole('tab', { name: 'Activity', exact: true }).tap();
    await touch.getByRole('button', { name: 'Reset scenario' }).tap();
    assert.equal(await touch.locator('#choice-transport').inputValue(), '');
    await mobile.close();
    // Real catalog filters, launch and return links, and certification discovery.
    await page.goto(origin + prefix + '/practice/pbqs/');
    await page.locator('#pbq-certification').selectOption('a-plus-core-2');
    await page.locator('[data-pbq-id="network-configuration-concepts"]').waitFor();
    await page.locator('[data-pbq-id="network-configuration-concepts"] .pbq-library-launch').click();
    assert.ok(page.url().endsWith(route));
    await page.locator('[data-pbq-nav="certification"]').click();
    assert.ok(page.url().endsWith('/practice/pbqs/a-plus-core-2/'));
    await page.getByRole('link', { name: 'Return to A+ Core 2', exact: true }).click();
    assert.equal(await page.locator('.hub-page a').filter({ hasText: 'Network Configuration Concepts' }).count(), 1);
    await page.locator('.hub-page a').filter({ hasText: 'Network Configuration Concepts' }).click();
    assert.ok(page.url().endsWith('/network-configuration-concepts/'));
    assert.deepEqual(errors, []);
    console.log('PASS: all three scenarios; independent scoring; feedback; retry/reset; shuffled choices; scenario state; Lesson/Activity; keyboard/touch; responsive diagrams; catalog/Core 2 discovery; root/subpath navigation.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
