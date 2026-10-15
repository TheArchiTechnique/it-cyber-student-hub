/* Restricted, deterministic Windows CMD simulation. No operating-system access. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.WindowsTroubleshooting = model;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const KEY = 'student-hub-windows-troubleshooting-v1';
  const REF = '../../../../../reference/windows-command-line/';
  const LAB = '../../../../../labs/it-support/windows-command-line/';
  function rng(seed) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(items, random) { const a = items.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const choices = {
    network: {
      cause: [['dhcp', 'No usable DHCP lease'], ['dns', 'Incorrect DNS resolver configuration'], ['subnet', 'Incorrect static subnet mask'], ['adapter', 'Disabled Ethernet adapter']],
      action: [['dhcp', 'Restore DHCP reachability, renew, and verify'], ['dns', 'Set the approved DNS resolver and verify'], ['cache', 'Clear the DNS client cache and retry'], ['static', 'Assign an unused static address and retry']]
    },
    share: {
      cause: [['mapping', 'Outdated mapped share path'], ['permissions', 'Missing share permissions'], ['account', 'Wrong signed-in domain account'], ['server', 'File server is unreachable']],
      action: [['mapping', 'Remove the old mapping and map the approved path'], ['permissions', 'Request access to the existing mapped share'], ['account', 'Sign in with a different domain account'], ['dns', 'Replace the DNS resolver and reconnect']]
    },
    policy: {
      cause: [['refresh', 'Client policy report predates the deployment'], ['scope', 'User is outside the intended policy scope'], ['domain', 'Domain controller cannot be reached'], ['restart', 'Policy requires a pending restart']],
      action: [['refresh', 'Refresh policy and verify the resulting report'], ['scope', 'Request a change to the policy security filter'], ['domain', 'Restore domain connectivity before refreshing'], ['restart', 'Restart Windows without reviewing policy results']]
    },
    integrity: {
      cause: [['sfc', 'Protected Windows system files are corrupted'], ['filesystem', 'NTFS file-system structures have errors'], ['hardware', 'Physical drive failure has been confirmed'], ['application', 'Only an application configuration is damaged']],
      action: [['sfc', 'Run elevated SFC repair, then verify integrity'], ['filesystem', 'Back up, schedule CHKDSK /f, restart, and verify'], ['replace', 'Replace the drive and reinstall Windows'], ['application', 'Reinstall the affected application and retest']]
    }
  };
  function scenario(seed) {
    const random = rng(seed), subnet = 30 + Math.floor(random() * 180), prefix = `10.44.${subnet}`;
    const org = ['NORTH', 'CEDAR', 'RIDGE', 'MAPLE'][Math.floor(random() * 4)];
    const dept = ['finance', 'design', 'operations', 'sales'][Math.floor(random() * 4)];
    const file = `fs${10 + seed % 80}`, dc = `dc${10 + seed % 80}`, web = `portal${10 + seed % 80}`;
    const networkFault = random() < .5 ? 'dhcp' : 'dns', integrityFault = random() < .5 ? 'sfc' : 'filesystem';
    const hosts = shuffle([21, 34, 47, 59, 72, 86, 93, 104], random).slice(0, 4);
    return { seed, prefix, org, dept, file, dc, web, domain: 'office.example', gateway: prefix + '.1', dns: prefix + '.10', fileIP: prefix + '.20', webIP: prefix + '.30', badDNS: prefix + '.254', networkFault, integrityFault,
      pcs: hosts.map((n, i) => ({ host: `${org}-PC${n}`, user: ['jrivera', 'tchen', 'amorgan', 'rpatel'][i], ip: prefix + '.' + (60 + i) })),
      share: `\\\\${file}\\${dept}`, oldShare: `\\\\${file}\\${dept}-archive`, policy: `${org}-ControlPanel-Restriction`, drive: ['P:', 'S:', 'T:'][seed % 3] };
  }
  function initial(seed = Math.floor(Math.random() * 1000000000), orderSeed = seed) {
    const s = scenario(seed), random = rng(orderSeed);
    return { version: 1, seed, selected: 0, submitted: false, pcs: s.pcs.map((_, i) => {
      const group = ['network', 'share', 'policy', 'integrity'][i];
      return { cause: '', action: '', elevated: i === 2, mapping: i === 1 ? s.oldShare : '', policyUpdated: false, systemRepaired: false, diskRepaired: false, pendingDisk: false, scheduledDisk: false, evidence: {}, transcript: [], history: [], orders: { cause: shuffle(choices[group].cause.map(c => c[0]), random), action: shuffle(choices[group].action.map(c => c[0]), random) } };
    }) };
  }
  function fresh(previous) {
    let seed = Math.floor(Math.random() * 1000000000);
    while (previous && (seed === previous.seed || (scenario(seed).networkFault === scenario(previous.seed).networkFault && scenario(seed).integrityFault === scenario(previous.seed).integrityFault))) seed = (seed + 1) % 1000000000;
    return initial(seed);
  }
  function restore(raw) {
    if (!raw || raw.version !== 1 || !Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed > 1000000000 || !Array.isArray(raw.pcs) || raw.pcs.length !== 4) return fresh();
    const state = initial(raw.seed);
    state.selected = Number.isInteger(raw.selected) && raw.selected >= 0 && raw.selected < 4 ? raw.selected : 0;
    state.submitted = raw.submitted === true;
    state.pcs.forEach((pc, i) => {
      const source = raw.pcs[i] || {}, group = choices[['network', 'share', 'policy', 'integrity'][i]];
      for (const key of ['cause', 'action']) {
        pc[key] = group[key].some(c => c[0] === source[key]) ? source[key] : '';
        if (Array.isArray(source.orders?.[key]) && source.orders[key].length === group[key].length && new Set(source.orders[key]).size === group[key].length && source.orders[key].every(id => group[key].some(c => c[0] === id))) pc.orders[key] = source.orders[key].slice();
      }
      for (const key of ['elevated', 'policyUpdated', 'systemRepaired', 'diskRepaired', 'scheduledDisk', 'pendingDisk']) pc[key] = source[key] === true;
      const s = scenario(raw.seed);
      pc.mapping = [s.oldShare, s.share, ''].includes(source.mapping) ? source.mapping : pc.mapping;
      for (const key of ['ip', 'ipReach', 'ipFail', 'nameFail', 'lookupFail', 'renewFail', 'mapping', 'serverReach', 'policy', 'sfc', 'disk']) pc.evidence[key] = source.evidence?.[key] === true;
      pc.transcript = (Array.isArray(source.transcript) ? source.transcript : []).filter(e => e && typeof e.command === 'string' && typeof e.output === 'string').slice(-32).map(e => ({ command: e.command.slice(0, 256), output: e.output.slice(0, 12000) }));
      pc.history = (Array.isArray(source.history) ? source.history : []).filter(e => typeof e === 'string').slice(-40).map(e => e.slice(0, 256));
    });
    return state;
  }
  function config(state, i) {
    const s = scenario(state.seed), apipa = i === 0 && s.networkFault === 'dhcp';
    return { ip: apipa ? `169.254.${40 + state.seed % 180}.81` : s.pcs[i].ip, mask: apipa ? '255.255.0.0' : '255.255.255.0', gateway: apipa ? '' : s.gateway, dns: apipa ? '' : i === 0 && s.networkFault === 'dns' ? s.badDNS : s.dns };
  }
  function ipconfig(state, i, all) {
    const s = scenario(state.seed), c = config(state, i), apipa = c.ip.startsWith('169.254.');
    return `Windows IP Configuration\n${all ? `\n   Host Name . . . . . . . . . . . . : ${s.pcs[i].host}\n   Primary Dns Suffix . . . . . . . : ${s.domain}\n` : ''}\nEthernet adapter Ethernet:\n${all ? '   Description . . . . . . . . . . : Intel(R) Ethernet Adapter\n   DHCP Enabled. . . . . . . . . . : Yes\n   Autoconfiguration Enabled . . . : Yes\n' : ''}   ${apipa ? 'Autoconfiguration IPv4 Address' : 'IPv4 Address. . . . . . . . . .'} : ${c.ip}${all ? '(Preferred)' : ''}\n   Subnet Mask . . . . . . . . . . : ${c.mask}\n   Default Gateway . . . . . . . . : ${c.gateway}${all ? `\n   DHCP Server . . . . . . . . . . : ${apipa ? '' : s.dns}\n   DNS Servers . . . . . . . . . . : ${c.dns}` : ''}`;
  }
  function hosts(s) { return { [s.file]: s.fileIP, [s.dc]: s.dns, [s.web]: s.webIP, [s.file + '.' + s.domain]: s.fileIP, [s.dc + '.' + s.domain]: s.dns, [s.web + '.' + s.domain]: s.webIP, localhost: '127.0.0.1' }; }
  const syntax = {
    ipconfig: 'IPCONFIG [ /all | /renew [Ethernet] | /flushdns ]\nInspect addressing; /renew requests a DHCP lease; /flushdns clears the client cache.',
    ping: 'PING [-n count] <hostname or IPv4 address>\nSend ICMP echo requests. This simulation accepts 1–4 requests.',
    nslookup: 'NSLOOKUP <hostname> [DNS-server-IP]\nQuery the configured resolver or the specified server. Noninteractive lookups only.',
    net: 'NET USE [drive: [\\\\server\\share [/persistent:yes|no]] | drive: /delete [/y]]\nList, connect, or disconnect a mapped resource. Only the ticket drive and documented shares are simulated.',
    whoami: 'WHOAMI\nShow the current domain and user account.', hostname: 'HOSTNAME\nShow the computer name.',
    gpresult: 'GPRESULT /r [/scope user|computer]\nView applied Group Policy summary. Switch order may vary.',
    gpupdate: 'GPUPDATE [/force] [/target:user|computer]\nRequest policy processing; /force reapplies all settings. Some policies require sign-out or restart.',
    sfc: 'SFC /verifyonly | /scannow\nRequires an elevated Command Prompt. Verify protected system files, or scan and attempt repair.',
    chkdsk: 'CHKDSK [C:] [/f]\nRequires elevation. Inspect the file system; /f requests repair and may require a locked volume or a scheduled restart.'
  };
  function help() { return 'Available simulated Windows commands:\n' + Object.values(syntax).join('\n\n') + '\n\nHELP [command] or command /? displays syntax. CLS clears this terminal.\nUse the hostnames, IP addresses, drive letter, and share paths in the ticket.\nOnly the documented subset is supported; commands run inside this page.'; }
  function command(state, i, input) {
    const s = scenario(state.seed), pc = state.pcs[i], ev = pc.evidence, c = config(state, i);
    const raw = String(input).trim(), cmd = raw.toLowerCase().replace(/\s+/g, ' ');
    const unavailable = 'Command unavailable in this simulation. Type HELP or command /? for supported syntax.';
    if (raw.length > 256 || /[&|;<>`$\n\r]/.test(raw)) return unavailable;
    if (pc.pendingDisk) {
      if (!['y', 'n'].includes(cmd)) return 'Please answer Y or N to the volume-check scheduling prompt.';
      pc.pendingDisk = false;
      if (cmd === 'y') { pc.scheduledDisk = true; return 'This volume will be checked the next time the system restarts.'; }
      return pc.scheduledDisk ? 'A volume check is already scheduled for the next restart.' : 'The volume check was not scheduled.';
    }
    if (cmd === 'help') return help();
    if (cmd === 'help /?') return 'HELP [command]\nShow the commands and syntax available in this simulation.';
    const h = cmd.match(/^help (ipconfig|ping|nslookup|net(?: use)?|whoami|hostname|gpresult|gpupdate|sfc|chkdsk)$/) || cmd.match(/^(ipconfig|ping|nslookup|net(?: use)?|whoami|hostname|gpresult|gpupdate|sfc|chkdsk) \/\?$/);
    if (h) return syntax[h[1].split(' ')[0]];
    if (cmd === 'cls') return '';
    if (cmd === 'hostname') return s.pcs[i].host;
    if (cmd === 'whoami') return s.org.toLowerCase() + '\\' + s.pcs[i].user;
    if (/^ipconfig(?: \/all)?$/.test(cmd)) { ev.ip = true; return ipconfig(state, i, cmd.endsWith('/all')); }
    if (/^ipconfig \/renew(?: (?:ethernet|"ethernet"))?$/.test(cmd)) {
      if (i === 0 && s.networkFault === 'dhcp') { ev.renewFail = true; return 'Windows IP Configuration\n\nAn error occurred while renewing interface Ethernet : unable to contact your DHCP server. Request has timed out.'; }
      return ipconfig(state, i, false);
    }
    if (cmd === 'ipconfig /flushdns') return 'Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.';
    if (cmd === 'ping' || cmd === 'nslookup') return syntax[cmd];
    const ping = cmd.match(/^ping (?:-n ([1-4]) )?([\w.-]+)(?: -n ([1-4]))?$/);
    if (ping && !(ping[1] && ping[3])) {
      const target = ping[2], n = Number(ping[1] || ping[3] || 4), literal = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(target);
      const known = hosts(s), local = [s.pcs[i].host.toLowerCase(), s.pcs[i].host.toLowerCase() + '.' + s.domain].includes(target);
      let ip = literal ? target : local ? c.ip : known[target];
      if (!literal && target !== 'localhost' && !local && (i === 0 || !ip)) { if (i === 0 && known[target]) ev.nameFail = true; return `Ping request could not find host ${target}. Please check the name and try again.`; }
      const reachable = ip === '127.0.0.1' || ip === c.ip || (!(i === 0 && s.networkFault === 'dhcp') && [s.gateway, s.dns, s.fileIP, s.webIP, s.badDNS, ...s.pcs.map(p => p.ip)].includes(ip));
      if (reachable && [s.gateway, s.fileIP, s.webIP, s.dns].includes(ip)) ev.ipReach = true;
      if (!reachable && [s.gateway, s.fileIP, s.webIP, s.dns].includes(ip)) ev.ipFail = true;
      if (reachable && ip === s.fileIP) ev.serverReach = true;
      const reply = reachable ? `Reply from ${ip}: bytes=32 time<1ms TTL=128` : 'Request timed out.';
      return `Pinging ${target}${literal ? '' : ` [${ip}]`} with 32 bytes of data:\n${Array(n).fill(reply).join('\n')}\n\nPing statistics for ${ip}:\n    Packets: Sent = ${n}, Received = ${reachable ? n : 0}, Lost = ${reachable ? 0 : n} (${reachable ? 0 : 100}% loss)`;
    }
    const lookup = cmd.match(/^nslookup ([\w.-]+)(?: (\d{1,3}(?:\.\d{1,3}){3}))?$/);
    if (lookup) {
      const server = lookup[2] || c.dns, works = server === s.dns && !(i === 0 && s.networkFault === 'dhcp');
      if (!works) { if (hosts(s)[lookup[1]] && (!lookup[2] || lookup[2] === c.dns)) ev.lookupFail = true; return `Server:  UnKnown\nAddress:  ${server || '127.0.0.1'}\n\nDNS request timed out.\n    timeout was 2 seconds.\n*** Request to UnKnown timed-out`; }
      const ip = hosts(s)[lookup[1]], header = `Server:  ${s.dc}.${s.domain}\nAddress:  ${s.dns}\n\n`;
      return header + (ip ? `Name:    ${lookup[1].includes('.') ? lookup[1] : lookup[1] + '.' + s.domain}\nAddress:  ${ip}` : `*** ${s.dc}.${s.domain} can't find ${lookup[1]}: Non-existent domain`);
    }
    if (cmd === 'net use' || /^net use [a-z]:$/.test(cmd)) {
      if (cmd !== 'net use' && cmd.slice(-2) !== s.drive.toLowerCase()) return 'System error 2250 has occurred.\nThis network connection does not exist.';
      ev.mapping = true;
      return pc.mapping ? `New connections will be remembered.\n\nStatus        Local  Remote\n-------------------------------------------------------------------------------\n${pc.mapping === s.share ? 'OK          ' : 'Unavailable '}  ${s.drive}     ${pc.mapping}\nThe command completed successfully.` : 'There are no entries in the list.';
    }
    const remove = cmd.match(/^net use ([a-z]:) \/delete(?: \/y)?$/);
    if (remove) {
      if (i !== 1 || remove[1] !== s.drive.toLowerCase() || !pc.mapping) return 'System error 2250 has occurred.\nThis network connection does not exist.';
      pc.mapping = ''; return `${s.drive} was deleted successfully.`;
    }
    const map = cmd.match(/^net use ([a-z]:) (\\\\[\w.-]+\\[\w-]+)(?: \/persistent:(yes|no))?$/);
    if (map) {
      if (i !== 1 || map[1] !== s.drive.toLowerCase()) return 'Only the ticket drive mapping is simulated. Check NET USE /?.';
      if (pc.mapping) return 'System error 85 has occurred.\nThe local device name is already in use.';
      if (map[2] !== s.share.toLowerCase()) return 'System error 67 has occurred.\nThe network name cannot be found.';
      pc.mapping = s.share; return 'The command completed successfully.';
    }
    const tokens = cmd.split(' ');
    if (tokens[0] === 'gpresult') {
      const scopeAt = tokens.indexOf('/scope'), scope = scopeAt >= 0 ? tokens[scopeAt + 1] : 'both';
      const valid = tokens.filter((_, j) => j > 0 && j !== scopeAt && j !== scopeAt + 1);
      if (!tokens.includes('/r') || !['both', 'user', 'computer'].includes(scope) || valid.length !== 1 || valid[0] !== '/r' || tokens.filter(t => t === '/scope').length > 1) return syntax.gpresult;
      if (scope !== 'user' && !pc.elevated) return 'ERROR: Access Denied.\nComputer-scope results require elevation here. Use GPRESULT /scope user /r for the current user.';
      if (scope !== 'computer') ev.policy = true;
      let report = `RSOP data for ${s.org}\\${s.pcs[i].user} on ${s.pcs[i].host}\n\n`;
      if (scope !== 'user') report += `COMPUTER SETTINGS\n    Domain: ${s.org}\n    Applied Group Policy Objects\n        Default Domain Policy\n\n`;
      if (scope !== 'computer') report += `USER SETTINGS\n    Last time Group Policy was applied: Today at ${pc.policyUpdated ? '11:20:00' : '10:20:00'}\n    Group Policy was applied from: ${s.dc}.${s.domain}\n    Domain Name: ${s.org}\n    Applied Group Policy Objects\n        Default Domain Policy\n        ${s.org}-Staff-Desktop${pc.policyUpdated ? '\n        ' + s.policy : ''}\n\n    The user is a part of the following security groups\n        Domain Users\n        Office Staff`;
      return report;
    }
    if (tokens[0] === 'gpupdate') {
      const args = tokens.slice(1);
      if (new Set(args).size !== args.length || args.some(t => !['/force', '/target:user', '/target:computer'].includes(t)) || (args.includes('/target:user') && args.includes('/target:computer'))) return syntax.gpupdate;
      if (i === 0) return 'Updating policy...\n\nComputer policy could not be updated successfully.\nWindows could not locate a domain controller. Check network and DNS connectivity.';
      const user = !args.includes('/target:computer'), computer = !args.includes('/target:user');
      if (user) pc.policyUpdated = true;
      return 'Updating policy...\n\n' + (computer ? 'Computer Policy update has completed successfully.\n' : '') + (user ? 'User Policy update has completed successfully.' : '');
    }
    if (/^sfc \/(?:verifyonly|scannow)$/.test(cmd)) {
      if (!pc.elevated) return 'You must be an administrator running a console session in order to use the sfc utility.';
      ev.sfc = true;
      const bad = i === 3 && s.integrityFault === 'sfc' && !pc.systemRepaired;
      let result = 'Windows Resource Protection did not find any integrity violations.';
      if (bad && cmd.endsWith('/scannow')) { pc.systemRepaired = true; result = 'Windows Resource Protection found corrupt files and successfully repaired them.\nDetails are included in the CBS.Log at C:\\Windows\\Logs\\CBS\\CBS.log.'; }
      else if (bad) result = 'Windows Resource Protection found integrity violations.\nDetails are included in the CBS.Log at C:\\Windows\\Logs\\CBS\\CBS.log.';
      return 'Beginning system scan.\nVerification 100% complete.\n\n' + result;
    }
    if (/^chkdsk(?: c:)?(?: \/f)?$/.test(cmd) || cmd === 'chkdsk /f c:') {
      if (!pc.elevated) return 'Access Denied as you do not have sufficient privileges.\nInvoke this utility running in elevated mode.';
      if (cmd.includes('/f')) { pc.pendingDisk = true; return 'The type of the file system is NTFS.\nCannot lock current drive.\n\nChkdsk cannot run because the volume is in use by another process.\nWould you like to schedule this volume to be checked the next time the system restarts? (Y/N)'; }
      ev.disk = true;
      const bad = i === 3 && s.integrityFault === 'filesystem' && !pc.diskRepaired;
      return 'The type of the file system is NTFS.\nWARNING! /F parameter not specified.\nRunning CHKDSK in read-only mode.\n\nStage 1: Examining basic file system structure ...\nStage 2: Examining file name linkage ...\n' + (bad ? 'Errors found in the index $I30 for file 1482.\nErrors found. CHKDSK cannot continue in read-only mode.' : 'Stage 3: Examining security descriptors ...\nWindows has scanned the file system and found no problems.\nNo further action is required.');
    }
    return unavailable;
  }
  function execute(state, i, input) {
    if (state.submitted) return 'Choose Retry findings to continue investigating.';
    const pc = state.pcs[i], output = command(state, i, input);
    pc.history.push(String(input).slice(0, 256)); pc.history = pc.history.slice(-40);
    if (String(input).trim().toLowerCase() === 'cls') pc.transcript = [];
    else { pc.transcript.push({ command: String(input).slice(0, 256), output }); pc.transcript = pc.transcript.slice(-32); }
    return output;
  }
  function restart(state, i) {
    const pc = state.pcs[i];
    if (state.submitted || !pc.scheduledDisk) return false;
    pc.diskRepaired = true; pc.scheduledDisk = false; pc.pendingDisk = false; pc.elevated = false;
    pc.transcript.push({ command: '', output: 'SIMULATED RESTART COMPLETED\nBoot-time volume check ran. Review the Application log (Wininit) and run a new check to verify the result. Protected Windows files were not repaired by this operation.' });
    pc.transcript = pc.transcript.slice(-32); return true;
  }
  function ticket(s, i) {
    const common = [`Computer: ${s.pcs[i].host} · Windows 11 Pro`, `Signed-in account: ${s.org}\\${s.pcs[i].user}`, `Office LAN: ${s.prefix}.0/24 · Gateway: ${s.gateway}`, `Approved DNS / domain controller: ${s.dns} (${s.dc}.${s.domain})`];
    const symptoms = ['The office portal cannot be opened. Other workstations can open it.', `The ${s.drive} departmental drive will not open. Colleagues can use the share.`, 'The new Control Panel restriction is not taking effect for this user.', 'Windows components and file operations report errors after an unexpected shutdown.'];
    const facts = [
      [`Portal: ${s.web}.${s.domain} (${s.webIP})`, 'Ethernet link is active. IPv4 should be obtained automatically.'],
      [`Approved department share: ${s.share} · Drive: ${s.drive}`, `File server: ${s.file}.${s.domain} (${s.fileIP}). Access for the signed-in user was confirmed on another workstation.`],
      [`Approved user GPO: ${s.policy}, published today at 11:00.`, 'Scope: Office Staff. No sign-out or restart is required for this setting. The domain administrator confirmed the link and security filter.'],
      ['System volume: C: (NTFS), currently in use. A current backup and an approved restart window are available.', 'Use an authorized elevated console for integrity tools. Protect data before repairs; verify the resulting state.']
    ];
    return { group: ['network', 'share', 'policy', 'integrity'][i], title: ['Office portal', 'Departmental drive', 'Windows policy', 'Windows integrity'][i], symptom: symptoms[i], facts: common.concat(facts[i]) };
  }
  function evidence(state, i) {
    const s = scenario(state.seed), e = state.pcs[i].evidence;
    return [s.networkFault === 'dhcp' ? e.ip && (e.renewFail || e.nameFail || e.ipFail) : e.ipReach && (e.nameFail || e.lookupFail), e.mapping && e.serverReach, e.policy, s.integrityFault === 'sfc' ? e.sfc : e.disk][i] === true;
  }
  function grade(state) {
    const s = scenario(state.seed), expected = [s.networkFault, 'mapping', 'refresh', s.integrityFault];
    const rows = state.pcs.map((pc, i) => { const diagnostic = evidence(state, i), cause = pc.cause === expected[i], action = pc.action === expected[i]; return { diagnostic, cause, action, expected: expected[i], points: Number(diagnostic) + Number(cause) + Number(action) }; });
    return { score: rows.reduce((n, row) => n + row.points, 0), possible: 12, rows };
  }
  function feedback(state, i) {
    const s = scenario(state.seed), pc = state.pcs[i];
    const texts = [
      s.networkFault === 'dhcp' ? `The active adapter uses ${config(state, i).ip} with a /16 mask and no gateway. Renewal cannot contact DHCP. Restore the DHCP service or its network path, then renew and verify the assigned settings and portal access. DNS cache clearing cannot obtain a lease; an arbitrary static address hides the provisioning fault.` : `Numeric pings to the office hosts work, while hostname tests fail. The client uses ${s.badDNS}; the approved resolver is ${s.dns}. A lookup directed to ${s.dns} succeeds. Correct the adapter's resolver configuration and test again. Flushing the cache cannot replace an incorrect DNS server, and changing a valid subnet mask is unrelated.`,
      `NET USE identifies the mapped UNC path; compare it with ${s.share}. The file server responds and the signed-in account has confirmed access. Remove the outdated ${s.drive} connection and map the approved share in this user's context, then test file access. Changing DNS or requesting permissions to an obsolete path will not correct the mapping. ${pc.mapping === s.share ? 'Your simulated mapping now points to the approved share.' : 'The approved mapping has not yet been applied in the terminal.'}`,
      `The initial user report was applied at 10:20, before the 11:00 deployment. The domain controller is available and the intended Office Staff membership appears in the report. Refresh user policy (or both scopes), then use GPRESULT to verify ${s.policy} appears. A refresh does not fix an incorrect GPO link, security filtering, or unavailable domain services. ${pc.policyUpdated ? 'The simulated user policy has been refreshed.' : 'The simulated user policy has not yet been refreshed.'}`,
      s.integrityFault === 'sfc' ? `An elevated SFC check finds protected-file integrity violations while CHKDSK reports no file-system errors. SFC /scannow attempts repair; this scenario has a usable repair source. Verify with another integrity check and test the original symptom. SFC cannot always repair every file; unresolved corruption requires log review and further servicing. CHKDSK repairs volume structures, not protected Windows file versions.` : `An elevated CHKDSK check reports NTFS index errors; SFC finds no protected-file violations. With the backup available, request CHKDSK C: /f and accept scheduling for the approved restart window. The live C: volume cannot be locked here. Scheduling is not repair: restart, review the check log, and verify. SFC does not repair NTFS indexes; logical errors alone do not confirm physical drive failure.`
    ];
    const refs = [s.networkFault === 'dhcp' ? 'ipconfig' : 'nslookup', 'net-use', 'gpresult', s.integrityFault === 'sfc' ? 'sfc' : 'chkdsk'];
    return { text: texts[i], ref: REF + '#' + refs[i], label: ['Review network command results', 'Review mapped-drive commands', 'Review Group Policy reports', 'Review integrity checks'][i] };
  }
  return { KEY, REF, LAB, choices, scenario, initial, fresh, restore, config, ticket, command, execute, restart, grade, feedback, evidence, help };
});
