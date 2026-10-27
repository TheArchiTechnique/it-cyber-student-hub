# Shared CompTIA practice tests

Feature branch: `feature/certification-practice-tests`. GitHub is the continuation checkpoint. Fetch, inspect the existing branch and commits, and continue this implementation in each later phase. Do not recreate the application or commit to main. Every implementation phase ends with tests, commit, push, full SHA, and STOP. Final QA and PR creation follow implementation phases.

Current checkpoint: Phase 3B expands Core 2 to 104 validated questions in bank version `2026-10-27.3`, with at least two questions for each of the 36 official objective identifiers. Practice Mode and the shared whiteboard are implemented. Certification Mode and PBQ examination adapters are not implemented. Objective-level coverage does not imply complete subtopic coverage or a full certification simulation.

## Phase 1 boundary

Implemented: a shared static Practice Mode, domain and objective selection, question counts constrained by the actual eligible bank, single and multiple response questions, question/choice shuffling, flags/navigation, feedback settings, explicit immediate feedback with answer locking, exact-set scoring, local refresh recovery, results, Core 2 integration, and 24 initial questions (six per domain).

The 36 Core 2 objective identifiers and domain weights come from CompTIA's official 220-1202 objectives v2.0, verified 2026-10-27. Labels are concise descriptions; the official PDF is the authoritative wording. Configuration shows objectives with no bank coverage as unavailable. The original Phase 1 pilot was deliberately even for configuration testing; Phase 3A changes the bank distribution as documented below. The metadata records the official maximum of 90 questions and 90 minutes as future configuration, without publishing a Certification Mode launch.

## Files and contracts

- `docs/practice/tests/app/index.html`: one standalone application, copied as static assets by MkDocs.
- `docs/assets/javascripts/practice-tests/registry.mjs`: existing Hub exam versions and implemented bank locations; only complete registry entries are selectable.
- `docs/assets/data/practice-tests/a-plus-core-2.json`: versioned examination/domain/objective metadata.
- `docs/assets/data/practice-tests/a-plus-core-2-questions.json`: curated bank. No runtime AI generation or external service.
- `docs/assets/javascripts/practice-tests/engine.mjs`: pure selection, sessions, shuffling, grading, restoration, validation, and resource URL conversion.
- `docs/assets/javascripts/practice-tests/app.mjs`: configuration, question rendering, navigation, feedback, and results.
- `tests/practice-tests.mjs`: bank contract, local resources, scoring, shuffles, and persistence checks.
- `tests/practice-tests-browser.cjs`: student flows at root and project URL prefixes, responsiveness, keyboard, storage failure, and feedback controls.

Each question has a stable ID and choice IDs independent of displayed positions; certification and exam version; official domain and objective IDs; `single` or `multiple` type; stem and optional preformatted evidence; choice text/rationale; correct IDs; overall explanation; difficulty; Hub resources; editorial status; and checked source URLs/date. Render only validated records. The validator and tests reject missing rationales, invalid mappings, invalid answers, and broken local references. Review content manually as well: a schema cannot prove that the answer is technically correct or the distractors are plausible.

Session storage uses `student-hub.exam.session.v1` with a unique session ID and exact bank version. It saves selected IDs, displayed ordering, answers, flags, feedback locks, current position, status, and tool state. Restore rejects malformed, stale, or incompatible sessions and recomputes scores from answer IDs. It does not trust stored score fields. Starting a new test creates new state. Browser storage failure permits the current in-memory attempt and reports the loss of refresh protection. Client-side code and storage are inspectable; hidden feedback is an instructional setting, not a secure exam boundary.

Bump the bank version when assessed content, answer keys, rationales, or objective mappings change. Keep stable question and choice IDs; do not silently resume an older attempt against changed content. A session-schema change also needs a version change or a deliberately tested migration.

Resources are docs-relative Markdown paths in the bank. The shared URL helper maps `.md` and `README.md` paths to published Pages routes without assuming a root-domain deployment. Resource links open separately so following a lesson does not abandon an attempt. Markdown landing pages retain ordinary relative links for GitHub and GitBook; GitBook does not execute the app's static HTML.

## Phase 2: floating Exam Whiteboard

