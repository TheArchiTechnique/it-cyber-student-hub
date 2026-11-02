---
hub:
  kind: resource
---
# Network+ Objective Breakdown

A student-friendly study reference for CompTIA Network+ (N10-009, V9). This page follows the objective numbering and explains how network technologies work, when to use them, and what their behavior tells you during troubleshooting.

Use this with the [official CompTIA N10-009 objectives](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652), document version 6.0, which remain the authoritative exam scope. The explanations and examples here use original educational language and cover **all 25 numbered objectives across the five domains**, including networking concepts, implementation, operations, security, and troubleshooting.

## Exam domains

| Domain | Weight |
| --- | ---: |
| 1.0 Networking Concepts | 23% |
| 2.0 Network Implementation | 20% |
| 3.0 Network Operations | 19% |
| 4.0 Network Security | 14% |
| 5.0 Network Troubleshooting | 24% |

## 1.0 Networking Concepts

### 1.1 OSI reference model

The **Open Systems Interconnection (OSI) model** separates network communication into seven responsibilities. It helps you locate a fault and explain what a device or protocol contributes. The real TCP/IP stack combines some of these responsibilities; a protocol or appliance can also perform work associated with several layers.

| Layer | Responsibility | Examples and troubleshooting clues |
| --- | --- | --- |
| 7: Application | Supplies network services used by applications | HTTP requests, DNS lookups, and SMTP mail exchange. A DNS failure can prevent a browser from finding a server even when IP connectivity works. |
| 6: Presentation | Handles representation of data, including encoding, compression, and encryption as conceptual functions | Incompatible formats or encryption requirements can prevent useful communication. TLS is often associated with this layer for study purposes, but its implementation does not map perfectly to one OSI layer. |
| 5: Session | Establishes, maintains, and ends application conversations | Session setup, continuity, and recovery. An application session is different from a physical link and from TCP's transport connection. |
| 4: Transport | Provides application-to-application delivery using transport endpoints | TCP segments and UDP datagrams use ports. A firewall can allow IP reachability while blocking a particular transport service. |
| 3: Network | Addresses and forwards packets between networks | IPv4/IPv6 addresses, routing, and ICMP. An incorrect gateway or missing route can stop off-subnet communication. |
| 2: Data link | Delivers frames across a local link and detects certain transmission errors | Ethernet MAC addresses, switching, VLANs, and frame check sequences. The wrong VLAN can isolate a host despite an active link. |
| 1: Physical | Carries bits as electrical, optical, or radio signals | Cables, connectors, transceivers, radio frequencies, and link signaling. No link light or a damaged fiber starts the investigation here. |

**Encapsulation** adds the information each layer needs: application data is carried in a TCP segment or UDP datagram, inside an IP packet, inside a local-link frame, and then transmitted as signals. The receiving stack removes that information through **decapsulation**. Layers 5 through 7 are commonly grouped as data in this simplified description.

#### Follow an off-subnet packet

Suppose `192.168.10.25/24` sends to `192.168.20.40`. The sender's mask identifies the destination as remote. It uses ARP to learn the IPv4 default gateway's MAC address and addresses the first Ethernet frame to that gateway. The packet still names `192.168.20.40` as its IP destination.

A router removes the incoming frame, checks its routing information, reduces the IPv4 TTL, and builds a new frame for the next link. The link-layer addresses change at a routed hop; the end-to-end IP addresses normally remain the same unless a function such as NAT changes them. A Layer 2 switch ordinarily forwards the frame within its VLAN without replacing those end-host MAC addresses.

Use the layers to narrow a problem: verify the link, VLAN, IP configuration, route, transport connection, and application response. Successful ping tests IP/ICMP reachability; it does not prove that HTTPS, authentication, or every application function works. A failed ping can also reflect ICMP filtering rather than a failed host.

Related practice: [TCP/IP Packet Walk](../../../practice/pbqs/a-plus-core-1/tcp-ip-packet-walk/README.md) and [Lab 1: Basic Network Configuration](../../../labs/networking/basic-network-configuration/README.md).

### 1.2 Networking appliances, applications, and functions

A **physical appliance** runs a function on dedicated hardware. A **virtual appliance** runs software that provides a similar function on virtual infrastructure. A virtual firewall still needs suitable interfaces, routing, rules, and processing capacity; moving the function into software does not remove its networking requirements.

| Appliance | What it does | Practical distinction |
| --- | --- | --- |
| Router | Forwards packets between IP networks using a routing table | A router connects subnets. A default gateway is the router address a host uses for destinations it cannot reach through a more specific route. |
| Switch | Forwards Ethernet frames using learned MAC addresses and VLAN membership | A Layer 2 switch connects devices within VLANs; a multilayer switch can also route between networks. |
| Firewall | Permits or denies traffic according to security policy | A stateful firewall tracks connections; application-aware inspection can examine more than addresses and ports. NAT and firewall filtering are separate functions. |
| Intrusion detection system (IDS) | Examines traffic or events and reports suspicious activity | Often observes copied traffic rather than sitting in the forwarding path. Detection alone does not block the observed packets. |
| Intrusion prevention system (IPS) | Inspects traffic and can stop matching threats | Usually placed inline for network prevention. A false positive can interrupt legitimate traffic. |
| Load balancer | Distributes connections or requests among backend servers | Health checks can remove a failed backend. Layer 4 balancing uses transport information; Layer 7 balancing can use application information such as a URL. |
| Proxy | Handles a request on another endpoint's behalf | A forward proxy represents clients accessing services; a reverse proxy represents servers receiving client requests. Filtering, caching, and TLS termination depend on configuration. |
| Network-attached storage (NAS) | Shares files through a network service | Clients access files and directories, commonly through SMB or NFS. The NAS manages the underlying file system. |
| Storage area network (SAN) | Provides networked access to storage blocks | Hosts see storage volumes and manage their file systems. Fibre Channel and iSCSI are common approaches; a SAN does not have to use optical fiber. |
| Wireless access point (AP) | Bridges wireless client traffic into a network | An AP provides radio access. Routing, DHCP, and firewall functions belong to separate functions even when combined in a home router. |
| Wireless controller | Coordinates supported APs and wireless policy | Centralizes functions such as WLAN configuration, monitoring, and radio management. Client data may be centrally tunneled or locally switched, depending on the design. |

**NAS vs. SAN:** Opening a shared folder is file access. Attaching a remote storage volume that the server formats is block access. A single storage product can support both, so identify the service being used rather than judging by the device's appearance.

A **content delivery network (CDN)** places distributed service endpoints and cached content near users in network terms. A browser may fetch images from an edge cache instead of the origin server, reducing latency and origin load. Routing, DNS, and application policy help choose an endpoint; the geographically closest server is not always the one selected. Uncached or personalized content may still require the origin.

#### Functions that affect traffic

- **Virtual private network (VPN):** Creates a logical private connection across another network. Common secure implementations use IPsec or TLS to protect traffic between a remote client and a site, or between sites. Encryption, authentication, routing, and the choice of which traffic enters the tunnel all matter. Encapsulation by itself does not guarantee encryption.
- **Quality of service (QoS):** Classifies traffic and applies handling such as priority queues, shaping, or policing. Voice benefits from predictable delay, low jitter, and low loss. QoS decides how available capacity is shared; it does not create additional bandwidth or guarantee treatment across an unmanaged internet path.
- **Time to live (TTL):** The IPv4 header field that limits a packet's forwarding lifetime. Routers decrement it, and an expiring packet is discarded, normally triggering an ICMP Time Exceeded message. This prevents routing loops from circulating packets indefinitely and supports traceroute. IPv6 uses **Hop Limit**. DNS record TTL is a separate cache-lifetime value.

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md) and [Two-Site VoIP Troubleshooting](../../../practice/pbqs/a-plus-core-1/two-site-voip-cli/README.md).

### 1.3 Cloud concepts and connectivity

Cloud networking still uses addressing, routes, interfaces, and security rules. The provider supplies programmable resources, while the customer's responsibilities depend on the service selected.

#### Deployment and service models

| Deployment model | Meaning | Example |
| --- | --- | --- |
| Public cloud | Provider-operated services offered to multiple customers, with logical separation | A company deploys its application in a commercial cloud. Public cloud does not mean every workload has a public IP address. |
| Private cloud | Cloud infrastructure dedicated to one organization | An organization operates a self-service virtualization platform on its own premises or dedicated hosted infrastructure. A single ordinary server is not automatically a private cloud. |
| Hybrid cloud | Integrated use of private infrastructure and public cloud resources | An on-premises application securely exchanges data with cloud services. Connectivity and consistent access controls must span both environments. |

| Service model | What the customer uses | Typical customer responsibility |
| --- | --- | --- |
| Infrastructure as a service (IaaS) | Virtual machines, networks, and storage | Guest OS patching, applications, data, accounts, and customer-controlled network settings. The provider runs the underlying physical infrastructure. |
| Platform as a service (PaaS) | A managed runtime or application platform | Application code, data, and access configuration. The provider manages more of the OS/runtime platform. |
| Software as a service (SaaS) | A finished application reached through a client or browser | User access, tenant settings, and appropriate handling of the organization's data. The provider operates the application stack. |

**Scalability** is the ability to handle increased demand by adding capacity. Scaling up gives a system more resources; scaling out adds systems. **Elasticity** adjusts capacity as demand changes, including releasing unneeded resources. **Multitenancy** lets customers share underlying infrastructure while access controls and isolation separate their resources and data.

#### Virtual networks and security controls

- **Network functions virtualization (NFV):** Runs functions such as firewalls, routers, and load balancers as software rather than requiring a dedicated appliance for each function. NFV concerns how a function is delivered; SDN concerns programmable control of network behavior.
- **Virtual private cloud (VPC):** A logically isolated cloud network with selected address ranges, subnets, route tables, and security controls. It is not automatically connected to every other VPC or to the internet. Avoid overlapping address ranges when planning private connectivity.
- **Network security group:** Groups traffic rules around selected resources or interfaces. For example, the web application group can accept HTTPS while a database group accepts database traffic only from the application tier.
- **Network security list:** A provider-specific collection of ingress and egress rules. In Oracle Cloud, security lists apply to interfaces in an associated subnet, while network security groups select sets of resources. Rules can be stateful or stateless. Names, scope, defaults, and evaluation behavior differ between providers.

With **stateful** filtering, connection tracking handles permitted return traffic. With **stateless** filtering, rules must permit each direction, including required return ports. For comparison, AWS security groups are stateful and AWS network ACLs are stateless. Do not assume every provider's security list behaves exactly like an AWS network ACL.

#### Gateways and connections

| Component or option | Purpose | Important limitation |
| --- | --- | --- |
| Internet gateway | Provides a route between a cloud network and the public internet | Routing, suitable addressing, and security rules must all permit the connection. Creating the gateway alone does not publish every resource. |
| NAT gateway | Translates private IPv4 source addresses for outbound connectivity in a common public NAT design | Supports replies to connections initiated inside; it does not provide unsolicited inbound access to a private server. Public/private NAT offerings vary by provider. |
| VPN | Connects a site or client to cloud networks through an encrypted tunnel | Often uses the internet as its underlay, so latency and throughput depend on that path and tunnel capacity. |
| Dedicated private connection | Connects an organization to a provider through a provisioned private path; AWS calls its service Direct Connect | Offers more predictable connectivity but requires provisioning and routing. A private circuit is not automatically encrypted. |

For example, a private application server may download updates through a NAT gateway while employees reach it through a site-to-site VPN. If the VPN is established but the application is unreachable, inspect address overlap, forward and return routes, security rules, and the service listener. Tunnel status alone does not prove application access.

### 1.4 Ports, protocols, services, and traffic types

An IP address identifies a network interface or endpoint; a TCP or UDP port identifies a transport endpoint used by a service. A client usually chooses a temporary source port and connects to the server's listening port. A browser might use `192.168.10.25:52014` to reach a server on TCP 443; replies return to port 52014. Firewall rules need the transport as well as the number.

#### TCP and UDP

| Characteristic | TCP | UDP |
| --- | --- | --- |
| Connection handling | Establishes a connection, commonly through SYN, SYN-ACK, ACK | Sends individual datagrams without a transport connection handshake |
| Delivery and ordering | Uses sequence numbers, acknowledgments, retransmission, and an ordered byte stream | Supplies no built-in delivery guarantee, ordering, or retransmission |
| Flow and congestion handling | Includes receiver flow control and congestion control | Applications must provide any required control themselves |
| Overhead | A minimum 20-byte header, plus connection state and recovery traffic | An 8-byte header and no transport connection setup |
| Typical applications | Complete file transfers, remote shells, and many web connections | DNS queries, time synchronization, and real-time traffic; applications can add reliability |

TCP can recover from packet loss while a connection remains usable; it cannot make an unreachable service succeed. UDP can reduce transport overhead, but it does not make every application faster. QUIC, for example, adds reliable streams and security above UDP. Neither TCP nor UDP inherently encrypts application data.

#### Required service and port associations

These are the N10-009 service associations, with common transport behavior and operational distinctions. Defaults help identify likely traffic; a port number is not proof of which software is running. The linked A+ lesson and practice activity cover a narrower foundational port set.

| Service | Default port / transport | Purpose and useful distinction |
| --- | --- | --- |
| FTP | TCP 21 control; TCP 20 is the traditional active-mode server data source | Transfers files without encryption. Passive mode negotiates a separate server data port, so allowing 21 alone may permit login but prevent transfers. |
| SFTP | TCP 22 | Transfers files through SSH. It is different from FTPS, which protects FTP using TLS. |
| SSH | TCP 22 | Provides an encrypted remote shell and supports tunneling and file-transfer functions. |
| Telnet | TCP 23 | Provides an unencrypted terminal session; credentials and commands can be exposed. |
| SMTP | TCP 25 | Relays mail, commonly between mail servers. Mail submission by an authenticated client commonly uses 587 instead. |
| DNS | UDP and TCP 53 | Resolves names and retrieves other DNS records. TCP supports queries as well as zone transfers; a truncated UDP answer can cause a TCP retry. |
| DHCPv4 | UDP 67 server; UDP 68 client | Leases IPv4 settings, including a mask and often gateway/DNS options. Initial requests can use broadcasts; routers normally require a relay to reach a server in another subnet. |
| TFTP | UDP 69 for the initial request | Provides simple file transfer, often for device boot/configuration files. The transfer continues using negotiated UDP transfer identifiers/ports; TFTP has no built-in login or encryption. |
| HTTP | TCP 80 | Carries web requests and responses without TLS protection. |
| NTP | UDP 123 | Synchronizes clocks. Incorrect time can affect logs, certificates, and authentication. |
| SNMP | UDP 161 queries; UDP 162 notifications | Retrieves/manages device information and sends traps or informs. SNMPv3 can provide authentication and privacy when configured; older community strings do not encrypt traffic. |
| LDAP | TCP 389 typically; UDP 389 for connectionless uses | Queries directory data. STARTTLS can protect a TCP 389 session; the base port alone does not guarantee encryption. |
| HTTPS | TCP 443; HTTP/3 uses QUIC over UDP 443 | Protects HTTP with TLS. Reachability does not establish that a certificate is valid or a site is trustworthy. |
| SMB | TCP 445 | Provides shared-file and printer access. Encryption depends on SMB version and configuration. |
| Syslog | UDP 514 baseline | Sends event messages to a collector. UDP does not confirm delivery; secure syslog commonly uses TLS over TCP 6514. TCP 514 is not a universal syslog mapping. |
| Secure SMTP submission | TCP 587 | Submits client mail, normally with STARTTLS to negotiate TLS. The objectives label this SMTPS; implicit TLS submission commonly uses TCP 465. |
| LDAPS | TCP 636 | Provides LDAP protected with TLS from the start of the connection. It differs from upgrading LDAP on 389 with STARTTLS. |
| Microsoft SQL Server | TCP 1433 default database listener | Carries database client connections. It is a product-specific association, not a universal port for every SQL database. |
| RDP | TCP and UDP 3389 | Provides remote graphical desktop access. Transport use depends on the client, server, and network. |
| SIP | UDP or TCP 5060; TCP 5061 for TLS | Sets up, modifies, and ends communication sessions. Voice/video media commonly uses separate RTP/SRTP traffic, so working signaling does not prove working audio. |

For DHCP, the initial client request is normally UDP 68 to 67, and the server's client-facing reply is UDP 67 to 68. Relays have their own server-facing exchange. For DNS, blocking TCP 53 can cause selective failures even when small UDP queries work. For SIP, investigate the media path when a call connects but has one-way or missing audio.

