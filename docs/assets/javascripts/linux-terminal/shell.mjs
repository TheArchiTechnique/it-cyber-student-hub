import {networkCommands} from './network-commands.mjs';
import {packageCommands, commandUnavailable} from './packages.mjs';
import {systemCommands} from './system-commands.mjs';
import {LinuxError, VirtualFilesystem, baseName, parentPath, modeText} from './filesystem.mjs';
import {parse} from './parser.mjs';
import {fileCommands} from './file-commands.mjs';
import {NanoSession} from './nano.mjs';
import {commandNames, manual} from './manuals.mjs';
const fail = text => { throw new LinuxError(text); };
const displayName = id => id === 0 ? 'root' : id === 1000 ? 'student' : String(id);
const byteLength = value => new TextEncoder().encode(value).length;

function options(args, allowed) {
  const flags = new Set(), operands = [];
  let ended = false;
  for (const arg of args) {
    if (!ended && arg === '--') { ended = true; continue; }
    if (!ended && arg.startsWith('-') && arg !== '-') {
      for (const flag of arg.slice(1)) {
        if (!allowed.includes(flag)) fail(`option '${arg}' is not supported in this simulator; use man for supported syntax`);
        flags.add(flag);
      }
    } else operands.push(arg);
  }
  return {flags, operands};
}
const noArguments = args => { if (args.length) fail('arguments are not supported; use man for supported syntax'); };

