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

## BRD Sections It May Update

S11 (read/cite only — the contract citation), `Approvals` property (writes `product`), S16 (append — the gate record). The product freeze sha is recorded in **S16** by the orchestrator, at `Merged (FE)`, after this stage's gate — not by this workflow, and not in S08 (permission-matrix gives no role write rights there for this).

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
- [ ] `CTR-<brd-id>-v<n>` issued and cited in S11 before the gate is granted
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

## Best Practices

- Walk fixtures, not the abstract flow. A S09 state with no fixture built for it is not reachable,
  and narrating what it "would" look like is not a walk — route the gap back as build work before
  the verdict, not as a limitation absorbed into the packet.
- Issue `CTR-<brd-id>-v<n>` before the gate, not after. The human is approving behaviour the
  contract claims to describe; an approval scoped to a contract that does not yet exist is scoped
  to nothing.
- State mock-backed limitations in the terms they were discovered in, not softened into
  reassurance — the receiving Phase-2 build pays the real price for anything smoothed over here.
- Keep the walk re-drivable: name the fixture, the flow, and the head sha in the S16 record, so a
  later reviewer reaches the same states instead of rediscovering them.