Foundational resources: [Ports & Protocols lesson](../../../learn/networking/ports-and-protocols.md), [reference](../../../reference/ports-and-protocols.md), and [practice activity](../../../practice/pbqs/a-plus-core-1/ports-and-protocols/README.md). Apply address assignment and name resolution in [Lab 4: DHCP Configuration](../../../labs/networking/dhcp-configuration/README.md) and [Lab 5: Centralized DHCP and DNS Services](../../../labs/networking/centralized-dhcp-dns/README.md).

#### IP-carried protocols and security

An **IP protocol number** identifies the payload carried by IP. It is different from a TCP or UDP port number. For example, permitting TCP port 47 does not permit GRE.

| Protocol | Identifier / transport | Role |
| --- | --- | --- |
| ICMP | IPv4 protocol 1; ICMPv6 uses IPv6 next-header 58 | Carries diagnostic and error messages such as Echo Reply, Destination Unreachable, and Time Exceeded. It has types and codes rather than TCP/UDP ports. |
| TCP | IP protocol 6 | Provides connection-oriented, ordered delivery. |
| UDP | IP protocol 17 | Provides connectionless datagrams. |
| GRE | IP protocol 47 | Encapsulates traffic for a tunnel. GRE by itself does not encrypt or authenticate the tunneled data. |
| IPsec Authentication Header (AH) | IP protocol 51 | Provides integrity and origin authentication, including protection of selected IP-header fields; it does not encrypt the payload. Address translation conflicts with AH's header protection. |
| IPsec Encapsulating Security Payload (ESP) | IP protocol 50 | Can provide encryption and integrity/authentication according to the negotiated configuration. Commonly carries protected VPN traffic. |
| Internet Key Exchange (IKE) | UDP 500; IPsec NAT traversal commonly uses UDP 4500 | Negotiates security associations and keys for IPsec. NAT traversal can encapsulate ESP in UDP; it does not turn ESP itself into a TCP service. |

IPsec is a security framework rather than one port. In **transport mode**, protection applies primarily to the original packet's payload; **tunnel mode** carries an original packet inside a new outer IP packet. Secure site-to-site VPNs commonly use tunnel mode.

#### Traffic delivery types

| Type | Delivery pattern | Example / implication |
| --- | --- | --- |
| Unicast | One sender addresses one destination | A client connects to one web server address. |
| Multicast | One sender addresses a group of interested receivers | A multicast stream can serve joined receivers without a separate source stream for each. Switch/router support determines where it is forwarded. |
| Anycast | The same address is offered by multiple nodes; routing selects one reachable instance | Distributed DNS services can use one address. The selected instance is best according to routing, not necessarily physically nearest. |
| Broadcast | One sender addresses all hosts in an IPv4 broadcast domain | A DHCP discovery can use `255.255.255.255`. Layer 2 broadcasts remain within their VLAN; a router does not ordinarily forward them. |

IPv4 multicast uses `224.0.0.0/4`. IPv6 supports multicast and anycast but has no broadcast addressing. Unicast, multicast, and broadcast describe delivery patterns; they do not tell you whether the application data is encrypted.

### 1.5 Transmission media and transceivers

Choose media by distance, required rate, electromagnetic interference (EMI), installation conditions, and equipment compatibility. A connector that physically fits does not establish that the cable, optic, and port can communicate.

#### Wired media and Ethernet rates

**IEEE 802.3** is the Ethernet standards family. A name such as **1000BASE-T** identifies a particular Ethernet physical-layer specification: 1000 Mb/s over balanced twisted-pair copper. Ethernet also operates over fiber and other suitable media; Ethernet does not mean only an RJ45 copper connection.

| Medium / example | Typical capability or use | Selection and troubleshooting considerations |
| --- | --- | --- |
| Category 5e twisted pair | 1000BASE-T at 1 Gb/s over a compliant channel up to 100 m | Common endpoint cabling. Pair damage, poor terminations, or excessive length can cause errors or a lower negotiated rate. |
| Category 6 twisted pair | 1 Gb/s to 100 m; 10GBASE-T over shorter qualified runs, often up to 55 m | 10 Gb/s reach depends on installation conditions and alien crosstalk. Do not promise 10 Gb/s over every 100 m Cat 6 run. |
| Category 6A twisted pair | 10GBASE-T at 10 Gb/s to 100 m | Designed for the full 10 Gb/s channel distance when installation and components meet the specification. |
| Single-mode fiber (SMF) | Long-distance campus, metropolitan, or provider links | A small core carries one propagation mode, reducing modal dispersion. Select compatible single-mode optics, wavelength, and optical budget. |
| Multimode fiber (MMF) | Shorter links in buildings and data centers | A larger core carries multiple modes. Reach depends on fiber grade, wavelength, and Ethernet specification; higher rates often have shorter reach. |
| Direct attach copper (DAC) / twinaxial cable | Short switch-to-server or switch-to-switch connections, often within/between racks | A twinax assembly commonly has transceiver-style ends. Active/passive type, supported rate, length, and vendor compatibility must match the ports. |
| Coaxial cable | Broadband cable service, RF distribution, and legacy networking | A center conductor and shield share an axis. Match impedance, connectors, and application; coax is not interchangeable with twisted pair. |

For perspective, **10BASE-T** is 10 Mb/s, **100BASE-TX** is 100 Mb/s, **1000BASE-T** is 1 Gb/s, and **10GBASE-T** is 10 Gb/s. A gigabit switch port cannot provide 10 Gb/s because a better cable is installed. The negotiated link rate also differs from application throughput, which is reduced by protocol overhead and other bottlenecks.

A common structured twisted-pair channel permits **90 m of permanent cable plus patch cords within a 100 m total channel**. Patch panels and patch cords are part of the channel; they do not reset its distance allowance. Fiber avoids electrical EMI on the optical path, but dirty connectors, excessive bends, damaged strands, or mismatched optics can still interrupt service.

**Plenum-rated cable** has jacket characteristics suitable for specified air-handling spaces, where smoke and flame behavior matter. Non-plenum cable is not an automatic substitute. Choose the required installation rating, such as plenum or riser, for the building location; cable category and fire rating describe different properties. Use properly rated cable even when the data rate is modest.

#### Wireless transmission choices

| Technology | Typical purpose | Important tradeoff |
| --- | --- | --- |
| IEEE 802.11 Wi-Fi | Local access through APs or wireless bridges | Shares radio airtime. Distance, walls, interference, channel use, and client capability affect performance. |
| Cellular | Mobile connectivity, WAN access, or backup links through a provider | Coverage, signal quality, congestion, data plans, and carrier addressing affect service. A cellular backup still needs routing and failover policy. |
| Satellite | Connectivity where terrestrial services are unavailable or unsuitable | Requires an appropriate view of the sky. Weather, obstructions, and orbit affect performance; geostationary links have much greater propagation delay than low-Earth-orbit links. |

| Wi-Fi generation / standard | Bands associated with that generation | Practical distinction |
| --- | --- | --- |
| 802.11a | 5 GHz | Older OFDM Wi-Fi, up to a 54 Mb/s physical rate. |
| 802.11b | 2.4 GHz | Older Wi-Fi, up to 11 Mb/s; legacy support can consume substantial airtime. |
| 802.11g | 2.4 GHz | Up to 54 Mb/s with compatibility for older 2.4 GHz clients. |
| Wi-Fi 4 / 802.11n | 2.4 and 5 GHz | Adds MIMO and support for wider channels; actual rate depends on streams and channel width. |
| Wi-Fi 5 / 802.11ac | 5 GHz | Supports higher rates through wider channels and other enhancements. A dual-band product can also provide 2.4 GHz through another standard. |
| Wi-Fi 6 / 802.11ax | 2.4 and 5 GHz; Wi-Fi 6E extends 802.11ax into 6 GHz | Improves efficiency in busy networks, including through OFDMA. Wi-Fi 6 alone does not imply 6 GHz support. |
| Wi-Fi 7 / 802.11be | 2.4, 5, and 6 GHz where permitted | Adds capabilities such as multi-link operation and optional wider channels. Compatible clients, APs, and local spectrum availability determine usable features. |

Advertised Wi-Fi rates are physical-layer rates, sometimes combined across multiple radios. They are not guaranteed download speeds for one client. Objective 2.3 develops channel planning, security, and AP selection.

#### Transceivers and protocol compatibility

A **transceiver** transmits and receives signals. A pluggable module must match the port's supported form factor, rate, protocol, cable type, connector, wavelength, and distance. For a typical duplex optical link, transmit on one end must reach receive on the other. Single-strand bidirectional optics instead require a compatible wavelength pair.

| Form factor / family | Common association | What to verify |
| --- | --- | --- |
| SFP | Commonly 1 Gb/s Ethernet; some modules serve other protocols | A port's supported module list and optical/electrical interface. |
| SFP+ | Commonly 10 Gb/s Ethernet | Similar appearance to SFP does not establish supported rates or backward compatibility. |
| SFP28 | Commonly 25 Gb/s Ethernet | The host port and both endpoints must support the intended rate. |
| QSFP+ | Commonly 40 Gb/s Ethernet using multiple lanes | Lane arrangement and any breakout cable support. |
| QSFP28 | Commonly 100 Gb/s Ethernet | Required fiber/copper assembly, lane configuration, and port support. |

**SFP** means small form-factor pluggable; **QSFP** means quad small form-factor pluggable. Later variants support additional rates. The form factor does not by itself identify the network protocol. **Fibre Channel (FC)** is a storage-network protocol distinct from Ethernet, even when their modules or connectors look similar. A Fibre Channel optic is not automatically suitable for an Ethernet port.

#### Connector recognition

| Connector | Recognizable feature | Common association |
| --- | --- | --- |
| SC | Square push-pull optical connector | Fiber patching; larger than LC. |
| LC | Small optical connector with a latch | Dense switch/transceiver connections; often paired for duplex fiber. |
| ST | Round optical connector with a bayonet twist lock | Older fiber installations. |
| MPO | Holds multiple optical fibers in one connector | Parallel optics and high-density fiber assemblies. Fiber count, polarity, and end-face type must match the system. |
| RJ11 | Small modular telephone-style plug, commonly six positions | Telephone and some DSL connections. It is different from the wider Ethernet plug. |
| RJ45 | Common name for the eight-position modular Ethernet connector | Balanced twisted-pair Ethernet. Correct pinout, all required pairs, and termination quality matter. |
| F-type | Threaded coaxial connector | Cable broadband and television connections. |
| BNC | Bayonet twist-lock coaxial connector | RF/video equipment and legacy coaxial Ethernet. It resembles ST's locking action but connects a different medium. |

An LC connector may terminate either single-mode or multimode fiber. Identify the fiber and optic specification rather than assuming connector shape determines compatibility. Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md) and [SOHO Physical Installation](../../../practice/pbqs/a-plus-core-1/soho-physical-installation/README.md).

### 1.6 Network topologies, architectures, and types

A **physical topology** describes actual devices and connections. A **logical topology** describes how traffic moves or how devices are grouped. One physically shared switching system can contain several logical VLANs; a logical tunnel can connect sites across a provider network with a different physical layout.

| Topology | Structure | Strength / failure consideration |
| --- | --- | --- |
| Star / hub and spoke | Endpoints or sites connect through a central device or site | Easy to add spokes. A failed central component can disconnect many spokes unless redundancy is provided. Modern Ethernet stars normally use switches, not shared Ethernet hubs. |
| Full mesh | Every node connects to every other node | Many alternate paths, but link count grows quickly: `n × (n − 1) / 2` for undirected point-to-point links. Four nodes require six links. |
| Partial mesh | Only selected nodes have direct interconnections | Balances resilience and cost. The actual alternate paths determine which failures it survives. |
| Hybrid | Combines topology patterns | A company might use stars inside offices and a partial mesh between offices. Evaluate each part's failure behavior. |
| Point to point | One connection joins two endpoints | Common for router links and wireless bridges. Failure of that link interrupts the path unless another exists. |
| Spine and leaf | Each leaf switch connects to every spine switch in a typical two-tier fabric | Provides multiple predictable paths between leaf switches, supporting heavy traffic between servers. Endpoints attach to leaves; spines form the interconnection layer. |

#### Campus hierarchy and traffic direction

| Hierarchical tier | Main responsibility |
| --- | --- |
| Access | Connects endpoints such as workstations, phones, and APs; applies endpoint-facing VLAN and access settings. |
| Distribution | Aggregates access switches and commonly applies routing boundaries, policy, and redundancy. |
| Core | Provides a fast, resilient backbone connecting distribution blocks. |

A **three-tier architecture** keeps access, distribution, and core responsibilities separate. A **collapsed core** combines distribution and core responsibilities, often using a redundant pair for a smaller network. Collapsing tiers does not mean every endpoint must connect to one unprotected switch.

**North-south traffic** crosses a boundary, such as a user accessing a data-center service from outside that data center. **East-west traffic** moves between systems within the environment, such as an application server querying a database. These are logical directions, not compass directions. Spine-and-leaf designs are useful when east-west traffic is substantial.

#### Common network scopes

| Type | Scope / purpose |
| --- | --- |
| PAN | A personal area network around one person, such as Bluetooth peripherals. |
| LAN / WLAN | A local network, such as an office's Ethernet or wireless access network. A WLAN normally joins the organization's LAN through APs. |
| MAN | A metropolitan-area interconnection, such as links between sites within a city. |
| WAN | Connections across larger geographic areas, typically using provider services to join LANs. |

Topology describes connection structure; scope describes reach. A WAN can use hub-and-spoke or mesh connectivity. Storage area network describes a storage purpose, not a geographic size.

Apply physical and logical distinctions in [Lab 2: VLAN Configuration](../../../labs/networking/vlan-configuration/README.md): several client networks share a switch and a single router trunk.

### 1.7 IPv4 network addressing

An IPv4 address is **32 bits**, written as four decimal octets. The **subnet mask** or **CIDR prefix** separates network bits from host bits. The address alone does not tell a host whether another address is local; the mask is part of that decision.

#### Public, private, and special addresses

| Address range | Purpose | Important distinction |
| --- | --- | --- |
| `10.0.0.0/8` | RFC 1918 private addressing: 10.0.0.0 through 10.255.255.255 | Routable inside private networks, but not normally carried as public internet routes. |
| `172.16.0.0/12` | RFC 1918 private addressing: 172.16.0.0 through 172.31.255.255 | Only this part of 172.0.0.0/8 is private under RFC 1918. |
| `192.168.0.0/16` | RFC 1918 private addressing: 192.168.0.0 through 192.168.255.255 | Common in small networks; repeated use can create overlapping subnets during VPN connections. |
| `169.254.0.0/16` | IPv4 link-local addressing; Windows APIPA can select an address here when automatic configuration cannot obtain a usable DHCP lease | Supports communication on the local link with compatible neighbors. It does not supply normal routed internet access and is separate from RFC 1918. |
| `127.0.0.0/8` | Loopback; `127.0.0.1` is the familiar localhost address | Refers to the local host. A loopback ping does not test the cable, switch, or gateway. |
| Public unicast allocation | Globally unique addressing assigned through the internet allocation system | Internet reachability still requires appropriate routes and access policy. An address outside RFC 1918 is not automatically public unicast. |

Other special ranges exist. For example, `100.64.0.0/10` is shared address space used for carrier-grade NAT, not RFC 1918. `192.0.2.0/24`, `198.51.100.0/24`, and `203.0.113.0/24` are documentation ranges. Examples using them do not identify real internet services.

#### CIDR, masks, and subnet boundaries

**Classless Inter-Domain Routing (CIDR)** uses a prefix length such as `/26` to state how many bits identify the network. A `/26` leaves six host bits. Its mask is `255.255.255.192`; the final octet in binary is `11000000`.

For an ordinary IPv4 broadcast subnet, `2^(32 − prefix)` gives total addresses. Subtract two for the network and broadcast addresses to find ordinary usable host addresses. The gateway consumes one of those usable addresses. `/31` point-to-point links and `/32` host routes are special cases, so do not apply the subtract-two rule blindly.

| Prefix | Subnet mask | Total addresses | Ordinary usable hosts |
| --- | --- | ---: | ---: |
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 |

A `/31` can use both addresses on a supported point-to-point link. A `/32` identifies one IPv4 address, commonly a host route or loopback-interface address. Prefixes do not need to end at an octet: `/20`, for example, is `255.255.240.0` with a 16-value block increment in the third octet and 4,094 ordinary usable hosts per subnet.

