/* Browser regression check. Requires Playwright and Chromium.
   Serve the site with mkdocs serve, then:
   NODE_PATH=/path/to/node_modules node tests/ports-and-protocols.cjs
   Optional first argument: the full activity URL on a local preview. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const url = process.argv[2] || 'http://127.0.0.1:8000/it-cyber-student-hub/practice/pbqs/a-plus-core-1/ports-and-protocols/app/';
// Independent expected answers, in the field order shown in each task.
const expected = {
 shell:['22'], lease:['DHCP'], transport:['TCP','UDP','TCP','UDP'],
 overhead:['UDP avoids connection setup; the application handles retries.'],
 web:['80','443'], 'mail-sync':['IMAP','143'], 'mail-pop':['POP3'], 'mail-relay':['SMTP','25'],
 'legacy-terminal':['Telnet','SSH'], 'telnet-port':['23'], desktop:['RDP','3389'],
 'file-match':['21','Transfer files in a client/server session','445','Open shared folders and printers'],
 'ftp-data':['Separate data connection','TCP 20'], 'ftp-passive':['Passive FTP uses a negotiated server data port.'],
 'dns-failure':['DNS','53'], 'dns-tcp':['TCP','53'], 'dhcp-direction':['68','67','68'],
 'dhcp-failure':['DHCP','UDP'], ldap:['LDAP','389'], both:['TCP and UDP','TCP and UDP','UDP only','TCP and UDP'],
 netbt:['137','138','139'], 'mail-match':['110','Synchronize server mailbox folders and message state','25'],
 encryption:['TCP reliability does not provide application encryption.'], 'source-port':['52014'],
 reliability:['It attempts recovery but the connection can still fail.'], 'smb-ticket':['TCP','445']
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url);await page.waitForSelector('#fields input, #fields select');
 const firstOrder=await page.evaluate(()=>run.map(q=>q.id));
 assert.equal(firstOrder.length,26);assert.equal(new Set(firstOrder).size,26);
 await page.locator('#check').click();assert.match(await page.locator('#form-error').innerText(),/every part/);
 assert.equal(await page.locator('#feedback').innerText(),'');
 assert.equal(await page.locator('#progress').getAttribute('value'),'0');
 // Keyboard tab behavior and incomplete results.
 await page.locator('#tab-practice').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#tab-review').getAttribute('aria-selected'),'true');
 await page.keyboard.press('ArrowRight');assert.match(await page.locator('#results-body').innerText(),/0 of 26 tasks checked/);
 await page.locator('#tab-practice').click();
 let earned=0, graded=0;
 async function answerRun(allCorrect) {
  for(let i=0;i<26;i++){
   await page.locator('#jump').selectOption(String(i));
   const id=await page.evaluate(()=>run[current].id);
   assert.equal(await page.locator('#feedback').innerText(),'');
   assert.equal(await page.locator('#fields [checked], #fields option[selected]').count(),0);
   // Blocked topic prose must not even be in the review DOM before checking.
   await page.locator('#tab-review').click();
   const leaked=await page.evaluate(()=>REVIEW.filter(c=>run[current].blocked.includes('all')||run[current].blocked.includes(c.id)).filter(c=>$('review-cards').textContent.includes(c.text)).map(c=>c.id));
   assert.deepEqual(leaked,[]);
   await page.locator('#tab-practice').click();
   const answers=expected[id];assert.ok(answers,`Missing independent fixture: ${id}`);
   for(let j=0;j<answers.length;j++){
    const field=page.locator(`[data-part="${j}"]`);
    const isSelect=await field.first().evaluate(e=>e.tagName==='SELECT');
    const choices=isSelect?await field.locator('option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean)):await field.evaluateAll(es=>es.map(e=>e.value));
    assert.equal(choices.length,new Set(choices).size);assert.ok(choices.includes(answers[j]));
    const correct=allCorrect||graded%2===0;
    const choice=correct?answers[j]:choices.find(x=>x!==answers[j]);
    if(isSelect)await field.selectOption(choice);else await field.filter({visible:true}).evaluateAll((es,value)=>es.find(e=>e.value===value).click(),choice);
    if(correct)earned++;graded++;
   }
   await page.locator('#check').click();
   assert.equal(await page.locator('#feedback .feedback-item').count(),answers.length);
   for(const value of answers)assert.ok((await page.locator('#feedback').innerText()).includes(value));
   assert.equal(await page.locator('#fields input:enabled, #fields select:enabled').count(),0);
   assert.equal(await page.locator('#score-text').innerText(),`${earned} / ${graded} checked points`);
   // Re-submission cannot change the score.
   await page.locator('#answer-form').evaluate(e=>e.dispatchEvent(new Event('submit',{cancelable:true})));
   assert.equal(await page.locator('#score-text').innerText(),`${earned} / ${graded} checked points`);
   if(i===0){await page.locator('#restart').click();await page.locator('#cancel-reset').click();assert.equal(await page.locator('#score-text').innerText(),`${earned} / ${graded} checked points`);}
  }
 }
 await answerRun(false);
 await page.locator('#tab-results').click();assert.match(await page.locator('#results-body').innerText(),/Run complete/);
 const points=graded;assert.equal(earned,Math.ceil(points/2));
 // Restart from results clears all submitted and hidden state.
 await page.locator('#restart').click();await page.locator('#confirm-reset').click();
 assert.equal(await page.locator('#score-text').innerText(),'0 / 0 checked points');
 assert.equal(await page.locator('#feedback').innerText(),'');
 assert.equal(await page.locator('#results-body').innerText(),'');
 assert.deepEqual(await page.evaluate(()=>states.filter(s=>s.checked||s.answers.some(Boolean))),[]);
 const newOrder=await page.evaluate(()=>run.map(q=>q.id));assert.notDeepEqual(newOrder,firstOrder);
 earned=0;graded=0;await answerRun(true);
 await page.locator('#tab-results').click();assert.match(await page.locator('.result-stat').innerText(),/100%/);
 assert.equal(earned,points);
 // Narrow layout, touch-sized controls, local overview route, reload reset.
 await page.setViewportSize({width:390,height:844});await page.locator('#tab-practice').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('#restart').click();await page.locator('#confirm-reset').click();
 const matchIndex=await page.evaluate(()=>run.findIndex(q=>q.id==='file-match'));
 await page.locator('#jump').selectOption(String(matchIndex));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('#answer-0').selectOption('21');
 await page.reload();assert.equal(await page.locator('#score-text').innerText(),'0 / 0 checked points');
 const overview=await page.locator('.back').getAttribute('href');assert.equal((await page.request.get(new URL(overview,url).href)).status(),200);
 assert.deepEqual(errors,[]);
 console.log(`PASS: 26 tasks / ${points} points; mixed and perfect runs; locked scoring; explanations; filtered review; incomplete submission; keyboard tabs; restart/cancel/reload; 390px layout; project-subpath assets and overview; no browser errors.`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