Implemented in `docs/assets/javascripts/practice-tests/whiteboard.mjs`, with pure state/geometry helpers in `whiteboard-state.mjs` and scoped styling in `docs/assets/stylesheets/exam-whiteboard.css`. The component has no question, certification, answer, or scoring dependency and does not access browser storage directly.

Shared adapter:

```js
const whiteboard = mountWhiteboard({
  sessionId: session.id,
  state: session.tools.whiteboard,
  container: document.getElementById('exam-question-content'),
  toolbarMount: document.querySelector('[data-exam-slot="toolbar-tools"]'),
  panelMount: document.querySelector('[data-exam-slot="tool-panels"]'),
  persist: () => saveCurrentSession() // Return false when saving fails.
});
// Use when another examination action attempts to save:
whiteboard.setSaveStatus(saved);
// Before discarding/replacing the attempt or removing its interface:
whiteboard.destroy();
```

Each attempt owns `{ text: '', visible: false, minimized: false, bounds: null, docked: false }`. The optional `docked` preference defaults to false when restoring a Phase 1 session, so existing valid attempts continue without a session version reset. Geometry uses numeric `x`, `y`, `width`, and `height`, relative to the safe content surface. Tool restoration strips unknown properties, accepts only finite coordinates, and caps notes at 200,000 UTF-16 code units. Invalid tool data resets only the affected tool fields; it does not discard valid answers or flags. Starting a new attempt resets every tool field.

The toolbar button toggles the panel. Close and Escape hide it and return focus to the toolbar button. Minimize retains text and expanded geometry. A monospaced plain-text textarea preserves newlines, tabs, spacing, paths, and logs, with native copy/cut/paste/select-all shortcuts and inert pasted markup. Notes and open/minimized/docked state save immediately through the existing session callback. Geometry saves when a pointer gesture ends, after keyboard adjustments, and when a viewport/content change requires clamping. Page hide flushes an unfinished pointer gesture. A persistent warning appears inside the tool if storage is denied or full; the in-memory attempt and notes continue working. Over-limit input is capped, partial pastes retain the available text, and a visible message explains the limit. Clear Notes uses a cancel-first native confirmation dialog and erases only note text.

### Safe layout and accessibility contract

Place the panel mount inside a `position: relative` safe surface, alongside the content container. In floating mode the mount overlays that surface. The container must exclude essential exam controls: in Practice Mode, the toolbar, flag button, question navigator, Check Answer, Previous/Next, and Submit Test are outside it. The panel can cover question content while taking notes, and students can move, dock, minimize, or close it. Keep these reserved areas outside the surface in future Certification Mode/PBQ adapters as well. Do not pass an entire page containing essential controls as the safe container.

Desktop students can drag the title or Resize handle using pointer input. Both controls also accept arrow keys in 16px increments. The Dock button provides an in-flow alternative. At 850px and below, or whenever the safe surface/viewport cannot accommodate a 280×300px window, the tool automatically docks in the document flow. Floating geometry is constrained to the content surface and current viewport size whenever restored or resized. A ResizeObserver handles different question/evidence heights; viewport and virtual-keyboard size changes are also observed. Opening scrolls the window into view; normal page scrolling remains available. Minimized geometry preserves the expanded dimensions. Mobile docking does not overwrite the desktop preference or geometry.

The notes panel is a nonmodal region: exam controls remain keyboard reachable and there is no focus trap. All controls have accessible names and explicit button types. Pointer capture and handle-specific touch behavior prevent a drag from activating answers underneath. The editor retains ordinary text selection/touch scrolling. Only the Clear Notes dialog is modal; cancel/Escape preserves notes and returns focus. The component uses the host's Hub palette and examination button/dialog conventions for light and dark themes. Future adapters must load `exam-whiteboard.css`, provide equivalent base control styling, and destroy the prior instance before mounting a different session. Mount separate, newly initialized tool-state objects for unrelated attempts, modes, certifications, and PBQs; never reuse a global notes record.

### Phase 2 test coverage

