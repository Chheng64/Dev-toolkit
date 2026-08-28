# Workflow — Product Validation

> **Module:** Workflows (v2.0)
> **Stage:** `Human Review` with `Phase: FE` — the Phase-1 exit
> **Skill:** Product Manager (conduct) · Frontend Engineer (evidence)
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §6 — **Product Gate**

## Purpose

Put the running product in front of the human and capture a decision. Not a code review: the
question is "is this the product?", answered against the app, not the diff.

## Inputs

- The FE branch at its PR head, running locally against mocks
- S07 flows, S09 edge-case matrix, S03 acceptance criteria
- The frozen prototype version and the design-audit verdict
- The issued `CTR-<brd-id>-v<n>`

## Outputs

- Approval `product` in `Approvals`, or structured change requests in S16
- S16 gate record naming: the head sha reviewed, the prototype version, the contract version, and
  what the human actually saw
- S08 records the product freeze sha once the FE PR merges

## Responsibilities

1. **Run it, do not screenshot it.** The review is conducted against the running app. A static
   capture is evidence of a moment, not of a product.
2. **Walk every S07 flow end to end**, including recovery routes.
3. **Walk every S09 state** — loading, empty, error variants, interrupted, offline,
   permission-denied. Each is reached by its fixture, and the fixture is named in the record.
4. **Present limitations at full strength.** Mock-backed means: no real latency, no real failure
   modes, no real data volume. Say so in the packet, before the verdict, not after it.
5. **Capture the verdict** as `approve` / `request-changes` / `reject`. Change requests are
   structured, each routed to its owning stage; none silently dropped.
6. **A qualified acceptance is recorded with its qualifications**, each carrying a rider debt item
   with grantor and closing condition.

## Completion Criteria

- [ ] Every S07 flow walked in the running app, recovery routes included
- [ ] Every S09 state reached, each by a named fixture
- [ ] Mock-backed limitations stated in the packet at full strength
- [ ] `CTR-<brd-id>-v<n>` issued and cited in S11 before the gate is put
- [ ] Verdict captured; change requests structured and routed; qualifications carry riders
- [ ] S16 gate record names head sha + prototype version + contract version

## Failure & Loops

- `request-changes` → Implementation (`Phase: FE`), counted against `L_HUMAN` for this phase.
- `reject` (the product is wrong, not the build) → `Analysis`.
- Human unavailable → `Blocked` (resumable, `paused-by-user`).

## Common Mistakes

- Reviewing the diff instead of the app — that is Tech Review, and it already happened.
- Walking the happy path and describing the rest. S09 states are what the fixtures exist for.
- Letting the contract be written after the gate: the human is approving behaviour the contract
  claims to describe, so it is issued **before** the gate, not after.
- Recording "approved" for an acceptance that carried qualifications.
