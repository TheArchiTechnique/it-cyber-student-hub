---
hub:
  kind: resource
---
# Ports & Protocols

Quick lookup for the A+ Core 1 220-1201 services. Use the [lesson](../learn/networking/ports-and-protocols.md) for explanations and the [interactive activity](../practice/pbqs/a-plus-core-1/ports-and-protocols/README.md) to practice decisions.

| Service | Default port(s) | Transport | Recognize the purpose |
| --- | --- | --- | --- |
| FTP | 20/21 | TCP | File transfer; 21 control, 20 traditionally active-mode server data source |
| SSH | 22 | TCP | Encrypted remote command line |
| Telnet | 23 | TCP | Unencrypted legacy remote terminal |
| SMTP | 25 | TCP | Send/relay email, especially server to server |
| DNS | 53 | TCP/UDP | Name and record lookup |
| DHCP | 67/68 | UDP | Lease IP settings; 67 server, 68 client |
| HTTP | 80 | TCP | Web traffic without TLS |
| POP3 | 110 | TCP | Retrieve mail for a client |
| NetBIOS / NetBT | 137–139 | TCP/UDP across the service family | Legacy name, datagram, and session services |
| IMAP | 143 | TCP | Synchronize a server mailbox |
| LDAP | 389 | TCP/UDP | Access directory information; transport depends on use |
| HTTPS | 443 | TCP | Web traffic protected with TLS |
| SMB/CIFS | 445 | TCP | Network file and printer sharing |
| RDP | 3389 | TCP | Remote graphical desktop |

## Details that prevent mistakes

- **TCP:** connection-oriented, acknowledgments, ordered delivery, and retransmission. More transport overhead; not automatic encryption or guaranteed success through an outage.
- **UDP:** connectionless, lower transport overhead, no built-in acknowledgments, ordering, or retries. Applications may provide those features themselves.
- **DNS:** UDP is common for queries; TCP also supports queries, larger responses, and zone transfers. Larger UDP replies are possible; truncated replies can trigger a TCP retry.
- **FTP:** passive data uses a negotiated server port. Do not treat TCP 20 as the destination for all file data. Plain FTP and Telnet are insecure.
- **DHCP:** client 68 → server 67; server 67 → client 68, using UDP.
- **NetBT:** 137 name service (commonly UDP, TCP also defined); 138 UDP datagrams; 139 TCP sessions. The range does not mean both transports on every port.
- **LDAP:** TCP is typical; UDP connectionless LDAP supports specific uses such as domain-controller discovery.
- **HTTPS/RDP:** the table gives the baseline TCP associations practiced here. HTTP/3 can use UDP 443; modern RDP can also use UDP 3389.
- **Mail:** SMTP sends; POP3 retrieves (and can leave server copies); IMAP synchronizes folders and state. Base ports do not guarantee encryption; follow provider TLS settings.
- **SMB:** TCP 445 directly hosts SMB. CIFS is an older dialect, not a recommendation to enable obsolete SMB1.

Ports are defaults, not proof of an application. A rule must name both the transport and port.

[Full lesson](../learn/networking/ports-and-protocols.md) · [Practice activity](../practice/pbqs/a-plus-core-1/ports-and-protocols/README.md) · [Official objectives](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1201-exam-objectives.pdf)

[Back to Reference](README.md) · [Student Hub](../../README.md)
