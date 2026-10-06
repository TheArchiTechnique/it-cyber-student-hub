# Ports & Protocols: How Services Communicate

A technician needs more than a port number: identify the service a user needs, choose its transport, and recognize what a failure would interrupt. This lesson covers the ports and services in A+ Core 1 220-1201 objective 2.1, using original explanations. The [official CompTIA objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf) define the exam scope.

## Start with the destination

An IP address identifies a host. A TCP or UDP port identifies a service endpoint on that host. A server can provide several services at one IP address because each listens on its own port.

For example, a browser might send from temporary client port 52014 to server TCP port 443. Replies return from server port 443 to client port 52014. The client does not normally use 443 as its own source port. DHCP is an important exception to the temporary-client-port pattern: it has assigned ports for both sides.

A firewall rule must distinguish **TCP 53** from **UDP 53**. The number alone does not specify the transport. These are default service associations; an administrator can configure a different port, so an open port is a clue rather than proof of which application is running.

## TCP and UDP

| Behavior | TCP | UDP |
| --- | --- | --- |
| Connection | Connection-oriented: establishes a connection before exchanging application data | Connectionless: sends datagrams without a transport handshake |
| Reliability | Uses acknowledgments and retransmission to recover missing data | Does not provide delivery acknowledgments or retransmission itself |
| Ordering | Delivers an ordered byte stream to the application | Datagrams may arrive out of order or not arrive |
| Overhead | Connection setup, state, and recovery add work and traffic | Smaller transport header and no connection setup |
| Practical fit | Transfers where complete, ordered data matters | Short exchanges or applications that manage timing and recovery themselves |

TCP detects missing data and retransmits it while the connection remains usable. It cannot guarantee success when a network or endpoint fails. UDP's lower overhead does not guarantee that every UDP application is faster than every TCP application. Applications using UDP can add their own retries, ordering, or reliability.

Neither TCP nor UDP automatically encrypts application data. SSH and HTTPS provide protection through their own security mechanisms; Telnet and plain FTP do not become secure because they use TCP.

### Why can a service use both?

A service can define different exchanges over different transports. DNS commonly uses UDP for ordinary queries and also supports TCP, including larger responses and zone transfers. A response too large for the permitted UDP size can be marked truncated, causing the client to retry over TCP. Not every large response requires TCP because DNS extensions allow larger UDP messages.

LDAP generally uses TCP for directory operations; connectionless LDAP over UDP supports certain implementation-specific uses, such as locating a Windows domain controller. NetBIOS/NetBT is a group of services with different transport needs, not one conversation that uses every port interchangeably.

## Web access

### HTTP: TCP 80

HTTP carries web requests and responses without TLS encryption. A technician may encounter an older internal device's browser interface at an `http://` address. For example, a printer's status page may be reachable on TCP 80. Plain HTTP can expose submitted information to someone who can observe the traffic.

### HTTPS: TCP 443

HTTPS protects web communication with TLS. Technicians encounter it in websites, management portals, and browser-based applications. For example, an employee signing into a payroll website normally connects to TCP 443. Encryption protects traffic in transit; it does not prove that a website is trustworthy.

Remember **HTTP 80 / HTTPS 443** as a related pair. This lesson practices the Core 1 TCP association. Modern HTTP/3 can also carry HTTPS over QUIC using UDP 443; that does not change the TCP 443 association practiced here.

## Remote access

### SSH: TCP 22

SSH provides encrypted remote command-line access. A technician might use it to manage a Linux server or a network device. For example, an administrator opens a terminal session to restart a service on a remote Linux host. SSH protects the session, including authentication traffic.

### Telnet: TCP 23

Telnet provides remote text-terminal access without encryption. A technician may encounter it on a legacy switch. For example, an old management interface may accept terminal connections on TCP 23, but its credentials and commands can be exposed. Prefer a supported secure method such as SSH when managing equipment.

### RDP: TCP 3389

RDP provides a remote graphical desktop. A technician might use it to work with Windows applications and settings on a remote workstation. For example, opening a Windows desktop session to change an application setting points to RDP, whereas issuing Linux shell commands points to SSH. Modern RDP can also use UDP 3389; TCP 3389 remains the baseline association practiced here.

**Choose by the task:** protected command line → SSH; legacy unencrypted terminal → Telnet; graphical remote desktop → RDP. A port number alone is not a reason to expose management access directly to the internet.

## File transfer and sharing

### FTP: TCP 20/21

FTP transfers files between a client and server. A technician may encounter it in a legacy upload workflow, such as sending a file to an older equipment server. Plain FTP exposes credentials and file contents; it is not a secure transfer method.

- **TCP 21 carries control commands**, including login and transfer requests.
- **TCP 20 is traditionally the server's data source port in active mode.** The server initiates the data connection to the client.
- In passive mode, the client opens the data connection to a separate server port negotiated over the control connection. Do not assume all FTP data travels to destination port 20.

If login succeeds but a directory listing or download stalls, the separate data connection deserves investigation. Allowing the control connection alone may not allow data transfer.

### SMB/CIFS: TCP 445

SMB supports shared folders, files, and printers across a network. A technician encounters it when mapping a network drive or opening a share such as `\\fileserver\team`. For example, users editing documents in a departmental share rely on SMB rather than an FTP upload session.

