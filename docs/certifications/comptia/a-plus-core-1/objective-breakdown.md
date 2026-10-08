---
hub:
  kind: resource
---
# A+ Core 1 Objective Breakdown

A student-friendly breakdown of CompTIA A+ Core 1 (220-1201). This page keeps the current objective numbering but adds plain-language definitions, comparisons, and troubleshooting context so the list is useful for studying rather than just repeating the official outline.

Use this with the [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf), which remain the authoritative scope.

## Exam domains

| Domain | Weight |
| --- | ---: |
| 1.0 Mobile Devices | 13% |
| 2.0 Networking | 23% |
| 3.0 Hardware | 25% |
| 4.0 Virtualization and Cloud Computing | 11% |
| 5.0 Hardware and Network Troubleshooting | 28% |

CompTIA also includes a general troubleshooting methodology in the objective document as recommended job knowledge. The methodology itself is not a scored objective, but troubleshooting is heavily represented throughout Core 1.

## 1.0 Mobile Devices

### 1.1 Mobile hardware and replacement

- **Battery:** The portable power source in a laptop, tablet, or phone. Lithium-ion batteries lose capacity over time and may swell or fail. Replacement requires the correct voltage, connector, size, and safe handling.
- **Keyboard/keys:** Physical input components used for typing and commands. Individual keys, keyboard assemblies, ribbon cables, or the entire top case may need replacement depending on the device.
- **RAM:** Short-term working memory used by the operating system and applications. More RAM allows more active data to remain in fast memory instead of being moved to slower storage. Some laptops use replaceable SODIMMs, while many mobile devices have soldered memory.
- **HDD/SSD:** Long-term storage for the operating system, applications, and user files. HDDs use mechanical platters; SSDs use flash memory and are generally faster, quieter, and more resistant to shock.
- **Wireless card:** A network adapter that provides Wi-Fi and often Bluetooth. Laptop cards may use M.2 or other compact interfaces and connect to internal antenna leads.
- **Biometrics:** Authentication based on a physical trait such as a fingerprint or face. A failed fingerprint reader or facial-recognition camera may require recalibration, driver repair, or hardware replacement.
- **Near-field scanner features:** Short-range hardware used for NFC-based identification, payments, pairing, or access. These components work only over very short distances.
- **Wi-Fi antenna connector/placement:** Internal antenna leads connect the wireless card to antennas routed through the display or chassis. Loose connectors, damaged leads, or poor antenna placement can cause weak wireless performance.
- **Camera/webcam:** An image sensor used for photos, video calls, and sometimes facial recognition. Problems can come from the module, cable, privacy shutter, driver, or permissions.
- **Microphone:** Audio-input hardware used for calls, recording, and voice assistants. Failures can result from debris, moisture, loose internal connections, privacy settings, or a damaged microphone.

### 1.2 Mobile connectivity and accessories

#### Connection methods

- **USB:** A family of wired standards used for data, charging, and peripherals. Connector shape and protocol generation are separate concepts, so a USB-C connector does not automatically tell you the maximum speed.
- **USB-C:** A small reversible connector that can carry USB data, power delivery, and, on supported devices, video or Thunderbolt traffic.
- **microUSB:** A small older USB connector used on many legacy phones, tablets, cameras, and accessories.
- **miniUSB:** An older connector larger than microUSB, commonly seen on older cameras, GPS units, and other legacy devices.
- **Lightning:** Apple's compact reversible connector used on many older iPhones, iPads, and accessories for charging and data.
- **NFC:** Near-field communication is an extremely short-range wireless technology used for contactless payments, badges, pairing, and small data exchanges.
- **Bluetooth:** A short-range wireless technology used for peripherals such as headsets, keyboards, mice, speakers, watches, and some file transfers.
- **Tethering:** Sharing a mobile device's internet connection with another device over USB, Bluetooth, or Wi-Fi.
- **Hotspot:** A form of tethering in which the mobile device acts like a small wireless access point and shares its cellular connection over Wi-Fi.

#### Accessories and expansion

- **Stylus:** A pen-like input device used for drawing, handwriting, or precise touchscreen interaction. Active styluses may require a compatible digitizer and power source.
- **Headset:** Headphones combined with a microphone for listening and communication. Headsets may connect through Bluetooth, USB, USB-C, or analog audio.
- **Speakers:** Audio-output devices that may be built in, wired, USB-connected, or Bluetooth-connected.
- **Webcam:** A camera used for live video, usually built into a laptop or connected externally through USB.
- **Docking station:** A device that turns a portable computer into a workstation by adding ports such as monitors, Ethernet, USB, audio, and often power delivery.
- **Port replicator:** A simpler expansion device that mainly provides additional or duplicated ports. It usually has fewer advanced features than a full docking station.
- **Trackpad:** A touch-sensitive pointing surface commonly built into laptops.
- **Drawing pad:** A graphics tablet designed for precise pen input, usually for drawing, design, or handwriting.
- **Track point:** A small pressure-sensitive pointing stick built into some laptop keyboards.

### 1.3 Mobile network connectivity and application support

#### Wireless and cellular

- **3G/4G/5G:** Generations of cellular networking. Later generations generally provide higher throughput, lower latency, and better support for dense device environments.
- **Wi-Fi:** Local wireless networking used to connect a device to a router or access point.
- **Hotspot:** Shares the mobile device's cellular connection with nearby Wi-Fi clients.
- **SIM:** A physical subscriber identity module that stores information used to authenticate a device to a cellular provider.
- **eSIM:** A programmable embedded version of a SIM that allows carrier profiles to be activated digitally.

#### Bluetooth pairing

A typical Bluetooth setup is: enable Bluetooth, place the accessory in pairing mode, discover the device, select it, confirm a PIN or pairing code if required, then test the connection.

#### Location services

