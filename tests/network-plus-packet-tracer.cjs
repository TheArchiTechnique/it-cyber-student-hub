// Run after mkdocs build --strict. Exercises the published guide/labs, not Packet Tracer.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site');
const route = 'labs/networking/packet-tracer-setup/';
const title = 'Getting Started: Download and Install Cisco Packet Tracer';
const start = 'Start Here — Download and Install Cisco Packet Tracer';
const labs = [
  { slug: 'basic-network-configuration', title: 'Lab 1 — Basic Network Configuration', file: 'Lab1_Basic_Network.pkt', previous: 'Previous: Packet Tracer setup' },
  { slug: 'vlan-configuration', title: 'Lab 2 — VLAN Configuration', file: 'Lab2_VLAN_Configuration.pkt', previous: 'Previous: Lab 1 — Basic Network Configuration' },
  { slug: 'static-routing', title: 'Lab 3 — Static Routing', file: 'Lab3_Static_Routing.pkt', previous: 'Previous: Lab 2 — VLAN Configuration' }
];
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
    const setTheme = async theme => {
      if (await page.locator('body').getAttribute('data-md-color-scheme') !== theme) {
        await page.locator(`label[for="__palette_${theme === 'slate' ? '1' : '0'}"]`).click();
      }
      assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'), theme);
    };
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const prefix of ['/', '/it-cyber-student-hub/']) {
      const base = origin + prefix;
      // Follow both discovery paths using the real student-facing links.
      await page.goto(base);
      await page.locator('.hub-page').getByRole('link', { name: 'Labs', exact: true }).click();
      await page.waitForURL(base + 'labs/');
      await page.locator('.hub-page li a').first().waitFor();
      assert.deepEqual(await page.locator('.hub-page li a').allTextContents(), ['IT Support', 'Networking']);
      await page.locator('.hub-page').getByRole('link', { name: 'Networking', exact: true }).click();
      await page.waitForURL(base + 'labs/networking/');
      await page.locator('.hub-page').getByRole('link', { name: start, exact: true }).waitFor();
      const cards = page.locator('.hub-page li a');
      assert.deepEqual(await cards.allTextContents(), [start, ...labs.map(lab => lab.title), 'Open Practice']);
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
          await setTheme(theme);
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
            await page.screenshot({ path: path.join(process.env.PACKET_TRACER_QA_DIR, `guide-${width}-${theme}.png`), fullPage: true, animations: 'disabled' });
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

      // Continue from setup through the actual published cumulative sequence.
      const next = page.locator('.hub-article').getByRole('link', { name: 'Next: ' + labs[0].title, exact: true });
      await next.focus();
      await Promise.all([page.waitForURL(base + 'labs/networking/' + labs[0].slug + '/'), next.press('Enter')]);
      for (const [i, lab] of labs.entries()) {
        const labUrl = base + 'labs/networking/' + lab.slug + '/';
        assert.equal(page.url(), labUrl);
        const article = page.locator('.hub-article');
        assert.equal(await page.locator('h1').innerText(), lab.title);
        assert.match(await article.innerText(), new RegExp(lab.file.replaceAll('.', '\\.')));
        assert.doesNotMatch(await article.innerText(), /YOUR LAST NAME|Your Last Name|Class\/Section|Packet Tracer 9\.0\.0/);
        assert.doesNotMatch(await article.innerText(), /```/, 'Fenced command examples render as code, not literal backticks');
        assert.equal(await article.getByRole('heading', { name: 'Completion checklist', exact: true }).count(), 1);
        const previous = article.getByRole('link', { name: lab.previous, exact: true });
        const priorRoute = i ? 'labs/networking/' + labs[i - 1].slug + '/' : route;
        assert.equal(new URL(await previous.getAttribute('href'), labUrl).href, base + priorRoute);
        await previous.click();
        await page.waitForURL(base + priorRoute);
        assert.equal(page.url(), base + priorRoute);
        await page.locator('.hub-article').getByRole('link', { name: 'Next: ' + lab.title, exact: true }).click();
        await page.waitForURL(labUrl);
        assert.equal(page.url(), labUrl);
        const topology = article.locator('img');
        assert.equal(await topology.count(), 1);
        const topologyLink = article.locator('a').filter({ has: page.locator('img') });
        const topologyUrl = new URL(await topologyLink.getAttribute('href'), labUrl).href;
        assert.equal((await page.request.get(topologyUrl)).status(), 200);
        for (const width of [1440, 390, 320]) {
          await page.setViewportSize({ width, height: 960 });
          for (const theme of ['default', 'slate']) {
            await setTheme(theme);
            await topology.evaluate(image => image.decode());
            assert.ok((await topology.getAttribute('alt')).length > 30);
            assert.equal(await topology.evaluate(image => {
              const b = image.getBoundingClientRect();
              return image.naturalWidth > 0 && b.left >= 0 && b.right <= innerWidth + 1;
            }), true);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Lab document fits the viewport');
            const commands = await article.locator('pre code').allTextContents();
            assert.ok(commands.some(block => block.includes('copy running-config startup-config')));
            assert.ok(commands.some(block => /\bping\b/.test(block)));
            assert.ok(commands.every(block => !/^(?:Router\d*|Switch\d*|PC\d*)[>#]/m.test(block)), 'No prompts mixed into copyable commands');
            if (process.env.PACKET_TRACER_QA_DIR && prefix !== '/') {
              await page.screenshot({ path: path.join(process.env.PACKET_TRACER_QA_DIR, `${lab.slug}-${width}-${theme}.png`), fullPage: true, animations: 'disabled' });
            }
          }
        }
        await topologyLink.focus();
        assert.equal(await topologyLink.evaluate(link => link === document.activeElement), true);
        await Promise.all([page.waitForURL(topologyUrl), topologyLink.press('Enter')]);
        await page.goBack();
        assert.equal(page.url(), labUrl);
        if (i < labs.length - 1) {
          await article.getByRole('link', { name: 'Next: ' + labs[i + 1].title, exact: true }).click();
        } else {
          assert.equal(await article.getByRole('link', { name: /^Next:/ }).count(), 0, 'No unfinished Lab 4 link');
        }
      }
      await page.goto(base + 'certifications/comptia/network-plus/');
      for (const lab of labs) {
        const launch = page.locator('.hub-page').getByRole('link', { name: lab.title, exact: true });
        assert.equal(await launch.count(), 1, 'One certification card per lab');
        await launch.click();
        assert.equal(page.url(), base + 'labs/networking/' + lab.slug + '/');
        await page.goBack();
      }
      await page.goto(base + route);
      await page.locator('.hub-article').getByRole('link', { name: 'Back to Networking Labs', exact: true }).click();
      assert.equal(page.url(), base + 'labs/networking/');

      const search = await (await page.request.get(base + 'search/search_index.json')).json();
      assert.ok(search.docs.some(doc => doc.location === route && doc.title === title));
      assert.ok(search.docs.some(doc => doc.location === 'labs/networking/'));
      for (const lab of labs)
        assert.ok(search.docs.some(doc => doc.location === 'labs/networking/' + lab.slug + '/' && doc.title === lab.title));
      for (const unpublished of ['labs/cybersecurity/', 'labs/log-analysis/', 'labs/incident-response/',
        'labs/networking/dhcp-configuration/',
        'labs/networking/centralized-dhcp-dns/', 'labs/networking/acl-traffic-control/']) {
        assert.equal((await page.request.get(base + unpublished)).status(), 404);
        assert.ok(search.docs.every(doc => !doc.location.startsWith(unpublished)));
        assert.equal(await page.locator(`a[href$="/${unpublished}"]`).count(), 0);
      }
    }
    assert.deepEqual(errors, []);
    console.log('Passed: Home/Labs and Network+ discovery; setup → Labs 1–3 and previous/next links; 14 setup images and 3 topology diagrams; keyboard image/link access; 1440/390/320px light/dark layouts; commands, search, root/project paths, and unpublished Labs 4–6 exclusion. Packet Tracer itself was not run.');
    await context.close();
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
