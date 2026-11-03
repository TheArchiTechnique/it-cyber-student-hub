// Model checks: npm run test:network-plus-physical-cabling
// Actual browser checks after mkdocs build --strict: append -- --browser [--firefox]
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const M = require('../docs/practice/pbqs/network-plus/physical-cabling-installation/app/model.js');
const installationSolution = {
  r101:'mdf', 'r101-0':'fiber', 'r101-1':'copper', 'r101-2':'switch',
  r201:'idf', 'r201-0':'copper', 'r201-1':'switch', 'r201-2':'fiber',
  r301:'idf', 'r301-0':'fiber', 'r301-1':'switch', 'r301-2':'copper',
  b1:'om3', b2:'os2', h1:'cat6', h2:'shielded', h3:'cat6a',
  'h2-rating':'cmp', p1:'copperPatch', p2:'fiberPatch', d1:'dac'
};
const installationWrong = {
  r101:'idf', 'r101-0':'ups', 'r101-1':'ups', 'r101-2':'ups',
  r201:'mdf', 'r201-0':'ups', 'r201-1':'ups', 'r201-2':'ups',
  r301:'mdf', 'r301-0':'ups', 'r301-1':'ups', 'r301-2':'ups',
  b1:'os2', b2:'om3', h1:'coax', h2:'cat6', h3:'cat6',
  'h2-rating':'cmr', p1:'cat6', p2:'om3', d1:'copperPatch'
};
const inspectionSolution = {'m-u':'utp','m-s':'stp','m-c':'coax','m-d':'twinax','j-w':'rj45','j-s':'f','j-b':'lc','j-p':'mpo',module:'qsfp',term:'split','t-trace':'toner','t-wire':'tester','t-fiber':'vfl','f-emi':'shield','f-optic':'sr','f-loss':'shorten'};
const inspectionWrong = {'m-u':'stp','m-s':'utp','m-c':'twinax','m-d':'mmf','j-w':'rj11','j-s':'bnc','j-b':'sc','j-p':'lc',module:'sfp',term:'crossed','t-trace':'tester','t-wire':'toner','t-fiber':'tester','f-emi':'length','f-optic':'connector','f-loss':'shield'};
const solution = {...installationSolution,...inspectionSolution}, wrong = {...installationWrong,...inspectionWrong};
const attempt = answers => ({...M.fresh(),answers:{...answers}});
assert.equal(M.installationTasks.length,21);
assert.equal(M.inspection.tasks.length,16);
assert.equal(M.tasks.length,37);
assert.equal(new Set(M.tasks.map(t=>t.id)).size,37,'Every decision is scored once');
assert.equal(M.grade(M.fresh()).score,0);
assert.equal(M.grade(attempt(solution)).score,37);
assert.equal(M.grade(attempt(wrong)).score,0);
assert.equal(M.grade(attempt({...solution,h1:'cat6a'})).score,37,'Equivalent H1 alternative survives expansion');
// Exercise the original grading contract independently of the new decisions.
for (const t of M.installationTasks) {
  for (const choice of Object.keys(t.options)) {
    const expected = choice === installationSolution[t.id] || (t.id === 'h1' && choice === 'cat6a');
    assert.equal(M.grade({version:1,answers:{...installationSolution,[t.id]:choice}}).score,expected ? 21 : 20,`${t.id}: original grading contract`);
  }
}
for (const t of M.tasks) {
  for (const choice of Object.keys(t.options)) {
    const expected = choice === solution[t.id] || (t.id === 'h1' && choice === 'cat6a');
    assert.equal(M.grade(attempt({...solution,[t.id]:choice})).score,expected ? 37 : 36,`${t.id}: ${choice} matches the independent job fixture`);
  }
}
assert.equal(M.grade(attempt({b1:'om3',h2:'shielded','h2-rating':'cmr'})).score,2,'Jacket and media remain independent');
for (const id of Object.keys(solution)) {
  const state = attempt({...solution,[id]:wrong[id]});
  const original = JSON.stringify(state), result = M.grade(state);
  assert.equal(result.score,36,id + ': one error loses one point');
  assert.equal(result.decisions.filter(d=>!d.correct).length,1);
  assert.equal(result.decisions.find(d=>!d.correct).id,id);
  assert.deepEqual(M.grade(state),result,'Deterministic grading');
  assert.equal(JSON.stringify(state),original,'Grading cannot mutate answers');
}
assert.equal(M.grade(attempt({...solution,b1:'os2',b2:'om3'})).score,35);
assert.equal(M.grade(attempt({...solution,r101:'idf'})).decisions.find(d=>d.id==='b1').correct,true);
assert.deepEqual(M.sanitize(null),M.fresh());
assert.deepEqual(M.sanitize({version:99,answers:solution}),M.fresh());
assert.deepEqual(M.sanitize({version:1,answers:{r101:'__proto__',b1:{toString:'om3'},bad:'mdf'},room:'not-a-room'}),M.fresh());
const migrated = M.sanitize({version:1,answers:{...installationSolution,'m-u':'utp'},room:'r201',submitted:true});
assert.equal(migrated.version,2);
assert.deepEqual(migrated.answers,installationSolution,'Preserve all original answers without interpreting unknown old fields');
assert.equal(migrated.room,'r201');
assert.equal(migrated.submitted,false,'Expanded work order reopens a legacy review');
assert.equal(M.grade(migrated).score,21);
assert.equal(M.sanitize({...attempt(solution),submitted:'true'}).submitted,false);
assert.equal(M.sanitize({...attempt(solution),submitted:true}).submitted,true);
for (const raw of [false,42,'saved',[],{}, {version:2,answers:null}, {version:2,answers:[]}, {version:2,answers:'mdf'}]) {
  assert.deepEqual(M.sanitize(raw),M.fresh(),'Malformed shapes recover without interpreting answers');
}
assert.deepEqual(M.sanitize({version:2,answers:{...solution,b1:'invalid',extra:'mdf'}}).answers,
  Object.fromEntries(Object.entries(solution).filter(([id])=>id!=='b1')),'Only valid known answers survive');