- **GPS:** Satellite-based positioning that can provide accurate location data, especially outdoors.
- **Cellular location:** Estimates position using nearby cell towers and network information. It can work where GPS reception is weak but is usually less precise.

#### Mobile Device Management

- **MDM:** Centralized software used by an organization to configure, secure, monitor, and manage mobile devices.
- **Corporate-owned device:** The organization owns the hardware and can normally enforce stronger controls over apps, settings, encryption, updates, and remote wipe.
- **BYOD:** Bring your own device means the employee owns the hardware but uses it for work. MDM typically separates or protects business data while trying to preserve personal privacy.
- **Policy enforcement:** MDM can require screen locks, encryption, approved apps, OS versions, remote wipe, and other security settings.
- **Corporate applications:** Business apps can be automatically installed, configured, updated, or removed through MDM.

#### Synchronization

- **Data cap awareness:** Large backups or sync jobs can consume a limited cellular data allowance, so Wi-Fi is often preferred.
- **Calendar sync:** Keeps appointments consistent across devices and accounts.
- **Contact sync:** Keeps address books synchronized across supported services.
- **Mail sync:** Keeps messages, folders, and status synchronized with the mail service.
- **Cloud storage sync:** Keeps files available across devices through services such as OneDrive, Google Drive, or iCloud.

## 2.0 Networking

### 2.1 TCP, UDP, ports, and protocols

[Study the lesson](../../../learn/networking/ports-and-protocols.md) · [Practice ports and protocols](../../../practice/pbqs/a-plus-core-1/ports-and-protocols/README.md) · [Quick reference](../../../reference/ports-and-protocols.md)

#### TCP vs. UDP

- **TCP:** Connection-oriented transport. It establishes a session, tracks sequence and acknowledgments, retransmits missing data, and prioritizes reliable ordered delivery.
- **UDP:** Connectionless transport. It sends datagrams with less overhead and does not guarantee delivery, ordering, or retransmission. It is useful where low delay is more important than perfect delivery.

| Port | Protocol | Definition / primary use |
| --- | --- | --- |
| 20/21 | FTP | File Transfer Protocol. Port 21 carries control commands; port 20 is traditionally used for active-mode data transfer. FTP is not encrypted. |
| 22 | SSH | Secure Shell. Encrypted command-line remote administration and secure tunneling/file-transfer functions. |
| 23 | Telnet | Unencrypted remote terminal access. It is insecure and mainly seen on legacy systems. |
| 25 | SMTP | Simple Mail Transfer Protocol. Used to send or relay email. |
| 53 | DNS | Domain Name System. Translates names such as example.com into IP addresses and stores other DNS records. |
| 67/68 | DHCP | Dynamic Host Configuration Protocol. Port 67 is used by the server and 68 by the client for automatic network configuration. |
| 80 | HTTP | Hypertext Transfer Protocol. Standard unencrypted web traffic. |
| 110 | POP3 | Post Office Protocol version 3. Retrieves email, traditionally by downloading messages to a client. |
| 143 | IMAP | Internet Message Access Protocol. Synchronizes and manages mail while keeping messages on the server. |
| 137-139 | NetBIOS/NetBT | Legacy Windows name, datagram, and session services carried over TCP/IP. |
| 389 | LDAP | Lightweight Directory Access Protocol. Queries and manages directory information such as users and groups. |
| 443 | HTTPS | HTTP protected with TLS encryption. Used for secure web traffic. |
| 445 | SMB/CIFS | Server Message Block/Common Internet File System. Used mainly for Windows file and printer sharing. |
| 3389 | RDP | Remote Desktop Protocol. Provides graphical remote access to Windows systems. |

### 2.2 Wireless networking technologies

#### Frequency bands

- **2.4 GHz:** Longer range and better wall penetration than higher-frequency Wi-Fi, but fewer non-overlapping channels and more interference from other devices. In the U.S., channels 1, 6, and 11 are commonly used to avoid overlap at 20 MHz widths.
- **5 GHz:** More channels and generally higher throughput with less common household interference, but shorter range and weaker wall penetration than 2.4 GHz.
- **6 GHz:** Additional spectrum used by Wi-Fi 6E and newer devices. It provides wide clean channels and less legacy congestion but has shorter range and requires compatible hardware.

#### Channels and width

- **Channel:** A defined slice of radio spectrum used by a wireless network.
- **Channel width:** The amount of spectrum a wireless channel occupies. Wider channels can provide more throughput but consume more spectrum and may increase interference.
- **Channel selection:** Choosing a less-congested channel can improve reliability and performance.
- **Regulations:** Allowed channels and transmit power differ by country or region.

#### Wireless technologies

- **802.11a:** 5 GHz Wi-Fi.
- **802.11b:** 2.4 GHz Wi-Fi with older, slower data rates.
- **802.11g:** 2.4 GHz and backward compatible with 802.11b.
- **802.11n / Wi-Fi 4:** Can operate on 2.4 GHz or 5 GHz and introduced wider use of MIMO.
- **802.11ac / Wi-Fi 5:** Primarily 5 GHz with wider channels and higher throughput.
- **802.11ax / Wi-Fi 6:** Improves efficiency and capacity on 2.4 GHz and 5 GHz. Wi-Fi 6E extends 802.11ax into 6 GHz.
- **Bluetooth:** Short-range 2.4 GHz wireless used for peripherals and personal-area networking.
- **NFC:** Extremely short-range wireless used for tap-to-pay, access cards, pairing, and small data exchanges.
- **RFID:** Radio-frequency identification uses tags and readers to identify or track objects. Passive tags draw power from the reader; active tags use their own power source.

### 2.3 Services provided by networked hosts

