import {seedFilesystem, parentPath} from './filesystem.mjs';
export const STORAGE_KEY = 'student-hub:linux-terminal:v1';
export function freshState() {
  return {
    version: 2, hostname: 'student-linux', distribution: 'mint',
    user: {name: 'student', uid: 1000, gid: 1000, groups: [1000], home: '/home/student'},
    cwd: '/home/student', oldpwd: null, umask: 0o022, lastStatus: 0,
    nodes: seedFilesystem(), history: [], progress: {},
    processes: [{pid: 1, uid: 0, name: 'systemd'}, {pid: 1042, uid: 1000, name: 'bash'}],
    network: {interface: 'enp0s3', address: '192.0.2.10/24', gateway: '192.0.2.1', dns: '192.0.2.53'}
  };
}
const validPath = path => typeof path === 'string' && path.startsWith('/') && !path.includes('\0')
  && path.length < 8192 && (path === '/' || (!path.endsWith('/') && path.split('/').slice(1).every(p => p && p !== '.' && p !== '..' && p.length <= 255)));

export function restoreState(value) {
  if (!value || ![1, 2].includes(value.version) || !value.nodes || typeof value.nodes !== 'object' || Array.isArray(value.nodes)) throw Error('Invalid state version or filesystem');
  const entries = Object.entries(value.nodes);
  if (!entries.length || entries.length > 5000) throw Error('Invalid filesystem size');
  const nodes = Object.create(null);
  for (const [path, node] of entries) {
    if (!validPath(path) || !node || !['file', 'directory'].includes(node.type)
      || !Number.isInteger(node.mode) || node.mode < 0 || node.mode > 0o7777
      || ![node.uid, node.gid].every(n => Number.isInteger(n) && n >= 0)
      || ![node.atime, node.mtime, node.ctime].every(n => Number.isFinite(n) && n >= 0 && n <= 8.64e15)
      || (node.type === 'file' && (typeof node.content !== 'string' || node.content.length > 1_000_000))) throw Error('Invalid filesystem entry');
    nodes[path] = {type: node.type, mode: node.mode, uid: node.uid, gid: node.gid, atime: node.atime, mtime: node.mtime, ctime: node.ctime};
    if (node.type === 'file') nodes[path].content = node.content;
  }
  if (nodes['/']?.type !== 'directory' || nodes['/home/student']?.type !== 'directory') throw Error('Missing workstation directories');
  for (const path of Object.keys(nodes)) {
    if (path !== '/' && nodes[parentPath(path)]?.type !== 'directory') throw Error('Orphaned filesystem entry');
  }
  if (!validPath(value.cwd) || (value.oldpwd !== null && !validPath(value.oldpwd))
    || value.hostname !== 'student-linux' || value.distribution !== 'mint'
    || value.user?.uid !== 1000 || value.user?.name !== 'student'
    || !Array.isArray(value.history) || value.history.length > 200
    || !value.history.every(line => typeof line === 'string' && line.length <= 8192)
    || !Number.isInteger(value.lastStatus) || value.lastStatus < 0 || value.lastStatus > 255) throw Error('Invalid shell session');
  const state = freshState();
  Object.assign(state, {nodes, cwd: value.cwd, oldpwd: value.oldpwd, history: [...value.history], lastStatus: value.lastStatus});
  // A shell may still occupy a directory after chmod removes its search permission.
  // Restore identity/existence, not access; subsequent operations perform access checks.
  if (nodes[state.cwd]?.type !== 'directory') throw Error('Invalid working directory');
  if (state.oldpwd && nodes[state.oldpwd]?.type !== 'directory') throw Error('Invalid previous directory');
  if (value.version === 1) {
    const seed = seedFilesystem();
    for (const path of ['/var/log/application.log', '/var/log/auth.log']) {
      if (!nodes[path] && nodes[parentPath(path)]?.type === 'directory' && Object.keys(nodes).length < 5000) nodes[path] = seed[path];
    }
  }
  return state;
}

export class StateStore {
  constructor(storage) { this.storage = storage; this.message = ''; }
  load() {
    try {
      const saved = this.storage.getItem(STORAGE_KEY);
      if (saved === null) return freshState();
      if (saved.length > 8_000_000) throw Error('Saved data too large');
      return restoreState(JSON.parse(saved));
    } catch {
      this.message = 'Saved workstation could not be loaded. A fresh session is open; saving will be retried after your next command.';
      return freshState();
    }
  }
  save(state) {
    try {
      const saved = JSON.stringify(state);
      if (saved.length > 8_000_000) throw Error('Saved data too large');
      this.storage.setItem(STORAGE_KEY, saved);
      this.message = 'Workstation saved in this browser.'; return true;
    } catch {
      this.message = 'Browser saving is unavailable or full. Keep this page open to retain your current files.'; return false;
    }
  }
  reset() {
    // Only our namespaced key is replaced; unrelated Hub data is untouched.
    const state = freshState(); this.save(state); return state;
  }
}
