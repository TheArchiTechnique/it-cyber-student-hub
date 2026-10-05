# A+ Core 1 Objective Breakdown

A student-friendly study map for CompTIA A+ Core 1 (220-1201). This page reorganizes the current objective set into practical study targets. Use it with the [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf), which remain the authoritative source.

## Exam domains

| Domain | Weight |
| --- | ---: |
| 1.0 Mobile Devices | 13% |
| 2.0 Networking | 23% |
| 3.0 Hardware | 25% |
| 4.0 Virtualization and Cloud Computing | 11% |
| 5.0 Hardware and Network Troubleshooting | 28% |

The troubleshooting methodology appears in CompTIA's objective document as recommended job knowledge, but the methodology itself is not a formal exam objective. Troubleshooting scenarios throughout Core 1 are still heavily emphasized.

## 1.0 Mobile Devices

### 1.1 Mobile hardware and replacement

Be able to recognize common replaceable mobile-device and laptop components and what a technician should check before replacing them.

- Battery, keyboard/keys, RAM, HDD/SSD, and wireless cards
- Biometrics and other physical privacy/security components
- Wi-Fi antenna connections and placement
- Camera/webcam and microphone
- Safe handling, compatibility, and correct replacement choices

### 1.2 Mobile connectivity and accessories

Know what each connection method and accessory is for and when you would choose it.

- USB, USB-C, microUSB, miniUSB, and Lightning
- NFC, Bluetooth, and tethering/hotspot use
- Stylus, headset, speakers, and webcam
- Docking station vs. port replicator
- Trackpad, drawing pad, and track point

### 1.3 Mobile network connectivity and application support

Be able to configure or troubleshoot the basic settings that keep a mobile device connected and synchronized.

- 3G/4G/5G, Wi-Fi, hotspot, SIM, and eSIM
- Bluetooth discovery, pairing, PIN entry, and connectivity testing
- GPS and cellular location services
- Mobile device management for corporate and BYOD devices
- Policy enforcement and managed corporate applications
- Calendar, contacts, mail, cloud storage, and data-cap awareness

## 2.0 Networking

### 2.1 TCP, UDP, ports, and protocols

Know the common service, port, purpose, and transport behavior.

| Port | Service | Main purpose |
| --- | --- | --- |
| 20/21 | FTP | File transfer |
| 22 | SSH | Secure command-line remote access |
| 23 | Telnet | Unencrypted remote terminal access |
| 25 | SMTP | Sending email |
| 53 | DNS | Name resolution |
| 67/68 | DHCP | Automatic IP configuration |
| 80 | HTTP | Unencrypted web traffic |
| 110 | POP3 | Retrieve email |
| 143 | IMAP | Retrieve and synchronize email |
| 137-139 | NetBIOS/NetBT | Legacy Windows networking |
| 389 | LDAP | Directory services |
| 443 | HTTPS | Encrypted web traffic |
| 445 | SMB/CIFS | File and printer sharing |
| 3389 | RDP | Windows remote desktop |

Also know the practical difference between **TCP** and **UDP**: connection-oriented reliability and ordering vs. lower-overhead connectionless delivery.

### 2.2 Wireless networking

Focus on how wireless choices affect compatibility, range, speed, and interference.

- 2.4 GHz, 5 GHz, and 6 GHz
- Channel selection, channel width, frequency, and regional rules
- 802.11 Wi-Fi standards and supported bands
- Bluetooth
- NFC
- RFID

### 2.3 Services provided by networked hosts

Recognize what service a server or appliance is providing from the scenario.

- DNS, DHCP, file, print, mail, syslog, web, AAA, database, and NTP servers
- Spam gateway, UTM, load balancer, and proxy
- SCADA as a legacy/embedded environment
- IoT devices

### 2.4 Common network configuration concepts

Know what the setting controls and why it would be used.

- DNS records: A, AAAA, CNAME, MX, and TXT
- Email-related TXT records: DKIM, SPF, and DMARC
- DHCP leases, reservations, scopes, and exclusions
- VLANs
- VPNs

### 2.5 Networking hardware

Identify each device by function rather than just by name.

- Router
- Managed and unmanaged switches
- Wireless access point
- Patch panel
- Firewall
- PoE injector, PoE switch, and PoE standards
- Cable modem
- DSL equipment
- Optical network terminal (ONT)
- NIC and MAC address

### 2.6 Basic wired/wireless SOHO networks

