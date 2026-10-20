// All addresses, services, records and timings are fictional. Never opens sockets.
export function ipv4(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split('.');
  if (parts.length !== 4 || !parts.every(p => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255)) return null;
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}
export const documentationIP = value => ipv4(value) !== null && ['192.0.2.', '198.51.100.', '203.0.113.'].some(prefix => value.startsWith(prefix));
export const allowedIP = value => documentationIP(value) || (ipv4(value) !== null && value.startsWith('127.'));
export function cidr(value) {
  if (typeof value !== 'string') return null;
  const [address, prefix, extra] = value.split('/');
  if (extra !== undefined || !documentationIP(address) || !/^(?:[1-9]|[12]\d|30)$/.test(prefix || '')) return null;
  const size = 2 ** (32 - Number(prefix)), number = ipv4(address), base = Math.floor(number / size) * size;
  if (number === base || number === base + size - 1) return null;
  return {address, prefix: Number(prefix), base, size};
}
export const sameSubnet = (address, subnet) => { const range = cidr(subnet), n = ipv4(address); return range && n !== null && n >= range.base && n < range.base + range.size; };
export const ipText = number => [24, 16, 8, 0].map(shift => Math.floor(number / 2 ** shift) % 256).join('.');
export const normalizeName = value => typeof value === 'string' ? value.toLowerCase().replace(/\.$/, '') : '';
export const validName = value => typeof value === 'string' && value.length <= 253 && normalizeName(value).split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
export const shortName = name => validName(name) && /[a-z-]/i.test(name) && !normalizeName(name).includes('.');
export const trainingName = name => validName(name) && (normalizeName(name) === 'localhost' || normalizeName(name) === 'student-linux' || normalizeName(name).endsWith('.training.example'));

export function seedNetwork() {
  const hop = (address, responds = true, rtt = 1) => ({address, responds, rtt});
  const resource = (path, body, status = 200, contentType = 'text/plain') => ({path, body, status, contentType});
  const endpoint = (address, name, hops, extra = {}) => ({address, name, reachable: true, icmp: true, rtt: hops.at(-1).rtt + 0.2, dns: null, http: null, hops, ...extra});
  const gateway = hop('192.0.2.1');
  return {
    interface: 'enp0s3', linkUp: true, addresses: ['192.0.2.10/24'], gateway: '192.0.2.1',
    endpoints: [
      endpoint('192.0.2.1', 'gateway.training.example', [gateway]),
      endpoint('192.0.2.53', 'dns.training.example', [hop('192.0.2.53')], {dns: {available: true, servfail: false}}),
      endpoint('192.0.2.54', 'dns-backup.training.example', [hop('192.0.2.54')], {dns: {available: true, servfail: false}}),
      endpoint('192.0.2.20', 'files.training.example', [hop('192.0.2.20')], {http: {available: true, resources: [
        resource('/', 'Training file service ready.\n'), resource('/report', '<!doctype html><title>Workstation report</title><h1>Support report</h1><p>Training service is available.</p>\n', 200, 'text/html')
      ]}}),
      endpoint('198.51.100.20', 'portal.training.example', [gateway, hop('198.51.100.1', false, 3), hop('198.51.100.20', true, 5)], {http: {available: true, resources: [resource('/', 'Student support portal ready.\n')]}}),
      endpoint('203.0.113.30', 'status.training.example', [gateway, hop('198.51.100.1', false, 3), hop('203.0.113.30', true, 7)], {icmp: false, http: {available: true, resources: [resource('/', 'Service temporarily unavailable.\n', 503)]}}),
      endpoint('203.0.113.80', 'unavailable.training.example', [gateway], {reachable: false}),
      endpoint('198.51.100.80', 'repo.training.example', [gateway, hop('198.51.100.1', false, 3), hop('198.51.100.80', true, 5)], {http: {available: true, resources: [resource('/mint/Packages', 'Fictional Mint package index\n'), resource('/fedora/repodata', 'Fictional Fedora package index\n')]}})
    ],
    records: [
      ...[['files','192.0.2.20'], ['portal','198.51.100.20'], ['status','203.0.113.30'], ['unavailable','203.0.113.80'], ['repo','198.51.100.80'], ['dns','192.0.2.53'], ['gateway','192.0.2.1'], ['dns-backup','192.0.2.54']].map(([name, value]) => ({name: name + '.training.example', type: 'A', value, ttl: 300})),
      {name: 'portal.training.example', type: 'TXT', value: 'Fictional student support portal', ttl: 300}
    ]
  };
}

