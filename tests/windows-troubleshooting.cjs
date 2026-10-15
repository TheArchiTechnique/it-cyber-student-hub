// Model: node tests/windows-troubleshooting.cjs
// Built-site browser QA: npm run test:windows-troubleshooting (after mkdocs build --strict)
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../docs/practice/pbqs/a-plus-core-2/windows-troubleshooting/app/model.js');
const seeds = new Map(), subnets = new Set();
function expected(s) { return [s.networkFault, 'mapping', 'refresh', s.integrityFault]; }
function investigate(state, i, reverse = false) {
  const s = M.scenario(state.seed);
  const commands = [
    s.networkFault === 'dhcp' ? ['ipconfig /all', `ping ${s.webIP}`] : [`ping ${s.webIP}`, `nslookup ${s.web}.${s.domain}`],
    ['net use', `ping ${s.file}`],
    ['gpresult /r'],
    [s.integrityFault === 'sfc' ? 'sfc /verifyonly' : 'chkdsk C:']
  ][i];
  if (i === 3) state.pcs[i].elevated = true;
  for (const command of reverse ? commands.slice().reverse() : commands) M.execute(state, i, command);
}
for (let seed = 0; seed < 200; seed++) {
  const state = M.initial(seed), s = M.scenario(seed), answers = expected(s);
  seeds.set(s.networkFault + '-' + s.integrityFault, seed); subnets.add(s.prefix);
  assert.equal(state.pcs.length, 4); assert.equal(new Set(s.pcs.map(p => p.host)).size, 4);
  assert.equal(new Set([s.gateway, s.dns, s.fileIP, s.webIP, s.badDNS, ...s.pcs.map(p => p.ip)]).size, 9);
  assert.equal(M.grade(state).score, 0);
  const unrelated = M.initial(seed);
  M.execute(unrelated, 0, 'ipconfig'); M.execute(unrelated, 0, `ping ${s.gateway}`);
  M.execute(unrelated, 0, 'ping made-up-host'); M.execute(unrelated, 0, 'nslookup made-up-host');
  assert.equal(M.evidence(unrelated, 0), s.networkFault === 'dhcp', 'Unknown hostnames must not count as DNS fault evidence');
  // Independent answer and evidence points. Recommendations do not imply executed repairs.
  for (let i = 0; i < 4; i++) {
    const partial = M.initial(seed);
    partial.pcs[i].cause = answers[i]; assert.equal(M.grade(partial).score, 1);
    partial.pcs[i].action = answers[i]; assert.equal(M.grade(partial).score, 2);
    partial.pcs[i].cause = ''; partial.pcs[i].action = '';
    investigate(partial, i, seed % 2 === 0); assert.equal(M.grade(partial).score, 1);
    state.pcs[i].cause = answers[i]; state.pcs[i].action = answers[i];
  }
  assert.equal(M.grade(state).score, 8);
  for (let i = 0; i < 4; i++) investigate(state, i, true);
  assert.equal(M.grade(state).score, 12);
  for (let i = 0; i < 4; i++) {
    const original = state.pcs[i].action;
    state.pcs[i].action = 'wrong'; assert.equal(M.grade(state).score, 11); state.pcs[i].action = original;
    assert.ok(M.feedback(state, i).text.length > 200);
  }
  for (let i = 0; i < 4; i++) {
    for (const command of ['hostname', 'whoami', 'ipconfig', 'ipconfig /all', `ping ${s.gateway}`, `nslookup ${s.web}`]) {
      assert.equal(M.command(state, i, command), M.command(state, i, '  ' + command.toUpperCase().replaceAll(' ', '   ') + '  '));
    }
    for (const command of ['ipconfig', 'ping', 'nslookup', 'net use', 'whoami', 'hostname', 'gpresult', 'gpupdate', 'sfc', 'chkdsk']) assert.ok(M.command(state, i, command + ' /?').length > 25);
  }
  const c = M.config(state, 0);
  if (s.networkFault === 'dhcp') {
    assert.match(c.ip, /^169\.254\./); assert.equal(c.gateway, ''); assert.equal(c.mask, '255.255.0.0');
    assert.match(M.command(state, 0, 'ipconfig /renew'), /unable to contact your DHCP server/);
    assert.equal(M.config(state, 0).ip, c.ip);
  } else {
    assert.equal(c.ip, s.pcs[0].ip); assert.equal(c.dns, s.badDNS);
    assert.match(M.command(state, 0, `ping ${s.webIP}`), /0% loss/);
    assert.match(M.command(state, 0, `ping ${s.web}`), /could not find host/);
    assert.match(M.command(state, 0, `nslookup ${s.web}`), /timed out/);
    assert.match(M.command(state, 0, `nslookup ${s.web} ${s.dns}`), new RegExp(s.webIP.replaceAll('.', '\\.')));
    M.command(state, 0, 'ipconfig /flushdns'); assert.equal(M.config(state, 0).dns, s.badDNS);
  }
  assert.match(M.command(state, 1, 'net use'), /archive/);
  assert.match(M.command(state, 1, `net use ${s.drive} ${s.share}`), /error 85/);
  assert.match(M.command(state, 1, `net use ${s.drive} /delete /y`), /deleted successfully/);
  assert.match(M.command(state, 1, `net use ${s.drive} \\\\unknown\\wrong`), /error 67/);
  assert.match(M.command(state, 1, `net use ${s.drive} ${s.share} /persistent:yes`), /completed successfully/);
  assert.equal(state.pcs[1].mapping, s.share); assert.doesNotMatch(M.command(state, 1, 'net use'), /archive/);
  assert.doesNotMatch(M.command(state, 2, 'gpresult /r'), new RegExp(s.policy));
  assert.equal(state.pcs[2].policyUpdated, false);
  M.command(state, 2, 'gpupdate /force /target:computer'); assert.equal(state.pcs[2].policyUpdated, false);
  M.command(state, 2, 'gpupdate /target:user /force'); assert.equal(state.pcs[2].policyUpdated, true);
  assert.match(M.command(state, 2, 'gpresult /scope user /r'), new RegExp(s.policy));
  M.command(state, 2, 'gpresult /r /scope computer'); assert.equal(M.evidence(state, 2), true, 'A later computer-only report must not erase user evidence');
  assert.match(M.command(state, 0, 'gpupdate /force'), /could not locate a domain controller/);
  // Both system tools require elevation, even for read-only checks.
  state.pcs[3].elevated = false;
  assert.match(M.command(state, 3, 'sfc /verifyonly'), /administrator/);
  assert.match(M.command(state, 3, 'chkdsk C:'), /Access Denied/);
  state.pcs[3].elevated = true;
  if (s.integrityFault === 'sfc') {
    assert.match(M.command(state, 3, 'chkdsk C:'), /found no problems/);
    assert.match(M.command(state, 3, 'sfc /verifyonly'), /found integrity violations/);
    assert.equal(state.pcs[3].systemRepaired, false);
    assert.match(M.command(state, 3, 'sfc /scannow'), /successfully repaired/);
    assert.match(M.command(state, 3, 'sfc /verifyonly'), /did not find any integrity violations/);
  } else {
    assert.match(M.command(state, 3, 'sfc /scannow'), /did not find any integrity violations/);
    assert.match(M.command(state, 3, 'chkdsk C:'), /Errors found/);
    assert.match(M.command(state, 3, 'chkdsk C: /f'), /Cannot lock current drive/);
    assert.equal(state.pcs[3].diskRepaired, false); assert.equal(state.pcs[3].scheduledDisk, false);
    assert.equal(M.restart(state, 3), false);
    assert.match(M.command(state, 3, 'ipconfig'), /Please answer Y or N/);
    M.command(state, 3, 'N'); assert.equal(state.pcs[3].scheduledDisk, false);
    M.command(state, 3, 'chkdsk /f C:'); M.command(state, 3, 'Y');
    assert.equal(state.pcs[3].scheduledDisk, true); assert.equal(state.pcs[3].diskRepaired, false);
    M.command(state, 3, 'chkdsk C: /f'); M.command(state, 3, 'N');
    assert.equal(state.pcs[3].scheduledDisk, true, 'Declining a second schedule request must retain the existing scheduled check');
    assert.match(M.command(state, 3, 'chkdsk C:'), /Errors found/, 'Scheduling is not completed repair');
    assert.equal(M.restart(state, 3), true); assert.equal(state.pcs[3].diskRepaired, true);
    assert.equal(state.pcs[3].elevated, false);
    state.pcs[3].elevated = true; assert.match(M.command(state, 3, 'chkdsk C:'), /found no problems/);
    assert.equal(state.pcs[3].systemRepaired, false);
  }
  assert.equal(M.grade(state).score, 12, 'Original diagnosis remains valid after repairs');
  const restored = M.restore(JSON.parse(JSON.stringify(state)));
  assert.equal(M.grade(restored).score, 12); assert.equal(restored.pcs[1].mapping, s.share); assert.equal(restored.pcs[2].policyUpdated, true);
  for (const bad of ['ping ' + s.gateway + ' && whoami', 'sfc /scannow; hostname', '<img src=x onerror=alert(1)>', '$(hostname)', 'powershell', 'format C:', 'ipconfig /release', 'whoami extra', 'hostname\nipconfig', 'a'.repeat(300)]) assert.match(M.command(state, 1, bad), /Command unavailable/);
  const frozen = JSON.stringify(state); state.submitted = true;
  const submitted = JSON.stringify(state); M.execute(state, 1, 'net use'); assert.equal(JSON.stringify(state), submitted); assert.equal(M.restart(state, 3), false);
  assert.notEqual(frozen, submitted);
}
assert.equal(seeds.size, 4); assert.ok(subnets.size > 90);
let previous = M.initial(1);
for (let i = 0; i < 60; i++) { const next = M.fresh(previous), a = M.scenario(next.seed), b = M.scenario(previous.seed); assert.notEqual(next.seed, previous.seed); assert.ok(a.networkFault !== b.networkFault || a.integrityFault !== b.integrityFault); previous = next; }
for (const invalid of [null, {}, [], { version: 999 }, { version: 1, seed: -1, pcs: [] }]) assert.equal(M.restore(invalid).pcs.length, 4);
const dirty = M.initial(4); dirty.pcs[0].cause = '<script>'; dirty.pcs[0].orders.cause = ['dns']; dirty.pcs[1].mapping = '<script>'; dirty.pcs[0].transcript = [{ command: 'help', output: '<img src=x>' }];
const clean = M.restore(dirty); assert.equal(clean.pcs[0].cause, ''); assert.equal(clean.pcs[0].orders.cause.length, 4); assert.equal(clean.pcs[1].mapping, M.scenario(4).oldShare);
for (let i = 0; i < 50; i++) M.execute(clean, 0, 'help'); assert.equal(clean.pcs[0].transcript.length, 32); assert.equal(clean.pcs[0].history.length, 40);
M.execute(clean, 0, 'cls'); assert.equal(clean.pcs[0].transcript.length, 0);
for (const name of ['model.js', 'app.js']) assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../docs/practice/pbqs/a-plus-core-2/windows-troubleshooting/app', name), 'utf8'), /\beval\s*\(|new Function\s*\(|child_process|execSync|spawnSync/);
console.log('PASS model: 200 seeded attempts; all four variant combinations; independent partial credit, evidence without command-order rules, parser safety, context, permissions, repairs and restart timing, state recovery and bounded history.');

