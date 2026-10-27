# Shared CompTIA practice tests

Feature branch: `feature/certification-practice-tests`. GitHub is the continuation checkpoint. Fetch, inspect the existing branch and commits, and continue this implementation in each later phase. Do not recreate the application or commit to main. Every implementation phase ends with tests, commit, push, full SHA, and STOP. Final QA and PR creation follow implementation phases.

## Phase 1 boundary

Implemented: a shared static Practice Mode, domain and objective selection, question counts constrained by the actual eligible bank, single and multiple response questions, question/choice shuffling, flags/navigation, feedback settings, explicit immediate feedback with answer locking, exact-set scoring, local refresh recovery, results, Core 2 integration, and 24 initial questions (six per domain).

The 36 Core 2 objective identifiers and domain weights come from CompTIA's official 220-1202 objectives v2.0, verified 2026-10-27. Labels are concise descriptions; the official PDF is the authoritative wording. Configuration shows objectives with no bank coverage as unavailable. Pilot distribution is deliberately even for configuration testing, not an exam-weighted simulation. The metadata records the official maximum of 90 questions and 90 minutes as future configuration, without publishing a Certification Mode launch.

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

## Remaining implementation phases

1. Curated bank expansion in bounded batches: broaden Core 2 objective coverage and variety before presenting a full certification simulation. Add other certifications only with verified metadata and validated banks, preserving existing Hub exam versions unless explicitly updated.
2. Certification Mode: version-specific exam configuration, published domain weights with documented integer allocation, sufficient bank coverage, persisted absolute deadline, countdown, expiry submission, flags/review, no feedback until submission, and transparent practice scoring. Do not advertise the 24-item pilot as a full-length exam. Full PBQ adapters are separate work; an unknown type must be rejected rather than silently misgraded as an MCQ.
3. Final integration, regression review, and PR. Do not create the PR during Phase 2.

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
