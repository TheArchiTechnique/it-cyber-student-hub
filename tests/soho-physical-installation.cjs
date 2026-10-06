/* Run: node tests/soho-physical-installation.cjs
   Optional browser pass: node tests/soho-physical-installation.cjs <built activity URL>
   Browser pass requires Playwright + Chromium; model checks need only Node.
   Optional DOM event pass: PBQ_JSDOM=/path/to/jsdom node tests/soho-physical-installation.cjs */
const assert=require('node:assert/strict');
const path=require('node:path');
const M=require('../docs/practice/pbqs/a-plus-core-1/soho-physical-installation/app/model.js');
const install={cable:{cable:1,router:2},dsl:{dsl:1,router:2},fiber:{ont:1,router:2,switch:3}};
const links={
 cable:[['coax','wall:service','cable:service'],['ethernet','cable:ethernet','router:wan'],['ethernet','router:lan4','pc:net']],
 dsl:[['phone','wall:service','dsl:service'],['ethernet','dsl:ethernet','router:wan'],['ethernet','router:lan3','pc:net'],['ethernet','router:lan1','printer:net']],
 fiber:[['sc','wall:service','ont:service'],['ethernet','ont:ethernet','router:wan'],['ethernet','router:lan2','switch:p5'],['ethernet','switch:p3','pc:net'],['ethernet','switch:p1','printer:net']]
};
const copy=o=>JSON.parse(JSON.stringify(o));
function complete(id,reverse=false){const s={placed:copy(install[id]),connections:[],submitted:false};links[id].forEach(([c,a,b],i)=>assert.equal(M.connect(id,s,c,reverse?b:a,reverse?a:b,'test-'+i),null));return s}
assert.deepEqual(Object.keys(M.scenarios),['cable','dsl','fiber']);
assert.deepEqual(Object.keys(M.tools),['crimper','stripper','punchdown','toner','tester','loopback','wifi','tap']);
assert.equal(M.toolTasks.length,4);
assert.equal(Object.keys(M.toolFunctions).length,8);
const toolState=M.fresh();toolState.tools.answers={rj45:'crimper',rj11:'crimper',idc:'punchdown',strip:'stripper'};let toolGrade=M.gradeTools(toolState);assert.equal(toolGrade.score,4);assert.equal(toolGrade.complete,true);
toolState.tools.answers.rj11='stripper';toolGrade=M.gradeTools(toolState);assert.equal(toolGrade.score,3);assert.equal(toolGrade.complete,false);
toolState.tools.functions=Object.fromEntries(Object.keys(M.tools).map(id=>[id,id]));let functionGrade=M.gradeToolFunctions(toolState);assert.equal(functionGrade.score,8);assert.equal(functionGrade.complete,true);
toolState.tools.functions.toner='tester';functionGrade=M.gradeToolFunctions(toolState);assert.equal(functionGrade.score,7);assert.equal(functionGrade.complete,false);

