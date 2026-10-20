import {LinuxError} from './filesystem.mjs';
const unsupported = feature => { throw new LinuxError(`shell: ${feature} is not supported in this simulator`); };

// Deliberately bounded Bash-like grammar. No eval, Function, shell, or network execution.
export function tokenize(line, env = {}) {
  if (line.length > 8192) throw new LinuxError('shell: command exceeds the 8192-character limit');
  const tokens = [];
  let word = '', active = false, quote = null, fdEligible = true;
  const flush = () => { if (active) tokens.push({kind: 'word', value: word}); word = ''; active = false; fdEligible = true; };
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '\0') unsupported('NUL input');
    if (quote === "'") {
      if (c === "'") quote = null;
      else word += c;
      continue;
    }
    if (c === '\\') {
      fdEligible = false;
      if (i + 1 === line.length) throw new LinuxError('shell: incomplete escape');
      const next = line[i + 1];
      if (!quote || ['$', '`', '"', '\\'].includes(next)) { word += next; i++; }
      else word += c;
      active = true; continue;
    }
    if (c === '`' || (c === '$' && line[i + 1] === '(')) unsupported('command substitution');
    if (c === '$') {
      fdEligible = false;
      const match = line.slice(i).match(/^\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*|\?))/);
      if (match) {
        const value = String(env[match[1] || match[2]] ?? '');
        if (quote) word += value;
        else {
          // Bash-like field splitting for the supported whitespace separator.
          for (const part of value.split(/(\s+)/)) {
            if (/^\s+$/.test(part)) flush();
            else if (part) { word += part; active = true; }
          }
        }
        i += match[0].length - 1; continue;
      }
      if (line[i + 1] && /[0-9@*#!$\-{}\[]/.test(line[i + 1])) unsupported('this parameter expansion');
    }
    if (c === '"') { fdEligible = false; quote = quote ? null : '"'; active = true; continue; }
    if (quote) { word += c; continue; }
    if (c === "'") { fdEligible = false; quote = "'"; active = true; continue; }
    if (/\s/.test(c)) {
      if (c === '\n' || c === '\r') unsupported('multiple command lines');
      flush(); continue;
    }
    if (c === '#' && !active) break;
    if (['|', '&', ';', '<', '(', ')', '*', '?', '[', ']','{','}'].includes(c)) unsupported(`unquoted ${c}`);
    if (c === '>') {
      if (active && fdEligible && /^\d+$/.test(word)) unsupported('file descriptor redirection');
      flush();
      const append = line[i + 1] === '>';
      if (append) i++;
      tokens.push({kind: append ? '>>' : '>', value: ''}); continue;
    }
    if (c === '~' && !active) {
      fdEligible = false;
      const next = line[i + 1];
      if (next && next !== '/' && !/\s/.test(next)) unsupported('named-user tilde expansion');
      word += env.HOME || '~'; active = true; continue;
    }
    word += c; active = true;
  }
  if (quote) throw new LinuxError('shell: unmatched quote');
  flush(); return tokens;
}

export function parse(line, env) {
  const tokens = tokenize(line, env), argv = [];
  let redirect = null;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].kind === 'word') argv.push(tokens[i].value);
    else {
      if (redirect) unsupported('multiple redirections');
      const next = tokens[++i];
      if (!next || next.kind !== 'word' || !next.value) throw new LinuxError('shell: redirection needs a filename');
      redirect = {path: next.value, append: tokens[i - 1].kind === '>>'};
    }
  }
  return {argv, redirect};
}
