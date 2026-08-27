# Playbook — Design Only

> **Module:** Playbooks. Stages 1–4 as the whole engagement: the deliverable is a validated, user-approved design (prototype + spec), no build. For explorations, client-style design work, or design-ahead-of-build batching.

## Sequence

| # | Status | Do | Exit |
|---|--------|-----|------|
| 1 | `Analysis` | [business-analysis](../Workflows/business-analysis.md) | [analysis checklist](../Checklists/analysis.md) + Clarification Gate |
| 2 | `Planning` | [product-planning](../Workflows/product-planning.md) | **Direction Gate** |
| 3 | `Design` | ux → ui workflows (states 04–08 full rigor) | ux-review, ui-review, [design-qa](../Checklists/design-qa.md) `pass` |
| 4 | `Design Review` | [design-review](../Workflows/design-review.md) — Run Local, hook table shipped, limitations transparent, freeze hashes recorded | **Design Gate** |
| 4b | `Design Review` | [flow-visualization](../Workflows/flow-visualization.md) — **set `design.handoff_required: true` for this playbook**: the whole point is a deliverable someone else builds from later | [flow-visualization](../Checklists/flow-visualization.md) → **Developer Handoff Gate** = the terminal gate here |
| — | `Released` (design-terminal) | Package per below; freeze; sweep | see Close-out |

Design machine state 11 (`FINAL_OUTPUT`) runs as the close-out — [design-review](../Workflows/design-review.md) Part C: approval current **and naming its bytes**, prototype frozen by hash, completeness checked against the traceability matrix, known limitations shipped inside the deliverable at full strength.

## Close-out (replaces build stages)

1. Assemble [design-handoff](../Templates/design-handoff.md) — even with no immediate builder: it's the future build BRD's entry ticket. Include the navigation map + `navmap-report.md`; a build team that was not in the room reads the map first.
2. Freeze prototype commit; record hash in S08.
3. S15 = design-deliverable notes: what was validated, what the Design Gate approved, open Extension Notes' fates.
4. Deferred-items sweep (unbuilt = everything): S16 terminal entry lists the build-BRD seed(s) explicitly with scope pointers.
5. `Status: Released` with `no-deploy · design-terminal` noted.

## Resuming into build later

- New BRD (or reopen, logged S16) referencing the design BRD; entry stage = `Dev Planning`.
- **Staleness check first** (mandatory): DS evolved? Requirements drifted? Prototype still runs against current DS? Deltas → route through the design machine's REVISION triage before planning — stale approved designs are the classic trap; the Design Gate approval was scoped to the bytes the user saw *then*, recorded by sha256.
- **Re-derive the navigation map** before planning: a boundary is a dated claim, and the edge-set diff is the only honest answer to "is this still current?".

## Rules

- Full design rigor applies — this playbook removes build stages, not design gates. Self-audit (design-qa) is not softened by "it's only a concept".
- S09 edge-state coverage stays mandatory: an approved happy-path-only design poisons the future build BRD with false confidence.
- Prototype quality bar unchanged (served, walkable, DS-conformant) — throwaway sketch fidelity is scratch work outside the machine, not this playbook.
