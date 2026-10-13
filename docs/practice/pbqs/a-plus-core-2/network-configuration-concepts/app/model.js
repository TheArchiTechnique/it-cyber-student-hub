/* Configuration choices and independent, one-point decisions. */
(function (root) {
  'use strict';
  const decision = (id, label, options, answer, explanation) => ({ id, label, options, answer, explanation });
  const scenarios = [
    {
      id: 'home-office', title: 'Home Office',
      requirement: 'A remote worker needs a wired desktop, a shared wired printer, and secure Wi-Fi. All wireless devices support WPA3-Personal. Use the strongest compatible personal security mode. The desktop must browse encrypted websites and resolve internet names.',
      facts: ['LAN: 192.168.46.0/24 (255.255.255.0)', 'Router LAN: 192.168.46.1; printer: 192.168.46.60', 'The ISP supplies a public IPv4 WAN connection. All listed LAN host addresses are unused unless identified above.'],
      nodes: [
        { id: 'internet', title: 'Internet / ISP', icon: 'cloud', note: 'Public-facing WAN connection', fields: [] },
        { id: 'router', title: 'Home router', icon: 'router', note: 'WAN uplink · LAN switch · Wi-Fi access point', fields: [
          decision('wan', 'WAN IPv4 address', ['198.51.100.70', '192.168.46.70', '169.254.46.70', '127.0.0.1'], '198.51.100.70', 'The WAN needs the ISP-facing public address. 198.51.100.70 represents it in this example. 192.168.46.70 is private, 169.254.46.70 is link-local, and 127.0.0.1 is loopback.')
        ] },
        { id: 'office', title: 'Wired office devices', icon: 'computer', note: 'Desktop PC + shared printer', fields: [
          decision('desktop-ip', 'Desktop IPv4 address', ['192.168.46.24', '192.168.46.0', '192.168.46.255', '169.254.46.24'], '192.168.46.24', '192.168.46.24 is an unused host in the /24 LAN. The .0 address identifies this network, .255 is its broadcast address, and the 169.254 address is APIPA rather than a host in this LAN.'),
          decision('gateway', 'Desktop default gateway', ['192.168.46.1', '198.51.100.70', '192.168.46.60', '192.168.47.1'], '192.168.46.1', 'The desktop sends traffic for other networks to the router interface on its own LAN: 192.168.46.1. The WAN address is on the other side of the router; a printer does not route traffic.'),
          decision('printer-link', 'Printer connection', ['Router LAN switch port', 'Router WAN uplink port', 'Direct ISP connection', 'Desktop USB port only'], 'Router LAN switch port', 'A LAN switch port puts the wired network printer on the same private network as the office clients. The WAN uplink faces the ISP, and USB-only attachment does not meet the shared network-printer requirement.')
        ] },
        { id: 'wireless', title: 'Wireless access point', icon: 'wifi', note: 'Laptop + phone · laptop record: 169.254.20.14', fields: [
          decision('security', 'Personal Wi-Fi security', ['WPA3-Personal', 'WPA2-Personal / AES', 'WPA-Personal / TKIP', 'WEP'], 'WPA3-Personal', 'All intended clients support WPA3-Personal, so it meets the request for the strongest compatible personal mode. WPA2 with AES is useful for older clients. WEP and WPA with TKIP are outdated.'),
          decision('apipa', 'Laptop recorded address type', ['APIPA / link-local', 'RFC 1918 private', 'Public unicast', 'Loopback'], 'APIPA / link-local', '169.254.20.14 is in 169.254.0.0/16, the IPv4 link-local range used by APIPA. It can support communication on the local link but is not a normal routed address for internet access.')
        ] },
        { id: 'services', title: 'Desktop internet services', icon: 'web', note: 'Choose the service and transport for each use', fields: [
          decision('web', 'Encrypted websites over TCP', ['HTTPS · TCP 443', 'HTTP · TCP 80', 'SSH · TCP 22', 'SMTP · TCP 25'], 'HTTPS · TCP 443', 'HTTPS protects web traffic with TLS and commonly uses TCP 443. HTTP on TCP 80 is unencrypted. SSH is remote shell access, and SMTP transfers mail.'),
          decision('dns', 'Name resolution service', ['DNS · TCP/UDP 53', 'DHCP · UDP 67/68', 'HTTPS · TCP 443', 'SMB · TCP 445'], 'DNS · TCP/UDP 53', 'DNS resolves names to addresses and supports UDP and TCP on port 53. DHCP assigns network configuration; HTTPS serves encrypted web content; SMB shares files and printers.')
        ] }
      ],
      links: [['internet', 'router', 'wired'], ['router', 'office', 'wired'], ['router', 'wireless', 'wireless'], ['office', 'services', 'wired']]
    },
    {
      id: 'small-business', title: 'Small Business',
      requirement: 'A print shop needs staff workstations and a printer on its internal LAN. Its booking website must be reachable from the internet over HTTPS using TCP, without an HTTP listener or redirect. Keep the public service separate from staff devices and prevent it from starting connections into the staff LAN.',
      facts: ['Staff LAN: 10.62.14.0/24; gateway: 10.62.14.1', 'Screened subnet: 10.62.90.0/24; booking host: 10.62.90.25', 'The ISP supplies a public IPv4 WAN connection. All listed printer host addresses are unused. The firewall permits replies to allowed sessions.'],
      nodes: [
        { id: 'internet', title: 'Internet customers', icon: 'cloud', note: 'Customers connect to the booking website', fields: [] },
        { id: 'router', title: 'Edge router / firewall', icon: 'firewall', note: 'WAN uplink + separate internal interfaces', fields: [
          decision('wan', 'WAN IPv4 address', ['192.0.2.146', '10.62.14.146', '172.20.14.146', '169.254.14.146'], '192.0.2.146', '192.0.2.146 represents the ISP-facing public address in this example. Both 10.62.14.146 and 172.20.14.146 are RFC 1918 private addresses; 169.254.14.146 is link-local.'),
          decision('forward', 'Inbound port-forwarding rule', ['TCP 443 → 10.62.90.25:443', 'TCP 443 → 10.62.14.60:443', 'TCP 443 → 10.62.90.25:80', 'UDP 443 → 10.62.90.25:443'], 'TCP 443 → 10.62.90.25:443', 'Forward the public WAN listener on TCP 443 to the booking server on TCP 443. This destination NAT mapping targets the service in the screened subnet, rather than the staff printer or an HTTP listener.'),
          decision('http', 'Unsolicited inbound HTTP', ['Block TCP 80', 'Allow TCP 80 to booking host', 'Allow all TCP ports', 'Block TCP 443'], 'Block TCP 80', 'The requirement permits HTTPS only and explicitly excludes an HTTP listener or redirect. Block unsolicited TCP 80, while permitting the specified TCP 443 service and its reply traffic.')
        ] },
        { id: 'office', title: 'Staff LAN / switch', icon: 'printer', note: 'Workstations stay here; choose the printer attachment', fields: [
          decision('printer-place', 'Network printer location', ['Staff LAN switch', 'Screened subnet switch', 'Public WAN segment', 'No network connection'], 'Staff LAN switch', 'The shared internal printer belongs with the staff clients on the LAN. Putting it on the public WAN or public-service subnet exposes it unnecessarily; disconnecting it prevents network printing.'),
          decision('printer-ip', 'Printer IPv4 address', ['10.62.14.60', '10.62.90.60', '192.0.2.146', '10.62.14.255'], '10.62.14.60', '10.62.14.60 is an unused host in the staff LAN. 10.62.90.60 belongs to the screened subnet, 192.0.2.146 is the WAN example address, and .255 is the staff /24 broadcast address.')
        ] },
        { id: 'screened', title: 'Screened subnet / DMZ', icon: 'server', note: 'A separate network behind the firewall', fields: [
          decision('dmz-device', 'Device placed here', ['Booking web server', 'Staff workstation', 'Network printer', 'Internal backup storage'], 'Booking web server', 'Place the externally reachable booking server in the screened subnet. Firewall rules separate it from staff devices and internal storage; a DMZ is not an unrestricted extension of the LAN.'),
          decision('listener', 'Booking service listener', ['HTTPS · TCP 443', 'HTTP · TCP 80', 'HTTPS · UDP 443', 'SSH · TCP 22'], 'HTTPS · TCP 443', 'The requested website serves HTTPS over TCP, so TCP 443 is the appropriate listener. HTTP on TCP 80 is unencrypted. HTTP/3 can use UDP 443, but this work order specifically requires TCP.'),
          decision('dmz-access', 'New screened-subnet → staff sessions', ['Block new sessions to staff LAN', 'Allow new sessions to staff LAN', 'Allow access to printer only', 'Remove separation from staff LAN'], 'Block new sessions to staff LAN', 'Block new connections from the screened subnet into the staff LAN as requested. A stateful firewall can still permit replies to explicitly allowed sessions without allowing the server to initiate new LAN sessions.')
        ] }
      ],
      links: [['internet', 'router', 'wired'], ['router', 'office', 'wired'], ['router', 'screened', 'wired']]
    },
    {
      id: 'hosted-service', title: 'Residential Network with Hosted Service',
      requirement: 'A household shares one public IPv4 connection and hosts a WireGuard VPN appliance for authorized remote users. Its configured listener port is 51820; WireGuard carries tunnel packets in connectionless datagrams. Forward only that listener to the appliance. Guests need encrypted internet access without access to household devices. Their devices support WPA2-Personal with AES, but not WPA3.',
      facts: ['Household LAN: 172.23.68.0/24; gateway: 172.23.68.254', 'WAN example: 203.0.113.82; household PC: 172.23.68.55', 'Guest network: 192.168.83.0/24. All listed appliance host addresses are unused. The appliance retains its assigned address; the router permits replies to outbound sessions.'],
      nodes: [
        { id: 'internet', title: 'Internet / remote peers', icon: 'cloud', note: 'Public WAN: 203.0.113.82', fields: [] },
        { id: 'router', title: 'Residential router', icon: 'router', note: 'One public WAN address · separate household and guest networks', fields: [
          decision('nat', 'Outbound IPv4 translation', ['PAT: household sources → WAN address', 'PAT: household sources → guest address', 'Give every device the same LAN address', 'Forward every inbound port to the PC'], 'PAT: household sources → WAN address', 'Port address translation (PAT, often called NAT overload) lets multiple private hosts share 203.0.113.82 by tracking translated source ports. This is different from creating an inbound mapping to one service.'),
          decision('forward', 'Forward WAN listener 51820 to', ['172.23.68.88:51820', '172.23.68.55:51820', '172.23.68.88:53', 'All household devices:51820'], '172.23.68.88:51820', 'Forward the specified WAN listener to the appliance at 172.23.68.88 on its configured port 51820. Keep this one destination and port; the household PC and DNS port 53 do not provide the requested VPN service.')
        ] },
        { id: 'office', title: 'Household LAN / switch', icon: 'computer', note: 'Trusted PC: 172.23.68.55 · attached VPN appliance', fields: [
          decision('apipa', 'Which recorded address is APIPA?', ['169.254.88.31', '172.23.68.31', '192.168.83.31', '127.0.0.31'], '169.254.88.31', '169.254.88.31 is IPv4 link-local (APIPA). The 172.23 and 192.168 addresses are RFC 1918 private addresses, while 127.0.0.31 is loopback. An APIPA address is not appropriate for this routed household service.')
        ] },
        { id: 'wireless', title: 'Guest wireless network', icon: 'wifi', note: 'Separate SSID and subnet · guest devices support WPA2/AES', fields: [
          decision('security', 'Compatible guest security', ['WPA2-Personal / AES', 'WPA3-Personal only', 'WPA-Personal / TKIP', 'Open / no encryption'], 'WPA2-Personal / AES', 'WPA2-Personal with AES meets both the encryption and client-compatibility requirements. WPA3-only would exclude these guests. WPA/TKIP is outdated, and an open network does not meet the request for encrypted access.'),
          decision('guest-access', 'Guest network access', ['Internet only; block household LAN', 'Internet and household LAN', 'Household LAN only; block internet', 'Bridge guests into household LAN'], 'Internet only; block household LAN', 'A separate guest network with rules blocking the household LAN gives guests internet access while keeping household devices separate. A different SSID alone does not enforce isolation; the router must enforce it.')
        ] },
        { id: 'services', title: 'Hosted VPN appliance', icon: 'server', note: 'WireGuard · configured listener port 51820', fields: [
          decision('service-ip', 'Appliance LAN IPv4 address', ['172.23.68.88', '169.254.68.88', '192.168.83.88', '172.23.68.254'], '172.23.68.88', '172.23.68.88 is an unused host on the household LAN. APIPA cannot provide this routed service; 192.168.83.88 is on the guest subnet; and .254 is already assigned to the household gateway.'),
          decision('transport', 'Listener transport protocol', ['UDP', 'TCP', 'ICMP', 'GRE'], 'UDP', 'WireGuard sends tunnel packets using UDP. Apply UDP to the one port-forwarding listener on 51820. TCP uses a different transport; ICMP and GRE do not identify UDP/TCP port listeners.')
        ] }
      ],
      links: [['internet', 'router', 'wired'], ['router', 'office', 'wired'], ['router', 'wireless', 'wireless'], ['office', 'services', 'wired']]
    }
  ];
  const fields = scenario => scenario.nodes.flatMap(node => node.fields);
  function score(scenario, answers) {
    const decisions = fields(scenario).map(field => ({ ...field, selected: answers[field.id] || '', correct: answers[field.id] === field.answer }));
    const earned = decisions.filter(field => field.correct).length;
    return { earned, possible: decisions.length, percent: Math.round(earned / decisions.length * 100), decisions };
  }
  function shuffle(options, random = Math.random) {
    const copy = [...options];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  const api = { scenarios, fields, score, shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetworkConfiguration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