#### Worked example: locate a host's subnet

For **192.168.50.77/26**:

1. The mask is `255.255.255.192`. The final-octet block size is `256 − 192 = 64`.
2. Subnets start at `.0`, `.64`, `.128`, and `.192`. Address `.77` lies in the `.64` block.
3. The **network address** is `192.168.50.64`; the **broadcast address** is `192.168.50.127`.
4. The **usable range** is `192.168.50.65` through `192.168.50.126`, giving 62 hosts.
5. A suitable gateway could be `192.168.50.65`. Address `192.168.50.1` is outside this subnet. The gateway is often the first or last usable address by convention, but neither position is required.

Bitwise AND gives the same boundary: the host octet `77` is `01001101`; AND with mask octet `192` (`11000000`) produces `01000000`, or `64`.

To decide whether a destination is local, compare the source and destination network values using the sender's mask. With `/26`, `.77` and `.100` are local to one another, but `.77` and `.130` are not. A host with an incorrect `/24` mask may wrongly try ARP for a remote destination instead of sending the packet to its gateway.

#### Worked example: VLSM address planning

**Variable Length Subnet Masking (VLSM)** allocates different prefix lengths inside a larger address block to fit different host requirements. Allocate the largest subnet first, keep each network on its proper boundary, and check for overlap. The requirements below include gateway and management addresses.

From **192.168.50.0/24**, allocate:

| Need | Allocation | Usable range | Broadcast | Host capacity |
| --- | --- | --- | --- | ---: |
| 60 hosts | 192.168.50.0/26 | 192.168.50.1–192.168.50.62 | 192.168.50.63 | 62 |
| 28 hosts | 192.168.50.64/27 | 192.168.50.65–192.168.50.94 | 192.168.50.95 | 30 |
| 12 hosts | 192.168.50.96/28 | 192.168.50.97–192.168.50.110 | 192.168.50.111 | 14 |
| 2 router interfaces | 192.168.50.112/30 | 192.168.50.113–192.168.50.114 | 192.168.50.115 | 2 |

Each block begins after the previous block ends and fits within the parent `/24`. Addresses `.116` through `.255` remain for later allocations, which must still use valid aligned boundaries. VLSM saves space compared with giving every segment a `/26`; CIDR is the classless prefix notation and routing approach that supports such allocations.

#### Historical IPv4 classes

| Class | First-octet range | Historical association |
| --- | --- | --- |
| A | 1–126 for ordinary classful unicast assignments | Default /8 boundary; 0 and 127 have special uses. |
| B | 128–191 | Default /16 boundary. |
| C | 192–223 | Default /24 boundary. |
| D | 224–239 | Multicast, not a classful host subnet with an A/B/C default mask. |
| E | 240–255 | Reserved space; `255.255.255.255` has the special limited-broadcast purpose. |

These classes explain historical terminology. Modern addressing uses the configured prefix. Calling a network Class C does not justify assuming `/24`, and class membership does not determine whether an address is private.

Practice with [IP Configuration Troubleshooting](../../../practice/pbqs/a-plus-core-1/ip-configuration-troubleshooting/README.md), [Lab 1: Basic Network Configuration](../../../labs/networking/basic-network-configuration/README.md), and the `/30` transit link in [Lab 3: Static Routing](../../../labs/networking/static-routing/README.md).

### 1.8 Modern networking environments and technologies

Modern designs separate policy, forwarding, and automation so networks can support distributed applications. The underlying links, addressing, MTU, routing, and access controls still determine whether traffic reaches its destination.

#### SDN and SD-WAN

**Software-defined networking (SDN)** separates programmable control decisions from packet-forwarding work. A logically centralized controller can apply policy across many devices, while the devices' data planes forward packets. This does not require every data packet to travel through the controller.

**Software-defined WAN (SD-WAN)** applies centrally managed policy to connectivity between sites and services, commonly using an overlay across multiple WAN transports.

| Capability | Meaning | Practical example |
| --- | --- | --- |
| Application aware | Identifies applications or traffic classes and selects handling accordingly | Prefer a low-latency path for voice while a file transfer uses another suitable path. |
| Zero-touch provisioning | A new device obtains its intended configuration through an automated onboarding process | A branch appliance contacts an authorized provisioning service after receiving basic connectivity. Trust, credentials, and bootstrap access must still be established. |
| Transport agnostic | Can operate across different underlying connectivity types | Combine broadband, MPLS, and cellular rather than requiring one carrier transport. |
| Central policy management | Defines and distributes consistent behavior across sites | Apply segmentation or path-selection policy from a common management system. |

The **underlay** is the transport network; the **overlay** is the logical network built over it. An SD-WAN overlay cannot forward through a failed underlay unless another working path exists. Application-aware routing can react to loss, latency, or jitter but cannot create capacity absent from the links.

#### VXLAN and data-center interconnect

**Virtual Extensible LAN (VXLAN)** carries Layer 2 frames inside an IP/UDP overlay, commonly using UDP 4789. Tunnel endpoints called **VTEPs** encapsulate and decapsulate the frames. A VXLAN network identifier separates logical segments; its 24-bit field supports far more segment identifiers than a VLAN's 12-bit identifier field.

This permits logical Layer 2 networks across a routed Layer 3 underlay and can support **data-center interconnect (DCI)** designs. Extending a segment across sites requires deliberate planning for latency, failure domains, and address handling. Encapsulation adds overhead, so the underlay MTU must support the intended traffic size. VXLAN alone is not encryption.

#### Zero trust, SASE, and SSE

**Zero trust architecture (ZTA)** bases access on explicit policy rather than automatically trusting a device because it is inside the network. **Authentication** establishes an identity; **authorization** decides what that identity may access. Device condition, resource sensitivity, and other context can influence the decision. **Least privilege** limits access to what the task requires, rather than granting broad network access after one successful login.

For example, a managed laptop and authenticated user may receive access to one application. That decision does not automatically permit access to every server in the same subnet. Segmentation and ongoing policy evaluation help enforce the intended scope.

| Approach | Scope | Distinction |
| --- | --- | --- |
| Secure Access Service Edge (SASE) | Combines WAN networking and cloud-delivered security | Commonly brings SD-WAN together with functions such as secure web gateways, cloud access security brokers, and zero trust network access. |
| Security Service Edge (SSE) | The cloud-delivered security portion | Focuses on secure access to web, cloud, and private applications without requiring SD-WAN as part of the service. |

A secure web gateway controls web access; a cloud access security broker adds visibility and policy for cloud use; zero trust network access grants access to specific applications under policy. These terms describe functions and architectures, not a guarantee that every vendor product has identical features.

#### Infrastructure as code and source control

**Infrastructure as code (IaC)** expresses intended infrastructure and configuration in machine-readable files. Automation applies those definitions consistently instead of relying on repeated manual changes.

| Element | Purpose / application |
| --- | --- |
| Playbooks, templates, and reusable tasks | Describe repeatable work or desired settings. One approved template can configure consistent VLAN or logging settings across a device group. |
| Configuration drift and compliance | Compare actual settings with the intended baseline. An unexpected manual rule change is drift even if the device still forwards traffic. Investigate before automatically overwriting an intentional emergency change. |
| Upgrades | Automate staged software changes and post-change checks. Compatibility, rollback, and verification still require planning. |
| Dynamic inventories | Discover current devices/resources through management systems or APIs instead of depending only on a static list. |
| Central repository and version control | Keep definitions and their change history in a shared location, making review and recovery possible. Source control records intended configuration; it does not prove the live network matches it. |
| Branching | Develop and review a proposed change away from the main approved configuration. |
| Conflict identification | Detect incompatible concurrent edits that need deliberate reconciliation before the combined configuration is applied. |

Review and validate an automated change before broad deployment. A template error can repeat the same fault across many devices, so test against a limited set and verify the result.

#### IPv6 addressing and IPv4 compatibility

IPv6 uses **128-bit addresses**, expanding the address space beyond IPv4's 32 bits. Addresses contain eight hexadecimal groups when fully written. Leading zeros inside a group can be omitted, and one continuous run of zero groups can be replaced by `::` once per address. For example, `2001:0db8:0000:0010:0000:0000:0000:0025` becomes `2001:db8:0:10::25`.

| Address / prefix | Role |
| --- | --- |
| Global unicast, commonly within `2000::/3` | Globally unique addresses used for routed communication, subject to actual routing and policy. |
| `fe80::/10` | Link-local addressing used on the local link, including neighbor and router communication. Routers do not forward it to other links; a link/interface identifier may be needed when specifying a destination. |
| `fc00::/7` | Unique local address space; locally generated allocations commonly start with `fd`. Used for internal addressing rather than ordinary public internet routing. |
| `ff00::/8` | Multicast addressing. IPv6 uses multicast for functions that IPv4 might perform with broadcasts. |
| `::1/128` | Loopback for the local host. |
| `::/128` | Unspecified address, used when an address is not yet available; not a normal destination to assign to a server. |
| `2001:db8::/32` | Documentation examples, including those on this page. |

A `/64` is common for IPv6 LAN subnets and is important for standard SLAAC behavior. Prefix requirements depend on the link and use case. IPv6 uses **Neighbor Discovery through ICMPv6**, rather than ARP, to discover neighbors and routers. Blocking all ICMPv6 can break basic operation, not merely ping.

| Coexistence method | How it works | Troubleshooting implication |
| --- | --- | --- |
| Dual stack | Runs IPv4 and IPv6 on the same systems/network | Each protocol needs valid addressing, routing, DNS behavior, and access policy. Working IPv4 does not establish working IPv6. |
| Tunneling | Carries one protocol inside another to cross a network that does not natively carry the inner protocol | Both tunnel endpoints and the underlay must work. Added headers affect MTU; tunneling does not inherently supply encryption. |
| NAT64 | Translates between IPv6 clients and IPv4 destinations in a supported design | Often paired with DNS64 to synthesize usable IPv6 DNS answers for IPv4 services. It does not automatically make every IPv4-only application compatible. |

IPv6 reduces address-exhaustion pressure, but it does not remove the need for segmentation, firewalls, or careful address planning. Devices and applications must support the chosen transition method; assigning an IPv6 address alone does not make an IPv4-only service reachable.

## 2.0 Network Implementation

### 2.1 Routing technologies

A router uses destination network information to select a **next hop** or outgoing interface. A **directly connected route** comes from an addressed, operational interface. Remote destinations require a learned route, a configured route, or a suitable default route. Forwarding succeeds only when the next hop and the rest of the path are usable.

#### Static and dynamic routing

| Method / protocol | How it obtains or chooses routes | Typical use / tradeoff |
| --- | --- | --- |
| Static route | An administrator defines a destination prefix and next hop/interface | Simple and predictable for a small network or default path. Changes require maintenance; a configured route does not automatically prove the destination is reachable. |
| Dynamic routing | Routers exchange reachability information through a routing protocol | Adapts to topology changes after convergence, but requires correct neighbors, policy, and resources. Convergence is the process of reaching a consistent usable view after a change. |
| OSPF | A link-state interior gateway protocol; builds topology information and calculates paths using cost | Used within an organization/autonomous system. Cost is commonly derived from interface bandwidth; it is not simply a count of routers. |
| EIGRP | An advanced distance-vector interior gateway protocol with a composite metric | Commonly associated with Cisco environments. Default metric calculations primarily use bandwidth and delay; a path with fewer hops is not necessarily preferred. |
| BGP | A path-vector protocol that exchanges prefixes and applies policy using path attributes | Commonly exchanges routes between autonomous systems, including internet providers. Policy and attributes such as AS path matter; it is not a simple fastest-link or shortest-hop protocol. |

An **autonomous system** is a set of networks under a common routing administration. OSPF and EIGRP are interior protocols; BGP can exchange information between autonomous systems and can also run internally to distribute BGP routes. Network+ focuses on purpose, behavior, and interpretation rather than complete vendor configuration or detailed path-selection algorithms.

#### Prefix length, administrative distance, and metric

These values answer different questions:

| Value | Question it answers | Correct comparison |
| --- | --- | --- |
| Prefix length | Which installed route most specifically matches this destination? | During forwarding, choose the **longest matching prefix**. A matching /25 is more specific than a /24 or default route. |
| Administrative distance (AD) | Which route source should be preferred when sources offer the same prefix? | A lower AD is preferred on Cisco devices. It is a local preference, not a measurement of physical distance or speed. Other vendors can use different preferences. |
| Metric | Which path is preferred by a particular routing protocol? | Apply that protocol's metric/path-selection rules. OSPF cost and EIGRP composite metrics are different scales; do not compare them as if they share one unit. |

Route-source and protocol decisions populate the routing table; packet forwarding then uses the most specific installed match. This distinction prevents the mistake of always selecting the lowest-AD route regardless of destination prefix.

Consider these **already installed example routes**:

| Destination | Source | Next hop |
| --- | --- | --- |
| 0.0.0.0/0 | Static default | 10.0.0.1 |
| 192.168.50.0/24 | Static | 10.0.0.2 |
| 192.168.50.64/26 | OSPF | 10.0.0.3 |

A packet for **192.168.50.77** uses the `/26` route through `10.0.0.3`, because that is the longest match. It does not choose the `/24` static route simply because a normal Cisco static route has AD 1 and OSPF has AD 110. A packet for `192.168.50.200` matches the `/24` but not the `/26`; an unrelated destination can use the default if no more specific route matches.

If both a normal static route and OSPF offer **the same** `192.168.50.0/24`, their default Cisco AD values favor the static route. An administrator can deliberately change preferences, so treat displayed values as authoritative for that device. In Cisco output such as `[110/20]`, the first value is AD and the second is metric.

#### NAT and PAT

**Network address translation (NAT)** changes IP address information as traffic crosses a boundary. **Static NAT** commonly maps one inside address to one outside address. **Dynamic NAT** selects a mapping from an available address pool. These describe translation behavior, not a replacement for routing or access policy.

**Port address translation (PAT)** lets multiple inside connections share an outside IPv4 address by distinguishing translated transport ports. It is also called NAT overload. For example:

| Inside connection | Illustrative translated connection |
| --- | --- |
| 192.168.10.25:52014 → TCP web service | 198.51.100.10:40001 → same service |
| 192.168.10.26:52014 → TCP web service | 198.51.100.10:40002 → same service |

The translation table maps replies back to the correct inside connection. The outside address here is a documentation example. PAT can preserve the original source port when available; it does not have to replace every port. Publishing an internal service normally needs an explicit destination translation/port-forwarding arrangement and appropriate firewall policy. Translation neither encrypts the data nor authorizes every connection.

#### First-hop redundancy and subinterfaces

A **First Hop Redundancy Protocol (FHRP)** lets multiple routers provide a shared gateway identity, including a **virtual IP (VIP)**. Examples include VRRP and Cisco HSRP. Clients use the VIP rather than depending on one router's individual interface address.

For example, two routers might have `192.168.10.2` and `192.168.10.3`, while clients use virtual gateway `192.168.10.1`. If the active forwarding router fails, another can assume the gateway role. Upstream connectivity, tracking, and convergence still matter; gateway redundancy does not protect against every failure beyond the local segment. A load balancer can also use a VIP for a different purpose, so read the context.

A **subinterface** is a logical interface under a physical interface. In router-on-a-stick, each subinterface handles an assigned VLAN's tagged traffic and supplies that VLAN's gateway address. The physical link carries several logical networks.

In [Lab 2: VLAN Configuration](../../../labs/networking/vlan-configuration/README.md), `GigabitEthernet0/0.10` handles VLAN 10 through its `encapsulation dot1Q 10` setting. The `.10` suffix is a naming choice; the encapsulation setting actually binds the VLAN. The parent interface must be operational.

Apply routes and return paths in [Lab 3: Static Routing](../../../labs/networking/static-routing/README.md). If a request leaves one network but replies cannot return, investigate the destination side's route back to the source subnet. Also inspect client gateways and any filtering; adding only a forward route is not sufficient.

### 2.2 Switching technologies and features

A switch learns **source MAC addresses** on its ports within each VLAN and uses the destination MAC address to forward a frame. A known unicast goes toward the learned destination port. Unknown unicasts and broadcasts are normally flooded to eligible forwarding ports in the same VLAN, excluding the incoming port. They are not automatically copied into every VLAN.

#### VLANs, access ports, and trunks

