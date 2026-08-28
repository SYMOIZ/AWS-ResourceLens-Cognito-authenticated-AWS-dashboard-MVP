#!/usr/bin/env -S uv run --quiet
# /// script
# requires-python = ">=3.11"
# dependencies = ["PyYAML>=6.0"]
# ///
"""Validate the Cloud Native Karachi member register.

Run it the way CI does:

    uv run scripts/validate_members.py

Errors fail the build. Warnings are things a human has to decide about, so they
print and the script still exits 0. The rules enforced here are the ones written
down in governance/membership.md; if the two disagree, that is a bug in one of
them and the governance document wins.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

import yaml

REPO = Path(__file__).resolve().parent.parent
MEMBERS = REPO / "members" / "members.yaml"
ORGANIZERS = REPO / "members" / "organizers.yaml"
EMERITUS = REPO / "members" / "emeritus.yaml"
SIGS_DIR = REPO / "sigs"

# GitHub's own rule: alphanumerics and single hyphens, no leading or trailing
# hyphen, 39 characters maximum.
HANDLE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$")
REPO_URL = "https://github.com/cloud-native-karachi/community/"

MEMBER_FIELDS = {
    "required": {"github", "sponsors", "since", "request"},
    "optional": {"name", "linkedin", "org", "sigs", "founding", "on_leave_until"},
}
ORGANIZER_FIELDS = {
    "required": {"github", "since"},
    "optional": {
        "name",
        "linkedin",
        "org",
        "sigs",
        "founding",
        "on_leave_until",
        "openprofile",
        "community_profile",
    },
}
EMERITUS_FIELDS = {
    "required": {"github", "was", "until"},
    "optional": {"name", "since", "sigs"},
}
EMERITUS_ROLES = {"member", "sig-lead", "organizer"}

# Public profile pages the CNCF organizer request asks for by URL. Both are
# pages the person already publishes, unlike the email and Slack name on the
# same form, which are verification details and stay in the request issue.
PROFILE_PREFIXES = {
    "openprofile": "https://openprofile.dev/profile/",
    "community_profile": "https://community2.cncf.io/u/",
}

# Thresholds from governance/membership.md#founding-phase.
STEADY_SPONSORS = 2
FOUNDING_SPONSORS = 1
PHASE_EXIT_EVENTS = 3
PHASE_EXIT_MEMBERS = 10


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def error(self, where: str, message: str) -> None:
        self.errors.append(f"{where}: {message}")

    def warn(self, where: str, message: str) -> None:
        self.warnings.append(f"{where}: {message}")


def load(path: Path, key: str, report: Report) -> tuple[dict[str, Any], list[dict]]:
    """Return the whole document and the list under `key`."""
    if not path.exists():
        report.error(path.name, "file is missing")
        return {}, []
    try:
        doc = yaml.safe_load(path.read_text()) or {}
    except yaml.YAMLError as exc:
        report.error(path.name, f"is not valid YAML: {exc}")
        return {}, []
    if not isinstance(doc, dict):
        report.error(path.name, "top level must be a mapping")
        return {}, []
    entries = doc.get(key)
    if entries is None:
        report.error(path.name, f"missing the `{key}` key")
        return doc, []
    if not isinstance(entries, list):
        report.error(path.name, f"`{key}` must be a list")
        return doc, []
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            report.error(path.name, f"entry {i} is not a mapping")
            return doc, []
    return doc, entries


def label(path: Path, entry: dict, index: int) -> str:
    return f"{path.name}[{entry.get('github') or entry.get('name') or index}]"


def check_fields(where: str, entry: dict, spec: dict, report: Report) -> None:
    keys = set(entry)
    for missing in sorted(spec["required"] - keys):
        report.error(where, f"missing required field `{missing}`")
    allowed = spec["required"] | spec["optional"]
    for unknown in sorted(keys - allowed):
        report.error(where, f"unknown field `{unknown}`")


def check_handle(where: str, entry: dict, report: Report) -> None:
    handle = entry.get("github")
    if handle is None:
        # Tolerated so the founding register can be committed before everyone is
        # in the GitHub org. Guessing a handle would point at a stranger.
        report.warn(where, "GitHub handle is null, fill it in once known")
        return
    if not isinstance(handle, str) or not HANDLE.match(handle):
        report.error(where, f"`{handle}` is not a valid GitHub handle")
    elif handle.startswith("@") or "/" in handle:
        report.error(where, "`github` takes a bare handle, not a URL or @mention")


def check_date(where: str, entry: dict, key: str, report: Report, *, required: bool) -> date | None:
    raw = entry.get(key)
    if raw is None:
        if required:
            report.error(where, f"`{key}` is missing")
        return None
    # PyYAML parses unquoted YYYY-MM-DD into a date already.
    if isinstance(raw, date):
        value = raw
    else:
        try:
            value = date.fromisoformat(str(raw))
        except ValueError:
            report.error(where, f"`{key}` must be YYYY-MM-DD, got `{raw}`")
            return None
    if value > date.today():
        report.error(where, f"`{key}` is in the future ({value})")
    return value


def check_profiles(where: str, entry: dict, report: Report) -> None:
    """Both fields are optional; a listed one has to be the real profile URL."""
    for key, prefix in PROFILE_PREFIXES.items():
        url = entry.get(key)
        if url is None:
            continue
        if not isinstance(url, str) or not url.startswith(prefix):
            report.error(where, f"`{key}` must be a URL starting `{prefix}`")


def check_sigs(where: str, entry: dict, known: set[str], report: Report) -> None:
    sigs = entry.get("sigs", [])
    if not isinstance(sigs, list):
        report.error(where, "`sigs` must be a list")
        return
    for sig in sigs:
        if sig not in known:
            report.error(where, f"`{sig}` has no directory under sigs/")


def check_sponsors(
    where: str,
    entry: dict,
    eligible: set[str],
    organizers: set[str],
    phase: str,
    report: Report,
) -> None:
    sponsors = entry.get("sponsors")
    if not isinstance(sponsors, list) or not sponsors:
        report.error(where, "`sponsors` must be a non-empty list of GitHub handles")
        return
    if len(set(sponsors)) != len(sponsors):
        report.error(where, "the same sponsor is listed twice")

    handle = entry.get("github")
    if handle and handle in sponsors:
        report.error(where, "self-sponsorship is not allowed")

    for sponsor in sponsors:
        if sponsor not in eligible:
            report.error(
                where,
                f"sponsor `{sponsor}` is not a current member or organizer",
            )

    if phase == "founding":
        if len(sponsors) < FOUNDING_SPONSORS:
            report.error(where, f"needs {FOUNDING_SPONSORS} sponsor in the founding phase")
        elif not any(s in organizers for s in sponsors):
            report.error(where, "founding-phase sponsor must be an organizer")
    elif len(sponsors) < STEADY_SPONSORS:
        report.error(where, f"needs {STEADY_SPONSORS} sponsors, found {len(sponsors)}")


def check_request(where: str, entry: dict, report: Report) -> None:
    url = entry.get("request")
    if not isinstance(url, str) or not url.startswith(REPO_URL):
        report.error(where, "`request` must link to an issue or pull request in this repository")


def main() -> int:
    report = Report()
    known_sigs = {
        p.name
        for p in SIGS_DIR.iterdir()
        if p.is_dir() and p.name.startswith("sig-")
    } if SIGS_DIR.is_dir() else set()

    _, organizers = load(ORGANIZERS, "organizers", report)
    mem_doc, members = load(MEMBERS, "members", report)
    _, emeritus = load(EMERITUS, "emeritus", report)

    phase = mem_doc.get("phase")
    if phase not in {"founding", "steady"}:
        report.error(MEMBERS.name, f"`phase` must be `founding` or `steady`, got `{phase}`")
        phase = "founding"

    events_held = mem_doc.get("events_held")
    if not isinstance(events_held, int) or events_held < 0:
        report.error(MEMBERS.name, "`events_held` must be a non-negative integer")
        events_held = 0

    organizer_handles = {o["github"] for o in organizers if o.get("github")}
    member_handles = {m["github"] for m in members if m.get("github")}
    eligible = organizer_handles | member_handles

    for i, entry in enumerate(organizers):
        where = label(ORGANIZERS, entry, i)
        check_fields(where, entry, ORGANIZER_FIELDS, report)
        check_handle(where, entry, report)
        check_profiles(where, entry, report)
        check_sigs(where, entry, known_sigs, report)
        check_date(where, entry, "since", report, required=True)

    for i, entry in enumerate(members):
        where = label(MEMBERS, entry, i)
        check_fields(where, entry, MEMBER_FIELDS, report)
        check_handle(where, entry, report)
        check_sigs(where, entry, known_sigs, report)
        check_date(where, entry, "since", report, required=True)
        check_request(where, entry, report)
        check_sponsors(where, entry, eligible, organizer_handles, phase, report)

    for i, entry in enumerate(emeritus):
        where = label(EMERITUS, entry, i)
        check_fields(where, entry, EMERITUS_FIELDS, report)
        check_handle(where, entry, report)
        check_sigs(where, entry, known_sigs, report)
        check_date(where, entry, "until", report, required=True)
        if entry.get("was") not in EMERITUS_ROLES:
            report.error(where, f"`was` must be one of {sorted(EMERITUS_ROLES)}")

    # A person holds exactly one role, so a handle appears in exactly one file.
    seen: dict[str, str] = {}
    for path, entries in ((ORGANIZERS, organizers), (MEMBERS, members), (EMERITUS, emeritus)):
        for entry in entries:
            handle = entry.get("github")
            if not handle:
                continue
            key = handle.lower()
            if key in seen:
                report.error(
                    handle,
                    f"listed in both {seen[key]} and {path.name}; a person holds one role",
                )
            else:
                seen[key] = path.name

    # CNCF asks a new organizer to confirm their employer differs from every
    # current organizer's. Surface it rather than discovering it at nomination.
    employers: dict[str, list[str]] = {}
    for entry in organizers:
        org = entry.get("org")
        if org:
            employers.setdefault(org, []).append(entry.get("name") or entry.get("github") or "?")
    for org, people in sorted(employers.items()):
        if len(people) > 1:
            report.warn(
                ORGANIZERS.name,
                f"{len(people)} organizers work for {org} ({', '.join(people)}); "
                "CNCF asks a new organizer to confirm a different employer, so "
                "candidates from these companies are not eligible today",
            )

    if phase == "founding" and events_held >= PHASE_EXIT_EVENTS and len(members) >= PHASE_EXIT_MEMBERS:
        report.warn(
            MEMBERS.name,
            f"founding phase exit criteria are met ({events_held} events, "
            f"{len(members)} members). Flip `phase` to `steady`",
        )
    if phase == "steady" and (events_held < PHASE_EXIT_EVENTS or len(members) < PHASE_EXIT_MEMBERS):
        report.warn(
            MEMBERS.name,
            "phase is `steady` but the exit criteria are not met; steady thresholds "
            "are being applied early",
        )

    print(
        f"Register: {len(organizers)} organizers, {len(members)} members, "
        f"{len(emeritus)} emeritus. Phase: {phase}. Events held: {events_held}."
    )
    if phase == "founding":
        print(
            f"  Founding phase ends at {PHASE_EXIT_EVENTS} events and "
            f"{PHASE_EXIT_MEMBERS} members. "
            f"Needs {max(0, PHASE_EXIT_EVENTS - events_held)} more events, "
            f"{max(0, PHASE_EXIT_MEMBERS - len(members))} more members."
        )

    for warning in report.warnings:
        print(f"warning: {warning}")
    for error in report.errors:
        print(f"error: {error}", file=sys.stderr)

    if report.errors:
        print(f"\n{len(report.errors)} error(s). See members/README.md.", file=sys.stderr)
        return 1
    print(f"\nRegister is valid ({len(report.warnings)} warning(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
