#!/usr/bin/env python3
"""Delivery Log generator — S17 rows binding GitHub commits to BRD scopes.

Reads `git log <base>..<branch>`, parses the `Scope:` / `Screen:` commit
trailers, and prints rows in the format of Architecture/brd-schema.md §3b for
pasting into a Living BRD's S17 via the Notion MCP.

Exit codes: 0 = every sha bound; 1 = unbound shas or unresolvable tokens
(named on stderr); 2 = unevaluable (not a git repo, no origin remote,
missing/unreadable screens registry, bad arguments). Exit 2 is never a pass.
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
SCOPE_TOKEN = re.compile(r"^(?:R\d+|SCR-\d{3}|chore)$")
SCR_TOKEN = re.compile(r"SCR-\d{3}")
PATHISH = re.compile(r"`([A-Za-z0-9_./@-]+/[A-Za-z0-9_.@-]+\.[A-Za-z0-9]{1,5})`")
HEADING = re.compile(r"^##[ \t]+(.*)$", re.M)
BOUND_HEADING = re.compile(r"(?i)^(frontend|prototype)\b")


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


def registry_ids(screens_dir):
    """SCR-IDs declared in screens/registry.md, or None if no registry is bound.

    None is a distinct value from an empty set. None means resolution is
    disabled — `--screens` was not given, so an SCR-<nnn> token is accepted
    on trust. An empty set means the directory *is* bound but its
    registry.md declares no SCR-IDs yet, so it still resolves: every
    SCR-<nnn> token is rejected as not-yet-registered, rather than silently
    passing because the set happened to be empty.
    """
    if screens_dir is None:
        return None
    path = os.path.join(screens_dir, "registry.md")
    if not os.path.isfile(path):
        raise Unevaluable("no registry.md in %s — cannot resolve SCR-IDs" % screens_dir)
    with open(path) as handle:
        return set(SCR_TOKEN.findall(handle.read()))


def _bound_block_paths(text):
    """Backticked paths inside ## Frontend / ## Prototype blocks only.

    Those are the blocks that name files (Architecture/screen-contract.md §3;
    design spec §4). A path mentioned in prose elsewhere in the contract file
    — Design rationale, an example, a QA note — must not bind, or a later
    legitimate commit touching that path gets false-flagged as silent.
    """
    headings = list(HEADING.finditer(text))
    paths = []
    for i, heading in enumerate(headings):
        if not BOUND_HEADING.match(heading.group(1).strip()):
            continue
        start = heading.end()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        paths.extend(PATHISH.findall(text[start:end]))
    return paths


def screen_index(screens_dir):
    """Repo-relative path -> SCR-ID, harvested from the Frontend/Prototype
    blocks of screens/SCR-<nnn>.md — the blocks that name files.

    Only backticked path tokens inside those blocks are indexed, so a file no
    Frontend/Prototype block names is not indexed: the check yields no false
    positives and may yield false negatives. Screen bindings belonging in the
    contract is the pre-existing rule (Architecture/screen-contract.md §3),
    not a demand made here.
    """
    index = {}
    if screens_dir is None:
        return index
    if not os.path.isdir(screens_dir):
        raise Unevaluable("screens directory not found: %s" % screens_dir)
    for name in sorted(os.listdir(screens_dir)):
        match = re.match(r"^(SCR-\d{3})\.md$", name)
        if not match:
            continue
        with open(os.path.join(screens_dir, name)) as handle:
            text = handle.read()
        for path in _bound_block_paths(text):
            index.setdefault(path, match.group(1))
    return index


def validate(commit, requirements, registry, index, covered):
    """Problems with one commit's bindings. Empty list = bound.

    `requirements` and `registry` are `None` when the corresponding CLI flag
    was not given (resolution disabled) and a set — possibly empty — when it
    was: an empty set still resolves, rejecting every token of that kind,
    rather than being mistaken for "not bound" and silently passing.
    """
    short = commit["sha"][:7]
    if short in covered or commit["sha"] in covered:
        return []
    problems = []
    if not commit["scopes"]:
        problems.append("%s (%s): no Scope: trailer" % (short, commit["subject"]))
    for token in commit["scopes"]:
        if not SCOPE_TOKEN.match(token):
            problems.append("%s: malformed scope token %r "
                            "(expected R<n>, SCR-<nnn> or chore)" % (short, token))
        elif token.startswith("R") and requirements is not None and token not in requirements:
            problems.append("%s: scope %s is not a requirement in S03" % (short, token))
        elif token.startswith("SCR-") and registry is not None and token not in registry:
            problems.append("%s: scope %s is not in the screens registry" % (short, token))
    for screen in commit["screens"]:
        if registry is not None and screen not in registry:
            problems.append("%s: screen %s is not in the screens registry" % (short, screen))
    named = set(commit["screens"]) | set(commit["scopes"])
    for path in commit["files"]:
        bound = index.get(path)
        if bound and bound not in named:
            problems.append("%s: touches %s (bound to %s) without naming it"
                            % (short, path, bound))
    return problems


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
    parser.add_argument("--requirements", default=None,
                        help="comma-separated R<n> IDs from the BRD's S03; "
                             "omit to disable requirement resolution "
                             "(a given-but-empty list still resolves, "
                             "rejecting every R<n> token)")
    parser.add_argument("--screens", default=None,
                        help="path to the project's screens/ directory; "
                             "omit to disable screen/registry resolution")
    parser.add_argument("--covered", default="",
                        help="comma-separated shas already carried by S17 "
                             "backfill rows")
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        slug = remote_slug(args.repo)
        commits = read_commits(args.repo, args.base, args.branch)
        registry = registry_ids(args.screens)
        index = screen_index(args.screens)
    except Unevaluable as problem:
        sys.stderr.write("unevaluable: %s\n" % problem)
        return 2

    requirements = None
    if args.requirements is not None:
        requirements = set(item.strip() for item in args.requirements.split(",") if item.strip())
    covered = set(item.strip() for item in args.covered.split(",") if item.strip())

    problems = []
    for commit in commits:
        found = validate(commit, requirements, registry, index, covered)
        problems.extend(found)
        if found:
            continue
        row = commit_row(commit, slug, args.phase, args.state)
        if commit["sha"][:7] in covered or commit["sha"] in covered:
            row += "\n  Backfill: <reason — fill in>"
        sys.stdout.write(row + "\n")

    for problem in problems:
        sys.stderr.write("unbound: %s\n" % problem)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
