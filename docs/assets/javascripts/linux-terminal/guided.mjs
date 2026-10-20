import {VirtualFilesystem} from './filesystem.mjs';
import {httpResource} from './network-state.mjs';
// Guided checkpoints observe the existing shell/VFS. They never execute commands for students.

export const stageIds = ['explore', 'workspace', 'nano', 'archive', 'search', 'permissions', 'resources', 'storage', 'packages', 'network', 'handoff', 'fedora'];
const evidenceKeys = ['pwd', 'ls', 'cd', 'man', 'help', 'whoami', 'ticket', 'noteRead', 'reportRead', 'nanoSaved', 'nanoRevised', 'copied', 'backupSaved', 'moved', 'removed', 'found', 'logSearch', 'reportSearch', 'longList', 'deniedRead', 'rootShell', 'rootIdentity', 'returned', 'ownership', 'rootOwned', 'ps', 'top', 'du', 'df', 'mountList', 'mounted', 'volumeRead', 'unmounted', 'fsck', 'volumeCopied', 'packageList', 'packageSearch', 'packageInfo', 'packageInstall', 'toolVerified', 'ipAddress', 'ipRoute', 'ping', 'dns', 'trace', 'http', 'nxdomain', 'unavailableDNS', 'service503', 'download', 'fedoraList', 'fedoraInfo', 'fedoraInstall', 'fedoraVerify'];
const validWorkspace = value => /^\/home\/student\/Practice\/Workstation-[1-9]\d{0,5}$/.test(value);
export function restoreGuided(value, profile) {
  if (value === undefined) return undefined;
  if (!value || value.version !== 1 || !['guided', 'free'].includes(value.mode) || !Number.isInteger(value.serial) || value.serial < 0 || value.serial > 999999) throw Error('Invalid guided progress');
  const run = value.run;
  if (run !== null && (!run || !validWorkspace(run.workspace) || !stageIds.includes(run.stage) || (profile === 'fedora' ? run.stage !== 'fedora' : run.stage === 'fedora') || !Array.isArray(run.completed) || run.completed.length > 12 || new Set(run.completed).size !== run.completed.length || !run.completed.every(id => stageIds.includes(id) && (profile === 'fedora' ? id === 'fedora' : id !== 'fedora')) || !run.evidence || typeof run.evidence !== 'object' || Array.isArray(run.evidence) || Object.entries(run.evidence).some(([key, flag]) => !evidenceKeys.includes(key) || flag !== true) || ['nanoHash', 'storageHash', 'backupHash'].some(key => run[key] !== null && !/^[0-9a-f]{8}$/.test(run[key])))) throw Error('Invalid guided assignment');
  return {version: 1, mode: value.mode, serial: value.serial, run: run ? {workspace: run.workspace, stage: run.stage, completed: [...run.completed], evidence: {...run.evidence}, nanoHash: run.nanoHash, storageHash: run.storageHash, backupHash: run.backupHash} : null};
}
export function guidedState(state) {
  return state.progress.guided ||= {version: 1, mode: 'free', serial: 0, run: null};
}
export function paths(run) {
  const workspace = run.workspace;
  return {workspace, working: workspace + '/Working', reports: workspace + '/Reports', archive: workspace + '/Archive', report: workspace + '/Reports/workstation-report.txt', backup: workspace + '/Archive/workstation-report-backup.txt', final: workspace + '/Archive/workstation-report-final.txt', note: workspace + '/Working/setup-notes.txt', disposable: workspace + '/Working/disposable.txt', volume: '/Reports/' + workspace.split('/').at(-1) + '-report.txt', download: workspace + '/Working/service-report.html'};
}
export function newRun(state) {
  const progress = guidedState(state);
  let serial = progress.serial, workspace;
  do {
    if (++serial > 999999) throw Error('Assignment limit reached. Keep existing work or reset this workstation intentionally.');
    workspace = '/home/student/Practice/Workstation-' + serial;
  } while (Object.keys(state.nodes).some(key => key === workspace || key.startsWith(workspace + '/')) || state.volumes.some(volume => volume.nodes['/Reports/Workstation-' + serial + '-report.txt'] || (volume.mountPoint && state.nodes[volume.mountPoint + '/Reports/Workstation-' + serial + '-report.txt'])));
  progress.serial = serial; progress.mode = 'guided';
  progress.run = {workspace, stage: state.distribution === 'fedora' ? 'fedora' : 'explore', completed: [], evidence: {}, nanoHash: null, storageHash: null, backupHash: null};
  return progress.run;
}
const hash = content => { let n = 2166136261; for (const c of content) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return (n >>> 0).toString(16).padStart(8, '0'); };
export function recordNanoSave(state, path, content, openedContent, firstSave) {
  const run = state.progress.guided?.run;
  if (!run || path !== paths(run).report || !content.trim()) return;
  if (firstSave && run.evidence.nanoSaved && hash(openedContent) === run.nanoHash && content !== openedContent) run.evidence.nanoRevised = true;
  run.evidence.nanoSaved = true; run.nanoHash = hash(content);
}
// The trace is produced by actual dispatch, after each real handler returns. Failed
// shell operations never produce successful evidence, including partial multi-file errors.
export function recordCommands(state, trace, result) {
  const run = state.progress.guided?.run;
  if (!run) return;
  const p = paths(run), e = run.evidence;
  if (result.code !== 0) {
    // An intentionally denied read is an observed restriction, not a successful read.
    if (result.stderr.includes('Permission denied') && trace.some(t => t.command === 'cat' && t.targets.includes(p.disposable) && t.uid === 1000 && t.restricted)) e.deniedRead = true;
    return;
  }
  for (const t of trace.filter(t => t.success)) {
    const {command: c, args: a, stdout: out, targets} = t;
    if (['pwd', 'ls', 'cd', 'man', 'help', 'whoami'].includes(c)) e[c] = true;
    if (c === 'cat') {
      if (targets.includes('/home/student/Documents/ticket.txt') && out.includes('1042')) e.ticket = true;
      if (targets.includes(p.note) && out.trim()) e.noteRead = true;
      if (targets.includes(p.report) && out.trim()) e.reportRead = true;
      if (targets.includes('/mnt/training-disk/README.txt') && out.includes('Training volume')) e.volumeRead = true;
    }
    if (c === 'cp' && targets.includes(p.report) && state.nodes[p.report]?.type === 'file') {
      e.copied = true;
      const volume = state.volumes[1], destination = '/mnt/training-disk' + p.volume;
      if (volume.mountPoint && (targets.includes(destination) || targets.includes('/mnt/training-disk/Reports')) && state.nodes[destination]?.content === state.nodes[p.report].content) {
        e.volumeCopied = true; run.storageHash = hash(state.nodes[destination].content);
      }
    }
    if (['cp', 'mv'].includes(c) && state.nodes[p.report]?.type === 'file' && state.nodes[p.backup]?.type === 'file' && state.nodes[p.backup].content === state.nodes[p.report].content && (targets.includes(p.backup) || targets.includes(p.archive))) {
      e.backupSaved = true; run.backupHash = hash(state.nodes[p.backup].content);
    }
    if (c === 'mv' && targets.some(path => path.startsWith(p.workspace + '/'))) e.moved = true;
    if (c === 'rm' && t.disposableExisted && !state.nodes[p.disposable]) e.removed = true;
    if (c === 'find' && out.includes(p.report)) e.found = true;
    if (c === 'grep' && targets.includes('/var/log/application.log') && /error/i.test(out) && a.some(arg => /^-[in]+$/.test(arg) && arg.includes('n')) && a.some(arg => /^-[in]+$/.test(arg) && arg.includes('i'))) e.logSearch = true;
    if (c === 'grep' && targets.includes(p.report) && out.trim()) e.reportSearch = true;
    if (c === 'ls' && a.some(arg => /^-[la1d]+$/.test(arg) && arg.includes('l')) && (targets.includes(p.report) || t.cwd === p.reports || targets.includes(p.reports))) e.longList = true;
    if (c === 'su' && state.user.uid === 0) e.rootShell = true;
    if (c === 'whoami' && state.user.uid === 0 && out.trim() === 'root') e.rootIdentity = true;
    if (c === 'exit' && state.user.uid === 1000 && e.rootIdentity) e.returned = true;
    if (c === 'chown' && t.uid === 0 && targets.includes(p.disposable)) {
      const owner = state.nodes[p.disposable]?.uid;
      if (t.disposableUid === 1000 && owner === 0) e.rootOwned = true;
      if (e.rootOwned && t.disposableUid === 0 && owner === 1000) e.ownership = true;
    }
    if (c === 'ps' && out.includes('bash') && /systemd|NetworkManager/.test(out)) e.ps = true;
    if (c === 'top' && out.includes('KiB Mem:')) e.top = true;
    if (c === 'du' && (targets.includes(p.reports) || t.cwd === p.reports) && out.trim()) e.du = true;
    if (c === 'df' && out.includes('/dev/sda1')) e.df = true;
    if (c === 'mount' && !a.length && out.includes('/dev/sda1')) { e.mountList = true; if (out.includes('/dev/sdb1')) e.mounted = true; }
    if (c === 'mount' && a.includes('/dev/sdb1') && state.volumes[1].mountPoint) e.mounted = true;
    if (c === 'umount' && !state.volumes[1].mountPoint) e.unmounted = true;
    if (c === 'fsck' && a.includes('/dev/sdb1') && out.includes('No errors found')) e.fsck = true;
    if (c === state.packages.manager) {
      const fedora = c === 'dnf';
      if (a[0] === 'list') e[fedora ? 'fedoraList' : 'packageList'] = true;
      if (a[0] === 'search' && out.includes('traceroute')) e.packageSearch = true;
      if (a[0] === (fedora ? 'info' : 'show')) {
        e[fedora ? 'fedoraInfo' : 'packageInfo'] = true;
        if (fedora && a[1] === 'support-notes' && out.includes('Installed: yes')) e.fedoraVerify = true;
      }
      if (a[0] === 'install' && a.includes(fedora ? 'support-notes' : 'traceroute') && out.includes('Installed: ')) e[fedora ? 'fedoraInstall' : 'packageInstall'] = true;
    }
    if (c === 'ip' && (out.includes('inet ') || (a.includes('-br') && out.includes('192.0.2.')))) e.ipAddress = true;
    if (c === 'ip' && out.includes('default via')) e.ipRoute = true;
    if (c === 'ping' && out.includes('0% packet loss') && !out.includes('100% packet loss')) e.ping = true;
    if (c === 'dig') {
      if (out.includes('198.51.100.20')) e.dns = true;
      if (out.includes('NXDOMAIN')) e.nxdomain = true;
      if (out.includes('203.0.113.80')) e.unavailableDNS = true;
    }
    if (c === 'traceroute' && out.includes('198.51.100.20')) { e.trace = true; e.toolVerified = true; }
    if (c === 'curl') {
      if (out.includes('200 OK')) e.http = true;
      if (out.includes('503 Service Unavailable')) e.service503 = true;
      if (a.includes('-o') && targets.includes(p.download) && state.nodes[p.download]?.content.includes('Support report')) e.download = true;
    }
  }
}
export function commandObservation(shell, command, args) {
  const run = shell.state.progress.guided?.run;
  if (!run) return null;
  const targets = [];
  for (const arg of args.filter(arg => !arg.startsWith('-'))) {
    try { targets.push(shell.fs.resolve(arg, {missingLeaf: true})); } catch { /* Not every operand is a path. */ }
  }
  const p = paths(run), node = shell.state.nodes[p.disposable];
  return {command, args: [...args], targets, cwd: shell.state.cwd, uid: shell.fs.user.uid, restricted: !!node && !(node.mode & 0o400), disposableUid: node?.uid, disposableExisted: node?.type === 'file', success: false};
}

