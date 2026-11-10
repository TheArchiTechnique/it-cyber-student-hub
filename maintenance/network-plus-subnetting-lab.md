# Network+ IPv4 Subnetting Learning Lab

Branch: `feature/network-plus-subnetting-lab`.

## Phase 1 checkpoint

The standalone activity is in `docs/labs/networking/subnetting/app/`. Its three sections share one workspace: a progressive binary lesson, a manually completed calculation worksheet, and a quick reference. No shared UI or calculation code from other activities was changed.

`engine.mjs` contains pure arithmetic, mask/input validation, state-shape validation, and operation checks. `app.mjs` handles presentation, five aligned binary rows, individual bit controls, full-row paste, decimal answers, guided/independent modes, attempt-gated solutions, confirmation dialogs, and browser persistence. New Example cycles a fixed 12-example sequence; it is not an assessment generator.

All prefixes from /0 to /32 are accepted for numeric block calculations. /31 assumes a supporting point-to-point link with two endpoints. /32 represents one address. Both use N/A for the decimal broadcast answer; the binary OR row still represents the upper boundary. Conventional capacity calculations do not imply that every numerically included address is suitable for ordinary host assignment in special-purpose ranges.

The [overview](../docs/labs/networking/subnetting/README.md) uses the existing draft metadata so the repository's automatic visibility system does not add navigation before Phase 2. The built standalone app can be tested directly at `labs/networking/subnetting/app/` under the GitHub Pages project subpath. The feature branch is the review source; merging and public deployment are separate later steps.

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

Install Playwright Chromium with `npx playwright install chromium` before browser checks, or use the existing `PBQ_CHROMIUM_PATH` override. Browser tests serve the actual MkDocs output at `/it-cyber-student-hub/`. Unit checks cover every octet value and prefix, independently specified /12, /16, /22 through /32 and /0 fixtures, all 160 binary error positions, logical operations, unsigned address-space extremes, and malformed inputs/state. Browser checks cover typing, paste, bit toggles, checking/retry, solution gating, complete guided/independent calculations, reference-table values, reset/cancel/new example, local persistence/failure recovery, keyboard navigation, and 1440/768/390/320px layout.

Technical sources: [CompTIA N10-009 objectives v6.0](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652), [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021), and [RFC 4632](https://www.rfc-editor.org/rfc/rfc4632). The lesson explanations and examples are original.

## Deferred

Phase 2: randomized certification-style questions, mixed question formats, scored sessions, assessment explanations/results review, and final Network+ navigation/catalog integration. Publish the overview through the existing visibility/navigation workflow when integration is ready. Keep the calculation engine shared between the worksheet and later assessments.

Phase 3: independent QA, integration verification, final branch review, and pull-request creation. No pull request or merge belongs to Phase 1.
