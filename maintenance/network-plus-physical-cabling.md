# Network+ physical cabling and installation

## Checkpoints and scope

Branch: `content/network-plus-physical-cabling-pbq`.

Canonical activity: `docs/practice/pbqs/network-plus/physical-cabling-installation/`.

Phase 1 checkpoint: `49eaea42437005b8ccb2e7f0c7b5d79b4921a50f`. Its three-story building renderer, room roles, rack units, cable jobs, answer options, and 21 individual scoring rules are preserved. The existing Activity/Lesson shell, exit navigation, catalog identity, reset/retry, and saved-progress workflow remain the foundation. No shared application code, styles, routing, or dependencies change in Phase 2.

Phase 2 checkpoint: `3835f15e0210612985a6d4b311560b46de6834bf`. Phase 2 adds receiving inspection, termination acceptance, tool jobs, three additional fault tickets, and the corresponding lesson content. It adds 16 assessed decisions to the original 21, for 37 total. The termination acceptance ticket is Fault A; it is counted once, not repeated in the follow-up fault section.

## Objective-to-interaction map

Scope authority: [CompTIA N10-009 objectives, version 6.0](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652), rechecked 2026-11-03, alongside the Hub's Network+ objective breakdown. These descriptions summarize the relevant concepts.

| Objective | Implemented work |
| --- | --- |
| 1.5: Media and transceivers | Original backbone/media choices; photographed UTP, STP, coax, DAC; connector recognition; all eight requested connector families in the photographic lesson; SMF/MMF and SFP/QSFP comparisons |
| 2.4: Installation factors | Original MDF/IDF, racks, copper/fiber panels, patching, and environmental requirements; delivery records distinguish physical families from installation approval |
| 3.1: Documentation | Original building and rack diagrams, room survey and cable schedule; follow-up outlet and maintenance records |
| 5.2: Physical interface issues | Split-pair diagnosis, interference evidence, incompatible replacement optic, and excessive attenuation/length, with supported corrections |
| 5.5: Tools | Match a wire-map tester, toner/probe, and visual fault locator to realistic jobs; interpret simulated observations and tool limitations |

T568A/B diagrams and riser context support termination and installation understanding. They are not presented as standalone explicitly listed objectives. Optical multiplexing, BiDi, advanced optical calculations, vendor connector engineering, and detailed building-code assessment are outside the required activity.

## Work orders and scoring

| Assessed section | Decisions | Evidence and interaction |
| --- | ---: | --- |
| Original installation | 21 | Existing room labels, nine rack units, backbone/horizontal media, independent H2 jacket rating, patching and DAC |
| Media recognition | 4 | Photographic construction/assembly inspection with reusable labels or dropdowns |
| Connector recognition | 4 | Photographed RJ45, F-type, LC, and MPO receiving records; all eight connector labels are available, and all eight have lesson photos |
| Module family | 1 | Actual QSFP+ photograph plus a model record; classify the family separately from the connector/application |
| Copper termination / Fault A | 1 | Simulated pin-for-pin continuity and a failed pair-integrity test; identify split pairs and the appropriate T568B repair |
| Tool jobs | 3 | Trace an outlet, interpret an open-conductor wire map, and interpret visible light escaping from damaged fiber |
| Follow-up Faults B–D | 3 | Evidence-supported interference repair, replacement-optic compatibility repair, and correction of a too-long copper channel |
| Total | 37 | One point per decision, independently evaluated |

Each disposition combines diagnosis and repair into one work-order decision. Every option is checked against its own fixed evidence. Original H1 continues to accept either Cat6 UTP or Cat6A UTP. Original room mistakes cannot invalidate correct cable choices; new mistakes cannot change original scores. No correct answer is preselected. Results appear on submission, with per-decision selections, acceptable answers, explanations, and group totals. Review is read-only until Continue editing. Reset requires confirmation and clears this PBQ's complete attempt only.

New photographic matching supports native drag/drop, select-then-place, keyboard activation, and native dropdowns. Images open in a focus-trapped native dialog with credits; the activity uses neutral specimen/work-order titles and descriptive alt text. Tool illustrations are reference choices, not preassigned answers. Generic simulated records state the available measurements without impersonating vendor output or implying that a basic LED tester certifies Ethernet performance.

## Persistence compatibility

The existing storage key `student-hub.network-plus.physical-cabling.v1` remains the stable identity. Stored data now uses schema version 2. A version 1 attempt retains every recognized original answer and its selected room. Previously submitted version 1 attempts reopen so the new work orders can be completed; a visible message explains that the installation answers were kept. Unknown legacy fields are not interpreted as new answers. Version 2 preserves all 37 answers and the review state across refreshes. Invalid choices are filtered; malformed or blocked storage leaves a usable activity.

