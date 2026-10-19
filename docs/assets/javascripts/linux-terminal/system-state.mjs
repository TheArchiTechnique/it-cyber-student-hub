// Fictional workstation metadata. No host measurements or OS calls are used.
export const accounts = Object.freeze({
  student: {name: 'student', uid: 1000, gid: 1000, groups: [1000], home: '/home/student'},
  root: {name: 'root', uid: 0, gid: 0, groups: [0], home: '/root'}
});
export const identity = name => ({...accounts[name], groups: [...accounts[name].groups]});
export const within = (path, ancestor) => path === ancestor || path.startsWith(ancestor === '/' ? '/' : ancestor + '/');
export const allocatedBytes = node => node.type === 'file' ? Math.ceil(new TextEncoder().encode(node.content).length / 1024) * 1024 : 0;
export function processRecord(pid, ppid, uid, name, extra = {}) {
  return {pid, ppid, uid, name, command: name, cpu: 0, rssKiB: 4096, state: 'S', tty: '?', seconds: 1, ...extra};
}
export function seedSystem(now = Date.now()) {
  const dir = (uid = 0) => ({type: 'directory', uid, gid: uid, mode: 0o755, atime: now, mtime: now, ctime: now});
  const content = 'Training volume: keep support reports in Reports.\n';
  return {
    policy: {sudoUsers: ['student'], rootLocked: true}, sessions: [], shellPid: 1042, nextPid: 1043,
    processes: [
      processRecord(1, 0, 0, 'systemd', {command: '/sbin/init', rssKiB: 12288, seconds: 3}),
      processRecord(612, 1, 0, 'NetworkManager', {command: '/usr/sbin/NetworkManager --no-daemon', cpu: 0.1, rssKiB: 24576}),
      processRecord(1001, 1, 1000, 'cinnamon', {cpu: 1.2, rssKiB: 196608, state: 'R', seconds: 20}),
      processRecord(1042, 1001, 1000, 'bash', {tty: 'pts/0', command: '-bash'})
    ],
    system: {uptimeSeconds: 7260, memoryKiB: 4194304, buffersKiB: 524288, cacheKiB: 786432},
    volumes: [
      {device: '/dev/sda1', type: 'ext4', label: 'mint-root', capacity: 32 * 1024 ** 3, baseUsed: 4 * 1024 ** 3, mountPoint: '/', nodes: {}, coveredNode: null},
      {device: '/dev/sdb1', type: 'ext4', label: 'training-disk', capacity: 1024 ** 3, baseUsed: 1024 ** 2, mountPoint: null, coveredNode: null,
        nodes: {'/': dir(), '/Reports': dir(1000), '/README.txt': {...dir(), type: 'file', mode: 0o644, content}}}
    ]
  };
}
export function volumeFor(state, path) {
  return state.volumes.filter(volume => volume.mountPoint && within(path, volume.mountPoint))
    .sort((a, b) => b.mountPoint.length - a.mountPoint.length)[0];
}
export function volumeEntries(state, volume) {
  return volume.mountPoint ? Object.entries(state.nodes).filter(([path]) => volumeFor(state, path) === volume) : Object.entries(volume.nodes);
}
export const volumeUsed = (state, volume) => volume.baseUsed + volumeEntries(state, volume).reduce((sum, [, node]) => sum + allocatedBytes(node), 0);
export const nodeCount = state => Object.keys(state.nodes).length + state.volumes.filter(v => !v.mountPoint).reduce((sum, v) => sum + Object.keys(v.nodes).length, 0);
