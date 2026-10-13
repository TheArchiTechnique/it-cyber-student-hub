(function () {
  'use strict';
  const M = HomeNetworkModel, $ = id => document.getElementById(id), KEY = 'hub-core2-home-network-v1';
  let state = M.fresh(), confirmKind = 'reset', pendingType = null, returnFocus = null;
  try { const saved = localStorage.getItem(KEY); if (saved) state = M.restore(JSON.parse(saved)); } catch (_) {}
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const labels = { pc1: () => state.spec.names.pc1, pc2: () => state.spec.names.pc2, router: () => 'Office router', ap: () => 'Wireless access point', printer: () => 'Network printer', guest: () => 'Visitor device', vpn: () => 'VPN endpoint', internet: () => 'Internet / portal', archive: () => 'Routed archive' };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = 'Applied settings and progress saved in this browser.'; } catch (_) { $('save-status').textContent = 'Browser storage unavailable. You can continue in this session.'; } }
  function say(message) { $('status').textContent = message; }
  function selectOptions(items, selected, salt = '') {
    return M.shuffled(items, state.spec.seed + [...salt].reduce((n, c) => n + c.charCodeAt(0), 0)).map(([id, label]) => `<option value="${esc(id)}"${String(selected) === String(id) ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }
  function field(id, label, value, type = 'text', full = false) { return `<label class="${full ? 'full' : ''}" for="${id}">${label}<input id="${id}" name="${id}" type="${type}" value="${esc(value)}" maxlength="${type === 'number' ? 5 : 63}" autocomplete="off" spellcheck="false"${type === 'number' ? ' min="1" max="65535" step="1"' : ''}></label>`; }
  function choice(id, label, options, value, full = false) { return `<label class="${full ? 'full' : ''}" for="${id}">${label}<select id="${id}" name="${id}">${selectOptions(options, value, id)}</select></label>`; }
  function check(id, label, value) { return `<label class="check-field" for="${id}"><input type="checkbox" id="${id}" name="${id}"${value ? ' checked' : ''}>${label}</label>`; }
  function details(rows) { return `<dl class="detail-list">${rows.map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>`; }
  function icon(id) {
    const paths = { pc1: '<rect x="4" y="5" width="32" height="23" rx="3"/><path d="M20 28v7m-9 0h18"/>', pc2: '<path d="M6 8h28v22H6zM3 34h34l-3-4H6z"/>',
      router: '<rect x="4" y="17" width="32" height="17" rx="4"/><path d="M9 17V7m22 10V7m-22 18h5m5 0h5"/><circle cx="30" cy="26" r="1"/>',
      ap: '<rect x="9" y="24" width="22" height="10" rx="3"/><path d="M20 24v-7m-10 0a14 14 0 0 1 20 0M5 11a21 21 0 0 1 30 0"/>',
      printer: '<path d="M10 14V5h20v9M10 29H5V15h30v14h-5M10 23h20v12H10zM27 19h3"/>',
      guest: '<rect x="12" y="3" width="17" height="34" rx="4"/><path d="M18 7h5m-3 25v1"/>',
      vpn: '<path d="M20 3l14 6v11c0 8-8 14-14 17C14 34 6 28 6 20V9zM14 20l4 4 9-10"/>',
      internet: '<circle cx="20" cy="20" r="16"/><ellipse cx="20" cy="20" rx="7" ry="16"/><path d="M4 20h32M7 10h26M7 30h26"/>',
      archive: '<rect x="7" y="4" width="26" height="32" rx="3"/><path d="M7 15h26M7 25h26m-20-15h3m-3 10h3m-3 10h3"/>' };
    return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[id]}</svg>`;
  }
  function node(id, info) { return `<button class="device" data-device="${id}" aria-pressed="${state.selected === id}">${icon(M.isWireless(state,id) ? "pc2" : id)}<span><strong>${esc(labels[id]())}</strong><small>${esc(info)}</small></span></button>`; }
  function renderMap() {
    const s = state.spec, pc = id => `${M.isWireless(state, id) ? 'Wi-Fi' : 'Ethernet'} · ${state.pcs[id].ip}`;
    const wired = ['pc1','pc2'].filter(id => !M.isWireless(state,id)), wireless = ['pc1','pc2'].filter(id => M.isWireless(state,id));
    $('topology').innerHTML = `<div class="uplink">${node('internet', s.hostname)}${node('router', 'WAN ' + s.wan + ' · LAN ' + s.gateway)}</div><div class="branches"><div class="network-zone"><h3>Wired LAN</h3><div class="device-stack">${wired.map(id => node(id,pc(id))).join('')}${node('printer', s.printer)}${node('vpn', 'LAN ' + s.vpn)}${node('archive', s.archive + ' · routed')}</div></div><div class="network-zone"><h3>Wireless networks</h3><div class="device-stack">${node('ap', s.ssid + ' / ' + s.guestSSID)}${wireless.map(id => node(id,pc(id))).join('')}${node('guest', s.guestNetwork)}</div></div></div>`;
    $('map-notes').textContent = `Office ${s.network} · Guest ${s.guestNetwork} · VPN clients ${s.vpnNetwork}`;
    for (const button of document.querySelectorAll('[data-device]')) button.onclick = () => { state.selected = button.dataset.device; renderMap(); renderInspection(); save(); $('device-title').focus(); };
  }
  function logEntry(input, output) { const div = document.createElement('div'); div.className = 'terminal-entry'; const prompt = document.createElement('div'); prompt.className = 'terminal-prompt'; prompt.textContent = input; const pre = document.createElement('pre'); pre.textContent = output; div.append(prompt, pre); return div; }
  function renderTerminal(id) {
    const log = $('terminal-output'); if (!log) return;
    log.replaceChildren(logEntry('', `${state.spec.names[id]} command prompt ready. Type help.`));
    for (const item of state.log) log.append(logEntry(item.input,item.output)); log.scrollTop = log.scrollHeight;
    $('command-form').onsubmit = e => {
      e.preventDefault(); const field = $('command'), input = field.value.trim(); if (!input) return;
      const before = state.revision, output = M.command(state,id,input);
      state.log.push({ input: state.spec.names[id] + '> ' + input, output }); state.log = state.log.slice(-24);
      if (state.revision !== before) $('test-output').textContent = 'Configuration changed. Run fresh connection tests.';
      renderMap(); renderInspection(); renderHistory(); renderResults(); save(); $('command').focus();
    };
  }
  const assignment = [['auto','Automatic / DHCP'],['manual','Manual']], modes = [['open','Open'],['wep','WEP'],['wpa2-tkip','WPA2-Personal / TKIP'],['wpa2-aes','WPA2-Personal / AES'],['transition','WPA2/WPA3-Personal transition'],['wpa3','WPA3-Personal / SAE'],['wpa2-enterprise','WPA2-Enterprise / 802.1X'],['wpa3-enterprise','WPA3-Enterprise / 802.1X']];
  const bands = [['2.4','2.4 GHz only'],['5','5 GHz only'],['dual','2.4 and 5 GHz']], protocols = [['TCP','TCP'],['UDP','UDP']];
  function renderInspection() {
    const s = state.spec, id = state.selected, c = state.pcs[id]; let body = '', terminal = '';
    if (c) {
      const wireless = M.isWireless(state,id), conf = M.configuration(state,id);
      body = details([['Adapter',wireless ? 'Wi-Fi' : 'Ethernet · link connected'],['Current address',conf.ip],['Current mask',conf.mask],['Gateway',conf.gateway || 'none'],['DNS server',conf.dns || 'none']]);
      if (wireless) body += details([['Client capability',s.legacy ? '2.4 GHz · WPA2-Personal / AES' : '2.4/5 GHz · WPA2 and WPA3-Personal'],['Association', M.wifiJoined(state,id) ? (c.network === 'main' ? s.ssid : s.guestSSID) : 'Not associated']]);
      body += `<form id="device-form"><h3>Windows adapter settings</h3><div class="fields">${choice('assignment','IPv4 assignment',assignment,c.assignment)}${choice('dns-mode','DNS assignment',assignment,c.dnsMode)}${field('ip','IPv4 address',c.ip)}${field('mask','Subnet mask',c.mask)}${field('gateway','Default gateway',c.gateway)}${field('dns','DNS server',c.dns)}`;
      if (wireless) body += choice('network','Saved wireless network',[['main',s.ssid],['guest',s.guestSSID]],c.network) + field('client-key','Saved passphrase',c.key);
      body += '</div><p class="field-note">Automatic IPv4 uses a DHCP lease. Apply settings, then use ipconfig /renew when an existing automatic client needs a fresh lease.</p><button type="submit">Apply adapter settings</button></form>';
      terminal = `<div class="console-section"><div class="terminal"><div class="terminal-head"><span>${esc(s.names[id])} · Windows terminal</span><span>Simulated</span></div><div id="terminal-output" class="terminal-output" role="log" aria-label="Command output" aria-live="polite" tabindex="0"></div><form id="command-form"><label for="command">Command</label><div class="command-row"><input id="command" maxlength="256" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="Type help"><button type="submit">Run</button></div></form></div></div>`;
    } else if (id === 'router') {
      const r = state.router, f = r.forward;
      body = details([['WAN address',s.wan],['LAN address',s.gateway],['LAN mask',s.mask],['DHCP DNS option',s.gateway],['Inbound policy','Block unsolicited traffic except the enabled mapping'],['NAT / routing','Operational · archive route installed']]);
      body += `<h3>DHCP lease table</h3><div class="table-scroll"><table><thead><tr><th>Address</th><th>Client</th></tr></thead><tbody>${r.occupied.map((n,i) => `<tr><td>${esc(s.base + '.' + n)}</td><td>Reserved lease ${i+1} · active</td></tr>`).join('')}${Object.entries(state.pcs).filter(([,p]) => p.assignment === 'auto' && !p.ip.startsWith('169.254.') && !p.released && p.network === 'main').map(([key,p]) => `<tr><td>${esc(p.ip)}</td><td>${esc(s.names[key])}</td></tr>`).join('') || (!r.occupied.length ? '<tr><td colspan="2">No active dynamic leases</td></tr>' : '')}</tbody></table></div>`;
      body += `<form id="device-form"><h3>LAN DHCP</h3>${check('dhcp','DHCP service enabled',r.dhcp)}<div class="fields">${field('pool-start','Pool start host number',r.poolStart,'number')}${field('pool-end','Pool end host number',r.poolEnd,'number')}</div><p class="field-note">Dynamic clients may use host numbers 100–199 in ${esc(s.network)}. Fixed infrastructure uses addresses below 100.</p><h3>Inbound port mapping</h3>${check('forward','Mapping enabled',f.enabled)}<div class="fields">${choice('forward-protocol','Protocol',protocols,f.protocol)}${field('external-port','WAN port',f.externalPort,'number')}${field('forward-target','Internal address',f.target)}${field('internal-port','Internal port',f.internalPort,'number')}</div><p class="field-note">This router offers one inbound mapping. Outbound browsing does not require an inbound mapping.</p><button type="submit">Apply router settings</button></form>`;
    } else if (id === 'ap') {
      const a = state.ap;
      body = details([['Office SSID',s.ssid],['Guest SSID',s.guestSSID],['Authentication server','No RADIUS / 802.1X server'],['Signal at office','−48 dBm on supported bands'],['Guest DHCP','Operational on guest subnet']]);
      body += `<form id="device-form"><h3>Office wireless</h3><div class="fields">${choice('main-security','Security / authentication',modes,a.mainSecurity)}${choice('main-band','Bands',bands,a.mainBand)}${field('main-key','Office passphrase',a.mainKey,'text',true)}</div><h3>Visitor wireless</h3><div class="fields">${choice('guest-security','Security / authentication',modes,a.guestSecurity)}${choice('guest-band','Bands',bands,a.guestBand)}${field('guest-key','Visitor passphrase',a.guestKey,'text',true)}</div>${check('isolation','Isolate guests from the office LAN and router administration',a.isolation)}<button type="submit">Apply wireless settings</button></form>`;
    } else if (id === 'vpn') {
      const h = state.host;
      body = details([['VPN endpoint',s.vpn],['Listener',`WireGuard · UDP ${s.vpnPort}`],['Client pool',s.vpnNetwork],['Remote client',s.vpnClient],['Authentication','Enrolled client keys available'],['LAN routing','Installed · client source IP preserved'],['Windows target',s.names[s.affected] + ' · ' + state.pcs[s.affected].ip],['Windows edition','Windows 11 Pro'],['Active host profile','Private']]);
      body += `<form id="device-form"><h3>Windows remote access</h3>${check('rdp','Remote Desktop service enabled',h.rdp)}${check('firewall','Windows Firewall enabled',h.firewall)}<h3>Windows inbound service rule</h3>${check('rule','Rule enabled',h.rule)}<div class="fields">${choice('rule-protocol','Protocol',protocols,h.protocol)}${field('rule-port','Local port',h.port,'number')}${choice('rule-profile','Profiles',[['Private','Private'],['Public','Public'],['Domain','Domain'],['Any','All profiles']],h.profile)}${field('rule-scope','Allowed remote source (CIDR or Any)',h.scope)}</div><p class="field-note">These settings belong to the Windows target. Router mapping is configured on the router.</p><button type="submit">Apply Windows access settings</button></form>`;
    } else if (id === 'printer') body = details([['IPv4 address',s.printer],['Mask',s.mask],['Gateway',s.gateway],['Listener','TCP 9100 · printing'],['Status','Powered on · Ethernet connected']]);
    else if (id === 'guest') body = details([['SSID',s.guestSSID],['IPv4 address',s.guestBase + '.120'],['Gateway / DNS',s.guestGateway],['Capabilities','2.4 and 5 GHz · WPA2-Personal / AES'],['Issued passphrase',s.guestKey],['Association',M.wifiJoined(state,'guest') ? 'Associated' : 'Not associated']]);
    else if (id === 'internet') body = details([['Portal name',s.hostname],['Portal address',s.portal],['Service','HTTPS / TCP 443'],['ISP handoff','Operational · public IPv4 WAN'],['Outside test host','192.0.2.60']]);
    else body = details([['Archive name',s.archiveName],['Archive address',s.archive],['Service','SMB / TCP 445'],['Router route','Installed via private transit link'],['Status','Operational']]);
    $('inspection').innerHTML = `<div class="inspection-head"><h2 id="device-title" tabindex="-1">${esc(labels[id]())}</h2><p>Inspect the applied state. Changes take effect when applied.</p></div><div class="inspection-content">${body}</div>${terminal}`;
    if (c) {
      const autoFields = () => { for (const f of ['ip','mask','gateway']) $(f).disabled = $('assignment').value === 'auto'; $('dns').disabled = $('dns-mode').value === 'auto'; };
      $('assignment').onchange = autoFields; $('dns-mode').onchange = autoFields; autoFields(); renderTerminal(id);
    }
    if ($('device-form')) $('device-form').onsubmit = e => {
      e.preventDefault(); let result;
      const value = id => $(id).value.trim(), checked = id => $(id).checked;
      if (c) result = M.applyPC(state,id,{ assignment:value('assignment'),dnsMode:value('dns-mode'),ip:value('ip'),mask:value('mask'),gateway:value('gateway'),dns:value('dns'),network:M.isWireless(state,id)?value('network'):c.network,key:M.isWireless(state,id)?value('client-key'):c.key });
      else if (id === 'router') result = M.applyRouter(state,{dhcp:checked('dhcp'),poolStart:value('pool-start'),poolEnd:value('pool-end'),forward:{enabled:checked('forward'),protocol:value('forward-protocol'),externalPort:value('external-port'),target:value('forward-target'),internalPort:value('internal-port')}});
      else if (id === 'ap') result = M.applyAP(state,{mainSecurity:value('main-security'),mainBand:value('main-band'),mainKey:value('main-key'),guestSecurity:value('guest-security'),guestBand:value('guest-band'),guestKey:value('guest-key'),isolation:checked('isolation')});
      else result = M.applyHost(state,{rdp:checked('rdp'),firewall:checked('firewall'),rule:checked('rule'),protocol:value('rule-protocol'),port:value('rule-port'),profile:value('rule-profile'),scope:value('rule-scope')});
      say(result.message);
      if (result.ok) { $('test-output').textContent = 'Configuration changed. Run fresh connection tests.'; renderMap(); renderInspection(); renderHistory(); renderResults(); save(); $('device-title').focus(); }
      else $('status').scrollIntoView({block:'nearest'});
    };
  }
  function renderHistory() {
    $('test-history').replaceChildren();
    const p = document.createElement('p'); p.textContent = state.tests.length ? 'Checks recorded since the last configuration change:' : 'No verification checks recorded for the current configuration.'; $('test-history').append(p);
    if (state.tests.length) { const list = document.createElement('ul'); for (const t of state.tests) { const li = document.createElement('li'); li.textContent = `${t.key} · ${t.ok ? 'succeeded' : 'failed / blocked'}`; list.append(li); } $('test-history').append(list); }
  }
  function renderResults() {
    $('results').hidden = !state.submitted; if (!state.submitted) { $('results').replaceChildren(); return; }
    const g = M.grade(state);
    $('results').innerHTML = `<div class="results-heading"><div class="score">${g.score} / 100</div><div><h2>${g.score === 100 ? 'Request completed' : 'Review your solution'}</h2><p>Diagnosis, corrective configuration, access, and verification earn separate credit.</p></div></div><div class="review-grid">${g.rows.map(r => `<article class="feedback ${r.correct ? 'good' : ''}"><h3>${esc(r.label)} · ${r.points} / ${r.max}</h3><p>${esc(r.text)}</p></article>`).join('')}</div><div class="review-actions"><button id="retry" class="primary">Continue editing</button></div>`;
    $('retry').onclick = () => { state.submitted = false; renderResults(); save(); $('diagnosis').focus(); say('Continue investigating, then submit again.'); };
  }
  function initialize() {
    const s = state.spec; $('ticket-type').replaceChildren(...M.TYPES.map((type,index) => new Option(`Ticket ${index+1} · ${M.TICKETS[index]}`,type))); $('ticket-type').value = s.type;
    $('ticket').textContent = M.requirements(state);
    $('policy').textContent = s.type === 'wifi' ? `Office clients ${s.legacy ? 'include this WPA2-only, 2.4 GHz-only laptop and modern WPA3 clients; provide both bands while retaining WPA3 for modern clients' : 'support WPA3 and 5 GHz; use 5 GHz only and the strongest compatible Personal mode'}. Visitors support WPA2/AES on 2.4 or 5 GHz; provide both bands and keep their issued passphrase ${s.guestKey}. Office passphrases must have at least 12 characters and differ from the visitor key.` : s.type === 'remote' ? 'The Windows target uses the Private profile. The VPN authenticates enrolled clients and preserves their VPN source addresses. Keep Windows Firewall enabled and limit the inbound application rule to those sources.' : `Office clients use ${s.mask}. The router provides DHCP and the approved DNS resolver. Keep the other client's access working.`;
    $('context').textContent = `Office LAN ${s.network} · Router / DNS ${s.gateway} · Portal ${s.hostname} (${s.portal}) · Archive ${s.archive}`;
    $('diagnosis').replaceChildren(new Option('Choose a diagnosis',''),...M.shuffled(M.ISSUES,s.seed).map(([id,label]) => new Option(label,id))); $('diagnosis').value = state.diagnosis;
    $('test-source').replaceChildren(...[['pc1',s.names.pc1],['pc2',s.names.pc2],['guest','Visitor device'],['vpn-client','Outside client via VPN'],['internet','Outside client without VPN']].map(([id,label]) => new Option(label,id))); $('test-source').value = s.affected;
    $('test-target').value = 'gateway'; $('test-output').textContent = 'No connection test run.';
    renderMap(); renderInspection(); renderHistory(); renderResults(); save();
  }
  $('diagnosis').onchange = () => { state.diagnosis = $('diagnosis').value; state.submitted = false; renderResults(); save(); };
  $('connection-form').onsubmit = e => { e.preventDefault(); const result = M.test(state,$('test-source').value,$('test-target').value); $('test-output').textContent = result.message; renderHistory(); renderResults(); save(); };
  $('submit').onclick = () => { state.submitted = true; renderResults(); save(); say(`Solution checked: ${M.grade(state).score} of 100.`); $('results').focus(); $('results').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };
  function confirm(kind, type) {
    confirmKind = kind; pendingType = type; returnFocus = kind === 'ticket' ? $('ticket-type') : $(kind === 'reset' ? 'reset' : 'new-scenario');
    $('confirm-title').textContent = kind === 'reset' ? 'Reset this scenario?' : 'Start another scenario?';
    $('confirm-description').textContent = kind === 'reset' ? 'Restore this ticket’s starting settings and clear commands, diagnosis, verification, and results.' : 'Replace the current investigation and clear its progress.';
    $('confirm-action').textContent = kind === 'reset' ? 'Reset' : 'Start scenario'; $('confirm').showModal(); $('keep').focus();
  }
  $('reset').onclick = () => confirm('reset'); $('new-scenario').onclick = () => confirm('new');
  $('ticket-type').onchange = () => { const type = $('ticket-type').value; $('ticket-type').value = state.spec.type; confirm('ticket',type); };
  $('keep').onclick = () => $('confirm').close();
  $('confirm-action').onclick = () => { state = confirmKind === 'reset' ? M.initial(state.spec) : confirmKind === 'ticket' ? M.initial(M.specification(pendingType)) : M.fresh(state.spec); initialize(); $('confirm').close(); say('Scenario ready. Select a device to investigate.'); };
  $('confirm').addEventListener('close',() => returnFocus?.focus());
  function switchTab(name) { for (const id of ['activity','lesson']) { const active = id === name; $(id).hidden = !active; $(id+'-tab').setAttribute('aria-selected',String(active)); $(id+'-tab').tabIndex = active ? 0 : -1; } $(name+'-tab').focus(); }
  for (const name of ['activity','lesson']) $(name+'-tab').onclick = () => switchTab(name);
  document.querySelector('.tabs').onkeydown = e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); switchTab(e.key === 'Home' ? 'activity' : e.key === 'End' ? 'lesson' : $('activity').hidden ? 'activity' : 'lesson'); } };
  initialize();
})();
