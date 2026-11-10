import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import * as M from '../docs/labs/networking/subnetting/app/engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'student-hub-network-plus-subnetting-v1';
// Independent expected blocks, including both address-space extremes and octet transitions.
const fixtures = [
  ['10.171.13.5',12,'255.240.0.0','10.160.0.0','10.175.255.255','10.160.0.1','10.175.255.254',1048576,1048574],
  ['10.42.200.9',16,'255.255.0.0','10.42.0.0','10.42.255.255','10.42.0.1','10.42.255.254',65536,65534],
  ['172.20.7.201',22,'255.255.252.0','172.20.4.0','172.20.7.255','172.20.4.1','172.20.7.254',1024,1022],
  ['172.16.5.200',23,'255.255.254.0','172.16.4.0','172.16.5.255','172.16.4.1','172.16.5.254',512,510],
  ['192.168.8.206',24,'255.255.255.0','192.168.8.0','192.168.8.255','192.168.8.1','192.168.8.254',256,254],
  ['192.168.30.179',25,'255.255.255.128','192.168.30.128','192.168.30.255','192.168.30.129','192.168.30.254',128,126],
  ['192.168.10.130',26,'255.255.255.192','192.168.10.128','192.168.10.191','192.168.10.129','192.168.10.190',64,62],
  ['192.168.50.173',27,'255.255.255.224','192.168.50.160','192.168.50.191','192.168.50.161','192.168.50.190',32,30],
  ['10.20.30.77',28,'255.255.255.240','10.20.30.64','10.20.30.79','10.20.30.65','10.20.30.78',16,14],
  ['172.16.254.219',29,'255.255.255.248','172.16.254.216','172.16.254.223','172.16.254.217','172.16.254.222',8,6],
  ['192.0.2.253',30,'255.255.255.252','192.0.2.252','192.0.2.255','192.0.2.253','192.0.2.254',4,2],
  ['192.0.2.10',31,'255.255.255.254','192.0.2.10',null,'192.0.2.10','192.0.2.11',2,2],
  ['192.0.2.10',32,'255.255.255.255','192.0.2.10',null,'192.0.2.10','192.0.2.10',1,1],
  ['255.255.255.255',0,'0.0.0.0','0.0.0.0','255.255.255.255','0.0.0.1','255.255.255.254',4294967296,4294967294],
  ['255.255.255.255',32,'255.255.255.255','255.255.255.255',null,'255.255.255.255','255.255.255.255',1,1]
];
const addressBits = address => address.split('.').map(value => Number(value).toString(2).padStart(8,'0'));
function fixtureWork(fixture) {
  const [ip,prefix,mask,network,broadcast,first,last,total,usable] = fixture;
  const upper = broadcast || last;
  const wildcard = mask.split('.').map(value => 255 - Number(value)).join('.');
  return {...M.freshWork(),ip,prefix,
    binary:{ip:addressBits(ip),mask:addressBits(mask),network:addressBits(network),wildcard:addressBits(wildcard),broadcast:addressBits(upper)},
    answers:{mask,network,broadcast:broadcast || 'N/A',first,last,total:String(total),usable:String(usable)}};
}

