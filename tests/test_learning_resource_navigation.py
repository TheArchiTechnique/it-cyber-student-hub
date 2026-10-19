"""Learning resource discovery, publication, and curated lab progression."""
from pathlib import Path
import re
import shutil
import tempfile
import unittest

import yaml

from scripts.content_visibility import Availability, LINK, ROOT, nav_paths, published_markdown


class LearningResourceNavigationTests(unittest.TestCase):
    def setUp(self):
        self.availability = Availability()

    def visible(self, key):
        return published_markdown(self.availability.render(key))

    def test_lab_sequence_matches_navigation_without_duplicate_cards(self):
        key = 'labs/it-support/README.md'
        expected = ['virtualbox-linux-mint/README.md',
                    'linux-mint-command-line/README.md', 'windows-command-line/README.md']
        links = [m[2] for m in LINK.finditer(self.visible(key)) if m[2] in expected]
        self.assertEqual(links, expected)
        self.assertIn('Step 1:', self.visible(key))
        self.assertIn('Step 2:', self.visible(key))
        self.assertIn('Prerequisite:', self.visible(key))
        nav = self.availability.navigation(yaml.safe_load((ROOT / 'mkdocs.yml').read_text())['nav'])
        self.assertEqual([p for p in nav_paths(nav) if p.startswith('labs/it-support/')],
                         [key] + ['labs/it-support/' + p for p in expected])

    def test_new_lab_is_discovered_and_unpublished_curated_card_disappears(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            shutil.copytree(ROOT / 'docs', root / 'docs')
            shutil.copyfile(ROOT / 'README.md', root / 'README.md')
            new = root / 'docs/labs/it-support/new-support-lab.md'
            new.write_text('---\nhub:\n  kind: resource\n---\n# New Support Lab\n\nInspect a workstation.\n')
            lab = root / 'docs/labs/it-support/windows-command-line/README.md'
            lab.write_text(lab.read_text().replace('kind: resource', 'kind: resource\n  status: unpublished'))
            a = Availability(root)
            text = published_markdown(a.render('labs/it-support/README.md'))
            self.assertEqual(text.count('[New Support Lab](new-support-lab.md)'), 1)
            self.assertEqual(text.count('[VirtualBox: Installing Linux Mint]'), 1)
            self.assertEqual(text.count('[Linux Mint Workstation Setup and Troubleshooting]'), 1)
            self.assertNotIn('[Windows Command-Line Lab]', text)
            self.assertNotIn('labs/networking/README.md', a.visible)

    def test_quizzes_cover_published_certification_links_once(self):
        pattern = r'https://create\.kahoot\.it/share/[^\s)"<>]+'
        quiz_urls = re.findall(pattern, self.visible('practice/questions/README.md'))
        self.assertEqual(len(quiz_urls), len(set(quiz_urls)))
        for key in self.availability.visible:
            if key.startswith('certifications/'):
                self.assertTrue(set(re.findall(pattern, self.visible(key))) <= set(quiz_urls), key)
        self.assertTrue(any('/linux-basics-commands-and-system-tools/' in u for u in quiz_urls))

    def test_reference_groups_and_contextual_connections(self):
        text = self.visible('reference/README.md')
        network, commands = text.split('## Command-Line Tools')
        self.assertIn('## Networking & Protocols', network)
        self.assertIn('(ports-and-protocols.md)', network)
        self.assertIn('(windows-command-line.md)', commands)
        self.assertIn('(linux-commands.md)', commands)
        self.assertNotIn('powershell-commands.md', text)
        connections = {
            'learn/networking/README.md': '../../reference/ports-and-protocols.md',
            'learn/networking/ports-and-protocols.md': '../../reference/ports-and-protocols.md',
            'reference/linux-commands.md': '../labs/it-support/linux-mint-command-line/README.md',
            'reference/windows-command-line.md': '../labs/it-support/windows-command-line/README.md',
            'labs/it-support/linux-mint-command-line/README.md': '../virtualbox-linux-mint/README.md',
            'labs/it-support/virtualbox-linux-mint/README.md': '../linux-mint-command-line/README.md',
        }
        for source, target in connections.items():
            self.assertIn(target, self.visible(source))
            self.assertTrue(self.availability.available_target(source, target))

    def test_only_published_topics_and_labs_are_listed(self):
        learn = self.visible('learn/README.md')
        for topic in ('operating-systems', 'hardware', 'software', 'scripting-and-coding', 'cybersecurity', 'pc-basics'):
            self.assertNotIn(topic + '/README.md', learn)
            self.assertNotIn(f'learn/{topic}/README.md', self.availability.visible)
        self.assertIn('networking/README.md', learn)
        for category in ('networking', 'cybersecurity', 'log-analysis', 'incident-response'):
            self.assertNotIn(category + '/README.md', self.visible('labs/README.md'))


if __name__ == '__main__':
    unittest.main()
