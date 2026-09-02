#!/usr/bin/env python3
"""Tests for tools/delivery-log.py. Stdlib only: python3 tools/test_delivery_log.py"""

import json
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
        sha = subprocess.check_output(["git", "-C", repo, "rev-parse", "HEAD"],
                                      universal_newlines=True).strip()
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 1)
        self.assertIn("no Scope: trailer", err)
        self.assertIn(sha[:7], err)

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

    def test_screen_trailer_none_is_malformed_and_exits_1(self):
        # "none" is the tool's own display text for "no screen" — a developer
        # will type it as a trailer value. It must not bind: format-checked
        # the same way a malformed Scope: token is, independent of whether
        # --screens was even given.
        repo = self.repo([("feat(BRD-RP-042): literal none as a screen\n\n"
                           "Scope: R1\nScreen: none\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 1)
        self.assertIn("malformed screen token", err)
        self.assertIn("none", err)

    def test_wellformed_unregistered_screen_still_exits_1_via_membership(self):
        # Guards against the format check swallowing the pre-existing
        # membership check: a well-formed SCR-<nnn> that just isn't
        # registered must still fail, and for the membership reason.
        screens = self.screens_dir({"SCR-014": ["src/profile.ts"]})
        repo = self.repo([("feat(BRD-RP-042): unregistered but well-formed\n\n"
                           "Scope: R1\nScreen: SCR-999\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-999", err)
        self.assertIn("not in the screens registry", err)
        self.assertNotIn("malformed", err)

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

    def test_covered_sha_produces_no_row(self):
        # A sha already carried by a hand-written S17 backfill row must not
        # get a generated row on re-run — not a backfill row, not any row —
        # or every re-run duplicates the hand-written one (design spec §5).
        repo = self.repo([("feat(BRD-RP-042): pre-v2.1 history\n", ["src/a.ts"])])
        sha = subprocess.check_output(["git", "-C", repo, "rev-parse", "HEAD"],
                                      universal_newlines=True).strip()
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--covered", sha[:7]])
        self.assertEqual(code, 0, err)
        self.assertEqual(out.strip(), "")
        self.assertNotIn("Backfill:", out)

    def test_malformed_scope_token_exits_1(self):
        repo = self.repo([("feat(BRD-RP-042): bad token\n\nScope: requirement-3\n",
                           ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 1)
        self.assertIn("requirement-3", err)

    def test_unreadable_screens_dir_is_unevaluable(self):
        repo = self.repo([("feat(BRD-RP-042): fine\n\nScope: R1\n", ["src/a.ts"])])
        missing = os.path.join(repo, "no-such-dir")
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--screens", missing])
        self.assertEqual(code, 2)
        self.assertIn("registry.md", err)
        self.assertIn(missing, err)

    def test_bound_but_empty_registry_rejects_a_stray_screen(self):
        # A screens/ directory that exists and has a registry.md, but one
        # that declares no SCR-IDs yet, is "bound" — not the same as no
        # --screens at all. It must still reject an unregistered SCR-<nnn>.
        screens = tempfile.mkdtemp(prefix="delivery-log-screens-")
        self.repos.append(screens)
        with open(os.path.join(screens, "registry.md"), "w") as handle:
            handle.write("# Screen Registry\n\n(no screens registered yet)\n")
        repo = self.repo([("feat(BRD-RP-042): stray screen, empty registry\n\n"
                           "Scope: R1\nScreen: SCR-014\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-014", err)

    def test_unset_screens_disables_registry_resolution(self):
        # Without --screens at all, resolution is off entirely: an SCR-<nnn>
        # scope token is well-formed and passes on trust.
        repo = self.repo([("feat(BRD-RP-042): screen scope, no registry given\n\n"
                           "Scope: SCR-014\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH])
        self.assertEqual(code, 0, err)

    def test_index_only_harvests_frontend_and_prototype_blocks(self):
        screens = self.screens_dir({"SCR-014": []})
        with open(os.path.join(screens, "SCR-014.md"), "w") as handle:
            handle.write("## Design\n\nSee also `src/other.ts` for context.\n\n"
                         "## Frontend\n\n- page component: `src/profile.ts`\n")

        # A path mentioned only in prose (the Design block) does not bind.
        prose_repo = self.repo([("feat(BRD-RP-042): design prose mention only\n\n"
                                 "Scope: R1\n", ["src/other.ts"])])
        code, out, err = run(["--repo", prose_repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 0, err)

        # A path named in the Frontend block still binds.
        bound_repo = self.repo([("feat(BRD-RP-042): frontend block silent\n\n"
                                 "Scope: R1\n", ["src/profile.ts"])])
        code, out, err = run(["--repo", bound_repo, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-014", err)
        self.assertIn("src/profile.ts", err)

    def test_path_bound_to_two_screens_resolves_by_set(self):
        # A shared component named in both SCR-014.md and SCR-020.md's
        # Frontend blocks is the documented norm (Architecture/screen-
        # contract.md §3), not a conflict: naming either screen must pass,
        # and only naming neither is a finding — one that names both IDs.
        screens = self.screens_dir({"SCR-014": ["src/components/Button.tsx"],
                                    "SCR-020": ["src/components/Button.tsx"]})

        names_014 = self.repo([("feat(BRD-RP-042): shared button, SCR-014\n\n"
                                "Scope: R1\nScreen: SCR-014\n",
                                ["src/components/Button.tsx"])])
        code, out, err = run(["--repo", names_014, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 0, err)

        names_020 = self.repo([("feat(BRD-RP-042): shared button, SCR-020\n\n"
                                "Scope: R1\nScreen: SCR-020\n",
                                ["src/components/Button.tsx"])])
        code, out, err = run(["--repo", names_020, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 0, err)

        names_neither = self.repo([("feat(BRD-RP-042): shared button, silent\n\n"
                                    "Scope: R1\n", ["src/components/Button.tsx"])])
        code, out, err = run(["--repo", names_neither, "--branch", BRANCH,
                              "--requirements", "R1", "--screens", screens])
        self.assertEqual(code, 1)
        self.assertIn("SCR-014", err)
        self.assertIn("SCR-020", err)


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

    def test_rollup_with_default_pushed_state_is_an_argument_error(self):
        # §3b's rollup grammar only has stage labels PR/Merged/Released.
        # --rollup with the default --state pushed would print "[Implementation]",
        # which is not a valid rollup stage — reject the combination outright.
        repo = self.repo([("feat(BRD-RP-042): a\n\nScope: R1\n", ["src/a.ts"])])
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--rollup", "https://github.com/acme/widget/pull/7"])
        self.assertEqual(code, 2)
        self.assertIn("--state pushed", err)
        self.assertEqual(out, "")

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
