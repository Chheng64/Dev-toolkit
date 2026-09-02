# Notion Setup — BRD Database

> One database, all projects, every page a Living BRD. Normative source: [brd-schema](../Architecture/brd-schema.md) — this doc is the create-it recipe.

## 1. Database

Name: **`BRDs`** (or preference). Create once, share with the Notion integration Claude's MCP uses.

### Properties (exact)

| Property | Type | Config |
|----------|------|--------|
| Name | Title | `[BRD-ID] Feature name` |
| BRD-ID | Text | `BRD-<code>-<nnn>` |
| Project | Select | one option per project (add per onboarding) |
| Status | Select | options, in order: `Backlog`, `Ready`, `Analysis`, `Planning`, `Design`, `Design Review`, `Dev Planning`, `Implementation`, `QA`, `Tech Review`, `PR`, `Human Review`, `Merged`, `Released`, `Blocked`, `Stopped` |
| Stage Owner | Select | 16 skill names (Business Analyst … Security Reviewer) |
| Priority | Select | `P0`, `P1`, `P2`, `P3` |
| Ready | Checkbox | — |
| Branch | Text | — |
| PR | URL | — |
| Compare | URL | — |
| Merge SHA | URL | — |
| Release Tag | URL | — |
| Approvals | Multi-select | `direction`, `design`, `final` |
| Phase | Select | `FE`, `BE`, `single` |
| Loop Count | Number | — |
| Blocked Reason | Text | — |
| Toolkit Version | Text | — |

### Recommended views
- **Pickup** — filter `Status=Ready ∧ Ready=✓`, sort Priority ↑ (orchestrator's pickup list)
- **In-flight** — filter Status ∈ Analysis…Human Review, group by Status (the ≤3 board)
- **Gates pending** — filter Status ∈ {Planning, Design Review, Human Review} (your attention queue)
- **Blocked** — filter `Status=Blocked` (with Blocked Reason visible)
- **Per project** — group by Project
- **Delivery (PO)** — columns `Name`, `Status`, `Phase`, `Compare`, `PR`, `Merge SHA`, `Release Tag`; filter by `Project`; group by Status; sort last-edited ↓ (what changed, and what completed, without opening a page)

## 2. Page Body Scaffold

Every new BRD page gets the 17 H2 headings, empty sections preserved as scaffolds:

```
## S01 · Problem Statement
## S02 · Business Goal
## S03 · Requirements & Acceptance Criteria
## S04 · Assumptions & Constraints
## S05 · Research Notes
## S06 · Risks
## S07 · User Flows & UX Decisions
## S08 · UI Decisions & Prototype
## S09 · Edge Cases & Non-Happy Paths
## S10 · Technical Plan & Architecture
## S11 · Component Plan & API Notes
## S12 · Implementation Notes & Progress
## S13 · Test Cases, Bugs & Verification
## S14 · Review Summary & Approval
## S15 · Release Notes
## S16 · Decision Log
## S17 · Delivery Log
```

Make this a **Notion template** on the database (`New` dropdown → template with the scaffold + [feature-request](../Templates/feature-request.md) seed block) so every BRD is born conformant.

## 3. Create via Claude (alternative to manual)

With Notion MCP connected, one session can build it:

```text
Create the BRD database per toolkit Documentation/notion-setup.md:
database "BRDs" with the exact properties/options in §1, a database
template with the §2 scaffold, and the six views. Then create one
sample page [BRD-TEST-001] to verify property options + scaffold render,
and report what you built with links.
```

Verify against §1 before first real use (option spelling matters — the orchestrator matches values exactly).

## 3b. Write the Toolkit Registry (required — closes the setup)

Immediately after the DB exists (created or connected), record its identity in the **Toolkit Registry** — `~/.toolkit/registry.yaml` per [toolkit-registry](../Architecture/toolkit-registry.md): database id, data source, workspace; optionally a projects parent page (durable home for project identity pages — recommended if you register projects before their repos exist). Project registration and Resource Binding read this file; **without it, onboarding stops at step 0 by design** — the toolkit never searches your workspace to find the DB. On a new machine, re-run this section against the existing DB (connect, not create).

## 4. Invariants (re-stated from schema)

- Status values are machine states — never rename casually (rename = toolkit major version).
- `Approvals` options exactly the three gate tokens.
- One DB for everything; per-project splits break the parallel-pick + single-orchestrator model.
- S16 append-only applies to humans too.