- **DNS server:** Resolves hostnames to IP addresses and stores other DNS information.
- **DHCP server:** Automatically leases IP addresses and other network settings to clients.
- **File server:** Centralizes storage and file sharing for users or systems.
- **Print server:** Manages shared printers, print queues, and print jobs for network users.
- **Mail server:** Sends, receives, stores, or relays email.
- **Syslog server:** Receives log messages from network devices and systems so events can be monitored and retained centrally.
- **Web server:** Hosts websites or web applications and serves content over HTTP/HTTPS.
- **AAA server:** Provides authentication, authorization, and accounting. It verifies identity, determines permissions, and records access activity.
- **Database server:** Stores structured information and processes application queries.
- **NTP server:** Synchronizes system clocks. Accurate time is important for logs, certificates, authentication, and troubleshooting.
- **Spam gateway:** Filters unwanted or malicious email before it reaches users.
- **UTM appliance:** Unified Threat Management combines multiple security functions, such as firewalling, malware scanning, intrusion prevention, VPN, and web filtering.
- **Load balancer:** Distributes client requests across multiple servers to improve performance and availability.
- **Proxy server:** Acts as an intermediary between clients and another network or service. It can filter, cache, inspect, or hide client traffic.
- **SCADA:** Supervisory Control and Data Acquisition systems monitor and control industrial processes such as utilities, manufacturing, and infrastructure.
- **IoT device:** An internet-connected embedded device such as a thermostat, camera, sensor, smart appliance, or wearable.

### 2.4 Common network configuration concepts

#### DNS records

- **A record:** Maps a hostname to an IPv4 address.
- **AAAA record:** Maps a hostname to an IPv6 address.
- **CNAME:** Creates an alias that points one hostname to another hostname.
- **MX:** Identifies the mail server responsible for receiving mail for a domain.
- **TXT:** Stores text information in DNS. TXT records are widely used for verification and email-security policies.
- **SPF:** A DNS-based policy that identifies systems authorized to send mail for a domain.
- **DKIM:** Uses a cryptographic signature in email so receivers can verify that a message was authorized by the sending domain and was not altered in transit.
- **DMARC:** Tells receiving servers how to handle messages that fail SPF/DKIM checks and can provide reporting back to the domain owner.

#### DHCP concepts

- **Lease:** A temporary assignment of an IP address and related settings to a client.
- **Reservation:** A rule that assigns a specific IP address to a specific client, usually based on its MAC address.
- **Scope:** The address pool and configuration range a DHCP server is allowed to distribute.
- **Exclusion:** An address or range inside the scope that the DHCP server must not assign.

#### Segmentation and secure access

- **VLAN:** A Virtual LAN logically separates devices into different broadcast domains even when they share the same physical switching infrastructure.
- **VPN:** A Virtual Private Network creates an encrypted tunnel across an untrusted network so users or sites can access private resources securely.

### 2.5 Common networking hardware

- **Router:** Connects different IP networks and forwards packets between them. Home routers often also provide NAT, DHCP, Wi-Fi, and firewall functions.
- **Managed switch:** A switch that can be configured for features such as VLANs, port security, spanning tree, QoS, and monitoring.
- **Unmanaged switch:** A plug-and-play switch with little or no configuration.
- **Access point:** Connects wireless clients to a wired LAN.
- **Patch panel:** A passive termination and organization point for structured cabling. It does not switch or route traffic.
- **Firewall:** Allows or blocks traffic according to security rules.
- **PoE injector:** Adds electrical power to an Ethernet cable when the network switch does not provide PoE.
- **PoE switch:** Supplies both Ethernet data and electrical power to supported devices such as access points, phones, and cameras.
- **PoE (802.3af):** Original Power over Ethernet standard for lower-power devices.
- **PoE+ (802.3at):** Provides more power than 802.3af.
- **PoE++ (802.3bt):** Provides still higher power for devices such as advanced access points, cameras, displays, and other equipment.
- **Cable modem:** Converts signals between a coaxial cable ISP connection and the customer's Ethernet network.
- **DSL modem:** Connects to internet service delivered over copper telephone wiring.
- **ONT:** Optical Network Terminal. Converts the provider's fiber-optic signal into Ethernet or other customer-facing connections.
- **NIC:** Network Interface Card/Controller. The hardware interface that connects a device to a network.
- **MAC address:** A link-layer hardware address used to identify a network interface on the local network segment.

### 2.6 Basic wired/wireless SOHO networking

- **IPv4:** A 32-bit address format written as four decimal octets, such as 192.168.1.10.
- **Private IPv4:** Address ranges reserved for internal networks and not directly routed on the public internet: 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16.
- **Public IPv4:** Globally routable addresses used on the internet.
- **IPv6:** A 128-bit addressing system written in hexadecimal. It provides a vastly larger address space than IPv4.
- **APIPA:** Automatic Private IP Addressing. A Windows client may self-assign a 169.254.x.x address when it cannot obtain a DHCP lease. APIPA usually indicates local-link connectivity only, not normal internet access.
- **Static IP:** An address manually configured or otherwise fixed so it does not normally change.
- **Dynamic IP:** An address assigned automatically, usually by DHCP.
- **Subnet mask:** Identifies which part of an IPv4 address represents the network and which part represents the host.
- **Default gateway:** The router a host sends traffic to when the destination is outside the local subnet.

Related practice: [SOHO Router Configuration](../../../practice/pbqs/a-plus-core-1/soho-router-configuration/README.md) and [TCP/IP Packet Walk](../../../practice/pbqs/a-plus-core-1/tcp-ip-packet-walk/README.md).

### 2.7 Internet connection types and network types

#### Internet connections

- **Satellite:** Internet delivered through satellites. It is useful where wired service is unavailable, but latency and weather effects may be concerns depending on the service.
- **Fiber:** Uses light over fiber-optic cable. It offers high bandwidth, low latency, and strong resistance to electromagnetic interference.
- **Cable:** Broadband delivered over coaxial cable infrastructure. Bandwidth may be shared among customers in the same service area.
- **DSL:** Broadband over telephone copper pairs. Performance varies with line quality and distance from provider equipment.
- **Cellular:** Internet over 3G/4G/5G mobile networks. It is portable and useful as primary or backup connectivity.
- **WISP:** A Wireless Internet Service Provider delivers broadband using point-to-point or point-to-multipoint radio links, often in rural areas.

