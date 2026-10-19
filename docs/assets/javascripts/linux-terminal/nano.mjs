import {LinuxError} from './filesystem.mjs';

// A buffer references the existing VFS. Merely opening a new name never writes a file.
export class NanoSession {
  constructor(fs, filename = '') {
    this.fs = fs; this.filename = filename; this.path = null; this.value = ''; this.original = '';
    if (filename) {
      this.path = fs.resolve(filename, {missingLeaf: true});
      const node = fs.nodes[this.path];
      if (node) this.value = fs.read(this.path);
    }
    this.original = this.value;
  }
  get dirty() { return this.value !== this.original; }
  update(value) { this.value = value; }
  save(filename = this.filename) {
    if (!filename.trim()) throw new LinuxError('No filename specified');
    const expanded = filename === '~' ? this.fs.state.user.home : filename.startsWith('~/') ? this.fs.state.user.home + filename.slice(1) : filename;
    // Nano normally terminates a nonempty final line when writing a text file.
    const content = this.value && !this.value.endsWith('\n') ? this.value + '\n' : this.value;
    const path = this.fs.write(expanded, content);
    this.path = path; this.filename = filename; this.value = content; this.original = content;
    return content ? content.split('\n').length - 1 : 0;
  }
}

export function mountNano(root, {onClose, onSave, onVisibility}) {
  const text = root.querySelector('#nano-buffer'), file = root.querySelector('#nano-filename');
  const modified = root.querySelector('#nano-modified'), message = root.querySelector('#nano-status');
  const writeForm = root.querySelector('#nano-write-form'), writeName = root.querySelector('#nano-write-name');
  const exitPrompt = root.querySelector('#nano-exit-prompt'), help = root.querySelector('#nano-help');
  let session = null, mode = 'edit', exitAfterSave = false, selection = [0, 0];
  const buttons = root.querySelector('#nano-shortcuts');
  function focusText() { text.focus({preventScroll: true}); text.setSelectionRange(...selection); }
  function render(focus = true) {
    file.textContent = session.filename || '[New Buffer]'; modified.textContent = session.dirty ? 'Modified' : '';
    writeForm.hidden = mode !== 'write'; exitPrompt.hidden = mode !== 'exit'; help.hidden = mode !== 'help';
    text.hidden = mode === 'help'; text.readOnly = mode !== 'edit'; buttons.hidden = mode !== 'edit';
    if (focus) {
      if (mode === 'write') { writeName.focus(); writeName.setSelectionRange(writeName.value.length, writeName.value.length); }
      else if (mode === 'exit') root.querySelector('#nano-save-exit').focus();
      else if (mode === 'help') root.querySelector('#nano-return').focus();
      else focusText();
    }
  }
  function remember() { selection = [text.selectionStart, text.selectionEnd]; }
  function close() {
    session = null; root.hidden = true; onVisibility(false); onClose();
  }
  function cancelPrompt() { mode = 'edit'; exitAfterSave = false; message.textContent = 'Cancelled. Buffer retained.'; render(); }
  function writeOut(exit = false) {
    remember(); exitAfterSave = exit; mode = 'write'; writeName.value = session.filename;
    message.textContent = 'Confirm the filename with Enter, or cancel with Ctrl+C.'; render();
  }
  function exit() {
    remember();
    if (!session.dirty) close();
    else { mode = 'exit'; message.textContent = 'Save modified buffer?'; render(); }
  }
  function showHelp() { remember(); mode = 'help'; render(); }
  function position() {
    if (!session) return;
    const before = text.value.slice(0, text.selectionStart), lines = before.split('\n');
    root.querySelector('#nano-position').textContent = `Line ${lines.length}, column ${lines.at(-1).length + 1}`;
  }
  text.addEventListener('input', () => { session.update(text.value); modified.textContent = session.dirty ? 'Modified' : ''; position(); });
  for (const event of ['keyup', 'click']) text.addEventListener(event, position);
  root.querySelector('#nano-write').addEventListener('click', () => writeOut());
  root.querySelector('#nano-exit').addEventListener('click', exit);
  root.querySelector('#nano-show-help').addEventListener('click', showHelp);
  root.querySelector('#nano-return').addEventListener('click', () => { mode = 'edit'; render(); });
  root.querySelector('#nano-cancel-save').addEventListener('click', cancelPrompt);
  root.querySelector('#nano-cancel-exit').addEventListener('click', cancelPrompt);
  root.querySelector('#nano-discard').addEventListener('click', close);
  root.querySelector('#nano-save-exit').addEventListener('click', () => writeOut(true));
  writeForm.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const lines = session.save(writeName.value);
      text.value = session.value;
      selection = selection.map(value => Math.min(value, text.value.length));
      const saved = onSave();
      message.textContent = `Wrote ${lines} line${lines === 1 ? '' : 's'}.${saved ? '' : ' Browser saving is unavailable; keep this page open.'}`;
      if (exitAfterSave) close();
      else { mode = 'edit'; render(); }
    } catch (error) {
      if (!(error instanceof LinuxError)) throw error;
      message.textContent = `Error writing file: ${error.message}. Buffer retained.`; render();
    }
  });
  root.addEventListener('keydown', event => {
    if (!session || event.isComposing) return;
    const key = event.key.toLowerCase();
    if (mode === 'write') {
      if ((event.ctrlKey && key === 'c') || key === 'escape') { event.preventDefault(); cancelPrompt(); }
      else if (event.ctrlKey && ['o', 'x', 'g'].includes(key)) event.preventDefault();
    } else if (mode === 'exit') {
      if (!event.ctrlKey && key === 'y') { event.preventDefault(); writeOut(true); }
      else if (!event.ctrlKey && key === 'n') { event.preventDefault(); close(); }
      else if (key === 'escape' || (event.ctrlKey && key === 'c')) { event.preventDefault(); cancelPrompt(); }
    } else if (mode === 'help') {
      if (key === 'escape' || (event.ctrlKey && ['x', 'g'].includes(key))) { event.preventDefault(); mode = 'edit'; render(); }
    } else if (event.ctrlKey && ['o', 'x', 'g'].includes(key)) {
      event.preventDefault();
      if (key === 'o') writeOut(); else if (key === 'x') exit(); else showHelp();
    }
  });
  window.addEventListener('beforeunload', event => {
    if (session?.dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  return {
    open(buffer) {
      session = buffer; mode = 'edit'; exitAfterSave = false; selection = [0, 0];
      text.value = session.value; root.hidden = false;
      message.textContent = session.path && session.fs.nodes[session.path] ? 'File opened.' : 'New buffer. Use Write Out to create the file.';
      root.querySelector('#nano-position').textContent = 'Line 1, column 1';
      onVisibility(true); render();
    },
    get active() { return session !== null; }
  };
}