export const stages = [
  {id: 'explore', title: 'Explore the Linux workstation', concept: 'Work as student; if an earlier root shell is open, use exit to return. The prompt shows account@computer:directory. $ is a regular account; # is root. / starts an absolute path. Relative paths start here; ~ is home. Linux names are case-sensitive: Documents and documents differ.', tasks: ['Run pwd, ls, and whoami. Read ~/Documents/ticket.txt to identify your support assignment.', 'Visit /, inspect the directory names, then return home with cd ~. Read man ls (Q returns) and help. Try ls -a to see hidden names.'], hint: 'Use one command per line. A command may have options and path arguments.', example: 'pwd\nls -a\ncd /\nls\ncd ~\nwhoami\ncat ~/Documents/ticket.txt\nman ls\nhelp'},
  {id: 'workspace', title: 'Build the technician workspace', concept: 'mkdir creates directories; touch creates an empty regular file. > writes or replaces text; >> appends. cat reads saved text. Use this run’s workspace, shown above, throughout the assignment.', tasks: ['Create Working, Reports, and Archive inside {workspace}. Visit your workspace and verify its location and contents.', 'Create Working/disposable.txt with touch. Write a two-line setup note to Working/setup-notes.txt using echo with > and >>. Read the note back.'], hint: 'mkdir -p creates missing parent directories. Quote text containing spaces. Run each line separately.', example: 'mkdir -p {working} {reports} {archive}\ncd {workspace}\npwd\nls\ntouch Working/disposable.txt\necho "Technician workspace prepared" > Working/setup-notes.txt\necho "Reports and archives are separate" >> Working/setup-notes.txt\ncat Working/setup-notes.txt'},
  {id: 'nano', title: 'Write and revise the workstation report', concept: 'Nano edits a buffer. Changes reach the filesystem only when you write the file. ^O means Ctrl+O; ^X means Ctrl+X. On touch screens, use Write Out and Exit below the editor.', tasks: ['Visit {reports}. Open nano workstation-report.txt. Write at least three useful lines identifying the workstation, the technician account, and the workspace you prepared. Use your own wording.', 'Press Ctrl+O, confirm the filename with Enter, then Ctrl+X. Verify the saved report with ls and cat.', 'Reopen the same report in Nano. Add another useful observation, save, and exit again. Read the revised file.'], hint: 'Opening Nano alone does not create a report. Do not type terminal commands into the editor.', example: 'cd {reports}\nnano workstation-report.txt\n# After saving and exiting:\nls\ncat workstation-report.txt\nnano workstation-report.txt'},
  {id: 'archive', title: 'Organize and archive files', concept: 'cp creates an independent copy; mv moves or renames the existing file. rm removes a name. Directories require recursive operations such as cp -r or rm -r; use those only for a disposable tree you intended to affect.', tasks: ['Copy the saved report to Working/report-copy.txt. Move that copy into Archive, renaming it workstation-report-backup.txt.', 'Verify both the original and archived contents match. Remove only Working/disposable.txt. Keep your setup note and report.'], hint: 'Inspect man cp, man mv, and man rm. An absolute destination avoids depending on the current directory.', example: 'cp {report} {working}/report-copy.txt\nmv {working}/report-copy.txt {backup}\nls {reports} {archive}\nrm {disposable}'},
  {id: 'search', title: 'Investigate files and application logs', concept: 'find locates paths; grep locates text inside files. grep -i ignores letter case, and -n shows line numbers. INFO records routine events; ERROR records a failure worth investigating.', tasks: ['Locate your report by name with find. Keep any wildcard name pattern quoted.', 'Search /var/log/application.log for error entries, ignoring case and showing line numbers. Compare the results with the complete log.', 'Search your report for a term you wrote. Add a Log findings section to the report explaining the configuration and directory errors and how they differ from the informational startup message.'], hint: 'Use man find and man grep. The sample log contains uppercase and lowercase error labels.', example: 'find {workspace} -name "workstation-report.txt"\ngrep -in error /var/log/application.log\ncat /var/log/application.log\n# Search a term that exists in your own report, then edit it with Nano.'},
  {id: 'permissions', title: 'Protect files and use authorized administration', concept: 'Permissions apply to owner, group, and other, in that order. r=4, w=2, x=1. A file needs read to view and write to edit; directories need read to list names and execute to traverse. sudo authorizes one command; sudo su - opens a training root shell; exit returns.', tasks: ['Inspect the report with ls -l. Set its permissions to owner read/write only (600, or an equivalent symbolic change), then verify.', 'Recreate Working/disposable.txt with a short note. Remove its owner-read permission while keeping write permission, then try to read it as student. Restore owner read/write.', 'Use sudo chown to make that disposable file root-owned, then restore student:student ownership. Leave the file with mode 600.', 'Open an authorized root shell, confirm its identity with whoami, then exit back to student. Keep your report accessible. Add a Permissions section describing mode 600.'], hint: 'Change only the disposable file for the denied-read exercise. If it becomes root-owned, sudo chown student:student PATH recovers it.', example: 'ls -l {report}\nchmod 600 {report}\necho "Disposable permission test" > {disposable}\nchmod 200 {disposable}\ncat {disposable}\nchmod u+r {disposable}\nsudo chown root:root {disposable}\nsudo chown student:student {disposable}\nsudo su -\nwhoami\nexit'},
  {id: 'resources', title: 'Interpret processes and system resources', concept: 'ps reports process IDs, owners, and states. top shows a snapshot of CPU and memory; Q returns. S means sleeping; R means runnable. du measures directory data; df reports capacity and usage of a filesystem. All resource metrics here are simulated.', tasks: ['Inspect all processes with ps and open top. Identify the student Bash PID and a system service. Compare CPU and memory use.', 'Measure Reports directory usage with du and inspect root filesystem capacity with df.', 'Add a System section to your report: identify Bash and its PID, name a system service, describe CPU and memory observations, and explain what du measures compared with df.'], hint: 'Use the ps manual to find an all-process view. top -b -n 1 is a noninteractive alternative.', example: 'ps -ef\ntop\ndu -sh {reports}\ndf -h'},
  {id: 'storage', title: 'Use mounted training storage', concept: 'A mount attaches a filesystem to a directory in the Linux tree. /home holds user files, /etc configuration, /var/log logs, and /mnt temporary mounts. Unmount hides volume contents without deleting them. This simulator supports only a read-only fsck -n check on an unmounted volume.', tasks: ['List mounted filesystems. Mount /dev/sdb1 at /mnt/training-disk using authorized administration; if already mounted, inspect it there.', 'Explore the mounted volume and read its README.txt. Copy your report into its Reports directory as {volumeName}. Verify the saved copy.', 'Return outside the mount, unmount it, then run an authorized read-only filesystem check. Add a Storage section describing ext4, the mount point, and the check result.'], hint: 'A shell inside the mount makes it busy. cd ~ before unmounting. Never use repair options for this exercise.', example: 'mount\nsudo mount /dev/sdb1 /mnt/training-disk\nls /mnt/training-disk\ncat /mnt/training-disk/README.txt\ncp {report} /mnt/training-disk{volume}\ncat /mnt/training-disk{volume}\ncd ~\nsudo umount /dev/sdb1\nsudo fsck -n /dev/sdb1'},
  {id: 'packages', title: 'Manage workstation software with APT', concept: 'Mint uses APT to query a package catalog and make authorized changes. A package can supply a command. Inspect your current inventory; optional tools may already be installed. Repository access depends on network and DNS connectivity.', tasks: ['Inspect the installed APT inventory, search for traceroute, and inspect its package metadata.', 'If traceroute is installed, remove this optional package and observe that its command becomes unavailable. Install it again with administrative authorization. If already missing, install it directly.', 'Verify it appears in the installed inventory and successfully trace the route to portal.training.example. Ensure curl and dnsutils are installed for the next stage.', 'Add a Packages section recording the package, its purpose, and why installation needs authorization.'], hint: 'Use man apt. Removing an optional diagnostic package is recoverable. Foundational packages are protected.', example: 'apt list --installed\napt search traceroute\napt show traceroute\nsudo apt remove traceroute\ntraceroute portal.training.example\nsudo apt install traceroute curl dnsutils\napt list --installed\ntraceroute portal.training.example'},
  {id: 'network', title: 'Diagnose network and application behavior', concept: 'ip shows interfaces, addresses, and routes. ping tests ICMP replies; dig queries DNS; traceroute shows hops; curl tests HTTP. DNS success does not prove reachability, and HTTP 503 means a responding application has a problem. A missing hop reply alone does not prove the route is broken.', tasks: ['Inspect the address and default route. Ping the gateway, query portal.training.example with dig, trace its route, and inspect the HTTP headers from files.training.example.', 'Download http://files.training.example/report into {download} using curl -o, then read the saved file.', 'Investigate three tickets: missing.training.example, unavailable.training.example, and http://status.training.example. Use DNS queries, reachability tests, and HTTP headers to distinguish a missing DNS record, an unreachable destination, and a responding service returning 503.', 'Add a Network section with your interface, address, gateway, and DNS result. Explain each ticket’s failure category. Keep the workstation network usable.'], hint: 'dig reports NXDOMAIN for an unknown record. Compare a name that resolves but is unreachable with a server that returns HTTP 503. Use curl -I for headers; without -f an HTTP error status still means the HTTP exchange completed.', example: 'ip addr\nip route\nping -c 2 192.0.2.1\ndig portal.training.example\ntraceroute portal.training.example\ncurl -I http://files.training.example\ncurl -o {download} http://files.training.example/report\ncat {download}\ndig missing.training.example\ndig unavailable.training.example\nping -c 2 unavailable.training.example\ncurl -I http://status.training.example'},
  {id: 'handoff', title: 'Complete the technician handoff', concept: 'Useful support notes describe what was found, what changed, and what remains unresolved. A backup must contain the final saved report, not just an earlier draft.', tasks: ['Finish the original report with these section labels, each followed by your own findings: Workstation, Workspace, Log findings, Permissions, System, Storage, Packages, Network, and Final status. Labels can use upper or lowercase.', 'Under Final status, explain that workstation preparation is complete while the remote service fault still needs escalation. Include a concrete next action.', 'Save the report in the simulated environment. Keep it student-owned with mode 600. Archive an identical final copy as {final}, also mode 600. Keep the earlier backup and detached training-volume copy.', 'Recheck any changed earlier work. Checkpoints are revalidated when you check this stage. The Fedora extension is separate from the 11-stage Mint assignment.'], hint: 'Use Nano to combine findings already collected. cp creates the final archive; inspect its permissions and saved contents.', example: 'nano {report}\ncp {report} {final}\nchmod 600 {report} {final}\ncat {final}'},
  {id: 'fedora', title: 'Fedora DNF extension', concept: 'Fedora uses DNF; Mint normally uses APT. This is an independently saved Fedora workstation. Your Mint files and assignment checkpoints remain in the Mint profile.', tasks: ['Inspect installed Fedora packages and read the short DNF manual. Inspect metadata for support-notes.', 'Install the optional support-notes training package with DNF, then verify its installed status with dnf info. If already installed, remove this optional package and reinstall it.', 'Create {working}. Save dnf-notes.txt there describing Fedora, DNF, and the installed support-notes package. This extension completes the distribution-specific command coverage.'], hint: 'DNF uses list installed and info where APT uses list --installed and show. Package changes require sudo in both profiles.', example: 'dnf list installed\nman dnf\ndnf info support-notes\nsudo dnf install support-notes\ndnf info support-notes\nmkdir -p {working}\necho "Fedora uses DNF; support-notes is installed" > {working}/dnf-notes.txt'}
];

