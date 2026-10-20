import {allocatedBytes, volumeFor, volumeUsed, nodeCount, within} from './system-state.mjs';
// All paths and metadata belong to this in-memory workstation, never the host.
export class LinuxError extends Error {}
const fail = message => { throw new LinuxError(message); };
export const parentPath = path => path.slice(0, path.lastIndexOf('/')) || '/';
export const baseName = path => path.slice(path.lastIndexOf('/') + 1) || '/';
const inside = (path, ancestor) => path === ancestor || path.startsWith(ancestor === '/' ? '/' : ancestor + '/');
const foundations = new Set(['/', '/home', '/home/student', '/etc', '/var', '/var/log', '/usr', '/usr/bin', '/mnt', '/dev', '/tmp', '/root']);
export function seedFilesystem(now = Date.now()) {
  const nodes = Object.create(null);
  const directory = (path, uid = 0, mode = 0o755) => {
    nodes[path] = {type: 'directory', uid, gid: uid, mode, atime: now, mtime: now, ctime: now};
  };
  const file = (path, content, uid = 0, mode = 0o644) => {
    nodes[path] = {type: 'file', content, uid, gid: uid, mode, atime: now, mtime: now, ctime: now};
  };
  for (const path of ['/', '/home', '/etc', '/var', '/var/log', '/usr', '/usr/bin', '/mnt', '/dev']) directory(path);
  directory('/tmp', 0, 0o1777);
  directory('/root', 0, 0o700);
  for (const path of ['/home/student', '/home/student/Documents', '/home/student/Downloads', '/home/student/Practice']) directory(path, 1000);
  file('/home/student/welcome.txt', 'Welcome to student-linux.\nKeep your support files in your home directory.\nTry man ls, then explore Documents and /var/log.\n', 1000);
  file('/home/student/.bashrc', '# Simulated Bash configuration\n# Shell startup scripts are not executed here.\n', 1000);
  file('/home/student/Documents/ticket.txt', 'Ticket 1042: Prepare a Linux workstation support report.\nRecord the workstation name and organize your notes in Practice.\n', 1000);
  file('/home/student/Downloads/checklist.txt', 'Inspect the workstation\nCreate a report directory\nWrite and verify support notes\n', 1000);
  file('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\n');
  file('/etc/shadow', 'root:!:20000:0:99999:7:::\nstudent:!:20000:0:99999:7:::\n', 0, 0o640);
  file('/etc/hosts', '127.0.0.1 localhost\n127.0.1.1 student-linux\n192.0.2.20 files.training.example\n');
  file('/etc/fstab', '# Fictional workstation mounts\nUUID=training-root / ext4 defaults 0 1\n');
  file('/etc/resolv.conf', 'nameserver 192.0.2.53\nsearch training.example\n');
  file('/var/log/support.log', 'Oct 19 09:00:00 student-linux support: workstation ready\nOct 19 09:05:00 student-linux support: ticket 1042 opened\n');
  file('/var/log/application.log', '2026-10-19 09:00 INFO Report service started\n2026-10-19 09:06 ERROR Missing report configuration\n2026-10-19 09:07 warning Retrying report service\n2026-10-19 09:08 error Report directory unavailable\n');
  file('/var/log/auth.log', 'Oct 19 08:58 student-linux login: session opened for student\nOct 19 09:03 student-linux login: authentication failure for guest\nOct 19 09:04 student-linux login: session closed for guest\n');
  return nodes;
}

