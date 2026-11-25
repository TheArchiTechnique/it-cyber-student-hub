#!/usr/bin/env python3
"""Validate final capture and manifest with real TShark. Python standard library only."""
import argparse
import hashlib
import ipaddress
import json
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "docs/labs/networking/wireshark/assets"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tshark", default="tshark")
    parser.add_argument("--report", action="store_true", help="Save validation.json beside capture")
    args = parser.parse_args()
    manifest = json.loads((ASSETS / "packet-reference.json").read_text())
    capture = ASSETS / manifest["capture"]
    checksum = hashlib.sha256(capture.read_bytes()).hexdigest()
    assert checksum == manifest["sha256"], "Capture changed; manifest must be regenerated"
    base = [args.tshark, "-n", "-r", str(capture), "-o", "ip.check_checksum:TRUE",
            "-o", "tcp.check_checksum:TRUE", "-o", "udp.check_checksum:TRUE"]

    def run(*opts):
        result = subprocess.run(base + list(opts), check=True, capture_output=True, text=True)
        assert not result.stderr.strip(), result.stderr
        return result.stdout

    fields = set("frame.number frame.time_epoch frame.time_relative frame.len eth.src eth.dst ip.src ip.dst ip.len tcp.stream tcp.srcport tcp.dstport tcp.flags tcp.seq_raw tcp.ack_raw tcp.len tcp.payload udp.srcport udp.dstport udp.payload dns.id dns.flags.response dns.qry.name dns.qry.type dns.a dhcp.id dhcp.option.dhcp dhcp.ip.your dhcp.option.subnet_mask dhcp.option.router dhcp.option.domain_name_server dhcp.option.ip_address_lease_time dhcp.option.requested_ip_address ntp.org ntp.xmt ntp.rec ntp.flags.mode ntp.stratum snmp.request_id snmp.name snmp.response_to snmp.value.timeticks http.request.method http.response.code _ws.col.Protocol".split())
    fields.update(k for ref in manifest["references"] for k in ref["expected_fields"])
    fields.update(["arp.src.proto_ipv4", "arp.dst.proto_ipv4"])
    opts = ["-T", "json"]
    for field in sorted(fields):
        opts += ["-e", field]
    rows = [item["_source"]["layers"] for item in json.loads(run(*opts))]

    def value(row, key, default=""):
        return row.get(key, [default])[0]

    def integer(text):
        if text in ("True", "False"):
            return int(text == "True")
        return int(text, 16 if text.startswith("0x") else 10)

    def number(row, key):
        return integer(value(row, key, "0"))

    def frame(row):
        return number(row, "frame.number")

    indexed = {frame(row): row for row in rows}
    assert len(rows) == manifest["packet_count"] and 200 <= len(rows) <= 500
    duration = float(value(rows[-1], "frame.time_relative"))
    assert abs(duration - manifest["duration_seconds"]) < 1e-6 and 120 <= duration <= 180
    assert all(float(value(a, "frame.time_epoch")) <= float(value(b, "frame.time_epoch"))
               for a, b in zip(rows, rows[1:])), "Timestamps out of order"
    start = datetime.fromisoformat(manifest["start_utc"].replace("Z", "+00:00")).timestamp()
    assert float(value(rows[0], "frame.time_epoch")) == start

    def frames(filt):
        return [int(n) for n in run("-Y", filt, "-T", "fields", "-e", "frame.number").split()]

    protocol_counts = {filt: len(frames(filt)) for filt in [
        "arp", "dhcp", "dns", "icmp", "tcp", "udp", "http", "tls", "ntp", "snmp", "syslog"]}
    assert all(protocol_counts.values()), protocol_counts
    negative_filters = ["_ws.malformed", "ip.checksum.status == 0 || tcp.checksum.status == 0 || udp.checksum.status == 0",
                        "tcp.analysis.lost_segment || tcp.analysis.ack_lost_segment || tcp.analysis.retransmission || tcp.analysis.out_of_order"]
    for filt in negative_filters:
        assert not frames(filt), f"Unexpected packets matching: {filt}"
    assert len(frames("tcp.flags.reset == 1")) == 1
    known = {host["ipv4"]: host["mac"] for host in manifest["hosts"].values()}
    for row in rows:
        assert 60 <= number(row, "frame.len") <= 1514
        for direction in ["src", "dst"]:
            addr = value(row, "ip."+direction)
            if addr and addr not in ("0.0.0.0", "255.255.255.255"):
                assert addr in known and ipaddress.ip_address(addr).is_private
                assert value(row, "eth."+direction) == known[addr]

    filters = {ref["filter"]: set() for ref in manifest["references"]}
    for filt in filters:
        filters[filt] = set(frames(filt))
    assert len({ref["id"] for ref in manifest["references"]}) == len(manifest["references"])
    for ref in manifest["references"]:
        row = indexed[ref["frame"]]
        assert ref["frame"] in filters[ref["filter"]], ref["id"]
        assert abs(float(value(row, "frame.time_relative"))-ref["time_relative"]) < 1e-6
        for key, expected in ref["expected_fields"].items():
            actual = row.get(key, [])
            assert any((integer(x) == expected if isinstance(expected, int)
                        else x == expected) for x in actual), (ref["id"], key, expected, actual)
        for direction, label in [("src", "source"), ("dst", "destination")]:
            ip = value(row, "ip."+direction) or value(row, "arp."+direction+".proto_ipv4")
            assert ip == ref[label], ref["id"]
            port = value(row, "tcp."+direction+"port") or value(row, "udp."+direction+"port")
            assert (int(port) if port else None) == ref[label+"_port"]

    # DORA contents and lease configuration for all three clients.
    dhcp = defaultdict(list)
    for row in rows:
        if "dhcp.id" in row:
            dhcp[value(row, "dhcp.id")].append(row)
    assert len(dhcp) == 3
    for exchange in dhcp.values():
        assert [number(row, "dhcp.option.dhcp") for row in exchange] == [1, 2, 3, 5]
        offer, request, ack = exchange[1:]
        assigned = value(offer, "dhcp.ip.your")
        assert value(ack, "dhcp.ip.your") == value(request, "dhcp.option.requested_ip_address") == assigned
        for row in (offer, ack):
            assert value(row, "dhcp.option.subnet_mask") == "255.255.255.0"
            assert value(row, "dhcp.option.router") == "10.20.30.1"
            assert value(row, "dhcp.option.domain_name_server") == "10.20.30.10"
            assert number(row, "dhcp.option.ip_address_lease_time") == 28800

    # Each DNS response must match a prior query's ID, tuple, question and type.
    pending, resolved = {}, 0
    for row in rows:
        if "dns.id" not in row:
            continue
        response = number(row, "dns.flags.response")
        src, dst = value(row, "ip.src"), value(row, "ip.dst")
        sport, dport = value(row, "udp.srcport"), value(row, "udp.dstport")
        key = (value(row, "dns.id"), dst if response else src, src if response else dst,
               dport if response else sport, value(row, "dns.qry.name"), value(row, "dns.qry.type"))
        if not response:
            assert key not in pending
            pending[key] = row
        else:
            assert key in pending and value(row, "dns.a") in known
            del pending[key]
            resolved += 1
    assert not pending

    # Verify sequence advancement, exact ACKs and complete FIN exchange per stream.
    streams = defaultdict(list)
    for row in rows:
        if "tcp.stream" in row:
            streams[value(row, "tcp.stream")].append(row)
    complete = 0
    for stream in streams.values():
        assert number(stream[0], "tcp.flags") == 2
        endpoints, next_seq, fins = {}, {}, Counter()
        reset = False
        for row in stream:
            source = (value(row, "ip.src"), value(row, "tcp.srcport"))
            target = (value(row, "ip.dst"), value(row, "tcp.dstport"))
            flags, seq, ack = (number(row, key) for key in ("tcp.flags", "tcp.seq_raw", "tcp.ack_raw"))
            if source not in endpoints:
                endpoints[source] = True
                next_seq[source] = seq
            assert seq == next_seq[source], (frame(row), "sequence progression")
            if flags & 16:
                assert target in next_seq and ack == next_seq[target], (frame(row), "ACK progression")
            next_seq[source] += number(row, "tcp.len") + bool(flags & 2) + bool(flags & 1)
            fins[source] += bool(flags & 1)
            reset |= bool(flags & 4)
        if reset:
            assert len(stream) == 2 and number(stream[-1], "tcp.flags") == 20
        else:
            assert len(endpoints) == 2 and all(fins[e] == 1 for e in endpoints)
            assert number(stream[1], "tcp.flags") == 18 and number(stream[2], "tcp.flags") == 16
            complete += 1
    # At least one pair of TCP conversations must overlap on the timeline.
    intervals = [(float(value(s[0], "frame.time_epoch")), float(value(s[-1], "frame.time_epoch"))) for s in streams.values()]
    assert any(max(a, c) < min(b, d) for i, (a, b) in enumerate(intervals) for c, d in intervals[i+1:])
    assert len(frames("tls.handshake.type == 1")) == 2
    assert len(frames("tls.handshake.type == 2 && tls.handshake.version == 0x0303")) == 2
    assert len(frames("tls.handshake.type == 11")) == 2
    assert len(frames("tls.record.content_type == 23")) == 4
    # No plaintext secure request or private keys may be present in the capture.
    binary = capture.read_bytes()
    for marker in (b"GET /secure", b"PRIVATE KEY", b"Authorization:", b"Cookie:", b"password="):
        assert marker not in binary, marker

    # NTP originate matches the request transmit timestamp exactly.
    requests = {}
    for row in rows:
        if "ntp.flags.mode" not in row:
            continue
        if number(row, "ntp.flags.mode") == 3:
            requests[(value(row, "ip.src"), value(row, "udp.srcport"))] = value(row, "ntp.xmt")
        else:
            assert number(row, "ntp.stratum") == 2
            key = (value(row, "ip.dst"), value(row, "udp.dstport"))
            assert requests.pop(key) == value(row, "ntp.org")
    assert not requests
    snmp_rows = [row for row in rows if "snmp.request_id" in row]
    snmp_groups = defaultdict(list)
    for row in snmp_rows:
        snmp_groups[value(row, "snmp.request_id")].append(row)
    assert len(snmp_groups) == 10 and all(len(group) == 2 for group in snmp_groups.values())
    for group in snmp_groups.values():
        assert value(group[0], "snmp.name") == value(group[1], "snmp.name") == "1.3.6.1.2.1.1.3.0"
        assert number(group[1], "snmp.response_to") == frame(group[0])
        assert number(group[1], "snmp.value.timeticks") > 8640000

    log_rows = [row for row in rows if value(row, "udp.dstport") == "514"]
    logs = (ASSETS / manifest["log"]).read_text().splitlines()
    assert len(log_rows) == len(logs) == 6
    for row, text in zip(log_rows, logs):
        assert bytes.fromhex(value(row, "udp.payload").replace(":", "")).decode() == text
        match = re.fullmatch(r"<(\d+)>1 (\S+) (\S+) lab-service - (\S+) - (.+)", text)
        assert match
        stamp = datetime.fromisoformat(match[2].replace("Z", "+00:00")).timestamp()
        assert abs(stamp-float(value(row, "frame.time_epoch"))) < 1e-6
        host = match[3].split(".")[0]
        assert manifest["hosts"][host]["ipv4"] == value(row, "ip.src")
        assert int(match[1]) % 8 in (5, 6)
    byid = {ref["id"]: ref for ref in manifest["references"]}
    times = [byid[key]["time_relative"] for key in manifest["troubleshooting"]["evidence_ids"]]
    assert times == sorted(times)
    for msgid, line in manifest["troubleshooting"]["log_lines"].items():
        assert f" {msgid} - " in logs[line-1]
    report = {
        "result": "PASS", "tool": subprocess.check_output([args.tshark, "--version"], text=True).splitlines()[0],
        "capture_sha256": checksum, "packet_count": len(rows), "duration_seconds": duration,
        "protocol_filter_counts": protocol_counts, "verified_manifest_references": len(manifest["references"]),
        "dns_query_response_pairs": resolved, "dhcp_dora_exchanges": len(dhcp),
        "complete_tcp_sessions": complete, "intentional_refused_tcp_sessions": 1,
        "tls_sessions": 2, "syslog_messages_matching_log": len(logs),
        "malformed_packets": 0, "bad_ipv4_tcp_udp_checksums": 0,
        "missing_out_of_order_or_retransmitted_tcp_segments": 0,
        "capture_offload_artifacts": "None; offline serialization calculates final checksums.",
        "limitations": ["Simulated network traffic, not a live production capture.",
                        "SMB omitted; the internal document service uses HTTP.",
                        "TLS 1.2 lab uses a disposable self-signed certificate; private key is not included.",
                        "The intentional RST is an expected expert warning; SYN SACK-permitted notes are informational."]}
    if args.report:
        (ASSETS / "validation.json").write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
