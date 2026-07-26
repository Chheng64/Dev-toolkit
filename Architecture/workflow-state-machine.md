# Workflow State Machine

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Consumed by:** AI/orchestrator, all Workflows, Playbooks
> **Executed by:** the Orchestrator ([../AI/orchestrator.md](../AI/orchestrator.md)) — this file defines the machine; the orchestrator runs it.

The 13-stage lifecycle every BRD moves through. Machine state lives in Notion properties (`Status`, `Stage Owner`, `Approvals`, `Loop Count`, `Blocked Reason`) — nothing is held in session memory, so any session can resume any BRD.

---

## 1. Design Principles

| Principle | Consequence |
|-----------|-------------|
| Deterministic | Same BRD state + same inputs → same transition. |
| Resumable | State persisted in Notion properties after every transition. Session death loses nothing. |
| Gated | No path to `Merged` without every validation and every human gate. |
| Bounded | Every loop has a ceiling and an escalation path. |
| Auditable | Every transition = one S16 Decision Log entry. |

## 1b. Project Pre-Pipeline (per project, before any BRD)

BRD stages run per-BRD; these run **once per project** (re-run on evolution) and gate the whole pipeline:

```
PROJECT_ONBOARDING → INTEGRATION_VALIDATION → MANIFEST_GENERATED
```

- Executed by [../Workflows/project-onboarding.md](../Workflows/project-onboarding.md) + [../Workflows/integration-validation.md](../Workflows/integration-validation.md); state lives in `project-manifest.yaml` (`onboarding.status`), not in Notion Status values.
- Guard **`C_MANIFEST`** (see §4) blocks BRD pickup for any project without a complete, validated manifest. No BRD, workflow, or skill executes before it.

## 2. State Catalog

Each state maps to one Workflow module (Phase 1 build). Format per state: primary workflow, entry requires, exit produces, gate.

| # | State (`Status` value) | Workflow module | Entry requires | Exit produces (BRD sections) | Gate |
|---|------------------------|-----------------|----------------|------------------------------|------|
| 00 | `Ready` | — (intake) | Human sets `Ready` ✓; S01 has ≥1 problem line | — | — |
| 01 | `Analysis` | business-analysis | S01 seed | S01–S06 populated; ACs falsifiable | Clarification Gate (only on blocking ambiguity) |
| 02 | `Planning` | product-planning | S01–S06 valid | S03 prioritized; S06 risks scored; direction recommendation in S16 | **Direction Gate** (human) |
| 03 | `Design` | ux-workflow → ui-workflow (runs [design-state-machine.md](design-state-machine.md) states 04–08) | Direction approved | S07, S08, S09 populated; prototype link; self-audit pass | — (machine self-gates via SELF_AUDIT) |
| 04 | `Design Review` | — (human review, orchestrator-managed) | Self-audit verdict `pass` | Approval `design` granted, or structured change requests in S16 | **Design Gate** (human) |
| 05 | `Dev Planning` | frontend-planning / backend-planning | Design approved | S10, S11 populated; plan traceable to S03 + S07/S08 | — |
| 06 | `Implementation` | implementation | S10–S11 valid; branch created | Code on branch; S12 progress entries; deviations logged | — |
| 07 | `QA` | qa | Implementation complete claim | S13: every AC verified `pass`/`fail`; bugs filed with severity | — |
| 08 | `Tech Review` | code-review | S13 zero open blockers | S14 review summary; concerns; verdict | — |
| 09 | `PR` | git | Tech review verdict `approve` | PR opened from template; BRD `PR` property set | — |
| 10 | `Human Review` | — (human, orchestrator-managed) | PR open, CI green | Approval `final`, or change requests in S16 | **Final Gate** (human) |
| 11 | `Merged` | git + release | Final approval | Branch merged; S15 release notes; BRD frozen sections | — |
| 12 | `Released` | release | Merged; deploy done (if applicable) | S15 final; terminal S16 entry | — |

**Off-path states:** `Blocked` (resumable; `Blocked Reason` set), `Stopped` (deliberate terminal, rationale in S16), `Backlog` (pre-Ready).

## 3. Transition Table