async function browser(origin) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [], failed = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
    const route = '/practice/pbqs/a-plus-core-2/windows-troubleshooting/app/';
    let base = origin;
    const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), M.KEY);
    async function load(seed) { await page.goto(base + route); await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: M.KEY, state: M.initial(seed) }); await page.reload(); }
    async function pc(i) { await page.locator(`[data-pc="${i}"]`).click(); }
    async function run(cmd) { await page.locator('#command').fill(cmd); await page.locator('#command').press('Enter'); return page.locator('#output .terminal-entry').last().innerText(); }
    async function select(i, cause, action = cause) { await pc(i); await page.selectOption('#cause', cause); await page.selectOption('#action', action); }
    async function reset(kind = 'reset') { await page.locator(kind === 'reset' ? '#reset' : '#new-scenario').click(); await page.locator('#confirm-action').click(); }
    async function layout(width) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}`);
      for (const id of ['command', 'run', 'cause', 'action', 'reset', 'new-scenario', 'submit']) {
        const el = page.locator('#' + id); await el.scrollIntoViewIfNeeded();
        assert.equal(await el.evaluate(e => { const r = e.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), true, `${id} is sized and unobstructed at ${width}`);
      }
    }
    for (const prefix of ['', '/it-cyber-student-hub']) {
      base = origin + prefix;
      for (const [variants, seed] of seeds) {
        await load(seed); const s = M.scenario(seed), answers = expected(s);
        assert.equal(await page.locator('.workstation').count(), 4);
        assert.equal(await page.locator('[data-pbq-nav]').count(), 3);
        assert.equal(await page.locator('#results').innerHTML(), '', 'No feedback DOM before submission');
        assert.equal(await page.locator('#results').isVisible(), false);
        // Blank, answer-only, and full evidence submissions.
        await page.locator('#submit').click(); assert.equal(await page.locator('.score').innerText(), '0 / 12 points');
        assert.equal(await page.locator('#results').evaluate(e => document.activeElement === e), true);
        assert.equal(await page.locator('#command').isDisabled(), true);
        await page.locator('#retry').click();
        for (let i = 0; i < 4; i++) await select(i, answers[i]);
        await page.locator('#submit').click(); assert.equal(await page.locator('.score').innerText(), '8 / 12 points');
        await page.locator('#retry').click();
        await pc(0); await run('HeLp'); await run('  IPCONFIG   /ALL  '); await run(`ping ${s.webIP}`);
        if (s.networkFault === 'dhcp') assert.match(await run('ipconfig /renew'), /unable to contact your DHCP server/);
        else { assert.match(await run(`nslookup ${s.web}`), /timed out/); assert.match(await run(`nslookup ${s.web} ${s.dns}`), new RegExp(s.webIP.replaceAll('.', '\\.'))); }
        await select(1, 'mapping'); await run('net use'); assert.match(await run(`ping ${s.file}`), /0% loss/); await run('whoami'); await run('hostname');
        const history = (await stored()).pcs[1].transcript;
        await pc(0); await pc(1); assert.deepEqual((await stored()).pcs[1].transcript, history); assert.equal(await page.locator('#cause').inputValue(), 'mapping');
        await page.locator('#command').focus(); await page.keyboard.press('ArrowUp'); assert.equal(await page.locator('#command').inputValue(), 'hostname'); await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('#command').inputValue(), '');
        await run(`net use ${s.drive} /delete`); await run(`net use ${s.drive} ${s.share}`); assert.match(await run('net use'), /OK/);
        await pc(2); assert.doesNotMatch(await run('gpresult /r'), new RegExp(s.policy)); await run('gpupdate /force'); assert.match(await run('gpresult /r'), new RegExp(s.policy));
        await pc(3); assert.match(await run('sfc /verifyonly'), /administrator/); assert.match(await run('chkdsk C:'), /Access Denied/);
        await page.locator('#elevate').click();
        if (s.integrityFault === 'sfc') { assert.match(await run('sfc /verifyonly'), /found integrity violations/); await run('sfc /scannow'); assert.match(await run('sfc /verifyonly'), /did not find/); }
        else {
          assert.match(await run('chkdsk C:'), /Errors found/); await run('chkdsk C: /f'); await run('y');
          assert.equal((await stored()).pcs[3].diskRepaired, false); assert.equal(await page.locator('#restart').isVisible(), true);
          await page.reload(); assert.equal(await page.locator('#restart').isVisible(), true);
          await page.locator('#restart').click(); assert.equal((await stored()).pcs[3].diskRepaired, true);
          await page.locator('#elevate').click(); assert.match(await run('chkdsk C:'), /found no problems/);
        }
        assert.equal(await page.locator('#results').isVisible(), false);
        await page.locator('#submit').click(); assert.equal(await page.locator('.score').innerText(), '12 / 12 points');
        assert.equal(await page.locator('.feedback.good').count(), 4);
        await page.reload(); assert.equal(await page.locator('.score').innerText(), '12 / 12 points');
        for (const href of await page.locator('#results a').evaluateAll(es => es.map(e => e.href))) assert.equal((await page.request.get(href)).status(), 200);
        await page.locator('#reset').click(); await page.keyboard.press('Escape'); assert.equal(await page.locator('.score').innerText(), '12 / 12 points'); assert.equal(await page.locator('#reset').evaluate(e => document.activeElement === e), true);
        await reset(); const cleared = await stored(); assert.equal(cleared.seed, seed); assert.ok(cleared.pcs.every(p => p.cause === '' && p.action === '' && p.history.length === 0 && !p.scheduledDisk && !p.systemRepaired));
        await reset('new'); const next = await stored(); assert.notEqual(next.seed, seed); assert.ok(next.pcs.every(p => p.transcript.length === 0));
        console.log(`PASS browser ${prefix || '/'}: ${variants}`);
      }
      // Links, state-preserving reference consultation and actual catalog navigation.
      await load(seeds.get('dns-sfc')); await run('ipconfig'); const before = await stored();
      const popupPromise = context.waitForEvent('page'); await page.locator('.resource-note a').first().click(); const popup = await popupPromise; await popup.waitForLoadState(); assert.match(popup.url(), /reference\/windows-command-line\//); await popup.close(); assert.deepEqual(await stored(), before);
      await page.locator('#activity-tab').focus(); await page.keyboard.press('End'); assert.equal(await page.locator('#lesson').isVisible(), true); assert.equal(await page.locator('#lesson article').count(), 8);
      for (const href of await page.locator('#lesson a').evaluateAll(es => es.map(e => e.href))) assert.equal((await page.request.get(href)).status(), 200);
      await page.keyboard.press('Home'); assert.equal(await page.locator('#activity').isVisible(), true); assert.deepEqual(await stored(), before);
      // Input is text, never HTML or an executable shell command.
      assert.match(await run('<img src=x onerror=alert(1)>'), /Command unavailable/); assert.equal(await page.locator('#output img').count(), 0);
      for (const href of await page.locator('[data-pbq-nav]').evaluateAll(es => es.map(e => e.href))) assert.equal((await page.request.get(href)).status(), 200);
      for (let i = 0; i < 2; i++) {
        await page.locator('[data-pbq-nav="certification"]').click();
        await page.locator('.md-content').getByRole('link', { name: 'Windows Help Desk: Troubleshooting Multiple PCs', exact: true }).click();
        const launch = page.getByRole('link', { name: 'Launch Windows Help Desk: Troubleshooting Multiple PCs', exact: true });
        assert.match(await launch.getAttribute('href'), /windows-troubleshooting\/app\//); await launch.evaluate((e, href) => { e.href = href; }, base + route); await launch.click();
        assert.equal((await stored()).pcs[0].transcript.length, 2);
      }
      await page.goto(base + '/practice/pbqs/'); await page.locator('#pbq-certification').selectOption('a-plus-core-2');
      await page.locator('[data-pbq-id="windows-troubleshooting"] .pbq-library-launch').click(); assert.ok(page.url().endsWith(route));
      await page.goto(base + '/certifications/comptia/a-plus-core-2/');
      await page.locator('.hub-page a').filter({ hasText: 'Windows Help Desk: Troubleshooting Multiple PCs' }).click(); assert.ok(page.url().endsWith('/windows-troubleshooting/'));
    }
    base = origin; await load(seeds.get('dns-filesystem'));
    const orders = new Set();
    for (let i = 0; i < 8; i++) { orders.add((await page.locator('#cause option').allTextContents()).join('|')); await reset(); }
    assert.ok(orders.size > 1);
    for (const width of [1440, 1024, 768, 600, 390, 320]) { await layout(width); await page.locator('#lesson-tab').click(); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); await page.locator('#activity-tab').click(); }
    for (let i = 0; i < 35; i++) await run('hostname'); assert.equal((await stored()).pcs[0].transcript.length, 32); assert.ok(await page.locator('#output').evaluate(e => e.scrollHeight > e.clientHeight));
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touch = await mobile.newPage(); await touch.goto(origin + route); await touch.locator('[data-pc="3"]').tap(); await touch.locator('#elevate').tap(); await touch.locator('#command').fill('sfc /verifyonly'); await touch.locator('#run').tap(); assert.match(await touch.locator('#output').innerText(), /Windows Resource Protection/); await touch.locator('#lesson-tab').tap(); assert.equal(await touch.locator('#lesson').isVisible(), true); await mobile.close();
    await page.evaluate(key => localStorage.setItem(key, '{broken'), M.KEY); await page.reload(); assert.equal(await page.locator('.workstation').count(), 4);
    const denied = await context.newPage(); await denied.addInitScript(() => { Storage.prototype.getItem = function () { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.setItem = function () { throw new DOMException('Blocked', 'SecurityError'); }; }); await denied.goto(origin + route); assert.match(await denied.locator('#save-status').innerText(), /unavailable/); await denied.locator('#command').fill('help'); await denied.locator('#command').press('Enter'); assert.match(await denied.locator('#output').innerText(), /Available simulated Windows commands/); await denied.close();
    if (process.env.PBQ_QA_SCREENSHOT) {
      await load(seeds.get('dns-sfc')); await run('ipconfig /all'); await page.setViewportSize({ width: 1440, height: 1100 }); await page.screenshot({ path: process.env.PBQ_QA_SCREENSHOT, fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#ticket details').evaluate(e => { e.open = true; }); await page.screenshot({ path: process.env.PBQ_QA_SCREENSHOT.replace(/\.png$/, '-mobile.png'), fullPage: true });
    }
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    console.log('PASS browser: root/project URLs; all fault combinations; partial/full scores; state switching and reload; CLI history; repairs; scheduled restart; reset/retry/new; lesson and resource links; return/re-entry; catalog/Core 2 navigation; keyboard/touch; 320–1440px layouts; safe text output; storage failure.');
  } finally { await browser.close(); }
}
if (process.argv[2] === '--local') {
  const http = require('node:http'), site = path.resolve(__dirname, '../site');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let url = new URL(req.url, 'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/, '');
    if (url.endsWith('/')) url += 'index.html';
    const target = path.resolve(site, '.' + decodeURIComponent(url));
    if (!target.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream'); res.end(data); });
  });
  server.listen(0, '127.0.0.1', () => browser(`http://127.0.0.1:${server.address().port}`).catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close()));
}