A **virtual LAN (VLAN)** creates a separate Layer 2 broadcast domain on shared physical switching equipment. Each routed VLAN normally uses its own IP subnet. Devices in different VLANs need Layer 3 forwarding to communicate; placing their cables on the same switch does not provide that routing.

| Setting / feature | Purpose | Common mistake or verification point |
| --- | --- | --- |
| VLAN database | Records the VLANs known to a switch and their identifiers/names | Creating a VLAN on one switch does not inherently create it on every switch. Verify local existence and intended port membership. |
| Access port | Places ordinary endpoint data traffic into an assigned VLAN | An incorrect access VLAN can give a client the wrong DHCP scope or isolate it from expected neighbors. |
| IEEE 802.1Q trunk | Carries multiple VLANs over one link using tags for tagged traffic | Verify trunk mode, required VLANs in the allowed list, and VLAN availability at both ends. An active physical link alone does not prove every VLAN crosses it. |
| Native VLAN | Associates normally untagged data traffic on an 802.1Q trunk with a VLAN | Match the intended native VLAN at both ends. Some platforms can tag native traffic; follow the actual configuration. |
| Voice VLAN | Separates a phone's voice traffic from ordinary data traffic | A phone and attached PC can share a physical port while using separate logical VLANs; the phone commonly tags voice frames. Voice VLAN and QoS settings address different functions. |
| Switch virtual interface (SVI) | Provides a logical Layer 3 interface associated with a VLAN | On a Layer 2 switch, an SVI commonly supports management. A capable multilayer switch can use SVIs as routed VLAN gateways when routing is enabled. |

An 802.1Q tag adds **four bytes** to the Ethernet frame and contains a **12-bit VLAN identifier**. Ordinary configurable VLAN IDs are **1–4094**; identifiers 0 and 4095 have special/reserved purposes. The native VLAN does not have to be VLAN 1. A VLAN number and an IP subnet number are different identifiers, even when administrators choose matching numbers for readability.

For example, Sales VLAN 10 can use `192.168.10.0/24`, and HR VLAN 20 can use `192.168.20.0/24`. Their switch-to-router trunk carries both VLANs. Router subinterfaces or routed switch SVIs provide gateways. A trunk transports their frames; it does not itself make the routing decision between the subnets.

Useful Cisco lab verification commands are `show vlan brief` for access-port membership, `show interfaces trunk` for trunk/VLAN transport, and `show ip interface brief` for relevant Layer 3 interface status. Exact output and supported features depend on the device model. [Lab 2](../../../labs/networking/vlan-configuration/README.md) supplies the guided configuration.

#### Link aggregation, speed, and duplex

**Link aggregation** combines compatible physical links into one logical connection. It increases aggregate capacity and can retain connectivity after a member fails. **LACP** negotiates a bundle under the IEEE 802.1AX link-aggregation standard; Cisco commonly calls a bundle an EtherChannel or port channel.

Member links need compatible settings, including their VLAN/trunk role and supported speed/duplex requirements. Traffic distribution commonly uses a hash of flow information. Two 1 Gb/s members can carry roughly 2 Gb/s in aggregate across suitable flows, but one ordinary flow is commonly limited to one member's capacity. Adding cables without a correctly formed bundle can instead introduce a loop.

**Speed** is the link's signaling rate. **Full duplex** supports simultaneous transmission and reception; **half duplex** shares the medium and uses collision handling in legacy Ethernet. Modern switched Ethernet normally uses full duplex. A speed or duplex mismatch can cause failure to link, errors, or severe performance problems. Use supported autonegotiation or matching configurations at both ends; do not fix one side without checking the other. Collisions are not normal on a correctly operating full-duplex link.

#### Spanning tree

Ethernet frames lack a router-style hop limit. A Layer 2 loop can repeatedly circulate broadcasts, duplicate traffic, and cause MAC-table instability. **Spanning Tree Protocol (STP)** creates a loop-free forwarding topology by selecting a root bridge and placing redundant paths into a non-forwarding state. A blocked/discarding port can be intentional protection rather than a faulty cable.

When a forwarding path fails, a suitable alternate path can transition to forwarding after the protocol reconverges. Rapid spanning tree improves convergence compared with original STP. Redundancy therefore requires deliberate topology and protocol configuration; disabling STP to make every cable forward can cause a broadcast storm.

#### MTU and jumbo frames

The **maximum transmission unit (MTU)** is the largest Layer 3 packet a link can carry without fragmentation at that layer. A common Ethernet IP MTU is **1500 bytes**. Ethernet frame headers, FCS, and VLAN tags are separate overhead, so a 1500-byte MTU is not the complete on-the-wire frame size.

**Jumbo frames** support larger payloads, often around a 9000-byte IP MTU, but the exact size and how a vendor reports it vary. They can reduce overhead for suitable workloads such as storage transfers. All relevant endpoints and links must support the intended size, and tunnel overhead must be considered. A larger setting on one switch does not enlarge every path.

Small pings may succeed while larger transfers fail across a lower-MTU segment. Path MTU discovery and appropriate ICMP error delivery help endpoints adapt; filtering those messages can create a black hole. IPv6 routers do not fragment forwarded packets, making correct MTU handling especially important.

### 2.3 Wireless devices and technologies

Wireless design combines **coverage**, **capacity**, **client compatibility**, and **security**. A strong signal alone does not establish good throughput when many clients compete for the same airtime or interference causes retransmissions.

#### Frequencies, channels, and width

| Band | Typical characteristics | Planning implication |
| --- | --- | --- |
| 2.4 GHz | Generally reaches farther through obstacles under comparable conditions; limited channel reuse and substantial interference from other devices | Useful for range and older/IoT clients. Commonly use 20 MHz channels to preserve reuse in busy deployments. |
| 5 GHz | More channel choices and support for wider channels; generally less wall penetration than 2.4 GHz under comparable conditions | Useful for capacity. Some channels require radar protection, and available channels/power depend on the regulatory region. |
| 6 GHz | Additional spectrum for compatible Wi-Fi 6E/7 equipment where authorized; no older 2.4/5 GHz-only clients | Useful for capacity and wider channels. Requires compatible clients, permitted operation, and suitable security settings; it is not simply a range upgrade. |

A **channel** occupies part of a frequency band. **Channel width** combines more spectrum for a connection: common widths include 20, 40, 80, and 160 MHz where supported. Wider channels can raise the maximum rate but leave fewer independent channels and increase exposure to interference. Select width for the client density and RF environment rather than always using the largest option.

Neighboring 2.4 GHz channel numbers overlap at common widths. **Channels 1, 6, and 11 at 20 MHz** are the familiar non-overlapping plan in the United States. Other regions have different permitted channels; verify the actual country's rules and equipment settings. Adjacent APs should use suitable non-overlapping channels where possible. APs sharing one channel contend for airtime, while overlapping channels can introduce additional interference.

**IEEE 802.11h** adds mechanisms including **Dynamic Frequency Selection (DFS)** and **Transmit Power Control (TPC)** for applicable 5 GHz operation. DFS detects protected radar activity and moves operation away from affected channels; TPC controls transmit power. Radar detection can therefore cause a channel change or temporary interruption. Not every 5 GHz channel has the same DFS requirement.

Use the correct regulatory domain for the installation. Country settings affect allowed channels, power, indoor/outdoor operation, and features. **Band steering** encourages capable clients toward a preferred band, often 5 or 6 GHz, to reduce 2.4 GHz congestion. Clients retain an important role in association decisions, so steering does not guarantee that every client uses the intended band.

#### SSID, BSSID, and extended service sets

| Identifier | Meaning | Example |
| --- | --- | --- |
| SSID | The service set identifier, or wireless network name | A user selects `Staff` from the network list. The name alone does not prove the AP is legitimate. |
| BSSID | Identifies a particular basic service set, typically using an AP radio's MAC-like address | Two APs advertising `Staff` have distinct BSSIDs; one radio can also support several BSSIDs for multiple WLANs. |
| ESS / ESSID | An extended service set joins multiple infrastructure basic service sets into a common WLAN; ESSID commonly refers to its shared SSID | Multiple office APs advertise `Staff` so clients can move through the coverage area. |

Consistent SSID and security settings support roaming, but the name by itself does not guarantee uninterrupted sessions. VLAN/subnet design, authentication, controller features, and the client's roaming decisions also matter. A client can remain attached to a distant AP even when another is closer, so inspect its actual BSSID and signal information.

#### Wireless network designs and AP management

| Design / device role | How it works | Typical application |
| --- | --- | --- |
| Infrastructure | Clients associate with APs connected to the network | Normal home and enterprise WLAN access. A phone hotspot behaves as an AP; it is not automatically an ad hoc network. |
| Ad hoc | Compatible clients communicate directly without a conventional infrastructure AP | Temporary peer communication using supported ad hoc/IBSS capabilities. It lacks the normal centrally managed AP design. |
| Point-to-point wireless | A radio link joins two defined endpoints | Connect two buildings with appropriate antennas, alignment, and a clear enough radio path. |
| Mesh | Mesh nodes provide a wireless path through other nodes toward the wired network | Extends service where wired backhaul is difficult. Shared-channel backhaul consumes airtime, so extra hops can reduce capacity. |
| Autonomous AP | Manages its WLAN settings locally | Suitable for small installations or independently managed APs; repeated manual configuration can become difficult at scale. |
| Lightweight AP | Works with a controller or coordinated management system for configuration and control | Supports consistent policy across many APs. Central control does not require all client data to use one forwarding path; local switching may be supported. |

The **backhaul** connects the AP/mesh to the rest of the network. A mesh radio can show a strong client signal while its backhaul is congested or weak. A wired AP also needs adequate Ethernet uplink capacity and, when used, sufficient PoE power.

An **omnidirectional antenna** provides broad coverage around its axis, often useful in an office; its pattern is not an equal sphere in every direction. A **directional antenna** concentrates coverage toward a selected area, useful for a point-to-point bridge or a specific coverage sector. Orientation, obstacles, placement, and the clients' return signal matter. Increasing AP power alone does not strengthen a client's transmitter.

#### Authentication and encryption

| Security choice | What it provides | Important distinction |
| --- | --- | --- |
| WPA2-Personal | Uses a shared passphrase/PSK for network access; modern deployments use AES-CCMP | Simple for smaller networks, but sharing or changing a common credential affects everyone who uses it. Avoid obsolete TKIP configurations. |
| WPA3-Personal | Uses Simultaneous Authentication of Equals (SAE) for password-based authentication and requires protected management frames | Improves resistance to offline password guessing. It still requires suitable passwords and compatible clients; it is not the same handshake as WPA2-PSK. |
| WPA2/WPA3-Enterprise | Uses 802.1X/EAP authentication, commonly with a RADIUS server | Supports individual user/device identities and, with appropriate EAP methods, certificates. Validate the authentication server's certificate to avoid trusting an impostor. |

**Authentication** decides who can join; **encryption** protects radio traffic after the necessary security negotiation. Enterprise authentication is not simply a longer shared Wi-Fi password. WPA3 has multiple enterprise security capabilities; do not assume every deployment uses the optional 192-bit mode.

For a protected 6 GHz WLAN, plan for supported WPA3 security rather than assuming a legacy WPA2-only profile will work. Enhanced Open/OWE can protect radio traffic on supported passwordless WLANs, but that does not authenticate a user in the same way as an enterprise login. Client/AP capabilities and the selected security profile must agree.

#### Guest access and a practical deployment example

A **guest network** separates visitor access from internal resources, commonly through a guest VLAN and firewall policy. **Client isolation** can restrict guest-to-guest communication where supported. Merely choosing a different SSID does not establish isolation if both WLANs bridge into the same unrestricted network.

A **captive portal** presents a browser page for terms, payment, or login before granting selected access. It does not itself encrypt the wireless link. Guest clients also need suitable addressing, DNS, and permitted routes for whatever services the portal expects them to reach.

For a small office with two overlapping coverage areas:

1. Check a site survey and client requirements before selecting AP positions. Plan both coverage and the number of active clients.
2. Use supported channels and widths that allow reuse. Where permitted, two 2.4 GHz APs could use channels 1 and 6 at 20 MHz, with a separate surveyed plan for 5 GHz.
3. Advertise a consistent staff SSID with compatible enterprise authentication where the organization supports it.
4. Place guest traffic into a separate VLAN with explicit policy for internet access and internal restrictions.
5. Verify association, authentication, DHCP, DNS, application access, roaming, and guest isolation from a client. Check both the radio and uplink/backhaul when performance is poor.

Foundational practice: [SOHO Router Configuration](../../../practice/pbqs/a-plus-core-1/soho-router-configuration/README.md) and [Wireless Coverage](../../../practice/pbqs/a-plus-core-1/wireless-coverage/README.md).

### 2.4 Physical installation considerations

A working installation must fit the site, support service access, maintain power and cooling, and protect the cabling and equipment. Plan physical placement before buying or connecting devices; a suitable logical design cannot compensate for an overheated closet or an unreachable cable termination.

#### Distribution spaces, racks, and cabling

| Item | Purpose | Installation consideration |
| --- | --- | --- |
| Main distribution frame (MDF) | The main building distribution location, commonly near provider handoff/backbone equipment | Plan protected space, backbone routes, power, cooling, and appropriate access. The exact role depends on the building design. |
| Intermediate distribution frame (IDF) | A secondary distribution location serving a floor or area | Connects local endpoint cabling to the building backbone. Additional IDFs help keep horizontal cable runs within supported distances. |
| Rack size | Determines equipment mounting space and physical fit | A rack unit, **1U**, is **1.75 in / 44.45 mm** high; 19-inch mounting is common. Also check depth, weight capacity, rails, clearance, and cable bend space. |
| Port-side intake/exhaust | Describes whether cooling air enters or exits on the port side | Match equipment airflow to the room's cold/hot airflow plan. Facing the ports forward does not by itself establish the right cooling orientation. |
| Patch panel | Passive termination point for structured copper cabling | Patch cords connect panel ports to switch ports. Label both ends and document the endpoint; a patch panel does not learn MAC addresses or switch frames. |
| Fiber distribution panel | Organizes, terminates, and protects fiber connections/splices | Maintain bend radius, cleanliness, polarity, and strain relief. Match connector and fiber specifications. |
| Lockable enclosure / room | Restricts physical access to network equipment and cable terminations | Protects against unauthorized connections or accidental disruption while preserving authorized maintenance access. |

Allow room for cable management and future additions. Keep equipment vents clear and avoid loading racks beyond their rated capacity. A copper channel's permitted length includes the relevant patching; an IDF location should follow cable reach and coverage needs rather than convenience alone. Labeling helps trace an incorrect patch without guessing at occupied switch ports.

#### Power protection and capacity

| Factor | What it means | Practical check |
| --- | --- | --- |
| Uninterruptible power supply (UPS) | Supplies temporary battery power and, depending on design, conditioning during input-power problems | Size for the required load and runtime. A UPS can keep a switch operating while an upstream modem/router loses power, so identify all essential devices. |
| Power distribution unit (PDU) | Distributes electrical power to rack devices | Check outlet types and load ratings. Metered/managed units can expose consumption or outlet control; a PDU is not inherently a battery backup. |
| Power load | The demand placed on the circuit, UPS, PDU, and device supplies | Account for watts, applicable VA limits, startup demands, future capacity, and PoE-powered equipment. Nameplate maximums and measured operating load answer different questions. |
| Voltage | The supply voltage required/supported by the equipment | Match source, UPS output, device input range, connectors, and circuit capacity. A physically fitting adapter does not establish electrical compatibility. |

A switch's **PoE budget** is the power available to connected phones, cameras, or APs. The whole-switch budget and each port's supported PoE standard both matter. An AP may power on with reduced radio features when insufficient power is negotiated. Include downstream PoE demand when sizing upstream UPS capacity.

Redundant power supplies improve resilience only when the intended power paths are available. Connecting both supplies to the same failed source does not provide independent power. UPS runtime depends on actual load and battery condition; a VA rating alone does not state how long the system will run. Related practice: [Power Protection & UPS](../../../practice/pbqs/a-plus-core-1/power-protection/README.md).

#### Environmental controls

- **Temperature:** Maintain the device manufacturer's operating conditions and monitor equipment intake areas, not only a thermostat elsewhere in the room. Blocked vents, failed fans, hot exhaust recirculation, and inadequate cooling can cause throttling or shutdowns.
- **Humidity:** Excess moisture and condensation can damage equipment; very dry conditions increase electrostatic-discharge concerns. Use environmental monitoring and controls appropriate to the equipment and space rather than assuming one universal range suits every installation.
- **Fire suppression:** Select and maintain protection suited to the occupied space and equipment, coordinated with the facility's fire-protection design. Detection, alarm, equipment placement, and the suppression method are part of the installation plan; cooling and a UPS do not provide fire protection.

