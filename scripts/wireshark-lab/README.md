# Wireshark lab asset maintenance

Phase 1 supplies capture and logging assets. Phase 2 adds the Windows setup guide
at `docs/tools/wireshark/README.md`, the walkthrough and `answers.md` in the lab
directory, genuine GUI screenshots, original vector diagrams, and Hub links.
The Phase 1 capture, log, manifest, and validation report remain unchanged.

## Assets

All downloadable data lives in `docs/labs/networking/wireshark/assets/`:

- `office-network.pcap`: simulated Ethernet traffic, without an Ethernet FCS.
- `office-network.log`: six RFC 5424 messages, byte-for-byte equal to the UDP
  syslog payloads in capture order, with matching UTC timestamps.
- `packet-reference.json`: final capture hash, addresses, important frame
  numbers, verified filters/fields, and troubleshooting/log references.
- `validation.json`: TShark validation results tied to the capture SHA-256.

These assets are directly downloadable from the feature branch. MkDocs copies
the non-Markdown files to the corresponding `labs/networking/wireshark/assets/`
site path. The lab links to the capture and log near its beginning, with solutions
on a separately linked answer page.

## Provenance and scope

This is **simulated traffic**, not a production-network recording. Offline Scapy
serialization builds protocol-valid frames and calculates checksums. Python's
OpenSSL-backed `ssl.MemoryBIO` implements both sides of genuine TLS 1.2
handshakes and encrypted request/response exchanges. The generator verifies that
both endpoints decrypt the expected application data. Those wire records are
placed inside simulated, sequenced TCP conversations. TLS 1.2 was selected to
keep certificate and handshake details visible for beginners; this is not a
recommendation to disable TLS 1.3 on real services.

The environment restricts interface discovery, so no live packet capture is
used. The scripts never sniff or send packets, access public network services,
or read host traffic. All IPv4 traffic stays in the fictional lab's private
address space, with broadcast DHCP; hostnames use the reserved `.test` namespace.
The fictional SNMPv2c community `lab-readonly` exists only for this offline
dataset and is not a real credential. There are no logins, tokens, personal data,
or production secrets. The temporary self-signed certificate is valid at capture
time and identifies only `intranet.office.test`. Its private key is destroyed
with the temporary directory, and no TLS key log is created.

Capture perspective: a **simulated bidirectional VLAN 30 SPAN**, with one copy
of each frame. It can therefore include direct traffic between multiple local
hosts that would not all appear on a normal workstation capture. Servers begin
with neighbor-cache entries; new workstations perform ARP after DHCP. All hosts
use subnet `10.20.30.0/24`; the DHCP lease is eight hours with consistent gateway,
mask and DNS settings. DNS answer TTL is 30 seconds. The background workload
mixes lookups, web requests, pings, monitoring and time synchronization.

| Role | IPv4 | MAC |
| --- | --- | --- |
| Gateway, advertised by DHCP and pinged | 10.20.30.1 | 02:00:00:20:30:01 |
| Access switch, SNMP agent and syslog sender | 10.20.30.2 | 02:00:00:20:30:02 |
| DNS, DHCP and NTP server | 10.20.30.10 | 02:00:00:20:30:10 |
| Intranet HTTP/HTTPS server | 10.20.30.20 | 02:00:00:20:30:20 |
| Internal document HTTP service | 10.20.30.30 | 02:00:00:20:30:30 |
| Monitoring host and syslog collector | 10.20.30.40 | 02:00:00:20:30:40 |
| pc1 | 10.20.30.101 | 02:00:00:20:30:65 |
| pc2 | 10.20.30.102 | 02:00:00:20:30:66 |
| pc3 | 10.20.30.103 | 02:00:00:20:30:67 |

Required protocol coverage is ARP, DHCP DORA, DNS, ICMP, TCP, HTTP, TLS/HTTPS,
NTP, SNMP and syslog. Optional SMB is omitted: the internal document service
uses HTTP, and the capture does not pretend that TCP 445 packets demonstrate SMB.
The gateway is visible through ARP, DHCP and echo replies; there is no WAN traffic
or NAT in this capture.

## Supplemental event