export function routeTo(state, address) {
  const network = state.network;
  if (address.startsWith('127.')) return {local: true, endpoint: null, hops: [{address, responds: true, rtt: 0.1}]};
  if (!network.linkUp) return {error: 'Network is down'};
  if (!network.addresses.length) return {error: 'Network is unreachable (no IPv4 address)'};
  if (network.addresses.some(value => cidr(value).address === address)) return {local: true, endpoint: null, hops: [{address, responds: true, rtt: 0.1}]};
  const direct = network.addresses.some(value => sameSubnet(address, value));
  if (!direct && !network.gateway) return {error: 'Network is unreachable (no default route)'};
  // The physical practice LAN is 192.0.2.0/24. A configured prefix is not a new physical link.
  if (!network.addresses.some(value => cidr(value).address.startsWith('192.0.2.') && sameSubnet('192.0.2.1', value))
    || (!address.startsWith('192.0.2.') && direct) || (!direct && network.gateway !== '192.0.2.1')) return {error: 'Destination Host Unreachable (no usable next hop)'};
  if (!direct && !network.endpoints.find(peer => peer.address === network.gateway)?.reachable) return {error: 'Destination Host Unreachable (default gateway unavailable)'};
  const endpoint = network.endpoints.find(peer => peer.address === address);
  return {endpoint, local: false, hops: endpoint?.hops || (direct ? [] : [{address: network.gateway, responds: true, rtt: 1}])};
}
export function resolvers(fs) {
  try {
    return fs.read('/etc/resolv.conf').split('\n').map(line => line.replace(/[#;].*$/, '').trim().split(/\s+/))
      .filter(parts => parts[0] === 'nameserver' && ipv4(parts[1]) !== null).map(parts => parts[1]).slice(0, 3);
  } catch { return []; }
}
export function queryDNS(state, fs, name, type = 'A', explicit = null) {
  const addresses = explicit ? [explicit] : resolvers(fs);
  for (const server of addresses) {
    const route = routeTo(state, server), peer = route.endpoint;
    if (route.error || route.local || !peer?.reachable || !peer.dns?.available) continue;
    const records = state.network.records.filter(record => record.name === normalizeName(name));
    return {server, status: peer.dns.servfail ? 'SERVFAIL' : records.length ? 'NOERROR' : 'NXDOMAIN',
      answers: peer.dns.servfail ? [] : records.filter(record => record.type === type)};
  }
  return {error: `no servers could be reached${addresses.length ? ' (resolver ' + addresses.join(', ') + ')' : ' (no usable nameserver in /etc/resolv.conf)'}`};
}
export function resolveHost(state, fs, host) {
  if (allowedIP(host)) return {address: host};
  if (!trainingName(host) && !shortName(host)) return {error: 'destination is outside the simulated environment'};
  const name = normalizeName(host);
  // NSS-style hosts-before-DNS subset. dig deliberately bypasses this file.
  try {
    for (const line of fs.read('/etc/hosts').split('\n')) {
      const [address, ...names] = line.replace(/#.*/, '').trim().split(/\s+/);
      if (allowedIP(address) && names.some(alias => normalizeName(alias) === name)) return {address};
    }
  } catch { /* A readable DNS resolver may still resolve the name. */ }
  const candidates = [];
  if (shortName(host)) {
    try {
      for (const line of fs.read('/etc/resolv.conf').split('\n')) {
        const [directive, ...domains] = line.replace(/[#;].*$/, '').trim().split(/\s+/);
        if (['search', 'domain'].includes(directive)) for (const domain of domains.slice(0, 3)) {
          const candidate = name + '.' + normalizeName(domain);
          if (trainingName(candidate)) candidates.push(candidate);
        }
      }
    } catch { /* No supported search domains. */ }
  }
  candidates.push(name);
  for (const candidate of candidates.slice(0, 4)) {
    const query = queryDNS(state, fs, candidate);
    if (query.error || query.status === 'SERVFAIL') return {error: 'Temporary failure in name resolution: ' + (query.error || 'SERVFAIL')};
    if (query.status === 'NOERROR' && query.answers.length) return {address: query.answers[0].value};
  }
  return {error: 'Name or service not known (NXDOMAIN)'};
}
export function httpResource(state, fs, rawURL) {
  // Parsing a URL does not perform a request. Only HTTP port 80 and modeled destinations exist.
  let url;
  try { url = new URL(rawURL); } catch { return {error: 'malformed URL; use http://HOST/PATH', code: 3}; }
  if (url.protocol !== 'http:') return {error: 'only simulated http:// URLs are supported; HTTPS/TLS is not modeled', code: 1};
  if (url.username || url.password || url.port || url.search || url.hash || !/^[\x21-\x7e]+$/.test(rawURL)) return {error: 'credentials, alternate ports, query strings and fragments are unsupported', code: 3};
  // Use the original hostname too: URL parsing must not turn integer/hex addresses into allowed IPv4.
  const originalHost = rawURL.match(/^http:\/\/([^/]+)/i)?.[1];
  if (!originalHost || (!trainingName(originalHost) && !shortName(originalHost) && !allowedIP(originalHost))) return {error: 'URL is outside the simulated environment', code: 6};
  if (normalizeName(url.hostname) !== normalizeName(originalHost)) return {error: 'noncanonical URL hostname is outside the supported environment', code: 6};
  const resolved = resolveHost(state, fs, url.hostname);
  if (resolved.error) return {error: resolved.error, code: 6};
  const route = routeTo(state, resolved.address);
  if (route.error) return {error: route.error, code: 7};
  if (!route.local && !route.endpoint?.reachable) return {error: 'Connection timed out to ' + resolved.address, code: 28};
  const service = route.endpoint?.http;
  if (!service?.available) return {error: 'Failed to connect to ' + resolved.address + ' port 80: Connection refused', code: 7};
  const resource = service.resources.find(item => item.path === url.pathname) || {status: 404, contentType: 'text/plain', body: 'Not Found\n'};
  const reason = {200: 'OK', 404: 'Not Found', 503: 'Service Unavailable'}[resource.status];
  const headers = `HTTP/1.1 ${resource.status} ${reason}\nContent-Type: ${resource.contentType}\nContent-Length: ${new TextEncoder().encode(resource.body).length}\nServer: training-http (simulated)\n\n`;
  return {...resource, headers, address: resolved.address};
}

export function restoreNetwork(value) {
  const invalid = () => { throw Error('Invalid network state'); };
  const seed = seedNetwork();
  if (!value || value.interface !== seed.interface || typeof value.linkUp !== 'boolean' || !Array.isArray(value.addresses) || value.addresses.length > 4
    || !value.addresses.every(address => cidr(address)) || new Set(value.addresses).size !== value.addresses.length
    || (value.gateway !== null && !documentationIP(value.gateway)) || !Array.isArray(value.endpoints) || value.endpoints.length !== seed.endpoints.length) invalid();
  const endpoints = value.endpoints.map((peer, index) => {
    const original = seed.endpoints[index];
    if (!peer || ['address', 'name', 'rtt'].some(key => peer[key] !== original[key]) || typeof peer.reachable !== 'boolean' || typeof peer.icmp !== 'boolean' || JSON.stringify(peer.hops) !== JSON.stringify(original.hops)) invalid();
    if (original.dns ? !peer.dns || typeof peer.dns.available !== 'boolean' || typeof peer.dns.servfail !== 'boolean' : peer.dns !== null) invalid();
    if (original.http ? !peer.http || typeof peer.http.available !== 'boolean' || !Array.isArray(peer.http.resources) || peer.http.resources.length !== original.http.resources.length : peer.http !== null) invalid();
    const resources = original.http?.resources.map((resource, i) => {
      const saved = peer.http.resources[i];
      if (!saved || saved.path !== resource.path || ![200, 404, 503].includes(saved.status) || !['text/plain', 'text/html'].includes(saved.contentType) || typeof saved.body !== 'string' || saved.body.length > 16000) invalid();
      return {path: saved.path, status: saved.status, contentType: saved.contentType, body: saved.body};
    });
    return {...original, reachable: peer.reachable, icmp: peer.icmp, dns: original.dns ? {available: peer.dns.available, servfail: peer.dns.servfail} : null,
      http: original.http ? {available: peer.http.available, resources} : null};
  });
  if (!Array.isArray(value.records) || value.records.length > 32) invalid();
  const records = value.records.map(record => {
    if (!record || !trainingName(record.name) || normalizeName(record.name) !== record.name || !['A', 'TXT'].includes(record.type) || !Number.isInteger(record.ttl) || record.ttl < 0 || record.ttl > 86400
      || typeof record.value !== 'string' || record.value.length > 1024 || (record.type === 'A' && !documentationIP(record.value))) invalid();
    return {name: record.name, type: record.type, ttl: record.ttl, value: record.value};
  });
  return {...seed, linkUp: value.linkUp, addresses: [...value.addresses], gateway: value.gateway, endpoints, records};
}
