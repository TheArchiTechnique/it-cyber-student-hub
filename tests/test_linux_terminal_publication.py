"""Publication contract for the canonical browser-based Linux practice resource."""
import json
import re
import unittest

import yaml

from scripts.content_visibility import Availability, ROOT, nav_paths, published_markdown
from scripts.sync_navigation import summary


class LinuxTerminalPublicationTests(unittest.TestCase):
    page = 'practice/linux-terminal-simulator/README.md'

    def setUp(self):
        self.availability = Availability()

    def visible(self, source):
        return published_markdown(self.availability.render(source))

    def test_launch_page_is_a_single_published_practice_resource(self):
        self.assertEqual(self.availability.meta[self.page], {'kind': 'resource', 'status': 'published'})
        self.assertIn(self.page, self.availability.visible)
        config = yaml.safe_load((ROOT / 'mkdocs.yml').read_text())
        practice = next(item['Practice'] for item in config['nav'] if 'Practice' in item)
        self.assertEqual(list(nav_paths(practice)).count(self.page), 1)
        navigation = list(nav_paths(self.availability.navigation(config['nav'])))
        self.assertEqual(navigation.count(self.page), 1)
        self.assertEqual(summary(self.availability), (ROOT / 'SUMMARY.md').read_text())
        self.assertEqual((ROOT / 'SUMMARY.md').read_text().count('(docs/' + self.page + ')'), 1)
        page = self.visible(self.page)
        self.assertIn('[Launch Linux Terminal Simulator](https://thearchitechnique.github.io/it-cyber-student-hub/practice/linux-terminal-simulator/app/)', page)
        for term in ('Linux commands', 'Linux terminal', 'command-line practice', 'Guided Practice', 'Free Practice', 'Nano', 'man COMMAND', 'Linux Mint', 'Fedora', 'saved locally'):
            self.assertIn(term, page)
        self.assertIn('No virtual machine, Linux installation, or account is required', page)
        self.assertIn('not prerequisites', page)

    def test_contextual_links_are_unique_and_vm_labs_remain_separate(self):
        sources = {
            'certifications/comptia/a-plus-core-2/README.md': '../../../practice/linux-terminal-simulator/README.md',
            'certifications/comptia/a-plus-core-2/objective-breakdown.md': '../../../practice/linux-terminal-simulator/README.md',
            'practice/README.md': 'linux-terminal-simulator/README.md',
            'labs/it-support/README.md': '../../practice/linux-terminal-simulator/README.md',
            'reference/linux-commands.md': '../practice/linux-terminal-simulator/README.md',
        }
        for source, link in sources.items():
            text = self.visible(source)
            self.assertEqual(text.count('](' + link + ')'), 1, source)
            self.assertTrue(self.availability.available_target(source, link), source)
        objective = self.visible('certifications/comptia/a-plus-core-2/objective-breakdown.md').split('### 1.9 Linux features and tools')[1].split('### 1.10')[0]
        self.assertIn(sources['certifications/comptia/a-plus-core-2/objective-breakdown.md'], objective)
        self.assertEqual(len(re.findall(r'^\| `[a-z]+` \|', objective, re.M)), 27)
        labs = self.visible('labs/it-support/README.md')
        self.assertIn('No VM or installation lab is required', labs)
        self.assertLess(labs.index('[VirtualBox: Installing Linux Mint]'), labs.index('[Linux Mint Workstation Setup and Troubleshooting]'))
        self.assertIn('Step 1:', labs)
        self.assertIn('Step 2:', labs)
        self.assertIn('Prerequisite: complete the Linux Mint installation lab first', labs)

    def test_simulator_never_enters_the_pbq_catalog_or_listings(self):
        catalog = json.loads((ROOT / 'docs/assets/data/pbqs.json').read_text())
        self.assertNotIn('linux-terminal-simulator', json.dumps(catalog))
        self.assertEqual(len([a for a in catalog['activities'] if a['status'] == 'published']), 17)
        for source in ('practice/pbqs/README.md', 'practice/pbqs/a-plus-core-2/README.md'):
            self.assertNotIn('linux-terminal-simulator', self.visible(source))
        core2 = self.availability.render('certifications/comptia/a-plus-core-2/README.md')
        generated = core2.split('<!-- BEGIN GENERATED PBQ LISTINGS -->')[1].split('<!-- END GENERATED PBQ LISTINGS -->')[0]
        self.assertNotIn('linux-terminal-simulator', generated)
        app = (ROOT / 'docs/practice/linux-terminal-simulator/app/index.html').read_text()
        self.assertIn('<a href="../">Simulator overview</a>', app)
        self.assertIn('src="../../../assets/javascripts/linux-terminal/terminal.mjs"', app)
        # Only the launch page belongs in the Hub index; the copied runtime is not
        # a second searchable lesson, regardless of its external robots setting.
        self.assertIn('<meta name="robots" content="noindex">', app)


if __name__ == '__main__':
    unittest.main()
