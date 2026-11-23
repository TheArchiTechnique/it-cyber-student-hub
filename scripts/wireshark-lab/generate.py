#!/usr/bin/env python3
"""Build offline simulated Ethernet traffic; never capture or transmit host traffic."""
import hashlib
import json
import random
import ssl
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

from scapy.config import conf
from scapy.interfaces import NetworkInterfaceDict

# Offline packet construction must not inspect the host's routes or interfaces.
conf.route_autoload = False
conf.route6_autoload = False
with patch.object(NetworkInterfaceDict, "reload"):
    from scapy.all import (ARP, BOOTP, DHCP, DNS, DNSQR, DNSRR, Ether, ICMP, IP,
                           NTP, Raw, SNMP, SNMPget, SNMPresponse, SNMPvarbind,
                           TCP, UDP, wrpcap)
from scapy.asn1.asn1 import ASN1_TIME_TICKS

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/labs/networking/wireshark/assets"
START = datetime(2026, 11, 23, 14, 0, tzinfo=timezone.utc).timestamp()
RNG = random.Random(9009)
HOSTS = {
    "gateway": ("10.20.30.1", "02:00:00:20:30:01"),
    "switch": ("10.20.30.2", "02:00:00:20:30:02"),
    "infra": ("10.20.30.10", "02:00:00:20:30:10"),
    "web": ("10.20.30.20", "02:00:00:20:30:20"),
    "files": ("10.20.30.30", "02:00:00:20:30:30"),
    "monitor": ("10.20.30.40", "02:00:00:20:30:40"),
    "pc1": ("10.20.30.101", "02:00:00:20:30:65"),
    "pc2": ("10.20.30.102", "02:00:00:20:30:66"),
    "pc3": ("10.20.30.103", "02:00:00:20:30:67"),
}
EVENTS, LOGS = [], []


def add(t, packet, tag="", purpose="", display_filter="", fields=None):
    EVENTS.append((round(t, 6), packet, tag, purpose, display_filter, fields or {}))


def net(src, dst):
    return Ether(src=HOSTS[src][1], dst=HOSTS[dst][1]) / IP(
        src=HOSTS[src][0], dst=HOSTS[dst][0], ttl=128 if src.startswith("pc") else 64,
        flags="DF")


def arp(t, src, dst, prefix=""):
    a, am = HOSTS[src]
    b, bm = HOSTS[dst]
    add(t, Ether(src=am, dst="ff:ff:ff:ff:ff:ff") / ARP(
        op=1, hwsrc=am, psrc=a, pdst=b), prefix + "request" if prefix else "",
        "Broadcast ARP request", "arp", {"arp.opcode": 1, "arp.dst.proto_ipv4": b})
    add(t + .003, Ether(src=bm, dst=am) / ARP(
        op=2, hwsrc=bm, psrc=b, hwdst=am, pdst=a), prefix + "reply" if prefix else "",
        "Unicast IP-to-MAC mapping", "arp", {"arp.opcode": 2, "arp.src.hw_mac": bm})


def dhcp(t, pc, xid):
    address, mac = HOSTS[pc]
    chaddr = bytes.fromhex(mac.replace(":", ""))
    for delta, typ, label in [(0, 1, "discover"), (.13, 2, "offer"),
                              (.28, 3, "request"), (.40, 5, "ack")]:
        reply = typ in (2, 5)
        opts = [("message-type", typ)]
        if reply:
            opts += [("server_id", HOSTS["infra"][0]), ("lease_time", 28800),
                     ("renewal_time", 14400), ("rebinding_time", 25200),
                     ("subnet_mask", "255.255.255.0"), ("router", HOSTS["gateway"][0]),
                     ("name_server", HOSTS["infra"][0]), ("domain", "office.test")]
        else:
            opts += [("client_id", b"\x01" + chaddr), ("hostname", pc),
                     ("param_req_list", [1, 3, 6, 15, 51, 58, 59])]
            if typ == 3:
                opts += [("requested_addr", address), ("server_id", HOSTS["infra"][0])]
        p = Ether(src=HOSTS["infra"][1] if reply else mac, dst="ff:ff:ff:ff:ff:ff")
        p /= IP(src=HOSTS["infra"][0] if reply else "0.0.0.0", dst="255.255.255.255")
        p /= UDP(sport=67 if reply else 68, dport=68 if reply else 67)
        p /= BOOTP(op=2 if reply else 1, xid=xid, flags=0x8000, chaddr=chaddr,
                   yiaddr=address if reply else "0.0.0.0") / DHCP(options=opts + ["end"])
        add(t + delta, p, f"dhcp_{pc}_{label}", "DHCP " + label,
            f"dhcp.id == 0x{xid:08x}", {"dhcp.option.dhcp": typ,
                                      "dhcp.ip.your": address if reply else "0.0.0.0"})