assert.doesNotMatch(M.byId.module.prompt+' '+M.byId.module.evidence,/\bQ?SFP\b/i,'Module evidence must not name its scored family');
assert.deepEqual(M.inspection.wiring.A,['White/green','Green','White/orange','Blue','White/blue','Orange','White/brown','Brown']);
assert.deepEqual(M.inspection.wiring.B,['White/orange','Orange','White/green','Blue','White/blue','Green','White/brown','Brown']);
require('../docs/practice/pbqs/network-plus/physical-cabling-installation/app/art.js');
for(const standard of ['A','B']) {
 const diagram=globalThis.CablingArt.wiring(standard);
 const pins=[...diagram.matchAll(/data-pin="(\d)" x="(\d+)"/g)];
 assert.deepEqual(pins.map(p=>Number(p[1])),[1,2,3,4,5,6,7,8]);
 assert.ok(pins.every((p,i)=>i===0 || Number(p[2])>Number(pins[i-1][2])),'Pins increase left to right');
 assert.match(diagram,/nose up, latch underneath/);
}
const photographs=Object.values(M.inspection.photos);
assert.equal(photographs.length,16);
assert.equal(new Set(photographs.map(p=>p.file)).size,16,'One local file per photo');
const sync=require('node:fs');
for(const photo of photographs) {
 assert.match(photo.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
 assert.ok(photo.author && photo.license && photo.changes && photo.alt);
 const stat=sync.statSync(path.join(__dirname,'../docs/practice/pbqs/network-plus/physical-cabling-installation/app',photo.file));
 assert.ok(stat.size>4000 && stat.size<350000,'Bounded, optimized real photograph');
 assert.ok(photo.width>=350 && photo.height>=240);
}
for (const task of M.inspection.tasks.filter(t=>t.photo)) {
  const answerName = {utp:/\bUTP\b/i,stp:/\bSTP\b/i,coax:/\bcoax/i,dac:/\b(twinax|DAC)\b/i,rj45:/\bRJ45\b/i,f:/\bF-type\b/i,lc:/\bLC\b/i,mpo:/\bMPO\b/i,qsfp:/\bQSFP\b/i}[task.photo];
  assert.doesNotMatch(M.inspection.photos[task.photo].alt,answerName,'Scored specimen alt describes features without naming the answer');
}
console.log('PASS model: preserved 21-decision grading, 16 additions, all options, independent partial credit, legacy migration, pin orders/orientation, and licensed local photographs.');

async function browserTests() {
  const engine = process.argv.includes('--firefox') ? 'firefox' : 'chromium';
  const browserType = require('playwright')[engine];
  const site = path.resolve(__dirname,'../site');
  const prefix = '/it-cyber-student-hub';
  const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
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
    browser = await browserType.launch(engine === 'chromium' ? {executablePath:process.env.PBQ_CHROMIUM_PATH || undefined,args:['--no-sandbox','--disable-dev-shm-usage']} : {});
    const origin = 'http://127.0.0.1:' + server.address().port;
    const errors = [];
    const context = await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page = await context.newPage();
    page.on('pageerror',err=>errors.push(err.message));
    const appPath = 'practice/pbqs/network-plus/physical-cabling-installation/app/';
    const stored = ()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.KEY);
    const select = (id,value)=>page.locator(`[data-answer="${id}"]`).selectOption(value);
    async function keyboardSelect(locator,value) {
      const index = await locator.locator('option').evaluateAll((nodes,value)=>nodes.findIndex(n=>n.value===value),value);
      assert.ok(index>=0);
      await locator.focus();
      await page.keyboard.press('Home');
      for(let i=0;i<index;i++) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Tab');
      assert.equal(await locator.inputValue(),value,'Native keyboard selection');
    }
    async function complete(answers,keyboard=false) {
      for(const room of M.rooms) {
        if(keyboard) await keyboardSelect(page.locator('#room-picker'),room.id);
        else await page.locator('#room-picker').selectOption(room.id);
        for(let i=0;i<3;i++) {
          const id=room.id+'-'+i;
          if(keyboard) await keyboardSelect(page.locator(`[data-answer="${id}"]`),answers[id]);
          else await select(id,answers[id]);
        }
      }
      for(const [id,value] of Object.entries(answers).filter(([id])=>!/^r\d+-\d$/.test(id))) {
        if(keyboard) await keyboardSelect(page.locator(`[data-answer="${id}"]`),value);
        else await select(id,value);
      }
    }
    async function verifyScore(expected,answers) {
      assert.equal(await page.locator('.score').innerText(),expected+' / 37');
      assert.equal(await page.locator('.feedback.good').count(),expected);
      assert.equal(await page.locator('.feedback').count(),37);
      let subtotal=0,decisions=0;
      for(const group of await page.locator('.group-result').all()) {
        const match=(await group.locator(':scope > h3').innerText()).match(/(\d+) \/ (\d+)$/);
        subtotal+=Number(match[1]); decisions+=Number(match[2]);
        assert.equal(await group.locator('.feedback.good').count(),Number(match[1]));
        assert.equal(await group.locator('.feedback').count(),Number(match[2]));
      }
      assert.equal(subtotal,expected); assert.equal(decisions,37);
      assert.deepEqual((await stored()).answers,answers,'Grading preserves every submitted selection');
      assert.match(await page.locator('#status').innerText(),new RegExp(expected+' of 37 decisions correct'));
    }
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
      for(const task of M.inspection.tasks.filter(t=>M.inspection.kinds[t.kind])) {
        assert.ok((await page.locator(`#job-${task.id} .answer-target`).getAttribute('aria-label')).includes(task.name),'Matching targets expose task context');
      }
      // Empty and incorrect attempts must still have explainable feedback.
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'0 / 37');
      assert.equal(await page.locator('.feedback').count(),37);
      assert.equal(await page.locator('.feedback').filter({hasText:'Unanswered'}).count(),37);
      await page.locator('#retry').click();
      assert.equal(await page.locator('.feedback').count(),0,'Retry clears stale explanations');
      await complete(wrong);
      await page.locator('#submit').click();
      await verifyScore(0,wrong);
      assert.equal(await page.locator('.feedback.bad').filter({hasText:'Incorrect'}).count(),37,'Every incorrect choice is explained');
      await reset();
      await select('b1','om3'); await select('b2','om3');
      await page.reload();
      assert.equal(await page.locator('#progress').innerText(),'2 / 37 answered');
      await page.locator('#submit').click();
      await verifyScore(1,{b1:'om3',b2:'om3'});
      assert.equal(await page.locator('.feedback.bad').filter({hasText:'Unanswered'}).count(),35);
      await reset();
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
      assert.equal(await page.locator('[data-kind=media][data-item=coax]').getAttribute('aria-pressed'),'false');
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
      assert.equal(await page.locator('#progress').innerText(),'21 / 37 answered');
      assert.equal(await page.locator('.feedback').count(),0);
      await page.reload();
      assert.equal(Object.keys((await stored()).answers).length,21);
      assert.equal(await page.locator('#room-picker').inputValue(),'r301');
      // New recognition tasks support native drag, keyboard placement, dropdowns, and inspection.
      await page.locator('#recognition-media-tray [data-item=utp]').dragTo(page.locator('#job-m-u .answer-target'));
      assert.equal((await stored()).answers['m-u'],'utp');
      await page.locator('#recognition-media-tray [data-item=coax]').dragTo(page.locator('#job-m-u .answer-target'));
      assert.equal((await stored()).answers['m-u'],'coax','A drop replaces only the target answer');
      await page.locator('#recognition-media-tray [data-item=utp]').dragTo(page.locator('#job-m-u .answer-target'));
      await page.locator('#recognition-media-tray [data-item=utp]').dragTo(page.locator('#job-m-s .answer-target'));
      assert.equal((await stored()).answers['m-u'],'utp','Reusing an inventory item retains the earlier placement');
      assert.equal((await stored()).answers['m-s'],'utp');
      assert.equal(await page.locator('#recognition-media-tray .pick').count(),6,'Dragging never consumes inventory');
      await page.locator('#connector-tray [data-item=lc]').dragTo(page.locator('#job-m-u .answer-target'));
      assert.equal((await stored()).answers['m-u'],'utp','Wrong-family drops cannot replace an answer');
      await page.locator('#job-m-u .inspect-photo').click();
      assert.equal(await page.locator('#photo-inspector').evaluate(n=>n.open),true);
      assert.equal(await page.locator('#close-photo').evaluate(n=>n===document.activeElement),true,'Photo dialog receives focus');
      assert.equal(await page.locator('#photo-title').innerText(),M.byId['m-u'].name,'Inspection title stays neutral');
      await page.locator('#photo-large').evaluate(n=>n.decode());
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#photo-inspector').evaluate(n=>n.open),false);
      assert.equal(await page.locator('#job-m-u .inspect-photo').evaluate(n=>n===document.activeElement),true,'Escape restores the photograph opener');
      assert.match(await page.locator('#job-m-u').ariaSnapshot(),/img "Four exposed color-coded pairs/,'Nonvisual image features remain in the accessibility tree');
      await page.locator('#recognition-media-tray [data-item=stp]').focus();
      await page.keyboard.press('Space');
      await page.locator('#job-m-s .answer-target').focus();
      await page.keyboard.press('Enter');
      assert.equal((await stored()).answers['m-s'],'stp');
      await page.locator('#connector-tray [data-item=rj45]').click();
      await page.locator('#job-m-u .answer-target').click();
      assert.equal((await stored()).answers['m-u'],'utp','Wrong label family cannot erase an answer');
      await page.keyboard.press('Escape');
      await page.locator('#tool-tray [data-item=toner]').dragTo(page.locator('#job-t-trace .answer-target'));
      assert.equal((await stored()).answers['t-trace'],'toner');
      for(const [id,value] of Object.entries(inspectionSolution)) if(!['m-u','m-s','t-trace'].includes(id)) await select(id,value);
      assert.equal(await page.locator('#submission-progress').innerText(),'37 / 37 answered · 0 unanswered');
      const beforeLesson=await stored();
      await page.locator('#lesson-tab').click();
      await page.locator('#activity-tab').click();
      assert.deepEqual(await stored(),beforeLesson,'Switching tabs preserves all decisions');
      await page.reload();
      assert.equal(Object.keys((await stored()).answers).length,37);
      await page.locator('#submit').click();
      await verifyScore(37,solution);
      assert.equal(await page.locator('.feedback.good').count(),37);
      assert.equal(await page.locator('[data-answer]').evaluateAll(ns=>ns.every(n=>n.disabled)),true);
      assert.equal(await page.locator('#results').evaluate(n=>n===document.activeElement),true);
      const locked=await stored();
      await page.locator('[data-answer=b1]').dispatchEvent('change');
      assert.deepEqual(await stored(),locked,'Review controls cannot change stored answers');
      await page.reload();
      assert.equal(await page.locator('.score').innerText(),'37 / 37','Review survives refresh');
      await page.locator('#retry').click();
      await select('h1','cat6a');
      await select('r101','idf');
      await select('h2-rating','cmr');
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'35 / 37','Room and rating errors are independent');
      assert.equal(await page.locator('.feedback.bad').count(),2);
      await page.locator('#retry').click();
      await select('r101','mdf');
      await select('h2-rating','cmp');
      await page.locator('#submit').click();
      assert.equal(await page.locator('.score').innerText(),'37 / 37','Valid alternative gets full credit');
      await reset();
      await complete(solution,true);
      await page.locator('#submit').focus();
      await page.keyboard.press('Enter');
      await verifyScore(37,solution);
      // Lesson navigation, actual photos, and keyboard tab behavior.
      await page.locator('#activity-tab').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#lesson').isVisible(),true);
      await page.keyboard.press('Home');
      assert.equal(await page.locator('#activity-tab').evaluate(n=>n===document.activeElement),true);
      assert.equal(await page.locator('#activity').isVisible(),true);
      await page.keyboard.press('End');
      assert.equal(await page.locator('#lesson-tab').evaluate(n=>n===document.activeElement),true);
      assert.equal(await page.locator('#lesson').isVisible(),true);
      await page.locator('.lesson-topic').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
      await page.locator('#lesson img').evaluateAll(images=>images.forEach(i=>i.loading='eager'));
      await page.locator('#lesson img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
      assert.equal(await page.locator('#lesson img').evaluateAll(ns=>ns.every(n=>n.naturalWidth>=350)),true);
      assert.equal(await page.locator('#termination-diagrams [data-pin]').count(),16);
      assert.equal(await page.locator('#lesson-connector-gallery .reference-card').count(),8);
      for(const [id,photo] of Object.entries(M.inspection.photos)) {
        const image=page.locator(`#lesson img[src="${photo.file}"]`).first();
        assert.equal(await image.evaluate(n=>n.naturalWidth),photo.width,id+' local photograph loads at expected resolution');
        assert.ok((await image.locator('xpath=ancestor::figure').innerText()).includes(photo.changes),'Full modification notice accompanies '+id);
        await image.locator('..').click();
        await page.locator('#photo-large').evaluate(n=>n.decode());
        assert.equal(await page.locator('#photo-large').evaluate(n=>n.naturalWidth),photo.width,id+' inspection uses the complete local image');
        assert.ok((await page.locator('#photo-credit').innerText()).includes(photo.changes));
        await page.keyboard.press('Escape');
      }
      for (const href of await page.locator('#lesson a').evaluateAll(ns=>ns.map(n=>n.href).filter(s=>new URL(s).origin===location.origin))) {
        const r=await page.request.get(href); assert.equal(r.status(),200,'Local lesson reference '+href);
      }
      for (const width of [1440,1280,768,375,320]) {
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
      assert.equal(await page.locator('#keep').evaluate(n=>n===document.activeElement),true,'Reset initially focuses the safe action');
      await page.keyboard.press('Escape');
      assert.deepEqual(await stored(),before,'Escape cancels reset without changing the attempt');
      assert.equal(await page.locator('#reset').evaluate(n=>n===document.activeElement),true);
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
      await page.evaluate(([key,answers])=>localStorage.setItem(key,JSON.stringify({version:1,answers,room:'r201',submitted:true})),[M.KEY,installationSolution]);
      await page.reload();
      assert.deepEqual((await stored()).answers,installationSolution,'Legacy browser attempt keeps all original answers');
      assert.equal((await stored()).version,2);
      assert.equal(await page.locator('#results').isHidden(),true);
      assert.match(await page.locator('#status').innerText(),/saved installation answers have been kept/);
      assert.equal(await page.locator('[data-answer=m-u]').inputValue(),'');
      for(const raw of [{version:2,answers:{b1:'om3',b2:'bad',extra:'mdf'},room:'missing'}, {version:2,answers:null,submitted:true}, {version:1,answers:{r101:'invalid',unknown:'mdf'},submitted:true}, {version:99,answers:solution,submitted:true}]) {
        await page.evaluate(([key,raw])=>localStorage.setItem(key,JSON.stringify(raw)),[M.KEY,raw]);
        await page.reload();
        const expected=M.sanitize(raw);
        assert.deepEqual(await stored(),expected,'Malformed v2 values are filtered safely');
        if(expected.submitted) assert.equal(await page.locator('.score').innerText(),'0 / 37');
        else assert.equal(await page.locator('#results').isHidden(),true);
        if(!Object.keys(expected.answers).length) assert.doesNotMatch(await page.locator('#status').innerText(),/answers have been kept/,'No migration notice claims invalid answers were retained');
      }
      // Confirm the existing certification/listing entries lead to one overview.
      for(const route of ['certifications/comptia/network-plus/','practice/pbqs/network-plus/']) {
        await page.goto(base+route);
        const link=page.locator('.hub-page a').filter({hasText:'Network Cabling & Physical Installation PBQ'});
        assert.equal(await link.count(),1,'One direct activity entry in '+route);
        await link.click();
        await page.waitForURL(base+'practice/pbqs/network-plus/physical-cabling-installation/');
        const launch=page.getByRole('link',{name:'Launch Network Cabling & Physical Installation PBQ',exact:true});
        assert.equal(await launch.getAttribute('href'),'https://thearchitechnique.github.io/it-cyber-student-hub/'+appPath,'Overview preserves the canonical GitHub Pages launch used by Hub/GitBook content');
      }
      await page.goto(base+'practice/pbqs/');
      await page.locator('[data-pbq-id]').first().waitFor();
      await page.locator('#pbq-keyword').fill('termination tests');
      assert.equal(await page.locator('[data-pbq-id]').count(),1,'Current metadata is discoverable');
      assert.equal(await page.locator('[data-pbq-id]').getAttribute('data-pbq-id'),'network-plus-physical-cabling-installation');
      await page.locator('[data-pbq-id] .pbq-library-launch').click();
      await page.waitForURL(base+appPath);
      await page.locator('[data-pbq-nav=certification]').click();
      await page.waitForURL(base+'practice/pbqs/network-plus/');
      const search=await (await page.request.get(base+'search/search_index.json')).json();
      assert.equal(search.docs.filter(d=>d.location==='practice/pbqs/network-plus/physical-cabling-installation/').length,1,'The overview is indexed once');
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
    const touchContext = await browser.newContext({viewport:{width:375,height:844},hasTouch:true,isMobile:engine==='chromium'});
    const touch = await touchContext.newPage();
    touch.on('pageerror',err=>errors.push(err.message));
    await touch.goto(origin+prefix+'/'+appPath);
    await touch.locator('[data-kind=role][data-item=mdf]').tap();
    await touch.locator('[data-room=r101]').tap();
    assert.equal(await touch.locator('[data-answer=r101]').inputValue(),'mdf');
    await touch.locator('[data-kind=media][data-item=cat6]').tap();
    await touch.locator('#job-h1 [data-target=h1]').tap();
    assert.equal(await touch.locator('[data-answer=h1]').inputValue(),'cat6');
    await touch.locator('#connector-tray [data-item=lc]').tap();
    await touch.locator('#job-j-b .answer-target').tap();
    assert.equal(await touch.locator('[data-answer=j-b]').inputValue(),'lc');
    await touch.locator('#job-j-b .inspect-photo').tap();
    assert.equal(await touch.locator('#photo-inspector').evaluate(n=>n.open),true);
    await touch.locator('#close-photo').tap();
    await touchContext.close();
    const blockedContext = await browser.newContext();
    await blockedContext.addInitScript(()=>{Storage.prototype.getItem=function(){throw new Error('Storage blocked');};Storage.prototype.setItem=function(){throw new Error('Storage blocked');};});
    const blocked = await blockedContext.newPage();
    blocked.on('pageerror',err=>errors.push(err.message));
    await blocked.goto(origin+prefix+'/'+appPath);
    assert.match(await blocked.locator('#save-status').innerText(),/cannot be saved/);
    await blocked.locator('[data-answer=r101]').selectOption('mdf');
    await blocked.locator('#submit').click();
    assert.equal(await blocked.locator('.score').innerText(),'1 / 37');
    await blockedContext.close();
    assert.deepEqual(errors,[],'No browser runtime errors');
    await context.close();
    console.log(`PASS ${engine} ${browser.version()}: complete 37-decision work orders by keyboard and matching; all-wrong, partial, mixed, and alternate scoring; section totals; reusable/replacement/wrong-family drops; dialog focus; legacy/v2/malformed/blocked storage; touch; images/diagrams; 320–1440 px layouts; and Hub links.`);
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if (process.argv.includes('--browser')) browserTests().catch(error=>{console.error(error);process.exitCode=1;});
