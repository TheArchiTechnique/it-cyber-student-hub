// Integrated into test:linux-terminal-engine. Exercise related tools as continuous workflows.
const assert = require('node:assert/strict');
const readFile = require('node:fs').readFileSync;
module.exports = async function networkAndPackages() {
  const {Shell, complete} = await import('../docs/assets/javascripts/linux-terminal/shell.mjs');
  const {freshState, restoreState, StateStore, ProfileStore, STORAGE_KEY, PROFILE_KEY} = await import('../docs/assets/javascripts/linux-terminal/state.mjs');
  const {commandNames, manual} = await import('../docs/assets/javascripts/linux-terminal/manuals.mjs');
  const shell = new Shell(freshState());
  const ok = line => { const result = shell.execute(line); assert.equal(result.code, 0, `${line}: ${result.stderr}`); return result; };
  const bad = (line, code, pattern) => { const result = shell.execute(line); assert.equal(result.code, code, `${line}: ${result.stderr}`); assert.match(result.stderr, pattern); return result; };
  const roundtrip = state => restoreState(JSON.parse(JSON.stringify(state)));
  const edit = (file, value) => { const buffer = ok('sudo nano ' + file).editor; buffer.update(value); buffer.save(); buffer.close(); };
  for (const command of ['ip addr', 'ip addr show', 'ip -br addr']) assert.match(ok(command).stdout, /127.0.0.1\/8[\s\S]*192.0.2.10\/24/);
  assert.match(ok('ip link show').stdout, /enp0s3.*UP/);
  for (const command of ['ip route', 'ip route show']) assert.match(ok(command).stdout, /default via 192.0.2.1.*\n192.0.2.0\/24/);
  assert.match(ok('ping -c 4 192.0.2.1').stdout, /4 packets transmitted, 4 received, 0% packet loss/);
  assert.match(ok('ping -c 4 files.training.example').stdout, /192.0.2.20.*\n[\s\S]*icmp_seq=4/);
  assert.match(ok('ping -c 1 portal').stdout, /198.51.100.20/);
  assert.match(ok('curl http://portal').stdout, /portal ready/);
  assert.match(ok('dig files.training.example').stdout, /status: NOERROR[\s\S]*300\s+IN\s+A\s+192.0.2.20[\s\S]*SERVER: 192.0.2.53#53/);
  assert.equal(ok('dig files.training.example A +short').stdout, '192.0.2.20\n');
  assert.equal(ok('dig @192.0.2.54 files.training.example').stdout.includes('SERVER: 192.0.2.54#53'), true);
  assert.match(ok('dig portal.training.example TXT +short').stdout, /Fictional student/);
  assert.match(ok('traceroute files.training.example').stdout, / 1\s+192.0.2.20/);
  assert.match(ok('traceroute portal.training.example').stdout, /192.0.2.1[\s\S]*2\s+\* \* \*[\s\S]*3\s+198.51.100.20/);
  assert.match(ok('curl -I http://files.training.example').stdout, /^HTTP\/1.1 200 OK/);
  assert.equal(ok('curl http://files.training.example').stdout, 'Training file service ready.\n');
  ok('curl -o ~/Practice/report.html http://files.training.example/report');
  assert.match(ok('cat ~/Practice/report.html').stdout, /<h1>Support report<\/h1>/);
  const report = ok('nano ~/Practice/report.html').editor; assert.match(report.value, /Support report/); report.close();
  assert.equal(shell.state.nodes['/home/student/Practice/report.html'].uid, 1000);
  ok('sudo curl -o /root/service.txt http://files.training.example');
  assert.equal(shell.state.nodes['/root/service.txt'].uid, 0); bad('cat /root/service.txt', 1, /Permission denied/);
  bad('curl -o /etc/service.txt http://files.training.example', 23, /Permission denied/);
  assert.match(ok('curl -I http://files.training.example/missing').stdout, /HTTP\/1.1 404 Not Found/);
  assert.equal(ok('curl -o missing.html http://files.training.example/missing').code, 0);
  assert.equal(ok('cat missing.html').stdout, 'Not Found\n');
  assert.match(ok('curl -I http://status.training.example').stdout, /503 Service Unavailable/);
  const filtered = shell.execute('ping -c 4 status.training.example'); assert.equal(filtered.code, 1); assert.match(filtered.stdout, /100% packet loss/);
  assert.match(ok('traceroute status.training.example').stdout, /203.0.113.30/);
  const dead = shell.execute('ping -c 4 unavailable.training.example'); assert.equal(dead.code, 1); assert.match(dead.stdout, /4 packets transmitted, 0 received, 100%/);
  assert.equal(ok('dig unavailable.training.example +short').stdout, '203.0.113.80\n');
  assert.match(ok('traceroute unavailable.training.example').stdout, /5\s+\* \* \*/);
  bad('curl http://unavailable.training.example', 28, /timed out/);
  assert.equal(ok('dig nonexistent.training.example').code, 0); assert.match(ok('dig nonexistent.training.example').stdout, /NXDOMAIN/);
  assert.equal(ok('dig nonexistent.training.example +short').stdout, '');
  bad('ping -c 1 nonexistent.training.example', 2, /NXDOMAIN/);
  bad('curl http://nonexistent.training.example', 6, /NXDOMAIN/);
  for (const line of ['ping 192.0.2.1', 'ping -c 11 192.0.2.1', 'ping -c -1 192.0.2.1']) bad(line, 2, /COUNT/);
  bad('ping -c 1 8.8.8.8', 2, /outside/);
  bad('curl https://files.training.example', 1, /HTTPS/);
  bad('curl http://example.com', 6, /outside/);
  bad('curl http://3325256724', 6, /outside/);
  bad('curl http://0xc0000214', 6, /outside/);
  bad('curl -f http://files.training.example', 2, /unsupported/);
  bad('curl http://files.training.example:8080', 3, /ports/);
  bad('curl http://user:secret@files.training.example', 3, /credentials/);
  bad('dig files.training.example MX', 1, /usage/);
  bad('dig @192.0.2.99 files.training.example', 9, /no servers could be reached/);
  bad('ip link set enp0s3 down', 2, /not permitted/);
  const oldNetwork = JSON.stringify(shell.state.network);
  for (const line of ['sudo ip link set eth0 down', 'sudo ip addr add 192.0.2.999/24 dev enp0s3', 'sudo ip addr add 192.0.2.0/24 dev enp0s3', 'sudo ip addr add 10.0.0.2/24 dev enp0s3', 'sudo ip route replace default via 203.0.113.1 dev enp0s3']) bad(line, 2, /usage|invalid gateway/);
  assert.equal(JSON.stringify(shell.state.network), oldNetwork, 'Failed configuration is atomic');
  ok('sudo ip addr add 192.0.2.20/24 dev enp0s3'); assert.match(ok('ip -br addr').stdout, /192.0.2.10\/24 192.0.2.20\/24/);
  bad('sudo ip addr add 192.0.2.20/24 dev enp0s3', 2, /File exists/);
  // An address assigned to this workstation is local, not a second remote file server.
  bad('curl http://files.training.example', 7, /Connection refused/);
  ok('sudo ip addr del 192.0.2.20/24 dev enp0s3'); assert.match(ok('curl http://files.training.example').stdout, /ready/);
  ok('sudo ip link set enp0s3 down'); assert.match(ok('ip link show').stdout, /enp0s3.*DOWN/); assert.match(ok('ip route').stdout, /linkdown/);
  bad('ping -c 4 192.0.2.1', 2, /Network is down/); bad('ping -c 4 files.training.example', 2, /Network is down/);
  bad('curl http://files.training.example', 7, /Network is down/); bad('dig files.training.example', 9, /no servers/);
  bad('traceroute 198.51.100.20', 1, /Network is down/);
  assert.match(ok('ping -c 1 127.0.0.1').stdout, /1 received/);
  assert.equal(roundtrip(shell.state).network.linkUp, false);
  ok('sudo ip link set enp0s3 up'); ok('sudo ip route del default');
  assert.ok(!ok('ip route').stdout.includes('default'));
  assert.match(ok('ping -c 1 192.0.2.1').stdout, /1 received/);
  assert.equal(ok('dig portal.training.example +short').stdout, '198.51.100.20\n');
  bad('ping -c 1 portal.training.example', 2, /no default route/);
  bad('curl http://portal.training.example', 7, /no default route/); bad('traceroute portal.training.example', 1, /no default route/);
  ok('sudo ip route replace default via 192.0.2.1 dev enp0s3'); assert.match(ok('curl http://portal.training.example').stdout, /portal ready/);
  // Editing resolver/hosts files through elevated Nano changes all relevant tools.
  const hosts = shell.state.nodes['/etc/hosts'].content;
  edit('/etc/resolv.conf', 'nameserver 192.0.2.99\n');
  bad('dig files.training.example', 9, /192.0.2.99/);
  assert.match(ok('ping -c 1 files.training.example').stdout, /1 received/, '/etc/hosts resolves files even with a broken DNS resolver');
  bad('ping -c 1 portal.training.example', 2, /name resolution/); bad('curl http://portal.training.example', 6, /name resolution/);
  assert.match(ok('ping -c 1 198.51.100.20').stdout, /1 received/, 'DNS failure does not break IP connectivity');
  assert.equal(ok('dig @192.0.2.53 portal.training.example +short').stdout, '198.51.100.20\n');
  edit('/etc/resolv.conf', '# Try fallback resolver\nnameserver 192.0.2.99\nnameserver 192.0.2.54\n');
  assert.match(ok('dig portal.training.example').stdout, /SERVER: 192.0.2.54#53/);
  edit('/etc/hosts', hosts + '198.51.100.20 local-only.training.example\n203.0.113.30 files.training.example\n');
  assert.match(ok('curl http://local-only.training.example').stdout, /portal ready/);
  assert.match(ok('dig local-only.training.example').stdout, /NXDOMAIN/);
  edit('/etc/hosts', '127.0.0.1 localhost\n203.0.113.30 files.training.example\n');
  assert.match(ok('curl -I http://files.training.example').stdout, /503/);
  assert.equal(ok('dig files.training.example +short').stdout, '192.0.2.20\n');
  edit('/etc/hosts', hosts); edit('/etc/resolv.conf', 'nameserver 192.0.2.53\nsearch training.example\n');
  const gatewayPeer = shell.state.network.endpoints.find(peer => peer.address === '192.0.2.1'); gatewayPeer.reachable = false;
  bad('curl http://portal.training.example', 7, /gateway unavailable/); bad('ping -c 1 portal.training.example', 2, /gateway unavailable/);
  assert.equal(ok('dig portal.training.example +short').stdout, '198.51.100.20\n'); gatewayPeer.reachable = true;
  const filePeer = shell.state.network.endpoints.find(peer => peer.name === 'files.training.example'); filePeer.reachable = false;
  assert.equal(shell.execute('ping -c 1 files.training.example').code, 1); bad('curl http://files.training.example', 28, /timed out/);
  assert.ok(!ok('traceroute files.training.example').stdout.split('\n').slice(1).join('\n').includes('192.0.2.20'), 'A down destination must not return a traceroute probe'); filePeer.reachable = true;
  const dns = shell.state.network.endpoints.find(peer => peer.address === '192.0.2.53'); dns.dns.servfail = true;
  assert.match(ok('dig portal.training.example').stdout, /SERVFAIL/); bad('curl http://portal.training.example', 6, /SERVFAIL/); dns.dns.servfail = false;
  const web = shell.state.network.endpoints.find(peer => peer.name === 'files.training.example'); web.http.available = false;
  assert.match(ok('ping -c 1 files.training.example').stdout, /1 received/); bad('curl http://files.training.example', 7, /Connection refused/); web.http.available = true;
  ok('sudo ip addr del 192.0.2.10/24 dev enp0s3'); bad('ping -c 1 192.0.2.1', 2, /no IPv4 address/);
  ok('sudo ip addr add 192.0.2.11/24 dev enp0s3');
  assert.equal(roundtrip(shell.state).network.addresses[0], '192.0.2.11/24');

  // Package transactions share this network and enforce native distribution ownership.
  assert.match(ok('apt list --installed').stdout, /traceroute\/mint-training/);
  assert.match(ok('apt show nano').stdout, /Installed: yes/); assert.match(ok('apt search traceroute').stdout, /network hops/);
  assert.match(ok('apt search no-such-package').stdout, /No matching/);
  bad('dnf info nano', 127, /not found in Linux Mint/); bad('sudo dnf install traceroute', 127, /Select Fedora/);
  bad('apt install support-notes', 100, /require root/); bad('apt remove traceroute', 100, /require root/);
  bad('sudo apt install unknown', 100, /Unable to locate/); bad('apt show unknown', 100, /No package found/);
  bad('sudo apt remove nano', 100, /foundational/);
  ok('sudo apt update'); assert.equal(shell.state.packages.indexRevision, 1);
  assert.match(ok('sudo apt install traceroute').stdout, /already installed/);
  ok('sudo apt remove traceroute'); bad('traceroute files.training.example', 127, /install package traceroute/);
  bad('sudo traceroute files.training.example', 127, /install package traceroute/);
  assert.match(ok('man traceroute').stdout, /SYNTAX/);
  assert.equal(complete(shell, 'trace').value, 'traceroute ', 'Help/completion remains discoverable for installable tools');
  assert.equal(new Shell(roundtrip(shell.state)).execute('traceroute files.training.example').code, 127);
  ok('sudo ip link set enp0s3 down'); bad('sudo apt install traceroute', 100, /repository/); bad('sudo apt update', 100, /repository/);
  assert.equal(shell.state.packages.catalog.find(pkg => pkg.name === 'traceroute').installed, false);
  ok('sudo ip link set enp0s3 up'); ok('sudo apt install traceroute'); assert.match(ok('traceroute files.training.example').stdout, /192.0.2.20/);
  ok('sudo apt remove curl dnsutils'); bad('curl http://files.training.example', 127, /install package curl/); bad('dig files.training.example', 127, /install package dnsutils/);
  // The package manager's HTTP/DNS dependencies do not require the optional CLI packages.
  ok('sudo apt install curl dnsutils support-notes'); assert.match(ok('curl http://files.training.example').stdout, /ready/);
  assert.equal(ok('dig files.training.example +short').stdout, '192.0.2.20\n');
  shell.state.packages.repository.available = false; bad('sudo apt update', 100, /unavailable/); shell.state.packages.repository.available = true;
  const repository = shell.state.network.endpoints.find(peer => peer.name === 'repo.training.example'); repository.http.resources[0].status = 503;
  bad('sudo apt update', 100, /HTTP 503/); repository.http.resources[0].status = 200;
  ok('sudo apt remove support-notes');
  const untouched = JSON.stringify(shell.state.packages);
  bad('sudo apt install support-notes unknown', 100, /Unable to locate/); assert.equal(JSON.stringify(shell.state.packages), untouched);
  assert.match(ok('sudo apt remove support-notes').stdout, /not installed/);
  const unavailable = shell.state.packages.catalog.find(pkg => pkg.name === 'support-notes'); unavailable.available = false;
  bad('sudo apt install support-notes', 100, /unavailable/); unavailable.available = true;

  const fedora = new Shell(freshState('fedora')), fed = line => { const result = fedora.execute(line); assert.equal(result.code, 0, result.stderr); return result; };
  assert.match(fed('cat /etc/os-release').stdout, /ID=fedora/); assert.match(fed('ps -e').stdout, /gnome-shell/); assert.ok(!fed('ps -e').stdout.includes('cinnamon'));
  assert.match(fed('dnf info nano').stdout, /Installed: yes/); assert.match(fed('dnf search traceroute').stdout, /traceroute.x86_64/);
  assert.match(fed('dnf list installed').stdout, /bind-utils.x86_64/); assert.equal(fedora.execute('apt show nano').code, 127);
  assert.equal(fedora.execute('dnf install support-notes').code, 1); assert.equal(fedora.execute('sudo dnf install unknown').code, 1);
  fed('sudo dnf remove traceroute'); assert.equal(fedora.execute('traceroute files.training.example').code, 127);
  fed('sudo dnf install traceroute'); assert.match(fed('traceroute files.training.example').stdout, /192.0.2.20/);
  fed('sudo dnf remove bind-utils'); assert.equal(fedora.execute('dig files.training.example').code, 127);
  fed('sudo dnf install bind-utils'); assert.equal(new Shell(roundtrip(fedora.state)).execute('dig files.training.example +short').stdout, '192.0.2.20\n');
  assert.equal(fedora.execute('sudo dnf remove sudo').code, 1);

  // Real legacy snapshots include root sessions and mounted-volume files; no student work is replaced.
  const legacy3 = JSON.parse(JSON.stringify(shell.state));
  const legacyShell = new Shell(legacy3);
  legacyShell.execute('sudo mount /dev/sdb1 /mnt/training-disk');
  legacyShell.fs.write('/mnt/training-disk/Reports/preserved.txt', 'Saved volume data\n');
  legacyShell.execute('sudo su -');
  legacy3.version = 3; delete legacy3.packages; legacy3.network = {interface: 'enp0s3', address: '192.0.2.10/24', gateway: '192.0.2.1', dns: '192.0.2.53'};
  delete legacy3.nodes['/etc/os-release'];
  const migrated3 = new Shell(roundtrip(legacy3));
  assert.equal(migrated3.state.version, 4); assert.equal(migrated3.state.user.name, 'root');
  assert.equal(migrated3.execute('cat /mnt/training-disk/Reports/preserved.txt').stdout, 'Saved volume data\n');
  assert.match(migrated3.execute('cat /home/student/Practice/report.html').stdout, /Support report/);
  assert.equal(migrated3.execute('exit').code, 0); assert.equal(migrated3.state.user.name, 'student');
  // Versions 1 and 2 migration and all Phase 3A regressions are exercised in linux-terminal.cjs.
  const corruptions = [
    state => state.network.addresses.push('8.8.8.8/24'), state => state.network.gateway = '<script>',
    state => state.network.endpoints[0].hops = [], state => state.network.records[0].value = '8.8.8.8',
    state => state.network.endpoints[3].http.resources[0].body = 'x'.repeat(16001),
    state => state.packages.catalog[0].installed = false, state => state.packages.repository.url = 'http://example.com',
    state => state.distribution = 'invalid'
  ];
  for (const mutate of corruptions) { const state = freshState(); mutate(state); assert.throws(() => roundtrip(state), /Invalid/); }
  assert.throws(() => restoreState(freshState('fedora'), 'mint'), /Invalid workstation profile/);

  const memory = new Map(), storage = {getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value)};
  const profiles = new ProfileStore(storage); assert.equal(profiles.profile, 'mint');
  let session = new Shell(profiles.load()); session.state.progress = {savedMarker: 'Mint work'}; session.execute('echo Mint-only > profile.txt'); session.execute('sudo ip link set enp0s3 down');
  session.execute('sudo apt remove traceroute'); session.execute('sudo su -');
  session = new Shell(profiles.switch('fedora', session.state));
  assert.equal(session.state.distribution, 'fedora'); assert.equal(session.execute('cat profile.txt').code, 1); assert.equal(session.state.network.linkUp, true);
  session.execute('echo Fedora-only > profile.txt'); session.execute('sudo dnf remove curl'); profiles.save(session.state);
  const reloaded = new ProfileStore(storage); assert.equal(reloaded.profile, 'fedora');
  assert.equal(reloaded.load().packages.catalog.find(pkg => pkg.name === 'curl').installed, false);
  session = new Shell(profiles.switch('mint', session.state)); assert.equal(session.state.user.name, 'root');
  assert.equal(session.state.network.linkUp, false); assert.equal(session.execute('traceroute files.training.example').code, 127);
  session.execute('exit'); assert.equal(session.execute('cat profile.txt').stdout, 'Mint-only\n');
  assert.equal(roundtrip(session.state).progress.savedMarker, 'Mint work');
  const reset = profiles.reset(); assert.equal(reset.network.linkUp, true); assert.equal(reset.packages.indexRevision, 0);
  assert.equal(reset.packages.catalog.find(pkg => pkg.name === 'traceroute').installed, true); assert.equal(reset.user.name, 'student');
  assert.equal(reset.volumes[1].mountPoint, null);
  session = new Shell(profiles.switch('fedora', reset)); assert.equal(session.execute('cat profile.txt').stdout, 'Fedora-only\n'); assert.equal(session.execute('curl http://files.training.example').code, 127);
  const blocked = new ProfileStore({getItem() {throw Error('disabled');}, setItem() {throw Error('full');}});
  let offline = new Shell(blocked.load()); offline.execute('echo retained > keep.txt');
  offline = new Shell(blocked.switch('fedora', offline.state)); offline.execute('echo retained-fedora > keep.txt');
  offline = new Shell(blocked.switch('mint', offline.state)); assert.equal(offline.execute('cat keep.txt').stdout, 'retained\n'); assert.match(blocked.message, /in memory/);
  assert.equal(memory.get(PROFILE_KEY), 'fedora'); assert.ok(memory.has(STORAGE_KEY));

  const objectives = readFile(require('node:path').join(__dirname, '../docs/certifications/comptia/a-plus-core-2/objective-breakdown.md'), 'utf8').split('### 1.9 Linux features and tools')[1].split('#### Configuration files')[0];
  const objectiveCommands = [...objectives.matchAll(/^\| `([a-z]+)` \|/gm)].map(match => match[1]);
  assert.equal(objectiveCommands.length, 27);
  assert.equal(shell.commands.size, 36, '27 objective commands plus nine supporting commands');
  assert.deepEqual([...shell.commands.keys()].sort(), [...commandNames].sort(), 'Every registered command has a short manual');
  for (const name of objectiveCommands) { assert.ok(shell.commands.has(name), name); assert.ok(commandNames.includes(name), name); assert.match(manual(name), /SYNTAX/); }
  assert.equal(complete(shell, 'sudo pin').value, 'sudo ping ');
  console.log('PASS: Phase 3B shared network workflows and faults, file-backed DNS/NSS, HTTP writes/status/exit codes, APT/DNF transactions and availability, all 27 objective commands, v3 migration, profile isolation/persistence/reset, and malformed-state rejection.');
};
if (require.main === module) module.exports().catch(error => {console.error(error); process.exitCode = 1;});
