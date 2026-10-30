# Network+ Packet Tracer lab series

Branch: `content/network-plus-packet-tracer-labs`. Phase 1 adds the setup guide at `docs/labs/networking/packet-tracer-setup/README.md`. It uses the existing article template, responsive linked images, category cards, and availability generator. No shared UI or publication logic is changed.

## Publication and progression

The guide is reachable through Network+ → Published Labs and Home → Labs → Networking → Start Here. The existing Network+ Lab Areas link becomes visible automatically. `mkdocs.yml` explicitly orders the Networking overview before the setup guide. `python scripts/sync_navigation.py` regenerates availability comments and GitBook navigation. Empty Cybersecurity, Log Analysis, and Incident Response categories stay hidden.

Future phases add activities on the same branch in the following order. These are planning entries, not published links; none of these lab pages or PDF migrations is part of Phase 1.

| Order | Student-facing title | Suggested directory under `docs/labs/networking/` |
| --- | --- | --- |
| Start Here | Install Cisco Packet Tracer | `packet-tracer-setup/` (published in Phase 1) |
| 1 | Lab 1 — Basic Network Configuration | `basic-network-configuration/` |
| 2 | Lab 2 — VLAN Configuration | `vlan-configuration/` |
| 3 | Lab 3 — Static Routing | `static-routing/` |
| 4 | Lab 4 — DHCP Configuration | `dhcp-configuration/` |
| 5 | Lab 5 — Centralized DHCP and DNS Services | `centralized-dhcp-dns/` |
| 6 | Lab 6 — ACL Traffic Control | `acl-traffic-control/` |

Add each finished lab to the curated Networking cards and `mkdocs.yml` in this order. Retain the setup guide first. When Lab 1 is published, replace the setup guide's closing return sentence with a standard, prominent link to Lab 1. Do not add that link before the target is published. Lab 3's implementation is static routing; dynamic routing can be discussed conceptually without implying hands-on dynamic protocol configuration.

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

The guide provides Cisco-documented text instructions for installation and authentication and authentic public download and application Help images. It does not claim these missing captures were obtained. Add current Windows captures before treating the original screenshot acceptance criteria as fully satisfied. No installer was downloaded from an unofficial source, and Packet Tracer itself was not installed, launched, or tested. The browser captures do not establish completed account creation or course enrollment. No PR or merge is part of Phase 1.

## Validation

Run the standard source, navigation, unit, catalog, and strict-build validators. After building, run `node tests/network-plus-packet-tracer.cjs`, `npm run test:learning-resource-navigation`, `npm run test:pbq-library`, and `node tests/shared-linux-lab.cjs`. Existing tests' empty-Networking assumptions are updated to reflect publication while preserving checks for genuinely empty categories. `PBQ_CHROMIUM_PATH` selects an available Chromium executable, and `NODE_PATH` can point to an existing Playwright installation.

The Packet Tracer guide browser check follows the student routes, validates local full-size screenshots and alt text, checks document overflow and image aspect ratios at desktop and narrow widths in both themes, verifies keyboard access to linked images, and checks search/navigation and the absence of unfinished lab links. Temporary QA screenshots stay outside the repository and are not a preview deliverable. These tests cover the Hub publication, not execution of Packet Tracer.

Phase 1 local results: all 31 Python unit tests passed; navigation and PBQ generation checks passed; source checks covered 718 local Markdown links; the strict build passed; site checks covered 73 HTML pages and 4,891 local links/assets/fragments; all 19 canonical PBQs validated; catalog and analytics tests passed. The new guide suite and the existing learning-resource navigation, PBQ-library, and shared Linux installation guide browser suites passed. The guide was checked at 1440, 390, and 320 pixels in both themes, at root and project subpaths. Desktop, narrow-screen, and screenshot rendering were visually inspected. All nine unique official destination URLs returned HTTP 200; the public course, download, registration, and sign-in entry states were also inspected in the browser. Account completion, authenticated downloads, installation, and application execution remain unverified as described above.
