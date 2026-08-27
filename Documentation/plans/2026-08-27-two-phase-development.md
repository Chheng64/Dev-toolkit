# Two-Phase Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the toolkit's build segment into two gated passes — a front-end validated on mocks by a human, then a back-end that derives its contract from a Shared Contract artifact rather than from the front-end's working tree.

**Architecture:** No new `Status` values. A `Phase` property (`FE` · `BE` · `single`) parameterizes the existing segment `Dev Planning → … → Merged`, which runs twice for BRDs with server scope. The two phases communicate only through a third artifact — the Shared Contract (`CTR-<brd-id>-v<n>`) — enforced by a new mechanical guard `C_ISOLATION`.

**Tech Stack:** Markdown modules; Python 3 (stdlib only) for the consistency checker. No package manager at the repo root, so `python3` is the whole toolchain.

**Spec:** [../specs/2026-08-27-two-phase-development-design.md](../specs/2026-08-27-two-phase-development-design.md) @ `719a9e5`

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **Vocabulary is fixed.** `Phase` values are exactly `FE`, `BE`, `single`. Approval token is exactly `product`. Guards are exactly `C_SERVER_SCOPE`, `C_PARITY`, `C_ISOLATION`. Loop is exactly `L_CONTRACT`. Contract id shape is exactly `CTR-<brd-id>-v<n>`. Any variant spelling is a bug, not a synonym.
- **No new BRD sections.** S11 gains a citation, S13 gains a `Verified on: mocks | integrated` column. No `S17+`. No `S11.1`.
- **The contract is a third artifact.** Never a file in the front-end tree, never BRD content. Back-end planning's inputs are `contract.ts`, `contract.md`, `fixtures/` — front-end source is not an input.
- **Superseded, never edited.** A contract change issues `v<n+1>` naming what it supersedes and why.
- **`Merged (FE)` never reaches `Released`.** Release is a Phase-2 event.
- **Design sub-machine states 01–12 are unchanged.** Do not edit `Architecture/design-state-machine.md`, `Workflows/ux-workflow.md`, `Workflows/ui-workflow.md`, `Workflows/design-review.md`, or `Workflows/flow-visualization.md`.
- **`design-toolkit/` is vendored verbatim.** Never edit anything under it ([VENDORED.md](../../design-toolkit/VENDORED.md)).
- **Loop ceilings are per phase**, reset at the flip, reset logged in S16. `L_CONTRACT` ceiling is 2.
- **Target version v2.0.0.** Migration is one rule: every existing BRD becomes `Phase: single`.
- Branch: `feat/two-phase-development` (already cut from `release/v1.10.0`). Commit per task.

---

## File Structure

**New files (6 modules + 1 tool):**

| Path | Responsibility |
|---|---|
| `tools/toolkit-check.py` | The consistency checker. Link integrity + vocabulary coherence across modules. This plan's test harness |
| `Architecture/shared-contract.md` | The Shared Contract module: location by project shape, file set, `CTR` identity, supersession, ownership and isolation |
| `Templates/shared-contract.md` | The artifact's fill-in shape: `contract.ts` / `contract.md` / `fixtures/` / `VERSION` |
| `Workflows/product-validation.md` | Phase-1 exit conduct — walk the running app, assemble the Product Gate decision package |
| `Workflows/backend-integration.md` | Phase-2 seam — adapter swap, real error mapping, mock deletion |
| `Checklists/product-validation.md` | The Product Gate validator |
| `Checklists/integration-parity.md` | The `C_PARITY` validator |
| `Standards/service-contracts.md` | Adapter pattern, fixture discipline, exposure-control rule |

**Modified files, grouped by what they own:**

| Group | Files |
|---|---|
| Machine contracts | `Architecture/workflow-state-machine.md`, `Architecture/brd-schema.md`, `Architecture/screen-contract.md`, `Architecture/project-manifest.md` |
| Stage procedures | `Workflows/product-planning.md`, `frontend-planning.md`, `backend-planning.md`, `implementation.md`, `qa.md`, `code-review.md`, `project-onboarding.md` |
| Exit gates | `Checklists/development-ready.md` |
| Runtime | `AI/orchestrator.md`, `AI/model-routing.md` |
| Composition | `Playbooks/full-feature.md`, `design-only.md`, `hotfix.md` |
| Roles | `Skills/frontend-engineer.md`, `backend-engineer.md`, `qa-engineer.md` |
| Docs | `README.md`, `Documentation/module-index.md`, `Documentation/CHANGELOG.md` |

---

### Task 1: The consistency checker

The toolkit has no test runner. This script is what makes every later task verifiable: it is the red/green cycle for a documentation contract.

**Files:**
- Create: `tools/toolkit-check.py`
- Test: the script is run against the repo itself; the repo is the fixture

**Interfaces:**
- Consumes: nothing
- Produces: `python3 tools/toolkit-check.py` → exit `0` clean, `1` violations (one per line, `RULE path: message`), `2` tool error. Rule ids `L` (links), `G` (guards), `K` (loops), `A` (approval tokens), `M` (module index). Later tasks add rules `P` (phase vocabulary) and `I` (isolation wording).

- [ ] **Step 1: Write the checker**

```python
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

violations = []


def fail(rule, where, msg):
    violations.append("%s %s: %s" % (rule, where, msg))


def rel(path):
    return os.path.relpath(path, ROOT)


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
        rule_tokens(files, "G", r"`(C_[A-Z_]{2,})`", guards)
        rule_tokens(files, "K", r"`(L_[A-Z_]{2,})`", loops)
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
```

- [ ] **Step 2: Run it to establish the baseline**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: it runs and prints a count. It may report violations that predate this work.

- [ ] **Step 3: Drive the baseline to zero, honestly**

For every violation reported: either fix the module, or add an entry to `INDEX_EXEMPT` with a written reason. **Never** widen `SKIP_DIRS` or loosen a regex to make a real violation disappear — that is the exit-2-read-as-green failure `Architecture/validation-engine.md` exists to prevent. If a violation is genuinely a false positive, correct the checker and re-run.

Re-run until: `toolkit-check: N files, 0 violations`, `exit=0`.

- [ ] **Step 4: Commit**

```bash
git add tools/toolkit-check.py
git commit -m "chore: add toolkit consistency checker (links, guards, loops, approvals, index)"
```

---

### Task 2: Machine contract — Phase, guards, loop, gate, transitions

**Files:**
- Modify: `Architecture/workflow-state-machine.md` (§2 catalog note, §3 transitions, §4 guards, §5 loops, §6 gates)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: rule ids from Task 1
- Produces: guards `C_SERVER_SCOPE`, `C_PARITY`, `C_ISOLATION`; loop `L_CONTRACT`; gate token `product`; the phrase `Phase: FE` / `Phase: BE` / `Phase: single`. Every later task cites these spellings.

- [ ] **Step 1: Add the failing check — phase vocabulary rule `P`**

In `tools/toolkit-check.py`, add this function and call it from `main()` after `rule_module_index(files)`:

```python
PHASE_OK = {"FE", "BE", "single"}


def rule_phase_vocabulary(files):
    for path in files:
        for value in set(re.findall(r"`Phase: ([A-Za-z-]+)`", read(path))):
            if value not in PHASE_OK:
                fail("P", rel(path), "unknown Phase value `%s`" % value)
    machine = os.path.join(ROOT, "Architecture", "workflow-state-machine.md")
    if os.path.exists(machine):
        text = read(machine)
        for required in ("`C_SERVER_SCOPE`", "`C_PARITY`", "`C_ISOLATION`",
                         "`L_CONTRACT`", "approval `product`"):
            if required not in text:
                fail("P", "Architecture/workflow-state-machine.md",
                     "two-phase vocabulary missing: %s" % required)
```

- [ ] **Step 2: Run to verify it fails**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: FAIL, exit=1, five `P Architecture/workflow-state-machine.md: two-phase vocabulary missing: …` lines.

- [ ] **Step 3: Add the `Phase` note to §2**

Immediately after the state-catalog table in §2, before the "Conditional sub-state" paragraph, insert:

```markdown
**Phase dimension (v2.0).** States 05–11 carry a `Phase` (`FE` · `BE` · `single`). A BRD with server
scope runs the segment `Dev Planning → Implementation → QA → Tech Review → PR → Human Review →
Merged` **twice**: once as `Phase: FE` (the front-end built on mocks, exiting at the Product Gate),
then once as `Phase: BE` (the back-end built against the Shared Contract, exiting at the Final
Gate). `Phase: single` runs the segment once and is the pre-v2.0 path exactly. The phase is not a
`Status` value — no state is added, renamed or removed.
```

- [ ] **Step 4: Add the transition rows to §3**

Add to the transition table, after the `Planning | recommendation \`stop\` + human confirms | Stopped` row:

```markdown
| Planning | Direction approved ∧ `C_SERVER_SCOPE` | Design (`Phase: FE`) |
| Planning | Direction approved ∧ ¬`C_SERVER_SCOPE` | Design (`Phase: single`) |
```

Replace the `Human Review | approval \`final\` | Merged` row with:

```markdown
| Human Review (`Phase: FE`) | approval `product` | Merged (Phase-1 head; product freeze recorded) |
| Human Review (`Phase: BE` \| `Phase: single`) | approval `final` | Merged |
| Merged (`Phase: FE`) | product freeze recorded in S08 + S16 | Dev Planning (`Phase: BE`), loop counts reset |
| any `Phase: BE` state | server constraint contradicts approved front-end behaviour | Dev Planning (`Phase: FE`) via `L_CONTRACT`; `product` token dropped |
```

And replace `Merged | release steps done | Released` with:

```markdown
| Merged (`Phase: BE` \| `Phase: single`) | release steps done | Released |
```

- [ ] **Step 5: Add the guards to §4**

```markdown
| `C_SERVER_SCOPE` | Any S07 flow transition touches persistence, authentication, or an external service. Decided at **`Planning` exit**, logged S16 with its evidence. True → `Phase: FE` (two passes); false → `Phase: single` (one pass, pre-v2.0 behaviour). BE-only BRDs are `single` by the same test — there is no UI to validate. |
| `C_PARITY` | Checked at **Phase-2 QA exit**: (1) every AC marked `mocks` in S13 also carries an `integrated` verdict; (2) every method of the cited `CTR-<brd-id>-v<n>` has a `provided` API block in its screen's contract, and the shipped real adapter implements the contract interface unmodified; (3) zero live mock paths in shipped code — the mock adapter is deleted or demoted to test-only; (4) the Phase-1 exposure control is removed, and its removal is in the BE PR diff. Fail → Implementation (`Phase: BE`). |
| `C_ISOLATION` | Checked at **each phase's Tech Review**, mechanically, against the S10 touched-areas list: a `Phase: BE` branch touches no front-end paths and no contract files; a `Phase: FE` branch touches no server paths. The single bounded exception is integration's adapter wiring — one file per domain, declared in the Phase-2 S10. Fail → Tech Review stops with the offending paths named. |
```

- [ ] **Step 6: Add the loop to §5 and make ceilings per-phase**

Add the row:

```markdown
| `L_CONTRACT` | Phase `BE` → Dev Planning (`Phase: FE`) → back | 2 | Blocked + escalation summary |
```

And add below the table:

```markdown
**Ceilings are per phase.** `Loop Count` resets at the phase flip and the reset is logged in S16.
Phase-1 thrash never consumes Phase-2's revision budget. `L_CONTRACT` is the exception: it counts
across the flip, because it *is* the flip.
```

- [ ] **Step 7: Add the Product Gate to §6**

Insert between the Design and Developer Handoff rows:

```markdown
| **Product** | leaving Phase 1 (`Phase: FE` → `Merged`) | user | scoped to the running front-end at the FE PR head sha, the frozen prototype version, the issued `CTR-<brd-id>-v<n>`, and the S07/S09 walk evidence |
```

- [ ] **Step 8: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 9: Commit**

```bash
git add tools/toolkit-check.py Architecture/workflow-state-machine.md
git commit -m "feat: phase dimension, C_SERVER_SCOPE/C_PARITY/C_ISOLATION, L_CONTRACT, Product Gate"
```

---

### Task 3: BRD schema — Phase property, product token, S11 citation, S13 column

**Files:**
- Modify: `Architecture/brd-schema.md` (§1 properties, §2 section table)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: `Phase`, `product`, `CTR-<brd-id>-v<n>` from Task 2
- Produces: the `Approvals` declaration that rule `A` validates against; the S13 column name `Verified on`

- [ ] **Step 1: Run the checker to see rule A fail**

Task 2 wrote `approval \`product\`` into the machine. The schema does not declare it yet.

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: FAIL, exit=1, `A Architecture/workflow-state-machine.md: approval \`product\` not declared in brd-schema Approvals`.

- [ ] **Step 2: Update the Approvals row and add Phase**

Replace the `Approvals` row in §1 with:

```markdown
| `Approvals` | Multi-select | `direction`, `design`, `product`, `final` | Human gates granted |
| `Phase` | Select | `FE` · `BE` · `single` | Which pass of the build segment the BRD is in (v2.0). Machine state — set by the orchestrator at `Planning` exit, flipped at `Merged (FE)`. Hand edits only to correct a mis-scoped BRD, logged S16 |
```

- [ ] **Step 3: Point S11 at the contract and add the S13 column**

Replace the S11 row of the §2 section table with:

```markdown
| S11 | Component Plan & API Notes | revise | Files/components to create or modify. For server-scope BRDs this section **cites** the Shared Contract by id and version (`CTR-<brd-id>-v<n>`) and never reproduces it — see [shared-contract.md](shared-contract.md) |
```

Replace the S13 row with:

```markdown
| S13 | Test Cases, Bugs & Verification | revise | Test cases mapped to ACs; bug list with severity; verification status per AC with **`Verified on: mocks \| integrated`**. An AC passing on mocks and failing integrated is a blocker |
```

- [ ] **Step 4: Add the migration note to §5 Invariants**

```markdown
6. **v2.0 migration.** Every BRD that existed before v2.0.0 is `Phase: single` and behaves exactly
   as it did under v1.10.0. The split applies to BRDs that pass `Planning` under v2.0.0 or later.
```

- [ ] **Step 5: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 6: Commit**

```bash
git add Architecture/brd-schema.md
git commit -m "feat: BRD schema — Phase property, product approval token, S11 cites the contract"
```

---

### Task 4: The Shared Contract module and template

