// Model checks: npm run test:network-plus-physical-cabling
// Actual browser checks after mkdocs build --strict: append -- --browser
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const M = require('../docs/practice/pbqs/network-plus/physical-cabling-installation/app/model.js');
const solution = {
  r101:'mdf', 'r101-0':'fiber', 'r101-1':'copper', 'r101-2':'switch',
  r201:'idf', 'r201-0':'copper', 'r201-1':'switch', 'r201-2':'fiber',
  r301:'idf', 'r301-0':'fiber', 'r301-1':'switch', 'r301-2':'copper',
  b1:'om3', b2:'os2', h1:'cat6', h2:'shielded', h3:'cat6a',
  'h2-rating':'cmp', p1:'copperPatch', p2:'fiberPatch', d1:'dac'
};
const wrong = {
  r101:'idf', 'r101-0':'ups', 'r101-1':'ups', 'r101-2':'ups',
  r201:'mdf', 'r201-0':'ups', 'r201-1':'ups', 'r201-2':'ups',
  r301:'mdf', 'r301-0':'ups', 'r301-1':'ups', 'r301-2':'ups',
  b1:'os2', b2:'om3', h1:'coax', h2:'cat6', h3:'cat6',
  'h2-rating':'cmr', p1:'cat6', p2:'om3', d1:'copperPatch'
};
const attempt = answers => ({...M.fresh(),answers:{...answers}});
assert.equal(M.tasks.length,21);
assert.equal(M.grade(M.fresh()).score,0);
assert.equal(M.grade(attempt(solution)).score,21);
assert.equal(M.grade(attempt(wrong)).score,0);
assert.equal(M.grade(attempt({...solution,h1:'cat6a'})).score,21,'Cat6A must receive equivalent credit for the 1G UTP job');
for (const t of M.tasks) {
  for (const choice of Object.keys(t.options)) {
    const expected = choice === solution[t.id] || (t.id === 'h1' && choice === 'cat6a');
    assert.equal(M.grade(attempt({...solution,[t.id]:choice})).score,expected ? 21 : 20,`${t.id}: ${choice} must match the independently specified job`);
  }
}
assert.equal(M.grade(attempt({b1:'om3',h2:'shielded','h2-rating':'cmr'})).score,2,'Jacket and media must be scored independently');
for (const id of Object.keys(solution)) {
  const state = attempt({...solution,[id]:wrong[id]});
  const original = JSON.stringify(state), result = M.grade(state);
  assert.equal(result.score,20,id + ': one error loses exactly one point');
  assert.equal(result.decisions.filter(d=>!d.correct).length,1);
  assert.equal(result.decisions.find(d=>!d.correct).id,id);
  assert.deepEqual(M.grade(state),result,'Repeated grading is deterministic');
  assert.equal(JSON.stringify(state),original,'Grading does not mutate student answers');
}
assert.equal(M.grade(attempt({...solution,b1:'os2',b2:'om3'})).score,19,'Short LR backbone still needs SMF, SR still needs MMF');
assert.equal(M.grade(attempt({...solution,r101:'idf'})).decisions.find(d=>d.id==='b1').correct,true,'Room errors cannot invalidate media credit');
assert.deepEqual(M.sanitize(null),M.fresh());
assert.deepEqual(M.sanitize({version:99,answers:solution}),M.fresh());
assert.deepEqual(M.sanitize({version:1,answers:{r101:'__proto__',b1:{toString:'om3'},bad:'mdf'},room:'not-a-room'}),M.fresh());
assert.equal(M.sanitize({...attempt(solution),submitted:'true'}).submitted,false);
assert.equal(M.sanitize({...attempt(solution),submitted:true}).submitted,true);
console.log('PASS model: 21 independent decisions, accepted alternatives, empty/wrong/partial attempts, media compatibility, deterministic grading, and storage validation.');

