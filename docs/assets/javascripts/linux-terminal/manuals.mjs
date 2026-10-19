// Keep short manuals with the command registry; later phases add entries here.
export const manuals = Object.freeze({
  pwd: ['Print the current working directory.', 'pwd', 'No options are implemented.', 'pwd'],
  ls: ['List files and directories.', 'ls [-la1d] [--] [PATH ...]', '-l: show permissions, owner, size, and modification time.\n-a: include hidden entries, . and .. .\n-1: one entry per line. -d: list the directory itself.', 'ls -la ~/Documents'],
  cd: ['Change the shell working directory.', 'cd [DIRECTORY | -]', 'No argument: go home. -: return to the previous directory.', 'cd "$HOME/Practice"'],
  cat: ['Print the contents of text files.', 'cat [--] FILE ...', 'No options are implemented. Reading interactive stdin is not supported.', 'cat Documents/ticket.txt'],
  whoami: ['Print the effective account name.', 'whoami', 'No options are implemented.', 'whoami'],
  mkdir: ['Create directories.', 'mkdir [-p] [--] DIRECTORY ...', '-p: create missing parents; accept existing directories.', 'mkdir -p ~/Practice/Reports'],
  touch: ['Create an empty file, or update an existing entry’s access and modification times.', 'touch [--] FILE ...', 'Existing file contents are preserved. No options are implemented.', 'touch ~/Practice/notes.txt'],
  echo: ['Write text to standard output.', 'echo [-n] [TEXT ...]', '-n: omit the trailing newline. > FILE writes output; >> FILE appends.', 'echo "Workstation ready" > report.txt'],
  clear: ['Clear the visible terminal transcript.', 'clear', 'No options are implemented. Files and recalled commands are retained.', 'clear'],
  help: ['List supported simulator commands or show concise command help.', 'help [COMMAND]', 'This simulator helper also describes external commands.', 'help cd'],
  man: ['Open a short simulated command manual.', 'man COMMAND', 'Use q, Escape, or Return to terminal to leave the manual.', 'man ls'],
  cp: ['Copy files or directories into independent copies.', 'cp [-r] [--] SOURCE ... DESTINATION', '-r: copy directories recursively. Multiple sources require an existing destination directory. New copies use your ownership and the source permissions subject to umask 022.', 'cp -r Reports Backup'],
  mv: ['Move or rename files and complete directory trees.', 'mv [--] SOURCE ... DESTINATION', 'An existing destination directory receives each source by name. Files can be replaced; a conflicting directory must be empty. No options are implemented.', 'mv report.txt resolved-ticket.txt'],
  rm: ['Remove files or directory trees from the virtual workstation.', 'rm [-rf] [--] PATH ...', '-r: remove directories recursively. -f: ignore missing paths, not permission errors. Removal uses parent directory permissions and sticky-directory ownership. No interactive write-protection prompts are simulated.\nSimulator safety: foundation directories and the current directory/ancestors cannot be removed. Each subtree is checked before deletion.', 'rm -r OldReports'],
  grep: ['Find lines containing plain text in saved files.', 'grep [-in] [--] PATTERN FILE ...', '-i: ignore letter case. -n: show line numbers. Multiple files add filename prefixes. This subset supports plain text, not regular-expression metacharacters. Exit status: 0 match, 1 no match, 2 error.', 'grep -in error /var/log/application.log'],
  find: ['Walk directory trees to locate names or entry types.', 'find [PATH ...] [-name PATTERN] [-type f|d]', '-name: match a filename with quoted * and ? wildcards. -type: f for files, d for directories. Predicates combine with AND. Hidden names are included. Other predicates and bracket classes are unsupported.', 'find ~/Practice -name "*.txt"'],
  chmod: ['Change file or directory permissions as the owner or root.', 'chmod [--] MODE FILE ...', 'Use 3/4-digit octal modes, or explicit u/g/o/a with +, -, = and rwx; comma-separated clauses work. Directory r lists names, x permits traversal, and w plus x permits entry changes. File execution itself is not simulated.', 'chmod u+x script.sh'],
  chown: ['Change file ownership with the required authorization.', 'chown [--] USER[:GROUP] FILE ...', 'Names: root, student; numeric IDs also work. Changing the owner to another account requires root. An owner may retain their own ID and select one of their groups. Administrative login/elevation is not yet available.', 'chown root:root report.txt'],
  nano: ['Open a terminal-style text editor using the same virtual files.', 'nano [--] [FILE]', 'Ctrl+O: Write Out, then Enter confirms the filename. Ctrl+X: exit, with Save/Discard/Cancel for changes. Ctrl+G: help. Visible buttons offer the same actions. Opening a new buffer does not create a saved file.', 'nano ~/Practice/Reports/workstation-report.txt']
});
export const commandNames = Object.freeze(Object.keys(manuals));
export function manual(name) {
  const entry = Object.hasOwn(manuals, name) && manuals[name];
  if (!entry) return null;
  return `${name.toUpperCase()}: Short simulated manual\n\nNAME\n  ${name}: ${entry[0]}\n\nSYNTAX\n  ${entry[1]}\n\nOPTIONS / NOTES\n  ${entry[2]}\n\nEXAMPLE\n  ${entry[3]}\n\nOnly the syntax listed here is implemented.\n`;
}