The pure suite covers backward-compatible state restoration, oversized/corrupt notes and geometry, geometry boundaries, independent attempts, unchanged grades, and the existing bank/session invariants. Browser coverage exercises open/close/toggle, minimize/restore, mouse and keyboard movement/resizing, native clipboard copy/cut/paste including actual examination evidence, inert markup, limit handling, clear/cancel/Escape, refresh recovery, docking, invalid saved coordinates, answer/flag/navigation isolation, submitted review, denied/full storage, and light/dark 320/390/768/1440px layouts at both root and GitHub project URL prefixes. Existing Practice Mode flows continue to validate exact scoring, single/multiple responses, feedback settings, shuffles, locks, navigation, and resources.

Limitations: the whiteboard is plain text and browser-local; no drawing, rich text, cross-device synchronization, or external clipboard permission is required by the application. A denied/full browser store cannot preserve notes through a refresh. Geometry is local to the safe surface and may be reduced for a shorter question. Certification Mode and PBQ reuse are adapter contracts; their examination interfaces are deferred, not implemented in this phase.

## Phase 3A: Core 2 bank expansion

The existing 24 question records, stable identifiers, choices, keys, rationales, and resource links are unchanged. Added `apc2-025` through `apc2-064` using the same schema and per-question validation metadata. Bank version changes from `2026-10-27.1` to `2026-10-27.2`; the session schema remains version 1.

| Domain | Before | Added | After | Objectives covered before / after |
| --- | ---: | ---: | ---: | --- |
| 1.0 Operating Systems | 6 | 12 | 18 | 6 of 11 / 11 of 11 |
| 2.0 Security | 6 | 12 | 18 | 5 of 11 / 11 of 11 |
| 3.0 Software Troubleshooting | 6 | 9 | 15 | 4 of 4 / 4 of 4 |
| 4.0 Operational Procedures | 6 | 7 | 13 | 6 of 10 / 10 of 10 |
| Total | 24 | 40 | 64 | 21 of 36 / 36 of 36 |

All 15 prior gaps are covered: 1.2, 1.6, 1.7, 1.10, 1.11; 2.4, 2.7, 2.8, 2.9, 2.10, 2.11; 4.4, 4.5, 4.6, 4.9. No objective remains uncovered. New domain totals approximately follow the published 28/28/23/21 weights; Practice Mode still samples its selected pool normally and does not allocate a weighted exam.

The additions comprise 36 single-answer and four two-response items; the combined bank has 58 single-answer and six two-response items. Added difficulty tags: five foundation, 26 applied, nine analysis. Combined tags: eight foundation, 40 applied, 16 analysis. These are editorial categories, not psychometrically calibrated difficulty scores. Seven combined questions include preformatted evidence, including network settings, application requirements, certificate dates, mobile-data settings, Linux permissions, service status, and a Hosts-file mapping.

### Technical and editorial review

Each addition was checked for official objective alignment, a defensible answer or complete answer set, entry-level scope, sufficient scenario evidence, plausible alternatives, and useful overall/choice-specific explanations. Primary references are recorded on each question: Microsoft, Apple, Google, GNU manuals distributed by Debian, NIST, FTC, OSHA, Dell, and hardware-licensing vendor documentation. The official objectives remain the scope reference; a schema pass alone is not the editorial acceptance criterion.

Corrections made during review include:

- Removed a synthetic-full backup distractor that could also simplify recovery. The final question distinguishes differential change sets from incremental chains, weekday full sets, and live mirroring.
- Specified x64 Windows, active Defender Antivirus, and enabled WinRE for the offline-scan item rather than implying identical support on every Windows 11 platform.
- Specified a supervised corporate iPhone and full management context for remote wipe; a queued command is distinguished from completed erasure.
- Kept the UEFI/GPT answer independent of a universal claim about every MBR disk-sector configuration. Partition style is distinguished from filesystem format.
- Distinguished a data reset from restoring a modified Android OS; browser encryption from site legitimacy; file deletion from sanitization; and recipient authorization from encrypted delivery.
- Shortened correct choices that contained unnecessary explanatory detail. Existing validated questions were not mechanically rewritten. Among the 36 added single-answer items, five correct choices are longest including ties and 11 are shortest including ties. In the combined 58 single-answer items, 12 are longest including ties and 18 are shortest including ties. There is no answer-length acceptance quota; these diagnostics informed manual review.

