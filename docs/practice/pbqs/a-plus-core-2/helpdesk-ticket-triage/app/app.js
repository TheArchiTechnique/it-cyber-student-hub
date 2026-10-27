(function(){
'use strict';
const M=window.HelpDeskTriage,$=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={request:'Request',context:'Context',notes:'Technician Notes'};
const priorityTag=(t,prefix='')=>`<span class="priority-tag priority-${t.priority}">${prefix}${M.priorities[t.priority].label}</span>`;
const transcripts={
 browser:'Microsoft Edge / Project portal\nAddress: https://projects.northstar.example\nPage zoom: 175%\nZoom controls: Minus | 175% | Plus | Reset\nPage content: Project overview / Current design files\nWindows display scaling (support note): 100%\nAll other sites and Windows applications: normal size.',
 files:'File Explorer / R:\\Records\nName                          Type\nCase-index.docx.sealed         SEALED File\nArchive-register.xlsx.sealed   SEALED File\nDelivery-log.pdf.sealed        SEALED File\nRECOVER_FILES.txt              Text Document\n\nRECOVER_FILES.txt preview:\nYour documents have been encrypted. Payment is required for the key.\nUser observation: More filenames are changing while I watch.',
 service:'Services / Northstar Report Engine Properties\nService name: NSReportEngine\nDisplay name: Northstar Report Engine\nStartup type: Disabled\nService status: Stopped\nLog on as: Local System\nApproved baseline: Startup type Automatic; status Running.'
};
let state,filter='all',updatedAttempt=false;
try{const raw=JSON.parse(localStorage.getItem(M.KEY));updatedAttempt=Boolean(raw&&raw.version!==M.VERSION);state=M.restore(raw);}catch{state=M.initial();}
function save(){let saved=true;try{localStorage.setItem(M.KEY,JSON.stringify(state));}catch{saved=false;}$('save-status').textContent=saved?'Progress saved in this browser.':'Browser storage unavailable. Progress is kept for this page session.';}
function status(id){return state.completed.includes(id)?'Processed':state.active===id?'In progress':M.reviewed(state,id)?'Reviewed':'Awaiting review';}
function announce(text){$('notice').textContent=text;}
function overview(){
 const reviewed=M.tickets.filter(t=>M.reviewed(state,t.id)).length;
 $('overview').innerHTML=[[6-state.completed.length,'Open tickets'],[6-reviewed,'Awaiting review'],[state.active?1:0,'In progress'],[state.completed.length,'Processed']].map(([n,label])=>`<div class="metric"><strong>${n}</strong><span>${label}</span></div>`).join('');
 const sections=M.tickets.reduce((n,t)=>n+state.inspections[t.id].sections.length,0),attachments=M.tickets.reduce((n,t)=>n+state.inspections[t.id].attachments.length,0);
 $('review-progress').textContent=`Tickets reviewed: ${reviewed} of 6 · Sections inspected: ${sections} of 18 · Attachments opened: ${attachments} of 6`;
 $('sequence').textContent=state.sequence.length?state.sequence.map((id,i)=>`${i+1}. ${id} (${status(id)})`).join(' → '):'No tickets started. Inspection does not record work order.';
 $('submit').hidden=state.submitted;$('retry').hidden=!state.submitted;
}
function renderQueue(){
 const ids=state.queue.filter(id=>filter==='all'||filter==='review'&&!M.reviewed(state,id)||filter==='active'&&state.active===id||filter==='completed'&&state.completed.includes(id));
 $('queue').innerHTML=ids.length?ids.map(id=>{const t=M.byId(id);return `<button type="button" class="ticket-row" data-ticket="${id}" aria-current="${state.selected===id}"><span class="row-heading"><strong>${id}</strong>${priorityTag(t,'Priority: ')}</span><span class="row-subject">${escape(t.title)}</span><span class="row-person">${escape(t.requester)} · ${escape(t.department)}</span><span class="row-meta"><span>Tue · ${t.submitted}</span><span class="status-tag">${status(id)}</span></span></button>`;}).join(''):'<p class="empty-filter">No tickets in this view. Choose All tickets to see the queue.</p>';
 for(const b of $('queue-filters').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
}
function optionList(t,field){const options=field==='issue'?t.issues:t.actions,ids=state.options[t.id][field==='issue'?'issues':'actions'];return '<option value="" disabled>Choose an answer</option>'+ids.map(id=>`<option value="${id}">${escape(options.find(o=>o.id===id).text)}</option>`).join('');}
function renderTicket(){
 const t=M.byId(state.selected);$('ticket-empty').hidden=Boolean(t);$('ticket-content').hidden=!t;if(!t){$('ticket-empty').querySelector('h2').id='ticket-title';$('ticket-content').replaceChildren();return;}
 // One unique heading ID is maintained in the visible pane.
 $('ticket-empty').querySelector('h2').id='welcome-title';
 const recorded=state.sequence.includes(t.id),editable=recorded&&!state.submitted,position=state.sequence.indexOf(t.id)+1,i=state.inspections[t.id];
 const beginReason=!M.allReviewed(state)?'Review every ticket section and attachment before beginning work.':state.active&&state.active!==t.id?`Complete ${state.active} before beginning another ticket.`:'';
 $('ticket-content').innerHTML=`<div class="ticket-toolbar"><span>${t.id} · Submitted Tuesday ${t.submitted}</span><span class="status-tag">${status(t.id)}</span></div>
  <div class="ticket-header"><h2 id="ticket-title" tabindex="-1">${escape(t.title)}</h2><dl class="ticket-meta"><dt>Priority</dt><dd>${priorityTag(t)}</dd><dt>Requester</dt><dd>${escape(t.requester)}</dd><dt>Department</dt><dd>${escape(t.department)}</dd><dt>Device</dt><dd>${escape(t.device)}</dd><dt>Affected</dt><dd>${escape(t.scope)}</dd></dl></div>
  <nav class="ticket-sections" role="tablist" aria-label="Ticket information">${M.sections.map(key=>`<button type="button" role="tab" id="section-${key}" data-section="${key}" aria-controls="section-panel" aria-selected="${state.section===key}" tabindex="${state.section===key?0:-1}">${labels[key]}${i.sections.includes(key)?' · Read':''}</button>`).join('')}</nav>
  <section id="section-panel" class="ticket-section" role="tabpanel" aria-labelledby="section-${state.section}"><h3>${labels[state.section]}</h3><p>${escape(t.sections[state.section])}</p><p class="section-status">Sections inspected: ${i.sections.length} of 3 · Attachments opened: ${i.attachments.length} of ${t.attachments.length}</p></section>
  <section class="attachments" aria-labelledby="attachment-title"><h3 id="attachment-title">Attached evidence</h3>${t.attachments.length?`<div class="attachment-list">${t.attachments.map(a=>`<button type="button" data-attachment="${a.id}">${escape(a.name)}<small>${a.kind==='image'?'Image capture and readable transcript':'Text attachment'} · ${i.attachments.includes(a.id)?'Opened':'Not opened'}</small></button>`).join('')}</div>`:'<p>No attachments. Review the three information sections above.</p>'}</section>
  <section class="ticket-work"><h3>Technician workspace</h3>${recorded?`<p class="work-status">Work position ${position} · ${status(t.id)}</p>`:`<button type="button" id="begin" class="primary" ${beginReason||state.submitted?'disabled':''}>Begin Work on This Ticket</button><p id="begin-guidance">${escape(beginReason||'Beginning work records this ticket’s place in your sequence.')}</p>`}
  <fieldset ${editable?'':'disabled'}><legend>Your response plan</legend><label for="issue">Most Likely Issue</label><select id="issue">${optionList(t,'issue')}</select><label for="action">Best Corrective Action</label><select id="action">${optionList(t,'action')}</select></fieldset>
  ${state.active===t.id?'<button type="button" id="complete" class="primary">Complete This Ticket</button><p>Record both decisions to mark your Tier 1 response as processed.</p>':''}${state.completed.includes(t.id)&&!state.submitted?'<p>You can revise either answer. Your original work position stays recorded.</p>':''}</section>`;
 $('issue').value=state.answers[t.id].issue;$('action').value=state.answers[t.id].action;
}
function results(){
 const node=$('results');node.hidden=!state.submitted;if(!state.submitted){node.replaceChildren();return;}
 const g=M.grade(state),sequence=ids=>`<ol>${ids.map(id=>`<li><strong>${id}</strong> · ${escape(M.byId(id).title)} ${priorityTag(M.byId(id))}</li>`).join('')}</ol>`;
 node.innerHTML=`<h2 id="score-title">Service desk results</h2><p class="score">${g.score} / 39 points · ${g.percentage}%</p><p class="breakdown">Priority relationships: ${g.priority}/15 · Issue identification: ${g.issues}/12 · Corrective actions: ${g.actions}/12</p><p>Priority is graded from the displayed labels. Each ticket pair earns 1 point when the higher priority comes first; either order is accepted when the labels match. Each issue and action earns 2 points independently.</p>
  <div class="sequence-compare"><div><h3>Your processing sequence</h3>${sequence(state.sequence)}</div><div><h3>One accepted processing sequence</h3>${sequence(g.order)}<p>Tickets with the same priority can be processed in either order.</p></div></div>
  <details><summary>Priority relationship review · ${g.priority} of 15</summary><ul>${g.pairs.map(p=>`<li>${p.correct?'Correct':'Reversed'}: ${p.samePriority?`${p.before} and ${p.after} have the same priority; either order is accepted`:`${p.before} (${M.priorities[M.byId(p.before).priority].label}) before ${p.after} (${M.priorities[M.byId(p.after).priority].label})`}</li>`).join('')}</ul></details>
  <h3>Evidence and response review</h3>${g.order.map(id=>{const t=M.byId(id),r=g.details.find(x=>x.id===id),a=state.answers[id],issue=t.issues.find(x=>x.id===a.issue),action=t.actions.find(x=>x.id===a.action);return `<article class="feedback ${r.issue+r.action===4?'good':''}" data-review="${id}"><h4>${id} · ${escape(t.title)}</h4><dl><dt>Most Likely Issue · ${r.issue}/2</dt><dd>Your choice: ${escape(issue.text)}<br>Correct issue: <strong>${escape(t.issues.find(o=>o.id===r.issueKey).text)}</strong></dd><dt>Best Corrective Action · ${r.action}/2</dt><dd>Your choice: ${escape(action.text)}<br>Correct action: <strong>${escape(t.actions.find(o=>o.id===r.actionKey).text)}</strong></dd><dt>Interpret the evidence</dt><dd>${escape(r.evidence)}</dd><dt>Appropriate response and verification</dt><dd>${escape(r.fix)}</dd><dt>Why this relative priority?</dt><dd>${escape(r.priority)}</dd></dl></article>`;}).join('')}`;
}
function render(){overview();renderQueue();renderTicket();results();save();}
function selectTicket(id){if(!M.byId(id))return;if(!state.submitted)M.inspect(state,id,'request');else{state.selected=id;state.section='request';}announce('');overview();renderQueue();renderTicket();save();$('ticket-title').focus();}
$('queue').addEventListener('click',e=>{const b=e.target.closest('[data-ticket]');if(b)selectTicket(b.dataset.ticket);});
$('queue-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;renderQueue();}});
function section(key,focus=false){if(!state.submitted)M.inspect(state,state.selected,key);else state.section=key;overview();renderQueue();renderTicket();save();if(focus)$('section-'+key).focus();}
$('ticket-content').addEventListener('keydown',e=>{const b=e.target.closest('[data-section]');if(!b)return;let index=M.sections.indexOf(b.dataset.section);if(e.key==='ArrowRight')index=(index+1)%3;else if(e.key==='ArrowLeft')index=(index+2)%3;else if(e.key==='Home')index=0;else if(e.key==='End')index=2;else return;e.preventDefault();section(M.sections[index],true);});
$('ticket-content').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.section){section(b.dataset.section,true);return;}
 if(b.dataset.attachment){
  const a=M.byId(state.selected).attachments.find(a=>a.id===b.dataset.attachment);if(!a)return;
  $('evidence-title').textContent=a.title;
  $('evidence-content').innerHTML=a.kind==='image'?`<button type="button" id="zoom-image" aria-pressed="false">Enlarge capture</button><div class="capture-scroll" tabindex="0" aria-label="Capture image; use arrow keys to pan when enlarged"><img src="${a.name}" alt="${escape(a.caption)}"></div><p>${escape(a.caption)}</p><h3>Readable transcript</h3><pre class="transcript">${escape(transcripts[a.view])}</pre>`:`<pre>${escape(a.content)}</pre>`;
  $('evidence').showModal();if(!state.submitted)M.inspectAttachment(state,state.selected,a.id);overview();save();return;
 }
 if(b.id==='begin'){if(M.begin(state,state.selected)){render();announce(`${state.selected} started at work position ${state.sequence.length}.`);$('issue').focus();}return;}
 if(b.id==='complete'){if(!M.complete(state,state.selected)){announce('Choose both the most likely issue and the best corrective action before completing this ticket.');(!state.answers[state.selected].issue?$('issue'):$('action')).focus();return;}render();announce(`${state.selected} processed. Select the next ticket you want to work on.`);$('ticket-title').focus();}
});
$('ticket-content').addEventListener('change',e=>{if(['issue','action'].includes(e.target.id)){if(!M.answer(state,state.selected,e.target.id,e.target.value))e.target.value=state.answers[state.selected][e.target.id];save();announce('Response saved. No correctness feedback is shown until submission.');}});
$('evidence-content').addEventListener('click',e=>{if(e.target.id!=='zoom-image')return;const enlarged=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(enlarged));e.target.textContent=enlarged?'Fit capture to viewer':'Enlarge capture';$('evidence-content').querySelector('.capture-scroll').classList.toggle('enlarged',enlarged);});
for(const dialog of [$('evidence'),$('confirm')])dialog.addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const controls=[...dialog.querySelectorAll('button:not([disabled]),[tabindex="0"]')],first=controls[0],last=controls[controls.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
$('close-evidence').addEventListener('click',()=>$('evidence').close());
$('evidence').addEventListener('close',()=>{
 renderQueue();const t=M.byId(state.selected),i=state.inspections[state.selected];
 if(t){for(const a of t.attachments){const button=$('ticket-content').querySelector(`[data-attachment="${a.id}"]`);if(button)button.querySelector('small').textContent=`${a.kind==='image'?'Image capture and readable transcript':'Text attachment'} · ${i.attachments.includes(a.id)?'Opened':'Not opened'}`;}
 const progress=$('ticket-content').querySelector('.section-status');if(progress)progress.textContent=`Sections inspected: ${i.sections.length} of 3 · Attachments opened: ${i.attachments.length} of ${t.attachments.length}`;
 // The final attachment can unlock Begin Work without replacing the opener.
 const begin=$('begin');if(begin){begin.disabled=state.submitted||!M.allReviewed(state)||Boolean(state.active);if(!begin.disabled)$('begin-guidance').textContent='Beginning work records this ticket’s place in your sequence.';}}
 // Native dialog closing restores the unchanged opener without a delayed focus move.
});
$('submit').addEventListener('click',()=>{
 if(state.submitted)return;
 if(!M.allReviewed(state)){announce('Inspect every ticket, all three information sections, and every available attachment before submitting.');return;}
 if(!M.submit(state)){announce('Process all six tickets and record both decisions for each before submitting.');return;}
 render();announce('Queue submitted. Review the scoring, evidence, and priority reasoning below.');$('results').focus();
});
function confirmFresh(source){$('confirm-title').textContent=source==='retry'?'Retry with a fresh attempt?':'Reset this activity?';$('confirm').showModal();}
$('reset').addEventListener('click',()=>confirmFresh('reset'));$('retry').addEventListener('click',()=>confirmFresh('retry'));
$('keep').addEventListener('click',()=>$('confirm').close());
$('confirm-action').addEventListener('click',()=>{const previous=state.queue;state=M.initial(Math.random,previous);filter='all';$('confirm').close();render();announce('Fresh attempt ready. Review progress, answers, work sequence, and score have been cleared.');$('queue').querySelector('button').focus();});
const tabs=[$('activity-tab'),$('lesson-tab')];
function tab(index,focus=false){tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;$(t.getAttribute('aria-controls')).hidden=i!==index;});if(focus)tabs[index].focus();}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>tab(i));t.addEventListener('keydown',e=>{let index;if(['ArrowRight','ArrowLeft'].includes(e.key))index=1-i;if(e.key==='Home')index=0;if(e.key==='End')index=1;if(index!==undefined){e.preventDefault();tab(index,true);}});});
render();
if(updatedAttempt)announce('The tickets have been updated. A fresh attempt has been started.');
})();
