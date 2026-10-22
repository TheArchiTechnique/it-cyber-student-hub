# Phishing Email Investigation

Review a simulated Northbridge Systems inbox as a Tier 1 IT support technician. Inspect senders, reply addresses, link destinations, message content, and attachment filenames. Classify each message as Legitimate, Spam, or Phishing, select supporting suspicious evidence directly in the message, and choose an appropriate response.

- [Launch Phishing Email Investigation](https://thearchitechnique.github.io/it-cyber-student-hub/practice/pbqs/a-plus-core-2/phishing-email-investigation/app/)

Each investigation draws seven messages from 14 original scenarios: three phishing, two spam, and two legitimate messages in shuffled order. Independent case context supplies known business records and approved workflows. All message links, QR representations, and attachments are inert. Expand **Inspect destination** with a mouse, touch, or keyboard to examine a URL without visiting it. Select a detail again to remove it from your evidence.

Submit after assessing every message for a maximum of 49 points. Each message earns up to two points for classification, three for evidence, and two for response. Feedback appears only after submission. **Retry investigation** preserves the same messages and selections for correction. **Reset Attempt** clears the current answers while retaining the messages. **New Investigation** draws another balanced attempt. Progress saves in this browser when storage is available.

The Lesson tab explains phishing, spear phishing, whaling, business email compromise, QR code phishing, spam, safe message inspection, independent verification, and reporting. It supports Security objectives 2.4 and 2.5 of the [official CompTIA A+ Core 2 (220-1202) objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf).

## Scoring reference

For each message, evidence credit is `3 × max(0, TP/K − FP/B)`, rounded to two decimals. `TP` is the number of valid indicators selected, `K` is the total valid indicators, `FP` is selected benign details, and `B` is the total benign details. For a message without suspicious indicators, substitute `1` for `TP/K`. Duplicate selections cannot add credit. Selecting all available details earns zero evidence credit. Correctly leaving suspicious evidence empty on verified spam or legitimate mail earns three evidence points. Component scores are independent.

All organizations, addresses, account references, and situations are fictional. Domains use the reserved `.example` namespace. The QR representation cannot be scanned; its simulated encoded destination is available through the same inspection control as links.

[Back to A+ Core 2 PBQ Practice](../README.md) · [A+ Core 2](../../../../certifications/comptia/a-plus-core-2/README.md) · [Student Hub](../../../../../README.md)