All 64 stems are distinct. A text-similarity check found no pair above a 0.60 SequenceMatcher ratio; manual topic review also checked for near-duplicate scenarios rather than relying on text similarity. Related backup, browser, and malware items test different decisions or mechanisms. Every addition has a verified objective-breakdown link; relevant existing Linux/Windows references and published network, malware, and troubleshooting PBQs provide additional follow-up where appropriate. No reference pages were duplicated.

### Validation and future coverage

The expanded tests assert the 64-question total, 18/18/15/13 domain counts, all 36 objectives, stable sequential IDs, 40 additions, four added multiple-response items, resource paths/anchors, 1/10/20/30/50/all selection, 200 shuffled sessions, every single-answer key in all four displayed positions, and exact-set scoring. A genuine previous-version 24-question attempt is rejected without mutating its saved responses or notes. Browser checks launch all 15 previously uncovered objectives, complete all 64 questions, test feedback combinations and persistence, and exercise the Phase 2 whiteboard in both themes at 320/390/768/1440px and both hosting prefixes.

Local verification passed: `npm run test:practice-tests`, strict MkDocs build, generated navigation and listing freshness, source checks, 31 Python tests, catalog model/schema checks, 19 canonical PBQ validations, site checks covering 71 HTML pages and 4,563 local links/assets/fragments, and the existing resource-navigation, PBQ-library, and analytics regression suites. Desktop configuration and mobile whiteboard/question layouts were visually inspected. No shared examination JavaScript, whiteboard code, session schema, grading rules, or examination styles changed in this phase.

Future expansion must deepen subtopic coverage and produce enough distinct questions for full-length randomized attempts. Fifteen objectives still have only one question: 1.1, 1.3, 1.4, 1.5; 2.1, 2.3, 2.5, 2.6; 4.2, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10. Having one item mapped to an objective does not assess every bullet or establish mastery. Bank changes deliberately require a new attempt; there is no silent migration of old responses to a revised bank.

## Phase 3B: Core 2 coverage depth

Preserved all 64 existing question records, including stable identifiers, choices, answer sets, rationales, resources, and validation metadata. Added `apc2-065` through `apc2-104` with the existing schema. The bank version moves from `2026-10-27.2` to `2026-10-27.3`; the session schema remains version 1. Old attempts require a fresh test rather than silently reusing answers with the updated bank.

| Domain | Before | Added | After | Objectives covered | Minimum items per objective |
| --- | ---: | ---: | ---: | --- | ---: |
| 1.0 Operating Systems | 18 | 11 | 29 | 11 of 11 | 2 |
| 2.0 Security | 18 | 11 | 29 | 11 of 11 | 2 |
| 3.0 Software Troubleshooting | 15 | 9 | 24 | 4 of 4 | 5 |
| 4.0 Operational Procedures | 13 | 9 | 22 | 10 of 10 | 2 |
| Total | 64 | 40 | 104 | 36 of 36 | 2 |

All 15 previously single-item objectives now have two questions: 1.1, 1.3, 1.4, 1.5; 2.1, 2.3, 2.5, 2.6; 4.2, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10. Objective 4.6 retains its two existing items; the remaining additions broaden other subtopics without duplicating those privacy and licensing questions. The 29/29/24/22 totals approximate the published domain weights, but ordinary Practice Mode selection remains unweighted.

Added 37 single-answer items and three two-response items. Combined bank: 95 single-answer and nine two-response items. Added difficulty tags: seven foundation, 25 applied, eight analysis. Combined tags: 15 foundation, 65 applied, 24 analysis. These remain editorial categories rather than calibrated exam difficulty scores. Eight additions include preformatted evidence; the combined bank has 15 evidence-bearing items. New evidence includes Windows listener/PID output, cloud-license findings, account-policy values, memory/pagefile observations, Android administrator settings, a Windows proxy configuration, an explicit ticket-priority policy, and a short PowerShell script.

### Technical and editorial review

Reviewed all 40 additions against official objective scope and primary technical documentation, with checked dates and item-specific review notes on every record. The additions reference 39 distinct source URLs including the scope PDF. Sources include Microsoft, Apple, Google/Android, APT documentation distributed by Debian, NIST, MITRE, FTC, Dell, and Schneider Electric. Operational priority and approval questions supply their governing local policies instead of assuming universal business rules.

