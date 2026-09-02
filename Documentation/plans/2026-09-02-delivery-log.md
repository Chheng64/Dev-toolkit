# Delivery Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Product Owner GitHub links in Notion at feature, scope and screen granularity — written at every push, not only when a PR opens — and a guard that stops a stage exit while any commit on the branch is unaccounted for.

**Architecture:** Commits carry `Scope:` / `Screen:` git trailers. A new stdlib-only Python tool reads `git log`, validates every sha against the BRD's requirement IDs and the project's screen registry, and prints ready-to-paste rows for a new append-only BRD section, S17 · Delivery Log, plus three new URL properties the PO reads in a Notion view. A new guard, C_DELIVERY, blocks `Implementation` exit and `Tech Review` → `PR` until every sha is covered — by a trailer or by a backfill row, never by rewriting pushed history.

**Tech Stack:** Markdown modules (the toolkit itself), Python 3 stdlib only (`argparse`, `re`, `subprocess`, `os`, `json`, `datetime`, `unittest`), git, `python3 tools/toolkit-check.py` as the repo's consistency gate.

**Spec:** [Documentation/specs/2026-09-02-delivery-log-design.md](../specs/2026-09-02-delivery-log-design.md)

## Global Constraints

- **Branch:** `feat/delivery-log`, already created, already holding the spec commits. Do not branch again.
- **Target version:** `v2.1.0` — additive only. No existing property changes type or meaning; no section ID changes; no rights are removed.
- **`python3 tools/toolkit-check.py` must exit 0 after every single commit.** It is run from the repo root. A commit that leaves it red is a broken commit, not a work-in-progress.
- **Never add a guard name to `GUARD_TRANSITION_EXEMPT` or `GUARD_CHECKLIST_EXEMPT`** in `tools/toolkit-check.py`. Those lists exist for structural guards; using one to silence a new guard's missing citation is defeating the checker, not passing it.
- **The guard name appears backticked in a `.md` file only from Task 5 onward** — rule G of the checker fails any backticked `C_*` token that `Architecture/workflow-state-machine.md` §4 does not define. Task 5 defines it and cites it in the same commit. Before Task 5, prose in this repo writes it unbackticked.
- **Python: standard library only.** No pip installs, no `requests`, no network calls, no Notion credentials in any tool. `tools/toolkit-check.py` is the house style to follow: module-level regex constants, small named functions, `%`-formatting, exit code 2 reserved for "unevaluable".
- **Exit codes for `tools/delivery-log.py`:** `0` every sha bound and every token resolves · `1` unbound shas or unresolvable tokens (each named on stderr) · `2` unevaluable (not a git repo, no `origin` remote, unreadable registry, bad arguments). Exit 2 is never a pass.
- **Row grammar is normative** — copy it from spec §3.2 exactly, including the `·` separators (U+00B7) and the two-space indent on continuation lines.
- **Closed vocabularies:** scope tokens `R<n>` · `SCR-<nnn>` · `chore`; states `pushed` · `pr-open` · `merged` · `released`; phases `FE` · `BE` · `single`.
- **Commit messages in this repo:** Conventional Commits subject, body explaining why, and the trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

### Task 1: BRD schema — S17, three properties, migration clause

**Files:**
- Modify: `Architecture/brd-schema.md` (§1 property table, §2 section table, new §3b, §5 invariants)
- Test: `python3 tools/toolkit-check.py` + the greps in Step 4

**Interfaces:**
- Consumes: nothing (first task).
- Produces: the section ID `S17`, the section name `Delivery Log`, the property names `Compare`, `Merge SHA`, `Release Tag`, and the row grammar every later task quotes.

- [ ] **Step 1: Add the three properties to §1**

In `Architecture/brd-schema.md`, find the property table row for `PR` and the rows after it. Insert the three new rows immediately **after** the `BE PR` row and **before** the `Approvals` row:

```markdown
| `Compare` | URL | `https://github.com/<owner>/<repo>/compare/<base>...<branch>` | Git link — the **current phase's** branch diff, live from branch creation. Written by the Git Manager at Implementation entry (v2.1) |
| `Merge SHA` | URL | `https://github.com/<owner>/<repo>/commit/<sha>` | Git link — the **current phase's** merge commit on main. Written at `Merged` (v2.1) |
| `Release Tag` | URL | `https://github.com/<owner>/<repo>/releases/tag/<tag>` | Git link — the release the BRD shipped in. Written at `Released` (v2.1) |
```

- [ ] **Step 2: Add the S17 row to §2**

In the same file, find the section table row for `S16` (`| S16 | Decision Log | append-only | ...`). Add one row immediately after it:

```markdown
| S17 | Delivery Log | append-only | One row per commit binding a GitHub link to the scopes (`R<n>`) and screens (`SCR-<nnn>`) it delivered; rollup rows at `PR`, `Merged`, `Released`. Format in §3b. Never edited, only appended |
```

- [ ] **Step 3: Add §3b — the row grammar**

Insert a new section between the existing `## 3. Decision Log Entry Format (S16)` section and `## 4. Minimum Viable BRD`:

```markdown
## 3b. Delivery Log Row Format (S17)

A **commit row**, one per commit on the BRD's branch:

    - **[YYYY-MM-DD] `<sha7>`** — <commit subject>.
      Scope: <token>[, <token>…] · Screens: <SCR-id>[, <SCR-id>…] | none · Phase: FE | BE | single · Repo: <repo-name> · State: pushed
      Link: https://github.com/<owner>/<repo>/commit/<sha>

A **backfill row** is a commit row plus a fourth line, and its `<sha7>` may be a range `<sha7>..<sha7>`:

      Backfill: <reason>

A **rollup row**, written at `PR`, `Merged` and `Released`:

    - **[YYYY-MM-DD] [<Stage>] [Git Manager]** — <n> commits · Scope covered: R1–R4 · Screens: SCR-014, SCR-015.
      State: pr-open | merged | released · Repo: <repo-name>
      Link: <PR | merge-commit | tag URL> · Compare: <compare URL>

Rules:

- `Scope:` — closed vocabulary: `R<n>` (must exist as a requirement in S03) · `SCR-<nnn>` (must exist in the project's `screens/registry.md`) · `chore` (reserved for commits that deliver no requirement: merges, reverts, branch hygiene, tooling).
- `Screens:` — a mandatory field with optional content; `none` when the commit touches no screen-bound file.
- `Repo:` — mandatory on every row, single-repo BRDs included, so the grammar has no conditional form. Multi-repo BRDs ([integration-map](integration-map.md) §3) emit one row set per bound repo.
- `State:` — closed vocabulary `pushed` · `pr-open` · `merged` · `released`. For any sha, the newest row wins; a sha legitimately appears several times as its state advances.
- **Dates:** a commit row carries its **commit's** date; a rollup row carries the **write** date. Commit rows must regenerate identically weeks later.
- Rows are generated by `tools/delivery-log.py`, appended one Notion write per push (never one write per commit), and never edited or deleted — S16's rule, for S16's reason.
- S17 is never named in a `C_SECTIONS(ids)` requirement: an empty Delivery Log is the correct state for a BRD whose branch has not been pushed to yet. Coverage is the delivery guard's job, at the one point where rows must exist.
```

- [ ] **Step 4: Verify the schema edits**

