import {LinuxError} from './filesystem.mjs';
import {ipv4, documentationIP, cidr, sameSubnet, ipText, trainingName, normalizeName, routeTo, queryDNS, resolveHost, httpResource} from './network-state.mjs';
const fail = (shell, message, code = 1) => { shell.commandStatus = code; throw new LinuxError(message); };
const admin = shell => { if (shell.fs.user.uid !== 0) fail(shell, 'RTNETLINK answers: Operation not permitted; use sudo', 2); };
const equal = (args, values) => args.length === values.length && args.every((value, i) => value === values[i]);
export function networkCommands(shell) {
  const {state, fs} = shell, net = state.network;
  const ip = args => {
    const brief = equal(args, ['-br', 'addr']);
    if (brief || equal(args, ['addr']) || equal(args, ['addr', 'show'])) {
      const status = net.linkUp ? 'UP' : 'DOWN';
      if (brief) return `lo               UNKNOWN        127.0.0.1/8\n${net.interface.padEnd(17)}${status.padEnd(15)}${net.addresses.join(' ')}\n`;
      return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n    link/loopback 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n2: ${net.interface}: <BROADCAST,MULTICAST${net.linkUp ? ',UP,LOWER_UP' : ''}> mtu 1500 state ${status}\n    link/ether 02:00:00:00:02:10\n` + net.addresses.map(value => `    inet ${value} scope global ${net.interface}\n`).join('');
    }
    if (equal(args, ['link', 'show'])) return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n    link/loopback 00:00:00:00:00:00\n2: ${net.interface}: <BROADCAST,MULTICAST${net.linkUp ? ',UP,LOWER_UP' : ''}> mtu 1500 state ${net.linkUp ? 'UP' : 'DOWN'}\n    link/ether 02:00:00:00:02:10\n`;
    if (equal(args, ['route']) || equal(args, ['route', 'show'])) {
      const suffix = net.linkUp ? '' : ' linkdown';
      return (net.gateway ? `default via ${net.gateway} dev ${net.interface}${suffix}\n` : '') + [...new Map(net.addresses.map(value => {
        const parsed = cidr(value), prefix = ipText(parsed.base) + '/' + parsed.prefix;
        return [prefix, `${prefix} dev ${net.interface} proto kernel scope link src ${parsed.address}${suffix}\n`];
      })).values()].join('');
    }
    if (args[0] === 'link' && args[1] === 'set') {
      admin(shell);
      if (args.length !== 4 || args[2] !== net.interface || !['up', 'down'].includes(args[3])) fail(shell, `usage: ip link set ${net.interface} up|down`, 2);
      net.linkUp = args[3] === 'up'; return '';
    }
    if (args[0] === 'addr' && ['add', 'del'].includes(args[1])) {
      admin(shell);
      if (args.length !== 5 || args[3] !== 'dev' || args[4] !== net.interface || !cidr(args[2])) fail(shell, `usage: ip addr add|del DOCUMENTATION_IPV4/PREFIX dev ${net.interface} (prefix 1..30, host address required)`, 2);
      const exists = net.addresses.includes(args[2]);
      if (args[1] === 'add') {
        if (exists) fail(shell, 'RTNETLINK answers: File exists', 2);
        if (net.addresses.some(value => cidr(value).address === cidr(args[2]).address)) fail(shell, 'address already configured with another prefix; delete it first', 2);
        if (net.addresses.length >= 4) fail(shell, 'simulated interface supports at most four IPv4 addresses', 2);
        net.addresses.push(args[2]);
      } else {
        if (!exists) fail(shell, 'RTNETLINK answers: Cannot assign requested address', 2);
        net.addresses = net.addresses.filter(value => value !== args[2]);
      }
      return '';
    }
    if (equal(args, ['route', 'del', 'default'])) {
      admin(shell); if (!net.gateway) fail(shell, 'RTNETLINK answers: No such process', 2);
      net.gateway = null; return '';
    }
    if (args[0] === 'route' && args[1] === 'replace') {
      admin(shell);
      if (args.length !== 7 || args[2] !== 'default' || args[3] !== 'via' || args[5] !== 'dev' || args[6] !== net.interface || !documentationIP(args[4])) fail(shell, `usage: ip route replace default via DOCUMENTATION_IPV4 dev ${net.interface}`, 2);
      const gateway = args[4];
      if (!net.addresses.some(value => { const range = cidr(value); return sameSubnet(gateway, value) && ipv4(gateway) !== range.base && ipv4(gateway) !== range.base + range.size - 1; }) || net.addresses.some(value => cidr(value).address === gateway)) fail(shell, 'Nexthop has invalid gateway (must be another on-link host)', 2);
      net.gateway = gateway; return '';
    }
    fail(shell, 'unsupported ip syntax; use man ip', 2);
  };
  const ping = args => {
    if (args.length !== 3 || args[0] !== '-c' || !/^(?:[1-9]|10)$/.test(args[1])) fail(shell, 'usage: ping -c COUNT DESTINATION (COUNT 1..10; continuous ping is not modeled)', 2);
    const host = args[2], count = Number(args[1]), resolved = resolveHost(state, fs, host);
    if (resolved.error) fail(shell, host + ': ' + resolved.error, 2);
    const address = resolved.address, route = routeTo(state, address);
    if (route.error) fail(shell, route.error, 2);
    const responds = route.local || (route.endpoint?.reachable && route.endpoint.icmp), times = [];
    let output = `PING ${host} (${address}) 56(84) bytes of data.\n`;
    for (let sequence = 1; sequence <= count; sequence++) {
      if (!responds) continue;
      const time = (route.local ? 0.1 : route.endpoint.rtt) + (sequence % 3) * 0.1; times.push(time);
      output += `64 bytes from ${address}: icmp_seq=${sequence} ttl=${64 - Math.max(0, route.hops.length - 1)} time=${time.toFixed(2)} ms\n`;
    }
    output += `\n--- ${host} ping statistics ---\n${count} packets transmitted, ${times.length} received, ${responds ? 0 : 100}% packet loss, time ${(count - 1) * 1000}ms (simulated)\n`;
    if (times.length) {
      const average = times.reduce((a, b) => a + b) / times.length, deviation = Math.sqrt(times.reduce((a, b) => a + (b - average) ** 2, 0) / times.length);
      output += `rtt min/avg/max/mdev = ${Math.min(...times).toFixed(3)}/${average.toFixed(3)}/${Math.max(...times).toFixed(3)}/${deviation.toFixed(3)} ms\n`;
    } else shell.commandStatus = 1;
    return output;
  };
  const dig = args => {
    let server = null, short = false, type = 'A', name = null, typed = false;
    for (const arg of args) {
      if (arg === '+short' && !short) short = true;
      else if (arg.startsWith('@') && server === null && documentationIP(arg.slice(1))) server = arg.slice(1);
      else if (name === null && trainingName(arg)) name = normalizeName(arg);
      else if (['A', 'TXT'].includes(arg.toUpperCase()) && !typed) { type = arg.toUpperCase(); typed = true; }
      else fail(shell, 'usage: dig [@DOCUMENTATION_IPV4] NAME [A|TXT] [+short]');
    }
    if (!name) fail(shell, 'usage: dig [@DOCUMENTATION_IPV4] NAME [A|TXT] [+short]');
    const result = queryDNS(state, fs, name, type, server);
    if (result.error) fail(shell, 'communications error: ' + result.error, 9);
    const text = record => record.type === 'TXT' ? JSON.stringify(record.value) : record.value;
    if (short) return result.answers.map(text).join('\n') + (result.answers.length ? '\n' : '');
    return `; <<>> DiG (simulated) <<>> ${name} ${type}\n;; ->>HEADER<<- opcode: QUERY, status: ${result.status}, id: 1042\n;; flags: qr rd ra; QUERY: 1, ANSWER: ${result.answers.length}\n\n;; QUESTION SECTION:\n;${name}.\tIN\t${type}\n\n;; ANSWER SECTION:\n` + result.answers.map(record => `${name}.\t${record.ttl}\tIN\t${record.type}\t${text(record)}\n`).join('') + `\n;; SERVER: ${result.server}#53\n;; Query time: 2 msec (simulated)\n`;
  };
  const traceroute = args => {
    if (args.length !== 1) fail(shell, 'usage: traceroute DESTINATION (at most five simulated hops)');
    const resolved = resolveHost(state, fs, args[0]);
    if (resolved.error) fail(shell, args[0] + ': ' + resolved.error);
    const route = routeTo(state, resolved.address);
    if (route.error) fail(shell, route.error);
    let output = `traceroute to ${args[0]} (${resolved.address}), 5 hops max, 60 byte packets (simulated)\n`;
    const reaches = route.local || route.endpoint?.reachable;
    const hops = route.hops.map(hop => !reaches && hop.address === resolved.address ? {...hop, responds: false} : hop);
    if (!reaches) while (hops.length < 5) hops.push({responds: false});
    for (const [index, hop] of hops.slice(0, 5).entries()) output += `${String(index + 1).padStart(2)}  ${hop.responds ? `${hop.address}  ${hop.rtt.toFixed(3)} ms  ${(hop.rtt + 0.1).toFixed(3)} ms  ${(hop.rtt + 0.2).toFixed(3)} ms` : '* * *'}\n`;
    return output;
  };
  const curl = args => {
    let head = false, output = null, url = null;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '-I' && !head) head = true;
      else if (arg === '-o' && output === null && args[index + 1]) output = args[++index];
      else if (!arg.startsWith('-') && url === null) url = arg;
      else fail(shell, 'unsupported syntax; usage: curl [-I] [-o FILE] http://HOST/PATH', 2);
    }
    if (!url) fail(shell, 'usage: curl [-I] [-o FILE] http://HOST/PATH', 2);
    const resource = httpResource(state, fs, url);
    if (resource.error) fail(shell, resource.error, resource.code);
    const content = head ? resource.headers : resource.body;
    if (output !== null) {
      try { fs.write(output, content); }
      catch (error) { if (!(error instanceof LinuxError)) throw error; fail(shell, 'Failed writing received data: ' + error.message, 23); }
      return '';
    }
    return content;
  };
  return [['ip', ip], ['ping', ping], ['dig', dig], ['traceroute', traceroute], ['curl', curl]];
}
