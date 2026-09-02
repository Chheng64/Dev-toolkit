#!/usr/bin/env python3
"""Delivery Log generator — S17 rows binding GitHub commits to BRD scopes.

Reads `git log <base>..<branch>`, parses the `Scope:` / `Screen:` commit
trailers, and prints rows in the format of Architecture/brd-schema.md §3b for
pasting into a Living BRD's S17 via the Notion MCP.

Exit codes: 0 = every sha bound; 1 = unbound shas or unresolvable tokens;
2 = unevaluable (not a git repo, no origin remote, bad arguments). Exit 2 is
never a pass.
"""

import argparse
import os
import re
import subprocess
import sys

FIELD = "\x1f"
RECORD = "\x1e"
TRAILER = re.compile(r"^(Scope|Screen):[ \t]*(.+?)[ \t]*$", re.M)
SLUG_HTTPS = re.compile(r"^https?://[^/]+/(?P<slug>[^/]+/[^/]+?)(?:\.git)?/?$")
SLUG_SSH = re.compile(r"^(?:ssh://)?git@[^:/]+[:/](?P<slug>[^/]+/[^/]+?)(?:\.git)?/?$")
CONVENTIONAL_PREFIX = re.compile(r"^\w+(?:\([^)]*\))?:\s*")
PHASES = ("FE", "BE", "single")
STATES = ("pushed", "pr-open", "merged", "released")


class Unevaluable(Exception):
    """Every exit-2 condition. The tool cannot judge, so it does not pass."""


def git_out(repo, args):
    proc = subprocess.Popen(["git", "-C", repo] + args,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            universal_newlines=True)
    out, err = proc.communicate()
    if proc.returncode != 0:
        raise Unevaluable("git %s failed in %s: %s"
                          % (" ".join(args), repo, err.strip()))
    return out


def parse_trailers(body):
    found = {"Scope": [], "Screen": []}
    for key, value in TRAILER.findall(body):
        found[key].extend(item.strip() for item in value.split(",") if item.strip())
    return found


def read_commits(repo, base, branch):
    fmt = FIELD.join(["%H", "%cs", "%s", "%B"]) + RECORD
    raw = git_out(repo, ["log", "--reverse", "--format=" + fmt,
                         "%s..%s" % (base, branch)])
    commits = []
    for record in raw.split(RECORD):
        record = record.strip("\n")
        if not record.strip():
            continue
        sha, date, subject, body = record.split(FIELD, 3)
        trailers = parse_trailers(body)
        files = [line for line in git_out(
            repo, ["show", "--pretty=format:", "--name-only", sha]).splitlines()
            if line.strip()]
        commits.append({"sha": sha, "date": date, "subject": subject,
                        "scopes": trailers["Scope"], "screens": trailers["Screen"],
                        "files": files})
    return commits


def remote_slug(repo):
    try:
        url = git_out(repo, ["remote", "get-url", "origin"]).strip()
    except Unevaluable:
        raise Unevaluable("no `origin` remote in %s — cannot build GitHub URLs" % repo)
    for pattern in (SLUG_HTTPS, SLUG_SSH):
        match = pattern.match(url)
        if match:
            return match.group("slug")
    raise Unevaluable("unrecognized origin URL %r — expected a GitHub http(s) or ssh remote" % url)


def commit_url(slug, sha):
    return "https://github.com/%s/commit/%s" % (slug, sha)


def commit_row(commit, slug, phase, state):
    screens = ", ".join(commit["screens"]) if commit["screens"] else "none"
    subject = CONVENTIONAL_PREFIX.sub("", commit["subject"], count=1)
    return ("- **[%s] `%s`** — %s.\n"
            "  Scope: %s · Screens: %s · Phase: %s · Repo: %s · State: %s\n"
            "  Link: %s"
            % (commit["date"], commit["sha"][:7], subject.rstrip("."),
               ", ".join(commit["scopes"]) or "—", screens, phase,
               slug.split("/")[-1], state, commit_url(slug, commit["sha"])))


def build_parser():
    parser = argparse.ArgumentParser(
        description="Generate S17 Delivery Log rows from commit trailers.")
    parser.add_argument("--repo", required=True, help="path to the git repository")
    parser.add_argument("--branch", required=True, help="the BRD's current-phase branch")
    parser.add_argument("--base", default="main", help="base branch (default: main)")
    parser.add_argument("--phase", default="single", choices=PHASES)
    parser.add_argument("--state", default="pushed", choices=STATES)
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        slug = remote_slug(args.repo)
        commits = read_commits(args.repo, args.base, args.branch)
    except Unevaluable as problem:
        sys.stderr.write("unevaluable: %s\n" % problem)
        return 2
    for commit in commits:
        sys.stdout.write(commit_row(commit, slug, args.phase, args.state) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
