// Browser progress records only a run folder and student-confirmed checkpoints.
const panel = document.getElementById('cmd-lab-progress');
if (panel) {
  const article = panel.closest('.hub-article');
  const storageKey = 'student-hub:windows-command-lab:v1';
  const checkpoints = [...article.querySelectorAll('[data-cmd-checkpoint]')];
  const commands = [...article.querySelectorAll('pre > code.language-bat')]
    .map(node => ({ node, template: node.textContent }));
  const folderLabels = [...article.querySelectorAll('[data-cmd-folder]')];
  const live = panel.querySelector('[role="status"]');
  const meter = panel.querySelector('progress');
  const saveNote = panel.querySelector('[data-cmd-save-note]');
  let storageAvailable = true;

  function freshState() {
    const suffix = globalThis.crypto?.randomUUID?.().split('-')[0]
      || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return { version: 1, folder: `GuidedLab-${suffix}`, completed: [] };
  }

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (value?.version === 1 && /^GuidedLab-[a-z0-9]{6,24}$/.test(value.folder)
          && Array.isArray(value.completed)) {
        const allowed = new Set(checkpoints.map(input => input.dataset.cmdCheckpoint));
        return { version: 1, folder: value.folder,
          completed: [...new Set(value.completed.filter(id => allowed.has(id)))] };
      }
    } catch { /* Corrupt or unavailable storage must not block the lab. */ }
    return freshState();
  }

  let state = readState();
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; }
    saveNote.hidden = storageAvailable;
  }

  function render(message = '') {
    for (const { node, template } of commands)
      node.textContent = template.replaceAll('GuidedLab-01', state.folder);
    for (const node of folderLabels) node.textContent = state.folder;
    for (const input of checkpoints)
      input.checked = state.completed.includes(input.dataset.cmdCheckpoint);
    const count = state.completed.length;
    meter.value = count;
    live.textContent = message || (count === checkpoints.length
      ? 'Lab complete: all 7 stages confirmed by you. Compare your results with the final review.'
      : `${count} of 7 stages confirmed by you.`);
    article.querySelector('[data-cmd-completion]').textContent = count === checkpoints.length
      ? 'Lab complete: you confirmed all 7 stages. You can repeat with a new run folder.'
      : `${count} of 7 stages confirmed. Return to any unfinished stage when ready.`;
    save();
  }

  for (const input of checkpoints) input.addEventListener('change', () => {
    state.completed = checkpoints.filter(input => input.checked)
      .map(input => input.dataset.cmdCheckpoint);
    render();
  });

  const reset = panel.querySelector('[data-cmd-restart]');
  reset.hidden = false;
  reset.addEventListener('click', () => {
    state = freshState();
    article.querySelectorAll('details').forEach(details => { details.open = false; });
    article.querySelectorAll('.cmd-lab-copy-bar [role="status"]').forEach(node => { node.textContent = ''; });
    render('New run ready: 0 of 7 stages confirmed. Use the new folder name in Stage 3. Your Windows files were not changed.');
    panel.scrollIntoView({ block: 'start' });
  });

  for (const [index, { node }] of commands.entries()) {
    const pre = node.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'cmd-lab-code';
    const bar = document.createElement('div');
    bar.className = 'cmd-lab-copy-bar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cmd-lab-button';
    button.textContent = 'Copy command';
    button.setAttribute('aria-label', `Copy command ${index + 1}`);
    const feedback = document.createElement('span');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-atomic', 'true');
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `Command ${index + 1}; scroll horizontally to read the full line`);
    pre.before(wrapper);
    bar.append(button, feedback);
    wrapper.append(bar, pre);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(node.textContent.trim());
        feedback.textContent = 'Copied. Paste into CMD, then press Enter.';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        feedback.textContent = 'Command selected. Press Ctrl+C, or use your device’s Copy action.';
      }
    });
  }
  render();
}