Be able to read a small network scenario and choose the correct basic IP settings.

- Private vs. public IPv4
- IPv6
- APIPA
- Static vs. dynamic addressing
- Subnet mask
- Default gateway

Related practice: [SOHO Router Configuration](../../../practice/pbqs/a-plus-core-1/soho-router-configuration/README.md) and [TCP/IP Packet Walk](../../../practice/pbqs/a-plus-core-1/tcp-ip-packet-walk/README.md).

### 2.7 Internet connection and network types

Compare connection choices by availability, performance, latency, and use case.

- Satellite, fiber, cable, DSL, cellular, and WISP
- LAN, WAN, PAN, MAN, SAN, and WLAN

### 2.8 Networking tools

Know what problem each tool helps you solve.

- Crimper and cable stripper
- Wi-Fi analyzer
- Toner probe
- Punchdown tool
- Cable tester
- Loopback plug
- Network tap

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md).

## 3.0 Hardware

### 3.1 Displays

Recognize display technologies and attributes that affect image quality, compatibility, and troubleshooting.

- LCD panel types: IPS, TN, and VA
- OLED and Mini-LED
- Touch screen/digitizer
- Inverter
- Pixel density, refresh rate, resolution, and color gamut

### 3.2 Cables, connectors, and adapters

Be able to identify a connector, choose the correct cable, and understand its common purpose.

- Copper Ethernet, categories, T568A/T568B, STP, UTP, direct-burial, and plenum-rated cable
- Coaxial cable
- Single-mode and multimode fiber
- USB 2.0, USB 3.0, serial, and Thunderbolt
- HDMI, DisplayPort, DVI, VGA, and USB-C video
- SATA and eSATA
- Adapters
- RJ11, RJ45, F-type, ST, SC, LC, punchdown block, microUSB, miniUSB, USB-C, Molex, Lightning, and DB9

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md) and [Cabling Quick Reference](../../../reference/cabling.md).

### 3.3 RAM

Know how memory differs by physical format, generation, reliability features, and channel configuration.

- DIMM vs. SODIMM
- DDR generations
- ECC vs. non-ECC
- Single-, dual-, and other channel configurations

### 3.4 Storage

Compare storage devices by form factor, interface, performance, and redundancy.

- HDD spindle speeds and 2.5-inch vs. 3.5-inch form factors
- SSD interfaces: NVMe, SATA, PCIe, and SAS
- SSD form factors: M.2 and mSATA
- RAID 0, 1, 5, 6, and 10
- Flash drives and memory cards
- Optical drives

Related practice: [RAID Drive Replacement](../../../practice/pbqs/a-plus-core-1/raid-drive-replacement/README.md) and [RAID Quick Reference](../../../reference/raid.md).

### 3.5 Motherboards, CPUs, expansion cards, and cooling

Focus on compatibility and installation decisions.

- ATX, microATX, and ITX
- PCI, PCIe, power connectors, SATA, eSATA, headers, and M.2
- AMD and Intel CPU socket compatibility
- Multisocket systems
- BIOS/UEFI boot, USB, TPM, fan, Secure Boot, password, and temperature settings
- Hardware virtualization support
- TPM and HSM
- x86/x64 vs. ARM and CPU core configurations
- Sound, video, capture, and network cards
- Fans, heat sinks, thermal paste/pads, and liquid cooling

### 3.6 Power supplies

Choose a PSU that is electrically and physically appropriate for the system.

- 110-120 VAC vs. 220-240 VAC input
- 3.3 V, 5 V, and 12 V outputs
- 20+4-pin motherboard power
- Redundant and modular power supplies
- Wattage rating
- Energy efficiency

### 3.7 Multifunction devices and printers

Know the installation and configuration decisions made when deploying a printer or multifunction device.

- Placement and initial setup
- Correct drivers
- PCL vs. PostScript
- Firmware
- USB, Ethernet, and wireless connectivity
- Printer sharing and print servers
- Duplex, orientation, tray, and quality settings
- Authentication, badges, audit logs, and secured print jobs
- Scan to email, SMB, and cloud services
- ADF vs. flatbed scanner

### 3.8 Printer maintenance

Know the consumables, components, and maintenance actions associated with each printer type.

- Laser: toner, maintenance kit, calibration, and cleaning
- Inkjet: cartridges, printhead, rollers/feeders, calibration, and jam clearing
- Thermal: feed assembly, thermal paper, heating-element cleaning, and debris removal
- Impact: multipart paper, ribbon, printhead, and paper replacement

