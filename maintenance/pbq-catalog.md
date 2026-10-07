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

## Existing integration and transition

Before this foundation, discovery used hand-maintained certification PBQ indexes, certification-page lists, and `mkdocs.yml`. `SUMMARY.md` is generated by `scripts/sync_navigation.py`. `scripts/site_hooks.py` injects standalone navigation during the build; its return destination comes from the existing certification directory. Analytics derives activity and certification identity from that same route. None of those behaviors changes in Phase 1.

The current lists remain temporarily hand-maintained. `check_pbq_catalog.py` checks their membership and detects duplicate, missing, incorrectly grouped, or unregistered activities. These lists continue to show primary assignments only; additional foundational associations are available to future catalog consumers. `sync_navigation.py --check` continues to enforce GitBook/MkDocs consistency. Both validation and deployment workflows now run catalog tests and validate the built catalog, canonical launch routes, and all three navigation targets for every PBQ.

One pre-existing omission is explicitly tracked: Power Protection & UPS is present in the Core 1 PBQ index and MkDocs navigation but absent from the certification page's **Published PBQ Practice** section. The validator prints that exact omission on every successful run. Other omissions fail validation. Once the certification page is repaired, validation fails until this narrow exemption is removed from `KNOWN_OMISSIONS`. This preserves the current page in Phase 1 without silently accepting future drift.

For new PBQs during the transition:

1. Create the canonical activity files using the existing PBQ structure.
2. Add one catalog record. Keep IDs independent of title changes and never reuse a retired ID.
3. Use existing taxonomy identifiers, adding a subject/topic only when necessary. Explain additional certification relevance from actual activity content; verify official objectives before asserting new direct exam alignment.
4. Update the primary certification's PBQ index, Published PBQ Practice section, and MkDocs navigation. Keep the activity title and launch link consistent with the catalog.
5. Generate `SUMMARY.md` and run the checks below in the same commit.

```sh
python scripts/sync_navigation.py --check
python scripts/check_source.py
python -m unittest discover -s tests -p 'test_pbq_catalog.py'
node tests/pbq-catalog.mjs
mkdocs build --strict
python scripts/check_pbq_catalog.py --site-dir site
python scripts/check_site.py
```

## Persistence and deferred work

Catalog IDs are discovery identities, not replacements for existing storage keys. Eleven current apps use their existing localStorage keys; Ports & Protocols retains progress only during the page session. The catalog does not read, write, migrate, or clear progress. All app files, launch paths, analytics routing, and shared navigation code remain unchanged.

Phase 2 can build the global PBQ browser using the catalog and helpers, make direct/foundational relevance visible, and replace hand-maintained listings with catalog-driven views while preserving canonical launches and return navigation. Repair the tracked certification-page omission as part of that integration. No global library UI, certification redesign, routing migration, pull request, or merge is part of Phase 1.