#### Network types

- **LAN:** Local Area Network. Covers a small area such as a home, room, office, or building.
- **WAN:** Wide Area Network. Connects networks across large geographic distances. The internet is the largest example.
- **PAN:** Personal Area Network. Very small network around one person, often using Bluetooth.
- **MAN:** Metropolitan Area Network. Covers a city or metropolitan region.
- **SAN:** Storage Area Network. A specialized high-speed network connecting servers to shared block storage.
- **WLAN:** Wireless Local Area Network. A LAN implemented using Wi-Fi.

### 2.8 Networking tools

- **Crimper:** Attaches modular connectors such as RJ45 plugs to copper cable.
- **Cable stripper:** Removes outer insulation without damaging the conductors underneath.
- **Wi-Fi analyzer:** Measures nearby wireless networks, signal strength, channels, and interference to help diagnose coverage or congestion problems.
- **Toner probe:** A tone generator sends a signal onto a cable and a probe detects it so the technician can trace or identify the cable.
- **Punchdown tool:** Seats individual conductors into insulation-displacement terminals on patch panels or keystone jacks.
- **Cable tester:** Checks continuity and wire-map problems such as opens, shorts, reversals, split pairs, or miswiring. More advanced testers can certify cable performance.
- **Loopback plug:** Sends transmitted data back into the same interface to test whether a port or adapter can transmit and receive.
- **Network tap:** Passively copies network traffic for monitoring or analysis without relying on the endpoint itself.

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md).

## 3.0 Hardware

### 3.1 Display components and attributes

- **LCD:** Liquid Crystal Display. Liquid crystals control light from a backlight to create the image.
- **IPS:** An LCD panel type known for strong color accuracy and wide viewing angles.
- **TN:** An LCD panel type known for fast response time and low cost, but generally weaker color and viewing angles than IPS.
- **VA:** An LCD panel type that typically provides high contrast and deep blacks, with performance characteristics between TN and IPS.
- **OLED:** Organic Light-Emitting Diode. Each pixel produces its own light, allowing very deep blacks and high contrast without a conventional backlight.
- **Mini-LED:** An LCD backlighting technology that uses many very small LEDs for more precise local dimming and improved contrast.
- **Touch screen:** A display surface that detects touch input.
- **Digitizer:** The layer or controller that converts touch or stylus movement into digital input coordinates.
- **Inverter:** In older CCFL-backlit LCD systems, converts DC power into the high-voltage AC needed by the backlight.
- **Pixel density:** Number of pixels in a given physical area, usually expressed as pixels per inch. Higher density generally produces sharper images.
- **Refresh rate:** Number of times the display updates per second, measured in hertz.
- **Resolution:** Number of addressable pixels, such as 1920×1080.
- **Color gamut:** The range of colors a display can reproduce.

### 3.2 Cable types, connectors, features, and purposes

#### Network cabling

- **Twisted-pair copper:** Ethernet cable made from pairs of copper conductors twisted together to reduce interference.
- **Category rating:** Identifies the performance class of copper Ethernet cable. Higher categories generally support higher frequencies and data rates.
- **T568A/T568B:** Two accepted wire-order standards for terminating twisted-pair Ethernet cable. A straight-through cable uses the same standard on both ends.
- **STP:** Shielded Twisted Pair. Adds shielding to reduce electromagnetic interference.
- **UTP:** Unshielded Twisted Pair. The most common Ethernet cable in typical office and home environments.
- **Direct-burial cable:** Cable designed with protection against moisture and soil exposure for underground installation.
- **Plenum-rated cable:** Uses low-smoke, flame-resistant jacket material for building air-handling spaces.
- **Coaxial:** A central conductor surrounded by insulation and shielding. Commonly used for cable internet, television, and RF applications.
- **Single-mode fiber:** Small-core optical fiber designed for long distances and high bandwidth using a single light path.
- **Multimode fiber:** Larger-core optical fiber used mainly for shorter-distance links inside buildings or campuses.

#### Peripheral and storage cables

- **USB 2.0:** USB generation with a signaling rate up to 480 Mbps.
- **USB 3.x:** Later USB generations with much higher data rates than USB 2.0.
- **Serial:** Legacy point-to-point communication commonly associated with DB9 connectors and console or industrial devices.
- **Thunderbolt:** High-speed interface capable of carrying PCIe, display data, and power over supported cables.
- **SATA:** Serial ATA. Internal storage interface used by HDDs, SATA SSDs, and optical drives.
- **eSATA:** External form of SATA used for external storage.

#### Video connections

- **HDMI:** Digital audio/video interface common on TVs, monitors, projectors, and computers.
- **DisplayPort:** Digital display interface common on computers and high-resolution/high-refresh monitors.
- **DVI:** Older digital display connector; some variants also support analog video.
- **VGA:** Legacy analog video connector.
- **USB-C video:** USB-C ports may support video through alternate modes such as DisplayPort, but only when the device and port support that feature.

#### Connector identification

- **RJ11:** Small modular connector commonly used for telephone lines and DSL.
- **RJ45:** Common name for the 8-position modular connector used with Ethernet twisted-pair cable.
- **F-type:** Threaded coaxial connector used for cable TV, cable internet, and satellite systems.
- **ST:** Round bayonet-style fiber connector.
- **SC:** Square push-pull fiber connector.
- **LC:** Small form-factor fiber connector common in high-density network equipment.
- **Punchdown block:** Termination point where individual copper conductors are seated into insulation-displacement contacts.
- **microUSB / miniUSB / USB-C:** USB connector shapes used by different generations of portable equipment.
- **Molex:** Legacy 4-pin peripheral power connector used inside PCs.
- **Lightning:** Apple mobile connector used on many older devices.
- **DB9:** 9-pin D-sub connector commonly used for serial communication.
- **Adapter:** Converts one connector or interface to another. Some adapters are passive; others contain active signal-conversion electronics.

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md)<!-- hub:hidden
 and [Cabling Quick Reference](../../../reference/cabling.md)
