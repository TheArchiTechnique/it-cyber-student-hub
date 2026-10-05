# Architecture decisions

## One content tree, three readers

The root `README.md` is the canonical student homepage. Student material lives under `docs/` in the requested logical sections. GitHub renders the Markdown directly; MkDocs builds GitHub Pages from it; GitBook reads the same files through Git Sync. There is no maintained second Pages or GitBook content tree.

A small MkDocs hook adds the root README as a virtual page and translates repository-relative links for Pages at build time. All authored links remain usable in GitHub and GitBook. The hook accepts ordinary inline Markdown file links; prefer those over raw HTML links or reference-style link definitions. `docs/README.md` must not be created because that would conflict with the virtual homepage.

`mkdocs.yml` is the navigation source. `scripts/sync_navigation.py` generates `SUMMARY.md` for GitBook and CI checks for drift. Each student page appears once in that summary. GitBook's appearance is independent; its content is shared.

## Framework selection

| Option | Assessment |
| --- | --- |
| Plain Markdown / GitHub rendering | Useful immediately, but does not provide the requested portal search and responsive documentation navigation. |
| Jekyll | Fits GitHub Pages, but this portal would require more theme and search integration. |
| MkDocs with Material | Selected: Markdown-first, built-in search, responsive documentation navigation, static HTML output, and a small CSS layer for cards. |
| Large React documentation application | Adds a frontend dependency/build surface unnecessary for Phase 1. |

Use pinned MkDocs 1.x and Material versions. A major MkDocs upgrade is an architecture review, not a routine version bump. This phase does not depend on a future 2.x API. No React app, custom search engine, remote font dependency, or client-side content store is introduced.

## Presentation

Navy navigation, light surfaces, readable system fonts, and teal accents provide a restrained technical education design. Certifications appear first. Desktop lists become two-column cards; narrow screens use one column. Native links make the full card clickable and keyboard focus is visible. Material provides the responsive menu, skip link, and local search.

Landing pages use portable headings and list links. No shields, fake status messages, or placeholder launch buttons are used. ASCII appears only in six compact identity headers. Unpublished sections say so and link back to useful navigation.

## Boundaries

Certification sections curate shared learning. Learn holds explanations, Reference holds quick lookups, Labs holds full activities, and Practice holds short exercises. Tool guides focus on tool use. The five current certifications live under CompTIA; adding another vendor later requires a new vendor directory and navigation entries, not moving existing material.

Contributor and publishing documentation stays outside `docs/`. Asset READMEs explain storage conventions and are excluded from Pages and GitBook navigation. The build publishes only student content and intended static assets.

## Deployment and future exercises

Pull requests build and validate only. The Pages workflow publishes from `main` after review and merge, or a manual dispatch on `main`. The build branch cannot deploy through that workflow. No `gh-pages` content branch or copied Markdown tree is needed.

Future HTML/JavaScript exercises live beside their canonical practice documentation and are copied to the site as static assets. Their runtime stays in GitHub Pages; GitBook can link to the deployed exercise. Phase 1 includes no exercises or course migration.

## Documentation consulted

- [MkDocs configuration](https://www.mkdocs.org/user-guide/configuration/)
- [MkDocs writing and relative links](https://www.mkdocs.org/user-guide/writing-your-docs/)
- [Material navigation](https://squidfunk.github.io/mkdocs-material/setup/setting-up-navigation/)
- [GitBook content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

[Contributor guide](../CONTRIBUTING.md) · [Publishing setup](publishing.md)
