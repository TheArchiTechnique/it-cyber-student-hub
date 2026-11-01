"""Learning resource discovery, publication, and curated lab progression."""
from pathlib import Path
from ipaddress import IPv4Interface, IPv4Network, IPv4Address
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
            self.assertNotIn('labs/cybersecurity/README.md', a.visible)

    def test_packet_tracer_sequence_is_published_once_and_connected(self):
        prefix = 'labs/networking/'
        sequence = ['packet-tracer-setup', 'basic-network-configuration',
                    'vlan-configuration', 'static-routing']
        expected = [slug + '/README.md' for slug in sequence]
        index = self.visible(prefix + 'README.md')
        self.assertEqual([m[2] for m in LINK.finditer(index) if m[2] in expected], expected)
        nav = self.availability.navigation(yaml.safe_load((ROOT / 'mkdocs.yml').read_text())['nav'])
        self.assertEqual([p for p in nav_paths(nav) if p.startswith(prefix)],
                         [prefix + 'README.md'] + [prefix + p for p in expected])
        certification = self.visible('certifications/comptia/network-plus/README.md')
        for i, slug in enumerate(sequence):
            key = prefix + slug + '/README.md'
            self.assertIn(key, self.availability.visible)
            self.assertEqual(certification.count('../../../' + key), 1)
            text = self.visible(key)
            if i:
                self.assertIn('../' + sequence[i - 1] + '/README.md', text)
            if i < len(sequence) - 1:
                self.assertIn('../' + sequence[i + 1] + '/README.md', text)
        for slug in ('dhcp-configuration', 'centralized-dhcp-dns', 'acl-traffic-control'):
            self.assertNotIn(slug + '/README.md', index)

    def test_packet_tracer_addressing_and_routes_preserve_the_network_contract(self):
        prefix = ROOT / 'docs/labs/networking'
        slugs = ['basic-network-configuration', 'vlan-configuration', 'static-routing']
        texts = [(prefix / slug / 'README.md').read_text() for slug in slugs]
        configurations = ['\n'.join(re.findall(r'```console\n(.*?)\n```', text, re.S))
                          for text in texts]
        expected_interfaces = [
            ['192.168.1.1/24'],
            ['192.168.10.1/24', '192.168.20.1/24'],
            ['192.168.0.1/30', '192.168.0.2/30'],
        ]
        for source, commands, expected in zip(texts, configurations, expected_interfaces):
            addresses = [IPv4Interface(address + '/' + mask) for address, mask in
                         re.findall(r'^ip address (\S+) (\S+)$', commands, re.M)]
            self.assertEqual([str(address) for address in addresses], expected)
            tables = '\n'.join(line for line in source.splitlines() if line.startswith('|'))
            for address in addresses:
                self.assertIn(str(address.ip), tables)
                self.assertIn(str(address.netmask), tables)
                self.assertNotIn(address.ip, (address.network.network_address,
                                             address.network.broadcast_address))
            self.assertNotRegex(commands, r'(?im)^router (?:rip|ospf|eigrp)\b|^ip (?:dhcp|helper-address)\b')
            self.assertNotRegex(source, r'YOUR LAST NAME|Your Last Name|Class/Section|Packet Tracer 9\.0\.0')
        for source, expected in zip(texts, [
                ['192.168.1.2', '192.168.1.3', '192.168.1.4'],
                ['192.168.10.2', '192.168.10.3', '192.168.20.2', '192.168.20.3'],
                ['192.168.10.2', '192.168.10.3', '192.168.20.2', '192.168.20.3']]):
            rows = [line for line in source.splitlines() if re.match(r'^\| PC\d FastEthernet0 \|', line)
                    and '255.255.255.0' in line]
            actual = [re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', row)[0] for row in rows]
            self.assertEqual(actual, expected)
            self.assertEqual(len(set(actual)), len(actual))
        vlan = configurations[1]
        self.assertLess(vlan.index('no ip address'), vlan.index('interface GigabitEthernet0/0.10'))
        self.assertIn('interface GigabitEthernet0/1\nswitchport mode trunk', vlan)
        self.assertNotIn('switchport trunk encapsulation', vlan)
        self.assertIn('encapsulation dot1Q 10', vlan)
        self.assertIn('encapsulation dot1Q 20', vlan)
        routes = re.findall(r'^ip route (\S+) (\S+) (\S+)$', configurations[2], re.M)
        self.assertEqual([str(IPv4Network(net + '/' + mask)) for net, mask, _ in routes],
                         ['192.168.10.0/24', '192.168.20.0/24'])
        for _, _, next_hop in routes:
            self.assertEqual(next_hop, '192.168.0.1')
            self.assertIn(IPv4Address(next_hop), IPv4Network('192.168.0.0/30'))
        self.assertEqual(list(IPv4Network('192.168.0.0/30').hosts()),
                         [IPv4Address('192.168.0.1'), IPv4Address('192.168.0.2')])

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
        self.assertIn('networking/README.md', self.visible('labs/README.md'))
        for category in ('cybersecurity', 'log-analysis', 'incident-response'):
            self.assertNotIn(category + '/README.md', self.visible('labs/README.md'))


if __name__ == '__main__':
    unittest.main()
