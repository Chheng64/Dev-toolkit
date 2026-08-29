# Workflow — Back-end Integration

> **Module:** Workflows (v2.0)
> **Stage:** `Implementation` with `Phase: BE`, exit step — runs before Phase-2 QA
> **Skill:** Backend / Full Stack Engineer
> **Not to be confused with** [integration-validation](integration-validation.md), which validates a
> project's external integrations at onboarding.

## Purpose

Replace the mock implementation with the real one, at the one place the contract permits, and prove
the product still behaves the way it was approved.

## Inputs

- The real adapter implementing `contract.ts` unmodified
- `contract.md` — in particular the **adapter selection point** and the error-variant table
- `fixtures/` — the recorded shapes the approved product was reviewed against
- The product freeze sha in S16; S13 rows marked `Verified on: mocks`

## Outputs

- Code on the branch: the selection-point swap (one file per domain), error-variant mappings at
  `file:line`, the exposure control removed, the mock adapter demoted then deleted
- S12 — dated progress entries; every deviation from plan with reason
- S16 — fixture-mismatch findings routed via `L_CONTRACT`; stage-exit entry

## BRD Sections It May Update

S12 (edit/append), S05 (append — a fixture-mismatch finding, before it is routed via
`L_CONTRACT`), S16 (append). Per [permission-matrix](../Architecture/permission-matrix.md); no
edits to another role's content, and never the contract artifact.

## Responsibilities

1. **Swap at the selection point only.** One file per domain, named in `contract.md`, declared in
   the Phase-2 S10 touched-areas list. Any wider front-end change fails `C_ISOLATION`.
2. **Map every real error to its contracted variant** before wiring the happy path. The S09 state
   each variant renders is already built and already approved; an unmapped error renders nothing.
3. **Compare real responses to `fixtures/`.** A mismatch is a contract conflict — route it through
   `L_CONTRACT`, never reshape the front-end to absorb it.
4. **Remove the exposure control** (`phases.fe_exposure`) in this PR. Its removal is what makes the
   feature reachable, and `C_PARITY` checks the removal is in the diff.
5. **Demote then delete the mock.** Test-only first so Phase-2 QA can still run the fixture cases,
   deleted before `C_PARITY`. A dual path behind an environment variable is a mock in production.
6. **Log every deviation** in S12 with reason, as any implementation stage does.

## Completion Criteria

- [ ] Real adapter implements `contract.ts` unmodified (typecheck clean)
- [ ] Every contracted error variant mapped to a real error, at a locatable `file:line`
- [ ] Real responses compared against every fixture; mismatches routed, not absorbed
- [ ] Selection-point diff is one file per domain; no other front-end path touched
- [ ] Exposure control removed in this PR
- [ ] Mock adapter deleted or test-only; zero live mock paths
- [ ] S12 entries current; S16 stage-exit entry written

## Failure & Loops

- Real behaviour cannot satisfy a contracted method → finding + Product Owner ruling → `L_CONTRACT`
  (ceiling 2), `product` token dropped, front-end reissues `v<n+1>`.
- `C_PARITY` fail → back to Implementation (`Phase: BE`), counted against `L_QA`.

## Common Mistakes

- Widening the swap: "while I was in there" edits to front-end components. That is the isolation
  breach the guard exists for.
- Wiring the happy path first and leaving error mapping for later — the approved product is mostly
  its non-happy paths.
- Keeping the mock as a runtime fallback "for safety".
- Removing the exposure control in a separate PR, so `main` briefly ships an unreachable feature or
  a reachable unfinished one.

## Best Practices

- Record the exact `file:line` for each error mapping as you make it, not retroactively — Completion
  Criteria needs a locatable line per variant, and mappings reconstructed from memory drift from
  what actually shipped.
- Script the fixture comparison — diff the real response against each file in `fixtures/` — rather
  than eyeballing both. A scripted diff is a re-runnable claim at `C_PARITY`; an eyeballed one is a
  memory of having looked.
- Sequence the PR so the exposure-control removal lands as its own commit once the swap is green —
  the diff should read as the one change that makes the feature reachable, not sit buried inside a
  larger commit.
- Keep the mock's fixture-backed tests running (test-only) through `C_PARITY`, then delete it — it
  is the fastest deterministic re-check available mid-loop, and deleting it before the gate removes
  the tool that would have caught a regression.
- Route a fixture mismatch the moment it is found, before trying a workaround — `L_CONTRACT`'s
  ceiling is 2, and a workaround attempt spends a round the Product Owner ruling did not need.