At relative time 73.800 seconds the document server logs that its HTTP listener
has stopped. A successful DNS lookup follows at 74.000/74.012. A SYN to
`10.20.30.30:80` at 74.080 receives an immediate RST/ACK at 74.083. At 83.900 the
server logs a new listener, then a retry establishes TCP, requests
`/sample-file.txt`, and receives HTTP 200. A matching success log follows at
85.000. Exact frame numbers and log-line numbers are in the manifest.

This supports temporary unavailability of the HTTP listener. DNS succeeded, and
the destination responded immediately; the evidence does not support a DNS
failure, a silent path outage, or an explanation of **why** the listener stopped.
The single reset is intentional. There are no checksum-offload artifacts. SACK
is not negotiated in these small simulated TCP conversations; TShark may report
informational SYN/SACK-permitted notes and normal connection-close notes.

## Regeneration

Use Python 3.12 or later. Keep optional maintenance dependencies separate from
the Hub's runtime requirements. A standard installation of TShark is required
for validation; Wireshark GUI is not required in Phase 1.

```sh
python -m venv .venv-packets
.venv-packets/bin/python -m pip install scapy==2.6.1 cryptography==50.0.2
.venv-packets/bin/python scripts/wireshark-lab/generate.py
python scripts/wireshark-lab/validate.py --report
```

On Windows, use `.venv-packets\Scripts\python.exe` and pass
`--tshark "C:\Program Files\Wireshark\tshark.exe"` if TShark is not on PATH.
Run the validator with ordinary Python, without the `-O` optimization option:
its checks use assertions. Validation itself uses only the Python standard
library plus the external TShark executable. Generation does not require
administrative capture privileges.

The workload schedule and non-TLS values use a fixed random seed. TLS randomness,
keys and certificate serials deliberately vary on regeneration. The resulting
capture is not byte-reproducible; regenerate its manifest and validation report
together, and review any frame-number changes before updating lesson references.
Do not regenerate an accepted capture merely to rerun validation. The manifest
hash identifies the exact committed dataset.

## Verification

The validator checks each manifest frame and expected field against actual
TShark output, including its display filter and endpoint ports. It checks DORA
lease agreement, DNS request/response correlation, TCP sequence and ACK
progression, bidirectional FIN exchange, overlapping streams, TLS negotiation
and encrypted records, NTP timestamp correlation, SNMP request/response pairs,
MAC/IP consistency, and exact syslog-payload/timestamp correspondence. It also
rejects malformed packets, bad IPv4/TCP/UDP checksums, unintended missing or
retransmitted TCP data, and known credential/key markers.

Official tool references: [TShark manual](https://www.wireshark.org/docs/man-pages/tshark.html),
[display filters](https://www.wireshark.org/docs/man-pages/wireshark-filter.html),
and [checksum interpretation](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvChecksums.html).

## Lesson and image verification

Phase 2 screenshots were taken from the real Wireshark 4.4.19 Linux GUI opening
the frozen capture above. `images/provenance.json` records selected frames,
dimensions and image hashes. The desktop capture API returned JPEG bytes;
lossless WebP encoding preserves their decoded pixels exactly. No packet text
or application controls were redrawn. The interface-map SVG embeds the unaltered
overview and adds external vector arrows/labels; the topology SVG is an original
schematic. No official documentation images or AI-generated application images
are used. Windows installation instructions point to Stable Release 4.6.10,
verified at the official download page on November 23, 2026. They do not claim
that Windows installation was executed in this Linux environment.

```sh
python scripts/wireshark-lab/validate_lesson.py
python scripts/check_source.py
python scripts/sync_navigation.py --check
python -m mkdocs build --strict
python scripts/check_site.py
python -m unittest tests.test_content_visibility tests.test_learning_resource_navigation
node tests/wireshark-lab.cjs
npm run test:learning-resource-navigation
npm run test:pbq-library
```

`validate_lesson.py` accepts the same `--tshark` executable override as the asset
validator. Browser checks use the repository's existing Playwright dependency
and accept `PBQ_CHROMIUM_PATH` for a preinstalled Chromium executable. The lesson
check exercises desktop and mobile widths, both palettes, full-resolution image
links, answer separation, search/navigation and exact downloaded bytes at the
GitHub Pages project subpath. Re-running these checks does not regenerate assets.
