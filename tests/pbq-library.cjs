// Run after mkdocs build --strict. Serves the actual build at root and project subpath.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site');
const prefix = '/it-cyber-student-hub';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.startsWith(`${prefix}/`)) pathname = pathname.slice(prefix.length);
    let target = path.resolve(site, `.${pathname}`);
    if (!target.startsWith(`${site}${path.sep}`) && target !== site) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch {
    response.writeHead(404).end();
  }
});

(async () => {
  const catalog = JSON.parse(await fs.readFile(path.join(site, 'assets/data/pbqs.json')));
  const publishedCertifications = Object.keys(catalog.certifications).filter(certification =>
    catalog.activities.some(activity => activity.status === 'published' &&
      activity.certificationAssociations.some(association => association.certification === certification)));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    executablePath: process.env.PBQ_CHROMIUM_PATH || undefined,
    args: process.env.PBQ_CHROMIUM_PATH ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
  });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const cards = page.locator('[data-pbq-id]');
  const control = name => page.locator(`#pbq-${name}`);
  async function count(expected) {
    await page.waitForFunction(n => document.querySelectorAll('[data-pbq-id]').length === n &&
      document.querySelector('[data-pbq-library] [role="status"]')?.textContent === `${n} ${n === 1 ? 'activity' : 'activities'} found`, expected);
    assert.equal(await page.locator('[data-pbq-library] [role="status"]').textContent(), `${expected} ${expected === 1 ? 'activity' : 'activities'} found`);
  }
  async function reset() { await page.getByRole('button', { name: 'Clear Filters', exact: true }).click(); }
  async function certificationNavigation(target = page) {
    const links = target.locator('.hub-page > ul a');
    assert.deepEqual(await links.allTextContents(), publishedCertifications.map(id => catalog.certifications[id].title),
      'Fallback navigation contains only certifications with published PBQs');
    for (const href of await links.evaluateAll(nodes => nodes.map(node => node.href))) {
      assert.equal((await target.request.get(href)).status(), 200);
    }
  }
  async function ready(base = `${origin}${prefix}/`) {
    await page.goto(`${base}practice/pbqs/`);
    await count(catalog.activities.filter(a => a.status === 'published').length);
  }
  async function layout() {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal overflow');
    assert.deepEqual(await page.locator('.pbq-library input, .pbq-library select, .pbq-library button, .pbq-library-actions a').evaluateAll(nodes =>
      nodes.filter(node => {
        const box = node.getBoundingClientRect();
        return box.width < 44 || box.height < 44 || box.left < 0 || box.right > innerWidth;
      }).map(node => node.outerHTML)), [], 'Touch targets fit the viewport');
    assert.equal(await page.locator('.pbq-library-filters').evaluate(form => {
      const boxes = [...form.querySelectorAll('label, button')].map(node => node.getBoundingClientRect());
      return boxes.some((a, i) => boxes.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    }), false, 'Filter controls do not overlap');
  }
  try {
    for (const base of [`${origin}/`, `${origin}${prefix}/`]) {
      await ready(base);
      await certificationNavigation();
      const ids = await cards.evaluateAll(nodes => nodes.map(node => node.dataset.pbqId));
      assert.equal(ids.length, 12, 'Current published inventory');
      assert.equal(new Set(ids).size, ids.length);
      const titles = await cards.locator('h3').allTextContents();
      assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, 'en')));
      for (const [name, taxonomy] of [['certification', catalog.certifications], ['subject', catalog.subjects], ['topic', catalog.topics]]) {
        assert.deepEqual(new Set(await control(name).locator('option').evaluateAll(nodes => nodes.slice(1).map(n => n.value))), new Set(Object.keys(taxonomy)));
      }
      const links = await cards.locator('a').evaluateAll(nodes => nodes.map(node => node.href));
      for (const activity of catalog.activities) {
        assert.ok(links.includes(base + activity.launchPath));
        assert.ok(links.includes(base + activity.activityPath));
      }
      for (const link of links) assert.equal((await page.request.get(link)).status(), 200);
      await control('certification').selectOption('a-plus-core-1');
      await count(12);
      await control('relevance').selectOption('foundational');
      await count(0);
      await control('certification').selectOption('network-plus');
      await count(8);
      assert.ok((await cards.allTextContents()).every(text => text.includes('Network+: Foundational practice')));
      await control('relevance').selectOption('direct');
      await count(0);
      await control('relevance').selectOption('');
      for (const cert of ['a-plus-core-2', 'security-plus', 'cysa-plus']) {
        await control('certification').selectOption(cert);
        await count(0);
        assert.match(await page.locator('.pbq-library-empty').textContent(), /No published activities/);
      }
      await reset();
      await count(12);
      await control('keyword').fill('  mOtHeRbOaRd AsSeMbLy  ');
      await count(1);
      await control('keyword').fill('  SIMULATED COMMAND PROMPTS ');
      await count(1);
      for (const [name, value] of Object.entries({ certification: 'network-plus', subject: 'networking', topic: 'ip-addressing', relevance: 'foundational' })) {
        await control(name).selectOption(value);
      }
      await count(1);
      assert.equal(await cards.getAttribute('data-pbq-id'), 'ip-configuration-troubleshooting');
      await control('subject').selectOption('hardware');
      await count(0);
      await reset();
      await count(12);
      await control('subject').selectOption('hardware');
      await count(4);
      await control('topic').selectOption('storage-and-raid');
      await count(1);
      await reset();
      await control('relevance').selectOption('foundational');
      await count(8);
      await reset();
      await control('keyword').fill('   ');
      await count(12);
      await control('keyword').fill('<img src=x onerror=alert(1)>');
      await count(0);
      await reset();
      assert.equal(await control('keyword').evaluate(node => node === document.activeElement), true);
      for (const name of ['certification', 'subject', 'topic', 'relevance']) {
        await page.keyboard.press('Tab');
        assert.equal(await control(name).evaluate(node => node === document.activeElement), true);
        assert.equal(await control(name).evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
      }
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await count(12);
      assert.equal(await control('keyword').evaluate(node => node === document.activeElement), true);
      await control('keyword').press('Enter');
      assert.equal(page.url(), `${base}practice/pbqs/`, 'Search never navigates');
    }
    // Real navigation through representative standalone PBQs and certification routes.
    for (const id of ['motherboard-assembly', 'ip-configuration-troubleshooting']) {
      await page.locator(`[data-pbq-id="${id}"] .pbq-library-launch`).click();
      const key = id === 'motherboard-assembly' ? 'core1-motherboard-assembly-v7' : 'core1-ip-configuration-v1';
      if (id === 'motherboard-assembly') {
        await page.locator('#buildTab').click();
        await page.locator('[data-part="cpu"]').click();
        await page.locator('[data-zone="B"]').click();
        assert.equal(await page.locator('#progressText').innerText(), '1 of 16 placements');
      } else {
        await page.locator('#command-1').fill('ipconfig /all');
        await page.locator('#command-1').press('Enter');
      }
      const saved = await page.evaluate(key => localStorage.getItem(key), key);
      assert.ok(saved, 'Representative PBQ has saved progress');
      await page.locator('[data-pbq-nav="certification"]').click();
      assert.ok(page.url().endsWith('/practice/pbqs/a-plus-core-1/'));
      assert.equal(await page.locator('.hub-page a').filter({ hasText: 'Motherboard Assembly' }).count(), 1);
      await page.getByRole('link', { name: 'Return to A+ Core 1', exact: true }).click();
      await page.waitForURL(`${origin}${prefix}/certifications/comptia/a-plus-core-1/`);
      const certificationActivity = page.locator('.hub-page a').filter({ hasText: catalog.activities.find(activity => activity.id === id).title });
      await certificationActivity.waitFor();
      assert.equal(await certificationActivity.count(), 1);
      await ready();
      await page.locator(`[data-pbq-id="${id}"] .pbq-library-launch`).click();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), key), saved,
        'Library and certification navigation preserve existing PBQ progress');
      if (id === 'motherboard-assembly') {
        await page.locator('#buildTab').click();
        assert.equal(await page.locator('#progressText').innerText(), '1 of 16 placements');
      } else {
        assert.match(await page.locator('#output-1').innerText(), /IPv4 Address/);
      }
      await page.locator('[data-pbq-nav="overview"]').click();
      assert.equal(page.url(), `${origin}${prefix}/${catalog.activities.find(activity => activity.id === id).activityPath}`);
      await page.getByRole('link', { name: 'Student Hub', exact: true }).last().click();
      assert.equal(page.url(), `${origin}${prefix}/`);
      await page.locator('.hub-page a').filter({ hasText: /^Practice$/ }).click();
      await page.locator('.hub-page a').filter({ hasText: /^Practice Questions$/ }).click();
      assert.ok(page.url().endsWith('/practice/questions/'));
      assert.equal(await page.locator('.hub-page a[href*="create.kahoot.it/share/"]').count(), 1);
      await ready();
    }
    await page.goto(`${origin}${prefix}/practice/pbqs/network-plus/`);
    assert.equal(await page.locator('.hub-page li a[href^="../a-plus-core-1/"]').count(), 8);
    assert.equal(await page.locator('script[src$="pbq-library.mjs"]').count(), 0);
    await page.getByRole('link', { name: 'Return to Network+', exact: true }).click();
    await page.waitForURL(`${origin}${prefix}/certifications/comptia/network-plus/`);
    await page.locator('.hub-page li a[href*="practice/pbqs/a-plus-core-1/"]').first().waitFor();
    assert.equal(await page.locator('.hub-page li a[href*="practice/pbqs/a-plus-core-1/"]').count(), 8);
    const ipTitle = catalog.activities.find(activity => activity.id === 'ip-configuration-troubleshooting').title;
    await page.locator('.hub-page a').filter({ hasText: ipTitle }).click();
    assert.ok(page.url().endsWith('/practice/pbqs/a-plus-core-1/ip-configuration-troubleshooting/'));
    await ready();
    // Empty categories remain absent from global navigation and the search index.
    const unavailable = ['labs/', 'tools/', 'practice/scenarios/', 'practice/pbqs/a-plus-core-2/',
      'practice/pbqs/security-plus/', 'practice/pbqs/cysa-plus/', 'reference/linux-commands/', 'reference/powershell-commands/'];
    const search = await (await page.request.get(`${origin}${prefix}/search/search_index.json`)).json();
    for (const route of unavailable) {
      assert.equal(await page.locator(`a[href="${origin}${prefix}/${route}"]`).count(), 0);
      assert.ok(search.docs.every(doc => !doc.location.startsWith(route)), `${route} absent from search`);
      assert.equal((await page.request.get(`${origin}${prefix}/${route}`)).status(), 404);
    }
    // Exercise the actual theme switch and saved preference, as well as layout palettes below.
    await page.locator('label[for="__palette_1"]').click();
    assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'), 'slate');
    await page.reload();
    await count(12);
    assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'), 'slate');
    await page.locator('label[for="__palette_0"]').click();
    assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'), 'default');
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const scheme of ['default', 'slate']) {
        await page.locator('body').evaluate((node, value) => node.setAttribute('data-md-color-scheme', value), scheme);
        await layout();
        if (process.env.PBQ_SCREENSHOT_DIR && [1440, 390].includes(width)) {
          await fs.mkdir(process.env.PBQ_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.PBQ_SCREENSHOT_DIR, `library-${width}-${scheme}.png`), fullPage: true });
        }
      }
    }
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await mobile.newPage();
    await touchPage.goto(`${origin}${prefix}/practice/pbqs/`);
    await touchPage.locator('#pbq-certification').selectOption('network-plus');
    assert.equal(await touchPage.locator('[data-pbq-id]').count(), 8);
    await touchPage.getByRole('button', { name: 'Clear Filters' }).tap();
    assert.equal(await touchPage.locator('[data-pbq-id]').count(), 12);
    await mobile.close();
    // Delayed and failed catalog loads preserve static certification navigation.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/assets/data/pbqs.json', async route => { await gate; await route.continue(); });
    await page.goto(`${origin}${prefix}/practice/pbqs/`);
    assert.equal(await page.getByRole('status').filter({ hasText: 'Loading activities' }).count(), 1);
    await certificationNavigation();
    release();
    await count(12);
    await page.unroute('**/assets/data/pbqs.json');
    for (const response of [
      { status: 503, body: 'Unavailable' },
      { status: 200, body: '{bad JSON' },
      { status: 200, json: { schemaVersion: 2, activities: [] } }
    ]) {
      await page.route('**/assets/data/pbqs.json', route => route.fulfill(response));
      await page.reload();
      await page.getByRole('button', { name: 'Try again' }).waitFor();
      assert.equal(await cards.count(), 0);
      await certificationNavigation();
      await page.unroute('**/assets/data/pbqs.json');
      await page.getByRole('button', { name: 'Try again' }).click();
      await count(12);
    }
    await page.route('**/assets/data/pbqs.json', () => {});
    await page.reload();
    await page.getByRole('button', { name: 'Try again' }).waitFor({ timeout: 15000 });
    await certificationNavigation();
    await page.unroute('**/assets/data/pbqs.json');
    await page.getByRole('button', { name: 'Try again' }).click();
    await count(12);
    const future = structuredClone(catalog);
    future.activities[0].status = 'draft';
    future.activities[1].status = 'archived';
    future.subjects['future-subject'] = { title: 'Future subject' };
    future.topics['future-topic'] = { title: 'Future topic', subject: 'future-subject' };
    future.certifications['future-cert'] = { title: 'Future certification' };
    future.activities.push({ ...future.activities[2], id: 'future-activity', title: 'Future activity', topics: ['future-topic'], certificationAssociations: [{ certification: 'future-cert', relevance: 'direct' }] });
    await page.route('**/assets/data/pbqs.json', route => route.fulfill({ json: future }));
    await page.reload();
    await count(11);
    assert.equal(await page.locator(`[data-pbq-id="${future.activities[0].id}"], [data-pbq-id="${future.activities[1].id}"]`).count(), 0);
    for (const [name, value] of [['subject', 'future-subject'], ['topic', 'future-topic'], ['certification', 'future-cert']]) await control(name).selectOption(value);
    await count(1);
    assert.equal(await cards.getAttribute('data-pbq-id'), 'future-activity');
    await page.unroute('**/assets/data/pbqs.json');
    await page.route('**/assets/javascripts/pbq-library.mjs', route => route.abort());
    await page.reload();
    assert.equal(await page.locator('[data-pbq-library]').isVisible(), false);
    await certificationNavigation();
    await page.unroute('**/assets/javascripts/pbq-library.mjs');
    await page.route('**/assets/data/pbqs.json', route => route.fulfill({ json: { ...catalog, activities: [] } }));
    await page.reload();
    await count(0);
    await reset();
    await count(0);
    await page.unroute('**/assets/data/pbqs.json');
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJS.newPage();
    await fallback.goto(`${origin}${prefix}/practice/pbqs/`);
    assert.equal(await fallback.locator('[data-pbq-library]').isVisible(), false);
    await certificationNavigation(fallback);
    await fallback.locator('.hub-page > ul a').filter({ hasText: 'Network+' }).click();
    assert.equal(await fallback.locator('.hub-page li a[href^="../a-plus-core-1/"]').count(), 8);
    await noJS.close();
    assert.deepEqual(errors, [], 'No uncaught library errors');
    console.log('PASS: global PBQ inventory, all filters, canonical URLs, root/subpath hosting, keyboard/touch, responsive themes, loading/retry, future records, publication states, and no-JS navigation.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
