// Run against the strict MkDocs build at the GitHub Pages project subpath.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const site = path.resolve(__dirname, '../site');
const prefix = '/it-cyber-student-hub/';
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    assert.ok(pathname.startsWith(prefix));
    let target = path.resolve(site, pathname.slice(prefix.length));
    assert.ok(target === site || target.startsWith(site + path.sep));
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});
const installTitle = 'VirtualBox: Installing Linux Mint';
const linuxTitle = 'Linux Mint Workstation Setup and Troubleshooting';
const windowsTitle = 'Windows Command-Line Lab';
const linuxQuiz = 'https://create.kahoot.it/share/linux-basics-commands-and-system-tools/0fdab12a-64d9-4f53-9751-7380dea028d5';
const macQuiz = 'https://create.kahoot.it/share/macos-essentials-troubleshooting/29c60a0b-f4ed-4e83-aab0-76aceba09ec9';
const day7Quiz = 'https://create.kahoot.it/share/windows-security-and-access-control-basics/5148cf77-ef81-49e0-85cf-8a49271e7949';
const day8Quiz = 'https://create.kahoot.it/details/2d759456-7668-494e-8d8d-aab1931ebfef';
const day9Quiz = 'https://create.kahoot.it/share/enter-kahoot-title/45b5f987-2795-4566-9a2f-b710ceb09a94';

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args:['--no-sandbox','--disable-dev-shm-usage']});
    const origin = `http://127.0.0.1:${server.address().port}`;
    const base = origin + prefix;
    const context = await browser.newContext();
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const content = () => page.locator('.hub-page');
    const go = async route => assert.equal((await page.goto(base + route)).status(), 200);
    const follow = async (name, route) => {
      await content().getByRole('link', {name, exact:true}).first().click();
      await page.waitForURL(base + route);
      await content().locator('h1').waitFor();
    };
    const routes = ['learn/','learn/networking/','learn/networking/ports-and-protocols/',
      'labs/','labs/it-support/','reference/','reference/windows-command-line/',
      'reference/linux-commands/','practice/questions/'];
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:960});
      for (const scheme of ['default','slate']) {
        await page.emulateMedia({colorScheme: scheme === 'slate' ? 'dark' : 'light'});
        for (const route of routes) {
          await go(route);
          await page.locator('body').evaluate((node,s) => node.setAttribute('data-md-color-scheme',s), scheme);
          assert.equal(await page.locator('h1').count(),1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true, `${route}: ${width} ${scheme} fits`);
          const cards = content().locator('li').filter({has: page.locator('a')});
          if (await content().evaluate(n => n.classList.contains('hub-landing'))) {
            const hrefs = await cards.locator('a').evaluateAll(nodes => nodes.map(n => n.href));
            assert.equal(hrefs.length,new Set(hrefs).size,`${route}: no duplicate cards`);
            for (const card of await cards.all()) {
              assert.ok((await card.innerText()).trim().length > (await card.locator('a').innerText()).trim().length, 'Resource has a description');
              const link = card.locator('a');
              await link.focus();
              await page.keyboard.press('Tab');
              await page.keyboard.press('Shift+Tab');
              assert.equal(await link.evaluate(n => n === document.activeElement),true,'Card can receive keyboard focus');
              assert.equal(await card.evaluate(n => getComputedStyle(n).outlineStyle), 'solid', 'Focus is visible');
            }
          }
          if (process.env.RESOURCE_NAV_QA_DIR && ['labs/it-support/','reference/','practice/questions/'].includes(route)) {
            await fs.mkdir(process.env.RESOURCE_NAV_QA_DIR,{recursive:true});
            await page.screenshot({path:path.join(process.env.RESOURCE_NAV_QA_DIR, `${route.replaceAll('/','-')}${width}-${scheme}.png`),fullPage:true});
          }
        }
        await go('learn/');
        assert.deepEqual(await content().locator('li a').allTextContents(),['Networking']);
        await follow('Networking','learn/networking/');
        await follow('Ports & Protocols','learn/networking/ports-and-protocols/');
        await follow('Ports & Protocols Reference','reference/ports-and-protocols/');
        await follow('Full lesson','learn/networking/ports-and-protocols/');
        await follow('Back to Learn','learn/');
        await go('labs/');
        assert.deepEqual(await content().locator('li a').allTextContents(),['IT Support']);
        await follow('IT Support','labs/it-support/');
        assert.deepEqual(await content().locator('li a').allTextContents(),['Linux Terminal Simulator',installTitle,linuxTitle,windowsTitle]);
        assert.match(await content().locator('li').nth(2).innerText(),/Prerequisite: complete the Linux Mint installation lab first/);
        await follow(installTitle,'labs/it-support/virtualbox-linux-mint/');
        await follow(linuxTitle,'labs/it-support/linux-mint-command-line/');
        await follow('Back to IT Support Labs','labs/it-support/');
        await follow('Back to Labs','labs/');
        await go('reference/');
        assert.deepEqual(await content().locator('h2').allTextContents(),['Networking & Protocols','Command-Line Tools']);
        assert.equal(await content().getByRole('link',{name:/PowerShell/}).count(),0);
        await follow('Linux Command-Line Reference','reference/linux-commands/');
        await follow(linuxTitle,'labs/it-support/linux-mint-command-line/');
        await follow('Linux Command-Line Reference','reference/linux-commands/');
        await follow('Back to Reference','reference/');
        await follow('Windows Command-Line Reference','reference/windows-command-line/');
        await follow(windowsTitle,'labs/it-support/windows-command-line/');
        await follow('Command Reference','reference/windows-command-line/');
        await follow('Back to Reference','reference/');
        await go('practice/questions/');
        // Count both Kahoot share and details URLs, including all nine Core 2 reviews.
        assert.equal(await content().locator('a[href^="https://create.kahoot.it/"]').count(),9);
        const mac = content().getByRole('link',{name:'macOS Essentials & Troubleshooting - Kahoot!',exact:true});
        assert.equal(await mac.getAttribute('href'),macQuiz);
        for (const [name, href] of [
          ['Windows Security and Access Control Basics - Kahoot!',day7Quiz],
          ['Cybersecurity Essentials: Threats and Defenses - Kahoot!',day8Quiz],
          ['Wi-Fi Security, Power & Safety Essentials - Kahoot!',day9Quiz]
        ]) {
          assert.equal(await content().getByRole('link',{name,exact:true}).getAttribute('href'),href);
        }
        const quiz = content().getByRole('link',{name:'Linux Basics: Commands and System Tools - Kahoot!',exact:true});
        assert.equal(await quiz.getAttribute('href'),linuxQuiz);
        // Observe the outgoing URL without relying on Kahoot availability or signing in.
        const request = page.waitForRequest(linuxQuiz);
        await quiz.click({noWaitAfter:true});
        assert.equal((await request).url(),linuxQuiz);
        await go('practice/questions/');
        await follow('Back to Practice','practice/');
      }
    }
    assert.deepEqual(errors,[]);
    console.log('Passed: resource cards, prerequisites, grouped references, 9 quizzes, student journeys and returns, keyboard focus, desktop/mobile, and both themes.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode=1;});
