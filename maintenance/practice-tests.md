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

## Floating Exam Whiteboard: explicit later-phase requirement

Phase 1 reserves session-owned `tools.whiteboard` and examination mount points `data-exam-slot="toolbar-tools"` and `data-exam-slot="tool-panels"`. No whiteboard window, inactive button, dragging code, or resize code is implemented in Phase 1. There is no whiteboard dependency in question selection or scoring.

In the subsequent examination-interface phase, implement one reusable whiteboard component for Practice Tests, Certification Mode, and future PBQ examination integration. It receives the current session ID, the examination container, toolbar/panel mount points, a reference to its own tool-state object, and a callback to persist that session. It must not read or modify grading answers. Do not couple the component to Core 2 or an individual PBQ.

Required functionality:

- A toolbar Whiteboard button opens or hides the compact floating window.
- A draggable title bar supports movement inside the examination interface.
- The window/writing area is resizable; minimize preserves notes; close hides without clearing.
- Students can type notes, calculations, troubleshooting observations, and technical information.
- Standard keyboard copying and pasting from questions, logs, command outputs, and examination material works. Do not intercept the usual copy/paste shortcuts or disable question text selection.
- Use a readable monospaced plain-text writing area preserving newlines, spaces, and tabs for technical output. Pasted markup must remain inert; preserving readable technical layout does not require inserting HTML.
- Clear Notes requires confirmation before erasing content.
- Preserve text, visibility, minimized state, and useful geometry throughout the current test and refresh. Clamp restored geometry to the current examination viewport.
- New tests receive empty, independent notes. Do not carry notes across session IDs, modes, or certifications. Clear/discard operations affect only the intended session.
- Keep essential submission/navigation controls reachable, including at narrow sizes and when the panel is large. Define reserved control regions or an accessible docked fallback.
- Support mouse, keyboard, and touch where practical, including focus management, named controls, keyboard move/resize or an equivalent accessible layout, and reachable minimize/close controls.
- Notes stay in browser-local storage, require no account or external service, and never affect scoring.

Reserved tool state: `{ text: '', visible: false, minimized: false, bounds: null }`. Bounds will use numeric `x`, `y`, `width`, and `height`. Restore treats notes as text, validates geometry, and limits text to 200,000 characters so corrupt storage cannot create an unbounded restoration. The later component should show its note-size limit and handle storage-quota failures. Reuse the existing session persistence path rather than a global notes key.

Whiteboard acceptance tests belong to that later phase: open/close/minimize preservation, pointer and keyboard move/resize, paste whitespace, clear/cancel, refresh recovery, viewport changes, new-test/mode isolation, storage failure, control nonoverlap, and identical scores before/after note edits.

## Remaining implementation phases

1. Subsequent examination-interface phase: build and integrate the complete floating whiteboard described above. It must work in current Practice Mode and expose the shared adapter contract for later modes.
2. Curated bank expansion in bounded batches: broaden Core 2 objective coverage and variety before presenting a full certification simulation. Add other certifications only with verified metadata and validated banks, preserving existing Hub exam versions unless explicitly updated.
3. Certification Mode: version-specific exam configuration, published domain weights with documented integer allocation, sufficient bank coverage, persisted absolute deadline, countdown, expiry submission, flags/review, no feedback until submission, and transparent practice scoring. Do not advertise the 24-item pilot as a full-length exam. Full PBQ adapters are separate work; an unknown type must be rejected rather than silently misgraded as an MCQ.
4. Final integration, regression review, and PR. Do not create the PR during Phase 1.

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
