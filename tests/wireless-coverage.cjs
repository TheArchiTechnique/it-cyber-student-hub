/* node tests/wireless-coverage.cjs [built activity URL]
 * Browser checks: PBQ_PLAYWRIGHT=/path/to/playwright
 *                PBQ_BROWSER_EXECUTABLE=/path/to/chromium (optional)
 *                PBQ_REVIEW_HTML=/path/to/extracted/app/index.html (optional)
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const M=require('../docs/practice/pbqs/a-plus-core-1/wireless-coverage/app/model.js');
const make=(a,b,micro='counterWest')=>({version:1,positions:{wap1:a,wap2:b,microwave:micro,radio1:'securityWest',radio2:'securityEast'},submitted:false});
const initial=M.fresh(),initialGrade=M.grade(initial);
assert.equal(Object.keys(M.slots).length,8);assert.equal(M.rooms.filter(r=>r.id!=='hall').length,6);
assert.equal(M.samples(initial).length,750);
assert.equal(initialGrade.complete,false);assert.equal(initialGrade.rows[0].correct,false);assert.ok(initialGrade.desk<42);
const pass=[];for(const a of Object.keys(M.slots))for(const b of Object.keys(M.slots)){if(a===b)continue;for(const micro of Object.keys(M.kitchen)){
 const s=make(a,b,micro),g=M.grade(s),swapped=M.grade(make(b,a,micro));assert.ok(g.score>=0&&g.score<=100);assert.equal(g.score,swapped.score);assert.equal(g.complete,swapped.complete);assert.deepEqual(g.perRoom,swapped.perRoom);assert.equal(g.desk,swapped.desk);
 assert.equal(g.complete,g.rows.every(r=>r.correct));assert.equal(g.score===100,g.complete);if(g.complete){pass.push([a,b,micro]);assert.ok(g.desk>=52);assert.ok(g.totalCoverage>=.9);assert.ok(g.perRoom.every(r=>r.coverage>=.75));assert.ok(g.minSeparation>=20)}
 // Movable radios are excluded from the RF model and score.
 for(const radio1 of Object.keys(M.radioSlots))for(const radio2 of Object.keys(M.radioSlots)){if(radio1===radio2)continue;assert.equal(g.score,M.grade({...s,positions:{...s.positions,radio1,radio2}}).score)}
}}
assert.ok(pass.length>=8,'Multiple AP layouts, counter locations and WAP identities should pass');
for(const [a,b] of [['B','G'],['B','H']])for(const micro of ['counterWest','counterEast'])assert.equal(M.grade(make(a,b,micro)).complete,true);
for(const [a,b] of [['A','D'],['G','H'],['B','E'],['C','F']])assert.equal(M.grade(make(a,b)).complete,false);
assert.match(M.grade(make('G','H')).rows[2].text,/closely clustered/);
assert.equal(M.grade(make('B','C')).rows[0].correct,true);assert.ok(M.grade(make('B','C')).score>initialGrade.score);assert.equal(M.grade(make('B','C')).rows[1].correct,false);
const near=M.grade(make('B','G','shelf')),far=M.grade(make('B','G'));
assert.ok(near.desk<far.desk);assert.ok(near.totalCoverage<far.totalCoverage);assert.equal(near.rows[3].correct,false);assert.match(near.rows[3].text,/microwave/);assert.equal(far.rows[3].correct,true);
assert.equal(M.wallCount({x:18,y:10},{x:22,y:10}),1);assert.equal(M.wallCount({x:14,y:20},{x:14,y:24}),0);
assert.ok(M.quality({x:5,y:5},{x:6,y:5},{x:50,y:48})>M.quality({x:5,y:5},{x:16,y:5},{x:50,y:48}));
assert.ok(M.quality({x:18,y:10},{x:19,y:10},{x:50,y:48})>M.quality({x:18,y:10},{x:21,y:10},{x:50,y:48}));
let moved=M.fresh(),before=JSON.stringify(moved);assert.match(M.move(moved,'microwave','A'),/breakroom/);assert.equal(JSON.stringify(moved),before);
assert.match(M.move(moved,'wap1','H'),/occupied/);assert.equal(JSON.stringify(moved),before);
assert.match(M.move(moved,'wap1','counterWest'),/A–H/);assert.equal(JSON.stringify(moved),before);
assert.match(M.move(moved,'radio1','A'),/desk/);assert.equal(JSON.stringify(moved),before);
assert.equal(M.move(moved,'wap1','B'),null);assert.equal(moved.positions.wap1,'B');assert.equal(moved.submitted,false);
moved.submitted=true;assert.deepEqual(M.restore(JSON.parse(JSON.stringify(moved))),moved);
for(const raw of [null,[],{}, {version:2}, {version:1,positions:{wap1:'A',wap2:'A'}}, {version:1,positions:{wap1:'__proto__',wap2:'constructor'}}, {version:1,positions:{wap1:{},wap2:'H'}}, {version:1,positions:[]}])assert.deepEqual(Object.fromEntries(Object.entries(M.restore(raw).positions).filter(([id])=>!id.startsWith('radio'))),{wap1:'E',wap2:'H',microwave:'shelf'});
assert.equal(M.restore({...make('B','G'),positions:{wap1:'B',wap2:'G',microwave:'__proto__'}}).positions.microwave,'shelf');
const base=path.resolve(__dirname,'../docs/practice/pbqs/a-plus-core-1/wireless-coverage/app');
assert.equal(M.fresh(()=>0).positions.radio1,'nwDesk');assert.equal(M.fresh(()=>0).positions.radio2,'northDesk');assert.notDeepEqual(M.fresh(()=>0).positions,M.fresh(()=>.9).positions);
console.log(`PASS model: all ${56*3} layouts, ${pass.length} passing combinations, partial credit, northwest requirement, distributed service, walls/distance, microwave proximity, radio independence, invalid-drop guards, and state recovery.`);
async function browser(url){const {chromium}=require(process.env.PBQ_PLAYWRIGHT||'playwright');const b=await chromium.launch({headless:true,...(process.env.PBQ_BROWSER_EXECUTABLE?{executablePath:process.env.PBQ_BROWSER_EXECUTABLE,args:['--no-sandbox','--no-process-singleton','--single-process','--no-zygote']}:{} )});try{
 const context=await b.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce',hasTouch:true}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 const stored=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),M.KEY);
 const pick=id=>p.locator(`#equipment-tray [data-equipment="${id}"]`);
 const zone=id=>p.locator(`[data-slot="${id}"]`);
 async function place(id,pos){await pick(id).click();await zone(pos).click()}
 async function reset(){await p.locator('#reset').click();await p.locator('#confirm-action').click()}
 async function submit(){await p.locator('#submit').click()}
 async function retry(){await p.locator('#retry').click()}
 assert.equal(await p.locator('#floor-art').count(),1);assert.equal(await p.locator('.zone:visible').count(),13);assert.equal(await p.locator('[data-pbq-nav]').count(),3);
 for(const href of await p.locator('[data-pbq-nav]').evaluateAll(es=>es.map(e=>e.href)))assert.equal((await p.request.get(href)).status(),200);
 assert.equal(await p.locator('#results').isVisible(),false);assert.equal(await p.locator('#signal-layer rect').count(),0);
 await p.locator('[data-inspect="wap1"]').click();assert.match(await p.locator('#inspect-description').innerText(),/up to 2,000 sq ft/);await p.keyboard.press('Escape');assert.equal(await p.locator('[data-inspect="wap1"]').evaluate(el=>document.activeElement===el),true);
 await submit();assert.match(await p.locator('#results').innerText(),/northwest office is still insufficient/);assert.equal(await p.locator('#signal-layer rect').count()>750,true);await retry();assert.equal(await p.locator('#signal-layer rect').count(),0);
 // Real native mouse drag/drop, including invalid destinations.
 await pick('wap1').dragTo(zone('B'));assert.equal((await stored()).positions.wap1,'B');
 await pick('microwave').dragTo(zone('G'));assert.equal((await stored()).positions.microwave,'shelf');assert.match(await p.locator('#status').innerText(),/breakroom/);
 await p.locator('#cancel-selection').click();
 await place('wap2','G');await submit();assert.equal(await p.locator('[data-feedback="environment"]').evaluate(e=>e.classList.contains('good')),false);assert.match(await p.locator('[data-feedback="environment"]').innerText(),/microwave/);
 await retry();await pick('microwave').click();await p.selectOption('#placement','counterWest');await p.locator('#place').click();await submit();assert.equal(await p.locator('.score').innerText(),'100 / 100');assert.match(await p.locator('#results').innerText(),/Connection problem resolved/);
 await p.locator('#toggle-coverage').click();assert.equal(await p.locator('#signal-layer rect').count(),0);await p.locator('#toggle-coverage').click();assert.ok(await p.locator('#signal-layer rect').count()>=750);
 const radioBefore=await stored();await pick('radio1').click();const available=Object.keys(M.radioSlots).find(id=>id!==radioBefore.positions.radio1&&id!==radioBefore.positions.radio2);await zone(available).click();assert.equal((await stored()).positions.radio1,available);assert.equal(await p.locator('.score').innerText(),'100 / 100');const radioAfter=await stored();await p.reload();assert.equal(await p.locator('.score').innerText(),'100 / 100');assert.equal((await stored()).positions.radio1,radioAfter.positions.radio1);assert.equal((await stored()).positions.wap1,'B');await retry();
 const currentRadios=await stored();const otherRadioTarget=Object.keys(M.radioSlots).find(id=>id!==currentRadios.positions.radio1&&id!==currentRadios.positions.radio2);await pick('radio2').click();await pick('radio2').dragTo(zone(otherRadioTarget));assert.equal((await stored()).positions.radio2,otherRadioTarget);
 await place('wap2','H');await place('microwave','counterEast');await submit();assert.equal(await p.locator('.score').innerText(),'100 / 100');
 // Keyboard placing, cancellation, tab pattern and undo.
 await retry();await pick('wap1').focus();await p.keyboard.press('Enter');await zone('A').focus();await p.keyboard.press('Space');assert.equal((await stored()).positions.wap1,'A');
 await p.locator('#undo').click();assert.equal((await stored()).positions.wap1,'B');assert.equal(await p.locator('#results').isVisible(),false);
 await pick('wap1').focus();await p.keyboard.press('Space');await p.keyboard.press('Escape');assert.equal(await pick('wap1').getAttribute('aria-pressed'),'false');
 await p.locator('#activity-tab').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#lesson').isVisible(),true);await p.keyboard.press('Home');assert.equal(await p.locator('#activity').isVisible(),true);
 await p.locator('#enlarge').click();assert.equal(await p.locator('#focus-view').evaluate(e=>e.open),true);await zone('B').click();await zone('A').click();assert.equal((await stored()).positions.wap1,'A');await p.keyboard.press('Escape');await p.waitForFunction(()=>document.getElementById('board-scroll').parentElement.id==='workspace-host');assert.equal(await p.locator('#board-scroll').evaluate(e=>e.parentElement.id),'workspace-host');await p.locator('#undo').click();
 await p.locator('#reset').click();await p.locator('#keep').click();assert.equal((await stored()).positions.wap1,'B');await reset();assert.deepEqual(Object.fromEntries(Object.entries((await stored()).positions).filter(([id])=>!id.startsWith('radio'))),{wap1:'E',wap2:'H',microwave:'shelf'});
 await place('wap1','A');await place('wap2','D');await submit();assert.ok(Number((await p.locator('.score').innerText()).split(' / ')[0])<80);assert.match(await p.locator('#results').innerText(),/weak|insufficient/);
 // Submit and target hitboxes are fully visible, with no overlays.
 await p.locator('#submit').scrollIntoViewIfNeeded();assert.equal(await p.locator('#submit').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),true);
 const rectangles=await p.locator('.zone:visible').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.slot,x:r.x,y:r.y,w:r.width,h:r.height}}));for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){const a=rectangles[i],c=rectangles[j];assert.ok(a.x+a.w<=c.x||c.x+c.w<=a.x||a.y+a.h<=c.y||c.y+c.h<=a.y,`${a.id} and ${c.id} overlap`)}
 for(const width of [1024,768,390,320]){await p.setViewportSize({width,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}
 await retry();await pick('wap1').click();await p.selectOption('#placement','B');await p.locator('#place').click();assert.equal((await stored()).positions.wap1,'B');await reset();
 // Navigate out and re-enter using the actual built Hub listing, twice.
 for(let i=0;i<2;i++){await p.locator('[data-pbq-nav="certification"]').click();await p.locator('.md-content').getByRole('link',{name:'Wireless Coverage',exact:true}).click();await p.getByRole('link',{name:'Launch Wireless Coverage PBQ',exact:true}).first().evaluate((el,u)=>{el.href=u},url);await p.getByRole('link',{name:'Launch Wireless Coverage PBQ',exact:true}).first().click();assert.equal(await p.locator('.zone:visible').count(),13)}
 // Corrupt storage, unknown positions and denied storage recover without exceptions.
 await p.evaluate(key=>localStorage.setItem(key,'{broken'),M.KEY);await p.reload();assert.deepEqual(Object.fromEntries(Object.entries((await stored()).positions).filter(([id])=>!id.startsWith('radio'))),{wap1:'E',wap2:'H',microwave:'shelf'});
 const denied=await context.newPage();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}});await denied.goto(url);assert.match(await denied.locator('#save-status').innerText(),/unavailable/);await denied.close();
 const touch=await context.newPage();await touch.setViewportSize({width:390,height:844});await touch.goto(url);await touch.locator('#equipment-tray [data-equipment="wap1"]').tap();await touch.selectOption('#placement','B');await touch.locator('#place').tap();assert.equal(await touch.evaluate(key=>JSON.parse(localStorage.getItem(key)).positions.wap1,M.KEY),'B');await touch.close();
 if(process.env.PBQ_REVIEW_HTML){const file=await context.newPage();await file.goto('file://'+process.env.PBQ_REVIEW_HTML);assert.equal(await file.locator('.zone:visible').count(),13);await file.locator('#equipment-tray [data-equipment="wap1"]').click();await file.locator('[data-slot="B"]').click();await file.locator('#equipment-tray [data-equipment="wap2"]').click();await file.locator('[data-slot="G"]').click();await file.locator('#equipment-tray [data-equipment="microwave"]').click();await file.locator('[data-slot="counterWest"]').click();await file.locator('#submit').click();assert.equal(await file.locator('.score').innerText(),'100 / 100');await file.reload();assert.equal(await file.locator('.score').innerText(),'100 / 100');await file.close()}
 for(const slug of ['soho-physical-installation','motherboard-assembly','ports-and-protocols']){const representative=await context.newPage();representative.on('pageerror',e=>errors.push(e.message));await representative.goto(url.replace('wireless-coverage/app/',slug+'/app/'));assert.equal(await representative.locator('[data-pbq-nav]').count(),3);if(slug==='soho-physical-installation')assert.equal(await representative.locator('#scenario option').count(),3);else if(slug==='motherboard-assembly'){await representative.locator('#buildTab').click();assert.equal(await representative.locator('[data-zone]').count(),18)}else assert.ok((await representative.locator('body').innerText()).includes('Ports'));await representative.close()}
 assert.deepEqual(errors,[]);console.log('PASS browser: actual launch, navigation/re-entry, inspection, native drag/drop, invalid drop, click/list/touch/keyboard placement, scoring, alternate layouts, coverage, undo/reset/retry, persistence/recovery, enlarged view, unobstructed controls, and 320–1440px layout.');
 }finally{await b.close()}}
if(process.argv[2]==='--local'){const http=require('node:http'),root=path.resolve(__dirname,'../site');const server=http.createServer((req,res)=>{let target=decodeURIComponent(req.url.split('?')[0]);if(target.endsWith('/'))target+='index.html';const f=path.join(root,target);if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end();return}const ext=path.extname(f),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};res.setHeader('Content-Type',types[ext]||'application/octet-stream');res.end(data)})});server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}/practice/pbqs/a-plus-core-1/wireless-coverage/app/`).catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close()))}else if(process.argv[2])browser(process.argv[2]).catch(e=>{console.error(e);process.exitCode=1});