export class Shell {
  constructor(state) {
    this.state = state; this.fs = new VirtualFilesystem(state);
    // Add future commands to this registry; all receive the same shell and VFS.
    this.commands = new Map([
      ['pwd', args => { noArguments(args); return this.state.cwd + '\n'; }],
      ['whoami', args => { noArguments(args); return this.fs.user.name + '\n'; }],
      ['cd', args => this.cd(args)], ['ls', args => this.ls(args)],
      ['cat', args => this.cat(args)], ['mkdir', args => this.mkdir(args)],
      ['touch', args => this.touch(args)], ['echo', args => this.echo(args)],
      ['clear', args => { noArguments(args); this.action = 'clear'; return ''; }],
      ['man', args => this.man(args)], ['help', args => this.help(args)],
      ...fileCommands(this, options),
      ...systemCommands(this, options),
      ...networkCommands(this), ...packageCommands(this),
      ['nano', args => {
        const {operands} = options(args, '');
        if (operands.length > 1) fail('only one editor buffer is supported; usage: nano [FILE]');
        this.editor = new NanoSession(new VirtualFilesystem(this.state, this.fs.clock, this.fs.user), operands[0] ?? ''); this.action = 'nano'; return '';
      }]
    ]);
  }
  environment() {
    return {HOME: this.state.user.home, USER: this.state.user.name, LOGNAME: this.state.user.name,
      HOSTNAME: this.state.hostname, PWD: this.state.cwd, OLDPWD: this.state.oldpwd || '', SHELL: '/bin/bash', '?': String(this.state.lastStatus)};
  }
  prompt() {
    const {user, hostname, cwd} = this.state;
    const path = cwd === user.home ? '~' : cwd.startsWith(user.home + '/') ? '~' + cwd.slice(user.home.length) : cwd;
    return `${user.name}@${hostname}:${path}${user.uid === 0 ? '#' : '$'}`;
  }
  execute(line) {
    const result = {stdout: '', stderr: '', code: 0, action: null, manual: null, editor: null};
    this.action = null; this.manualName = null; this.editor = null; this.errors = []; this.commandStatus = 0;
    if (line.trim()) this.state.history = [...this.state.history, line.slice(0, 8192)].slice(-200);
    let command = 'shell';
    try {
      const {argv, redirect} = parse(line, this.environment());
      command = argv[0] || 'shell';
      if (!argv.length && !redirect) return result;
      let interactive = argv;
      while (interactive[0] === 'sudo') interactive = interactive.slice(interactive[1] === '--' ? 2 : 1);
      if (redirect && (['clear', 'nano', 'su', 'exit'].includes(interactive[0]) || (interactive[0] === 'top' && interactive.length === 1))) fail('output redirection is not supported for this interactive command');
      // Shell opens/truncates output before dispatch, even if the command later fails.
      const target = redirect ? this.fs.write(redirect.path, '', {append: redirect.append}) : null;
      this.outputTarget = target;
      let stdout = '';
      if (argv.length) {
        stdout = this.dispatch(command, argv.slice(1));
      }
      if (redirect) this.fs.write(target, stdout, {append: true});
      else result.stdout = stdout;
      result.code = this.commandStatus;
      if (!redirect) { result.action = this.action; result.manual = this.manualName; result.editor = this.editor; }
      if (this.errors.length) { result.stderr = this.errors.map(error => `${command}: ${error}`).join('\n') + '\n'; result.code = this.commandStatus || 1; }
    } catch (error) {
      if (!(error instanceof LinuxError)) throw error;
      result.stderr = `${command}: ${error.message}\n`; result.code ||= this.commandStatus || (command === 'grep' ? 2 : 1);
    }
    this.state.lastStatus = result.code;
    return result;
  }
  dispatch(command, args) {
    const unavailable = commandUnavailable(this.state, command), handler = this.commands.get(command);
    if (unavailable || !handler) { this.commandStatus = 127; fail(unavailable || 'command not found: ' + command); }
    if (args.length === 1 && args[0] === '--help' && command !== 'echo') return manual(command);
    return handler(args);
  }
  each(operands, run) {
    for (const operand of operands) {
      try { run(operand); }
      catch (error) { if (!(error instanceof LinuxError)) throw error; this.errors.push(error.message); }
    }
  }
  cd(args) {
    const optionsEnded = args[0] === '--';
    if (optionsEnded) args = args.slice(1);
    if (args.length > 1) fail('too many arguments');
    let target = args[0] ?? this.state.user.home;
    if (!optionsEnded && target.startsWith('-') && target !== '-') fail(`option '${target}' is not supported`);
    if (target === '-') { if (!this.state.oldpwd) fail('OLDPWD not set'); target = this.state.oldpwd; }
    const next = this.fs.directory(target);
    this.state.oldpwd = this.state.cwd; this.state.cwd = next;
    return args[0] === '-' ? next + '\n' : '';
  }
  ls(args) {
    const {flags, operands} = options(args, 'la1d');
    const output = [];
    this.each(operands.length ? operands : ['.'], input => {
      const path = this.fs.resolve(input), node = this.state.nodes[path];
      let entries;
      if (node.type !== 'directory' || flags.has('d')) entries = [{path, label: input}];
      else {
        const children = this.fs.list(input).filter(key => flags.has('a') || !baseName(key).startsWith('.'));
        entries = children.map(key => ({path: key, label: baseName(key)}));
        if (flags.has('a')) entries.unshift({path, label: '.'}, {path: parentPath(path), label: '..'});
      }
      if (operands.length > 1) output.push(`${input}:`);
      if (flags.has('l')) this.each(entries, entry => output.push(this.longListing(entry)));
      else if (entries.length) output.push(entries.map(entry => entry.label).join(flags.has('1') ? '\n' : '  '));
    });
    return output.length ? output.join('\n') + '\n' : '';
  }
  longListing({path, label}) {
    const node = this.state.nodes[this.fs.resolve(path)];
    const links = node.type === 'file' ? 1 : 2 + Object.keys(this.state.nodes).filter(key => key !== path && key !== '/' && parentPath(key) === path && this.state.nodes[key].type === 'directory').length;
    const size = node.type === 'file' ? byteLength(node.content) : 0;
    const stamp = new Date(node.mtime).toISOString().slice(0, 16).replace('T', ' ');
    return `${modeText(node)} ${links} ${displayName(node.uid)} ${displayName(node.gid)} ${String(size).padStart(5)} ${stamp} ${label}`;
  }
  cat(args) {
    const {operands} = options(args, '');
    if (!operands.length) fail('interactive stdin is not supported; provide a file');
    let out = '';
    this.each(operands, input => {
      if (input === '-') fail('interactive stdin is not supported; provide a file');
      if (this.fs.resolve(input) === this.outputTarget) fail(`${input}: input file is output file`);
      out += this.fs.read(input);
    });
    return out;
  }
  mkdir(args) {
    const {flags, operands} = options(args, 'p');
    if (!operands.length) fail('missing operand');
    this.each(operands, input => this.fs.mkdir(input, flags.has('p'))); return '';
  }
  touch(args) {
    const {operands} = options(args, '');
    if (!operands.length) fail('missing file operand');
    this.each(operands, input => this.fs.touch(input)); return '';
  }
  echo(args) {
    let newline = true;
    while (args[0] === '-n') { newline = false; args = args.slice(1); }
    if (args[0] && /^-[eEn]+$/.test(args[0])) fail('echo escape-processing options are not supported; use man echo');
    return args.join(' ') + (newline ? '\n' : '');
  }
  man(args) {
    if (args.length !== 1) fail('usage: man COMMAND');
    const content = manual(args[0]);
    if (!content) fail(`No manual entry for ${args[0]}`);
    this.action = 'manual'; this.manualName = args[0]; return content;
  }
  help(args) {
    if (args.length > 1) fail('usage: help [COMMAND]');
    if (args.length) return manual(args[0]) || fail(`no help for ${args[0]}`);
    return `Supported command manuals (package availability depends on this profile):\n  ${commandNames.join('  ')}\n\nUse man COMMAND for a short manual; q returns to the prompt.\nPaths: /absolute, relative, ~, $HOME, . and .. . Names are case-sensitive.\nUse quotes for spaces; > writes a file and >> appends.\nSupported syntax is listed in each manual. Pipes, globbing, command substitution,\ncommand chains, and interactive stdin are not implemented.\n`;
  }
}

