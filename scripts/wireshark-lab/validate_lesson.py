#!/usr/bin/env python3
"""Check every lesson display filter and selected answer fields against TShark."""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT / "docs/labs/networking/wireshark"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tshark", default="tshark")
    args = parser.parse_args()
    docs = [LAB/"README.md", LAB/"answers.md", ROOT/"docs/tools/wireshark/README.md"]
    manifest = json.loads((LAB/"assets/packet-reference.json").read_text())
    reference_frames = {entry["frame"] for entry in manifest["references"]}
    filters = set()
    for doc in docs:
        text = doc.read_text()
        for token in re.findall(r"`([^`\n]+)`", text):
            if re.match(r"^(arp|dhcp|dns|icmp|tcp|udp|http|tls|ntp|snmp|syslog|ip)($|\.| &&)", token):
                filters.add(token)
        # Explicit singular references must come from the frozen Phase 1 manifest.
        for number in re.findall(r"\bframe \*\*(\d+)\*\*", text):
            assert int(number) in reference_frames, (doc.name, number)
    counts = {}
    base = [args.tshark, "-n", "-r", str(LAB/"assets/office-network.pcap")]
    for filt in sorted(filters):
        result = subprocess.run(base+["-Y",filt,"-T","fields","-e","frame.number"],
                                check=True,capture_output=True,text=True)
        assert not result.stderr.strip(), result.stderr
        counts[filt] = len(result.stdout.split())
        assert counts[filt] > 0 or filt == "tcp.port == 445", (filt, "unexpected zero matches")
    assert counts["tcp.port == 445"] == 0
    expectations = {
        45: {"udp.srcport":"62894", "udp.dstport":"53", "dns.qry.type":"1"},
        46: {"dns.flags.rcode":"0", "dns.a":"10.20.30.20"},
        52: {"http.request.method":"GET", "http.host":"intranet.office.test"},
        59: {"http.response.code":"200"},
        71: {"icmp.type":"8", "icmp.ident":"0x4100", "icmp.seq":"1"},
        72: {"icmp.type":"0", "icmp.ident":"0x4100", "icmp.seq":"1"},
        74: {"snmp.value.timeticks":"8640660"},
        135: {"tls.handshake.version":"0x0303"},
        231: {"tcp.flags":"0x0014"},
        238: {"http.request.uri":"/sample-file.txt"},
        240: {"http.response.code":"200"}}
    for frame, fields in expectations.items():
        opts = base+["-Y",f"frame.number == {frame}","-T","json"]
        for key in fields:
            opts += ["-e",key]
        result = subprocess.run(opts,check=True,capture_output=True,text=True)
        layers = json.loads(result.stdout)[0]["_source"]["layers"]
        for key, expected in fields.items():
            matches = (any(int(x,16 if x.startswith("0x") else 10) == int(expected,16)
                           for x in layers[key]) if expected.startswith("0x") else expected in layers[key])
            assert matches, (frame,key,expected,layers[key])
    for image in json.loads((LAB/"images/provenance.json").read_text())["images"]:
        if image["selected_frame"] is not None:
            assert image["selected_frame"] in reference_frames
    print(f"Passed {len(filters)} lesson filters and {len(expectations)} additional answer-field checks; frame/image references use the frozen manifest.")
    print(json.dumps(counts,indent=2))


if __name__ == "__main__":
    main()