**Files:**
- Create: `Architecture/shared-contract.md`
- Create: `Templates/shared-contract.md`
- Modify: `Documentation/module-index.md` (two index lines — rule `M` requires them)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: `CTR-<brd-id>-v<n>`, `C_ISOLATION` from Task 2
- Produces: the file set `contract.ts` / `contract.md` / `fixtures/` / `VERSION`; the location rule (single-repo `contracts/<brd-id>/` vs bound `resources.contracts`); the read/write table cited by Tasks 7, 9, 10

- [ ] **Step 1: Run the checker after creating empty files to see rule M fail**

```bash
touch Architecture/shared-contract.md Templates/shared-contract.md
python3 tools/toolkit-check.py; echo "exit=$?"
```
Expected: FAIL, exit=1, two `M …: not linked from Documentation/module-index.md` lines.

- [ ] **Step 2: Write `Architecture/shared-contract.md`**

````markdown
# Shared Contract

> **Module:** Architecture / Foundation (v2.0)
> **Status:** Stable
> **Purpose:** The seam between the two development phases. A **third artifact** that the front-end
> and the back-end each implement, so neither reads the other's working context.
> **Gated by:** `C_ISOLATION` (Tech Review, both phases) and `C_PARITY` (Phase-2 QA exit) —
> [workflow-state-machine](workflow-state-machine.md) §4.

## 1. Why it is not in either codebase

The Screen Contract already establishes the rule: one fact, one home, referenced by id. A back-end
planner reading `src/services/**` to learn what an API must return is the same defect as pasting
screen mappings into the BRD — it couples two phases through a working tree instead of an artifact.

```
Front-end ──implements──┐
                        ├──►  Shared Contract  ──►  Integration
Back-end  ──implements──┘      CTR-<brd-id>-v<n>
```

## 2. Location — by project shape

| Project shape | Location |
|---|---|
| Single repo | `contracts/<brd-id>/` at the repo root |
| Separate bound repos (`repos.frontend` ≠ `repos.backend`) | the bound registry slot `resources.contracts`, consumed by both at a pinned ref |

The manifest decides ([project-manifest](project-manifest.md) §3). Onboarding binds
`resources.contracts` only for the split shape; once the shape requires the slot it is a **required**
binding and `C_RESOURCES` treats it as one.

## 3. File set

| File | Content | Written by |
|---|---|---|
| `contract.ts` | the interface and entity types both adapters implement | FE, at Phase-1 exit |
| `contract.md` | per method: inputs, outputs, every error variant, ordering and idempotency assumptions, latency tolerance, which S09 state each error renders, and the **adapter selection point** integration is allowed to touch | FE, at Phase-1 exit |
| `fixtures/` | the recorded example set — happy, empty, error, slow | FE, at Phase-1 exit |
| `VERSION` | `CTR-<brd-id>-v<n>` and the product freeze sha it was issued against | FE, at Phase-1 exit |

Written from what the front-end **actually does** — read out of the running app and its mock
adapter, never out of the Phase-1 plan. A contract written from the plan reintroduces the guessing
the two-phase split exists to remove.

## 4. Identity, versioning, freeze

- Identity `CTR-<brd-id>-v<n>`, issued at Phase-1 exit, frozen by the FE merge sha it names.
- **Superseded, never edited.** A change issues `v<n+1>` naming what it supersedes and why. An edit
  in place destroys the record of what Phase 2 was built against.
- BRD S11 **cites** id + version. The Screen Contract API block carries `demanded` → `provided`,
  both naming contract methods.

## 5. Ownership and isolation

| Role | Reads | Writes |
|---|---|---|
| Front-end, Phase 1 | S03/S06/S07/S09, screen contracts, its own tree | its own tree; **issues** the contract at phase exit |
| Back-end, Phase 2 | the contract, S03/S06/S07/S09, screen-contract `demanded` blocks | its own tree; the `provided` blocks |
| Back-end, Phase 2 | — | **never** the contract, **never** front-end behaviour |

`C_ISOLATION` enforces this mechanically off the S10 touched-areas list. Integration's adapter
wiring is the one bounded exception: one file per domain, the selection point named in
`contract.md`, declared in the Phase-2 S10. Anything wider is a violation, not a bigger allowance.

## 6. Anti-patterns

- The interface living in the front-end tree "because that is where the types are" — reverts the
  artifact to a coupling.
- Back-end editing the contract to fit what the server can do. Route: finding → Product Owner
  ruling → `L_CONTRACT` → front-end reissues `v<n+1>`.
- Fixtures that only cover the happy path — the error, empty and slow examples are the ones the
  back-end's failure behaviour is checked against.
- A contract written at Phase-1 *planning* time. It is issued at Phase-1 **exit**, from observed
  behaviour.
````

- [ ] **Step 3: Write `Templates/shared-contract.md`**

````markdown
# Template — Shared Contract

> Fill one per BRD with server scope, at Phase-1 exit. Contract module:
> [../Architecture/shared-contract.md](../Architecture/shared-contract.md).
> Location: `contracts/<brd-id>/` (single repo) or the bound `resources.contracts` slot (split repos).

## `VERSION`

```
CTR-<brd-id>-v<n>
product_freeze: <sha of the FE merge commit>
issued: <YYYY-MM-DD>
supersedes: CTR-<brd-id>-v<n-1> | none
supersedes_reason: <what changed and why> | n/a
```

## `contract.ts`

```ts
// The interface BOTH adapters implement. No implementation here.
export interface <Domain>Adapter {
  <method>(input: <InputType>): Promise<<OutputType>>;
}
```

## `contract.md`

### Adapter selection point

`<path>` — the one file per domain integration is permitted to touch (`C_ISOLATION` exception).

### Method: `<method>`

| Field | Value |
|---|---|
| Input | `<InputType>` — field-by-field, with which are optional |
| Output | `<OutputType>` |
| Error variants | one row per variant: name · when it occurs · **which S09 state renders it** |
| Ordering | what the front-end assumes about arrival order |
| Idempotency | whether a retry is safe, and on what key |
| Latency tolerance | what the front-end shows past which threshold |

Repeat per method. A method with no error variants stated is incomplete, not error-free.

## `fixtures/`

| File | Case |
|---|---|
| `<method>.happy.json` | the ordinary success |
| `<method>.empty.json` | the zero-result success |
| `<method>.error.<variant>.json` | one per error variant above |
| `<method>.slow.json` | the latency case, with the delay it simulates |
````

- [ ] **Step 4: Add the two index lines**

In `Documentation/module-index.md`, under `## Architecture/`, after the `screen-contract` line:

```markdown
- [shared-contract](../Architecture/shared-contract.md) — the phase seam: `CTR-<brd-id>-v<n>`, file set, location by project shape, ownership + `C_ISOLATION`
```

Under `## Templates/`, add:

```markdown
- [shared-contract](../Templates/shared-contract.md) — the contract artifact's fill-in shape
```

- [ ] **Step 5: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 6: Commit**

```bash
git add Architecture/shared-contract.md Templates/shared-contract.md Documentation/module-index.md
git commit -m "feat: Shared Contract module + template — the phase seam as a third artifact"
```

---

### Task 5: Screen Contract — demanded → provided

**Files:**
- Modify: `Architecture/screen-contract.md` (§3 block table, §6 check 5)
- Modify: `Checklists/screen-contract.md` (the executable form of check 5)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: `CTR-<brd-id>-v<n>` from Task 4
- Produces: the `demanded` / `provided` API-block vocabulary used by `C_PARITY` and Task 9

