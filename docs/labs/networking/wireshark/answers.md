---
description: "Review verified packet fields, protocol behavior, and the optional document-service investigation."
hub:
  kind: resource
template: article.html
---
# Wireshark Lab: Answers and Explanations

Complete the [student activity](README.md) before opening these solutions. All frame numbers refer to the supplied [office-network.pcap](assets/office-network.pcap). Filters preserve original frame numbers. Times below are seconds since the first packet, with UTC equivalents where useful.

## A. Read the selected packet

### A1. Requesting device and destination

**Answer:** frame **52** travels from **pc1, `10.20.30.101`**, to the intranet server, **`10.20.30.20`**. pc1 is making the HTTP request.

**Inspect:** use `tcp.port == 53224`, select frame 52, and expand **IPv4 → Source/Destination**, **TCP → Source/Destination Port**, and **HTTP → Request Method**. The transport pair is **53224 → 80**; the readable `GET` confirms application-request direction. Ethernet source/destination MACs identify the local link endpoints. Here both hosts share one LAN, so the server's MAC is the destination rather than the gateway's. A Protocol column reading HTTP does not mean the IPv4 and TCP headers are absent.

### A2. Local subnet and gateway

**Answer:** frame **7** assigns **`10.20.30.101`**, mask **`255.255.255.0`**, on **`10.20.30.0/24`**. The gateway is **`10.20.30.1`**, supplied in **DHCP Option 3, Router**.

**Inspect:** `dhcp.id == 0x90090001`; expand **Your (client) IP address**, **Option 1 Subnet Mask**, and **Option 3 Router** in frame 7. DHCP uses UDP, server **67** and client **68**. The mask makes the first 24 bits the network portion. The DHCP server's source address, `10.20.30.10`, is not the default gateway simply because it sends the configuration. A default gateway is used for off-subnet destinations; same-subnet traffic can go directly to its local destination.

## B. ARP and local delivery

### B1. Request, reply, and mapping

**Answer:** frame **14** is a broadcast ARP request from pc1; frame **15** is the unicast reply. The reply maps **`10.20.30.1` → `02:00:00:20:30:01`**.

**Inspect:** `arp`; compare **Ethernet Destination**, **ARP Opcode**, **Sender IP/MAC**, and **Target IP/MAC**. Frame 14's Ethernet destination is **`ff:ff:ff:ff:ff:ff`**, asking who has `10.20.30.1`. Frame 15 supplies the gateway's mapping and targets pc1's **`02:00:00:20:30:65`** MAC. ARP is carried directly in Ethernet, with **no TCP/UDP ports**. It resolves a local next-hop MAC; it does not discover an IP route or resolve the MAC of an arbitrary remote Internet host. The reply is sent to the requester rather than broadcast to everyone.

## C. DHCP

### C1. DORA and assigned address

| Frame | DHCP Option 53 | Interpretation |
| --- | --- | --- |
| **1** | Discover, value 1 | The client looks for a DHCP server before it has an address. |
| **3** | Offer, value 2 | The server offers `10.20.30.101`. |
| **5** | Request, value 3 | The client requests that address and identifies the selected server. |
| **7** | ACK, value 5 | The server acknowledges the lease and supplies configuration. |

**Inspect:** `dhcp.id == 0x90090001`; compare the **Transaction ID**, **Option 53**, frame 5's **Option 50 Requested IP Address**, and frames 3/7's **Your (client) IP address**. The client requests and receives **`10.20.30.101`**. Offer and ACK are different stages; an offer alone does not complete assignment. Discover and Request both use the BOOTP **Boot Request** header value, so that header cannot distinguish the DORA stages. The initial `0.0.0.0` source and broadcast destinations are expected during address acquisition, not evidence of a broken address assignment.

### C2. DNS, lease duration, and ports

**Answer:** the DNS server is **`10.20.30.10`**. The lease is **28,800 seconds, or 8 hours**. The DHCP server uses **UDP 67** and the client **UDP 68**.

**Inspect:** frame **7**, filter `dhcp.id == 0x90090001`; expand **Option 6 Domain Name Server**, **Option 51 IP Address Lease Time**, and **UDP ports**. Frames 1/5 use 68 → 67, while frames 3/7 use 67 → 68. The lease duration is not a DNS TTL and is not the amount of time required to obtain an address. DHCP provides the resolver's address; it does not itself perform the later name lookup.

