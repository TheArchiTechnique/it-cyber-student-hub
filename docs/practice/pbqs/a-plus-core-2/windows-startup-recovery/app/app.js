(function () {
  'use strict';
  const M = window.StartupRecovery, $ = id => document.getElementById(id);
  let state = M.initial(), historyIndex = 0, draft = '';
  try { const saved = localStorage.getItem(M.KEY); if (saved) state = M.restore(JSON.parse(saved)); } catch (_) { /* Storage is optional. */ }
  const pc = () => state.pcs[state.selected];
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function save() { try { localStorage.setItem(M.KEY, JSON.stringify(state)); $('save-status').textContent = 'Progress saved in this browser.'; } catch (_) { $('save-status').textContent = 'Browser storage is unavailable. You can continue in this session.'; } }
  function button(text, action, cls = '') { const n = el('button', cls, text); n.type = 'button'; n.disabled = state.submitted; n.onclick = () => { if (state.submitted) return; action(); }; return n; }
  function go(screen) {
    const p = pc(); M.navigate(p, screen); renderScreen(); renderCards(); save(); focusScreen();
    if (screen === 'repairRunning') setTimeout(() => {
      if (p.screen !== 'repairRunning' || state.submitted || !state.pcs.includes(p)) return;
      M.navigate(p, 'repair'); if (p === pc()) { renderScreen(); focusScreen(); } save();
    }, 850);
  }
  function focusScreen() { if (pc().screen === 'terminal' && !state.submitted) $('command').focus(); else $('screen').focus(); }
  function reboot(safe = false) { M.restart(pc(), safe); renderScreen(); renderCards(); save(); focusScreen(); }
  function actions(parent, ...buttons) { const n = el('div', 'win-actions'); n.append(...buttons); parent.append(n); }
  function win(title, back, cls = '') {
    const n = el('div', 'winre ' + cls), head = el('div', 'win-top');
    if (back) { const b = button('←', () => go(back), 'back'); b.setAttribute('aria-label', 'Back to ' + ({choose:'Choose an option', troubleshoot:'Troubleshoot', advanced:'Advanced options', repair:'Startup Repair'}[back] || back)); head.append(b); }
    head.append(el('h2', '', title)); n.append(head); return n;
  }
  function tile(parent, title, description, icon, action) {
    const b = button('', action, 'win-option'), glyph = el('span', 'win-icon'); glyph.setAttribute('aria-hidden', 'true');
    const drawings = {
      '→': '<path d="M5 16h22m-8-8 8 8-8 8"/>',
      'USB': '<rect x="9" y="13" width="14" height="15" rx="2"/><path d="M12 13V4h8v9M15 7v3m3-3v3"/>',
      '>_': '<path d="m5 9 7 7-7 7m11 0h11"/>',
      'power': '<path d="M16 3v14M9 7a12 12 0 1 0 14 0"/>',
      'tools': '<path d="m5 27 16-16m-2-6a8 8 0 0 0 8 10l-6-6 3-6M5 4l6 6-4 4-5-7m15 14 7 7 4-4-7-7"/>',
      'settings': '<path d="M4 8h24M4 16h24M4 24h24"/><path d="M11 4v8m12 0v8M13 20v8"/>',
      'restore': '<path d="M6 11a12 12 0 1 1-1 10M6 3v8h8m2-3v9l6 4"/>',
      'device': '<rect x="3" y="5" width="26" height="19" rx="1"/><path d="M16 24v5M9 29h14"/>'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 32 32'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8'); svg.innerHTML = drawings[icon] || drawings.device; glyph.append(svg);
    const text = el('span'); text.append(el('strong', '', title), el('small', '', description)); b.append(glyph, text); parent.append(b);
  }
  function renderCards() {
    $('workstations').replaceChildren(...state.pcs.map((p, i) => {
      const b = el('button', 'workstation'); b.type = 'button'; b.setAttribute('aria-pressed', String(i === state.selected)); b.setAttribute('aria-controls', 'monitor'); b.dataset.pc = i;
      b.append(el('strong', '', `Computer ${p.id} · ${i === 0 ? 'Design office' : 'Workshop station'}`), el('small', '', p.verified ? 'Normal boot verified' : 'Recovery in progress'));
      b.onclick = () => { state.selected = i; draft = ''; render(); save(); $('workstations').querySelector(`[data-pc="${i}"]`).focus(); }; return b;
    }));
    $('progress').textContent = `${state.pcs.filter(p => p.verified).length} of 2 normal boots verified${state.submitted ? ' · Submitted' : ''}`;
  }
  function renderTerminal() {
    const p = pc(), n = el('div', 'win-terminal'), title = el('div', 'cmd-title'); title.append(el('span', '', 'Administrator: X:\\windows\\system32\\cmd.exe'), button('×', () => go('advanced'))); title.lastChild.setAttribute('aria-label', 'Close Command Prompt'); n.append(title);
    const output = el('div', 'cmd-scroll'); output.id = 'output'; output.setAttribute('role', 'log'); output.setAttribute('aria-label', 'Command Prompt output'); output.setAttribute('aria-live', 'polite'); output.setAttribute('aria-relevant', 'additions'); output.tabIndex = 0;
    output.append(el('pre', '', `Microsoft Windows [Version ${p.id === 'A' ? '10.0.26100' : '10.0.19045'}]\n(c) Microsoft Corporation. All rights reserved.\n`));
    for (const e of p.transcript) output.append(el('pre', '', `${e.prompt} ${e.command}\n${e.output}`));
    n.append(output);
    const form = el('form', 'cmd-input'); form.id = 'terminal-form'; form.autocomplete = 'off';
    const label = el('label', '', M.prompt(p)); label.htmlFor = 'command'; const input = el('input'); input.id = 'command'; input.name = 'command'; input.type = 'text'; input.maxLength = 256; input.spellcheck = false; input.autocapitalize = 'off'; input.setAttribute('aria-label', p.pending ? 'Respond to boot list prompt' : p.diskpart ? 'DiskPart command' : 'Windows recovery command'); input.setAttribute('aria-describedby', 'cmd-hint'); input.disabled = state.submitted;
    const run = el('button', '', 'Run'); run.type = 'submit'; run.disabled = state.submitted; form.append(label, input, run); n.append(form);
    const hint = el('p', 'cmd-hint', 'Type HELP or utility /? for syntax. Up / Down: command history. EXIT: close the current tool.'); hint.id = 'cmd-hint'; n.append(hint);
    form.onsubmit = event => {
      event.preventDefault(); if (state.submitted || !input.value.trim()) return;
      const command = input.value; M.execute(state, state.selected, command); draft = ''; renderScreen(); renderCards(); save(); focusScreen();
    };
    historyIndex = p.history.length;
    input.onkeydown = event => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); if (historyIndex === p.history.length) draft = input.value;
      historyIndex = Math.max(0, Math.min(p.history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = historyIndex === p.history.length ? draft : p.history[historyIndex];
    };
    return n;
  }
  function renderFirmware() {
    const p = pc(), n = el('div', 'firmware'); n.append(el('h2', '', p.id === 'A' ? 'UEFI Firmware Setup Utility' : 'BIOS Setup Utility'));
    const tabs = el('div', 'fw-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Firmware pages');
    for (const [id, title] of [['main', 'Main'], ['storage', 'Storage'], ['boot', 'Boot']]) { const b = button(title, () => { M.firmware(p, id); renderScreen(); save(); $('screen').querySelector(`[data-fw="${id}"]`).focus(); }); b.dataset.fw = id; b.setAttribute('aria-pressed', String(p.firmwareTab === id)); tabs.append(b); } n.append(tabs);
    if (p.firmwareTab !== 'boot') {
      const dl = el('dl'), pairs = p.firmwareTab === 'main' ? [['System', `Computer ${p.id}`], ['Installed OS', p.id === 'A' ? 'Windows 11 Pro' : 'Windows 10 Enterprise LTSC'], ['Firmware mode', p.mode], ['System memory', '16384 MB']] : [['Storage controller', p.id === 'A' ? 'NVMe' : 'SATA AHCI'], ['Port / device', p.id === 'A' ? 'NVMe 0: SSD-512' : 'SATA 0: SSD-256'], ['Device status', 'Detected'], ['Capacity', p.id === 'A' ? '512 GB' : '256 GB'], ['Self-test result', 'Passed']];
      for (const [k, v] of pairs) dl.append(el('dt', '', k), el('dd', '', v)); n.append(dl);
    } else {
      function select(id, labelText, choices, value, change) {
        const label = el('label', '', labelText); label.htmlFor = id; const s = el('select'); s.id = id; s.disabled = state.submitted;
        for (const [v, text] of choices) s.add(new Option(text, v)); s.value = value; s.onchange = () => { if (state.submitted) return; change(s.value); save(); }; n.append(label, s);
      }
      select('firmware-mode', 'Boot mode', [['UEFI', 'UEFI'], ['Legacy', 'Legacy / CSM']], p.mode, value => { p.mode = value; p.verified = false; });
      select('boot-order', 'Boot option #1', [['disk', p.id === 'A' ? 'Windows Boot Manager (SSD-512)' : 'SATA 0: SSD-256'], ['usb', 'USB device (recovery media removed for normal boot)'], ['network', 'Network / PXE']], p.order, value => { p.order = value; p.verified = false; });
      n.append(el('p', '', p.id === 'A' ? 'Windows Boot Manager firmware entry: present' : 'Internal disk is detected. Legacy BIOS uses the active MBR system partition.'));
    }
    n.append(el('p', '', 'Changes apply to this simulated computer. Save & Exit restarts with the current settings.'));
    actions(n, button('Save & Exit', () => reboot()), button('Boot recovery USB', () => go('choose'))); return n;
  }
  function renderScreen() {
    const p = pc(); let n;
    if (p.screen === 'terminal') n = renderTerminal();
    else if (p.screen === 'firmware') n = renderFirmware();
    else if (p.screen === 'boot') {
      n = el('div', 'boot-screen'); n.append(el('p', '', `Computer ${p.id}\n${p.id === 'A' ? 'UEFI' : 'Legacy BIOS'} startup`));
      n.append(el('p', 'boot-error', p.id === 'A' || p.order !== 'disk' || p.mode !== 'Legacy' ? 'Operating System not found' : 'Error loading operating system'));
      const cursor = el('span', 'cursor'); cursor.setAttribute('aria-hidden', 'true'); n.append(cursor);
      actions(n, button('Restart', () => reboot()), button('Firmware setup', () => go('firmware')), button('Boot recovery USB', () => go('choose')));
    } else if (p.screen === 'recovery') {
      n = win('Recovery', null, 'recovery-screen'); n.append(el('h3', '', 'Your PC/Device needs to be repaired'), el('p', '', 'The Boot Configuration Data for your PC is missing or contains errors.'), el('pre', '', `File: ${p.id === 'A' ? '\\EFI\\Microsoft\\Boot\\BCD' : '\\Boot\\BCD'}\nError code: 0xc000000f`), el('p', '', "You'll need to use recovery tools. If you don't have installation media, contact your PC administrator or PC/Device manufacturer."));
      actions(n, button('Enter · Try again', () => reboot()), button('Boot recovery USB', () => go('choose')), button('Firmware settings', () => go('firmware')));
    } else if (p.screen === 'choose') {
      n = win('Choose an option'); const opts = el('div', 'win-options');
      tile(opts, 'Continue', `Exit and continue to Windows ${p.id === 'A' ? '11' : '10'}`, '→', () => reboot());
      tile(opts, 'Use a device', 'Use a USB drive or recovery media', 'USB', () => go('device'));
      tile(opts, 'Troubleshoot', 'Reset your PC or see advanced options', 'tools', () => go('troubleshoot'));
      tile(opts, 'Turn off your PC', 'Power off this computer', 'power', () => go('off')); n.append(opts);
    } else if (p.screen === 'device') {
      n = win('Use a device', 'choose'); const opts = el('div', 'win-options'); tile(opts, 'Recovery USB', 'Windows recovery tools', 'USB', () => go('choose')); tile(opts, 'Internal drive', 'Start the installed operating system', '▣', () => reboot()); n.append(opts);
    } else if (p.screen === 'troubleshoot') {
      n = win('Troubleshoot', 'choose'); const opts = el('div', 'win-options'); tile(opts, 'Reset this PC', 'Choose to keep or remove your files, and then reinstall Windows', '↻', () => go('resetPC')); tile(opts, 'Advanced options', 'More recovery tools', '▤', () => go('advanced')); n.append(opts);
    } else if (p.screen === 'advanced') {
      n = win('Advanced options', 'troubleshoot'); const opts = el('div', 'win-options');
      tile(opts, 'Startup Repair', 'Fix problems that keep Windows from loading', 'tools', () => go('repairRunning'));
      tile(opts, 'Startup Settings', 'Change Windows startup behavior', 'settings', () => go('settings'));
      tile(opts, 'Command Prompt', 'Use the Command Prompt for advanced troubleshooting', '>_', () => go('terminal'));
      tile(opts, 'Uninstall Updates', 'Remove recently installed quality or feature updates', 'restore', () => go('updates'));
      if (p.id === 'A') tile(opts, 'UEFI Firmware Settings', "Change settings in your PC's UEFI firmware", '▣', () => go('firmwareConfirm'));
      tile(opts, 'System Restore', 'Use a restore point recorded on your PC to restore Windows', 'restore', () => go('restore')); n.append(opts);
    } else if (p.screen === 'firmwareConfirm') {
      n = win('UEFI Firmware Settings', 'advanced'); n.append(el('p', '', "Restart to change UEFI firmware settings.")); actions(n, button('Restart', () => go('firmware')));
    } else if (p.screen === 'repairRunning') {
      n = win('Startup Repair'); n.append(el('h3', '', 'Diagnosing your PC'), el('p', '', 'Checking disk and startup components...'));
    } else if (p.screen === 'repair') {
      n = win('Startup Repair', 'advanced');
      const fixed = M.ready(p);
      n.append(el('h3', '', fixed ? 'Startup Repair completed' : "Startup Repair couldn't repair your PC"), el('p', '', fixed ? 'No startup-file problems were detected. Restart to test Windows startup.' : 'Select Advanced options to try other options to repair your PC.'), el('p', '', `Log file: ${M.windows(p)}:\\Windows\\System32\\LogFiles\\Srt\\SrtTrail.txt`));
      actions(n, button('View diagnostic report', () => go('repairLog')), button('Advanced options', () => go('advanced')), button('Restart', () => reboot()));
    } else if (p.screen === 'repairLog') {
      n = win('Startup Repair · Diagnostic report', 'repair');
      n.append(el('pre', 'repair-log', M.ready(p) ? 'Startup Repair diagnosis and repair log\nDisk test: Completed successfully\nBoot-file test: Completed successfully\nRoot causes found: 0' : p.id === 'A' ? 'Startup Repair diagnosis and repair log\nDisk test: Completed successfully\nWindows directory: D:\\Windows\nDisk layout: GPT; EFI System Partition detected\nFirmware Windows Boot Manager entry: Present\nRoot cause: BCD store on EFI System Partition is missing.\nWindows Boot Manager application: Present.\nAutomatic repair could not locate a usable BCD store.\nAutomatic repair: Failed (error 0x490)' : 'Startup Repair diagnosis and repair log\nDisk test: Completed successfully\nWindows directory: C:\\Windows\nDisk layout: MBR; system partition active\nRoot cause: Boot code differs from expected Windows code.\nPartition boot sector damaged; BCD store missing.\nAutomatic repair: Failed (error 0x490)'));
      n.append(el('p', '', 'Report view shows the findings from this simulated Startup Repair run.'));
    } else if (p.screen === 'settings') {
      n = win('Startup Settings', 'advanced'); n.append(el('p', '', 'Restart to change Windows options, including:'), el('p', '', 'Enable debugging · Enable boot logging · Enable low-resolution video · Enable Safe Mode · Disable automatic restart on system failure'));
      actions(n, button('Restart', () => { if (M.ready(p) && p.mode === (p.id === 'A' ? 'UEFI' : 'Legacy') && p.order === 'disk') go('startupChoices'); else reboot(); }));
    } else if (p.screen === 'startupChoices') {
      n = win('Startup Settings', 'advanced'); n.append(el('p', '', 'Choose a startup option.')); actions(n, button('4 · Enable Safe Mode', () => reboot(true)), button('Enter · Start Windows normally', () => reboot()));
    } else if (p.screen === 'restore') {
      n = win('System Restore', 'advanced'); n.append(el('h3', '', 'No restore points have been created'), el('p', '', 'No restore points are available on this Windows installation. To use System Restore, a restore point must have been created previously. No changes were made.'));
    } else if (p.screen === 'updates') {
      n = win('Uninstall Updates', 'advanced'); const opts = el('div', 'win-options'); tile(opts, 'Uninstall latest quality update', 'Remove the latest quality update', 'restore', () => go('updateResult')); tile(opts, 'Uninstall latest feature update', 'Go back to the previous version', 'restore', () => go('featureResult')); n.append(opts);
    } else if (p.screen === 'updateResult' || p.screen === 'featureResult') {
      n = win('Uninstall Updates', 'updates'); n.append(el('h3', '', p.screen === 'updateResult' ? "We couldn't uninstall the latest quality update" : "You can't go back to the previous version"), el('p', '', p.screen === 'updateResult' ? 'No removable pending quality update was found in this recovery session. No changes were made.' : 'The files needed to return to a previous version are no longer available. No changes were made.'));
    } else if (p.screen === 'resetPC') {
      n = win('Reset this PC', 'troubleshoot'); n.append(el('p', '', 'Resetting reinstalls Windows and can remove applications or files. Your service request is to recover startup while preserving the existing installation. Reinstallation is outside this activity. No changes were made.'));
    } else if (p.screen === 'off') {
      n = el('div', 'boot-screen'); n.append(el('p', '', 'Computer is powered off.')); actions(n, button('Power on', () => reboot()));
    } else {
      n = el('div', 'desktop' + (p.screen === 'safe' ? ' safe-desktop' : '')); const logo = el('div', 'window-logo'); logo.setAttribute('aria-hidden', 'true'); for (let j = 0; j < 4; j++) logo.append(el('i')); n.append(logo, el('h2', '', p.screen === 'safe' ? 'Safe Mode' : `Windows ${p.id === 'A' ? '11' : '10'}`), el('p', '', p.screen === 'safe' ? 'Limited drivers and services. Restart normally to verify recovery.' : `Computer ${p.id} · Signed in to the training desktop`)); if (p.screen === 'safe') n.append(button('Restart normally', () => reboot())); n.append(el('div', 'taskbar', 'Start     Search     File Explorer                         Training user'));
    }
    $('screen').replaceChildren(n);
    if (p.screen === 'terminal') $('output').scrollTop = $('output').scrollHeight;
  }
  function renderResults() {
    $('results').hidden = !state.submitted; $('results').replaceChildren(); if (!state.submitted) return;
    const grade = M.grade(state), h = el('h2', '', 'Startup recovery results'); h.id = 'score-title'; $('results').append(h, el('p', 'score', `${grade.score} / ${grade.max} points`));
    const grid = el('div', 'review-grid');
    for (const row of grade.rows) {
      const card = el('article', 'feedback' + (row.points === 6 ? ' good' : '')); card.append(el('h3', '', `Computer ${row.id} · ${row.points} / 6`));
      for (const [passed, label, feedback] of row.checks) { card.append(el('p', '', `${passed ? '1 / 1' : '0 / 1'} · ${label}`)); if (!passed || label === 'Boot-component recovery') card.append(el('p', '', feedback)); }
      grid.append(card);
    }
    $('results').append(grid, el('p', '', 'Retry recovery continues the current investigation. Reset attempt restores both original failures for another full practice run.'));
  }
  function render() {
    renderCards(); const p = pc(); $('ticket-id').textContent = `COMPUTER ${p.id}`; $('ticket-title').textContent = p.id === 'A' ? 'Design office · Startup failure' : 'Workshop station · Startup failure';
    $('symptom').textContent = p.id === 'A' ? 'The Windows 11 workstation stopped starting after an interrupted boot-partition maintenance operation. Recover the existing installation.' : 'A Windows 10 Enterprise LTSC workstation stopped starting after an interrupted disk-imaging operation. It displays “Error loading operating system.” Recover startup without reinstalling.';
    $('facts').textContent = p.id === 'A' ? '512 GB NVMe SSD; Windows 11 Pro. Recovery USB is available. The system was installed using UEFI and GPT. User data is backed up. No restore point is available.' : '256 GB SATA SSD; Windows 10 Enterprise LTSC. Recovery USB is available. The system was installed using legacy BIOS and MBR. User data is backed up. No restore point is available.';
    $('notes').value = p.notes; $('notes').disabled = state.submitted;
    for (const id of ['power', 'setup', 'media']) $(id).disabled = state.submitted;
    $('submit').hidden = state.submitted; $('retry').hidden = !state.submitted; renderScreen(); renderResults();
  }
  $('power').onclick = () => { if (!state.submitted) reboot(); };
  $('setup').onclick = () => { if (!state.submitted) go('firmware'); };
  $('media').onclick = () => { if (!state.submitted) go('choose'); };
  $('notes').oninput = () => { if (!state.submitted) { pc().notes = $('notes').value; save(); } };
  $('submit').onclick = () => { for (const p of state.pcs) if (p.screen === 'repairRunning') M.navigate(p, 'repair'); state.submitted = true; render(); save(); showTab('activity'); $('results').focus(); $('results').scrollIntoView({ block: 'start', behavior: 'instant' }); };
  $('retry').onclick = () => { state.submitted = false; render(); save(); showTab('activity'); focusScreen(); };
  $('reset').onclick = () => { $('confirm').showModal(); $('keep').focus(); };
  $('keep').onclick = () => $('confirm').close();
  $('confirm-action').onclick = () => { state = M.initial(); draft = ''; $('confirm').close(); render(); save(); };
  $('confirm').addEventListener('close', () => $('reset').focus());
  function showTab(id, focus = false) { for (const name of ['activity', 'lesson']) { const active = name === id; $(name).hidden = !active; $(name + '-tab').setAttribute('aria-selected', String(active)); $(name + '-tab').tabIndex = active ? 0 : -1; } if (focus) $(id + '-tab').focus(); }
  for (const [i, name] of ['activity', 'lesson'].entries()) { $(name + '-tab').onclick = () => showTab(name); $(name + '-tab').onkeydown = event => { let target; if (['ArrowLeft', 'ArrowRight'].includes(event.key)) target = 1 - i; if (event.key === 'Home') target = 0; if (event.key === 'End') target = 1; if (target !== undefined) { event.preventDefault(); showTab(['activity', 'lesson'][target], true); } }; }
  render(); save();
})();