- [ ] **Step 1: Replace the API row in §3**

```markdown
| **API** | `demanded` at Phase-1 exit · `provided` in Phase 2 | FE demands, BE provides | **`demanded:`** the contract methods this screen needs, by `CTR-<brd-id>-v<n>` method name, each with the S09 state its errors render · **`provided:`** the endpoint/action satisfying each, filled in Phase 2. Screens with no server needs state `api: none` explicitly |
```

- [ ] **Step 2: Replace check 5 in §6**

```markdown
5. Every API dependency is documented: for `Phase: single` BRDs, the API block ↔ S11 contract; for
   split BRDs, every `demanded:` line names a method of the cited `CTR-<brd-id>-v<n>`, and at
   Phase-2 QA exit every `demanded:` line has a `provided:` line (`C_PARITY` check 2). Or explicit
   `api: none`.
```

- [ ] **Step 3: Mirror the wording in `Checklists/screen-contract.md`**

Find the check-5 item and replace its text with the §6 wording above, keeping the checklist's own
`- [ ]` formatting.

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Architecture/screen-contract.md Checklists/screen-contract.md
git commit -m "feat: screen contract API block becomes demanded -> provided"
```

---

### Task 6: Manifest and onboarding — phases block and the contracts slot

**Files:**
- Modify: `Architecture/project-manifest.md` (§2 schema, §3 registry slot table)
- Modify: `Workflows/project-onboarding.md` (binding step)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the location rule from Task 4
- Produces: manifest keys `phases.fe_exposure`, `phases.contracts_path`, `resources.contracts`

- [ ] **Step 1: Add the `phases:` block to §2**

```yaml
phases:
  fe_exposure: flag        # flag | route-hidden | staging-only — how a merged
                           # front-end on mocks is kept off users. Default: flag.
                           # If no feature-flag system is declared, the default
                           # degrades to route-hidden and the degradation is
                           # logged S16.
  contracts_path: contracts/   # single-repo shape only; ignored when
                               # resources.contracts is bound
```

- [ ] **Step 2: Add the registry slot to §3**

In the slot table, add:

```markdown
| `contracts` | **Required when `repos.frontend` ≠ `repos.backend`.** The Shared Contract repo ([shared-contract](shared-contract.md) §2). Not offered for the single-repo shape — `phases.contracts_path` covers it. Missing/unreachable → Resource Decision, `C_RESOURCES` fails at Dev Planning exit |
```

- [ ] **Step 3: Add the binding step to onboarding**

In the Project Resource Binding step, after the GitHub repositories item:

```markdown
- **Shared Contract** — offered **only** when the frontend and backend repositories are different
  bindings. Connect existing / create new; **skip is not offered**, because a split-repo project
  with two-phase BRDs has nowhere else to put the artifact. Single-repo projects are not asked:
  `phases.contracts_path` (default `contracts/`) applies and is recorded without a question.
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Architecture/project-manifest.md Workflows/project-onboarding.md
git commit -m "feat: manifest phases block + contracts registry slot; onboarding binds it when split"
```

---

### Task 7: Front-end planning and the service-contracts standard

**Files:**
- Modify: `Workflows/frontend-planning.md`
- Create: `Standards/service-contracts.md`
- Modify: `Documentation/module-index.md` (one index line)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the file set and issuance rule from Task 4
- Produces: the adapter/mock/fixture planning duties Task 8 verifies and Task 9 consumes

- [ ] **Step 1: Add the Phase-1 duties to `frontend-planning.md`**

Add to **Responsibilities**:

```markdown
8. **Plan the adapter boundary before the components.** Every server-touching interaction in S07
   goes through one adapter interface per domain. Name the interface, its methods, and the single
   **adapter selection point** file — the one place the implementation is chosen. Integration later
   touches only that file.
9. **Plan the fixture set, not just the happy path.** Per method: happy, empty, one per error
   variant, and a slow case. Each error fixture names the S09 state it renders. A state in S09 with
   no fixture is a state nobody will see before the Product Gate.
10. **No server assumptions.** `Phase: FE` plans no endpoint, no schema, no auth mechanism. What the
    server will look like is Phase 2's decision, made against the contract this phase issues.
11. **Issue the contract at phase exit**, per [shared-contract](../Architecture/shared-contract.md):
    `contract.ts`, `contract.md`, `fixtures/`, `VERSION` — written from the running app, not from
    this plan.
```

Add to **Completion Criteria**:

```markdown
- [ ] Adapter interface, method list and selection-point file named per domain
- [ ] Fixture set planned: happy · empty · one per error variant · slow, each error fixture bound to its S09 state
- [ ] Zero server-side decisions in S10/S11 (`Phase: FE`)
```

- [ ] **Step 2: Write `Standards/service-contracts.md`**

```markdown
# Standard — Service Contracts

> **Module:** Standards (v2.0)
> **Applies to:** any project running two-phase BRDs.
> **Contract module:** [../Architecture/shared-contract.md](../Architecture/shared-contract.md)

## 1. The adapter boundary

- One interface per domain, defined in the Shared Contract, implemented twice: a mock adapter in
  Phase 1, a real adapter in Phase 2.
- Exactly one **selection point** file per domain chooses the implementation. It is named in
  `contract.md` and is the only file integration may touch on the front-end side.
- Components never import an adapter implementation. They import the interface and receive the
  implementation through the selection point.

## 2. Fixtures

- A fixture set is a **recorded example set**, not test data. It is shared: Phase 2 checks its real
  responses against it.
- Required per method: happy · empty · one per error variant · slow.
- Every error fixture names the S09 state it renders. An error variant with no fixture is an
  unreachable state at review time.
- Fixtures are data files, never inline literals — the back-end reads them without running the app.

## 3. Exposure of a front-end merged on mocks

- A front-end merged to `main` against mocks must not be reachable by users. `phases.fe_exposure`
  decides how: `flag` (default), `route-hidden`, or `staging-only`.
- If the manifest declares no feature-flag system, the default degrades to `route-hidden` and the
  degradation is logged in S16 — never silently ignored.
- The control is removed in Phase 2, in the BE PR, and its removal is checked by `C_PARITY`.

## 4. Anti-patterns

- A component that knows whether it is talking to a mock.
- Mock behaviour that no fixture describes ("the mock just returns something sensible") — Phase 2
  cannot implement sensible.
- Deleting the mock adapter before `C_PARITY` runs; demote it to test-only, then delete.
- A second adapter path left wired behind an environment variable — that is a mock in production.
```

- [ ] **Step 3: Add the index line**

Under `## Standards/`, in the `Server/quality:` line, append:

```markdown
 · [service-contracts](../Standards/service-contracts.md)
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Workflows/frontend-planning.md Standards/service-contracts.md Documentation/module-index.md
git commit -m "feat: front-end planning owns the adapter boundary; add service-contracts standard"
```

---

### Task 8: Product validation — workflow and checklist

**Files:**
- Create: `Workflows/product-validation.md`
- Create: `Checklists/product-validation.md`
- Modify: `Documentation/module-index.md` (two index lines)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the Product Gate row from Task 2, the contract issuance from Task 7
- Produces: the Phase-1 exit procedure the playbook (Task 13) sequences

- [ ] **Step 1: Write `Workflows/product-validation.md`**

