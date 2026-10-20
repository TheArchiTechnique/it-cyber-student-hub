import {restoreGuided} from './guided.mjs';
import {seedNetwork, restoreNetwork} from './network-state.mjs';
import {seedPackages, restorePackages} from './packages.mjs';
import {seedSystem, accounts, identity, volumeUsed} from './system-state.mjs';
import {seedFilesystem, parentPath} from './filesystem.mjs';
export const STORAGE_KEY = 'student-hub:linux-terminal:v1';
export const PROFILE_KEY = 'student-hub:linux-terminal:profile';
export const profiles = Object.freeze({mint: 'Linux Mint', fedora: 'Fedora DNF practice'});
export function freshState(profile = 'mint') {
  if (!Object.hasOwn(profiles, profile)) throw Error('Invalid workstation profile');
  return {
    version: 4, hostname: 'student-linux', distribution: profile,
    user: {name: 'student', uid: 1000, gid: 1000, groups: [1000], home: '/home/student'},
    cwd: '/home/student', oldpwd: null, umask: 0o022, lastStatus: 0,
    nodes: (() => { const nodes = seedFilesystem(); nodes['/mnt/training-disk'] = {...nodes['/mnt']};
      nodes['/etc/os-release'] = {...nodes['/etc/hosts'], content: profile === 'mint' ? 'NAME="Linux Mint (simulated)"\nID=linuxmint\nID_LIKE="ubuntu debian"\n' : 'NAME="Fedora DNF practice (simulated)"\nID=fedora\n'}; return nodes; })(), history: [], progress: {},
    ...seedSystem(Date.now(), profile),
    network: seedNetwork(), packages: seedPackages(profile)
  };
}
const validPath = path => typeof path === 'string' && path.startsWith('/') && !path.includes('\0')
  && path.length < 8192 && (path === '/' || (!path.endsWith('/') && path.split('/').slice(1).every(p => p && p !== '.' && p !== '..' && p.length <= 255)));

function validateNodes(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid filesystem');
  const entries = Object.entries(input);
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
  if (nodes['/']?.type !== 'directory') throw Error('Missing workstation directories');
  for (const path of Object.keys(nodes)) {
    if (path !== '/' && nodes[parentPath(path)]?.type !== 'directory') throw Error('Orphaned filesystem entry');
  }
  return nodes;
}
const validUser = user => user && Object.hasOwn(accounts, user.name) && ['uid', 'gid', 'home'].every(key => user[key] === accounts[user.name][key]) && Array.isArray(user.groups) && user.groups.length === 1 && user.groups[0] === user.gid;
const validDirectory = (state, path) => validPath(path) && state.nodes[path]?.type === 'directory';
export function restoreState(value, expectedProfile = null) {
  if (!value || ![1, 2, 3, 4].includes(value.version)) throw Error('Invalid state version');
  const profile = value.version < 4 ? 'mint' : value.distribution;
  if (!Object.hasOwn(profiles, profile) || (expectedProfile !== null && expectedProfile !== profile)) throw Error('Invalid workstation profile');
  const nodes = validateNodes(value.nodes);
  if (nodes['/home/student']?.type !== 'directory') throw Error('Missing workstation directories');
  if (!validPath(value.cwd) || (value.oldpwd !== null && !validPath(value.oldpwd))
    || value.hostname !== 'student-linux' || value.distribution !== profile
    || (value.version < 3 ? value.user?.uid !== 1000 || value.user?.name !== 'student' : !validUser(value.user))
    || !Array.isArray(value.history) || value.history.length > 200
    || !value.history.every(line => typeof line === 'string' && line.length <= 8192)
    || !Number.isInteger(value.lastStatus) || value.lastStatus < 0 || value.lastStatus > 255) throw Error('Invalid shell session');
  const state = freshState(profile);
  const progress = value.progress ?? {};
  if (typeof progress !== 'object' || Array.isArray(progress) || JSON.stringify(progress).length > 16000) throw Error('Invalid progress data');
  Object.assign(state, {nodes, cwd: value.cwd, oldpwd: value.oldpwd, history: [...value.history], lastStatus: value.lastStatus, progress: JSON.parse(JSON.stringify(progress))});
  const guided = restoreGuided(progress.guided, profile);
  if (guided) state.progress.guided = guided;
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
  if (value.version < 3) {
    const seed = seedFilesystem();
    if (!nodes['/mnt/training-disk'] && nodes['/mnt']?.type === 'directory' && Object.keys(nodes).length < 5000) nodes['/mnt/training-disk'] = {...seed['/mnt']};
  } else restoreSystem(state, value);
  if (value.version < 4) {
    if (!nodes['/etc/os-release'] && nodes['/etc']?.type === 'directory' && Object.keys(nodes).length < 5000) nodes['/etc/os-release'] = freshState(profile).nodes['/etc/os-release'];
  } else { state.network = restoreNetwork(value.network); state.packages = restorePackages(value.packages, profile); }
  return state;
}

