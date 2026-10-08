"""Publication contract and real hide/reveal builds in disposable repositories."""
from copy import deepcopy
from pathlib import Path
import json
import shutil
import subprocess
import sys
import tempfile
import unittest

import yaml

from scripts.content_visibility import Availability, canonical, nav_paths, published_markdown, ROOT
from scripts.sync_navigation import summary


class VisibilityTests(unittest.TestCase):
    def fixture(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for area in ('docs', 'scripts', 'overrides', 'maintenance'):
            shutil.copytree(ROOT / area, root / area, ignore=shutil.ignore_patterns('__pycache__'))
        for source in ('README.md', 'CONTRIBUTING.md', 'mkdocs.yml', 'SUMMARY.md'):
            shutil.copyfile(ROOT / source, root / source)
        return root

    def write(self, root, path, content):
        target = root / 'docs' / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
        return target

    def run_script(self, root, *args):
        result = subprocess.run([sys.executable, *args], cwd=root, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_current_publication_and_preserved_resources(self):
        a = Availability()
        for hidden in ('labs/README.md', 'tools/README.md', 'reference/linux-commands.md',
                       'reference/powershell-commands.md', 'learn/hardware/README.md',
                       'practice/scenarios/README.md', 'practice/pbqs/a-plus-core-2/README.md',
                       'practice/pbqs/security-plus/README.md', 'practice/pbqs/cysa-plus/README.md'):
            self.assertNotIn(hidden, a.visible)
        for visible in ('learn/networking/ports-and-protocols.md', 'reference/ports-and-protocols.md',
                        'practice/questions/README.md', 'practice/pbqs/network-plus/README.md'):
            self.assertIn(visible, a.visible)
        published = [item for item in a.catalog['activities'] if item['status'] == 'published']
        self.assertEqual(len(published), 12)
        self.assertEqual(len(a.associations['practice/pbqs/network-plus/README.md']), 8)
        for item in published:
            self.assertIn(item['activityPath'] + 'README.md', a.visible)
        for key in ('practice/questions/README.md', 'certifications/comptia/a-plus-core-2/README.md'):
            self.assertIn('create.kahoot.it/share/', published_markdown(a.render(key)))
        for key in ('certifications/comptia/a-plus-core-1/README.md', 'certifications/comptia/a-plus-core-2/README.md'):
            self.assertIn('exam-objectives.pdf', published_markdown(a.render(key)))

    def test_no_visible_links_to_unpublished_pages_and_idempotence(self):
        a = Availability()
        for key in a.visible:
            self.assertEqual(a.pages[key].read_text(), a.render(key), key)
            self.assertNotIn('No PBQs published yet.', published_markdown(a.render(key)))
        nav = a.navigation(yaml.safe_load((ROOT / 'mkdocs.yml').read_text())['nav'])
        self.assertEqual(set(nav_paths(nav)), a.visible)
        self.assertEqual(len(nav_paths(nav)), len(a.visible))
        self.assertEqual(summary(a), (ROOT / 'SUMMARY.md').read_text())

    def test_short_external_resource_is_published_but_navigation_cycles_are_not(self):
        root = self.fixture()
        first = self.write(root, 'labs/it-support/first.md', '# First\n\n[Second](second.md)\n\n[Back to Labs](../README.md)\n')
        self.write(root, 'labs/it-support/second.md', '# Second\n\n[First](first.md)\n')
        a = Availability(root)
        self.assertNotIn('labs/README.md', a.visible)
        self.assertNotIn('labs/it-support/first.md', a.visible)
        first.write_text('---\nhub:\n  kind: resource\n---\n# Hardware guide\n\n[Read the hardware guide](https://example.org/education)\n')
        a = Availability(root)
        self.assertIn('labs/README.md', a.visible)
        self.assertIn('labs/it-support/first.md', a.visible)
        self.assertIn('https://example.org/education', a.render('labs/it-support/first.md'))

    def test_placeholder_related_links_do_not_publish_empty_categories(self):
        root = self.fixture()
        page = root / 'docs/labs/it-support/README.md'
        page.write_text(page.read_text() + '\n[Published quiz](../../practice/questions/README.md)\n')
        self.assertNotIn('labs/it-support/README.md', Availability(root).visible)

    def test_publication_by_replacing_placeholder_and_invalid_metadata(self):
        root = self.fixture()
        page = root / 'docs/reference/linux-commands.md'
        page.write_text('---\nhub:\n  kind: resource\n---\n# Linux Commands\n\n`pwd` prints the working directory.\n')
        a = Availability(root)
        self.assertIn('reference/linux-commands.md', a.visible)
        self.assertIn('[Linux Commands]', published_markdown(a.render('reference/README.md')))
        page.write_text(page.read_text().replace('kind: resource', 'kind: unknown'))
        with self.assertRaisesRegex(ValueError, 'invalid hub'):
            Availability(root)

    def test_catalog_status_and_associations_are_authoritative(self):
        a = Availability()
        catalog = deepcopy(a.catalog)
        for activity in catalog['activities']:
            activity['status'] = 'draft'
        a = Availability(catalog=catalog)
        self.assertNotIn('practice/pbqs/README.md', a.visible)
        self.assertNotIn('practice/pbqs/network-plus/README.md', a.visible)
        self.assertIn('practice/questions/README.md', a.visible)
        self.assertTrue(all(not status for status in a.app_status.values()))
        catalog['activities'][0]['status'] = 'published'
        catalog['activities'][0]['certificationAssociations'].append({
            'certification': 'security-plus', 'relevance': 'direct', 'reason': 'Test association'})
        a = Availability(catalog=catalog)
        self.assertIn('practice/pbqs/security-plus/README.md', a.visible)
        self.assertEqual(len(a.associations['practice/pbqs/security-plus/README.md']), 1)

    def test_nested_new_category_is_registered_without_navigation_edits(self):
        root = self.fixture()
        self.write(root, 'labs/new-area/README.md', '# New lab area\n')
        self.write(root, 'labs/new-area/lesson.md', '---\nhub:\n  kind: resource\n---\n# New lab\n\nUse `pwd` to inspect the working directory.\n')
        a = Availability(root)
        nav = a.navigation(yaml.safe_load((root / 'mkdocs.yml').read_text())['nav'])
        labs = next(item['Labs'] for item in nav if 'Labs' in item)
        self.assertIn('labs/new-area/lesson.md', nav_paths(labs))
        self.assertIn('labs/new-area/README.md', nav_paths(labs))
        self.assertIn('new-area/README.md', published_markdown(a.render('labs/README.md')))

    def test_real_build_empty_publish_unpublish_and_remove(self):
        root = self.fixture()
        original_nav = (root / 'mkdocs.yml').read_bytes()
        def build():
            self.run_script(root, 'scripts/sync_navigation.py')
            self.run_script(root, 'scripts/sync_navigation.py', '--check')
            self.run_script(root, 'scripts/check_source.py')
            self.run_script(root, '-m', 'mkdocs', 'build', '--strict')
            self.run_script(root, 'scripts/check_site.py')
        # A: The original empty section is absent from Pages, GitBook, cards and search.
        build()
        self.assertFalse((root / 'site/labs/index.html').exists())
        self.assertNotIn('docs/labs/', (root / 'SUMMARY.md').read_text())
        fixture = self.write(root, 'labs/it-support/visibility-fixture.md',
                             '---\nhub:\n  kind: resource\n---\n# Working Directory Lab\n\nRun `pwd` and compare the result with your current directory.\n')
        # B: No navigation file is edited; every discovery surface reveals the resource.
        build()
        self.assertEqual((root / 'mkdocs.yml').read_bytes(), original_nav)
        self.assertTrue((root / 'site/labs/it-support/visibility-fixture/index.html').exists())
        self.assertIn('docs/labs/it-support/visibility-fixture.md', (root / 'SUMMARY.md').read_text())
        self.assertIn('href="labs/"', (root / 'site/index.html').read_text())
        self.assertIn('visibility-fixture/', (root / 'site/labs/it-support/index.html').read_text())
        self.assertNotIn('No labs published yet.', (root / 'site/labs/it-support/index.html').read_text())
        # C: Changing only resource publication status removes its empty ancestors again.
        fixture.write_text(fixture.read_text().replace('kind: resource', 'kind: resource\n  status: unpublished'))
        build()
        self.assertFalse((root / 'site/labs/index.html').exists())
        self.assertNotIn('docs/labs/', (root / 'SUMMARY.md').read_text())
        indexed = json.loads((root / 'site/search/search_index.json').read_text())
        self.assertFalse(any(d['location'].startswith('labs/') for d in indexed['docs']))
        fixture.unlink()
        build()
        self.assertFalse((root / 'site/labs/index.html').exists())
        # TemporaryDirectory cleanup removes every fixture and generated build.


if __name__ == '__main__':
    unittest.main()