```markdown
# Workflow — Product Validation

> **Module:** Workflows (v2.0)
> **Stage:** `Human Review` with `Phase: FE` — the Phase-1 exit
> **Skill:** Product Manager (conduct) · Frontend Engineer (evidence)
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §6 — **Product Gate**

## Purpose

Put the running product in front of the human and capture a decision. Not a code review: the
question is "is this the product?", answered against the app, not the diff.

## Inputs

- The FE branch at its PR head, running locally against mocks
- S07 flows, S09 edge-case matrix, S03 acceptance criteria
- The frozen prototype version and the design-audit verdict
- The issued `CTR-<brd-id>-v<n>`

## Outputs

- Approval `product` in `Approvals`, or structured change requests in S16
- S16 gate record naming: the head sha reviewed, the prototype version, the contract version, and
  what the human actually saw
- S08 records the product freeze sha once the FE PR merges

## Responsibilities

1. **Run it, do not screenshot it.** The review is conducted against the running app. A static
   capture is evidence of a moment, not of a product.
2. **Walk every S07 flow end to end**, including recovery routes.
3. **Walk every S09 state** — loading, empty, error variants, interrupted, offline,
   permission-denied. Each is reached by its fixture, and the fixture is named in the record.
4. **Present limitations at full strength.** Mock-backed means: no real latency, no real failure
   modes, no real data volume. Say so in the packet, before the verdict, not after it.
5. **Capture the verdict** as `approve` / `request-changes` / `reject`. Change requests are
   structured, each routed to its owning stage; none silently dropped.
6. **A qualified acceptance is recorded with its qualifications**, each carrying a rider debt item
   with grantor and closing condition.

## Completion Criteria

- [ ] Every S07 flow walked in the running app, recovery routes included
- [ ] Every S09 state reached, each by a named fixture
- [ ] Mock-backed limitations stated in the packet at full strength
- [ ] `CTR-<brd-id>-v<n>` issued and cited in S11 before the gate is put
- [ ] Verdict captured; change requests structured and routed; qualifications carry riders
- [ ] S16 gate record names head sha + prototype version + contract version

## Failure & Loops

- `request-changes` → Implementation (`Phase: FE`), counted against `L_HUMAN` for this phase.
- `reject` (the product is wrong, not the build) → `Analysis`.
- Human unavailable → `Blocked` (resumable, `paused-by-user`).

## Common Mistakes

- Reviewing the diff instead of the app — that is Tech Review, and it already happened.
- Walking the happy path and describing the rest. S09 states are what the fixtures exist for.
- Letting the contract be written after the gate: the human is approving behaviour the contract
  claims to describe, so it is issued **before** the gate, not after.
- Recording "approved" for an acceptance that carried qualifications.
```

- [ ] **Step 2: Write `Checklists/product-validation.md`**

```markdown
# Checklist — Product Validation (Product Gate)

> Validator for the Phase-1 exit. Workflow: [../Workflows/product-validation.md](../Workflows/product-validation.md).
> Any unchecked item → the gate is not put.

## Preconditions
- [ ] `Phase: FE`, FE PR open, CI green
- [ ] `C_SECURITY`: certificate `certified` against the FE PR head
- [ ] `C_ISOLATION`: the FE branch touches no server paths
- [ ] `CTR-<brd-id>-v<n>` issued; S11 cites it; `VERSION` names the head sha

## The walk
- [ ] Every S07 flow walked in the running app
- [ ] Every recovery route reachable
- [ ] Every S09 state reached, each by a named fixture
- [ ] Every S03 AC that is front-end-observable verified, S13 marked `Verified on: mocks`

## The packet
- [ ] Mock-backed limitations stated at full strength, before the verdict
- [ ] Prototype version and contract version named
- [ ] Head sha named

## The verdict
- [ ] Captured as `approve` / `request-changes` / `reject`
- [ ] Change requests structured and routed to owning stages
- [ ] Qualifications recorded with rider, grantor, closing condition
- [ ] S16 gate record written
```

- [ ] **Step 3: Add the index lines**

Under `## Workflows/`, in the Dev-stage line, after `frontend-planning`:

```markdown
 · [product-validation](../Workflows/product-validation.md) (Product Gate, Phase-1 exit)
```

Under `## Checklists/`, add:

```markdown
- [product-validation](../Checklists/product-validation.md) — the Product Gate validator
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Workflows/product-validation.md Checklists/product-validation.md Documentation/module-index.md
git commit -m "feat: product-validation workflow + checklist (the Product Gate)"
```

---

### Task 9: Back-end planning derives from the contract

**Files:**
- Modify: `Workflows/backend-planning.md` (Inputs, Responsibilities, Completion Criteria, Common Mistakes)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the contract file set (Task 4), `demanded:` blocks (Task 5)
- Produces: the `provided:` blocks `C_PARITY` check 2 reads

- [ ] **Step 1: Replace the Inputs list**

```markdown
- **The Shared Contract** — `contract.ts`, `contract.md`, `fixtures/`, `VERSION`
  ([shared-contract](../Architecture/shared-contract.md)). For a split BRD this is the primary
  input, and **front-end source is not an input at all**
- `Approvals` contains `product`; the product freeze sha in S08
- S03 ACs, S07 flows, S09 edge cases, screen-contract `demanded:` blocks
- Existing backend architecture (project repo), external service docs
- Open S16 `Affects:` entries targeting S10/S11
```

- [ ] **Step 2: Replace Responsibility 1 and add three**

Replace responsibility 1 with:

```markdown
1. **Derive server work from the contract, not from the flows.** Every method in
   `CTR-<brd-id>-v<n>` gets an endpoint or action satisfying its inputs, outputs, **every error
   variant**, its ordering and idempotency statements, and its latency tolerance. An endpoint no
   contract method calls is orphan work; a contract method with no endpoint is a gap that fails
   `C_PARITY`.
```

Add:

```markdown
9. **Answer every line of `contract.md`.** A method whose error variants are unimplemented has not
   been planned — it has been half-planned, and QA will find the half at integration.
10. **Check the real responses against `fixtures/`.** The fixtures are the recorded shape the
    front-end was approved against; a response that does not match one of them is a contract
    conflict, not a detail.
11. **Never edit the contract.** A server constraint that contradicts approved behaviour is a
    finding plus a Product Owner ruling, routed through `L_CONTRACT`; the front-end reissues
    `v<n+1>`. Editing the artifact in place destroys the record of what Phase 2 was built against.
```

- [ ] **Step 3: Add to Completion Criteria**

```markdown
- [ ] Every `CTR-<brd-id>-v<n>` method has a contracted endpoint/action, error variants included
- [ ] Every screen-contract `demanded:` line has a planned `provided:` line
- [ ] Real response shapes checked against `fixtures/`
- [ ] Zero edits to the contract artifact from this stage
```

- [ ] **Step 4: Add to Common Mistakes**

```markdown
- Reading the front-end's source to work out what the API should return. That is the coupling the
  contract exists to remove, and `C_ISOLATION` will fail the branch that acts on it.
- Implementing the happy path of a contract method and deferring its error variants — the front-end
  already renders S09 states for them, and they were approved.
- "Adjusting" the contract because the server cannot do it that way. Route it; do not edit it.
```

- [ ] **Step 5: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 6: Commit**

```bash
git add Workflows/backend-planning.md
git commit -m "feat: backend planning derives from the Shared Contract, not from front-end source"
```

