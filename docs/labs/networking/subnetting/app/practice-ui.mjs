import {CATEGORIES,createSession,generateQuestions,gradeAnswer,submitAnswer,nextQuestion,summarize,sanitizeSession} from './practice.mjs';

export const PRACTICE_KEY='student-hub-network-plus-subnetting-practice-v1';
const $=id=>document.getElementById(id);
function node(tag,text,className) {
  const element=document.createElement(tag);
  if (text!==undefined) element.textContent=text;
  if (className) element.className=className;
  return element;
}
function choiceText(value) {
  const span=node('span',undefined,'practice-choice-value');
  if (/^[01]{8}(\.[01]{8}){3}$/.test(value)) value.split('.').forEach((octet,index)=>{
    if (index) {span.append(document.createTextNode('.'),node('wbr'));}
    span.append(node('span',octet,'practice-binary-octet'));
  });
  else span.textContent=value;
  return span;
}

export function mountPractice({switchSection,openWorksheet,onSessionChange}) {
  let session=null,questions=[],unavailable=false,recovery='',pending=null;
  try {
    const raw=localStorage.getItem(PRACTICE_KEY);
    if (raw) {session=sanitizeSession(JSON.parse(raw));if (!session) recovery='The saved practice session could not be restored. Start a new session.';}
  } catch(error) {
    if (error instanceof SyntaxError) recovery='The saved practice session could not be restored. Start a new session.';
    else unavailable=true;
  }
  if (session) {
    questions=generateQuestions(session);
    $('practice-count').value=String(session.count);$('practice-coverage').value=session.coverage;
  }
  function save() {
    try {if (session) localStorage.setItem(PRACTICE_KEY,JSON.stringify(session));} catch {unavailable=true;}
    $('practice-save-note').textContent=unavailable?'Browser saving is unavailable. Keep this page open to retain this practice session.'
      :recovery||(session?'Practice progress is saved in this browser.':'Choose options to start a new randomized session.');
  }
  function contextFor(id) {
    const index=questions.findIndex(question=>question.id===id);
    if (!session||index<0||!questions[index].worksheet) return null;
    return {id,...questions[index].worksheet,submitted:session.answers[index]!==null,number:index+1};
  }
  function current() {return session&&session.cursor<session.count?questions[session.cursor]:null;}
  function start(config) {
    session=createSession(config);questions=generateQuestions(session);recovery='';
    $('practice-count').value=String(session.count);$('practice-coverage').value=session.coverage;
    save();render();onSessionChange();$('practice-prompt').focus();
  }
  function requestStart(config) {
    if (session) {
      pending=config;$('practice-restart-dialog').showModal();
    } else start(config);
  }
  function relatedLesson(question) {switchSection('lesson',true,question.lesson);}
  function renderQuestion() {
    const q=current(),submitted=session.answers[session.cursor]!==null;
    $('practice-question-title').textContent=`Question ${session.cursor+1} of ${session.count}`;
    $('practice-category').textContent=CATEGORIES[q.category];$('practice-prompt').textContent=q.prompt;
    const answered=session.answers.filter(answer=>answer!==null).length;
    $('practice-progress').max=session.count;$('practice-progress').value=answered;
    $('practice-progress-text').textContent=`${answered} of ${session.count} answers submitted.`;
    $('practice-answer-controls').replaceChildren();$('practice-error').textContent='';
    const value=submitted?session.answers[session.cursor]:session.drafts[session.cursor];
    const fieldset=node('fieldset');fieldset.setAttribute('aria-labelledby','practice-prompt');
    if (q.format==='mcq') {
      fieldset.append(node('legend','Choose one answer'));
      q.choices.forEach((choice,index)=>{
        const label=node('label',undefined,'practice-choice');
        const input=node('input');input.type='radio';input.name='practice-answer';input.id=`practice-choice-${index}`;input.value=choice;
        input.checked=value===choice;input.disabled=submitted;input.setAttribute('aria-describedby','practice-answer-help practice-error');
        label.htmlFor=input.id;label.append(input,choiceText(choice));fieldset.append(label);
      });
      $('practice-answer-help').textContent='Choose one of the four answers, then submit.';
    } else {
      const label=node('label','Your answer');label.htmlFor='practice-answer';
      const input=node(q.format==='select'?'select':'input');input.id='practice-answer';input.name='practice-answer';input.disabled=submitted;
      input.setAttribute('aria-describedby','practice-answer-help practice-error');
      if (q.format==='select') {
        const option=node('option','Select an answer');option.value='';option.disabled=true;input.append(option);
        for (const choice of q.choices) {const option=node('option',choice);option.value=choice;input.append(option);}
        input.value=value;
      } else {
        input.type='text';input.autocomplete='off';input.spellcheck=false;input.maxLength=128;
        if (q.answerKind==='number') input.inputMode='numeric';
        input.value=value;
      }
      label.append(input);fieldset.append(label);
      const help={address:'Enter a dotted-decimal IPv4 address.',prefix:'Enter CIDR notation, such as /24, or an equivalent contiguous subnet mask.',
        number:'Enter a whole number. Commas in groups of three are accepted.',relation:'Enter Same or Different.'};
      $('practice-answer-help').textContent=q.format==='select'?'Select one prefix or mask, then submit.':help[q.answerKind];
    }
    $('practice-answer-controls').append(fieldset);
    $('practice-submit').disabled=submitted;$('practice-next').hidden=!submitted;
    $('practice-next').textContent=session.cursor===session.count-1?'View Results':'Next question';
    $('practice-feedback').hidden=!submitted;$('practice-feedback').replaceChildren();
    if (submitted) {
      const correct=gradeAnswer(q,session.answers[session.cursor]).correct;
      $('practice-feedback').className=`feedback${correct?' good':''}`;
      $('practice-feedback').append(node('h3',correct?'✓ Correct':'× Incorrect'),node('p',`Your answer: ${session.answers[session.cursor]}`),node('p',`Correct answer: ${q.correctAnswer}`),node('p',q.explanation));
    }
    $('practice-worksheet').disabled=!q.worksheet;
    $('practice-worksheet-help').textContent=q.worksheet
      ?'The question worksheet starts with blank answers and preserves your regular worksheet. Checking and solutions unlock after you submit this practice answer.'
      :'Use the lesson or quick reference for this question. A prepared worksheet could disclose the value you are being asked to determine.';
  }
  function renderResults() {
    const result=summarize(session);
    $('practice-score').textContent=`${result.correct} correct · ${result.incorrect} incorrect · ${result.total} questions · ${result.percentage}%`;
    const weaker=Object.entries(result.categories).filter(([,data])=>data.correct<data.total).map(([key])=>CATEGORIES[key]);
    $('practice-focus').textContent=weaker.length?`Focus your next review on: ${weaker.join('; ')}.`:'All categories in this session were answered correctly. Try fresh questions to reinforce the process.';
    $('practice-category-results').replaceChildren();$('practice-review').replaceChildren();
    for (const [key,data] of Object.entries(result.categories).sort(([a],[b])=>a.localeCompare(b))) {
      const row=node('tr'),heading=node('th',CATEGORIES[key]);heading.scope='row';
      row.append(heading,node('td',String(data.correct)),node('td',String(data.total-data.correct)),node('td',String(data.total)));$('practice-category-results').append(row);
    }
    questions.forEach((q,index)=>{
      const correct=gradeAnswer(q,session.answers[index]).correct;
      const details=node('details',undefined,'practice-review-question');details.dataset.reviewIndex=index;
      details.open=!correct;details.append(node('summary',`${index+1}. ${CATEGORIES[q.category]} · ${correct?'Correct':'Incorrect'}`));
      const content=node('div',undefined,'practice-review-content');
      content.append(node('p',q.prompt),node('p',`Your answer: ${session.answers[index]}`),node('p',`Correct answer: ${q.correctAnswer}`),node('p',q.explanation));
      const lesson=node('button','Review this calculation in the lesson');lesson.type='button';lesson.addEventListener('click',()=>relatedLesson(q));content.append(lesson);
      if (q.worksheet) {const worksheet=node('button','Investigate in binary worksheet');worksheet.type='button';worksheet.addEventListener('click',()=>openWorksheet(contextFor(q.id)));content.append(worksheet);}
      details.append(content);$('practice-review').append(details);
    });
  }
  function render() {
    $('practice-current').hidden=!session||session.cursor===session.count;
    $('practice-results').hidden=!session||session.cursor!==session.count;
    if (session) {if (session.cursor===session.count) renderResults();else renderQuestion();}
  }
  $('practice-config').addEventListener('submit',event=>{
    event.preventDefault();requestStart({count:Number($('practice-count').value),coverage:$('practice-coverage').value});
  });
  $('practice-restart').addEventListener('click',()=>requestStart({count:session.count,coverage:session.coverage}));
  $('practice-new-results').addEventListener('click',()=>requestStart({count:Number($('practice-count').value),coverage:$('practice-coverage').value}));
  $('practice-cancel-restart').addEventListener('click',()=>{pending=null;$('practice-restart-dialog').close();});
  $('practice-restart-dialog').addEventListener('cancel',()=>{pending=null;});
  $('practice-confirm-restart').addEventListener('click',()=>{const config=pending;pending=null;$('practice-restart-dialog').close();if (config) start(config);});
  $('practice-answer-form').addEventListener('input',event=>{
    if (!current()||session.answers[session.cursor]!==null||event.target.name!=='practice-answer') return;
    session.drafts[session.cursor]=event.target.value;event.target.removeAttribute('aria-invalid');$('practice-error').textContent='';save();
  });
  $('practice-answer-form').addEventListener('submit',event=>{
    event.preventDefault();if (!current()||session.answers[session.cursor]!==null) return;
    const result=submitAnswer(session,session.drafts[session.cursor]);
    if (!result.grade.valid) {
      $('practice-error').textContent=result.grade.message;
      const input=$('practice-answer')||document.querySelector('#practice-answer-controls input');input.setAttribute('aria-invalid','true');input.focus();return;
    }
    session=result.session;save();render();onSessionChange();$('practice-next').focus();
  });
  $('practice-next').addEventListener('click',()=>{
    session=nextQuestion(session);save();render();onSessionChange();
    (session.cursor===session.count?$('practice-results-title'):$('practice-prompt')).focus();
  });
  $('practice-worksheet').addEventListener('click',()=>{const q=current();if (q?.worksheet) openWorksheet(contextFor(q.id));});
  $('practice-lesson').addEventListener('click',()=>{const q=current();if (q) relatedLesson(q);});
  render();save();
  return {contextFor};
}
