# Governance

| Document | Covers |
| --- | --- |
| [membership.md](membership.md) | The four roles, criteria, how to apply, inactivity |
| [organizers.md](organizers.md) | Organizer eligibility, the vote, the CNCF request, offboarding |
| [sigs.md](sigs.md) | What a SIG is, how to start one, the lifecycle |
| [moderation.md](moderation.md) | Code of Conduct enforcement and escalation |

## What we are

A vendor-neutral local community for Kubernetes, cloud native and open source, in Karachi. Part of the CNCF Cloud Native Community Groups programme, which sets constraints we do not vote on:

- **Every event is free.** No paid tickets.
- **Content is vendor neutral.** No product pitches. Sponsors get thanked, not a speaking slot. See [../events/speaking.md](../events/speaking.md).
- **An event at least every 90 days**, or the CNCF can deem the group inactive and remove it. Monthly is the recommended target.
- **Registration runs on our [group page](https://ocgroups.dev/cncf/group/cn-khi)**, the CNCF's record of members and events, not this repository.
- **Organizers are appointed by the CNCF** on our nomination.

What a quiet quarter costs: a chapter holding at least one in-person event per quarter with more than 10 attendees qualifies for free Linux Foundation certification vouchers, and organizers serving a full year qualify for a Credly badge. Organizers also get `#community-group-organizers` on CNCF Slack, where programme questions get answered.

## Who decides what

Organizers hold decision authority, Members hold sponsorship authority over new Members, SIG Leads hold agenda authority over their own SIG. The people in each role are listed in [members/](../members/).

| Decision | Who | Threshold | Comment period |
| --- | --- | --- | --- |
| Typo, broken link | Anyone with write access | 1 approval | None |
| Event logistics, SIG activity dates | Organizers, or the SIG Lead for their SIG | 1 approval | 72h lazy consensus |
| Accepting a talk | SIG Lead plus 1 organizer | Both | None |
| New Member | 1 organizer, sponsors confirmed | 1 approval | 72h lazy consensus |
| New SIG Lead | Organizers | Majority | 7 days |
| New SIG, archiving a SIG | Organizers | Majority | 7 days |
| New or removed Organizer | Organizers | [See the vote](organizers.md#step-3-the-vote) | 7 days |
| Code of Conduct action | Non-recused organizers | Majority | None, confidential |
| Changing `governance/` | Organizers | Two thirds | 7 days |
| Spending money, accepting sponsorship | Organizers | Majority, recorded in the retro | 72h |

## How decisions get made

**Lazy consensus** is the default: propose, and if nobody objects within the comment period it passes. Silence is assent. An objection says what is wrong and, where possible, what would fix it. Anyone can call for an explicit vote instead, and that call is not debatable.

**Quorum** is more than half the organizers listed in [organizers.yaml](../members/organizers.yaml). No decision passes on a single vote.

**Recusal** is mandatory: your own nomination or removal, any Code of Conduct matter involving you or someone close to you, anything involving your employer's money. Recusal is recorded and quorum is calculated on the non-recused.

**Deadlock** resolves to the status quo. A tie goes to a 7-day Member comment period, then one re-vote. Still tied, it fails.

**Everything is written down.** Decisions live in the issue or pull request that made them. Organizers meet monthly and post notes in an issue labelled `organizers-meeting`; anything decided verbally becomes real when it lands there.

## Changing the rules

A pull request against this directory stating the problem it solves, not just the change. Two thirds of organizers, 7-day comment period, any Member can weigh in. No rationale, no merge.

Amendments are not retroactive. Nobody is re-reviewed against criteria that did not exist when they were admitted, and no Code of Conduct decision reopens under new rules. A change that would strip someone of a role they hold is a removal and follows that role's removal process.

One exception: any organizer may merge immediately, without the comment period, to fix a factual error about CNCF policy, a dead link, or committed personal data. Rationale in the pull request, raised at the next meeting, revertible there.

## When this conflicts with the CNCF

The [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md) and the programme rules win. A contradiction here is a bug and qualifies for the immediate-merge exception.