---

### Task 10: Back-end integration — workflow and parity checklist

**Files:**
- Create: `Workflows/backend-integration.md`
- Create: `Checklists/integration-parity.md`
- Modify: `Documentation/module-index.md` (two index lines)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: `C_PARITY` (Task 2), the selection point (Task 7), `provided:` (Task 9)
- Produces: the Phase-2 exit procedure Task 11 and Task 13 sequence

- [ ] **Step 1: Write `Workflows/backend-integration.md`**

```markdown
# Workflow — Back-end Integration

> **Module:** Workflows (v2.0)
> **Stage:** `Implementation` with `Phase: BE`, exit step — runs before Phase-2 QA
> **Skill:** Backend / Full Stack Engineer
> **Not to be confused with** [integration-validation](integration-validation.md), which validates a
> project's external integrations at onboarding.

## Purpose

Replace the mock implementation with the real one, at the one place the contract permits, and prove
the product still behaves the way it was approved.

## Inputs

- The real adapter implementing `contract.ts` unmodified
- `contract.md` — in particular the **adapter selection point** and the error-variant table
- `fixtures/` — the recorded shapes the approved product was reviewed against
- The product freeze sha in S08; S13 rows marked `Verified on: mocks`

## Responsibilities

1. **Swap at the selection point only.** One file per domain, named in `contract.md`, declared in
   the Phase-2 S10 touched-areas list. Any wider front-end change fails `C_ISOLATION`.
2. **Map every real error to its contracted variant** before wiring the happy path. The S09 state
   each variant renders is already built and already approved; an unmapped error renders nothing.
3. **Compare real responses to `fixtures/`.** A mismatch is a contract conflict — route it through
   `L_CONTRACT`, never reshape the front-end to absorb it.
4. **Remove the exposure control** (`phases.fe_exposure`) in this PR. Its removal is what makes the
   feature reachable, and `C_PARITY` checks the removal is in the diff.
5. **Demote then delete the mock.** Test-only first so Phase-2 QA can still run the fixture cases,
   deleted before `C_PARITY`. A dual path behind an environment variable is a mock in production.
6. **Log every deviation** in S12 with reason, as any implementation stage does.

## Completion Criteria

- [ ] Real adapter implements `contract.ts` unmodified (typecheck clean)
- [ ] Every contracted error variant mapped to a real error, at a locatable `file:line`
- [ ] Real responses compared against every fixture; mismatches routed, not absorbed
- [ ] Selection-point diff is one file per domain; no other front-end path touched
- [ ] Exposure control removed in this PR
- [ ] Mock adapter deleted or test-only; zero live mock paths
- [ ] S12 entries current; S16 stage-exit entry written

## Failure & Loops

- Real behaviour cannot satisfy a contracted method → finding + Product Owner ruling → `L_CONTRACT`
  (ceiling 2), `product` token dropped, front-end reissues `v<n+1>`.
- `C_PARITY` fail → back to Implementation (`Phase: BE`), counted against `L_QA`.

## Common Mistakes

- Widening the swap: "while I was in there" edits to front-end components. That is the isolation
  breach the guard exists for.
- Wiring the happy path first and leaving error mapping for later — the approved product is mostly
  its non-happy paths.
- Keeping the mock as a runtime fallback "for safety".
- Removing the exposure control in a separate PR, so `main` briefly ships an unreachable feature or
  a reachable unfinished one.
```

- [ ] **Step 2: Write `Checklists/integration-parity.md`**

```markdown
# Checklist — Integration Parity (`C_PARITY`)

> Validator run at **Phase-2 QA exit**. Guard: [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4.
> Any unchecked item → stop, report, route to Implementation (`Phase: BE`).

## 1. Acceptance criteria
- [ ] Every S13 row marked `Verified on: mocks` also carries an `integrated` verdict
- [ ] Zero ACs passing on mocks and failing integrated (any such row is a blocker, not a note)

## 2. Contract coverage
- [ ] Every method of the cited `CTR-<brd-id>-v<n>` has a `provided:` line in its screen's contract
- [ ] The shipped real adapter implements the contract interface **unmodified** (typecheck clean)
- [ ] Every contracted error variant is reachable in the integrated app

## 3. Mock removal
- [ ] Mock adapter deleted, or present only under test paths
- [ ] No runtime switch, environment variable or fallback selects a mock
- [ ] Fixtures retained (they are the recorded contract examples, not dead test data)

## 4. Exposure
- [ ] The Phase-1 exposure control is removed
- [ ] Its removal is visible in the BE PR diff

## 5. Isolation
- [ ] The BE branch's front-end diff is the selection point only, one file per domain
- [ ] Zero edits to the contract artifact from Phase 2
```

- [ ] **Step 3: Add the index lines**

Under `## Workflows/`, after `implementation`:

```markdown
 · [backend-integration](../Workflows/backend-integration.md) (Phase-2 seam)
```

Under `## Checklists/`:

```markdown
- [integration-parity](../Checklists/integration-parity.md) — the `C_PARITY` validator
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Workflows/backend-integration.md Checklists/integration-parity.md Documentation/module-index.md
git commit -m "feat: backend-integration workflow + integration-parity checklist (C_PARITY)"
```

---

### Task 11: Implementation, QA and the dev-ready checklist go phase-aware

**Files:**
- Modify: `Workflows/implementation.md`
- Modify: `Workflows/qa.md`
- Modify: `Workflows/code-review.md` (the `C_ISOLATION` check)
- Modify: `Checklists/development-ready.md`
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: `C_ISOLATION`, `C_PARITY`, `Verified on` (Tasks 2–3), the integration workflow (Task 10)
- Produces: nothing later tasks depend on

- [ ] **Step 1: Add the phase section to `implementation.md`**

After the Responsibilities list:

```markdown
## Phase scope (v2.0)

| `Phase` | Builds | Exits through |
|---|---|---|
| `FE` | components, state, the mock adapter and its fixture set; every S09 state reachable | certification → Tech Review → the **Product Gate** |
| `BE` | endpoints, data model, authz, integrations; then [backend-integration](backend-integration.md) | certification → Tech Review → `C_PARITY` at QA exit → the **Final Gate** |
| `single` | both, as before v2.0 | unchanged |

A `Phase: FE` branch writes no server code and a `Phase: BE` branch writes no front-end behaviour —
`C_ISOLATION` fails the branch that does, at Tech Review, naming the paths.
```

- [ ] **Step 2: Add the two QA modes to `qa.md`**

```markdown
## Phase modes (v2.0)

| | `Phase: FE` (mock-backed) | `Phase: BE` (integrated) |
|---|---|---|
| Verify | every front-end-observable AC · every S09 state via its fixture · a11y · responsive · arrangement tests | every Phase-1 AC **re-run against the real service** · server-only ACs · latency, ordering, partial failure, retry, webhook delay |
| S13 | mark `Verified on: mocks` | mark `Verified on: integrated` |
| Exit | Tech Review | Tech Review, after `C_PARITY` ([integration-parity](../Checklists/integration-parity.md)) |

An AC verified on mocks is **not** verified. It is verified on mocks, which is why the column
exists. `Phase: single` BRDs use the integrated column only.
```

- [ ] **Step 3: Add the isolation check to `code-review.md`**

In the dimension list, add:

