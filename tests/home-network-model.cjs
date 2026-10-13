// Run with node tests/home-network-model.cjs; all addressing families, variants, and affected clients.
const assert = require('node:assert/strict');
const M = require('../docs/practice/pbqs/a-plus-core-2/home-network-configuration/app/model.js');
const state = (type, seed = 0) => M.initial(M.specification(type, seed));
function applied(result) { assert.equal(result.ok, true, result.message); }
function solve(st) {
  const s = st.spec, id = s.affected;
  if (s.type === 'lease') { applied(M.applyRouter(st,{...st.router,dhcp:true,poolEnd:149})); assert.match(M.command(st,id,'ipconfig /renew'), /IPv4 Address/); }
  if (s.type === 'route') applied(M.applyPC(st,id,{...st.pcs[id],mask:s.mask,gateway:s.gateway}));
  if (s.type === 'dns') applied(M.applyPC(st,id,{...st.pcs[id],dns:s.gateway}));
  if (s.type === 'wifi') {
    applied(M.applyAP(st,{...st.ap,mainSecurity:s.legacy?'transition':'wpa3',mainBand:s.legacy?'dual':'5',guestSecurity:'wpa2-aes',guestBand:'dual',isolation:true}));
    applied(M.applyPC(st,id,{...st.pcs[id],network:'main',key:st.ap.mainKey}));
  }
  if (s.type === 'remote') {
    applied(M.applyRouter(st,{...st.router,forward:{enabled:true,protocol:'UDP',externalPort:s.vpnPort,target:s.vpn,internalPort:s.vpnPort}}));
    applied(M.applyHost(st,{...st.host,rdp:true,firewall:true,rule:true,protocol:'TCP',port:3389,profile:'Private',scope:s.vpnNetwork}));
  }
  st.diagnosis = s.cause;
}
function verify(st) {
  const s=st.spec,id=s.affected;
  if(s.type==='wifi') { assert.equal(M.test(st,id,'printer').ok,true); assert.equal(M.test(st,'guest','portal').ok,true); assert.equal(M.test(st,'guest','printer').ok,false); assert.equal(M.test(st,'guest','admin').ok,false); }
  else if(s.type==='remote') { assert.equal(M.test(st,'vpn-client','rdp').ok,true); assert.equal(M.test(st,'internet','rdp').ok,false); assert.equal(M.test(st,'guest','rdp').ok,false); }
  else { assert.match(M.command(st,id,'ping '+s.gateway),/Lost = 0/); assert.match(M.command(st,id,'ping '+(s.type==='route'&&s.variant?s.archive:s.hostname)),/Lost = 0/); }
}
let cases=0;
for(const type of M.TYPES) for(let seed=0;seed<120;seed++) {
  const st=state(type,seed),s=st.spec,id=s.affected;
  assert.ok(M.inCIDR(s.gateway,s.network)); assert.ok(M.inCIDR(s.guestGateway,s.guestNetwork)); assert.ok(!M.inCIDR(s.vpnClient,s.network));
  assert.ok(M.grade(st).score<100);
  if(type==='lease'){assert.match(M.command(st,id,'ipconfig /all'),/169\.254\./); assert.match(M.command(st,id,'ipconfig /renew'),/timed out/);assert.equal(M.test(st,id,'portal').ok,false);}
  if(type==='route'){assert.equal(M.test(st,id,'printer').ok,true);assert.equal(M.test(st,id,'archive').ok,false);assert.equal(M.test(st,id==='pc1'?'pc2':'pc1','archive').ok,true);}
  if(type==='dns'){assert.match(M.command(st,id,'ping '+s.portal),/Lost = 0/);assert.match(M.command(st,id,'ping '+s.hostname),/could not find host/);assert.match(M.command(st,id,'nslookup '+s.hostname),/timed-out/);assert.match(M.command(st,id,'nslookup '+s.hostname+' '+s.gateway),/Non-authoritative answer/);assert.match(M.command(st,id,'ipconfig /flushdns'),/Successfully flushed/);assert.match(M.command(st,id,'ping '+s.hostname),/could not find host/);}
  if(type==='wifi'&&s.variant){assert.match(M.command(st,id,'ipconfig /all'),/Media disconnected/);assert.equal(M.test(st,id,'printer').ok,false);}
  if(type==='remote'){assert.equal(M.test(st,'vpn-client','rdp').ok,false);assert.equal(M.test(st,'internet','rdp').ok,false);}
  solve(st); assert.equal(M.grade(st).score,80); verify(st); assert.equal(M.grade(st).score,100,JSON.stringify({type,seed,grade:M.grade(st)}));
  const restored=M.restore(JSON.parse(JSON.stringify(st)));assert.equal(M.grade(restored).score,100);
  st.diagnosis='link';assert.equal(M.grade(st).score,80); st.diagnosis=s.cause;
  applied(M.applyAP(st,{...st.ap}));assert.equal(M.grade(st).score,80,'Any applied change invalidates previous verification');
  verify(st); assert.equal(M.grade(st).score,100);
  assert.deepEqual(M.initial(s),state(type,seed),'Reset repeats the identical fault');
  cases++;
}
// Syntax validation never mutates configuration on rejected forms.
let st=state('route');const before=JSON.stringify(st);
assert.equal(M.applyPC(st,st.spec.affected,{...st.pcs[st.spec.affected],ip:'999.1.1.1'}).ok,false);
assert.equal(M.applyPC(st,st.spec.affected,{...st.pcs[st.spec.affected],mask:'255.0.255.0'}).ok,false);
assert.equal(M.applyRouter(st,{...st.router,poolStart:149,poolEnd:100}).ok,false);
assert.equal(M.applyRouter(st,{...st.router,forward:{...st.router.forward,externalPort:65536}}).ok,false);
assert.equal(JSON.stringify(st),before);
for(const value of ['256.1.1.1','01.2.3.4','1.2.3','1.2.3.4<script>']) assert.equal(M.ipv4(value),false);
// A manual workaround leaves the mandatory DHCP repair unresolved.
st=state('lease');applied(M.applyPC(st,st.spec.affected,{...st.pcs[st.spec.affected],assignment:'manual',dnsMode:'manual',ip:st.spec.base+'.180',mask:st.spec.mask,gateway:st.spec.gateway,dns:st.spec.gateway}));verify(st);assert.ok(M.grade(st).score<=20);
// Release, renew, and explicit queries do not fabricate lease or verification success.
st=state('dns');assert.match(M.command(st,st.spec.affected,'ipconfig /release'),/operation failed/);
applied(M.applyPC(st,st.spec.affected,{...st.pcs[st.spec.affected],assignment:'auto',dnsMode:'auto'}));
assert.match(M.command(st,st.spec.affected,'ipconfig /release'),/0\.0\.0\.0/);assert.equal(M.test(st,st.spec.affected,'portal').ok,false);
assert.match(M.command(st,st.spec.affected,'ipconfig /renew'),/IPv4 Address/);assert.equal(M.test(st,st.spec.affected,'portal').ok,true);
assert.match(M.command(st,st.spec.affected,'nslookup unknown.example.test'),/Non-existent domain/);
// Wrong destinations, transports, profiles, and source scopes affect real access outcomes.
st=state('remote');solve(st);
for(const change of [{protocol:'TCP'},{target:st.pcs[st.spec.affected].ip},{externalPort:443},{internalPort:3389}]) {const copy=M.clone(st);applied(M.applyRouter(copy,{...copy.router,forward:{...copy.router.forward,...change}}));assert.equal(M.test(copy,'vpn-client','rdp').ok,false);}
for(const change of [{profile:'Public'},{port:22},{protocol:'UDP'},{scope:st.spec.network},{rdp:false},{rule:false}]) {const copy=M.clone(st);applied(M.applyHost(copy,{...copy.host,...change}));assert.equal(M.test(copy,'vpn-client','rdp').ok,false);}
const broad=M.clone(st);applied(M.applyHost(broad,{...broad.host,scope:'Any'}));applied(M.applyAP(broad,{...broad.ap,isolation:false}));assert.equal(M.test(broad,'guest','rdp').ok,true);assert.ok(M.grade(broad).score<80);
const disabled=M.clone(st);applied(M.applyHost(disabled,{...disabled.host,firewall:false}));verify(disabled);assert.ok(M.grade(disabled).score<100);
applied(M.applyHost(st,{...st.host,scope:st.spec.vpnClient+'/32'}));verify(st);assert.equal(M.grade(st).score,100,'Single enrolled client is an accepted narrower scope');
// Client credentials, Enterprise prerequisites, band support, and isolation are independent.
st=state('wifi',2);solve(st);const id=st.spec.affected;
for(const change of [{mainSecurity:'wpa3'},{mainSecurity:'wpa3-enterprise'},{mainBand:'5'},{mainKey:'Different!Office'}]) {const copy=M.clone(st);applied(M.applyAP(copy,{...copy.ap,...change}));assert.equal(M.test(copy,id,'printer').ok,false);}
const transition=M.clone(st);applied(M.applyAP(transition,{...transition.ap,guestSecurity:'transition'}));verify(transition);assert.equal(M.grade(transition).score,100,'A compatible protected guest transition profile is accepted');
applied(M.applyAP(st,{...st.ap,isolation:false}));assert.equal(M.test(st,'guest','printer').ok,true);assert.ok(M.grade(st).score<80);
for(const ip of [st.spec.gateway,st.spec.printer,st.spec.vpn,st.pcs[id==='pc1'?'pc2':'pc1'].ip,st.spec.base+'.255']) {const copy=state('route');applied(M.applyPC(copy,copy.spec.affected,{...copy.pcs[copy.spec.affected],ip,mask:copy.spec.mask,gateway:copy.spec.gateway}));assert.equal(M.localValid(copy,copy.spec.affected),false);}
assert.ok(M.TYPES.includes(M.restore({version:99}).spec.type));assert.notEqual(M.fresh(st.spec).spec.type,st.spec.type);
console.log(`PASS: ${cases} scenario models; faults, repairs, command syntax, partial credit, stale verification, persistence, DHCP lifecycle, address validation, wireless boundaries, NAT, VPN, firewall scope, and reset.`);