hub:hidden -->.

### 3.3 RAM characteristics

- **DIMM:** Full-size memory module used primarily in desktops and servers.
- **SODIMM:** Smaller memory module used primarily in laptops and compact systems.
- **DDR:** Double Data Rate memory transfers data on both edges of the clock signal. DDR generations such as DDR3, DDR4, and DDR5 are physically and electrically different and are not interchangeable.
- **ECC RAM:** Error-Correcting Code memory detects and corrects certain memory errors, making it common in servers and systems where reliability is critical.
- **Non-ECC RAM:** Standard memory without ECC protection, common in consumer PCs.
- **Single-channel:** Memory controller uses one channel, providing less aggregate bandwidth.
- **Dual-channel:** Uses two memory channels in parallel when compatible modules are installed in the correct slots.
- **Triple/quad-channel:** Uses three or four channels and is found on certain workstation, enthusiast, or server platforms.

### 3.4 Storage devices

#### HDD

- **HDD:** Mechanical storage using spinning magnetic platters and moving read/write heads.
- **Spindle speed:** Rotation speed measured in RPM. Higher RPM can improve access time and throughput but may increase noise, heat, and power use.
- **2.5-inch HDD:** Common in laptops and compact systems.
- **3.5-inch HDD:** Common in desktops, NAS devices, and servers.

#### SSD

- **SSD:** Solid-state storage using flash memory with no moving parts.
- **SATA SSD:** Uses the SATA storage protocol and is limited by SATA bandwidth.
- **NVMe SSD:** Uses the NVMe protocol over PCIe for much higher parallelism and lower latency than SATA.
- **PCIe:** High-speed expansion bus used by NVMe storage and other devices.
- **SAS:** Serial Attached SCSI. Enterprise storage interface designed for reliability, dual-porting, and server/storage environments.
- **M.2:** Compact card form factor used by SATA or NVMe SSDs depending on the device and keying.
- **mSATA:** Older compact SATA SSD form factor that predates widespread M.2 adoption.

#### RAID

RAID combines multiple physical drives into one logical storage arrangement for performance, redundancy, or both. RAID is not a substitute for backups.

| RAID | Minimum drives | How it works | Fault tolerance | Capacity idea |
| --- | ---: | --- | --- | --- |
| RAID 0 | 2 | Stripes data across drives | None | Sum of all drive capacity |
| RAID 1 | 2 | Mirrors the same data to multiple drives | Can survive a mirror member failure | About 50% usable in a two-drive mirror |
| RAID 5 | 3 | Striping plus distributed single parity | One drive failure | Roughly (N-1) drives usable |
| RAID 6 | 4 | Striping plus dual distributed parity | Two drive failures | Roughly (N-2) drives usable |
| RAID 10 | 4 | Mirrors drives, then stripes across mirror sets | Can tolerate failures as long as a full mirror pair is not lost | About 50% usable |

- **Flash drive:** Portable USB storage using flash memory.
- **Memory card:** Small removable flash storage such as SD or microSD.
- **Optical drive:** Reads or writes optical discs such as CDs, DVDs, or Blu-ray media.

Related practice: [RAID Drive Replacement](../../../practice/pbqs/a-plus-core-1/raid-drive-replacement/README.md)<!-- hub:hidden
 and [RAID Quick Reference](../../../reference/raid.md)
hub:hidden -->.

### 3.5 Motherboards, CPUs, add-on cards, and cooling

#### Motherboard form factors

- **ATX:** Standard full-size desktop motherboard form factor with multiple expansion slots and connectors.
- **microATX:** Smaller than ATX, usually with fewer expansion slots while retaining broad desktop compatibility.
- **ITX:** Compact motherboard family used in small-form-factor systems.

#### Motherboard connectors

- **PCI:** Older parallel expansion bus used by legacy add-in cards.
- **PCIe:** Modern high-speed serial expansion bus used by GPUs, NICs, storage controllers, and NVMe devices.
- **Power connectors:** Supply the motherboard and CPU with DC power from the PSU.
- **SATA:** Connects SATA drives to the motherboard.
- **eSATA:** External SATA interface.
- **Headers:** Pin groups used for case buttons, LEDs, USB ports, audio, fans, and other internal connections.
- **M.2 slot:** Compact internal slot for supported SSDs, Wi-Fi cards, and other devices.

#### Compatibility

- **CPU socket:** Physical and electrical interface between a processor and motherboard. CPU family, socket, chipset, and firmware support must all be compatible.
- **Multisocket motherboard:** Supports more than one physical CPU, mainly in server or high-end workstation platforms.

#### BIOS/UEFI settings

- **Boot order:** Controls which devices the system checks for a bootable OS.
- **USB permissions:** Can enable, disable, or restrict USB devices or USB boot.
- **TPM settings:** Control the Trusted Platform Module used for secure key storage and platform security.
- **Fan settings:** Control fan curves, speed, monitoring, and cooling behavior.
- **Secure Boot:** Allows the system to boot only trusted signed bootloaders.
- **Boot password:** Requires authentication before normal startup.
- **BIOS/UEFI password:** Restricts access to firmware settings.
- **Temperature monitoring:** Displays sensor data used to detect overheating.
- **Virtualization support:** Firmware setting that enables CPU virtualization extensions needed by many hypervisors.

#### Security hardware

- **TPM:** Trusted Platform Module. Secure hardware used to protect cryptographic keys and support features such as BitLocker and measured boot.
- **HSM:** Hardware Security Module. Dedicated hardware designed to generate, store, and use cryptographic keys securely, usually in enterprise systems.