def dns(t, pc, name, address, tag="", qtype="A"):
    txid, port = RNG.randrange(1, 65536), RNG.randrange(49152, 65535)
    q = DNSQR(qname=name, qtype=qtype)
    query = net(pc, "infra") / UDP(sport=port, dport=53) / DNS(id=txid, rd=1, qd=q)
    answer = net("infra", pc) / UDP(sport=53, dport=port) / DNS(
        id=txid, qr=1, aa=1, rd=1, ra=1, qd=q,
        an=DNSRR(rrname=name, type=qtype, ttl=30, rdata=address))
    for dt, p, suffix in [(0, query, "query"), (.012, answer, "answer")]:
        add(t + dt, p, tag + suffix if tag else "", "DNS " + suffix,
            f"dns.id == 0x{txid:04x}", {"dns.qry.name": name, "dns.flags.response": int(dt > 0),
                                      **({"dns.a": address} if dt > 0 and qtype == "A" else {})})


class Conversation:
    def __init__(self, t, client, server, port, tag=""):
        self.t, self.client, self.server, self.port = t, client, server, port
        self.ephemeral = RNG.randrange(49152, 65535)
        self.seq = [RNG.randrange(100000, 2000000000), RNG.randrange(100000, 2000000000)]
        self.tag = tag
        self.emit(0, "S", label="syn", ack=0)
        self.emit(1, "SA", label="synack")
        self.emit(0, "A", label="ack")

    def emit(self, direction, flags, data=b"", label="", ack=None):
        src, dst = ((self.client, self.server) if direction == 0 else (self.server, self.client))
        sport, dport = ((self.ephemeral, self.port) if direction == 0 else (self.port, self.ephemeral))
        tcp = TCP(sport=sport, dport=dport, seq=self.seq[direction],
                  ack=self.seq[1-direction] if ack is None else ack,
                  flags=flags, window=64240, options=[("MSS", 1460)] if "S" in flags else [])
        p = net(src, dst) / tcp
        if data:
            p /= Raw(data)
        fields = {"tcp.srcport": sport, "tcp.dstport": dport, "tcp.flags": int(tcp.flags)}
        if label == "request" and self.port == 80:
            fields["http.request.method"] = "GET"
        elif label == "response" and self.port == 80:
            fields["http.response.code"] = 200
        elif label in ("clienthello", "serverhello"):
            fields["tls.handshake.type"] = 1 if direction == 0 else 2
        elif label in ("encrypted_request", "encrypted_response"):
            fields["tls.record.content_type"] = 23
        add(self.t, p, self.tag + label if self.tag and label else "", label or flags,
            f"tcp.port == {self.ephemeral} && ip.addr == {HOSTS[self.client][0]}",
            fields)
        self.seq[direction] += len(data) + int("S" in flags) + int("F" in flags)
        self.t += .008 + RNG.random() * .008

    def send(self, direction, data, label=""):
        for index in range(0, len(data), 1200):
            self.emit(direction, "PA", data[index:index+1200], label if index == 0 else "")
        self.emit(1-direction, "A")

    def close(self):
        self.emit(0, "FA", label="fin")
        self.emit(1, "A")
        self.emit(1, "FA")
        self.emit(0, "A")


def http(t, pc, server="web", path="/", tag=""):
    name = "intranet.office.test" if server == "web" else "files.office.test"
    stream = Conversation(t, pc, server, 80, tag)
    stream.send(0, f"GET {path} HTTP/1.1\r\nHost: {name}\r\nUser-Agent: OfficeLab/1.0\r\nAccept: */*\r\nConnection: close\r\n\r\n".encode(), "request")
    body = (b"<html><body><h1>Office intranet</h1><p>Service available.</p></body></html>\n"
            if server == "web" else b"Office shared documents service: sample-file.txt\n")
    stream.t += RNG.uniform(.06, .3)
    stream.send(1, f"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {len(body)}\r\nConnection: close\r\n\r\n".encode() + body, "response")
    stream.close()


