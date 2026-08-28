# Special Interest Groups

The index. Rules and lifecycle: [../governance/sigs.md](../governance/sigs.md).

| SIG | Topic | State | Leads | First activity |
| --- | --- | --- | --- | --- |
| [sig-platform](sig-platform/charter.md) | Kubernetes, platform engineering, GitOps | Proposed | Vacant | Not scheduled |
| [sig-observability](sig-observability/charter.md) | Metrics, logs, traces, eBPF | Proposed | Vacant | Not scheduled |
| [sig-security](sig-security/charter.md) | Cloud native and supply chain security | Proposed | Vacant | Not scheduled |

## Why they say proposed

Intended, not an oversight.

A SIG activates when it has a named lead and a dated first activity. The lead line stays vacant until someone meets the [SIG Lead criteria](../governance/membership.md#sig-lead) of two delivered activities in that topic area, which takes a few meetups to be possible at all.

We did not name organizers as leads to close that gap. It would put every SIG under the same people the SIG structure exists to relieve, and a lead appointed rather than earned makes the criteria decorative for everyone after.

So the charters and scope boundaries are written and the lead line is open. The founding phase waives the three-month membership requirement for a lead, so the path from first talk to SIG Lead is short.

Organizers activate a SIG by opening a pull request naming its lead and dating its first activity.

## Layout

```text
sigs/
  README.md                       this index
  sig-platform/charter.md
  sig-observability/charter.md
  sig-security/charter.md
  archived/                       created when the first SIG is archived
```

Each directory gets an entry in [../.github/CODEOWNERS](../.github/CODEOWNERS) when it goes active, giving its leads write access to their own charter and nothing else.

## Deferred SIGs

`sig-community`, `sig-resilience` and `sig-ai` were considered and deferred, with reasons in [../governance/sigs.md](../governance/sigs.md#the-sigs-we-deliberately-did-not-start). None is rejected; a proposal from someone willing to lead one goes through the normal process.
