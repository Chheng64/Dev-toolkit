# BRD Schema

> **Module:** Architecture / Foundation
> **Status:** Stable — breaking changes require major version bump (see [versioning.md](versioning.md))
> **Consumed by:** all Workflows, all Skills, permission-matrix, brd-update-protocol, Templates

Canonical structure of a Living BRD — one Notion page per feature/project area. Every module in this toolkit references sections by their stable ID (`S01`–`S17`). Never reference sections by heading text alone; headings may be localized or renamed, IDs may not.

---

## 1. Notion Database Properties (metadata, not content)

One database for all projects. Every page is a Living BRD.

| Property | Type | Values / Format | Purpose |
|----------|------|-----------------|---------|
| `Name` | Title | `[BRD-ID] Feature name` | Page title |
| `BRD-ID` | Text | `BRD-<project-code>-<number>` e.g. `BRD-RP-042` | Stable ID used in branches, commits, PRs |
| `Project` | Select | one per project | Multi-project filtering |
| `Status` | Select | see Status Values below | Drives the workflow state machine |
| `Stage Owner` | Select | role name (from Skills/) | Which role is currently acting |
| `Priority` | Select | `P0`–`P3` | Pick order for parallel slots |
| `Ready` | Checkbox | — | Human marks BRD eligible for pickup |
| `Branch` | Text | `feat/<brd-id>-<slug>` (`Phase: single`); `feat/<brd-id>-<slug>-fe` / `feat/<brd-id>-<slug>-be` (split BRDs, v2.0) | Git link — names the **current phase's** branch |
| `PR` | URL | GitHub PR link | Git link — holds the **current phase's** PR |
| `FE PR` | URL | GitHub PR link | Split BRDs only (v2.0) — the Phase-1 PR, preserved after `Merged (FE)` overwrites `PR` with the Phase-2 link, so the Product Gate's approval scope (`workflow-state-machine.md` §6) stays evaluable against the PR it was granted on |
| `BE PR` | URL | GitHub PR link | Split BRDs only (v2.0) — the Phase-2 PR |
| `Compare` | URL | `https://github.com/<owner>/<repo>/compare/<base>...<branch>` | Git link — the **current phase's** branch diff, live from branch creation. Written by the Git Manager at Implementation entry (v2.1) |
| `Merge SHA` | URL | `https://github.com/<owner>/<repo>/commit/<sha>` | Git link — the **current phase's** merge commit on main. Written at `Merged` (v2.1) |
| `Release Tag` | URL | `https://github.com/<owner>/<repo>/releases/tag/<tag>` | Git link — the release the BRD shipped in. Written at `Released` (v2.1) |
| `Approvals` | Multi-select | `direction`, `design`, `product`, `final` | Human gates granted |
| `Phase` | Select | `FE` · `BE` · `single` | Which pass of the build segment the BRD is in (v2.0). Machine state — set by the orchestrator at `Planning` exit, flipped at `Merged (FE)`. Hand edits only to correct a mis-scoped BRD, logged S16 |
| `Prototype` | URL | served prototype / Figma ref | Design artifact quick link (optional; added v1.1) |
| `Loop Count` | Number | int | Revision-loop ceiling tracking |
| `Blocked Reason` | Text | — | Set when Status = Blocked |
| `Toolkit Version` | Text | semver | Toolkit version the BRD ran under |

**v2.0 migration note:** `FE PR` / `BE PR` are new properties for split BRDs only. Existing
(pre-v2.0, `Phase: single`) BRDs keep using the single `Branch`/`PR` fields exactly as before —
`FE PR`/`BE PR` stay empty for them.

### Status Values (state machine states)

`Ready` → `Analysis` → `Planning` → `Design` → `Design Review` → `Dev Planning` → `Implementation` → `QA` → `Tech Review` → `PR` → `Human Review` → `Merged` → `Released`

Off-path: `Blocked` (resumable), `Stopped` (deliberate terminal), `Backlog` (not ready).

---

## 2. BRD Body Sections

Sections are H2 headings in the page body, in this order. Each heading carries its ID: `## S07 · User Flows & UX Decisions`. Update mode is enforced by [permission-matrix.md](permission-matrix.md) and [../AI/brd-update-protocol.md](../AI/brd-update-protocol.md).

