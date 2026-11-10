"""Learning resource discovery, publication, and curated lab progression."""
from pathlib import Path
from ipaddress import IPv4Interface, IPv4Network, IPv4Address
import json
import re
import shutil
import tempfile
import unittest
import xml.etree.ElementTree as ET

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
                    'vlan-configuration', 'static-routing', 'dhcp-configuration',
                    'centralized-dhcp-dns', 'acl-traffic-control']
        expected = [slug + '/README.md' for slug in sequence]
        index = self.visible(prefix + 'README.md')
        self.assertEqual([m[2] for m in LINK.finditer(index) if m[2] in expected], expected)
        nav = self.availability.navigation(yaml.safe_load((ROOT / 'mkdocs.yml').read_text())['nav'])
        self.assertEqual([p for p in nav_paths(nav) if p.startswith(prefix)],
                         [prefix + 'README.md'] + [prefix + p for p in expected]
                         + [prefix + 'osi-pdu-tracing/README.md', prefix + 'subnetting/README.md'])
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
        self.assertNotIn('Next:', self.visible(prefix + sequence[-1] + '/README.md'))

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

    def packet_tracer_content(self, slug):
        text = (ROOT / 'docs/labs/networking' / slug / 'README.md').read_text()
        commands = '\n'.join(re.findall(r'```console\n(.*?)\n```', text, re.S))
        return text, commands

    def test_packet_tracer_commands_stay_in_their_required_modes(self):
        # Static checks of the documented command sequence; no simulator is run.
        # Scope covers every console block, including diagnostics and optional rollback.
        global_commands = r'(?:ip route |ip dhcp excluded-address |no ip dhcp pool |service dhcp$|no ip access-list extended )'
        interface_commands = r'(?:ip address |no ip address$|no shutdown$|switchport |ip helper-address |(?:no )?ip access-group )'
        count = 0
        for slug in ['basic-network-configuration', 'vlan-configuration', 'static-routing',
                     'dhcp-configuration', 'centralized-dhcp-dns', 'acl-traffic-control']:
            text, _ = self.packet_tracer_content(slug)
            for block in re.findall(r'```console\n(.*?)\n```', text, re.S):
                lines = block.splitlines()
                if all(re.match(r'^[CLS]\s+192\.168\.', line) for line in lines):
                    continue  # Explicitly illustrative routing-table output.
                host = lines[0].startswith(('ipconfig', 'ping ', 'nslookup '))
                mode = 'host' if host else ('user' if lines[0] == 'enable' else 'exec')
                for line in lines:
                    with self.subTest(lab=slug, command=line, mode=mode):
                        if mode == 'host':
                            self.assertRegex(line, r'^(?:ipconfig|ping \S+|nslookup \S+)$')
                        elif line == 'enable':
                            self.assertEqual(mode, 'user')
                            mode = 'exec'
                        elif line == 'configure terminal':
                            self.assertEqual(mode, 'exec')
                            mode = 'global'
                        elif line == 'end':
                            self.assertIn(mode, ('global', 'interface', 'subinterface', 'vlan', 'pool', 'acl'))
                            mode = 'exec'
                        elif line == 'exit':
                            self.assertIn(mode, ('global', 'interface', 'subinterface', 'vlan', 'pool', 'acl'))
                            mode = 'exec' if mode == 'global' else 'global'
                        elif line.startswith('interface '):
                            self.assertEqual(mode, 'global')
                            self.assertRegex(line, r'^interface (?:GigabitEthernet0/[01](?:\.(?:10|20|30))?|FastEthernet0/[1-5])$')
                            mode = 'subinterface' if '.' in line else 'interface'
                        elif re.match(r'^vlan \d+$', line):
                            self.assertEqual(mode, 'global')
                            mode = 'vlan'
                        elif line.startswith('ip dhcp pool '):
                            self.assertEqual(mode, 'global')
                            mode = 'pool'
                        elif line.startswith('ip access-list extended '):
                            self.assertEqual(mode, 'global')
                            mode = 'acl'
                        elif re.match(global_commands, line):
                            self.assertEqual(mode, 'global')
                        elif line.startswith('encapsulation dot1Q '):
                            self.assertEqual(mode, 'subinterface')
                        elif re.match(interface_commands, line):
                            self.assertIn(mode, ('interface', 'subinterface'))
                        elif line.startswith(('network ', 'default-router ', 'dns-server ')):
                            self.assertEqual(mode, 'pool')
                        elif line.startswith('name '):
                            self.assertEqual(mode, 'vlan')
                        elif line.startswith(('deny ip ', 'permit ip ')):
                            self.assertEqual(mode, 'acl')
                        elif line.startswith(('show ', 'ping ')) or line == 'copy running-config startup-config':
                            self.assertEqual(mode, 'exec')
                        else:
                            self.fail(f'Unreviewed command in {slug}: {line}')
                        count += 1
                self.assertIn(mode, ('exec', 'host'), f'Unfinished configuration block in {slug}')
        self.assertGreater(count, 150)

    def test_packet_tracer_router_dhcp_pools_exclude_infrastructure(self):
        text, commands = self.packet_tracer_content('dhcp-configuration')
        exclusions = re.findall(r'^ip dhcp excluded-address (\S+) (\S+)$', commands, re.M)
        pools = re.findall(r'^ip dhcp pool (\S+)\n(.*?)(?=\n(?:exit|end)$)', commands, re.M | re.S)
        self.assertEqual([name for name, _ in pools], ['VLAN10', 'VLAN20'])
        self.assertEqual(len(exclusions), 2)
        for vlan, (name, pool), (first, last) in zip((10, 20), pools, exclusions):
            network, mask = re.search(r'^network (\S+) (\S+)$', pool, re.M).groups()
            subnet = IPv4Network(network + '/' + mask)
            gateway = IPv4Address(re.search(r'^default-router (\S+)$', pool, re.M)[1])
            self.assertEqual(str(subnet), f'192.168.{vlan}.0/24')
            self.assertEqual(str(gateway), f'192.168.{vlan}.1')
            self.assertIn('dns-server 8.8.8.8', pool)
            reserved = range(int(IPv4Address(first)), int(IPv4Address(last)) + 1)
            self.assertEqual(len(reserved), 10)
            self.assertIn(int(gateway), reserved)
            first_available = next(ip for ip in subnet.hosts() if int(ip) not in reserved)
            self.assertEqual(str(first_available), f'192.168.{vlan}.11')
            self.assertIn(str(first_available), text)
        self.assertNotRegex(commands, r'(?m)^ip helper-address|^ip route')
        self.assertIn('does not provide a path to the Internet', text)

    def test_packet_tracer_server_pools_relay_dns_and_route_handoff(self):
        text, commands = self.packet_tracer_content('centralized-dhcp-dns')
        _, lab4_commands = self.packet_tracer_content('dhcp-configuration')
        _, lab6_commands = self.packet_tracer_content('acl-traffic-control')
        self.assertEqual(re.findall(r'^no ip dhcp pool (\S+)$', commands, re.M), ['VLAN10', 'VLAN20'])
        self.assertNotRegex(commands, r'(?m)^ip dhcp pool |^no service dhcp$|^ip route ')
        self.assertIn('\nservice dhcp\n', commands)
        self.assertIn('interface FastEthernet0/5\nswitchport mode access\nswitchport access vlan 30', commands)
        self.assertIn('interface GigabitEthernet0/1\nswitchport mode trunk\nswitchport trunk allowed vlan 10,20,30', commands)
        stanzas = dict(re.findall(r'^interface (\S+)\n(.*?)(?=\n(?:exit|end)$)', commands, re.M | re.S))
        for vlan in (10, 20):
            self.assertEqual(stanzas[f'GigabitEthernet0/0.{vlan}'], 'ip helper-address 192.168.30.10')
        self.assertEqual(stanzas['GigabitEthernet0/0.30'],
                         'encapsulation dot1Q 30\nip address 192.168.30.1 255.255.255.0\nno shutdown')
        fields = {}
        for field, sales, hr in re.findall(r'^\| ([^|]+) \| ([^|]+) \| ([^|]+) \|$', text, re.M):
            fields[field] = (sales, hr)
        self.assertEqual(fields['Pool Name'], ('VLAN10', 'VLAN20'))
        self.assertEqual(fields['DNS Server'], ('192.168.30.10', '192.168.30.10'))
        for i, vlan in enumerate((10, 20)):
            subnet = IPv4Network(f"192.168.{vlan}.0/{fields['Subnet Mask'][i]}")
            first = IPv4Address(fields['Start IP Address'][i])
            count = int(fields['Maximum Number of Users'][i])
            last = IPv4Address(int(first) + count - 1)
            self.assertEqual(count, 200)
            self.assertEqual(str(first), f'192.168.{vlan}.11')
            self.assertEqual(str(last), f'192.168.{vlan}.210')
            self.assertIn(last, subnet)
            self.assertEqual(fields['Default Gateway'][i], f'192.168.{vlan}.1')
            self.assertLess(IPv4Address(fields['Default Gateway'][i]), first)
        records = re.findall(r'^\| (\S+\.lab\.local) \| A \| (\S+) \|$', text, re.M)
        self.assertEqual(records, [('server.lab.local', '192.168.30.10'),
                                   ('dns.lab.local', '192.168.30.10'),
                                   ('router.lab.local', '192.168.30.1')])
        for field, value in [('IP Address', '192.168.30.10'), ('Subnet Mask', '255.255.255.0'),
                             ('Default Gateway', '192.168.30.1'), ('DNS Server', '192.168.30.10')]:
            self.assertIn(f'| {field} | {value} |', text)
        self.assertNotIn('ip route 192.168.30.0', lab4_commands)
        self.assertNotIn('ip route 192.168.30.0', commands)
        routes = re.findall(r'^ip route (\S+) (\S+) (\S+)$', lab6_commands, re.M)
        self.assertEqual(routes, [('192.168.30.0', '255.255.255.0', '192.168.0.1')])
        self.assertIn(IPv4Address(routes[0][2]), IPv4Network('192.168.0.0/30'))

    def test_packet_tracer_acl_policy_preserves_services_and_dhcp(self):
        text, _ = self.packet_tracer_content('acl-traffic-control')
        active, rollback = text.split('## Optional rollback', 1)
        commands = '\n'.join(re.findall(r'```console\n(.*?)\n```', active, re.S))
        definitions = dict(re.findall(r'^ip access-list extended (\S+)\n(.*?)\nexit$', commands, re.M | re.S))
        self.assertEqual(set(definitions), {'VLAN10-IN', 'VLAN20-IN'})
        attachments = re.findall(r'^interface (\S+)\nip access-group (\S+) (\S+)$', commands, re.M)
        self.assertEqual(attachments, [('GigabitEthernet0/0.10', 'VLAN10-IN', 'in'),
                                       ('GigabitEthernet0/0.20', 'VLAN20-IN', 'in')])

        def wildcard_match(address, pattern, wildcard):
            significant = 0xffffffff ^ int(IPv4Address(wildcard))
            return (int(IPv4Address(address)) & significant) == (int(IPv4Address(pattern)) & significant)

        def permitted(name, source, destination):
            for rule in definitions[name].splitlines():
                action, protocol, *matches = rule.split()
                self.assertEqual(protocol, 'ip')  # The policy covers ICMP, TCP, and UDP alike.
                if matches == ['any', 'any'] or (
                        len(matches) == 4 and wildcard_match(source, *matches[:2])
                        and wildcard_match(destination, *matches[2:])):
                    return action == 'permit'
            return False  # Implicit deny if no ACE matched.

        for vlan, other in ((10, 20), (20, 10)):
            name = f'VLAN{vlan}-IN'
            rules = definitions[name].splitlines()
            self.assertEqual(len(rules), 2)
            self.assertEqual(rules[0], f'deny ip 192.168.{vlan}.0 0.0.0.255 192.168.{other}.0 0.0.0.255')
            self.assertEqual(rules[1], 'permit ip any any')
            for source_host in (0, 11, 210, 255):
                for dest_host in (0, 11, 210, 255):
                    self.assertFalse(permitted(name, f'192.168.{vlan}.{source_host}',
                                               f'192.168.{other}.{dest_host}'))
            for target in ('192.168.30.10', '192.168.30.1', '192.168.0.2'):
                self.assertTrue(permitted(name, f'192.168.{vlan}.11', target))
            self.assertTrue(permitted(name, '0.0.0.0', '255.255.255.255'))
            self.assertTrue(permitted(name, f'192.168.{vlan}.11', '192.168.30.10'))  # Lease renewal.
            self.assertIn(f'no ip access-group {name} in', rollback)
            self.assertIn(f'no ip access-list extended {name}', rollback)
        # Same-VLAN peers switch locally; service/Router1 replies enter interfaces without these ACLs.
        attachment_interfaces = {interface for interface, _, _ in attachments}
        self.assertNotIn('GigabitEthernet0/0.30', attachment_interfaces)
        self.assertNotIn('GigabitEthernet0/1', attachment_interfaces)
        for first, second in [('192.168.10.11', '192.168.10.12'), ('192.168.20.11', '192.168.20.12')]:
            self.assertEqual(IPv4Interface(first + '/24').network, IPv4Interface(second + '/24').network)
        self.assertLess(commands.index('ip route 192.168.30.0'), commands.index('ip access-list extended'))
        self.assertNotIn('no ip access-group', active)

    def test_packet_tracer_new_topologies_and_checkpoint_files(self):
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        for number, slug, filename in [
                (4, 'dhcp-configuration', 'Lab4_DHCP_Configuration.pkt'),
                (5, 'centralized-dhcp-dns', 'Lab5_Centralized_DHCP_DNS.pkt'),
                (6, 'acl-traffic-control', 'Lab6_ACL_Traffic_Control.pkt')]:
            text, commands = self.packet_tracer_content(slug)
            self.assertIn('template: article.html', text)
            self.assertIn(f'create **{filename}**', text)
            self.assertIn('### Completion checklist', text)
            self.assertNotRegex(text, r'YOUR LAST NAME|Class/Section|Packet Tracer 9\.0\.0')
            self.assertNotRegex(commands, r'(?m)^(?:Router\d*|Switch\d*|PC\d*)[>#]|^router (?:rip|ospf|eigrp)\b')
            self.assertEqual(text.count('](images/topology.svg)'), 2)
            drawing = ET.parse(ROOT / 'docs/labs/networking' / slug / 'images/topology.svg').getroot()
            self.assertGreaterEqual(int(drawing.attrib['width']), 1120)
            self.assertGreaterEqual(int(drawing.attrib['height']), 660)
            labels = [node.text for node in drawing.findall('.//svg:text', ns)]
            for label in ['Router0 (Cisco 2911)', 'Router1 (Cisco 2911)', 'Switch0 (Cisco 2960)',
                          'G0/1: 192.168.0.1/30', 'G0/0: 192.168.0.2/30',
                          'G0/0.10: 192.168.10.1/24', 'G0/0.20: 192.168.20.1/24', 'Switch0 Gi0/1']:
                self.assertIn(label, labels)
            if number > 4:
                self.assertIn('G0/0.30: 192.168.30.1/24', labels)
                self.assertIn('192.168.30.10/24', labels)
                self.assertIn('Fa0/5', labels)
            if number == 6:
                self.assertIn('VLAN10-IN: inbound on G0/0.10', labels)
                self.assertIn('VLAN20-IN: inbound on G0/0.20', labels)

    def test_quizzes_cover_published_certification_links_once(self):
        pattern = r'https://create\.kahoot\.it/(?:share|details)/[^\s)"<>]+'
        expected = json.loads((ROOT / 'tests/fixtures/kahoots.json').read_text())
        quiz_urls = re.findall(pattern, self.visible('practice/questions/README.md'))
        self.assertEqual(quiz_urls, [url for urls in expected.values() for url in urls])
        self.assertEqual(len(quiz_urls), len(set(quiz_urls)))
        for certification, urls in expected.items():
            key = f'certifications/comptia/{certification}/README.md'
            with self.subTest(certification=certification):
                actual = re.findall(pattern, self.visible(key))
                self.assertEqual(actual, urls)
                self.assertEqual(len(actual), len(set(actual)))
        for key in self.availability.visible:
            if key.startswith('certifications/'):
                self.assertTrue(set(re.findall(pattern, self.visible(key))) <= set(quiz_urls), key)
        self.assertTrue(any('/linux-basics-commands-and-system-tools/' in u for u in quiz_urls))

    def test_network_plus_quiz_titles_summaries_and_solo_guidance(self):
        expected_urls = json.loads((ROOT / 'tests/fixtures/kahoots.json').read_text())['network-plus']
        titles = ['OSI Model & Network PDU Basics - Kahoot!',
                  'Ethernet Cabling and Fiber Optics - Kahoot!',
                  'Ethernet & Switching Fundamentals - Kahoot!',
                  'IPv4 Networking, Addresses, Subnets, and Traffic - Kahoot!',
                  'Routing Protocols, Packet Forwarding, NAT/PAT, Edge Routers, and Firewalls - Kahoot!']
        pattern = r'^- \[([^\]]+)\]\((https://create\.kahoot\.it/(?:share|details)/[^\s)]+)\)\n\n[ \t]+([^\n]+)'
        for key, section in [('practice/questions/README.md', '## Network+'),
                             ('certifications/comptia/network-plus/README.md', '## Practice Quizzes')]:
            with self.subTest(page=key):
                text = self.visible(key).split(section + '\n', 1)[1].split('\n## ', 1)[0]
                entries = re.findall(pattern, text, re.M)
                self.assertEqual([title for title, _, _ in entries], titles)
                self.assertEqual([url for _, url, _ in entries], expected_urls)
                for _, _, summary in entries:
                    self.assertIn('Select **Play solo**', summary)
                    self.assertIn('independent practice', summary)
                self.assertIn('Ethernet cabling and fiber-optic', entries[1][2])
                for topic in ('NICs', 'MAC addressing', 'MAC learning', 'frame forwarding', 'VLANs', 'commands'):
                    self.assertIn(topic, entries[2][2])
                for topic in ('IPv4', 'addresses', 'subnets', 'traffic'):
                    self.assertIn(topic, entries[3][2])
                for topic in ('routing protocols', 'packet forwarding', 'NAT/PAT', 'edge routers', 'firewall inspection'):
                    self.assertIn(topic, entries[4][2])

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
