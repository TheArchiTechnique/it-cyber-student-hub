// Run after mkdocs build --strict; tests the real Hub at its Pages subpath.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site');
const prefix = '/it-cyber-student-hub/';
const lab = 'labs/it-support/virtualbox-linux-mint/';
const title = 'VirtualBox: Installing Linux Mint';
const mime = { '.html': 'text/html', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.slice(1);
    let target = path.resolve(site, relative);
    if (!target.startsWith(site + path.sep) && target !== site) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  const source = await fs.readFile(path.resolve(__dirname, '../docs/labs/it-support/virtualbox-linux-mint/README.md'), 'utf8');
  assert.doesNotMatch(source, /25(?:\.00)?\s*GB|26\.8\s*GB|35\s*GB|images\/disk-size\.png/, 'Retired disk capacity and screenshot stay out of the guide');
  assert.match(source, /New 40 GB VDI, dynamically allocated/);
  assert.match(source, /50 GB[\s\S]*60 GB[\s\S]*snapshots/);
  assert.match(source, /20 GB as the minimum disk space and 100 GB as recommended/);
  const live = source.split('## 7. ')[1].split('## 8. ')[0];
  const sequence = ['Start Linux Mint', 'live Cinnamon desktop', 'is not installed on the virtual hard disk', 'Locate **Install Linux Mint**', 'Double-click **Install Linux Mint**', 'Installation type'];
  let previous = -1;
  for (const step of sequence) {
    const index = live.indexOf(step);
    assert.ok(index > previous, `Student sequence: ${step}`);
    previous = index;
  }
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = origin + prefix;
  const browser = await chromium.launch({
    executablePath: process.env.PBQ_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: scheme });
        // Follow the central route as a student, through actual content cards.
        await page.goto(base);
        await page.locator('.hub-page').getByRole('link', { name: 'Labs', exact: true }).click();
        await page.locator('.hub-page').getByRole('link', { name: 'IT Support', exact: true }).click();
        await page.locator('.hub-page').getByRole('link', { name: title, exact: true }).click();
        assert.equal(page.url(), base + lab);
        await page.locator('body').evaluate((body, scheme) => {
          body.setAttribute('data-md-color-scheme', scheme === 'dark' ? 'slate' : 'default');
        }, scheme);
        assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'), scheme === 'dark' ? 'slate' : 'default');
        assert.equal(await page.locator('h1').textContent(), title);
        assert.equal(await page.locator('.hub-article').count(), 1);
        assert.equal(await page.locator('.hub-landing').count(), 0, 'Instructions use ordinary article lists');
        assert.equal(await page.locator('[id="7-load-the-live-desktop-and-open-the-installer"] + ol > li').count(), 7, 'Live-session steps remain one continuous ordered list');
        const images = page.locator('.hub-article img');
        assert.equal(await images.count(), 11);
        assert.equal(await page.locator('.hub-article img[src$="disk-size.png"]').count(), 0);
        assert.match(await page.locator('.hub-article table').first().textContent(), /40 GB VDI, dynamically allocated/);
        await images.evaluateAll(nodes => Promise.all(nodes.map(im => im.decode())));
        assert.deepEqual(await images.evaluateAll(nodes => nodes.filter(im => !im.alt || !im.naturalWidth).map(im => im.src)), []);
        assert.deepEqual(await images.evaluateAll(nodes => nodes.filter(im => {
          const box = im.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth + 1 ||
            Math.abs((im.clientWidth / im.clientHeight) / (im.naturalWidth / im.naturalHeight) - 1) > .04;
        }).map(im => im.src)), [], 'Screenshots fit the viewport without distortion');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const href of await images.evaluateAll(nodes => nodes.map(im => im.closest('a').href)))
          assert.equal((await page.request.get(href)).status(), 200, 'Full-size screenshot link');
        assert.equal(await page.locator('.hub-article > ul > li').count(), 4, 'Final verification checklist stays a list');
        await page.locator('.hub-article').getByRole('link', {name: 'Linux Mint Workstation Setup and Troubleshooting', exact: true}).click();
        assert.equal(page.url(), base + 'labs/it-support/linux-mint-command-line/');
        assert.equal(await page.locator('h1').textContent(), 'Linux Mint Workstation Setup and Troubleshooting');
        await page.locator('.hub-article').getByRole('link', {name: title, exact: true}).click();
        assert.equal(page.url(), base + lab);
        // Both certification cards launch this same canonical article.
        for (const certification of ['a-plus-core-1', 'a-plus-core-2']) {
          await page.goto(base + `certifications/comptia/${certification}/`);
          const link = page.locator('.hub-page').getByRole('link', { name: title, exact: true });
          assert.equal(await link.count(), 1);
          await link.click();
          assert.equal(page.url(), base + lab);
        }
        if (process.env.LAB_QA_DIR) {
          await page.locator('body').evaluate((body, scheme) => {
            body.setAttribute('data-md-color-scheme', scheme === 'dark' ? 'slate' : 'default');
          }, scheme);
          await fs.mkdir(process.env.LAB_QA_DIR, { recursive: true });
          await page.screenshot({ path: path.join(process.env.LAB_QA_DIR, `lab-${viewport.width}-${scheme}.png`), fullPage: true });
        }
      }
    }
    await page.goto(base + 'labs/');
    assert.deepEqual(await page.locator('.hub-page li a').allTextContents(), ['IT Support']);
    // Representative established pages retain their original shells.
    for (const resource of ['certifications/comptia/a-plus-core-1/', 'practice/pbqs/', 'learn/networking/ports-and-protocols/']) {
      await page.goto(base + resource);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.hub-article').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log('Passed: 40 GB configuration, live-desktop installer sequence, central Labs route, both canonical certification links, follow-up lab round trip, 11 images, desktop/mobile light/dark layouts, and representative existing pages.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
