# Maintaining the Student Hub

GitHub is the source of truth. Make changes on a branch and open a pull request into `main`.

## Choose one canonical home

| Material | Location | Purpose |
| --- | --- | --- |
| Certification path | `docs/certifications/<vendor>/<certification>/` | Study sequence, exam focus, verified objectives, and links to shared material |
| Technical lesson | `docs/learn/<topic>/` | The authoritative explanation of a concept |
| PBQ | `docs/practice/pbqs/<certification>/` | Certification-specific performance-based practice |
| Short scenario | `docs/practice/scenarios/<type>/` | Troubleshooting, log questions, or mini investigations |
| Lab | `docs/labs/<area>/` | A complete hands-on activity, setup, tasks, and validation |
| Tool guide | `docs/tools/<tool>/` | Tool-specific commands, usage, and troubleshooting |
| Quick reference | `docs/reference/` | Fast lookup tables, commands, and comparisons |
| Shared asset | `docs/assets/` | Images, sanitized logs, packet captures, and sample files |

A concept such as subnetting belongs in Learn once. Certification paths link to it. A shared Wireshark lab belongs in Labs once. Tool guides explain tool use; references provide compact lookup information. Link among these resources instead of copying their content.

## Names and links

- Use lowercase, hyphenated names, such as `network-plus` and `ports-and-protocols.md`.
- Use `README.md` for section landing pages. Do not add an `index.md` beside it.
- Keep exam version numbers out of directories. Put verified versions and review dates in the relevant page when content is introduced.
- Use ordinary Markdown links to explicit relative `.md` paths. Link directly to the canonical file, including headings when helpful.
- Write descriptive link labels. Each navigation card is an ordinary list item with one link and a short paragraph.
- Link back to the parent section and the root `README.md`. Certification-specific practice should also link back to its certification.
- Use headers and prose for lessons; cards are applied only to README landing pages. Use flat lists with one link per card on those pages.

## Add a page

1. Create it in its canonical directory and add a link from its parent landing page.
2. Add it to `nav` in `mkdocs.yml`. Each navigation group starts with an `Overview` entry for that group's README.
3. Run `python scripts/sync_navigation.py` to update `SUMMARY.md`. This is generated navigation, not duplicated teaching content.
4. Run the validation commands below. Keep `SUMMARY.md` in the same commit.

To add a vendor later, create `docs/certifications/<vendor>/README.md` and that vendor's certification paths, then add the vendor to the Certifications navigation and landing page. The current scope check in `scripts/check_source.py` intentionally allows only CompTIA; update that gate in the same reviewed expansion. Do not create empty vendor folders in advance.

## Write for students

Use concise, practical language. Keep internal architecture notes in `maintenance/`, outside the student site. Distinguish unpublished material with a short availability statement; do not add fake exercises or inactive launch buttons. A certification path is a curated route, not a duplicate textbook. Verify objective numbers against official current sources before publishing mappings.

Keep ASCII identity headers only on the root homepage and the five current certification landing pages. Keep the shared certification layout: Start Studying, Course Topics, PBQ Practice, Labs, Quick Reference.

## Add an interactive PBQ later

Use `docs/practice/pbqs/<certification>/<exercise-slug>/` with a `README.md` describing the exercise and an `app/index.html` entry point. Keep its JS, CSS, and local images beside that HTML. MkDocs copies these static files without a frontend build.

Register each PBQ once in `docs/assets/data/pbqs.json`, the authoritative activity catalog. Associate additional certifications with that record instead of copying the app. During the transition, update the primary certification's PBQ index, Published PBQ Practice section, and MkDocs navigation in the same commit; catalog validation detects drift. See the [PBQ catalog contract and transition](maintenance/pbq-catalog.md) for metadata, access helpers, relevance labels, and the existing tracked listing omission. Catalog IDs do not replace activity persistence keys.

Add a relative `Launch <exercise> PBQ` link to `app/index.html` only when it exists. This works at the project's GitHub Pages subpath without hardcoded root URLs. In GitBook, use an explicit link to the deployed Pages exercise because GitBook does not host the HTML app as a runnable Pages site. Test that launch URL after deployment. Do not publish instructor-only answers or secrets in client-side files.

Every standalone PBQ must provide a reliable exit path that does not depend on browser history. The Pages build automatically injects a compact, in-flow top navigation bar into `docs/practice/pbqs/<certification>/<exercise-slug>/app/index.html` with links back to the certification PBQ index, the activity overview, and the Student Hub. It is part of the app chrome rather than a floating overlay, so it must never cover activity controls or content. The generated links use project-safe relative paths and remain available throughout the activity. If an app supplies its own custom navigation instead, preserve the markers `data-pbq-nav="certification"`, `data-pbq-nav="overview"`, and `data-pbq-nav="home"`; site validation requires all three.

## Local development

Requires Python 3.12 and Node.js 22 or newer for the catalog tests. Run from the repository root:

```sh
python -m venv .venv
# Linux/macOS:
. .venv/bin/activate
# Windows PowerShell instead:
# .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/sync_navigation.py --check
python scripts/check_source.py
python -m unittest discover -s tests -p 'test_pbq_catalog.py'
node tests/pbq-catalog.mjs
mkdocs build --strict
python scripts/check_pbq_catalog.py --site-dir site
python scripts/check_site.py
mkdocs serve
```

The local server uses the configured `/it-cyber-student-hub/` path. `site/` is generated and must not be committed. Dependencies are deliberately pinned to MkDocs 1.6.1 and Material 9.7.6; review framework/theme upgrades together and rerun the checks.

Before submitting, inspect desktop and narrow mobile layouts, use keyboard navigation, try search, and follow a certification through topics, practice, labs, and reference. Automated checks validate links, fragments, search coverage, navigation consistency, scope, and the project URL prefix. They do not replace browser accessibility and visual checks.

[Architecture](maintenance/architecture.md) · [Publishing setup](maintenance/publishing.md) · [Student Hub](README.md)
