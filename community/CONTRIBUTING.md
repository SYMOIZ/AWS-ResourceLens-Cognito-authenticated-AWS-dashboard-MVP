# Contributing

This repository holds the rules and the register. Website changes go to [cloud-native-karachi.github.io](https://github.com/cloud-native-karachi/cloud-native-karachi.github.io).

Anyone can open an issue or a pull request. You do not need to be a Member. Merging is gated by [CODEOWNERS](.github/CODEOWNERS), so changes to the register or to `governance/` need an organizer whatever your role.

## Pick the right entry point

Most things start as an issue, because evidence and sponsorships get reviewed before the register changes.

| Change | Start with |
| --- | --- |
| Becoming a Member | A [membership request](https://github.com/cloud-native-karachi/community/issues/new?template=membership-request.yml), not a pull request |
| Speaking at a meetup | A [talk proposal](https://github.com/cloud-native-karachi/community/issues/new?template=talk-proposal.yml) |
| Starting a SIG | A [SIG proposal](https://github.com/cloud-native-karachi/community/issues/new?template=sig-proposal.yml) |
| Becoming an organizer | Talk to an organizer. See [governance/organizers.md](governance/organizers.md) |
| Your handle, LinkedIn or employer changed | Straight to a pull request. See [members/README.md](members/README.md#changing-your-own-entry) |
| Typo, dead link, unclear sentence | Straight to a pull request |
| Changing a rule | A pull request against `governance/`, with the rationale |

## Review thresholds

Full table in [governance/README.md](governance/README.md#who-decides-what). The common ones:

- **Typo or dead link.** One approval, merged.
- **A new Member.** One organizer approves, then 72 hours of lazy consensus.
- **A rule change.** Two thirds of organizers, 7-day comment period, and the pull request states the problem it solves.

Silence is assent under lazy consensus. An objection says what is wrong and, where possible, what would fix it.

## Before you open a pull request

If you touched `members/` or `sigs/`:

```sh
uv run scripts/validate_members.py
```

Nothing to install beyond [uv](https://docs.astral.sh/uv/); dependencies are declared inline in the script. With [mise](https://mise.jdx.dev), `mise run check` is the full CI gate.

Check internal links resolve. Most review comments here are about a link pointing at a renamed heading.

## Never commit

- A person's phone number, email address, WhatsApp name or CNCF Slack handle. See [members/README.md](members/README.md#what-we-store-and-what-we-refuse-to). Group accounts are different: the reporting mailbox in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) is published on purpose.
- A WhatsApp invite link anywhere one does not already exist. They are bearer tokens, and the only revocation is resetting the link, which kills every copy already shared.
- Credentials of any kind.
- A private Code of Conduct record. Those live in the group credential store.

If personal data does get committed, say so and remove it. Do not quietly force-push and assume it is gone; once a public repository is cloned or mirrored, treat the data as disclosed and tell the person.

## Commits and style

Conventional Commits, scoped where obvious:

```text
docs(governance): clarify the founding-phase sponsor rule
feat(members): add Ada Lovelace as a founding member
fix(scripts): reject self-sponsorship in the validator
```

Signing is recommended, not required; requiring it is the wrong barrier for a community repository.

Write the message yourself. Say why the change was needed, since the diff already shows what changed. Use whatever tooling helps you get there, and keep the author and co-author lines as people: those are the names someone comes back to a year later with a question.

Prose: plain English, active voice, name the agent, be concrete, give a number rather than a category word. ASCII punctuation only, no em dashes or arrows. Short over complete. Where a requirement cannot be verified, say so; where the CNCF decides and we do not, say that too. A governance document that oversells its own enforceability is worse than none, because people plan around it.

Counts and dates stay in the register. Write "the organizers listed in [organizers.yaml](members/organizers.yaml)" rather than "three organizers", and leave registration numbers on the group page. A headcount written into prose is wrong the day someone joins, and nobody thinks to grep for it.

## Labels

Ten, each with what it means in [.github/labels.yml](.github/labels.yml). The issue forms apply four of them for you; organizers add the rest.

The one that concerns you is `needs-info`. It means the request is waiting on you rather than on a reviewer, and the comment says what would close it. It is not a rejection.

Organizers keep the set in step with `mise run labels -- --apply`. A new label starts as a change to that file, because a label created in the web UI carries no explanation of when to use it.

## Reviewing

Reviewing a request that is short of the bar, name the missing requirement and what would close it. "Not yet, one more non-repository contribution" is useful. "No" costs the group a contributor.
