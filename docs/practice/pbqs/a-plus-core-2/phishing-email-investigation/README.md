# Phishing Email Investigation

Review a simulated Northbridge Systems inbox as a Tier 1 IT support technician. Inspect senders, reply addresses, link destinations, message content, and attachment filenames. Classify every message as **Legitimate**, **Spam**, or **Phishing**. Select suspicious evidence only for messages you classify as Phishing, then complete three separate **Security Response Decisions**.

- [Launch Phishing Email Investigation](https://thearchitechnique.github.io/it-cyber-student-hub/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/)

Each investigation draws seven messages from 14 original scenarios: three phishing, two spam, and two legitimate messages in shuffled order. Classify using visible email information. The optional **Real-World Investigation** panel describes general checks without supplying case-specific answers. Expand **Inspect destination** with a mouse, touch, or keyboard to examine a URL without visiting it. All links, QR illustrations, and attachments are inert.

After choosing Phishing, select the meaningful email areas that suggest an attack. Select again to remove evidence. Choosing Legitimate, Spam, or the blank classification clears previous evidence and disables evidence selection; safe destination inspection remains available. Progress counts classified emails separately from response decisions.

Submit after classifying all seven messages and completing all three response decisions. Feedback explains your classification, the correct classification, and the reasoning. For phishing, **Attack & Social Engineering Analysis** defines supported attack types, persuasion tactics, and technical indicators in context. Evidence review identifies found, missed, and incorrectly selected areas. Benign messages explain why their visible details do not establish phishing. Optional **Real-World Verification** guidance explains further checks without claiming those checks were performed. Response feedback explains the correct action, relevant terminology, and why each alternative is less appropriate.

**Retry investigation** retains the messages, response scenarios, answer order, and selections while hiding feedback. **Reset Attempt** clears all answers and read states, keeping the same messages and response scenarios. **New Investigation** draws another balanced message set and three response scenarios from five distinct situations, with shuffled choices. Progress saves in this browser when storage is available; older incompatible attempts are reset safely.

The Lesson tab teaches phishing versus spam, social engineering, phishing variants, pretexting, impersonation, spoofing, urgency, authority, typosquatting, credential harvesting, business email compromise, safe inspection, email authentication, verification, and appropriate response and escalation. It supports Security objectives 2.4 and 2.5 of the [official CompTIA A+ Core 2 (220-1202) objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf). Supporting tactics such as pretexting, urgency, and typosquatting are not separately enumerated objectives in Version 2.0.

## Scoring reference

| Component | Scoring | Maximum |
| --- | --- | ---: |
| Email classification | Seven messages × 2 points | 14 |
| Phishing evidence | Three phishing messages × 3 points | 9 |
| Security Response Decisions | Three situations × 2 points | 6 |
| Total | | 29 |

Evidence credit is available only for an actual phishing email correctly classified as Phishing. It is `3 × max(0, TP/K − FP/B)`, rounded to two decimals: `TP` is selected valid indicators, `K` is all valid indicators, `FP` is selected benign areas, and `B` is all benign selectable areas. Every message retains a neutral selectable subject alongside the meaningful inspection areas; selecting every available area earns zero evidence credit. Duplicate or invalid selections add no credit. No evidence points are available for spam, legitimate mail, or empty evidence. The attack labels, definitions, and optional guidance are instructional and unscored.

All organizations, addresses, account references, and situations are fictional. Domains use the reserved `.example` namespace. The QR illustration cannot be scanned; its simulated encoded destination is available through the same inspection control as links.

[Back to A+ Core 2 PBQ Practice](../README.md) · [A+ Core 2](../../../../certifications/comptia/a-plus-core-2/README.md) · [Student Hub](../../../../../README.md)