Treat repeated heat or power faults as infrastructure evidence. Rebooting an affected switch can restore service temporarily while leaving the underlying capacity, airflow, or supply problem unresolved.

Related practice: [SOHO Physical Installation](../../../practice/pbqs/a-plus-core-1/soho-physical-installation/README.md) for equipment/cable recognition and [Lab 1: Basic Network Configuration](../../../labs/networking/basic-network-configuration/README.md) for physical link and gateway checks.

## 3.0 Network Operations

### 3.1 Organizational processes and procedures

Network documentation records what exists, how it connects, and how it should operate. During an outage, accurate records reduce guesswork about which interface, circuit, address range, or recent change is involved. A diagram that no longer matches production can send an investigation down the wrong path.

| Record | Information it provides | Practical use |
| --- | --- | --- |
| Physical diagram / Layer 1 diagram | Devices, locations, media, interfaces, and physical connections | Trace a failed uplink from an IDF switch to the correct MDF termination. |
| Logical diagram | Relationships such as VLANs, subnets, routes, and security boundaries | Determine which gateway and firewall a client must cross to reach a server. It need not reflect physical placement. |
| Layer 2 network diagram | VLAN membership, trunks, link aggregation, and spanning-tree relationships | Identify where a VLAN should cross switches and which redundant path should forward. |
| Layer 3 network diagram | IP prefixes, routing adjacencies, next hops, and routed boundaries | Check forward and return paths between sites. |
| Rack diagram | Equipment positions, rack units, power connections, and cable-management space | Locate a device and plan installation or replacement without displacing another system. |
| Cable map / diagram | Cable identifiers, wall outlets, patch-panel ports, switch ports, and test results | Match a desk outlet to its switch interface and verify the intended VLAN. |
| Wireless survey / heat map | Measured or predicted signal, coverage, interference, and capacity-related information | Compare complaints with actual coverage; a predicted map needs field validation after installation. |
| Asset inventory | Hardware model/serial/location, software/firmware versions, licensing, warranty, and support ownership | Find affected devices when a vulnerability or end-of-support notice applies. A device count alone is insufficient. |
| IP address management (IPAM) | Allocated prefixes, static assignments, DHCP ranges, reservations, and related DNS information | Avoid overlaps and identify who owns an address. Verify records against actual use; a recorded reservation does not prove that the device is online. |
| Service-level agreement (SLA) | Agreed service expectations, availability targets, responsibilities, and response/restoration terms | Decide when to escalate a carrier fault and what evidence to preserve. A response-time promise is different from a restoration-time promise. |

**Policies** state requirements, such as restricting administrative access to approved management networks. **Procedures** give repeatable steps to meet them. Operational records should also identify owners, escalation contacts, maintenance windows, and recovery instructions. Protect configurations and inventories because they can expose credentials or network structure.

#### Life-cycle, change, and configuration management

**Life-cycle management** follows equipment/software from acquisition and deployment through maintenance, replacement, and decommissioning. **End-of-life (EOL)** and **end-of-support (EOS)** have vendor-specific definitions: a product can stop being sold before technical support or security fixes end. Check the published milestones rather than treating both labels as one universal date.

Software management includes OS updates, firmware, security patches, and bug fixes. Confirm the model/version, compatibility, dependencies, available space, configuration backup, and rollback method before an upgrade. Test essential services afterward. Decommissioning includes removing routes, accounts, monitoring entries, DNS/IPAM assignments, and sensitive stored configuration as appropriate; unplugging a device alone does not complete its retirement.

**Change management** records the requested change, reason, affected systems, impact, approvals required by the organization, implementation plan, verification, and rollback. Link a service request or incident to the change record so another administrator can reconstruct what happened. If users lose access after an allowed-VLAN change, compare that change and its before/after evidence before modifying unrelated routing.

| Configuration type | Meaning | Important distinction |
| --- | --- | --- |
| Production configuration | Settings actually used by the live system | Current operation may include changes not yet reflected in an older saved file. |
| Backup configuration | A recoverable copy from a known time | Record device/version and protect access. Confirm the copy can be restored on the intended platform. |
| Baseline / golden configuration | An approved reference for expected settings | Used to compare deployments and detect drift. It is a standard to adapt deliberately, not necessarily a complete replacement for every device's unique settings. |

On Cisco IOS, running and startup configurations are different: a working running-configuration change may not survive a reboot until saved. A backup is another copy for recovery. Configuration management keeps these roles clear and tracks authorized differences from the baseline.

### 3.2 Network monitoring technologies

Choose a monitoring method for the evidence required. Interface utilization, a list of conversations, a packet trace, and a device log answer different questions. Monitoring must also account for collection location, sampling, polling intervals, timestamps, and missing data.

| Method | Information it provides | Limitation / appropriate use |
| --- | --- | --- |
| SNMP polling | Device values such as interface counters, status, CPU, or temperature | Provides supported management values rather than every packet. Polling intervals can hide short spikes. |
| SNMP traps / informs | Device-originated event notifications, such as a link-state change | Traps have no application-level acknowledgment; informs add acknowledgment/retry behavior. Notification delivery still depends on the network and collector. |
| Flow data, such as NetFlow/IPFIX | Conversation metadata: endpoints, ports/protocol, times, packet/byte counts | Useful for finding top talkers and traffic patterns. Typical flow records do not contain full packet payloads; sampling can omit short conversations. |
| Packet capture / protocol analysis | Packets visible at the capture point, including headers and any captured payload | Helps inspect DHCP exchanges, retransmissions, or DNS responses. Encryption, capture filters, truncation, loss, and location limit what can be observed. |
| Syslog collector | Central copies of device/application event messages | Correlates events across systems. Logging level, correct time, reliable delivery, and retention determine what evidence is available. |
| SIEM integration | Aggregates and correlates security-relevant logs and other telemetry | Can connect a login event, rule change, and traffic alert. It cannot reliably reconstruct events never collected or automatically make every alert a confirmed incident. |
| API-based monitoring | Structured queries to controllers, cloud systems, and management platforms | Exposes information available through that API. Permissions, rate limits, schema changes, and collection failures affect coverage. |
| Port mirroring | Copies selected switch ingress/egress traffic to a monitoring port | Feeds a capture/analyzer without turning it into the live forwarding endpoint. Oversubscribed mirror destinations can lose copies; the selection determines visibility. |

**Simple Network Management Protocol (SNMP)** uses a manager and device agents. A **management information base (MIB)** describes managed objects identified by **object identifiers (OIDs)**. The manager can retrieve an interface's byte counter and compare successive values to estimate its traffic rate; the counter is not itself a recording of the transferred files.

**SNMPv2c** uses community strings, commonly with separate read/write permissions. They do not provide encryption and should not be treated as strong confidential authentication. **SNMPv3** supports security levels including authentication and privacy: `noAuthNoPriv`, `authNoPriv`, and `authPriv`. Merely choosing version 3 does not prove encryption is enabled; select and verify the intended security level and credentials.

#### Baselines, alerts, and monitoring goals

A **performance baseline** records normal utilization, latency, loss, error rates, and other relevant metrics across representative periods. A scheduled backup can produce high nightly traffic without being an attack. Compare a suspected **anomaly** with expected workload and recent changes, then use thresholds and notifications that support timely action without overwhelming staff with noise.

- **Network discovery:** Finds responsive devices and exposed management/service information. Ad hoc discovery supports an immediate investigation; scheduled discovery helps reveal changes over time. Missing results can reflect filtering or a sleeping/offline device, not proof that an address is unused.
- **Availability monitoring:** Checks whether a device or service responds. ICMP response establishes a different level of availability from a successful application transaction.
- **Performance monitoring / traffic analysis:** Tracks delay, loss, utilization, and traffic patterns to locate capacity problems. Average utilization can conceal brief queue saturation.
- **Configuration monitoring:** Detects differences from prior settings or an approved baseline. A difference needs review against authorized changes before being labeled malicious.

For an example, if calls degrade at 8:00 p.m., use interface metrics to locate congestion, flow data to identify a competing transfer, and a targeted capture to investigate packet timing or retransmissions. Search centralized logs for link or policy changes at the same time. No single data source establishes every part of the cause.

### 3.3 Disaster recovery concepts

**Disaster recovery (DR)** restores required services after a serious interruption. High availability reduces some interruptions; recoverable backups, recovery infrastructure, procedures, and testing address failures that availability features cannot prevent.

| Metric | Question it answers | Example |
| --- | --- | --- |
| Recovery point objective (RPO) | How much data loss, measured in time, is acceptable? | An RPO of 15 minutes requires a recovery point recent enough to limit acceptable loss to that interval. Four-hour backups alone cannot meet it. |
| Recovery time objective (RTO) | How long may the service remain unavailable before required recovery? | An RTO of one hour includes the work needed to restore and validate the required service, not just turn on replacement hardware. |
| Mean time to repair (MTTR) | What is the average repair duration across the measured failures? | Repairs taking 30, 60, and 90 minutes have an MTTR of 60 minutes. Organizations must define what their measurement includes. |
| Mean time between failures (MTBF) | What is the average operating time between failures for a repairable system? | 300 hours of measured operating time across three failures gives an estimated MTBF of 100 operating hours. It does not predict the exact next failure. |

RPO and RTO are requirements used to choose a recovery design. MTTR and MTBF are reliability/maintenance measurements, not interchangeable promises. A design may restore quickly but recover old data, meeting RTO while missing RPO.

| Recovery site | Starting condition | Recovery implication |
| --- | --- | --- |
| Cold | Space and basic facilities are available, with substantial equipment/data preparation still needed | Usually lower ongoing cost and more recovery work. |
| Warm | Some systems/infrastructure are ready, but updates, data restoration, or configuration remain | Balances readiness and cost; verify exactly what is prepared. |
| Hot | Systems and connectivity are prepared for rapid service restoration, with an appropriate data-copy strategy | Greater ongoing cost and coordination. Data freshness and actual failover procedure still determine achievable RPO/RTO. |

**Active-active** systems serve work concurrently; surviving systems need capacity and state handling to absorb a failure. **Active-passive** keeps another system ready to take over a role. Neither approach inherently protects against corrupted data being replicated, a shared power failure, or an untested recovery dependency.

A **tabletop exercise** discusses a scenario, responsibilities, decisions, and escalation without performing the full live restoration. A **validation test** actually checks recovery capabilities, such as restoring configuration/data into a controlled environment and verifying DNS, authentication, routing, and the application. Compare measured results with RPO/RTO. Successful backup creation alone is not a successful recovery test.

### 3.4 IPv4 and IPv6 network services

Address assignment, name resolution, and time synchronization are separate services. DHCP can supply a DNS server address, but DNS performs the lookup. An accurate clock supports authentication and certificate checks but does not repair an incorrect IP route.

#### DHCP addressing and relay

| Setting | Purpose | Common error |
| --- | --- | --- |
| Scope / pool | Defines the subnet and addresses a DHCP service can assign | An exhausted or wrong-subnet pool cannot provide the intended lease. Products use these terms somewhat differently. |
| Exclusion | Prevents selected addresses from being dynamically allocated | Leaving statically addressed gateways/servers inside an unrestricted dynamic range can create conflicts. |
| Reservation | Associates a predictable assignment with a client identifier, often its MAC address | The client still requests its settings from DHCP. Reservation identity and exclusion interaction depend on the implementation. |
| Lease time | Limits how long an assignment remains valid without renewal | Short leases increase renewal activity; long leases can retain addresses for infrequent clients and slow configuration turnover. |
| Options | Supply settings such as subnet mask, default gateway, DNS servers, and domain suffix | A correct address with an incorrect DNS/gateway option still produces connectivity failures. |
| Relay / IP helper | Carries requests between a client subnet and a server in another subnet | Place relay functionality on the appropriate client-facing routed interface; the server also needs a return path. |

The common initial IPv4 exchange is **Discover, Offer, Request, Acknowledge (DORA)**. The client discovers service, a server offers settings, the client requests an offered assignment, and a DHCPACK confirms the lease. This is a simplified initial-assignment flow; renewals do not require a new full discovery exchange every time.

By default, DHCPv4 renewal begins around **T1 = 50%** of the lease, normally contacting the leasing server. Rebinding begins around **T2 = 87.5%** if renewal has not succeeded, allowing other servers to respond. Servers can specify different timers. A client can continue using an existing valid lease while renewal attempts fail; it must stop using the leased address when that lease expires. An initial failure may lead to APIPA on a Windows client, but a missed renewal does not instantly replace a still-valid lease.

Routers do not normally forward the initial broadcast across subnets. A relay identifies the originating subnet in the forwarded request so the server can select the matching pool. In the Hub's [Lab 5: Centralized DHCP and DNS Services](../../../labs/networking/centralized-dhcp-dns/README.md), Server0 is **192.168.30.10/24**, gateway **192.168.30.1**. Client-facing VLAN 10 and 20 subinterfaces relay requests to that server.

| Lab 5 setting | Sales | HR |
| --- | --- | --- |
| Client subnet | 192.168.10.0/24 | 192.168.20.0/24 |
| Client gateway | 192.168.10.1 | 192.168.20.1 |
| Server0 allocation range | 192.168.10.11–192.168.10.210 | 192.168.20.11–192.168.20.210 |
| DNS server | 192.168.30.10 | 192.168.30.10 |

Each range contains **200 addresses**, including both endpoints. Router0's former local exclusions do not control Server0's pools; Server0's starting address and pool size do. This example follows the published lab rather than suggesting another DHCP design. [Lab 4: DHCP Configuration](../../../labs/networking/dhcp-configuration/README.md) teaches the earlier router-hosted pools.

#### SLAAC and IPv6 configuration

**Stateless address autoconfiguration (SLAAC)** lets a host construct IPv6 addresses using suitable prefixes advertised by routers. On a typical `/64` LAN, the host combines the advertised prefix with an interface identifier and checks for duplication. Interface identifiers can use privacy/stable-generation methods; they are not necessarily the device's exposed MAC address.

**Router Advertisements (RAs)** also identify default-router information. DHCPv6 can supply stateful addresses or other settings, and supported RAs can carry DNS information. **DHCPv6 does not supply the IPv6 default gateway in the same way as DHCPv4**; hosts learn default routers through Neighbor Discovery/RAs. Check the prefix, router lifetime, address state, and DNS source separately. A link-local address alone does not establish routed global connectivity.

#### DNS hierarchy, records, and resolution

The **Domain Name System (DNS)** is distributed across a hierarchy: root, top-level domain, and delegated authoritative zones. A client typically asks a **recursive resolver** to obtain an answer. The resolver can answer from cache or follow referrals to authoritative servers; the workstation does not have to query each level itself.

An **authoritative response** comes from a server responsible for the relevant zone data. A **non-authoritative response** commonly comes from a recursive resolver's obtained/cached information; that label alone does not mean the answer is false. A **primary** maintains a writable source of zone data, while a **secondary** obtains a copy through zone transfer. Both can answer authoritatively for the zone. Primary/secondary and authoritative/non-authoritative describe different relationships.

| Record | Purpose | Example / distinction |
| --- | --- | --- |
| A | Maps a name to an IPv4 address | `portal.example.net` → `192.0.2.20`. |
| AAAA | Maps a name to an IPv6 address | `portal.example.net` → `2001:db8:20::20`. |
| CNAME | Aliases one DNS name to another name | `www.example.net` → `portal.example.net`; the target is a name, not a literal IP address. |
| MX | Identifies a domain's mail-exchanger hostname and preference | `example.net` can name `mail.example.net`; lower preference numbers are tried first. The mail hostname needs usable address records. |
| TXT | Stores text used by applications/policies | Domain verification and SPF are common uses; the consuming application determines the text's meaning. |
| NS | Identifies an authoritative nameserver for a zone/delegation | Names the DNS server hostname rather than the website's address. |
| PTR | Associates a reverse DNS name with a hostname | A reverse lookup for `192.0.2.20` can return `portal.example.net`; an A record does not automatically create its PTR counterpart. |

The names and documentation addresses in this table illustrate record relationships. A **forward zone** normally supports name-to-address information. A **reverse zone** uses `in-addr.arpa` for IPv4 or `ip6.arpa` for IPv6 address-to-name information. Caching uses record **TTL** values; changing an authoritative record does not instantly replace every cached copy.

