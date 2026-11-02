# Network+ Packet Tracer lab series

Branch: `content/network-plus-packet-tracer-labs`. Phase 1 adds the setup guide at `docs/labs/networking/packet-tracer-setup/README.md`. It uses the existing article template, responsive linked images, category cards, and availability generator. No shared UI or publication logic is changed.

**Current verification status:** Phase 4 uses static technical validation and automated Hub checks. Actual Packet Tracer 9.0.1 runtime verification remains **pending manual testing**. No installation, authentication, launch, simulator execution, or .pkt save/reopen was attempted in Work mode. The manual checklist below records the remaining runtime work; it is not a prerequisite for preparing the pull request.

## Publication and progression

The guide is reachable through Network+ → Published Labs and Home → Labs → Networking → Start Here. The existing Network+ Lab Areas link becomes visible automatically. `mkdocs.yml` explicitly orders the Networking overview before the setup guide. `python scripts/sync_navigation.py` regenerates availability comments and GitBook navigation. Empty Cybersecurity, Log Analysis, and Incident Response categories stay hidden.

The sequence below records the full series on this branch. Setup and all six labs are now published. The phase sections retain the implementation history and outstanding simulator/capture checks.

| Order | Student-facing title | Suggested directory under `docs/labs/networking/` |
| --- | --- | --- |
| Start Here | Install Cisco Packet Tracer | `packet-tracer-setup/` (published in Phase 1) |
| 1 | Lab 1 — Basic Network Configuration | `basic-network-configuration/` (published in Phase 2) |
| 2 | Lab 2 — VLAN Configuration | `vlan-configuration/` (published in Phase 2) |
| 3 | Lab 3 — Static Routing | `static-routing/` (published in Phase 2) |
| 4 | Lab 4 — DHCP Configuration | `dhcp-configuration/` (published in Phase 3) |
| 5 | Lab 5 — Centralized DHCP and DNS Services | `centralized-dhcp-dns/` (published in Phase 3) |
| 6 | Lab 6 — ACL Traffic Control | `acl-traffic-control/` (published in Phase 3) |

Networking cards, the Network+ Published Labs section, MkDocs, and generated GitBook navigation follow this order. Previous/next links connect the sequence; Lab 6 returns to the collection without a future placeholder. Lab 3's implementation is static routing; dynamic routing is discussed conceptually without hands-on dynamic protocol configuration.

## Official information checked

On October 29, 2026, the live English Cisco Resource Hub visibly listed **9.0.1** for Windows, macOS, and Ubuntu. It also listed Windows 11, macOS 12 or newer, Ubuntu 22.04/24.04 LTS, amd64/x86-64, 4 GB free RAM, and 1.4 GB free storage. Windows 10 is not in that current supported-platform listing. The Windows walkthrough uses familiar Windows controls but does not claim Windows 10 or native Arm support.

The public Sign Up entry currently offers Google or Create New Account, with country/region, state/province, birth information, optional gender, and Continue. The existing-account form initially exposes Email and Login, plus Google and Setup or Reset Password. Later registration and authenticated enrollment screens were not submitted or observed. The guide uses conditional instructions for those steps rather than claiming exact unseen controls.

The introductory course exposes Self-Paced Online, Get Started With Self-Paced, FREE, 2 HOURS, and Module 1: Download and Use Cisco Packet Tracer. Cisco's Resource Hub still mentions the older green Skills For All authentication button, while its downloadable installation PDF and current online Help document LOGIN and external-browser authentication. The guide distinguishes these flows and includes the Help-documented internal-browser option under Advanced Settings.

Sources:

