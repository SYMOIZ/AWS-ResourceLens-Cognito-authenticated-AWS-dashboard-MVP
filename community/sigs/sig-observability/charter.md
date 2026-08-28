# SIG Observability

| | |
| --- | --- |
| **State** | Proposed. See [why](../README.md#why-they-say-proposed). |
| **Leads** | Vacant |
| **Cadence** | One activity per quarter, minimum |
| **Where** | `#cloud-native-karachi`, prefix `[o11y]` |

## Scope

Metrics, logs, traces and profiles, and the practice of using them: Prometheus and its ecosystem including Thanos, Mimir and Alertmanager; OpenTelemetry; Grafana and dashboard design; Loki; Jaeger and Tempo; eBPF tooling such as Cilium Hubble, Pixie and Parca. The practice side carries the better sessions: what to alert on and what to leave alone, service level objectives that survive an on-call rotation, cardinality and what it costs. Instrumenting an application is in scope, in any language.

## Out of scope

- Running the cluster the tooling sits on, which is [sig-platform](../sig-platform/charter.md). Scraping a workload is here; upgrading the cluster is there.
- Security monitoring, threat detection and audit logging, which are [sig-security](../sig-security/charter.md). The boundary is intent: a dashboard for reliability is here, a detection for an attacker is there.
- Vendor platforms as product demos. Self-hosting versus buying is a welcome talk; a walkthrough of a commercial console is not. See [speaking.md](../../events/speaking.md).

To lead this SIG or speak on the topic, see [../README.md](../README.md) and [speaking.md](../../events/speaking.md).