// Completion intentionally leaves complex/incomplete quoting alone; it never executes input.
export function complete(shell, line, caret = line.length) {
  if (caret !== line.length || /['"\\$|&;<>]/.test(line)) return {value: line, choices: []};
  const match = line.match(/^(.*?)([^\s]*)$/), prefix = match[1], fragment = match[2];
  let choices = [], replacementPrefix = prefix;
  if ((!prefix || /^(?:sudo\s+(?:--\s+)?|man\s+|help\s+)$/.test(prefix)) && !fragment.includes('/')) choices = commandNames.filter(name => name.startsWith(fragment)).map(name => name + ' ');
  else {
    const slash = fragment.lastIndexOf('/'), parent = slash < 0 ? '' : fragment.slice(0, slash + 1), partial = fragment.slice(slash + 1);
    const rawDirectory = parent || '.', directory = rawDirectory === '~/' ? shell.state.user.home : rawDirectory.startsWith('~/') ? shell.state.user.home + rawDirectory.slice(1) : rawDirectory;
    try {
      choices = shell.fs.list(directory).filter(path => baseName(path).startsWith(partial) && (partial.startsWith('.') || !baseName(path).startsWith('.')))
        .filter(path => !prefix.trim().startsWith('cd') || shell.state.nodes[path].type === 'directory')
        .map(path => parent + baseName(path) + (shell.state.nodes[path].type === 'directory' ? '/' : ' '));
    } catch (error) { if (!(error instanceof LinuxError)) throw error; }
  }
  // Escape completed spaces, so accepting completion produces usable shell input.
  const escape = value => value.replace(/([\s'"\\$`;&|<>()[\]{}*?!#])/g, '\\$1');
  if (choices.length === 1) {
    const value = choices[0], suffix = value.endsWith(' ') ? ' ' : '';
    return {value: replacementPrefix + escape(suffix ? value.slice(0, -1) : value) + suffix, choices};
  }
  return {value: line, choices};
}
