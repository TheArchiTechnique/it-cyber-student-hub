/* Restricted, offline recovery simulation. No command is executed on the host. */
(function (root) {
  'use strict';
  const KEY = 'hub.windows-startup-recovery.v1';
  const screens = ['boot', 'recovery', 'choose', 'troubleshoot', 'advanced', 'repair', 'repairLog', 'terminal', 'firmware', 'restore', 'updates', 'settings', 'safe', 'resetPC', 'off', 'desktop', 'device', 'firmwareConfirm', 'startupChoices', 'updateResult', 'featureResult', 'repairRunning'];
  function computer(id) {
    return { id, screen: id === 'A' ? 'recovery' : 'boot', mode: id === 'A' ? 'UEFI' : 'Legacy', order: 'disk', firmwareTab: 'main', bcd: false, files: true, otherBoot: false, mbr: false, vbr: false, letter: '', diskpart: false, selectedVolume: null, selectedDisk: false, pending: false, evidence: {}, history: [], transcript: [], boots: 0, verified: false, notes: '' };
  }
  function initial() { return { version: 1, selected: 0, submitted: false, pcs: [computer('A'), computer('B')] }; }
  const windows = p => p.id === 'A' ? 'D' : 'C';
  const prompt = p => p.pending ? 'Add installation to boot list? Yes(Y)/No(N)/All(A):' : p.diskpart ? 'DISKPART>' : 'X:\\windows\\system32>';
  function ready(p) { return p.bcd && p.files && (p.id === 'A' || (p.mbr && p.vbr)); }
  function restart(p, safe = false) {
    p.diskpart = false; p.pending = false; p.selectedVolume = null; p.selectedDisk = false; p.boots++;
    const correctMode = p.mode === (p.id === 'A' ? 'UEFI' : 'Legacy');
    if (!correctMode || p.order !== 'disk') p.screen = 'boot';
    else if (ready(p)) { p.screen = safe ? 'safe' : 'desktop'; if (!safe) p.verified = true; }
    else p.screen = p.id === 'A' || (p.mbr && p.vbr) ? 'recovery' : 'boot';
    return p.screen;
  }
  function navigate(p, screen) {
    if (!screens.includes(screen)) return;
    p.screen = screen;
    if (screen === 'repair') p.evidence.repair = true;
    if (screen === 'repairLog') p.evidence.log = true;
  }
  function firmware(p, tab) { if (['main', 'storage', 'boot'].includes(tab)) { p.firmwareTab = tab; p.evidence[tab] = true; } }
  function volumes(p) {
    return '  Volume ###  Ltr  Label         Fs     Type        Size     Status\n' +
      `  Volume 0     ${windows(p)}   Windows       NTFS   Partition    ${p.id === 'A' ? '475' : '236'} GB  Healthy\n` +
      `  Volume 1     ${p.letter || ' '}   ${p.id === 'A' ? 'SYSTEM        FAT32' : 'System Rsvd   NTFS '}  Partition    ${p.id === 'A' ? '260' : '500'} MB  Healthy\n` +
      '  Volume 2     R   Recovery      NTFS   Partition   1024 MB  Healthy\n  Volume 3     E   RECOVERY_USB  FAT32  Removable     16 GB  Healthy';
  }
  const syntax = {
    bootrec: 'BOOTREC /FixMbr | /FixBoot | /ScanOs | /RebuildBcd\n/FixMbr writes master boot code without replacing the partition table.\n/FixBoot writes a new boot sector.\n/ScanOs finds compatible installations not currently in the BCD store.\n/RebuildBcd scans and offers to add installations to the boot list.',
    bcdboot: 'BCDBOOT source [/s volume-letter:] [/f UEFI|BIOS|ALL] [/c] [/v]\nsource is the installed Windows directory. /s selects the system partition.\n/f selects boot-file type and requires /s. Without /s, firmware identifies the system partition.',
    diskpart: 'DISKPART\nIn DiskPart: LIST DISK, LIST VOLUME, SELECT DISK 0, LIST PARTITION,\nSELECT VOLUME n, DETAIL VOLUME, ASSIGN LETTER=S, EXIT.\nThis activity supports inspection and system-partition letter assignment.',
    dir: 'DIR [drive:\\path] [/a]\nLists files and directories in this recovery session.',
    chkdsk: 'CHKDSK volume: [/f] [/r]\nChecks file-system integrity. /f repairs logical errors; /r also checks for bad sectors.',
    bcdedit: 'BCDEDIT /enum [all] | /store path /enum [all]\nDisplays the selected Boot Configuration Data store.',
    help: 'Supported utilities: BOOTREC, BCDBOOT, DISKPART, DIR, CHKDSK, BCDEDIT.\nAlso: CLS, EXIT, WPEUTIL REBOOT. Use utility /? for syntax.\nThis is a restricted Windows recovery simulation, not a full shell.'
  };
  function command(p, raw) {
    if (typeof raw !== 'string' || raw.length > 256 || /[\n\r;&|<>`$]/.test(raw)) return 'Command unavailable in this simulation.';
    const c = raw.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\b(bootrec|bcdboot|diskpart|chkdsk|bcdedit)\.exe\b/, '$1');
    if (p.pending) {
      if (!/^[yna]$/.test(c)) return 'Please answer Y (Yes), N (No), or A (All).';
      p.pending = false;
      if (c === 'n') return 'The operation completed successfully. No installation was added.';
      if (p.id === 'A' && !p.letter) return 'The requested system device cannot be found.';
      p.bcd = true; p.evidence.rebuild = true; return 'The operation completed successfully.';
    }
    if (p.diskpart) {
      if (c === 'exit') { p.diskpart = false; return 'Leaving DiskPart...'; }
      if (c === 'help' || c === '?') return syntax.diskpart;
      if (c === 'list disk') { p.evidence.layout = true; return `  Disk ###  Status         Size     Free     Dyn  Gpt\n  Disk 0    Online          ${p.id === 'A' ? '476' : '238'} GB      0 B       ${p.id === 'A' ? '*' : ' '}\n  Disk 1    Online           16 GB      0 B`; }
      if (/^list (vol|volume)$/.test(c)) { p.evidence.layout = true; return volumes(p); }
      if (c === 'select disk 0') { p.selectedDisk = true; p.selectedVolume = null; return 'Disk 0 is now the selected disk.'; }
      if (c === 'list partition') return p.selectedDisk ? `  Partition ###  Type              Size\n  Partition 1    ${p.id === 'A' ? 'System            260 MB\n  Partition 2    Reserved           16 MB' : 'Primary           500 MB'}\n  Partition ${p.id === 'A' ? '3' : '2'}    Primary           ${p.id === 'A' ? '475' : '236'} GB\n  Partition ${p.id === 'A' ? '4' : '3'}    Recovery         1024 MB` : 'There is no disk selected.';
      const select = c.match(/^sel(?:ect)? vol(?:ume)? (\d+)$/);
      if (select) { const n = Number(select[1]); if (n > 3) return 'The volume you specified is not valid.'; p.selectedVolume = n; return `Volume ${n} is the selected volume.`; }
      if (c === 'detail volume') {
        if (p.selectedVolume === null) return 'There is no volume selected.';
        if (p.selectedVolume === 1) { p.evidence.system = true; return volumes(p).split('\n')[2] + `\nRead-only : No\n${p.id === 'A' ? 'EFI System Partition (GPT)' : 'MBR primary partition\nActive : Yes'}\nDisk 0`; }
        return `Volume ${p.selectedVolume}\nRead-only : No\n${p.selectedVolume === 3 ? 'Disk 1 (removable)' : 'Disk 0'}`;
      }
      const assign = c.match(/^assign(?: letter\s*=\s*([a-z]))?$/);
      if (assign) {
        if (p.selectedVolume === null) return 'There is no volume specified. Please select a volume and try again.';
        if (p.selectedVolume !== 1) return 'Simulation boundary: only the recovery target system partition can be assigned a letter here.';
        const letter = (assign[1] || 'S').toUpperCase();
        if ([windows(p), 'E', 'R', 'X'].includes(letter)) return 'Virtual Disk Service error:\nThe specified drive letter is not free to be assigned.';
        p.letter = letter; return 'DiskPart successfully assigned the drive letter or mount point.';
      }
      if (/^(clean|format|delete|convert|active|inactive|create)\b/.test(c)) return 'Simulation boundary: destructive partition changes are not implemented. No changes were made.';
      return 'DiskPart could not process this command in the simulation. Type HELP for supported syntax.';
    }
    if (c === 'help') return syntax.help;
    const help = c.match(/^(\w+) \/\?$/); if (help && syntax[help[1]]) return syntax[help[1]];
    if (syntax[c] && !['diskpart', 'dir'].includes(c)) return syntax[c];
    if (c === 'cls') return '';
    if (c === 'exit') { p.screen = 'advanced'; return ''; }
    if (c === 'wpeutil reboot') { restart(p); return 'Restarting...'; }
    if (c === 'diskpart') { p.diskpart = true; return 'Microsoft DiskPart version 10.0.26100\n\nOn computer: MININT-RECOVERY\n'; }
    const bootrec = c.match(/^bootrec \/(fixmbr|fixboot|scanos|rebuildbcd)$/);
    if (bootrec) {
      const option = bootrec[1];
      if (option === 'fixmbr') { if (p.id === 'B') p.mbr = true; return 'The operation completed successfully.'; }
      if (option === 'fixboot') { if (p.id === 'A') return 'Access is denied.'; p.vbr = true; return 'The operation completed successfully.'; }
      p.evidence[option] = true;
      const found = !p.bcd;
      const output = `Scanning all disks for Windows installations.\n\nPlease wait, since this may take a while...\n\nSuccessfully scanned Windows installations.\nTotal identified Windows installations: ${found ? '1\n[1] ' + windows(p) + ':\\Windows' : '0'}`;
      if (option === 'rebuildbcd' && found) { p.pending = true; return output + '\nAdd installation to boot list? Yes(Y)/No(N)/All(A):'; }
      return output + '\nThe operation completed successfully.';
    }
    if (c.startsWith('bootrec ')) return 'Invalid parameter.\n' + syntax.bootrec;
    const dir = c.match(/^dir(?: ([a-z]:)(\\[^ ]*)?)?(?: \/a)?$/);
    if (dir) {
      const drive = (dir[1]?.[0] || 'X').toUpperCase(), path = (dir[2] || (dir[1] ? '\\' : '\\windows\\system32')).replace(/\\$/, '') || '\\';
      if (![windows(p), p.letter, 'R', 'E', 'X'].filter(Boolean).includes(drive)) return 'The system cannot find the path specified.';
      if (drive === windows(p) && ['\\', '\\windows', '\\windows\\system32'].includes(path)) { p.evidence.windows = true; return ` Directory of ${drive}:${path}\n\n` + (path === '\\' ? '<DIR>  Windows\n<DIR>  Users\n<DIR>  Program Files' : path === '\\windows' ? '<DIR>  System32\n<DIR>  WinSxS\n<DIR>  Boot' : '<DIR>  Config\n         winload.' + (p.id === 'A' ? 'efi' : 'exe')); }
      if (drive === p.letter) {
        if (path === '\\') return ` Directory of ${drive}:\\\n` + (p.id === 'A' ? '<DIR>  EFI' + (p.otherBoot ? '\n<DIR>  Boot\n       bootmgr' : '') : '<DIR>  Boot\n       bootmgr' + (p.otherBoot ? '\n<DIR>  EFI' : ''));
        const otherPath = p.id === 'A' ? '\\boot' : '\\efi\\microsoft\\boot';
        if (p.otherBoot && path === otherPath) return ` Directory of ${drive}:${path}\n    32,768 BCD` + (p.id === 'B' ? '\n   1,626,480 bootmgfw.efi' : '');
        const bootPath = p.id === 'A' ? '\\efi\\microsoft\\boot' : '\\boot';
        if (path === bootPath) return ` Directory of ${drive}:${path}\n` + (p.bcd ? '    32,768 BCD\n' : p.id === 'A' && p.files ? '' : 'File Not Found\n') + (p.id === 'A' && p.files ? '   1,626,480 bootmgfw.efi' : '');
      }
      if (drive === 'X' && path === '\\') return '<DIR> Windows\n<DIR> Sources';
      if (drive === 'X' && path === '\\windows\\system32') return ' Directory of X:\\windows\\system32\n    bootrec.exe\n    bcdboot.exe\n    diskpart.exe\n    chkdsk.exe';
      if (drive === 'E' && path === '\\') return '<DIR>  boot\n<DIR>  efi\n<DIR>  sources\n       setup.exe';
      if (drive === 'E' && path === '\\sources') return '    boot.wim';
      if (drive === 'R' && path === '\\') return '<DIR>  Recovery';
      return 'File Not Found';
    }
    if (c.startsWith('bcdboot ')) {
      const tokens = c.match(/"[^"]*"|\S+/g), source = tokens[1]?.replaceAll('"', '');
      let target = '', type = '', valid = true;
      for (let j = 2; j < tokens.length; j++) {
        if (tokens[j] === '/s' && !target && /^[a-z]:$/.test(tokens[j + 1] || '')) target = tokens[++j][0].toUpperCase();
        else if (tokens[j] === '/f' && !type && /^(uefi|bios|all)$/.test(tokens[j + 1] || '')) type = tokens[++j];
        else if (!['/c', '/v'].includes(tokens[j])) valid = false;
      }
      if (!valid || !/^[a-z]:\\windows$/.test(source || '') || (type && !target)) return 'Invalid command syntax.\n' + syntax.bcdboot;
      if (source[0].toUpperCase() !== windows(p) || (target && target !== p.letter)) return 'Failure when attempting to copy boot files.';
      if (type && type !== (p.id === 'A' ? 'uefi' : 'bios') && type !== 'all') { p.otherBoot = true; return 'Boot files successfully created.'; }
      if (type === 'all') p.otherBoot = true;
      p.bcd = true; p.files = true; p.evidence.bcdboot = true; return 'Boot files successfully created.';
    }
    const check = c.match(/^chkdsk ([a-z]):(?: (\/f|\/r))?(?: (\/f|\/r))?$/);
    if (check) {
      const drive = check[1].toUpperCase(); if (![windows(p), p.letter, 'R', 'E'].filter(Boolean).includes(drive)) return 'Cannot open volume for direct access.';
      p.evidence.diskcheck = true;
      return `The type of the file system is ${drive === p.letter && p.id === 'A' || drive === 'E' ? 'FAT32' : 'NTFS'}.\nVolume label is ${drive === windows(p) ? 'Windows' : 'SYSTEM'}.\n\nWindows has scanned the file system and found no problems.\nNo further action is required.\n0 KB in bad sectors.`;
    }
    const bcd = c.match(/^bcdedit(?: \/store ([a-z]):(\\(?:efi\\microsoft\\boot|boot)\\bcd))? \/enum(?: all)?$/);
    if (bcd) {
      if (bcd[1] && (bcd[1].toUpperCase() !== p.letter || bcd[2] !== (p.id === 'A' ? '\\efi\\microsoft\\boot\\bcd' : '\\boot\\bcd'))) return 'The boot configuration data store could not be opened.\nThe system cannot find the file specified.';
      // The default store belongs to the USB recovery environment, not the offline OS.
      if (!bcd[1]) return 'Windows Boot Manager\n--------------------\ndevice                  partition=E:\ndescription             Windows Recovery Media\n\nWindows Boot Loader\n-------------------\ndevice                  ramdisk=[E:]\\sources\\boot.wim\ndescription             Windows Recovery Environment';
      p.evidence.bcd = true;
      if (!p.bcd) return 'The boot configuration data store could not be opened.\nThe system cannot find the file specified.';
      return `Windows Boot Manager\n--------------------\ndevice                  partition=${p.letter}:\npath                    ${p.id === 'A' ? '\\EFI\\Microsoft\\Boot\\bootmgfw.efi' : '\\bootmgr'}\n\nWindows Boot Loader\n-------------------\ndevice                  partition=${windows(p)}:\npath                    \\Windows\\system32\\winload.${p.id === 'A' ? 'efi' : 'exe'}\nosdevice                partition=${windows(p)}:\nsystemroot              \\Windows`;
    }
    return 'Command unavailable or invalid syntax in this simulation. Type HELP or utility /? for supported commands.';
  }
  function execute(state, i, raw) {
    if (state.submitted || typeof raw !== 'string' || !state.pcs[i] || state.pcs[i].screen !== 'terminal') return '';
    const p = state.pcs[i], before = prompt(p), output = command(p, raw);
    p.history.push(String(raw).slice(0, 256)); p.history = p.history.slice(-80);
    if (raw.trim().toLowerCase() === 'cls' && !p.diskpart && !p.pending) p.transcript = [];
    else { p.transcript.push({ prompt: before, command: String(raw).slice(0, 256), output }); p.transcript = p.transcript.slice(-60); }
    return output;
  }
  function grade(state) {
    const rows = state.pcs.map(p => {
      const e = p.evidence;
      const checks = [
        [Boolean(e.storage && e.boot), 'Firmware evidence', 'Inspect storage detection and the boot configuration. A detected SSD is different from a working boot path.'],
        [Boolean(e.layout && e.windows && (p.id === 'B' || e.system)), 'Disk and Windows identification', 'Use DiskPart and DIR to confirm the disk layout, system partition, and installed Windows directory. WinRE letters can differ from normal Windows.'],
        [Boolean(e.repair && e.log), 'Recovery-tool selection', 'Try Startup Repair and inspect its diagnostic report before choosing a manual repair.'],
        [Boolean(e.scanos), 'Installation scan', 'Use BOOTREC /SCANOS. Zero means no additional unlisted installation was found, not necessarily that Windows is absent.'],
        [Boolean(ready(p)), 'Boot-component recovery', p.id === 'A' ? 'BCDBoot recreates the UEFI boot environment from the confirmed Windows directory. MBR code does not repair the EFI System Partition. In this USB recovery session, /rebuildbcd cannot locate the system device until the EFI partition is mounted; it is also a valid BCD recovery path after that.' : 'The imaging failure damaged master boot code, the partition boot sector, and BCD. /fixmbr, /fixboot, and an accepted /rebuildbcd repair those distinct components. BCDBoot can also recreate the BCD and boot files.'],
        [Boolean(p.verified && ready(p) && p.mode === (p.id === 'A' ? 'UEFI' : 'Legacy') && p.order === 'disk'), 'Boot verification', 'Restart from the internal disk in the installed firmware mode and reach the normal Windows desktop. A command success message or Safe Mode alone is not verification.']
      ];
      return { id: p.id, checks, points: checks.filter(c => c[0]).length };
    });
    return { rows, score: rows.reduce((n, r) => n + r.points, 0), max: 12 };
  }
  function restore(saved) {
    const state = initial();
    if (!saved || saved.version !== 1 || !Array.isArray(saved.pcs) || saved.pcs.length !== 2) return state;
    state.selected = saved.selected === 1 ? 1 : 0; state.submitted = saved.submitted === true;
    state.pcs.forEach((p, i) => {
      const s = saved.pcs[i]; if (!s || s.id !== p.id) return;
      for (const k of ['bcd', 'files', 'otherBoot', 'mbr', 'vbr', 'diskpart', 'selectedDisk', 'pending', 'verified']) p[k] = s[k] === true;
      if (screens.includes(s.screen)) p.screen = s.screen === 'repairRunning' ? 'repair' : s.screen;
      if (['UEFI', 'Legacy'].includes(s.mode)) p.mode = s.mode;
      if (['disk', 'network', 'usb'].includes(s.order)) p.order = s.order;
      if (['main', 'storage', 'boot'].includes(s.firmwareTab)) p.firmwareTab = s.firmwareTab;
      if (typeof s.letter === 'string' && /^[A-Z]$/.test(s.letter) && ![windows(p), 'E', 'R', 'X'].includes(s.letter)) p.letter = s.letter;
      if ([0, 1, 2, 3].includes(s.selectedVolume)) p.selectedVolume = s.selectedVolume;
      if (Number.isInteger(s.boots) && s.boots >= 0) p.boots = s.boots;
      for (const k of ['storage', 'boot', 'layout', 'windows', 'system', 'repair', 'log', 'scanos', 'rebuildbcd', 'rebuild', 'bcdboot', 'diskcheck', 'bcd']) if (s.evidence?.[k] === true) p.evidence[k] = true;
      p.history = Array.isArray(s.history) ? s.history.filter(x => typeof x === 'string').slice(-80).map(x => x.slice(0, 256)) : [];
      p.transcript = Array.isArray(s.transcript) ? s.transcript.filter(x => x && ['prompt', 'command', 'output'].every(k => typeof x[k] === 'string')).slice(-60).map(x => ({prompt:x.prompt.slice(0, 90), command:x.command.slice(0, 256), output:x.output.slice(0, 5000)})) : [];
      if (s.screen === 'repairRunning') p.evidence.repair = true;
      p.notes = typeof s.notes === 'string' ? s.notes.slice(0, 2000) : '';
    });
    return state;
  }
  const api = { KEY, initial, restore, windows, prompt, ready, restart, navigate, firmware, execute, grade };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StartupRecovery = api;
})(typeof window !== 'undefined' ? window : globalThis);
