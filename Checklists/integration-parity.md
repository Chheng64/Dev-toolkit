# Checklist — Integration Parity (`C_PARITY`)

> Validator run at **Phase-2 QA exit**. Guard: [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4.
> Any unchecked item → stop, report, route to Implementation (`Phase: BE`).

## 1. Acceptance criteria
- [ ] Every S13 row marked `Verified on: mocks` also carries an `integrated` verdict
- [ ] Zero ACs passing on mocks and failing integrated (any such row is a blocker, not a note)

## 2. Contract coverage
- [ ] Every method of the cited `CTR-<brd-id>-v<n>` has a `provided:` line in its screen's contract
- [ ] The shipped real adapter implements the contract interface **unmodified** (typecheck clean)
- [ ] Every contracted error variant is reachable in the integrated app

## 3. Mock removal
- [ ] Mock adapter deleted, or present only under test paths
- [ ] No runtime switch, environment variable or fallback selects a mock
- [ ] Fixtures retained (they are the recorded contract examples, not dead test data)

## 4. Exposure
- [ ] The Phase-1 exposure control is removed
- [ ] Its removal is visible in the BE PR diff

## 5. Isolation
- [ ] The BE branch's front-end diff is the selection point only, one file per domain
- [ ] Zero edits to the contract artifact from Phase 2