```markdown
- **Phase isolation (`C_ISOLATION`, v2.0)** — check the diff's paths against the S10 touched-areas
  list: a `Phase: BE` branch must touch no front-end paths beyond the declared selection point (one
  file per domain) and no contract files; a `Phase: FE` branch must touch no server paths. This is a
  path check, not a judgment call — report the offending paths and stop.
```

- [ ] **Step 4: Phase-scope `development-ready.md`**

Add at the top of the checklist:

```markdown
## Phase scope
- [ ] `Phase` is set (`FE` · `BE` · `single`) and matches the `C_SERVER_SCOPE` decision logged in S16
- [ ] `Phase: BE` only — the cited `CTR-<brd-id>-v<n>` exists, `VERSION` names the product freeze sha, and the plan answers every line of `contract.md`
- [ ] `Phase: FE` only — adapter interface, selection point and fixture set are planned; zero server-side decisions in S10/S11
```

- [ ] **Step 5: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 6: Commit**

```bash
git add Workflows/implementation.md Workflows/qa.md Workflows/code-review.md Checklists/development-ready.md
git commit -m "feat: implementation/QA/review/dev-ready become phase-aware"
```

---

### Task 12: Orchestrator and model routing

**Files:**
- Modify: `AI/orchestrator.md`
- Modify: `AI/model-routing.md` (§2 stage table)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: everything from Tasks 2–11
- Produces: the runtime behaviour the playbook (Task 13) assumes

- [ ] **Step 1: Add the phase responsibility to `orchestrator.md`**

Add as a numbered responsibility after the stage-routing one:

```markdown
N. **Phase handling (v2.0).**
   1. At `Planning` exit, decide `C_SERVER_SCOPE`, set `Phase`, and log the decision with its
      evidence in S16. Never infer the phase later from the diff.
   2. At `Merged` with `Phase: FE`: record the product freeze sha in S08, flip `Phase` to `BE`,
      **reset `Loop Count`** and log the reset, then re-enter `Dev Planning`. Do not pass to
      `Released` — release is a Phase-2 event.
   3. Present the Product Gate as a *product* decision package (running app, flows walked, states
      walked, limitations at full strength), not a diff summary.
   4. On `L_CONTRACT`: drop the `product` token from `Approvals`, log the conflict with the
      contradicting constraint named, and re-enter `Dev Planning` with `Phase: FE`.
   5. Resume reads `Phase` from the property, never from the branch name. A BRD whose `Phase` is
      unset and whose Status is past `Planning` is a migration case: set `single` and log it.
```

- [ ] **Step 2: Add the routing rows to `model-routing.md` §2**

Replace the `Dev Planning (FE/BE)` row and add two:

```markdown
| Dev Planning (`Phase: FE`) | **T3** | The adapter boundary and the fixture set become the contract; rework cost peaks here |
| Dev Planning (`Phase: BE`) | **T3** | Contracts freeze against an already-approved product; a missed error variant ships |
| Product validation (Product Gate) | T2 | Packaging + capture; the judgment is the user's — same shape as design state 09 |
| Back-end integration (Phase-2 seam) | **T3** | Error mapping and parity against fixtures; a miss reaches production behind an approved front-end |
```

- [ ] **Step 3: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 4: Commit**

```bash
git add AI/orchestrator.md AI/model-routing.md
git commit -m "feat: orchestrator phase handling + model tiers for the new stages"
```

---

### Task 13: Playbooks

**Files:**
- Modify: `Playbooks/full-feature.md` (sequence table, loop wiring, rules)
- Modify: `Playbooks/design-only.md`, `Playbooks/hotfix.md` (declare `Phase: single`)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the workflows from Tasks 8 and 10
- Produces: the composed sequence a reader follows end to end

- [ ] **Step 1: Split the build rows in `full-feature.md`**

Replace rows 5–11 of the sequence table with:

```markdown
| 5 | `Dev Planning` `FE` | [frontend-planning](../Workflows/frontend-planning.md) — adapter boundary, fixture set, no server decisions | [development-ready](../Checklists/development-ready.md) |
| 6 | `Implementation` `FE` | [implementation](../Workflows/implementation.md) + [security-certification](../Workflows/security-certification.md) | `C_SECURITY` |
| 7 | `QA` `FE` | [qa](../Workflows/qa.md) mock-backed mode; S13 `Verified on: mocks` | [qa-testing](../Checklists/qa-testing.md) |
| 8 | `Tech Review` `FE` | [code-review](../Workflows/code-review.md) + `C_ISOLATION` | [code-review](../Checklists/code-review.md) |
| 9 | `PR` `FE` | [git](../Workflows/git.md); exposure control in place | CI ✅ |
| 10 | `Human Review` `FE` | [product-validation](../Workflows/product-validation.md) — walk the running app | **Product Gate** |
| 11 | `Merged` `FE` | merge; record the product freeze sha; issue `CTR-<brd-id>-v<n>`; **flip to `Phase: BE`**, reset loop counts | phase flip logged S16 |
| 12 | `Dev Planning` `BE` | [backend-planning](../Workflows/backend-planning.md) — derive from the contract; front-end source is not an input | [development-ready](../Checklists/development-ready.md) |
| 13 | `Implementation` `BE` | [implementation](../Workflows/implementation.md) → [backend-integration](../Workflows/backend-integration.md) + certification | `C_SECURITY` |
| 14 | `QA` `BE` | [qa](../Workflows/qa.md) integrated mode; re-verify every `mocks` row | [integration-parity](../Checklists/integration-parity.md) → `C_PARITY` |
| 15 | `Tech Review` `BE` | [code-review](../Workflows/code-review.md) + `C_ISOLATION` | [code-review](../Checklists/code-review.md) |
| 16 | `PR` `BE` | [git](../Workflows/git.md) | CI ✅ |
| 17 | `Human Review` `BE` | Present PR decision package | **Final Gate** |
| 18 | `Merged` `BE` | merge mechanics | merged, main green |
| 19 | `Released` | [release](../Workflows/release.md) | [release](../Checklists/release.md) |
```

- [ ] **Step 2: Add the loop and rule lines**

To **Loop wiring**:

```markdown
- Loop ceilings are per phase and reset at the flip (logged S16). `L_CONTRACT` ≤2 is the exception —
  it counts across the flip, because it is the flip.
- A server constraint contradicting approved front-end behaviour → `L_CONTRACT`: `product` token
  dropped, back to `Dev Planning` (`Phase: FE`), contract reissued as `v<n+1>`.
```

To **Rules**:

```markdown
- The two phases communicate through the Shared Contract only. Back-end planning does not read
  front-end source, and back-end implementation does not edit the contract (`C_ISOLATION`).
- A front-end merged on mocks is never user-reachable: `phases.fe_exposure` holds until Phase 2
  removes it, in the BE PR, checked by `C_PARITY`.
- `Phase: single` BRDs (no server scope) run rows 5–11 once and exit at the Final Gate.
```

- [ ] **Step 3: Declare `Phase: single` in the two reduced playbooks**

Add one line near the top of each of `Playbooks/design-only.md` and `Playbooks/hotfix.md`:

```markdown
> **Phase:** `single` — this path never splits. A hotfix under time pressure and a design-only BRD
> both run one pass; the two-phase split applies to full features with server scope.
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Playbooks/full-feature.md Playbooks/design-only.md Playbooks/hotfix.md
git commit -m "feat: playbooks sequence the two phases; reduced paths declare Phase: single"
```