for (let value = 0; value <= 255; value++) {
  const binary = M.decimalToBinary(value);
  assert.equal(binary.length,8);
  assert.equal([...binary].reduce((sum,bit,i)=>sum + Number(bit) * 2 ** (7-i),0),value);
  assert.equal(M.binaryToDecimal(binary),value);
}
for (const f of fixtures) {
  const [ip,prefix,mask,network,broadcast,first,last,total,usable] = f;
  const r = M.calculate(ip,prefix);
  assert.deepEqual([r.mask,r.network,r.broadcast,r.first,r.last,r.total,r.usable],[mask,network,broadcast,first,last,total,usable],`${ip}/${prefix}`);
  assert.deepEqual(M.calculate(ip,mask),r,'Dotted mask and CIDR share the same engine');
  const w = fixtureWork(f);
  for (let i = 0; i < 8; i++) assert.equal(M.checkStep(w,i).correct,true,`Correct step ${i} for /${prefix}`);
  assert.deepEqual(M.binaryOperation(r.binary.ip,r.binary.mask,'AND'),r.binary.network);
  assert.deepEqual(M.binaryOperation(r.binary.network,r.binary.wildcard,'OR'),r.binary.broadcast);
  assert.equal(M.toNumber(r.network) + M.toNumber(r.wildcard),M.toNumber(r.upperAddress),'Addition and OR match');
  assert.equal(M.toNumber(r.upperAddress)-M.toNumber(r.network)+1,total);
  assert.ok(M.toNumber(ip)>=M.toNumber(r.network) && M.toNumber(ip)<=M.toNumber(r.upperAddress));
}
// Every mask and every individual bit, including prefixes outside the initial examples.
for (let prefix = 0; prefix <= 32; prefix++) {
  const mask = M.prefixToMask(prefix);
  assert.equal(M.maskToPrefix(mask),prefix);
  assert.equal(addressBits(mask).join(''),'1'.repeat(prefix)+'0'.repeat(32-prefix));
  for (const ip of ['0.0.0.0','127.255.255.255','128.0.0.0','203.0.113.99','255.255.255.255']) {
    const r=M.calculate(ip,prefix);
    const actual=M.binaryOperation(addressBits(ip),addressBits(mask),'AND').map(bits=>Number.parseInt(bits,2)).join('.');
    assert.equal(actual,r.network,'Bit-by-bit AND agrees with block arithmetic');
  }
}
const solved = fixtureWork(fixtures[6]);
for (const row of Object.keys(solved.binary)) {
  const index = M.STEPS.findIndex(step => step.binary.includes(row));
  for (let octet = 0; octet < 4; octet++) for (let bit = 0; bit < 8; bit++) {
    const copy = structuredClone(solved), bits = [...copy.binary[row][octet]];
    bits[bit] = bits[bit] === '1' ? '0' : '1'; copy.binary[row][octet] = bits.join('');
    const report = M.checkStep(copy,index);
    assert.equal(report.correct,false);
    assert.deepEqual(report.issues.map(issue=>[issue.field,issue.bits]),[[`${row}-${octet}`,[bit]]],'One incorrect bit is localized without giving its answer');
  }
}
for (const field of Object.keys(solved.answers)) {
  const copy = structuredClone(solved); copy.answers[field]='incorrect';
  const index=M.STEPS.findIndex(step=>step.answers.includes(field));
  assert.equal(M.checkStep(copy,index).issues.length,1);
  assert.equal(M.checkStep(copy,index).issues[0].field,`answer-${field}`);
}
const blank = M.freshWork();
assert.equal(M.checkStep(blank,0).issues.length,5);
assert.equal(M.checkStep({...solved,answers:{...solved.answers,total:'6.4e1'}},7).correct,false);
const grouped=fixtureWork(fixtures[1]); grouped.answers.total='65,536'; grouped.answers.usable='65,534';
assert.equal(M.checkStep(grouped,7).correct,true);
for (const value of [-1,256,1.5,NaN,'13']) assert.throws(()=>M.decimalToBinary(value));
for (const value of ['101','01010102','111111111','abcdefgh',null]) assert.throws(()=>M.binaryToDecimal(value));
for (const value of ['1.2.3','1.2.3.256','1.2.-1.0','1.2.3.4/24','1.2.3.4.5','1e2.2.3.4','',null]) assert.throws(()=>M.parseIPv4(value));
for (const value of ['/-1','/33','24.5','26abc','255.0.255.0','255.255.250.0','0x18','']) assert.throws(()=>M.parsePrefix(value));
for (const value of [-1,2**32,NaN,1.5]) assert.throws(()=>M.fromNumber(value));
assert.throws(()=>M.binaryOperation(['00000000'],['00000000'],'AND'));
assert.throws(()=>M.binaryOperation(solved.binary.ip,solved.binary.mask,'XOR'));
for (const raw of [null,[],false,{}, {version:99}, {version:1,ip:'bad',prefix:24}, {version:1,ip:'1.2.3.4',prefix:'24'}]) assert.deepEqual(M.sanitizeWork(raw),M.freshWork());
const malicious=M.sanitizeWork({...blank,step:99,binary:{ip:['<script>',{},null,'0']},answers:{mask:{bad:true}},attempted:[0,0,8,-1,'3'],verified:[0,1,'x']});
assert.equal(malicious.step,0); assert.deepEqual(malicious.attempted,[0]); assert.deepEqual(malicious.verified,[0]);
assert.equal(malicious.answers.mask,''); assert.equal(malicious.binary.ip[1],'');
assert.deepEqual(M.sanitizeWork({...solved,mode:'independent',step:7,attempted:[0,7],verified:[7]}),{...solved,mode:'independent',step:7,attempted:[0,7],verified:[7]});
const source=await fs.readFile(path.join(root,'docs/labs/networking/subnetting/app/index.html'),'utf8');
assert.ok(source.includes('192.168.10.130/26') && source.includes('172.16.5.200/23'));
assert.equal((source.match(/id="lesson-(binary|mask|ip|and|broadcast|range|capacity|example)"/g)||[]).length,8);
console.log('PASS: IPv4 engine, all octet conversions, every prefix /0–/32, independent expected blocks, all 160 bit-error locations, mask validation, counts, special cases, saved-state validation.');

