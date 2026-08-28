# SIG Security

| | |
| --- | --- |
| **State** | Proposed. See [why](../README.md#why-they-say-proposed). |
| **Leads** | Vacant |
| **Cadence** | One activity per quarter, minimum |
| **Where** | `#cloud-native-karachi`, prefix `[security]` |

## Scope

Securing cloud native systems: supply chain work including SBOMs, signing with Sigstore and Cosign, provenance and SLSA; admission control and policy as code with Kyverno, OPA and Gatekeeper; runtime security with Falco and Tetragon; secrets management; workload identity including SPIFFE and cloud provider federation; container and IaC scanning; network policy and segmentation; threat modelling and CIS hardening. Compliance is in scope as engineering, meaning how a control is enforced and evidenced rather than how it is described, and data residency sessions are welcome because many people here work under those constraints.

## Out of scope

- Offensive security unrelated to cloud native systems: web application penetration testing, red teaming, CTF content. Attacking a cluster to show how a control fails is in scope, framed as a defence.
- Enterprise security product demos. Vendor neutrality is hardest to hold in this topic because most people with the expertise are selling something, and the lead enforces it rather than apologises for it. See [speaking.md](../../events/speaking.md).
- Reliability monitoring and general dashboards, which are [sig-observability](../sig-observability/charter.md). Audit logging and detection are here.
- RBAC as a multi-tenancy mechanism, which is [sig-platform](../sig-platform/charter.md). RBAC as privilege escalation is here.

## A standing rule for this SIG

No live credentials, customer data, client names or unpatched details of a real employer's environment in any session. Demos run against a throwaway cluster, a speaker anonymises anything that went wrong at work, and the lead asks before the talk rather than after.

Several people here work under client confidentiality and government-adjacent constraints, and a meetup talk is a bad place to find the edge of them.

To lead this SIG or speak on the topic, see [../README.md](../README.md) and [speaking.md](../../events/speaking.md). Leading it carries the vendor-neutrality burden above.
