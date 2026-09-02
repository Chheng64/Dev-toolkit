# Design — the Delivery Log: GitHub links on the feature, the scope and the screen

> **Status:** approved design, not yet implemented
> **Date:** 2026-09-02
> **Target version:** v2.1.0 (minor — new section `S17`, new optional properties, new guard;
> [versioning](../../Architecture/versioning.md) §1)
> **Scope:** BRD schema (`S17` + three properties), the commit convention, lifecycle states 06–12
> (`Implementation` → `Released`), guard **C_DELIVERY**, one new tool, one new checklist, the
> Notion view the Product Owner actually reads.
> **Spec location note:** filed under `Documentation/` for the reason given in
> [2026-08-26-feature-prototype-design.md](2026-08-26-feature-prototype-design.md) — a second docs
> root in a toolkit this opinionated about structure is a defect, not a convenience.

## 1. Problem

A Product Owner cannot see, from Notion, what has been committed for a feature until a PR exists.

The BRD holds four Git links — `Branch`, `PR`, `FE PR`, `BE PR` — and every one of them is written
at lifecycle state 09 (`PR`) by the Git Manager ([Workflows/git.md](../../Workflows/git.md)
outputs). Everything before that is prose: S12 progress entries, written by the engineer, in
whatever shape that session chose. So during `Implementation` — the longest state in the machine,
the one that can span days and a QA loop with ceiling 3 — the PO's question *"what has actually been
built for R3, and is SCR-014 done?"* has no answer in the single source of truth. The answer exists
only in `git log`, which the PO does not read.

Three consequences, each observed rather than hypothetical:

1. **Progress is invisible mid-build.** The BRD says `Implementation`; it does not say how much of
   `Implementation`. The PO asks in chat, a human answers from memory, and the answer is not
   recorded anywhere.
2. **Completion is not attributable.** When the PR finally lands, the PO gets one link to a diff of
   everything. Which commit satisfied R3? Which one built SCR-014? The mapping lives in a
   reviewer's head for as long as they remember it.
3. **The link is one-directional in practice.** `integration-map` §3 promises "either side reachable
   from the other in one hop" — commits carry the BRD-ID, so Git → Notion works. Notion → Git works
   only at PR granularity, and only after state 09.

The fix is not more prose. It is a machine-written, append-only ledger of GitHub links at three
granularities the PO already thinks in — **feature**, **scope**, **screen** — plus a Notion view
that renders it without opening a page.

## 2. Decisions

Four decisions were taken before this design was written; they are recorded here as the premises,
not re-litigated below.