---

### Task 14: Role ownership

**Files:**
- Modify: `Skills/frontend-engineer.md`, `Skills/backend-engineer.md`, `Skills/qa-engineer.md`
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: the ownership table from Task 4
- Produces: nothing later tasks depend on

- [ ] **Step 1: Add to `Skills/frontend-engineer.md`**

```markdown
## Phase ownership (v2.0)

Owns `Phase: FE` end to end, and **issues** the Shared Contract at phase exit
([shared-contract](../Architecture/shared-contract.md)) — written from the running app and its mock
adapter, never from the plan. Writes no server code in Phase 1. In Phase 2 owns nothing but the
selection point, and only when integration touches it.
```

- [ ] **Step 2: Add to `Skills/backend-engineer.md`**

```markdown
## Phase ownership (v2.0)

Owns `Phase: BE`. Reads the Shared Contract; **never edits it**, and never reads front-end source to
infer it. A server constraint that contradicts approved behaviour is a finding plus a Product Owner
ruling routed through `L_CONTRACT`, not a quiet reshape of the product.
```

- [ ] **Step 3: Add to `Skills/qa-engineer.md`**

```markdown
## Phase ownership (v2.0)

Verifies twice and says which: `Verified on: mocks` in Phase 1, `Verified on: integrated` in
Phase 2. Owns `C_PARITY` at Phase-2 QA exit
([integration-parity](../Checklists/integration-parity.md)). An AC green on mocks and red integrated
is a blocker.
```

- [ ] **Step 4: Run to verify it passes**

Run: `python3 tools/toolkit-check.py; echo "exit=$?"`
Expected: PASS, exit=0.

- [ ] **Step 5: Commit**

```bash
git add Skills/frontend-engineer.md Skills/backend-engineer.md Skills/qa-engineer.md
git commit -m "feat: role ownership for the two phases"
```

---

### Task 15: README, changelog, release

**Files:**
- Modify: `README.md` (version line, machine diagram, gate count)
- Modify: `Documentation/CHANGELOG.md` (v2.0.0 entry with migration notes)
- Test: `python3 tools/toolkit-check.py`

**Interfaces:**
- Consumes: everything
- Produces: the release artifact

- [ ] **Step 1: Update the README machine diagram**

Replace the state-machine block with:

```markdown
Ready → Analysis → Planning → Design → Design Review →
  ┌ Phase FE ─────────────────────────────────────────────────┐
  │ Dev Planning → Implementation →🔒→ QA → Tech Review → PR → │
  │ Human Review 🚦 Product Gate → Merged (product freeze)     │
  └──────────────────────┬─────────────────────────────────────┘
              Shared Contract CTR-<brd-id>-v<n>
  ┌ Phase BE ────────────▼─────────────────────────────────────┐
  │ Dev Planning → Implementation →🔒→ QA → Tech Review → PR → │
  │ Human Review 🚦 Final Gate → Merged → Released             │
  └────────────────────────────────────────────────────────────┘
        🚦 Direction Gate   🚦 Design Gate
        🔒 Security Certificate (machine gate, per phase)
```

Update the version line to `**Version: v2.0.0**` and the gate count from three to **four** wherever
the README states it (`Direction · Design · Product · Final`, plus the optional Developer Handoff).

- [ ] **Step 2: Write the changelog entry**

Under `## [Unreleased]`, add:

```markdown
## [2.0.0] — 2026-08-27

**Development splits into two gated phases.** The front-end is built on mocks and approved by a
human as the product; the back-end then derives its contract from that approved behaviour instead of
from documents. The two phases communicate only through a third artifact.

### Added
- `Architecture/shared-contract.md` + `Templates/shared-contract.md` — `CTR-<brd-id>-v<n>`:
  `contract.ts`, `contract.md`, `fixtures/`, `VERSION`. Superseded, never edited.
- `Workflows/product-validation.md` + `Checklists/product-validation.md` — the **Product Gate**.
- `Workflows/backend-integration.md` + `Checklists/integration-parity.md` — the Phase-2 seam and
  `C_PARITY`.
- `Standards/service-contracts.md` — adapter boundary, fixture discipline, exposure control.
- `tools/toolkit-check.py` — consistency checker: links, guard/loop vocabulary, approval tokens,
  module-index coverage, phase vocabulary. Exit 2 = unevaluable, never passing.
- Guards `C_SERVER_SCOPE`, `C_PARITY`, `C_ISOLATION`; loop `L_CONTRACT` (ceiling 2); BRD property
  `Phase`; approval token `product`; manifest `phases:` block and the `contracts` registry slot.

### Changed
- Loop ceilings are per phase and reset at the flip.
- S11 **cites** the contract instead of holding it; S13 gains `Verified on: mocks | integrated`.
- Screen-contract API block becomes `demanded` → `provided`.
- Backend planning's inputs are the contract; front-end source is explicitly not an input.

### Migration
Two Notion edits, once per workspace: add the `Phase` select (`FE`, `BE`, `single`) and add
`product` to the `Approvals` multi-select. **Every existing BRD becomes `Phase: single`** and
behaves exactly as it did under v1.10.0. The split applies to BRDs passing `Planning` under v2.0.0.

### Notes
- No `Status` value is added, renamed or removed; the 13 stages stand. The major bump is for the
  manual Notion migration and the changed meaning of `Merged` for split BRDs.
- Design sub-machine states 01–12 are untouched.
```

- [ ] **Step 3: Full validation run**

```bash
python3 tools/toolkit-check.py; echo "exit=$?"
git status --porcelain
```
Expected: `0 violations`, `exit=0`, clean tree after commit.

- [ ] **Step 4: Commit**

```bash
git add README.md Documentation/CHANGELOG.md
git commit -m "docs: v2.0.0 — two-phase development, README machine diagram, migration notes"
```

- [ ] **Step 5: Open the PR**

```bash
git push -u origin feat/two-phase-development
gh pr create --base main --head feat/two-phase-development \
  --title "feat: v2.0.0 — two-phase development (front-end validation, then back-end integration)" \
  --body "Implements Documentation/specs/2026-08-27-two-phase-development-design.md. Checker: python3 tools/toolkit-check.py -> 0 violations."
```

Note: `main` is PR-protected and this branch is based on `release/v1.10.0`. If PR #2 has not merged
yet, retarget the base to `release/v1.10.0` or rebase after it lands — do not push `main` directly.

---

## Self-Review

Run after the last task, before requesting review.

- [ ] **Spec coverage.** Walk the spec §3–§9 and name the task implementing each: §3.1 → T2 · §3.2 → T3 · §3.3 → T2/T12 · §3.4 → T2 · §4.1 → T4/T6 · §4.2 → T4 · §4.3 → T4/T3 · §4.4 → T2/T11 · §4.5 → T9/T10 · §4.6 → T9/T12 · §5.1 → T2/T8 · §5.2 → T2/T12 · §5.3 → T11 · §5.4 → T10 · §5.5 → T6/T7 · §5.6 → T11 · §6 → T2–T15 · §7 → T3/T15.
- [ ] **Placeholder scan.** `grep -rnE "TBD|TODO|fill in|as appropriate" Documentation/plans/2026-08-27-two-phase-development.md` → no hits.
- [ ] **Vocabulary consistency.** `python3 tools/toolkit-check.py` exits 0, which is the mechanical form of this check.
