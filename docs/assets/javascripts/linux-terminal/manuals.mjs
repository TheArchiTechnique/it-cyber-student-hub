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
  man: ['Open a short simulated command manual.', 'man COMMAND', 'Use q, Escape, or Return to terminal to leave the manual.', 'man ls']
});
export const commandNames = Object.freeze(Object.keys(manuals));
export function manual(name) {
  const entry = Object.hasOwn(manuals, name) && manuals[name];
  if (!entry) return null;
  return `${name.toUpperCase()}: Short simulated manual\n\nNAME\n  ${name}: ${entry[0]}\n\nSYNTAX\n  ${entry[1]}\n\nOPTIONS / NOTES\n  ${entry[2]}\n\nEXAMPLE\n  ${entry[3]}\n\nOnly the syntax listed here is implemented.\n`;
}