Run:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 tools/toolkit-check.py
grep -c '^| `Compare`\|^| `Merge SHA`\|^| `Release Tag`' Architecture/brd-schema.md
grep -c '^| S17 | Delivery Log | append-only' Architecture/brd-schema.md
grep -c '^## 3b. Delivery Log Row Format (S17)' Architecture/brd-schema.md
```

Expected: `toolkit-check: 132 files, 0 violations`, then `3`, then `1`, then `1`.

- [ ] **Step 5: Add the migration clause to §5**

In `Architecture/brd-schema.md` §5 Invariants, after invariant 5 (the v2.0 migration clause), add invariant 6:

```markdown
6. **v2.1 migration.** One clause: a BRD **already past `Implementation`** at cutover carries no S17,
   and the delivery guard does not apply to it. A BRD **at or before `Implementation`** gets S17
   scaffolded at its next stage entry; the guard applies to every commit made from that point, and
   any pre-cutover sha already on its branch is covered by a single backfill row naming the sha
   range with the reason `pre-v2.1 history`.
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
python3 tools/toolkit-check.py
grep -c 'v2.1 migration' Architecture/brd-schema.md
```

Expected: `0 violations`, then `1`.

```bash
git add Architecture/brd-schema.md
git commit -m "$(cat <<'MSG'
feat(schema): S17 Delivery Log plus Compare / Merge SHA / Release Tag

The BRD holds Git links only from lifecycle state 09, so the whole of
Implementation is invisible in Notion and the commit-to-requirement mapping
never gets recorded at all. S17 is the append-only ledger for it; the three
properties are what a Product Owner view renders.

Additive: no existing property changes type or meaning, no section ID moves.
S17 is deliberately excluded from C_SECTIONS — an empty Delivery Log is
correct before the first push.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 2: `tools/delivery-log.py` — read commits, emit rows

**Files:**
- Create: `tools/delivery-log.py`
- Create: `tools/test_delivery_log.py`

**Interfaces:**
- Consumes: the row grammar from Task 1 (`Architecture/brd-schema.md` §3b).
- Produces, for Tasks 3 and 4:
  - `class Unevaluable(Exception)` — raised for every exit-2 condition
  - `git_out(repo, args) -> str`
  - `parse_trailers(body) -> dict` with keys `"Scope"` and `"Screen"`, values `list[str]`
  - `read_commits(repo, base, branch) -> list[dict]`, each dict having keys `sha`, `date`, `subject`, `scopes`, `screens`, `files`
  - `remote_slug(repo) -> str` (e.g. `"acme/widget"`)
  - `commit_url(slug, sha) -> str`
  - `commit_row(commit, slug, phase, state) -> str`
  - `build_parser() -> argparse.ArgumentParser`
  - `main(argv=None) -> int`

- [ ] **Step 1: Write the failing tests**

Create `tools/test_delivery_log.py`:

```python
#!/usr/bin/env python3
"""Tests for tools/delivery-log.py. Stdlib only: python3 tools/test_delivery_log.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, "delivery-log.py")
BRANCH = "feat/brd-rp-042-identity"


def git(repo, *args):
    subprocess.check_call(["git", "-C", repo] + list(args),
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def make_repo(commits, remote="https://github.com/acme/widget.git"):
    """commits: list of (message, [relative paths touched]). Returns repo path."""
    repo = tempfile.mkdtemp(prefix="delivery-log-test-")
    git(repo, "init", "-q", "-b", "main")
    git(repo, "config", "user.email", "test@example.com")
    git(repo, "config", "user.name", "Test")
    with open(os.path.join(repo, "README.md"), "w") as handle:
        handle.write("seed\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "chore: seed")
    if remote:
        git(repo, "remote", "add", "origin", remote)
    git(repo, "checkout", "-q", "-b", BRANCH)
    for message, paths in commits:
        for path in paths:
            full = os.path.join(repo, path)
            directory = os.path.dirname(full)
            if directory and not os.path.isdir(directory):
                os.makedirs(directory)
            with open(full, "a") as handle:
                handle.write("x\n")
        git(repo, "add", "-A")
        git(repo, "commit", "-q", "-m", message)
    return repo


def run(args):
    proc = subprocess.run([sys.executable, TOOL] + args,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          universal_newlines=True)
    return proc.returncode, proc.stdout, proc.stderr


class RowTest(unittest.TestCase):
    def setUp(self):
        self.repos = []

    def tearDown(self):
        for repo in self.repos:
            shutil.rmtree(repo, ignore_errors=True)

    def repo(self, commits, remote="https://github.com/acme/widget.git"):
        path = make_repo(commits, remote)
        self.repos.append(path)
        return path

    def test_row_carries_scope_screen_repo_and_link(self):
        repo = self.repo([("feat(BRD-RP-042): add profile lookup guard\n\n"
                           "Scope: R3, R4\nScreen: SCR-014\n", ["src/profile.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--phase", "FE"])
        self.assertEqual(code, 0, err)
        self.assertIn("— add profile lookup guard.", out)
        self.assertIn("Scope: R3, R4 · Screens: SCR-014 · Phase: FE · "
                      "Repo: widget · State: pushed", out)
        self.assertRegex(out, r"Link: https://github\.com/acme/widget/commit/[0-9a-f]{40}")

    def test_no_screen_trailer_renders_none(self):
        repo = self.repo([("fix(BRD-RP-042): guard null session\n\nScope: R3\n",
                           ["src/session.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--phase", "single"])
        self.assertEqual(code, 0, err)
        self.assertIn("Screens: none", out)

    def test_chore_scope_is_a_legal_token(self):
        repo = self.repo([("chore(BRD-RP-042): rebase on main\n\nScope: chore\n",
                           ["src/session.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 0, err)
        self.assertIn("Scope: chore", out)

    def test_one_row_per_commit_in_commit_order(self):
        repo = self.repo([
            ("feat(BRD-RP-042): first\n\nScope: R1\n", ["src/a.ts"]),
            ("feat(BRD-RP-042): second\n\nScope: R2\n", ["src/b.ts"]),
        ])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 0, err)
        self.assertEqual(out.count("Link: https://github.com/acme/widget/commit/"), 2)
        self.assertLess(out.index("— first."), out.index("— second."))

    def test_ssh_remote_resolves_to_the_same_slug(self):
        repo = self.repo([("feat(BRD-RP-042): ssh\n\nScope: R1\n", ["src/a.ts"])],
                         remote="git@github.com:acme/widget.git")
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 0, err)
        self.assertIn("Repo: widget", out)
        self.assertIn("https://github.com/acme/widget/commit/", out)

    def test_missing_remote_is_unevaluable(self):
        repo = self.repo([("feat(BRD-RP-042): no remote\n\nScope: R1\n", ["src/a.ts"])],
                         remote=None)
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 2)
        self.assertIn("origin", err)

    def test_not_a_git_repo_is_unevaluable(self):
        empty = tempfile.mkdtemp(prefix="delivery-log-test-")
        self.repos.append(empty)
        code, out, err = run(["--repo", empty, "--branch", BRANCH])
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
python3 tools/test_delivery_log.py
```

Expected: every test errors — the tool file does not exist yet, so each subprocess run returns a non-zero code with `can't open file`. Confirm the failures name `delivery-log.py`, not a bug in the test harness.

- [ ] **Step 3: Write the minimal implementation**

Create `tools/delivery-log.py`:

```python
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
    return ("- **[%s] `%s`** — %s.\n"
            "  Scope: %s · Screens: %s · Phase: %s · Repo: %s · State: %s\n"
            "  Link: %s"
            % (commit["date"], commit["sha"][:7], commit["subject"].rstrip("."),
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
python3 tools/test_delivery_log.py
```

Expected: `OK` — 7 tests. If `test_not_a_git_repo_is_unevaluable` fails with exit 1 instead of 2, the `Unevaluable` path is not wrapping `remote_slug`; fix that rather than the test.

- [ ] **Step 5: Commit**