if (process.argv.includes('--browser')) await browserChecks();

async function browserChecks() {
  const {chromium} = createRequire(import.meta.url)('playwright');
  const site=path.join(root,'site'), prefix='/it-cyber-student-hub/';
  const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
  const server=http.createServer(async(request,response)=>{
    try {
      const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      assert.ok(pathname.startsWith(prefix));
      let file=path.resolve(site,pathname.slice(prefix.length));
      assert.ok(file.startsWith(site+path.sep)||file===site);
      if ((await fs.stat(file)).isDirectory()) file=path.join(file,'index.html');
      response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      response.end(await fs.readFile(file));
    } catch {response.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.PBQ_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
    const origin=`http://127.0.0.1:${server.address().port}`;
    const base=origin+prefix, url=base+'labs/networking/subnetting/app/';
    const context=await browser.newContext();
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    async function start(hash='workspace') {
      await page.goto(url+'#'+hash);
      // Navigating to the same fragment can stay in the current document. Storage
      // recovery must exercise a full app startup, including module evaluation.
      await page.reload();
      await page.locator('#given-ip').waitFor({state:'attached'});
      await page.waitForFunction(()=>document.getElementById('current-example').textContent.length>0);
    }
    async function fresh() {await page.evaluate(key=>localStorage.removeItem(key),KEY); await start();}
    async function paste(row,value) {
      const input=page.locator(`#${row}-0`); await input.focus();
      await input.evaluate((node,text)=>{const data=new DataTransfer();data.setData('text/plain',text);node.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},value);
    }
    async function fillWork(fixture) {
      const w=fixtureWork(fixture);
      for (const [row,values] of Object.entries(w.binary)) await paste(row,values.join('.'));
      for (const [key,value] of Object.entries(w.answers)) await page.locator(`#answer-${key}`).fill(value);
    }
    async function setGiven(ip,prefix) {
      await page.locator('#given-ip').fill(ip); await page.locator('#given-prefix').fill(String(prefix));
      await page.getByRole('button',{name:'Use these values',exact:true}).click();
      if (await page.locator('#replace-dialog').isVisible()) await page.locator('#confirm-replace').click();
    }
    await start('lesson');
    assert.equal(await page.locator('#lesson').isVisible(),true);
    assert.equal(await page.locator('#reference').isVisible(),false);
    await page.locator('#lesson-tab').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#workspace-tab').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('.binary-input').count(),20);
    assert.equal(await page.locator('.binary-input').evaluateAll(nodes=>nodes.every(node=>node.value==='')),true);
    assert.equal(await page.locator('#show-solution').isDisabled(),true);
    await page.locator('#check').click();
    assert.match(await page.locator('#feedback').innerText(),/eight digits/);
    assert.equal(await page.locator('#mask-0').getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('#show-solution').isEnabled(),true);
    await page.locator('#show-solution').click();
    assert.match(await page.locator('#solution').innerText(),/255.255.255.224/);
    assert.equal(await page.locator('#mask-0').inputValue(),'','Solution never fills entries');
    await page.locator('#mask-0').focus();
    await page.keyboard.type('11111111');
    await page.locator('#mask-1').fill('11111111'); await page.locator('#mask-2').fill('11111111');
    await page.locator('#mask-3').fill('11110000'); await page.locator('#answer-mask').fill('255.255.255.224');
    await page.locator('#check').click();
    assert.match(await page.locator('#feedback').innerText(),/Octet 4: recheck bit position 4/);
    assert.equal(await page.locator('#mask-3-strip .bit-error').count(),1);
    await page.locator('#mask-3').focus();
    await page.locator('[data-bit="3"]').focus();
    assert.equal(await page.locator('.active-bit').count(),5,'One matching position is highlighted across every row');
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#mask-3').inputValue(),'11100000');
    await page.locator('#check').click();
    assert.match(await page.locator('#progress-text').innerText(),/1 of 8/);
    await page.locator('#next-step').click();
    assert.equal(await page.locator('#show-solution').isDisabled(),true,'An attempt for another step does not reveal this one');
    await paste('ip','11000000101010000011001010101101');
    assert.equal(await page.locator('#ip-3').inputValue(),'10101101');
    await page.locator('#check').click();
    assert.match(await page.locator('#progress-text').innerText(),/2 of 8/);
    await page.locator('#review-step').click();
    assert.equal(await page.locator('#lesson').isVisible(),true);
    await page.locator('#workspace-tab').click();
    assert.equal(await page.locator('#ip-3').inputValue(),'10101101');
    await page.locator('#reference-tab').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('#lesson-tab').getAttribute('aria-selected'),'true');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#reference-tab').getAttribute('aria-selected'),'true');
    const referenceRows=await page.locator('#cidr-reference tbody tr').allTextContents();
    assert.equal(referenceRows.length,12);
    for (const row of await page.locator('#cidr-reference tbody tr').all()) {
      const [cidr,mask,total,usable]=await row.locator('td').allTextContents();
      const r=M.calculate('10.0.0.1',cidr);
      assert.deepEqual([mask,Number(total.replaceAll(',','')),Number(usable.replaceAll(',',''))],[r.mask,r.total,r.usable]);
    }
    await page.locator('#workspace-tab').click(); await page.reload();
    await page.waitForFunction(()=>document.getElementById('ip-3')?.value==='10101101');
    assert.match(await page.locator('#progress-text').innerText(),/2 of 8/);
    await page.locator('#reset').click(); await page.locator('#cancel-replace').click();
    assert.equal(await page.locator('#ip-3').inputValue(),'10101101');
    await page.locator('#reset').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#ip-3').inputValue(),'10101101');
    await page.locator('#reset').click(); await page.locator('#confirm-replace').click();
    assert.equal(await page.locator('#ip-3').inputValue(),'');
    assert.match(await page.locator('#current-example').innerText(),/192.168.50.173\/27/);
    await fillWork(fixtures[7]);
    for (let i=0;i<8;i++) {
      const step=page.locator('#step-list button').nth(i);
      await step.focus(); await page.keyboard.press('Enter');
      assert.equal(await step.evaluate(node=>node===document.activeElement),true,'Step controls retain keyboard focus');
      await page.locator('#check').click();
      assert.match(await page.locator('#progress-text').innerText(),new RegExp(`${i+1} of 8`));
    }
    await page.locator('#answer-total').fill('33');
    assert.match(await page.locator('#progress-text').innerText(),/7 of 8/);
    await page.locator('#answer-total').fill('32');
    assert.match(await page.locator('#progress-text').innerText(),/7 of 8/,'Editing requires rechecking to complete a step again');
    await page.locator('#check').click();
    assert.match(await page.locator('#progress-text').innerText(),/8 of 8/);
    // Run complete calculations through real controls, using independent fixture answers.
    await page.locator('#mode').selectOption('independent');
    assert.equal(await page.locator('#step-help').isVisible(),false);
    assert.equal(await page.locator('#check').innerText(),'Check Work');
    for (const fixture of fixtures.slice(0,13)) {
      await setGiven(fixture[0],fixture[1]); await fillWork(fixture);
      await page.locator('#check').click();
      assert.match(await page.locator('#progress-text').innerText(),/8 of 8/);
      assert.equal(await page.locator('[aria-invalid=true]').count(),0,`No invalid fields for /${fixture[1]}`);
    }
    await page.locator('#show-solution').click();
    assert.match(await page.locator('#solution').innerText(),/N\/A/);
    await page.locator('#new-example').click(); await page.locator('#confirm-replace').click();
    assert.match(await page.locator('#current-example').innerText(),/172.16.5.200\/23/);
    assert.equal(await page.locator('#answer-network').inputValue(),'');
    await page.locator('#given-ip').fill('192.168.1.999'); await page.locator('#given-form button').click();
    assert.match(await page.locator('#given-error').innerText(),/0 to 255/);
    await page.locator('#given-ip').fill('192.168.1.1'); await page.locator('#given-prefix').fill('255.0.255.0'); await page.locator('#given-form button').click();
    assert.match(await page.locator('#given-error').innerText(),/consecutive/);
    await setGiven('192.168.10.130','255.255.255.192');
    assert.match(await page.locator('#current-example').innerText(),/\/26/);
    await page.locator('#mode').selectOption('guided');
    await page.locator('#mask-0').fill('11111112'); await page.locator('#check').click();
    assert.match(await page.locator('#feedback').innerText(),/only 0 and 1/);
    await paste('mask','11111111.11111111.11111111');
    assert.match(await page.locator('#feedback').innerText(),/exactly four groups/);
    assert.equal(await page.locator('#mask-0').inputValue(),'11111112');
    // Corrupt/unsupported saved data recovers safely. Denied storage leaves a usable workspace.
    await page.evaluate(key=>localStorage.setItem(key,'{invalid json'),KEY); await start();
    assert.match(await page.locator('#current-example').innerText(),/192.168.50.173\/27/);
    await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked');};Storage.prototype.setItem=()=>{throw new Error('blocked');};});
    await start(); assert.match(await page.locator('#save-note').innerText(),/unavailable/);
    await page.locator('#ip-0').fill('11000000'); await page.locator('#reference-tab').click(); await page.locator('#workspace-tab').click();
    assert.equal(await page.locator('#ip-0').inputValue(),'11000000');
    // Preserve the worksheet's geometry at narrow widths instead of wrapping any 32-bit row.
    for (const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:960});
      for (const section of ['lesson','workspace','reference']) {
        await page.locator(`#${section}-tab`).click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${section} fits ${width}px`);
      }
      await page.locator('#workspace-tab').click();
      const rectangles=await page.locator('.binary-input').evaluateAll(nodes=>nodes.map(node=>({x:node.getBoundingClientRect().x,width:node.getBoundingClientRect().width})));
      for (let row=1;row<5;row++) for (let octet=0;octet<4;octet++) {
        assert.equal(rectangles[row*4+octet].x,rectangles[octet].x,'Every binary octet aligns vertically');
        assert.equal(rectangles[row*4+octet].width,rectangles[octet].width);
      }
      if (width<815) assert.equal(await page.locator('.binary-scroll').evaluate(node=>node.scrollWidth>node.clientWidth),true);
    }
    assert.deepEqual(errors,[]);
    await context.close();
    const noJS=await browser.newContext({javaScriptEnabled:false});
    const staticPage=await noJS.newPage(); await staticPage.goto(url);
    assert.equal(await staticPage.locator('#lesson').isVisible(),true);
    assert.equal(await staticPage.locator('#reference').isVisible(),true);
    await noJS.close();
    console.log('PASS: built project-subpath app, guided and independent modes, binary typing/paste/toggle, exact error feedback, gated solutions, 13 complete subnet fixtures, reference values, persistence, reset/cancel/retry/new example, malformed/blocked storage, keyboard tabs, /31 and /32, 1440/768/390/320px alignment and overflow, no-JS reading.');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
