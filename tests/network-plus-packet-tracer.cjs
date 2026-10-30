// Run after mkdocs build --strict. Exercises the published guide, not Packet Tracer.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site');
const route = 'labs/networking/packet-tracer-setup/';
const title = 'Getting Started: Download and Install Cisco Packet Tracer';
const start = 'Start Here — Install Cisco Packet Tracer';
const mime = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/it-cyber-student-hub\//, '/');
    let target = path.resolve(site, '.' + relative);
    if (target !== site && !target.startsWith(site + path.sep)) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    executablePath: process.env.PBQ_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const context = await browser.newContext();
    await context.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const prefix of ['/', '/it-cyber-student-hub/']) {
      const base = origin + prefix;
      // Follow both discovery paths using the real student-facing links.
      await page.goto(base);
      await page.locator('.hub-page').getByRole('link', { name: 'Labs', exact: true }).click();
      assert.deepEqual(await page.locator('.hub-page li a').allTextContents(), ['IT Support', 'Networking']);
      await page.locator('.hub-page').getByRole('link', { name: 'Networking', exact: true }).click();
      const cards = page.locator('.hub-page li a');
      assert.deepEqual(await cards.allTextContents(), [start, 'Open Practice']);
      await page.locator('.hub-page').getByRole('link', { name: start, exact: true }).click();
      assert.equal(page.url(), base + route);
      await page.locator('.hub-article').getByRole('link', { name: 'Network+', exact: true }).click();
      assert.equal(page.url(), base + 'certifications/comptia/network-plus/');
      assert.equal(await page.locator('.hub-page').getByRole('link', { name: title, exact: true }).count(), 1);
      await page.locator('.hub-page').getByRole('link', { name: title, exact: true }).click();
      assert.equal(page.url(), base + route);

      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        for (const theme of ['default', 'slate']) {
          await page.locator('body').evaluate((body, theme) => body.setAttribute('data-md-color-scheme', theme), theme);
          assert.equal(await page.locator('h1').innerText(), title);
          assert.equal(await page.locator('.hub-article').count(), 1);
          assert.equal(await page.locator('.hub-landing').count(), 0);
          const images = page.locator('.hub-article img');
          assert.equal(await images.count(), 14);
          await images.evaluateAll(nodes => Promise.all(nodes.map(image => image.decode())));
          assert.deepEqual(await images.evaluateAll(nodes => nodes.filter(image => !image.alt.trim() || !image.naturalWidth).map(image => image.src)), []);
          assert.deepEqual(await images.evaluateAll(nodes => nodes.filter(image => {
            const box = image.getBoundingClientRect();
            return box.left < 0 || box.right > innerWidth + 1 ||
              Math.abs((image.clientWidth / image.clientHeight) / (image.naturalWidth / image.naturalHeight) - 1) > .04;
          }).map(image => image.src)), [], 'Images fit without distortion');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal document overflow');
          for (const { src, href } of await images.evaluateAll(nodes => nodes.map(image => ({ src: image.src, href: image.closest('a')?.href })))) {
            assert.equal(href, src, 'Image opens its full-size local asset');
            const response = await page.request.get(href);
            assert.equal(response.status(), 200);
            assert.match(response.headers()['content-type'], /^image\//);
          }
          if (process.env.PACKET_TRACER_QA_DIR && prefix !== '/') {
            await fs.mkdir(process.env.PACKET_TRACER_QA_DIR, { recursive: true });
            await page.screenshot({ path: path.join(process.env.PACKET_TRACER_QA_DIR, `guide-${width}-${theme}.png`), fullPage: true });
          }
        }
      }

      // A linked image remains keyboard-operable, including at mobile widths.
      const firstImage = page.locator('.hub-article a').filter({ has: page.locator('img') }).first();
      const imageUrl = await firstImage.getAttribute('href');
      const fullImageUrl = new URL(imageUrl, base + route).href;
      await firstImage.focus();
      assert.equal(await firstImage.evaluate(link => link === document.activeElement), true);
      await Promise.all([page.waitForURL(fullImageUrl), firstImage.press('Enter')]);
      assert.equal(page.url(), fullImageUrl);
      await page.goBack();
      assert.equal(page.url(), base + route);
      await page.locator('.hub-article').getByRole('link', { name: 'Back to Networking Labs', exact: true }).click();
      assert.equal(page.url(), base + 'labs/networking/');

      const search = await (await page.request.get(base + 'search/search_index.json')).json();
      assert.ok(search.docs.some(doc => doc.location === route && doc.title === title));
      assert.ok(search.docs.some(doc => doc.location === 'labs/networking/'));
      for (const unpublished of ['labs/cybersecurity/', 'labs/log-analysis/', 'labs/incident-response/',
        'labs/networking/basic-network-configuration/', 'labs/networking/vlan-configuration/',
        'labs/networking/static-routing/', 'labs/networking/dhcp-configuration/',
        'labs/networking/centralized-dhcp-dns/', 'labs/networking/acl-traffic-control/']) {
        assert.equal((await page.request.get(base + unpublished)).status(), 404);
        assert.ok(search.docs.every(doc => !doc.location.startsWith(unpublished)));
        assert.equal(await page.locator(`a[href$="/${unpublished}"]`).count(), 0);
      }
    }
    assert.deepEqual(errors, []);
    console.log('Passed: Home/Labs and Network+ discovery, ordered setup card, 14 local images/full-size links, keyboard image access, 1440/390/320px light/dark layouts, search, root/project paths, and unpublished lab exclusion. Packet Tracer itself was not run.');
    await context.close();
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