#### CPU architecture

- **x86:** 32-bit Intel-compatible CPU architecture.
- **x64:** 64-bit extension of x86 used by most modern desktop and server PCs.
- **ARM:** RISC-based architecture known for power efficiency and widely used in mobile, embedded, and increasingly desktop/server devices.
- **CPU core:** An independent processing unit inside a processor. More cores can allow more tasks to execute in parallel.

#### Expansion cards

- **Sound card:** Adds or improves audio input/output functions.
- **Video card/GPU:** Processes graphics and display output.
- **Capture card:** Receives external video/audio input for recording or streaming.
- **NIC:** Adds wired or wireless network connectivity.

#### Cooling

- **Fan:** Moves air through a case or heat sink.
- **Heat sink:** Metal assembly that absorbs and dissipates heat from a chip.
- **Thermal paste/pad:** Conductive material between a chip and heat sink that fills microscopic air gaps.
- **Liquid cooling:** Uses a pump, coolant, water block, radiator, and fans to move heat away from components.

### 3.6 Power supplies

- **110-120 VAC vs. 220-240 VAC:** Common AC input ranges used in different countries. Many modern PC PSUs automatically support a wide input range.
- **3.3 V rail:** Used by motherboard logic and some components.
- **5 V rail:** Used by USB and various electronics.
- **12 V rail:** Supplies many high-power components such as CPU/GPU voltage regulators, fans, motors, and drives.
- **20+4-pin motherboard connector:** Main ATX motherboard power connector that can support older 20-pin and newer 24-pin layouts.
- **Redundant power supply:** Multiple PSUs installed so another unit can continue supplying power if one fails.
- **Modular power supply:** Allows unused power cables to be disconnected from the PSU.
- **Wattage rating:** Maximum output capacity of the PSU. The unit must provide enough power for the system with reasonable headroom.
- **Energy efficiency:** Describes how much input power becomes usable DC output rather than waste heat. Higher-efficiency PSUs waste less energy.

### 3.7 Multifunction devices/printers and settings

- **Placement:** Printers need stable surfaces, ventilation, power, network access, and enough room for trays, doors, and maintenance.
- **Driver:** Software that translates operating-system print jobs into commands the printer understands.
- **PCL:** Printer Control Language. Common printer-description language developed by HP and widely used in business environments.
- **PostScript:** Page-description language designed for accurate rendering of text and graphics, common in publishing and graphics workflows.
- **Firmware:** Embedded software inside the printer that controls hardware functions and may receive bug, compatibility, or security updates.
- **USB connectivity:** Direct connection between a printer and one host.
- **Ethernet connectivity:** Wired network connection that lets the printer operate as a network device.
- **Wireless connectivity:** Wi-Fi or related wireless connection for network printing.
- **Printer share:** A computer makes a locally attached printer available to other users.
- **Print server:** Dedicated server or service that manages shared printers and queues.
- **Duplex:** Prints on both sides of a page.
- **Orientation:** Portrait vs. landscape page direction.
- **Tray settings:** Define paper source, size, and type.
- **Quality settings:** Adjust resolution, speed, color, toner/ink use, or other output characteristics.
- **User authentication:** Requires users to identify themselves before accessing printer functions.
- **Badging:** Uses an ID badge or card to authenticate a user at the printer.
- **Audit log:** Records printer use and activity.
- **Secured print:** Holds a print job until the user authenticates at the device.
- **Scan to email:** Sends scanned documents through an email service.
- **Scan to SMB:** Saves scans directly to a network file share.
- **Scan to cloud:** Uploads scans to a supported cloud-storage service.
- **ADF:** Automatic Document Feeder. Pulls multiple pages through a scanner automatically.
- **Flatbed scanner:** Scans one item placed on a glass surface and is useful for books, photos, or fragile originals.

### 3.8 Printer maintenance

#### Laser

- **Toner:** Powdered printing material used by laser printers.
- **Maintenance kit:** Service parts such as rollers, transfer components, or a fuser that wear out over time.
- **Calibration:** Adjusts alignment, density, and color output.
- **Cleaning:** Removes toner and debris that can cause print defects or paper-feed issues.

#### Inkjet

- **Ink cartridge:** Stores liquid ink.
- **Printhead:** Contains the nozzles that spray ink onto paper.
- **Roller/feeder:** Pulls and guides paper through the printer.
- **Printhead cleaning:** Clears dried or clogged ink from nozzles.
- **Calibration/alignment:** Corrects printhead positioning and output alignment.

#### Thermal

- **Feed assembly:** Moves thermal paper through the printer.
- **Thermal paper:** Heat-sensitive paper that darkens when heated.
- **Heating element:** Produces the heat used to create the image.
- **Maintenance:** Replace paper, clean the heating element, and remove debris.

#### Impact

- **Impact printer:** Mechanically strikes an inked ribbon against paper.
- **Multipart paper:** Carbonless or layered forms that can produce multiple copies from impact.
- **Ribbon:** Inked fabric consumed during printing.
- **Printhead:** Mechanical head containing pins or elements that strike the ribbon.

Related practice: [Printer Troubleshooting](../../../practice/pbqs/a-plus-core-1/printer-troubleshooting/README.md).

## 4.0 Virtualization and Cloud Computing

### 4.1 Virtualization concepts