async function browserTests() {
  const {chromium} = require('playwright');
  const site = path.resolve(__dirname,'../site');
  const prefix = '/it-cyber-student-hub';
  const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
  const server = http.createServer(async (req,res) => {
    try {
      let route = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if (route.startsWith(prefix + '/')) route = route.slice(prefix.length);
      let file = path.resolve(site,'.' + route);
      assert.ok(file === site || file.startsWith(site + path.sep));
      if ((await fs.stat(file)).isDirectory()) file = path.join(file,'index.html');
      res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH || undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
    const origin = 'http://127.0.0.1:' + server.address().port;
    const errors = [];
    const context = await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page = await context.newPage();
    page.on('pageerror',err=>errors.push(err.message));
    const appPath = 'practice/pbqs/network-plus/physical-cabling-installation/app/';
    const stored = ()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.KEY);
    const select = (id,value)=>page.locator(`[data-answer="${id}"]`).selectOption(value);
    async function reset() {
      await page.locator('#reset').click();
      assert.equal(await page.locator('#confirm').evaluate(d=>d.open),true);
      await page.locator('#confirm-reset').click();
    }
    for (const subpath of ['',prefix]) {
      const base = origin + subpath + '/';
      const response = await page.goto(base+appPath);
      assert.equal(response.status(),200);
      await reset();
      assert.equal(await page.locator('[data-pbq-nav]').count(),3,'Uses existing built navigation');
      for (const href of await page.locator('[data-pbq-nav]').evaluateAll(ns=>ns.map(n=>n.href))) assert.equal((await page.request.get(href)).status(),200,href);
      assert.equal(await page.locator('#room-targets button').count(),3);
      assert.equal(await page.locator('#results').isHidden(),true);
      assert.equal(await page.locator('.feedback').count(),0,'No answer feedback before submission');
      assert.equal(await page.locator('select[data-answer]').evaluateAll(ns=>ns.every(n=>n.value==='')),true,'No preselected answers');
      // Empty and incorrect attempts must still have explainable feedback.
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'0 / 21');
      assert.equal(await page.locator('.feedback').count(),21);
      assert.equal(await page.locator('.feedback').filter({hasText:'Unanswered'}).count(),21);
      await page.locator('#retry').click();
      assert.equal(await page.locator('.feedback').count(),0,'Retry clears stale explanations');
      // Use native keyboard activation for a room label.
      await page.locator('[data-kind=role][data-item=mdf]').focus();
      await page.keyboard.press('Space');
      await page.locator('[data-room=r101]').focus();
      await page.keyboard.press('Enter');
      assert.equal((await stored()).answers.r101,'mdf');
      // Execute a real Chromium HTML5 drag gesture for room and rack labels.
      await page.locator('[data-kind=role][data-item=idf]').dragTo(page.locator('[data-room=r201]'));
      assert.equal((await stored()).answers.r201,'idf');
      await page.locator('[data-kind=component][data-item=copper]').dragTo(page.locator('[data-target=r201-0]'));
      assert.equal((await stored()).answers['r201-0'],'copper');
      await page.locator('[data-kind=role][data-item=idf]').click();
      await page.locator('[data-room=r301]').click();
      assert.equal((await stored()).answers.r301,'idf');
      // Wrong item family cannot erase the selected room or another answer.
      await page.locator('[data-kind=media][data-item=coax]').click();
      await page.locator('[data-room=r101]').click();
      assert.equal((await stored()).answers.r101,'mdf');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-item=coax]').getAttribute('aria-pressed'),'false');
      await page.locator('[data-kind=media][data-item=om3]').dragTo(page.locator('#route-targets [data-target=b1]'));
      assert.equal((await stored()).answers.b1,'om3');
      await page.locator('[data-kind=media][data-item=os2]').click();
      await page.locator('#route-targets [data-target=b2]').click();
      assert.equal((await stored()).answers.b2,'os2');
      // Check all nine rack units via the room selector and native dropdowns.
      for (const room of ['r101','r201','r301']) {
        await page.locator('#room-picker').selectOption(room);
        for (let i=0;i<3;i++) await select(room+'-'+i,solution[room+'-'+i]);
      }
      for (const id of ['h1','h2','h3','h2-rating','p1','p2','d1']) await select(id,solution[id]);
      assert.equal(await page.locator('#progress').innerText(),'21 / 21 answered');
      assert.equal(await page.locator('.feedback').count(),0);
      await page.reload();
      assert.equal(Object.keys((await stored()).answers).length,21);
      assert.equal(await page.locator('#room-picker').inputValue(),'r301');
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'21 / 21');
      assert.equal(await page.locator('.feedback.good').count(),21);
      assert.equal(await page.locator('[data-answer]').evaluateAll(ns=>ns.every(n=>n.disabled)),true);
      assert.equal(await page.locator('#results').evaluate(n=>n===document.activeElement),true);
      await page.reload();
      assert.equal(await page.locator('.score').innerText(),'21 / 21','Review survives refresh');
      await page.locator('#retry').click();
      await select('h1','cat6a');
      await select('r101','idf');
      await select('h2-rating','cmr');
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'19 / 21','Room and rating errors are independent');
      assert.equal(await page.locator('.feedback.bad').count(),2);
      await page.locator('#retry').click();
      await select('r101','mdf');
      await select('h2-rating','cmp');
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'21 / 21','Valid alternative gets full credit');
      // Lesson navigation, actual photos, and keyboard tab behavior.
      await page.locator('#activity-tab').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#lesson').isVisible(),true);
      await page.locator('#lesson img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
      assert.equal(await page.locator('#lesson img').evaluateAll(ns=>ns.every(n=>n.naturalWidth>1000)),true);
      for (const href of await page.locator('#lesson a').evaluateAll(ns=>ns.map(n=>n.href).filter(s=>new URL(s).origin===location.origin))) {
        const r=await page.request.get(href); assert.equal(r.status(),200,'Local lesson reference '+href);
      }
      for (const width of [1440,820,390,320]) {
        await page.setViewportSize({width,height:1000});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Lesson fits '+width);
        await page.locator('#activity-tab').click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Activity fits '+width);
        assert.equal(await page.locator('.board-scroll').first().evaluate(n=>n.scrollWidth>=n.clientWidth),true);
        await page.locator('#lesson-tab').click();
      }
      await page.setViewportSize({width:1440,height:1100});
      await page.locator('#activity-tab').click();
      const before = await stored();
      await page.locator('#reset').click();
      await page.locator('#keep').click();
      assert.deepEqual(await stored(),before,'Keep working cancels reset');
      await page.evaluate(()=>localStorage.setItem('unrelated-cabling-sentinel','preserve'));
      await reset();
      assert.deepEqual((await stored()).answers,{});
      assert.equal(await page.locator('#results').isHidden(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-cabling-sentinel')),'preserve','Reset isolates this activity');
      await page.evaluate(key=>localStorage.setItem(key,'{broken'),M.KEY);
      await page.reload();
      assert.deepEqual((await stored()).answers,{},'Malformed storage recovers');
      // Existing standalone PBQs still use their own controls and saved state.
      for (const slug of ['soho-physical-installation','wireless-coverage']) {
        assert.equal((await page.goto(base+'practice/pbqs/a-plus-core-1/'+slug+'/app/')).status(),200);
        assert.equal(await page.locator('[data-pbq-nav]').count(),3);
        await page.locator('#lesson-tab').click();
        assert.equal(await page.locator('#lesson').isVisible(),true);
        await page.locator('#activity-tab').click();
        assert.equal(await page.locator('#activity').isVisible(),true);
      }
    }
    const touchContext = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const touch = await touchContext.newPage();
    touch.on('pageerror',err=>errors.push(err.message));
    await touch.goto(origin+prefix+'/'+appPath);
    await touch.locator('[data-kind=role][data-item=mdf]').tap();
    await touch.locator('[data-room=r101]').tap();
    assert.equal(await touch.locator('[data-answer=r101]').inputValue(),'mdf');
    await touch.locator('[data-kind=media][data-item=cat6]').tap();
    await touch.locator('#job-h1 [data-target=h1]').tap();
    assert.equal(await touch.locator('[data-answer=h1]').inputValue(),'cat6');
    await touchContext.close();
    const blockedContext = await browser.newContext();
    await blockedContext.addInitScript(()=>{Storage.prototype.getItem=function(){throw new Error('Storage blocked');};Storage.prototype.setItem=function(){throw new Error('Storage blocked');};});
    const blocked = await blockedContext.newPage();
    blocked.on('pageerror',err=>errors.push(err.message));
    await blocked.goto(origin+prefix+'/'+appPath);
    assert.match(await blocked.locator('#save-status').innerText(),/cannot be saved/);
    await blocked.locator('[data-answer=r101]').selectOption('mdf');
    await blocked.locator('#submit').click();
    assert.equal(await blocked.locator('.score').innerText(),'1 / 21');
    await blockedContext.close();
    assert.deepEqual(errors,[],'No browser runtime errors');
    await context.close();
    console.log('PASS Chromium: root/project routes, real drag/drop, keyboard/click/touch alternatives, all rooms, grading, refresh, retry/reset, lesson/images/links, storage failure, 320–1440px layouts, and existing PBQ navigation.');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if (process.argv.includes('--browser')) browserTests().catch(error=>{console.error(error);process.exitCode=1;});
