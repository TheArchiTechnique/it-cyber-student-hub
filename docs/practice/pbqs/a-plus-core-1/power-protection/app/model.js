/* Scenario ratings and conservative runtime bands are illustrative supplied data,
   not specifications of a commercial UPS or a watts-to-runtime formula. */
(function(root){
'use strict';
const KEY='student-hub-power-protection-v1';
const types=['workstation','network','capacity','troubleshooting'];
const faults={outlet:'Critical equipment on surge-only outlets',battery:'Failed UPS battery',overload:'Excessive connected load',runtime:'Insufficient battery runtime'};
const sources={battery:'UPS battery + surge',surge:'UPS surge only',strip:'Separate surge protector',wall:'Grounded wall outlet',poe:'PoE from switch'};
const models={
 compact:{name:'Office 600',va:600,watts:360,outlets:6,surgeOutlets:3,table:[[60,50],[120,25],[180,14],[240,8],[300,5],[360,3]]},
 standard:{name:'Office 1000',va:1000,watts:600,outlets:6,surgeOutlets:3,table:[[100,70],[200,30],[300,18],[400,12],[500,8],[600,5]]},
 extended:{name:'Office 1500',va:1500,watts:900,outlets:6,surgeOutlets:3,table:[[100,100],[200,55],[300,35],[450,22],[600,14],[750,9],[900,6]]}
};
const clone=x=>JSON.parse(JSON.stringify(x));
function scenario(type='workstation',seed=0,fault){
 if(!types.includes(type))type='workstation';
 seed=Number.isSafeInteger(seed)&&seed>=0?seed%1000000:0;
 const n=seed%3, devices=[],add=(id,name,shape,w,va,requirement,extra={})=>devices.push({id,name,shape,w,va,requirement,protected:true,...extra});
 let title,work,minutes,upsId,essential,services=[],incident='',primary='';
 if(type==='network'){
  const full=seed%2===0;
  add('ont','Fiber ONT','ont',12+n*2,24,'Provides the office WAN handoff.');
  add('router','Router','router',15+n*2,28,'Routes office traffic through the ONT.');
  add('switch','PoE Ethernet switch','switch',24,40,'Connects the wired service path; can supply the AP and phone. 60 W PoE budget.',{poeBudget:60});
  add('ap','Wireless access point','ap',12,20,'Connects wireless clients through the switch.',{poe:true});
  add('phone','VoIP phone','phone',7,14,'Reaches the hosted phone service through the switch, router, and ONT.',{poe:true});
  add('pc','Reception desktop','pc',170+n*20,280,'Local work may stop during this interruption.');
  add('printer','Laser printer','printer',650,900,'Printing may stop. Supplied printer documentation excludes both UPS outlet banks.',{noUPS:true});
  essential=full?['ont','router','switch','ap','phone']:['ont','router','switch'];minutes=full?20:25;upsId='compact';
  services=[{name:'Local switching',path:['switch']},{name:'Wired WAN path',path:['ont','router','switch']}];
  if(full)services.push({name:'Wireless internet access',path:['ont','router','switch','ap']},{name:'Hosted VoIP calls',path:['ont','router','switch','phone']});
  else services.push({name:'Wireless internet access (optional)',path:['ont','router','switch','ap'],optional:true},{name:'Hosted VoIP calls (optional)',path:['ont','router','switch','phone'],optional:true});
  title='Keep the network running';
  work=`Keep ${full?'wired and wireless internet access and hosted VoIP calls':'the wired WAN path and local switching'} available for ${minutes} minutes during a local power interruption. Reception work and printing may pause. ${full?'Wireless clients use the access point, and the phone uses the hosted provider.':'Wireless clients and phone service are not required during this outage.'}`;
 }else{
  add('pc','Desktop workstation','pc',170+n*20,Math.ceil((170+n*20)/.68),'The user must save active work and shut down manually.');
  add('monitor','Monitor','monitor',25+n*5,Math.ceil((25+n*5)/.7),'The user needs the display throughout the manual shutdown.');
  add('disk','External storage','disk',12,20,'The active project is on this separately powered drive. Writes must finish before shutdown.');
  essential=['pc','monitor','disk'];minutes=type==='capacity'?18:8+n*2;upsId='standard';
  services=[{name:'Manual save and shutdown',path:essential}];
  if(type==='workstation'){
   add('printer','Laser printer','printer',650,900,'Printing can stop. Supplied printer documentation excludes both UPS outlet banks.',{noUPS:true});
   if(seed%2)add('scanner','Scanner','scanner',20,35,'Scanning can stop during an outage.');
   add('lamp','Desk lamp','lamp',40,50,'Lighting may stop; normal grounded power is sufficient.',{protected:false});
   title='Protect the workstation';work=`Protect the office equipment and give the user at least ${minutes} minutes to save the active project on the external drive and shut down using the monitor. Printing, scanning, and lighting may stop.`;
  }else if(type==='capacity'){
   add('projector','Meeting projector','projector',180+n*10,270,'Meetings may stop during an outage.');
   add('printer','Laser printer','printer',650,900,'Printing may stop. Supplied printer documentation excludes both UPS outlet banks.',{noUPS:true});
   add('scanner','Scanner','scanner',20,35,'Scanning may stop during an outage.');
   title='UPS overload and capacity';work=`The workstation must support a manual save and shutdown for at least ${minutes} minutes. The installed UPS currently carries office equipment that is not needed during an outage. Keep appropriate surge protection and correct its load or sizing.`;
  }else{
   primary=Object.hasOwn(faults,fault)?fault:Object.keys(faults)[seed%4];
   add('fan','Desk fan','fan',60,210,'The fan may stop. Normal grounded power is sufficient.',{protected:false});
   title='Why did the backup fail?';minutes=primary==='overload'?2:12;
   upsId=['overload','runtime'].includes(primary)?'compact':'standard';
   if(primary==='overload'){
    devices[0].name='Legacy desktop workstation';
    devices[0].va=devices[0].w*2;
    devices[0].requirement+=' Its older PSU has a specified power factor of 0.50 at this load.';
   }
   const symptoms={outlet:'The PC and external drive stayed on, but the display went dark immediately. No overload or battery alert was reported.',battery:'All three work devices lost power immediately. The UPS self-test failed and its replace-battery indicator is on.',overload:'The UPS sounded its overload alarm and shut off its battery output as utility power failed.',runtime:'All three work devices stayed on initially, then turned off before the required shutdown time. No overload or replace-battery alert was reported.'};
   incident=symptoms[primary];work=`Investigate the reported backup failure. The PC, monitor, and external drive must stay available for at least ${minutes} minutes to complete a manual save and shutdown. Identify the primary fault and apply a correction. The fan may stop.`;
  }
 }
 const s={type,seed,title,work,minutes,devices,essential,services,upsId,fault:primary,incident};
 s.start=Object.fromEntries(devices.map(d=>[d.id,'']));
 if(type==='capacity')for(const d of devices)s.start[d.id]=d.noUPS?'strip':'battery';
 if(type==='troubleshooting'){
  for(const d of devices)s.start[d.id]=essential.includes(d.id)?'battery':'wall';
  if(primary==='outlet')s.start.monitor='surge';
  if(primary==='overload')s.start.fan='battery';
 }
 return s;
}
function initial(s){return {version:1,scenario:clone(s),connections:clone(s.start),input:['capacity','troubleshooting'].includes(s.type)?'wall':'',upsId:s.upsId,batteryReplaced:false,diagnosis:'',tested:false,submitted:false};}
function fresh(previous){const pool=types.filter(t=>t!==previous?.type),type=pool[Math.floor(Math.random()*pool.length)];return initial(scenario(type,Math.floor(Math.random()*1000000)));}
function allowed(d){return ['',...Object.keys(sources).filter(x=>x!=='poe'||d.poe)];}
function connect(state,id,source){const d=state.scenario.devices.find(d=>d.id===id);if(!d||!allowed(d).includes(source))return false;state.connections[id]=source;state.tested=false;state.submitted=false;return true;}
function effective(state,id,visited=new Set()){
 if(visited.has(id))return '';visited.add(id);
 const source=state.connections[id];return source==='poe'?effective(state,'switch',visited):source;
}
function batteryHealth(state){return state.scenario.fault==='battery'&&state.upsId===state.scenario.upsId&&!state.batteryReplaced?'failed':'healthy';}
function metrics(state){
 const s=state.scenario,model=models[state.upsId],powers={};
 const poeDevices=s.devices.filter(d=>state.connections[d.id]==='poe'),poeW=poeDevices.reduce((a,d)=>a+d.w,0);
 for(const d of s.devices)powers[d.id]={w:d.w+(d.id==='switch'?poeW:0),va:d.va+(d.id==='switch'?poeDevices.reduce((a,p)=>a+p.va,0):0)};
 const sum=bank=>s.devices.filter(d=>bank.includes(state.connections[d.id])).reduce((a,d)=>({w:a.w+powers[d.id].w,va:a.va+powers[d.id].va,count:a.count+1}),{w:0,va:0,count:0});
 const battery=sum(['battery']),total=sum(['battery','surge']),surgeCount=s.devices.filter(d=>state.connections[d.id]==='surge').length;
 const strip=sum(['strip']);
 const batteryOver=battery.w>model.watts||battery.va>model.va||battery.count>model.outlets;
 const utilityOver=total.w>model.watts||total.va>model.va||surgeCount>model.surgeOutlets||battery.count>model.outlets;
 const unsupported=s.devices.filter(d=>d.noUPS&&['battery','surge'].includes(state.connections[d.id])).map(d=>d.id);
 const healthy=batteryHealth(state)==='healthy';
 const runtime=healthy&&!batteryOver&&battery.w>0?(model.table.find(([w])=>battery.w<=w)?.[1]||0):0;
 return {model,battery,total,strip,poeW,poeOK:poeW<=(s.devices.find(d=>d.id==='switch')?.poeBudget||0),batteryOver,utilityOver,unsupported,healthy,runtime,stripOK:strip.w<=1800&&strip.va<=1800&&strip.count<=6};
}
function simulate(state){
 const s=state.scenario,m=metrics(state),ready=['wall','strip'].includes(state.input),backing=ready&&m.healthy&&!m.batteryOver;
 const devices=s.devices.map(d=>{
  const source=effective(state,d.id),poeOK=state.connections[d.id]!=='poe'||m.poeOK;
  const on=source==='battery'&&backing&&poeOK;
  const poweredNormal=source==='wall'||source==='strip'&&m.stripOK||['battery','surge'].includes(source)&&ready;
  let reason=on?`On battery; estimated ${m.runtime} min.`:!source?'No power source connected.':source!=='battery'?'Utility power lost; no battery supply.':!ready?'UPS input is not connected; unit has not been started.':!m.healthy?'Battery failed its self-test.':m.batteryOver?'UPS battery output shut down: overload.':!poeOK?'PoE power budget exceeded.':'No battery supply.';
  if(state.connections[d.id]==='poe')reason=`Via switch PoE. ${reason}`;
  return {id:d.id,name:d.name,on,normal:!!poweredNormal&&poeOK,throughRequired:on&&m.runtime>=s.minutes,reason};
 });
 const alive=id=>devices.find(d=>d.id===id)?.throughRequired;
 const services=s.services.map(service=>({...service,initial:service.path.every(id=>devices.find(d=>d.id===id)?.on),available:service.path.every(alive),missing:service.path.filter(id=>!alive(id))}));
 const outcome=services.filter(x=>!x.optional).every(x=>x.available);
 return {metrics:m,devices,services,outcome};
}
function grade(state){
 const s=state.scenario,m=metrics(state),sim=simulate(state),trouble=s.type==='troubleshooting',rows=[];
 const row=(name,correct,weight,why)=>rows.push({name,correct,weight,why});
 row('UPS input',state.input==='wall',trouble?5:10,state.input==='wall'?'The UPS receives input directly from the grounded wall outlet.':'Connect this UPS directly to the grounded wall outlet as required by its supplied documentation. A surge protector in its input path is not an approved connection.');
 const dw=(trouble?20:30)/s.devices.length;
 for(const d of s.devices){
  const src=effective(state,d.id),critical=s.essential.includes(d.id),valid=!!src&&(!critical||src==='battery')&&(!d.protected||src!=='wall')&&(!d.noUPS||!['battery','surge'].includes(src));
  row(d.name,valid,dw,valid?(critical?`${d.name} has a battery-backed power path.`:`${d.name} has an appropriate power source for its work-order requirement.`):!src?`${d.name} has no power connection.`:d.noUPS&&['battery','surge'].includes(src)?'This laser printer is excluded from both UPS outlet banks by the supplied documentation. Use the separately rated surge protector.':critical&&src!=='battery'?`${d.name} loses power immediately on ${sources[src]}. It is needed for ${s.minutes} minutes.`:`${d.name} requires surge protection; this wall outlet supplies normal power without dedicated transient protection.`);
 }
 const loadOK=!m.utilityOver&&!m.batteryOver&&!m.unsupported.length&&m.stripOK&&m.poeOK;
 row('Load and equipment limits',loadOK,trouble?15:20,loadOK?`UPS battery load ${m.battery.w} W / ${m.battery.va} VA and total UPS load ${m.total.w} W / ${m.total.va} VA stay within ratings.`:`Check both ${m.model.watts} W and ${m.model.va} VA limits, outlet counts, supported equipment, and source budgets. Battery load: ${m.battery.w} W / ${m.battery.va} VA; total UPS load: ${m.total.w} W / ${m.total.va} VA.${m.unsupported.length?' The printer is unsupported on either UPS bank.':''}`);
 const timeOK=!!state.input&&m.healthy&&!m.batteryOver&&m.battery.w>0&&m.runtime>=s.minutes;
 row('Battery and runtime',timeOK,trouble?15:20,!m.healthy?'The replace-battery warning and failed self-test show that outlet changes cannot restore backup. Replace the approved battery or the UPS.':timeOK?`The supplied runtime estimate is ${m.runtime} minutes; the work order requires ${s.minutes}.`:m.batteryOver?'An overload shuts off battery output. Resolve the capacity fault before evaluating useful runtime.':`The current estimated runtime is ${m.runtime} minutes; ${s.minutes} minutes are required. Use the supplied runtime data to reduce nonessential load or choose a suitable UPS.`);
 row('Work-order continuity',sim.outcome,trouble?15:20,sim.outcome?'Every required service path remains powered through the requested duration.':sim.services.filter(x=>!x.optional&&!x.available).map(x=>`${x.name} cannot meet ${s.minutes} minutes: ${x.missing.map(id=>s.devices.find(d=>d.id===id).name).join(', ')} is unpowered or runs out of battery too soon.`).join(' '));
 if(trouble){
  row('Primary diagnosis',state.diagnosis===s.fault,15,state.diagnosis===s.fault?'The selected diagnosis matches the incident and inspection evidence.':`The primary fault is ${faults[s.fault].toLowerCase()}. ${s.incident}`);
  const applied={outlet:effective(state,'monitor')==='battery',battery:m.healthy,overload:loadOK,runtime:timeOK}[s.fault]&&sim.outcome&&loadOK;
  row('Applied correction',applied,15,applied?'The actual configuration addresses the reported fault and restores the required backup.':'The fault still affects the work order. A diagnosis alone earns no correction credit; update the connections, battery, or UPS sizing and retest.');
 }
 const score=Math.round(rows.reduce((n,r)=>n+(r.correct?r.weight:0),0));
 return {score,total:100,rows,complete:rows.every(r=>r.correct)};
}
function restore(raw){
 if(!raw||raw.version!==1||!types.includes(raw.scenario?.type))return fresh();
 const s=scenario(raw.scenario.type,raw.scenario.seed,raw.scenario.fault),state=initial(s);
 for(const d of s.devices)if(allowed(d).includes(raw.connections?.[d.id]))state.connections[d.id]=raw.connections[d.id];
 if(['','wall','strip'].includes(raw.input))state.input=raw.input;
 if(Object.hasOwn(models,raw.upsId))state.upsId=raw.upsId;
 state.batteryReplaced=raw.batteryReplaced===true;state.diagnosis=Object.hasOwn(faults,raw.diagnosis)?raw.diagnosis:'';
 state.tested=raw.tested===true;state.submitted=raw.submitted===true;return state;
}
const api={KEY,types,faults,sources,models,scenario,initial,fresh,allowed,connect,effective,batteryHealth,metrics,simulate,grade,restore};
if(typeof module==='object'&&module.exports)module.exports=api;else root.PowerPBQ=api;
})(typeof globalThis!=='undefined'?globalThis:this);