- **Virtual machine:** Software-defined computer that runs its own operating system using virtualized CPU, memory, storage, and networking.
- **Sandbox:** Isolated environment used to run software with reduced risk to the host system.
- **Test/development VM:** Disposable or controlled environment for testing software, updates, configurations, or multiple operating systems.
- **Application virtualization:** Runs an application in an isolated or abstracted environment rather than installing it directly in the normal OS environment.
- **Legacy software/OS virtualization:** Uses a VM to preserve compatibility with software that requires an older operating system.
- **Cross-platform virtualization:** Runs a guest operating system or application environment different from the host platform when supported.
- **Security requirement:** VMs still require patching, access control, network security, and isolation.
- **Network requirement:** VMs need virtual network adapters and appropriate virtual-switch or network configuration.
- **Storage requirement:** VMs use virtual disk files and may require substantial capacity and I/O performance.
- **VDI:** Virtual Desktop Infrastructure hosts user desktops centrally and delivers them remotely to endpoint devices.
- **Container:** Isolated application environment that shares the host OS kernel rather than running a complete guest OS.
- **Type 1 hypervisor:** Runs directly on physical hardware, commonly used in servers and data centers.
- **Type 2 hypervisor:** Runs as an application on top of a conventional host operating system.

### 4.2 Cloud computing concepts

#### Deployment/service models

- **Private cloud:** Cloud infrastructure dedicated to one organization.
- **Public cloud:** Provider-owned infrastructure shared among many customers.
- **Hybrid cloud:** Combines private and public cloud resources.
- **Community cloud:** Shared by organizations with similar operational, regulatory, or security needs.
- **IaaS:** Infrastructure as a Service provides virtual machines, storage, and networking while the customer manages the operating system and applications.
- **PaaS:** Platform as a Service provides a managed application platform so developers can deploy code without managing as much underlying infrastructure.
- **SaaS:** Software as a Service provides a complete hosted application accessed by users, usually through a browser or client app.

#### Cloud characteristics

- **Shared resources:** Multiple customers use pooled infrastructure.
- **Dedicated resources:** Hardware or capacity is reserved for one customer or workload.
- **Metered utilization:** Usage is measured for billing or resource tracking.
- **Ingress:** Data entering a cloud environment.
- **Egress:** Data leaving a cloud environment; providers may charge for it.
- **Elasticity:** Resources can grow or shrink in response to demand.
- **Availability:** Degree to which the service remains accessible and operational.
- **File synchronization:** Keeps cloud-hosted files consistent across users and devices.
- **Multitenancy:** One platform serves multiple customers while logically isolating their data and settings.

## 5.0 Hardware and Network Troubleshooting

### 5.1 Motherboards, RAM, CPUs, and power

- **POST beep codes:** Firmware-generated beep patterns that can indicate startup hardware failures. Meanings vary by motherboard/firmware vendor.
- **Crash screen:** Operating-system error screen caused by a critical failure. Hardware, drivers, memory, and software can all be possible causes.
- **Blank screen:** The system appears powered but no image is displayed. Check input selection, display cable, monitor, GPU, RAM seating, boot status, and power.
- **No power:** No fans, lights, or startup activity. Check the outlet, power strip, PSU switch, power cable, front-panel connector, PSU, and motherboard.
- **Sluggish performance:** May result from insufficient RAM, high CPU load, thermal throttling, storage problems, malware, or excessive background processes.
- **Overheating:** Often caused by dust, blocked airflow, failed fans, dried thermal compound, poor heat-sink contact, or excessive workload.
- **Burning smell:** Treat as an urgent electrical failure. Power down and inspect for overheating connectors, PSU failure, short circuits, or damaged components.
- **Random shutdown:** Common causes include overheating, unstable power, a failing PSU, motherboard faults, or other hardware instability.
- **Application crashes:** Can result from bad RAM, storage errors, overheating, corrupted software, incompatible drivers, or OS problems.
- **Unusual noise:** Grinding or clicking may indicate storage failure; rattling or whining may indicate fans or power-related hardware.
- **Capacitor swelling:** Bulging or leaking capacitors indicate component failure and can cause instability or complete system failure.
- **Incorrect system date/time:** A clock that resets after power-off commonly indicates a weak CMOS/RTC battery.

### 5.2 Drive and RAID issues

- **LED status indicators:** Drive bays and storage arrays often use color or blink patterns to show activity, warning, rebuild, or failed states. Always interpret indicators according to the system vendor.
- **Grinding noise:** Mechanical HDD noise that can indicate serious bearing, motor, or head damage.
- **Clicking noise:** Repetitive HDD clicking often indicates failed read/write attempts or mechanical failure.
- **Bootable device not found:** The firmware cannot find a usable OS boot device. Possible causes include drive failure, loose cable, bad boot order, controller issues, or corrupted boot data.
- **Data loss/corruption:** Files may disappear or become unreadable because of failing media, power loss, file-system problems, malware, or controller errors.
- **RAID failure:** One or more member drives or the controller has failed and the array is degraded or offline.
- **S.M.A.R.T. failure:** Drive self-monitoring has detected health values associated with impending failure. Back up important data and replace the drive as appropriate.
- **Extended read/write times:** Storage is taking longer than expected. Possible causes include a failing drive, bad sectors, controller issues, heavy load, or an array rebuild.
- **Low IOPS:** The storage system completes fewer input/output operations per second than expected. This can hurt workloads with many small reads/writes, such as databases and VMs.
- **Missing drive in OS:** Check physical connection, controller detection, BIOS/UEFI, initialization, partitioning, drivers, and drive health.
- **Array missing:** The RAID set is not recognized. Causes can include controller failure, metadata corruption, multiple failed drives, or moved/misordered drives.
- **Audible alarm:** RAID enclosures and NAS devices may beep for failed drives, degraded arrays, overheating, fan failure, or other hardware alerts.

Related practice: [RAID Drive Replacement](../../../practice/pbqs/a-plus-core-1/raid-drive-replacement/README.md).

### 5.3 Video, projector, and display issues

