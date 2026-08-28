#!/usr/bin/env -S uv run --quiet
# /// script
# requires-python = ">=3.11"
# dependencies = ["PyYAML>=6.0"]
# ///
"""Bring a repository's issue labels in line with .github/labels.yml.

    uv run scripts/sync_labels.py              print the plan, change nothing
    uv run scripts/sync_labels.py --apply      make the change

Prints the plan by default because this writes to GitHub rather than to the
working tree, and a label rename is visible to everyone who has filtered on it.

A label on the repository that is in neither list is left alone and reported. The
script never deletes something it does not recognise; if a label should go, it
goes in the `delete` list where the reason can be read.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
LABELS = REPO / ".github" / "labels.yml"
DEFAULT_REPO = "cloud-native-karachi/community"


def gh(*args: str) -> str:
    """Run gh and return stdout, failing with gh's own message."""
    result = subprocess.run(["gh", *args], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"gh {' '.join(args)}\n{result.stderr.strip()}")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="make the changes")
    parser.add_argument("--repo", default=DEFAULT_REPO, help=f"default {DEFAULT_REPO}")
    args = parser.parse_args()

    if shutil.which("gh") is None:
        sys.exit("gh is not installed. https://cli.github.com")

    doc = yaml.safe_load(LABELS.read_text())
    wanted = {entry["name"]: entry for entry in doc.get("labels", [])}
    unwanted = set(doc.get("delete", []))

    overlap = wanted.keys() & unwanted
    if overlap:
        sys.exit(f"{LABELS.name} both keeps and deletes: {', '.join(sorted(overlap))}")

    existing = {
        label["name"]: label
        for label in json.loads(
            gh("label", "list", "--repo", args.repo, "--limit", "200",
               "--json", "name,color,description")
        )
    }

    create = [name for name in wanted if name not in existing]
    update = [
        name
        for name, entry in wanted.items()
        if name in existing
        and (
            existing[name]["color"].lower() != str(entry["color"]).lower()
            or (existing[name]["description"] or "") != entry.get("description", "")
        )
    ]
    delete = [name for name in unwanted if name in existing]
    strangers = [
        name for name in existing if name not in wanted and name not in unwanted
    ]

    for name in create:
        print(f"create  {name}")
    for name in update:
        print(f"update  {name}")
    for name in delete:
        print(f"delete  {name}")
    for name in strangers:
        print(f"left    {name}  (not in {LABELS.name}, nobody else knows what it means)")

    if not (create or update or delete):
        print(f"{args.repo} already matches {LABELS.name}")
        return 0

    if not args.apply:
        print(f"\nPlan only. Re-run with --apply to change {args.repo}.")
        return 0

    for name in create + update:
        entry = wanted[name]
        # --force creates or updates, so one call covers both cases.
        gh("label", "create", name, "--repo", args.repo, "--force",
           "--color", str(entry["color"]),
           "--description", entry.get("description", ""))
        print(f"done    {name}")

    for name in delete:
        gh("label", "delete", name, "--repo", args.repo, "--yes")
        print(f"deleted {name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
