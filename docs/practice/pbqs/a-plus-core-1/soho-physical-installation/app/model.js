/* Original activity model. Shared by the browser and the Node regression tests. */
(function(root){
'use strict';
const KEY='core1-soho-physical-installation-v1';
const cables={
 ethernet:{code:'A',name:'Ethernet patch cable',type:'rj45',description:'Wide modular plug with eight gold contacts and a locking latch.'},
 coax:{code:'B',name:'F-type coaxial cable',type:'f',description:'Round metal connector with a threaded collar and a single center conductor.'},
 phone:{code:'C',name:'RJ11 telephone cable',type:'rj11',description:'Narrow modular plug with four visible contacts and a locking latch.'},
 sc:{code:'D',name:'SC fiber cable',type:'sc',description:'Square push-pull connector housing with a projecting ceramic ferrule.'},
 lc:{code:'E',name:'LC fiber cable',type:'lc',description:'Small optical connector with a finger latch and a narrow ceramic ferrule.'},
 st:{code:'F',name:'ST fiber cable',type:'st',description:'Round metal optical connector with a bayonet locking collar and a ceramic ferrule.'}
};
const port=(id,type,role,mark='',group=null)=>({id,type,role,mark,equivalentGroup:group});
const devices={
 cable:{code:'A',name:'Cable modem',shape:'modem',description:'Upright enclosure with status lamps, one threaded round socket, and one eight-contact modular socket.',ports:[port('service','f','service'),port('ethernet','rj45','uplink','ETH')]},
 dsl:{code:'B',name:'DSL modem',shape:'modem',description:'Low enclosure with status lamps, one narrow modular socket, and one wider eight-contact socket.',ports:[port('service','rj11','service','LINE'),port('ethernet','rj45','uplink','ETH')]},
 ont:{code:'C',name:'Optical network terminal',shape:'ont',description:'Wall-mount enclosure with a square optical socket, status lamps, and one eight-contact modular socket.',ports:[port('service','sc','service'),port('ethernet','rj45','uplink','ETH')]},
 router:{code:'D',name:'SOHO wireless router',shape:'router',description:'Two antennas, one WAN socket, and four numbered LAN sockets.',ports:[port('wan','rj45','wan','WAN'),...Array.from({length:4},(_,i)=>port('lan'+(i+1),'rj45','lan','LAN '+(i+1),'router-lan'))]},
 switch:{code:'E',name:'Unmanaged Ethernet switch',shape:'switch',description:'Compact metal enclosure with five identical numbered eight-contact modular sockets.',ports:Array.from({length:5},(_,i)=>port('p'+(i+1),'rj45','lan',String(i+1),'switch-ports'))},
 pc:{code:'F',name:'Desktop PC',shape:'pc',description:'Desktop tower and monitor; one eight-contact network socket.',ports:[port('net','rj45','endpoint')]},
 printer:{code:'G',name:'Network printer',shape:'printer',description:'Printer with a paper tray and one eight-contact network socket.',ports:[port('net','rj45','endpoint')]}
};
const requirement=(id,a,ar,b,br,cable,why)=>({id,a,ar,b,br,cable,why});
const scenarios={
 cable:{name:'Cable service',service:'f',fixed:{wall:0,pc:5},pool:['cable','dsl','router','switch'],endpoints:['pc'],work:'Install the available cable Internet service and provide wired connectivity to the workstation. Use the equipment and leads supplied. Equipment is powered and prepared for service; complete the physical connections.',requirements:[
 requirement('service','wall','service','cable','service','coax','The ISP coax service connects to the cable modem with an F-type coaxial cable.'),
 requirement('handoff','cable','uplink','router','wan','ethernet','The modem hands off Ethernet to the router WAN port.'),
 requirement('desktop','router','lan','pc','endpoint','ethernet','An Ethernet patch cable joins any router LAN port to the desktop network port.') ]},
 dsl:{name:'DSL service',service:'rj11',fixed:{wall:0,pc:4,printer:5},pool:['dsl','ont','router'],endpoints:['pc','printer'],work:'Install the available DSL Internet service. Provide wired connectivity to the workstation and the network printer. Equipment is powered and prepared for service; complete the physical connections.',requirements:[
 requirement('service','wall','service','dsl','service','phone','The telephone-line service enters the DSL modem through its RJ11 line connection.'),
 requirement('handoff','dsl','uplink','router','wan','ethernet','The DSL modem Ethernet port connects to the router WAN port.'),
 requirement('desktop','router','lan','pc','endpoint','ethernet','Connect the desktop to an available router LAN port with Ethernet.'),
 requirement('printer','router','lan','printer','endpoint','ethernet','The network printer uses its own Ethernet connection to another router LAN port.') ]},
 fiber:{name:'Fiber service',service:'sc',fixed:{wall:0,pc:4,printer:5},pool:['ont','cable','router','switch'],endpoints:['pc','printer'],work:'Install the available fiber Internet service. A remote desk has a workstation and network printer, with only one Ethernet run available from the router area. Provide wired connectivity to both. Equipment is powered and prepared for service. The workspace is a connection diagram; equipment position is not scored.',requirements:[
 requirement('service','wall','service','ont','service','sc','This installation has matching SC optical sockets at the service outlet and ONT. Use the SC fiber lead; other installations may use different connectors.'),
 requirement('handoff','ont','uplink','router','wan','ethernet','The ONT provides an Ethernet handoff to the router WAN port.'),
 requirement('desk','router','lan','switch','lan','ethernet','The single Ethernet run connects a router LAN port to any switch port at the remote desk.'),
 requirement('desktop','switch','lan','pc','endpoint','ethernet','An Ethernet patch cable connects the workstation to a free switch port.'),
 requirement('printer','switch','lan','printer','endpoint','ethernet','Another switch port serves the printer, allowing both endpoints to share the single uplink.') ]}
};
function device(sid,id){return id==='wall'?{code:'S',name:'Service outlet',shape:'wall',description:'Service wall plate with one '+({f:'threaded round',rj11:'narrow modular',sc:'square optical'}[scenarios[sid].service])+' socket.',ports:[port('service',scenarios[sid].service,'service')]}:devices[id]}
function fresh(){return {version:1,active:'cable',progress:Object.fromEntries(Object.keys(scenarios).map(id=>[id,{placed:{},connections:[],submitted:false}]))}}
function placements(sid,state){return {...scenarios[sid].fixed,...state.placed}}
function ports(sid,state){const occupied=new Set(state.connections.flatMap(c=>[c.a,c.b]));return Object.fromEntries(Object.keys(placements(sid,state)).flatMap(owner=>device(sid,owner).ports.map(p=>[owner+':'+p.id,{...p,owner,key:owner+':'+p.id,occupied:occupied.has(owner+':'+p.id)}])))}
function cleanScenario(sid,raw){const out={placed:{},connections:[],submitted:false},s=scenarios[sid];if(!raw||typeof raw!=='object')return out;const slots=new Set(Object.values(s.fixed));for(const [id,slot] of Object.entries(raw.placed||{})){if(s.pool.includes(id)&&Number.isInteger(slot)&&slot>=0&&slot<6&&!slots.has(slot)){out.placed[id]=slot;slots.add(slot)}}const available=ports(sid,out),used=new Set(),ids=new Set();for(const c of (Array.isArray(raw.connections)?raw.connections:[]).slice(0,20)){if(!c||typeof c.cable!=='string'||typeof c.a!=='string'||typeof c.b!=='string'||!Object.hasOwn(cables,c.cable)||!Object.hasOwn(available,c.a)||!Object.hasOwn(available,c.b)||c.a===c.b||used.has(c.a)||used.has(c.b))continue;let id=typeof c.id==='string'&&/^[a-z0-9-]{1,50}$/.test(c.id)&&!ids.has(c.id)?c.id:'restored-'+out.connections.length;while(ids.has(id))id+='-x';ids.add(id);used.add(c.a);used.add(c.b);out.connections.push({id,cable:c.cable,a:c.a,b:c.b})}out.submitted=raw.submitted===true;return out}
function restore(raw){const out=fresh();if(!raw||raw.version!==1)return out;if(typeof raw.active==='string'&&Object.hasOwn(scenarios,raw.active))out.active=raw.active;for(const sid of Object.keys(scenarios))out.progress[sid]=cleanScenario(sid,raw.progress?.[sid]);return out}
function matches(c,r,ps,includeCable=true){const a=ps[c.a],b=ps[c.b];return !!a&&!!b&&(!includeCable||c.cable===r.cable)&&((a.owner===r.a&&a.role===r.ar&&b.owner===r.b&&b.role===r.br)||(b.owner===r.a&&b.role===r.ar&&a.owner===r.b&&a.role===r.br))}
function grade(sid,state){const s=scenarios[sid],ps=ports(sid,state),used=new Set();const rows=s.requirements.map(r=>{const c=state.connections.find(c=>!used.has(c.id)&&matches(c,r,ps));if(c)used.add(c.id);return {...r,correct:!!c,connection:c?.id||null}});const invalid=state.connections.filter(c=>!used.has(c.id)).map(c=>({id:c.id,kind:s.requirements.some(r=>matches(c,r,ps,false))?'incorrect':'extra',why:s.requirements.some(r=>matches(c,r,ps,false))?'The selected cable does not match the sockets for this link.':'This connection does not satisfy a required service or LAN link. Check the equipment and port roles.'}));
 // Trace only verified physical links, through the appropriate internal device roles.
 const graph={};function join(a,b){(graph[a]??=[]).push(b);(graph[b]??=[]).push(a)}
 for(const c of state.connections)if(used.has(c.id))join(c.a,c.b);
 for(const owner of Object.keys(placements(sid,state))){const list=Object.values(ps).filter(p=>p.owner===owner);if(['router','switch','cable','dsl','ont'].includes(owner))for(let i=1;i<list.length;i++)join(list[0].key,list[i].key)}
 const seen=new Set(['wall:service']),queue=['wall:service'];while(queue.length)for(const next of graph[queue.shift()]||[])if(!seen.has(next)){seen.add(next);queue.push(next)}
 const reachable=s.endpoints.filter(id=>seen.has(id+':net'));return {score:rows.filter(r=>r.correct).length,total:rows.length,rows,invalid,reachable,complete:rows.every(r=>r.correct)&&!invalid.length&&reachable.length===s.endpoints.length};}
function connect(sid,state,cable,a,b,id){const ps=ports(sid,state);if(!Object.hasOwn(cables,cable)||!Object.hasOwn(ps,a)||!Object.hasOwn(ps,b))return 'Choose a cable and two available ports.';if(a===b)return 'Choose two different ports.';if(ps[a].occupied||ps[b].occupied)return 'That port is occupied. Remove its connection first.';state.connections.push({id,cable,a,b});state.submitted=false;return null}
const api={KEY,cables,devices,scenarios,device,fresh,placements,ports,restore,cleanScenario,grade,connect};if(typeof module!=='undefined')module.exports=api;else root.SOHO=api;
})(globalThis);