| ID | Section | Update mode | Content |
|----|---------|-------------|---------|
| S01 | Problem Statement | revise | The problem, who has it, why now |
| S02 | Business Goal | revise | Measurable outcome; success metrics |
| S03 | Requirements & Acceptance Criteria | revise | Numbered requirements `R1..Rn`, each with ≥1 falsifiable acceptance criterion `AC1.1..` |
| S04 | Assumptions & Constraints | revise | Each item tagged `assumed` or `confirmed`; never both |
| S05 | Research Notes | append | Findings with sources; competitor notes; pattern references |
| S06 | Risks | revise | Risk register: risk, severity, mitigation or explicit accept-risk note |
| S07 | User Flows & UX Decisions | revise | Task list, IA, flows, per-task state enumeration (happy + non-happy paths) |
| S08 | UI Decisions & Prototype | revise | Component inventory, DS mapping, token references, prototype links, Extension Notes |
| S09 | Edge Cases & Non-Happy Paths | revise | Edge-case matrix: error, empty, loading, interrupted, offline, permission-denied per task |
| S10 | Technical Plan & Architecture | revise | Approach, architecture notes, data flow, dependencies |
| S11 | Component Plan & API Notes | revise | Files/components to create or modify. For server-scope BRDs this section **cites** the Shared Contract by id and version (`CTR-<brd-id>-v<n>`) and never reproduces it — see the [shared-contract](shared-contract.md) module |
| S12 | Implementation Notes & Progress | append | Dated progress entries; deviations from plan with reason |
| S13 | Test Cases, Bugs & Verification | revise | Test cases mapped to ACs; bug list with severity; verification status per AC with **`Verified on: mocks \| integrated`**. An AC passing on mocks and failing integrated is a blocker |
| S14 | Review Summary & Approval | revise | Review findings, concerns, recommendations, approval status. **Subsections (append-only, each owned by its issuing role):** `design-audit` (design state 08), `security-certificate` (`C_SECURITY`, before QA — [template](../Templates/security-certificate.md)), `handoff-gate` (design state 12, when in scope) |
| S15 | Release Notes | revise | User-facing change summary; version; date |
| S16 | Decision Log | append-only | See format below. Never edited or deleted, only appended |
| S17 | Delivery Log | append-only | One row per commit binding a GitHub link to the scopes (`R<n>`) and screens (`SCR-<nnn>`) it delivered; rollup rows at `PR`, `Merged`, `Released`. Format in §3b. Never edited, only appended |

**Update modes:**
- `revise` — owning role may rewrite its own prior content in this section; foreign content untouched.
- `append` — new entries added at end; existing entries never modified.
- `append-only` — hard rule, applies to every role including humans-via-Claude.

### Screen Contract references (v1.2)

Screens are contract entities, not BRD content: S07 flows name screens; UI planning registers them as `SCR-<nnn>` in the project's `screens/registry.md`; S08/S11/S13 cite SCR-IDs. Mapping detail lives in the [Screen Contract](screen-contract.md), never duplicated into sections. Guard `C_CONTRACT` blocks Dev Planning on incomplete mappings.

## 3. Decision Log Entry Format (S16)

Every stage exit, every cross-domain finding, every human gate outcome writes one entry:

```
- **[YYYY-MM-DD] [Stage] [Role]** — <decision or finding>.
  Why: <rationale>. Affects: <section IDs>. Supersedes: <prior entry ref | none>.
```

Rules:
- A finding that belongs to another role's section is recorded here with `Affects: <that section>`; the owning role applies it on its next activation. Cross-domain content is never written directly into a foreign section (see permission-matrix §3).
- Human approvals/denials at gates are logged here with the artifact state they saw.

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

## 4. Minimum Viable BRD

A page may start with only S01 empty-scaffolded + a one-line problem note. The Business Analysis workflow populates S01–S06. Empty sections stay present as scaffolds — stages check for section presence, not richness.

## 5. Invariants

1. One BRD = one feature/area. Split before Analysis if scope class is `large` across unrelated areas.
2. The BRD evolves; it is never replaced, duplicated, or forked into side documents. All feature knowledge lives here (Notion = single source of truth).
3. Global knowledge (standards, workflows, conventions) never gets copied into a BRD — link to the toolkit module instead.
4. Section IDs are stable forever. New sections get new IDs (`S18+`); removed sections are deprecated, never reused.
5. **v2.0 migration.** One clause, not two: a BRD **already past `Planning`** at cutover is
   `Phase: single` and behaves exactly as it did under v1.10.0. A BRD still **at or before**
   `Planning` at cutover is evaluated by `C_SERVER_SCOPE` like any other BRD — it is not
   grandfathered just because it existed before v2.0.0.
6. **v2.1 migration.** One clause: a BRD **already past `Implementation`** at cutover carries no S17,
   and the delivery guard does not apply to it. A BRD **at or before `Implementation`** gets S17
   scaffolded at its next stage entry or its next push, whichever comes first; the guard applies to every commit made from that point, and
   any pre-cutover sha already on its branch is covered by a single backfill row naming the sha
   range with the reason `pre-v2.1 history`. For a BRD already inside `Implementation` at cutover,
   `Compare` is set at the next push, in the same write as the first S17 rows.
