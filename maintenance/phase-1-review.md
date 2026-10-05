# Phase 1 review

## Verified

- All 50 student pages appear exactly once in GitBook navigation.
- Root README is reused for Pages without a second maintained homepage.
- Five certification paths have consistent actions; A+ cores remain separate.
- Six main areas retain their distinct purposes and cross-links.
- Only CompTIA is present. No future vendor directories or guessed objective mappings.
- All student section pages have parent/home navigation and explicit unpublished states.
- ASCII is limited to Home and the five certification pages; no badge clutter.
- Strict MkDocs build succeeds with the pinned dependencies.
- Source links and headings resolve; generated HTML links, assets, and fragments resolve at the project subpath.
- Built search index includes all student pages.
- Generated card markup preserves real list items and accessible native links.
- CSS has a single-column mobile breakpoint, visible keyboard focus, reduced-motion support, and system fonts.
- Pages workflow is restricted to `main`; PR validation cannot deploy.
- No local teaching material was imported, no exercises were fabricated, and no Google Drive or GitBook content was modified.

## Verification limits

Browser automation was unavailable in the build environment. Desktop/mobile screenshots, interactive keyboard use, screen-reader behavior, and live search interaction were not verified. Review these in the PR's static preview artifact or with `mkdocs serve` before publication. Static inspection and generated-site checks passed.

GitBook compatibility was checked against its documented Markdown/configuration format, not a live account sync. GitHub Pages activation, account-plan eligibility, and the actual deployment remain manual setup after review. The repository remains private.

The Material package prints an advisory about a future MkDocs 2.x compatibility change. This project pins MkDocs 1.6.1; the strict build succeeds. Major framework upgrades require review.

[Contributor guide](../CONTRIBUTING.md) · [Publishing setup](publishing.md)