## Technical checks and references

- [Cisco 10GBASE SFP+ modules](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html): original SR/MMF and LR/SMF compatibility and short supported DAC assemblies.
- [Cisco 40GBASE QSFP modules](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-660083.html): form factor versus specific optical application, including the specified QSFP+ SR4/MPO example. The photographed 24-fiber MPO is assessed only by connector family; it is not approved as a lead for the separate SR4 module record.
- [Siemon modular-plug pin reference](https://files.siemon.com/en/instruction/210_s210-s110-patch-plug_ii.pdf) and [field-plug termination reference](https://files.siemon.com/int-download-installation-instructions/wa_cat-6-utp-field-plug-termination_ii.pdf): T568A/B conductor assignments. Original diagrams explicitly use the contact-side view, mating nose upward, cable below, latch underneath, with pin 1 left and pin 8 right. A textual eight-pin table accompanies the colors.
- [Fluke Networks split-pair evidence](https://www.flukenetworks.com/knowledge-base/microscanner2/twisted-pair-test-results-microscanner2) and [pair-integrity explanation](https://www.flukenetworks.com/support/knowledge-base/linkiq/split-pair-identification): pin-for-pin continuity can coexist with split pairs and excessive crosstalk.
- [Fluke Networks VFL capabilities](https://www.flukenetworks.com/datacom-cabling/fiber-testing/VisiFault-Visual-Fault-Locator): visible continuity and some accessible faults, distinct from optical power or loss certification.
- [Fluke Networks channel/permanent-link reference](https://www.flukenetworks.com/blog/cabling-chronicles/channel-permanent-link-patch-cords-mptl-e2e-oh-my): ordinary 90 m permanent-link / 100 m complete-channel limits. The new attenuation ticket supplies a performance-capable tester and an approved shorter route.
- [Fluke Networks 10GBASE-T field testing](https://www.flukenetworks.com/knowledge-base/applicationstandards-articles-copper/10gbase-t-field-testing-requirements): Cat6 reach depends on alien crosstalk and qualification; Cat6A supports the specified 100 m application.
- [Fluke Networks IntelliTone functions](https://www.flukenetworks.com/datacom-cabling/copper-testing/IntelliTone-Pro-Toner-and-Probe): tracing and wire-map testing can coexist in one instrument. The tool jobs distinguish the function/mode in use.
- [Belden cable ratings](https://de.belden.com/blog/communications-cable-ratings): unchanged environment-dependent jacket reasoning. Category, shielding, and fire/smoke rating remain distinct.

## Photographs, optimization, and rights

`photos.js` is the single runtime credit/alt-text manifest for the 16 new local photographs. Activity, lesson, and inspection dialog reuse the same image files. Source, author, license link, and changes are accessible in captions and the dialog. Public-domain declarations are linked to their source pages. WebP copies preserve photographed hardware details; no connector details are synthesized. The RJ45 image is a close crop retaining the plug and contacts, without an overlaid answer name.

| Asset | Source / photographer | License | Changes |
| --- | --- | --- | --- |
| `01.webp` (utp) | [Photograph](https://commons.wikimedia.org/wiki/File:UTP_cable.jpg) · Baran Ivo | Public domain | Encoded as WebP; uncropped |
| `02.webp` (stp) | [Photograph](https://commons.wikimedia.org/wiki/File:Cross_section_of_a_shielded_Cat6_patch_cable.jpg) · TubeTimeUS | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resized and encoded as WebP; uncropped |
| `03.webp` (coax) | [Photograph](https://commons.wikimedia.org/wiki/File:Cross_section_of_an_LMR-195_coaxial_cable.jpg) · TubeTimeUS | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resized and encoded as WebP; uncropped |
| `04.webp` (dac) | [Photograph](https://commons.wikimedia.org/wiki/File:Twinax-CAB-10GSFP-P8M.jpg) · Labsy | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Encoded as WebP; uncropped |
| `05.webp` (rj11) | [Photograph](https://commons.wikimedia.org/wiki/File:6P2C_RJ-11.jpg) · Aeroid | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resized and encoded as WebP; uncropped |
| `06.webp` (rj45) | [Photograph](https://commons.wikimedia.org/wiki/File:Patch_cable_with_RJ45_connector.jpg) · www.heimnetzwerke.net | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | Cropped to connector area; encoded as WebP |
| `07.webp` (f) | [Photograph](https://commons.wikimedia.org/wiki/File:F-Stecker_und_Kabel.jpg) · Peter Trieb | Public domain | Encoded as WebP; uncropped |
| `08.webp` (bnc) | [Photograph](https://commons.wikimedia.org/wiki/File:BNC_connector_(male).jpg) · Krzysztof Burghardt | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Resized and encoded as WebP; uncropped |
| `09.webp` (lc) | [Photograph](https://commons.wikimedia.org/wiki/File:LC-optical-fiber-connector-hdr-0a.jpg) · Adamantios | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Resized and encoded as WebP; uncropped |
| `10.webp` (sc) | [Photograph](https://commons.wikimedia.org/wiki/File:SC-optical-fiber-connector-hdr-0a.jpg) · Adamantios | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Resized and encoded as WebP; uncropped |
| `11.webp` (st) | [Photograph](https://commons.wikimedia.org/wiki/File:ST-optical-fiber-connector-hdr-0a.jpg) · Adamantios | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Resized and encoded as WebP; uncropped |
| `12.webp` (mpo) | [Photograph](https://commons.wikimedia.org/wiki/File:MPO_Stecker_HR.jpg) · Reichle & De-Massari | [CC BY-SA 3.0 de](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en) | Resized and encoded as WebP; uncropped |
| `13.webp` (sfp) | [Photograph](https://commons.wikimedia.org/wiki/File:SFP-side.jpg) · Adamantios | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Resized and encoded as WebP; uncropped |
| `14.webp` (qsfp) | [Photograph](https://commons.wikimedia.org/wiki/File:QSFP-40G-SR4_Transceiver.jpg) · Jesseschulman; background/levels edit by Nosachevd | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Encoded as WebP; uncropped |
| `15.webp` (tester) | [Photograph](https://commons.wikimedia.org/wiki/File:Network_cable_tester.jpg) · George Shuklin | Public domain | Encoded as WebP; uncropped |
| `16.webp` (toner) | [Photograph](https://commons.wikimedia.org/wiki/File:FLUKE_networks_IntelliTone_Pro_200.JPG) · Dmitry G | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Resized and encoded as WebP; uncropped |

The original `rack.jpg` remains an unmodified [Dsimic photograph](https://commons.wikimedia.org/wiki/File:19-inch_rackmount_Ethernet_switches_and_patch_panels.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The existing `fiber.jpg` is [Fabienne Serriere's AMS-IX photograph](https://commons.wikimedia.org/wiki/File:AMS-IX_optical_patch_panel.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); its content is preserved while resizing to 1600 × 1067 and compressing for the web. Its caption records that change. New hardware photos total approximately 1.3 MB; the old fiber image drops from about 4.2 MB to 0.29 MB.

All new photos were visually inspected. A misleading combined UTP/shielded sample and a retail-shelf coax photo were rejected. The RJ11 photo is a true 6P2C example; the RJ45 close-up exposes eight contacts. The coax cross section is an RF specimen, not a claim of approval for a 75-ohm broadband handoff. The original VFL SVG is explicitly an illustration; tester and toner/probe examples use actual photographs. Cable-test observations are generic simulations with stated capabilities.

## Verification

- `npm run test:network-plus-physical-cabling`: original 21-decision scoring across every option, all 16 additions, full/partial/incorrect attempts, accepted alternatives, independent scoring, deterministic/non-mutating grading, version 1 migration, version 2 persistence validation, conductor order, oriented diagram pin positions, and licensed/optimized local asset inventory.
- After `mkdocs build --strict`, `npm run test:network-plus-physical-cabling -- --browser`: real Chromium drag/drop, keyboard/click/touch matching, all original room/rack/cable tasks, all new decisions, image inspection, full/partial score and feedback, retry/reset, refresh, legacy attempts, blocked storage, both tabs, all photographs and local links, T568 diagrams, and 320–1440 px layouts under root/project hosting.
- Applicable repository checks: generated PBQ listings/navigation, Markdown sources, Python validation suite, catalog queries, strict MkDocs build, built catalog/site links, and analytics. No new testing framework or runtime dependency is introduced.

The Phase 2 browser pass used Chromium. Phase 3 coverage and remaining verification limits are recorded below; simulated field records are not physical-equipment test results.

Phase 2 verification completed 2026-11-03: the checks listed above passed locally, including all 38 Python tests and the full 37-decision Chromium interaction suite. Desktop/mobile screenshots were inspected for cable photos, the connector gallery, and both termination diagrams. An explicit comparison with the Phase 1 checkpoint confirmed identical original decision definitions, both building renderings, and all three rack-unit renderers.

## Phase 3 QA checkpoint — 2026-11-03

**Status: PASS WITH LIMITATIONS.** No known release-blocking defect remains. Work continued from the fetched Phase 2 checkpoint on the same feature branch; main was inspected and the initial working tree was clean. The fixes retain 37 decisions, all option IDs and accepted answers, the saved-state schema/key, and the original UI and building scenario. No shared application code or navigation architecture changed.

### Findings and corrections

| Reproduced finding | Correction / verification |
| --- | --- |
| The module record explicitly named the family students were asked to identify | Replaced that name with the documented application, four data lanes, and optical interface. The photograph and descriptive alt remain usable evidence; a regression check rejects the family name in the active prompt/record. |
| The photographed IntelliTone instrument can perform wire-map testing as well as tracing, making device-only tool labels ambiguous | Choices and instructions now distinguish wire-map, tracing, and visible-light functions. The wire-map explanation acknowledges combined instruments. Answer IDs and scoring are unchanged. |
| Inspection placement buttons shared the generic accessible name “Assign identification” | Each now exposes its work-order name and current selection. Browser accessibility-tree inspection confirms descriptive specimen alt text remains available without naming scored specimens. |
| Submission status announced that results existed but omitted the score | The existing live status now includes the numeric score; results still receive focus. |
| The skip link was outside the banner landmark, reported by the accessibility scan | Moved the same link inside the header, preserving its destination and visible behavior. |
| Invalid legacy answers could trigger a notice claiming answers had been kept | The migration notice now depends on recognized answers surviving sanitization. Valid version 1 attempts still retain all original answers and reopen for the added work. |
| Displayed photo captions shortened or omitted the manifest's complete modification notice | Activity, lesson, and photo dialog now display the existing full notice, including WebP conversion. Sources, licenses, authors, and image files are unchanged. |

### Technical and student-experience review

- Rechecked official N10-009 version 6.0 and the Hub objective breakdown for 1.5, 2.4, 3.1, 5.2, and 5.5. No extra subjects or questions were added. MDF/IDF roles are scenario-specific; the lesson does not require one IDF per floor or prescribe universal rack placement.
- Verified Cat6/Cat6A application and complete-channel reasoning, the independently assessed environmental-air jacket requirement, passive panels versus switches, RJ45 patching, and the explicitly supported short DAC. Shielding, category, and jacket rating remain distinct.
- Confirmed the supplied 850 nm SR/OM3/duplex-LC and 1310 nm LR/OS2/duplex-LC scenarios against Cisco specifications. The 55 m OM3 SR link is within its application reach. The LR replacement fault has an incompatible optic, despite fitting connectors and visible continuity. MPO connector recognition does not approve the photographed 24-fiber lead for a separate SR4 module.
- Checked both eight-pin T568 sequences and contact-side orientation against Siemon references and the rendered diagrams. Pin 1 is left with nose upward and latch underneath. The acceptance ticket's swapped conductors split the 3/6 and 4/5 pairs at both ends while maintaining pin-for-pin continuity; its correction and simulated pair-capable result agree. Auto-MDI-X is not described as repairing split pairs.
- Reviewed every fault's symptom, evidence, distractors, diagnosis, and repair. Interference has motor correlation plus a successful reroute; attenuation has measured insertion-loss failure and excessive documented length. Wire-map, pair detection, performance certification, tone tracing, and visible-light fault location are distinguished. No basic tester or VFL is claimed to certify Ethernet/optical performance.
- Reviewed the complete lesson, fresh-attempt work order, all three rack inspections, all 37 decisions, submission explanations, and retry. Instructions support native dragging, reusable labels, keyboard/click placement, and dropdown completion. The existing section structure and expandable lesson keep this a substantial practice activity without adding work.
- Compared the actual Phase 1 checkpoint definitions: all original 21 tasks, both building renderings, and all three rack-unit renderers are identical. Compared Phase 2's 16 scoring contracts: IDs, groups, option IDs, and accepted answers remain unchanged.

### Images, accessibility, and integration

All 16 inspection photographs and both Phase 1 photographs were visually inspected. Hardware, distinctive connector features, captions, and accessible descriptions match. RJ11 shows a six-position/two-contact telephone plug; RJ45 exposes eight contacts. The RF coax sample is not represented as an approved broadband handoff. The fiber panel photo makes no unsupported connector-type claim. All 16 enlarged views decode the complete local image in both tested engines; the lesson also loads both original photos. No photographs required replacement. Source pages for all 18 images, their credited creators, selected licenses, upstream QSFP edit notice, and the four distinct Creative Commons license destinations were rechecked. Full conversion/crop/resize notices are now visible.

Real-browser runs cover 320, 375, 768, 1280, and 1440 px, including results and expanded lessons. The page has no horizontal overflow at these sizes; the large building retains its explicitly labeled internal scroll region. Narrow rack controls and connector photos, enlarged photos, and termination diagrams were visually reviewed. Keyboard selection can complete all 37 decisions. Tabs support arrows/Home/End, dialogs receive focus and restore their opener on Escape, reset initially focuses Keep working, and current status/score use the existing live region. Native touch emulation covers room, cable, connector placement, and photo inspection.

An ad hoc axe-core 4.14.0 scan (WCAG 2 A/AA, WCAG 2.1 AA, and best-practice tags) found no remaining violations in the tested Activity, expanded Lesson, photo-dialog, and results states after the landmark fix. This supplements keyboard, focus, labels, contrast, accessibility-tree, and responsive checks; it is not assistive-technology certification. The scanner was installed only in scratch, not added as a repository dependency.

The Network+ certification page and Network+ listing each link to one canonical overview. Metadata keyword search finds the activity once; the catalog launch and return navigation work at root and `/it-cyber-student-hub/`. Search indexes the overview once. Generated navigation, GitBook Summary, MkDocs navigation, launch assets, and local lesson references pass validation. The overview retains the approved canonical GitHub Pages launch URL used by the other GitBook/Hub PBQ pages. Existing SOHO physical-installation and wireless-coverage tabs/navigation also pass smoke checks; their state remains isolated.

### Executed validation

| Check | Result |
| --- | --- |
| `npm run test:network-plus-physical-cabling` | PASS: all 37 decisions across every option; all-correct/all-wrong/partial/mixed attempts; H1 alternative; independence; deterministic, non-mutating grading; malformed state shapes; v1/v2 handling; pin order/orientation; local photo inventory; answer integrity |
| `.venv/bin/mkdocs build --strict` | PASS; browser runs use this built output |
| `npm run test:network-plus-physical-cabling -- --browser` | PASS in Chromium 153.0.8010.0, using `PBQ_CHROMIUM_PATH` and the local runtime library path |
| `MOZ_DISABLE_CONTENT_SANDBOX=1 npm run test:network-plus-physical-cabling -- --browser --firefox` | PASS in Firefox 153.0; environment setting is required by this headless execution environment |
| Browser scenarios in both engines | PASS at both hosting bases: complete matching/keyboard attempts; all-wrong, unanswered, partial, mixed, and alternate scoring; section totals; no duplicate feedback; immutable review; retry/reset/refresh; retained v1 and submitted v2 attempts; malformed JSON/values/versions; unavailable storage; state isolation; reusable/replacement/wrong-family drops; all 16 photo dialogs; lesson/tab/focus controls; touch emulation; responsive layouts; discovery and back links; no runtime errors |
| `npm run test:pbq-library` | PASS: inventory, filters/search, canonical links, root/project hosting, keyboard/touch, responsive themes, loading/retry, publication states, and no-JS navigation |
| `npm run test:learning-resource-navigation` | PASS: student journeys/returns, resource links, quizzes, keyboard focus, desktop/mobile, both themes |
| `scripts/sync_pbq_listings.py --check`; `scripts/sync_navigation.py --check` | PASS; generated files are current |
| `scripts/check_source.py` | PASS: 845 local Markdown links; 60 student pages covered once in GitBook |
| `.venv/bin/python -m unittest discover -s tests -p 'test_*.py'` | PASS: 38 tests |
| `node tests/pbq-catalog.mjs`; `scripts/check_pbq_catalog.py --site-dir site` | PASS: 20 canonical published PBQs and association/path/listing validation |
| `scripts/check_site.py` | PASS: 83 HTML pages; 6,588 local links/assets/fragments; search and project-path coverage |
| `node tests/hub-analytics.cjs` | PASS: event, retry, deduplication, privacy, and host-isolation checks |
| `git diff --check` and checkpoint comparisons | PASS; changes are limited to this PBQ, its existing suite, and this maintenance file |

Python scripts above were executed with the repository's `.venv/bin/python`. Browser checks run on the actual strict site build, not a duplicate preview.

### Verification limits

WebKit/Safari, physical mobile devices, and live screen-reader/assistive-technology sessions were not tested. Touch coverage uses browser emulation. No physical cable/tool measurements were conducted; all field reports remain explicitly simulated. Hosted GitBook rendering and a production deployment of this unmerged branch were not exercised. These are verification limits, not known application blockers. No new runtime dependencies, separate QA package, or shared architecture changes were introduced.

## Continuation

Phase 3 QA is complete with the limits above. Phase 4 will perform the final branch comparison and pull-request review workflow. No PR was created, no merge was performed, and Phase 4 has not started.
