'use strict';
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(values) {
 const copy = [...values];
 for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i],copy[j]] = [copy[j],copy[i]]; }
 return copy;
}
let run, current, states;
function start() {
 run = shuffle(QUESTIONS).map(q => ({...q, parts:q.parts.map(p=>({...p,options:shuffle(p.options)}))}));
 states = run.map(q=>({answers:q.parts.map(()=>''),checked:false}));
 current = 0;
 showTab('practice');
 render();
}
function totals() {
 let possible=0, earned=0, graded=0, checked=0;
 run.forEach((q,i)=>{possible+=q.parts.length;if(states[i].checked){checked++;graded+=q.parts.length;q.parts.forEach((p,j)=>{if(states[i].answers[j]===p.answer)earned++;});}});
 return {possible,earned,graded,checked};
}
function showTab(name) {
 ['practice','review','results'].forEach(id=>{const active=id===name;$(id).hidden=!active;$('tab-'+id).setAttribute('aria-selected',String(active));$('tab-'+id).tabIndex=active?0:-1;});
 if(name==='review' && run)renderReview();
 if(name==='results' && run)renderResults();
}
function render() {
 const q=run[current],s=states[current],t=totals();
 $('progress-text').textContent=`${t.checked} of ${run.length} tasks checked`;
 $('score-text').textContent=`${t.earned} / ${t.graded} checked points`;
 $('progress').max=run.length;$('progress').value=t.checked;
 $('task-type').textContent=q.type;$('task-number').textContent=`Task ${current+1} / ${run.length}`;
 $('prompt').textContent=q.prompt;
 $('jump').innerHTML=run.map((item,i)=>`<option value="${i}" ${i===current?'selected':''}>${i+1}. ${escapeHTML(item.type)}${states[i].checked?' · Checked':''}</option>`).join('');
 const matching=q.type.includes('matching');
 $('fields').innerHTML=q.parts.map((p,j)=>{
  if(matching)return `<div class="field"><label class="field-label" for="answer-${j}">${escapeHTML(p.label)}</label><select id="answer-${j}" data-part="${j}" ${s.checked?'disabled':''}><option value="">Choose an answer</option>${p.options.map(o=>`<option value="${escapeHTML(o)}" ${s.answers[j]===o?'selected':''}>${escapeHTML(o)}</option>`).join('')}</select><br><br></div>`;
  return `<fieldset ${s.checked?'disabled':''}><legend>${escapeHTML(p.label)}</legend><div class="choices">${p.options.map((o,k)=>`<label class="choice"><input type="radio" name="answer-${j}" data-part="${j}" value="${escapeHTML(o)}" ${s.answers[j]===o?'checked':''}><span>${escapeHTML(o)}</span></label>`).join('')}</div></fieldset>`;
 }).join('');
 $('fields').querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{s.answers[Number(el.dataset.part)]=el.value;$('form-error').textContent='';}));
 $('check').hidden=s.checked;
 $('form-error').textContent='';
 // Explanations are only inserted after this task's first submission.
 $('feedback').innerHTML=s.checked?`<h3>${q.parts.filter((p,j)=>s.answers[j]===p.answer).length} / ${q.parts.length} points</h3>`+q.parts.map((p,j)=>`<div class="feedback-item ${s.answers[j]===p.answer?'correct':'incorrect'}"><strong>${s.answers[j]===p.answer?'Correct':'Review'} · ${escapeHTML(p.label)}</strong><p>Your answer: ${escapeHTML(s.answers[j])}</p><p>Correct answer: <b>${escapeHTML(p.answer)}</b></p><p>${escapeHTML(p.why)}</p></div>`).join(''):'';
 $('previous').disabled=current===0;$('next').textContent=current===run.length-1?'View results':'Next task';
 // Remove review material from the previous task, including its hidden DOM.
 $('review-cards').replaceChildren();$('review-note').textContent='';
}
function renderReview() {
 const q=run[current],s=states[current];
 const cards=s.checked?REVIEW:REVIEW.filter(c=>!q.blocked.includes('all')&&!q.blocked.includes(c.id));
 $('review-note').textContent=s.checked?'This task is checked. All review topics are available.':'Topics that could answer the active task are available after you check it. Other topics appear below.';
 $('review-cards').innerHTML=cards.length?cards.map(c=>`<article class="panel"><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.text)}</p></article>`).join(''):'<article class="panel"><h3>Read the task carefully</h3><p>Identify what the user is trying to do. Check whether each field asks for a service, a transport, or a port, and pay attention to which endpoint receives the message. Submit your choices to unlock the topic review.</p></article>';
}
function renderResults() {
 const t=totals(),complete=t.checked===run.length;
 $('results-body').innerHTML=`<p class="result-stat">${t.earned} / ${complete?t.possible:t.graded} points${complete?' · '+Math.round(t.earned/t.possible*100)+'%':''}</p><p>${complete?'Run complete. Review checked tasks below or restart for a fresh run.':`${t.checked} of ${run.length} tasks checked. ${t.possible-t.graded} points remain ungraded.`}</p><div class="result-list">${run.map((q,i)=>`<button class="result-row" data-task="${i}"><span>${i+1}. ${escapeHTML(q.type)}</span><span>${states[i].checked?q.parts.filter((p,j)=>states[i].answers[j]===p.answer).length+' / '+q.parts.length:'Not checked'}</span></button>`).join('')}</div>`;
 $('results-body').querySelectorAll('[data-task]').forEach(el=>el.addEventListener('click',()=>go(Number(el.dataset.task))));
}
function go(i){current=i;showTab('practice');render();$('prompt').focus();}
$('answer-form').addEventListener('submit',e=>{
 e.preventDefault();const s=states[current];if(s.checked)return;
 const missing=s.answers.findIndex(a=>!a);
 if(missing!==-1){$('form-error').textContent='Choose an answer for every part before checking.';$('fields').querySelector(`[data-part="${missing}"]`).focus();return;}
 s.checked=true;render();
});
$('jump').addEventListener('change',e=>go(Number(e.target.value)));
$('previous').addEventListener('click',()=>go(Math.max(0,current-1)));
$('next').addEventListener('click',()=>current===run.length-1?showTab('results'):go(current+1));
const tabs=['practice','review','results'];
tabs.forEach((id,i)=>{
 $('tab-'+id).addEventListener('click',()=>showTab(id));
 $('tab-'+id).addEventListener('keydown',e=>{
  let next;if(e.key==='ArrowRight')next=(i+1)%3;if(e.key==='ArrowLeft')next=(i+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;
  if(next!==undefined){e.preventDefault();showTab(tabs[next]);$('tab-'+tabs[next]).focus();}
 });
});
$('restart').addEventListener('click',()=>$('reset-dialog').showModal());
$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{$('reset-dialog').close();$('results-body').replaceChildren();start();$('prompt').focus();});
start();
