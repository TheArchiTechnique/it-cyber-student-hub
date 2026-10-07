import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPBQ, launchURL, loadCatalog, selectPBQs } from '../docs/assets/javascripts/pbq-catalog.mjs';

const catalog = JSON.parse(await readFile(new URL('../docs/assets/data/pbqs.json', import.meta.url)));
const original = JSON.stringify(catalog);
const all = selectPBQs(catalog);
assert.equal(new Set(all.map(a => a.id)).size, all.length);
const network = selectPBQs(catalog, { certification: 'network-plus', relevance: 'foundational' });
assert.ok(network.length > 1);
for (const activity of network) {
  assert.strictEqual(getPBQ(catalog, activity.id), activity);
  assert.ok(selectPBQs(catalog, { certification: activity.primaryCertification }).includes(activity));
}
const intersection = selectPBQs(catalog, { certification: 'network-plus', subject: 'networking', topic: 'ip-addressing' });
assert.ok(intersection.length);
assert.ok(intersection.every(a => a.topics.includes('ip-addressing')));
assert.equal(selectPBQs(catalog, { subject: 'hardware', topic: 'ip-addressing' }).length, 0);
for (const field of ['certification', 'subject', 'topic', 'relevance']) {
  assert.deepEqual(selectPBQs(catalog, { [field]: 'unknown' }), []);
}
assert.equal(getPBQ(catalog, 'unknown'), undefined);
const fixture = structuredClone(catalog);
fixture.activities[0].status = 'draft';
fixture.activities[1].status = 'archived';
assert.equal(selectPBQs(fixture).length, all.length - 2);
assert.equal(selectPBQs(fixture, { status: 'draft' }).length, 1);
assert.equal(selectPBQs(fixture, { status: null }).length, all.length);
// Relevance must match the requested certification, not a different association.
assert.equal(selectPBQs(catalog, { certification: 'network-plus', relevance: 'direct' }).length, 0);
for (const base of ['https://example.test/', 'https://example.test/it-cyber-student-hub/']) {
  assert.equal(launchURL(network[0], base), base + network[0].launchPath);
}
assert.throws(() => launchURL(network[0], 'https://example.test/project'), /end with a slash/);
assert.equal(JSON.stringify(catalog), original, 'Queries do not mutate the catalog');
// Stub only the network boundary; verify default asset URL and visible failure behavior.
const fetchOriginal = globalThis.fetch;
try {
  globalThis.fetch = async url => {
    assert.ok(String(url).endsWith('/docs/assets/data/pbqs.json'));
    return { ok: true, json: async () => catalog };
  };
  assert.strictEqual(await loadCatalog(), catalog);
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(loadCatalog(), /404/);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ schemaVersion: 2 }) });
  await assert.rejects(loadCatalog(), /Unsupported/);
  globalThis.fetch = async () => { throw new Error('Offline'); };
  await assert.rejects(loadCatalog(), /Offline/);
} finally {
  globalThis.fetch = fetchOriginal;
}
console.log('PASS: catalog filters, association relevance, canonical identity, status, subpath URLs, and loading errors.');