Corrections and distinctions established during review:

- Added `-PathType Container` to the script's `Test-Path` check so a same-named file cannot be treated as a backup folder. The stem defines the check, and feedback distinguishes reporting readiness from actually creating a backup.
- Replaced two mobile-account drafts with Android application-security items directly tied to objective 3.3: removing an active malicious device-administrator app and scanning sideloaded apps with Play Protect. The removal item specifies an unmanaged phone with owner-accessible deactivation rather than bypassing organizational device ownership.
- Used adjacent media/runtime distractors for the Windows N item and authentication-related distractors for SSO. Replaced weaker package-management and application-repair alternatives with plausible neighboring operations.
- Specified encrypted-form EFS backup and the required private key; separated it from NTFS permission records and BitLocker recovery. Specified non-T2 Intel Mac hardware for the FileVault item rather than implying that modern Apple hardware starts with unencrypted storage.
- Separated missing Windows Setup storage drivers from filesystem changes, quality-update removal from feature rollback, firmware patching from credential changes, and confirmed ransomware file changes from a browser-only warning.
- Labeled condensed findings as observations or settings; the netstat excerpt uses the real Windows column/flag conventions. Synthetic scenario values do not purport to be a captured production incident.

All 104 stems are distinct. A combined text-similarity diagnostic found no pair above a 0.60 SequenceMatcher ratio (maximum approximately 0.569). Manual review also checked mechanisms and decisions: related items such as browser-only scareware versus confirmed file encryption, ordinary uninstall versus device-administrator removal, and Hosts-file versus proxy changes assess different causes or procedures. No duplicate scenario was identified by that review; text similarity alone is not the acceptance criterion.

Among the 37 added single-answer items, seven correct choices are longest including ties and 13 are shortest including ties. Across all 95 single-answer items, 19 are longest including ties and 31 are shortest including ties. The additions' stored key positions are 9/9/10/9 for a/b/c/d; the displayed choices are randomized independently. These diagnostics informed wording review without imposing artificial equal-length choices or a length quota.

### Validation and remaining limits

The engine suite asserts 104 validated records, the four domain totals and additions, all 36 objectives with at least two eligible items, stable sequential IDs, three added multiple-response items, and unique selection for counts including 99, 100, and all 104. It checks 200 shuffled full-bank sessions, every single-answer key in each displayed position, exact-set multi-response credit, and rejection of genuine 24-question and 64-question previous-version attempts without mutating their saved answers or notes.

Browser coverage launches every objective, tests custom-count availability and a persisted 100-question attempt, completes all 104 questions, checks new evidence verbatim at 320px, follows Hub resources and anchors, and retains the feedback, navigation, whiteboard, storage-failure, theme, and hosting-prefix regressions. Feedback tests select explicit single-item samples or locate the intended multi-response item instead of relying on an objective having only one eligible record.

Local verification passed: `npm run test:practice-tests` (engine and full browser suite), `mkdocs build --strict`, generated PBQ/navigation freshness, source checks, 31 Python tests, the catalog model and 19 canonical PBQ validations, generated-site checks covering 71 HTML pages and 4,563 local links/assets/fragments, and analytics. Existing PBQ-library, learning-resource-navigation, help-desk triage, malware-remediation, Windows startup-recovery, Windows BSOD/application, and Linux command-reference suites also passed. Local browser checks used the installed Chromium headless shell through the existing `PBQ_CHROMIUM_PATH` option because the full browser executable could not start in this runtime. No shared application JavaScript, whiteboard implementation, stylesheet, grading rule, or session-schema change was needed; the existing landing/configuration descriptions now show the accurate bank size and minimum coverage.

Further curation should deepen individual subtopics, especially Windows command/disk tools, macOS/Linux administration, mobile and browser hardening, backup rotation, incident records, and AI privacy. Two questions mapped to an objective do not cover all its bullets. A 100-question custom Practice Mode attempt is now possible, but a timed, weighted certification examination and PBQ examination adapters remain separate implementation work. Existing independently authored practice and percentage-scoring notices remain visible.

## Remaining implementation phases