## D. DNS

### D1. Matching a successful answer

**Answer:** frame **45** requests an **A record** for **`intranet.office.test`**. Frame **46** returns **`10.20.30.20`**.

**Inspect:** `dns.id == 0x4a3e`; expand **Transaction ID**, **Flags**, **Queries**, and **Answers**. Both share transaction ID **`0x4a3e`** and the same question. The reply flag is set in frame 46, its response code is **No error**, and its Answer contains the requested A record. An A record maps a name to IPv4; an AAAA record maps to IPv6. “No error” alone would not guarantee the requested address was returned: also inspect the actual answer. Name resolution success does not prove the web application is accepting connections.

### D2. Query and reply ports

**Answer:** the query uses client **UDP 62894 → server UDP 53**. Its response reverses that to **53 → 62894**.

**Inspect:** frames **45–46**, filter `dns.id == 0x4a3e`, and **UDP Source/Destination Port** alongside the DNS transaction ID. The client's ephemeral source port identifies its local application endpoint, allowing the answer to return to the correct socket. It is not another DNS server port. Use addresses, ports, question, transaction ID, and order together to correlate the exchange; an ID alone is not globally unique. This example uses UDP, but DNS can also use TCP 53.

## E. TCP and HTTP

### E1. Connection establishment and closing

**Answer:** **49 SYN → 50 SYN/ACK → 51 ACK** establishes the connection. pc1 initiates it from **`10.20.30.101:53224`** to **`10.20.30.20:80`**. Frame **61** carries **FIN/ACK**, beginning an orderly close.

**Inspect:** `tcp.port == 53224`, then expand **TCP → Flags**, **Sequence Number**, and **Acknowledgment Number**. Wireshark's relative values begin with the client SYN at sequence 0; the server acknowledges sequence 1 because SYN consumes one sequence number. The client then acknowledges the server SYN. FIN also consumes sequence space and requests closing; it is different from an immediate reset. ACKs also appear throughout data transfer, so a packet with ACK set is not automatically the third handshake packet. Establishment must be interpreted in context and order.

### E2. Readable application request and response

**Answer:** frame **52** contains **`GET / HTTP/1.1`**, with Host **`intranet.office.test`**. Frame **59** returns **HTTP 200 OK**.

**Inspect:** `tcp.port == 53224`; expand **Hypertext Transfer Protocol → Request Method/URI/Host** in frame 52 and **Status Code** in frame 59. These are application fields inside a TCP payload, and their text appears in Packet Bytes. The Host header tells the web server the requested host name; the IPv4 destination supplies network addressing. HTTP 200 indicates a successful HTTP response in this exchange, not that every service on the host is healthy. The response's transport ports reverse: server **80 → client 53224**.

### E3. Transport versus application

**Answer:** frames **49–51** establish reliable TCP communication before the HTTP request in **52**. They contain **zero TCP payload bytes**, so they are not HTTP requests.

**Inspect:** `tcp.port == 53224`; compare **TCP Segment Len**, **Flags**, and the presence or absence of an **HTTP** tree. TCP manages the ordered byte stream, acknowledgments, and connection state. HTTP gives those bytes application meaning, such as a request method or response status. Port 80 suggests the usual HTTP service, but it does not cause every packet in that connection to contain an HTTP message. This is why `http` omits the pure TCP handshake and acknowledgments, while the port filter includes them.

## F. TLS and HTTPS

### F1. Handshake and negotiated version

**Answer:** frame **133** is the **Client Hello**, and **135** contains the **Server Hello**, certificate, and remaining server handshake records. The negotiated version is **TLS 1.2**, carried over **TCP 443** in this HTTPS exchange.

**Inspect:** `tcp.port == 50986`; expand **TLS → Handshake Protocol: Client Hello** in frame 133 and **Server Hello → Version** in frame 135. Client `10.20.30.102` uses ephemeral port **50986** to contact `10.20.30.20:443`. Frames **130–132** are the separate TCP handshake that comes first. A Client Hello row can display **TLSv1** because of its legacy record-layer version; use the Server Hello's selected version **`0x0303`** to establish TLS 1.2 here. A TCP SYN is not a TLS Client Hello.

### F2. Visible metadata and encrypted content

