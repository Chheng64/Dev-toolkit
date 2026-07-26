# Checklist — Development Ready

> **Gate for:** `Dev Planning` → `Implementation` ([frontend-planning](../Workflows/frontend-planning.md) / [backend-planning](../Workflows/backend-planning.md) exit). Implementation entered below this bar burns loop ceilings.

## Upstream state
- [ ] `Approvals` contains `design` (current, not stale)
- [ ] All Extension Notes on S08 resolved (`extended`/`rejected`) — none `open`
- [ ] Open S16 `Affects: S10/S11` entries addressed

## Plan completeness (S10)
- [ ] Approach + alternatives-rejected recorded (detail in S16)
- [ ] Failure table: every planned S09 state → named home + mechanism
- [ ] Server/client boundary decided (client islands named + justified)
- [ ] Touched-areas list present; cross-checked against in-flight BRDs (overlap → serialized or user-approved)
- [ ] Slices vertical, ordered, each with its error states in-slice

## Plan executability (S11)
- [ ] Every S08 component: file path + reuse class + props contract (real TS)
- [ ] Every backend surface: contract per [api-specification](../Templates/api-specification.md) — input/output schemas, error codes → S09 states, auth, idempotency
- [ ] Contracts frozen; frontend plan consumes them by name
- [ ] Schema/migration changes have rollback paths
- [ ] Test plan: every AC → layer + named test file (zero unmapped ACs)

## Ground truth
- [ ] Branch `feat/<brd-id>-<slug>` created from fresh main; `Branch` property set
- [ ] Env/deps available (new dependency decisions recorded per [code-quality](../Standards/code-quality.md) rule 13)
- [ ] S16 stage-exit entry written
