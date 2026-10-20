import {Shell, complete} from './shell.mjs';
import {ProfileStore, PROFILE_KEY, profiles} from './state.mjs';
import {mountNano} from './nano.mjs';

const form = document.getElementById('terminal-form');
if (form) {
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('command');
  const prompt = document.getElementById('prompt');
  const status = document.getElementById('save-status');
  const manualDialog = document.getElementById('manual-dialog');
  const resetDialog = document.getElementById('reset-dialog');
  const manualContent = document.getElementById('manual-content');
  const profileSelect = document.getElementById('workstation-profile');
  const store = new ProfileStore({getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value)});
  let shell = new Shell(store.load()), historyIndex = shell.state.history.length, draft = '';

  function entry(command, text = '') {
    const block = document.createElement('div'); block.className = 'terminal-entry';
    if (command !== null) {
      const line = document.createElement('pre'); line.className = 'transcript-command'; line.textContent = command; block.append(line);
    }
    if (text) {
      const result = document.createElement('pre');
      result.textContent = text.length > 50000 ? text.slice(0, 50000) + '\n[Display limited to 50,000 characters; file content is unchanged.]' : text;
      block.append(result);
    }
    output.append(block);
    while (output.children.length > 120) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  const editor = mountNano(document.getElementById('nano-panel'), {
    onClose: () => { refresh(); focusInput(); }, onSave: () => refresh(),
    onVisibility: active => {
      output.hidden = active; form.hidden = active; document.getElementById('terminal-hint').hidden = active;
      document.getElementById('reset-workstation').disabled = active; profileSelect.disabled = active;
    }
  });
  function refresh(save = true) {
    prompt.textContent = shell.prompt();
    profileSelect.value = store.profile;
    const description = `${profiles[store.profile]}: ${store.profile === 'mint' ? 'APT' : 'DNF'} package management. Each profile keeps its own files, network settings and package inventory.`;
    const profileDescription = document.getElementById('profile-description');
    if (profileDescription.textContent !== description) profileDescription.textContent = description;
    document.getElementById('reset-description').textContent = `Reset ${profiles[store.profile]}? This removes this profile’s simulated files, changes, and command history. The other profile and other Student Hub progress stay saved.`;
    const saved = save ? store.save(shell.state) : true;
    status.textContent = store.message || 'Files and command history will be saved after each command.';
    historyIndex = shell.state.history.length;
    return saved;
  }
  function focusInput() { input.focus({preventScroll: true}); }
  function showManual(name, content, monitor = false) {
    document.getElementById('manual-title').textContent = monitor ? 'top: simulated process monitor' : `man ${name}`;
    manualDialog.dataset.view = monitor ? 'top' : 'manual';
    manualContent.textContent = content;
    manualDialog.showModal(); manualContent.scrollTop = 0; manualContent.focus();
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const line = input.value;
    if (!line.trim()) return;
    const oldPrompt = shell.prompt();
    const result = shell.execute(line);
    input.value = ''; draft = '';
    if (result.action === 'clear') output.replaceChildren();
    else {
      entry(`${oldPrompt} ${line}`, ['manual', 'top'].includes(result.action) ? '' : result.stdout + result.stderr);
      if (result.action === 'manual') showManual(result.manual, result.stdout);
      if (result.action === 'top') showManual('top', result.stdout, true);
      if (result.action === 'nano') editor.open(result.editor);
    }
    refresh();
    if (!manualDialog.open && !editor.active) focusInput();
  });
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if ((event.ctrlKey && event.key.toLowerCase() === 'c') && input.selectionStart === input.selectionEnd) {
      event.preventDefault(); entry(`${shell.prompt()} ${input.value}^C`);
      input.value = ''; draft = ''; shell.state.lastStatus = 130; refresh();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); output.replaceChildren();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === shell.state.history.length) draft = input.value;
      historyIndex = Math.max(0, Math.min(shell.state.history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = shell.state.history[historyIndex] ?? draft;
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.key === 'Tab' && !event.shiftKey) {
      const result = complete(shell, input.value, input.selectionStart);
      if (result.choices.length) {
        event.preventDefault(); input.value = result.value;
        input.setSelectionRange(input.value.length, input.value.length);
        if (result.choices.length > 1) entry(null, result.choices.join('  '));
      }
    }
  });
  input.addEventListener('input', () => { historyIndex = shell.state.history.length; draft = input.value; });
  document.getElementById('close-manual').addEventListener('click', () => manualDialog.close());
  manualDialog.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'q' || (event.ctrlKey && event.key.toLowerCase() === 'c')) {
      event.preventDefault(); manualDialog.close();
    }
  });
  manualDialog.addEventListener('close', focusInput);
  document.getElementById('reset-workstation').addEventListener('click', () => resetDialog.showModal());
  document.getElementById('cancel-reset').addEventListener('click', () => resetDialog.close());
  document.getElementById('confirm-reset').addEventListener('click', () => {
    shell = new Shell(store.reset()); input.value = ''; draft = ''; output.replaceChildren();
    entry(null, 'Original workstation restored. Type help to begin.'); refresh(false);
    resetDialog.close(); focusInput();
  });
  resetDialog.addEventListener('close', focusInput);

  profileSelect.addEventListener('change', () => {
    if (editor.active) { profileSelect.value = store.profile; return; }
    shell = new Shell(store.switch(profileSelect.value, shell.state));
    input.value = ''; draft = ''; output.replaceChildren();
    entry(null, `${profiles[store.profile]} practice workstation\nSigned in as ${shell.state.user.name} on ${shell.state.hostname}. Type help to begin.`);
    refresh(false); focusInput();
  });

  // Independent tabs must not silently overwrite one another's workstation.
  window.addEventListener('storage', event => {
    if ([store.current.key, PROFILE_KEY].includes(event.key)) {
      status.textContent = 'This workstation changed in another tab. Reload to use that saved version, or continue here to save this tab’s version.';
    }
  });

  const themeButton = document.getElementById('theme-toggle');
  const themeKey = 'student-hub:linux-terminal:theme';
  function theme(scheme) {
    document.body.dataset.mdColorScheme = scheme;
    themeButton.setAttribute('aria-pressed', String(scheme === 'slate'));
    themeButton.textContent = 'Dark theme';
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem(themeKey); } catch { /* Theme still works without storage. */ }
  theme(['default', 'slate'].includes(savedTheme) ? savedTheme : matchMedia('(prefers-color-scheme: dark)').matches ? 'slate' : 'default');
  themeButton.addEventListener('click', () => {
    const scheme = document.body.dataset.mdColorScheme === 'slate' ? 'default' : 'slate'; theme(scheme);
    try { localStorage.setItem(themeKey, scheme); } catch { /* Keep the selected theme for this visit. */ }
  });
  entry(null, `${profiles[store.profile]} practice workstation\nSigned in as ${shell.state.user.name} on ${shell.state.hostname}. Type help or man ls.`);
  refresh(false); focusInput();
}
