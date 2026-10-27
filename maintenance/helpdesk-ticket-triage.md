# Help Desk Ticket Triage & Resolution PBQ

Canonical route: `docs/practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/`. Catalog ID: `helpdesk-ticket-triage`. Feature branch: `content/a-plus-core2-helpdesk-ticket-triage`.

## Current update: assigned priorities and shorter A+ cases

Continued on the existing feature branch after PR #57 merged. This update supersedes the original strict six-ticket ranking and the longer scenario wording documented in the historical checkpoints below.

Each queue row and ticket detail shows a text priority badge. The activity instructions and Lesson state the rule: Critical, High, Medium, then Low. HD-7352 is Critical; HD-7329 and HD-7318 are High; HD-7341 is Medium; HD-7335 and HD-7346 are Low. Same-category tickets may be processed in either order with full credit. The 15 pair relationships and 39-point maximum remain; the two same-category pairs receive credit once both tickets have been processed, regardless of their relative position. Results identify an accepted example sequence and explain equal-priority pairs without implying a hidden tie-breaker.

All six requests, contexts, notes, technical choices, and feedback are shorter and use basic A+ troubleshooting clues. The former service-account password scenario is now a Windows account-lockout scenario. The other cases retain ransomware recognition and initial isolation, approved folder access, client DNS, a disabled application service, and browser zoom. Attachments retain three screenshot captures and three concise text records. Removed the business-deadline ranking exercise and detailed enterprise response/authorization conditions. The dashboard, inspection requirements, processing controls, resources, and 39-point categories are retained.

The unchanged browser storage key now uses schema version 2 because a scenario and its answer IDs changed. Older attempts start fresh with an update notice; current attempts retain their queue, selections, processing order, and submitted state. Priority labels and grading come from the scenario model, not saved priority fields.

Regression coverage independently checks all 720 sequences against the displayed categories, all four valid orders within tied categories, full and partial scores, all 48 technical choices, initial and detail badges, equal-priority feedback through student controls, legacy-state reset, and responsive badge layout at 320/390/768/1440px. The six-scenario wording and clues were reviewed against the linked official 220-1202 objectives, particularly Windows users/groups and Services, Windows network commands/settings, malware recognition, and ticket severity.

Local verification passed: strict MkDocs build; listing/navigation/source/catalog/site and analytics checks; all 31 Python tests; the expanded Help Desk model/browser suite; and the current Malware Investigation model/browser regression. The full-credit and partial-credit submissions, equal-priority orders, saved-state reset/restore, keyboard/touch controls, and all four required viewport sizes passed. Desktop and mobile renders were visually inspected. Only this PBQ, its existing maintenance record, and its regression suite changed.

## Phase 1 implementation

The existing Windows Startup Recovery stylesheet supplies the PBQ shell, tabs, controls, panels, and result presentation. The standard MkDocs post-build hook supplies Student Hub navigation and analytics. Activity-specific CSS styles the fictional Northstar service desk interior; no shared runtime or stylesheet changes are required.

Six original tickets cover suspected active ransomware, a shared application service credential failure, approved group access, client DNS configuration, an application dependency service, and browser page zoom. The queue is a fixed 09:10 snapshot, without a running timer. Its visual order and dropdown option orders shuffle at the start of each attempt and remain stable across reloads. Default queue order never equals the rubric order or its reverse.

Three ticket sections are required per ticket. Six attachments across five tickets include three original SVG UI captures with readable transcripts and magnification, an event export, an endpoint observation log, and a network comparison. The sixth ticket has no attachments. All assets are local and inert; no download or external diagnostic tool is required.

Inspection changes only review state. Begin Work requires every ticket, section, and attachment to have been opened, then appends the chosen ticket ID once. Only one uncompleted ticket can be active. Completion requires both dropdowns; completed tickets remain editable before submission without altering their recorded position. An escalated response is explicitly a Tier 1 handoff, not a claim that the incident has been fully resolved.

## Scoring and persistence

The pure model uses 15 ticket-pair relationships, 2 points per issue, and 2 points per action, totaling 39. Diagnosis and action earn independent credit. Inspection earns no points. All expected answers, priority reasoning, and ticket-specific explanations are rendered only after valid submission. The submitted attempt is read-only; evidence and Lesson access remain available.

Storage key: `student-hub-helpdesk-ticket-triage-v1`; schema version 1. Restore validates queue membership, option permutations, allowed answer IDs, inspection IDs, the completed sequence prefix, the single active ticket, and submission readiness. Invalid/incompatible state starts a fresh attempt. Storage denial preserves functionality for the page session with an explicit status message. The result is recomputed from persisted decisions rather than trusting a saved score.

Reset and Retry both require confirmation and begin a fresh attempt: answers, inspections, recorded sequence, and results clear, and the queue changes. There is no server-side assessment protection or real service-desk connection. This is the normal static GitHub Pages practice model.

## Content review

The rubric was reviewed against the visible request, context, notes, and attachments independently from the UI implementation. There are no intended priority ties:

| Case | Supporting diagnosis and authorization | Relative impact distinction |
| --- | --- | --- |
| HD-7352 | Unexpected executable, payment note, continuous file renames, pending isolation; authorized endpoint containment and responder handoff | Ongoing damage can spread through organizational records |
| HD-7329 | Service logon events after password rotation; owner confirms stale stored credential; application owner controls configuration | Every shipment release has already stopped at both depots; no workaround |
| HD-7318 | Valid approval, missing required group, working comparison account and share, no deny; delegated membership correction | One bid deadline at 09:45; no alternate route or coordinator |
| HD-7341 | Valid address and gateway; incorrect manually specified resolver; direct query to approved resolver succeeds | Three users continue using a shared approved workstation |
| HD-7335 | Disabled/stopped dependency versus documented Automatic/Running baseline; delegated local service changes | One user has an equivalent working web editor, with slower manual file transfers, and remains on schedule |
| HD-7346 | Per-site 175% page zoom, normal other sites/apps, unchanged Windows scaling | Usable site, no blocked work, no deadline today |

Arrival times and ticket identifiers do not establish the priority order. Queue status styling is neutral. Randomized option ordering avoids a fixed answer-position pattern. All diagnoses have four scenario-relevant choices; response choices include plausible but unsupported or unauthorized alternatives. No graded ticket solution or priority sequence appears in the Lesson.

Primary alignment is 220-1202 objective 4.1. Supporting numbering was checked against the official CompTIA objectives: 1.4, 1.5, 1.7, 2.7, 3.1, 3.4, and 4.6. Page zoom is supporting configuration knowledge, not separately claimed as an enumerated browser-security setting. Organizational containment/escalation does not substitute for or redefine the SOHO malware-removal process.

