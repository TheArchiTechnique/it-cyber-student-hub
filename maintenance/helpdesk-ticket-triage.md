# Help Desk Ticket Triage & Resolution PBQ

Canonical route: `docs/practice/pbqs/a-plus-core-2/helpdesk-ticket-triage/`. Catalog ID: `helpdesk-ticket-triage`. Feature branch: `content/a-plus-core2-helpdesk-ticket-triage`.

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
| HD-7335 | Disabled/stopped dependency versus documented Automatic/Running baseline; delegated local service changes | One user has an equivalent working web editor and remains on schedule |
| HD-7346 | Per-site 175% page zoom, normal other sites/apps, unchanged Windows scaling | Usable site, no blocked work, no deadline today |

Arrival times and ticket identifiers do not establish the priority order. Queue status styling is neutral. Randomized option ordering avoids a fixed answer-position pattern. All diagnoses have four scenario-relevant choices; response choices include plausible but unsupported or unauthorized alternatives. No graded ticket solution or priority sequence appears in the Lesson.

Primary alignment is 220-1202 objective 4.1. Supporting numbering was checked against the official CompTIA objectives: 1.4, 1.5, 1.7, 2.7, 2.11, 3.1, 3.4, and 4.6. Page zoom is supporting configuration knowledge, not separately claimed as an enumerated browser-security setting. Organizational containment/escalation does not substitute for or redefine the SOHO malware-removal process.

Sources consulted: [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf), [Microsoft security groups](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups), [Microsoft nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup), [Windows service error codes](https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-), and [CISA ransomware guidance](https://www.cisa.gov/stopransomware/ransomware-guide).

## Verification and continuation

`node tests/helpdesk-ticket-triage.cjs` checks 200 saved/shuffled attempts, all 720 processing orders against an independent inversion count, all 48 technical answer choices, review gates, serialized processing, submitted-state immutability, and malformed restore data. Independently specified answer keys are used in the tests.

After `python -m mkdocs build --strict`, `npm run test:helpdesk-ticket-triage` exercises real controls at both root and project-subpath routes: full/partial scores, incomplete submission, work sequence versus inspection, completed-ticket edits, reload during work and after submission, retry/reset/cancel, all ticket sections and attachments, image magnification, modal focus and keyboard tabs, touch, no-JS Lesson access, storage denial, related resource paths/fragments, and catalog/certification discovery at 320/390/768/1440px. `PBQ_CHROMIUM_PATH` can select an available Chromium executable.

The catalog/listing/navigation generators remain authoritative. The new help-desk topic belongs to the existing software subject. CI runs the new suite on feature-branch pushes and pull requests. Existing fixed inventory checks advance to 19 global PBQs and 7 Core 2 PBQs. This does not change existing PBQ behavior.

Phase 2 may perform an independent student-flow and content QA pass and correct confirmed defects on this same branch. Final branch reconciliation and PR creation follow that review. Phase 1 does not open a pull request or merge.

Phase 1 validation passed locally: strict MkDocs build; catalog/navigation generation checks; source checks; all 31 Python tests; catalog JavaScript checks; built catalog and site checks (19 PBQs, 69 HTML pages, 4,428 local links/assets/fragments); analytics checks; the new model/browser suite; and existing Startup Recovery, BSOD/Application, Phishing, Malware, Global PBQ Library, and learning-resource navigation suites. Desktop and mobile renders were visually inspected. No confirmed defects remain. Independent Phase 2 review and final PR preparation are deferred.