function restoreSystem(state, value) {
  const invalid = () => { throw Error('Invalid system metadata'); };
  if (!value.policy || !Array.isArray(value.policy.sudoUsers) || value.policy.sudoUsers.length > 2 || !value.policy.sudoUsers.every(name => Object.hasOwn(accounts, name)) || value.policy.rootLocked !== true) invalid();
  if (!Array.isArray(value.sessions) || value.sessions.length > 16 || !Number.isInteger(value.shellPid) || !Number.isInteger(value.nextPid) || value.nextPid <= value.shellPid) invalid();
  const contexts = [...value.sessions, value];
  for (const session of contexts) if (!validUser(session.user) || !validDirectory(state, session.cwd) || (session.oldpwd !== null && !validDirectory(state, session.oldpwd)) || !Number.isInteger(session.shellPid)) invalid();
  if (contexts[0].user.name !== 'student' || contexts[0].shellPid !== 1042) invalid();
  if (!Array.isArray(value.processes) || value.processes.length < 4 || value.processes.length > 20) invalid();
  const pids = new Set();
  for (const p of value.processes) {
    if (!p || !Number.isInteger(p.pid) || p.pid < 1 || p.pid >= value.nextPid || pids.has(p.pid) || !Number.isInteger(p.ppid) || p.ppid < 0 || ![0, 1000].includes(p.uid) || !['S', 'R'].includes(p.state)
      || !['name', 'command', 'tty'].every(key => typeof p[key] === 'string' && p[key].length <= 256 && !/[\x00-\x1f]/.test(p[key]))
      || ![p.cpu, p.rssKiB, p.seconds].every(n => Number.isFinite(n) && n >= 0) || p.cpu > 100 || p.rssKiB > state.system.memoryKiB) invalid();
    pids.add(p.pid);
  }
  for (const p of value.processes) if (p.ppid && !pids.has(p.ppid)) invalid();
  if (new Set(contexts.map(s => s.shellPid)).size !== contexts.length) invalid();
  for (const session of contexts) if (!value.processes.some(p => p.pid === session.shellPid && p.uid === session.user.uid && p.name === 'bash')) invalid();
  if (value.processes.filter(p => p.name === 'bash').length !== contexts.length) invalid();
  if (value.processes.reduce((sum, p) => sum + p.cpu, 0) > 100 || value.processes.reduce((sum, p) => sum + p.rssKiB, 0) + state.system.buffersKiB + state.system.cacheKiB > state.system.memoryKiB) invalid();
  if (!value.system || Object.keys(state.system).some(key => value.system[key] !== state.system[key])) invalid();
  if (!Array.isArray(value.volumes) || value.volumes.length !== 2) invalid();
  const volumes = value.volumes.map((v, index) => {
    const seed = state.volumes[index];
    if (!v || ['device', 'type', 'label', 'capacity', 'baseUsed'].some(key => v[key] !== seed[key])) invalid();
    if (index === 0 && (v.mountPoint !== '/' || Object.keys(v.nodes || {}).length || v.coveredNode !== null)) invalid();
    if (index === 1 && ![null, '/mnt/training-disk'].includes(v.mountPoint)) invalid();
    let detached = {}, coveredNode = null;
    if (!v.mountPoint) {
      detached = validateNodes(v.nodes);
      if (v.coveredNode !== null) invalid();
    } else if (index === 1) {
      if (!validDirectory(state, v.mountPoint) || Object.keys(v.nodes || {}).length) invalid();
      coveredNode = validateNodes({'/': v.coveredNode})['/'];
    }
    return {...seed, mountPoint: v.mountPoint, nodes: detached, coveredNode};
  });
  Object.assign(state, {user: identity(value.user.name), sessions: value.sessions.map(s => ({user: identity(s.user.name), cwd: s.cwd, oldpwd: s.oldpwd, shellPid: s.shellPid})),
    shellPid: value.shellPid, nextPid: value.nextPid, processes: value.processes.map(p => ({...p})), policy: {sudoUsers: [...value.policy.sudoUsers], rootLocked: true}, volumes});
  for (const volume of volumes) if (volumeUsed(state, volume) > volume.capacity) invalid();
}

