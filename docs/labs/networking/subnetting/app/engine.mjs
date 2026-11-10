// Pure IPv4 arithmetic and answer validation. No DOM or browser storage dependencies.
export const PLACE_VALUES = Object.freeze([128, 64, 32, 16, 8, 4, 2, 1]);
const MAX = 2 ** 32 - 1;

export function parseIPv4(value) {
  if (typeof value !== 'string') throw new Error('Enter four decimal octets separated by dots.');
  const parts = value.trim().split('.');
  if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
    throw new Error('Use four decimal octets from 0 to 255, such as 192.168.10.130.');
  }
  return parts.map(Number);
}

export function toNumber(address) {
  const octets = parseIPv4(address);
  return octets.reduce((total, octet) => total * 256 + octet, 0);
}

export function fromNumber(number) {
  if (!Number.isInteger(number) || number < 0 || number > MAX) throw new Error('IPv4 number is out of range.');
  return [24, 16, 8, 0].map(shift => Math.floor(number / 2 ** shift) % 256).join('.');
}

export function decimalToBinary(value) {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error('An octet must be an integer from 0 to 255.');
  return value.toString(2).padStart(8, '0');
}

export function binaryToDecimal(value) {
  if (typeof value !== 'string' || !/^[01]{8}$/.test(value)) throw new Error('Use exactly eight binary digits, 0 or 1.');
  return Number.parseInt(value, 2);
}

export function addressToBinary(address) {
  return parseIPv4(address).map(decimalToBinary);
}

export function prefixToMask(prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('CIDR prefix must be a whole number from 0 to 32.');
  return fromNumber(MAX - (2 ** (32 - prefix) - 1));
}

export function maskToPrefix(mask) {
  const bits = addressToBinary(mask).join('');
  if (!/^1*0*$/.test(bits)) throw new Error('A subnet mask must have consecutive 1 bits followed by 0 bits.');
  return bits.replace(/0/g, '').length;
}

export function parsePrefix(value) {
  if (typeof value !== 'string') throw new Error('Enter a CIDR prefix or a dotted-decimal subnet mask.');
  const text = value.trim();
  if (text.includes('.')) return maskToPrefix(text);
  if (!/^\/?\d{1,2}$/.test(text)) throw new Error('Use a CIDR prefix such as /26 or a subnet mask such as 255.255.255.192.');
  const prefix = Number(text.replace('/', ''));
  prefixToMask(prefix);
  return prefix;
}

export function binaryOperation(left, right, operation) {
  if (!['AND', 'OR'].includes(operation)) throw new Error('Choose AND or OR.');
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== 4 || right.length !== 4) throw new Error('Use four binary octets.');
  return left.map((octet, i) => {
    binaryToDecimal(octet); binaryToDecimal(right[i]);
    return [...octet].map((bit, j) => operation === 'AND'
      ? (bit === '1' && right[i][j] === '1' ? '1' : '0')
      : (bit === '1' || right[i][j] === '1' ? '1' : '0')).join('');
  });
}

export function calculate(address, cidrOrMask) {
  const ip = parseIPv4(address).join('.');
  const prefix = parsePrefix(String(cidrOrMask));
  const mask = prefixToMask(prefix);
  const hostBits = 32 - prefix;
  const total = 2 ** hostBits;
  // Arithmetic avoids signed 32-bit JavaScript shifts at /0 and high addresses.
  const lower = Math.floor(toNumber(ip) / total) * total;
  const upper = lower + total - 1;
  const conventional = prefix <= 30;
  const network = fromNumber(lower);
  const upperAddress = fromNumber(upper);
  const wildcard = fromNumber(total - 1);
  const broadcast = conventional ? upperAddress : null;
  const first = fromNumber(lower + (conventional ? 1 : 0));
  const last = fromNumber(upper - (conventional ? 1 : 0));
  return {
    ip, prefix, mask, wildcard, hostBits, total, network, upperAddress, broadcast, first, last,
    usable: conventional ? total - 2 : total,
    kind: conventional ? 'conventional' : prefix === 31 ? 'point-to-point' : 'host-route',
    binary: {ip: addressToBinary(ip), mask: addressToBinary(mask), network: addressToBinary(network),
      wildcard: addressToBinary(wildcard), broadcast: addressToBinary(upperAddress)}
  };
}