def tls(t, pc, context, tag):
    # OpenSSL performs both sides of a genuine TLS 1.2 handshake in memory.
    # Only the resulting wire records enter simulated TCP; no keys are exported.
    client_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    client_ctx.check_hostname = False
    client_ctx.verify_mode = ssl.CERT_NONE  # isolated disposable lab certificate
    client_ctx.minimum_version = client_ctx.maximum_version = ssl.TLSVersion.TLSv1_2
    client_ctx.set_ciphers("ECDHE-RSA-AES128-GCM-SHA256")
    ci, co, si, so = [ssl.MemoryBIO() for _ in range(4)]
    client = client_ctx.wrap_bio(ci, co, server_hostname="intranet.office.test")
    server = context.wrap_bio(si, so, server_side=True)
    stream = Conversation(t, pc, "web", 443, tag)
    done = [False, False]
    flights = [0, 0]
    for _ in range(20):
        for direction, obj, output, other in [(0, client, co, si), (1, server, so, ci)]:
            if not done[direction]:
                try:
                    obj.do_handshake()
                    done[direction] = True
                except ssl.SSLWantReadError:
                    pass
            wire = output.read()
            if wire:
                stream.send(direction, wire, ("clienthello" if direction == 0 else "serverhello")
                            if flights[direction] == 0 else "")
                flights[direction] += 1
                other.write(wire)
        if all(done):
            break
    assert all(done), "TLS handshake did not finish"
    request = b"GET /secure HTTP/1.1\r\nHost: intranet.office.test\r\nConnection: close\r\n\r\n"
    response = b"HTTP/1.1 200 OK\r\nContent-Length: 12\r\nConnection: close\r\n\r\nSecure lab!\n"
    assert len(response.split(b"\r\n\r\n")[1]) == 12
    for direction, sender, output, receiver_input, receiver, plaintext in [
        (0, client, co, si, server, request), (1, server, so, ci, client, response)]:
        sender.write(plaintext)
        wire = output.read()
        stream.send(direction, wire, "encrypted_request" if direction == 0 else "encrypted_response")
        receiver_input.write(wire)
        assert receiver.read() == plaintext
    for direction, obj, output, other in [(0, client, co, si), (1, server, so, ci)]:
        try:
            obj.unwrap()
        except ssl.SSLWantReadError:
            pass
        wire = output.read()
        if wire:
            stream.send(direction, wire)
            other.write(wire)
    client.unwrap()
    stream.close()


