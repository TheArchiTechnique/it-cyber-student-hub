// Model: node tests/phishing-email-investigation.cjs
// Built MkDocs site: npm run test:phishing-email-investigation
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const M=require('../docs/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/model.js');
function seeded(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
// Independently reviewed answer keys; expectations are not generated from model.indicators.
const reviewed={
 password:['Phishing',['from','renew','request']],payroll:['Phishing',['from','reply','request']],
 sharing:['Phishing',['document']],executive:['Phishing',['reply','request','secrecy']],
 attachment:['Phishing',['from','file','request']],qr:['Phishing',['from','request','qr-image']],
 shipment:['Phishing',['from','tracking','request']],marketing:['Spam',[]],survey:['Spam',[]],webinar:['Spam',[]],
 it:['Legitimate',[]],hr:['Legitimate',[]],vendor:['Legitimate',[]],helpdesk:['Legitimate',[]]
};
const responseKey={credentials:'account-process',execution:'contain-escalate',payment:'verify-payment',campaign:'coordinate',signin:'deny-verify'};
function complete(s){
 for(const id of s.ids){const [classification,evidence]=reviewed[id];s.answers[id]={classification,evidence:evidence.slice()};}
 for(const id of s.responseIds)s.decisions[id]=responseKey[id];
 return s;
}
function forMessage(id){
 let s=M.initial(seeded(42));
 if(!s.ids.includes(id)){
  const type=reviewed[id][0],index=s.ids.findIndex(x=>reviewed[x][0]===type);s.ids[index]=id;s=M.reset(s);
 }
 s.selected=id;s.read=[id];return s;
}
const seen=new Set(),orders=new Set(),positions=new Map(),responsesSeen=new Set();
for(let i=0;i<1000;i++){
 const s=M.initial(seeded(i));assert.equal(s.ids.length,7);assert.equal(new Set(s.ids).size,7);
 for(const [c,n]of [['Phishing',3],['Spam',2],['Legitimate',2]])assert.equal(s.ids.filter(id=>reviewed[id][0]===c).length,n);
 assert.equal(s.responseIds.length,3);assert.equal(new Set(s.responseIds).size,3);
 for(const id of s.responseIds){responsesSeen.add(id);assert.equal(s.optionOrders[id].length,4);assert.equal(new Set(s.optionOrders[id]).size,4);}
 orders.add(s.ids.join(','));s.ids.forEach((id,j)=>{seen.add(id);if(!positions.has(id))positions.set(id,new Set());positions.get(id).add(j);});
 assert.equal(M.grade(s).score,0,'Empty evidence cannot earn points');
 complete(s);assert.deepEqual(M.restore(s),s);assert.equal(M.grade(s).score,29);assert.equal(M.grade(s).max,29);assert.equal(M.grade(s).percentage,100);
 assert.equal(M.grade(s).classification,14);assert.equal(M.grade(s).evidence,9);assert.equal(M.grade(s).response,6);
 s.submitted=true;assert.deepEqual(M.restore(s),s);
 const reset=M.reset(s);assert.deepEqual(reset.ids,s.ids);assert.deepEqual(reset.responseIds,s.responseIds);assert.deepEqual(reset.optionOrders,s.optionOrders);assert.equal(reset.submitted,false);
 assert.ok(Object.values(reset.answers).every(a=>!a.classification&&!a.evidence.length&&!('response'in a)));assert.ok(Object.values(reset.decisions).every(a=>!a));
}
assert.equal(seen.size,14);assert.equal(responsesSeen.size,5);assert.ok(orders.size>900);for(const set of positions.values())assert.equal(set.size,7);
{const first=M.initial(()=>0);assert.notDeepEqual(M.initial(()=>0,first.ids).ids,first.ids);}
assert.ok(M.bank.length>=14);assert.equal(new Set(M.bank.map(m=>m.pattern)).size,M.bank.length);
let evidenceCases=0;
for(const [id,[classification,expected]]of Object.entries(reviewed)){
 const m=M.bank.find(m=>m.id===id),details=M.details(m),ids=details.map(d=>d.id),benign=ids.filter(id=>!expected.includes(id));
 assert.equal(m.classification,classification,id);assert.deepEqual(Object.keys(m.indicators).sort(),expected.slice().sort(),id);
 assert.equal(new Set(ids).size,ids.length);assert.ok(ids.length<=7,'Manageable evidence regions');assert.ok(benign.length>0,id+' must allow distinguishing evidence from a benign area');assert.ok(expected.every(id=>ids.includes(id)));
 assert.ok(['name','to','date','greeting','signature','footer','deadline'].every(id=>!ids.includes(id)));
 assert.equal('context'in m,false);assert.equal('response'in m,false);
 assert.ok(m.explanation.length>100&&m.verification.length>100,id+' needs classification and verification teaching');
 if(classification==='Phishing'){
  assert.ok(m.analysis.attacks.length&&m.analysis.tactics.length&&m.analysis.technical.length);
  for(const group of Object.values(m.analysis))for(const term of group)assert.ok(term.term&&term.explanation.length>35);
 }else assert.equal('analysis'in m,false,'Do not assign phishing techniques to benign mail');
 for(const link of m.links)assert.ok(new URL(link.destination).hostname.endsWith('.example'));
 assert.ok(m.from.endsWith('.example')&&m.to.endsWith('.example'));
 // Exhaust every evidence subset against independently calculated credit, including wrong classifications.
 for(let mask=0;mask<2**ids.length;mask++){
  const selected=ids.filter((_,i)=>mask&(1<<i)),tp=selected.filter(x=>expected.includes(x)).length,fp=selected.length-tp;
  for(const choice of ['Phishing','Spam','Legitimate','']){
   const want=classification==='Phishing'&&choice==='Phishing'?Math.round(100*(3*Math.max(0,tp/expected.length-fp/Math.max(1,benign.length))+1e-9))/100:0;
   const actual=M.gradeMessage(m,{classification:choice,evidence:selected});
   assert.equal(actual.evidence,want,`${id}: subset ${mask}, classification ${choice}`);assert.equal(actual.classification,choice===classification?2:0);evidenceCases++;
  }
 }
 const perfect=M.gradeMessage(m,{classification,evidence:[...expected,...expected,'not-a-region']});assert.equal(perfect.score,classification==='Phishing'?5:2);
 assert.equal(M.gradeMessage(m,{classification,evidence:ids}).evidence,0,id+': selecting every available area must earn no evidence credit');
 assert.equal(M.gradeMessage(m,{classification,evidence:[]}).evidence,0);
 if(expected.length>1){const partial=M.gradeMessage(m,{classification,evidence:expected.slice(0,1)});assert.ok(partial.evidence>0&&partial.evidence<3);}
}
for(const [id,correct]of Object.entries(responseKey)){
 const r=M.responseBank.find(r=>r.id===id);assert.equal(r.correct,correct);assert.equal(r.options.length,4);assert.ok(r.concept.term&&r.concept.explanation.length>70);
 for(const o of r.options){assert.ok(o.explanation.length>75);const s=M.initial(seeded(4));s.responseIds[0]=id;s.decisions[id]=o.id;assert.equal(M.grade(s).decisions[0].score,o.id===correct?2:0);}
}
// Explicitly assess terminology against scenario evidence, including the high-value recipient and lookalike domains.
const terms=id=>JSON.stringify(M.bank.find(m=>m.id===id).analysis);
assert.match(terms('password'),/Pretexting|Urgency/);assert.match(terms('attachment'),/Typosquatting/);assert.match(terms('executive'),/Whaling|Business Email Compromise/);
const executive=M.bank.find(m=>m.id==='executive');assert.equal(executive.to,'elena.ruiz@northbridge.example');assert.match(executive.body[0].text,/Chief Financial Officer/);assert.equal(executive.links.length+executive.attachments.length,0);
assert.ok(!M.bank.find(m=>m.id==='qr').analysis.tactics.some(t=>t.term==='Urgency'),'Badge pressure without a deadline must not be labeled urgency');
assert.ok(!M.bank.find(m=>m.id==='shipment').analysis.attacks.some(t=>t.term==='Credential harvesting'),'Payment-card theft is not account credential harvesting');
assert.match(terms('sharing'),/does not establish/);assert.match(M.bank.find(m=>m.id==='vendor').explanation,/Reply-To|domain hierarchy/);
for(const raw of [null,{},[],{version:1,ids:[]},{version:1,...complete(M.initial()),responseIds:[]},{version:9}])assert.equal(M.restore(raw).ids.length,7);
{
 for(const version of [1,2]){const s=complete(M.initial());s.version=version;const r=M.restore(s);assert.equal(r.version,3);assert.equal(M.grade(r).score,0);}
}
for(const mutate of [s=>s.ids.fill('it'),s=>s.ids.splice(0,7,'password','payroll','sharing','executive','attachment','qr','shipment'),s=>s.responseIds.fill('payment'),s=>s.responseIds[0]='unknown']){
 const s=complete(M.initial());mutate(s);assert.equal(M.grade(M.restore(s)).score,0);
}
{
 const s=forMessage('password');s.answers.password={classification:'<script>',evidence:['bad','from','from']};s.submitted=true;
 const r=M.restore(s);assert.equal(r.answers.password.classification,'');assert.deepEqual(r.answers.password.evidence,[]);assert.equal(r.submitted,false);
 s.answers.password={classification:'Phishing',evidence:['bad','from','from']};assert.deepEqual(M.restore(s).answers.password.evidence,['from']);
 s.answers.password.response='old';const responseId=s.responseIds[0];s.decisions[responseId]='invalid';s.optionOrders[responseId]=['bad'];const clean=M.restore(s);assert.equal(clean.decisions[responseId],'');assert.equal(clean.optionOrders[responseId].length,4);assert.equal('response'in clean.answers.password,false);
 s.submitted=false;M.classify(s,'password','Spam');assert.deepEqual(s.answers.password.evidence,[]);M.classify(s,'password','Phishing');assert.deepEqual(s.answers.password.evidence,[]);
 s.submitted=true;M.classify(s,'password','Legitimate');assert.equal(s.answers.password.classification,'Phishing');
}
console.log(`PASS model: 1,000 balanced attempts; 14 reviewed scenarios; ${evidenceCases} classification/evidence subsets; 29-point scoring; five response cases; terminology, migration, sanitization, and lifecycle.`);
async function browser(origin){
 const {chromium}=require('playwright'),b=await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const ctx=await b.newContext({viewport:{width:1440,height:1050}}),p=await ctx.newPage(),errors=[],failed=[],external=[];
  p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))failed.push(r.url());});
  await ctx.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){if(r.request().url()!=='https://cloud.umami.is/script.js')external.push(r.request().url());return r.abort();}return r.continue();});
  const route='/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/';let base=origin;
  const store=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),M.KEY);
  async function load(s){await p.goto(base+route);await p.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:M.KEY,s});await p.reload();}
  const click=id=>p.locator('#'+id).click();
  async function confirm(id){await click(id);await click('confirm-action');}
  async function overflow(){assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  async function answerResponses(){for(const id of (await store()).responseIds)await p.locator(`[data-decision="${id}"][value="${responseKey[id]}"]`).check();}
  for(const prefix of ['', '/it-cyber-student-hub']){
   base=origin+prefix;await load(forMessage('password'));
   assert.equal(await p.locator('#results').isHidden(),true);assert.equal(await p.locator('#results').innerHTML(),'');assert.equal(await p.locator('#response').count(),0);
   assert.equal(await p.locator('[data-evidence]').count(),0);assert.equal(await p.locator('.response-decision').count(),3);
   assert.equal(await p.locator('#message').innerText().then(t=>/Independent case context|Attack & Social Engineering|Real-World Verification/.test(t)),false);
   await click('submit');assert.match(await p.locator('#notice').innerText(),/every message/);assert.equal(await p.locator('#results').isHidden(),true);
   await p.locator('#message summary').first().focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#message .destination').isVisible(),true);
   await p.locator('#classification').selectOption('Phishing');assert.equal(await p.locator('#evidence-instruction').innerText(),'Select the parts of this email that suggest phishing.');
   await p.locator('[data-evidence=from]').focus();assert.equal(await p.locator('[data-evidence=from]').evaluate(n=>getComputedStyle(n).outlineStyle),'solid');await p.keyboard.press('Enter');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'true');await p.keyboard.press('Space');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'false');await p.keyboard.press('Enter');
   await p.locator('#classification').selectOption('Spam');assert.equal(await p.locator('[data-evidence]').count(),0);assert.deepEqual((await store()).answers.password.evidence,[]);
   await p.locator('#message summary').first().click();assert.equal(await p.locator('#message .destination').isVisible(),true);
   await p.locator('#classification').selectOption('Legitimate');assert.equal(await p.locator('[data-evidence]').count(),0);
   await p.locator('#classification').selectOption('');assert.deepEqual((await store()).answers.password.evidence,[]);assert.equal(await p.locator('[data-evidence]').count(),0);
   await p.locator('#classification').selectOption('Phishing');assert.equal(await p.locator('[aria-pressed=true]').count(),0);await p.locator('[data-evidence=from]').click();
   const second=(await store()).ids.find(id=>id!=='password');await p.locator(`[data-message="${second}"]`).focus();await p.keyboard.press('Enter');assert.equal(await p.locator(`[data-message="${second}"]`).evaluate(e=>e===document.activeElement),true);
   await p.locator('#classification').selectOption('Legitimate');await p.locator('[data-message=password]').click();assert.equal(await p.locator('#classification').inputValue(),'Phishing');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'true');
   await p.reload();assert.equal(await p.locator('#classification').inputValue(),'Phishing');assert.equal(await p.locator('[data-evidence=from]').getAttribute('aria-pressed'),'true');
   await click('reset');await p.keyboard.press('Escape');assert.equal(await p.locator('#confirm').isVisible(),false);assert.equal(await p.locator('#classification').inputValue(),'Phishing');
   const before=await store();await confirm('reset');assert.deepEqual((await store()).ids,before.ids);assert.deepEqual((await store()).responseIds,before.responseIds);assert.equal(M.grade(await store()).score,0);
   // Full score through the student controls, not storage injection.
   for(const id of (await store()).ids){await p.locator(`[data-message="${id}"]`).click();await p.locator('#classification').selectOption(reviewed[id][0]);for(const evidence of reviewed[id][1])await p.locator(`[data-evidence="${evidence}"]`).click();}
   assert.match(await p.locator('#progress').innerText(),/7 \/ 7 classified/);await click('submit');assert.match(await p.locator('#notice').innerText(),/three Security Response/);assert.equal(await p.locator('#results').innerHTML(),'');
   // Radio groups support arrow-key changes as native controls.
   const firstRadio=p.locator('[data-decision]').first();await firstRadio.focus();await p.keyboard.press('Space');await p.keyboard.press('ArrowDown');
   await answerResponses();await click('submit');assert.match(await p.locator('#results').innerText(),/29 \/ 29 points · 100%/);assert.equal(await p.locator('.email-feedback').count(),7);assert.equal(await p.locator('.response-feedback').count(),3);assert.equal(await p.locator('#classification').isDisabled(),true);assert.equal(await p.locator('[data-decision]:enabled').count(),0);
   for(const id of (await store()).responseIds){const feedback=p.locator(`[data-response-review="${id}"]`);await feedback.locator('summary').click();assert.ok((await feedback.innerText()).includes(M.responseBank.find(r=>r.id===id).concept.explanation));for(const o of M.responseBank.find(r=>r.id===id).options)assert.ok((await feedback.innerText()).includes(o.explanation));}
   await p.reload();assert.equal(await p.locator('#results').isVisible(),true);const submitted=await store();await click('retry');assert.equal(await p.locator('#results').isHidden(),true);assert.equal(await p.locator('#results').innerHTML(),'');assert.deepEqual((await store()).answers,submitted.answers);assert.deepEqual((await store()).decisions,submitted.decisions);
   const excessive=await store();for(const id of excessive.ids)if(reviewed[id][0]==='Phishing')excessive.answers[id].evidence=M.details(M.bank.find(m=>m.id===id)).map(e=>e.id);
   await load(excessive);await click('submit');assert.match(await p.locator('#results').innerText(),/20 \/ 29 points/);assert.equal(await p.locator('.email-feedback:has-text("Suspicious evidence review")').count(),3);await click('retry');
   const previous=(await store()).ids;await confirm('new');assert.notDeepEqual((await store()).ids,previous);assert.equal(await p.locator('#results').isHidden(),true);
   await p.locator('#activity-tab').focus();await p.keyboard.press('End');assert.equal(await p.locator('#lesson').isVisible(),true);assert.equal(await p.locator('#lesson article').count(),6);await p.keyboard.press('Home');assert.equal(await p.locator('#activity').isVisible(),true);
   for(const href of await p.locator('[data-pbq-nav]').evaluateAll(nodes=>nodes.map(n=>n.href)))assert.equal((await p.request.get(href)).status(),200);
   await p.goto(base+'/practice/pbqs/');await p.locator('#pbq-subject').selectOption('security');await p.locator('#pbq-topic').selectOption('email-security');assert.equal(await p.locator('[data-pbq-id]').count(),1);await p.locator('[data-pbq-id="phishing-email-investigation"] .pbq-library-launch').click();assert.ok(p.url().endsWith(route));
   await p.goto(base+'/certifications/comptia/a-plus-core-2/');await p.locator('.hub-page a').filter({hasText:'Phishing Email Investigation'}).click();assert.ok(p.url().endsWith('/phishing-email-investigation/'));
  }
  // Exercise every response case, including cases outside the initial seeded selection.
  for(const r of M.responseBank){
   let s=M.initial(seeded(42));
   if(!s.responseIds.includes(r.id)){s.responseIds[0]=r.id;s.optionOrders[r.id]=r.options.map(o=>o.id);s=M.reset(s);}
   complete(s);await load(s);
   const wrong=r.options.find(o=>o.id!==responseKey[r.id]);await p.locator(`[data-decision="${r.id}"][value="${wrong.id}"]`).check();await click('submit');
   let feedback=p.locator(`[data-response-review="${r.id}"]`);assert.match(await feedback.locator('h4').innerText(),/0 \/ 2/);await feedback.locator('summary').click();
   assert.ok((await feedback.innerText()).includes(r.concept.explanation));for(const o of r.options)assert.ok((await feedback.innerText()).includes(o.explanation));
   await click('retry');assert.equal(await p.locator('#results').innerHTML(),'');await p.locator(`[data-decision="${r.id}"][value="${responseKey[r.id]}"]`).check();await click('submit');
   feedback=p.locator(`[data-response-review="${r.id}"]`);assert.match(await feedback.locator('h4').innerText(),/2 \/ 2/);
  }
  // All bank content, destinations, conditional evidence and answer teaching at representative widths.
  for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:1000});
   for(const m of M.bank){
    await load(forMessage(m.id));assert.equal(await p.locator('#message [data-evidence]').count(),0);
    const visible=await p.locator('#message').innerText();for(const detail of [...m.body,...m.links,...m.attachments])assert.ok(visible.includes(detail.text),m.id+' missing '+detail.id);
    assert.ok(visible.includes(m.from)&&visible.includes(m.to));assert.equal(visible.includes(m.explanation),false);assert.equal(visible.includes(m.verification),false);
    for(let i=0;i<m.links.length;i++){await p.locator('#message summary').nth(i).click();assert.equal(await p.locator('#message .destination').nth(i).innerText(),m.links[i].destination);}
    assert.equal(await p.locator('#message a,#message [href],#message [download],#message input').count(),0);
    const inspectorNames=await p.locator('#message summary').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')||n.textContent.trim()));assert.equal(new Set(inspectorNames).size,inspectorNames.length);for(const link of m.links)assert.ok(inspectorNames.some(name=>name.includes(link.text)));
    if(width===1440)for(const classification of M.classifications){
     await p.locator('#classification').selectOption(classification);
     assert.equal(await p.locator('#message [data-evidence]').count(),classification==='Phishing'?M.details(m).length:0);
     for(let i=0;i<m.links.length;i++){const inspector=p.locator('#message summary').nth(i);if(!await inspector.evaluate(n=>n.parentElement.open))await inspector.click();assert.equal(await p.locator('#message .destination').nth(i).innerText(),m.links[i].destination);}
    }
    await p.locator('#classification').selectOption('Phishing');assert.equal(await p.locator('#message [data-evidence]').count(),M.details(m).length);await overflow();
    const [a,c]=await p.locator('.inbox,.reading-pane').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));assert.ok(a.right<=c.x||a.bottom<=c.y,'mail panes overlap at '+width);
    if(width===1440){
     await load(complete(forMessage(m.id)));await click('submit');const feedback=p.locator(`[data-review="${m.id}"]`);assert.ok((await feedback.innerText()).includes(m.explanation));
     if(m.classification==='Phishing'){for(const summary of await feedback.locator('summary').all())if(!/Real-World Verification/.test(await summary.innerText()))await summary.click();for(const indicator of Object.values(m.indicators))assert.ok((await feedback.innerText()).includes(indicator));for(const group of Object.values(m.analysis))for(const term of group)assert.ok((await feedback.innerText()).includes(term.explanation));}
     else{assert.equal(await feedback.locator('summary').count(),1);assert.equal((await feedback.innerText()).includes('Evidence'),false);assert.equal((await feedback.innerText()).includes('Attack & Social'),false);}
     await feedback.locator('summary').filter({hasText:'Real-World Verification'}).click();assert.ok((await feedback.innerText()).includes(m.verification));
    }
   }
   const s=complete(forMessage('executive'));s.submitted=true;await load(s);await overflow();await click('lesson-tab');await overflow();
   if(process.env.PBQ_QA_SCREENSHOT_DIR&&[1440,390].includes(width)){
    fs.mkdirSync(process.env.PBQ_QA_SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,`lesson-${width}.png`),fullPage:true});await click('activity-tab');await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,`results-${width}.png`),fullPage:true});
    await load(forMessage('qr'));await p.locator('#classification').selectOption('Phishing');await p.screenshot({path:path.join(process.env.PBQ_QA_SCREENSHOT_DIR,`inbox-${width}.png`),fullPage:true});
   }
  }
  // Wrong classification, missed indicators and false positives are independently rendered.
  const partial=complete(forMessage('executive'));partial.answers.executive={classification:'Phishing',evidence:['reply','account']};await load(partial);await click('submit');const review=p.locator('[data-review=executive]');await review.locator('summary').filter({hasText:'Suspicious evidence review'}).click();assert.match(await review.innerText(),/Missed indicators/);assert.match(await review.innerText(),/Incorrect selections/);assert.match(await review.innerText(),/DEMO-4821/);
  const wrong=complete(forMessage('password'));wrong.answers.password={classification:'Spam',evidence:['from','renew','request']};await load(wrong);await click('submit');assert.match(await p.locator('[data-review=password]').innerText(),/Evidence 0\/3/);
  const touch=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobile=await touch.newPage();await mobile.goto(base+route);await mobile.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:M.KEY,s:forMessage('qr')});await mobile.reload();
  await mobile.locator('#classification').selectOption('Phishing');await mobile.locator('[data-evidence="qr-image"]').tap();assert.equal(await mobile.locator('[data-evidence="qr-image"]').getAttribute('aria-pressed'),'true');await mobile.locator('#message summary').tap();assert.equal(await mobile.locator('#message .destination').isVisible(),true);await mobile.locator('.response-option').first().tap();assert.equal(await mobile.locator('[data-decision]:checked').count(),1);await mobile.locator('#lesson-tab').tap();assert.equal(await mobile.locator('#lesson').isVisible(),true);await touch.close();
  const denied=await ctx.newPage();await denied.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});await denied.goto(base+route);assert.match(await denied.locator('#save-status').innerText(),/unavailable/);await denied.locator('#classification').selectOption('Spam');assert.equal(await denied.locator('#classification').inputValue(),'Spam');await denied.close();
  for(const version of [1,2]){const old=complete(M.initial());old.version=version;old.submitted=true;await load(old);assert.match(await p.locator('#notice').innerText(),/older saved attempt was reset/);assert.equal((await store()).version,3);assert.equal(M.grade(await store()).score,0);assert.equal(await p.locator('#results').innerHTML(),'');}
  await p.evaluate(k=>localStorage.setItem(k,'{broken'),M.KEY);await p.reload();assert.equal(await p.locator('[data-message]').count(),7);
  const nojs=await b.newContext({javaScriptEnabled:false}),plain=await nojs.newPage();await plain.goto(base+route);assert.equal(await plain.locator('#lesson').isVisible(),true);await nojs.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);await ctx.close();
  console.log('PASS browser: all 14 messages at 320/390/768/1440px; conditional evidence, classification changes, 29-point full/partial/false-positive grading, response feedback, answer hiding, persistence/migration/retry/reset/new, keyboard/touch, inert content, and root/subpath integration.');
 }finally{await b.close();}
}
if(process.argv.includes('--local')){
 const site=path.resolve(__dirname,'../site'),mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname.replace(/^\/it-cyber-student-hub(?=\/)/,'');if(url.endsWith('/'))url+='index.html';const target=path.resolve(site,'.'+decodeURIComponent(url));if(!target.startsWith(site+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data);});});
 server.listen(0,'127.0.0.1',()=>browser(`http://127.0.0.1:${server.address().port}`).catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close()));
}
