# Workflow — Product Planning

> **Module:** Workflows
> **Stage:** `Planning` (lifecycle state 02)
> **Skill:** Product Manager
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2; executes [design-state-machine.md](../Architecture/design-state-machine.md) state 03 `PRODUCT_REVIEW`

## Purpose

Decide whether requirements + evidence justify spending design and build effort — and on what, in which order. Ends at the **Direction Gate**: the user approves direction before any design work starts.

## Inputs

- S01–S06 valid (Business Analysis exit criteria met)
- Open S16 `Affects:` entries targeting S02/S03
- User's stated priorities, if any (P0–P3 property)

## Outputs

- S03 updated — prioritized requirement set (value/effort/risk per requirement); deferred items marked `deferred (see S16)`, never deleted
- S06 updated — risks scored; every high-risk item has mitigation or explicit accept-risk note
- S16 — direction recommendation ∈ {`proceed`, `re-scope`, `stop`} with rationale; gate outcome record

## BRD Sections It May Update

S02 (edit), S01/S03/S04/S05/S06 (append), S16 (append). Product Manager row in the matrix — refines and prioritizes; does not rewrite the BA's requirement content, appends prioritization/annotations.

## Responsibilities

1. Reconcile every requirement against S05 evidence — supported, contradicted, or unexamined.
2. Score value / effort / risk per requirement. Effort ties to scope class; value ties to S02 metrics; risk ties to S06.
3. **No new scope.** Prioritized set ⊆ validated requirements. New need discovered → S16 `Affects: S03`, route back to Analysis.
4. Produce recommendation with written rationale:
   - `proceed` — direction sound; present cut-line (what's in, what's deferred)
   - `re-scope` — evidence contradicts scope; name what changes; → back to Analysis
   - `stop` — feature isn't worth building; say why plainly
5. Raise **Direction Gate** (orchestrator §4 format): S01–S06 summary + recommendation + cut-line. Capture outcome in S16 + `Approvals: direction`.

## Completion Criteria

- [ ] Every requirement scored (value/effort/risk) and reconciled against evidence
- [ ] Prioritized set introduces zero new scope
- [ ] Every high-risk item mitigated or explicitly accepted
- [ ] Recommendation written with rationale in S16
- [ ] Direction Gate resolved: `Approvals` contains `direction` (proceed) OR routed to Analysis (re-scope/deny) OR `Stopped` (stop confirmed)
- [ ] S16 stage-exit entry written

## Failure & Loops

- Validation failure → re-run scoring with the failed rule as constraint, ceiling 2 → `Blocked`.
- Gate denied → route to `Analysis` with the user's denial notes logged in S16 (they are the corrective input).
- `stop` recommended but user disagrees → treat as `proceed` with the disagreement logged; user owns the call.

## Common Mistakes

- Sneaking scope in during prioritization ("while we're at it…") — hard forbidden, route through Analysis.
- Scoring theater — identical middling scores on everything; forced ranking exists to force trade-offs.
- Recommending `proceed` by default because `stop`/`re-scope` feels like failure. The gate exists to kill weak work cheaply.
- Hiding the cut-line — user approves direction without seeing what's deferred, then discovers it at Design Review.
- Skipping the gate on "small" BRDs. Small ≠ ungated; the gate takes one message.

## Best Practices

- Lead the gate package with the recommendation and the cut-line — the two things the user actually decides on.
- Tie every priority call to evidence (`R3 high value per S05 theme 2`) — makes future re-planning auditable.
- Deferred ≠ deleted: deferred items stay visible in S03 with reason; they're the seed of the next BRD.
- Record what would change the decision ("revisit if X metric < Y") — cheap insurance for the retro.
