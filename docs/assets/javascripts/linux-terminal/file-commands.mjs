import {LinuxError, baseName} from './filesystem.mjs';
const fail = text => { throw new LinuxError(text); };

// Introduced handlers extend the existing dispatcher; they share its VFS and error stream.
export function fileCommands(shell, options) {
  const transfer = (args, moving) => {
    const {flags, operands} = options(args, moving ? '' : 'r');
    if (operands.length < 2) fail('missing source or destination operand');
    const destination = operands.pop();
    if (operands.length > 1) shell.fs.directory(destination);
    shell.each(operands, source => moving ? shell.fs.move(source, destination) : shell.fs.copy(source, destination, flags.has('r')));
    return '';
  };
  const grep = args => {
    const {flags, operands} = options(args, 'in');
    if (operands.length < 2) fail('usage: grep [-in] [--] PATTERN FILE ...; interactive stdin is not supported');
    const pattern = operands.shift();
    // Keep the supported language honest and bounded: plain text only, no regex execution.
    if (/[\\.^$*\[\]\n\r]/.test(pattern)) fail('regular-expression patterns are not supported in this simulator; use plain text');
    let matched = false, output = '';
    const needle = flags.has('i') ? pattern.toLowerCase() : pattern;
    shell.each(operands, file => {
      if (file === '-') fail('interactive stdin is not supported');
      const content = shell.fs.read(file), lines = content.split('\n');
      if (lines.at(-1) === '') lines.pop();
      lines.forEach((line, i) => {
        if ((flags.has('i') ? line.toLowerCase() : line).includes(needle)) {
          matched = true;
          output += (operands.length > 1 ? file + ':' : '') + (flags.has('n') ? `${i + 1}:` : '') + line + '\n';
        }
      });
    });
    shell.commandStatus = shell.errors.length ? 2 : matched ? 0 : 1;
    return output;
  };
  const find = args => {
    const starts = [];
    while (args.length && !args[0].startsWith('-')) starts.push(args.shift());
    if (!starts.length) starts.push('.');
    let name = null, type = null;
    while (args.length) {
      const predicate = args.shift(), value = args.shift();
      if (predicate === '-name' && value !== undefined && name === null) {
        if (/[\[\]\\]/.test(value)) fail('find -name supports literal characters, * and ?; bracket classes and escapes are not supported');
        name = value;
      } else if (predicate === '-type' && ['f', 'd'].includes(value) && type === null) type = value;
      else fail(`${predicate}: unsupported predicate or argument; use man find`);
    }
    let output = '';
    const visit = (path, label) => {
      const node = shell.state.nodes[shell.fs.resolve(path)];
      if ((name === null || glob(name, baseName(label.replace(/\/+$/, '') || '/'))) && (!type || node.type === (type === 'f' ? 'file' : 'directory'))) output += label + '\n';
      if (node.type === 'directory') {
        shell.fs.require(node, 5, label);
        for (const child of shell.fs.children(path)) {
          try { visit(child, label.replace(/\/$/, '') + '/' + baseName(child)); }
          catch (error) { if (!(error instanceof LinuxError)) throw error; shell.errors.push(error.message); }
        }
      }
    };
    shell.each(starts, input => visit(shell.fs.resolve(input), input));
    return output;
  };
  return new Map([
    ['cp', args => transfer(args, false)], ['mv', args => transfer(args, true)],
    ['rm', args => {
      const {flags, operands} = options(args, 'rf');
      if (!operands.length && !flags.has('f')) fail('missing operand');
      shell.each(operands, input => shell.fs.remove(input, {recursive: flags.has('r'), force: flags.has('f')})); return '';
    }],
    ['chmod', args => {
      const {operands} = options(args, '');
      if (operands.length < 2) fail('missing mode or file operand');
      const mode = operands.shift(); shell.each(operands, input => shell.fs.chmod(input, mode)); return '';
    }],
    ['chown', args => {
      const {operands} = options(args, '');
      if (operands.length < 2) fail('missing owner or file operand');
      const specification = operands.shift(), parts = specification.split(':');
      if (parts.length > 2 || !parts[0] || (parts.length === 2 && !parts[1])) fail(`${specification}: unsupported owner specification`);
      const uid = identity(parts[0], 'user'), gid = parts.length === 2 ? identity(parts[1], 'group') : null;
      shell.each(operands, input => shell.fs.chown(input, uid, gid)); return '';
    }], ['grep', grep], ['find', find]
  ]);
}
function identity(value, kind) {
  const known = {root: 0, student: 1000};
  if (Object.hasOwn(known, value)) return known[value];
  if (/^\d+$/.test(value) && Number(value) <= 4294967294) return Number(value);
  fail(`${value}: invalid ${kind}`);
}
// Bounded wildcard matcher for find; no user-supplied regular expression is evaluated.
function glob(pattern, name) {
  let p = 0, n = 0, star = -1, retry = 0;
  while (n < name.length) {
    if (pattern[p] === '?' || pattern[p] === name[n]) { p++; n++; }
    else if (pattern[p] === '*') { star = p++; retry = n; }
    else if (star >= 0) { p = star + 1; n = ++retry; }
    else return false;
  }
  while (pattern[p] === '*') p++;
  return p === pattern.length;
}