**Answer:** Ethernet/IP addresses, TCP ports, flags, timing, and lengths remain visible. This TLS 1.2 handshake also exposes the server name **`intranet.office.test`** and the server certificate. Frames **141/143** carry encrypted **Application Data**; the HTTP request cannot be read like frame 52's plaintext request.

**Inspect:** `tcp.port == 50986`, including frames **133, 135, 141, and 143**. Expand **TLS Record Layer** and compare Packet Bytes with HTTP in frame 52. The dataset does not include the TLS session secrets required for decryption. A label such as **Application Data Protocol: Hypertext Transfer Protocol** identifies the expected application; it does not mean the payload is decrypted. The handshake, port, and metadata still support connection analysis. Visibility differs with TLS version and features, so do not assume every TLS handshake exposes exactly the same information as this example.

## G. Other services

### G1. ICMP reachability

**Answer:** frame **71** is **Echo Request, type 8**, from pc1 to **`10.20.30.1`**; **72** is **Echo Reply, type 0**, in reverse. Their identifier **`0x4100`** and sequence **1** match.

**Inspect:** `icmp.ident == 0x4100`; expand **ICMP Type**, **Identifier**, and **Sequence Number**. The pair establishes an ICMP round trip to the gateway at that moment. It does not test DNS, HTTP, a TCP listening port, or access to an off-subnet host. ICMP belongs directly inside IP, not TCP/UDP; there is no “ping port.” A ping reply is therefore useful reachability evidence but not proof that an application works.

### G2. NTP timestamp correlation

**Answer:** frames **75/76** are **NTP**, time synchronization over **UDP**, with the server at **`10.20.30.10:123`** and client `10.20.30.101:53000`. The response's **Originate Timestamp** matches the request's **Transmit Timestamp**.

**Inspect:** `ntp`; compare **Mode** (client 3, server 4), timestamps, and **UDP ports**. The request transmits at UTC **14:00:07.900**; the response copies that timestamp as its origin reference. The server also records receive/transmit timestamps, enabling time calculations. The reply's stratum is **2**. This is a clock service, not a connectivity echo or a lease exchange. Do not confuse UDP 123 with the client's selected port or assume one response alone proves long-term clock accuracy.

### G3. SNMP monitoring

**Answer:** the monitor **`10.20.30.40:52000`** queries switch **`10.20.30.2:161`** over UDP. Frames **73/74** share **request ID 1**. The requested value is **`sysUpTime.0`**, OID **`1.3.6.1.2.1.1.3.0`**; the response is **8,640,660 TimeTicks**, or **86,406.60 seconds** since the management portion was initialized.

**Inspect:** `snmp`; expand **GetRequest/GetResponse → request-id → variable-bindings**. Each TimeTick is one hundredth of a second. The reply reverses addresses/ports and returns a value for the same OID. This is an **SNMPv2c** teaching exchange using fictional community `lab-readonly`, not a real credential. Polling an agent on UDP 161 differs from unsolicited notifications conventionally sent to UDP 162. Do not read TimeTicks directly as seconds or equate management uptime with proof that every attached device is healthy.

### G4. Centralized event logging

**Answer:** frame **2** sends a Syslog message from switch **`10.20.30.2`** to collector **`10.20.30.40`**, using **UDP 5514 → 514**. It uses facility **LOCAL0 (16)** and severity **Informational (6)**. Message ID **`LINK_UP`** reports **Gi1/0/3 operational state up; pc3 workstation link active**.

**Inspect:** `syslog && ip.src == 10.20.30.2`; expand **UDP** and **Syslog → Facility/Level/Hostname/Message ID/Message**. Frame **392** provides another normal switch-health event. The message text explains the sender's reported state; the UDP header alone only supplies transport addressing. Syslog here is **UDP 514**, unlike remote-shell TCP 514 or encrypted Syslog conventions. UDP provides no delivery acknowledgment. The separate log's **line 1** matches frame 2's payload exactly; UTC Z time can be displayed in local time by Wireshark.

### SMB comparison

`tcp.port == 445` is a valid filter with **zero matches** in this capture. No SMB session is present. The document service is HTTP, demonstrated by frames **82/84** and the later recovery. Do not invent an SMB negotiation from a file-server role or a familiar port.

## Bonus: Troubleshooting Investigation

### 1. Symptom and diagnosis

