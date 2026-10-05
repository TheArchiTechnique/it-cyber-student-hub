# Publishing setup

Phase 1 leaves an unmerged pull request. No site has been published and no GitBook connection has been changed.

## GitHub Pages

The repository was private when inspected. GitHub Pages supports private source repositories on qualifying paid GitHub plans. If Pages is unavailable in Settings, check the account plan before choosing whether to upgrade or change repository visibility. This build does not change repository visibility. A private source repository does not by itself make a Pages site private; check the intended student audience when enabling hosting.

After reviewing the pull request:

1. In **TheArchiTechnique/it-cyber-student-hub**, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. Do not select a branch/folder publishing source.
3. Ensure Actions is enabled for the repository and the GitHub Pages environment permits deployments from `main`.
4. Merge the reviewed pull request when ready. The **Publish GitHub Pages** workflow builds and deploys from `main`.
5. If setup happens after the merge, open **Actions → Publish GitHub Pages → Run workflow** and choose `main`.
6. Use the URL returned by the successful deployment. The configured project URL is `https://thearchitechnique.github.io/it-cyber-student-hub/`.

The PR validation workflow stores a `student-hub-preview` artifact for seven days. Download it and serve its files with a local HTTP server to inspect the static build. No preview is publicly deployed by the PR workflow.

## GitBook

Use Git Sync rather than a second manual import or page-by-page copy.

1. After the PR is merged, open the empty GitBook site/space and its Git Sync setup; select **GitHub** as the provider.
2. Authorize the GitBook GitHub integration for **only this repository** as needed.
3. Select **TheArchiTechnique/it-cyber-student-hub** and branch **main**. Use the repository root as the Project directory.
4. For site-wide sync, map the existing empty space to `./`. Let GitBook record that space's stable key in `gitbook-docs.yaml`; retain the assigned key on later changes. For a single-space connection, the root `.gitbook.yaml` supplies the content configuration directly.
5. Choose the initial sync direction **GitHub → GitBook**. The root `README.md` is the first page and `SUMMARY.md` supplies navigation. Do not push the empty GitBook space over the repository.
6. Verify the homepage, five certification paths, and the six main areas before publishing the GitBook site.

GitBook may create or update the site-level mapping when the account connection is configured. Review and retain that file in GitHub. Space keys are account-specific and intentionally not guessed in Phase 1. The root `.gitbook.yaml` and `SUMMARY.md` are already prepared.

Keep routine content and navigation changes in GitHub pull requests. GitBook supports two-way sync, so web edits can also modify the repository; use the agreed GitHub-first workflow to avoid competing edits. If GitBook changes `SUMMARY.md`, reconcile its intended changes into `mkdocs.yml` and regenerate the summary before the next build.

## Deferred

- Course migration, lessons, exam-version metadata, and verified objective mappings.
- PBQs, scenarios, lab instructions, and actual reference sheets.
- Account-level Pages activation and GitBook authorization/publishing.
- Browser execution of future PBQs and links from GitBook to those published apps.
- Additional vendors, custom domains, student accounts, and progress tracking.

## Sources

- [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitBook Git Sync](https://gitbook.com/docs/docs-as-code/git-sync)
- [GitBook content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration)

[Contributor guide](../CONTRIBUTING.md) · [Architecture](architecture.md)
