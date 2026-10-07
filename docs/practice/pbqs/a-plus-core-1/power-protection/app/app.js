'use strict';
const M=PowerPBQ,A=PowerArt,$=id=>document.getElementById(id);
let state,storageOK=true,pending=null,returnFocus=null;
try{state=M.restore(JSON.parse(localStorage.getItem(M.KEY)))}catch{state=M.fresh()}
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(message){$('status').textContent=message;}
function save(){try{localStorage.setItem(M.KEY,JSON.stringify(state));storageOK=true}catch{storageOK=false}$('save-status').textContent=storageOK?'Progress saved in this browser.':'Saving is unavailable. Keep this page open until you finish.';}
function table(id){const model=M.models[id];return `<div class="table-scroll" tabindex="0" aria-label="${model.name} supplied runtime table"><table><caption>${model.name} · ${model.va} VA / ${model.watts} W</caption><thead><tr><th scope="col">Load up to</th><th scope="col">Runtime estimate</th></tr></thead><tbody>${model.table.map(([w,min])=>`<tr><th scope="row">${w} W</th><td>${min} min</td></tr>`).join('')}</tbody></table></div>`;}
function renderEquipment(){
 const s=state.scenario,sim=M.simulate(state);
 $('equipment-count').textContent=`${s.devices.length} devices`;
 $('equipment').innerHTML=s.devices.map(d=>{
  const power=sim.devices.find(x=>x.id===d.id),source=state.connections[d.id];
  const text=state.tested?(power.on?`On battery · ${power.throughRequired?'duration met':'runtime too short'}`:'Off · utility power lost'):!source?'Not connected':power.normal?`Powered · ${['battery','surge'].includes(M.effective(state,d.id))&&sim.metrics.utilityOver?'overload warning':'via '+M.sources[source]}`:'Not powered · check source';
  return `<article class="equipment-card" data-device="${d.id}">${A.equipment(d.shape)}<h3>${d.name}</h3><p class="rating">${d.w} W / ${d.va} VA${d.id==='switch'?' + PoE loads':''}</p><button class="inspect-device" data-inspect="${d.id}">Inspect ${d.name}</button><div class="connection-control"><label for="source-${d.id}">Power source for ${d.name}</label><select id="source-${d.id}" data-connect="${d.id}">${M.allowed(d).map(id=>`<option value="${id}" ${source===id?'selected':''}>${id?M.sources[id]:'Not connected'}</option>`).join('')}</select></div><p class="device-state ${state.tested?(power.on?(power.throughRequired?'battery':'warning'):'off'):''}">${text}</p></article>`;
 }).join('');
}
function renderUPS(){
 const m=M.metrics(state),model=m.model;
 $('ups-model').value=state.upsId;$('ups-input').value=state.input;
 $('ups-rating').textContent=`${model.va} VA / ${model.watts} W · 6 battery + 3 surge-only outlets`;
 const metrics=[['Battery load',`${m.battery.w} W / ${m.battery.va} VA`,m.batteryOver],['Total UPS load',`${m.total.w} W / ${m.total.va} VA`,m.utilityOver],['Battery condition',m.healthy?'Self-test passed':'Replace battery · self-test failed',!m.healthy],['Estimated runtime',`${m.runtime} min · needs ${state.scenario.minutes}`,m.runtime<state.scenario.minutes],['Battery outlets',`${m.battery.count} / ${model.outlets}`,m.battery.count>model.outlets],['Output status',m.batteryOver?'Battery overload':m.utilityOver?'Utility load exceeds rating':m.unsupported.length?'Unsupported UPS load':'Within capacity',m.batteryOver||m.utilityOver||m.unsupported.length]];
 $('ups-metrics').innerHTML=metrics.map(([label,value,warn])=>`<div class="metric ${warn?'warning':''}">${label}<strong>${value}</strong></div>`).join('');
 $('runtime-table').innerHTML=table(state.upsId);
}
function renderOutage(){
 const el=$('outage');el.hidden=!state.tested;$('restore-power').hidden=!state.tested;
 if(!state.tested){el.innerHTML='';return;}
 const sim=M.simulate(state),m=sim.metrics,s=state.scenario;
 const warnings=[!state.input?'UPS input is disconnected; the unit has not been started.':'',state.input==='strip'?'UPS input passes through a surge protector; this is outside its approved installation.':'',m.batteryOver?`Overload: battery output shuts off. ${m.battery.w} W / ${m.battery.va} VA exceeds an output limit or outlet count.`:'',m.utilityOver&&!m.batteryOver?'Total UPS load exceeded a utility-mode rating before the outage.':'',!m.healthy?'Battery self-test failed; no battery output is available.':'',m.unsupported.length?'The connected laser printer is outside this UPS\'s supported equipment.':'',!m.stripOK?'The separate surge protector exceeds a rating or outlet count.':''].filter(Boolean);
 el.innerHTML=`<h2>Utility power lost</h2><p>${sim.outcome?`Required services remain available for ${s.minutes} minutes.`:'The configuration does not meet the work order.'} Estimated battery runtime: ${m.runtime} minutes.</p>${warnings.map(w=>`<p class="incident">${escapeHTML(w)}</p>`).join('')}<div class="outage-grid">${sim.services.map(service=>`<article class="service ${service.available?'good':''}"><h3>${service.name}</h3><p>${service.available?`Available through ${s.minutes} minutes.`:service.initial?`Starts on battery, but stops before ${s.minutes} minutes.`:'Unavailable when utility power fails.'}</p><p>${service.path.map(id=>s.devices.find(d=>d.id===id).name).join(' → ')}</p></article>`).join('')}</div><div class="table-scroll" tabindex="0" aria-label="Equipment power failure results"><table><thead><tr><th scope="col">Equipment</th><th scope="col">At power loss</th><th scope="col">Result</th></tr></thead><tbody>${sim.devices.map(d=>`<tr><th scope="row">${d.name}</th><td>${d.on?'Battery power':'Off'}</td><td>${d.reason}</td></tr>`).join('')}</tbody></table></div>${s.type==='network'?'<p>This test assumes the ISP and hosted services continue operating. It simulates only a local utility interruption.</p>':''}`;
}
function renderResults(){
 const el=$('results');el.hidden=!state.submitted;if(!state.submitted){el.innerHTML='';return;}
 const g=M.grade(state);
 el.innerHTML=`<div class="results-heading"><div class="score">${g.score} / 100</div><div><h2>${g.complete?'Work order complete':'Review your configuration'}</h2><p>Credit follows protection, capacity, runtime, service requirements${state.scenario.type==='troubleshooting'?', diagnosis, and applied repair':''}.</p></div></div><div class="review-grid">${g.rows.map(r=>`<article class="feedback ${r.correct?'good':''}"><h3>${r.correct?'Correct':'Review'} · ${r.name}</h3><p>${escapeHTML(r.why)}</p></article>`).join('')}</div><div class="review-actions"><button id="retry" class="primary">Continue editing</button></div>`;
}
function render(){
 const active=document.activeElement,focusId=active?.id,inspectId=active?.dataset.inspect;
 const s=state.scenario;
 $('case-label').textContent=`Scenario ${M.types.indexOf(s.type)+1} of 4`;$('case-title').textContent=s.title;$('work-order').textContent=s.work;
 $('incident').hidden=!s.incident;$('incident').textContent=s.incident?`Reported incident: ${s.incident}`:'';
 $('network-path').hidden=s.type!=='network';$('network-path').textContent='Service path: ONT → router → PoE switch → access point / phone. AP and phone support the supplied AC adapters or switch PoE. ISP and hosted services remain operational in this local-outage test.';
 $('diagnosis-panel').hidden=s.type!=='troubleshooting';$('diagnosis').value=state.diagnosis;
 renderEquipment();renderUPS();renderOutage();renderResults();
 if(focusId)$(focusId)?.focus({preventScroll:true});else if(inspectId)document.querySelector(`[data-inspect="${inspectId}"]`)?.focus({preventScroll:true});
}
function changed(message){state.tested=false;state.submitted=false;save();render();say(message);}
function inspect(id,trigger){
 returnFocus=trigger;
 if(id==='ups'){
  const m=M.metrics(state);$('inspect-title').textContent=`${m.model.name} UPS`;$('inspect-art').innerHTML=A.equipment('ups');
  $('inspect-body').innerHTML=`<p>Output limits: <strong>${m.model.watts} W / ${m.model.va} VA</strong>. Total utility-mode output includes both outlet banks; battery-mode output covers the battery bank. PoE loads are included at the switch.</p><p>These supplied models warn when total utility load exceeds a rating; an overloaded battery output shuts off on transfer. Equipment powering on normally does not establish that the UPS can support it safely.</p><p>Battery condition: <strong>${m.healthy?'healthy, fully charged; self-test passed':'failed self-test; replace-battery indicator on'}</strong>.</p><p>Input: ${state.input?M.sources[state.input]:'not connected'}. Battery load: ${m.battery.w} W / ${m.battery.va} VA. Runtime estimate: ${m.runtime} min.</p><p>For these supplied units, connect input directly to a grounded wall outlet. No cascading power devices. The office laser printer is unsupported on either UPS bank. Compare available units below before changing the installed UPS.</p>${Object.keys(M.models).map(table).join('')}`;
 }else{
  const d=state.scenario.devices.find(d=>d.id===id);$('inspect-title').textContent=d.name;$('inspect-art').innerHTML=A.equipment(d.shape);
  $('inspect-body').innerHTML=`<dl><dt>Specified draw</dt><dd>${d.w} W / ${d.va} VA${d.id==='printer'?' during printing':''}</dd><dt>Requirement</dt><dd>${escapeHTML(d.requirement)}</dd><dt>Protection</dt><dd>${d.protected?'Appropriate surge protection required.':'Normal suitable grounded power is acceptable.'}</dd></dl>${d.poe?'<p>The supplied AC adapter and switch PoE are both supported. Use one power method. The PoE switch must also have power. These figures are supplied AC-side load estimates, including conversion; with PoE, allocate them at the switch rather than a separate AC outlet.</p>':''}${d.id==='switch'?'<p>The listed switch draw is its base load. Add each PoE endpoint\'s supplied AC-side W and VA allocation once at the switch. The supported endpoints fit its 60 W PoE budget.</p>':''}`;
 }
 $('inspect').showModal();$('close-inspect').focus();
}
function requestAction(kind,trigger){
 pending=kind;returnFocus=trigger;
 const text={reset:['Reset this scenario?','Restore this work order, its original connections, UPS, and battery condition. Your current answers and test results will be cleared.','Reset'],new:['Start a new scenario?','Replace the current work order with a different scenario type and clear this case\'s answers and test results.','New Scenario'],battery:['Replace the UPS battery?','Use the manufacturer-approved user-serviceable battery cartridge. Plan the interruption, shut down affected equipment, isolate the UPS as directed, replace the cartridge, reconnect, fully charge, and complete the self-test. This simulation completes that service procedure.','Complete replacement']}[kind];
 $('confirm-title').textContent=text[0];$('confirm-description').textContent=text[1];$('confirm-action').textContent=text[2];$('confirm').showModal();$('keep').focus();
}
const checks=[
 {q:'A monitor is connected to a UPS surge-only outlet. What happens during an outage?',options:['It runs until the UPS battery is empty.','It loses power with the utility supply.','It receives power from another UPS outlet.'],answer:1,why:'Surge-only outlets provide transient protection, but no battery power.'},
 {q:'A 600 VA / 360 W UPS supplies a 300 W / 650 VA load. What should you investigate?',options:['The apparent-power rating is exceeded.','The load is acceptable because watts are below 360.','The number of empty outlets determines capacity.'],answer:0,why:'Both limits apply. The 650 VA load exceeds the UPS\'s 600 VA rating even though its watt limit is not exceeded.'},
 {q:'The router stays on battery, but the ONT loses power. Which result follows?',options:['The router guarantees internet access.','The router supplies AC power to the ONT.','The office WAN path is interrupted.'],answer:2,why:'The WAN service depends on the ONT as well as the router. A powered router cannot replace an unpowered service handoff.'},
 {q:'Backup lasts 5 minutes with no overload alarm, but the task needs 12. What is the best next check?',options:['Assume any empty outlet provides extra runtime.','Compare the connected load, battery condition, and model runtime data.','Move the workstation to a surge-only outlet.'],answer:1,why:'A supported load can still have insufficient runtime. Check the runtime chart and battery condition, then reduce nonessential load or size the UPS appropriately.'}
];
$('knowledge-checks').innerHTML=checks.map((c,i)=>`<fieldset class="knowledge-check"><legend>${c.q}</legend><div class="knowledge-options">${c.options.map((o,n)=>`<button data-check="${i}" data-choice="${n}" aria-pressed="false">${o}</button>`).join('')}</div><p id="check-feedback-${i}" class="check-feedback" role="status"></p></fieldset>`).join('');
$('ups-model').innerHTML=Object.entries(M.models).map(([id,m])=>`<option value="${id}">${m.name} · ${m.va} VA / ${m.watts} W</option>`).join('');
$('diagnosis').innerHTML='<option value="">Select a diagnosis</option>'+Object.entries(M.faults).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
document.querySelectorAll('[data-art]').forEach(el=>el.innerHTML=A.equipment(el.dataset.art));
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.dataset.connect){M.connect(state,el.dataset.connect,el.value);changed(`${state.scenario.devices.find(d=>d.id===el.dataset.connect).name} power connection updated. Retest when ready.`);}
 if(el.id==='ups-input'){state.input=el.value;changed('UPS input updated.');}
 if(el.id==='ups-model'){state.upsId=el.value;state.batteryReplaced=true;changed('A new, charged UPS is installed. Existing device connections are preserved; check the new ratings and retest.');}
 if(el.id==='diagnosis'){state.diagnosis=el.value;state.submitted=false;save();renderResults();say('Diagnosis recorded. Apply the correction and submit when ready.');}
});
document.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el)return;
 if(el.dataset.inspect)inspect(el.dataset.inspect,el);
 if(el.id==='inspect-ups')inspect('ups',el);
 if(el.id==='close-inspect')$('inspect').close();
 if(el.id==='test-power'){state.tested=true;save();render();say('Utility power lost. Review equipment and service results, then revise or submit.');$('outage').focus();}
 if(el.id==='restore-power'){state.tested=false;save();render();say('Utility power restored. Adjust the configuration and test again.');$('test-power').focus();}
 if(el.id==='submit'){state.submitted=true;save();renderResults();say(`Solution checked: ${M.grade(state).score} out of 100.`);$('results').focus();}
 if(el.id==='retry'){state.submitted=false;save();renderResults();say('Continue editing and retest the configuration.');$('test-power').focus();}
 if(el.id==='reset')requestAction('reset',el);
 if(el.id==='new-scenario')requestAction('new',el);
 if(el.id==='replace-battery')requestAction('battery',el);
 if(el.id==='keep')$('confirm').close();
 if(el.id==='confirm-action'){
  const kind=pending;
  if(kind==='reset')state=M.initial(state.scenario);
  if(kind==='new')state=M.fresh(state.scenario);
  if(kind==='battery')state.batteryReplaced=true;
  $('confirm').close();changed(kind==='battery'?'Approved battery replacement, charging, and self-test completed. Retest the backup.':kind==='reset'?'Original scenario restored.':'New work order ready.');
 }
 if(el.dataset.check!==undefined){const i=Number(el.dataset.check),choice=Number(el.dataset.choice),c=checks[i];document.querySelectorAll(`[data-check="${i}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b===el)));$('check-feedback-'+i).textContent=`${choice===c.answer?'Correct.':'Review.'} ${c.why}`;}
});
for(const id of ['inspect','confirm'])$(id).addEventListener('close',()=>{pending=null;returnFocus?.focus({preventScroll:true});});
const tabs=[$('activity-tab'),$('lesson-tab')];
function switchTab(id,focus=false){for(const tab of tabs){const active=tab.id===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$(tab.getAttribute('aria-controls')).hidden=!active;if(active&&focus)tab.focus();}}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>switchTab(tab.id));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();switchTab(tabs[event.key==='Home'?0:event.key==='End'?1:1-index].id,true);});});
render();save();