The client briefly cannot establish TCP to the document service at **`10.20.30.30:80`**. It receives an immediate refusal rather than an HTTP error response or a silent timeout. The best-supported diagnosis is **temporary unavailability of the server's HTTP listener**. The logs explicitly record its stop and later start. The evidence does **not** establish why it stopped.

### 2–3. Packet and log timeline

Use `ip.addr == 10.20.30.30` for server traffic and `syslog` for logs. DNS packets go between the client and resolver, so the server-address filter does not include them: separately use `dns.id == 0xdc04`.

| Relative / UTC time | Evidence | Interpretation |
| --- | --- | --- |
| **73.800 / 14:01:13.800Z** | Frame **227**, log **line 3**, `HTTP_STOP` | Server reports its document HTTP service stopped and TCP 80 listener closed. Severity is Notice (5). |
| **74.000–74.012 / 14:01:14.000–14.012Z** | Frames **228–229** | DNS question and successful A answer for `files.office.test` → `10.20.30.30`. |
| **74.080 / 14:01:14.080Z** | Frame **230** | pc1 sends SYN from `10.20.30.101:54821` to `10.20.30.30:80`. |
| **74.083 / 14:01:14.083Z** | Frame **231** | Destination replies RST/ACK from 80 to 54821, acknowledging the SYN's sequence plus one. No successful TCP handshake or HTTP request follows in this attempt. |
| **83.900 / 14:01:23.900Z** | Frame **234**, log **line 4**, `HTTP_START` | Server reports the document HTTP service listening again on `10.20.30.30:80`. |
| **84.100–84.124351 / 14:01:24.100–24.124351Z** | Frames **235–237** | New client port **60483** completes SYN, SYN/ACK, ACK with server port 80. |
| **84.133765 / 14:01:24.133765Z** | Frame **238** | Client sends `GET /sample-file.txt` to `files.office.test`. |
| **84.251281 / 14:01:24.251281Z** | Frame **240** | Server returns **HTTP 200 OK**. |
| **85.000 / 14:01:25.000Z** | Frame **246**, log **line 5**, `HTTP_OK` | Server logs a completed status-200 request from pc1. Severity is Informational (6). |

In Packet Details, inspect **DNS Response Code/Answers**, **TCP flags/ports/acknowledgments**, **HTTP method/status**, and **Syslog Message ID/Message**. The corresponding raw `.log` lines are:

```log
<133>1 2026-11-23T14:01:13.800Z files.office.test lab-service - HTTP_STOP - Document HTTP service stopped; TCP port 80 listener closed
<133>1 2026-11-23T14:01:23.900Z files.office.test lab-service - HTTP_START - Document HTTP service started; listening on 10.20.30.30:80
<134>1 2026-11-23T14:01:25.000Z files.office.test lab-service - HTTP_OK - GET /sample-file.txt from 10.20.30.101 completed status=200
```

### 4. Compare possible explanations

- **DNS failure:** less likely because frame 229 returns the correct address before the failed connection. A web page can fail after successful name resolution.
- **Silent path or interface outage:** less likely because the destination responds within 3 milliseconds. A reset is active rejection, not proof of lost traffic. The capture does not demonstrate a physical link interruption.
- **HTTP application error:** the failed attempt never reaches an established TCP connection, so there is no HTTP error status to interpret.
- **Active firewall rejection:** a reset alone could also be caused by a rejecting policy. The contemporaneous server stop/start logs and successful retry make a closed listener the best-supported explanation here. Packet evidence alone would justify a narrower conclusion than the combined packet/log evidence.

### 5. Next verification or remediation

Check the document server's service state and listening socket. If unexpectedly stopped, examine its service/application logs for the reason, then restore it through the normal service-management process. On an authorized Windows client, `Test-NetConnection 10.20.30.30 -Port 80` can verify TCP acceptance, followed by opening **`http://files.office.test/sample-file.txt`** in a browser to verify DNS and the actual HTTP response. In this dataset, frames **235–240** already demonstrate successful recovery, with log confirmation in **246**. A successful TCP test alone would not replace the HTTP check. Do not change DNS, restart network interfaces, or disable a firewall without evidence supporting that action.

[Back to Student Activity](README.md) · [Networking Labs](../README.md) · [Wireshark Setup](../../../tools/wireshark/README.md) · [Network+](../../../certifications/comptia/network-plus/README.md) · [Student Hub](../../../../README.md)
