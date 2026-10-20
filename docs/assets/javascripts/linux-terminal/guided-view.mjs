import {stages, guidedState, newRun, stageText, checkStage} from './guided.mjs';

export function mountGuided({getState, save, switchFedora}) {
  const byId = id => document.getElementById(id);
  const panel = byId('guided-panel'), selector = byId('guided-stage'), feedback = byId('guided-feedback');
  let rendered = '', activeEditor = false;
  const profileStages = state => stages.filter(stage => state.distribution === 'fedora' ? stage.id === 'fedora' : stage.id !== 'fedora');
  function message(result) {
    feedback.replaceChildren();
    const text = document.createElement('p');
    text.textContent = result.ok ? 'Stage verified. Your work is saved; continue when you are ready.' : 'Keep working on these requirements:';
    feedback.append(text);
    if (!result.ok) {
      const list = document.createElement('ul');
      for (const failure of result.failures) { const item = document.createElement('li'); item.textContent = failure; list.append(item); }
      feedback.append(list);
    }
  }
  function render() {
    const state = getState(), progress = guidedState(state), run = progress.run;
    const guided = progress.mode === 'guided';
    panel.hidden = !guided;
    byId('practice-layout').classList.toggle('is-guided', guided);
    byId('guided-mode').setAttribute('aria-pressed', String(guided));
    byId('free-mode').setAttribute('aria-pressed', String(!guided));
    byId('practice-description').textContent = guided ? 'Linux Workstation Preparation and Troubleshooting. Complete tasks in the terminal, then check your saved work.' : 'Free Practice uses the same files, account, packages, network, and command history. Return to Guided Practice at any time.';
    if (!guided || !run) { rendered = ''; return; }
    const available = profileStages(state), index = available.findIndex(stage => stage.id === run.stage), current = available[index];
    const key = state.distribution + ':' + run.workspace + ':' + run.stage;
    // Keep expanded hints and keyboard focus stable when commands refresh the shell.
    if (rendered !== key) {
      rendered = key;
      selector.replaceChildren();
      for (const [i, stage] of available.entries()) {
        const option = document.createElement('option'); option.value = stage.id; option.textContent = `${state.distribution === 'fedora' ? 12 : i + 1}. ${stage.title}`; selector.append(option);
      }
      selector.value = run.stage;
      byId('guided-title').textContent = current.title;
      byId('guided-concept').textContent = current.concept;
      byId('guided-workspace').textContent = run.workspace;
      const tasks = byId('guided-tasks'); tasks.replaceChildren();
      for (const task of current.tasks) { const item = document.createElement('li'); item.textContent = stageText(task, run); tasks.append(item); }
      byId('guided-hint').textContent = current.hint;
      byId('guided-example').textContent = stageText(current.example, run);
      byId('guided-hint-details').open = false; byId('guided-example-details').open = false;
      feedback.replaceChildren();
    }
    for (const option of selector.options) {
      const stage = available.find(stage => stage.id === option.value), number = state.distribution === 'fedora' ? 12 : available.indexOf(stage) + 1;
      option.textContent = `${number}. ${stage.title}${run.completed.includes(stage.id) ? ' (verified)' : ''}`;
    }
    const completed = available.filter(stage => run.completed.includes(stage.id)).length;
    const meter = byId('guided-progress'); meter.max = available.length; meter.value = completed;
    const progressText = `${state.distribution === 'fedora' ? 'Fedora extension' : 'Mint workstation assignment'}: ${completed} of ${available.length} stages verified.`;
    if (byId('guided-progress-text').textContent !== progressText) byId('guided-progress-text').textContent = progressText;
    byId('guided-stage-status').textContent = run.completed.includes(run.stage) ? 'Previously verified. Check again after changing related work.' : 'Ready to check your work.';
    byId('previous-stage').disabled = index <= 0;
    byId('next-stage').disabled = index >= available.length - 1;
    byId('fedora-extension').hidden = state.distribution === 'fedora';
    byId('fedora-separation').hidden = state.distribution !== 'fedora';
    for (const id of ['new-assignment', 'check-guided']) byId(id).disabled = activeEditor;
  }
  function choose(id) { const run = guidedState(getState()).run; run.stage = id; render(); save(); }
  function start() {
    const state = getState(), progress = guidedState(state);
    try { if (!progress.run) newRun(state); progress.mode = 'guided'; render(); save(); }
    catch (error) { byId('practice-description').textContent = error.message; }
  }
  byId('guided-mode').addEventListener('click', start);
  byId('free-mode').addEventListener('click', () => { guidedState(getState()).mode = 'free'; render(); save(); });
  selector.addEventListener('change', () => choose(selector.value));
  for (const [id, offset] of [['previous-stage', -1], ['next-stage', 1]]) byId(id).addEventListener('click', () => {
    const state = getState(), available = profileStages(state), index = available.findIndex(stage => stage.id === guidedState(state).run.stage);
    if (available[index + offset]) choose(available[index + offset].id);
  });
  byId('check-guided').addEventListener('click', () => { const state = getState(), result = checkStage(state, guidedState(state).run.stage); render(); message(result); save(); });
  const dialog = byId('new-assignment-dialog');
  byId('new-assignment').addEventListener('click', () => dialog.showModal());
  byId('cancel-assignment').addEventListener('click', () => dialog.close());
  byId('confirm-assignment').addEventListener('click', () => {
    try { newRun(getState()); render(); save(); dialog.close(); }
    catch (error) { byId('new-assignment-error').textContent = error.message; }
  });
  dialog.addEventListener('close', () => byId('new-assignment').focus());
  byId('fedora-extension').addEventListener('click', () => { switchFedora(); start(); });
  return {render, editorVisibility(active) { activeEditor = active; render(); byId('fedora-extension').disabled = active; }};
}
