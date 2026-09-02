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

    def test_covered_sha_prints_a_backfill_row(self):
        repo = self.repo([("feat(BRD-RP-042): pre-v2.1 history\n", ["src/a.ts"])])
        sha = subprocess.check_output(["git", "-C", repo, "rev-parse", "HEAD"],
                                      universal_newlines=True).strip()
        code, out, err = run(["--repo", repo, "--branch", BRANCH,
                              "--covered", sha[:7]])
        self.assertEqual(code, 0, err)
        self.assertIn("Backfill:", out)
        self.assertIn("State: pushed", out)

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
