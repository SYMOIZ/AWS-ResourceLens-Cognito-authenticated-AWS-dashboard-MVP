# Organizers

Organizers run events, hold credentials, represent the group to the CNCF and carry Code of Conduct decisions. Whoever holds the role is listed in [organizers.yaml](../members/organizers.yaml).

The group cannot grant this role. We nominate; the CNCF appoints. The process below exists so that by the time we file with the CNCF, every field on their form is answered with evidence.

## What the role involves

Roughly 4 to 8 hours a month, more in the two weeks before an event.

- Own events. Not help at them. Date, venue, speakers, promotion, check-in, retro.
- Keep the group inside the CNCF's 90-day cadence rule. A quarter running out with nothing booked is your problem.
- Hold and protect credentials: group page, GitHub, WhatsApp, social accounts, the Code of Conduct reporting mailbox.
- Review membership requests within 14 days.
- Handle Code of Conduct reports, including unpopular decisions.
- Represent the group without favouring your employer. Organizers here work for companies that sell what our talks cover, so vendor neutrality is something we defend rather than assume.

## Eligibility

All seven. Check 5, 6 and 7 first; they are CNCF requirements and failing one makes the rest moot.

1. **A Member for 6 months**, continuous. Emeritus time does not count.
2. **Owned 2 events end to end**, named as owner in the planning issue and retro. A speaker is not an owner. Running the check-in desk is not owning.
3. **A clean Code of Conduct record**, plus judgement demonstrated in one difficult situation: a speaker cancelling, a venue falling through, a tense thread. Organizers cite the instance in the vote.
4. **Follow-through.** No event they owned was cancelled for a reason within their control, and they answered membership reviews or SIG duties on time.
5. **Lives in or near Karachi.** CNCF requirement.
6. **Works for an employer no current organizer works for.** CNCF requirement.
7. **Completed [LFC102](https://training.linuxfoundation.org/training/inclusive-open-source-community-orientation-lfc102/)** and holds the Credly badge. Free, about 2 hours. Do it before nomination.

### Requirement 6 in practice

Read the `org` field on every entry in [organizers.yaml](../members/organizers.yaml) before building a case for anyone. An employer already on that list rules the candidate out, and the roster has never had a spare employer to give away.

Tell anyone building toward the role this early. Where the strongest candidate works for an employer already listed, the honest options are SIG Lead, which carries most of the real influence and none of this constraint, or waiting for the roster to change. Do not file a CNCF request expecting an exception; that checkbox exists because the CNCF has watched local groups turn into a single vendor's user group.

`scripts/validate_members.py` warns when two organizers share an employer.

### The cap

Six organizers. Past that the answer to more capacity is more SIG Leads, because every organizer is another holder of every credential. Exceeding the cap needs a governance amendment.

## The process

### Step 1: nomination

A current organizer opens an [organizer nomination](https://github.com/cloud-native-karachi/community/issues/new?template=organizer-nomination.yml). Self-nomination is not accepted: if no organizer will put your name forward, ask one directly and they owe you a straight answer and the specific gap.

The nomination links the 2 events owned, the contribution history, the difficult situation from requirement 3, the candidate's employer against the current roster, and the LFC102 badge.

### Step 2: comment period

7 days, open to all Members. Concerns can go to any organizer privately, and organizers surface the substance in the vote without identifying who raised it.

### Step 3: the vote

| Organizers | Threshold |
| --- | --- |
| 5 or fewer | Unanimous among non-recused |
| 6 or more | Two thirds of non-recused |

Any organizer may block, with a written reason. A block is overridable by a two-thirds vote at the next organizers meeting, at least 14 days later, so one person cannot permanently gate the roster. An organizer blocking a candidate from a competing employer with no other reason is what the override is for.

### Step 4: the CNCF request

An organizer files an issue on [cncf/communitygroups](https://github.com/cncf/communitygroups/issues/new/choose) using the organizer request template. The candidate provides their own details; do not submit someone's personal information for them.

| CNCF form field | Source |
| --- | --- |
| Chapter name | `Cloud Native Karachi` |
| Name, email, company, GitHub, LinkedIn | The candidate |
| CNCF Slack workspace name | Baseline requirement 2, from the request issue; never stored in the register |
| Community platform profile | `community_profile` in [organizers.yaml](../members/organizers.yaml), checked against baseline requirement 1 |
| Linux Foundation OpenProfile | `openprofile` in [organizers.yaml](../members/organizers.yaml) |
| Why you want to be added | The nomination issue |
| Code of Conduct agreement | Baseline requirement 5 |
| Lives near Karachi | Eligibility 5 |
| Company differs from current organizers | Eligibility 6 |
| LFC102 badge link | Eligibility 7 |
| Vendor-neutral content standards | [speaking.md](../events/speaking.md) |
| Event at least every 90 days | The role, above |
| CNCF may approve other chapters nearby | Read and agree |
| Hosting diverse speakers | [speaking.md](../events/speaking.md) |

**The CNCF decides.** They may decline, ask questions, or take weeks. A candidate who passed our vote is not an organizer until the CNCF adds them to the group page. Say that at nomination time so a delay does not read as us stalling. Link the CNCF issue back into the nomination.

### Step 5: onboarding

Within 7 days of CNCF confirmation:

1. Pull request adding them to [organizers.yaml](../members/organizers.yaml) and removing them from `members.yaml`, `since` set to the confirmation date.
2. GitHub Admin, `organizers` team.
3. WhatsApp admin on both groups.
4. Access to the shared credential store.
5. Hand them an event to own in their first quarter.

## Leave and inactivity

The role runs from the CNCF confirmation date until the person steps down or is removed. Nothing lapses on a date.

Declared leave is normal. Say so in `#cloud-native-karachi` or an issue and set `on_leave_until`. The failure mode we guard against is silent absence, not absence.

Silent absence is caught each January, alongside the [credential audit](#the-rule-this-list-implies) and [member inactivity](membership.md#inactivity-and-emeritus). An organizer who owned no event and answered no membership review in the previous 12 months, and declared no leave, is asked directly whether they are still in. Anyone who says they are stays, no justification needed. Anyone unreachable for 14 days is offboarded below, because every organizer holds every credential and those cannot sit with someone nobody can reach.

## Stepping down and offboarding

Stepping down needs no reason and no notice. Open a pull request or tell the others.

Removal follows the [step 3](#step-3-the-vote) threshold with a 7-day comment period, except where a Code of Conduct finding requires immediate action under [moderation.md](moderation.md). The organizer recuses and responds in the issue before the vote.

### Credential rotation, within 7 days of the pull request merging

An organizer holds keys to everything the group is. Tick this off in the offboarding issue.

1. Move them from `organizers.yaml` to `emeritus.yaml` in one pull request.
2. File a CNCF organizer request for their **removal** from the group page. Same form as adding.
3. **Rotate both WhatsApp invite links.** An invite link is a bearer token: anyone holding it can join, and the only revocation is resetting the link, which kills every copy already shared. Re-share in `#cloud-native-karachi`, the contributors group and on the website.
4. Remove WhatsApp admin on both groups.
5. GitHub: drop from `organizers` and from Admin, confirm they no longer hold Owner. Add to `members` if they are staying on.
6. Rotate every shared credential they held: group page, LinkedIn page admin, Instagram, Facebook, domain registrar, design account, and the Code of Conduct reporting mailbox. Do the mailbox first; it holds reports about people.
7. Confirm no group asset sits only in a personal account: recordings, design sources, domain, photos, sponsor contacts, the private Code of Conduct record.
8. Thank them publicly. Most departures are people running out of time, and how the last one was treated is known to everyone considering the role.

### The rule this list implies

**Every group account is owned through the shared credential store, with at least 2 organizers holding access, and no group asset lives solely in a personal account.**

Build that in at setup, not at cleanup. The failure it prevents is mundane: an organizer drifts away, and the Instagram, the domain, or two years of event photos go with them.

Audit it each January. One question per asset: if this person stopped replying tomorrow, would we still have it?
