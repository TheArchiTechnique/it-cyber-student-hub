/* Original teaching approximation: signal quality units, not measured dBm.
 * A 60 × 50 ft footprint; both distance and the actual drawn wall segments count.
 * The microwave represents intermittent operation affecting this office's 2.4 GHz
 * clients. It is not assumed to interfere with every Wi-Fi band. */
(function(root){
'use strict';
const KEY='student-hub-wireless-coverage-v1';
const slots={
 A:{x:6,y:5,room:'Northwest Office'},B:{x:16,y:25,room:'Hallway'},
 C:{x:37,y:19,room:'North/Central Office'},D:{x:54,y:5,room:'Northeast Office'},
 E:{x:14,y:31,room:'Lobby / Breakroom'},F:{x:28,y:25,room:'Hallway'},
 G:{x:44,y:25,room:'Hallway'},H:{x:56,y:38,room:'Conference Room'}
};
const kitchen={shelf:{x:14,y:35,label:'Breakroom shelf'},counterWest:{x:4,y:46,label:'West counter'},counterEast:{x:16,y:46,label:'East counter'}};
const radioSlots={storage:{x:30,y:37,label:'Security Office storage'}};
const rooms=[
 {id:'nw',name:'Northwest Office',x:0,y:0,w:20,h:22},
 {id:'north',name:'North/Central Office',x:20,y:0,w:20,h:22},
 {id:'ne',name:'Northeast Office',x:40,y:0,w:20,h:22},
 {id:'hall',name:'Hallway',x:0,y:22,w:60,h:6},
 {id:'lobby',name:'Lobby / Breakroom',x:0,y:28,w:24,h:22},
 {id:'security',name:'Security Office',x:24,y:28,w:12,h:22},
 {id:'conference',name:'Conference Room',x:36,y:28,w:24,h:22}
];
// Gaps in these segments are doorways and are also used by the artwork.
const walls=[
 [20,0,20,22],[40,0,40,22],
 [0,22,12,22],[16,22,28,22],[32,22,48,22],[52,22,60,22],
 [0,28,17,28],[21,28,27,28],[31,28,43,28],[47,28,60,28],
 [24,28,24,50],[36,28,36,50]
];
const employee={x:6,y:10};
const THRESHOLD=42;
function fresh(){return {version:1,positions:{wap1:'E',wap2:'H',microwave:'shelf',radio1:'storage',radio2:'storage'},submitted:false}}
function restore(raw){const s=fresh();if(!raw||raw.version!==1||!raw.positions||typeof raw.positions!=='object')return s;
 for(const id of ['wap1','wap2']){const slot=raw.positions[id];if(typeof slot!=='string'||!Object.hasOwn(slots,slot))return s}
 if(raw.positions.wap1===raw.positions.wap2)return s;
 s.positions.wap1=raw.positions.wap1;s.positions.wap2=raw.positions.wap2;
 if(typeof raw.positions.microwave==='string'&&Object.hasOwn(kitchen,raw.positions.microwave))s.positions.microwave=raw.positions.microwave;
 // Earlier saved radio placements return to the shared storage point.
 // Preserve the student's access point, microwave, and submission state.
 s.submitted=raw.submitted===true;return s}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function crosses(a,b,w){const [x1,y1,x2,y2]=w,rx=b.x-a.x,ry=b.y-a.y,sx=x2-x1,sy=y2-y1,den=rx*sy-ry*sx;if(Math.abs(den)<1e-9)return false;
 const t=((x1-a.x)*sy-(y1-a.y)*sx)/den,u=((x1-a.x)*ry-(y1-a.y)*rx)/den;return t>1e-7&&t<1-1e-7&&u>=0&&u<=1}
function wallCount(a,b){return walls.filter(w=>crosses(a,b,w)).length}
function microwavePenalty(ap,micro){return Math.max(0,1-distance(ap,micro)/20)*26}
function quality(ap,point,micro){const openRadius=Math.sqrt(2000/Math.PI);return Math.max(0,Math.min(100,100-55*Math.pow(distance(ap,point)/openRadius,1.35)-5*wallCount(ap,point)-microwavePenalty(ap,micro)))}
function signal(state,point){const aps=['wap1','wap2'].map(id=>slots[state.positions[id]]),micro=kitchen[state.positions.microwave];const values=aps.map(ap=>quality(ap,point,micro));return {best:Math.max(...values),values,overlap:values.every(v=>v>=THRESHOLD)}}
function samples(state){const cells=[];for(let y=1;y<50;y+=2)for(let x=1;x<60;x+=2){const room=rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);cells.push({x,y,room:room.id,...signal(state,{x,y})})}return cells}
function grade(input){const state=restore(input),cells=samples(state),aps=['wap1','wap2'].map(id=>slots[state.positions[id]]),micro=kitchen[state.positions.microwave];
 const perRoom=rooms.map(room=>{const area=cells.filter(c=>c.room===room.id),usable=area.filter(c=>c.best>=THRESHOLD).length;return {id:room.id,name:room.name,coverage:usable/area.length}});
 const totalCoverage=cells.filter(c=>c.best>=THRESHOLD).length/cells.length,desk=signal(state,employee).best,nw=perRoom.find(r=>r.id==='nw').coverage;
 const unique=aps.map((_,i)=>cells.filter(c=>c.values[i]>=THRESHOLD&&c.values[1-i]<THRESHOLD).length/cells.length);
 const spread=distance(aps[0],aps[1]),minSeparation=Math.min(...aps.map(a=>distance(a,micro))),penalties=aps.map(a=>microwavePenalty(a,micro));
 const northwest=desk>=52&&nw>=.85,office=totalCoverage>=.9&&perRoom.every(r=>r.coverage>=.75),distributed=spread>=18&&unique.every(n=>n>=.12);
 const perimeter=Math.min(micro.x,60-micro.x,micro.y,50-micro.y)<=5,environment=perimeter&&minSeparation>=20;
 const officeFraction=Math.min(1,totalCoverage/.9,...perRoom.map(r=>r.coverage/.75));
 const rows=[
 {id:'northwest',label:'Northwest connection',points:Math.round(30*Math.min(1,desk/52,nw/.85)),total:30,correct:northwest,text:northwest?'The reporting employee has a stable signal, with useful coverage across the northwest office.':'Coverage in the northwest office is still insufficient. Consider the path from an access point to the reporting employee, including distance and intervening walls.'},
 {id:'office',label:'Whole-office coverage',points:Math.round(30*officeFraction),total:30,correct:office,text:office?'The two access points collectively serve the office effectively.':'Parts of the office still have weak coverage. Distribute service across the work areas, rather than improving only one room.'},
 {id:'distribution',label:'Access point distribution',points:Math.round(20*Math.min(1,spread/18,...unique.map(n=>n/.12))),total:20,correct:distributed,text:distributed?'Each access point contributes useful coverage to a different portion of the office.':spread<18?'The access points are too closely clustered to provide effective coverage across the office.':'The access points duplicate too much of the same service area. Each should reach a useful portion of the office that the other does not.'},
 {id:'environment',label:'Equipment environment',points:environment?20:Math.round((perimeter?8:0)+12*Math.min(1,minSeparation/20)),total:20,correct:environment,text:environment?'The microwave is positioned along the breakroom perimeter, separated from the access points.':minSeparation<20?'A wireless access point remains too close to the microwave. When operating, a microwave can disrupt nearby 2.4 GHz Wi-Fi; increase their separation.':'The microwave has been separated from the access points, but a perimeter counter is a more suitable location than the interior breakroom shelf.'}
 ];
 const complete=rows.every(r=>r.correct);let score=rows.reduce((sum,r)=>sum+r.points,0);if(!complete&&score===100)score=99;
 return {score,total:100,complete,rows,cells,perRoom,totalCoverage,desk,nw,spread,unique,penalties,minSeparation}
}
function move(state,id,target){if(!['wap1','wap2','microwave','radio1','radio2'].includes(id))return 'Select movable equipment first.';
 const radio=id.startsWith('radio'),choices=radio?radioSlots:id==='microwave'?kitchen:slots;if(!Object.hasOwn(choices,target))return radio?'Choose the shared equipment storage point in the Security Office.':id==='microwave'?'Choose a breakroom surface for the microwave.':'Choose an access point position A–H.';
 if(state.positions[id]===target)return null;
 if(!radio&&id!=='microwave'&&['wap1','wap2'].some(other=>other!==id&&state.positions[other]===target))return 'That position is occupied by the other access point. Move it to an empty position first.';
 state.positions[id]=target;if(!radio)state.submitted=false;return null}
const api={KEY,slots,kitchen,radioSlots,rooms,walls,employee,THRESHOLD,fresh,restore,distance,crosses,wallCount,microwavePenalty,quality,signal,samples,grade,move};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WirelessModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