CIFS refers to an older SMB dialect. Recognize the exam association without recommending obsolete SMB1/CIFS deployment. Modern SMB versions offer stronger security features; encryption depends on configuration and version.

**FTP vs. SMB:** FTP is a file-transfer session with separate control and data connections; SMB provides ongoing access to shared network resources.

## Email delivery and retrieval

### SMTP: TCP 25

SMTP sends and relays email. TCP 25 is commonly used between mail servers. A technician might investigate a mail relay that cannot deliver messages to another server. For example, outgoing messages can remain queued if that relay connection is blocked.

### POP3: TCP 110

POP3 retrieves messages from a server, often for local storage on one client. A technician encounters it in older email account configurations. For example, a desktop downloads messages into its local mailbox. POP3 clients can leave copies on the server; deletion is a setting, not an unavoidable feature of the protocol.

### IMAP: TCP 143

IMAP manages a mailbox stored on the server, synchronizing folders and message state across clients. A technician encounters it when a user expects their phone and laptop to show the same folders and read/unread state. For example, reading a message on one device can update its state on another.

Group these by direction: **SMTP sends; POP3 retrieves; IMAP synchronizes a server mailbox**. The base port mappings above do not guarantee encryption. Actual account setup must follow the provider's TLS and submission settings rather than assuming these base ports are sufficient for secure email.

## Addressing and name lookup

### DNS: TCP/UDP 53

DNS looks up records associated with names, including IP addresses. Technicians encounter it when a hostname fails but the same service works by IP address. For example, if a file server is reachable by address but `fileserver.example.net` cannot be resolved, check the client's DNS configuration and name lookup results.

Ordinary queries commonly use UDP 53. TCP 53 is also supported, including for responses requiring TCP and zone transfers between DNS servers. Blocking TCP 53 can cause selective DNS failures even when small queries work.

### DHCP: UDP 67/68

DHCP automatically leases IP configuration to clients, usually including an IPv4 address, subnet mask, default gateway, and DNS server addresses. Technicians encounter it when a new device joins an office network or a client cannot obtain a lease. For example, a laptop with automatic IPv4 configuration may assign itself a 169.254.x.x address when it cannot obtain a DHCP lease.

| Side receiving the message | Destination port | Example |
| --- | --- | --- |
| DHCP server | UDP 67 | Client sends a lease request from UDP 68 |
| DHCP client | UDP 68 | Server sends a lease reply from UDP 67 |

Remember the roles as **67 server / 68 client**. DNS answers a name question; DHCP supplies network settings. DHCP can supply the address of a DNS server, but it does not perform the client's name lookups.

## Directories and legacy Windows networking

### LDAP: TCP/UDP 389

LDAP accesses directory information such as user, group, and computer records. A technician might encounter it when an application searches a company directory. For example, a staff lookup tool can query a directory for a user's department. Directory access can support authentication workflows, but LDAP is not simply a general file-sharing service.

TCP 389 is typical for directory queries and updates. UDP 389 is used for connectionless LDAP in certain implementations, such as Windows domain-controller discovery. Port 389 alone does not promise encryption; protection depends on the connection's security configuration.

### NetBIOS / NetBT: TCP/UDP 137–139

NetBT carries legacy NetBIOS services over TCP/IP. A technician may see it when troubleshooting older Windows name resolution or file-sharing sessions. For example, a legacy client might find a computer by NetBIOS name before establishing a session.

| Port | Transport | Role |
| --- | --- | --- |
| 137 | UDP commonly; TCP is also defined | Name service |
| 138 | UDP | Datagram service |
| 139 | TCP | Session service, historically including SMB over NetBT |

The range uses both transports collectively. It does **not** mean every port uses both. Modern direct-hosted SMB uses TCP 445 without requiring the legacy NetBT session path.

## Put the clues together

| Task or symptom | First service to consider | Key comparison |
| --- | --- | --- |
| Need a protected command shell | SSH, TCP 22 | Telnet 23 is unencrypted; RDP 3389 provides a desktop |
| Need matching mailbox folders on several devices | IMAP, TCP 143 | POP3 110 focuses on retrieval; SMTP 25 sends mail |
| Service works by IP but not hostname | DNS, port 53 | DHCP supplies settings rather than resolving names |
| New client cannot obtain an address lease | DHCP, UDP 67/68 | Check server/client direction |
| Mapped network folder fails | SMB, TCP 445 | FTP 20/21 transfers files in a separate session |
| FTP login works but download fails | FTP data connection | Port 21 control success does not prove data connectivity |

A symptom guides your next test; it does not prove the root cause. Check the service, configuration, and relevant traffic before changing firewall rules.

Practice in groups: web (80/443), remote access (22/23/3389), mail (25/110/143), files (20/21/445), name and address services (53/67/68), then directory and legacy services (389/137–139). For each, say the function, port, and transport together.

[Launch the practice activity](../../practice/pbqs/a-plus-core-1/ports-and-protocols/README.md) · [Quick reference](../../reference/ports-and-protocols.md)

## Technical sources

- [CompTIA A+ Core 1 objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf)
- [DNS transport behavior: RFC 7766](https://www.rfc-editor.org/rfc/rfc7766.html)
- [FTP control and data connections: RFC 959](https://www.rfc-editor.org/rfc/rfc959.html)
- [Microsoft service and port requirements](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/service-overview-and-network-port-requirements)

[Back to Networking](README.md) · [Student Hub](../../../README.md)
