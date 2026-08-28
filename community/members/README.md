# The register

| File | Holds |
| --- | --- |
| [organizers.yaml](organizers.yaml) | Current organizers, who must also appear on the CNCF group page |
| [members.yaml](members.yaml) | Current Members, plus the membership phase and event counter |
| [emeritus.yaml](emeritus.yaml) | Former Members and organizers |

A person appears in exactly one file; the validator enforces it. Role criteria are in [../governance/membership.md](../governance/membership.md). This page is the file format.

## What we store, and what we refuse to

The minimum that makes a role auditable: GitHub handle, sponsors, join date, link to the request. Enough for anyone to check the role was granted through the documented process.

**Optional:** `name`, `linkedin`, `org`. A handle-only listing is fully supported. Leave them out if you would rather not appear under your legal name or name your employer.

**Never:** phone numbers, email addresses, WhatsApp names, CNCF Slack handles. Those are verified once from the request issue and not copied here. You cannot rotate a scraped contact list, and deleting the line does not remove it from history.

Committed personal data qualifies for the immediate-merge exception in [../governance/README.md](../governance/README.md#changing-the-rules). Remove it, then treat the data as disclosed and tell the person, because history rewriting is unreliable once anyone has cloned the repository.

## Schema

### `members.yaml`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `phase` | `founding` or `steady` | Yes | The [membership phase](../governance/membership.md#founding-phase) |
| `events_held` | integer | Yes | All-time count, bumped by each retro pull request |
| `members` | list | Yes | May be empty |

Each entry:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `github` | string | Yes | Bare handle, no URL, no `@` |
| `sponsors` | list of handles | Yes | Must resolve to a current Member or organizer. No self-sponsorship. 1 during the founding phase and it must be an organizer, otherwise 2 |
| `since` | `YYYY-MM-DD` | Yes | Merge date, not a future date |
| `request` | URL | Yes | The request issue or pull request in this repository |
| `name` | string | No | Any name you want to be known by |
| `linkedin` | URL | No | |
| `org` | string | No | Self-declared |
| `sigs` | list | No | Each must match a directory under [../sigs/](../sigs/) |
| `founding` | boolean | No | Admitted under the founding phase. Permanent, and no lesser status |
| `on_leave_until` | `YYYY-MM-DD` | No | Pauses inactivity review |

### `organizers.yaml`

Same fields minus `sponsors` and `request`. `since` is the date the CNCF confirmed them. The role carries no end date; it runs until the person steps down or is removed, so nothing here expires. See [leave and inactivity](../governance/organizers.md#leave-and-inactivity).

Two further optional fields, organizers only, because the [CNCF organizer request](../governance/organizers.md#step-4-the-cncf-request) asks for both by URL and the answer should be in the register rather than in whoever filed last time:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `openprofile` | URL | No | Linux Foundation OpenProfile, `https://openprofile.dev/profile/<slug>` |
| `community_profile` | URL | No | Profile on the community platform behind the [group page](https://ocgroups.dev/cncf/group/cn-khi), `https://community2.cncf.io/u/<id>` |

Optional for the reason `name` and `linkedin` are, and storable for a different one: both are pages the person already publishes. The email address and CNCF Slack name on that same CNCF form are verification details, so they stay in the request issue under the rule above.

### `emeritus.yaml`

`github` and `until` (`YYYY-MM-DD`) required, plus `was` as one of `member`, `sig-lead` or `organizer`. `name`, `since` and `sigs` optional.

No reason field exists, deliberately. See the note in [emeritus.yaml](emeritus.yaml).

## Validation

```sh
uv run scripts/validate_members.py
```

Runs on every pull request. No setup beyond [uv](https://docs.astral.sh/uv/); dependencies are inline in the script.

**Fails on:** schema violations, unknown fields, a duplicate handle across the three files, a malformed or future `since`, a sponsor who is not a current Member or organizer, self-sponsorship, too few sponsors for the phase, a `sigs` entry with no matching directory, an `openprofile` or `community_profile` that is not on the expected host.

**Warns on:** a null GitHub handle, two organizers sharing an employer (a [CNCF eligibility constraint](../governance/organizers.md#requirement-6-in-practice)), and a `phase` that should have been flipped.

Warnings are decisions for a human, so they print rather than block. Ignoring the same warning for months is the signal to fix it or change the rule.

## Adding yourself

Not by pull request as a first step. Open a [membership request](https://github.com/cloud-native-karachi/community/issues/new?template=membership-request.yml) so evidence and sponsorships are reviewed first. Full sequence: [../governance/membership.md](../governance/membership.md#how-to-apply).

## Changing your own entry

Once you are listed, a stale `github`, `linkedin`, `org` or `sigs` value is a pull request against your own line, not a new request issue. There is no evidence and no sponsorship to review, so an issue would add a round trip and decide nothing. Say in the description which field changed and why. An organizer adds `register-update` and merges on one approval, the same threshold as a typo. The same path covers an entry in [emeritus.yaml](emeritus.yaml), where nobody is watching the handle at all.

A changed GitHub handle is the urgent one. GitHub releases your old handle the moment you rename it, and anyone may then claim it. Until the register catches up it points at an account you no longer control, and once someone else takes that name the register lists a stranger as a Member or an organizer. Open the pull request the day you rename, and expect a reviewer to treat it ahead of the queue.

Reviewing a handle change, do not merge on the pull request author alone; anyone can open a pull request claiming a rename happened. GitHub attributes past activity by account rather than by name, so the issue in the entry's `request` field, and any other issue or pull request that person has opened here, already shows the new handle. That match is the check. Where there is no such issue, which is the case for the founding organizers whose nomination sits in [cncf/communitygroups#761](https://github.com/cncf/communitygroups/issues/761), confirm over CNCF Slack or against the `openprofile` URL already in the entry.