A **hosts file** provides local static name/address mappings for applications using the OS resolver. Windows uses `%SystemRoot%\System32\drivers\etc\hosts`; Linux commonly uses `/etc/hosts`. DNS tools such as `nslookup` and `dig` query DNS rather than proving what every application's resolver or hosts-file configuration will use.

| Protection | What it protects | What it does not establish |
| --- | --- | --- |
| DNSSEC | Uses signatures and a chain of trust to validate signed DNS data's origin/integrity | Does not encrypt ordinary DNS queries or prove that the destination's content is safe. Unsigned zones do not acquire signatures because a client supports DNSSEC. |
| DNS over HTTPS (DoH) | Protects DNS exchanges with a selected resolver through HTTPS, commonly port 443 | Does not encrypt every later network hop or replace DNSSEC validation. An application may select a resolver independently of OS settings. |
| DNS over TLS (DoT) | Protects DNS exchanges with a selected resolver through TLS, conventionally TCP 853 | Does not automatically authenticate the website the user later visits or hide queries from the chosen resolver. |

In Lab 5, comparing a ping to `192.168.30.10` with a lookup of `server.lab.local` separates an IP/ICMP test from a DNS test. The `.lab.local` names are specific to that simulation; use an appropriate controlled namespace in a real deployment. A DNS timeout, `NXDOMAIN`, and a valid answer containing the wrong address are different findings. Working ICMP alone also does not prove that the DNS service port is reachable.

#### Time synchronization

| Technology | Purpose | Distinction |
| --- | --- | --- |
| Network Time Protocol (NTP) | Synchronizes clocks over a network, conventionally UDP 123 | Suitable for general server/client timekeeping. Sources, reachability, clock offset, and authentication configuration matter. |
| Precision Time Protocol (PTP) | Provides precise synchronization for supported managed environments, including industrial or timing-sensitive networks | IEEE 1588 designs commonly use hardware timestamping and suitable network equipment. It is not simply a universal replacement for NTP on every device. |
| Network Time Security (NTS) | Adds cryptographic authentication/integrity protection to supported NTP client-server exchanges | NTS key establishment uses TLS, conventionally TCP 4460; protected NTP exchanges normally continue on UDP 123. It does not put the complete NTP exchange inside a TLS stream. |

Bad clock settings can make certificates appear expired/not yet valid, invalidate time-based credentials, and place related logs in the wrong order. Check the actual time source, synchronization state, and offset; changing only a display time zone does not repair an unsynchronized clock.

### 3.5 Network access and management methods

| Method | Appropriate use | Operational consideration |
| --- | --- | --- |
| Site-to-site VPN | Connects networks at two or more locations through gateways | Correct subnets, routes, permitted traffic, and return paths are required at both sites. Overlapping private ranges complicate communication. |
| Client-to-site VPN | Gives a remote endpoint access through an organization's VPN service | Authenticate the user/device and restrict authorized resources. A connected client still needs correct routes and name resolution. |
| Clientless access | Provides selected applications through a browser-based gateway without a full conventional VPN client | Useful for limited application access; it does not necessarily provide arbitrary IP connectivity or support every client protocol. |
| Split tunnel | Sends selected destinations through the VPN while other traffic follows another path | Can reduce gateway load, but local/internet traffic may bypass centralized inspection and use different DNS/routing policy. |
| Full tunnel | Routes the intended client traffic through the VPN gateway | Centralizes handling but uses gateway/WAN capacity. Verify policy for IPv4, IPv6, and any exceptions rather than assuming the label captures every packet. |

#### Management connections and paths

- **SSH:** Encrypted command-line administration, normally TCP 22. Check server identity/host keys and authorize the administrative role; a reachable SSH listener is not permission to make every change.
- **GUI management:** A web or application interface for administration. Prefer appropriate HTTPS/certificate validation and limited management exposure. A graphical interface can be reached through either in-band or out-of-band infrastructure.
- **API management:** Programmatic access used by monitoring and automation. Limit tokens/roles, protect credentials, and verify results; an accepted API request does not always mean an asynchronous operation is finished.
- **Console access:** Local serial/USB console or a remote console server can reach device management when IP settings or routing are broken. Interface parameters and authentication depend on the platform. A console is a management path, not the same thing as opening an SSH terminal.
- **Jump host / jump box:** An intermediate managed system through which administrators reach protected devices. It centralizes access controls and logging but also needs hardening and limited permissions.

**In-band management** uses the production network to reach a device. It is convenient but may fail with the same routing, switching, or congestion problem being investigated. **Out-of-band management** uses a separate management path, such as a console server reached through an independent network. Its power, upstream connection, and authentication dependencies determine how independent it really is. A management VLAN on the same failed switch is not automatically a fully independent recovery path.

## 4.0 Network Security

### 4.1 Basic network security concepts

Security controls protect communication and resources while supporting their intended use. **Confidentiality** limits unauthorized disclosure, **integrity** protects against unauthorized modification, and **availability** keeps required services accessible. Encrypting a connection supports confidentiality but does not, by itself, keep an overloaded server available.

| Term | Meaning | Example |
| --- | --- | --- |
| Threat | A potential cause of harm | An attacker, equipment failure, or damaging environmental event. |
| Vulnerability | A weakness that could be exploited or triggered | Default administrative credentials or an unpatched exposed service. |
| Exploit | A method or mechanism that takes advantage of a vulnerability | Using a known software flaw to obtain unauthorized access. |
| Risk | The potential for harm, considered through factors such as likelihood and impact | An exposed management interface creates a different risk from the same interface restricted to an isolated management network. |

#### Identity, authentication, and authorization

**Identity and access management (IAM)** governs account creation, access assignment, authentication, review, and removal. The **AAA** functions are **authentication** (who is requesting access), **authorization** (what that identity may do), and **accounting** (records of access/use). A successful login does not mean the account should receive unrestricted administrative permission.

**Multifactor authentication (MFA)** combines different factor categories: something known, possessed, or inherent to the user. Two passwords are still one category. **Time-based authentication**, such as a time-based one-time password, relies on a limited validity window and suitable clock synchronization. Whether it forms MFA depends on the other factor(s) used.

**Least privilege** grants only the resources/actions needed for a task. **Role-based access control (RBAC)** assigns permissions through roles such as monitoring operator or network administrator. **Single sign-on (SSO)** lets an authenticated identity access multiple supported services without separate interactive sign-ins to each; it does not remove the services' authorization decisions.

| Technology | Primary role | Useful distinction |
| --- | --- | --- |
| RADIUS | Centralized AAA commonly used for network access, including enterprise Wi-Fi and VPN services | Conventional deployments use UDP 1812 for authentication and 1813 for accounting. The access device exchanges AAA messages with the server; it is different from a directory lookup itself. |
| LDAP | Queries and manages directory information | Directory data can support identity workflows, but LDAP alone is not equivalent to an SSO system. Protect sensitive directory communication with an appropriate secure configuration. |
| SAML | Exchanges signed identity assertions between an identity provider and a service provider | Common in browser-based federation/SSO. The service validates issuer/trust, intended audience, and validity conditions before accepting the assertion. |
| TACACS+ | Centralized AAA commonly used for network-device administration | Uses TCP 49 and separates authentication, authorization, and accounting functions. Protect the management path and shared secrets; do not assume the protocol provides blanket encryption of every field. |

**Geofencing** uses a location boundary as a policy input, such as restricting a supported connection to approved regions. Location signals can be inaccurate or manipulated, so geofencing supplements identity and device controls rather than proving who a user is. **Zero trust** similarly avoids automatic trust based only on network location; objective 1.8 explains its access-policy role.

#### Encryption, certificates, and trust

**Data in transit** moves between systems; TLS and IPsec are common protections. **Data at rest** resides on storage, including configuration backups and captured logs; disk/file encryption and access controls protect it. Encryption terminates at defined endpoints, where authorized software may handle plaintext. It does not automatically protect data after an endpoint decrypts it.

A **digital certificate** binds an identity or name to a public key under a signature. **Public key infrastructure (PKI)** provides issuance, trust relationships, validation, renewal, and revocation. For an HTTPS management interface, check the trusted issuer/chain, matching server name, validity period, and applicable status/policy. A certificate can be correctly signed yet refer to a different hostname.

A **self-signed certificate** is signed using its own associated private key rather than a separately trusted issuer. It can support encryption and be deliberately trusted through controlled distribution, but unknown clients do not automatically trust its identity claim. Disabling validation to hide an alert removes an important identity check. The certificate/public key and the **private key** have different handling requirements; protect access to the private key.

#### Physical controls, deception, and segmentation

Locks restrict access to rooms, racks, ports, and devices. Cameras support observation and investigation, but recording an event is different from stopping an unauthorized connection. Apply physical controls to provider handoffs and cable terminations as well as visible servers.

A **honeypot** is a decoy intended to attract or reveal suspicious interaction. A **honeynet** is a network of decoy systems. They provide detection/research opportunities and need isolation and monitoring; they are not replacements for production access controls.

**Network segmentation** divides communication into controlled areas. VLANs create Layer 2 separation, while routed policy/firewalls restrict permitted traffic between areas. A different VLAN number without appropriate inter-VLAN policy does not guarantee the intended access restriction.

| Environment / group | Why segment it? | Example policy consideration |
| --- | --- | --- |
| Internet of Things (IoT) | Devices such as cameras and building sensors may have limited management/security features | Permit needed controllers/services while restricting unrelated user and management access. |
| Industrial IoT (IIoT), operational technology (OT), industrial control systems (ICS), and SCADA | OT interacts with physical processes; ICS controls industrial operations, and SCADA provides supervisory monitoring/control | Separate control functions from ordinary office/guest traffic and use approved maintenance paths. Reliability and equipment compatibility matter alongside confidentiality. |
| Guest devices | Visitors need selected services without internal trust | Provide internet access through policy that restricts internal destinations and appropriate peer access. |
| Bring your own device (BYOD) | Personally owned devices may not satisfy the same controls as managed endpoints | Apply identity, posture, and resource-access policy instead of assuming personal ownership establishes suitability. |

Network access control (NAC), security zones, and trust boundaries help enforce these policies; objective 4.3 compares their specific controls.

#### Audits and compliance

An **audit** checks controls and evidence against defined requirements. **Data locality** concerns where data is stored or processed, including backups, logs, and cloud replicas. Track these locations and the requirements applicable to the organization rather than assuming one local server accounts for every copy.

**PCI DSS** defines security requirements for protecting payment account data in its applicable environments. **GDPR** is the EU's general personal-data protection regulation. Network access controls, encryption, logging, and segmentation can support relevant requirements, but implementing one VLAN or firewall does not by itself establish compliance. Match technical evidence to the actual scope and requirements.

### 4.2 Network attacks and their impact

Identify an attack by its mechanism and evidence, then select a relevant control. An outage alone does not prove a DoS attack, and a changed address mapping alone does not prove malicious activity; compare the observation with legitimate changes and other telemetry.

| Attack | Mechanism | Observable consequence / distinction |
| --- | --- | --- |
| Denial of service (DoS) | Exhausts a service, link, or device resource, or triggers a failure | Unavailability, high resource use, queues, or abnormal request volume. A single source can cause DoS; a legitimate demand surge can look similar. |
| Distributed denial of service (DDoS) | Uses many participating sources to disrupt a target | Many-source traffic can saturate upstream capacity before the local firewall can help. Distributed sources distinguish it from a simple single-source attack. |
| VLAN hopping | Attempts to cross an intended VLAN boundary through switching misconfiguration or tagging behavior | Unexpected cross-VLAN access can result from unintended trunk negotiation or certain native-VLAN/double-tagging conditions. Not every VLAN setup is vulnerable to every technique. |
| MAC flooding | Supplies many source MAC identities to overwhelm a switch's learning resources | Can produce abnormal MAC churn and increased unknown-unicast flooding, depending on platform behavior. It does not inherently make every VLAN's traffic visible. |
| ARP spoofing / ARP poisoning | Sends false IPv4 address-to-MAC claims; poisoning describes corrupted neighbor-cache state | A victim may send gateway traffic to an attacker's MAC address, causing interception or disruption. ARP is local-link IPv4 resolution, not DNS name resolution. |
| DNS spoofing / DNS poisoning | Supplies false DNS information or corrupts cached answers | A legitimate-looking name resolves to an unintended address. Poisoned data can persist in a cache; spoofing can target a particular response without successfully poisoning every resolver. |
| Rogue DHCP service | An unauthorized server supplies address settings | Clients may receive a wrong gateway/DNS server or unusable range even though they obtained a lease. Compare lease-source information with the approved servers. |
| Rogue device / AP | An unauthorized device joins the network or exposes wireless access | Can bypass intended controls or create an unapproved entry point. An AP need not copy a trusted SSID to be rogue. |
| Evil twin | A malicious AP impersonates a trusted wireless network | Clients can associate with the wrong BSSID and disclose credentials/traffic through a fraudulent access path. A familiar SSID alone does not authenticate the AP. |
| On-path attack | An intermediary gains a position to observe or alter communications | ARP manipulation, rogue gateways, or fraudulent wireless access can supply the position. Encryption with proper peer validation limits useful interception; an on-path position does not automatically decrypt TLS. |
| Malware | Malicious software disrupts, steals, encrypts, or creates unauthorized access | Can generate command-and-control traffic, scanning, data transfers, or service failures. Network symptoms need endpoint/log evidence to identify the cause. |

Credential attacks can also enable network access: **brute force** tries many candidates against a target; **password spraying** tries a small set of common passwords across many accounts; **credential stuffing** reuses leaked username/password pairs. Their login patterns differ. Rate controls, suitable MFA, secure authentication, and monitoring address different parts of the problem.

#### Social engineering and physical access

- **Phishing:** Uses a deceptive message/site to obtain credentials or induce an action, such as approving an unexpected MFA request or running software. The message can imitate an internal network-support request.
- **Dumpster diving:** Retrieves discarded information or equipment, such as printed network records or unprotected configuration storage.
- **Shoulder surfing:** Observes a screen, keyboard, or authentication activity to obtain information.
- **Tailgating:** Follows an authorized person into a restricted space, potentially gaining access to switches, consoles, or outlets without valid authorization.

These attacks target people and processes as well as devices. A technically correct firewall policy cannot stop someone from disclosing a reusable credential through a fraudulent support interaction.

### 4.3 Network security features and defenses

**Device hardening** reduces unnecessary exposure: disable unused ports and services, replace default credentials, apply supported updates, and restrict management to authorized paths. Use encrypted administration with validated peer identity, suitable AAA/MFA, and logging. Preserve required recovery access so a faulty policy does not remove every way to repair the device.

| Control | Appropriate purpose | Limitation / distinction |
| --- | --- | --- |
| Access control list (ACL) | Permits/denies traffic using supported fields such as addresses, protocols, and ports | Rule order, direction, interface, and an implicit deny can change the result. A packet ACL is not inherently application-aware or stateful. |
| Stateful firewall / traffic inspection | Enforces policy while tracking supported connections; some products inspect application behavior | An established connection is not automatically a safe application transaction. Encryption and inspection placement affect visibility. |
| URL filtering | Restricts access by web destination or URL information available to the control | Available detail depends on protocol and inspection method. A basic IP ACL cannot read an encrypted URL path merely because it allows port 443. |
| Content filtering | Applies rules to supported content/categories or detected material | Needs access to the relevant data and appropriate classification; it differs from blocking an IP address alone. |
| Network access control (NAC) | Applies identity/device-policy decisions when granting network access | Can assign a permitted role/VLAN or restricted remediation access. Its effectiveness depends on policy and enforcement coverage. |
| IEEE 802.1X | Controls network-port access through EAP authentication with a supplicant, authenticator, and authentication service | Used on wired and enterprise wireless networks. A switch/AP commonly relays authentication to RADIUS; VLAN membership alone does not authenticate the endpoint. |
| Port security | Limits or constrains source MAC addresses on supported switch ports | Helps address unexpected devices or MAC flooding, but a MAC address is not strong user identity and can be copied. Choose violation handling deliberately. |
| MAC filtering | Allows/denies listed device MAC addresses | Administrative selection without cryptographic proof of identity. It cannot replace proper wireless or wired authentication. |
| Wireless security | WPA2/WPA3, appropriate enterprise authentication, certificate validation, and guest isolation | A shared network name or captive portal alone does not provide authenticated, encrypted access. Objective 2.3 explains the modes. |
| Physical network controls | Locks, controlled access, cable protection, and monitoring | Protect against unauthorized attachment or console access that logical perimeter rules might not cover. |

