// Add a validated bank here to enable another certification in the same app.
// Keep existing Hub exam versions until a separate version update is approved.
export const certifications = [
  { id: 'a-plus-core-1', title: 'CompTIA A+ Core 1', examVersion: '220-1201', metadata: null, bank: null },
  { id: 'a-plus-core-2', title: 'CompTIA A+ Core 2', examVersion: '220-1202', metadata: 'a-plus-core-2.json', bank: 'a-plus-core-2-questions.json' },
  { id: 'network-plus', title: 'CompTIA Network+', examVersion: 'N10-009', metadata: null, bank: null },
  { id: 'security-plus', title: 'CompTIA Security+', examVersion: 'SY0-701', metadata: null, bank: null },
  { id: 'cysa-plus', title: 'CompTIA CySA+', examVersion: 'CS0-003', metadata: null, bank: null }
];
