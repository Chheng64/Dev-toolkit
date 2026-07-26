# BRD Schema

> **Module:** Architecture / Foundation
> **Status:** Stable — breaking changes require major version bump (see [versioning.md](versioning.md))
> **Consumed by:** all Workflows, all Skills, permission-matrix, brd-update-protocol, Templates

Canonical structure of a Living BRD — one Notion page per feature/project area. Every module in this toolkit references sections by their stable ID (`S01`–`S16`). Never reference sections by heading text alone; headings may be localized or renamed, IDs may not.

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
| `Branch` | Text | `feat/<brd-id>-<slug>` | Git link |
| `PR` | URL | GitHub PR link | Git link |
| `Approvals` | Multi-select | `direction`, `design`, `final` | Human gates granted |
| `Loop Count` | Number | int | Revision-loop ceiling tracking |
| `Blocked Reason` | Text | — | Set when Status = Blocked |
| `Toolkit Version` | Text | semver | Toolkit version the BRD ran under |

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
| S11 | Component Plan & API Notes | revise | Files/components to create or modify; API contracts |
| S12 | Implementation Notes & Progress | append | Dated progress entries; deviations from plan with reason |
| S13 | Test Cases, Bugs & Verification | revise | Test cases mapped to ACs; bug list with severity; verification status per AC |
| S14 | Review Summary & Approval | revise | Review findings, concerns, recommendations, approval status |
| S15 | Release Notes | revise | User-facing change summary; version; date |
| S16 | Decision Log | append-only | See format below. Never edited or deleted, only appended |

**Update modes:**
- `revise` — owning role may rewrite its own prior content in this section; foreign content untouched.
- `append` — new entries added at end; existing entries never modified.
- `append-only` — hard rule, applies to every role including humans-via-Claude.

## 3. Decision Log Entry Format (S16)

Every stage exit, every cross-domain finding, every human gate outcome writes one entry:

```
- **[YYYY-MM-DD] [Stage] [Role]** — <decision or finding>.
  Why: <rationale>. Affects: <section IDs>. Supersedes: <prior entry ref | none>.
```

Rules:
- A finding that belongs to another role's section is recorded here with `Affects: <that section>`; the owning role applies it on its next activation. Cross-domain content is never written directly into a foreign section (see permission-matrix §3).
- Human approvals/denials at gates are logged here with the artifact state they saw.

## 4. Minimum Viable BRD

A page may start with only S01 empty-scaffolded + a one-line problem note. The Business Analysis workflow populates S01–S06. Empty sections stay present as scaffolds — stages check for section presence, not richness.

## 5. Invariants

1. One BRD = one feature/area. Split before Analysis if scope class is `large` across unrelated areas.
2. The BRD evolves; it is never replaced, duplicated, or forked into side documents. All feature knowledge lives here (Notion = single source of truth).
3. Global knowledge (standards, workflows, conventions) never gets copied into a BRD — link to the toolkit module instead.
4. Section IDs are stable forever. New sections get new IDs (`S17+`); removed sections are deprecated, never reused.