| # | Decision | Rejected alternative |
|---|---|---|
| D1 | Links at **all three** granularities: feature (BRD), scope (`R<n>`), screen (`SCR-<nnn>`) | feature-only (cheapest, but leaves "which requirement is done" unanswered) |
| D2 | One new **append-only section `S17`** + three new properties | scattering links into S03/S08/S11/S13 (four foreign owners, permission-matrix §3 surgery); or S12 prose only (no table, no rollup) |
| D3 | Written at **every push**, plus rollups at `PR` / `Merged` / `Released` | stage-exits only, or merge-only — both blind the PO for the duration of the build |
| D4 | Bound by **commit trailers** + a generator script; Claude writes Notion via MCP | a GitHub Action holding a Notion token (breaks the toolkit's no-runtime, no-secrets shape) |
| D5 | **Hard guard** **C_DELIVERY**, coverage-based, satisfiable by trailer **or** backfill row | soft checklist item (decays under pressure — the failure mode every other guard exists to prevent) |

## 3. Data model

### 3.1 New Notion database properties

Three, all optional, all additive — no existing property changes type, meaning, or writer.

| Property | Type | Format | Written by | When |
|---|---|---|---|---|
| `Compare` | URL | `https://github.com/<owner>/<repo>/compare/<base>...<branch>` | Git Manager | branch creation (state 06 entry) |
| `Merge SHA` | URL | `https://github.com/<owner>/<repo>/commit/<sha>` | Git Manager | `Merged` |
| `Release Tag` | URL | `https://github.com/<owner>/<repo>/releases/tag/<tag>` | Technical Writer or Git Manager | `Released` |

**Phase semantics are `PR`'s semantics** ([brd-schema](../../Architecture/brd-schema.md) §1): each
holds the **current phase's** value. A split BRD overwrites `Compare` and `Merge SHA` at the phase
flip; the Phase-1 values remain recoverable from the S17 rollup rows and from `FE PR`. No `FE
Compare` / `BE Compare` properties — the log already preserves them, and a fourth and fifth
phase-shadow property would be duplication, not truth.

**Multi-repo BRDs** (`integration-map` §3): `Compare`, `Merge SHA` and `Release Tag` hold the
**primary** repo's values, exactly as `PR` does. Sibling repos appear in S17 rows via their `Repo:`
field, and the rollup row lists every sibling compare URL.

### 3.2 New section — `S17 · Delivery Log`

| ID | Section | Update mode | Content |
|----|---------|-------------|---------|
| S17 | Delivery Log | append-only | One row per commit (or per backfilled range) binding a GitHub link to the scopes and screens it delivered; rollup rows at `PR`, `Merged`, `Released` |

**Why append-only rather than `revise`.** A row states what was true when it was written. A commit's
`State` changes (`pushed` → `pr-open` → `merged` → `released`), and the honest way to record a state
change in an append-only log is a new row, not an edit — the same reasoning that makes S16
append-only. The mutable, at-a-glance picture lives in the three properties, which is where the PO
reads "is it done"; S17 is where anyone reads "how did it get done". Rows are never edited, never
deleted, and a sha may legitimately appear several times.

**Commit row grammar:**

```
- **[YYYY-MM-DD] `<sha7>`** — <commit subject>.
  Scope: <token>[, <token>…] · Screens: <SCR-id>[, <SCR-id>…] | none · Phase: FE | BE | single · Repo: <repo-name> · State: pushed
  Link: https://github.com/<owner>/<repo>/commit/<sha>
```

**Backfill row** — identical, plus a fourth line, and `<sha7>` may be a range `<sha7>..<sha7>`:

```
  Backfill: <reason>
```

**Rollup row:**

```
- **[YYYY-MM-DD] [<Stage>] [Git Manager]** — <n> commits · Scope covered: R1–R4 · Screens: SCR-014, SCR-015.
  State: pr-open | merged | released · Repo: <repo-name>
  Link: <PR | merge-commit | tag URL> · Compare: <compare URL>
```

**Field rules:**

- `Scope:` — one or more tokens, comma-separated. Closed vocabulary: `R<n>` (must exist as a
  requirement in S03) · `SCR-<nnn>` (must exist in the project's `screens/registry.md`) · `chore`
  (reserved: branch hygiene, merges, revert, tooling — commits that deliver no requirement).
- `Screens:` — SCR-IDs, or the literal `none`. Mandatory field, optional content.
- `Repo:` — mandatory, always; single-repo BRDs name their one repo rather than omitting the field,
  so the grammar has no conditional form.
- `State:` — closed vocabulary `pushed` · `pr-open` · `merged` · `released`. For any sha, the
  newest row wins.
- Dates: a **commit row carries its commit's date**, a **rollup row carries the write date**, both
  `YYYY-MM-DD`. Commit rows must regenerate identically weeks later — a write-date commit row would
  change every time the tool ran, and a log whose rows change is not a log.

**Scaffold.** S17 is created empty at BRD creation like every other section, and it is **never named
in a `C_SECTIONS(ids)` requirement** ([workflow-state-machine](../../Architecture/workflow-state-machine.md)
§4) — that guard demands non-empty sections, and an empty Delivery Log is the correct state for a BRD
whose branch has not been pushed to yet. Coverage of S17 is **C_DELIVERY**'s job, at the one point
where rows must exist.

## 4. Commit convention extension

[integration-map](../../Architecture/integration-map.md) §3 keeps its subject format and gains
trailers:

```
feat(BRD-RP-042): add profile lookup state

Scope: R3, R4
Screen: SCR-014
```

- `Scope:` — **mandatory** on every commit on a BRD branch. Same vocabulary as the S17 field.
- `Screen:` — **mandatory when** the diff touches a file bound to a SCR-ID, omitted otherwise (the
  S17 row then reads `Screens: none`). "Bound" is mechanical: the tool indexes every backticked path
  token appearing in a `screens/SCR-<nnn>.md` contract file (the Frontend and Prototype blocks name
  them), and a commit touching an indexed path must name that SCR in `Screen:` or `Scope:`. The
  index's limitation is stated rather than hidden: a file no contract file names is not indexed, so
  the check produces no false positives and may produce false negatives. Screen bindings living in
  the contract is the pre-existing rule ([screen-contract](../../Architecture/screen-contract.md)
  §3), not a new demand made by this tool.
- Trailers are git trailers proper (last paragraph, `Key: value`), so `git log
  --format=%(trailers:key=Scope,valueonly)` reads them and `git interpret-trailers` writes them.

**Trailers are not retroactive.** A pushed commit cannot gain a trailer without a history rewrite,
and [git.md](../../Workflows/git.md) forbids rewriting after review starts. That is precisely why
**C_DELIVERY** (§6) is defined over **S17 coverage**, not over trailer presence: the backfill row is
the sanctioned repair, and it is cheaper and more honest than a force-push.

## 5. Tool — `tools/delivery-log.py`

Plain Python 3, no third-party dependencies, no network, no secrets — the shape
`tools/toolkit-check.py` already established.

```
tools/delivery-log.py --repo <path> --brd <BRD-ID> --branch <name>
                      [--base main] [--phase FE|BE|single]
                      [--requirements R1,R2,R3] [--screens <path to screens/registry.md>]
                      [--state pushed|pr-open|merged|released]
                      [--rollup <PR url | merge sha | tag url>]
                      [--covered <sha7>[,<sha7>…]]
                      [--json]
```

**What it does:** reads `git log <base>..<branch>`, parses the `Scope:` / `Screen:` trailers, derives
`<owner>/<repo>` from `git remote get-url origin`, validates every token (`R<n>` against
`--requirements`, `SCR-<nnn>` against the registry file, `chore` always valid), and prints the S17
rows plus the `Compare` URL.

**Outputs:** markdown rows on stdout, ready to paste into Notion via MCP; `--json` emits
`{compare, rows[], unbound[], scopes[], screens[], repo}` for the orchestrator.

**Exit codes:** `0` every sha bound and every token resolves · `1` unbound shas or unresolvable
tokens, each named on stderr · `2` unevaluable (not a git repo, no origin remote, missing registry,
bad arguments). Exit 2 is never a pass — same contract as `toolkit-check.py`.

**`--covered`** takes shas already carried by S17 backfill rows, so a re-run after a backfill exits
0 without inventing rows for them. The caller supplies it from the section it just read.

**Multi-repo BRDs** are handled by running the tool **once per bound repo** — each run derives its
own `<owner>/<repo>` and emits rows carrying that `Repo:` value; the session appends the runs'
output as one Notion write. There is no cross-repo mode: a repo the tool was not pointed at is a
repo whose shas are unbound, and **C_DELIVERY** says so at the stage exit.

**Why `--requirements` is passed in rather than read.** S03 lives in Notion, and the tool holds no
credentials by design (D4). The session harvests the requirement IDs it is already reading at that
stage and passes them; the screens registry is a repo file and is read directly. The asymmetry is
deliberate and is documented in the tool's `--help`.

**Tests** — `tools/test_delivery_log.py`, stdlib `unittest`, building temp git repos per case:
trailered commit → row; missing `Scope:` → exit 1 naming the sha; `R9` not in `--requirements` →
exit 1; `SCR-999` not in registry → exit 1; `chore` → row with no scope claim; a commit touching a path indexed to `SCR-014` without
naming it → exit 1; `--covered` sha → not reported unbound; multi-repo remote forms
(`git@` and `https://`) → same URL; rollup mode → rollup row.

## 6. Guard **C_DELIVERY**

**Notation note.** This document writes the new guard as **C_DELIVERY**, unbackticked, while the
already-live guards it sits beside keep their backticks. `tools/toolkit-check.py` rule G harvests
every backticked `C_*` token in the repo and fails any that `workflow-state-machine.md` §4 does not
define — correctly, since the guard does not exist yet. Backticking it here would have meant adding
a checker exemption for a design doc, which is defeating the check rather than passing it. The
backticks go on at implementation time, in the same commit that defines the guard.

**Definition** (for [workflow-state-machine](../../Architecture/workflow-state-machine.md) §4):

> Every commit sha in `<base>..<current-phase branch>`, in every repo bound to the BRD, appears in
> S17 with at least one resolving `Scope:` token (`R<n>` present in S03 · `SCR-<nnn>` present in the
> screens registry · `chore`), and the BRD `Compare` property is set for the current phase.
> Coverage is satisfied by a commit trailer **or** by an S17 backfill row naming the sha (or range),
> its scope and its reason — pushed history is never rewritten to satisfy this guard. Checked at
> **`Implementation` exit** (and at [backend-integration](../../Workflows/backend-integration.md)
> exit, the same stage class) and re-checked at **`Tech Review` → `PR`**, because QA-loop and
> re-certification commits land after the first check. Fail → stop, report the unbound shas, route
> to `Implementation`.

**Transition rows** (§3) that must cite it — checker rule H enforces the citation:

| From | Condition | To |
|---|---|---|
| `Implementation` | complete claim + S12 current + `C_SECURITY` pass ∧ **C_DELIVERY** pass | `QA` |
| `Implementation` | **C_DELIVERY** fail | `Implementation` (unbound shas named; backfill or re-commit) |
| `Tech Review` | verdict `approve` ∧ `C_ISOLATION` pass ∧ **C_DELIVERY** pass | `PR` |
| `Tech Review` | **C_DELIVERY** fail | `Implementation` (same phase), unbound shas named in S16 |

A **C_DELIVERY** bounce is a bookkeeping failure, not a build failure: it does **not** count against
`L_QA`. The loop ceilings exist to catch code that will not converge; a missing trailer is a
thirty-second backfill, and charging it against a ceiling would create pressure to weaken the guard.

**Checklist.** New `Checklists/delivery-log.md`, in the validator-checklist shape of
`Checklists/integration-parity.md`: gate line, the coverage checks, the backfill rule, the "any
unchecked box stops the exit" clause. Required by checker rule H (every §4 guard must be named by a
file under `Checklists/`) and by rule M (linked from `Documentation/module-index.md`).

## 7. Rights and protocol

**Permission matrix** gains an S17 column: **A for every role**, exactly as S16 — an append-only
section has no owner who may revise it. The legend's blanket line becomes "All roles have **A** on
S16 (Decision Log) and S17 (Delivery Log)". By convention the Git Manager writes the rollup rows and
the engineer roles write the per-push rows, but the matrix grants no one an edit right, so no role
can rewrite another's row.

**[AI/brd-update-protocol.md](../../AI/brd-update-protocol.md)** gains the S17 write rules: one
append per push carrying every row for that push (never one Notion write per commit — that is a rate
limit waiting to happen), rows in commit order, grammar per §3.2, and a hard "never edit, never
delete" clause matching S16's.

## 8. The Product Owner surface

Rows are for machines and for archaeology. The PO reads a **Notion database view** — created once
per project at onboarding, via `notion-create-view`:

- **Name:** `Delivery (PO)`
- **Columns:** `Name` · `Status` · `Phase` · `Compare` · `PR` · `Merge SHA` · `Release Tag`
- **Filter:** `Project` = this project
- **Group by:** `Status` · **Sort:** last edited, descending

Which answers both halves of the request without opening a page: *what changed* reads from `Compare`
and `PR` while the BRD is in flight, *what completed* reads from `Merge SHA` and `Release Tag` once
it lands. Opening the page gets the per-scope and per-screen detail in S17.

The view is created in [project-onboarding](../../Workflows/project-onboarding.md) alongside the
existing Notion setup, so every project inherits it rather than each one inventing a dashboard.

## 9. Files touched

| File | Change |
|---|---|
| `Architecture/brd-schema.md` | §1 three new property rows; §2 S17 row; new §3-style S17 row grammar subsection; §5 migration clause |
| `Architecture/workflow-state-machine.md` | §3 four transition rows cite **C_DELIVERY**; §4 defines it |
| `Architecture/permission-matrix.md` | S17 column (A for all roles); legend line extended |
| `Architecture/integration-map.md` | §3 commit row gains trailers + a trailer vocabulary line; §1/§2 note S17 as the Git→Notion link surface |
| `Workflows/git.md` | writes `Compare` at branch creation, `Merge SHA` at merge, rollup rows at `PR`/`Merged`; **C_DELIVERY** in completion criteria |
| `Workflows/implementation.md` | responsibility: run the tool and append S17 rows at every push; completion criterion **C_DELIVERY** |
| `Workflows/backend-integration.md` | same two additions, Phase-2 wording |
| `Workflows/release.md` | `Release Tag` property + released rollup row |
| `Workflows/project-onboarding.md` | create the `Delivery (PO)` view during Notion setup |
| `AI/brd-update-protocol.md` | S17 append-only write rules |
| `Checklists/delivery-log.md` | **new** — the **C_DELIVERY** validator checklist |
| `Templates/pull-request.md` | PR body gains a scope-coverage line (R-IDs + SCR-IDs) |
| `tools/delivery-log.py` | **new** — the generator/validator |
| `tools/test_delivery_log.py` | **new** — its tests |
| `Documentation/module-index.md` | link the new checklist (checker rule M) |
| `Documentation/CHANGELOG.md` | `Unreleased` → 2.1.0 entry |
| `README.md` | version line; one line on the PO delivery view |

## 10. Migration

Additive, one clause, in the shape of the v2.0 clause it sits beside:

> **v2.1 migration.** A BRD **already past `Implementation`** at cutover carries no S17 and
> **C_DELIVERY** does not apply to it. A BRD **at or before `Implementation`** gets S17 scaffolded at
> its next stage entry; **C_DELIVERY** applies to every commit made from that point, and any
> pre-cutover sha already on its branch is covered by a single backfill row naming the sha range
> with the reason `pre-v2.1 history`.

Projects pinned to v2.0.0 and earlier are unaffected until they bump the submodule pin
([versioning](../../Architecture/versioning.md) §3).

## 11. Verification

1. `python3 tools/toolkit-check.py` exits 0 — and does so *unaided*: rule H must find **C_DELIVERY**
   cited in §3 and named under `Checklists/` without a new exemption entry. Adding it to
   `GUARD_TRANSITION_EXEMPT` or `GUARD_CHECKLIST_EXEMPT` would be defeating the check, not passing
   it.
2. `python3 tools/test_delivery_log.py` — every case in §5 green.
3. Fixture dry run: a temp repo with one trailerless commit exits 1 and names that sha; re-running
   with `--covered <sha7>` exits 0.
4. Round trip on a real branch of this repo: generate rows for `feat/delivery-log` itself and
   confirm the URLs resolve (the toolkit repo has no BRD, so this proves the URL derivation only).

## 12. Out of scope

Named so the plan does not grow them:

- **A GitHub Action or webhook writing Notion directly** (D4). Revisit only if push-time session
  coverage proves insufficient in practice.
- **AC-level granularity** (`AC1.1`). `R<n>` is the floor; per-AC verification already has a home in
  S13, and duplicating it into S17 would create two answers to "is this AC done".
- **The toolkit repo logging its own commits.** It has no BRD; the enhancement is for project repos.
- **Backfilling closed BRDs.** `Merged` and `Released` BRDs stay as they are.
- **Reworking S12.** Progress prose keeps its job; S17 does not replace it.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Trailer discipline decays under time pressure | **C_DELIVERY** blocks the stage exit; the tool exits 1 with names, so the failure is cheap to see and cheap to fix |
| Long branches make S17 long | Rows are two lines; rollups summarize; squash-merge keeps main's history clean regardless. Accepted |
| One Notion write per commit hits rate limits | Protocol mandates one append per **push**, carrying all of that push's rows |
| A `chore` escape hatch swallowing real work | `chore` is legal only where no requirement is delivered; the code-review checklist reads S17 against the diff, and a mislabelled commit is a review finding |
| Multi-repo BRDs losing sibling links | `Repo:` is mandatory on every row; the rollup row lists every sibling compare URL |
