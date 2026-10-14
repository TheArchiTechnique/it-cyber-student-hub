// Run after mkdocs build --strict. This checks browser behavior and source safety,
// not execution of Windows commands on a student's computer.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '../site');
const prefix = '/it-cyber-student-hub/';
const lab = 'labs/it-support/windows-command-line/';
const title = 'Windows Command-Line Lab';
const key = 'student-hub:windows-command-lab:v1';
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.slice(1);
    let target = path.resolve(site, relative);
    if (!target.startsWith(site + path.sep)) throw new Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  const browser = await chromium.launch({
    executablePath: process.env.PBQ_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    await context.addInitScript(storageKey => {
      window.copiedCommands = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        async writeText(value) {
          if (window.denyClipboard) throw new Error('Clipboard unavailable');
          window.copiedCommands.push(value);
        }
      } });
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function(name) {
        if (name === storageKey && window.denyLabStorage) throw new Error('Storage unavailable');
        return get.call(this, name);
      };
      Storage.prototype.setItem = function(name, value) {
        if (name === storageKey && window.denyLabStorage) throw new Error('Storage unavailable');
        return set.call(this, name, value);
      };
    }, key);
    const page = await context.newPage();
    await page.emulateMedia({reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const scheme of ['light', 'dark']) {
        await page.goto(base + lab);
        await page.locator('[data-cmd-restart]').waitFor({state:'visible'});
        await page.locator('body').evaluate((body, scheme) => body.setAttribute('data-md-color-scheme', scheme === 'dark' ? 'slate' : 'default'), scheme);
        assert.equal(await page.locator('.hub-article').count(), 1);
        assert.equal(await page.locator('.hub-landing').count(), 0);
        assert.equal(await page.locator('h1').textContent(), title);
        assert.equal(await page.locator('article h2').count(), 7);
        assert.equal(await page.locator('[data-cmd-checkpoint]').count(), 7);
        await page.locator('[data-cmd-restart]').click();
        const folder = await page.locator('[data-cmd-folder]').textContent();
        assert.match(folder, /^GuidedLab-[a-z0-9]{6,24}$/);
        assert.equal(await page.locator('progress').getAttribute('value'), '0');
        const codes = await page.locator('pre > code.language-bat').allTextContents();
        assert.ok(codes.length > 20);
        for (const code of codes) {
          const command = code.trim();
          assert.equal(command.split(/\r?\n/).length, 1, 'One command per copy action');
          assert.ok(!/[&|>]/.test(command), 'No concealed pipelines, chaining, or redirection');
          assert.ok(!/\/(MIR|PURGE|MOVE?|S|Q)(?:\s|$)/i.test(command.replace(/^dir\s/i, 'listing ')) || command.startsWith('dir /s /b '));
          if (/^(md|copy|robocopy)\s/i.test(command)) {
            assert.ok(command.includes(`"%USERPROFILE%\\StudentHub-CMD-Practice\\${folder}\\`) || command === `md "%USERPROFILE%\\StudentHub-CMD-Practice\\${folder}"`, command);
          }
          if (command.startsWith('copy ')) assert.ok(command.startsWith('copy /-Y '));
          if (command.startsWith('robocopy ')) assert.ok(command.includes('/XC /XN /XO /R:1 /W:1'));
        }
        const copyButtons = page.getByRole('button', {name:/^Copy command \d+$/});
        assert.equal(await copyButtons.count(), codes.length);
        // Test exact clipboard payloads, including personalized file paths.
        for (const index of [0, codes.findIndex(c=>c.startsWith('copy /-Y con')), codes.findIndex(c=>c.startsWith('robocopy '))]) {
          await copyButtons.nth(index).click();
          assert.equal(await page.evaluate(()=>window.copiedCommands.at(-1)), codes[index].trim());
        }
        const hint = page.locator('details > summary').first();
        await hint.focus(); await page.keyboard.press('Enter');
        assert.equal(await hint.evaluate(el=>el.parentElement.open), true);
        const firstCheck = page.locator('[data-cmd-checkpoint="1"]');
        await firstCheck.focus(); await page.keyboard.press('Space');
        assert.equal(await page.locator('progress').getAttribute('value'), '1');
        await page.reload();
        await page.locator('[data-cmd-restart]').waitFor({state:'visible'});
        assert.equal(await page.locator('[data-cmd-folder]').textContent(), folder);
        assert.equal(await firstCheck.isChecked(), true);
        for (const input of await page.locator('[data-cmd-checkpoint]').all()) await input.check();
        assert.equal(await page.locator('progress').getAttribute('value'), '7');
        assert.match(await page.locator('[data-cmd-completion]').textContent(), /Lab complete/);
        await firstCheck.uncheck();
        assert.equal(await page.locator('progress').getAttribute('value'), '6');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
        await page.locator('details').evaluateAll(nodes=>nodes.forEach(node=>{node.open=true;}));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
        if (process.env.CMD_LAB_QA_DIR) {
          await page.locator('body').evaluate((body, scheme)=>body.setAttribute('data-md-color-scheme',scheme==='dark'?'slate':'default'),scheme);
          await fs.mkdir(process.env.CMD_LAB_QA_DIR,{recursive:true});
          await page.locator('#cmd-lab-progress').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(process.env.CMD_LAB_QA_DIR,`cmd-lab-${width}-${scheme}.png`)});
          await page.locator('[id="4-organize-support-files"]').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(process.env.CMD_LAB_QA_DIR,`cmd-files-${width}-${scheme}.png`)});
        }
        await page.locator('[data-cmd-restart]').click();
        assert.notEqual(await page.locator('[data-cmd-folder]').textContent(), folder);
        assert.equal(await page.locator('[data-cmd-checkpoint]:checked').count(), 0);
        assert.equal(await page.locator('details[open]').count(), 0);
      }
    }
    // Clipboard denial selects the actual command for manual copying.
    await page.evaluate(()=>{window.denyClipboard=true;});
    await page.getByRole('button',{name:'Copy command 1',exact:true}).click();
    assert.equal(await page.evaluate(()=>getSelection().toString().trim()),'cd');
    assert.match(await page.locator('.cmd-lab-copy-bar [role="status"]').first().textContent(),/Command selected/);
    // Corrupt data and blocked storage both leave a usable lab.
    await page.evaluate(key=>localStorage.setItem(key,'{"version":1,"folder":"../../bad","completed":["7"]}'),key);
    await page.reload(); await page.locator('[data-cmd-restart]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-cmd-folder]').textContent(),/^GuidedLab-[a-z0-9]{6,24}$/);
    assert.equal(await page.locator('progress').getAttribute('value'),'0');
    await page.evaluate(()=>{window.denyLabStorage=true;});
    await page.locator('[data-cmd-checkpoint="2"]').check();
    assert.equal(await page.locator('[data-cmd-save-note]').isVisible(),true);
    assert.equal(await page.locator('progress').getAttribute('value'),'1');
    // Exercise both discovery routes and the canonical reference link.
    await page.goto(base+'labs/');
    await page.locator('.hub-page').getByRole('link',{name:'IT Support',exact:true}).click();
    await page.locator('.hub-page').getByRole('link',{name:title,exact:true}).click();
    assert.equal(page.url(),base+lab);
    await page.locator('.hub-article').getByRole('link',{name:'Open command reference',exact:true}).click();
    assert.equal(page.url(),base+'reference/windows-command-line/');
    await page.goto(base+'certifications/comptia/a-plus-core-2/');
    assert.equal(await page.locator('.hub-page').getByRole('link',{name:title,exact:true}).count(),1);
    await page.locator('.hub-page').getByRole('link',{name:title,exact:true}).click();
    assert.equal(page.url(),base+lab);
    await page.locator('.hub-article').getByRole('link',{name:'Back to IT Support Labs',exact:true}).click();
    assert.equal(page.url(),base+'labs/it-support/');
    const index=JSON.parse(await fs.readFile(path.join(site,'search/search_index.json'),'utf8'));
    assert.ok(index.docs.some(entry=>entry.location.startsWith(lab)&&entry.title.includes('Independent technician challenge')));
    assert.deepEqual(errors,[]);
    console.log('PASS: seven stages, exact copy payloads/fallback, bounded commands, checkpoints, persistence, restart, malformed/blocked storage, keyboard, 1440/390/320px light/dark, navigation, reference and search. No live Windows execution.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
