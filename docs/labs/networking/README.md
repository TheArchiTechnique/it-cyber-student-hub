---
hub:
  kind: category
  status: placeholder
---
# Networking Labs

Build and inspect simulated networks with Cisco Packet Tracer. Start with the installation guide before opening a networking lab. Each activity will identify its prerequisites, device models, and verification steps.

## Cisco Packet Tracer

- [Start Here — Download and Install Cisco Packet Tracer](packet-tracer-setup/README.md)

    Create a free Cisco account, obtain and install Packet Tracer, sign in, and find the workspace, devices, cabling tools, and configuration controls.

- [Lab 1 — Basic Network Configuration](basic-network-configuration/README.md)

    Build a LAN with a 2911 router, 2960 switch, and three PCs; configure static IPv4 settings and verify connectivity.

- [Lab 2 — VLAN Configuration](vlan-configuration/README.md)

    Continue Lab 1, add PC4, separate Sales and HR into VLANs, and configure router-on-a-stick routing.

- [Lab 3 — Static Routing](static-routing/README.md)

    Continue Lab 2, add Router1 and a /30 transit link, and configure static return routes to the VLAN networks.

- [Lab 4 — DHCP Configuration](dhcp-configuration/README.md)

    Continue Lab 3, configure Router0 DHCP pools, and verify dynamic client settings in Sales and HR.

- [Lab 5 — Centralized DHCP and DNS Services](centralized-dhcp-dns/README.md)

    Add Server0 in Services VLAN 30, move DHCP to the server, configure relay, and resolve internal DNS names.

- [Lab 6 — ACL Traffic Control](acl-traffic-control/README.md)

    Add Router1's Services route and block routed Sales/HR traffic while preserving DHCP, DNS, and shared services.

- [OSI & TCP/IP Models — PDU Encapsulation and Decapsulation](osi-pdu-tracing/README.md)

    Independent lab: trace ARP, ICMP, TCP, and HTTP across two subnets in Simulation Mode; compare encapsulation, switching, routing, and decapsulation. No earlier labs required.

<!-- hub:hidden
- [Browse Tools](../../tools/README.md)

    Find tool guide areas.


hub:hidden -->
- [Open Practice](../../practice/README.md)

    Browse shorter exercises and PBQs.

[Back to Labs](../README.md) · [Student Hub](../../../README.md)
