// Run after mkdocs build --strict. Tests the built app, including injected Hub navigation.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const M = require('../docs/practice/pbqs/a-plus-core-2/home-network-configuration/app/model.js');
const root = path.resolve(__dirname,'../site'), prefix='/it-cyber-student-hub', appPath='practice/pbqs/a-plus-core-2/home-network-configuration/app/';
const server = http.createServer(async (req,res) => { try { let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p.startsWith(prefix+'/'))p=p.slice(prefix.length);let target=path.resolve(root,'.'+p);if(!target.startsWith(root+path.sep)&&target!==root)throw Error();if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml'})[path.extname(target)]||'application/octet-stream');res.end(await fs.readFile(target));}catch(_){res.writeHead(404).end();} });
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];let cases=0;
 try {
  for(const type of M.TYPES)for(let seed=0;seed<4;seed++){
   const fixture=M.initial(M.specification(type,seed)),s=fixture.spec,id=s.affected;
   const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
   await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   // Only seed the first load; later reloads exercise actual persistence.
   await ctx.addInitScript(value=>{if(!localStorage.getItem('hub-core2-home-network-v1'))localStorage.setItem('hub-core2-home-network-v1',JSON.stringify(value));},fixture);
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+prefix+'/'+appPath);await page.locator('#device-title').waitFor();
   const device=async name=>page.locator(`[data-device="${name}"]`).click();
   const fill=async(name,value)=>page.locator('#'+name).fill(String(value));
   const select=async(name,value)=>page.locator('#'+name).selectOption(value);
   const command=async text=>{await fill('command',text);await page.locator('#command-form button').click();};
   const test=async(source,target,success)=>{await select('test-source',source);await select('test-target',target);await page.locator('#connection-form button').click();assert.match(await page.locator('#test-output').textContent(),success?/Connection succeeded/:/failed or traffic was blocked/);};
   if(type==='lease'){
    await command('ipconfig /all');assert.match(await page.locator('#terminal-output').textContent(),/169\.254\./);
    await command('ipconfig /renew');assert.match(await page.locator('#terminal-output').textContent(),/timed out/);
    await device('router');await page.locator('#dhcp').check();await fill('pool-end',149);await page.locator('#device-form button').click();
    await device(id);await command('ipconfig /renew');assert.match(await page.locator('#terminal-output').textContent(),new RegExp(s.base.replaceAll('.','\\.')));
   }else if(type==='route'){
    await test(id,'printer',true);await test(id,'archive',false);await fill(s.variant?'mask':'gateway',s.variant?s.mask:s.gateway);await page.locator('#device-form button').click();
   }else if(type==='dns'){
    await command('ping '+s.portal);assert.match(await page.locator('#terminal-output').textContent(),/Lost = 0/);
    await command('nslookup '+s.hostname);assert.match(await page.locator('#terminal-output').textContent(),/timed-out/);
    await fill('dns',s.gateway);await page.locator('#device-form button').click();await command('nslookup '+s.hostname);assert.match(await page.locator('#terminal-output').textContent(),/Non-authoritative answer/);
   }else if(type==='wifi'){
    await device('ap');await select('main-security',s.legacy?'transition':'wpa3');await select('main-band',s.legacy?'dual':'5');await select('guest-security','wpa2-aes');await select('guest-band','dual');await page.locator('#isolation').check();await page.locator('#device-form button').click();
    await device(id);await select('network','main');await fill('client-key',s.mainKey);await page.locator('#device-form button').click();
   }else{
    await device('router');await page.locator('#forward').check();await select('forward-protocol','UDP');await fill('external-port',s.vpnPort);await fill('forward-target',s.vpn);await fill('internal-port',s.vpnPort);await page.locator('#device-form button').click();
    await device('vpn');await select('rule-profile','Private');await fill('rule-scope',s.vpnNetwork);await page.locator('#device-form button').click();
   }
   await select('diagnosis',s.cause);await page.locator('#submit').click();assert.equal(await page.locator('.score').textContent(),'80 / 100');
   await page.locator('#retry').click();
   if(type==='wifi'){await test(id,'printer',true);await test('guest','portal',true);await test('guest','printer',false);await test('guest','admin',false);}
   else if(type==='remote'){await test('vpn-client','rdp',true);await test('internet','rdp',false);await test('guest','rdp',false);}
   else{await test(id,'gateway',true);await test(id,type==='route'&&s.variant?'archive':'portal',true);}
   await page.locator('#submit').click();assert.equal(await page.locator('.score').textContent(),'100 / 100');
   assert.equal(await page.locator('#results .feedback.good').count(),4);
   await page.reload();assert.equal(await page.locator('.score').textContent(),'100 / 100');
   await page.locator('#lesson-tab').click();assert.equal(await page.locator('#lesson').isVisible(),true);
   await page.locator('#lesson-tab').press('Home');assert.equal(await page.locator('#activity').isVisible(),true);
   await page.locator('#activity-tab').press('ArrowRight');assert.equal(await page.locator('#lesson').isVisible(),true);
   await page.locator('#lesson-tab').press('ArrowLeft');assert.equal(await page.locator('#activity').isVisible(),true);
   await page.locator('#reset').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.score').textContent(),'100 / 100');
   await page.locator('#reset').click();await page.locator('#confirm-action').click();assert.equal(await page.locator('#results').isVisible(),false);assert.equal(await selectState(page,'diagnosis'),'');
   assert.equal(await page.locator('#test-history li').count(),0);
   await page.locator('[data-device="router"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#device-title').textContent(),'Office router');
   const before=await page.locator('#ticket-type').inputValue();await page.locator('#new-scenario').click();await page.locator('#confirm-action').click();assert.notEqual(await page.locator('#ticket-type').inputValue(),before);
   await select('ticket-type',type);await page.locator('#keep').click();assert.notEqual(await page.locator('#ticket-type').inputValue(),type);
   await select('ticket-type',type);await page.locator('#confirm-action').click();assert.equal(await page.locator('#ticket-type').inputValue(),type);
   cases++;await ctx.close();
  }
  // Responsive layout and keyboard/touch inspection at root and project subpath.
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await context.addInitScript(value=>localStorage.setItem('hub-core2-home-network-v1',JSON.stringify(value)),M.initial(M.specification('wifi',2)));
  for(const base of [origin+'/',origin+prefix+'/']){
   await page.goto(base+appPath);
   for(const width of [1440,768,390,320]){
    await page.setViewportSize({width,height:1000});
    for(const id of ['pc1','pc2','router','ap','vpn','guest','printer','internet','archive']){
     await page.locator(`[data-device="${id}"]`).tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No overflow: ${id}/${width}`);
     const names=await page.locator('#inspection input:not([type=checkbox]), #inspection select, #inspection button').evaluateAll(nodes=>nodes.filter(n=>!n.disabled).map(n=>({id:n.id,rect:n.getBoundingClientRect()})));
     assert.ok(names.every(({rect:r})=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width),`Controls fit: ${id}/${width}`);
    }
    await page.locator('#lesson-tab').tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#activity-tab').tap();
    if(process.env.PBQ_SCREENSHOT_DIR&&[1440,390].includes(width)&&base.includes(prefix)){
     await fs.mkdir(process.env.PBQ_SCREENSHOT_DIR,{recursive:true});await page.locator('[data-device="ap"]').tap();await page.screenshot({path:path.join(process.env.PBQ_SCREENSHOT_DIR,`home-network-${width}.png`),fullPage:true});
    }
   }
   const nav=page.locator('[data-pbq-nav-container]');assert.equal(await nav.count(),1);assert.ok(await nav.evaluate(n=>n.getBoundingClientRect().top<document.querySelector('.topbar').getBoundingClientRect().bottom));
   for(const link of await nav.locator('a').evaluateAll(nodes=>nodes.map(n=>n.href)))assert.equal((await page.request.get(link)).status(),200);
  }
  await context.close();
  const integration=await browser.newContext();await integration.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());const hub=await integration.newPage();hub.on('pageerror',e=>errors.push(e.message));
  await hub.goto(origin+prefix+'/practice/pbqs/');await hub.locator('#pbq-certification').selectOption('a-plus-core-2');await hub.locator('[data-pbq-id="home-network-configuration"]').waitFor();assert.equal(await hub.locator('[data-pbq-id]').count(),1);await hub.locator('.pbq-library-launch').click();assert.equal(hub.url(),origin+prefix+'/'+appPath);
  await hub.locator('[data-pbq-nav="certification"]').click();await hub.waitForURL(origin+prefix+'/practice/pbqs/a-plus-core-2/');await hub.locator('.hub-page').getByRole('link',{name:'Home Network Configuration & Troubleshooting',exact:true}).click();const launch=hub.getByRole('link',{name:'Launch Home Network Configuration & Troubleshooting PBQ'});const href=await launch.getAttribute('href');assert.equal(href,'https://thearchitechnique.github.io'+prefix+'/'+appPath);await hub.goto(origin+new URL(href).pathname);assert.equal(hub.url(),origin+prefix+'/'+appPath);
  await hub.goto(origin+prefix+'/certifications/comptia/a-plus-core-2/');await hub.locator('.hub-page').getByRole('link',{name:'Home Network Configuration & Troubleshooting',exact:true}).click();assert.ok(hub.url().endsWith('/home-network-configuration/'));
  await integration.close();assert.deepEqual(errors,[],'No uncaught browser errors');
  console.log(`PASS: ${cases} UI solutions; partial/full scoring, command lifecycle, saved state, retry/reset/new ticket, tab/device keyboard controls, touch, 1440/768/390/320 layouts, root/subpath hosting, catalog discovery, Core 2 visibility, and navigation.`);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
async function selectState(page,id){return page.locator('#'+id).inputValue();}
