// Model: node tests/phishing-email-investigation.cjs
// Actual MkDocs site: npm run test:phishing-email-investigation
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const M=require('../docs/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/model.js');
function seeded(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
const seen=new Set(),orders=new Set(),positions=new Map();
for(let i=0;i<1000;i++){
 const s=M.initial(seeded(i));assert.equal(s.ids.length,7);assert.equal(new Set(s.ids).size,7);
 for(const [c,n]of [['Phishing',3],['Spam',2],['Legitimate',2]])assert.equal(s.ids.filter(id=>M.bank.find(m=>m.id===id).classification===c).length,n);
 orders.add(s.ids.join(','));s.ids.forEach((id,j)=>{seen.add(id);if(!positions.has(id))positions.set(id,new Set());positions.get(id).add(j);});
 for(const id of s.ids){const m=M.bank.find(m=>m.id===id);s.answers[id]={classification:m.classification,response:m.response,evidence:Object.keys(m.indicators)};}
 assert.equal(M.grade(s).score,49);assert.equal(M.grade(s).percentage,100);assert.deepEqual(M.restore(s),s);
 const reset=M.reset(s);assert.deepEqual(reset.ids,s.ids);assert.equal(reset.submitted,false);assert.ok(Object.values(reset.answers).every(a=>!a.classification&&!a.response&&!a.evidence.length));
}
assert.equal(seen.size,M.bank.length);assert.ok(orders.size>900);for(const set of positions.values())assert.equal(set.size,7);
{const first=M.initial(()=>0);assert.notDeepEqual(M.initial(()=>0,first.ids).ids,first.ids);}
assert.ok(M.bank.length>=12);assert.equal(new Set(M.bank.map(m=>m.pattern)).size,M.bank.length);
for(const m of M.bank){
 const details=M.details(m),ids=details.map(d=>d.id),indicators=Object.keys(m.indicators),benign=ids.filter(id=>!indicators.includes(id));assert.equal(new Set(ids).size,ids.length);assert.ok(benign.length>0);assert.ok(indicators.every(id=>ids.includes(id)));
 assert.equal(M.gradeMessage(m,{classification:m.classification,response:m.response,evidence:indicators}).score,7);
 assert.equal(M.gradeMessage(m,{evidence:ids}).evidence,0);
 assert.equal(M.gradeMessage(m,{evidence:[]}).evidence,indicators.length?0:3);
 const perfect=M.gradeMessage(m,{evidence:indicators}).evidence,penalty=M.gradeMessage(m,{evidence:[...indicators,benign[0]]}).evidence;assert.ok(penalty<perfect);
 const duplicate=M.gradeMessage(m,{evidence:[...indicators,...indicators]});assert.equal(duplicate.evidence,3);
 if(indicators.length>1){const partial=M.gradeMessage(m,{evidence:indicators.slice(0,1)}).evidence;assert.ok(partial>0&&partial<3);}
 assert.equal(M.gradeMessage(m,{classification:m.classification}).classification,2);assert.equal(M.gradeMessage(m,{response:m.response}).response,2);
 assert.equal(M.gradeMessage(m,{classification:m.classification==='Phishing'?'Spam':'Phishing',response:'invalid'}).classification,0);
 assert.ok(m.context.length>70&&m.explanation.length>100);for(const l of m.links)assert.ok(new URL(l.destination).hostname.endsWith('.example'));assert.ok(m.from.split('@')[1].endsWith('.example'));assert.ok(m.to.endsWith('.example'));
}
const bec=M.bank.find(m=>m.id==='executive');assert.equal(bec.links.length+bec.attachments.length,0);assert.equal(bec.from,'elena.ruiz@northbridge.example');assert.ok(M.bank.some(m=>m.classification==='Legitimate'&&m.reply));
for(const raw of [null,{},[],{version:1,ids:[]},{version:1,ids:Array(7).fill('it')},{version:1,ids:['password','payroll','sharing','executive','attachment','qr','shipment']},{version:9}])assert.equal(M.restore(raw).ids.length,7);
{const s=M.initial(seeded(5));s.answers[s.selected]={classification:'<script>',response:'invalid',evidence:['bad','subject','subject']};const r=M.restore(s);assert.equal(r.answers[r.selected].classification,'');assert.equal(r.answers[r.selected].response,'');assert.deepEqual(r.answers[r.selected].evidence,['subject']);}
console.log('PASS model: 1,000 balanced randomized attempts; all 14 scenarios at all seven positions; exact 49-point full credit; independent components; normalized partial evidence and false-positive penalties; reset and storage validation.');
function forMessage(id){let s=M.initial(seeded(42));if(!s.ids.includes(id)){const type=M.bank.find(m=>m.id===id).classification,index=s.ids.findIndex(x=>M.bank.find(m=>m.id===x).classification===type);s.ids[index]=id;s=M.reset(s);}s.selected=id;s.read=[id];return s;}
async function browser(origin){
 const {chromium}=require('playwright'),b=await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const ctx=await b.newContext({viewport:{width:1440,height:1050}}),p=await ctx.newPage(),errors=[],failed=[],external=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))failed.push(r.url());});
 await ctx.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){// The shared shell injects analytics; block it without counting it as a message action.
 if(r.request().url()!=='https://cloud.umami.is/script.js')external.push(r.request().url());return r.abort();}return r.continue();});
 const route='/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/';let base=origin;
 const store=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),M.KEY);
 async function load(s){await p.goto(base+route);await p.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:M.KEY,s});await p.reload();}
 async function click(id){await p.locator('#'+id).click();}
 async function confirm(id){await click(id);await click('confirm-action');}
 async function overflow(){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 for(const prefix of ['', '/it-cyber-student-hub']){
  base=origin+prefix;await load(forMessage('password'));assert.equal(await p.locator('#results').isHidden(),true);assert.equal(await p.locator('#results').innerHTML(),'');assert.equal(await p.locator('#message [aria-pressed=true]').count(),0);
  await click('submit');assert.match(await p.locator('#notice').innerText(),/every message/);assert.equal(await p.locator('#results').isHidden(),true);
  await load(forMessage('password'));await p.locator('[data-evidence=from]').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'true');await p.keyboard.press('Space');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'false');await p.keyboard.press('Enter');
  const inspect=p.locator('#message summary').first();await inspect.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#message .destination').isVisible(),true);assert.equal(await p.locator('#message a,#message [href],#message [download]').count(),0);
  await p.locator('#classification').selectOption('Phishing');await p.locator('#response').selectOption(M.responses[2]);const selected=(await store()).selected;const second=(await store()).ids.find(id=>id!==selected);await p.locator(`[data-message="${second}"]`).focus();await p.keyboard.press('Enter');assert.equal(await p.locator(`[data-message="${second}"]`).evaluate(e=>e===document.activeElement),true);assert.match(await p.locator(`[data-message="${second}"]`).innerText(),/Read/);await p.locator(`[data-message="${selected}"]`).click();assert.equal(await p.locator('#classification').inputValue(),'Phishing');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'true');await p.reload();assert.equal(await p.locator('#classification').inputValue(),'Phishing');
  await click('reset');await p.keyboard.press('Escape');assert.equal(await p.locator('#confirm').isVisible(),false);assert.equal(await p.locator('#classification').inputValue(),'Phishing');const before=await store();await confirm('reset');assert.deepEqual((await store()).ids,before.ids);assert.ok(Object.values((await store()).answers).every(a=>!a.classification&&!a.response&&!a.evidence.length));
  // Full 49 points through actual UI interactions, preserving answers across messages.
  for(const id of (await store()).ids){const m=M.bank.find(m=>m.id===id);await p.locator(`[data-message="${id}"]`).click();await p.locator('#classification').selectOption(m.classification);await p.locator('#response').selectOption(m.response);for(const evidence of Object.keys(m.indicators))await p.locator(`[data-evidence="${evidence}"]`).click();}
  assert.equal(await p.locator('#results').innerHTML(),'');await click('submit');assert.match(await p.locator('#results').innerText(),/49 \/ 49 points · 100%/);assert.equal(await p.locator('#results .feedback').count(),7);assert.equal(await p.locator('#classification').isDisabled(),true);await p.reload();assert.equal(await p.locator('#results').isVisible(),true);const submitted=await store();await click('retry');assert.equal(await p.locator('#results').isHidden(),true);assert.equal(await p.locator('#results').innerHTML(),'');assert.deepEqual((await store()).answers,submitted.answers);
  // Selecting all details earns zero evidence points, even with correct classification/response.
  const excessive=await store();for(const id of excessive.ids)excessive.answers[id].evidence=M.details(M.bank.find(m=>m.id===id)).map(e=>e.id);await load(excessive);await click('submit');assert.match(await p.locator('#results').innerText(),/28 \/ 49 points/);assert.match(await p.locator('#results').innerText(),/Incorrect evidence selections/);await click('retry');
  const previous=(await store()).ids;await confirm('new');assert.notDeepEqual((await store()).ids,previous);assert.equal(await p.locator('#results').isHidden(),true);
  await p.locator('#activity-tab').focus();await p.keyboard.press('End');assert.equal(await p.locator('#lesson').isVisible(),true);assert.equal(await p.locator('#lesson article').count(),6);await p.keyboard.press('Home');assert.equal(await p.locator('#activity').isVisible(),true);
  for(const href of await p.locator('[data-pbq-nav]').evaluateAll(nodes=>nodes.map(n=>n.href)))assert.equal((await p.request.get(href)).status(),200);
  await p.goto(base+'/practice/pbqs/');await p.locator('#pbq-subject').selectOption('security');await p.locator('#pbq-topic').selectOption('email-security');assert.equal(await p.locator('[data-pbq-id]').count(),1);await p.locator('[data-pbq-id="phishing-email-investigation"] .pbq-library-launch').click();assert.ok(p.url().endsWith(route));
  await p.goto(base+'/certifications/comptia/a-plus-core-2/');await p.locator('.hub-page a').filter({hasText:'Phishing Email Investigation'}).click();assert.ok(p.url().endsWith('/phishing-email-investigation/'));
 }
 // Every message and destination at desktop and mobile widths, plus feedback and lesson overflow.
 for(const width of [1440,768,390,320]){
  await p.setViewportSize({width,height:1000});
  for(const m of M.bank){await load(forMessage(m.id));assert.equal(await p.locator('#message [data-evidence]').count(),M.details(m).length,m.id);for(const detail of M.details(m))assert.ok((await p.locator('#message').innerText()).includes(detail.text),m.id+' missing '+detail.id);for(let i=0;i<m.links.length;i++){await p.locator('#message summary').nth(i).click();assert.equal(await p.locator('#message .destination').nth(i).innerText(),m.links[i].destination);}assert.equal(await p.locator('#message a,#message [download],#message input').count(),0);await overflow();if(process.env.PBQ_QA_SCREENSHOT_DIR&&m.id==='qr'&&[1440,390].includes(width)){fs.mkdirSync(process.env.PBQ_QA_SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,`phishing-${width}.png`),fullPage:true});}
   const boxes=await p.locator('.inbox,.reading-pane').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));const [a,b]=boxes;assert.ok(a.right<=b.x||a.bottom<=b.y,'mail panes overlap at '+width);
  }
  const s=forMessage('executive');for(const id of s.ids){const m=M.bank.find(m=>m.id===id);s.answers[id]={classification:m.classification,response:m.response,evidence:[]};}s.submitted=true;await load(s);await overflow();await click('lesson-tab');await overflow();
 }
 const touch=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobile=await touch.newPage();await mobile.goto(base+route);const s=forMessage('qr');await mobile.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:M.KEY,s});await mobile.reload();await mobile.locator('[data-evidence="qr-image"]').tap();assert.equal(await mobile.locator('[data-evidence="qr-image"]').getAttribute('aria-pressed'),'true');await mobile.locator('#message summary').tap();assert.equal(await mobile.locator('#message .destination').isVisible(),true);await mobile.locator('#lesson-tab').tap();assert.equal(await mobile.locator('#lesson').isVisible(),true);await touch.close();
 const denied=await ctx.newPage();await denied.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});await denied.goto(base+route);assert.match(await denied.locator('#save-status').innerText(),/unavailable/);await denied.locator('#classification').selectOption('Spam');assert.equal(await denied.locator('#classification').inputValue(),'Spam');await denied.close();
 await p.goto(base+route);await p.evaluate(k=>localStorage.setItem(k,'{broken'),M.KEY);await p.reload();assert.equal(await p.locator('[data-message]').count(),7);
 const nojs=await b.newContext({javaScriptEnabled:false}),plain=await nojs.newPage();await plain.goto(base+route);assert.equal(await plain.locator('#lesson').isVisible(),true);await nojs.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);await ctx.close();
 console.log('PASS browser: all 14 emails at 320/390/768/1440px; full and excessive-evidence submissions; hidden feedback; persistence, retry/reset/new; keyboard/touch; inert message content; storage denial and no-JS lesson; catalog filters and root/subpath navigation.');
 }finally{await b.close();}
}
if(process.argv.includes('--local')){
 const site=path.resolve(__dirname,'../site'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/,'');if(url.endsWith('/'))url+='index.html';const target=path.resolve(site,'.'+decodeURIComponent(url));if(!target.startsWith(site+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);});});server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}`).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close()));
}
