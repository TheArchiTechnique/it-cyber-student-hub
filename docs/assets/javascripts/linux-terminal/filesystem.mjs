// All paths and metadata belong to this in-memory workstation, never the host.
export class LinuxError extends Error {}
const fail = message => { throw new LinuxError(message); };
export const parentPath = path => path.slice(0, path.lastIndexOf('/')) || '/';
export const baseName = path => path.slice(path.lastIndexOf('/') + 1) || '/';
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
  return nodes;
}

export class VirtualFilesystem {
  constructor(state, clock = Date.now) { this.state = state; this.clock = clock; }
  get nodes() { return this.state.nodes; }
  can(node, bits) {
    const user = this.state.user;
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
    const path = this.directory(input), node = this.nodes[path];
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
    if (!existing && Object.keys(this.nodes).length >= 5000) fail(`${input}: Simulated filesystem entry limit reached (5000)`);
    const time = this.clock();
    this.nodes[path] = existing || this.newNode('file', 0o644, time);
    Object.assign(this.nodes[path], {content: text, mtime: time, ctime: time});
    if (!existing) this.nodes[parentPath(path)].mtime = time;
    return path;
  }
  newNode(type, mode, time) {
    return {type, uid: this.state.user.uid, gid: this.state.user.gid, mode, atime: time, mtime: time, ctime: time};
  }
  touch(input) {
    const path = this.resolve(input, {missingLeaf: true}), node = this.nodes[path], time = this.clock();
    if (!node) { this.write(input, ''); return; }
    // Owner may set current timestamps; otherwise write permission is needed.
    if (this.state.user.uid !== node.uid) this.require(node, 2, input);
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
    if (Object.keys(this.nodes).length >= 5000) fail(`${input}: Simulated filesystem entry limit reached (5000)`);
    const time = this.clock();
    this.nodes[path] = this.newNode('directory', 0o755, time);
    this.nodes[parentPath(path)].mtime = time;
    return path;
  }
}

export function modeText(node) {
  let out = node.type === 'directory' ? 'd' : '-';
  for (let shift = 6; shift >= 0; shift -= 3) {
    const bits = (node.mode >> shift) & 7;
    out += (bits & 4 ? 'r' : '-') + (bits & 2 ? 'w' : '-') + (bits & 1 ? 'x' : '-');
  }
  if (node.mode & 0o1000) out = out.slice(0, -1) + (node.mode & 1 ? 't' : 'T');
  return out;
}
