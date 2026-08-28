# SIG Platform

| | |
| --- | --- |
| **State** | Proposed. See [why](../README.md#why-they-say-proposed). |
| **Leads** | Vacant |
| **Cadence** | One activity per quarter, minimum |
| **Where** | `#cloud-native-karachi`, prefix `[platform]` |

## Scope

Running Kubernetes and building platforms on it: cluster lifecycle and upgrades, workload patterns, networking and ingress, autoscaling, multi-tenancy, operators and controllers, GitOps and delivery, and infrastructure as code that provisions clusters. Managed Kubernetes on any cloud counts, neutral comparisons between them count, and so does when a team should not run Kubernetes at all.

## Out of scope

- Observability tooling, which is [sig-observability](../sig-observability/charter.md). Autoscaling that reads metrics is fine here; running Prometheus is not.
- Supply chain security, admission policy and runtime security, which are [sig-security](../sig-security/charter.md). RBAC for multi-tenancy is fine here; threat modelling the cluster is not.
- Backup, disaster recovery and stateful data platforms, held for a future `sig-resilience`. Running a StatefulSet is in scope; a cross-region recovery plan is not.

On a boundary topic the two leads agree who hosts it, and the answer is whoever can find the speaker.

To lead this SIG or speak on the topic, see [../README.md](../README.md) and [speaking.md](../../events/speaking.md).