for(const sid of Object.keys(M.scenarios)){
 for(const reverse of [false,true]){const s=complete(sid,reverse),g=M.grade(sid,s);assert.equal(g.score,g.total);assert.equal(g.complete,true);assert.deepEqual(g.reachable.sort(),M.scenarios[sid].endpoints.slice().sort());assert.equal(s.submitted,false)}
 const s=complete(sid);s.connections[0].cable='ethernet';let g=M.grade(sid,s);assert.equal(g.score,g.total-1);assert.equal(g.complete,false);assert.equal(g.invalid[0].kind,'incorrect');assert.deepEqual(g.reachable.slice().sort(),M.scenarios[sid].endpoints.slice().sort()); // LAN reachability and downstream credit remain valid even when the provider-side link is wrong.
 s.connections.shift();g=M.grade(sid,s);assert.equal(g.score,g.total-1);assert.equal(g.invalid.length,0);
}
for(const fiberCable of ['lc','st']){const s=complete('fiber');s.connections[0].cable=fiberCable;const g=M.grade('fiber',s);assert.equal(g.score,g.total-1)}
for(let n=1;n<=4;n++){const s=complete('cable');s.connections[2].a='router:lan'+n;assert.equal(M.grade('cable',s).complete,true)}
// Equivalent functional LAN topologies must be accepted, not only the authored shortest path.
function buildState(placed,connections){return {placed:copy(placed),connections:connections.map(([c,a,b],i)=>({id:'alt-'+i,cable:c,a,b})),submitted:false}}
const cableViaSwitch=buildState({cable:1,router:2,switch:3},[
 ['coax','wall:service','cable:service'],['ethernet','cable:ethernet','router:wan'],['ethernet','router:lan1','switch:p1'],['ethernet','switch:p2','pc:net']
]);
assert.equal(M.grade('cable',cableViaSwitch).complete,true);
const dslViaSwitch=buildState({dsl:1,router:2,switch:3},[
 ['phone','wall:service','dsl:service'],['ethernet','dsl:ethernet','router:wan'],['ethernet','router:lan1','switch:p1'],['ethernet','switch:p2','pc:net'],['ethernet','switch:p3','printer:net']
]);
assert.equal(M.grade('dsl',dslViaSwitch).complete,true);
const fiberDirect=buildState({ont:1,router:2},[
 ['sc','wall:service','ont:service'],['ethernet','ont:ethernet','router:wan'],['ethernet','router:lan1','pc:net'],['ethernet','router:lan2','printer:net']
]);
assert.equal(M.grade('fiber',fiberDirect).complete,true);
const fiberMixed=buildState({ont:1,router:2,switch:3},[
 ['sc','wall:service','ont:service'],['ethernet','ont:ethernet','router:wan'],['ethernet','router:lan1','pc:net'],['ethernet','router:lan2','switch:p1'],['ethernet','switch:p2','printer:net']
]);
assert.equal(M.grade('fiber',fiberMixed).complete,true);
const looped=buildState({cable:1,router:2,switch:3},[
 ['coax','wall:service','cable:service'],['ethernet','cable:ethernet','router:wan'],['ethernet','router:lan1','switch:p1'],['ethernet','router:lan2','switch:p2'],['ethernet','switch:p3','pc:net']
]);
assert.equal(M.grade('cable',looped).complete,false);
assert.match(M.grade('cable',looped).invalid[0].why,/loop/i);
// All switch ports may serve the uplink; endpoint assignments may be permuted.
for(let n=1;n<=5;n++){const s=complete('fiber'),rest=[1,2,3,4,5].filter(p=>p!==n);s.connections[2].b='switch:p'+n;s.connections[3].a='switch:p'+rest[0];s.connections[4].a='switch:p'+rest[1];assert.equal(M.grade('fiber',s).complete,true)}
const extra=complete('cable');assert.equal(M.connect('cable',extra,'ethernet','router:lan1','router:lan2','extra'),null);let g=M.grade('cable',extra);assert.equal(g.score,3);assert.equal(g.complete,false);assert.equal(g.invalid[0].kind,'extra');
const structure=complete('cable'),before=copy(structure);assert.match(M.connect('cable',structure,'ethernet','pc:net','router:lan2','bad'),/occupied/);assert.deepEqual(structure,before);assert.match(M.connect('cable',structure,'ethernet','router:lan2','router:lan2','bad'),/different/);
// Wrong device, wrong router side, and same-device connections remain constructible but do not earn credit.
const wrong={placed:{dsl:1,router:2},connections:[],submitted:false};assert.equal(M.connect('cable',wrong,'coax','wall:service','dsl:service','wrong'),null);assert.equal(M.grade('cable',wrong).score,0);
const wrongPort=complete('cable');wrongPort.connections[1].b='router:lan1';assert.equal(M.grade('cable',wrongPort).score,2);
// All-or-nothing scoring and position-dependent scoring are forbidden.
const moved=complete('fiber');moved.placed={ont:3,router:1,switch:2};assert.equal(M.grade('fiber',moved).complete,true);
const save=M.fresh();save.active='dsl';save.tools.answers={rj45:'crimper',rj11:'crimper',idc:'punchdown',strip:'stripper'};save.tools.functions=Object.fromEntries(Object.keys(M.tools).map(id=>[id,id]));save.tools.submitted=true;save.tools.functionsSubmitted=true;save.progress.cable=complete('cable');save.progress.cable.submitted=true;save.progress.dsl=complete('dsl');save.progress.fiber=complete('fiber');assert.deepEqual(M.restore(copy(save)),save);
const reset=copy(save);reset.progress.dsl=M.fresh().progress.dsl;assert.deepEqual(M.restore(reset).progress.cable,save.progress.cable);assert.equal(M.restore(reset).progress.dsl.connections.length,0);
for(const bad of [null,{},[],{version:2}, {version:1,active:'__proto__',progress:{cable:{placed:{router:0,cable:99,dsl:1,ont:2},connections:[null,{cable:'__proto__',a:'__proto__',b:'constructor'}]}}}])assert.doesNotThrow(()=>M.restore(bad));
const dirty=copy(save);dirty.progress.cable.connections.push({...dirty.progress.cable.connections[0],id:'duplicate'}, {id:'alien',cable:'ethernet',a:'alien:p',b:'router:lan2'});dirty.progress.cable.placed.switch=2;assert.deepEqual(M.restore(dirty).progress.cable,save.progress.cable);
const unsafe=copy(save);unsafe.progress.cable.connections=[{id:'<script>',cable:'ethernet',a:'__proto__',b:'pc:net'},{id:'bad',cable:'ethernet',a:'constructor',b:'pc:net'}];assert.equal(M.restore(unsafe).progress.cable.connections.length,0);
console.log('PASS model: three scenarios, full/partial credit, missing/wrong/extra links, equivalent ports, reversed endpoints, position independence, structural guards, persistence, reset isolation, and malformed-state recovery.');
async function browser(url){const {chromium}=require(process.env.PBQ_PLAYWRIGHT||'playwright');const b=await chromium.launch({headless:true});try{const page=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);assert.equal(await page.locator('#scenario option').count(),3);assert.equal(await page.locator('[data-pbq-nav]').count(),3);for(const href of await page.locator('[data-pbq-nav]').evaluateAll(es=>es.map(e=>e.href)))assert.equal((await page.request.get(href)).status(),200);
 async function choose(sid){await page.selectOption('#scenario',sid)}
 async function place(id,slot){await page.locator(`[data-device="${id}"]`).click();await page.locator(`[data-slot="${slot}"]`).click()}
 async function link(c,a,b){await page.locator(`[data-cable="${c}"]`).click();await page.locator(`[data-port="${a}"]`).click();await page.locator(`[data-port="${b}"]`).click()}
 for(const sid of Object.keys(links)){await choose(sid);for(const [id,slot] of Object.entries(install[sid]))await place(id,slot);for(const [c,a,b] of links[sid])await link(c,b,a);assert.equal(await page.locator('#results').isVisible(),false);assert.equal(await page.locator('.connection-row.good,.connection-row.bad').count(),0);await page.locator('#submit').click();assert.equal(await page.locator('.score').innerText(),`${M.grade(sid,complete(sid)).total} / ${M.grade(sid,complete(sid)).total}`);assert.match(await page.locator('#results').innerText(),/Installation complete/)}
 await page.reload();assert.equal(await page.locator('#scenario').inputValue(),'fiber');assert.equal(await page.locator('.score').innerText(),'4 / 4');await choose('cable');assert.equal(await page.locator('.score').innerText(),'3 / 3');await page.locator('#retry').click();
 await page.locator('[data-cable="ethernet"]').focus();await page.keyboard.press('Enter');await page.locator('[data-port="router:lan1"]').focus();await page.keyboard.press('Space');await page.keyboard.press('Escape');assert.equal(await page.locator('[data-port="router:lan1"]').getAttribute('aria-pressed'),'false');
 await link('ethernet','router:lan1','router:lan2');await page.locator('#submit').click();assert.match(await page.locator('#results').innerText(),/Extra \/ invalid/);await page.locator('#undo').click();assert.equal(await page.locator('#results').isVisible(),false);assert.equal(await page.locator('.connection-row').count(),3);
 await page.locator('[data-remove]').first().click();await link('ethernet','wall:service','cable:service');await page.locator('#submit').click();assert.equal(await page.locator('.score').innerText(),'2 / 3');assert.match(await page.locator('#results').innerText(),/Incorrect cable/);
 await page.locator('#reset').click();await page.locator('#confirm-action').click();assert.equal(await page.locator('.connection-row').count(),0);await choose('dsl');assert.equal(await page.locator('.score').innerText(),'4 / 4');await page.locator('#lesson-tab').click();await page.locator('#activity-tab').click();assert.equal(await page.locator('.connection-row').count(),4);
 await page.locator('#enlarge').click();assert.equal(await page.locator('#focus-view').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#board-scroll').evaluate(e=>e.parentElement.id),'workspace-host');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('[data-inspect-cable="phone"]').click();assert.equal(await page.locator('#inspect').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.deepEqual(errors,[]);console.log('PASS browser: selection workflow, navigation, all scenarios, grading, keyboard cancel, retry, undo, reset, persisted state, lesson, enlarged view, and narrow layout.');
 }finally{await b.close()}}
