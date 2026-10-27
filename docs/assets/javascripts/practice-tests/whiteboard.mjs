import { WHITEBOARD_TEXT_LIMIT, WHITEBOARD_MIN_SIZE, constrainWhiteboardBounds } from './whiteboard-state.mjs';

// The adapter receives only this attempt's tool state, never answers or scoring.
export function mountWhiteboard({ sessionId, state, container, toolbarMount, panelMount, persist }) {
  const doc = container.ownerDocument, win = doc.defaultView;
  const cleanup = [], id = `whiteboard-${sessionId}`;
  let destroyed = false, drag = null, automaticDock = false, docked = false;
  const element = (tag, attributes = {}, text = '') => {
    const item = doc.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, value);
    item.textContent = text;
    return item;
  };
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  };
  const button = (label, text = label, className = '') => element('button', { type: 'button', 'aria-label': label, title: label, class: className }, text);
  const toggle = button('Whiteboard');
  toggle.setAttribute('aria-controls', id); toggle.setAttribute('aria-expanded', 'false');
  const panel = element('section', { id, class: 'exam-whiteboard', role: 'region', 'aria-labelledby': `${id}-title` });
  const header = element('div', { class: 'whiteboard-header' });
  const move = button('Move Whiteboard', 'Whiteboard', 'whiteboard-move');
  move.id = `${id}-title`; move.setAttribute('aria-describedby', `${id}-move-help`);
  const minimize = button('Minimize Whiteboard', '−');
  const close = button('Close Whiteboard', '×');
  header.append(move, minimize, close);
  const body = element('div', { class: 'whiteboard-body' });
  const label = element('label', { for: `${id}-notes` }, 'Exam notes');
  const editor = element('textarea', {
    id: `${id}-notes`, class: 'whiteboard-notes', maxlength: String(WHITEBOARD_TEXT_LIMIT),
    spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', wrap: 'off', 'aria-describedby': `${id}-count ${id}-save`
  });
  editor.value = state.text;
  const count = element('p', { id: `${id}-count`, class: 'whiteboard-count' });
  const controls = element('div', { class: 'whiteboard-controls' });
  const clear = button('Clear Notes');
  const dock = button('Dock Whiteboard', 'Dock');
  const resize = button('Resize Whiteboard', 'Resize', 'whiteboard-resize');
  resize.setAttribute('aria-describedby', `${id}-resize-help`);
  controls.append(clear, dock, resize);
  const saved = element('p', { id: `${id}-save`, class: 'whiteboard-save', role: 'status' });
  const limitNotice = element('p', { class: 'whiteboard-limit', role: 'status' });
  const moveHelp = element('p', { id: `${id}-move-help`, class: 'whiteboard-sr-only' }, 'Drag the title or use arrow keys to move the window. Dock keeps notes in the page layout.');
  const resizeHelp = element('p', { id: `${id}-resize-help`, class: 'whiteboard-sr-only' }, 'Drag Resize or use arrow keys to change the window dimensions.');
  body.append(label, editor, count, controls, saved, limitNotice, moveHelp, resizeHelp);
  panel.append(header, body);
  const confirmation = element('dialog', { class: 'whiteboard-confirmation', 'aria-labelledby': `${id}-clear-title`, 'aria-describedby': `${id}-clear-text` });
  const cancelClear = button('Cancel'), confirmClear = button('Clear Notes');
  confirmClear.className = 'primary';
  const confirmationButtons = element('div', { class: 'inline-controls' });
  confirmationButtons.append(cancelClear, confirmClear);
  confirmation.append(element('h2', { id: `${id}-clear-title` }, 'Clear whiteboard notes?'),
    element('p', { id: `${id}-clear-text` }, 'This erases the notes for this test. Your answers and flags are preserved.'), confirmationButtons);
  toolbarMount.append(toggle); panelMount.append(panel, confirmation);
  panelMount.classList.add('whiteboard-mount');

  function setSaveStatus(success) {
    const message = success ? 'Notes saved in this browser.' : 'Notes could not be saved. Browser storage is unavailable or full. Keep this tab open; refreshing may lose notes.';
    if (saved.textContent !== message) saved.textContent = message;
    saved.dataset.failed = String(!success);
  }
  function save() {
    if (destroyed) return;
    try { setSaveStatus(persist() !== false); } catch { setSaveStatus(false); }
  }
  function updateCount() {
    count.textContent = `${state.text.length.toLocaleString('en-US')} / 200,000 characters`;
    clear.disabled = !state.text.length;
  }
  function area() {
    return {
      width: Math.min(container.clientWidth, doc.documentElement.clientWidth - 16),
      height: Math.min(container.clientHeight, (win.visualViewport?.height || win.innerHeight) - 24)
    };
  }
  function draw() {
    const available = area();
    automaticDock = win.matchMedia('(max-width: 850px)').matches || available.width < WHITEBOARD_MIN_SIZE.width || available.height < WHITEBOARD_MIN_SIZE.height;
    docked = automaticDock || state.docked;
    panelMount.classList.toggle('whiteboard-floating', !docked);
    panelMount.classList.toggle('whiteboard-docked', docked);
    panelMount.hidden = !state.visible;
    toggle.setAttribute('aria-expanded', String(state.visible));
    panel.dataset.docked = String(docked); panel.dataset.minimized = String(state.minimized);
    body.hidden = state.minimized;
    minimize.textContent = state.minimized ? '+' : '−';
    minimize.setAttribute('aria-label', state.minimized ? 'Restore Whiteboard' : 'Minimize Whiteboard');
    minimize.title = minimize.getAttribute('aria-label');
    move.setAttribute('aria-label', docked ? 'Whiteboard window' : 'Move Whiteboard');
    move.setAttribute('aria-disabled', String(docked));
    dock.textContent = state.docked ? 'Float' : 'Dock';
    dock.setAttribute('aria-label', state.docked ? 'Float Whiteboard' : 'Dock Whiteboard');
    dock.title = dock.getAttribute('aria-label'); dock.disabled = automaticDock;
    resize.hidden = docked;
    if (!docked) {
      state.bounds = constrainWhiteboardBounds(state.bounds, available);
      const { x, y, width, height } = state.bounds;
      Object.assign(panel.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: state.minimized ? 'auto' : `${height}px` });
    } else {
      Object.assign(panel.style, { left: '', top: '', width: '', height: state.minimized ? 'auto' : '380px' });
    }
  }
  function reveal() {
    draw(); save();
    panel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    (state.minimized ? minimize : editor).focus({ preventScroll: true });
  }
  function hide() {
    state.visible = false; draw(); save(); toggle.focus({ preventScroll: true });
  }
  listen(toggle, 'click', () => { if (state.visible) hide(); else { state.visible = true; reveal(); } });
  listen(close, 'click', hide);
  listen(minimize, 'click', () => {
    state.minimized = !state.minimized; draw(); save();
    if (!state.minimized) editor.focus({ preventScroll: true });
  });
  listen(dock, 'click', () => { state.docked = !state.docked; reveal(); });
  listen(panel, 'keydown', event => {
    if (event.key === 'Escape' && !confirmation.open) { event.preventDefault(); event.stopPropagation(); hide(); }
  });
  const limitMessage = () => { limitNotice.textContent = 'The 200,000-character note limit has been reached. Remove text to add more.'; };
  listen(editor, 'input', () => {
    if (editor.value.length > WHITEBOARD_TEXT_LIMIT) editor.value = editor.value.slice(0, WHITEBOARD_TEXT_LIMIT);
    state.text = editor.value;
    if (state.text.length < WHITEBOARD_TEXT_LIMIT) limitNotice.textContent = '';
    else limitMessage();
    updateCount(); save();
  });
  listen(editor, 'beforeinput', event => {
    if (event.data && editor.value.length - (editor.selectionEnd - editor.selectionStart) + event.data.length > WHITEBOARD_TEXT_LIMIT) limitMessage();
  });
  // Native textarea clipboard behavior is retained except for over-limit pastes.
  listen(editor, 'paste', event => {
    if (!event.clipboardData) return;
    const text = event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n');
    const room = WHITEBOARD_TEXT_LIMIT - (editor.value.length - (editor.selectionEnd - editor.selectionStart));
    if (text.length <= room) return;
    event.preventDefault();
    editor.setRangeText(text.slice(0, room), editor.selectionStart, editor.selectionEnd, 'end');
    editor.dispatchEvent(new win.Event('input', { bubbles: true })); limitMessage();
  });
  listen(clear, 'click', () => { confirmation.showModal(); cancelClear.focus(); });
  listen(cancelClear, 'click', () => confirmation.close());
  listen(confirmation, 'keydown', event => {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && doc.activeElement === cancelClear) { event.preventDefault(); confirmClear.focus(); }
    else if (!event.shiftKey && doc.activeElement === confirmClear) { event.preventDefault(); cancelClear.focus(); }
  });
  listen(confirmClear, 'click', () => {
    state.text = ''; editor.value = ''; limitNotice.textContent = ''; updateCount(); save();
    confirmation.close(); editor.focus({ preventScroll: true });
  });
  listen(confirmation, 'close', () => { if (!destroyed && clear.isConnected && !clear.disabled) clear.focus({ preventScroll: true }); });

  function finishDrag() {
    if (!drag) return;
    const { target, pointerId } = drag; drag = null;
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    panel.classList.remove('whiteboard-adjusting'); save();
  }
  for (const [target, kind] of [[move, 'move'], [resize, 'resize']]) {
    listen(target, 'pointerdown', event => {
      if (docked || !event.isPrimary || event.button !== 0) return;
      event.preventDefault(); event.stopPropagation(); target.focus({ preventScroll: true });
      drag = { kind, target, pointerId: event.pointerId, x: event.clientX, y: event.clientY, bounds: { ...state.bounds } };
      target.setPointerCapture(event.pointerId); panel.classList.add('whiteboard-adjusting');
    });
    listen(target, 'pointermove', event => {
      if (!drag || drag.target !== target || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      state.bounds = constrainWhiteboardBounds({ ...drag.bounds,
        ...(kind === 'move' ? { x: drag.bounds.x + dx, y: drag.bounds.y + dy } : { width: Math.max(1, drag.bounds.width + dx), height: Math.max(1, drag.bounds.height + dy) })
      }, area());
      draw();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(target, type, finishDrag);
    listen(target, 'keydown', event => {
      const deltas = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
      if (docked || !deltas[event.key]) return;
      event.preventDefault(); event.stopPropagation();
      const [dx, dy] = deltas[event.key], b = state.bounds;
      state.bounds = constrainWhiteboardBounds({ ...b,
        ...(kind === 'move' ? { x: b.x + dx, y: b.y + dy } : { width: b.width + dx, height: b.height + dy })
      }, area());
      draw(); save();
    });
  }
  function reflow() {
    if (destroyed || !state.visible) return;
    const previous = JSON.stringify(state.bounds);
    draw();
    if (previous !== JSON.stringify(state.bounds)) save();
  }
  const observer = new win.ResizeObserver(reflow);
  observer.observe(container);
  listen(win, 'resize', reflow);
  if (win.visualViewport) listen(win.visualViewport, 'resize', reflow);
  // Every edit is already synchronous; flush only an unfinished pointer gesture.
  listen(win, 'pagehide', () => { if (drag) save(); });
  updateCount(); draw();
  if (state.visible) save();
  return {
    sessionId, setSaveStatus,
    destroy() {
      destroyed = true; drag = null; observer.disconnect();
      for (const dispose of cleanup) dispose();
      if (confirmation.open) confirmation.close();
      toggle.remove(); panel.remove(); confirmation.remove();
      panelMount.classList.remove('whiteboard-mount', 'whiteboard-floating', 'whiteboard-docked');
      panelMount.hidden = false;
    }
  };
}