export function stageText(text, run) {
  const p = paths(run); p.volumeName = p.volume.split('/').at(-1);
  return text.replace(/\{(\w+)\}/g, (_, key) => p[key] ?? '');
}
const sections = {workstation: /^(workstation|identification)$/i, workspace: /^(workspace|preparation)$/i, logs: /^(log findings|log investigation)$/i, permissions: /^(permissions|security)$/i, system: /^(system|resources)$/i, storage: /^(storage|filesystem)$/i, packages: /^(packages|software)$/i, network: /^(network|connectivity)$/i, final: /^(final status|handoff)$/i};
export function reportSections(text) {
  const found = {};
  for (const line of text.split('\n')) {
    const heading = line.trim().match(/^(?:#+\s*)?([a-z ]+)(?::\s*(.*))?$/i);
    const key = heading && Object.keys(sections).find(key => sections[key].test(heading[1].trim()) && heading[1].length <= 30);
    if (key) { found[key] = (heading[2] || '') + '\n'; found.current = key; }
    else if (found.current) found[found.current] += line + '\n';
  }
  delete found.current; return found;
}
export function validateStage(state, id) {
  const run = state.progress.guided?.run;
  if (!run || !stageIds.includes(id) || (state.distribution === 'fedora' ? id !== 'fedora' : id === 'fedora')) return {ok: false, failures: ['Start an assignment in the appropriate workstation profile.']};
  const p = paths(run), e = run.evidence, n = state.nodes, failures = [];
  const check = (ok, feedback) => { if (!ok) failures.push(feedback); };
  const file = path => n[path]?.type === 'file' ? n[path] : null;
  const report = file(p.report), content = report?.content || '', s = reportSections(content);
  const meaningful = text => (text || '').trim().length >= 12 && /[a-z]/i.test(text);
  const evidence = (keys, message) => check(keys.every(key => e[key]), message);
  const section = (key, test, message) => check(meaningful(s[key]) && test.test(s[key]), message);
  switch (id) {
    case 'explore': evidence(['pwd', 'ls', 'cd', 'man', 'help', 'whoami', 'ticket'], 'Explore your location and identity, navigate successfully, read the support ticket, and use both man and help.'); break;
    case 'workspace':
      for (const key of ['working', 'reports', 'archive']) check(n[p[key]]?.type === 'directory', `${key === 'working' ? 'Working' : key === 'reports' ? 'Reports' : 'Archive'} directory is missing from this assignment workspace.`);
      check(file(p.note)?.content.split('\n').filter(line => line.trim().length >= 8).length >= 2, 'Save two useful lines in Working/setup-notes.txt.');
      evidence(['noteRead'], 'Read your saved setup note to verify its contents.'); break;
    case 'nano':
      check(!!report, 'Reports directory was found, but workstation-report.txt has not been saved there.');
      check(content.split('\n').filter(line => line.trim().length >= 8).length >= 3 && /student-linux/i.test(content) && /student/i.test(content), 'Save at least three useful report lines identifying student-linux and the student account.');
      evidence(['nanoSaved', 'nanoRevised', 'reportRead'], 'Write the report with Nano, exit, reopen it, save a changed observation, and read the saved file.'); break;
    case 'archive':
      check(!!report && !!file(p.backup) && file(p.backup).content.trim().length >= 30, 'Keep the original report and a meaningful archived workstation-report-backup.txt.');
      // Validate the real earlier snapshot even if students check stages out of order.
      check(!!file(p.backup) && hash(file(p.backup).content) === run.backupHash && e.backupSaved, 'Archive the matching report copy before continuing; preserve its saved contents.');
      evidence(['copied', 'backupSaved', 'moved', 'removed'], 'Copy and move the report backup, then remove the designated disposable file.');
      if (!e.deniedRead) check(!n[p.disposable], 'Remove only Working/disposable.txt for this checkpoint.'); break;
    case 'search': evidence(['found', 'logSearch', 'reportSearch'], 'Locate the report and successfully search both the application log (case-insensitive with line numbers) and your saved report.'); section('logs', /config|directory/i, 'Add Log findings explaining the configuration or directory errors.'); check(/info|informational/i.test(s.logs || '') && /error|fail/i.test(s.logs || '') && /config/i.test(s.logs || '') && /directory/i.test(s.logs || ''), 'Explain the configuration and directory errors and how informational startup messages differ.'); break;
    case 'permissions':
      check(report?.mode === 0o600 && report?.uid === 1000 && report?.gid === 1000, 'The report must be student-owned and readable/writable only by its owner (600).');
      check(file(p.disposable)?.mode === 0o600 && file(p.disposable)?.uid === 1000 && file(p.disposable)?.gid === 1000, 'Recover the disposable permission-test file to student:student with mode 600.');
      check(state.user.uid === 1000 && !state.sessions.length, 'Exit administrative shells and return to the original student account.');
      evidence(['longList', 'deniedRead', 'ownership', 'rootOwned', 'rootShell', 'rootIdentity', 'returned'], 'Inspect long permissions, observe the designated denied read, change ownership with authorization, and verify a root shell before returning.');
      section('permissions', /600|owner|read|write/i, 'Document the protected report permissions.'); break;
    case 'resources': evidence(['ps', 'top', 'du', 'df'], 'Inspect system services and Bash, CPU/memory, Reports directory usage, and filesystem capacity.'); section('system', /bash/i, 'Document Bash in a System section.'); check(/\b1042\b/.test(s.system || '') && /systemd|NetworkManager/i.test(s.system || '') && /cpu/i.test(s.system || '') && /memory|ram/i.test(s.system || '') && /\bdu\b/i.test(s.system || '') && /\bdf\b/i.test(s.system || ''), 'Include the student Bash PID, a system service, CPU/memory observations, and the different purposes of du and df.'); break;
    case 'storage': {
      evidence(['mountList', 'mounted', 'volumeRead', 'volumeCopied', 'unmounted', 'fsck'], 'Inspect mounts, explore the training volume, unmount it, and complete its read-only filesystem check.');
      const volume = state.volumes[1];
      check(volume.mountPoint === null, 'Leave /dev/sdb1 unmounted after inspection.');
      check(volume.nodes[p.volume]?.type === 'file' && volume.nodes[p.volume].content.trim().length >= 30 && hash(volume.nodes[p.volume].content) === run.storageHash, 'Save this run’s support report in the training volume’s Reports directory before unmounting.');
      section('storage', /ext4/i, 'Add Storage findings naming ext4 and the read-only check result.'); check(/consistent|no errors|clean/i.test(s.storage || '') && /\/mnt\/training-disk/.test(s.storage || ''), 'Record the mount point and the successful read-only check result.'); break;
    }
    case 'packages': evidence(['packageList', 'packageSearch', 'packageInfo', 'packageInstall', 'toolVerified'], 'Inspect inventory and metadata, install traceroute (remove it first if already installed), and successfully use it to reach the portal.'); check(['traceroute', 'curl', 'dnsutils'].every(name => state.packages.catalog.find(pkg => pkg.name === name)?.installed), 'Install traceroute, curl, and dnsutils for network diagnostics.'); section('packages', /traceroute/i, 'Add Packages findings describing traceroute and authorized installation.'); break;
    case 'network':
      evidence(['ipAddress', 'ipRoute', 'ping', 'dns', 'trace', 'http', 'nxdomain', 'unavailableDNS', 'service503', 'download'], 'Inspect addressing/routes, verify reachability/DNS/HTTP, investigate the three ticket destinations, and download the service report.');
      check(file(p.download)?.content === state.network.endpoints.find(peer => peer.name === 'files.training.example')?.http?.resources.find(resource => resource.path === '/report')?.body, 'The service-report.html download is missing or its saved contents differ from the service response.');
      check(httpResource(state, new VirtualFilesystem(state), 'http://portal.training.example').status === 200, 'Restore usable network and DNS connectivity to the portal before handoff.');
      check(meaningful(s.network) && state.network.addresses.some(address => (s.network || '').includes(address.split('/')[0])), 'Document a currently configured IPv4 address in a Network section.');
      check([state.network.interface, state.network.gateway || 'no default gateway', '198.51.100.20', '503'].every(term => (s.network || '').includes(term)) && /NXDOMAIN|missing.*record|record.*missing/i.test(s.network || '') && /unreachable|connectivity|timed? ?out/i.test(s.network || '') && /service|application/i.test(s.network || ''), 'Include interface, gateway, portal DNS address, and distinguish missing DNS records, destination reachability, and HTTP 503.'); break;
    case 'handoff':
      for (const previous of stageIds.slice(0, 10)) { const result = validateStage(state, previous); check(result.ok, `Stage ${stageIds.indexOf(previous) + 1}: ${result.failures[0] || ''}`); }
      for (const key of Object.keys(sections)) check(meaningful(s[key]), `Add meaningful findings under ${key === 'logs' ? 'Log findings' : key === 'final' ? 'Final status' : key} in your saved report.`);
      check(/complete|prepared|ready/i.test(s.final || '') && /escalat|follow.up|next|investigat/i.test(s.final || ''), 'Final status should describe workstation readiness and a next action for the remaining service fault.');
      check(!!report && file(p.final)?.content === content && file(p.final)?.mode === 0o600 && file(p.final)?.uid === 1000, 'Save an identical final archive owned by student with mode 600.'); break;
    case 'fedora':
      evidence(['man', 'fedoraList', 'fedoraInfo', 'fedoraInstall', 'fedoraVerify'], 'Use the DNF manual, inspect Fedora inventory/metadata, install support-notes, and verify its installed status.');
      check(state.packages.catalog.find(pkg => pkg.name === 'support-notes')?.installed, 'Install the optional support-notes package in Fedora.');
      check(/fedora/i.test(file(p.working + '/dnf-notes.txt')?.content || '') && /dnf/i.test(file(p.working + '/dnf-notes.txt')?.content || '') && /support-notes/i.test(file(p.working + '/dnf-notes.txt')?.content || ''), 'Save Working/dnf-notes.txt describing Fedora, DNF, and support-notes.'); break;
  }
  return {ok: failures.length === 0, failures};
}
export function checkStage(state, id) {
  const result = validateStage(state, id), run = state.progress.guided?.run;
  if (result.ok) {
    // The handoff already revalidated every Mint stage; award those verified
    // outcomes even when a student used the selector instead of checking in order.
    for (const completed of id === 'handoff' ? stageIds.slice(0, 11) : [id]) if (!run.completed.includes(completed)) run.completed.push(completed);
  }
  return result;
}