export class VirtualFilesystem {
  constructor(state, clock = Date.now, actor = null) { this.state = state; this.clock = clock; this.actor = actor; }
  get user() { return this.actor || this.state.user; }
  asUser(user, run) { const previous = this.actor; this.actor = user; try { return run(); } finally { this.actor = previous; } }
  get nodes() { return this.state.nodes; }
  can(node, bits) {
    const user = this.user;
    if (user.uid === 0) return true;
    const shift = user.uid === node.uid ? 6 : user.groups.includes(node.gid) ? 3 : 0;
    return (((node.mode >> shift) & 7) & bits) === bits;
  }
  require(node, bits, display) {
    if (!this.can(node, bits)) fail(`${display}: Permission denied`);
  }
  // Resolve one component at a time so inaccessible/foo/.. cannot bypass search permission.
  resolve(input, {missingLeaf = false} = {}) {
    if (typeof input !== 'string' || !input || input.includes('\0')) fail(`${input || ''}: No such file or directory`);
    let path = input.startsWith('/') ? '/' : this.state.cwd;
    const parts = input.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const current = this.nodes[path];
      if (!current) fail(`${input}: No such file or directory`);
      if (current.type !== 'directory') fail(`${input}: Not a directory`);
      this.require(current, 1, input);
      const part = parts[i];
      if (part === '.') continue;
      if (part === '..') { path = parentPath(path); continue; }
      if (part.length > 255) fail(`${input}: File name too long`);
      path = path === '/' ? '/' + part : path + '/' + part;
      if (path.length >= 8192) fail(`${input}: File name too long`);
      if (!this.nodes[path] && !(missingLeaf && i === parts.length - 1 && !input.endsWith('/'))) fail(`${input}: No such file or directory`);
    }
    if (input.endsWith('/') && this.nodes[path]?.type !== 'directory') fail(`${input}: Not a directory`);
    return path;
  }
  directory(input) {
    const path = this.resolve(input), node = this.nodes[path];
    if (node.type !== 'directory') fail(`${input}: Not a directory`);
    this.require(node, 1, input);
    return path;
  }
  list(input = '.') {
    const path = this.resolve(input), node = this.nodes[path];
    if (node.type !== 'directory') fail(`${input}: Not a directory`);
    this.require(node, 4, input);
    return Object.keys(this.nodes).filter(key => key !== '/' && parentPath(key) === path).sort();
  }
  read(input) {
    const path = this.resolve(input), node = this.nodes[path];
    if (node.type === 'directory') fail(`${input}: Is a directory`);
    this.require(node, 4, input);
    node.atime = this.clock();
    return node.content;
  }
  // Shared write API for shell redirection and the future Nano editor.
  prepareWrite(input) {
    const path = this.resolve(input, {missingLeaf: true}), node = this.nodes[path];
    if (node) {
      if (node.type === 'directory') fail(`${input}: Is a directory`);
      this.require(node, 2, input);
    } else {
      this.require(this.nodes[parentPath(path)], 3, input);
    }
    return path;
  }
  write(input, content, {append = false} = {}) {
    const path = this.prepareWrite(input), existing = this.nodes[path];
    const text = (append && existing ? existing.content : '') + content;
    if (text.length > 1_000_000) fail(`${input}: Simulated file size limit reached (1 MB)`);
    if (!existing && nodeCount(this.state) >= 5000) fail(`${input}: Simulated filesystem entry limit reached (5000)`);
    const volume = volumeFor(this.state, path);
    if (volumeUsed(this.state, volume) - (existing ? allocatedBytes(existing) : 0) + allocatedBytes({type: 'file', content: text}) > volume.capacity) fail(`${input}: No space left on device`);
    const time = this.clock();
    this.nodes[path] = existing || this.newNode('file', 0o644, time);
    Object.assign(this.nodes[path], {content: text, mtime: time, ctime: time});
    if (!existing) this.nodes[parentPath(path)].mtime = time;
    return path;
  }
  newNode(type, mode, time) {
    return {type, uid: this.user.uid, gid: this.user.gid, mode, atime: time, mtime: time, ctime: time};
  }
  touch(input) {
    const path = this.resolve(input, {missingLeaf: true}), node = this.nodes[path], time = this.clock();
    if (!node) { this.write(input, ''); return; }
    // Owner may set current timestamps; otherwise write permission is needed.
    if (this.user.uid !== node.uid) this.require(node, 2, input);
    Object.assign(node, {atime: time, mtime: time, ctime: time});
  }
  mkdir(input, parents = false) {
    if (!input) fail('missing operand');
    if (parents) {
      let path = input.startsWith('/') ? '/' : this.state.cwd;
      for (const part of input.split('/').filter(Boolean)) {
        path = part === '.' ? path : part === '..' ? this.directory(path + '/..') : this.mkdirOne(path + '/' + part, true);
      }
      return;
    }
    this.mkdirOne(input, false);
  }
  mkdirOne(input, existOK) {
    // A trailing slash is valid for a new directory.
    const clean = input.replace(/\/+$/, '') || '/';
    const path = this.resolve(clean, {missingLeaf: true}), node = this.nodes[path];
    if (node) {
      if (existOK && node.type === 'directory') { this.require(node, 1, input); return path; }
      fail(`${input}: File exists`);
    }
    this.require(this.nodes[parentPath(path)], 3, input);
    if (nodeCount(this.state) >= 5000) fail(`${input}: Simulated filesystem entry limit reached (5000)`);
    const time = this.clock();
    this.nodes[path] = this.newNode('directory', 0o755, time);
    this.nodes[parentPath(path)].mtime = time;
    return path;
  }
  children(path) {
    return Object.keys(this.nodes).filter(key => key !== '/' && parentPath(key) === path).sort();
  }
  protect(path, action) {
    if (this.state.volumes.some(v => v.mountPoint && v.mountPoint !== '/' && within(v.mountPoint, path))) fail(`${path}: Device or resource busy (mounted filesystem)`);
    if (this.state.sessions.some(session => within(session.cwd, path))) fail(`${path}: simulator safety: directory belongs to a suspended shell`);
    if (foundations.has(path)) fail(`${path}: simulator safety: cannot ${action} a workstation foundation directory`);
  }
  unlinkPermission(path) {
    const parent = this.nodes[parentPath(path)], node = this.nodes[path], uid = this.user.uid;
    this.require(parent, 3, path);
    if ((parent.mode & 0o1000) && uid !== 0 && uid !== parent.uid && uid !== node.uid) fail(`${path}: Operation not permitted (sticky directory)`);
  }
  destination(source, input) {
    if (!input) fail('destination: No such file or directory');
    const clean = input.replace(/\/+$/, '') || '/';
    const dest = this.resolve(clean, {missingLeaf: true});
    if (input.endsWith('/') && this.nodes[dest]?.type !== 'directory' && (this.nodes[dest] || this.nodes[source].type !== 'directory')) fail(`${input}: Not a directory`);
    return this.nodes[dest]?.type === 'directory' ? this.resolve(dest + '/' + baseName(source), {missingLeaf: true}) : dest;
  }
  copy(sourceInput, destInput, recursive = false) {
    const source = this.resolve(sourceInput), dest = this.destination(source, destInput), node = this.nodes[source];
    if (source === dest) fail(`${sourceInput} and ${destInput}: are the same file`);
    if (node.type === 'directory' && inside(dest, source)) fail(`${sourceInput}: cannot copy a directory into itself`);
    if (node.type === 'directory' && !recursive) fail(`${sourceInput}: omitting directory (use -r)`);
    const copyEntry = (from, to) => {
      const original = this.nodes[this.resolve(from)], existing = this.nodes[to];
      if (original.type === 'file') {
        const content = this.read(from);
        this.write(to, content);
        if (!existing) this.nodes[to].mode = original.mode & 0o777 & ~this.state.umask;
        return;
      }
      this.require(original, 5, from);
      if (existing && existing.type !== 'directory') fail(`${to}: Not a directory`);
      if (!existing) this.mkdirOne(to, false);
      // New directories stay writable during traversal, then receive source permissions.
      try { for (const child of this.children(from)) copyEntry(child, to + '/' + baseName(child)); }
      finally { if (!existing) this.nodes[to].mode = original.mode & 0o777 & ~this.state.umask; }
    };
    copyEntry(source, dest);
  }
  move(sourceInput, destInput) {
    const source = this.resolve(sourceInput), dest = this.destination(source, destInput), node = this.nodes[source], target = this.nodes[dest];
    if (source === dest) fail(`${sourceInput} and ${destInput}: are the same file`);
    this.protect(source, 'move'); this.protect(dest, 'replace');
    if (node.type === 'directory' && inside(dest, source)) fail(`${sourceInput}: cannot move a directory into itself`);
    this.unlinkPermission(source);
    this.require(this.nodes[parentPath(dest)], 3, dest);
    if (target) {
      this.unlinkPermission(dest);
      if (node.type !== target.type) fail(`${dest}: cannot replace a ${target.type} with a ${node.type}`);
      if (target.type === 'directory') {
        if (this.children(dest).length) fail(`${dest}: Directory not empty`);
        if (inside(this.state.cwd, dest)) fail(`${dest}: simulator safety: cannot replace the current working directory`);
      }
    }
    const subtree = Object.keys(this.nodes).filter(path => inside(path, source));
    const fromVolume = volumeFor(this.state, source), toVolume = volumeFor(this.state, dest);
    if (fromVolume !== toVolume && volumeUsed(this.state, toVolume) + subtree.reduce((sum, path) => sum + allocatedBytes(this.nodes[path]), 0) - (target ? allocatedBytes(target) : 0) > toVolume.capacity) fail(`${dest}: No space left on device`);
    const moved = subtree.map(path => [path, dest + path.slice(source.length)]);
    if (moved.some(([, path]) => path.length >= 8192)) fail(`${dest}: File name too long`);
    const time = this.clock();
    if (target && this.state.oldpwd && inside(this.state.oldpwd, dest)) this.state.oldpwd = null;
    if (target) delete this.nodes[dest];
    for (const [from, to] of moved) this.nodes[to] = this.nodes[from];
    for (const [from] of moved) delete this.nodes[from];
    this.nodes[dest].ctime = time;
    for (const session of this.state.sessions) for (const field of ['cwd', 'oldpwd']) if (session[field] && inside(session[field], source)) session[field] = dest + session[field].slice(source.length);
    for (const field of ['cwd', 'oldpwd']) if (this.state[field] && inside(this.state[field], source)) this.state[field] = dest + this.state[field].slice(source.length);
    this.nodes[parentPath(source)].mtime = time; this.nodes[parentPath(dest)].mtime = time;
  }
  remove(input, {recursive = false, force = false} = {}) {
    if (['.', '..'].includes(baseName(input.replace(/\/+$/, '')))) fail(`${input}: refusing to remove '.' or '..' directory`);
    let path;
    try { path = this.resolve(input); }
    catch (error) { if (force && error instanceof LinuxError && /: No such file or directory$/.test(error.message)) return; throw error; }
    this.protect(path, 'remove');
    if (inside(this.state.cwd, path)) fail(`${input}: simulator safety: cannot remove the current directory or an ancestor; cd elsewhere first`);
    const planned = [];
    const inspect = key => {
      this.protect(key, 'remove'); this.unlinkPermission(key);
      const node = this.nodes[key];
      if (node.type === 'directory') {
        if (!recursive) fail(`${input}: Is a directory (use -r)`);
        this.require(node, 5, key);
        for (const child of this.children(key)) inspect(child);
      }
      planned.push(key);
    };
    // Preflight each operand before removal so denied subtrees remain recoverable.
    inspect(path);
    for (const key of planned) delete this.nodes[key];
    if (this.state.oldpwd && inside(this.state.oldpwd, path)) this.state.oldpwd = null;
    for (const session of this.state.sessions) if (session.oldpwd && inside(session.oldpwd, path)) session.oldpwd = null;
    this.nodes[parentPath(path)].mtime = this.clock();
  }
  chmod(input, specification) {
    const path = this.resolve(input), node = this.nodes[path];
    if (this.user.uid !== 0 && this.user.uid !== node.uid) fail(`${input}: Operation not permitted`);
    let mode = node.mode;
    if (/^[0-7]{3,4}$/.test(specification)) mode = Number.parseInt(specification, 8);
    else {
      for (const clause of specification.split(',')) {
        const match = clause.match(/^([ugoa]+)([+=-])([rwx]+)$/);
        if (!match) fail(`${specification}: unsupported mode; use numeric permissions or explicit u/g/o/a with +, -, = and rwx`);
        const who = match[1].includes('a') ? 'ugo' : match[1];
        const value = (match[3].includes('r') ? 4 : 0) | (match[3].includes('w') ? 2 : 0) | (match[3].includes('x') ? 1 : 0);
        for (const [category, shift] of [['u', 6], ['g', 3], ['o', 0]]) if (who.includes(category)) {
          const bits = value << shift;
          mode = match[2] === '+' ? mode | bits : match[2] === '-' ? mode & ~bits : (mode & ~(7 << shift)) | bits;
        }
      }
    }
    node.mode = mode; node.ctime = this.clock();
  }
  chown(input, uid, gid = null) {
    const path = this.resolve(input), node = this.nodes[path], actor = this.user;
    if (actor.uid !== 0 && (actor.uid !== node.uid || uid !== node.uid || (gid !== null && !actor.groups.includes(gid)))) fail(`${input}: Operation not permitted`);
    if (node.uid !== uid || (gid !== null && node.gid !== gid)) node.mode &= ~0o6000;
    node.uid = uid; if (gid !== null) node.gid = gid; node.ctime = this.clock();
  }
}

export function modeText(node) {
  let out = node.type === 'directory' ? 'd' : '-';
  for (let shift = 6; shift >= 0; shift -= 3) {
    const bits = (node.mode >> shift) & 7;
    out += (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + (bits & 1 ? 'x' : '-');
  }
  if (node.mode & 0o1000) out = out.slice(0, -1) + (node.mode & 1 ? 't' : 'T');
  if (node.mode & 0o4000) out = out.slice(0, 3) + (node.mode & 0o100 ? 's' : 'S') + out.slice(4);
  if (node.mode & 0o2000) out = out.slice(0, 6) + (node.mode & 0o010 ? 's' : 'S') + out.slice(7);
  return out;
}
