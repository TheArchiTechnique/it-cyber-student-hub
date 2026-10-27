// Model checks: node tests/helpdesk-ticket-triage.cjs
// Built-site browser checks: npm run test:helpdesk-ticket-triage
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const M=require('../docs/practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/app/model.js');
// Reviewed independently from the runtime rubric: active harm, stopped operations,
// blocked near deadline, three-user workaround, single-user workaround, usability.
const reviewedOrder=['HD-7352','HD-7329','HD-7318','HD-7341','HD-7335','HD-7346'];
const answers={
 'HD-7352':['ransomware','contain'],'HD-7329':['service-password','service-owner'],
 'HD-7318':['membership','group'],'HD-7341':['dns-server','dns-config'],
 'HD-7335':['dependency','service-start'],'HD-7346':['zoom','zoom-reset']
};
function seeded(seed){seed=Math.imul(seed+1,2654435761)>>>0;return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function review(s,skip){for(const id of s.queue){for(const section of M.sections)M.inspect(s,id,section);for(const a of M.byId(id).attachments)if(a.id!==skip)M.inspectAttachment(s,id,a.id);}return s;}
function solve(order=reviewedOrder,seed=7){const s=review(M.initial(seeded(seed)));for(const id of order){assert.ok(M.begin(s,id));assert.ok(M.answer(s,id,'issue',answers[id][0]));assert.ok(M.answer(s,id,'action',answers[id][1]));assert.ok(M.complete(s,id));}return s;}
const arrangements=new Set(),optionPositions=new Map();
for(let seed=0;seed<200;seed++){
 const s=M.initial(seeded(seed));arrangements.add(s.queue.join());assert.equal(new Set(s.queue).size,6);assert.notDeepEqual(s.queue,reviewedOrder);assert.notDeepEqual(s.queue,reviewedOrder.slice().reverse());assert.equal(M.grade(s).score,0);
 for(const t of M.tickets)for(const [field,key]of [['issues',0],['actions',1]]){const name=t.id+field;if(!optionPositions.has(name))optionPositions.set(name,new Set());optionPositions.get(name).add(s.options[t.id][field].indexOf(answers[t.id][key]));}
 const before=s.queue.slice();for(const id of before)M.inspect(s,id,'request');assert.deepEqual(s.sequence,[]);assert.equal(M.begin(s,before[0]),false);assert.equal(M.submit(s),false);
 assert.deepEqual(M.restore(s),s);const full=solve(reviewedOrder,seed);assert.deepEqual(M.restore(full),full);assert.equal(M.grade(full).score,39);assert.ok(M.submit(full));assert.deepEqual(M.restore(full),full);
 const copy=JSON.stringify(full);assert.equal(M.answer(full,reviewedOrder[0],'issue','corruption'),false);assert.equal(M.begin(full,before[0]),false);assert.equal(M.inspect(full,before[0],'notes'),false);assert.equal(M.inspectAttachment(full,'HD-7352','endpoint-log'),false);assert.equal(JSON.stringify(full),copy);
 const fresh=M.initial(seeded(seed),s.queue);assert.notDeepEqual(fresh.queue,s.queue);assert.equal(M.grade(fresh).score,0);assert.equal(fresh.selected,null);assert.deepEqual(fresh.sequence,[]);assert.deepEqual(fresh.completed,[]);assert.ok(Object.values(fresh.inspections).every(i=>!i.opened&&!i.sections.length&&!i.attachments.length));
}
assert.ok(arrangements.size>100);for(const set of optionPositions.values())assert.equal(set.size,4);
const incomplete=review(M.initial(),'endpoint-log');assert.equal(M.allReviewed(incomplete),false);assert.equal(M.begin(incomplete,'HD-7352'),false);M.inspectAttachment(incomplete,'HD-7352','endpoint-log');assert.equal(M.allReviewed(incomplete),true);
assert.equal(M.answer(incomplete,'HD-7352','issue','ransomware'),false);assert.equal(M.begin(incomplete,'invalid'),false);assert.ok(M.begin(incomplete,'HD-7318'));assert.equal(M.begin(incomplete,'HD-7352'),false);assert.equal(M.complete(incomplete,'HD-7318'),false);assert.equal(M.complete(incomplete,'HD-7352'),false);assert.equal(M.answer(incomplete,'HD-7318','issue','nonexistent'),false);assert.equal(M.answer(incomplete,'HD-7318','__proto__','group'),false);assert.deepEqual(M.restore(incomplete),incomplete);
const reversed=solve(reviewedOrder.slice().reverse());assert.equal(M.grade(reversed).priority,0);assert.equal(M.grade(reversed).score,24);
const oneSwap=reviewedOrder.slice();[oneSwap[0],oneSwap[1]]=[oneSwap[1],oneSwap[0]];assert.equal(M.grade(solve(oneSwap)).priority,14);assert.equal(M.grade(solve(oneSwap)).score,38);
let s=solve();M.answer(s,'HD-7352','issue','corruption');assert.equal(M.grade(s).issues,10);assert.equal(M.grade(s).actions,12);assert.equal(M.grade(s).score,37);M.answer(s,'HD-7352','action','restore');assert.equal(M.grade(s).score,35);assert.deepEqual(s.sequence,reviewedOrder);
for(const t of M.tickets)for(const o of t.issues){s=solve();M.answer(s,t.id,'issue',o.id);assert.equal(M.grade(s).issues,o.id===answers[t.id][0]?12:10);assert.equal(M.grade(s).actions,12);}
for(const t of M.tickets)for(const o of t.actions){s=solve();M.answer(s,t.id,'action',o.id);assert.equal(M.grade(s).actions,o.id===answers[t.id][1]?12:10);assert.equal(M.grade(s).issues,12);}
// Every possible priority sequence is checked against an independent inversion count.
function* permutations(values){if(!values.length){yield [];return;}for(let i=0;i<values.length;i++)for(const rest of permutations(values.filter((_,j)=>j!==i)))yield [values[i],...rest];}
let n=0;for(const order of permutations(reviewedOrder)){const indices=order.map(id=>reviewedOrder.indexOf(id));let inversions=0;for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(indices[i]>indices[j])inversions++;assert.equal(M.grade(solve(order)).priority,15-inversions);n++;}assert.equal(n,720);
for(const invalid of [null,{},[],{version:0},'bad'])assert.equal(M.grade(M.restore(invalid)).score,0);
for(const mutate of [x=>x.sequence.push('bad'),x=>x.sequence.push(x.sequence[0]),x=>x.completed.reverse(),x=>x.active='HD-7346',x=>x.inspections['HD-7352'].attachments=[],x=>x.answers['HD-7318'].issue='bad',x=>x.queue.push('bad')]){const raw=solve();mutate(raw);assert.equal(M.grade(M.restore(raw)).score,0);}
const malicious=M.initial();malicious.inspections['HD-7352']={opened:true,sections:{includes:3},attachments:'endpoint-log'};assert.doesNotThrow(()=>M.restore(malicious));
// Phase 2: independent category totals, every restore milestone, and score injection.
for(const field of ['issue','action']){
 const state=solve();for(const t of M.tickets){const options=field==='issue'?t.issues:t.actions;const wrong=options.find(o=>o.id!==answers[t.id][field==='issue'?0:1]);M.answer(state,t.id,field,wrong.id);}
 assert.equal(M.grade(state).score,27);assert.equal(M.grade(state)[field==='issue'?'issues':'actions'],0);
 state.score=39;state.percentage=100;state.result={score:39};assert.equal(M.grade(M.restore(JSON.parse(JSON.stringify(state)))).score,27,'Saved score fields must not award points');
}
const allWrong=solve(reviewedOrder.slice().reverse());for(const t of M.tickets){M.answer(allWrong,t.id,'issue',t.issues.find(o=>o.id!==answers[t.id][0]).id);M.answer(allWrong,t.id,'action',t.actions.find(o=>o.id!==answers[t.id][1]).id);}assert.equal(M.grade(allWrong).score,0);
assert.equal(M.grade(solve([reviewedOrder[2],reviewedOrder[0],reviewedOrder[1],reviewedOrder[5],reviewedOrder[3],reviewedOrder[4]])).score,35);
const canonical=value=>{const copy=JSON.parse(JSON.stringify(value));for(const i of Object.values(copy.inspections)){i.sections.sort();i.attachments.sort();}return copy;};
const milestone=M.initial(seeded(701)),checkpoint=()=>assert.deepEqual(canonical(M.restore(JSON.parse(JSON.stringify(milestone)))),canonical(milestone));
checkpoint();M.inspect(milestone,milestone.queue[0],'context');checkpoint();review(milestone);checkpoint();
for(const id of reviewedOrder){M.begin(milestone,id);checkpoint();M.answer(milestone,id,'issue',answers[id][0]);checkpoint();M.answer(milestone,id,'action',answers[id][1]);M.complete(milestone,id);checkpoint();}
M.submit(milestone);checkpoint();
// The correct fix must not be identifiable by always taking the longest or shortest.
for(const extreme of [Math.max,Math.min])assert.ok(M.tickets.some(t=>t.actions.find(o=>o.id===answers[t.id][1]).text.length!==extreme(...t.actions.map(o=>o.text.length))));
console.log('PASS model: 200 stable shuffled attempts; all 720 priority sequences; 48 diagnosis/action choices; gated review, serialized processing, independent partial credit, immutable submission, fresh attempts, and validated restore.');

async function browser(base){
 const {chromium}=require('playwright');const b=await chromium.launch({headless:true,executablePath:process.env.PBQ_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const route='/practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/app/';
 try{
 for(const prefix of ['','/it-cyber-student-hub']){
  const ctx=await b.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),errors=[],missing=[];
  ctx.on('page',newPage=>newPage.close());p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push(r.url());});
  await p.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const url=base+prefix+route,storage=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.KEY),click=id=>p.locator('#'+id).click();
  const open=id=>p.locator(`[data-ticket="${id}"]`).click();
  const checkNoOverflow=async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
  async function inspectAll(){
   for(const id of (await storage()).queue){await open(id);for(const section of M.sections)await p.locator(`[data-section="${section}"]`).click();for(const a of M.byId(id).attachments){await p.locator(`[data-attachment="${a.id}"]`).click();assert.equal(await p.locator('#evidence').isVisible(),true);assert.ok((await p.locator('#evidence-content').innerText()).length>80);if(a.kind==='image')await p.waitForFunction(()=>{const n=document.querySelector('#evidence-content img');return n?.complete&&n.naturalWidth>0;});if(a.kind==='image')assert.equal(await p.locator('#evidence-content img').evaluate(n=>n.complete&&n.naturalWidth>0),true);await click('close-evidence');await p.waitForFunction(id=>document.activeElement?.dataset.attachment===id,a.id);assert.equal(await p.locator(`[data-attachment="${a.id}"]`).evaluate(n=>document.activeElement===n),true);}}
  }
  async function processQueue(order=reviewedOrder,wrong=false){for(const id of order){await open(id);await click('begin');await p.locator('#issue').selectOption(wrong&&id==='HD-7352'?'corruption':answers[id][0]);await p.locator('#action').selectOption(answers[id][1]);await click('complete');}}
  async function fresh(trigger='reset'){await click(trigger);await click('confirm-action');}
  await p.goto(url);assert.equal(await p.locator('[data-ticket]').count(),6);assert.deepEqual(await p.locator('#overview .metric strong').allTextContents(),['6','6','0','0']);assert.equal(await p.locator('#ticket-empty').isVisible(),true);await click('submit');assert.match(await p.locator('#notice').innerText(),/Inspect every ticket/);assert.equal(await p.locator('#results').innerHTML(),'');
  const initial=await storage();await p.reload();assert.deepEqual(await storage(),initial);await open('HD-7318');assert.equal(await p.locator('#begin').isDisabled(),true);assert.equal(await p.locator('#issue').isDisabled(),true);assert.equal(await p.locator('[data-attachment]').count(),0);const inspected=await storage();await p.reload();assert.deepEqual(await storage(),inspected);
  await p.locator('[data-section=request]').focus();await p.keyboard.press('End');assert.equal((await storage()).section,'notes');assert.equal(await p.locator('[data-section=notes]').evaluate(n=>document.activeElement===n),true);
  await inspectAll();assert.deepEqual((await storage()).sequence,[]);assert.match(await p.locator('#review-progress').innerText(),/Tickets reviewed: 6 of 6/);assert.equal(await p.locator('#results').innerHTML(),'');
  const textBefore=await p.locator('#activity').innerText();for(const item of M.grade(solve()).details){assert.equal(textBefore.includes(item.priority),false);assert.equal(textBefore.includes(item.fix),false);}
  await p.reload();assert.deepEqual((await storage()).queue,initial.queue);assert.equal(M.allReviewed(await storage()),true);assert.deepEqual((await storage()).sequence,[]);
  await open('HD-7352');await click('begin');assert.deepEqual((await storage()).sequence,['HD-7352']);assert.deepEqual(await p.locator('#overview .metric strong').allTextContents(),['6','0','1','0']);const beforeFilters=await storage();for(const [name,count]of [['active',1],['review',0],['completed',0],['all',6]]){await p.locator(`[data-filter="${name}"]`).click();assert.equal(await p.locator('[data-ticket]').count(),count);}assert.deepEqual(await storage(),beforeFilters);await click('complete');assert.match(await p.locator('#notice').innerText(),/Choose both/);await open('HD-7329');assert.equal(await p.locator('#begin').isDisabled(),true);await open('HD-7352');await p.locator('#issue').selectOption('ransomware');await p.locator('#action').selectOption('contain');await p.reload();assert.equal((await storage()).active,'HD-7352');assert.equal(await p.locator('#issue').inputValue(),'ransomware');await click('complete');
  for(const id of reviewedOrder.slice(1)){await open(id);await click('begin');await p.locator('#issue').selectOption(answers[id][0]);await p.locator('#action').selectOption(answers[id][1]);await click('complete');if(id===reviewedOrder[2]){const partial=await storage();await p.reload();assert.deepEqual(await storage(),partial);}}
  assert.deepEqual(await p.locator('#overview .metric strong').allTextContents(),['0','0','0','6']);const finished=await storage();await p.reload();assert.deepEqual(await storage(),finished);
  await open('HD-7352');await p.locator('#issue').selectOption('corruption');await p.locator('#issue').selectOption('ransomware');assert.deepEqual((await storage()).sequence,reviewedOrder);
  await p.locator('[data-filter=completed]').click();assert.equal(await p.locator('[data-ticket]').count(),6);await p.locator('[data-filter=review]').click();assert.equal(await p.locator('[data-ticket]').count(),0);await p.locator('[data-filter=all]').click();await click('submit');
  assert.match(await p.locator('#results').innerText(),/39 \/ 39 points · 100%/);assert.equal(await p.locator('[data-review]').count(),6);assert.equal(await p.locator('#issue').isDisabled(),true);
  for(const item of M.grade(solve()).details){const text=await p.locator(`[data-review="${item.id}"]`).innerText();for(const field of ['priority','evidence','fix'])assert.ok(text.includes(item[field]));}
  await p.reload();assert.equal(await p.locator('#results').isVisible(),true);await click('retry');await p.keyboard.press('Escape');assert.equal(await p.locator('#results').isVisible(),true);const old=await storage();await fresh('retry');const next=await storage();assert.notDeepEqual(next.queue,old.queue);assert.equal(M.grade(next).score,0);assert.equal(await p.locator('#results').innerHTML(),'');assert.equal(await p.locator('#ticket-empty').isVisible(),true);
  await inspectAll();await processQueue([reviewedOrder[1],reviewedOrder[0],...reviewedOrder.slice(2)],true);await click('submit');assert.match(await p.locator('#results').innerText(),/36 \/ 39 points/);assert.match(await p.locator('#results').innerText(),/Priority relationships: 14\/15/);assert.match(await p.locator('[data-review="HD-7352"]').innerText(),/Most Likely Issue · 0\/2/);assert.match(await p.locator('[data-review="HD-7352"]').innerText(),/Best Corrective Action · 2\/2/);
  await fresh();await open((await storage()).queue[0]);await click('reset');await click('keep');assert.equal(await p.locator('#confirm').isVisible(),false);assert.equal(await p.locator('#reset').evaluate(n=>document.activeElement===n),true);
  // Reproduce the asynchronous close-event focus race seen in Phase 1 CI.
  // A close event must not steal focus after the user has moved to another control.
  for(const trigger of ['keep','escape']){
   await click('reset');await p.evaluate(async trigger=>{const dialog=document.getElementById('confirm'),closed=new Promise(resolve=>dialog.addEventListener('close',resolve,{once:true}));if(trigger==='keep')document.getElementById('keep').click();else{dialog.dispatchEvent(new Event('cancel',{cancelable:true}));dialog.close();}document.getElementById('activity-tab').focus();await closed;},trigger);
   assert.equal(await p.locator('#activity-tab').evaluate(n=>document.activeElement===n),true);await p.keyboard.press('End');assert.equal(await p.locator('#lesson').isVisible(),true);await p.keyboard.press('Home');
  }
  await p.locator('#activity-tab').focus();await p.keyboard.press('End');assert.equal(await p.locator('#lesson').isVisible(),true);for(const href of await p.locator('#lesson a').evaluateAll(a=>a.map(x=>x.href).filter(x=>x.startsWith(location.origin)))){const r=await p.request.get(href);assert.equal(r.status(),200,href);if(new URL(href).hash){const html=await r.text();assert.ok(html.includes('id="'+new URL(href).hash.slice(1)+'"'),href);}}
  await p.keyboard.press('Home');assert.equal(await p.locator('#activity').isVisible(),true);
  for(const href of await p.locator('[data-pbq-nav]').evaluateAll(a=>a.map(x=>x.href)))assert.equal((await p.request.get(href)).status(),200);
  // Every ticket, all capture types, lesson and long results at four widths.
  for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:900});for(const t of M.tickets){await open(t.id);for(const section of M.sections){await p.locator(`[data-section="${section}"]`).click();assert.ok((await p.locator('#section-panel').innerText()).includes(t.sections[section]));await checkNoOverflow();}for(const a of t.attachments){await p.locator(`[data-attachment="${a.id}"]`).click();await checkNoOverflow();if(a.kind==='image'){const fitted=await p.locator('#evidence-content img').evaluate(n=>n.getBoundingClientRect().width);await click('zoom-image');assert.equal(await p.locator('#zoom-image').getAttribute('aria-pressed'),'true');assert.ok(await p.locator('#evidence-content img').evaluate((n,fitted)=>n.getBoundingClientRect().width>fitted,fitted),'Magnification must increase image size');assert.equal(await p.locator('.capture-scroll').evaluate(n=>n.scrollWidth>n.clientWidth),true);await checkNoOverflow();await click('zoom-image');assert.ok(await p.locator('#evidence-content img').evaluate((n,fitted)=>Math.abs(n.getBoundingClientRect().width-fitted)<1,fitted));}for(const key of ['Tab','Tab','Tab','Tab','Shift+Tab']){await p.keyboard.press(key);assert.equal(await p.locator('#evidence').evaluate(n=>n.contains(document.activeElement)),true);}await p.keyboard.press('Escape');assert.equal(await p.locator('#evidence').isVisible(),false);}}
   await click('lesson-tab');await checkNoOverflow();await click('activity-tab');
   const snapshot=await storage(),graded=solve();graded.submitted=true;
   await p.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:M.KEY,state:graded});await p.reload();assert.match(await p.locator('#results').innerText(),/39 \/ 39 points/);await checkNoOverflow();
   if(process.env.PBQ_QA_SCREENSHOT_DIR){fs.mkdirSync(process.env.PBQ_QA_SCREENSHOT_DIR,{recursive:true});await p.locator('#results').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,`results-${width}.png`)});}
   await p.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:M.KEY,state:snapshot});await p.reload();
  }
  if(process.env.PBQ_QA_SCREENSHOT_DIR){fs.mkdirSync(process.env.PBQ_QA_SCREENSHOT_DIR,{recursive:true});await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,'helpdesk-desktop.png'),fullPage:true});await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,'helpdesk-mobile.png'),fullPage:true});}
  for(const raw of ['{broken',JSON.stringify({version:100}),JSON.stringify({...solve(),sequence:['HD-7352','HD-7352']})]){await p.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:M.KEY,raw});await p.reload();assert.equal(M.grade(await storage()).score,0);assert.equal(await p.locator('#results').innerHTML(),'');}
  // Reverse order plus correct fixes/incorrect diagnoses; then the inverse categories.
  await fresh();await inspectAll();await processQueue(reviewedOrder.slice().reverse(),true);
  for(const id of reviewedOrder){await open(id);const wrong=M.byId(id).issues.find(o=>o.id!==answers[id][0]);await p.locator('#issue').selectOption(wrong.id);}
  await click('submit');assert.match(await p.locator('#results').innerText(),/12 \/ 39 points/);assert.match(await p.locator('#results').innerText(),/Priority relationships: 0\/15/);
  await fresh();await inspectAll();await processQueue();for(const id of reviewedOrder){await open(id);const wrong=M.byId(id).actions.find(o=>o.id!==answers[id][1]);await p.locator('#action').selectOption(wrong.id);}await click('submit');assert.match(await p.locator('#results').innerText(),/27 \/ 39 points/);
  await p.setViewportSize({width:1440,height:1000});await p.goto(base+prefix+'/practice/pbqs/');await p.locator('#pbq-topic').selectOption('help-desk-operations');assert.equal(await p.locator('[data-pbq-id="helpdesk-ticket-triage"]').count(),1);await p.locator('[data-pbq-id="helpdesk-ticket-triage"] .pbq-library-launch').click();assert.ok(p.url().endsWith(route));
  await p.goto(base+prefix+'/certifications/comptia/a-plus-core-2/');await p.locator('.hub-page a').filter({hasText:'Help Desk Ticket Triage & Resolution PBQ'}).click();assert.ok(p.url().endsWith('/helpdesk-ticket-triage/'));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await ctx.close();
 }
 const denied=await b.newContext(),p=await denied.newPage();await p.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});await p.goto(base+route);assert.match(await p.locator('#save-status').innerText(),/unavailable/);await p.locator('[data-ticket]').first().click();assert.equal(await p.locator('#ticket-content').isVisible(),true);await denied.close();
 const nojs=await b.newContext({javaScriptEnabled:false}),plain=await nojs.newPage();await plain.goto(base+route);assert.equal(await plain.locator('#lesson').isVisible(),true);await nojs.close();
 const touch=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobile=await touch.newPage();await mobile.goto(base+route);await mobile.locator('[data-ticket="HD-7352"]').tap();await mobile.locator('[data-attachment="file-capture"]').tap();assert.equal(await mobile.locator('#evidence').isVisible(),true);await mobile.locator('#close-evidence').tap();await mobile.locator('[data-section=notes]').tap();await mobile.locator('#lesson-tab').tap();assert.equal(await mobile.locator('#lesson').isVisible(),true);await touch.close();
 console.log('PASS browser: six tickets and attachments, real-control full/partial scores, review gating, serial processing, edits, reloads, fresh retry/reset, keyboard/modal focus, touch, 320/390/768/1440px, no-JS/storage denial, resource routes, and root/project-subpath Hub discovery.');
 }finally{await b.close();}
}
if(process.argv.includes('--local')){
 const site=path.resolve(__dirname,'../site'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/,'');if(url.endsWith('/'))url+='index.html';const target=path.resolve(site,'.'+decodeURIComponent(url));if(!target.startsWith(site+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);});});
 server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}`).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close()));
}
