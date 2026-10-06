/* Serve a MkDocs build and pass its activity URL as argv[2].
   Requires Playwright with Chromium installed. */
const {chromium}=require(process.env.PBQ_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const url=process.argv[2] || 'http://127.0.0.1:8765/practice/pbqs/a-plus-core-1/motherboard-assembly/app/';
const expected={A:'eps',B:'cpu',C:'fan',A2:'ram2',B2:'ram1',E:'atx',F:'m2',G:'gpu',H:'nic',I:'sata2',J:'usb',K:'panel',L:'pcie',M:'battery',N:'sata',O:'satapower'};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 assert.equal(await page.evaluate(()=>document.compatMode),'CSS1Compat');
 assert.equal(await page.evaluate(()=>document.characterSet),'UTF-8');
 assert.equal(await page.locator('body > [data-pbq-nav-container]').count(),1);
 assert.equal(await page.locator('#learnTab').getAttribute('aria-selected'),'true');
 await page.locator('#learnTab').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#buildTab').getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('[data-zone]').count(),18);
 assert.equal(await page.locator('[data-part]').count(),18);
 assert.equal(await page.locator('[data-pbq-nav]').count(),3);
 for(const a of await page.locator('[data-pbq-nav]').evaluateAll(es=>es.map(e=>e.href)))assert.equal((await page.request.get(a)).status(),200);
 async function put(part,zone){await page.locator(`[data-part="${part}"]`).click();await page.locator(`[data-zone="${zone}"]`).click();}
 async function check(score){await page.locator('#checkBtn').click();assert.equal((await page.locator('.score').innerText()).trim(),`${score} / 18`);}
 // Empty memory slots earn their points, but empty required targets do not.
 await check(2);await page.locator('#continueBtn').click();
 // Wrong PSU leads and SO-DIMMs must not score; all mistakes remain editable.
 await put('pcie','A');await put('eps','L');await put('sodimm1','A2');await put('sodimm2','B2');await put('satapower','N');await check(2);
 await page.locator('#continueBtn').click();
 await page.locator('#resetBtn').click();await page.locator('#confirmReset').click();
 // Real pointer drag onto the CPU socket.
 await page.locator('#enlargeBtn').click();
 const part=page.locator('[data-part="cpu"]'),target=page.locator('[data-zone="B"]');
 await part.scrollIntoViewIfNeeded();
 // Align the visible source and target without changing app state.
 await page.locator('#fitBtn').click();
 const a=await part.boundingBox(),b=await target.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await page.mouse.up();
 assert.match(await target.getAttribute('aria-label'),/Desktop CPU/);
 await page.waitForTimeout(360);
 await page.keyboard.press('Escape');
 // Keyboard placement and removal.
 await page.locator('[data-part="battery"]').focus();await page.keyboard.press('Enter');
 await page.locator('[data-zone="M"]').focus();await page.keyboard.press('Space');
 assert.match(await page.locator('[data-zone="M"]').getAttribute('aria-label'),/Coin-cell/);
 await page.keyboard.press('Delete');assert.match(await page.locator('[data-zone="M"]').getAttribute('aria-label'),/empty/);
 await page.locator('#undoBtn').click();assert.match(await page.locator('[data-zone="M"]').getAttribute('aria-label'),/Coin-cell/);
 for(const [zone,part] of Object.entries(expected))if(!['B','M'].includes(zone))await put(part,zone);
 assert.equal(await page.locator('#progressText').innerText(),'16 of 16 placements');
 await check(18);
 await page.reload();await page.locator('#buildTab').click();assert.equal((await page.locator('.score').innerText()).trim(),'18 / 18');
 await page.locator('#solutionBtn').click();assert.equal(await page.locator('#viewState').innerText(),'Answer reference');
 await page.locator('#solutionBtn').click();assert.match(await page.locator('[data-zone="A2"]').getAttribute('aria-label'),/module 2/);
 await page.locator('#continueBtn').click();
 await page.locator('#learnTab').click();await page.locator('#buildTab').click();assert.equal(await page.locator('#progressText').innerText(),'16 of 16 placements');
 // An incorrectly filled required-empty DIMM slot loses both affected points.
 await put('ram2','A1');await check(16);await page.locator('#continueBtn').click();await put('ram2','A2');
 await page.locator('#enlargeBtn').click();assert.equal(await page.locator('#focusDialog').evaluate(e=>e.open),true);
 await page.locator('#zoomIn').click();await page.locator('#driveDetailBtn').click();assert.equal(await page.evaluate(()=>document.activeElement.dataset.zone),'N');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#focusDialog').evaluate(e=>e.open),false);
 await page.locator('#resetBtn').click();await page.locator('#confirmReset').click();assert.equal(await page.locator('#progressText').innerText(),'0 of 16 placements');
 await page.reload();await page.locator('#buildTab').click();assert.equal(await page.locator('#progressText').innerText(),'0 of 16 placements');
 // Stale v5 state is ignored. Malformed v7 state and duplicated IDs are sanitized.
 await page.evaluate(()=>{localStorage.removeItem('core1-motherboard-assembly-v7');localStorage.setItem('core1-motherboard-assembly-v5',JSON.stringify({placements:{A:'eps'},graded:true}));});
 await page.reload();await page.locator('#buildTab').click();assert.equal(await page.locator('#progressText').innerText(),'0 of 16 placements');
 await page.evaluate(()=>localStorage.setItem('core1-motherboard-assembly-v7',JSON.stringify({placements:{A:'eps',B:'eps',M:'unknown',alien:'cpu'},order:['unknown'],attempts:-1})));
 await page.reload();await page.locator('#buildTab').click();assert.equal(await page.locator('#progressText').innerText(),'1 of 16 placements');
 await page.locator('#resetBtn').click();await page.locator('#confirmReset').click();
 await page.screenshot({path:'/tmp/motherboard-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await put('satapower','O');await put('sata','N');await page.locator('#driveDetailBtn').click();
 await page.screenshot({path:'/tmp/motherboard-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('Passed: scoring, distractors, equivalent RAM/cable ends, pointer drag, keyboard, undo, retry, answer reference, persistence, tabs, focus mode, navigation links, desktop and narrow layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