#### ACL reasoning and security zones

For a conventional ordered ACL, a packet is checked against rules until the **first match** determines its action. Standard Cisco IPv4 ACLs match source addresses; extended ACLs can distinguish source, destination, protocol, and supported transport ports. A rule allowing DNS must consider both required TCP/UDP behavior rather than using a port number without transport context.

A **wildcard mask** uses zero bits for positions that must match and one bits for positions to ignore. For example, `192.168.10.0 0.0.0.255` matches the IPv4 `/24` source block; `0.0.0.255` is a wildcard, not the subnet mask `255.255.255.0`. **Inbound/outbound** refers to the interface's packet direction: check where the packet enters or leaves the device before deciding where a rule belongs. A reversed source/destination or early broad permit can defeat the intended restriction.

**Trusted** and **untrusted** zones describe policy boundaries, not proof that every system in a trusted zone is safe. A **screened subnet**, often called a DMZ, holds selected exposed services between more restricted internal systems and outside access. Permit the required service flows explicitly; public access to a web service does not imply permission to manage it or reach its database directly.

Practice rule order, direction, and service access in [Lab 6: ACL Traffic Control](../../../labs/networking/acl-traffic-control/README.md). Use the lab's stated policy and addresses; these explanations are not replacement configuration for that exercise.

#### Match defenses to the evidence

| Finding | Relevant defensive choice | Why / practical limit |
| --- | --- | --- |
| Unauthorized trunk or cross-VLAN path | Explicit endpoint access-port roles, intended trunk/allowed/native VLAN configuration, and routed policy | Addresses the boundary rather than assuming a different VLAN label alone prevents access. |
| Unexpected DHCP offers / altered ARP mappings | Supported DHCP snooping and Dynamic ARP Inspection (DAI), with correctly configured trusted paths/bindings | DHCP snooping can restrict server messages; DAI validates ARP using supported binding/policy information. Incorrect trust/static-host handling can block legitimate traffic. |
| Repeated unknown devices or MAC churn | 802.1X/NAC and appropriate port-security limits | Identity-based admission and MAC constraints serve different purposes; neither substitutes for investigation. |
| False DNS answers | Protect DNS administration/resolvers, investigate caches, and validate signed data with DNSSEC where applicable | DoH/DoT protect the resolver transport; they do not make a malicious resolver's answer authoritative. |
| Impersonated Wi-Fi | Validate enterprise authentication server identity, use suitable authentication, and investigate rogue-AP telemetry | Recognizing the SSID is insufficient. A known/authorized BSSID list is supporting evidence, not cryptographic identity by itself. |
| Volumetric DDoS | Upstream/provider mitigation and appropriate traffic controls | A local rule cannot recover bandwidth already saturated before traffic reaches the site. |

**Key management** covers generation, protected storage, access, distribution, renewal/rotation, revocation, and recovery as applicable. A leaked VPN shared secret, expired certificate, and lost private key require different responses. Monitor expiration and access to sensitive keys, and retain only the recovery material authorized by the design.

Use inspection, logs, and alerts to detect evidence; use admission, segmentation, filtering, and hardening to enforce the intended access. A detection alert alone does not implement a blocking rule, and enabling a control without checking permitted traffic can create an availability fault.

## 5.0 Network Troubleshooting

### 5.1 Troubleshooting methodology

Troubleshooting turns observations into a tested explanation and a verified repair. Collect evidence before changing settings; a symptom such as no internet access can result from a cable, VLAN, address, route, DNS, filter, or application problem.

| Step | What to do | Evidence / decision |
| --- | --- | --- |
| 1. Identify the problem | Ask users what fails, who is affected, when it began, and what changed. Gather symptoms and reproduce the fault when possible. Treat separate problems individually. | Record actual errors, affected scope, current settings, and a working comparison. A user's description is a starting point, not a confirmed cause. |
| 2. Establish a theory of probable cause | Question obvious possibilities and choose an explanation consistent with the evidence. Use top-down, bottom-up, or divide-and-conquer OSI reasoning. | No link suggests a different starting point from a successful IP connection with failed name lookup. |
| 3. Test the theory | Perform a focused test that could support or reject the explanation. | If the evidence contradicts the theory, form another or escalate. Do not treat an untested guess as a diagnosis. |
| 4. Establish a plan of action | Choose the repair, assess affected users/dependencies, and identify verification and rollback steps. | Check change requirements and whether a restart or configuration edit could interrupt other services. |
| 5. Implement or escalate | Apply the authorized repair, or supply evidence to the appropriate owner when the fix exceeds your access/scope. | Record the actual change so its effect can be assessed. Escalation should preserve findings rather than restart the investigation from nothing. |
| 6. Verify full functionality | Retest the original failure and related services; add appropriate preventive measures. | A lease renewal alone is insufficient if users also need DNS, inter-VLAN access, and the application. |
| 7. Document throughout | Record findings, tests, actions, results, and lessons learned as work progresses. | Update configuration records, cable maps, or procedures when the verified repair changes them. |

In a **bottom-up** approach, test the physical/link conditions before moving toward the application. **Top-down** begins with the application and works toward lower layers. **Divide and conquer** tests an intermediate point, such as IP reachability, then investigates the relevant side of that boundary. These are investigation strategies, not reasons to skip evidence that already narrows the fault.

For example, a workstation obtains APIPA after a switch-port move. Gather its address settings, link state, approved VLAN assignment, switch configuration, and a working peer's settings. If the port is in the wrong VLAN, compare that finding with the approved mapping before changing it. Restore the authorized assignment, obtain a valid lease, and verify gateway, DNS, and application access. Document the corrected port record. Rebooting every router first would not test that specific theory.

### 5.2 Cabling and physical interface issues

Check the complete path: endpoint adapter, patch cord, outlet, permanent cable, panel, switch port, and any transceivers. A lit LED proves less than successful traffic under the intended rate/load. Interpret colors and states using the device's documentation rather than assuming every vendor uses the same indicators.

#### Media, termination, and signal problems

| Issue | Recognizable evidence | Appropriate verification |
| --- | --- | --- |
| Wrong cable / media | Failure to link or failure at the required distance/rate | Compare the medium, connector, fiber type, Ethernet specification, and endpoint requirements. Single-mode (SMF) or multimode (MMF) fiber must match the intended optics and form a supported link. |
| Incorrect copper category | A channel cannot sustain its intended application | Identify all channel components and test to the required standard. Replacing only a patch cord does not upgrade lower-rated permanent cabling. |
| Shielded twisted pair (STP) vs. unshielded twisted pair (UTP) | Interference-related errors or a channel that does not meet the intended installation specification | Check cable designation and required shield continuity/bonding. Shielding must be properly installed; it is not a substitute for sound routing and termination. Here STP means cable shielding, not Spanning Tree Protocol. |
| Crosstalk | Signal coupling between pairs/cables degrades reception | Use an appropriate cable qualification/certification test; excessive untwisting or poor pair termination can contribute. It differs from an external EMI source. |
| External interference | Errors correlate with motors, electrical equipment, or another interference source | Inspect cable routing, shielding requirements, and error trends; compare with a known-good route or medium. |
| Attenuation / excessive distance | Signal power falls below usable levels as it crosses the path | Check channel length, losses, rated reach, and the applicable cable/optic specification. A passive patch panel does not regenerate the signal. |
| Improper termination / connector fault | Opens, shorts, reversals, split pairs, intermittent contact, or increasing errors | Use a wire-map/tester and inspect connectors. Basic continuity alone may not reveal poor high-frequency performance. |
| Fiber contamination, bends, or damage | Optical loss, intermittent link, or receiver-power alarms | Inspect/clean with suitable tools, check bend radius, and measure the link using appropriate fiber tools. A visible-light check alone does not certify the optical budget. |
| TX/RX transposed | Compatible duplex optics fail to establish a link | Verify that each transmitter reaches the opposite receiver and that polarity follows the system design. Do not assume every single-fiber bidirectional optic uses a duplex pair. |
| Transceiver mismatch / signal strength | Unsupported module, no link, unstable link, or received power outside supported thresholds | Match protocol, form factor, rate, wavelength, SMF/MMF, reach, and vendor support. Check digital optical diagnostics when the platform/module supplies them. |

The objective list includes Category 5/6/7/8 recognition. **Cat 5e** is common for compliant 1 Gb/s, 100 m channels; legacy Cat 5 installations need appropriate qualification. **Cat 6/6A** have different 10 Gb/s reach capabilities, described in objective 1.5. **Category 7** is an ISO/IEC shielded cabling category associated with Class F channels and specified connecting hardware; an unverified retail Cat 7 label does not establish channel compliance. **Category 8** supports short 25GBASE-T/40GBASE-T data-center channels up to **30 m**, rather than a universal 100 m high-speed run.

#### Interface counters and port states

| Observation | What it can indicate | Next check |
| --- | --- | --- |
| Increasing CRC errors | Received frames fail the frame check | Check cable/connector/optic condition, interference, and compatible speed/duplex settings. CRC identifies corruption, not one unique cause. |
| Runts | Frames shorter than the expected Ethernet minimum, commonly 64 bytes including FCS | Check physical errors, legacy collision/duplex conditions, and platform counter definitions. |
| Giants | Frames exceed the interface's accepted frame-size limit | Compare intended MTU/jumbo/VLAN settings and the platform's accounting. A legitimate larger frame can be rejected by an inconsistent limit. |
| Drops | Packets/frames were discarded | Correlate queue load, buffer exhaustion, policy, and error counters. Drops alone do not prove a bad cable. |
| Administratively down | The interface was disabled by configuration | Check the intended state and approved change history before enabling it. |
| Error disabled | The platform shut down a port after detecting a protective condition | Inspect the logged cause, such as port-security, loop protection, or power faults. Correct the cause before resetting the condition. |
| Suspended | A port is excluded from a forwarding/bundle role by the platform | Inspect link-aggregation negotiation and compatible member settings, along with the reported reason. It is not automatically a physical break. |

Compare **counter changes over a measured interval** rather than assuming a historical error total describes the current incident. Speed/duplex mismatches can cause poor performance or failure; correctly operating full-duplex links should not show normal collision behavior. Do not force a setting at one endpoint without checking the other.

For **Power over Ethernet (PoE)**, verify the power source, supported standard, per-port capability, and total power budget. A budget can be exhausted even when each device is individually compatible. An AP may operate with reduced capabilities if its negotiated power is insufficient. A missing power indication, unsupported transceiver, and administratively disabled port require different repairs.

Related practice: [Network Setup & Cabling](../../../practice/pbqs/a-plus-core-1/network-setup-and-cabling/README.md), [SOHO Physical Installation](../../../practice/pbqs/a-plus-core-1/soho-physical-installation/README.md), and [Lab 1: Basic Network Configuration](../../../labs/networking/basic-network-configuration/README.md).

### 5.3 Network services troubleshooting

Start with the affected client's actual settings and compare a known-working path. One successful test narrows the question; it rarely verifies every service. Separate address assignment, local switching, routing, filtering, DNS, time, and application behavior.

| Finding | Likely area to investigate | Evidence that distinguishes it |
| --- | --- | --- |
| Wrong IP address or address from an unexpected range | Manual configuration, wrong VLAN, wrong pool, or rogue DHCP | Inspect address/mask, DHCP server/lease information, switch access VLAN, and approved IPAM records. A valid-looking private address can still belong to the wrong subnet. |
| Duplicate IPv4 address / intermittent access | Overlapping static/dynamic assignments or another conflicting host | Compare address ownership, DHCP bindings/reservations, and ARP/MAC observations over time. IPv6 Duplicate Address Detection can instead leave an address tentative/duplicate; it is not ARP. |
| Incorrect subnet mask/prefix | Wrong local-versus-remote decision | Apply the actual mask to the source/destination. A host might ARP for a destination that should go to a router, or send local traffic unnecessarily to a gateway. |
| Incorrect default gateway | Off-subnet traffic follows an unusable next hop | Same-subnet access can work while remote access fails. Check that the gateway is reachable on the intended link/subnet and that the host's route table uses it. |
| No new DHCP assignments / pool exhaustion | Server availability, exhausted scope, relay, filtering, or client VLAN | Check free leases, reservations/exclusions, DORA traffic, server service, and helper placement. Existing leased clients may work while new arrivals fail. |
| DNS failure or wrong answer | Resolver configuration, DNS service/transport, cache, zone data, or application-specific resolution | Compare an explicit DNS query with IP/service connectivity. `NXDOMAIN` reports a nonexistent queried name; timeout means no timely answer. An incorrect A/AAAA answer is another condition. |
| Missing route / wrong route selection | Router or host routing table | Apply longest-prefix matching, then examine the installed route's next hop and the remote return path. A default route is used only when no more specific installed route matches. |
| Incorrect VLAN / trunk behavior | Layer 2 membership or VLAN transport | Check access VLAN, local VLAN existence, allowed/native settings, and forwarding state. A physically active trunk can still omit one VLAN. |
| ACL or firewall blocks a flow | Rule action/order, source/destination, transport, interface, direction, or connection state | Compare the exact failed flow with rules, counters, and logs. Permitting ICMP or one port does not permit every service or its separate data/media channel. |
| IPv6 link-local works but remote IPv6 fails | Prefix, router advertisements, default route, access policy, or upstream path | Inspect a usable global/ULA address as intended, RA/default-router information, and IPv6 routes. Working IPv4 is a separate finding. |
| Clock-sensitive authentication/certificate errors | Time source, clock offset, certificate name/trust/validity, or identity service | Compare actual synchronized time with validity windows; an application can fail while network forwarding remains correct. |
| Target IP responds but one service does not | Service process/listener, local firewall, binding, TLS, or application policy | Check the intended TCP/UDP endpoint and application response. A listener bound only to loopback will not accept ordinary remote connections. |

#### Switching loops and spanning-tree interpretation

A Layer 2 loop can produce broadcast storms, MAC-table flapping, duplicate frames, high utilization, and widespread loss. Check the actual topology and STP state rather than unplugging random links. **Root bridge selection** uses bridge identifiers, including configured priority and a MAC-based component; the lowest applicable bridge identifier wins. An unintended root can produce inefficient forwarding paths even when the network remains loop-free.

**Port roles** describe a port's place in the spanning tree, such as root, designated, or an alternate path in rapid spanning tree. **Port states** determine whether it forwards frames or learns MAC addresses. Original STP includes blocking, listening, learning, forwarding, and disabled states; rapid spanning tree uses discarding, learning, and forwarding. A non-forwarding alternate port can be correct. Verify the intended root, roles, and convergence before overriding protection.

For a DNS-versus-gateway example, a Sales client in the Hub labs should use its own VLAN gateway, `192.168.10.1`. If it can reach Server0 at `192.168.30.10` by IP but querying `server.lab.local` times out, investigate DNS settings/service/transport. If it cannot reach its own gateway, investigate local link/VLAN/addressing first. ICMP filtering remains a possible reason for a failed ping, so corroborate it with other observations.

Practice the comparisons in [IP Configuration Troubleshooting](../../../practice/pbqs/a-plus-core-1/ip-configuration-troubleshooting/README.md), [Lab 2: VLAN Configuration](../../../labs/networking/vlan-configuration/README.md), [Lab 3: Static Routing](../../../labs/networking/static-routing/README.md), and [Lab 5: Centralized DHCP and DNS Services](../../../labs/networking/centralized-dhcp-dns/README.md).

### 5.4 Network performance troubleshooting

Measure performance at the time and location of the complaint. Compare the end-to-end result with interface counters, traffic load, wireless conditions, and the baseline. A high advertised link rate does not establish a healthy application path.