| From | Trigger | To |
|------|---------|-----|
| Ready | orchestrator picks BRD (slot free) | Analysis |
| Analysis | validation pass, no blocking ambiguity | Planning |
| Analysis | blocking ambiguity, human unavailable | Blocked |
| Planning | recommendation `proceed` + Direction Gate approved | Design |
| Planning | recommendation `re-scope` or gate denied | Analysis |
| Planning | recommendation `stop` + human confirms | Stopped |
| Design | design machine reaches SELF_AUDIT `pass` | Design Review |
| Design | design machine HALT | Blocked |
| Design Review | approval `design` ∧ `C_CONTRACT` pass | Dev Planning |
| Design Review | approval `design` ∧ `C_CONTRACT` fail | owning stage per validator report (Design / Dev Planning owners), S16 logged |
| Design Review | change requests | Design (design machine REVISION routing) |
| Design Review | reject (direction wrong) | Analysis |
| Dev Planning | plan validated | Implementation |
| Dev Planning | plan exposes design gap | Design |
| Implementation | complete claim + S12 current | QA |
| QA | all ACs verified, zero open blockers | Tech Review |
| QA | blocker bugs | Implementation (loop `L_QA`) |
| Tech Review | verdict `approve` | PR |
| Tech Review | verdict `request-changes` | Implementation (loop `L_REVIEW`) |
| PR | PR open + CI green | Human Review |
| Human Review | approval `final` | Merged |
| Human Review | change requests | Implementation (loop `L_HUMAN`) |
| Human Review | reject | Analysis |
| Merged | release steps done | Released |
| any | unrecoverable error / ceiling breach | Blocked |

## 4. Guards

| Guard | Definition |
|-------|-----------|
| `C_VALID(stage)` | Exit checklist of the stage's workflow passes (Checklists/ module). |
| `C_APPROVED(gate)` | Notion `Approvals` contains the gate token, granted against current content (see §6). |
| `C_LOOP_OK(loop)` | `Loop Count` < ceiling for that loop. |
| `C_SLOT_FREE` | In-flight BRDs (Status between Analysis and Human Review) < 3. |
| `C_SECTIONS(ids)` | Required BRD sections exist and are non-empty. |
| `C_MANIFEST` | Project's `project-manifest.yaml` exists, schema-valid, `onboarding.status: complete`, required integrations `validated`, `last_validated` ≤ 30 days (else re-validate first). Checked at every BRD pickup. |
| `C_CONTRACT` | Screen-contract validation passes for the BRD's owned screens ([../Checklists/screen-contract.md](../Checklists/screen-contract.md) — all six checks). Checked at Dev Planning entry. Fail → stop + missing-mappings report + route to owning stage. |

A forward transition fires only when its guard conjunction holds; otherwise the stage's failure path runs (retry → escalate → Blocked).

## 5. Loops & Ceilings

| Loop | Path | Ceiling | On breach |
|------|------|---------|-----------|
| `L_CLARIFY` | Analysis self-loop on clarifications | 3 | Blocked |
| `L_DESIGN` | Design Review → Design → Design Review | 3 | Blocked + escalation summary |
| `L_QA` | QA → Implementation → QA | 3 | Blocked + open-bug summary |
| `L_REVIEW` | Tech Review → Implementation → Tech Review | 2 | Blocked |
| `L_HUMAN` | Human Review → Implementation → Human Review | 3 | Blocked + escalation summary |

`Loop Count` property stores the dominant active loop count; the orchestrator logs which loop in S16. Ceiling breach never silently continues.

## 6. Approval Gates

| Gate | Blocks | Grantor | Scope rule |
|------|--------|---------|------------|
| Clarification | leaving Analysis with blocking ambiguity | user | answers logged S16 |
| **Direction** | entering Design | user | scoped to S01–S06 content seen |
| **Design** | entering Dev Planning | user | scoped to prototype + S07–S09 seen |
| **Final** | merging | user | scoped to PR diff + BRD state seen |

**Stale-approval rule:** if gated content changes after approval, the orchestrator removes the approval token from `Approvals` and logs S16. No shipping on stale approval.

## 7. Parallelism

Up to **3 BRDs in-flight** (`C_SLOT_FREE`). Rules:
- One BRD = one branch = one PR. No shared branches.
- Human gates queue; the orchestrator presents pending gates batched, oldest first.
- Same-file conflicts across in-flight BRDs → flag at Dev Planning (S10 must list touched areas); prefer serializing conflicting BRDs.

## 8. Anti-Patterns (machine forbids)

- Reaching `Merged` without Final Gate.
- Skipping QA because "change is small" — use the hotfix playbook instead (explicit reduced path, still gated).
- Scope introduced after Analysis without routing back through Analysis.
- Infinite loops — every loop bounded (§5).
- State held only in session memory — Notion properties are the only machine state.
