# Membership

Four roles, countable criteria. A reviewer checks numbers against thresholds rather than forming an impression. Where a requirement cannot be verified, this document says so.

## Participant

Anyone who registers on the [group page](https://ocgroups.dev/cncf/group/cn-khi) and turns up. No application, no listing, no expectation beyond the [Code of Conduct](../CODE_OF_CONDUCT.md).

Most people stay here. The roles below are for helping run the group, not a ranking of who belongs.

## Baseline requirements

Required for every role above Participant.

| # | Requirement | How it is checked |
| --- | --- | --- |
| 1 | Registered on the [group page](https://ocgroups.dev/cncf/group/cn-khi) | Organizer checks the registrant list |
| 2 | In CNCF Slack and in `#cloud-native-karachi` | Organizer checks the channel against the Slack name in your request |
| 3 | In the [WhatsApp community group](https://chat.whatsapp.com/EI1MMr0gbtM5t3h5yYErIH) | Organizer checks the participant list |
| 4 | A GitHub account | The account that opens the request |
| 5 | You agree to the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md) | Checkbox, and your conduct afterwards |
| 6 | You follow the group on [LinkedIn](https://www.linkedin.com/company/cncg-karachi/), [Instagram](https://www.instagram.com/cloudnative.karachi/) and [Facebook](https://www.facebook.com/cloudnative.karachi), and amplify announcements | **Not checkable. Self-attested.** |

Requirement 6 is on your honour; those platforms do not expose it and we will not audit follower lists. It stays because reach is how a meetup fills a room.

Requirements 2 and 3 are verified once from the request issue and never committed here. Never put a phone number in this repository.

## Contribution units

Every claim needs evidence a reviewer can open.

| Contribution | Units | Evidence |
| --- | --- | --- |
| Delivered a talk, lightning talk or workshop | 2 | Event page, plus slides or recording |
| Sourced a venue, sponsor or external speaker that was used | 2 | Event page, plus the retro naming you |
| Presented an upstream CNCF contribution of yours to the group | 2 | The upstream PR or issue, plus the event page |
| Volunteered a full shift on event day | 1 | The retro naming you |
| Merged a pull request to a `cloud-native-karachi` repository | 1 each, capped at 2 | PR links |
| Published a recap, tutorial or article credited to the group | 1 | The published URL |
| Produced design or social assets the group published | 1 | The asset, plus the post |
| Sustained help in Slack or WhatsApp across 3 months | 1 | An organizer attests |

- Counted over the trailing 12 months.
- One activity, one claim. Speaking and volunteering at the same event is 3 units. Speaking twice at one event is 2.
- The PR cap means website-only contributors need one non-repository contribution to reach 3 units.
- The last row is the only judgement call, capped at 1 unit, and cannot be your only unit.

## Member

Listed in [members.yaml](../members/members.yaml), with the access in [the table below](#what-each-role-can-do).

1. All six [baseline requirements](#baseline-requirements).
2. **3 contribution units** in the trailing 12 months.
3. **2 events attended** in the trailing 12 months, checked in at the door. An RSVP is not attendance. Speaking counts.
4. **2 sponsors**, current Members or Organizers, one of whom worked with you directly. No self-sponsorship. Each comments on your request confirming what they vouch for.

Lowered during the [founding phase](#founding-phase). The `phase` field in [members.yaml](../members/members.yaml) says which set is in force.

### How to apply

1. Open a [membership request](https://github.com/cloud-native-karachi/community/issues/new?template=membership-request.yml), every unit with a link. Missing links get sent back, not rejected.
2. Ask your sponsors to comment.
3. An organizer verifies the baseline and the unit count, then you open a pull request adding yourself to [members.yaml](../members/members.yaml).
4. One organizer approval, green CI, then 72 hours of [lazy consensus](README.md#how-decisions-get-made).
5. On merge you are a Member. The [contributors WhatsApp group](https://chat.whatsapp.com/GF6ZkcVvBTCJPxzqUcJ6Sw) and the GitHub `members` team follow within 3 days.

Short of the bar, the reviewer names the missing requirement and what would close it. "Not yet, one more non-repository contribution" is useful. "No" is not.

Reviews are targeted within 14 days. Past that, ping `#cloud-native-karachi`; the delay is ours.

## Founding phase

The group opened with no events held and no Members listed, so nobody could meet the criteria above, including the organizers who wrote them.

| Requirement | Founding phase | Steady state |
| --- | --- | --- |
| Contribution units | 2 | 3 |
| Events attended | 1, or 0 if fewer than 2 have been held | 2 |
| Sponsors | 1, must be an Organizer | 2 Members or Organizers |
| Baseline requirements | All 6 | All 6 |

**The phase ends at 3 events held and 10 Members listed.** Both, not either. `scripts/validate_members.py` prints the count and the phase on every CI run, so the trigger is visible rather than remembered. An organizer then flips `phase` in [members.yaml](../members/members.yaml); that pull request announces the change rather than deciding it.

Members admitted under these rules carry `founding: true` permanently. It records which bar they cleared and implies no lesser status. Nobody is re-reviewed when the phase ends.

## SIG Lead

Owns a [SIG](sigs.md): its charter, roadmap and quarterly activity.

1. A Member for 3 months. Waived during the founding phase.
2. Delivered 2 activities in that SIG's topic area.
3. Nominated in a [SIG proposal](sigs.md#proposing-a-sig) or an issue, approved by a majority of organizers.
4. Commits to one SIG activity per quarter. The CNCF deems a group inactive after 90 days without an event, so a silent quarter is a direct risk to the group.

At most 2 leads per SIG, and a person leads at most 1 SIG.

Missing two consecutive quarters without declared leave hands the role back and the SIG goes [dormant](sigs.md#lifecycle).

## Organizer

Organizers run events, hold credentials, represent the group to the CNCF and carry Code of Conduct decisions. Full criteria, the vote, the CNCF request and offboarding are in **[organizers.md](organizers.md)**.

In summary: a Member for 6 months, owned 2 events end to end, completed [LFC102](https://training.linuxfoundation.org/training/inclusive-open-source-community-orientation-lfc102/), lives near Karachi, and works for an employer no current organizer works for.

That last one is a CNCF requirement and it binds on every nomination. Check the candidate's employer against the `org` field of every entry in [organizers.yaml](../members/organizers.yaml), and read [organizers.md](organizers.md#eligibility) before nominating anyone.

## What each role can do

| | Participant | Member | SIG Lead | Organizer |
| --- | --- | --- | --- | --- |
| Attend events | Yes | Yes | Yes | Yes |
| WhatsApp community group | Yes | Yes | Yes | Yes |
| `#cloud-native-karachi` | Yes | Yes | Yes | Yes |
| Contributors WhatsApp group | No | Yes | Yes | Yes |
| Listed on the website and register | No | Yes | Yes | Yes |
| GitHub | No | Triage | Write on their SIG directory | Admin |
| Sponsor a membership request | No | Yes | Yes | Yes |
| Approve a membership pull request | No | No | No | Yes |
| Co-host an event on the group page | No | No | Their SIG | Yes |
| Create events, edit the group page | No | No | No | Yes |
| Hold group credentials | No | No | No | Yes |
| Code of Conduct decisions | No | No | No | Yes |

Members get Triage, not Write: labelling and closing issues is the work, merging is not. Scoping is by [CODEOWNERS](../.github/CODEOWNERS) rather than the `OWNERS` files in `kubernetes/community`, which need Prow to mean anything.

## Inactivity and emeritus

Checked each January. A Member with 0 units in the previous 12 months moves to [emeritus.yaml](../members/emeritus.yaml) in one pull request covering everyone in that position. Each person is notified 14 days beforehand, and anyone who says they are still in stays.

Bookkeeping, not fault. Returning needs 1 unit and 1 sponsor. You can also move yourself to emeritus at any time, no justification needed.

Organizer inactivity differs because credentials have to move. See [organizers.md](organizers.md#leave-and-inactivity).

## The register

Three files under [members/](../members/), validated on every pull request. The validator checks the schema, rejects duplicates and self-sponsorship, confirms sponsors resolve to real Members or Organizers and SIG references to real directories, and enforces the sponsor count for the current phase.

Stored: GitHub handle, SIGs, sponsors, join date, link to your request. Optional: name, LinkedIn, employer, so a handle-only listing is fully supported.

Never stored: phone numbers, email addresses, WhatsApp names, Slack handles. A public git history cannot be un-scraped.

Schema: [members/README.md](../members/README.md).
