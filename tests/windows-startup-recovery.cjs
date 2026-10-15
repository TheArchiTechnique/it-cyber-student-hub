// Model tests: node tests/windows-startup-recovery.cjs
// Built-site browser tests: npm run test:windows-startup-recovery
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../docs/practice/pbqs/a-plus-core-2/windows-startup-recovery/app/model.js');
function shell(s, i = 0) { M.navigate(s.pcs[i], 'terminal'); return text => M.execute(s, i, text); }
function investigate(p, run) {
  M.firmware(p, 'storage'); M.firmware(p, 'boot'); M.navigate(p, 'repair'); M.navigate(p, 'repairLog'); M.navigate(p, 'terminal');
  for (const c of ['diskpart', 'list disk', 'list volume', 'select volume 1', 'detail volume', 'exit', `dir ${M.windows(p)}:\\Windows`, 'bootrec /scanos']) run(c);
}
function mount(run, letter = 'S') { for (const c of ['diskpart', 'select volume 1', `assign letter=${letter}`, 'exit']) run(c); }
{
  const s = M.initial(), a = s.pcs[0], b = s.pcs[1]; let run = shell(s);
  assert.match(run('dir'), /X:\\windows\\system32/); assert.match(run('dir E:\\sources'), /boot.wim/);
  assert.equal(M.grade(s).score, 0); assert.equal(M.restart(a), 'recovery'); assert.equal(M.restart(b), 'boot');
  run = shell(s); assert.match(run('bootrec /scanos'), /1\n\[1\] D:\\Windows/); assert.equal(a.bcd, false);
  assert.match(run('bootrec /fixboot'), /Access is denied/); run('bootrec /fixmbr'); assert.equal(M.restart(a), 'recovery');
  run = shell(s); run('bootrec /rebuildbcd'); assert.equal(a.pending, true); assert.match(run('dir D:\\Windows'), /Please answer/); assert.match(run('Y'), /system device cannot be found/); assert.equal(a.bcd, false);
  assert.match(run('bcdboot C:\\Windows /s S: /f UEFI'), /Failure/); assert.equal(a.bcd, false);
  assert.match(run('bcdboot D:\\Windows /s S: /f UEFI'), /Failure/); assert.equal(a.bcd, false);
  run('diskpart'); assert.match(run('list disk'), /Gpt[\s\S]+\*/); assert.match(run('list volume'), /D   Windows[\s\S]+FAT32/);
  assert.match(run('assign letter=S'), /no volume specified/); assert.match(run('list partition'), /no disk selected/);
  run('select disk 0'); assert.match(run('list partition'), /System[\s\S]+Reserved/); run('select volume 0'); assert.match(run('assign letter=S'), /Simulation boundary/);
  assert.match(run('select volume 77'), /not valid/); run('select volume 1'); assert.match(run('detail volume'), /EFI System/); assert.match(run('assign letter=D'), /not free/); assert.match(run('assign letter=S'), /successfully assigned/); run('exit');
  assert.doesNotMatch(run('dir S:\\EFI\\Microsoft\\Boot /a'), /BCD/);
  assert.match(run('bcdedit /enum'), /Recovery Media/); assert.match(run('bcdedit /store S:\\EFI\\Microsoft\\Boot\\BCD /enum'), /could not be opened/);
  assert.match(run('chkdsk D: /f'), /found no problems/); assert.equal(a.bcd, false);
  assert.match(run('bcdboot D:\\Windows /s S: /f BIOS'), /successfully created/); assert.equal(a.bcd, false); assert.equal(a.otherBoot, true);
  assert.match(run('bcdboot D:\\Windows /f UEFI'), /Invalid command syntax/);
  assert.match(run('BCDBOOT.EXE "D:\\Windows" /F UEFI /S S: /v'), /successfully created/); assert.equal(a.bcd, true);
  assert.match(run('dir S:\\EFI\\Microsoft\\Boot /a'), /BCD[\s\S]+bootmgfw.efi/);
  assert.match(run('bcdedit /store S:\\EFI\\Microsoft\\Boot\\BCD /enum all'), /winload.efi/);
  assert.match(run('bootrec /scanos'), /installations: 0/); assert.equal(a.verified, false);
  a.mode = 'Legacy'; assert.equal(M.restart(a), 'boot'); a.mode = 'UEFI'; a.order = 'network'; assert.equal(M.restart(a), 'boot'); a.order = 'disk'; assert.equal(M.restart(a, true), 'safe'); assert.equal(a.verified, false); assert.equal(M.restart(a), 'desktop'); assert.equal(a.verified, true);
  run = shell(s, 1); investigate(b, run); assert.match(run('bootrec /rebuildbcd'), /C:\\Windows/); run('n'); assert.equal(b.bcd, false);
  run('bootrec /fixmbr'); assert.equal(M.restart(b), 'boot'); run = shell(s, 1); run('bootrec /fixboot'); assert.equal(M.restart(b), 'recovery');
  run = shell(s, 1); run('bootrec /rebuildbcd'); run('A'); assert.equal(b.bcd, true); assert.equal(b.verified, false); assert.equal(M.restart(b), 'desktop');
  run = shell(s); investigate(a, run); assert.equal(M.grade(s).score, 12);
  const restored = M.restore(JSON.parse(JSON.stringify(s))); assert.deepEqual(M.grade(restored), M.grade(s)); assert.equal(restored.pcs[0].letter, 'S'); assert.equal(restored.pcs[1].bcd, true);
  s.submitted = true; const frozen = JSON.stringify(s); M.execute(s, 0, 'bootrec /fixmbr'); assert.equal(JSON.stringify(s), frozen);
}
// Valid alternative recovery paths; do not force a memorized command order.
for (const letter of ['S', 'Z', 'T']) {
  const s = M.initial(), run = shell(s); mount(run, letter); run('bootrec /rebuildbcd'); run('Y'); assert.equal(M.restart(s.pcs[0]), 'desktop');
  const second = M.initial(), runB = shell(second, 1); mount(runB, letter); runB(`bcdboot C:\\Windows /s ${letter}: /f BIOS`); assert.equal(M.restart(second.pcs[1]), 'boot'); shell(second, 1)('bootrec /fixboot'); shell(second, 1)('bootrec /fixmbr'); assert.equal(M.restart(second.pcs[1]), 'desktop');
}
for (const target of ['bcdboot D:\\Windows', 'bcdboot D:\\Windows /s S: /f ALL']) {
  const s = M.initial(), run = shell(s); mount(run); assert.match(run(target), /successfully created/); assert.equal(M.restart(s.pcs[0]), 'desktop');
}
for (const i of [0, 1]) {
  for (const c of ['help', 'bootrec /?', 'bcdboot /?', 'dir /?', 'chkdsk /?', 'bcdedit /?']) {
    const s = M.initial(), run = shell(s, i), before = JSON.stringify(s.pcs[i].evidence); assert.ok(run(c).length > 50); assert.equal(JSON.stringify(s.pcs[i].evidence), before);
  }
  for (const c of ['bootrec /scanos', 'dir ' + (i ? 'C' : 'D') + ':\\Windows', 'chkdsk ' + (i ? 'C' : 'D') + ':']) {
    const one = M.initial(), two = M.initial(); assert.equal(shell(one, i)(c), shell(two, i)('  ' + c.toUpperCase().replaceAll(' ', '   ') + '  '));
  }
}
for (const c of ['bootrec /fixmbr /fixboot', 'bootrec /wrong', 'bcdboot D:\\Windows /s S: /f UEFI /erase', 'bcdboot D:\\Windows /s S: /s T:', 'dir C:\\Windows && shutdown /r', '<img src=x onerror=alert(1)>', '$(whoami)', 'dir\nbootrec /fixmbr', 'format D:', 'a'.repeat(300)]) {
  const s = M.initial(), run = shell(s); run(c); assert.equal(s.pcs[0].bcd, false); assert.equal(s.pcs[0].mbr, false); assert.equal(M.grade(s).score, 0);
}
{
  const s = M.initial(), run = shell(s); run('diskpart'); run('select volume 1');
  for (const c of ['clean', 'format fs=fat32 quick', 'delete partition', 'active']) assert.match(run(c), /No changes were made/);
  run('exit'); for (let i = 0; i < 100; i++) run('help'); assert.equal(s.pcs[0].history.length, 80); assert.equal(s.pcs[0].transcript.length, 60); run('cls'); assert.equal(s.pcs[0].transcript.length, 0);
  run('exit'); assert.equal(s.pcs[0].screen, 'advanced'); assert.equal(M.execute(s, 0, 'bootrec /fixmbr'), '');
}
for (const bad of [null, {}, {version: 1, pcs: [null, {}]}, {version: 999, pcs: []}]) assert.equal(M.restore(bad).pcs.length, 2);
console.log('PASS model: UEFI/MBR recovery, partial failures, alternate valid repairs, firmware mismatches, scans, prompt responses, source/target validation, parser safety, history, persistence, and independent scoring.');

