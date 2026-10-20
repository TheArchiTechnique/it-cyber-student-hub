import {LinuxError} from './filesystem.mjs';
import {httpResource} from './network-state.mjs';
export function seedPackages(profile = 'mint') {
  const fedora = profile === 'fedora';
  const rows = [
    ['bash', 'Command shell', [], true], ['coreutils', 'Basic file and storage utilities', [], true],
    ['sudo', 'Administrative authorization', [], true], ['nano', 'Small text editor', [], true],
    [fedora ? 'iproute' : 'iproute2', 'IP interface and routing utilities', [], true],
    [fedora ? 'iputils' : 'iputils-ping', 'ICMP connectivity diagnostics', [], true],
    [fedora ? 'procps-ng' : 'procps', 'Process inspection tools', [], true],
    ['util-linux', 'Mounting and filesystem administration', [], true], ['e2fsprogs', 'Ext4 inspection tools', [], true],
    ['findutils', 'File tree searching', [], true], ['grep', 'Text searching', [], true],
    [fedora ? 'bind-utils' : 'dnsutils', 'DNS query utilities including dig', ['dig'], false],
    ['curl', 'HTTP retrieval and service diagnostics', ['curl'], false],
    ['traceroute', 'Trace network hops to a destination', ['traceroute'], false],
    ['support-notes', 'Fictional technician documentation package; no additional command', [], false, false]
  ];
  const manager = fedora ? 'dnf' : 'apt';
  rows.push([manager, 'Native package manager for this practice profile', [], true]);
  return {manager, repository: {name: profile + '-training', url: `http://repo.training.example/${fedora ? 'fedora/repodata' : 'mint/Packages'}`, available: true},
    indexRevision: 0, catalog: rows.map(([name, description, commands, protectedPackage, installed = true]) => ({
      name, description, commands, protected: protectedPackage, installed, version: fedora ? '1.0-1.training' : '1.0-training', available: true
    }))};
}
export function commandUnavailable(state, command) {
  if (['apt', 'dnf'].includes(command) && command !== state.packages.manager) return `${command}: command not found in ${state.distribution === 'mint' ? 'Linux Mint; use APT. Select Fedora DNF practice' : 'Fedora DNF practice; use DNF. Select Linux Mint'} to practice ${command}`;
  const pkg = state.packages.catalog.find(item => item.commands.includes(command));
  return pkg && !pkg.installed ? `${command}: command not found; install package ${pkg.name} with sudo ${state.packages.manager} install ${pkg.name}` : null;
}
export function packageCommands(shell) {
  const {state, fs} = shell;
  const error = (message, code = state.packages.manager === 'apt' ? 100 : 1) => { shell.commandStatus = code; throw new LinuxError(message); };
  const run = (manager, args) => {
    const packages = state.packages, catalog = packages.catalog;
    if (manager !== packages.manager) error(commandUnavailable(state, manager), 127);
    const [action, ...operands] = args;
    const installedSyntax = manager === 'apt' ? '--installed' : 'installed';
    if (action === 'list' && operands.length === 1 && operands[0] === installedSyntax) return `${manager === 'apt' ? 'Listing... Done' : 'Installed Packages'}\n` + catalog.filter(pkg => pkg.installed).map(pkg => manager === 'apt' ? `${pkg.name}/${packages.repository.name} ${pkg.version} amd64 [installed]` : `${pkg.name}.x86_64  ${pkg.version}  @${packages.repository.name}`).join('\n') + '\n';
    if (action === 'search' && operands.length === 1 && /^[a-zA-Z0-9-]{1,64}$/.test(operands[0])) {
      const needle = operands[0].toLowerCase(), matches = catalog.filter(pkg => (pkg.name + ' ' + pkg.description).toLowerCase().includes(needle));
      return matches.length ? matches.map(pkg => `${pkg.name}${manager === 'dnf' ? '.x86_64' : '/' + packages.repository.name} ${pkg.version}${pkg.installed ? ' [installed]' : ''}\n  ${pkg.description}`).join('\n') + '\n' : 'No matching packages.\n';
    }
    if (action === (manager === 'apt' ? 'show' : 'info') && operands.length === 1) {
      const pkg = catalog.find(item => item.name === operands[0]); if (!pkg) error('No package found: ' + operands[0]);
      return `Name: ${pkg.name}\nVersion: ${pkg.version}\nDescription: ${pkg.description}\nInstalled: ${pkg.installed ? 'yes' : 'no'}\nRepository: ${packages.repository.name} (${packages.repository.available && pkg.available ? 'available' : 'unavailable'})\nTraining catalog: fictional versions; no real downloads or dependencies.\n`;
    }
    const updating = manager === 'apt' && action === 'update' && !operands.length;
    if (updating || (['install', 'remove'].includes(action) && operands.length >= 1 && operands.length <= 10 && operands.every(value => /^[a-z0-9][a-z0-9-]{0,63}$/.test(value)))) {
      if (fs.user.uid !== 0) error('Permission denied: package changes require root; use sudo');
      const selected = [...new Set(operands)].map(name => {
        const pkg = catalog.find(item => item.name === name); if (!pkg) error('Unable to locate package ' + name); return pkg;
      });
      if (action === 'remove' && selected.some(pkg => pkg.protected)) error('Simulator safety: foundational packages cannot be removed');
      const changes = selected.filter(pkg => pkg.installed !== (action === 'install'));
      if (updating || (action === 'install' && changes.length)) {
        if (!packages.repository.available || changes.some(pkg => !pkg.available)) error('Simulated repository or package is unavailable');
        const repository = httpResource(state, fs, packages.repository.url);
        if (repository.error || repository.status !== 200) error('Unable to reach simulated package repository: ' + (repository.error || 'HTTP ' + repository.status));
      }
      if (updating) { packages.indexRevision++; return `Hit: ${packages.repository.url}\nReading package lists... Done\nSimulated index revision ${packages.indexRevision}. Installed versions unchanged.\n`; }
      for (const pkg of changes) pkg.installed = action === 'install';
      return selected.map(pkg => changes.includes(pkg) ? `${action === 'install' ? 'Installed' : 'Removed'}: ${pkg.name} ${pkg.version}` : `${pkg.name} is ${action === 'install' ? 'already installed' : 'not installed'}.`).join('\n') + '\nSimulated transaction complete; no real downloads or dependency changes.\n';
    }
    error(`unsupported syntax; use man ${manager}`);
  };
  return [['apt', args => run('apt', args)], ['dnf', args => run('dnf', args)]];
}
export function restorePackages(value, profile) {
  const invalid = () => { throw Error('Invalid package state'); }, seed = seedPackages(profile);
  if (!value || value.manager !== seed.manager || !value.repository || value.repository.name !== seed.repository.name || value.repository.url !== seed.repository.url || typeof value.repository.available !== 'boolean'
    || !Number.isInteger(value.indexRevision) || value.indexRevision < 0 || value.indexRevision > 1000000 || !Array.isArray(value.catalog) || value.catalog.length !== seed.catalog.length) invalid();
  const catalog = value.catalog.map((pkg, index) => {
    const original = seed.catalog[index];
    if (!pkg || ['name', 'description', 'version', 'protected'].some(key => pkg[key] !== original[key]) || JSON.stringify(pkg.commands) !== JSON.stringify(original.commands) || typeof pkg.installed !== 'boolean' || typeof pkg.available !== 'boolean' || (pkg.protected && !pkg.installed)) invalid();
    return {...original, installed: pkg.installed, available: pkg.available};
  });
  return {...seed, indexRevision: value.indexRevision, repository: {...seed.repository, available: value.repository.available}, catalog};
}
