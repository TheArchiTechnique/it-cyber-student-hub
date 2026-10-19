// Tests the real article and generated navigation at the GitHub Pages subpath.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'site');
const prefix = '/it-cyber-student-hub/';
const lab = 'labs/it-support/linux-mint-command-line/';
const title = 'Linux Mint Workstation Setup and Troubleshooting';
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) throw Error('Outside project');
    let target = path.resolve(site, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (!target.startsWith(site + path.sep) && target !== site) throw Error('Invalid path');
    if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.end(await fs.readFile(target));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  const source = await fs.readFile(path.join(root, 'docs/labs/it-support/linux-mint-command-line/README.md'), 'utf8');
  const objectives = await fs.readFile(path.join(root, 'docs/certifications/comptia/a-plus-core-2/objective-breakdown.md'), 'utf8');
  const objective = objectives.split('### 1.9 Linux features and tools')[1].split('#### Configuration files')[0];
  for (const match of objective.matchAll(/^\| `([^`]+)` \|/gm)) {
    assert.ok(new RegExp(`\\b${match[1]}\\b`).test(source), `Objective tool ${match[1]} is covered`);
  }
  const blocks = [...source.matchAll(/```bash\n([\s\S]*?)```/g), ...source.matchAll(/<code class="language-bash">([\s\S]*?)<\/code>/g)].map(m => m[1]);
  for (const code of blocks) {
    if (process.platform !== 'win32') {
      const syntax = spawnSync('bash', ['-n'], {input: code, encoding: 'utf8'});
      assert.equal(syntax.status, 0, syntax.stderr);
    }
    for (const line of code.trim().split('\n')) {
      if (/^(cp|mv|rm|chmod|touch|mkdir)\b/.test(line)) {
        assert.ok(line.includes('$HOME/APlus-Linux-Lab'), `File operation stays within lab: ${line}`);
        assert.ok(!/\s-[^ ]*[rfR]/.test(line), 'No recursive/force operations');
      }
      if (line.startsWith('rm ')) assert.equal(line, 'rm -i "$HOME/APlus-Linux-Lab/Working/CaseDemo/REPORT.txt"');
      if (line.startsWith('fsck ')) assert.equal(line, 'fsck --help');
      if (line.startsWith('mount ')) assert.equal(line, 'mount -t ext4');
      if (line.startsWith('sudo ')) assert.ok(/^sudo (whoami$|apt (update$|install traceroute$))/.test(line));
      assert.ok(!/^(su|chown|dnf)\b/.test(line), 'Recognition operations are not executable exercise blocks');
      assert.ok(!/[>]+\s*["']?\/etc\//.test(line), 'No configuration-file writes');
    }
  }
  for (const help of ['man ls', 'ls --help', 'help cd', 'type cd', 'command -v nano', 'man -k network', 'man 5 passwd', 'man 5 fstab', 'Ctrl+G']) assert.ok(source.includes(help), help);
  assert.ok(source.includes('APlus-Core2-Before-Lab') && source.includes('APlus-Core2-After-Lab'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = origin + prefix;
  const browser = await chromium.launch({executablePath: process.env.PBQ_CHROMIUM_PATH || undefined, args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const scheme of ['default','slate']) {
        const response = await page.goto(base + lab);
        assert.equal(response.status(), 200);
        await page.locator('body').evaluate((node,value)=>node.setAttribute('data-md-color-scheme',value),scheme);
        assert.equal(await page.locator('h1').textContent(), title);
        assert.equal(await page.locator('.hub-article').count(), 1);
        assert.equal(await page.locator('.hub-landing').count(), 0);
        const stages = (await page.locator('.hub-article h2').allTextContents()).filter(s=>/^\d+\./.test(s));
        assert.equal(stages.length,13);
        assert.deepEqual(stages.map(s=>Number(s.split('.')[0])),Array.from({length:13},(_,i)=>i+1));
        for (const summary of await page.locator('.hub-article details > summary').all()) {
          await summary.focus(); await page.keyboard.press('Enter');
          assert.equal(await summary.evaluate(node=>node.parentElement.open),true);
        }
        const ids=await page.locator('.hub-article [id]').evaluateAll(nodes=>nodes.map(n=>n.id));
        assert.equal(new Set(ids).size,ids.length,'Unique article and code anchors');
        const images=page.locator('.hub-article img');
        assert.equal(await images.count(),2);
        await images.evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
        assert.deepEqual(await images.evaluateAll(nodes=>nodes.filter(n=>!n.alt||!n.naturalWidth).map(n=>n.src)),[]);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        assert.equal(await page.locator('.hub-article pre, .hub-article img').evaluateAll(nodes=>nodes.filter(n=>{
          const b=n.getBoundingClientRect();return b.left<0||b.right>innerWidth+1;
        }).length),0,'Code and diagrams stay inside the viewport');
        for (const href of await images.evaluateAll(nodes=>nodes.map(n=>n.closest('a').href))) assert.equal((await page.request.get(href)).status(),200);
        if(process.env.LINUX_LAB_QA_DIR){
          await fs.mkdir(process.env.LINUX_LAB_QA_DIR,{recursive:true});
          await page.goto(base+lab);
          await page.locator('body').evaluate((node,value)=>node.setAttribute('data-md-color-scheme',value),scheme);
          await page.screenshot({path:path.join(process.env.LINUX_LAB_QA_DIR,`lab-${width}-${scheme}.png`)});
          await page.locator('.hub-article img').first().screenshot({path:path.join(process.env.LINUX_LAB_QA_DIR,`snapshots-${width}-${scheme}.png`)});
        }
      }
    }
    await page.goto(base);
    await page.locator('.hub-page').getByRole('link',{name:'Labs',exact:true}).click();
    await page.locator('.hub-page').getByRole('link',{name:'IT Support',exact:true}).click();
    await page.locator('.hub-page').getByRole('link',{name:title,exact:true}).click();
    assert.equal(page.url(),base+lab);
    for(const source of ['certifications/comptia/a-plus-core-2/','labs/it-support/virtualbox-linux-mint/','reference/linux-commands/']){
      await page.goto(base+source);
      const link=page.locator('.hub-page').getByRole('link',{name:title,exact:true});
      assert.equal(await link.count(),1);
      await link.click();assert.equal(page.url(),base+lab);
    }
    await page.goto(base+lab);
    for(const href of await page.locator('.hub-article a').evaluateAll(nodes=>nodes.map(n=>n.href).filter(h=>h.startsWith(location.origin)))){
      const url=new URL(href),response=await page.request.get(href);assert.equal(response.status(),200,href);
      if(url.hash) {await page.goto(href);assert.equal(await page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).count(),1);}
    }
    await page.goto(base+'reference/');
    const heading=page.getByRole('heading',{name:'Command-Line Tools',exact:true});
    assert.equal(await heading.count(),1);
    for(const name of ['Windows Command-Line Reference','Linux Command-Line Reference']){
      const link=page.locator('.hub-page').getByRole('link',{name,exact:true});
      assert.equal(await link.count(),1);
      assert.ok(await link.evaluate(node=>!!(node.compareDocumentPosition(document.querySelector('#command-line-tools'))&Node.DOCUMENT_POSITION_PRECEDING)));
    }
    const ports=page.locator('.hub-page').getByRole('link',{name:'Ports & Protocols',exact:true});
    assert.ok(await ports.evaluate(node=>!!(node.compareDocumentPosition(document.querySelector('#command-line-tools'))&Node.DOCUMENT_POSITION_FOLLOWING)));
    const search=await(await page.request.get(base+'search/search_index.json')).json();
    assert.ok(search.docs.some(d=>d.location.startsWith(lab)&&/workstation-report/.test(d.text)));
    for(const route of ['reference/powershell-commands/','learn/operating-systems/','tools/linux/']){
      assert.equal((await page.request.get(base+route)).status(),404);
      assert.ok(!search.docs.some(d=>d.location.startsWith(route)));
    }
    assert.deepEqual(errors,[]);
    console.log(`PASS: 13-stage lab; objective/native-help coverage; ${blocks.length} Bash syntax checks; bounded operations; keyboard hints; images; 1440/390/320px light/dark; discovery, contextual links, Command-Line Tools grouping, search, and hidden resources. No live Mint or VirtualBox execution.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