| Metric / condition | Meaning | Diagnostic implication |
| --- | --- | --- |
| Bandwidth / throughput capacity | The path or service's available carrying capacity | The narrowest relevant link or constrained resource limits useful performance; a 1 Gb/s access link does not overcome a 100 Mb/s WAN bottleneck. |
| Throughput | The amount of data actually transferred per unit of time | Protocol overhead, loss/retransmissions, competing traffic, endpoint processing, and application behavior can reduce it below the link rate. |
| Congestion / contention | Demand competes for limited forwarding capacity or shared airtime | Queues grow, delay increases, and packets can drop. Average utilization may hide bursts. On Wi-Fi, neighboring clients/APs sharing airtime contend even without a wired link at 100%. |
| Bottlenecking | One constrained part limits the whole path | Compare each segment/resource rather than replacing the fastest component. A firewall/VPN processing limit can bottleneck otherwise fast links. |
| Latency | Time required for traffic to travel; ping commonly reports round-trip time | High delay affects interaction. A round-trip measurement is not a one-way measurement and does not alone identify which hop is responsible. |
| Packet loss | Some expected packets do not arrive | Can arise from congestion, errors, interference, policy, or endpoint issues. TCP may retransmit, reducing useful throughput. |
| Jitter | Variation in packet delay | Variable arrival timing can impair voice/video even when average throughput is adequate. Compare delay variation and loss during the affected calls. |

A speed test estimates throughput between particular endpoints under particular conditions. It may be constrained by the remote server, test method, Wi-Fi, background traffic, or client capacity. Compare wired and wireless measurements, direction, time, and endpoint; one result does not prove the ISP is the fault.

#### Wireless symptoms

| Symptom / condition | What to inspect | Distinguishing point |
| --- | --- | --- |
| Channel overlap / interference | Channel widths, nearby WLANs, airtime use, and relevant RF sources | Adjacent-channel overlap differs from co-channel contention. Increasing channel width can reduce useful reuse in a dense environment. |
| Signal degradation/loss | Distance, obstacles, antenna orientation, client/AP power relationship, noise, and retries | Strong AP transmit power does not ensure that the AP hears the client's weaker return signal. |
| Insufficient coverage | Survey measurements at actual user locations | An uncovered area differs from a well-covered area with insufficient capacity. Adding power is not a universal repair. |
| Client disassociation | Client/AP logs, reason information, authentication, power, signal, and controller events | A disconnected client can result from RF loss or deliberate/session-related removal; association failure is different from a connected client with failed DHCP. |
| Roaming misconfiguration | SSID/security consistency, authentication behavior, VLAN/subnet design, coverage overlap, and client decisions | A client stuck on a distant AP or repeatedly reauthenticating may interrupt sessions. Identical SSID text alone does not guarantee seamless roaming. |

Broadcast storms from switching loops, incorrect link aggregation, CRC errors, speed/duplex mismatch, routing loops, MTU inconsistency, or a recent policy change can also degrade performance. Use their specific evidence from objectives 5.2 and 5.3. Distinguish **queue drops during load** from **CRC errors on the link**, and compare small-packet success with large-transfer behavior when MTU is suspected.

For example, clear voice at idle but poor voice during a backup points toward shared capacity/queueing. Check utilization, loss, jitter, flow data, and the actual bottleneck before adjusting QoS. A sudden error increase after moving a patch cable points toward physical evidence instead. Related practice: [Two-Site VoIP Troubleshooting](../../../practice/pbqs/a-plus-core-1/two-site-voip-cli/README.md) and [Wireless Coverage](../../../practice/pbqs/a-plus-core-1/wireless-coverage/README.md).

### 5.5 Troubleshooting tools and protocols

Choose a tool for a specific question, read its actual output, and compare it with the expected design. Commands below are real OS/device examples; installed tools, permissions, interface names, and supported options vary. Packet Tracer simulates a subset, so follow each Hub lab's documented controls when using that simulator. Diagnostic probes and captures should match the approved investigation scope.

#### Windows Command Prompt

| Command example | What to read | What it does not prove |
| --- | --- | --- |
| `ipconfig /all` | Adapter addresses, masks, gateways, DHCP information, DNS servers, and lease information where applicable | A listed configuration does not establish that the next hop or service is responding. Identify the affected adapter rather than another VPN/virtual interface. |
| `ping -n 4 192.168.10.1` | Four ICMP Echo tests, response times, and loss summary | Replies do not verify DNS or a TCP application. A timeout can reflect filtering or rate limiting. Substitute the actual gateway outside the lab. |
| `ping -6 ::1` | IPv6 loopback response | Tests the local stack, not a remote IPv6 route, cable, or gateway. |
| `tracert -d 192.168.30.10` | Responding hops as TTL/Hop Limit increases; `-d` avoids reverse-name lookups | Asterisks mean a probe did not receive the expected timely reply. An intermediate silent hop is not automatically a failed forwarding hop. |
| `nslookup server.lab.local 192.168.30.10` | Queries the specified DNS server; inspect answer/status and the responding server | Does not test whether every application uses that resolver or the hosts file. An unknown reverse name for the DNS server is different from a failed requested lookup. |
| `arp -a` | Cached IPv4 neighbor-to-MAC mappings associated with local interfaces | Does not list every remote internet host or show IPv6 neighbors. For a remote subnet, the local frame normally uses the gateway's MAC. |
| `netstat -ano` | Connections/listeners, numeric endpoints, TCP state, and process IDs | A local listener is not proof of remote access through every firewall. UDP endpoints do not have TCP connection states. |
| `route print` | IPv4/IPv6 routes, interfaces, next hops, and relevant metrics | An installed route can point to a failed path. Evaluate destination prefix and interface before assuming the default wins. |
| `ipconfig /displaydns` | Windows client resolver-cache entries | Cached information may differ from a new query to an authoritative server or an application's independent cache. |

`ipconfig /renew` requests renewal for DHCP-configured adapters. `ipconfig /release` discards the relevant leased configuration and can interrupt access; it is a configuration-changing action rather than a read-only test. `ipconfig /flushdns` clears dynamic client resolver-cache entries, but it cannot repair an incorrect DNS server, unreachable service, or bad authoritative record.

The `-n` option above counts requests on Windows ping. On Linux ping, `-n` suppresses name resolution; use `-c` for a count. Do not transfer flags between operating systems based only on a shared command name.

#### Linux command line

| Command example | What to read | Important distinction |
| --- | --- | --- |
| `ip address show` | Addresses, prefixes, interface association, and address state | Several addresses can belong to one interface. A tentative/duplicate IPv6 address is different from a usable one. |
| `ip link show` | Interface administrative/link information and MAC address | An administratively enabled interface is not necessarily carrying a healthy end-to-end path. |
| `ip route show` / `ip -6 route show` | IPv4/IPv6 routes and next hops | Check each family separately. IPv6 can fail while IPv4 works. |
| `ip neigh show` / `ip -6 neigh show` | Neighbor-cache entries and states | Covers local-link IPv4 ARP or IPv6 Neighbor Discovery information, not an inventory of every remote destination. |
| `ping -c 4 192.168.10.1` | Four ICMP tests and round-trip/loss statistics | Network policy and response limits can affect replies. Substitute the appropriate gateway for the actual environment. |
| `traceroute -n 192.168.30.10` | Responding hops without reverse-name lookup | Common Linux implementations use UDP probes by default, while Windows tracert uses ICMP Echo. Filtering and selected probe method can produce different results. |
| `dig @192.168.30.10 server.lab.local A` | DNS status, answer records, flags, and responding server | `NOERROR` can still have no record of the requested type. A valid AAAA/A difference can explain differing IPv6/IPv4 behavior. |
| `ss -tulpn` | Listening TCP/UDP sockets, numeric endpoints, and available process information | Process details may require privilege. A service bound to `127.0.0.1` or `::1` is limited to loopback. |
| `ifconfig` / `arp -a` / `route -n` | Legacy interface, IPv4 neighbor-cache, and numeric route information | These net-tools utilities may require installation; modern Linux commonly uses the `ip` suite. Linux `route -n` is different from Windows `route print`. |
| `netstat -tuln` | Legacy listening TCP/UDP endpoints with numeric addresses/ports | Often supplied by net-tools; `ss` is a common modern alternative. Windows netstat flags should not be assumed to have identical Linux meaning. |

Use `nslookup` on supported Windows/Linux installations for direct DNS queries; use `dig` for its detailed DNS-oriented output where installed. Windows does not include `dig` as a standard Command Prompt utility. For more context, see the [Windows Command-Line Reference](../../../reference/windows-command-line.md) and [Linux Command-Line Reference](../../../reference/linux-commands.md).

#### Captures, discovery, and measurement

A **protocol analyzer**, such as Wireshark, decodes captured traffic. It can show whether a DHCP offer was observed, which DNS answer arrived, or whether TCP retransmissions appear at the capture point. It does not automatically reveal encrypted application plaintext or packets outside that point's visibility.

For a Linux **tcpdump** example, first identify a capture interface with `tcpdump -D`. After substituting the correct interface name, this captures up to 20 packets matching a conventional DNS-port filter:

```bash
sudo tcpdump -i eth0 -nn -c 20 'port 53'
```

`-i` chooses the interface, `-nn` keeps host/port values numeric, and `-c 20` stops after 20 matching captured packets; use **Ctrl+C** if there is not enough matching traffic. The capture filter `port 53` selects relevant TCP/UDP port traffic, not all DoH/DoT queries. Wireshark **display filters** such as `dns` or `ip.addr == 192.168.30.10` select from captured packets using a different grammar. Applying a display filter does not prove other packets were never captured.

**Nmap** supports host discovery and service-port investigation. For example, `nmap -sT -p 443 192.168.30.10` performs a TCP connect scan of one selected port on one approved host; it does not assume the lab server actually runs HTTPS. **Open** indicates a responding listener for the tested port, **closed** indicates a responding endpoint without that listener, and **filtered** indicates that probes did not establish either condition because filtering/response behavior obstructed the test. An open port does not prove the expected application is healthy or correctly authenticated.

**LLDP** and **Cisco Discovery Protocol (CDP)** advertise supported directly connected neighbor/device information at the link layer. Use them to correlate a switch port with a neighbor and compare the cable map. A missing neighbor can reflect a disabled protocol or filtering rather than a disconnected cable. Supported Cisco commands include `show lldp neighbors detail` and `show cdp neighbors detail`; output/features depend on the model and software.

A **speed tester** measures traffic performance between selected endpoints. Record test direction, timing, link type, and competing load. It measures a particular path under those conditions, not every application or an unlimited capacity guarantee.

#### Hardware tools

| Tool | Best suited to | Limit |
| --- | --- | --- |
| Toner and probe | Tracing an identified copper cable through outlets/panels using a compatible tone source/probe | Does not certify Ethernet category or throughput. Choose a tool suitable for the circuit and its active/power condition. |
| Cable tester | Checking wire map, continuity, opens, shorts, reversals, or split pairs according to the tool | Basic testers, qualifiers, and certifiers have different capabilities; a simple continuity pass is not a category-certification result. |
| Network tap (TAP) | Supplying copies of traffic from a chosen link to an analyzer | Design, medium, direction, capacity, and installation determine visibility. It differs from configuring a switch's mirror destination. |
| Wi-Fi analyzer | Examining WLAN channels, SSIDs/BSSIDs, signal observations, and supported utilization information | Does not necessarily identify every non-Wi-Fi interference source or measure every client's experience. |
| Visual fault locator (VFL) | Using visible light to help locate certain fiber breaks, bends, or continuity/polarity problems | Does not replace optical loss/power measurement or certify the intended high-speed link. |

#### Basic network-device command families

CompTIA lists generic command families; exact syntax differs between vendors and releases. The right column uses common **Cisco IOS privileged EXEC** examples. It does not imply that every device supports every feature or that the generic wording is a literal universal command.

| Objective-style wording | Cisco IOS example | What to inspect |
| --- | --- | --- |
| `show mac-address-table` | `show mac address-table` | Learned MAC/VLAN/port associations. Compare with the expected endpoint path; an empty entry can age out and is not proof of a broken port. |
| `show route` | `show ip route` | Installed IPv4 prefixes, source, next hop, and distance/metric information. |
| `show interface` | `show interfaces GigabitEthernet0/1` | Interface/protocol state, speed/duplex information, counters, and rates available on that platform. |
| `show config` | `show running-config` | Current configuration. Compare with `show startup-config` for saved boot settings rather than assuming they match. |
| `show arp` | `show ip arp` | IPv4 neighbor mappings, associated interfaces, and available age/state information. |
| `show vlan` | `show vlan brief` | VLAN existence and access-port membership. Use `show interfaces trunk` to inspect trunk transport. |
| `show power` | `show power inline` | PoE allocation/status on a supported PoE-capable switch. The non-PoE lab switch does not acquire this capability from a command. |

For switching diagnosis, supported commands such as `show spanning-tree vlan 10` and `show interfaces status` provide additional role/state or port-status evidence. The [Packet Tracer labs](../../../labs/networking/README.md) specify the model, interfaces, commands, and expected checks for each exercise. Compare your results with those checks and investigate differences before changing settings.

## Technical sources

- [CompTIA Network+ N10-009 objectives, document version 6.0](https://lecbyo.files.cmp.optimizely.com/download/35a7403ab73211ef9dcda6f347fbf652): objective scope, numbering, and domain weights.
- [IANA service names and port numbers](https://www.iana.org/assignments/service-names-port-numbers/): registered service/transport associations.
- [IANA protocol numbers](https://www.iana.org/assignments/protocol-numbers/): IP payload identifiers, distinct from transport ports.
- [RFC 6409: Message Submission for Mail](https://www.rfc-editor.org/rfc/rfc6409.html): submission on port 587.
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918.html) and [RFC 3927: IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927.html): private and link-local addressing.
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737.html): public-style example addresses.
- [RFC 8200: IPv6 Specification](https://www.rfc-editor.org/rfc/rfc8200.html): IPv6 packet and forwarding behavior.
- [RFC 7348: VXLAN](https://www.rfc-editor.org/rfc/rfc7348.html): Layer 2 overlays on routed networks.
- [Cisco: Understand Administrative Distance](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html): route-source preference, metrics, and longest-prefix forwarding.
- [AWS: VPC infrastructure security](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html) and [Oracle: Security Rules](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securityrules.htm): provider-specific network rule scope and state tracking.
- [Cisco: Wireless RF Reference Guide](https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wireless-rf-reference-guide.html) and [802.11h, TPC, and DFS](https://www.cisco.com/c/en/us/support/docs/wireless-mobility/80211/200069-Overview-on-802-11h-Transmit-Power-Cont.html): wireless bands, coverage, and regulatory mechanisms.
- [RFC 2131: DHCPv4](https://www.rfc-editor.org/rfc/rfc2131.html) and [RFC 4862: SLAAC](https://www.rfc-editor.org/rfc/rfc4862.html): address-assignment and lease/autoconfiguration behavior.
- [RFC 1034: DNS concepts](https://www.rfc-editor.org/rfc/rfc1034.html), [RFC 4033: DNSSEC](https://www.rfc-editor.org/rfc/rfc4033.html), [RFC 7858: DoT](https://www.rfc-editor.org/rfc/rfc7858.html), and [RFC 8484: DoH](https://www.rfc-editor.org/rfc/rfc8484.html): DNS hierarchy and distinct security mechanisms.
- [RFC 3414: SNMP user-based security](https://www.rfc-editor.org/rfc/rfc3414.html) and [RFC 3416: SNMP operations](https://www.rfc-editor.org/rfc/rfc3416.html): management security and notifications.
- [RFC 8915: Network Time Security](https://www.rfc-editor.org/rfc/rfc8915.html): NTS key establishment and protected NTP exchanges.
- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final), [PCI DSS](https://www.pcisecuritystandards.org/standards/pci-dss/), and the [European Commission's data-protection framework](https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en): security architecture and compliance context.
- [Microsoft Windows commands](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands): platform-specific syntax and behavior for the Windows examples.
- [Linux ip](https://man7.org/linux/man-pages/man8/ip.8.html), [ss](https://man7.org/linux/man-pages/man8/ss.8.html), and [tcpdump](https://man7.org/linux/man-pages/man1/tcpdump.1.html) manuals: Linux interface, socket, and capture examples.
- [Wireshark display filters](https://www.wireshark.org/docs/wsug_html_chunked/ChWorkBuildDisplayFilterSection.html) and the [Nmap reference guide](https://nmap.org/book/man.html): capture interpretation and discovery/port-state behavior.
- [Cisco IP ACL guidance](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html), [LLDP configuration](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/cdp-lldp-mac-udld/cdp-lldp-mac-udld-configuration-guide/c-configure-lldp.html), and [interface command reference](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/interface/command/ir-cr-book/ir-s4.html): filtering and device diagnostics.
- [Fluke Networks: Category 8 cable testing](https://www.flukenetworks.com/expertise/learn-about/category-8-cable-testing): short-channel copper applications and test capabilities.

[Back to Network+](README.md) · [Student Hub](../../../../README.md)
