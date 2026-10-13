(function (root) {
  'use strict';
  const TYPES = ['lease', 'route', 'dns', 'wifi', 'remote'];
  const TICKETS = ['Workstation offline', 'Resource unavailable', 'Website unavailable', 'Wireless access', 'Remote support'];
  const ISSUES = [
    ['dhcp-off', 'DHCP service unavailable'], ['dhcp-pool', 'DHCP pool exhausted'],
    ['gateway', 'Incorrect default gateway'], ['mask', 'Incorrect subnet mask'],
    ['dns', 'Incorrect DNS resolver'], ['wifi-placement', 'Client on the wrong wireless network'],
    ['wifi-compatibility', 'Wireless settings incompatible with the client'],
    ['remote-forward', 'Incorrect inbound service mapping'], ['remote-rule', 'Host firewall rule does not permit the intended source'],
    ['conflict', 'Duplicate IPv4 address'], ['link', 'Disconnected Ethernet cable']
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  function ipv4(value) {
    return typeof value === 'string' && /^(\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split('.').every(p => Number(p) <= 255 && String(Number(p)) === p);
  }
  function number(ip) { return ipv4(ip) ? ip.split('.').reduce((n, p) => (n * 256 + Number(p)) >>> 0, 0) : null; }
  function maskValid(mask) {
    const n = number(mask); if (n === null || n === 0 || n === 0xffffffff) return false;
    const inv = (~n) >>> 0; return (inv & ((inv + 1) >>> 0)) === 0;
  }
  function sameSubnet(a, b, mask) {
    return ipv4(a) && ipv4(b) && maskValid(mask) && ((number(a) & number(mask)) >>> 0) === ((number(b) & number(mask)) >>> 0);
  }
  function inCIDR(ip, cidr) {
    const [base, bits] = String(cidr).split('/');
    if (!ipv4(ip) || !ipv4(base) || !/^\d{1,2}$/.test(bits || '') || +bits > 32) return false;
    const m = +bits === 0 ? 0 : (0xffffffff << (32 - +bits)) >>> 0;
    return ((number(ip) & m) >>> 0) === ((number(base) & m) >>> 0);
  }
  function rng(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
  function shuffled(items, seed) { const result = items.slice(), random = rng(seed); for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  function specification(type = 'lease', seed = Date.now() % 100000) {
    if (!TYPES.includes(type)) type = 'lease'; seed = Math.abs(Math.trunc(Number(seed) || 0)) % 100000;
    const oct = 36 + seed % 40, bases = [`10.62.${oct}`, `172.22.${oct}`, `192.168.${oct}`], base = bases[seed % 3];
    const guestBase = base.split('.').slice(0, 2).join('.') + '.' + (oct + 80);
    const archiveBase = base.split('.').slice(0, 2).join('.') + '.' + (oct + 1);
    const vpnBase = `10.207.${seed % 100}`;
    const affected = seed % 2 ? 'pc2' : 'pc1', variant = Math.floor(seed / 2) % 2;
    const cause = { lease: variant ? 'dhcp-pool' : 'dhcp-off', route: variant ? 'mask' : 'gateway', dns: 'dns', wifi: variant ? 'wifi-compatibility' : 'wifi-placement', remote: variant ? 'remote-rule' : 'remote-forward' }[type];
    return { type, seed, variant, cause, affected, base, guestBase, archiveBase, vpnBase,
      network: base + '.0/24', guestNetwork: guestBase + '.0/24', vpnNetwork: vpnBase + '.0/24', mask: '255.255.255.0',
      gateway: base + '.1', guestGateway: guestBase + '.1', printer: base + '.20', vpn: base + '.5',
      archive: archiveBase + '.20', portal: '203.0.113.80', wan: '198.51.100.' + (10 + seed % 190),
      hostname: 'portal.example.test', archiveName: 'archive.example.test', vpnClient: vpnBase + '.10', vpnPort: 51820 + seed % 3,
      names: { pc1: seed % 2 ? 'STUDIO-PC' : 'OFFICE-PC', pc2: seed % 2 ? 'OFFICE-PC' : 'STUDIO-PC' },
      ssid: 'Juniper-Office', guestSSID: 'Juniper-Guest', mainKey: 'Juniper!Office' + seed, guestKey: 'Visitor!Access' + seed,
      legacy: type === 'wifi' && variant === 1 };
  }
  function initial(spec) {
    const s = clone(spec), pcs = {};
    for (const [index, id] of ['pc1', 'pc2'].entries()) pcs[id] = {
      assignment: 'manual', dnsMode: 'manual', ip: s.base + '.' + (30 + index), mask: s.mask, gateway: s.gateway, dns: s.gateway,
      network: 'main', key: s.mainKey, released: false
    };
    const state = { version: 1, spec: s, pcs, router: { dhcp: true, poolStart: 100, poolEnd: 149, occupied: [],
      forward: { enabled: false, protocol: 'TCP', externalPort: 3389, target: pcs[s.affected].ip, internalPort: 3389 } },
      ap: { mainSecurity: 'wpa3', mainBand: '5', mainKey: s.mainKey, guestSecurity: 'wpa2-aes', guestBand: 'dual', guestKey: s.guestKey, isolation: true },
      host: { rdp: true, firewall: true, rule: true, protocol: 'TCP', port: 3389, profile: 'Private', scope: s.vpnNetwork },
      diagnosis: '', revision: 0, tests: [], log: [], selected: s.affected, submitted: false };
    const c = pcs[s.affected];
    if (s.type === 'lease') {
      Object.assign(c, { assignment: 'auto', dnsMode: 'auto', ip: '169.254.' + (20 + s.seed % 200) + '.46', mask: '255.255.0.0', gateway: '', dns: '' });
      if (s.variant) { state.router.poolStart = 100; state.router.poolEnd = 101; state.router.occupied = [100, 101]; }
      else state.router.dhcp = false;
    }
    if (s.type === 'route') c[s.variant ? 'mask' : 'gateway'] = s.variant ? '255.255.0.0' : s.base + '.254';
    if (s.type === 'dns') c.dns = s.base + (s.variant ? '.53' : '.254');
    if (s.type === 'wifi') {
      c.assignment = 'auto'; c.dnsMode = 'auto'; c.network = s.variant ? 'main' : 'guest'; c.key = s.variant ? s.mainKey : s.guestKey;
      Object.assign(c, s.variant ? { ip: s.base + '.110' } : { ip: s.guestBase + '.110', gateway: s.guestGateway, dns: s.guestGateway });
      state.ap.guestSecurity = 'open'; state.ap.isolation = s.variant === 0;
    }
    if (s.type === 'remote') {
      if (s.variant) { state.router.forward = { enabled: true, protocol: 'UDP', externalPort: s.vpnPort, target: s.vpn, internalPort: s.vpnPort }; state.host.profile = 'Public'; }
      else state.router.forward.enabled = true;
    }
    return state;
  }
  function changed(state) { state.revision++; state.tests = []; state.submitted = false; }
  function isWireless(state, id) { return state.spec.type === 'wifi' && id === state.spec.affected; }
  function wifiJoined(state, id = 'guest') {
    const s = state.spec, guest = id === 'guest' || state.pcs[id]?.network === 'guest', legacy = id === 'guest' || s.legacy;
    const sec = state.ap[guest ? 'guestSecurity' : 'mainSecurity'], band = state.ap[guest ? 'guestBand' : 'mainBand'];
    const key = id === 'guest' ? s.guestKey : state.pcs[id].key;
    if (sec.endsWith('enterprise')) return false; // No authentication server exists at this site.
    if (legacy && (sec === 'wpa3' || band === '5' && s.legacy && id !== 'guest')) return false;
    return sec === 'open' || key === state.ap[guest ? 'guestKey' : 'mainKey'];
  }
  function configuration(state, id) {
    const s = state.spec;
    if (id === 'guest') return { ip: s.guestBase + '.120', mask: s.mask, gateway: s.guestGateway, dns: s.guestGateway, network: 'guest', assignment: 'auto', dnsMode: 'auto' };
    const c = { ...state.pcs[id] };
    if (c.dnsMode === 'auto') c.dns = c.released || c.ip.startsWith('169.254.') ? '' : c.network === 'guest' ? s.guestGateway : s.gateway;
    return c;
  }
  function localValid(state, id) {
    const s = state.spec, c = configuration(state, id), base = c.network === 'guest' ? s.guestBase : s.base;
    if (id === 'guest' || isWireless(state, id)) { if (!wifiJoined(state, id)) return false; }
    const host = Number(c.ip.split('.')[3]);
    if (!ipv4(c.ip) || c.released || !sameSubnet(c.ip, base + '.1', s.mask) || host < 2 || host > 254) return false;
    if (c.network === 'main' && [s.printer, s.vpn].includes(c.ip)) return false;
    if (id !== 'guest' && Object.entries(state.pcs).some(([other, p]) => other !== id && p.ip === c.ip && p.network === c.network)) return false;
    return true;
  }
  function routeReady(state, id) {
    const s = state.spec, c = configuration(state, id), gateway = c.network === 'guest' ? s.guestGateway : s.gateway;
    return localValid(state, id) && c.gateway === gateway && sameSubnet(c.ip, gateway, c.mask);
  }
  function reachable(state, id, target) {
    const s = state.spec, c = configuration(state, id);
    if (!localValid(state, id)) return false;
    const gateway = c.network === 'guest' ? s.guestGateway : s.gateway;
    if (target === gateway) return sameSubnet(c.ip, target, c.mask);
    if (target === c.ip) return true;
    if (target === s.gateway && c.network === 'guest') return !state.ap.isolation && routeReady(state, id);
    const otherPC = Object.values(state.pcs).find(p => p.ip === target && !p.released);
    if ([s.printer, s.vpn, ...Object.values(state.pcs).map(p => p.ip)].includes(target)) {
      if (otherPC && (target === s.printer || target === s.vpn)) return false;
      if (c.network === 'guest') return !state.ap.isolation && routeReady(state, id) && (!otherPC || otherPC.network === 'main');
      if (otherPC && otherPC.network !== c.network) return false;
      return sameSubnet(c.ip, target, c.mask) || routeReady(state, id);
    }
    if ([s.portal, s.archive].includes(target)) {
      if (target === s.archive && c.network === 'guest' && state.ap.isolation) return false;
      return routeReady(state, id) && !sameSubnet(c.ip, target, c.mask);
    }
    return false;
  }
  function resolves(state, id, hostname, server) {
    const s = state.spec, c = configuration(state, id), resolver = server || c.dns;
    return [s.hostname, s.archiveName].includes(hostname) && [s.gateway, s.guestGateway].includes(resolver) && reachable(state, id, resolver);
  }
  function renew(state, id) {
    const c = state.pcs[id], s = state.spec;
    if (c.assignment !== 'auto') return { ok: false, message: 'The operation failed as no adapter is in the state permissible for this operation.' };
    changed(state); c.released = false;
    if (isWireless(state, id) && !wifiJoined(state, id)) return { ok: false, message: 'No operation can be performed on Wi-Fi while it has its media disconnected.' };
    const guest = c.network === 'guest';
    const occupied = new Set([...state.router.occupied, ...Object.entries(state.pcs).filter(([other]) => other !== id).map(([, p]) => Number(p.ip.split('.')[3]))]);
    let host = guest ? 110 : null;
    if (!guest && state.router.dhcp) for (let n = +state.router.poolStart; n <= +state.router.poolEnd; n++) { if (n >= 100 && n <= 199 && !occupied.has(n)) { host = n; break; } }
    if (host === null) {
      Object.assign(c, { ip: '169.254.' + (20 + s.seed % 200) + '.46', mask: '255.255.0.0', gateway: '', dns: '' });
      return { ok: false, message: 'An error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out.' };
    }
    Object.assign(c, { ip: (guest ? s.guestBase : s.base) + '.' + host, mask: s.mask, gateway: guest ? s.guestGateway : s.gateway });
    if (c.dnsMode === 'auto') c.dns = c.gateway;
    return { ok: true, message: ipconfig(state, id) };
  }
  function applyPC(state, id, draft) {
    const c = state.pcs[id]; if (!c) return { ok: false, message: 'Select a Windows client.' };
    const d = { ...c, ...draft };
    if (!['auto', 'manual'].includes(d.assignment) || !['auto', 'manual'].includes(d.dnsMode) || !['main', 'guest'].includes(d.network)) return { ok: false, message: 'Choose valid adapter settings.' };
    if (d.assignment === 'manual' && (!ipv4(d.ip) || !maskValid(d.mask) || !ipv4(d.gateway))) return { ok: false, message: 'Enter valid IPv4, contiguous mask, and gateway values.' };
    if (d.dnsMode === 'manual' && !ipv4(d.dns)) return { ok: false, message: 'Enter a valid DNS server address.' };
    if (String(d.key).length > 63) return { ok: false, message: 'The wireless passphrase must be at most 63 characters.' };
    const reconnect = isWireless(state, id) && (d.network !== c.network || d.key !== c.key);
    state.pcs[id] = d; d.released = false; changed(state);
    if (d.assignment === 'auto' && (c.assignment !== 'auto' || reconnect)) renew(state, id);
    return { ok: true, message: 'Adapter settings applied. Run connectivity tests to check the result.' };
  }
  function applyRouter(state, draft) {
    const start = Number(draft.poolStart), end = Number(draft.poolEnd), f = draft.forward;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 100 || end > 199 || start > end) return { ok: false, message: 'The client pool must be within host addresses 100–199, with start at or below end.' };
    if (!['TCP', 'UDP'].includes(f.protocol) || !ipv4(f.target) || ![f.externalPort, f.internalPort].every(p => Number.isInteger(+p) && +p >= 1 && +p <= 65535)) return { ok: false, message: 'Enter a valid mapping address, protocol, and ports (1–65535).' };
    state.router = { dhcp: !!draft.dhcp, poolStart: start, poolEnd: end, occupied: state.router.occupied, forward: { ...f, externalPort: +f.externalPort, internalPort: +f.internalPort } };
    changed(state); return { ok: true, message: 'Router settings applied. Existing client leases have not been renewed.' };
  }
  function applyAP(state, draft) {
    const modes = ['open', 'wep', 'wpa2-tkip', 'wpa2-aes', 'transition', 'wpa3', 'wpa2-enterprise', 'wpa3-enterprise'];
    if (!['main', 'guest'].every(n => modes.includes(draft[n + 'Security']) && ['2.4', '5', 'dual'].includes(draft[n + 'Band']) && String(draft[n + 'Key']).length >= 8 && String(draft[n + 'Key']).length <= 63)) return { ok: false, message: 'Choose valid modes and bands; passphrases must contain 8–63 characters.' };
    state.ap = { ...draft, isolation: !!draft.isolation }; changed(state);
    return { ok: true, message: 'Wireless settings applied. Check client association and access.' };
  }
  function applyHost(state, draft) {
    if (!['TCP', 'UDP'].includes(draft.protocol) || !Number.isInteger(+draft.port) || +draft.port < 1 || +draft.port > 65535 || !['Private', 'Public', 'Domain', 'Any'].includes(draft.profile) || !(draft.scope === 'Any' || inCIDR(state.spec.vpnClient, draft.scope) || /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(draft.scope) && inCIDR(draft.scope.split('/')[0], draft.scope))) return { ok: false, message: 'Enter a valid rule protocol, port, profile, and source IPv4 CIDR (or Any).' };
    state.host = { ...draft, port: +draft.port, rdp: !!draft.rdp, firewall: !!draft.firewall, rule: !!draft.rule }; changed(state);
    return { ok: true, message: 'Windows remote-access and inbound-rule settings applied.' };
  }
  function vpnReady(state) { const s = state.spec, f = state.router.forward; return f.enabled && f.protocol === 'UDP' && f.externalPort === s.vpnPort && f.internalPort === s.vpnPort && f.target === s.vpn; }
  function hostAllows(state, source, protocol = 'TCP', port = 3389) {
    const h = state.host; if (!h.firewall) return true;
    return h.rule && h.protocol === protocol && h.port === port && ['Private', 'Any'].includes(h.profile) && (h.scope === 'Any' || inCIDR(source, h.scope));
  }
  function remoteRDP(state, source) {
    const s = state.spec, h = state.host; if (!h.rdp || !localValid(state, s.affected)) return false;
    if (source === 'vpn-client') return vpnReady(state) && hostAllows(state, s.vpnClient);
    if (source === 'internet') { const f = state.router.forward; return f.enabled && f.protocol === 'TCP' && f.internalPort === 3389 && f.target === state.pcs[s.affected].ip && hostAllows(state, '192.0.2.60'); }
    const c = configuration(state, source); return reachable(state, source, state.pcs[s.affected].ip) && hostAllows(state, c.ip);
  }
  function record(state, key, ok) { state.tests = state.tests.filter(t => t.key !== key); state.tests.push({ key, ok, revision: state.revision }); state.submitted = false; }
  function test(state, source, destination) {
    const s = state.spec;
    if (!['pc1', 'pc2', 'guest', 'vpn-client', 'internet'].includes(source) || !['gateway', 'printer', 'portal', 'archive', 'rdp', 'vpn', 'admin'].includes(destination)) return { ok: false, message: 'Select a supported source and destination.' };
    let ok = false, target;
    if (destination === 'rdp') { ok = remoteRDP(state, source); target = source === 'internet' ? `${s.wan}:${state.router.forward.protocol === 'TCP' && state.router.forward.internalPort === 3389 ? state.router.forward.externalPort : 3389} (TCP / RDP over WAN)` : `${state.pcs[s.affected].ip}:3389 (TCP / RDP${source === 'vpn-client' ? ' through VPN' : ''})`; }
    else if (destination === 'vpn') { ok = ['internet', 'vpn-client'].includes(source) && vpnReady(state); target = `${s.wan}:${s.vpnPort} (UDP / authenticated VPN handshake)`; }
    else if (['pc1', 'pc2', 'guest'].includes(source)) {
      target = { gateway: configuration(state, source).network === 'guest' ? s.guestGateway : s.gateway, printer: s.printer, portal: s.portal, archive: s.archive, admin: s.gateway }[destination];
      ok = reachable(state, source, target) && (destination !== 'portal' || resolves(state, source, s.hostname));
      target += { gateway: ' (ICMP)', printer: ':9100 (TCP / printing)', portal: ':443 (TCP / HTTPS by hostname)', archive: ':445 (TCP / SMB)', admin: ':443 (TCP / router administration)' }[destination];
    } else target = `${destination} (no published inbound mapping)`;
    record(state, `${source}:${destination}`, ok);
    return { ok, message: `${source === 'pc1' || source === 'pc2' ? s.names[source] : source} → ${target}\n${ok ? 'Connection succeeded.' : 'Connection failed or traffic was blocked.'}` };
  }
  function ipconfig(state, id, all = false) {
    const s = state.spec, c = configuration(state, id), wireless = isWireless(state, id), joined = !wireless || wifiJoined(state, id);
    let out = 'Windows IP Configuration\n\n' + (all ? `   Host Name . . . . . . . . . . . : ${s.names[id]}\n\n` : '') + `${wireless ? 'Wireless LAN adapter Wi-Fi' : 'Ethernet adapter Ethernet'}:\n\n`;
    if (!joined) return out + '   Media State . . . . . . . . . : Media disconnected';
    if (all) out += `   Description . . . . . . . . . : ${wireless ? 'Wireless' : 'Gigabit Ethernet'} Adapter\n   Physical Address. . . . . . . : 02-62-00-00-00-${id === 'pc1' ? '01' : '02'}\n   DHCP Enabled. . . . . . . . . : ${c.assignment === 'auto' ? 'Yes' : 'No'}\n   Autoconfiguration Enabled . . : Yes\n`;
    out += `   ${c.ip.startsWith('169.254.') ? 'Autoconfiguration IPv4 Address' : 'IPv4 Address . . . . . . . . .'} : ${c.ip}\n   Subnet Mask . . . . . . . . . : ${c.mask}\n   Default Gateway . . . . . . . : ${c.gateway}\n`;
    if (all) out += `   DHCP Server . . . . . . . . . : ${c.assignment === 'auto' && !c.ip.startsWith('169.254.') && !c.released ? (c.network === 'guest' ? s.guestGateway : s.gateway) : ''}\n   DNS Servers . . . . . . . . . : ${c.dns}\n`;
    return out;
  }
  function command(state, id, input) {
    if (!state.pcs[id] || typeof input !== 'string' || input.length > 256) return 'Command unavailable in this simulation.';
    const cmd = input.trim().toLowerCase().replace(/\s+/g, ' '), s = state.spec;
    if (cmd === 'help') return `Supported Windows commands:\n  ipconfig\n  ipconfig /all\n  ipconfig /release\n  ipconfig /renew\n  ipconfig /flushdns\n  ping <IPv4 address or hostname>\n  nslookup <hostname> [DNS server IPv4]\n\nUse addresses from the topology or ${s.hostname} and ${s.archiveName}.\nThe separate connection test panel checks service ports and access boundaries.`;
    if (cmd === 'ipconfig' || cmd === 'ipconfig /all') return ipconfig(state, id, cmd.endsWith('/all'));
    if (cmd === 'ipconfig /flushdns') return 'Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.';
    if (cmd === 'ipconfig /renew') { const result = renew(state, id); return result.ok ? result.message : 'Windows IP Configuration\n\n' + result.message; }
    if (cmd === 'ipconfig /release') {
      if (state.pcs[id].assignment !== 'auto') return 'Windows IP Configuration\n\nThe operation failed as no adapter is in the state permissible for this operation.';
      changed(state); Object.assign(state.pcs[id], { ip: '0.0.0.0', mask: '0.0.0.0', gateway: '', dns: '', released: true }); return ipconfig(state, id);
    }
    let m = /^nslookup ([a-z0-9.-]+)(?: ((?:\d{1,3}\.){3}\d{1,3}))?$/.exec(cmd);
    if (m) {
      const server = m[2] || configuration(state, id).dns, ok = resolves(state, id, m[1], server);
      if (m[2] && !ipv4(m[2])) return 'Invalid DNS server address.';
      const reachableDNS = [s.gateway, s.guestGateway].includes(server) && reachable(state, id, server);
      const head = `Server:  ${reachableDNS ? 'router.example.test' : 'UnKnown'}\nAddress:  ${server || '0.0.0.0'}\n\n`;
      if (!ok) return head + (reachableDNS ? `*** router.example.test can't find ${m[1]}: Non-existent domain` : `DNS request timed out.\n    timeout was 2 seconds.\n*** Request to UnKnown timed-out`);
      if (!m[2] && m[1] === s.hostname) record(state, `${id}:dns`, true);
      return head + `Non-authoritative answer:\nName:    ${m[1]}\nAddress:  ${m[1] === s.hostname ? s.portal : s.archive}`;
    }
    m = /^ping ([a-z0-9.-]+)$/.exec(cmd);
    if (m) {
      const name = m[1], isIP = ipv4(name); let target = name;
      if (!isIP) {
        if (!resolves(state, id, name)) return `Ping request could not find host ${name}. Please check the name and try again.`;
        target = name === s.hostname ? s.portal : s.archive;
      }
      const ok = reachable(state, id, target), c = configuration(state, id);
      const key = target === s.portal ? (isIP ? 'external-ip' : 'portal') : target === s.archive ? 'archive' : target === s.printer ? 'printer' : target === c.gateway ? 'gateway' : null;
      if (key) record(state, `${id}:${key}`, ok);
      const line = ok ? `Reply from ${target}: bytes=32 time=${target === s.portal ? 18 : 1}ms TTL=${target === s.portal ? 54 : 128}` : 'Request timed out.';
      return `Pinging ${isIP ? target : name + ' [' + target + ']'} with 32 bytes of data:\n${[line, line, line, line].join('\n')}\n\nPing statistics for ${target}:\n    Packets: Sent = 4, Received = ${ok ? 4 : 0}, Lost = ${ok ? 0 : 4} (${ok ? 0 : 100}% loss)`;
    }
    return 'Command unavailable in this simulation. Type help for supported syntax.';
  }
  function requirements(state) {
    const s = state.spec, name = s.names[s.affected];
    const intro = {
      lease: `${name} cannot browse or print. Its Ethernet link is up. Workstations must obtain their IPv4 settings automatically.`,
      route: s.variant ? `${name} can print but cannot open the archive share. Another PC can access the archive.` : `${name} can print but cannot open the portal or archive. Another PC can access both.`,
      dns: `${name} cannot open ${s.hostname}. Another PC opens it normally. The Ethernet link is up.`,
      wifi: `${name} cannot print reliably. Provide office access for this laptop and internet access for visitors while keeping visitors away from office devices and administration.`,
      remote: `The owner needs authenticated remote support to ${name}. Use the installed VPN endpoint; allow RDP from VPN clients and keep raw internet and guest RDP blocked.`
    }[s.type];
    return intro;
  }
  function expectedTests(state) {
    const s = state.spec, id = s.affected;
    if (s.type === 'wifi') return [[`${id}:printer`, true], ['guest:portal', true], ['guest:printer', false], ['guest:admin', false]];
    if (s.type === 'remote') return [['vpn-client:rdp', true], ['internet:rdp', false], ['guest:rdp', false]];
    return [[`${id}:gateway`, true], [`${id}:${s.type === 'route' && s.variant ? 'archive' : 'portal'}`, true]];
  }
  function grade(state) {
    const s = state.spec, id = s.affected, c = configuration(state, id);
    const verified = expectedTests(state).every(([key, ok]) => state.tests.some(t => t.key === key && t.ok === ok && t.revision === state.revision));
    let repair, config, repairText, configText;
    if (s.type === 'lease') {
      repair = state.router.dhcp && Array.from({ length: state.router.poolEnd - state.router.poolStart + 1 }, (_, i) => state.router.poolStart + i).some(n => !state.router.occupied.includes(n));
      config = c.assignment === 'auto' && c.dnsMode === 'auto' && !c.ip.startsWith('169.254.') && reachable(state, id, s.portal) && resolves(state, id, s.hostname);
      repairText = `DHCP must be enabled with a free address. Pool occupancy is shown in the router lease table. Renew the workstation after repairing the service; a manual address bypasses the required automatic configuration.`;
      configText = `A valid lease supplies an available ${s.network} address, mask ${s.mask}, gateway ${s.gateway}, and DNS ${s.gateway}. Applied address: ${c.ip}; assignment: ${c.assignment}.`;
    } else if (s.type === 'route') {
      repair = s.variant ? c.mask === s.mask : c.gateway === s.gateway;
      config = c.mask === s.mask && routeReady(state, id) && reachable(state, id, s.printer) && reachable(state, id, s.archive) && reachable(state, id, s.portal);
      repairText = s.variant ? `Mask ${s.mask} keeps ${s.archive} off-link. The /16 mask incorrectly treats that routed destination as local, so the client tries ARP instead of using the gateway.` : `The real default gateway is ${s.gateway}. ${s.base}.254 is a plausible host address but has no router here; printing locally does not validate a gateway.`;
      configText = `Keep an available LAN address and the /24 mask, then route through ${s.gateway}. Applied mask: ${c.mask}; gateway: ${c.gateway}. Automatic settings are also accepted when they restore this configuration.`;
    } else if (s.type === 'dns') {
      repair = c.dns === s.gateway;
      config = routeReady(state, id) && resolves(state, id, s.hostname) && reachable(state, id, s.portal);
      repairText = `Use the site's DNS resolver ${s.gateway}, manually or automatically. A reply from ${s.portal} checks IP connectivity; nslookup checks DNS independently.`;
      configText = `The portal needs both name resolution and a working route. Applied DNS: ${c.dns || 'none'}. Flushing the cache does not correct an unreachable DNS server; this ticket has no cached answer.`;
    } else if (s.type === 'wifi') {
      repair = state.ap.mainSecurity === (s.legacy ? 'transition' : 'wpa3') && ['wpa2-aes', 'transition'].includes(state.ap.guestSecurity) && state.ap.mainKey.length >= 12 && state.ap.guestKey === s.guestKey && state.ap.mainKey !== state.ap.guestKey;
      config = c.network === 'main' && wifiJoined(state, id) && reachable(state, id, s.printer) && state.ap.isolation && state.ap.mainBand === (s.legacy ? 'dual' : '5') && state.ap.guestBand === 'dual' && reachable(state, 'guest', s.portal) && !reachable(state, 'guest', s.printer);
      repairText = `Office mode: ${s.legacy ? 'WPA2/WPA3-Personal transition for this WPA2-only laptop and modern WPA3 clients' : 'WPA3-Personal for the WPA3-capable office clients'}. Visitors need WPA2-Personal with AES and their issued passphrase; transition mode is also accepted because these clients negotiate WPA2/AES. Enterprise needs a RADIUS/802.1X service that is absent here.`;
      configText = `Place the office laptop on ${s.ssid}; use ${s.legacy ? 'both 2.4 and 5 GHz' : '5 GHz'} for the office, both bands for visitors, and isolate guests from the LAN. Current laptop network: ${c.network}; isolation: ${state.ap.isolation ? 'on' : 'off'}.`;
    } else {
      repair = vpnReady(state);
      config = state.host.rdp && state.host.firewall && state.host.rule && state.host.protocol === 'TCP' && state.host.port === 3389 && state.host.profile === 'Private' && [s.vpnNetwork, s.vpnClient + '/32'].includes(state.host.scope) && remoteRDP(state, 'vpn-client') && !remoteRDP(state, 'internet') && !remoteRDP(state, 'guest');
      repairText = `Map UDP ${s.vpnPort} to ${s.vpn}:${s.vpnPort}, the configured VPN listener. The router has a public WAN address, the VPN has enrolled keys, and its LAN route is installed. Forwarding raw RDP to Windows does not meet the request.`;
      configText = `Keep Windows Firewall enabled. Enable RDP and allow TCP 3389 only on the host's active Private profile, scoped to ${s.vpnNetwork} (or ${s.vpnClient}/32). The VPN preserves client source addresses. A Public-only rule misses this Private interface; Any scope admits unnecessary sources.`;
    }
    const other = id === 'pc1' ? 'pc2' : 'pc1';
    config = config && reachable(state, other, s.printer) && reachable(state, other, s.portal) && resolves(state, other, s.hostname);
    const descriptions = {
      'dhcp-off': 'The router DHCP service is disabled; the automatic client uses APIPA after failing to receive a lease.',
      'dhcp-pool': 'Both addresses in the configured pool are occupied. The service is on but cannot issue a new lease.',
      gateway: 'The gateway differs from the LAN router while local printing still works.', mask: 'The mask makes the routed archive address look local to the workstation.',
      dns: 'IP connectivity works, but the configured address has no reachable DNS service.',
      'wifi-placement': 'The office laptop joined the visitor network. Guest isolation must be enabled and the office client moved to the office SSID.',
      'wifi-compatibility': 'The laptop supports only WPA2 and 2.4 GHz; the office profile initially requires WPA3 and 5 GHz.',
      'remote-forward': 'The current mapping publishes RDP instead of reaching the installed UDP VPN endpoint.',
      'remote-rule': 'The VPN is reachable, but the host rule is enabled on Public rather than its active Private profile.'
    };
    const diagnosisLabel = ISSUES.find(([key]) => key === state.diagnosis)?.[1] || 'Not selected';
    const checks = [
      ['Diagnosis', 20, state.diagnosis === s.cause, `Selected: ${diagnosisLabel}. ${descriptions[s.cause]}`],
      ['Corrective configuration', 30, repair, repairText],
      ['Working and appropriate access', 30, config, configText],
      ['Verification', 20, verified, `After the last applied change, test: ${expectedTests(state).map(([key, ok]) => key + ' ' + (ok ? 'succeeds' : 'is blocked')).join('; ')}. A blocked boundary is a successful security check. Earlier tests are cleared when configuration changes.`]
    ];
    const rows = checks.map(([label, max, correct, text]) => ({ label, max, correct, text, points: correct ? max : 0 }));
    return { score: rows.reduce((n, r) => n + r.points, 0), rows };
  }
  function fresh(previous) { const type = previous ? TYPES[(TYPES.indexOf(previous.type) + 1) % TYPES.length] : TYPES[Math.floor(Math.random() * TYPES.length)]; return initial(specification(type)); }
  // Restoration accepts only known applied fields and rebuilds immutable site facts from the seed.
  function restore(raw) {
    try {
      if (raw.version !== 1 || !TYPES.includes(raw.spec.type) || !Number.isInteger(raw.spec.seed)) throw Error();
      const state = initial(specification(raw.spec.type, raw.spec.seed));
      for (const id of ['pc1', 'pc2']) {
        const p = raw.pcs[id];
        if (!ipv4(p.ip) || !(maskValid(p.mask) || p.mask === '0.0.0.0') || ![p.gateway, p.dns].every(v => v === '' || ipv4(v))) throw Error();
        if (!applyPC(state, id, { assignment: p.assignment, dnsMode: p.dnsMode, ip: p.ip, mask: p.mask, gateway: p.gateway, dns: p.dns, network: p.network, key: p.key }).ok && !p.released) throw Error();
        state.pcs[id] = { ...state.pcs[id], ...p };
      }
      if (!applyRouter(state, raw.router).ok || !applyAP(state, raw.ap).ok || !applyHost(state, raw.host).ok) throw Error();
      state.revision = Math.max(0, Math.trunc(raw.revision || 0));
      state.tests = Array.isArray(raw.tests) ? raw.tests.filter(t => typeof t.key === 'string' && typeof t.ok === 'boolean' && t.revision === state.revision).slice(-30) : [];
      state.log = Array.isArray(raw.log) ? raw.log.filter(t => typeof t.input === 'string' && typeof t.output === 'string').slice(-24).map(t => ({ input: t.input.slice(0,256), output: t.output.slice(0,6000) })) : [];
      state.diagnosis = ISSUES.some(([id]) => id === raw.diagnosis) ? raw.diagnosis : '';
      state.selected = ['pc1','pc2','router','ap','printer','guest','vpn','internet','archive'].includes(raw.selected) ? raw.selected : state.spec.affected;
      state.submitted = raw.submitted === true; return state;
    } catch (_) { return fresh(); }
  }
  const api = { TYPES, TICKETS, ISSUES, specification, initial, fresh, restore, clone, ipv4, maskValid, sameSubnet, inCIDR, shuffled, configuration, localValid, reachable, resolves, renew, applyPC, applyRouter, applyAP, applyHost, command, test, vpnReady, remoteRDP, requirements, expectedTests, grade, isWireless, wifiJoined };
  if (typeof module !== 'undefined') module.exports = api; else root.HomeNetworkModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
