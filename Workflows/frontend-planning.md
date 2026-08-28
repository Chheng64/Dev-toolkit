# Workflow — Frontend Planning

> **Module:** Workflows
> **Stage:** `Dev Planning` (lifecycle state 05) — frontend scope
> **Skill:** Frontend Engineer
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Translate the approved design (S07–S09 + prototype) into an executable frontend plan: components, files, state, data, tests. Implementation should be assembly, not discovery.

## Inputs

- `Approvals` contains `design` (Design Gate passed)
- S07 flows, S08 component inventory + traceability, S09 edge cases, S03 ACs
- Frozen prototype commit; project stack notes + `project-overrides.md`
- Open S16 `Affects:` entries targeting S10/S11

## Outputs

- S10 Technical Plan — approach, component architecture, state management model, data-fetching strategy, routing, error/loading handling strategy mapped to S09 states, **touched-areas list** (files/dirs — used for parallel-BRD conflict check)
- S11 Component Plan — per component: file path, reuse-vs-new, props contract, DS assets consumed, states handled; test plan mapped to ACs
- S16 — planning decisions with alternatives considered

## BRD Sections It May Update

S10 (edit), S11 (edit), S12 (edit), S04 (append — discovered technical constraints), S05 (append), S16 (append).

## Responsibilities

1. Map every S08 inventory component to a code component: existing (reuse), extend, or new — mirror the DS-first rule in code (shadcn/ui + project components before custom).
2. Plan state management at the smallest sufficient altitude: local state < context < store. Name what owns each piece of state from S07's state enumeration.
3. Plan data flow per Standards/nextjs (server components / client boundaries / fetching + caching); every async boundary gets loading/error/empty handling mapped to S09 states.
4. Plan non-happy-path implementation explicitly — S09 states are requirements, not decoration.
5. Write the test plan: which ACs → unit / component / e2e; name the test files.
6. List touched areas; orchestrator cross-checks other in-flight BRDs (serialize on overlap).
6b. Fill the **Frontend mapping block** of every owned `screens/SCR-<nnn>.md` ([frontend-mapping template](../Templates/frontend-mapping.md)) — `C_CONTRACT` already verified design blocks; your blocks complete the contract.
7. Estimate honestly; plan too big for one implementation pass → split into ordered slices in S10.
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

## Completion Criteria

- [ ] Every S08 component mapped to file path + reuse classification
- [ ] Every S09 non-happy-path state has a named handling location
- [ ] State ownership + data flow decided and written
- [ ] Test plan maps every frontend-relevant AC to a named test
- [ ] Touched-areas list present; conflict check against in-flight BRDs done
- [ ] Plan traceable: S03 → S07/S08 → S10/S11 (no orphan work, no dropped states)
- [ ] S16 stage-exit entry written
- [ ] Adapter interface, method list and selection-point file named per domain
- [ ] Fixture set planned: happy · empty · one per error variant · slow, each error fixture bound to its S09 state
- [ ] Zero server-side decisions in S10/S11 (`Phase: FE`)

## Failure & Loops

- Plan exposes design gap (missing state, ambiguous flow) → back-transition to `Design` with the gap named in S16 — never improvise design in the tech plan.
- Discovered constraint invalidates a requirement → S16 `Affects: S03`, orchestrator routes.

## Common Mistakes

- Re-designing during planning ("actually a drawer would be better") — design is approved and frozen; gaps route back, taste changes don't.
- Planning the happy path and hand-waving errors ("standard error handling") — every S09 state gets a location.
- Custom-building what shadcn/ui or the project DS already provides.
- Skipping the touched-areas list — parallel BRD conflicts surface as merge hell three stages later.
- Test plan as afterthought ("will add tests") — unmapped ACs become unverifiable in QA.
- Client-component-by-default in Next.js — boundary decisions belong here, not mid-implementation.

## Best Practices

- Reuse UX state names in code (`SYNC_FAILED` → discriminated union member) — traceability from requirement to reducer.
- Props contracts written in the plan (TypeScript signatures) — cheap to review, expensive to refactor later.
- Prefer boring: fewer abstractions, standard patterns from Standards/react; novelty needs a written reason.
- Slice plans vertically (feature-complete thin slices) not horizontally (all components, then all wiring).
