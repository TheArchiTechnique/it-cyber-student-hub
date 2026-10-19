# Linux command reference

Canonical resource: `docs/reference/linux-commands.md`.

Phase 1 publishes the existing placeholder as a resource using the Windows reference's quick lookup, ordinary article layout, native expandable entries, command blocks, and existing Material light/dark styles. No shared UI code or new navigation system is introduced.

The reference covers all 27 commands in Core 2 objective 1.9, five configuration files, Nano, permissions, case sensitivity, system startup, and file-system paths. Optional file exercises stay under the student's home practice directory. Disk repair, mounting changes, account switching, ownership changes, and DNF remain recognition material. The Nano SVG is an original instructional diagram, explicitly labeled as an illustration rather than a screenshot.

Core 2, its objective breakdown, the central Reference area, and the installed Mint lab link to the resource. Publishing it also reveals the existing CySA+ reference card through the availability generator. `CONTRIBUTING.md` records the contextual-linking standard. Run `python scripts/sync_navigation.py` after publication changes.

Raw HTML code blocks have explicit unique IDs. Material otherwise derives repeated code-block IDs from an enclosing details element when that element contains multiple examples. The browser test checks for duplicate article anchors.

## Validation

Run the standard repository checks in `CONTRIBUTING.md`, then:

```sh
npm run test:linux-command-reference
node tests/shared-linux-lab.cjs
npm run test:windows-command-lab
```

The reference test serves the built site at the real GitHub Pages subpath. It checks objective-command coverage, all configuration entries, keyboard expansion, unique anchors, usable command text, Nano asset loading, 1440/390/320-pixel light/dark layouts, contextual links, back navigation, search, and the Windows reference's existing layout. `PBQ_CHROMIUM_PATH` can select a local browser; `LINUX_REFERENCE_QA_DIR` optionally captures temporary layout images.

Implementation verification used Ubuntu 24.04 in the execution container, not Linux Mint. All 35 executable Bash example blocks passed shell syntax checks. Disposable-file exercises verified listing, copying, renaming, confirmed removal, symbolic permissions, content search, filename search, and case sensitivity. Read-only `mount`, `fsck --help`, APT queries, `cat`, `du`, `df`, batch `top`, and section-specific `man` commands ran successfully. Nano create/save/filename confirmation/exit/reopen was exercised in a terminal PTY.

The container blocked `ip` netlink queries and `ps` process inspection. No Mint desktop, live network diagnostics, package installation/update, ownership change, account switch, actual file-system check, repair, or mount change was performed. Those operations received syntax/documentation review rather than being represented as Mint runtime tests.

Technical sources checked include the official [CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf), [Nano manual](https://www.nano-editor.org/dist/latest/nano.html), [APT manual](https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html), [DNF command reference](https://dnf.readthedocs.io/en/latest/command_ref.html), [filesystem checker manual](https://manpages.ubuntu.com/manpages/noble/man8/fsck.8.html), [shadow file manual](https://manpages.ubuntu.com/manpages/noble/man5/shadow.5.html), [resolver configuration manual](https://manpages.ubuntu.com/manpages/noble/man5/resolv.conf.5.html), and [systemd startup guide](https://www.freedesktop.org/software/systemd/man/latest/bootup.html).

## Continuation

The Linux Mint command-line lab and its contextual connections are deferred to Phase 2 on `content/a-plus-core2-linux-mint-command-lab`. No future-lab link, lab implementation, pull request, or merge is part of Phase 1.
