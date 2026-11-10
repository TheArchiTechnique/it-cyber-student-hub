# Network+ IPv4 Subnetting Learning Lab

Branch: `feature/network-plus-subnetting-lab`.

## Phase 1 checkpoint

The standalone activity is in `docs/labs/networking/subnetting/app/`. Its three sections share one workspace: a progressive binary lesson, a manually completed calculation worksheet, and a quick reference. No shared UI or calculation code from other activities was changed.

`engine.mjs` contains pure arithmetic, mask/input validation, state-shape validation, and operation checks. `app.mjs` handles presentation, five aligned binary rows, individual bit controls, full-row paste, decimal answers, guided/independent modes, attempt-gated solutions, confirmation dialogs, and browser persistence. New Example cycles a fixed 12-example sequence; it is not an assessment generator.

All prefixes from /0 to /32 are accepted for numeric block calculations. /31 assumes a supporting point-to-point link with two endpoints. /32 represents one address. Both use N/A for the decimal broadcast answer; the binary OR row still represents the upper boundary. Conventional capacity calculations do not imply that every numerically included address is suitable for ordinary host assignment in special-purpose ranges.

Phase 1 kept the [overview](../docs/labs/networking/subnetting/README.md) in draft. Phase 2 publishes it through the existing visibility/navigation workflow. The built standalone app can be tested directly at `labs/networking/subnetting/app/` under the GitHub Pages project subpath. The feature branch is the review source; merging and public deployment are separate later steps.

## Phase 2 checkpoint

The Practice tab provides 5/10/15/20-question sessions with all-category or focused coverage. `practice.mjs` generates 20 question types across categories A–H, using `engine.mjs` for every subnet calculation and conventional capacity decision. It balances categories, removes repeated calculation identities, shuffles four unique answer choices, and mixes choices, prefix/mask selections, and direct-entry addresses/numbers/relationships. Explanations teach the calculation rather than only naming an answer. Questions use conventional /16, /20, /21, and /22–/30 examples; the worksheet's /31 and /32 treatment is unchanged.

`practice-ui.mjs` handles submissions, equal question scoring, category results, full answer review, fresh sessions, and confirmation before replacing work. Browser state stores a generator version, seed, count, coverage, cursor, student drafts, and submitted answers. Rehydration regenerates questions deterministically and recomputes scores. No saved score or supplied answer key is trusted. Changes to the generation algorithm must increment `generatorVersion` and explicitly handle incompatible saved sessions rather than silently changing answers.

The worksheet UI is reused for question calculations. Regular worksheet, question scratch sheet, and practice session use separate storage keys. Scratch sheets start blank; checks and solutions are locked until that question is submitted. CIDR-from-mask, minimum-subnet-selection, and bit-role questions do not open a prepared sheet that would disclose the requested value. Valid-host questions open the given network block rather than the correct host choice. Starting a fresh session restores the regular worksheet if a question sheet was open.

The single published overview is linked from Network+, Networking Labs, Learn/Networking, and Practice Questions. `SUMMARY.md` is regenerated through `sync_navigation.py`; there is no PBQ catalog record because this is a learning lab. Shared production styles, navigation hooks, and the Phase 1 calculation engine are unchanged.

## Validation

```sh
npm ci
python -m pip install -r requirements.txt
python scripts/sync_pbq_listings.py --check
python scripts/sync_navigation.py --check
python scripts/check_source.py
python -m unittest discover -s tests -p 'test_*.py'
python -m mkdocs build --strict
python scripts/check_site.py
python scripts/check_pbq_catalog.py --site-dir site
npm run test:network-plus-subnetting
npm run test:network-plus-subnetting -- --browser
```

Install Playwright Chromium with `npx playwright install chromium` before browser checks, or use the existing `PBQ_CHROMIUM_PATH` override. Browser tests serve the actual MkDocs output at `/it-cyber-student-hub/`. The existing Phase 1 checks remain intact. Extended model checks cover 20,000 generated questions across seeded and fresh-random property runs, every question type and common prefix, equivalent input formatting, category balance, distractor uniqueness, answer position variation, threshold selection, comparison across third-octet boundaries, scoring, and malformed/partial saved state. Browser checks cover all four sections, entry/choice/selection controls, pre-submission solution locks, scratch isolation, drafts/submission/results persistence, restart/cancel, full results review, storage failure recovery, 320–1440px layouts, all four discovery routes, canonical launch URLs, and search publication.

Local arithmetic, source, publication, and strict-build checks run in Work. This runtime cannot launch Chromium because of its process/socket restrictions; browser checks run in the repository's GitHub Actions validation job. Inspect the feature branch's current run before reporting browser success. The standard networking navigation check also preserves the existing Packet Tracer paths while recognizing the added subnetting card.

Technical sources: [CompTIA N10-009 objectives v6.0](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652), [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021), and [RFC 4632](https://www.rfc-editor.org/rfc/rfc4632). The lesson explanations and examples are original.

## Phase 3 release review

Integrated current `main` through `67b7d5d4e2cb2ad66088496318fe577b073bf05b`, preserving the Day 4/Day 5 Kahoot listings, their test expectations, and all completed subnetting work. The merge required no conflict resolution.

Clarified the containing-subnet question to explicitly request a Network ID and prefix, distinguishing a canonical network identifier from a host/CIDR expression. Recovery now rejects missing or undefined seed, count, or coverage metadata instead of letting session-creation defaults regenerate different questions beneath saved answers. Model and browser regression checks cover damaged saved metadata.

The generator algorithm, version 1 question identities, correct answers, choice ordering, and valid saved-session scoring are unchanged. A compatibility comparison against the Phase 2 checkpoint covered 25,000 questions and 2,000 valid saved sessions. Independent Python `ipaddress` validation covered 4,224 address blocks across /0–/32, 8,000 generated questions across all 20 types, all 12 quick-reference rows, and both complete binary worked examples. The conventional /23 and /25 capacities and the /31 and /32 exceptions are consistent throughout.

All four discovery paths use the same published overview and canonical application. The generated summary includes it once; search and project-subpath link validation remain part of the normal build. Final browser and navigation checks run against that built application in GitHub Actions. Pull-request validation precedes user approval for merging.
