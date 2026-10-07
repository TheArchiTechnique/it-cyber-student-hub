# Centralized PBQ catalog

## Phase 1 foundation

The authoritative metadata source is `docs/assets/data/pbqs.json`. MkDocs copies it to `assets/data/pbqs.json` without a backend or frontend build. Register each activity once, then associate that record with certifications and technical topics. Additional associations never create another implementation, launch URL, or progress identity.

The initial inventory was checked against the app entry points, activity overviews, and MkDocs routes on main at `7cb0eb1`. It contains 12 published activities, all retaining their existing A+ Core 1 primary assignment:

| Activity ID | Title | Additional association |
| --- | --- | --- |
| `ip-configuration-troubleshooting` | IP Configuration Troubleshooting | Network+ foundational |
| `motherboard-assembly` | Motherboard Assembly | None |
| `network-setup-and-cabling` | Network Setup & Cabling | Network+ foundational |
| `ports-and-protocols` | Ports & Protocols | Network+ foundational |
| `power-protection` | Power Protection & UPS | None |
| `printer-troubleshooting` | Printer Troubleshooting | None |
| `raid-drive-replacement` | RAID Drive Replacement | None |
| `soho-physical-installation` | SOHO Physical Installation | Network+ foundational |
| `soho-router-configuration` | SOHO Router Configuration | Network+ foundational |
| `tcp-ip-packet-walk` | TCP/IP Packet Walk | Network+ foundational |
| `two-site-voip-cli` | Two-Site VoIP Troubleshooting | Network+ foundational |
| `wireless-coverage` | Wireless Coverage | Network+ foundational |

This table records the Phase 1 inventory; consumers must read the JSON catalog. The eight additional associations describe transferable networking practice. Their per-record reasons identify the skills practiced; they do not claim direct Network+ exam alignment. No new exam-objective mappings were added. Difficulty is omitted because the existing activities do not use a shared difficulty rubric.

## Schema version 1

The schema is enforced by `scripts/check_pbq_catalog.py`. Unknown fields are rejected to catch misspellings; extend the validator and access tests when extending the contract.

| Field | Contract |
| --- | --- |
| `schemaVersion` | Integer `1`; change for incompatible schema revisions |
| `certifications` | Map of existing certification identifiers to `title`, `overviewPath`, and `pbqIndexPath` |
| `subjects` | Map of broad technical subject identifiers to `title` |
| `topics` | Map of topic identifiers to `title` and one valid `subject` |
| `activities` | Array of canonical activity records |

| Activity field | Contract |
| --- | --- |
| `id` | Globally unique, immutable lowercase hyphenated identifier; initial IDs preserve existing activity slugs |
| `title`, `description` | Nonempty student-facing text; title matches the activity overview heading |
| `activityPath` | Canonical directory relative to `docs/`, with a trailing slash; contains `README.md` and `app/index.html` |
| `launchPath` | Canonical site-relative `activityPath` plus `app/`; no leading slash, host, query, or fragment |
| `primaryCertification` | Valid certification identifier; matches the existing physical directory and back-navigation destination |
| `certificationAssociations` | Unique `{certification, relevance, reason}` objects; includes the primary certification exactly once |
| `relevance` | `direct` for the activity's established certification alignment, or `foundational` for related practice; evaluated per association |
| `topics` | Nonempty unique topic identifiers; technical subjects are derived from these references |
| `difficulty` | Optional `beginner`, `intermediate`, or `advanced`; omit without an established assessment |
| `status` | `published`, `draft`, or `archived`; queries default to `published` |

Publication status controls catalog selection, not access control. MkDocs still copies files under `docs/`. A draft or archived record must have real canonical files but must not appear in the published listings. Private work belongs outside the published source tree.

## Access for later phases

`docs/assets/javascripts/pbq-catalog.mjs` is a dependency-free ES module. It is available as a static asset but is not loaded by existing pages. Importing it does not fetch data, modify the DOM, register handlers, or access browser storage.

```javascript
import { loadCatalog, selectPBQs, getPBQ, launchURL } from './assets/javascripts/pbq-catalog.mjs';

const catalog = await loadCatalog(); // JSON URL is relative to the module, not the page.
const related = selectPBQs(catalog, {
  certification: 'network-plus',
  relevance: 'foundational',
  subject: 'networking'
});
const addressing = selectPBQs(catalog, { topic: 'ip-addressing' });
const activity = getPBQ(catalog, 'ip-configuration-troubleshooting');
const url = launchURL(activity, 'https://thearchitechnique.github.io/it-cyber-student-hub/');
```

Adapt the import path to the consuming page. Filters combine with AND and return each matching activity once. Certification filters include primary and additional associations; relevance must match that same association. Unknown filters return no matches. `status: null` includes all statuses. `getPBQ` returns the canonical record regardless of status, or `undefined` for an unknown ID. `launchURL` requires an absolute site-root URL with a trailing slash and preserves its project subpath. Loading errors are surfaced to the caller for the future interface to handle.

## Certification integration

`docs/assets/data/pbqs.json` is the sole metadata source for certification listings. Run `python scripts/sync_pbq_listings.py` to update the marked sections of all five certification overviews and PBQ indexes, plus the PBQs navigation group in `mkdocs.yml`. Commit the generated Markdown so GitBook and MkDocs display the same listings without client-side fetching. Content outside the marked sections is preserved.

Published activities are grouped by their association with the current certification: **Direct Certification Practice** or **Foundational Practice**. Listings use catalog titles and descriptions and link to the canonical activity overview. Activities sort by title, then ID; certification navigation follows the catalog's certification order. Empty certifications display an explicit empty state. Network+ currently has eight foundational activities and no direct practice; Core 1 retains all 12 direct activities, including Power Protection & UPS.

Navigation registers each published activity only once under its primary certification. Additional associations use links in the generated pages, preserving one canonical route and one GitBook navigation entry. `SUMMARY.md` continues to be generated from `mkdocs.yml` by `scripts/sync_navigation.py`.

`check_pbq_catalog.py` checks generated content and membership against the catalog, including additional associations. Missing entries, duplicates, stale titles/descriptions, incorrect relevance groups, and hand-edited generated sections fail validation. There are no listing omission exemptions. Both validation and deployment workflows check generation before building.

For a new or updated PBQ:

1. Create or update the canonical activity files using the existing PBQ structure.
2. Add or update one catalog record. Never change an existing ID or reuse a retired ID.
3. Use existing taxonomy identifiers where applicable. Explain additional certification relevance from activity content; verify official objectives before asserting new direct exam alignment.
4. Run `python scripts/sync_pbq_listings.py`, then `python scripts/sync_navigation.py`. Do not hand-edit generated sections.
5. Run the checks below and commit the catalog and generated files together.

```sh
python scripts/sync_pbq_listings.py --check
python scripts/sync_navigation.py --check
python scripts/check_source.py
python -m unittest discover -s tests -p 'test_pbq_catalog.py'
node tests/pbq-catalog.mjs
mkdocs build --strict
python scripts/check_pbq_catalog.py --site-dir site
python scripts/check_site.py
node tests/hub-analytics.cjs
```

## Persistence and deferred work

Catalog IDs are discovery identities, not replacements for existing storage keys. Eleven current apps use their existing localStorage keys; Ports & Protocols retains progress only during the page session. The catalog does not read, write, migrate, or clear progress. All app files, launch paths, analytics routing, and shared navigation code remain unchanged.

Phase 3 will implement the global searchable and filterable PBQ library. No global library interface, certification redesign, activity duplication, progress migration, pull request, or merge is part of Phase 2.
