# Checklist — Development Ready

> **Gate for:** `Dev Planning` → `Implementation` ([frontend-planning](../Workflows/frontend-planning.md) / [backend-planning](../Workflows/backend-planning.md) exit). Implementation entered below this bar burns loop ceilings.

## Phase scope
- [ ] `Phase` is set (`FE` · `BE` · `single`) and matches the **confirmed** `C_SERVER_SCOPE` decision logged in S16 (the `Design Review`-exit confirmation against S07, not merely the `Planning`-exit provisional value)
- [ ] `Phase: BE` only — the cited `CTR-<brd-id>-v<n>` exists, `VERSION` names both `issued_against` and `product_freeze`, and the plan answers every line of `contract.md`
- [ ] `Phase: FE` only — adapter interface, selection point and fixture set are planned; zero server-side decisions in S10/S11

## Upstream state
- [ ] `C_CONTRACT` passed: [screen-contract checklist](screen-contract.md) all-green for this BRD's screens (orchestrator ran it at stage entry)
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
- [ ] **S06 threat model complete** for every new/changed surface: asset, attacker/abuse, mitigation, verification method — the basis `C_SECURITY` certifies against before QA
- [ ] Contracts frozen; frontend plan consumes them by name
- [ ] Schema/migration changes have rollback paths
- [ ] Test plan: every AC → layer + named test file (zero unmapped ACs)

## Ground truth
- [ ] Branch created from fresh main; `Branch` property set — `feat/<brd-id>-<slug>` (`Phase: single`); `Phase: FE` → `feat/<brd-id>-<slug>-fe`; `Phase: BE` → `feat/<brd-id>-<slug>-be`, cut from main **after** the FE merge (main now carries the FE code the contract was issued against)
- [ ] Env/deps available (new dependency decisions recorded per [code-quality](../Standards/code-quality.md) rule 13)
- [ ] S16 stage-exit entry written
