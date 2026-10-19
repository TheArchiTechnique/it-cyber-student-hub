# Linux Mint workstation lab

Canonical page: `docs/labs/it-support/linux-mint-command-line/README.md`.

Phase 2 continues the installation walkthrough with one real-VM support assignment, one evolving report in `~/APlus-Linux-Lab/Reports/workstation-report.txt`, an archived final copy, and Before-Lab/After-Lab snapshots. Thirteen stages move from demonstrated commands through native-help discovery to diagnostic decisions. Native `man`, command help, Bash help/type/availability, and Nano help recur; the reference supplies contextual explanations.

The ordinary `article.html` layout matches the installation lab. Native details provide optional hints; no simulated terminal, custom app, new theme, or progress system is added. The new snapshot SVG is an explicitly labeled instructional illustration. Nano reuses the Phase 1 diagram. File-changing exercises stay inside the lab workspace; sensitive configuration is inspected without displaying shadow hashes, while ownership changes, `su`, DNF, and disk repair are recognition material. APT installation has a missing-tool/online branch and an offline alternative.

Reference grouping uses a heading on the existing landing page. Ports & Protocols remains separate, command-reference URLs stay unchanged, and PowerShell/other placeholders remain subject to existing visibility rules. The availability generator registers the new lab and generated listings. Core 2, installation, reference, and lab links connect the learning sequence. `CONTRIBUTING.md` records the reusable VM snapshot convention.

## Validation

Run the normal source/navigation/unit/build/site checks and `npm run test:linux-mint-command-lab`, `npm run test:linux-command-reference`, `npm run test:pbq-library`, and `node tests/shared-linux-lab.cjs`. The new test checks 13 stages, command/help coverage, bounded file/system operations, shell syntax, accessible expandable hints, image loading, desktop/mobile themes, discovery, contextual navigation, search, and hidden resources. Run existing Windows/navigation browser tests as part of the validation workflow.

Phase validation also identified a timing race in the existing PBQ test: an immediate `evaluateAll` could read quiz links before the destination page rendered. It now waits for the first destination quiz link before checking the full exact URL list. The content and unpublished-resource assertions remain intact.

VirtualBox instructions were checked against the [VirtualBox 7.2 snapshot workflow](https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/working-with-vms.html). Nano help navigation was checked against the [Nano 7.2 manual](https://www.nano-editor.org/dist/v7/nano.html). No VirtualBox GUI or Mint VM is available in the execution container; those are documentation/content checks, not live VM or snapshot execution. Available Linux operations can be checked in a disposable Ubuntu workspace without changing system configuration. Record the actual runtime scope in the phase completion report.

Implementation smoke testing on Ubuntu 24.04 parsed all 27 Bash blocks and exercised the documented workspace/copy/rename/move/search/confirmed-removal workflow. Nano ran in a real terminal PTY for help, creating, saving, filename confirmation, exiting, and reopening the report. Checks confirmed distinct case-sensitive filenames, the intended 600/640 permission bits, an earlier copy remaining independent of report updates, and byte-for-byte equality of the final archived report. Native Bash help/type/availability and df/du queries also ran. Package changes, privilege switching, live network diagnostics, disk repairs, mount changes, and VirtualBox snapshots were not executed.

## Branch continuity

Phase 2 uses `content/a-plus-core2-linux-mint-command-lab`. At its preflight, GitHub showed PR #46 had already been merged externally as `0a73b648bab9e7c7b3c8f0fb06cf4a2ccb6be337`; the feature branch was fast-forwarded to that main commit. This phase creates no replacement PR and performs no merge. Its checkpoint stays on the existing feature branch for subsequent review.