if(process.argv[2])browser(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1});
// Optional DOM event pass when a browser binary is unavailable. Dialog/layout APIs
// are shimmed; this does not claim to test Chromium layout or native focus trapping.
if(process.env.PBQ_JSDOM){
 const {JSDOM}=require(process.env.PBQ_JSDOM),fs=require('node:fs'),base=path.resolve(__dirname,'../docs/practice/pbqs/a-plus-core-1/soho-physical-installation/app');
 function dom(saved){const dom=new JSDOM(fs.readFileSync(path.join(base,'index.html'),'utf8'),{url:'https://example.test/activity/',runScripts:'outside-only'});const w=dom.window;
 w.ResizeObserver=class{observe(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};if(saved!==undefined)w.localStorage.setItem(M.KEY,saved);for(const f of ['model.js','art.js','app.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));return dom}
 const d=dom(),w=d.window,doc=w.document,q=s=>{const el=doc.querySelector(s);assert.ok(el,'Missing '+s);return el},click=s=>q(s).click(),stored=()=>JSON.parse(w.localStorage.getItem(M.KEY));
 const select=sid=>{q('#scenario').value=sid;q('#scenario').dispatchEvent(new w.Event('change'))};
 const put=(id,slot)=>{click(`[data-device="${id}"]`);click(`[data-slot="${slot}"]`)};
 const join=(c,a,b)=>{click(`[data-cable="${c}"]`);click(`[data-port="${a}"]`);click(`[data-port="${b}"]`)};
 assert.equal(doc.querySelectorAll('#scenario option').length,3);assert.equal(doc.querySelectorAll('#cable-tray [data-cable]').length,6);
 assert.equal(q('.actions').parentElement.className,'panel');
 assert.equal(doc.querySelectorAll('[data-tool-task]').length,4);assert.equal(doc.querySelectorAll('[data-tool-function]').length,8);
 for(const [taskId,toolId] of Object.entries({rj45:'crimper',rj11:'crimper',idc:'punchdown',strip:'stripper'})){const sel=q(`[data-tool-task="${taskId}"]`);sel.value=toolId;sel.dispatchEvent(new w.Event('change',{bubbles:true}))}
 for(const id of Object.keys(M.tools)){const sel=q(`[data-tool-function="${id}"]`);sel.value=id;sel.dispatchEvent(new w.Event('change',{bubbles:true}))}
 click('#submit-tools');assert.equal(q('#tool-score').textContent,'12 / 12 correct');assert.match(q('#tool-results').textContent,/All network-tool answers are correct/);

 for(const sid of Object.keys(links)){select(sid);for(const [id,slot] of Object.entries(install[sid]))put(id,slot);for(const [c,a,b] of links[sid])join(c,b,a);assert.equal(q('#results').hidden,true);assert.equal(doc.querySelectorAll('.connection-row.good,.connection-row.bad').length,0);assert.equal(q('#connection-list').textContent.includes('Correct'),false);click('#submit');assert.equal(q('.score').textContent,`${M.grade(sid,complete(sid)).total} / ${M.grade(sid,complete(sid)).total}`);assert.match(q('#results').textContent,/Installation complete/)}
 const reloaded=dom(w.localStorage.getItem(M.KEY));assert.equal(reloaded.window.document.querySelector('#scenario').value,'fiber');assert.equal(reloaded.window.document.querySelector('.score').textContent,'4 / 4');reloaded.window.close();
 select('cable');click('#retry');join('ethernet','router:lan1','router:lan2');click('#submit');assert.match(q('#results').textContent,/Extra \/ invalid/);click('#undo');assert.equal(q('#results').hidden,true);assert.equal(stored().progress.cable.connections.length,3);
 click('[data-remove]');assert.equal(stored().progress.cable.connections.length,2);join('ethernet','wall:service','cable:service');click('#submit');assert.equal(q('.score').textContent,'2 / 3');assert.match(q('#results').textContent,/Incorrect cable/);
 click('[data-cable="phone"]');click('[data-port="router:lan1"]');doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(q('[data-port="router:lan1"]').getAttribute('aria-pressed'),'false');
 click('#lesson-tab');assert.equal(q('#lesson').hidden,false);click('#activity-tab');assert.equal(q('#activity').hidden,false);assert.equal(stored().progress.cable.connections.length,3);
 click('#reset');click('#keep');assert.equal(stored().progress.cable.connections.length,3);click('#reset');click('#confirm-action');assert.equal(stored().progress.cable.connections.length,0);select('dsl');assert.equal(q('.score').textContent,'4 / 4');
 click('[data-return="dsl"]');click('#confirm-action');assert.equal(stored().progress.dsl.connections.length,2);assert.equal(stored().progress.dsl.placed.dsl,undefined);click('#undo');assert.equal(stored().progress.dsl.connections.length,4);
 click('#enlarge');assert.equal(q('#board-scroll').parentElement.id,'focus-host');click('#close-focus');assert.equal(q('#board-scroll').parentElement.id,'workspace-host');
 click('[data-inspect-cable="phone"]');assert.equal(q('#inspect').open,true);assert.match(q('#inspect-description').textContent,/Narrow/);click('#close-inspect');assert.equal(q('#inspect').open,false);
 const removed=q('[data-port="pc:net"]');removed.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Delete',bubbles:true}));assert.equal(stored().progress.dsl.connections.length,3);click('#undo');assert.equal(stored().progress.dsl.connections.length,4);
 for(const raw of ['{broken',JSON.stringify({version:1,active:{toString:'cable'},progress:{cable:{connections:[{cable:{toString:'ethernet'},a:'wall:service',b:'pc:net'}]}}})]){const bad=dom(raw);assert.equal(bad.window.document.querySelectorAll('.connection-row').length,0);bad.window.close()}
 d.window.close();console.log('PASS DOM events: all installations, neutral construction, grading, extra/wrong links, undo, reset confirmation, independent persistence, retry, return equipment, Escape/Delete, tabs, inspection, and enlarged-view lifecycle.');
}
