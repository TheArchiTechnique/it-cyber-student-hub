"""Catalog rejection tests and source/list drift checks; run with unittest discovery."""
from copy import deepcopy
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from scripts.sync_pbq_listings import generated_files, render_listings, replace_block, START, END

from scripts.check_pbq_catalog import CATALOG, ROOT, metadata_errors, repository_errors


class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / CATALOG).read_text())

    def test_current_catalog_and_published_inventory(self):
        self.assertEqual(metadata_errors(self.catalog), [])
        self.assertEqual(repository_errors(self.catalog), [])

    def test_rejects_invalid_activity_metadata(self):
        cases = [
            ('id', '', 'invalid activity ID'),
            ('title', '', 'title must be nonempty'),
            ('description', None, 'description must be nonempty'),
            ('primaryCertification', 'unknown', 'invalid primary certification'),
            ('topics', ['unknown'], 'topic references'),
            ('topics', ['ip-addressing', 'ip-addressing'], 'topic references'),
            ('topics', [[]], 'topic references'),
            ('status', 'ready', 'publication status'),
            ('difficulty', 'easy', 'difficulty'),
            ('activityPath', 'practice/pbqs/../escape/', 'activityPath'),
            ('activityPath', 'practice/pbqs/network-plus/example/', 'primary certification directory'),
            ('launchPath', '/practice/pbqs/a-plus-core-1/example/app/', 'launchPath'),
            ('launchPath', 'https://example.com/app/', 'launchPath'),
            ('launchPath', 'practice/pbqs/a-plus-core-1/example/app/?id=x', 'launchPath'),
        ]
        for field, value, message in cases:
            with self.subTest(field=field, value=value):
                data = deepcopy(self.catalog)
                data['activities'][0][field] = value
                self.assertIn(message, '\n'.join(metadata_errors(data)))

    def test_missing_fields_and_duplicate_canonical_records(self):
        data = deepcopy(self.catalog)
        del data['activities'][0]['description']
        self.assertIn('missing fields', '\n'.join(metadata_errors(data)))
        data = deepcopy(self.catalog)
        data['activities'].append(deepcopy(data['activities'][0]))
        for field in ('id', 'activityPath', 'launchPath'):
            self.assertIn(f'duplicate {field}', '\n'.join(metadata_errors(data)))

    def test_invalid_taxonomy_and_associations(self):
        data = deepcopy(self.catalog)
        data['topics']['ip-addressing']['subject'] = 'unknown'
        self.assertIn('subject reference', '\n'.join(metadata_errors(data)))
        for association in (
            {'certification': 'unknown', 'relevance': 'direct', 'reason': 'Test'},
            {'certification': 'a-plus-core-1', 'relevance': 'exam-ish', 'reason': ''},
        ):
            data = deepcopy(self.catalog)
            data['activities'][0]['certificationAssociations'] = [association]
            self.assertTrue(metadata_errors(data))
        data = deepcopy(self.catalog)
        data['activities'][0]['certificationAssociations'].pop(0)
        self.assertIn('primary must occur once', '\n'.join(metadata_errors(data)))
        data = deepcopy(self.catalog)
        associations = data['activities'][0]['certificationAssociations']
        associations.append(deepcopy(associations[0]))
        self.assertIn('associations cannot repeat', '\n'.join(metadata_errors(data)))

    def test_unregistered_or_nonexistent_app(self):
        data = deepcopy(self.catalog)
        data['activities'].pop()
        self.assertIn('unregistered=', '\n'.join(repository_errors(data)))
        data = deepcopy(self.catalog)
        data['activities'][0]['activityPath'] = 'practice/pbqs/a-plus-core-1/missing/'
        data['activities'][0]['launchPath'] = 'practice/pbqs/a-plus-core-1/missing/app/'
        self.assertEqual(metadata_errors(data), [])
        errors = '\n'.join(repository_errors(data))
        self.assertIn('missing activity overview', errors)
        self.assertIn('missing/app/index.html', errors)

    def fixture(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for source in ('docs/practice/pbqs', 'docs/certifications/comptia'):
            shutil.copytree(ROOT / source, root / source)
        shutil.copyfile(ROOT / 'mkdocs.yml', root / 'mkdocs.yml')
        return root

    def test_missing_duplicate_and_wrong_certification_list_entries(self):
        root = self.fixture()
        index = root / 'docs/practice/pbqs/a-plus-core-1/README.md'
        original = index.read_text()
        index.write_text(original.replace('- [Wireless Coverage](wireless-coverage/README.md)', ''))
        self.assertIn('catalog/list drift', '\n'.join(repository_errors(self.catalog, root)))
        index.write_text(original + '\n- [Wireless Coverage](wireless-coverage/README.md)\n')
        self.assertIn('duplicate PBQ listings', '\n'.join(repository_errors(self.catalog, root)))
        index.write_text(original)
        wrong = root / 'docs/practice/pbqs/network-plus/README.md'
        wrong.write_text(wrong.read_text() + '\n- [Motherboard](../a-plus-core-1/motherboard-assembly/README.md)\n')
        self.assertIn('unexpected=', '\n'.join(repository_errors(self.catalog, root)))

    def test_power_protection_has_no_omission_exemption(self):
        root = self.fixture()
        page = root / 'docs/certifications/comptia/a-plus-core-1/README.md'
        page.write_text(page.read_text().replace('- [Power Protection & UPS](../../../practice/pbqs/a-plus-core-1/power-protection/README.md)', ''))
        self.assertIn('power-protection/README.md', '\n'.join(repository_errors(self.catalog, root)))

    def test_all_certification_memberships_and_relevance(self):
        for cert, metadata in self.catalog['certifications'].items():
            for field in ('overviewPath', 'pbqIndexPath'):
                content = render_listings(self.catalog, cert, metadata[field], field == 'overviewPath')
                with self.subTest(cert=cert, field=field):
                    self.assertEqual(content.count('- ['), 12 if cert == 'a-plus-core-1' else 8 if cert == 'network-plus' else 0)
                    if cert == 'network-plus':
                        self.assertIn('No direct certification PBQs published yet.', content)
                        self.assertIn('Foundational Practice', content)
                        self.assertNotIn('- [', content.split('Foundational Practice')[0])
                    elif cert != 'a-plus-core-1':
                        self.assertIn('No PBQs published yet.', content)

    def test_status_and_association_changes_propagate_to_both_views(self):
        data = deepcopy(self.catalog)
        # A published activity can be direct for one certification and foundational for another.
        activity = data['activities'][0]
        activity['certificationAssociations'].append({'certification': 'security-plus', 'relevance': 'direct', 'reason': 'Test'})
        for field in ('overviewPath', 'pbqIndexPath'):
            source = data['certifications']['security-plus'][field]
            content = render_listings(data, 'security-plus', source)
            self.assertIn(activity['title'], content)
            self.assertNotIn('Foundational Practice', content)
            source = data['certifications']['network-plus'][field]
            content = render_listings(data, 'network-plus', source)
            self.assertIn(activity['title'], content.split('Foundational Practice')[1])
        for status in ('draft', 'archived'):
            activity['status'] = status
            for cert in ('a-plus-core-1', 'network-plus', 'security-plus'):
                for field in ('overviewPath', 'pbqIndexPath'):
                    content = render_listings(data, cert, data['certifications'][cert][field])
                    self.assertNotIn(activity['title'], content)

    def test_generation_is_idempotent_and_preserves_surrounding_content(self):
        root = self.fixture()
        for path, expected in generated_files(self.catalog, root).items():
            self.assertEqual(path.read_text(), expected)
        page = root / 'docs/practice/pbqs/network-plus/README.md'
        page.write_text(page.read_text() + '\nUnrelated footer.\n')
        expected = generated_files(self.catalog, root)[page]
        self.assertTrue(expected.endswith('\nUnrelated footer.\n'))
        for malformed in ('', START + END + END, END + START):
            with self.assertRaises(ValueError):
                replace_block(malformed, START, END, 'body')

    def test_generated_classification_and_metadata_drift_fail(self):
        root = self.fixture()
        page = root / 'docs/practice/pbqs/network-plus/README.md'
        original = page.read_text()
        for before, after in [('Foundational Practice', 'Direct Practice'),
                              ('IP Configuration Troubleshooting', 'Incorrect title'),
                              ('Compare two PCs', 'Stale description')]:
            page.write_text(original.replace(before, after))
            self.assertIn('generated PBQ listings are stale', '\n'.join(repository_errors(self.catalog, root)))

    def test_launch_drift_and_missing_overview(self):
        root = self.fixture()
        activity = self.catalog['activities'][0]
        page = root / 'docs' / activity['activityPath'] / 'README.md'
        page.write_text(page.read_text().replace(activity['launchPath'], 'wrong-launch/'))
        self.assertIn('canonical launch path', '\n'.join(repository_errors(self.catalog, root)))
        page.write_text('')
        self.assertIn('catalog title differs', '\n'.join(repository_errors(self.catalog, root)))
        page.unlink()
        self.assertIn('missing activity overview', '\n'.join(repository_errors(self.catalog, root)))

    def test_wrong_mkdocs_group(self):
        root = self.fixture()
        path = root / 'mkdocs.yml'
        text = path.read_text()
        line = '      - Wireless Coverage: practice/pbqs/a-plus-core-1/wireless-coverage/README.md\n'
        text = text.replace(line, '').replace('    - Network+: practice/pbqs/network-plus/README.md',
            '    - Network+:\n      - Overview: practice/pbqs/network-plus/README.md\n' + line.rstrip())
        path.write_text(text)
        self.assertIn('mkdocs.yml PBQs/', '\n'.join(repository_errors(self.catalog, root)))

    def test_built_navigation_and_assets_are_required(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            errors = '\n'.join(repository_errors(self.catalog, site=site))
            self.assertIn('missing built launch path', errors)
            self.assertIn('built catalog is missing', errors)
            activity = self.catalog['activities'][0]
            app = site / activity['launchPath'] / 'index.html'
            app.parent.mkdir(parents=True)
            app.write_text('<h1>Fixture</h1><a data-pbq-nav="home" href="/wrong/">Home</a>')
            errors = '\n'.join(repository_errors(self.catalog, site=site))
            for target in ('certification', 'overview', 'home'):
                self.assertIn(f'incorrect built {target} navigation', errors)


if __name__ == '__main__':
    unittest.main()
