#!/usr/bin/env python3
"""Toolkit consistency checker — stdlib only.

Exit codes follow Architecture/validation-engine.md: 0 = clean, 1 = violations
found, 2 = the tool itself failed (unevaluable, NOT passing).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# design-toolkit/ is vendored verbatim and never edited here (VENDORED.md);
# its vocabulary belongs to the upstream project, not to this toolkit.
SKIP_DIRS = {".git", "design-toolkit", "node_modules", ".playwright-mcp"}
MODULE_DIRS = ["Architecture", "AI", "Workflows", "Skills", "Standards",
               "Templates", "Checklists", "Playbooks"]
# Files that are deliberately not indexed, each with its reason.
INDEX_EXEMPT = {
    "Documentation/module-index.md": "the index itself",
}
# Documentation/plans/ and Documentation/specs/ are this toolkit's own
# pre-implementation design records (each spec is filed "approved design,
# not yet implemented"): they legitimately name a guard/loop token before
# any module defines it -- "New guard `C_X`", "`L_X` (new)", "Produces:
# guard `C_X`". Rules G/K exist to keep the operative contract (MODULE_DIRS,
# plus whatever cites it) self-consistent; a proposal document naming the
# token it proposes is not that failure mode. Rules L (dead links) and M
# (module index) still scan these directories in full -- only the guard/
# loop token scan skips them.
PLANNING_DIRS = ("Documentation/plans/", "Documentation/specs/")

violations = []


def fail(rule, where, msg):
    violations.append("%s %s: %s" % (rule, where, msg))


def rel(path):
    return os.path.relpath(path, ROOT)


def is_contract_file(path):
    """False for this toolkit's own pre-implementation planning/spec docs
    (PLANNING_DIRS) -- see the comment on PLANNING_DIRS above."""
    return not rel(path).replace(os.sep, "/").startswith(PLANNING_DIRS)


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def md_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if name.endswith(".md"):
                yield os.path.join(dirpath, name)


LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
FENCE = re.compile(r"^\s*`{3,}.*?^\s*`{3,}", re.M | re.S)


def strip_fences(text):
    """Links inside fenced blocks are example content destined for other files,
    where the relative path is correct but is not correct from here. Scanning
    them produces false positives, and a checker that cries wolf gets muted."""
    return FENCE.sub("", text)


def rule_links(files):
    for path in files:
        for match in LINK.finditer(strip_fences(read(path))):
            target = match.group(1).split()[0]
            if target.startswith(("http://", "https://", "#", "mailto:")):
                continue
            resolved = os.path.normpath(
                os.path.join(os.path.dirname(path), target.split("#")[0]))
            if not os.path.exists(resolved):
                fail("L", rel(path), "dead link -> %s" % target)


def defined_tokens(path, pattern):
    if not os.path.exists(path):
        return set()
    return set(re.findall(pattern, read(path), re.M))


def rule_tokens(files, kind, used_pattern, defs):
    for path in files:
        for token in set(re.findall(used_pattern, read(path))):
            if token not in defs:
                fail(kind, rel(path), "undefined %s" % token)


def rule_approvals(files):
    schema = os.path.join(ROOT, "Architecture", "brd-schema.md")
    machine = os.path.join(ROOT, "Architecture", "workflow-state-machine.md")
    if not (os.path.exists(schema) and os.path.exists(machine)):
        return
    row = [ln for ln in read(schema).splitlines()
           if ln.startswith("| `Approvals`")]
    if not row:
        fail("A", "Architecture/brd-schema.md", "no Approvals property row")
        return
    declared = set(re.findall(r"`([a-z][a-z-]*)`", row[0])) - {"Approvals"}
    for token in set(re.findall(r"approval `([a-z][a-z-]*)`", read(machine))):
        if token not in declared:
            fail("A", "Architecture/workflow-state-machine.md",
                 "approval `%s` not declared in brd-schema Approvals" % token)


def rule_module_index(files):
    index_path = os.path.join(ROOT, "Documentation", "module-index.md")
    if not os.path.exists(index_path):
        fail("M", "Documentation/module-index.md", "missing")
        return
    index = read(index_path)
    for directory in MODULE_DIRS:
        base = os.path.join(ROOT, directory)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if not name.endswith(".md"):
                continue
            path = "%s/%s" % (directory, name)
            if path in INDEX_EXEMPT:
                continue
            if ("../%s" % path) not in index:
                fail("M", path, "not linked from Documentation/module-index.md")


def main():
    try:
        files = list(md_files())
        machine = os.path.join(ROOT, "Architecture", "workflow-state-machine.md")
        design = os.path.join(ROOT, "Architecture", "design-state-machine.md")
        guards = defined_tokens(machine, r"^\| `(C_[A-Z_]+)`")
        loops = (defined_tokens(machine, r"^\| `(L_[A-Z_]+)`")
                 | defined_tokens(design, r"`(L_[A-Z_]+)`"))
        rule_links(files)
        contract_files = [p for p in files if is_contract_file(p)]
        rule_tokens(contract_files, "G", r"`(C_[A-Z_]{2,})`", guards)
        rule_tokens(contract_files, "K", r"`(L_[A-Z_]{2,})`", loops)
        rule_approvals(files)
        rule_module_index(files)
    except Exception as exc:  # tool error is unevaluable, not passing
        print("toolkit-check: TOOL ERROR: %s" % exc, file=sys.stderr)
        return 2
    for line in violations:
        print(line)
    print("toolkit-check: %d files, %d violations" % (len(files), len(violations)))
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