Related practice: [Printer Troubleshooting](../../../practice/pbqs/a-plus-core-1/printer-troubleshooting/README.md).

## 4.0 Virtualization and Cloud Computing

### 4.1 Virtualization

Understand why virtualization is used and the resources it requires.

- Sandboxes and test/development environments
- Application virtualization, legacy software/OS support, and cross-platform use
- Security, networking, and storage requirements
- VDI
- Containers
- Type 1 vs. Type 2 hypervisors

### 4.2 Cloud computing

Be able to identify the cloud model or characteristic described by a scenario.

- Private, public, hybrid, and community cloud
- IaaS, SaaS, and PaaS
- Shared vs. dedicated resources
- Metered utilization and ingress/egress
- Elasticity
- Availability
- File synchronization
- Multitenancy

## 5.0 Hardware and Network Troubleshooting

### 5.1 Motherboards, RAM, CPUs, and power

Use symptoms to narrow down the failing component or likely cause.

- POST beeps and crash screens
- Blank screen or no power
- Sluggish performance
- Overheating or burning smell
- Random shutdowns and application crashes
- Unusual noises
- Swollen capacitors
- Incorrect system date/time

### 5.2 Drives and RAID

Recognize signs of drive failure, array degradation, and storage-performance problems.

- Drive/array status LEDs
- Grinding or clicking HDDs
- Boot device not found
- Data loss or corruption
- RAID failure
- S.M.A.R.T. warnings
- Slow reads/writes or low IOPS
- Missing drives or missing arrays
- Audible enclosure alarms

Related practice: [RAID Drive Replacement](../../../practice/pbqs/a-plus-core-1/raid-drive-replacement/README.md).

### 5.3 Displays and projectors

Map the symptom to likely cabling, settings, source, lamp, panel, or graphics issues.

- Incorrect input source
- Physical cabling problems
- Burnt-out projector bulb
- Fuzzy, dim, distorted, or incorrectly sized image
- Burn-in and dead pixels
- Flickering/flashing
- Incorrect colors
- Audio issues
- Intermittent projector shutdown

### 5.4 Mobile devices

Recognize hardware, charging, connectivity, input, performance, and security problems.

- Poor battery health or swollen battery
- Broken screen
- Charging problems
- Poor/no connectivity
- Liquid damage and overheating
- Digitizer problems
- Damaged ports
- Malware
- Cursor drift/touch calibration
- Application-installation problems
- Stylus failure
- Degraded performance

### 5.5 Networks

Use the symptom to decide whether the likely issue is wireless, cabling, addressing, authentication, latency, interference, or upstream connectivity.

- Intermittent wireless connectivity
- Slow network speeds
- Limited connectivity
- Jitter and poor VoIP quality
- Port flapping
- High latency
- External interference
- Authentication failures
- Intermittent internet connectivity

### 5.6 Printers

Recognize print-quality, paper-handling, queue, connectivity, and finishing problems.

- Lines, faded output, speckling, garbled print, and echo/double images
- Paper jams, no feed, and multipage misfeed
- Stuck or frozen print queues
- Grinding noises
- Staple and hole-punch issues
- Incorrect orientation
- Tray not recognized
- Connectivity problems

Related practice: [Printer Troubleshooting](../../../practice/pbqs/a-plus-core-1/printer-troubleshooting/README.md).

## Current Core 1 practice

- [SOHO Router Configuration](../../../practice/pbqs/a-plus-core-1/soho-router-configuration/README.md)

    Configure LAN, DHCP, employee Wi-Fi, guest Wi-Fi, channels, and security.

- [RAID Drive Replacement](../../../practice/pbqs/a-plus-core-1/raid-drive-replacement/README.md)

    Inspect drive and array information and choose an appropriate replacement.

- [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md)

    Match devices, cable types, connectors, and network requirements.

- [Printer Troubleshooting](../../../practice/pbqs/a-plus-core-1/printer-troubleshooting/README.md)

    Diagnose printer components and common printer symptoms.

- [TCP/IP Packet Walk](../../../practice/pbqs/a-plus-core-1/tcp-ip-packet-walk/README.md)

    Follow network traffic and relate device roles to the traffic path.

[Official CompTIA Objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf) · [Back to A+ Core 1](README.md) · [Student Hub](../../../../README.md)