```bash
chmod +x tools/delivery-log.py
git add tools/delivery-log.py tools/test_delivery_log.py
git commit -m "$(cat <<'MSG'
feat(tools): delivery-log.py reads commit trailers and emits S17 rows

Stdlib only, no network, no credentials — the toolkit-check.py shape. Reads
git log base..branch, parses Scope:/Screen: trailers, derives owner/repo from
the origin remote (http(s) and ssh forms), and prints one brd-schema §3b row
per commit in commit order.

Rows carry the commit's date, not today's: a row that changes every time the
generator runs is not a log entry.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 3: `tools/delivery-log.py` — validation, the screen index, exit 1

**Files:**
- Modify: `tools/delivery-log.py`
- Modify: `tools/test_delivery_log.py`

**Interfaces:**
- Consumes: from Task 2 — `Unevaluable`, `git_out`, `read_commits`, `remote_slug`, `commit_row`, `build_parser`, `main`.
- Produces, for Task 4:
  - `SCOPE_TOKEN` (compiled regex), `SCR_TOKEN` (compiled regex)
  - `registry_ids(path) -> set`
  - `screen_index(screens_dir) -> dict` mapping repo-relative path → `SCR-<nnn>`
  - `validate(commit, requirements, registry, index, covered) -> list[str]`
  - new CLI flags `--requirements`, `--screens`, `--covered`

- [ ] **Step 1: Write the failing tests**

Append to `tools/test_delivery_log.py`, immediately **before** the `if __name__ == "__main__":` block:

```python
class ValidationTest(RowTest):
    def screens_dir(self, mapping):
        """mapping: {'SCR-014': ['src/profile.ts']} -> path to a screens/ dir."""
        root = tempfile.mkdtemp(prefix="delivery-log-screens-")
        self.repos.append(root)
        rows = ["# Screen Registry", "", "| Screen ID | Screen Name |",
                "|---|---|"]
        for screen in sorted(mapping):
            rows.append("| %s | Screen %s |" % (screen, screen))
            with open(os.path.join(root, "%s.md" % screen), "w") as handle:
                handle.write("## Frontend\n\n")
                for path in mapping[screen]:
                    handle.write("- page component: `%s`\n" % path)
        with open(os.path.join(root, "registry.md"), "w") as handle:
            handle.write("\n".join(rows) + "\n")
        return root

    def test_missing_scope_trailer_exits_1_and_names_the_sha(self):
        repo = self.repo([("feat(BRD-RP-042): untrailered\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 1)
        self.assertIn("no Scope: trailer", err)

    def test_requirement_not_in_s03_exits_1(self):
        repo = self.repo([("feat(BRD-RP-042): stray\n\nScope: R9\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1,R2,R3"])
        self.assertEqual(code, 1)
        self.assertIn("R9", err)

    def test_screen_not_in_registry_exits_1(self):
        screens = self.screens_dir({"SCR-014": ["src/profile.ts"]})
        repo = self.repo([("feat(BRD-RP-042): stray screen\n\n"
                           "Scope: R1\nScreen: SCR-999\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-999", err)

    def test_touching_a_bound_path_without_naming_its_screen_exits_1(self):
        screens = self.screens_dir({"SCR-014": ["src/profile.ts"]})
        repo = self.repo([("feat(BRD-RP-042): silent screen edit\n\nScope: R1\n",
                           ["src/profile.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-014", err)
        self.assertIn("src/profile.ts", err)

    def test_naming_the_bound_screen_passes(self):
        screens = self.screens_dir({"SCR-014": ["src/profile.ts"]})
        repo = self.repo([("feat(BRD-RP-042): declared screen edit\n\n"
                           "Scope: R1\nScreen: SCR-014\n", ["src/profile.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 0, err)
        self.assertIn("Screens: SCR-014", out)

    def test_unindexed_path_produces_no_finding(self):
        screens = self.screens_dir({"SCR-014": ["src/profile.ts"]})
        repo = self.repo([("feat(BRD-RP-042): unrelated file\n\nScope: R1\n",
                           ["src/unrelated.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 0, err)

    def test_covered_sha_is_not_reported_unbound(self):
        repo = self.repo([("feat(BRD-RP-042): pre-v2.1 history\n", ["src/a.ts"])])
        sha = subprocess.check_output(["git", "-C", repo, "rev-parse", "HEAD"],
                                      universal_newlines=True).strip()
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--covered", sha[:7]])
        self.assertEqual(code, 1)
        self.assertNotIn("no Scope: trailer", err)
        self.assertIn("backfilled", out)

    def test_malformed_scope_token_exits_1(self):
        repo = self.repo([("feat(BRD-RP-042): bad token\n\nScope: requirement-3\n",
                           ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 1)
        self.assertIn("requirement-3", err)

    def test_unreadable_screens_dir_is_unevaluable(self):
        repo = self.repo([("feat(BRD-RP-042): fine\n\nScope: R1\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--screens", os.path.join(repo, "no-such-dir")])
        self.assertEqual(code, 2)
```

Note on `test_covered_sha_is_not_reported_unbound`: a covered sha is not a *finding*, but the run still exits 1 — there is nothing to emit a row from, and the operator must write the backfill row by hand. The row the tool prints for it says `backfilled`, which is what Step 3 implements.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
python3 tools/test_delivery_log.py
```

Expected: the seven Task-2 tests still pass (they are inherited by `ValidationTest`, so they run twice — that is fine and intentional; the subclass reuses the fixture helpers); the nine new tests fail. Typical first failure: `test_missing_scope_trailer_exits_1_and_names_the_sha` gets exit 0, because nothing validates yet.

- [ ] **Step 3: Write the minimal implementation**

In `tools/delivery-log.py`, add the two regexes below the existing constants:

```python
SCOPE_TOKEN = re.compile(r"^(?:R\d+|SCR-\d{3}|chore)$")
SCR_TOKEN = re.compile(r"SCR-\d{3}")
PATHISH = re.compile(r"`([A-Za-z0-9_./@-]+/[A-Za-z0-9_.@-]+\.[A-Za-z0-9]{1,5})`")
```

Add these functions after `remote_slug`:

```python
def registry_ids(screens_dir):
    """SCR-IDs declared in screens/registry.md. Empty set = no registry bound."""
    if not screens_dir:
        return set()
    path = os.path.join(screens_dir, "registry.md")
    if not os.path.isfile(path):
        raise Unevaluable("no registry.md in %s — cannot resolve SCR-IDs" % screens_dir)
    with open(path) as handle:
        return set(SCR_TOKEN.findall(handle.read()))


def screen_index(screens_dir):
    """Repo-relative path -> SCR-ID, harvested from screens/SCR-<nnn>.md.

    Only backticked path tokens are indexed, so a file no contract file names
    is not indexed: the check yields no false positives and may yield false
    negatives. Screen bindings belonging in the contract is the pre-existing
    rule (Architecture/screen-contract.md §3), not a demand made here.
    """
    index = {}
    if not screens_dir:
        return index
    if not os.path.isdir(screens_dir):
        raise Unevaluable("screens directory not found: %s" % screens_dir)
    for name in sorted(os.listdir(screens_dir)):
        match = re.match(r"^(SCR-\d{3})\.md$", name)
        if not match:
            continue
        with open(os.path.join(screens_dir, name)) as handle:
            for path in PATHISH.findall(handle.read()):
                index.setdefault(path, match.group(1))
    return index


def validate(commit, requirements, registry, index, covered):
    """Problems with one commit's bindings. Empty list = bound."""
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
        elif token.startswith("R") and requirements and token not in requirements:
            problems.append("%s: scope %s is not a requirement in S03" % (short, token))
        elif token.startswith("SCR-") and registry and token not in registry:
            problems.append("%s: scope %s is not in the screens registry" % (short, token))
    for screen in commit["screens"]:
        if registry and screen not in registry:
            problems.append("%s: screen %s is not in the screens registry" % (short, screen))
    named = set(commit["screens"]) | set(commit["scopes"])
    for path in commit["files"]:
        bound = index.get(path)
        if bound and bound not in named:
            problems.append("%s: touches %s (bound to %s) without naming it"
                            % (short, path, bound))
    return problems
```

Extend `build_parser` with three flags, immediately before its `return`:

```python
    parser.add_argument("--requirements", default="",
                        help="comma-separated R<n> IDs from the BRD's S03; "
                             "empty disables requirement resolution")
    parser.add_argument("--screens", default="",
                        help="path to the project's screens/ directory")
    parser.add_argument("--covered", default="",
                        help="comma-separated shas already carried by S17 "
                             "backfill rows")
```

Replace `main`'s body after the argument parse with:

```python
    try:
        slug = remote_slug(args.repo)
        commits = read_commits(args.repo, args.base, args.branch)
        registry = registry_ids(args.screens)
        index = screen_index(args.screens)
    except Unevaluable as problem:
        sys.stderr.write("unevaluable: %s\n" % problem)
        return 2

    requirements = set(item.strip() for item in args.requirements.split(",") if item.strip())
    covered = set(item.strip() for item in args.covered.split(",") if item.strip())

    problems = []
    for commit in commits:
        found = validate(commit, requirements, registry, index, covered)
        problems.extend(found)
        state = args.state
        if commit["sha"][:7] in covered or commit["sha"] in covered:
            state = "backfilled"
        if not found:
            sys.stdout.write(commit_row(commit, slug, args.phase, state) + "\n")

    for problem in problems:
        sys.stderr.write("unbound: %s\n" % problem)
    return 1 if problems else 0
```

Note the two behaviours this encodes: a commit with problems gets **no row** (a row asserting a binding that does not resolve would be a lie), and a covered sha gets a row marked `backfilled` so the operator can paste it and add the `Backfill:` reason line by hand.

Wait — a covered sha with no trailer produces no problems, so it now prints with state `backfilled` and the run exits 0, not 1. Adjust the covered test in Step 1 to match reality rather than adjusting the code: change `self.assertEqual(code, 1)` to `self.assertEqual(code, 0, err)` and drop the `assertNotIn`, keeping `self.assertIn("backfilled", out)`. Make that edit now, before running.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
python3 tools/test_delivery_log.py
```

Expected: `OK`, 23 tests (7 from `RowTest` + 7 inherited into `ValidationTest` + 9 new).

- [ ] **Step 5: Commit**

```bash
git add tools/delivery-log.py tools/test_delivery_log.py
git commit -m "$(cat <<'MSG'
feat(tools): delivery-log.py validates bindings and exits 1 on unbound shas

Scope tokens resolve against the BRD's S03 requirement IDs and the project's
screens registry; a commit touching a path indexed to a screen must name that
screen. The index is built from backticked path tokens in screens/SCR-<nnn>.md,
so it yields no false positives and may yield false negatives — stated in the
docstring rather than hidden.

A commit with unresolved bindings gets no row: a row asserting a binding that
does not resolve would be a lie. Shas passed via --covered are already carried
by S17 backfill rows and print with state `backfilled`.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 4: `tools/delivery-log.py` — compare URL, rollup rows, JSON

**Files:**
- Modify: `tools/delivery-log.py`
- Modify: `tools/test_delivery_log.py`

**Interfaces:**
- Consumes: from Tasks 2–3 — `commit_row`, `validate`, `read_commits`, `remote_slug`, `registry_ids`, `screen_index`, `build_parser`, `main`.
- Produces (final tool surface, quoted by Tasks 5–9):
  - `compare_url(slug, base, branch) -> str`
  - `scope_summary(commits) -> str`, `screen_summary(commits) -> str`
  - `rollup_row(commits, slug, state, link, compare) -> str`
  - CLI flags `--compare-only`, `--rollup LINK`, `--json`
  - JSON keys: `compare`, `repo`, `rows`, `unbound`, `scopes`, `screens`

- [ ] **Step 1: Write the failing tests**

Append to `tools/test_delivery_log.py`, before the `if __name__ == "__main__":` block:

```python
class OutputModeTest(RowTest):
    def test_compare_only_prints_the_compare_url(self):
        repo = self.repo([("feat(BRD-RP-042): a\n\nScope: R1\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--compare-only"])
        self.assertEqual(code, 0, err)
        self.assertEqual(out.strip(),
                         "https://github.com/acme/widget/compare/main...%s" % BRANCH)

    def test_compare_only_works_on_an_empty_branch(self):
        repo = self.repo([])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--compare-only"])
        self.assertEqual(code, 0, err)
        self.assertIn("/compare/main...", out)

    def test_rollup_row_summarizes_scopes_and_screens(self):
        repo = self.repo([
            ("feat(BRD-RP-042): a\n\nScope: R1\nScreen: SCR-014\n", ["src/a.ts"]),
            ("feat(BRD-RP-042): b\n\nScope: R2\nScreen: SCR-015\n", ["src/b.ts"]),
            ("chore(BRD-RP-042): tidy\n\nScope: chore\n", ["src/c.ts"]),
        ])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--state", "pr-open",
                              "--rollup", "https://github.com/acme/widget/pull/7"])
        self.assertEqual(code, 0, err)
        self.assertIn("[PR] [Git Manager]", out)
        self.assertIn("3 commits", out)
        self.assertIn("Scope covered: R1, R2, chore", out)
        self.assertIn("Screens: SCR-014, SCR-015", out)
        self.assertIn("State: pr-open · Repo: widget", out)
        self.assertIn("Link: https://github.com/acme/widget/pull/7 · Compare: "
                      "https://github.com/acme/widget/compare/main...%s" % BRANCH, out)

    def test_rollup_stage_label_follows_state(self):
        repo = self.repo([("feat(BRD-RP-042): a\n\nScope: R1\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--state", "merged",
                              "--rollup", "https://github.com/acme/widget/commit/deadbee"])
        self.assertEqual(code, 0, err)
        self.assertIn("[Merged] [Git Manager]", out)

    def test_json_carries_rows_compare_and_unbound(self):
        repo = self.repo([
            ("feat(BRD-RP-042): bound\n\nScope: R1\n", ["src/a.ts"]),
            ("feat(BRD-RP-042): unbound\n", ["src/b.ts"]),
        ])
        code, out, err = run(["--repo", repo, "--branch", BRANCH, "--json"])
        self.assertEqual(code, 1)
        payload = json.loads(out)
        self.assertEqual(payload["repo"], "widget")
        self.assertEqual(len(payload["rows"]), 1)
        self.assertEqual(len(payload["unbound"]), 1)
        self.assertEqual(payload["scopes"], ["R1"])
        self.assertIn("/compare/main...", payload["compare"])
```

Add `import json` to the test file's imports.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
python3 tools/test_delivery_log.py
```

Expected: the 23 passing tests stay green; the five new ones fail with `unrecognized arguments: --compare-only` / `--rollup` / `--json`.

- [ ] **Step 3: Write the minimal implementation**

In `tools/delivery-log.py`, add `import datetime` and `import json` to the imports, and this constant beside `STATES`:

```python
STAGE_BY_STATE = {"pushed": "Implementation", "pr-open": "PR",
                  "merged": "Merged", "released": "Released"}
```

Add these functions after `commit_row`:

```python
def compare_url(slug, base, branch):
    return "https://github.com/%s/compare/%s...%s" % (slug, base, branch)


def scope_summary(commits):
    tokens = []
    for commit in commits:
        for token in commit["scopes"]:
            if token not in tokens:
                tokens.append(token)
    return ", ".join(tokens) or "—"


def screen_summary(commits):
    screens = []
    for commit in commits:
        for screen in commit["screens"]:
            if screen not in screens:
                screens.append(screen)
    return ", ".join(screens) or "none"


def rollup_row(commits, slug, state, link, compare):
    return ("- **[%s] [%s] [Git Manager]** — %d commits · Scope covered: %s · Screens: %s.\n"
            "  State: %s · Repo: %s\n"
            "  Link: %s · Compare: %s"
            % (datetime.date.today().isoformat(), STAGE_BY_STATE[state], len(commits),
               scope_summary(commits), screen_summary(commits), state,
               slug.split("/")[-1], link, compare))
```

Add the three flags in `build_parser`, before its `return`:

```python
    parser.add_argument("--compare-only", action="store_true",
                        help="print just the Compare URL (for the BRD property "
                             "at branch creation) and exit")
    parser.add_argument("--rollup", default="",
                        help="emit a rollup row instead of commit rows; the value "
                             "is the PR, merge-commit or tag URL it links")
    parser.add_argument("--json", action="store_true",
                        help="emit {compare, repo, rows, unbound, scopes, screens}")
```

In `main`, immediately after `slug = remote_slug(args.repo)` succeeds — i.e. inside the `try` block is wrong, put it right after the `except` block — add the short-circuit:

```python
    compare = compare_url(slug, args.base, args.branch)
    if args.compare_only:
        sys.stdout.write(compare + "\n")
        return 0
```

Then replace the emit-and-return tail of `main` with:

```python
    rows = []
    problems = []
    bound = []
    for commit in commits:
        found = validate(commit, requirements, registry, index, covered)
        problems.extend(found)
        state = args.state
        if commit["sha"][:7] in covered or commit["sha"] in covered:
            state = "backfilled"
        if not found:
            bound.append(commit)
            rows.append(commit_row(commit, slug, args.phase, state))

    if args.rollup:
        rows = [rollup_row(bound, slug, args.state, args.rollup, compare)]

    if args.json:
        sys.stdout.write(json.dumps({
            "compare": compare,
            "repo": slug.split("/")[-1],
            "rows": rows,
            "unbound": problems,
            "scopes": [token for token in scope_summary(bound).split(", ")
                       if token != "—"],
            "screens": [screen for screen in screen_summary(bound).split(", ")
                        if screen != "none"],
        }, indent=2) + "\n")
    else:
        for row in rows:
            sys.stdout.write(row + "\n")
        for problem in problems:
            sys.stderr.write("unbound: %s\n" % problem)
    return 1 if problems else 0
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
python3 tools/test_delivery_log.py
python3 tools/delivery-log.py --repo . --branch feat/delivery-log --base main --phase single | head -6
```

Expected: `OK`, 28 tests. The second command exercises the tool against this repo: its commits carry no `Scope:` trailers, so it exits 1 and names them on stderr — which is the guard's behaviour working, not a bug. (The toolkit repo has no BRD; this only proves URL derivation and the failure path.)

- [ ] **Step 5: Commit**

```bash
git add tools/delivery-log.py tools/test_delivery_log.py
git commit -m "$(cat <<'MSG'
feat(tools): compare URL, rollup rows and JSON output for delivery-log.py

--compare-only gives the Git Manager the Compare property value at branch
creation, before any commit exists. --rollup emits the PR/Merged/Released
summary row, its stage label derived from the state so the two cannot drift.
--json gives the orchestrator {compare, repo, rows, unbound, scopes, screens}.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 5: The guard — state machine, checklist, module index

**Files:**
- Modify: `Architecture/workflow-state-machine.md` (§3 transition table, §4 guard table)
- Create: `Checklists/delivery-log.md`
- Modify: `Documentation/module-index.md:53-58` (the Checklists section)

**Interfaces:**
- Consumes: S17 and the property names from Task 1; the tool CLI from Tasks 2–4.
- Produces: the guard token **C_DELIVERY**, defined in §4, cited in §3, named in `Checklists/delivery-log.md`. From this commit onward the token may be written backticked anywhere in the repo.

**This is one commit, not three.** Checker rule H fails a guard defined in §4 that no §3 row cites and no `Checklists/` file names; rule M fails a `Checklists/` file the module index does not link. Splitting this task leaves the repo red between commits.

- [ ] **Step 1: Add the guard definition to §4**

In `Architecture/workflow-state-machine.md`, in the `## 4. Guards` table, add one row after the `C_ISOLATION` row:

```markdown
| `C_DELIVERY` | Every commit sha in `<base>..<current-phase branch>`, in every repo bound to the BRD, appears in S17 bound to at least one resolving `Scope:` token (`R<n>` present in S03 · `SCR-<nnn>` present in the screens registry · `chore`), and the BRD `Compare` property is set for the current phase. Coverage is satisfied by a commit trailer **or** by an S17 backfill row naming the sha (or range), its scope and its reason — pushed history is never rewritten to satisfy this guard ([git](../Workflows/git.md) forbids rewriting after review starts). Checked at **`Implementation` exit** (and at [backend-integration](../Workflows/backend-integration.md) exit, the same stage class) and re-checked at **`Tech Review` → `PR`**, because QA-loop and re-certification commits land after the first check. Validator: [../Checklists/delivery-log.md](../Checklists/delivery-log.md), mechanically `tools/delivery-log.py`. Fail → stop, report the unbound shas, route to Implementation. **A `C_DELIVERY` bounce does not count against `L_QA`** — it is a thirty-second backfill, and charging it against a ceiling would create pressure to weaken the guard. |
```

- [ ] **Step 2: Cite the guard in §3**

In the `## 3. Transition Table`, replace the two existing rows:

```markdown
| Implementation | complete claim + S12 current + `C_SECURITY` pass | QA |
```

with:

```markdown
| Implementation | complete claim + S12 current + `C_SECURITY` pass ∧ `C_DELIVERY` pass | QA |
| Implementation | `C_DELIVERY` fail | Implementation (unbound shas named; fixed by trailered commits or S17 backfill rows, not by history rewrite) |
```

and:

```markdown
| Tech Review | verdict `approve` ∧ `C_ISOLATION` pass | PR |
```

with:

```markdown
| Tech Review | verdict `approve` ∧ `C_ISOLATION` pass ∧ `C_DELIVERY` pass | PR |
| Tech Review | `C_DELIVERY` fail | Implementation (same phase), unbound shas named in S16 |
```

- [ ] **Step 3: Write the checklist**

Create `Checklists/delivery-log.md`:

```markdown
# Checklist — Delivery Log (`C_DELIVERY`)

> Validator run at **`Implementation` exit** (and [backend-integration](../Workflows/backend-integration.md) exit) and again at **`Tech Review` → `PR`**. Guard: [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4.
> Mechanical form: `python3 toolkit/tools/delivery-log.py --repo <repo> --branch <branch> --requirements <R-ids from S03> --screens <repo>/screens` — exit 0 passes, exit 1 lists the unbound shas, exit 2 means the run could not judge and is never a pass.
> Any unchecked item → stop, report the unbound shas, route to Implementation. A bounce here does not count against `L_QA`.

## 1. Coverage
- [ ] Every sha in `<base>..<branch>` appears in S17 — no commit is missing a row
- [ ] Every bound repo of a multi-repo BRD was run separately; each row names its `Repo:`
- [ ] Shas without a `Scope:` trailer carry an S17 **backfill row** naming sha (or range), scope and reason
- [ ] No sha was "covered" by rewriting pushed history

## 2. Token resolution
- [ ] Every `R<n>` in a row exists as a requirement in S03
- [ ] Every `SCR-<nnn>` in a row exists in the project's `screens/registry.md`
- [ ] `chore` appears only on commits that deliver no requirement (merge, revert, hygiene, tooling)
- [ ] Every commit touching a screen-bound path names that screen in `Scope:` or `Screen:`

## 3. Properties
- [ ] `Compare` is set and points at the **current phase's** branch
- [ ] `PR` (and `FE PR` / `BE PR` for split BRDs) unchanged by this check — the delivery log never overwrites them
- [ ] At `Merged`: `Merge SHA` set · at `Released`: `Release Tag` set

## 4. Log integrity
- [ ] Rows were appended, never edited; no row was deleted
- [ ] One Notion write per push, carrying that push's rows — not one write per commit
- [ ] Commit rows carry their commit's date; only rollup rows carry the write date
```

- [ ] **Step 4: Link the checklist from the module index**

In `Documentation/module-index.md`, in the `## Checklists/ (gates)` section, add one bullet after the `integration-parity` bullet:

```markdown
- [delivery-log](../Checklists/delivery-log.md) — the `C_DELIVERY` validator
```

- [ ] **Step 5: Verify the checker accepts the guard unaided**

Run:

```bash
python3 tools/toolkit-check.py
grep -c 'C_DELIVERY' Architecture/workflow-state-machine.md
grep -n 'GUARD_TRANSITION_EXEMPT\|GUARD_CHECKLIST_EXEMPT' tools/toolkit-check.py | head -4
git diff --name-only tools/toolkit-check.py
```

Expected: `0 violations`; `5` (one §4 definition + four §3 citations); the exempt lists print unchanged; `git diff --name-only` on the checker prints **nothing** — modifying the checker to accept this guard is failing this task.

- [ ] **Step 6: Commit**

```bash
git add Architecture/workflow-state-machine.md Checklists/delivery-log.md Documentation/module-index.md
git commit -m "$(cat <<'MSG'
feat(machine): guard C_DELIVERY blocks stage exit on unbound commits

Defined in §4, cited by four §3 transition rows, validated by the new
Checklists/delivery-log.md — one commit, because checker rules H and M fail
any two-thirds of that.

Checked at Implementation exit and re-checked at Tech Review -> PR, since
QA-loop and re-certification commits land after the first check. Coverage is
satisfiable by trailer or by backfill row: pushed history is never rewritten
to satisfy a guard. A bounce does not count against L_QA — charging a
thirty-second backfill against a ceiling would create pressure to weaken the
guard.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 6: Rights and write protocol

**Files:**
- Modify: `Architecture/permission-matrix.md` (§1 legend, §2 matrix — every row)
- Modify: `AI/brd-update-protocol.md` (§4 section-specific notes)

**Interfaces:**
- Consumes: S17 from Task 1.
- Produces: the rule that S17 is **A for every role** — quoted by the workflow tasks that follow.

- [ ] **Step 1: Extend the legend**

In `Architecture/permission-matrix.md` §1, replace this bullet:

```markdown
- All roles have **A** on S16 (Decision Log). S16 is append-only for everyone, always.
```

with:

```markdown
- All roles have **A** on S16 (Decision Log) and S17 (Delivery Log). Both are append-only for everyone, always — an append-only section has no owner who may revise it. By convention the Git Manager writes S17's rollup rows and the engineer roles write the per-push rows, but no role holds an edit right, so no role can rewrite another's row.
```

- [ ] **Step 2: Add the S17 column**

In §2, add ` S17 |` to the header row and its separator, and ` A |` to the end of all sixteen role rows. The header becomes:

```markdown
| Role \ Section | S01 | S02 | S03 | S04 | S05 | S06 | S07 | S08 | S09 | S10 | S11 | S12 | S13 | S14 | S15 | S16 | S17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

Every role row ends `| A | A |` (S16, then S17). Do not change any other cell.

- [ ] **Step 3: Add the protocol note**

In `AI/brd-update-protocol.md` §4, after the S16 bullet, add:

```markdown
- **S17 Delivery Log** — append-only for every role, S16's rule for S16's reason. Rows follow [brd-schema](../Architecture/brd-schema.md) §3b and are generated by `tools/delivery-log.py`, never composed freehand. **One Notion write per push**, carrying every row for that push in commit order — one write per commit is a rate limit waiting to happen. A state change (`pushed` → `pr-open` → `merged` → `released`) is a **new row**, never an edit to the old one; the newest row for a sha wins. A commit whose bindings do not resolve gets no row until they do — a row asserting an unresolvable binding is a false record.
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
python3 tools/toolkit-check.py
awk -F'|' '/^\| [A-Z]/ {print NF}' Architecture/permission-matrix.md | sort -u
grep -c 'S17 Delivery Log' AI/brd-update-protocol.md
```

Expected: `0 violations`; the awk prints a **single** field count (every matrix row now has the same number of columns — a second value means a row was missed); then `1`.

```bash
git add Architecture/permission-matrix.md AI/brd-update-protocol.md
git commit -m "$(cat <<'MSG'
feat(rights): S17 is append-only for every role, with its write protocol

An append-only section has no owner who may revise it, so S17 grants A to all
sixteen roles exactly as S16 does; convention assigns rollup rows to the Git
Manager without granting anyone an edit right.

The protocol adds the two rules that keep the log honest and cheap: one Notion
write per push (not per commit), and a state change is a new row rather than
an edit.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 7: The workflows that write the log

**Files:**
- Modify: `Workflows/git.md` (Outputs, BRD Sections It May Update, Responsibilities 1/3/5, Completion Criteria)
- Modify: `Workflows/implementation.md` (Outputs, sections list, Responsibilities, Completion Criteria)
- Modify: `Workflows/backend-integration.md` (Outputs, sections list, Responsibilities, Completion Criteria)
- Modify: `Workflows/release.md` (Outputs, sections list, Responsibilities, Completion Criteria)

**Interfaces:**
- Consumes: the guard from Task 5, the rights from Task 6, the tool CLI from Tasks 2–4.
- Produces: the stage-by-stage duty to write S17 — cited by nothing later; this is the behaviour itself.

- [ ] **Step 1: Wire the Git Manager**

In `Workflows/git.md`:

Under **Outputs**, after the branch bullet, add:

```markdown
- BRD `Compare` property, set at branch creation from `tools/delivery-log.py --compare-only` — the PO's live diff of the current phase, available before the first commit exists
- S17 rollup rows at `PR`, `Merged` and `Released`, plus `Merge SHA` at merge and `Release Tag` at release
```

Replace the **BRD Sections It May Update** line:

```markdown
S15 (edit), S16 (append), S17 (append), `Branch`/`PR`/`FE PR`/`BE PR`/`Compare`/`Merge SHA`/`Release Tag` properties.
```

In Responsibility 1 (branch creation), append to the end of the paragraph:

```markdown
Set `Compare` in the same step as `Branch` — a branch whose diff the PO cannot open is half a link.
```

In Responsibility 3 (PR assembly), append:

```markdown
Before opening the PR, run the delivery validator (`C_DELIVERY`, [Checklists/delivery-log.md](../Checklists/delivery-log.md)); on pass, append the S17 rollup row (`--rollup <pr url> --state pr-open`) and fill the PR body's scope-coverage line from it.
```

In Responsibility 5 (merge), append to both phase bullets:

```markdown
On merge: set `Merge SHA`, append the S17 rollup row with `--state merged`.
```

Under **Completion Criteria (PR stage)**, add before the S16 line:

```markdown
- [ ] `C_DELIVERY`: every sha on the branch bound in S17; `Compare` current; rollup row appended
```

- [ ] **Step 2: Wire Implementation**

In `Workflows/implementation.md`:

Under **Outputs**, after the S12 bullet, add:

```markdown
- S17 — delivery rows appended **at every push**, generated by `tools/delivery-log.py`; one Notion write per push
```

Replace the **BRD Sections It May Update** line:

```markdown
S10 (edit — plan corrections, logged), S11 (edit — same), S12 (edit/append), S04 (append), S05 (append), S16 (append), S17 (append).
```

Replace Responsibility 9:

```markdown
9. Keep commits atomic and honest — one logical change each, convention format, no "wip" on shared history. **Every commit carries its `Scope:` trailer** (`R<n>` · `SCR-<nnn>` · `chore`), and a commit touching a screen-bound file carries `Screen:` too ([integration-map](../Architecture/integration-map.md) §3). **At every push**, run `tools/delivery-log.py` and append its rows to S17 in one write — the trailer cannot be added later without rewriting pushed history, and the guard that checks this at stage exit is cheapest to satisfy at push time.
```

Under **Completion Criteria**, add after the S12 line:

```markdown
- [ ] `C_DELIVERY`: every sha on the branch bound in S17 (trailer or backfill row); `Compare` set
```

- [ ] **Step 3: Wire back-end integration**

In `Workflows/backend-integration.md`:

Under **Outputs**, after the S12 bullet, add:

```markdown
- S17 — delivery rows at every push, `Phase: BE`, exactly as any implementation stage
```

Replace the **BRD Sections It May Update** paragraph's first line:

```markdown
S12 (edit/append), S17 (append), S05 (append — a fixture-mismatch finding, before it is routed via
```

Add Responsibility 7:

```markdown
7. **Push with trailers, log at every push** — `Scope:`/`Screen:` on every commit, S17 rows appended per push. The selection-point swap is scope-bearing work like any other; `chore` on it would be a false record.
```

Under **Completion Criteria**, add before the S12 line:

```markdown
- [ ] `C_DELIVERY`: every Phase-2 sha bound in S17; `Compare` points at the BE branch
```

- [ ] **Step 4: Wire Release**

In `Workflows/release.md`:

Under **Outputs**, after the S15 bullet, add:

```markdown
- `Release Tag` property + the S17 rollup row with `--state released` — the PO's last link, the one that says shipped
```

Replace the **BRD Sections It May Update** line:

```markdown
S15 (edit), S16 (append), S17 (append), `Status`/`Release Tag` properties.
```

In Responsibility 6 (freeze), append:

```markdown
Set `Release Tag` and append the released rollup row before flipping `Status` — a released BRD whose delivery log stops at `merged` is a log that lies by omission.
```

Under **Completion Criteria**, add after the S15 line:

```markdown
- [ ] `Release Tag` set; S17 released rollup row appended
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
python3 tools/toolkit-check.py
grep -l 'C_DELIVERY' Workflows/*.md
grep -c 'S17' Workflows/git.md Workflows/implementation.md Workflows/backend-integration.md Workflows/release.md
```

Expected: `0 violations`; the grep lists `Workflows/git.md`, `Workflows/implementation.md`, `Workflows/backend-integration.md`; every file in the last command reports ≥ 2.

```bash
git add Workflows/git.md Workflows/implementation.md Workflows/backend-integration.md Workflows/release.md
git commit -m "$(cat <<'MSG'
feat(workflows): write the Delivery Log at push, PR, merge and release

Implementation and backend-integration append S17 rows at every push, so the
PO sees progress during the longest state in the machine instead of after it.
The Git Manager sets Compare at branch creation, appends the rollup row at PR
and merge, and Release sets Release Tag before flipping Status — a released
BRD whose log stops at `merged` lies by omission.

Trailers are written at commit time because they cannot be added afterwards
without rewriting pushed history.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 8: Naming contract and PR body

**Files:**
- Modify: `Architecture/integration-map.md` (§3 naming contracts table + a rule paragraph)
- Modify: `Templates/pull-request.md` (body template + rules)

**Interfaces:**
- Consumes: the trailer vocabulary from Tasks 2–3, S17 from Task 1.
- Produces: the canonical commit-trailer contract every project reads.

- [ ] **Step 1: Extend the naming contract**

In `Architecture/integration-map.md` §3, replace the `Commit` row:

```markdown
| Commit | `<type>(<brd-id>): <subject>` | `feat(BRD-RP-042): add profile lookup state` |
| Commit trailers (v2.1) | `Scope: <token>[, …]` mandatory; `Screen: SCR-<nnn>` when the diff touches a screen-bound file | `Scope: R3, R4` + `Screen: SCR-014` |
```

Then replace the bidirectional-links paragraph:

```markdown
Bidirectional links: BRD `Branch` + `PR` + `Compare` properties point at Git; PR body + commits point at BRD. Either side reachable from the other in one hop. **At scope and screen granularity** (v2.1) the bridge is the commit trailer plus its S17 row: `Scope:` names the S03 requirement (`R<n>`), `SCR-<nnn>` names the Screen Contract entity, `chore` is the reserved token for commits that deliver no requirement. Trailers are written at commit time — they cannot be added to pushed history without a rewrite, which the [git workflow](../Workflows/git.md) forbids; the sanctioned repair is an S17 backfill row.
```

- [ ] **Step 2: Add the scope-coverage line to the PR template**

In `Templates/pull-request.md`, inside the fenced template block, add after the `### Verification (from S13)` block:

```markdown
### Scope coverage (from S17)
- Requirements: <R-IDs this branch delivered> · Screens: <SCR-IDs> · <n> commits
- Compare: <compare URL> · unbound shas: none
```

And add one rule bullet under `## Rules`:

```markdown
- Scope coverage is copied from the S17 rollup row, not retyped from memory. "unbound shas: none" is the delivery guard's verdict — a PR cannot open while it says otherwise.
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
python3 tools/toolkit-check.py
grep -c 'Commit trailers (v2.1)' Architecture/integration-map.md
grep -c 'Scope coverage (from S17)' Templates/pull-request.md
```

Expected: `0 violations`, then `1`, then `1`.

```bash
git add Architecture/integration-map.md Templates/pull-request.md
git commit -m "$(cat <<'MSG'
feat(contract): commit trailers bind a commit to its scope and screen

Notion -> Git was reachable only at PR granularity and only after state 09.
The trailer plus its S17 row makes the bridge hold at requirement and screen
level, and the PR body now carries the coverage the guard verified rather than
a reviewer's recollection.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 9: The Product Owner view

**Files:**
- Modify: `Documentation/notion-setup.md` (§1 properties table, Recommended views, §3 create-via-Claude prompt)
- Modify: `Workflows/project-onboarding.md` (step 3's Notion rows or step 6 — see Step 2 below)

**Interfaces:**
- Consumes: the three properties from Task 1.
- Produces: the `Delivery (PO)` view every project inherits.

- [ ] **Step 1: Update the Notion setup recipe**

In `Documentation/notion-setup.md` §1, add three rows to the properties table after the `PR` row:

```markdown
| Compare | URL | — |
| Merge SHA | URL | — |
| Release Tag | URL | — |
```

Add one bullet to **Recommended views**:

```markdown
- **Delivery (PO)** — columns `Name`, `Status`, `Phase`, `Compare`, `PR`, `Merge SHA`, `Release Tag`; filter by `Project`; group by Status; sort last-edited ↓ (what changed, and what completed, without opening a page)
```

In §3, replace `the five views` with `the six views` in the create-via-Claude prompt.

Add to the §2 scaffold block, after `## S16 · Decision Log`:

```markdown
## S17 · Delivery Log
```

and change the sentence under it from "the 16 H2 headings" to "the 17 H2 headings".

- [ ] **Step 2: Create the view at onboarding**

In `Workflows/project-onboarding.md`, in step 3's Notion table, after the `BRD Database` row, add:

```markdown
   | Notion | Delivery (PO) view | **yes** | confirm the view exists on the bound BRD DB | create it via `notion-create-view`: columns `Name`, `Status`, `Phase`, `Compare`, `PR`, `Merge SHA`, `Release Tag`, filtered to this project, grouped by Status ([notion-setup](../Documentation/notion-setup.md) §1) |
```

Add to the workflow's completion checklist, beside the existing required-bindings line:

```markdown
- [ ] `Delivery (PO)` view exists on the bound BRD DB, filtered to this project
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
python3 tools/toolkit-check.py
grep -c 'Delivery (PO)' Documentation/notion-setup.md Workflows/project-onboarding.md
grep -c 'S17 · Delivery Log' Documentation/notion-setup.md
grep -c 'the six views' Documentation/notion-setup.md
```

Expected: `0 violations`; each grep ≥ `1`.

```bash
git add Documentation/notion-setup.md Workflows/project-onboarding.md
git commit -m "$(cat <<'MSG'
feat(onboarding): every project gets the Delivery (PO) view

The rows in S17 are for machines and archaeology; the PO reads a view. Created
once per project at onboarding via notion-create-view, so nobody invents a
dashboard per project. The page scaffold gains S17 so new BRDs are born with
somewhere to write.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

### Task 10: Version, changelog, README

**Files:**
- Modify: `Documentation/CHANGELOG.md` (`Unreleased` → `2.1.0`)
- Modify: `README.md:5` (version line), the "Rules the Machine Enforces" list, `README.md:177-178` (pin example)

**Interfaces:**
- Consumes: everything above.
- Produces: the release record. This is the last task.

- [ ] **Step 1: Write the changelog entry**

In `Documentation/CHANGELOG.md`, replace the `## [Unreleased]` line with:

```markdown
## [Unreleased]

## [2.1.0] — 2026-09-02

**The Product Owner can see what shipped, per feature, per requirement, per screen.** Git links
reached Notion only at lifecycle state 09 and only at PR granularity; the whole of Implementation
was invisible and the commit-to-requirement mapping was never recorded at all.

### Added
- BRD section `S17 · Delivery Log` (append-only) + properties `Compare`, `Merge SHA`, `Release Tag`
  — [Architecture/brd-schema.md](../Architecture/brd-schema.md) §1, §2, §3b.
- Commit trailers `Scope:` / `Screen:` binding each commit to an S03 requirement and a Screen
  Contract SCR-ID — [Architecture/integration-map.md](../Architecture/integration-map.md) §3.
- `tools/delivery-log.py` + `tools/test_delivery_log.py` — generates S17 rows, validates every sha,
  exit 1 on unbound shas, exit 2 unevaluable. Stdlib only, no credentials.
- Guard `C_DELIVERY` + [Checklists/delivery-log.md](../Checklists/delivery-log.md) — blocks
  `Implementation` exit and `Tech Review` → `PR` while any sha is unbound; satisfiable by trailer or
  backfill row; a bounce does not count against `L_QA`.
- `Delivery (PO)` Notion view, created per project at onboarding.

### Changed
- `Workflows/git.md`, `implementation.md`, `backend-integration.md`, `release.md` write S17 and the
  three properties at push, PR, merge and release.
- `Architecture/permission-matrix.md`: S17 column, **A** for all sixteen roles (S16's rule).
- `AI/brd-update-protocol.md`: S17 write rules — one Notion write per push, state changes are new
  rows.
- `Templates/pull-request.md`: scope-coverage section.

### Migration
Additive; no property changes type or meaning, no rights removed. A BRD already past
`Implementation` at cutover carries no S17 and the guard does not apply. A BRD at or before
`Implementation` gets S17 scaffolded at its next stage entry; pre-cutover shas are covered by one
backfill row with the reason `pre-v2.1 history` ([brd-schema](../Architecture/brd-schema.md) §5
invariant 6).
```

- [ ] **Step 2: Update the README**

In `README.md`, replace `**Version: v2.0.0**` with `**Version: v2.1.0**`, and both `v2.0.0` occurrences in the pin example (lines ~177–178) with `v2.1.0`.

Add one bullet to **Rules the Machine Enforces**, after the `C_CONTRACT` / SCR-IDs bullet:

```markdown
- **Every commit is attributable to a requirement or a screen**: `Scope:` / `Screen:` trailers land in the BRD's Delivery Log (S17) at every push, and `C_DELIVERY` blocks the stage exit while any sha on the branch is unbound — backfill row or trailer, never a history rewrite. The Product Owner reads it as a Notion view: what changed (`Compare`, `PR`), what completed (`Merge SHA`, `Release Tag`). ([Checklists/delivery-log.md](Checklists/delivery-log.md))
```

In the Repository Map table, update the `Checklists/` row count from `15 machine-checkable gates` to `16 machine-checkable gates`.

- [ ] **Step 3: Full verification**

Run:

```bash
python3 tools/toolkit-check.py
python3 tools/test_delivery_log.py
grep -c 'v2.1.0' README.md Documentation/CHANGELOG.md
ls Checklists/*.md | wc -l
git log --oneline main..HEAD | wc -l
```

Expected: `0 violations`; `OK` with 28 tests; README ≥ 3 and CHANGELOG ≥ 1; `16` checklists; 10–12 commits on the branch.

- [ ] **Step 4: Commit**

```bash
git add README.md Documentation/CHANGELOG.md
git commit -m "$(cat <<'MSG'
chore(release): v2.1.0 — the Delivery Log

Additive release: new append-only section S17, three optional URL properties,
commit trailers, one guard, one tool, one checklist, one Notion view. Nothing
existing changes type, meaning, or rights.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

- [ ] **Step 5: Tag decision (do not tag unilaterally)**

`main` is PR-protected in this repo and `release/v1.10.0` still carries unmerged v1.5.0–v2.0.0 work. **Do not tag `v2.1.0` and do not push to `main`.** Report the branch state and let the user decide whether this lands as its own PR or rides the existing release branch.

---

## Self-Review

**Spec coverage:** §3.1 properties → T1 · §3.2 S17 + grammar → T1 · §4 trailers → T2/T3/T8 · §5 tool → T2/T3/T4 · §6 guard + checklist → T5 · §7 rights + protocol → T6 · §8 PO view → T9 · §9 files-touched table → T1/T5/T6/T7/T8/T9/T10 (every row assigned) · §10 migration → T1 Step 5 + T10 changelog · §11 verification → T4 Step 4, T5 Step 5, T10 Step 3 · §12 out-of-scope → nothing in the plan reaches for it · §13 risks → the rate-limit risk lands in T6's protocol note, the `chore`-escape risk in T5's checklist §2, the multi-repo risk in T5's checklist §1.

**Known deviation from spec §5, recorded rather than hidden:** the spec's test list says a covered sha still exits 1. Implementation makes it exit 0 with a `backfilled` row, because a sha the operator has already accounted for is not a finding. T3 Step 3 instructs the executor to fix the test to match, and says why.

**Placeholder scan:** no TBD/TODO; every code step carries runnable code; every doc step carries the literal text to insert; no "similar to Task N".

**Type consistency:** `commit_row(commit, slug, phase, state)`, `rollup_row(commits, slug, state, link, compare)`, `validate(commit, requirements, registry, index, covered)`, `screen_index(screens_dir)`, `registry_ids(screens_dir)`, `compare_url(slug, base, branch)` — names and argument orders identical in the Interfaces blocks, the implementations, and the tests. Commit dict keys `sha`/`date`/`subject`/`scopes`/`screens`/`files` are the same in T2, T3 and T4. States and phases use the single closed vocabularies declared in Global Constraints.
