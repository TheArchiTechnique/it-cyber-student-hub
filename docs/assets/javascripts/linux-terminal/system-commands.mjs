import {LinuxError, baseName, parentPath} from './filesystem.mjs';
import {identity, accounts, processRecord, allocatedBytes, within, volumeFor, volumeEntries, volumeUsed} from './system-state.mjs';
const fail = text => { throw new LinuxError(text); };
const nameOf = uid => uid === 0 ? 'root' : 'student';
const human = bytes => bytes === 0 ? '0' : bytes < 1024 ? String(bytes) : bytes < 1024 ** 2 ? `${Math.ceil(bytes / 1024)}K` : bytes < 1024 ** 3 ? `${(bytes / 1024 ** 2).toFixed(1)}M` : `${(bytes / 1024 ** 3).toFixed(1)}G`;
const duration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const admin = shell => { if (shell.fs.user.uid !== 0) fail('must be root; use sudo for simulated administration'); };

export function topSnapshot(state) {
  const processes = state.processes, cpu = processes.reduce((sum, p) => sum + p.cpu, 0);
  const used = processes.reduce((sum, p) => sum + p.rssKiB, 0), {memoryKiB, buffersKiB, cacheKiB, uptimeSeconds} = state.system;
  const free = memoryKiB - used - buffersKiB - cacheKiB;
  return `top - simulated snapshot; up ${Math.floor(uptimeSeconds / 3600)}:${String(Math.floor(uptimeSeconds / 60) % 60).padStart(2, '0')}, ${state.sessions.length + 1} shell session(s)\n` +
    `Tasks: ${processes.length} total, ${processes.filter(p => p.state === 'R').length} running, ${processes.filter(p => p.state === 'S').length} sleeping\n` +
    `%Cpu(s): ${cpu.toFixed(1)} us, 0.0 sy, ${(100 - cpu).toFixed(1)} id\n` +
    `KiB Mem: ${memoryKiB} total, ${free} free, ${used} used, ${buffersKiB + cacheKiB} buff/cache\nKiB Swap: 0 total, 0 used\n\n` +
    '  PID USER       S  %CPU  %MEM   RES(KiB) COMMAND\n' +
    [...processes].sort((a, b) => b.cpu - a.cpu || a.pid - b.pid).map(p => `${String(p.pid).padStart(5)} ${nameOf(p.uid).padEnd(10)} ${p.state} ${p.cpu.toFixed(1).padStart(5)} ${(p.rssKiB / memoryKiB * 100).toFixed(1).padStart(5)} ${String(p.rssKiB).padStart(10)} ${p.name}`).join('\n') + '\n';
}
export function systemCommands(shell, options) {
  const {state, fs} = shell;
  return [
    ['sudo', args => {
      if (fs.user.uid !== 0 && !state.policy.sudoUsers.includes(fs.user.name)) fail(`${fs.user.name} is not authorized by the simulated sudo policy`);
      if (args.length === 1 && args[0] === '-l') return `Simulated training policy (no password required):\n${fs.user.name} may run supported external commands as root.\nUse sudo su - for a root shell. No real credentials are used.\n`;
      if (args[0] === '--') args = args.slice(1);
      if (!args.length) fail('usage: sudo [-l] | sudo COMMAND [ARG ...]');
      if (args[0].startsWith('-')) fail(`option '${args[0]}' is not supported; use man sudo`);
      const command = args[0];
      if (['cd', 'exit', 'help', 'clear'].includes(command)) fail(`${command}: shell builtin cannot run as a sudo program`);
      const handler = shell.commands.get(command);
      if (!handler) { shell.commandStatus = 127; fail(`${command}: command not found`); }
      if ((shell.sudoDepth || 0) >= 16) fail('simulated sudo nesting limit reached (16)');
      shell.sudoDepth = (shell.sudoDepth || 0) + 1;
      try { return fs.asUser(identity('root'), () => handler(args.slice(1))); }
      finally { shell.sudoDepth--; }
    }],
    ['su', args => {
      let login = false;
      if (['-', '-l'].includes(args[0])) { login = true; args = args.slice(1); }
      if (args.length > 1 || args[0]?.startsWith('-')) fail('usage: su [- | -l] [root|student]');
      const name = args[0] || 'root';
      if (!Object.hasOwn(accounts, name)) fail(`${name}: user does not exist`);
      if (fs.user.uid !== 0) fail(name === 'root' ? 'Authentication failure: direct root login is locked on this Mint workstation; use sudo su -' : 'Authentication failure: account switches require simulated root authorization');
      if (state.sessions.length >= 16) fail('simulated shell nesting limit reached (16)');
      const user = identity(name);
      const target = login ? fs.directory(user.home) : state.cwd;
      state.sessions.push({user: state.user, cwd: state.cwd, oldpwd: state.oldpwd, shellPid: state.shellPid});
      const pid = state.nextPid++;
      state.processes.push(processRecord(pid, state.shellPid, user.uid, 'bash', {tty: 'pts/0', command: login ? '-bash' : 'bash'}));
      state.shellPid = pid; state.user = user;
      if (login) { state.cwd = target; state.oldpwd = null; }
      return '';
    }],
    ['exit', args => {
      if (args.length) fail('usage: exit');
      if (!state.sessions.length) return 'Already in the original student shell. Close this page to leave the simulator.\n';
      state.processes = state.processes.filter(p => p.pid !== state.shellPid);
      Object.assign(state, state.sessions.pop());
      return '';
    }],
    ['ps', args => {
      if (args.length > 1 || (args.length && !['-e', '-ef', 'aux'].includes(args[0]))) fail('usage: ps | ps -e | ps -ef | ps aux');
      let processes = state.processes;
      if (!args.length) processes = processes.filter(p => p.uid === fs.user.uid && p.tty === 'pts/0');
      if (args[0] === 'aux') return 'USER         PID %CPU %MEM   RSS TTY      STAT TIME COMMAND\n' + processes.map(p => `${nameOf(p.uid).padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${(p.rssKiB / state.system.memoryKiB * 100).toFixed(1).padStart(4)} ${String(p.rssKiB).padStart(6)} ${p.tty.padEnd(8)} ${p.state.padEnd(4)} ${duration(p.seconds)} ${p.command}`).join('\n') + '\n';
      if (args[0] === '-ef') return 'UID          PID  PPID C TTY      TIME CMD\n' + processes.map(p => `${nameOf(p.uid).padEnd(10)} ${String(p.pid).padStart(5)} ${String(p.ppid).padStart(5)} ${Math.round(p.cpu)} ${p.tty.padEnd(8)} ${duration(p.seconds)} ${p.command}`).join('\n') + '\n';
      return '  PID TTY      TIME CMD\n' + processes.map(p => `${String(p.pid).padStart(5)} ${p.tty.padEnd(8)} ${duration(p.seconds)} ${p.name}`).join('\n') + '\n';
    }],
    ['top', args => {
      if (args.length && (args.length !== 3 || args[0] !== '-b' || args[1] !== '-n' || args[2] !== '1')) fail('usage: top | top -b -n 1');
      if (!args.length) shell.action = 'top';
      return topSnapshot(state);
    }],
    ['du', args => {
      const {flags, operands} = options(args, 'hs'), out = [];
      shell.each(operands.length ? operands : ['.'], input => {
        const start = fs.resolve(input);
        const walk = (path, label) => {
          const node = state.nodes[path]; let bytes = allocatedBytes(node);
          if (node.type === 'directory') {
            try { fs.require(node, 5, label); }
            catch (error) { if (!(error instanceof LinuxError)) throw error; shell.errors.push(error.message); return 0; }
            for (const child of fs.children(path)) bytes += walk(child, label.replace(/\/$/, '') + '/' + baseName(child));
            if (!flags.has('s')) out.push(`${flags.has('h') ? human(bytes) : bytes / 1024}\t${label}`);
          }
          return bytes;
        };
        const bytes = walk(start, input);
        if (flags.has('s') || state.nodes[start].type === 'file') out.push(`${flags.has('h') ? human(bytes) : bytes / 1024}\t${input}`);
      });
      return out.length ? out.join('\n') + '\n' : '';
    }],
    ['df', args => {
      const {flags, operands} = options(args, 'h'), selected = [];
      if (operands.length) shell.each(operands, input => selected.push(volumeFor(state, fs.resolve(input))));
      else selected.push(...state.volumes.filter(v => v.mountPoint));
      const fmt = bytes => flags.has('h') ? human(bytes) : String(bytes / 1024);
      return `Filesystem     ${flags.has('h') ? 'Size' : '1K-blocks'} Used Available Use% Mounted on\n` + [...new Set(selected)].map(v => {
        const used = volumeUsed(state, v);
        return `${v.device} ${fmt(v.capacity)} ${fmt(used)} ${fmt(v.capacity - used)} ${Math.ceil(used / v.capacity * 100)}% ${v.mountPoint}`;
      }).join('\n') + (selected.length ? '\n' : '');
    }],
    ['mount', args => {
      if (!args.length) return state.volumes.filter(v => v.mountPoint).map(v => `${v.device} on ${v.mountPoint} type ${v.type} (rw,relatime)`).join('\n') + '\n';
      admin(shell);
      const {operands} = options(args, '');
      if (operands.length !== 2) fail('usage: mount DEVICE DIRECTORY');
      const volume = state.volumes.find(v => v.device === operands[0]);
      if (!volume) fail(`${operands[0]}: unknown simulated device`);
      if (volume.mountPoint) fail(`${volume.device}: already mounted on ${volume.mountPoint}`);
      const path = fs.directory(operands[1]);
      if (path !== '/mnt/training-disk') fail('simulator supports this volume only at /mnt/training-disk');
      if (fs.children(path).length) fail(`${path}: simulator requires an empty mount point`);
      if ([state, ...state.sessions].some(s => within(s.cwd, path))) fail(`${path}: Device or resource busy`);
      if (Object.keys(state.nodes).length + Object.keys(volume.nodes).length - 1 > 5000) fail('simulated filesystem entry limit reached (5000)');
      volume.coveredNode = state.nodes[path];
      for (const [key, node] of Object.entries(volume.nodes)) state.nodes[key === '/' ? path : path + key] = node;
      volume.mountPoint = path; volume.nodes = {};
      return '';
    }],
    ['umount', args => {
      admin(shell);
      const {operands} = options(args, '');
      if (operands.length !== 1) fail('usage: umount DEVICE|DIRECTORY');
      const input = operands[0];
      const volume = state.volumes.find(v => v.device === input || v.mountPoint === (input.replace(/\/+$/, '') || '/'));
      if (!volume || !volume.mountPoint) fail(`${input}: not mounted`);
      if (volume.mountPoint === '/') fail('simulator safety: cannot unmount the root filesystem');
      const path = volume.mountPoint;
      if ([state, ...state.sessions].some(s => within(s.cwd, path))) fail(`${path}: target is busy; cd outside the filesystem first`);
      const entries = volumeEntries(state, volume); volume.nodes = Object.create(null);
      for (const [key, node] of entries) { volume.nodes[key === path ? '/' : key.slice(path.length)] = node; delete state.nodes[key]; }
      state.nodes[path] = volume.coveredNode; volume.coveredNode = null; volume.mountPoint = null;
      for (const session of [state, ...state.sessions]) if (session.oldpwd && within(session.oldpwd, path)) session.oldpwd = null;
      return '';
    }],
    ['fsck', args => {
      admin(shell);
      if (args.length !== 2 || args[0] !== '-n') fail('only read-only inspection is modeled; usage: fsck -n DEVICE. Repair is not supported');
      const volume = state.volumes.find(v => v.device === args[1]);
      if (!volume) fail(`${args[1]}: unknown simulated device; no filesystem recognized`);
      if (volume.mountPoint) fail(`${volume.device}: mounted on ${volume.mountPoint}; unmount before inspection in this simulator`);
      const entries = volumeEntries(state, volume);
      const consistent = volume.nodes['/']?.type === 'directory' && entries.every(([path, node]) =>
        ['directory', 'file'].includes(node.type) && Number.isInteger(node.mode) && node.mode >= 0 && node.mode <= 0o7777
        && (path === '/' || volume.nodes[parentPath(path)]?.type === 'directory')) && volumeUsed(state, volume) <= volume.capacity;
      if (!consistent) shell.commandStatus = 4;
      const blocks = (volumeUsed(state, volume) - volume.baseUsed) / 1024;
      return `fsck: simulated ext4 read-only inspection (-n)\n${volume.device}: recognized ${volume.type} filesystem (${volume.label})\nDirectory and parent metadata: ${consistent ? 'consistent' : 'inconsistent'}\n${entries.filter(([, n]) => n.type === 'file').length} files, ${entries.filter(([, n]) => n.type === 'directory').length} directories, ${blocks} modeled 1-KiB data blocks\n${consistent ? 'No errors found in modeled metadata.' : 'Errors remain in modeled metadata; repairs are unsupported.'} No changes made.\n`;
    }]
  ];
}