Sources consulted: [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf), [Microsoft security groups](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups), [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [Windows service error codes](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-), and [CISA ransomware guidance](https://www.cisa.gov/stopransomware/ransomware-guide).

## Verification and continuation

`node tests/helpdesk-ticket-triage.cjs` checks 200 saved/shuffled attempts, all 720 processing orders against an independent inversion count, all 48 technical answer choices, review gates, serialized processing, submitted-state immutability, and malformed restore data. Independently specified answer keys are used in the tests.

After `python -m mkdocs build --strict`, `npm run test:helpdesk-ticket-triage` exercises real controls at both root and project-subpath routes: full/partial scores, incomplete submission, work sequence versus inspection, completed-ticket edits, reload during work and after submission, retry/reset/cancel, all ticket sections and attachments, image magnification, modal focus and keyboard tabs, touch, no-JS Lesson access, storage denial, related resource paths/fragments, and catalog/certification discovery at 320/390/768/1440px. `PBQ_CHROMIUM_PATH` can select an available Chromium executable.

The catalog/listing/navigation generators remain authoritative. The new help-desk topic belongs to the existing software subject. CI runs the new suite on feature-branch pushes and pull requests. Existing fixed inventory checks advance to 19 global PBQs and 7 Core 2 PBQs. This does not change existing PBQ behavior.

Phase 2 may perform an independent student-flow and content QA pass and correct confirmed defects on this same branch. Final branch reconciliation and PR creation follow that review. Phase 1 does not open a pull request or merge.

Phase 1 validation passed locally: strict MkDocs build; catalog/navigation generation checks; source checks; all 31 Python tests; catalog JavaScript checks; built catalog and site checks (19 PBQs, 69 HTML pages, 4,428 local links/assets/fragments); analytics checks; the new model/browser suite; and existing Startup Recovery, BSOD/Application, Phishing, Malware, Global PBQ Library, and learning-resource navigation suites. Desktop and mobile renders were visually inspected. Independent Phase 2 review and final PR preparation were deferred at the Phase 1 checkpoint.


## Phase 2 independent QA and corrections

Verified Phase 1 commit `d57cb9595c01604928612ff47774382ccca71c77` against GitHub and current `main` (`18a463d4a444903bce3dee1c385e347cd602a0df`) from a clean working tree. Continued the existing feature branch. The six scenarios, issue/action IDs, scoring weights, rubric order, interface, catalog identity, and persistence schema remain intact. Existing saved attempts remain compatible.

### Confirmed defects corrected

- **Delayed dialog focus:** Phase 1 GitHub Actions run [40445609199](https://github.com/TheArchiTechnique/it-cyber-student-hub/actions/runs/40445609199) failed when End did not activate the Lesson tab. Reproduction showed that the queued confirmation-dialog `close` handler moved focus back to Reset after the user had already moved to Activity. Removed the redundant delayed focus moves from confirmation and attachment closure. Native dialog closing restores the unchanged opener; an accepted fresh attempt still explicitly focuses the new queue. A deterministic regression moves focus before the queued close event and verifies it stays on Activity.
- **Nonfunctional image magnification:** rendered inspection found that Enlarge capture changed its pressed state without changing image width. The existing `#evidence-content img` width rule overrode the less specific enlargement selector. The corrected local selector now enlarges the capture to 1,230px within its own scroll container. Regression checks measure increased image width, panning extent, return to fitted width, and absence of document overflow at every required viewport.
- **Answer-length cue:** all six correct corrective actions were previously the longest option. Balanced the wording of the existing alternatives and two diagnosis sets without changing their meaning or identifiers. The correct fix is no longer consistently longest or shortest; no additional choices or graded categories were introduced.
- **Adjacent priority ambiguity:** the original fully functional web workaround did not state a concrete workflow cost, weakening the distinction between HD-7335 and the final usability request. Its Context now says that manual file transfers add about ten minutes per saved revision. Feedback reflects this single-user slowdown. This is a business-impact clarification, with no severity label or priority hint.
- **Objective and shortcut precision:** removed 2.11 from the claimed assessed objectives because the browser case tests page zoom rather than security configuration. Related-study context remains. Feedback now distinguishes manually setting 100% zoom from Ctrl+0 restoring the browser default.

### Independent content and priority findings

Reviewed the full requests, contexts, notes, all three original image captures and their transcripts, and all three text attachments independently of the automated score expectations. All six technical answer keys are supported. The service credential case explicitly excludes disabled/locked accounts and delegates service changes to the application owner; the access case provides valid approval and missing group membership; the DNS case compares configured and known-good resolvers; the report service capture contradicts its baseline; and the browser capture establishes a per-site zoom setting. The security case justifies authorized containment and escalation rather than cleanup or restoration.

Adjacent ranking review retained the existing strict sequence:

| Adjacent distinction | Student-visible basis |
| --- | --- |
| Expanding security harm before stopped service | Ongoing changes to organizational records; isolation is still pending |
| Stopped service before blocked bid | Both depots are already unable to release any shipment; the single bid deadline is still ahead |
| Blocked bid before catalog workaround | Near-term submission cutoff with no alternative, versus continued work on a shared workstation |
| Catalog workaround before report workaround | Three people queue for one station, versus one author’s manual file-transfer slowdown |
| Report workaround before browser layout | Repeated measured workflow cost, versus a usable site with no blocked task or deadline today |

No remaining tie requires equivalent-order credit. Arrival times and requester titles do not drive this ranking. Lesson examples are separate from the graded cases and contain no solution sequence. Primary 4.1 and the supporting objective numbers were rechecked against the linked official CompTIA objectives. Service log interpretation, group-based access, name-resolution output, browser shortcuts, and containment boundaries were checked against Microsoft and CISA primary sources. Additional references: [service logon errors](https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/startup-shutdown/error-1069-service-cannot-start), [Edge shortcuts](https://support.microsoft.com/en-us/edge/keyboard-shortcuts-in-microsoft-edge), and [CISA ransomware response checklist](https://www.cisa.gov/ransomware-response-checklist).

### Validation coverage and limitations

Extended the existing suite to cover restore before inspection, during inspection, active work with a partial answer, several completed tickets, the completed queue, and submitted results. Inspection arrays are sets; their internal normalization order is not a work-order change. Queue order, dropdown order, answers, and work sequence are compared exactly across valid reloads.

Independent grading checks include 39/39, all 720 priority permutations, reversed priority, single and multiple inversions, all-correct diagnoses with wrong actions, wrong diagnoses with correct actions, every diagnosis/action option, and a completely wrong 0/39 attempt. Browser submissions separately verify 39, 36, 12, and 27 points using real controls. Unknown/duplicate IDs, invalid sequence prefixes, incomplete inspections, malformed JSON, incompatible versions, and injected score fields do not award credit. Filtering/reopening does not alter recorded decisions or order. Submitted controls remain read-only.

Responsive QA inspects actual dashboards, ticket details, capture viewers, magnification, Lesson content, and long results at 320, 390, 768, and 1440px. It checks keyboard tab wrapping, focus restoration, Escape, reset/retry confirmation and cancellation, touch controls, labels, local assets, storage denial, no-JS Lesson access, and root/project-subpath routing. Internal resource links and fragments, catalog uniqueness, Core 2 discovery, and generated MkDocs/GitBook navigation remain valid. The Phase 1 inventory-count changes correctly describe 19 total PBQs and 7 Core 2 PBQs; its validation trigger and added malware-topic membership assertion remain justified.

This remains a static practice activity. Saved score fields are ignored and results are recomputed from validated decisions, but browser developer tools can replace an otherwise valid local attempt. No client-only storage format provides server-side assessment integrity. Responsive/touch testing uses Chromium emulation, not a physical-device or assistive-technology certification. No new dependencies or shared architecture changes were introduced. Final reconciliation and pull-request creation belong to Phase 3.

Phase 2 local verification passed: strict MkDocs build; generator/source/catalog/site/analytics checks; all 31 Python tests; the expanded help desk model/browser suite; Global PBQ Library and learning-resource navigation suites; and Windows Startup Recovery, Windows BSOD/Application, Phishing Email Investigation, and Malware Investigation/Remediation model/browser regressions. All four required viewport renders were inspected, including fitted/enlarged evidence and long result explanations. No remaining confirmed runtime, scoring, navigation, or accessibility defect was found. Phase 3 can perform final branch reconciliation and PR preparation after the pushed commit's Actions run succeeds.
