// Question generation and session state reuse the Phase 1 IPv4 engine.
import {calculate, fromNumber, toNumber, parseIPv4, parsePrefix, prefixToMask} from './engine.mjs';

export const CATEGORIES = Object.freeze({
  A:'Network identification', B:'Broadcast addresses', C:'Usable host ranges', D:'Address capacity',
  E:'Subnet selection', F:'Same or different subnets', G:'Subnet boundaries', H:'Binary subnetting'
});
export const COVERAGE = Object.freeze({
  all:{label:'All Categories', categories:['A','B','C','D','E','F','G','H']},
  network:{label:'Network and Broadcast', categories:['A','B','F']},
  hosts:{label:'Host Ranges and Capacity', categories:['C','D']},
  selection:{label:'Subnet Selection and Boundaries', categories:['E','G']},
  binary:{label:'Binary Calculations', categories:['H']}
});
export const COUNTS = Object.freeze([5,10,15,20]);
export const PREFIXES = Object.freeze([16,20,21,22,23,24,25,26,27,28,29,30]);
const TYPES = {
  A:['network','mask','cidr'], B:['broadcast'], C:['first','last','validHost'],
  D:['total','usable','hostBits'], E:['selection'], F:['comparison'],
  G:['next','containing','range','prefixChange'], H:['binaryMask','binaryAnd','bitRole','wildcard']
};
const REQUIREMENTS = [2,3,6,7,14,15,30,31,50,62,63,120,126,127,128,254,255,256,510,511,512,1000,1022,1023,2046,2047,3000,4094];
const categoryOf = type => Object.keys(TYPES).find(category=>TYPES[category].includes(type));
const pick = (values,rng) => values[Math.floor(rng()*values.length)];
const integer = (min,max,rng) => min+Math.floor(rng()*(max-min+1));
export function seededRandom(seed) {
  let state=2166136261;
  for (const char of String(seed)) state=Math.imul(state^char.charCodeAt(0),16777619)>>>0;
  return () => {state=(state+0x6D2B79F5)>>>0;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
}
export function shuffled(values,rng) {
  const copy=[...values];
  for (let i=copy.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
export function newSeed() {
  const data=new Uint32Array(4);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(data);
  else for (let i=0;i<data.length;i++) data[i]=Math.floor(Math.random()*4294967296);
  return [...data].map(value=>value.toString(16).padStart(8,'0')).join('');
}
export function minimumPrefix(required) {
  if (!Number.isInteger(required)||required<1||required>4294967294) throw new Error('Use a positive whole-number host requirement within the IPv4 address space.');
  for (let prefix=30;prefix>=0;prefix--) if (calculate('10.0.0.1',prefix).usable>=required) return prefix;
  throw new Error('Host requirement is out of range.');
}
function privateHost(prefix,rng) {
  const family=integer(0,2,rng);
  const ip=family===0?`10.${integer(1,223,rng)}.${integer(0,255,rng)}.1`
    :family===1?`172.${integer(16,31,rng)}.${integer(0,255,rng)}.1`:`192.168.${integer(1,250,rng)}.1`;
  const block=calculate(ip,prefix);
  return fromNumber(toNumber(block.network)+integer(1,block.total-2,rng));
}
function choicesFor(correct,candidates,rng) {
  const unique=[...new Set([String(correct),...candidates.map(String)])];
  if (unique.length<4) throw new Error('A question requires four distinct relevant choices.');
  return shuffled([String(correct),...shuffled(unique.filter(value=>value!==String(correct)),rng).slice(0,3)],rng);
}
const binaryMask = prefix => calculate('10.0.0.1',prefix).binary.mask.join('.');
const adjacentPrefixes = prefix => [prefix-1,prefix+1,prefix-2,prefix+2,prefix-3,prefix+3].filter(p=>p>=0&&p<=30);

export function buildQuestion(type,data,requestedFormat='entry',rng=seededRandom('question')) {
  const category=categoryOf(type);
  if (!category) throw new Error('Unknown subnetting question type.');
  const {ip,prefix}=data;
  if (!PREFIXES.includes(prefix)) throw new Error('Practice uses conventional prefixes from the supported set.');
  const r=calculate(ip,prefix), lower=toNumber(r.network), upper=toNumber(r.broadcast);
  const next=fromNumber(lower+r.total);
  const addresses=[r.network,r.first,r.last,r.broadcast,r.ip,next,fromNumber(lower+r.total+1)];
  const maskPrefixes=adjacentPrefixes(prefix);
  const q={type,category,data:{...data},prompt:'',answerKind:'address',format:requestedFormat,correctAnswer:'',choices:[],explanation:'',lesson:'and',worksheet:{ip:r.ip,prefix}};
  let candidates=[];
  const blockExplanation=`${r.ip}/${prefix} uses mask ${r.mask}. AND clears the ${r.hostBits} host bits, giving network ${r.network}.`;
  switch (type) {
    case 'network':
      q.prompt=`A workstation uses ${r.ip}/${prefix}. What is its network address?`;
      q.correctAnswer=r.network;candidates=addresses;q.explanation=blockExplanation;break;
    case 'mask':
      q.prompt=`Which subnet mask corresponds to /${prefix}?`;
      q.answerKind='prefix';q.format=requestedFormat==='entry'?'entry':'select';q.correctAnswer=r.mask;
      candidates=maskPrefixes.map(prefixToMask);q.lesson='mask';
      q.explanation=`/${prefix} fills the first ${prefix} positions with 1 and the remaining ${r.hostBits} with 0. The binary mask ${r.binary.mask.join('.')} converts to ${r.mask}.`;break;
    case 'cidr':
      q.prompt=`A subnet uses mask ${r.mask}. What is its CIDR prefix?`;
      q.answerKind='prefix';q.format=requestedFormat==='entry'?'entry':'select';q.correctAnswer=`/${prefix}`;
      candidates=maskPrefixes.map(value=>`/${value}`);q.lesson='mask';
      q.worksheet=null; // A CIDR-filled worksheet would disclose this question's answer.
      q.explanation=`${r.mask} is ${r.binary.mask.join('.')} in binary. Count ${prefix} consecutive 1 positions to obtain /${prefix}; ${r.hostBits} host positions remain.`;break;
    case 'broadcast':
      q.prompt=`A host uses ${r.ip} with ${data.useMask?'subnet mask '+r.mask:'prefix /'+prefix}. What is the broadcast address?`;
      if (data.useMask) q.worksheet.givenMask=r.mask;
      q.correctAnswer=r.broadcast;candidates=[r.last,r.network,next,r.ip];q.lesson='broadcast';
      q.explanation=`${blockExplanation} The block has ${r.total} addresses, ending at ${r.broadcast}, immediately before the next subnet ${next}. Network ${r.network} OR wildcard ${r.wildcard} sets every host bit to 1.`;break;
    case 'first': case 'last':
      q.prompt=`For the subnet containing ${r.ip}/${prefix}, what is the ${type} usable host address?`;
      q.correctAnswer=r[type];candidates=addresses;q.lesson='range';
      q.explanation=`${blockExplanation} Broadcast is ${r.broadcast}. Add 1 to the network for first usable ${r.first}; subtract 1 from broadcast for last usable ${r.last}.`;break;
    case 'validHost':
      q.prompt=`Which address can be assigned to an ordinary host in ${r.network}/${prefix}?`;
      q.format='mcq';q.correctAnswer=r.ip;candidates=[r.network,r.broadcast,fromNumber(upper+2)];q.lesson='range';
      q.worksheet={ip:r.network,prefix};
      q.explanation=`The usable range is ${r.first} through ${r.last}, so ${r.ip} is inside it. ${r.network} identifies the network, ${r.broadcast} is broadcast, and ${fromNumber(upper+2)} belongs to the next subnet.`;break;
    case 'total': case 'usable': case 'hostBits':
      q.prompt=type==='hostBits'?`How many host bits remain in an IPv4 /${prefix} subnet?`
        :`How many ${type==='total'?'total IPv4 addresses':'usable host addresses'} are in a conventional /${prefix} subnet?`;
      q.answerKind='number';q.correctAnswer=String(r[type]);q.lesson='capacity';
      candidates=type==='hostBits'?[prefix,r.hostBits-1,r.hostBits+1,32]
        :[r.total,r.usable,r.total/2-(type==='usable'?2:0),r.total*2-(type==='usable'?2:0),r.total-1];
      q.explanation=`32 − ${prefix} = ${r.hostBits} host bits. Each bit doubles the combinations: 2^${r.hostBits} = ${r.total} total addresses. Reserving network and broadcast leaves ${r.total} − 2 = ${r.usable} usable hosts. A prefix one bit shorter doubles total addresses; one bit longer halves them.`;break;
    case 'selection': {
      const chosen=minimumPrefix(data.required), fit=calculate(r.ip,chosen);
      q.prompt=`A department needs ${data.required} usable IPv4 addresses on one conventional LAN. Which prefix provides sufficient capacity with the fewest unused addresses?`;
      q.answerKind='prefix';q.format=requestedFormat==='entry'?'entry':'select';q.correctAnswer=`/${chosen}`;
      candidates=adjacentPrefixes(chosen).filter(value=>value>=16).map(value=>`/${value}`);q.lesson='vlsm';q.worksheet=null;
      q.explanation=`A /${chosen} leaves ${fit.hostBits} host bits: 2^${fit.hostBits} − 2 = ${fit.usable} usable addresses, enough for ${data.required}. `
        +(chosen<30?`The next smaller block, /${chosen+1}, provides only ${calculate(r.ip,chosen+1).usable} usable addresses. A shorter prefix wastes more addresses.`:'A /30 is the smallest conventional LAN block; /31 instead has point-to-point semantics.');break;
    }
    case 'comparison': {
      const other=calculate(data.otherIP,prefix), same=r.network===other.network;
      q.prompt=`Hosts ${r.ip} and ${other.ip} both use subnet mask ${r.mask}. Do they belong to the same subnet or different subnets?`;
      q.answerKind='relation';q.format='entry';q.correctAnswer=same?'Same':'Different';
      q.worksheet.givenMask=r.mask;
      q.explanation=`AND each address with ${r.mask}: ${r.ip} gives ${r.network}/${prefix}; ${other.ip} gives ${other.network}/${prefix}. The Network IDs ${same?'match, so the hosts share a subnet':'differ, so the hosts are in different subnets'}. Compare all network bits rather than only the first three decimal octets.`;break;
    }
    case 'next':
      q.prompt=`A subnet is ${r.network}/${prefix}. What is the next subnet's network address at the same prefix length?`;
      q.correctAnswer=next;candidates=[r.broadcast,r.first,fromNumber(lower+r.total*2),r.network];q.lesson='example';
      q.worksheet={ip:r.network,prefix};
      q.explanation=`/${prefix} contains ${r.total} addresses. Add that full block to ${r.network} to obtain ${next}; ${r.broadcast} is the address just before it. `+blockSizeExplanation(r);break;
    case 'containing':
      q.prompt=`Which network ID and prefix identify the subnet containing ${r.ip} with prefix /${prefix}?`;
      q.answerKind='literal';q.format='mcq';q.correctAnswer=`${r.network}/${prefix}`;
      candidates=[`${next}/${prefix}`,`${r.first}/${prefix}`,`${fromNumber(lower+r.total*2)}/${prefix}`];
      q.explanation=`${blockExplanation} The containing block runs from ${r.network} through ${r.broadcast}. `+blockSizeExplanation(r);break;
    case 'range':
      q.prompt=`What is the complete network address range, including reserved network and broadcast addresses, for ${r.ip}/${prefix}?`;
      q.answerKind='literal';q.format='mcq';q.correctAnswer=`${r.network} through ${r.broadcast}`;
      candidates=[`${r.first} through ${r.last}`,`${r.network} through ${r.last}`,`${r.first} through ${r.broadcast}`];
      q.explanation=`${blockExplanation} The ${r.total}-address block ends at broadcast ${r.broadcast}. The complete range includes both endpoints; the usable host range ${r.first} through ${r.last} excludes them.`;break;
    case 'prefixChange': {
      const changed=calculate(r.ip,data.newPrefix);
      q.prompt=`An IPv4 prefix changes from /${prefix} to /${data.newPrefix}. How many total addresses does the new prefix represent?`;
      q.answerKind='number';q.correctAnswer=String(changed.total);q.lesson='capacity';
      candidates=[r.total,changed.usable,changed.total/2,changed.total*2,changed.total-1];
      q.explanation=`/${prefix} represents ${r.total} total addresses. Moving to /${data.newPrefix} ${data.newPrefix>prefix?'adds a network bit and halves':'removes a network bit and doubles'} the total to ${changed.total}. Equivalently, 32 − ${data.newPrefix} = ${changed.hostBits} host bits and 2^${changed.hostBits} = ${changed.total}.`;break;
    }
    case 'binaryMask':
      q.prompt=`Which binary subnet mask represents /${prefix}?`;
      q.answerKind='literal';q.format='mcq';q.correctAnswer=r.binary.mask.join('.');q.lesson='mask';
      candidates=[...maskPrefixes.map(binaryMask),r.binary.wildcard.join('.')];
      q.explanation=`A /${prefix} mask has ${prefix} consecutive 1s and ${r.hostBits} trailing 0s: ${q.correctAnswer}. Its decimal form is ${r.mask}.`;break;
    case 'binaryAnd':
      q.prompt=`Which binary Network ID results from ANDing IPv4 address ${r.ip} with mask ${r.mask}?`;
      q.answerKind='literal';q.format='mcq';q.correctAnswer=r.binary.network.join('.');
      candidates=[r.binary.ip.join('.'),r.binary.mask.join('.'),r.binary.broadcast.join('.'),r.binary.wildcard.join('.')];
      q.explanation=`IP ${r.binary.ip.join('.')} AND mask ${r.binary.mask.join('.')} gives ${q.correctAnswer}, or ${r.network}. Only 1 AND 1 produces 1; host positions become 0.`;break;
    case 'bitRole': {
      const network=data.bit<=prefix;
      q.prompt=`In a 32-bit IPv4 /${prefix} subnet, how is bit position ${data.bit} used? Count positions from the left, starting at 1.`;
      q.answerKind='literal';q.format='mcq';q.correctAnswer=network?'Network bit; mask bit is 1':'Host bit; mask bit is 0';q.lesson='binary';
      candidates=['Network bit; mask bit is 1','Host bit; mask bit is 0','Network bit; mask bit is 0','Host bit; mask bit is 1'];
      q.worksheet=null;
      q.explanation=`The first ${prefix} positions are network positions with mask bit 1; the remaining ${r.hostBits} positions are host positions with mask bit 0. Position ${data.bit} is ${network?'within':'after'} the network portion.`;break;
    }
    case 'wildcard':
      q.prompt=`What wildcard mask is used to find the broadcast address of ${r.ip}/${prefix}?`;
      q.correctAnswer=r.wildcard;candidates=[r.mask,r.network,r.broadcast,prefixToMask(Math.max(0,prefix-1))];q.lesson='broadcast';
      q.explanation=`Invert subnet mask ${r.mask}: ${r.binary.mask.join('.')} becomes ${r.binary.wildcard.join('.')}, or ${r.wildcard}. OR that wildcard with Network ID ${r.network} to obtain broadcast ${r.broadcast}.`;break;
  }
  if (q.format!=='entry') q.choices=choicesFor(q.correctAnswer,candidates,rng);
  const prefixOnly=['mask','cidr','total','usable','hostBits','binaryMask','wildcard'];
  q.uniqueKey=prefixOnly.includes(type)?`${type}:${prefix}`
    :type==='selection'?`selection:${data.required}`
    :type==='prefixChange'?`change:${prefix}:${data.newPrefix}`
    :type==='bitRole'?`bit:${prefix}:${data.bit}`
    :type==='comparison'?`comparison:${[r.ip,data.otherIP].sort().join(':')}:${prefix}`
    :type==='next'?`next:${r.network}:${prefix}`
    :`${type==='containing'?'network':type}:${r.ip}:${prefix}`;
  return q;
}
function blockSizeExplanation(r) {
  const octets=r.mask.split('.').map(Number), index=octets.findIndex(value=>value<255);
  return `The interesting octet is octet ${index+1}; its block size is 256 − ${octets[index]} = ${256-octets[index]} in that octet. Carry into the preceding octet when needed.`;
}

function questionData(type,rng) {
  let prefix=pick(PREFIXES,rng);
  if (type==='comparison') prefix=pick([16,20,22,23,25,26,27,28,29,30],rng);
  if (type==='prefixChange') prefix=pick(PREFIXES.filter(value=>value>=20&&value<=29),rng);
  const ip=privateHost(prefix,rng), r=calculate(ip,prefix);
  const data={ip,prefix};
  if (type==='broadcast') data.useMask=rng()<0.5;
  if (type==='selection') data.required=pick(REQUIREMENTS,rng);
  if (type==='bitRole') data.bit=integer(1,32,rng);
  if (type==='prefixChange') data.newPrefix=prefix+(rng()<0.5?-1:1);
  if (type==='comparison') {
    const lower=toNumber(r.network), same=rng()<0.5;
    // Wide subnets deliberately compare hosts on different third-octet values.
    if (prefix<=23) {
      data.ip=fromNumber(lower+integer(1,254,rng));
      data.otherIP=fromNumber(lower+(same?integer(256,r.total-2,rng):r.total+integer(1,254,rng)));
    } else {
      const offset=same?integer(1,r.total-2,rng):r.total+integer(1,r.total-2,rng);
      data.otherIP=fromNumber(lower+offset);
      if (data.otherIP===data.ip) data.otherIP=data.ip===r.first?r.last:r.first;
    }
  }
  return data;
}

export function generateQuestions({seed,count,coverage}) {
  if (typeof seed!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(seed)||!COUNTS.includes(count)||!Object.hasOwn(COVERAGE,coverage)) throw new Error('Choose a supported count, coverage, and seed.');
  const rng=seededRandom(seed), categories=COVERAGE[coverage].categories;
  const schedule=[];
  while (schedule.length<count) schedule.push(...shuffled(categories,rng).slice(0,count-schedule.length));
  const used={}, bags={}, prompts=new Set(), identities=new Set(), questions=[];
  for (const category of shuffled(schedule,rng)) {
    if (!bags[category]||used[category]%TYPES[category].length===0) bags[category]=shuffled(TYPES[category],rng);
    const type=bags[category][(used[category]||0)%TYPES[category].length];
    used[category]=(used[category]||0)+1;
    let q;
    for (let tries=0;tries<1000;tries++) {
      q=buildQuestion(type,questionData(type,rng),questions.length%2===0?'entry':'mcq',rng);
      if (!prompts.has(q.prompt)&&!identities.has(q.uniqueKey)) break;
      if (tries===999) throw new Error('Unable to create a unique practice session.');
    }
    prompts.add(q.prompt);identities.add(q.uniqueKey);q.id=`${seed}-${questions.length}`;questions.push(q);
  }
  // Even a short session contains both entry and choice interactions.
  if (!questions.some(q=>q.format==='entry')) {
    const q=questions.find(q=>!['validHost','containing','range','binaryMask','binaryAnd','bitRole'].includes(q.type));
    if (q) {q.format='entry';q.choices=[];}
  }
  if (!questions.some(q=>q.format!=='entry')) {
    const index=questions.findIndex(q=>q.type!=='comparison'), old=questions[index];
    questions[index]={...buildQuestion(old.type,old.data,'mcq',rng),id:old.id};
  }
  return questions;
}

function normalize(question,value) {
  if (typeof value!=='string'||value.length>128||!value.trim()) throw new Error('Enter or select an answer before submitting.');
  const text=value.trim();
  switch (question.answerKind) {
    case 'address': return parseIPv4(text.replace(/\s*\.\s*/g,'.')).join('.');
    case 'prefix': return `/${parsePrefix(text.replace(/\s*\.\s*/g,'.'))}`;
    case 'number': {
      if (!/^(\d+|\d{1,3}(,\d{3})+)$/.test(text)) throw new Error('Enter a nonnegative whole number. Commas in groups of three are accepted.');
      const number=Number(text.replaceAll(',',''));
      if (!Number.isSafeInteger(number)||number>4294967296) throw new Error('The number is outside the IPv4 calculation range.');
      return String(number);
    }
    case 'relation': {
      const relation=text.toLowerCase().replace(/\s+subnets?$/,'');
      if (!['same','different'].includes(relation)) throw new Error('Enter Same or Different.');
      return relation;
    }
    default: return text;
  }
}
export function gradeAnswer(question,input) {
  try {
    if (question.format!=='entry'&&!question.choices.includes(input)) throw new Error('Select one of the displayed choices.');
    const normalized=normalize(question,input);
    return {valid:true,correct:normalized===normalize(question,question.correctAnswer),normalized};
  } catch(error) {return {valid:false,correct:false,message:error.message};}
}
export function createSession({seed=newSeed(),count=10,coverage='all'}={}) {
  generateQuestions({seed,count,coverage});
  return {version:1,generatorVersion:1,seed,count,coverage,cursor:0,answers:Array(count).fill(null),drafts:Array(count).fill('')};
}
export function submitAnswer(session,input) {
  const questions=generateQuestions(session), question=questions[session.cursor];
  if (!question||session.answers[session.cursor]!==null) throw new Error('This question is already submitted.');
  const grade=gradeAnswer(question,input);
  if (!grade.valid) return {session,grade};
  const next={...session,answers:[...session.answers],drafts:[...session.drafts]};
  next.answers[session.cursor]=input.trim();next.drafts[session.cursor]='';
  return {session:next,grade};
}
export function nextQuestion(session) {
  if (session.cursor>=session.count||session.answers[session.cursor]===null) throw new Error('Submit the current answer first.');
  return {...session,cursor:session.cursor+1};
}
export function summarize(session) {
  const questions=generateQuestions(session), categories={};
  let correct=0,answered=0;
  questions.forEach((question,index)=>{
    categories[question.category]??={total:0,answered:0,correct:0};
    const category=categories[question.category];category.total++;
    if (session.answers[index]!==null) {
      answered++;category.answered++;
      if (gradeAnswer(question,session.answers[index]).correct) {correct++;category.correct++;}
    }
  });
  return {total:session.count,answered,correct,incorrect:answered-correct,percentage:Math.round(correct/session.count*100),categories};
}
export function sanitizeSession(raw) {
  if (!raw||raw.version!==1||raw.generatorVersion!==1) return null;
  // Recovery must never use createSession's defaults to replace lost identity
  // or coverage metadata with different questions under saved student answers.
  if (typeof raw.seed!=='string'||!COUNTS.includes(raw.count)||!Object.hasOwn(COVERAGE,raw.coverage)) return null;
  let session,questions;
  try {session=createSession(raw);questions=generateQuestions(session);} catch {return null;}
  if (!Array.isArray(raw.answers)||raw.answers.length!==session.count||!Array.isArray(raw.drafts)||raw.drafts.length!==session.count) return null;
  let answered=0;
  for (let i=0;i<session.count;i++) {
    if (raw.answers[i]===null||!gradeAnswer(questions[i],raw.answers[i]).valid) break;
    session.answers[i]=raw.answers[i].trim();answered++;
  }
  session.cursor=Number.isInteger(raw.cursor)?Math.max(0,Math.min(raw.cursor,answered)):answered;
  for (let i=answered;i<session.count;i++) session.drafts[i]=typeof raw.drafts[i]==='string'?raw.drafts[i].slice(0,128):'';
  return session;
}