def syslog(t, src, severity, msgid, message):
    stamp = datetime.fromtimestamp(START+t, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    text = f"<{16*8+severity}>1 {stamp} {src}.office.test lab-service - {msgid} - {message}"
    LOGS.append((t, text))
    add(t, net(src, "monitor") / UDP(sport=5514, dport=514) / Raw(text.encode()),
        "log_" + msgid.lower(), message, "syslog", {"syslog.level": severity})


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    dhcp(0, "pc1", 0x90090001)
    dhcp(.20, "pc2", 0x90090002)
    dhcp(.50, "pc3", 0x90090003)
    # Model a VLAN SPAN capture. Unchanged neighbor caches predate the capture
    # on servers; workstations resolve their own neighbors after DHCP.
    for i, pc in enumerate(("pc1", "pc2", "pc3")):
        for j, dst in enumerate(("gateway", "infra", "web", "files")):
            arp(1 + i*.17 + j*.11, pc, dst, "arp_" if i == j == 0 else "")
    arp(1.85, "monitor", "switch")
    arp(1.92, "switch", "monitor")
    arp(1.99, "files", "monitor")
    syslog(.01, "switch", 6, "LINK_UP", "Interface Gi1/0/3 operational state up; pc3 workstation link active")
    syslog(2.5, "infra", 6, "LEASES", "DHCP leases active: pc1=10.20.30.101 pc2=10.20.30.102 pc3=10.20.30.103 lease=28800s")
    for i, t in enumerate([3.1, 18.3, 34.7, 51.2, 68.4, 91.1, 108.7, 126.2, 144.8]):
        pc = ("pc1", "pc2", "pc3")[i % 3]
        dns(t, pc, "intranet.office.test", HOSTS["web"][0], "dns_" if i == 0 else "")
        http(t+.08, pc, path=["/", "/news", "/status"][i % 3], tag="http_" if i == 0 else "")
        if i % 3 == 0:
            other = "pc2" if pc != "pc2" else "pc3"
            dns(t+.04, other, "intranet.office.test", HOSTS["web"][0])
            http(t+.12, other, path="/status", tag="overlap_" if i == 0 else "")
    for i, t in enumerate([9.6, 26.2, 44.8, 62.6, 88.3, 105.2, 123.5, 141.6, 157.9]):
        pc = ("pc2", "pc3", "pc1")[i % 3]
        dns(t, pc, "files.office.test", HOSTS["files"][0])
        if i in (0, 3, 6):
            http(t+.08, pc, "files", "/sample-file.txt", "files_" if i == 0 else "")
    for i in range(18):
        t = 5.2 + i*9.1 + RNG.random()*.4
        pc = ("pc1", "pc2", "pc3")[i % 3]
        dst = "gateway" if i % 2 == 0 else "infra"
        ident = 0x4100 + i % 3
        for dt, source, target, typ in [(0, pc, dst, 8), (.004, dst, pc, 0)]:
            add(t+dt, net(source, target) / ICMP(type=typ, id=ident, seq=i//3+1) / Raw(b"office-lab-reachability"),
                ("icmp_request" if typ == 8 else "icmp_reply") if i == 0 else "",
                "ICMP echo request/reply", f"icmp.ident == 0x{ident:04x}", {"icmp.type": typ})
    for i in range(10):
        t = 6.6 + i*15.9
        oid = "1.3.6.1.2.1.1.3.0"  # sysUpTime.0
        for dt, src, dst, pdu in [
            (0, "monitor", "switch", SNMPget(id=i+1, varbindlist=[SNMPvarbind(oid=oid)])),
            (.006, "switch", "monitor", SNMPresponse(id=i+1, varbindlist=[SNMPvarbind(
                oid=oid, value=ASN1_TIME_TICKS(int((86400+t)*100)))]))]:
            add(t+dt, net(src, dst) / UDP(sport=52000+i if dt == 0 else 161,
                                         dport=161 if dt == 0 else 52000+i) / SNMP(
                version=1, community="lab-readonly", PDU=pdu),
                ("snmp_get" if dt == 0 else "snmp_response") if i == 0 else "",
                "SNMPv2c sysUpTime poll; fictional read-only community", "snmp",
                {"snmp.request_id": i+1})
    for i in range(9):
        t = 7.9 + i*16.3
        pc = ("pc1", "pc2", "pc3")[i % 3]
        # Explicit timestamps, including server originate = client's transmit.
        nt = START+t+2208988800  # NTP epoch begins in 1900.
        for dt, src, dst, mode in [(0, pc, "infra", 3), (.008, "infra", pc, 4)]:
            add(t+dt, net(src, dst) / UDP(sport=53000+i if mode == 3 else 123,
                                         dport=123 if mode == 3 else 53000+i) / NTP(
                version=4, mode=mode, stratum=0 if mode == 3 else 2,
                poll=6, precision=-20, delay=.01, dispersion=.001,
                id="10.20.30.1", ref=nt-10 if mode == 4 else 0,
                orig=nt if mode == 4 else 0, recv=nt+.003 if mode == 4 else 0,
                sent=nt+.004 if mode == 4 else nt),
                ("ntp_request" if mode == 3 else "ntp_response") if i == 0 else "",
                "NTP client/server exchange", "ntp", {"ntp.flags.mode": mode})
    with tempfile.TemporaryDirectory() as folder:
        cert, key = Path(folder)/"cert.pem", Path(folder)/"key.pem"
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "intranet.office.test")])
        certificate = (x509.CertificateBuilder().subject_name(name).issuer_name(name)
                       .public_key(private_key.public_key()).serial_number(x509.random_serial_number())
                       .not_valid_before(datetime(2026, 11, 22, tzinfo=timezone.utc))
                       .not_valid_after(datetime(2026, 11, 25, tzinfo=timezone.utc))
                       .add_extension(x509.SubjectAlternativeName([x509.DNSName("intranet.office.test")]), False)
                       .sign(private_key, hashes.SHA256()))
        cert.write_bytes(certificate.public_bytes(serialization.Encoding.PEM))
        key.write_bytes(private_key.private_bytes(serialization.Encoding.PEM,
                        serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.minimum_version = ctx.maximum_version = ssl.TLSVersion.TLSv1_2
        ctx.set_ciphers("ECDHE-RSA-AES128-GCM-SHA256")
        ctx.options |= ssl.OP_NO_TICKET
        ctx.load_cert_chain(cert, key)
        for t, pc, tag in [(38.1, "pc2", "tls_"), (112.4, "pc3", "tls2_")]:
            dns(t, pc, "intranet.office.test", HOSTS["web"][0])
            tls(t+.10, pc, ctx, tag)
    # One short service interruption. These logs establish service state, not
    # a guessed physical-link fault or an inferred reason for a service stop.
    syslog(73.8, "files", 5, "HTTP_STOP", "Document HTTP service stopped; TCP port 80 listener closed")
    dns(74, "pc1", "files.office.test", HOSTS["files"][0], "issue_dns_")
    seq, port = 741001, 54821
    add(74.08, net("pc1", "files") / TCP(sport=port, dport=80, seq=seq, flags="S",
        options=[("MSS", 1460)]), "issue_syn", "Connection attempt to document service",
        "tcp.port == 54821", {"tcp.flags": 2})
    add(74.083, net("files", "pc1") / TCP(sport=80, dport=port, seq=0, ack=seq+1, flags="RA"),
        "issue_reset", "Immediate refusal, not a timeout", "tcp.port == 54821", {"tcp.flags": 20})
    syslog(83.9, "files", 5, "HTTP_START", "Document HTTP service started; listening on 10.20.30.30:80")
    http(84.10, "pc1", "files", "/sample-file.txt", "recovery_")
    syslog(85, "files", 6, "HTTP_OK", "GET /sample-file.txt from 10.20.30.101 completed status=200")
    syslog(159.9, "switch", 6, "HEALTH", "Management reachable; workstation interfaces operational")
    EVENTS.sort(key=lambda e: e[0])
    packets, refs = [], []
    ipids = defaultdict(lambda: 1000)
    for frame, (t, packet, tag, purpose, filt, fields) in enumerate(EVENTS, 1):
        if IP in packet:
            ipids[packet[IP].src] += 1
            packet[IP].id = ipids[packet[IP].src]
        wire = bytes(packet)
        # Ethernet minimum size excluding the FCS; padding is outside IPv4 length.
        packet = Ether(wire + b"\0"*max(0, 60-len(wire)))
        packet.time = START+t
        packets.append(packet)
        if tag:
            transport = packet[TCP] if TCP in packet else packet[UDP] if UDP in packet else None
            service = next((name for port, name in [(67, "DHCP"), (53, "DNS"), (80, "HTTP/TCP"),
                (443, "TLS/TCP"), (123, "NTP"), (161, "SNMP"), (514, "Syslog")]
                if transport is not None and port in (transport.sport, transport.dport)), None)
            refs.append({"id": tag, "frame": frame, "time_relative": t,
                         "protocol": service or ("ARP" if ARP in packet else "ICMP"),
                         "source": packet[IP].src if IP in packet else packet[ARP].psrc,
                         "destination": packet[IP].dst if IP in packet else packet[ARP].pdst,
                         "source_port": transport.sport if transport else None,
                         "destination_port": transport.dport if transport else None,
                         "filter": filt, "expected_fields": fields, "demonstrates": purpose})
    capture = OUT/"office-network.pcap"
    wrpcap(str(capture), packets)
    (OUT/"office-network.log").write_text("\n".join(text for _, text in sorted(LOGS)) + "\n")
    manifest = {
        "provenance": "SIMULATED offline Ethernet/IP/TCP/UDP traffic; real OpenSSL TLS wire records; not a production recording",
        "capture": capture.name, "sha256": hashlib.sha256(capture.read_bytes()).hexdigest(),
        "log": "office-network.log", "packet_count": len(packets),
        "start_utc": "2026-11-23T14:00:00Z", "duration_seconds": EVENTS[-1][0]-EVENTS[0][0],
        "capture_point": "Simulated bidirectional VLAN 30 SPAN; one copy of each Ethernet frame, no FCS",
        "subnet": "10.20.30.0/24", "hosts": {k: {"ipv4": v[0], "mac": v[1]} for k, v in HOSTS.items()},
        "references": refs,
        "troubleshooting": {
            "summary": "Temporary refusal of the internal document HTTP service; subsequent successful retry",
            "evidence_ids": ["log_http_stop", "issue_dns_query", "issue_dns_answer", "issue_syn", "issue_reset", "log_http_start", "recovery_syn", "recovery_synack", "recovery_request", "recovery_response", "log_http_ok"],
            "log_lines": {msgid: next(i for i, (_, text) in enumerate(sorted(LOGS), 1) if f" {msgid} - " in text)
                          for msgid in ("HTTP_STOP", "HTTP_START", "HTTP_OK")},
            "limit": "Evidence supports a stopped/unavailable HTTP listener; it does not establish why it stopped."
        }}
    (OUT/"packet-reference.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {len(packets)} packets, {manifest['duration_seconds']} seconds, {len(refs)} references")


if __name__ == "__main__":
    build()
