# Phishing Email Investigation maintenance

The activity uses a dependency-free model and the existing PBQ layout, stylesheet, navigation injection, and catalog generators. Message-specific `indicators` and explanations in `app/model.js` are the grading source of truth. The student-facing overview and Lesson tab do not include the scenario answer key.

## Scenario criteria

The interactive activity reveals the following criteria only after submission.

| Scenario | Classification and response | Valid suspicious evidence |
| --- | --- | --- |
| Password expiration | Phishing; report | Lookalike sender domain, unrelated renewal destination, company-password request through an unapproved workflow |
| Benefits reconciliation | Phishing; report | Impersonated benefits domain, unrelated reply mailbox, request for password and MFA code |
| Document-sharing invitation | Phishing; report | Displayed document URL differs from its actual unapproved sign-in destination |
| Executive supplier deposit | Phishing; report | External Reply-To, bypassed payment approvals, instruction to avoid independent verification |
| Revised invoice viewer | Phishing; report | Impersonated supplier domain, final .js attachment extension, request to run a script and bypass protection |
| Mobile badge verification | Phishing; report | Unapproved sender domain, unapproved badge/password workflow, unrelated QR sign-in destination |
| Delivery exception | Phishing; report | Impersonated carrier domain, unrelated tracking destination, unsupported card-payment request |
| Office accessory catalog | Spam; junk/block | None; independent security review confirms unsolicited bulk advertising |
| Product-preference survey | Spam; junk/block | None; independently verified non-sensitive marketing survey with no sign-in |
| Productivity webinar | Spam; junk/block | None; independently verified public advertising page |
| VPN maintenance | Legitimate; no additional action | None; approved sender, known change record, consistent status destination |
| HR holiday schedule | Legitimate; no additional action | None; expected message and attachment matching the internal calendar |
| Supplier docking-station invoice | Legitimate; no additional action | None; approved vendor and reply subdomain, verified order, unchanged payment process |
| Printer appointment | Legitimate; no additional action | None; known ticket and documented third-party notification provider |

## Validation

Run `node tests/phishing-email-investigation.cjs` for the model tests. After `mkdocs build --strict`, run `npm run test:phishing-email-investigation` for browser coverage against the actual site at both root and project-subpath routes. `PBQ_CHROMIUM_PATH` can select an installed Chromium executable. The validation workflow runs this suite on this feature branch and pull requests.

Evidence scoring normalizes both correct and incorrect selections by their available counts. Selecting every detail earns zero evidence credit. Messages without suspicious indicators earn full evidence credit when none are selected. Classification and response credit are independent. Bank changes must retain at least three distinct phishing patterns and two messages in each other category per attempt.