1. Certification Mode: version-specific exam configuration, published domain weights with documented integer allocation, persisted absolute deadline, countdown, expiry submission, flags/review, no feedback until submission, and transparent practice scoring. Full PBQ adapters are separate work; an unknown type must be rejected rather than silently misgraded as an MCQ.
2. Continued question curation in bounded batches as needed. Add other certifications only with verified metadata and validated banks, preserving existing Hub exam versions unless explicitly updated. Objective counts alone do not establish complete examination coverage.
3. Final integration, regression review, and PR after the assigned implementation phases. Do not create the PR during Phase 3B.

## Editorial review of the pilot

The bank uses independently authored scenarios. Each was reviewed against the official objective, the evidence supplied, the defensible answer set, and all distractor rationales. OS and command behavior was cross-checked with Microsoft, Apple, and GNU documentation; authentication with NIST; wireless authentication with Microsoft's NPS documentation; malware/browser behavior with Google guidance; and backup dependencies with NIST contingency-planning material. CompTIA's official process is explicitly named where question 11 asks about its prescribed malware sequence. Practice feedback explains that isolating a system differs from quarantining one file.

The pilot includes recognition items, application, diagnosis, preformatted Linux permissions/service state, and two multiple-response items. Avoid word/length/position clues, unspecified organizational priority policies, or complex engineering requirements outside A+. Automated option-length diagnostics assist review but do not force unnatural equal-length choices. Stable IDs ensure shuffled choices retain their rationale and grading.

Editorial review corrected the MFA question to ask for two alternative second factors for an existing password; its original wording allowed several knowledge/possession pairings. Among 22 single-answer items, seven correct choices are longest and seven are shortest. Across 200 seeded test sessions, every single-answer key appears in all four displayed positions.

## Phase 1 verification

- Pure-engine and bank checks passed, including exact-set multi-response scoring, 200 shuffled sessions, corrupt/stale restore, response locking, local resources, and whiteboard state independence.
- Browser flows passed at root and `/it-cyber-student-hub/`: all-question 100% completion, partial/unanswered credit, all permitted feedback combinations, filters/count limits, keyboard/modal/touch, refresh and fresh sessions, unavailable storage, no-JS fallback, actual resource routes/anchors, and 320/390/768/1440px layouts.
- Desktop/mobile screenshots were inspected in light and dark themes. Visual review fixed theme-button contrast and restored normal answer-label spacing/weight.
- Strict MkDocs build, navigation freshness, source checks, 31 Python tests, catalog schema/listings, 19 canonical PBQs, and generated-site link/search/subpath checks passed. The site checker covered 71 HTML pages and 4,562 local links/assets/fragments.
- Existing learning-resource navigation, PBQ library, and analytics regression tests passed. The navigation test's external Kahoot observation now fulfills a local fixture before returning to the Hub; an aborted external navigation previously raced Chrome's error page against the next local navigation. No application behavior was changed by that test repair.

Run `npm run test:practice-tests` after `mkdocs build --strict`. `PBQ_CHROMIUM_PATH` can select an installed Chromium executable when the environment cannot use Playwright's default. CI runs the new suite on this feature branch and pull requests.

## Phase 2 verification

- `npm run test:practice-tests` passed: pure state/bank/geometry checks and full Practice Mode/whiteboard browser flows at root and project URL prefixes, including single and multiple responses, evidence copying, submission/review continuity, keyboard, and mobile touch controls.
- Light and dark layouts passed at 320, 390, 768, and 1440px. Desktop/mobile screenshots were inspected; essential navigation and submission controls remain outside the floating surface.
- Strict MkDocs build, source checks, generated navigation/listing freshness, 31 Python tests, PBQ catalog checks, and site checks passed: 19 canonical PBQs, 71 HTML pages, and 4,563 local links/assets/fragments.
- Existing PBQ library, learning-resource navigation, help-desk ticket-triage, and analytics regression suites passed. The navigation suite passed on retry after a transient timeout; the unchanged Phase 1 baseline also passed.
- Question-bank content, certification registry, grading rules, and the existing examination stylesheet were unchanged. Certification Mode, bank expansion, and PBQ examination adapters remain deferred. No pull request or merge is part of this phase.
