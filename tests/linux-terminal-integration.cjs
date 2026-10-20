// Run inside the original terminal harness, with the same built Pages subpath.
const assert = require('node:assert/strict');
module.exports = async ({browser, base: localBase, route}) => {
  // Serve this branch's built files at the real Pages origin so the existing
  // canonical absolute launch-link convention is tested without live-site traffic.
  const base = 'https://thearchitechnique.github.io/it-cyber-student-hub/';
  const origin = new URL(base).origin;
  const localURL = url => localBase + new URL(url).pathname.slice(new URL(base).pathname.length) + new URL(url).search;
  const intercept = async request => {
    if (new URL(request.request().url()).origin !== origin) return request.abort();
    const response = await request.fetch({url: localURL(request.request().url())});
    return request.fulfill({response});
  };
  const overview = 'practice/linux-terminal-simulator/';
  const context = await browser.newContext({viewport: {width:1440,height:1000}});
  await context.route('**/*', intercept);
  const page = await context.newPage(), errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (new URL(response.url()).origin === origin && response.status() >= 400) missing.push(response.url()); });
  const go = async target => { assert.equal((await page.goto(base + target)).status(), 200); };
  const follow = async (name, target) => {
    await page.locator('.hub-page').getByRole('link', {name,exact:true}).click();
    await page.waitForURL(base + target);
  };
  const launch = async () => { await follow('Launch Linux Terminal Simulator', route); await page.locator('#command').waitFor(); };
  const run = async command => { await page.locator('#command').fill(command); await page.locator('#command').press('Enter'); await page.waitForFunction(() => document.getElementById('command').value === ''); };
  const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('student-hub:linux-terminal:v1')));
  await go('certifications/comptia/a-plus-core-2/');
  await follow('Linux Terminal Simulator', overview);
  assert.equal(await page.locator('.hub-page h1').textContent(), 'Linux Terminal Simulator');
  // Search is the existing Material search UI, not a test-only replacement.
  for (const query of ['Linux terminal', 'Linux commands', 'command-line practice']) {
    await go(overview);
    await page.locator('input[data-md-component="search-query"]').click();
    await page.locator('input[data-md-component="search-query"]').fill('');
    await page.locator('input[data-md-component="search-query"]').pressSequentially(query);
    const result = page.locator('.md-search-result__link[href*="/practice/linux-terminal-simulator/"]');
    await page.locator('.md-search-result__link').first().waitFor();
    await page.waitForFunction(query => [...document.querySelectorAll('.md-search-result__link')].some(link => new URL(link.href).searchParams.get('h') === query.toLowerCase().replaceAll('-', ' ')), query);
    await result.first().waitFor();
    assert.ok((await result.first().getAttribute('href')).includes(overview), query);
  }
  await page.keyboard.press('Escape');
  console.log('PASS: existing Hub search finds the simulator for Linux terminal, Linux commands, and command-line practice.');
  await launch(); await page.locator('#guided-mode').click();
  for (const command of ['pwd','ls','cd /','ls','cd ~','whoami','cat ~/Documents/ticket.txt','man ls']) await run(command);
  await page.locator('#close-manual').click(); await run('help'); await page.locator('#check-guided').click();
  assert.match(await page.locator('#guided-feedback').textContent(), /Stage verified/);
  await page.locator('#guided-stage').selectOption('workspace');
  const workspace = await page.locator('#guided-workspace').textContent();
  for (const command of [`mkdir -p ${workspace}/Working ${workspace}/Reports ${workspace}/Archive`, `cd ${workspace}`, 'touch Working/disposable.txt', 'echo "Technician workspace created" > Working/setup-notes.txt', 'echo "Reports and archives prepared" >> Working/setup-notes.txt', 'cat Working/setup-notes.txt']) await run(command);
  await page.locator('#check-guided').click(); assert.match(await page.locator('#guided-feedback').textContent(), /Stage verified/);
  await page.locator('#guided-stage').selectOption('nano'); await run('nano Reports/workstation-report.txt');
  await page.locator('#nano-buffer').fill('Workstation: student-linux\nTechnician: student\nWorkspace prepared from the Student Hub.');
  await page.locator('#nano-buffer').press('Control+o'); await page.locator('#nano-write-name').press('Enter'); await page.locator('#nano-buffer').press('Control+x');
  await run('cat Reports/workstation-report.txt');
  const saved = await snapshot();
  await page.locator('header nav').getByRole('link',{name:'Student Hub',exact:true}).click(); await page.waitForURL(base);
  await follow('A+ Core 2','certifications/comptia/a-plus-core-2/');
  await follow('Linux Terminal Simulator', overview); await launch();
  const reopened = await snapshot();
  for (const key of ['nodes','progress','cwd','user','history','packages','network']) assert.deepEqual(reopened[key],saved[key], key + ' survives leaving and reopening');
  assert.equal(await page.locator('#guided-stage').inputValue(), 'nano');
  assert.match(await page.locator('#guided-progress-text').textContent(), /2 of 11/);
  await page.locator('#free-mode').click(); await run('man nano'); assert.match(await page.locator('#manual-content').textContent(), /Write Out|Ctrl\+O/); await page.keyboard.press('q');
  await run('cat Reports/workstation-report.txt'); assert.match(await page.locator('#terminal-output').textContent(), /Workspace prepared from the Student Hub/);
  await page.locator('header nav').getByRole('link',{name:'Simulator overview',exact:true}).click(); await page.waitForURL(base + overview);
  await follow('Linux Command-Line Reference','reference/linux-commands/'); await follow('Linux Terminal Simulator',overview);
  await follow('Back to Practice','practice/'); await follow('Linux Terminal Simulator',overview);
  await follow('IT Support Labs','labs/it-support/'); await follow('Linux Terminal Simulator',overview);
  await follow('VirtualBox: Installing Linux Mint','labs/it-support/virtualbox-linux-mint/');
  assert.match(await page.locator('.hub-page h1').textContent(), /Installing Linux Mint/);
  await follow('Linux Mint Workstation Setup and Troubleshooting','labs/it-support/linux-mint-command-line/');
  assert.match(await page.locator('.hub-page').textContent(), /real Linux Mint VM/);
  await follow('Back to IT Support Labs','labs/it-support/');
  await go('certifications/comptia/a-plus-core-2/objective-breakdown/'); await follow('Linux Terminal Simulator',overview);
  // The launch page, source links, and app fit the existing themes on small screens.
  for (const width of [1440,390,320]) for (const scheme of ['default','slate']) {
    await page.setViewportSize({width,height:960});
    await go(overview); await page.locator('body').evaluate((node, scheme) => node.dataset.mdColorScheme = scheme, scheme);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overview ${width}/${scheme}`);
    assert.equal(await page.locator('.hub-page').getByRole('link',{name:'Launch Linux Terminal Simulator',exact:true}).count(),1);
    const hrefs = await page.locator('nav.md-nav--primary a').evaluateAll((nodes,target)=>nodes.filter(n=>n.href===target).map(n=>n.href),base+overview);
    assert.equal(hrefs.length, 1, 'Exactly one primary Practice navigation entry');
    await launch();
    if (await page.locator('body').getAttribute('data-md-color-scheme') !== scheme) await page.locator('#theme-toggle').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `app ${width}/${scheme}`);
    for (const link of await page.locator('header a').evaluateAll(nodes=>nodes.map(n=>n.href))) assert.equal((await page.request.get(localURL(link))).status(),200,link);
  }
  const search = await (await page.request.get(localBase + 'search/search_index.json')).json();
  const documents = search.docs.filter(doc=>doc.location.split('#')[0]===overview);
  assert.equal(new Set(documents.map(doc=>doc.location.split('#')[0])).size,1,'One canonical searchable overview with its section');
  assert.equal(documents.filter(doc=>doc.location===overview).length,1,'One indexed page title');
  assert.match(documents.find(doc=>doc.location===overview).title,/Linux Terminal Simulator/);
  for (const term of ['Linux terminal','Linux commands','command-line practice']) assert.ok(documents.some(doc=>doc.text.includes(term)),term);
  assert.ok(!search.docs.some(doc=>doc.location.startsWith(route)),'Copied app does not duplicate the indexed overview');
  const catalog = await (await page.request.get(localBase + 'assets/data/pbqs.json')).json();
  assert.ok(!JSON.stringify(catalog).includes('linux-terminal-simulator'));
  assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);
  await context.close();
  // Real touch navigation starts from Practice and can return through the overview.
  const touch = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await touch.route('**/*', intercept);
  const mobile = await touch.newPage(); await mobile.goto(base+'practice/');
  await mobile.locator('.hub-page').getByRole('link',{name:'Linux Terminal Simulator',exact:true}).tap();
  await mobile.locator('.hub-page').getByRole('link',{name:'Launch Linux Terminal Simulator',exact:true}).tap();
  await mobile.locator('#guided-mode').tap(); assert.equal(await mobile.locator('#guided-stage').inputValue(),'explore');
  await mobile.locator('header nav').getByRole('link',{name:'Simulator overview',exact:true}).tap();
  await mobile.locator('.hub-page').getByRole('link',{name:'Back to Practice',exact:true}).tap();
  await mobile.waitForURL(base+'practice/'); await touch.close();
  console.log('PASS: published overview and existing search UI, Core 2/Practice/Labs/reference/objective journeys, Hub return/reopen persistence, standalone assets and Pages paths, separate VM sequence, single navigation entry, no PBQ registration, keyboard/touch and 1440/390/320px themes.');
};
