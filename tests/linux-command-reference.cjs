// Run after mkdocs build --strict. Serves the real Pages project subpath.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'site');
const prefix = '/it-cyber-student-hub/';
const reference = 'reference/linux-commands/';
const title = 'Linux Command-Line Reference';
const mime = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) throw new Error('Outside project path');
    let target = path.resolve(site, pathname.slice(prefix.length));
    if (!target.startsWith(site + path.sep) && target !== site) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  const objectives = await fs.readFile(path.join(root, 'docs/certifications/comptia/a-plus-core-2/objective-breakdown.md'), 'utf8');
  const linuxObjective = objectives.split('### 1.9 Linux features and tools')[1].split('#### Configuration files')[0];
  const commands = [...linuxObjective.matchAll(/^\| `([^`]+)` \|/gm)].map(match => match[1]);
  assert.equal(commands.length, 27);
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

    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 960 });
      for (const scheme of ['default', 'slate']) {
        await page.goto(base + reference);
        await page.locator('body').evaluate((body, value) => body.setAttribute('data-md-color-scheme', value), scheme);
        assert.equal(await page.locator('h1').textContent(), title);
        const ids = await page.locator('.hub-page [id]').evaluateAll(nodes => nodes.map(node => node.id));
        assert.equal(new Set(ids).size, ids.length, 'Heading and entry anchors are unique');
        assert.equal(await page.locator('.hub-landing').count(), 0, 'Uses the same article layout as the Windows reference');
        for (const command of commands) {
          const entry = page.locator(`.hub-page details#${command}`);
          assert.equal(await entry.count(), 1, `${command} appears exactly once`);
          const summary = entry.locator('summary');
          await summary.focus();
          await page.keyboard.press('Enter');
          assert.equal(await entry.getAttribute('open'), '', `${command} opens from the keyboard`);
          assert.ok(await entry.locator('p').first().isVisible());
          assert.match(await entry.textContent(), /Technician use:/);
          assert.match(await entry.textContent(), /Syntax:/);
        }
        for (const id of ['etc-passwd', 'etc-shadow', 'etc-hosts', 'etc-fstab', 'etc-resolv-conf']) {
          await page.locator(`#${id} > summary`).click();
          assert.equal(await page.locator(`#${id}`).getAttribute('open'), '');
        }
        assert.equal(await page.locator('.hub-page details').count(), 32);
        assert.equal(await page.locator('.hub-page details').filter({hasText: 'sudo cat /etc/shadow'}).count(), 1, 'Shadow entry explains the boundary without exposing a hash');
        const image = page.locator('.hub-page img');
        await image.evaluateAll(nodes => Promise.all(nodes.map(node => node.decode())));
        assert.equal(await image.count(), 1);
        assert.match(await image.getAttribute('alt'), /Ctrl\+O/);
        assert.ok(await image.evaluate(node => node.naturalWidth > 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No page-level horizontal overflow with every entry open');
        const overflow = await page.locator('.hub-page pre').evaluateAll(nodes => nodes.filter(node => {
          const box = node.getBoundingClientRect();
          return box.left < 0 || box.right > innerWidth + 1;
        }).length);
        assert.equal(overflow, 0, 'Long command blocks scroll within the article');
        const pre = page.locator('#cp pre');
        const example = await pre.textContent();
        assert.match(example, /cp -i "\$HOME\/StudentHub-Linux-Practice\/report.txt"/);
        assert.ok(!example.includes('&quot;'), 'Commands render as usable shell text');
        if (process.env.LINUX_REFERENCE_QA_DIR) {
          await fs.mkdir(process.env.LINUX_REFERENCE_QA_DIR, {recursive: true});
          await page.goto(base + reference);
          await page.locator('body').evaluate((body, value) => body.setAttribute('data-md-color-scheme', value), scheme);
          await page.screenshot({path: path.join(process.env.LINUX_REFERENCE_QA_DIR, `reference-${width}-${scheme}.png`)});
          await page.locator('#nano > summary').click();
          await page.locator('#nano > summary').scrollIntoViewIfNeeded();
          await page.screenshot({path: path.join(process.env.LINUX_REFERENCE_QA_DIR, `nano-${width}-${scheme}.png`)});
        }
      }
    }
    for (const source of ['certifications/comptia/a-plus-core-2/', 'reference/']) {
      await page.goto(base + source);
      const link = page.locator('.hub-page').getByRole('link', {name: title, exact: true});
      assert.equal(await link.count(), 1);
      await link.click();
      assert.equal(page.url(), base + reference);
    }
    await page.goto(base + 'certifications/comptia/a-plus-core-2/objective-breakdown/');
    await page.locator('.hub-page').getByRole('link', {name: title, exact: true}).click();
    assert.equal(page.url(), base + reference);
    await page.locator('.hub-page').getByRole('link', {name: 'VirtualBox: Installing Linux Mint', exact: true}).click();
    assert.equal(page.url(), base + 'labs/it-support/virtualbox-linux-mint/');
    await page.locator('.hub-page').getByRole('link', {name: title, exact: true}).click();
    assert.equal(page.url(), base + reference);
    await page.locator('.hub-page').getByRole('link', {name: 'Back to A+ Core 2', exact: true}).click();
    assert.equal(page.url(), base + 'certifications/comptia/a-plus-core-2/');
    // Existing reference and canonical installation article retain their shells.
    await page.goto(base + 'reference/windows-command-line/');
    assert.equal(await page.locator('.hub-landing').count(), 0);
    assert.ok(await page.locator('.hub-page details').count() > 20);
    const search = await (await page.request.get(base + 'search/search_index.json')).json();
    assert.ok(search.docs.some(doc => doc.location.startsWith(reference) && /Nano/.test(doc.text)));
    assert.deepEqual(errors, []);
    console.log('PASS: objective command coverage, all configuration entries, keyboard, readable commands and Nano visual, 1440/390/320px light/dark, discovery, contextual links, back navigation, search, and Windows reference regression.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
