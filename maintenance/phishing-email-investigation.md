# Phishing Email Investigation maintenance

The activity modifies the published PBQ in place. It uses the dependency-free `app/model.js`, existing shared PBQ stylesheet and navigation injection, and unchanged catalog identity, URL, and Core 2 / Security classifications. No shared architecture changes are required.

## Model and instructional boundaries

The bank has 14 messages (seven phishing, three spam, four legitimate). Each attempt draws three phishing, two spam, and two legitimate messages. Only the neutral subject, sender address, Reply-To when present, meaningful requests, links, and attachments are selectable; recipient, date, greeting, display name, signature, and isolated deadline remain ordinary text. This keeps weak cues such as time pressure in the teaching analysis without requiring or grading them in isolation. The same selectable-area rules apply to all messages, and evidence interaction is enabled solely by the student's Phishing selection, never by the answer key.

`indicators` defines phishing evidence; `analysis` separates attacks, persuasion tactics, and technical concepts with scenario-specific explanations. `explanation` and `verification` provide classification feedback and optional additional checks for every message. Do not reintroduce `context`, pre-submission case verdicts, per-email response selection, or technique-identification grading. General Lesson and investigation guidance must not disclose current answers. Only the submitted results render scenario explanations, analysis, evidence answers, verification guidance, and response reasoning.

| Scenario | Assessment | Visible basis |
| --- | --- | --- |
| Account renewal notice | Phishing | Lookalike sender, unrelated renewal hostname, account-password request |
| Benefits reconciliation | Phishing | Claimed internal HR identity, unrelated reply mailbox, password and MFA-code request |
| Document sharing | Phishing | Displayed document URL differs from the credential destination under another controlling domain |
| Executive supplier deposit | Phishing | CFO target (whaling), claimed CEO authority, external reply mailbox, bypassed approval and verification |
| Revised invoice | Phishing | Cedarstone lookalike with a zero, final .js extension, script execution and security bypass |
| Badge verification | Phishing | Lookalike identity, password request through unrelated QR destination |
| Delivery exception | Phishing | Carrier impersonation, unrelated destination, payment-card request through a deceptive tracking destination |
| Accessory catalog | Spam | Visible unsolicited business marketing, consistent catalog destination, no harmful request |
| Preference survey | Spam | Non-subscriber mailing, ordinary product-preference questions, no account or payment request |
| Webinar | Spam | Bulk promotion to public business contacts, consistent event destination |
| Maintenance | Legitimate | Consistent company addresses and status hostname, ordinary maintenance preparation |
| HR schedule | Legitimate | Company sender, routine coverage planning, no account, payment, or execution request |
| Supplier invoice | Legitimate | Consistent vendor domain hierarchy, existing payment process, no bank change |
| Printer appointment | Legitimate | Consistent company service domain hierarchy, ordinary appointment request |

These are best-supported assessments from the message, not claims that unseen records or remote pages were checked. Verification text explains what a technician could check next. Do not equate urgency, external mail, attachment presence, a different Reply-To, or HTTPS with a verdict. Distinguish executive targeting from executive impersonation and lookalike domains from proven spoofing. Security 2.4/2.5 are the primary official foundation; pretexting, urgency, and typosquatting are supporting terms, not separately enumerated Version 2.0 objectives.

## Response decisions and scoring

Five response situations cover credential exposure, executed code, payment exceptions, campaign escalation, and unexpected authentication. Each attempt draws three, shuffling and persisting the option order. Every alternative carries explanatory feedback. Actions stay within Tier 1 authority and established procedures; only the executed-code scenario explicitly authorizes network disconnection.

Maximum: 14 classification + 9 phishing evidence + 6 response = **29**. Evidence requires both actual Phishing and the student's Phishing classification. It is `3 × max(0, TP/K − FP/B)`, rounded to two decimals, with deduplicated valid selections, a zero floor, and no benign-mail or empty-evidence award. Each message must retain at least one benign selectable area, so indiscriminately selecting every area earns zero evidence points. Integral count arithmetic keeps half-cent rounding stable. Message maxima are 5 for phishing and 2 for benign mail. Attack analysis and verification are unscored.

## Persistence and lifecycle

The existing localStorage key is retained with schema version **3**. Versions 1 and 2, malformed, duplicate, unbalanced, or unknown scenario sets reset to a fresh balanced attempt. Incompatible versions display a migration notice. Restore sanitizes classifications, evidence, response choices, read states, selection, and option order. Evidence outside a Phishing classification is discarded. Incomplete saved attempts cannot restore submitted results. Storage denial uses page-session state with a visible status.

Retry retains answers but clears results from the DOM. Reset retains message IDs, response IDs, and option order while clearing answers and read states. New Investigation draws a new balanced attempt and guarantees a different message sequence even with a constant random source.

## Validation

`node tests/phishing-email-investigation.cjs` runs randomized balance, independently reviewed answer-key and exhaustive evidence-subset scoring, technique/content metadata, separate-response scoring, lifecycle, and malformed-state tests. After `python -m mkdocs build --strict`, `npm run test:phishing-email-investigation` adds browser coverage of all 14 messages, conditional evidence, independent classifications, hidden answers, complete/partial/false-positive grading, response feedback, retry/reset/new, migration, persistence, keyboard/touch, inert content, responsive layouts, and root/project-subpath integration. `PBQ_CHROMIUM_PATH` can select an installed Chromium. The GitHub validation workflow includes the redesign feature branch.

## Phase 2 QA checkpoint

Reviewed all 14 visible messages, their analysis and verification guidance, the Lesson, and all five response cases against the official objective scope. Corrected five cases where every selectable region was a valid indicator: neutral subjects now remain selectable in every message, and the existing proportional penalty makes indiscriminate selection earn zero evidence credit. Subject changes keep time-pressure and secrecy cues in their original body context. Recipient, date, greeting, signature, and isolated deadlines remain ungraded.

Removed an unsupported urgency label from the badge lure, avoided claims that a purchase order or beneficiary had been independently verified, clarified MFA-code terminology, and removed the incongruous employee-password demand from the carrier-payment lure. Response alternatives now include plausible but incomplete verification, investigation, and recovery actions; their feedback explains why they do not replace the correct first response. Schema version 3 resets older attempts so prior answer choices are not displayed with revised wording or evidence rules.

Expanded checks cover every evidence subset under all classifications, all five response cases with both correct and incorrect choices in the browser, all destination inspectors under each classification, and clearing a classification. QA retains the 29-point maximum, scenario balance, original route, catalog identity, and shared Student Hub shell. No additional activity features or shared architecture were introduced.