export const STEPS = Object.freeze([
  {id: 'mask', title: 'Build the subnet mask', binary: ['mask'], answers: ['mask'], lesson: 'mask'},
  {id: 'ip', title: 'Convert the IPv4 address', binary: ['ip'], answers: [], lesson: 'ip'},
  {id: 'and', title: 'AND corresponding bits', binary: ['network'], answers: [], lesson: 'and'},
  {id: 'network', title: 'Convert the Network ID', binary: [], answers: ['network'], lesson: 'and'},
  {id: 'wildcard', title: 'Invert the mask', binary: ['wildcard'], answers: [], lesson: 'broadcast'},
  {id: 'broadcast', title: 'Find the upper boundary', binary: ['broadcast'], answers: ['broadcast'], lesson: 'broadcast'},
  {id: 'range', title: 'Find the usable range', binary: [], answers: ['first', 'last'], lesson: 'range'},
  {id: 'capacity', title: 'Calculate address capacity', binary: [], answers: ['total', 'usable'], lesson: 'capacity'}
]);

export function freshWork(exampleIndex = 0) {
  return {version: 1, exampleIndex, ip: '192.168.50.173', prefix: 27, mode: 'guided', step: 0,
    binary: Object.fromEntries(['ip', 'mask', 'network', 'wildcard', 'broadcast'].map(k => [k, ['', '', '', '']])),
    answers: Object.fromEntries(['mask', 'network', 'broadcast', 'first', 'last', 'total', 'usable'].map(k => [k, ''])),
    attempted: [], verified: []};
}

export function sanitizeWork(raw) {
  const work = freshWork();
  if (!raw || raw.version !== 1 || !Number.isInteger(raw.prefix) || typeof raw.ip !== 'string') return work;
  try { calculate(raw.ip, raw.prefix); } catch { return work; }
  work.ip = parseIPv4(raw.ip).join('.'); work.prefix = raw.prefix;
  work.exampleIndex = Number.isInteger(raw.exampleIndex) && raw.exampleIndex >= 0 && raw.exampleIndex < 1000 ? raw.exampleIndex : 0;
  work.mode = raw.mode === 'independent' ? 'independent' : 'guided';
  work.step = Number.isInteger(raw.step) && raw.step >= 0 && raw.step < STEPS.length ? raw.step : 0;
  for (const key of Object.keys(work.binary)) {
    if (Array.isArray(raw.binary?.[key]) && raw.binary[key].length === 4) {
      work.binary[key] = raw.binary[key].map(v => typeof v === 'string' ? v.slice(0, 8) : '');
    }
  }
  for (const key of Object.keys(work.answers)) {
    work.answers[key] = typeof raw.answers?.[key] === 'string' ? raw.answers[key].slice(0, 32) : '';
  }
  work.attempted = Array.isArray(raw.attempted) ? [...new Set(raw.attempted.filter(v => Number.isInteger(v) && v >= 0 && v < STEPS.length))] : [];
  work.verified = Array.isArray(raw.verified) ? [...new Set(raw.verified.filter(v => work.attempted.includes(v)))] : [];
  return work;
}

export function checkStep(work, stepIndex) {
  const step = STEPS[stepIndex];
  if (!step) throw new Error('Unknown calculation step.');
  const result = calculate(work.ip, work.prefix);
  const issues = [];
  for (const row of step.binary) {
    for (let octet = 0; octet < 4; octet++) {
      const value = work.binary[row][octet].trim();
      const field = `${row}-${octet}`;
      if (!/^[01]{8}$/.test(value)) {
        issues.push({field, row, octet, bits: [], message: `Octet ${octet + 1}: enter exactly eight digits using only 0 and 1.`});
      } else {
        const bits = [...value].flatMap((bit, i) => bit !== result.binary[row][octet][i] ? [i] : []);
        if (bits.length) issues.push({field, row, octet, bits, message: `Octet ${octet + 1}: recheck bit position${bits.length > 1 ? 's' : ''} ${bits.map(v => v + 1).join(', ')} (left to right).`});
      }
    }
  }
  for (const key of step.answers) {
    const value = work.answers[key].trim();
    let correct = false;
    if (key === 'broadcast' && result.broadcast === null) correct = /^n\/?a$/i.test(value);
    else if (['total', 'usable'].includes(key)) {
      correct = /^(\d+|\d{1,3}(,\d{3})+)$/.test(value) && Number(value.replaceAll(',', '')) === result[key];
    } else {
      try { correct = parseIPv4(value).join('.') === result[key]; } catch { /* Feedback below covers malformed decimal answers. */ }
    }
    if (!correct) issues.push({field: `answer-${key}`, message: value ? `Recheck the ${key} answer and its operation.` : `Enter the ${key} answer.`});
  }
  return {correct: issues.length === 0, issues};
}