- **Incorrect input source:** The display is listening to the wrong HDMI/DisplayPort/VGA input, so the correct source never appears.
- **Physical cabling issue:** Loose, damaged, or incompatible cables can cause no signal, flicker, incorrect resolution, missing audio, or color problems.
- **Burnt-out projector bulb:** Traditional projector lamps eventually fail and produce little or no image.
- **Fuzzy image:** Check native resolution, focus, scaling, cable quality, analog connections, and display settings.
- **Burn-in:** Persistent image retention caused by static content on susceptible display technologies such as OLED or older plasma.
- **Dead pixel:** Pixel that remains permanently off or stuck because of panel failure.
- **Flashing/flickering:** Can result from a loose cable, failing panel/backlight, unsupported refresh rate, driver problems, or power instability.
- **Incorrect color:** Check cable pins, color settings, GPU output, profiles, and display hardware.
- **Audio issue:** HDMI/DisplayPort may carry audio; verify the correct playback device, cable, volume, and driver settings.
- **Dim image:** Check brightness settings, power-saving modes, projector lamp age, and backlight health.
- **Intermittent projector shutdown:** Frequently caused by overheating, blocked vents, failed fans, power problems, or lamp-related faults.
- **Sizing issue:** Incorrect resolution, scaling, aspect ratio, or overscan may cause borders or cropped content.
- **Distorted image:** Wrong aspect ratio, resolution mismatch, keystone settings, failing cables, or graphics problems can stretch or skew the picture.

### 5.4 Mobile device issues

- **Poor battery health:** Battery capacity has degraded and runtime is much shorter than expected.
- **Swollen battery:** Internal battery expansion is a safety hazard. Stop using/charging the device and follow safe replacement procedures.
- **Broken screen:** Physical display damage may affect image output, touch response, or both.
- **Improper charging:** Check the cable, charger wattage, connector, debris, port damage, battery condition, and charging circuitry.
- **Poor/no connectivity:** Check airplane mode, Wi-Fi/cellular settings, SIM/eSIM, signal strength, antenna, credentials, and network configuration.
- **Liquid damage:** Moisture can cause corrosion, shorts, and delayed failures.
- **Overheating:** Can result from heavy CPU/GPU load, charging, poor ventilation, battery faults, environmental heat, or failed cooling.
- **Digitizer issue:** Touch input is inaccurate, intermittent, or absent even if the display image still works.
- **Physically damaged port:** Bent, broken, loose, or contaminated connectors can prevent charging, data transfer, or audio.
- **Malware:** Can cause pop-ups, data theft, unusual network activity, battery drain, slowness, or unauthorized changes.
- **Cursor drift/touch calibration:** The device registers touches in the wrong location or without user input.
- **Unable to install applications:** Check storage space, OS compatibility, account permissions, store restrictions, network access, and MDM policy.
- **Stylus not working:** Check compatibility, battery/charging, Bluetooth if applicable, tip condition, digitizer support, and software.
- **Degraded performance:** Common causes include low storage, too many background apps, overheating, low memory, aging battery behavior, malware, or an outdated OS.

### 5.5 Network issues

- **Intermittent wireless connectivity:** Often caused by weak signal, interference, roaming, overloaded access points, bad drivers, or failing wireless hardware.
- **Slow network speeds:** Check bandwidth use, Wi-Fi signal, duplex/speed negotiation, cabling, ISP performance, hardware limitations, and malware.
- **Limited connectivity:** The device may reach the local network but not the internet. Check DHCP, IP address, subnet mask, gateway, DNS, and upstream connectivity.
- **Jitter:** Variation in packet arrival timing. It is especially damaging to VoIP, video conferencing, and other real-time traffic.
- **Poor VoIP quality:** Common causes include jitter, packet loss, latency, low bandwidth, congestion, and Wi-Fi instability.
- **Port flapping:** A switch port repeatedly transitions between up and down. Common causes include bad cabling, loose connectors, failing NICs, or physical-layer faults.
- **High latency:** Delay between request and response. Causes include congestion, long routing paths, overloaded equipment, WAN distance, or poor wireless conditions.
- **External interference:** Non-Wi-Fi devices or nearby wireless networks can reduce signal quality, especially in 2.4 GHz.
- **Authentication failure:** Incorrect credentials, incompatible security settings, expired certificates, account problems, or authentication-server failures can block access.
- **Intermittent internet connectivity:** The LAN may stay up while the ISP link, modem, router, DNS service, or upstream provider connection drops periodically.

### 5.6 Printer issues

- **Lines on printed pages:** Often caused by a dirty/damaged drum, printhead, roller, scanner glass, or other imaging component depending on printer type.
- **Garbled print:** Can indicate a bad driver, wrong printer language, corrupted print job, or communication problem.
- **Paper jam:** Paper is stuck in the feed path. Check paper type, loading, rollers, sensors, and debris.
- **Faded print:** Low toner/ink, clogged nozzles, worn imaging components, or incorrect density/quality settings can cause faint output.
- **Paper not feeding:** Check tray loading, feed rollers, separation pads, paper type, sensors, and obstructions.
- **Multipage misfeed:** Multiple sheets feed together, often because of worn separation pads/rollers, damp paper, static, or poor loading.
- **Multiple prints pending in queue:** Jobs are waiting because the printer is paused, offline, jammed, disconnected, or the spooler is stuck.
- **Speckling:** Random toner/ink dots can result from a dirty drum, leaking toner, debris, or contamination.
- **Double/echo image:** A repeated faint image may indicate a fuser or imaging-drum problem in a laser printer.
- **Grinding noise:** Mechanical gears, rollers, motors, foreign objects, or cartridge installation may be at fault.
- **Staple jam:** Finisher stapling mechanism is blocked or out of alignment.
- **Hole-punch issue:** Punch mechanism may be jammed, full of waste, misaligned, or improperly configured.
- **Incorrect orientation:** Driver or application is set to portrait when landscape is required, or vice versa.
- **Tray not recognized:** The tray may be improperly seated, incompatible, damaged, or not detected by its sensor.
- **Connectivity issue:** Check USB/Ethernet/Wi-Fi connection, printer IP address, print server, firewall, driver, and network reachability.
- **Frozen print queue:** Jobs remain stuck and may require clearing the queue or restarting the print spooler/service.

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