- [Networking Academy](https://www.netacad.com/)
- [Getting Started course](https://www.netacad.com/courses/getting-started-cisco-packet-tracer/1000)
- [Resource Hub](https://www.netacad.com/resources/lab-downloads)
- [Packet Tracer learning collection](https://www.netacad.com/catalogs/learn/cisco-packet-tracer)
- [Cisco installation instructions](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf)
- [Application login Help](https://tutorials.ptnetacad.net/help/default/login.htm)
- [Interface overview](https://tutorials.ptnetacad.net/help/default/interfaceOverview.htm)
- [Logical workspace](https://tutorials.ptnetacad.net/help/default/workspace_logical.htm)
- [PC configuration](https://tutorials.ptnetacad.net/help/default/config_PCs.htm)

## Screenshot provenance

All published images are authentic Cisco interfaces. Public website captures are from October 29, 2026. Application images are from Cisco's published Help, whose screenshots do not establish a particular installed patch release. Every application caption explicitly identifies a Cisco Help example rather than a fresh 9.0.1 capture. Existing red annotations in the Help images are Cisco's originals. Only deterministic crops and JPEG encoding were applied; no control, value, text, or interface was generated or reconstructed. No personal account data is included. Local image links open the original-sized published files using the existing article behavior.

| Published image | Source | Treatment |
| --- | --- | --- |
| `netacad-home.jpg` | Live `netacad.com/` | Header and homepage entry; Login and Sign up remain visible. |
| `netacad-signup.jpg` | Public Sign Up entry reached from the homepage | Crop to blank form; no registration submitted. Session-bound URLs are not linked. |
| `netacad-login.jpg` | Log In from the public signup form | Crop to blank sign-in panel; no credentials entered. |
| `packet-tracer-course.jpg` | Live Getting Started course | Course title, language, self-paced enrollment control, and free-course label. |
| `resource-hub.jpg` | Live Resource Hub | Heading and public sign-in prompt. |
| `packet-tracer-downloads.jpg` | Live Resource Hub | Crop to 9.0.1 OS choices, sign-in notice, and requirements. Signed-out state is explicit. |
| `packet-tracer-login.jpg` | `https://tutorials.ptnetacad.net/help/default/images/accounts/accounts.jpg` | Crop to application authentication panel. |
| `packet-tracer-login-settings.jpg` | `https://tutorials.ptnetacad.net/help/default/images/accounts/advanced-settings-login.jpg` | Unchanged official example. |
| `logical-workspace.jpg` | `https://tutorials.ptnetacad.net/help/default/images/interfaceOverview_1.jpg` | Unchanged official numbered interface example. |
| `device-selection.jpg` | Same official interface image | Crop to families, router/switch subcategories, and models. |
| `connections.jpg` | `https://tutorials.ptnetacad.net/help/default/images/workspace_logical_4.jpg` | Unchanged official cabling example; caption distinguishes its example cable from lab requirements. |
| `device-window.jpg` | `https://tutorials.ptnetacad.net/help/default/images/workspace_logical_2.jpg` | Unchanged official router window with Physical, Config, and CLI tabs. |
| `pc-desktop.jpg` | `https://tutorials.ptnetacad.net/help/default/images/config_PCs_1.jpg` | Unchanged official PC Desktop example. |
| `pc-ip-configuration.jpg` | `https://tutorials.ptnetacad.net/help/default/images/config_PCs_3.jpg` | Unchanged official IP Configuration example; caption says not to copy the sample addressing. |

Cisco retains rights to its imagery; the guide attributes the screenshots to Cisco and links their original documentation. No open license is asserted.

### Capture and execution limitations

The execution environment is Linux and the browser is signed out of Cisco. No legitimate authenticated Cisco session or Windows Packet Tracer installation was available. The following requested captures could not be obtained:

1. Actual Windows installer initial/license screen.
2. Actual Windows installer configuration/completion screen.
3. A successful authenticated download/enrollment state or browser-to-application success state from a local 9.0.1 installation.

The guide provides Cisco-documented text instructions for installation and authentication and authentic public download and application Help images. It does not claim these missing captures were obtained. Current Windows captures can be supplied later; the screenshot coverage remains incomplete and does not block pull-request preparation under the Phase 4 amendment. Packet Tracer itself was not installed, launched, or tested. The browser captures do not establish completed account creation or course enrollment. No PR or merge was part of Phase 1.

## Validation

Run the standard source, navigation, unit, catalog, and strict-build validators. After building, run `node tests/network-plus-packet-tracer.cjs`, `npm run test:learning-resource-navigation`, `npm run test:pbq-library`, and `node tests/shared-linux-lab.cjs`. Existing tests' empty-Networking assumptions are updated to reflect publication while preserving checks for genuinely empty categories. `PBQ_CHROMIUM_PATH` selects an available Chromium executable, and `NODE_PATH` can point to an existing Playwright installation.

The Packet Tracer guide browser check follows the student routes, validates local full-size screenshots and alt text, checks document overflow and image aspect ratios at desktop and narrow widths in both themes, verifies keyboard access to linked images, and checks search/navigation and the absence of unfinished lab links. Temporary QA screenshots stay outside the repository and are not a preview deliverable. These tests cover the Hub publication, not execution of Packet Tracer.

Phase 1 local results: all 31 Python unit tests passed; navigation and PBQ generation checks passed; source checks covered 718 local Markdown links; the strict build passed; site checks covered 73 HTML pages and 4,891 local links/assets/fragments; all 19 canonical PBQs validated; catalog and analytics tests passed. The new guide suite and the existing learning-resource navigation, PBQ-library, and shared Linux installation guide browser suites passed. The guide was checked at 1440, 390, and 320 pixels in both themes, at root and project subpaths. Desktop, narrow-screen, and screenshot rendering were visually inspected. All nine unique official destination URLs returned HTTP 200; the public course, download, registration, and sign-in entry states were also inspected in the browser. Account completion, authenticated downloads, installation, and application execution remain unverified as described above.

## Phase 2: cumulative Labs 1–3

Continues Phase 1 commit `8c833e8604d5c594c274ad058c0cb18ff32eb79d` on the same branch. Published resources:

- `docs/labs/networking/basic-network-configuration/README.md`
- `docs/labs/networking/vlan-configuration/README.md`
- `docs/labs/networking/static-routing/README.md`

Each uses the existing `article.html` template and a locally stored SVG topology schematic. Schematics are exact instructional drawings, not Packet Tracer screenshots. The setup guide's text and 14 screenshots are preserved; only its closing continuation link changes to Lab 1. Networking cards, MkDocs navigation, GitBook navigation, and the Network+ Published Labs section follow Setup → Lab 1 → Lab 2 → Lab 3. There is no unfinished Lab 4 link. No shared publication logic, CSS, JavaScript, or templates change.

### Source review and preserved configurations

The original archive is `Lab_1-6_Basic_Network_Configuration_Student.zip`, SHA256 `31df2ae7684f12b2633d24c456936ea3b33800274406e8241b01ac1c49fe7bf8`. All text and all pages of the first three PDFs were reviewed, including their configuration examples and troubleshooting/checklists: Lab 1 (4 pages), Lab 2 (4 pages), and Lab 3 (3 pages). Labs 4 (3 pages), 5 (5 pages), and 6 (7 pages) were reviewed for continuation dependencies. Their content remains unimplemented in Phase 2. The PDFs and archive are not duplicated in the repository.

| Lab | Preserved source contract | Saved project |
| --- | --- | --- |
| 1 | One 2911 Router0, one 2960 Switch0, PC1–PC3, four copper straight-through cables; PC Fa0 to switch Fa0/1–3; switch Gi0/1 to router G0/0; 192.168.1.1/24 gateway and .2–.4 hosts. | `Lab1_Basic_Network.pkt` |
| 2 | Starts from Lab 1; PC4 on Fa0/4; Sales VLAN 10 on Fa0/1–2; HR VLAN 20 on Fa0/3–4; Gi0/1 trunk to G0/0; remove the old parent IP; .10 and .20 subinterfaces with .1 gateways and .2/.3 hosts in each /24. | `Lab2_VLAN_Configuration.pkt` |
| 3 | Starts from Lab 2; second 2911 Router1; original straight-through cable from Router0 G0/1 to Router1 G0/0; 192.168.0.1 and .2 with /30 masks; two Router1 static routes through 192.168.0.1; PC1/PC3 pings to 192.168.0.2. | `Lab3_Static_Routing.pkt` |

A source-to-Markdown command comparison retained all substantive original configuration-command occurrences: 4 in Lab 1, 29 in Lab 2, and 11 in Lab 3. These counts include interface selection, addressing, VLAN/access/trunk configuration, encapsulation, static routes, and configuration saves. Command spelling and targets are normalized for comparison; no configurations were replaced with generic exercises. Additional EXEC/configuration transitions support the inserted verification checkpoints.

### Corrections and instructional improvements

- Lab 3's title, objective, and filename now accurately describe static routing. Dynamic routing remains conceptual, and no RIP, OSPF, or EIGRP configuration is introduced.
- Code blocks contain commands without copied IOS/PC prompt prefixes or the literal text “Press Enter.” The surrounding instructions identify the target device, required command mode, and startup-config filename confirmation. Workspace display names are distinguished from IOS hostnames.
- Browser QA caught nested PC command fences rendering as prose under the existing Markdown engine. They were moved to ordinary top-level console blocks with explicit PC labels; the suite now checks that no literal fences remain in the rendered instructions. No global Markdown extension or template change was needed.
- Lab 2 explicitly removes 192.168.1.1 from G0/0 before assigning subinterface IP addresses. It identifies an unassigned, up/up parent interface as normal, explains the relationship between subinterface numbers and dot1Q tags, and separates access-port verification from trunk verification. No unsupported trunk-encapsulation selection command is added to the 2960. The default trunk allowance is retained rather than introducing an unnecessary restriction that could interfere with VLAN 30 later.
- Lab 3 retains the original straight-through transit connection. [Cisco's 2911 hardware specifications, Table 1-15](https://www.cisco.com/c/en/us/td/docs/routers/access/2900/hardware/installation/guide/Hardware_Installation_Guide/Overview.html) confirm three Gigabit Ethernet ports and Auto-MDIX; this supports the hardware explanation, not a claim of executed Packet Tracer link testing.
- Address/subnet tables, unique-address requirements, ARP initialization, gateway behavior, switch MAC learning, parent-interface status, /30 network/host/broadcast roles, active-route reachability, return paths, and device-versus-project saves are explained next to the relevant practical steps. A short routing-table interpretation task uses an explicitly illustrative C/L/S excerpt. `show ip protocols` is retained as a diagnostic with an explicit distinction from static-route verification.
- Student name, date/class fields, PDF headers/footers/page numbers, old fixed 9.0.0 references, and surname filename requirements are omitted from the native pages. Earlier .pkt files remain separate checkpoints using Save As for the next lab.

Technical references include Cisco's [external-router inter-VLAN configuration](https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/14976-50.html), [router configuration Help](https://tutorials.ptnetacad.net/help/default/config_routers.htm), and the 2911 hardware specifications linked above. Their applicable concepts and commands are adapted to the original exercise's devices, interfaces, and addressing; reference topologies are not substituted for the supplied labs.

### Future-lab compatibility and scope

Router0's G0/0.10 and G0/0.20 gateways, Switch0's Gi0/1 trunk, PC access ports, and the /30 transit link remain ready for Lab 4's DHCP pools. Lab 5 can add Server0 on Fa0/5 and VLAN 30 without recabling the trunk; no DHCP service, relay, DNS, VLAN 30, or ACL configuration is introduced now. Router1's Services route is intentionally absent until that network is added and the source sequence requests it.

The Lab 5 PDF's port note contains overlapping, contradictory Gi0/1 and Fa0/1 text. The configuration commands use **Gi0/1** for the trunk and **Fa0/5** for Server0; preserve those assignments during Phase 3. The original Lab 6 adds Router1's route to VLAN 30 before applying its ACLs. This continuation review does not rewrite or publish Labs 4–6.

### Validation and execution boundary

The existing Packet Tracer browser suite is extended in place for the Setup → Lab 1 → Lab 2 → Lab 3 journey, previous/next links, all four Network+ certification cards, source-clean filenames and commands, three topology assets, search, root/project hosting, and 1440/390/320-pixel light/dark layouts. The existing learning-resource unit suite now checks ordered single publication and addressing/route contracts, including host uniqueness, gateway/interface addresses, /30 host calculations, removal of the parent-interface address before subinterfaces, and exclusion of premature DHCP/dynamic-routing configuration.

No supported Packet Tracer application is available in the execution environment. IOS text, models/ports, cable rationale, subnet calculations, VLAN/tagging dependencies, routing paths, and future-lab compatibility were reviewed statically. The illustrative routing excerpt and expected ping results are instructional expectations, not captured simulator results. No Packet Tracer installation, CLI execution, saved .pkt loading, or successful simulator ping is claimed. Phase 1's missing native Windows installer/authenticated-launch captures remain unresolved. There is no PR or merge in Phase 2.

Phase 2 local results: all 33 Python unit tests passed, including the two new progression/addressing contracts. The final strict build passed; source validation covered 750 local Markdown links and 54 published student pages; site validation covered 76 HTML pages and 5,368 local links/assets/fragments. Generated navigation/listing checks, 19 canonical PBQ validations, catalog tests, and analytics tests passed. The expanded Packet Tracer browser suite and the existing learning-resource navigation, PBQ-library, and shared Linux installation guide browser suites passed. The expanded suite checks desktop and 390/320-pixel layouts in both themes at root and project paths, diagrams/full-size links, keyboard access, all four Network+ cards, and the cumulative previous/next journey. Finished page layouts, copyable command blocks, and all three full-size diagrams were visually inspected. All 14 Phase 1 screenshot files were compared byte-for-byte with the Phase 1 commit and remain unchanged. Temporary PDF renders, browser dependencies, and QA captures remain outside the repository.

## Phase 3: cumulative Labs 4–6

Continues Phase 2 commit `29106fd2e7e0441eb3fd37b719a0ad7610633939` on the same branch. Adds native article pages and linked SVG schematics in `dhcp-configuration/`, `centralized-dhcp-dns/`, and `acl-traffic-control/`. All pages of the original Lab 4 (3), Lab 5 (5), and Lab 6 (7) PDFs were reviewed as text and rendered pages. The original archive hash above was rechecked. No PDFs, fabricated screenshots, or unverified .pkt downloads are published.

The setup guide, its 14 images, and Labs 1–2 remain unchanged. Lab 3 changes only its footer to link forward to Lab 4. No shared templates, styles, scripts, or publication logic change. All seven resources are connected through Networking, Network+, MkDocs, GitBook, search, and cumulative previous/next links.

### Configuration continuity and source corrections

- Both 2911 routers, the 2960, PC1–PC4, access ports Fa0/1–4, Gi0/1 → Router0 G0/0 trunk, unaddressed enabled parent G0/0, VLAN 10/20 gateways, /30 transit, and Router1's two original return routes are retained.
- Lab 4 adds Router0's original exclusions (.1–.10), VLAN10/VLAN20 pools, /24 masks, .1 gateways, and 8.8.8.8 DNS option. Clients change to DHCP; no exact lease order or external DNS/Internet connectivity is promised. The full running configuration is authoritative; `include dhcp` does not display every nested pool setting.
- Lab 5 adds only Server0 (Server-PT), its straight-through Fa0 → Switch0 Fa0/5 connection, Services VLAN 30, Router0 G0/0.30 at 192.168.30.1/24, and explicit trunk allowance 10,20,30. This corrects the PDF's overlapping Gi0/1/Fa0/1 trunk reference. PC1 remains on Fa0/1.
- Router0 removes its two pools and retains `service dhcp`, which enables both server and relay functions. Helpers on .10 and .20 target 192.168.30.10. Old exclusions do not configure Server0's ranges; historical router bindings need not vanish immediately.
- Server0 uses static 192.168.30.10/24, gateway 192.168.30.1, and itself for DNS. Its two 200-address pools span .11–.210 in their respective /24s. Both supply DNS 192.168.30.10. A records are server.lab.local → .30.10, dns.lab.local → .30.10, and router.lab.local → .30.1. These names are exercise-specific.
- Cisco's [Server Help](https://tutorials.ptnetacad.net/help/default/config_servers.htm) and its authentic DHCP example were inspected on November 2, 2026: Interface, Service On/Off, Pool Name, Default Gateway, DNS Server, Start IP Address, Subnet Mask, Maximum Number of Users, Add/Save/Remove, TFTP Server, and WLC Address are present. The Help calls the default serverPool protected and its example shows Remove disabled. The lesson therefore removes an unused default only when permitted; otherwise it leaves that entry untouched and creates both named pools. Exact 9.0.1 behavior remains a runtime check.
- Only Lab 6 adds Router1's 192.168.30.0/24 route via 192.168.0.1, before the ACLs. Router0's original VLAN10-IN/VLAN20-IN extended ACLs deny the opposite client subnet, then permit other IPv4 traffic, inbound on .10/.20 respectively. The source's wildcard description is corrected: 0.0.0.255 matches .0–.255; usable /24 hosts are .1–.254. Baseline tests, post-ACL DHCP renewal in both VLANs, both same-VLAN tests, both blocked directions, services/DNS, and Router1 tests distinguish policy enforcement from network faults. Rollback follows completion and is explicitly optional; completed projects keep ACLs active.

Primary technical references: Cisco's [DHCP relay configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/12-4/dhcp-12-4-book/config-dhcp-relay-agent.html) for helper behavior and `service dhcp`, and [IP ACL guidance](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html) for wildcards, first-match processing, and interface direction. These support static review, not executed simulator claims.

### Verification and Phase 4 boundary

Existing unit/browser suites are extended in place for all seven resources, three new SVGs, exact filenames, DHCP allocation bounds, relay and DNS settings, route sequencing, ACL ordering/directions, and packet matching (including wildcard endpoints, DHCP broadcast/renewal, Server0, and Router1). Browser QA covers discovery, previous/next/collection links, command rendering, keyboard access, search, 1440/390/320-pixel light/dark layouts, and root/project hosting.

Phase 3 local results: all **37 Python unit tests** passed. Source validation covered **783 local Markdown links** and **57 published student pages**; the strict build passed. Site validation covered **79 HTML pages** and **5,874 local links/assets/fragments**. Generated navigation/listing checks, all 19 canonical PBQ validations, catalog tests, analytics tests, and the expanded Packet Tracer plus existing learning-resource, PBQ-library, and shared Linux guide browser suites passed. Source-to-Markdown comparison retained all substantive configuration-command occurrences: **11 in Lab 4, 22 in Lab 5, 15 in Lab 6**, including optional rollback. A separate static mode check validated configuration/EXEC transitions in every copyable block. All three full-size SVGs were rendered and inspected; label bounds/overlaps were checked. Page layouts, tables, and command blocks were visually inspected. The three Phase 3 technical-reference URLs returned HTTP 200. Phase 1/2 preservation was checked against committed files; temporary source renders and QA captures stay outside the repository.

Packet Tracer is unavailable in this environment. No simulator commands, leases, DNS responses, ACL counters, ping results, or .pkt saves are claimed as executed. Full `show running-config` and traffic tests are provided when the simulated IOS omits filters or detailed interface fields; `show ip interface brief` is not presented as proof of ACL attachment.

The Phase 4 amendment replaces the earlier simulator-execution requirement with static validation, automated repository tests, and Hub integration checks. The local runtime work is retained in the checklist below. Phase 1's missing Windows installer and authenticated Cisco/download/launch captures remain deferred. The amendment authorizes a pull request after QA, but no merge.

## Phase 4: static technical review

Reviewed November 2, 2026, continuing Phase 3 commit `2e12d505584066cf8a615b01983cff81b614a3f9`. Static review checks the documented configurations and predicted packet paths against official references; it cannot establish that commands or services actually executed in Packet Tracer.

### Reference basis and findings

| Area | Static result | Official reference |
| --- | --- | --- |
| CLI syntax and modes | Reviewed all six labs' configuration and diagnostic blocks, including rollback. Global, interface/subinterface, VLAN, DHCP-pool, named-ACL, and EXEC commands are placed in their appropriate modes. The automated mode check guards these transitions; it is not an IOS emulator. | Packet Tracer [router command tree](https://tutorials.ptnetacad.net/help/default/CLI_routerIOS.htm), [switch command tree](https://tutorials.ptnetacad.net/help/default/CLI_switchIOS.htm), and [PC tools](https://tutorials.ptnetacad.net/help/default/config_PCs.htm) |
| Models, interfaces, cables, diagrams | The two 2911s provide the assigned G0/0 and G0/1 ports. The 2960 has the required Fa0/1–5 access ports and Gi0/1 uplink. No port is assigned to two links. Straight-through transit cabling has a documented hardware Auto-MDIX basis; actual simulated link behavior remains pending. All six SVGs agree with their connection/address tables. | [2911 hardware, Tables 1-11 and 1-15](https://www.cisco.com/c/en/us/td/docs/routers/access/2900/hardware/installation/guide/Hardware_Installation_Guide/Overview.html), [2960 port counts](https://www.cisco.com/c/dam/en_us/solutions/small-business/products/routers-switches/catalyst-2960-series-switches/C45-521044-00_FixedSwitch_AAG_FINAL021009.pdf), [Packet Tracer cabling](https://tutorials.ptnetacad.net/help/default/workspace_logical.htm) |
| Addressing and router-on-a-stick | Host addresses are unique and usable; /24 masks and on-subnet gateways agree. Lab 2 removes the old parent IP before adding .10/.20 and matching dot1Q tags. The enabled, unaddressed parent and Gi0/1 trunk persist. Lab 5 adds .30, Fa0/5 VLAN 30, and the complete 10,20,30 allowed list. | [External-router inter-VLAN routing](https://www.cisco.com/c/en/us/support/docs/lan-switching/inter-vlan-routing/14976-50.html), [2960 trunk configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-2_3_e/consolidated_guide/b_1523e_2960p_2960c_cg/b_1522e_2960_2960c_2960s_2960sf_2960p_cg_chapter_01101.html) |
| Routes and return paths | Transit .1/.2 are the usable hosts of 192.168.0.0/30. Router0 has connected client/transit routes; Router1 uses reachable next hop .0.1 for Sales/HR, then Services in Lab 6. Server0 returns through .30.1. There is no external/default route or Internet test. | [Packet Tracer router command tree](https://tutorials.ptnetacad.net/help/default/CLI_routerIOS.htm), [Cisco static next-hop guidance](https://www.cisco.com/c/en/us/support/docs/dial-access/floating-static-route/118263-technote-nexthop-00.html) |
| DHCP server to relay transition | Router exclusions reserve .1–.10; Lab 4's remaining usable range is .11–.254. Lab 5 removes both local pools, retains DHCP service, and attaches helpers to client subinterfaces. The relay's originating-interface address identifies the client subnet. Server0's two 200-address ranges are .11–.210, with matching gateways and DNS .30.10; router exclusions do not control Server0. | [IOS DHCP server](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-mt/dhcp-15-mt-book/config-dhcp-server.html), [IOS relay](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/12-4/dhcp-12-4-book/config-dhcp-relay-agent.html), [Packet Tracer server controls](https://tutorials.ptnetacad.net/help/default/config_servers.htm) |
| DNS | All three A records have reachable targets. Both client pools supply Server0 as DNS. Lab 5 now explicitly checks server.lab.local, dns.lab.local, and router.lab.local; IP and named pings distinguish routing from resolution. | [Packet Tracer server/DNS Help](https://tutorials.ptnetacad.net/help/default/config_servers.htm), [PC nslookup and ping](https://tutorials.ptnetacad.net/help/default/config_PCs.htm) |
| ACLs and traffic | Both wildcard expressions match the entire opposing /24. Each specific deny precedes the broad permit, with the correct inbound client attachment. Same-VLAN traffic stays on the switch. Services, DNS, DHCP discovery/renewal, and transit requests/replies avoid the denies. Lab 6 now explains that ping failure alone cannot establish both attachments: the request or reply can be filtered. | [Cisco IP ACL guidance](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html), [named-ACL modes and attachment](https://www.cisco.com/c/en/us/td/docs/routers/ios-xe/security-vpn/security-vpn/m_sec-create-ip-apply-0.html) |
| Continuity and troubleshooting | Each lab opens its predecessor and saves a separate checkpoint. Router1's Services route appears only in Lab 6, before ACLs; no client/gateway/trunk is displaced. ARP retry guidance, current lease addresses, complete running-config fallbacks, baseline tests, and optional rollback agree with the configuration. Removed Lab 3's stale future-publication wording. | The six committed lessons and reference checks above |

### Screenshot review

Visually inspected all **14 existing JPEGs** against their captions and source descriptions. Figures 1–6 show the stated public account/course/download controls and remain labelled as October 29 signed-out captures. Figures 7–14 match Cisco Help's login, interface, cabling, device-window, and PC examples. The crossover example and sample IP addresses are explicitly distinguished from lab settings; Help images do not establish 9.0.1 execution. [Cisco's installation PDF](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf) supports the text walkthrough without supplying the missing local screenshots. All image files remain unchanged.

Still missing: Windows installer license/initial and configuration/completion screens, authenticated enrollment/download state, and a successful local 9.0.1 browser-to-application login/workspace capture. These are documented coverage gaps for later user-supplied captures. No substitute screen was fabricated, and no account creation, authentication, installer, or Packet Tracer application was executed during this review.

## Manual runtime verification checklist — Packet Tracer 9.0.1

**Status: not run.** Complete locally in order, using the published lesson commands to build each checkpoint. Record the exact version, date, result, and any rejected command or unexpected screen below. Router/switch diagnostics run at the privileged `#` prompt: use `end` from configuration mode or `enable` from `>`. PC tests run under **Desktop → Command Prompt**. Use current `ipconfig` addresses for every DHCP client target. Repeat an initial ARP timeout once; persistent failure is a failed check. Full `show running-config` / `show ip route` are fallbacks for omitted filters or detailed output.

| Done | Lab / checkpoint | Commands or actions | Required result |
| --- | --- | --- | --- |
| [ ] | 1 — `Lab1_Basic_Network.pkt` | Check 2911, 2960, three PCs and the four specified straight-through links. Router0: `show ip interface brief`. All PCs: `ipconfig`, `ping 192.168.1.1`. PC1: `ping 192.168.1.3`, `ping 192.168.1.4`. | Router0 G0/0 is .1.1/24 and up/up; PCs are .1.2–.1.4 with /24 mask and .1.1 gateway. All pings reply. |
| [ ] | 2 — `Lab2_VLAN_Configuration.pkt` | Switch0: `show vlan brief`, `show interfaces trunk`. Router0: `show ip interface brief`, `show running-config`. PCs: `ipconfig`. PC1: `ping 192.168.10.3`, `ping 192.168.20.2`; PC3: `ping 192.168.20.3`. | PC4 is on Fa0/4; Fa0/1–2 are VLAN 10, Fa0/3–4 VLAN 20. Gi0/1 trunks; G0/0 is enabled/unaddressed; .10/.20 have matching tags and .1 gateways. Same-VLAN and routed pings reply. |
| [ ] | 3 — `Lab3_Static_Routing.pkt` | Confirm the straight-through Router0 G0/1 → Router1 G0/0 link. Both: `show ip interface brief`, `show ip route`. Router1: `ping 192.168.0.1`. PC1 and PC3: `ping 192.168.0.2`. | Transit .0.1/.0.2 uses /30 and is up/up. Router1 has Sales/HR S routes via .0.1; Router0 retains connected routes. Neighbor and both client pings reply. Record any cabling/model discrepancy rather than assuming hardware support proves simulation behavior. |
| [ ] | 4 — `Lab4_DHCP_Configuration.pkt` | Router0: `show running-config`, `show ip dhcp binding`. All PCs: select **DHCP**, inspect **IP Configuration**, run `ipconfig`. Each pings its .1 gateway; PC1 pings PC3's current address and PC1/PC3 ping `192.168.0.2`. | Both router pools/exclusions exist; each client has a unique .11–.254 address in its assigned /24, correct gateway and DNS 8.8.8.8. Bindings agree; pings reply. External DNS/Internet access is not expected. |
| [ ] | 5 — `Lab5_Centralized_DHCP_DNS.pkt` | Switch0: `show vlan brief`, `show interfaces trunk`. Router0: `show ip interface brief`, `show ip route`, `show running-config`. Inspect Server0 static IP, DHCP On/pools and DNS On/records. Record protected **serverPool** behavior. On all PCs select **Static → DHCP** and inspect all options. PC1 and PC3: ping own gateway and `192.168.30.10`; PC1 also pings PC3's current address and `server.lab.local`. Query all three names with `nslookup`; ping `router.lab.local`. | Fa0/5 is VLAN 30; Gi0/1 allows 10,20,30; .30 gateway is .30.1. Helpers exist on .10/.20, old router pools are absent, relay stays enabled. Server0 is .30.10/24 with .30.1 gateway; both pools span .11–.210 and distribute DNS .30.10. Lookups return .30.10, .30.10, .30.1 respectively; pings reply. Router1-to-Services is not required yet. |
| [ ] | 6 — `Lab6_ACL_Traffic_Control.pkt` | Before ACLs, check PC1↔PC3 and Services pings. Router1: `show ip route`, `ping 192.168.30.10` after adding the Services route. Apply both ACLs. Renew all four PCs with **Static → DHCP**, record new options/addresses, then perform the traffic checks below. Router0: `show access-lists`, `show running-config`, `show ip interface GigabitEthernet0/0.10` and `.20`. | Baseline succeeds; Router1 has all three /24 S routes via .0.1. Denies precede permits; inbound VLAN10-IN is on .10 and VLAN20-IN on .20. Both VLANs still obtain correct leases/DNS. Verify attachments in running-config if detailed output is unavailable. Compare deny counters before/after tests where supported. Keep ACLs active in the completed file. |

Lab 6 traffic checks (all PC targets use their current leased addresses):

| Source / action | Expected after ACLs |
| --- | --- |
| PC1 pings PC2; PC3 pings PC4 | Both succeed through local switching. |
| PC1 pings PC3; PC3 pings PC1 | Both fail to receive successful replies. Inspect each attachment and any corresponding deny-counter increase; ping failure alone does not establish both ACLs. |
| PC1 and PC3 each run `ping 192.168.30.10`, `nslookup server.lab.local`, `ping server.lab.local`, `ping 192.168.0.2` | Both clients reach Server0 and Router1; DNS returns .30.10 and named pings succeed. |
| Router1 runs `ping 192.168.30.10` | Server0 replies through its .30.1 gateway and the new route. |

**For every checkpoint:** On every router/switch configured so far, run `copy running-config startup-config` and accept the destination filename with **Enter**; inspect `show startup-config` for the relevant settings. Save the exact `.pkt` filename above, close/reopen it, and recheck topology, VLANs, interfaces, routes and that lab's traffic tests. In Labs 5–6 also inspect saved Server0 pools/DNS and renew clients after reopening. Preserve all earlier files. Record any state that does not persist; startup configuration and project persistence are separate checks.

| Runtime record | Version / date / result / discrepancy |
| --- | --- |
| Labs 1–6 | Pending manual testing |
| Windows/authenticated captures | Pending user-supplied captures |

### Release criteria

Passing static review, automated repository checks, and Hub integration checks permits pull-request preparation. Runtime and capture gaps remain explicitly recorded. The labs must not be described as fully simulator-tested until the manual results establish that status. No separate PDF/HTML review package is produced, and the feature branch must not be merged as part of this phase.

Phase 4 local results: **38 Python unit tests passed**, including the added command-mode check across all six labs. Generated navigation/PBQ listings, source checks (783 local Markdown links and 57 student pages), catalog tests, analytics tests, and the strict MkDocs build passed. Built-site checks passed for 19 canonical PBQs, 79 HTML pages, and 5,874 local links/assets/fragments. The complete Packet Tracer lesson browser suite and the existing learning-resource, PBQ-library, and shared Linux guide browser suites passed. These checks cover desktop/mobile layouts, light/dark themes, keyboard access, discovery, previous/next navigation, search, and root/project hosting. All six full-size diagrams were visually reviewed and checked for clipped/overlapping labels. All 14 setup screenshots remain byte-identical to Phase 1. These results establish repository/Hub behavior and static consistency, not Packet Tracer execution.