async function browser(origin) {
  const {chromium} = require('playwright');
  const browser = await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH || undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1050}}), page = await context.newPage(), errors = [], failed = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(origin)) failed.push(r.url()); });
    const route = '/practice/pbqs/a-plus-core-2/windows-startup-recovery/app/'; let base = origin;
    const click = name => name === 'Boot recovery USB' ? page.locator('#media').click() : page.getByRole('button', {name, exact:true}).click();
    const store = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), M.KEY);
    const command = async text => { await page.locator('#command').fill(text); await page.locator('#command').press('Enter'); };
    const tile = title => page.locator('.win-option').filter({has:page.locator('strong', {hasText: new RegExp('^' + title + '$')})}).click();
    const media = async () => { await click('Boot recovery USB'); await tile('Troubleshoot'); await tile('Advanced options'); };
    const terminal = async () => { await media(); await tile('Command Prompt'); };
    const reset = async () => { await click('Reset attempt'); await page.locator('#confirm-action').click(); };
    const layout = async width => { await page.setViewportSize({width,height:1050}); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No document overflow at ' + width); };
    async function diagnostic(i) {
      await page.locator(`[data-pc="${i}"]`).click(); await click('Enter firmware setup'); await click('Storage'); assert.match(await page.locator('#screen').innerText(), /Detected/); await click('Boot');
      await click('Save & Exit'); await media(); await tile('Startup Repair'); await page.getByRole('button', {name:'View diagnostic report',exact:true}).waitFor(); await click('View diagnostic report');
      assert.match(await page.locator('#screen').innerText(), /BCD store missing|BCD store on EFI/);
      await terminal();
      for (const c of ['diskpart', 'list disk', 'list volume', 'select volume 1', 'detail volume', 'assign letter=S', 'exit', `dir ${i ? 'C' : 'D'}:\\Windows`, 'bootrec /scanos']) await command(c);
    }
    for (const prefix of ['', '/it-cyber-student-hub']) {
      base = origin + prefix; await page.goto(base + route); await reset(); assert.match(await page.locator('#screen').innerText(), /0xc000000f/);
      // Every WinRE branch responds; options do not silently apply unrelated repairs.
      await click('Boot recovery USB'); await tile('Use a device'); assert.match(await page.locator('#screen').innerText(), /Recovery USB/); await tile('Recovery USB'); await tile('Troubleshoot'); await tile('Reset this PC'); assert.match(await page.locator('#screen').innerText(), /No changes were made/); await page.getByRole('button',{name:'Back to Troubleshoot'}).click(); await tile('Advanced options');
      await tile('System Restore'); assert.match(await page.locator('#screen').innerText(), /No restore points/); await page.getByRole('button',{name:'Back to Advanced options'}).click();
      await tile('Uninstall Updates'); await tile('Uninstall latest quality update'); assert.match(await page.locator('#screen').innerText(), /No changes/); await page.getByRole('button',{name:'Back to updates'}).click(); await tile('Uninstall latest feature update'); assert.match(await page.locator('#screen').innerText(), /no longer available/);
      await media(); await tile('UEFI Firmware Settings'); await click('Restart'); assert.match(await page.locator('#screen').innerText(), /UEFI Firmware Setup/);
      await click('Boot'); await page.locator('#firmware-mode').selectOption('Legacy'); await click('Save & Exit'); assert.match(await page.locator('#screen').innerText(), /Operating System not found/); await click('Enter firmware setup'); await page.locator('#firmware-mode').selectOption('UEFI'); await page.locator('#boot-order').selectOption('network'); await click('Save & Exit'); assert.match(await page.locator('#screen').innerText(), /Operating System not found/); await click('Enter firmware setup'); await page.locator('#boot-order').selectOption('disk');
      await media(); await tile('Startup Settings'); await click('Restart'); assert.match(await page.locator('#screen').innerText(), /0xc000000f/);
      await terminal(); await command('bootrec /fixboot'); assert.match(await page.locator('#output').innerText(), /Access is denied/); await command('bootrec /rebuildbcd'); await command('Y'); assert.match(await page.locator('#output').innerText(), /system device cannot be found/);
      await click('Submit attempt'); assert.match(await page.locator('#results').innerText(), /0 \/ 1 · Boot-component recovery/); assert.equal(await page.locator('#power').isDisabled(), true); const frozen = await store(); await page.locator('[data-pc="1"]').click(); assert.equal((await store()).pcs[0].bcd, frozen.pcs[0].bcd); await click('Retry recovery');
      await diagnostic(0); await command('bcdboot D:\\Windows /s S: /f UEFI'); assert.match(await page.locator('#output').innerText(), /successfully created/);
      await page.locator('#command').fill('draft'); await page.locator('#command').press('ArrowUp'); assert.equal(await page.locator('#command').inputValue(), 'bcdboot D:\\Windows /s S: /f UEFI'); await page.locator('#command').press('ArrowDown'); assert.equal(await page.locator('#command').inputValue(), 'draft');
      await page.locator('#activity-tab').focus(); await page.keyboard.press('End'); assert.equal(await page.locator('#lesson').isVisible(), true); assert.equal(await page.locator('#lesson article').count(), 8); await page.keyboard.press('Home'); assert.equal(await page.locator('#activity').isVisible(), true);
      await page.reload(); assert.equal((await store()).pcs[0].bcd, true); assert.equal(await page.locator('#command').isVisible(), true);
      await media(); await tile('Startup Settings'); await click('Restart'); await click('4 · Enable Safe Mode'); assert.equal((await store()).pcs[0].verified, false); await click('Restart normally'); assert.match(await page.locator('#screen').innerText(), /training desktop/);
      await diagnostic(1); await command('bootrec /fixmbr'); await command('bootrec /fixboot'); await click('Restart computer'); assert.match(await page.locator('#screen').innerText(), /\\Boot\\BCD/); await terminal(); await command('bootrec /rebuildbcd'); await command('n'); await click('Restart computer'); assert.match(await page.locator('#screen').innerText(), /0xc000000f/); await terminal(); await command('bootrec /rebuildbcd'); await command('Y'); await command('wpeutil reboot'); assert.match(await page.locator('#screen').innerText(), /training desktop/);
      await click('Submit attempt'); assert.match(await page.locator('#results').innerText(), /12 \/ 12 points/); await click('Retry recovery'); assert.equal((await store()).pcs[0].bcd, true);
      for (const href of await page.locator('[data-pbq-nav]').evaluateAll(ns => ns.map(n => n.href))) assert.equal((await page.request.get(href)).status(), 200);
      await page.goto(base + '/practice/pbqs/'); await page.locator('#pbq-certification').selectOption('a-plus-core-2'); await page.locator('[data-pbq-id="windows-startup-recovery"] .pbq-library-launch').click(); assert.ok(page.url().endsWith(route)); assert.equal((await store()).pcs[1].verified, true);
      await page.goto(base + '/certifications/comptia/a-plus-core-2/'); await page.locator('.hub-page a').filter({hasText:'Windows Startup Recovery'}).click(); assert.ok(page.url().endsWith('/windows-startup-recovery/'));
    }
    await page.goto(base + route); await reset(); await terminal(); await command('<img src=x onerror=alert(1)>'); assert.equal(await page.locator('#output img').count(),0);
    // Every screen at narrow mobile widths; screenshots are optional local QA output.
    for (const width of [1440, 1024, 768, 600, 390, 320]) {
      await layout(width); await click('Enter firmware setup'); await layout(width); await click('Storage'); await layout(width); await click('Boot'); await layout(width); await media(); await layout(width); await tile('Command Prompt'); await layout(width); await command('diskpart'); await command('list volume'); await command('exit'); await page.locator('#lesson-tab').click(); await layout(width); await page.locator('#activity-tab').click();
    }
    if (process.env.PBQ_QA_SCREENSHOT) { await layout(1440); await page.screenshot({path:process.env.PBQ_QA_SCREENSHOT,fullPage:true}); await media(); await page.screenshot({path:process.env.PBQ_QA_SCREENSHOT.replace('.png','-winre.png'),fullPage:true}); await layout(390); await page.screenshot({path:process.env.PBQ_QA_SCREENSHOT.replace('.png','-mobile.png'),fullPage:true}); }
    await page.locator('#reset').click(); await page.keyboard.press('Escape'); assert.equal(await page.locator('#confirm').isVisible(), false); await reset(); assert.equal((await store()).pcs[0].history.length,0);
    await click('Boot recovery USB'); await tile('Turn off your PC'); assert.match(await page.locator('#screen').innerText(), /powered off/); await click('Power on');
    await click('Boot recovery USB'); await tile('Continue'); assert.match(await page.locator('#screen').innerText(), /0xc000000f/);
    await click('Boot recovery USB');
    for (const title of ['Troubleshoot', 'Advanced options', 'Command Prompt']) { await page.locator('.win-option').filter({has:page.locator('strong', {hasText:new RegExp('^' + title + '$')})}).focus(); await page.keyboard.press('Enter'); }
    assert.equal(await page.locator('#command').evaluate(e => e === document.activeElement), true); await click('Close Command Prompt'); assert.match(await page.locator('#screen').innerText(), /Advanced options/);
    await tile('Startup Repair'); assert.match(await page.locator('#screen').innerText(), /Diagnosing your PC/); await page.reload(); assert.match(await page.locator('#screen').innerText(), /couldn't repair/);
    // No-storage use remains functional.
    const denied = await context.newPage(); await denied.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Blocked','SecurityError'); }; Storage.prototype.setItem = () => { throw new DOMException('Blocked','SecurityError'); }; }); await denied.goto(base + route); assert.match(await denied.locator('#save-status').innerText(), /unavailable/); await denied.close();
    await page.evaluate(key => localStorage.setItem(key,'{broken'), M.KEY); await page.reload(); assert.equal(await page.locator('.workstation').count(),2);
    const touch = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); const mobile = await touch.newPage(); await mobile.goto(base + route); await mobile.locator('[data-pc="1"]').tap(); assert.match(await mobile.locator('#screen').innerText(), /Error loading/); await mobile.locator('#media').tap(); await mobile.locator('.win-option').filter({hasText:'Troubleshoot'}).tap(); await mobile.locator('.win-option').filter({hasText:'Advanced options'}).tap(); await mobile.locator('.win-option').filter({hasText:'Command Prompt'}).tap(); await mobile.locator('#command').fill('help'); await mobile.locator('#command').press('Enter'); assert.match(await mobile.locator('#output').innerText(), /Supported utilities/); await touch.close();
    assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
    console.log('PASS browser: root/project routing; every recovery menu; firmware changes; correct/incorrect repair paths; full/partial scoring; reset/retry; state reload; history; tabs/keyboard/touch; 320–1440px layouts; Hub/Core 2/library integration; storage failure and safe output.');
  } finally { await browser.close(); }
}
if (process.argv[2] === '--local') {
  const http = require('node:http'), site = path.resolve(__dirname,'../site'), mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
  const server = http.createServer((req,res) => { let url = new URL(req.url,'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/,''); if(url.endsWith('/')) url+='index.html'; const target=path.resolve(site,'.'+decodeURIComponent(url)); if(!target.startsWith(site+path.sep)) {res.writeHead(403).end();return;} fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);}); });
  server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}`).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close()));
}
