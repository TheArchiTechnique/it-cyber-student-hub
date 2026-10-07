/* Run model checks: node tests/power-protection.cjs
   Run built-site checks: PBQ_PLAYWRIGHT=/path/to/playwright node tests/power-protection.cjs --local */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=path.resolve(__dirname,'../docs/practice/pbqs/a-plus-core-1/power-protection/app'),M=require(path.join(app,'model.js'));
const variants=[...M.types.filter(t=>t!=='troubleshooting').map(type=>({type})),...Object.keys(M.faults).map(fault=>({type:'troubleshooting',fault}))];
function solve(state,poe=false){state.input='wall';for(const d of state.scenario.devices)M.connect(state,d.id,poe&&d.poe?'poe':state.scenario.essential.includes(d.id)?'battery':d.protected?'strip':'wall');if(state.scenario.fault==='battery')state.batteryReplaced=true;if(state.scenario.fault==='runtime')state.upsId='standard';state.diagnosis=state.scenario.fault;return state;}
for(const v of variants)for(let seed=0;seed<200;seed++){
 const s=M.scenario(v.type,seed,v.fault),state=M.initial(s),before=JSON.stringify(state),start=M.simulate(state);
 assert.equal(start.outcome,false,'starting case must need work');assert.ok(M.grade(state).score<100);assert.equal(JSON.stringify(state),before,'inspection and simulation must be read-only');
 for(const d of s.devices){assert.ok(d.w>0&&d.va>=d.w);assert.ok(M.allowed(d).includes('battery'));if(d.noUPS)assert.ok(d.w>=650);}
 assert.deepEqual(M.initial(s).connections,s.start);assert.deepEqual(M.restore(state),state);
 if(v.type==='troubleshooting'){
  const m=M.metrics(state);
  if(v.fault==='outlet'){assert.equal(m.healthy,true);assert.equal(m.batteryOver,false);assert.ok(m.runtime>=s.minutes);assert.equal(start.devices.find(d=>d.id==='monitor').on,false);assert.equal(start.devices.find(d=>d.id==='pc').on,true);}
  if(v.fault==='battery'){assert.equal(m.healthy,false);assert.equal(m.batteryOver,false);assert.equal(m.runtime,0);assert.ok(start.devices.every(d=>!d.on));const wrong=solve(M.initial(s));wrong.batteryReplaced=false;assert.equal(M.simulate(wrong).outcome,false);assert.ok(M.grade(wrong).score<100);}
  if(v.fault==='overload'){assert.equal(m.healthy,true);assert.equal(m.batteryOver,true);assert.ok(m.battery.w<=m.model.watts,'VA-only overload case');assert.ok(m.battery.va>m.model.va);assert.ok(start.devices.every(d=>!d.on));}
  if(v.fault==='runtime'){assert.equal(m.healthy,true);assert.equal(m.batteryOver,false);assert.ok(m.runtime<s.minutes);assert.ok(start.services.every(x=>x.initial));const wrong=M.initial(s);wrong.batteryReplaced=true;assert.equal(M.simulate(wrong).outcome,false,'healthy battery replacement cannot solve undersizing');}
 }
 solve(state,seed%2===0);assert.equal(M.grade(state).score,100);assert.equal(M.grade(state).complete,true);assert.equal(M.simulate(state).outcome,true);
 assert.equal(M.grade({...state,tested:false}).score,100,'test clicks not scored');
 state.tested=true;state.submitted=true;assert.deepEqual(M.restore(state),state);
 if(v.type==='troubleshooting'){state.diagnosis=Object.keys(M.faults).find(f=>f!==v.fault);assert.equal(M.grade(state).score,85);state.diagnosis=v.fault;}
 const critical=s.essential.find(id=>!s.devices.find(d=>d.id===id).poe);M.connect(state,critical,'surge');assert.equal(M.simulate(state).outcome,false);assert.ok(M.grade(state).score<100);assert.equal(M.simulate(state).devices.find(d=>d.id===critical).on,false);M.connect(state,critical,'wall');assert.ok(M.grade(state).score<100);
 assert.deepEqual(M.initial(state.scenario),M.initial(s),'reset restores original fault');
 const chain=solve(M.initial(s));chain.input='strip';assert.ok(M.grade(chain).score<100,'unsafe input fails even when equipment runs');
 const printer=s.devices.find(d=>d.noUPS);if(printer){const p=solve(M.initial(s));M.connect(p,printer.id,'surge');assert.ok(M.metrics(p).unsupported.includes(printer.id));assert.ok(M.grade(p).score<100);M.connect(p,printer.id,'battery');assert.ok(M.metrics(p).batteryOver);assert.equal(M.simulate(p).outcome,false);}
}
// PoE loads are counted once in UPS load, at the powered switch.
const net=solve(M.initial(M.scenario('network',0)),true),netM=M.metrics(net);
assert.equal(netM.battery.w,12+15+24+12+7);assert.equal(netM.battery.count,3);assert.equal(netM.poeW,19);
M.connect(net,'switch','surge');assert.equal(M.simulate(net).devices.find(d=>d.id==='phone').on,false);assert.equal(M.simulate(net).outcome,false);
const optional=solve(M.initial(M.scenario('network',1)));assert.equal(M.simulate(optional).outcome,true);assert.equal(M.simulate(optional).services.find(x=>x.optional).available,false);
// Runtime bands do not interpolate or pretend to be a universal energy formula.
const band=M.initial(M.scenario('workstation',0));band.input='wall';M.connect(band,'pc','battery');assert.equal(M.metrics(band).runtime,30);M.connect(band,'monitor','battery');M.connect(band,'disk','battery');assert.equal(M.metrics(band).runtime,18);
const over=solve(M.initial(M.scenario('capacity',0)));for(const d of over.scenario.devices)M.connect(over,d.id,'battery');assert.ok(M.metrics(over).batteryOver);assert.equal(M.metrics(over).runtime,0);
for(const raw of [null,{},[],{version:99},{version:1,scenario:{type:'invalid'}}])assert.ok(M.types.includes(M.restore(raw).scenario.type));
const corrupt=solve(M.initial(M.scenario('troubleshooting',11,'battery')));corrupt.scenario.work='<script>';corrupt.connections.pc='<img onerror=x>';corrupt.upsId='evil';corrupt.diagnosis='evil';const clean=M.restore(corrupt);assert.doesNotMatch(clean.scenario.work,/<script>/);assert.equal(clean.connections.pc,'battery');assert.equal(clean.upsId,'standard');assert.equal(clean.diagnosis,'');
let previous=null;const seen=new Set();for(let i=0;i<100;i++){const next=M.fresh(previous);assert.notEqual(next.scenario.type,previous?.type);seen.add(next.scenario.type);previous=next.scenario;}assert.equal(seen.size,4);
console.log('PASS model: 1,400 generated cases, four scenario types, four isolated faults, valid solutions, alternate protection and PoE, W/VA overload, runtime bands, partial/full scoring, actual remediation, reset, randomization, and persistence recovery.');
async function browser(url){
 const {chromium}=require(process.env.PBQ_PLAYWRIGHT||'playwright'),b=await chromium.launch({headless:true,...(process.env.PBQ_BROWSER_EXECUTABLE?{executablePath:process.env.PBQ_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']}:{} )});
 try{
  const ctx=await b.newContext({viewport:{width:1440,height:1000},hasTouch:true,reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[],failed=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});await p.goto(url);
  const stored=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.KEY);
  async function load(v,seed=8){const state=M.initial(M.scenario(v.type,seed,v.fault));await p.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:M.KEY,state});await p.reload();return state;}
  async function confirm(id){await p.locator(id).click();await p.locator('#confirm-action').click();}
  async function configure(s,poe=false){await p.selectOption('#ups-input','wall');for(const d of s.scenario.devices)await p.selectOption('#source-'+d.id,poe&&d.poe?'poe':s.scenario.essential.includes(d.id)?'battery':d.protected?'strip':'wall');if(s.scenario.fault==='battery')await confirm('#replace-battery');if(s.scenario.fault==='runtime')await p.selectOption('#ups-model','standard');if(s.scenario.fault)await p.selectOption('#diagnosis',s.scenario.fault);}
  assert.equal(await p.locator('[data-pbq-nav]').count(),3);
  for(const href of await p.locator('[data-pbq-nav]').evaluateAll(es=>es.map(e=>e.href)))assert.equal((await p.request.get(href)).status(),200);
  for(const v of variants){
   const s=await load(v);assert.equal(await p.locator('#work-order').innerText(),s.scenario.work);assert.equal(await p.locator('.equipment-card').count(),s.scenario.devices.length);
   await p.locator('[data-inspect]').first().click();assert.match(await p.locator('#inspect-body').innerText(),/Specified draw/);await p.keyboard.press('Escape');assert.equal(await p.locator('[data-inspect]').first().evaluate(e=>document.activeElement===e),true);
   await p.locator('#inspect-ups').click();assert.equal(await p.locator('#inspect-body table').count(),3);await p.locator('#close-inspect').click();
   await p.locator('#test-power').click();assert.equal((await stored()).submitted,false);assert.equal(await p.locator('#results').isVisible(),false);assert.match(await p.locator('#outage').innerText(),/does not meet/);
   if(v.fault==='battery')assert.match(await p.locator('#outage').innerText(),/self-test failed/);if(v.fault==='overload')assert.match(await p.locator('#outage').innerText(),/Overload/);if(v.fault==='runtime')assert.match(await p.locator('#outage').innerText(),/stops before/);
   await p.locator('#submit').click();assert.notEqual(await p.locator('.score').innerText(),'100 / 100');await p.locator('#retry').click();
   await configure(s,true);assert.equal(await p.locator('#outage').isVisible(),false);await p.locator('#test-power').click();assert.match(await p.locator('#outage').innerText(),/Required services remain available/);assert.equal((await stored()).submitted,false);
   await p.locator('#submit').click();assert.equal(await p.locator('.score').innerText(),'100 / 100');
   const progress=await stored();await p.reload();assert.deepEqual(await stored(),progress);assert.equal(await p.locator('.score').innerText(),'100 / 100');assert.equal(await p.locator('#outage').isVisible(),true);
   await p.locator('#reset').click();await p.keyboard.press('Escape');assert.deepEqual(await stored(),progress);assert.equal(await p.locator('#reset').evaluate(e=>document.activeElement===e),true);
   await confirm('#reset');assert.deepEqual(await stored(),M.initial(s.scenario));assert.equal(await p.locator('#results').isVisible(),false);
   await confirm('#new-scenario');assert.notEqual((await stored()).scenario.type,v.type);assert.equal((await stored()).diagnosis,'');
  }
  // Manual shutdown must include the monitor; network must include the ONT and PoE switch.
  let s=await load({type:'workstation'});await configure(s);await p.selectOption('#source-monitor','surge');await p.locator('#test-power').click();assert.match(await p.locator('[data-device="pc"] .device-state').innerText(),/On battery/);assert.match(await p.locator('[data-device="monitor"] .device-state').innerText(),/Off/);assert.match(await p.locator('#outage').innerText(),/Unavailable when utility/);
  s=await load({type:'network'});await configure(s,true);await p.selectOption('#source-ont','surge');await p.locator('#test-power').click();assert.match(await p.locator('[data-device="router"] .device-state').innerText(),/On battery/);assert.match(await p.locator('[data-device="ont"] .device-state').innerText(),/Off/);assert.match(await p.locator('#outage').innerText(),/Wired WAN path/);
  s=await load({type:'troubleshooting',fault:'battery'});await p.selectOption('#source-monitor','surge');await p.selectOption('#source-monitor','battery');await p.locator('#test-power').click();assert.match(await p.locator('#outage').innerText(),/self-test failed/);assert.equal((await stored()).batteryReplaced,false);
  s=await load({type:'workstation'});await configure(s);await p.locator('#test-power').click();await p.locator('#restore-power').click();assert.equal(await p.locator('#outage').isVisible(),false);
  // Native selects and tabs are operable by keyboard; touch uses the same controls.
  await p.selectOption('#ups-input','');await p.locator('#ups-input').focus();await p.keyboard.press('Home');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');assert.equal((await stored()).input,'wall');
  await p.locator('#activity-tab').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#lesson').isVisible(),true);assert.equal(await p.locator('#lesson-tab').evaluate(e=>document.activeElement===e),true);await p.keyboard.press('ArrowLeft');assert.equal(await p.locator('#activity').isVisible(),true);
  for(let i=0;i<4;i++){await p.locator('#lesson-tab').click();await p.locator(`[data-check="${i}"]`).first().click();assert.ok((await p.locator('#check-feedback-'+i).innerText()).length>30);}assert.equal(await p.locator('.lesson-card').count(),6);await p.locator('#activity-tab').click();
  for(const width of [1440,1024,768,390,320]){
   await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow at '+width);
   for(const id of ['source-pc','source-monitor','ups-model','ups-input','replace-battery','test-power','reset','new-scenario','submit']){const el=p.locator('#'+id);await el.scrollIntoViewIfNeeded();assert.equal(await el.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,id+' covered at '+width);}
   await p.locator('#lesson-tab').click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.locator('#activity-tab').click();
  }
  await p.setViewportSize({width:390,height:844});await p.locator('[data-inspect="pc"]').tap();assert.equal(await p.locator('#inspect').isVisible(),true);await p.locator('#close-inspect').tap();await p.locator('#test-power').tap();assert.equal(await p.locator('#outage').isVisible(),true);await p.locator('#restore-power').tap();
  await p.locator('#lesson-tab').tap();await p.locator('[data-check="0"][data-choice="1"]').tap();assert.match(await p.locator('#check-feedback-0').innerText(),/Correct/);await p.locator('#activity-tab').tap();
  // Follow actual generated Hub navigation and verify the launch URL twice.
  for(let i=0;i<2;i++){await p.locator('[data-pbq-nav="certification"]').click();await p.locator('.md-content').getByRole('link',{name:'Power Protection & UPS',exact:true}).click();const launch=p.getByRole('link',{name:'Launch Power Protection & UPS PBQ',exact:true}).first();const href=await launch.getAttribute('href');assert.match(href,/power-protection\/app\/$/);await p.goto(new URL(new URL(href,p.url()).pathname,new URL(url).origin).href);assert.equal(await p.locator('.equipment-card').count(),s.scenario.devices.length);}
  await p.evaluate(key=>localStorage.setItem(key,'{broken'),M.KEY);await p.reload();assert.ok(await p.locator('.equipment-card').count()>=4);
  const denied=await ctx.newPage();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});await denied.goto(url);assert.match(await denied.locator('#save-status').innerText(),/unavailable/);await denied.locator('#test-power').click();assert.equal(await denied.locator('#outage').isVisible(),true);await denied.close();
  if(process.env.PBQ_SCREENSHOT_DIR){fs.mkdirSync(process.env.PBQ_SCREENSHOT_DIR,{recursive:true});await load({type:'network'},8);await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:path.join(process.env.PBQ_SCREENSHOT_DIR,'power-desktop.png'),fullPage:true});await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(process.env.PBQ_SCREENSHOT_DIR,'power-mobile.png'),fullPage:true});await p.locator('#lesson-tab').click();await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:path.join(process.env.PBQ_SCREENSHOT_DIR,'power-lesson.png'),fullPage:true});}
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS browser: all scenario types and faults, inspect/connect/test/revise/submit, accurate dependencies, battery repair, reset/cancel/new, persistence, keyboard/touch, lesson checks, Hub launch/back, blocked storage, and unobstructed 320–1440px layouts.');
 }finally{await b.close();}
}
if(process.argv[2]==='--local'){
 const http=require('node:http'),root=path.resolve(__dirname,'../site'),server=http.createServer((req,res)=>{let target=decodeURIComponent(req.url.split('?')[0]).replace(/^\/it-cyber-student-hub/,'');if(target.endsWith('/'))target+='index.html';const f=path.resolve(root,'.'+target);if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(data);});});
 server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}/it-cyber-student-hub/practice/pbqs/a-plus-core-1/power-protection/app/`).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close()));
}else if(process.argv[2])browser(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1;});