export class StateStore {
  constructor(storage, profile = 'mint') { this.storage = storage; this.profile = profile; this.key = profile === 'mint' ? STORAGE_KEY : 'student-hub:linux-terminal:fedora:v1'; this.message = ''; }
  load() {
    try {
      const saved = this.storage.getItem(this.key);
      if (saved === null) return freshState(this.profile);
      if (saved.length > 8_000_000) throw Error('Saved data too large');
      return restoreState(JSON.parse(saved), this.profile);
    } catch {
      this.message = 'Saved workstation could not be loaded. A fresh session is open; saving will be retried after your next command.';
      return freshState(this.profile);
    }
  }
  save(state) {
    try {
      const saved = JSON.stringify(state);
      if (saved.length > 8_000_000) throw Error('Saved data too large');
      this.storage.setItem(this.key, saved);
      this.message = 'Workstation saved in this browser.'; return true;
    } catch {
      this.message = 'Browser saving is unavailable or full. Keep this page open to retain your current files.'; return false;
    }
  }
  reset() {
    // Only our namespaced key is replaced; unrelated Hub data is untouched.
    const state = freshState(this.profile); this.save(state); return state;
  }
}

// One shell engine, independently saved operating-system profiles. Unsaved in-memory
// checkpoints stay available when switching profiles with blocked/full browser storage.
export class ProfileStore {
  constructor(storage) {
    this.storage = storage; this.profile = 'mint'; this.cache = new Map(); this.message = '';
    try { const selected = storage.getItem(PROFILE_KEY); if (Object.hasOwn(profiles, selected)) this.profile = selected; } catch { /* StateStore supplies the storage notice. */ }
    this.current = new StateStore(storage, this.profile);
  }
  load() {
    const state = this.cache.get(this.profile) || this.current.load();
    this.cache.set(this.profile, state); this.message = this.current.message; return state;
  }
  save(state) {
    if (state.distribution !== this.profile) throw Error('Profile checkpoint mismatch');
    this.cache.set(this.profile, state);
    const saved = this.current.save(state); this.message = this.current.message; return saved;
  }
  switch(profile, state) {
    if (!Object.hasOwn(profiles, profile)) throw Error('Invalid workstation profile');
    const saved = this.save(state);
    this.profile = profile; this.current = new StateStore(this.storage, profile);
    const next = this.load();
    let selected = true;
    try { this.storage.setItem(PROFILE_KEY, profile); } catch { selected = false; }
    if (!saved || !selected) this.message = 'Profile switched in memory. Browser saving is unavailable or full; keep this page open to retain both workstations.';
    return next;
  }
  reset() {
    const state = this.current.reset(); this.cache.set(this.profile, state); this.message = this.current.message; return state;
  }
}
