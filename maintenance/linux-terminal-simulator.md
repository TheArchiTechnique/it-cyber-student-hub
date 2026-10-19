# Linux Terminal Simulator

Phase 1 is the browser terminal foundation on `feature/a-plus-core2-linux-terminal-simulator`.

## Canonical runtime and scope

The single runtime is `docs/practice/linux-terminal-simulator/app/index.html`, built at `practice/linux-terminal-simulator/app/` under the GitHub Pages project subpath. It follows the repository's copied interactive `app/` convention, shares the Hub stylesheet/palette, article classes, navigation targets, and existing build-time analytics injection. It is deliberately absent from catalogs, generated navigation, and search during foundation work. No shared publication model or layout has changed. Broader discovery and an article launch surface belong to Phase 4. Existing Linux references and real-VM labs remain authoritative and unchanged.

Implemented commands: `pwd`, `ls`, `cd`, `cat`, `whoami`, `mkdir`, `touch`, `echo`, `clear`, `help`, `man`. Manuals list the supported subset, including `ls -la/-1/-d`, `mkdir -p`, `echo -n`, and `--` for supported operand parsers. `cd -` uses the previous working directory. Redirection `>` opens/truncates before command execution and `>>` appends. File errors are separate from standard output; multi-file operations preserve successful operands and return failure status when an operand fails.

## Modules and extension points

All engine modules live in `docs/assets/javascripts/linux-terminal/`:

- `filesystem.mjs`: fictional seed data, case-sensitive path traversal, owner/group/other permission checks, metadata, and shared `read`, `prepareWrite`, `write`, `mkdir`, `touch`, and `list` APIs. Nano must use these same APIs. A denied intermediate directory cannot be bypassed with `..`. Default permissions use the workstation's fixed 022 creation policy. Sticky directory metadata is seeded for future removal commands.
- `parser.mjs`: bounded tokenization, single/double quotes, escapes, tilde/home and basic environment expansion, whitespace field splitting, comments, and output redirection. Unsupported operators, globbing, parameter/command substitutions, multiple commands, and multiple redirections are rejected. Student text is never evaluated as JavaScript or host shell input.
- `shell.mjs`: shared command registry, command results (`stdout`, `stderr`, `code`, optional UI `action`), effective session environment, prompt formatting, basic completion, and command implementations. Future commands can be added to the registry without duplicating filesystem state. Guided checks should inspect state and file contents through these APIs, not command strings.
- `manuals.mjs`: reusable short manual entries. `man` opens a keyboard-accessible dialog; redirecting a manual writes its content to a virtual file. `--help` returns inline text for the supported commands other than echo.
- `state.mjs`: schema version 1, fictional user/system/process/network state, validation, restoration, and browser storage adapter. Invalid/unknown schemas start a fresh in-memory session with an explicit notice. Add migrations here when later phases change the schema. The current version restores only the implemented session fields; future administrative state/progress needs validation before persistence is extended.
- `terminal.mjs`: DOM interaction, safe text rendering, history/draft recall, keyboard interruption, simple completion, manual/reset dialogs, theme controls, and persistence feedback. It executes the same engine used in tests.

The UI and files are separate from command output: prompts occur once at input and once per submitted command. Manuals return with q, Escape, Ctrl+C, or the visible button. Ctrl+C cancels pending shell input; selected text retains ordinary copy behavior. Ctrl+L clears the view. Tab completes unquoted/simple paths and commands, escaping spaces when accepting a path; complex quoted/expanded input remains editable. If no completion exists, Tab moves focus normally. Standard browser copy/paste is preserved.

## Persistence and bounds

Only `student-hub:linux-terminal:v1` stores workstation changes, contents, metadata, working/previous directories, session status, and the most recent 200 commands. Reset replaces this key after confirmation and leaves other Hub progress intact. A separate namespaced theme preference is retained. Storage failure leaves the current in-memory workstation usable and displays a warning. Changes in another tab produce a notice before this tab next saves its own state.

A command is limited to 8192 characters, a virtual file to 1 million text characters, a resolved path to fewer than 8192 characters, and the filesystem to 5000 entries. Oversized serialized saves are rejected before replacing the last valid checkpoint. The visible transcript retains 120 entries and caps each displayed output at 50,000 characters with a visible truncation note; file contents are not truncated by the display. File sizes in long listings use UTF-8 bytes, directory sizes are modeled as zero, and modification times display in UTC. No host files, arbitrary network requests, subprocesses, backend, or new application dependencies are used.

## Validation

- `npm run test:linux-terminal-engine`: command sequences, shared state, quoting, expansion, path semantics, redirection, errors, permissions, manual lookup, completion, schema validation, storage failure, persistence, and reset isolation.
- After `python -m mkdocs build --strict`, `npm run test:linux-terminal`: engine plus Playwright tests of the actual runtime at the project subpath, keyboard controls, manuals, confirmed/cancelled reset, refresh persistence, literal HTML rendering, corrupt/blocked storage, links, 1440/390/320px layouts in both Hub palettes, and deferred discovery. Use the existing `PBQ_CHROMIUM_PATH` override when required by the test environment.
- Run normal source/navigation/Python/catalog/build/site validation, Linux reference/Mint/shared-lab tests, navigation/PBQ tests, and existing browser regressions. The validation workflow includes this branch and simulator tests.

## Deferred work

Phase 2: Nano editing and the next command set. Later phases: the remaining Objective 1.9 commands, permissions/ownership changes, system/network/package scenarios, guided curriculum, progress checks, distribution-specific DNF context, and Phase 4 discovery/navigation integration. The seed's process/network state is an expansion foundation; no diagnostic or administrative command currently claims to operate on it. Do not recreate this engine or add a separate guided terminal. No pull request is opened in Phase 1.
