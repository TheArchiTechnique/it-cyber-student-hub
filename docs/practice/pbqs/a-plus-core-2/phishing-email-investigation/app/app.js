(function(){
'use strict';
const M=window.PhishingInvestigation,$=id=>document.getElementById(id);
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,storage=true,pending=null,migrated=false;
try{
  const raw=JSON.parse(localStorage.getItem(M.KEY));
  migrated=raw&&raw.version!==M.VERSION;
  state=M.restore(raw);
}catch{state=M.initial();}
function save(){
  try{localStorage.setItem(M.KEY,JSON.stringify(state));storage=true;}catch{storage=false;}
  $('save-status').textContent=storage?'Progress saved in this browser.':'Browser storage unavailable. Progress is kept for this page session.';
}
const message=()=>M.bank.find(m=>m.id===state.selected);
const qr='<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><rect width="44" height="44" fill="white"/><path d="M3 3h12v12H3zM29 3h12v12H29zM3 29h12v12H3z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M8 8h3v3H8zM34 8h3v3h-3zM8 34h3v3H8zM20 20h7v7h-7zM32 25h7v4h-7zM25 34h4v7h-4zM35 35h6v6h-6z" fill="currentColor"/></svg>';
function evidence(item,css=''){
  const a=state.answers[state.selected],content=(item.kind==='qr'?qr:'')+escape(item.text);
  if(a.classification!=='Phishing'||!M.details(message()).some(e=>e.id===item.id))return `<span class="message-detail ${css}">${content}</span>`;
  const selected=a.evidence.includes(item.id);
  return `<button type="button" class="evidence ${css}" data-evidence="${escape(item.id)}" aria-pressed="${selected}" ${state.submitted?'disabled':''}>${content}</button>`;
}
function queue(){
  const done=state.ids.filter(id=>state.answers[id].classification).length,responses=state.responseIds.filter(id=>state.decisions[id]).length;
  $('progress').textContent=`${done} / 7 classified · ${state.read.length} / 7 read`;
  $('response-progress').textContent=`${responses} / 3 response decisions selected`;
  $('queue').innerHTML=state.ids.map(id=>{
    const m=M.bank.find(m=>m.id===id),a=state.answers[id],read=state.read.includes(id);
    return `<button type="button" class="queue-message ${read?'':'unread'}" data-message="${id}" aria-current="${state.selected===id}"><strong>${escape(m.name)}</strong><span class="queue-subject">${escape(m.subject)}</span><span class="queue-meta"><span>${m.time} · ${read?'Read':'Unread'}</span><span>${a.classification?'Classified':'Not classified'}</span></span></button>`;
  }).join('');
}
function renderMessage(){
  const m=message();
  $('message-position').textContent=`Message ${state.ids.indexOf(m.id)+1} of 7`;
  $('message').innerHTML=`<h2 id="message-title">${evidence({id:'subject',text:m.subject})}</h2>
    <dl class="message-headers"><dt>From</dt><dd><span class="message-detail">${escape(m.name)}</span><br>${evidence({id:'from',text:m.from})}</dd><dt>To</dt><dd><span class="message-detail">${escape(m.to)}</span></dd>${m.reply?`<dt>Reply-To</dt><dd>${evidence({id:'reply',text:m.reply})}</dd>`:''}<dt>Date</dt><dd><span class="message-detail">${escape(m.date+' '+m.time)}</span></dd></dl>
    <div class="message-body">${m.body.map(e=>`<p>${evidence(e)}</p>`).join('')}
    ${m.links.map(l=>`<div class="link-item">${evidence(l,l.kind==='qr'?'qr-placeholder':'email-link')}${l.kind==='qr'?'<p class="qr-note">QR illustration is not scannable. Inspect the simulated encoded destination below.</p>':''}<details aria-label="Destination for ${escape(l.text)}"><summary aria-label="Inspect ${l.kind==='qr'?'QR ':''}destination for ${escape(l.text)}">Inspect ${l.kind==='qr'?'QR ':''}destination</summary><p class="destination">${escape(l.destination)}</p></details></div>`).join('')}
    ${m.attachments.length?`<div class="attachments"><h3>Attachments · inspection only</h3>${m.attachments.map(a=>evidence(a,'attachment')).join('')}</div>`:''}</div>`;
  $('classification').value=state.answers[m.id].classification;
  updateControls();
}
function updateControls(){
  const a=state.answers[state.selected];
  $('evidence-instruction').hidden=a.classification!=='Phishing';
  $('evidence-count').textContent=a.classification==='Phishing'?`${a.evidence.length} detail${a.evidence.length===1?'':'s'} selected as suspicious evidence.`:'Choose a classification first. Evidence selection is available for Phishing.';
  $('classification').disabled=state.submitted;
  $('submit').disabled=state.submitted;$('submit').hidden=state.submitted;$('retry').hidden=!state.submitted;
}
function renderResponses(){
  $('response-decisions').innerHTML=state.responseIds.map((id,index)=>{
    const r=M.responseBank.find(r=>r.id===id);
    return `<fieldset class="response-decision"><legend>${index+1} · ${escape(r.title)}</legend><p id="response-prompt-${id}">${escape(r.prompt)}</p><div role="radiogroup" aria-labelledby="response-prompt-${id}">${state.optionOrders[id].map(optionId=>{
      const o=r.options.find(o=>o.id===optionId);
      return `<label class="response-option"><input type="radio" name="response-${id}" data-decision="${id}" value="${o.id}" ${state.decisions[id]===o.id?'checked':''} ${state.submitted?'disabled':''}><span>${escape(o.text)}</span></label>`;
    }).join('')}</div></fieldset>`;
  }).join('');
}
function evidenceReview(m,g){
  const labels=Object.fromEntries(M.details(m).map(e=>[e.id,e.text]));
  const list=(ids,incorrect=false)=>ids.length?`<ul>${ids.map(id=>`<li><strong>${escape(labels[id])}</strong>: ${incorrect?'This detail does not by itself support phishing in this message. Assess it alongside the request and destination.':escape(m.indicators[id])}</li>`).join('')}</ul>`:'<p>None.</p>';
  return `<details class="review-section"><summary>Suspicious evidence review</summary>${g.classification===0?'<p>Evidence earns points only when an actual phishing message is classified as Phishing. Review the indicators below.</p>':''}<h5>Correctly identified suspicious areas</h5>${list(g.correct)}<h5>Missed indicators</h5>${list(g.missed)}<h5>Incorrect selections</h5>${list(g.incorrect,true)}</details>`;
}
function attackReview(m){
  const groups=[['Primary attack type',m.analysis.attacks],['Social-engineering techniques and tactics',m.analysis.tactics],['Technical indicators and concepts',m.analysis.technical]];
  return `<details class="review-section"><summary>Attack &amp; Social Engineering Analysis</summary>${groups.map(([title,terms])=>`<h5>${title}</h5><dl>${terms.map(t=>`<dt>${escape(t.term)}</dt><dd>${escape(t.explanation)}</dd>`).join('')}</dl>`).join('')}</details>`;
}
function results(){
  if(!state.submitted){$('results').hidden=true;$('results').replaceChildren();return;}
  const grade=M.grade(state);
  $('results').innerHTML=`<h2 id="score-title">Investigation results</h2><p class="score">${grade.score} / 29 points · ${grade.percentage}%</p>
    <p class="breakdown">Email classification ${grade.classification}/14 · Phishing evidence ${grade.evidence}/9 · Security Response Decisions ${grade.response}/6</p>
    <p>Classification: 2 points per message. Evidence: up to 3 points for each actual phishing email correctly classified as Phishing. Partial credit reflects the fraction of indicators found minus the fraction of benign selectable areas chosen, with a zero minimum and two-decimal rounding. Spam and legitimate mail have no evidence points. Response decisions: 2 points each.</p>
    <h3>Email review</h3>${grade.messages.map(g=>{
      const m=M.bank.find(m=>m.id===g.id);
      return `<article class="feedback email-feedback ${g.score===g.max?'good':''}" data-review="${m.id}"><h4>${escape(m.subject)} · ${g.score} / ${g.max}</h4>
        <p class="breakdown">Classification ${g.classification}/2${m.classification==='Phishing'?` · Evidence ${g.evidence}/3`:''}</p>
        <dl><dt>Your classification</dt><dd>${escape(state.answers[m.id].classification||'None')}</dd><dt>Correct classification</dt><dd>${m.classification}</dd></dl><p>${escape(m.explanation)}</p>
        ${m.classification==='Phishing'?attackReview(m)+evidenceReview(m,g):''}
        <details class="review-section"><summary>Real-World Verification</summary><p>${escape(m.verification)}</p></details></article>`;
    }).join('')}
    <h3>Security Response Decisions review</h3>${grade.decisions.map(g=>{
      const r=M.responseBank.find(r=>r.id===g.id),chosen=r.options.find(o=>o.id===state.decisions[r.id]),correct=r.options.find(o=>o.id===r.correct);
      return `<article class="feedback response-feedback ${g.score===2?'good':''}" data-response-review="${r.id}"><h4>${escape(r.title)} · ${g.score} / 2</h4><p>${escape(r.prompt)}</p><dl><dt>Your decision</dt><dd>${escape(chosen?.text||'None')}</dd><dt>Correct action</dt><dd>${escape(correct.text)}</dd></dl><p>${escape(correct.explanation)}</p><p><strong>${escape(r.concept.term)}:</strong> ${escape(r.concept.explanation)}</p><details class="review-section"><summary>Why the alternatives are less appropriate</summary><ul>${r.options.filter(o=>o.id!==r.correct).map(o=>`<li><strong>${escape(o.text)}</strong> ${escape(o.explanation)}</li>`).join('')}</ul></details></article>`;
    }).join('')}`;
  $('results').hidden=false;
}
function render(){queue();renderMessage();renderResponses();results();save();}
for(const value of M.classifications){const option=document.createElement('option');option.value=value;option.textContent=value;$('classification').append(option);}
$('classification').addEventListener('change',()=>{
  if(state.submitted)return;
  M.classify(state,state.selected,$('classification').value);
  $('notice').textContent='';queue();renderMessage();save();
});
$('queue').addEventListener('click',event=>{
  const b=event.target.closest('[data-message]');if(!b)return;
  state.selected=b.dataset.message;if(!state.read.includes(state.selected))state.read.push(state.selected);
  queue();renderMessage();save();$('queue').querySelector('[aria-current=true]').focus();
});
$('message').addEventListener('click',event=>{
  const b=event.target.closest('[data-evidence]');if(!b||state.submitted||state.answers[state.selected].classification!=='Phishing')return;
  const id=b.dataset.evidence,a=state.answers[state.selected];
  a.evidence=a.evidence.includes(id)?a.evidence.filter(e=>e!==id):[...a.evidence,id];
  b.setAttribute('aria-pressed',String(a.evidence.includes(id)));updateControls();save();
});
$('response-decisions').addEventListener('change',event=>{
  const input=event.target.closest('[data-decision]');if(!input||state.submitted)return;
  state.decisions[input.dataset.decision]=input.value;$('notice').textContent='';queue();save();
});
$('assessment').addEventListener('submit',e=>e.preventDefault());
$('submit').addEventListener('click',()=>{
  if(state.submitted)return;
  const unfinished=state.ids.find(id=>!state.answers[id].classification);
  if(unfinished){
    state.selected=unfinished;if(!state.read.includes(unfinished))state.read.push(unfinished);
    queue();renderMessage();save();$('notice').textContent='Choose a classification for every message before submitting.';$('classification').focus();return;
  }
  const response=state.responseIds.find(id=>!state.decisions[id]);
  if(response){$('notice').textContent='Complete all three Security Response Decisions before submitting.';document.querySelector(`[data-decision="${response}"]`).focus();return;}
  state.submitted=true;render();$('notice').textContent='Investigation submitted. Review the reasoning below, or retry to correct your selections.';$('results').focus();
});
$('retry').addEventListener('click',()=>{
  state.submitted=false;render();$('notice').textContent='Retry keeps the same messages, response scenarios, and selections. Feedback is hidden while you revise.';$('classification').focus();
});
function confirm(action){
  pending=action;$('confirm-title').textContent=action==='new'?'Start a new investigation?':'Reset this attempt?';
  $('confirm-text').textContent=action==='new'?'Draw another balanced set of messages and response scenarios, then clear your answers.':'Clear classifications, evidence, response decisions, and read states. Keep the same messages and scenarios.';
  $('confirm-action').textContent=action==='new'?'New Investigation':'Reset Attempt';$('confirm').showModal();
}
$('reset').addEventListener('click',()=>confirm('reset'));$('new').addEventListener('click',()=>confirm('new'));$('keep').addEventListener('click',()=>$('confirm').close());
$('confirm-action').addEventListener('click',()=>{
  state=pending==='new'?M.initial(Math.random,state.ids):M.reset(state);$('confirm').close();
  $('notice').textContent=pending==='new'?'New investigation ready.':'Attempt reset. The same messages and response scenarios are ready.';
  render();$('queue').querySelector('button').focus();
});
const tabs=[$('activity-tab'),$('lesson-tab')];
function tab(index,focus=false){tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(index===i));t.tabIndex=index===i?0:-1;$(t.getAttribute('aria-controls')).hidden=index!==i;});if(focus)tabs[index].focus();}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>tab(i));t.addEventListener('keydown',e=>{let index;if(e.key==='ArrowRight'||e.key==='ArrowLeft')index=1-i;if(e.key==='Home')index=0;if(e.key==='End')index=1;if(index!==undefined){e.preventDefault();tab(index,true);}});});
render();
if(migrated)$('notice').textContent='This activity has been updated. An older saved attempt was reset for the new scoring and response workflow.';
})();
