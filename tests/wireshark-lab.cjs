// Verify the published Wireshark learning path and downloads at the Pages subpath.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'site');
const prefix = '/it-cyber-student-hub/';
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp',
  '.log':'text/plain','.pcap':'application/octet-stream'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    assert.ok(pathname.startsWith(prefix));
    let target = path.resolve(site, pathname.slice(prefix.length));
    assert.ok(target.startsWith(site + path.sep) || target === site);
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});
const lab = 'labs/networking/wireshark/';
const tool = 'tools/wireshark/';

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH || undefined,
      args:['--no-sandbox','--disable-dev-shm-usage']});
    const origin = `http://127.0.0.1:${server.address().port}`;
    const base = origin + prefix;
    const context = await browser.newContext({acceptDownloads:true});
    await context.route('**/*', route => new URL(route.request().url()).origin === origin
      ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const content = () => page.locator('.hub-page');
    const go = async route => assert.equal((await page.goto(base+route)).status(), 200);
    const follow = async (name, route) => {
      await content().getByRole('link',{name,exact:true}).first().click();
      await page.waitForURL(base+route);
    };
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const scheme of ['default','slate']) {
        for (const route of [tool, lab, lab+'answers/']) {
          await go(route);
          await page.locator('body').evaluate((el,s) => el.setAttribute('data-md-color-scheme',s),scheme);
          assert.equal(await content().locator('h1').count(),1);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} fits ${width}`);
          for (const img of await content().locator('img').all()) {
            assert.ok((await img.getAttribute('alt')).length > 30);
            assert.ok(await img.evaluate(el => el.complete && el.naturalWidth > 0), await img.getAttribute('src'));
            assert.ok(await img.evaluate(el => el.getBoundingClientRect().width <= innerWidth));
            assert.equal(await img.evaluate(el => el.closest('a').getAttribute('href')),await img.getAttribute('src'));
          }
        }
        await go(tool);
        await follow('Wireshark Packet Analysis Lab',lab);
        await follow('Answers and Explanations',lab+'answers/');
        await follow('Back to Student Activity',lab);
      }
    }
    await go('');
    await follow('Tools','tools/');
    assert.deepEqual(await content().locator('li a').allTextContents(),['Wireshark']);
    await follow('Wireshark',tool);
    const official = content().getByRole('link',{name:'wireshark.org/download.html',exact:true});
    assert.equal(await official.getAttribute('href'),'https://www.wireshark.org/download.html');
    for (const index of ['labs/networking/','certifications/comptia/network-plus/']) {
      await go(index);
      assert.equal(await content().getByRole('link',{name:'Wireshark Packet Analysis Lab',exact:true}).count(),1);
      await follow('Wireshark Packet Analysis Lab',lab);
    }
    // Download the binary through the same link a student selects.
    const pending = page.waitForEvent('download');
    await content().getByRole('link',{name:'office-network.pcap',exact:true}).click();
    const download = await pending;
    assert.equal(download.suggestedFilename(),'office-network.pcap');
    const bytes = await fs.readFile(await download.path());
    const assetRoot = path.join(root,'docs',lab,'assets');
    assert.deepEqual(bytes,await fs.readFile(path.join(assetRoot,'office-network.pcap')));
    for (const file of ['office-network.log','packet-reference.json','validation.json']) {
      const response = await page.request.get(base+lab+'assets/'+file);
      assert.equal(response.status(),200);
      assert.deepEqual(await response.body(),await fs.readFile(path.join(assetRoot,file)));
    }
    const manifest = JSON.parse(await fs.readFile(path.join(assetRoot,'packet-reference.json')));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
    await go(lab);
    assert.equal(await content().locator('img').count(),9);
    const studentText = await content().innerText();
    assert.ok(!studentText.includes('HTTP_STOP') && !studentText.includes('RST/ACK'), 'Bonus solutions stay on answer sheet');
    const search = await (await page.request.get(base+'search/search_index.json')).json();
    for (const route of ['tools/',tool,lab,lab+'answers/']) {
      assert.ok(search.docs.some(doc => doc.location === route),`${route} discoverable`);
    }
    assert.deepEqual(errors,[]);
    console.log('Passed Wireshark lesson: desktop/mobile, both palettes, image loading, navigation, answer separation, search, exact downloads.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
