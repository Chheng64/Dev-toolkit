# Workflow — UX

> **Module:** Workflows
> **Stage:** `Design` (lifecycle state 03, first half)
> **Skill:** UX Designer
> **Machine:** executes [design-state-machine.md](../Architecture/design-state-machine.md) states 04 `UX_PLANNING` + 05 `FLOW_GENERATION`

## Purpose

Define UX strategy and concrete flows — tasks, information architecture, every state a user can land in (happy and non-happy), and how each connects — **without producing screens**. Screens are UI workflow's job; this stage decides what screens must exist and why.

## Inputs

- `Approvals` contains `direction` (Direction Gate passed)
- S03 prioritized requirements, S05 research (pattern catalog), S06 risk tolerance
- Open S16 `Affects:` entries targeting S07/S09
- Design change requests routed here by REVISION (loop iterations)

## Outputs

- S07 User Flows & UX Decisions — primary tasks, IA + navigation model, per-task flow graphs (embed or linked diagram) with decision points, branch conditions, recovery routes; accessibility + reduced-motion strategy
- S09 Edge Cases & Non-Happy Paths — per-task matrix: error, empty, loading, interrupted, offline, permission-denied (as applicable)
- S16 — UX decisions with rationale; open UX risks flagged to S06 via `Affects:`

## BRD Sections It May Update

S07 (edit), S09 (edit), S05 (append), S16 (append). UX Designer matrix row.

## Responsibilities

**UX_PLANNING (state 04):**
1. Derive primary tasks from prioritized S03 — every task traces to ≥1 requirement; a task with no requirement is scope creep.
2. Model IA and navigation.
3. Enumerate states per task: happy path **and ≥3 non-happy-path states**. Happy-path-only design is not acceptable.
4. Define accessibility + reduced-motion requirements at strategy level (contrast intent, keyboard reachability, focus order, motion fallbacks).

**FLOW_GENERATION (state 05):**
5. Sequence states into directed flows; annotate transitions with triggers and guards.
6. Insert decision points with **mutually exhaustive** branch conditions.
7. Map every non-happy-path state to a recovery route — no dead ends without explicit terminal justification.
8. Run reachability check: no unreachable state, no orphan.

## Completion Criteria

- [ ] Every primary task traces to a prioritized requirement
- [ ] Every task: happy path + ≥3 non-happy-path states enumerated
- [ ] Accessibility + reduced-motion strategy present, non-empty
- [ ] Every S09 state has a recovery route in S07 flows
- [ ] No unreachable state; no unjustified dead end; branches mutually exhaustive
- [ ] Zero screen-level or visual content in S07/S09 (strategy + structure only)
- [ ] S16 stage-exit entry written

## Failure & Loops

- Edge-case coverage failure → targeted re-enumeration, ceiling 2 → `partial-coverage` flag allowed only if S06 risk tolerance permits, logged S16.
- Flow reachability failure → patch offending segment, re-validate segment, ceiling 3; persistent → back to UX_PLANNING (missing state).
- Planning reveals unviable priorities → back-transition to `Planning` with evidence.

## Common Mistakes

- Happy-path tunnel vision — the #1 audit failure downstream. The edge-case matrix is the deliverable, not an appendix.
- Sketching screens ("put a button top-right") — that's UI planning; here it's "user can trigger X from state Y".
- Inventing tasks no requirement asked for.
- Recovery route = "show error message". A recovery route names where the user goes next and with what preserved state/intent.
- Accessibility strategy as afterthought boilerplate — it must name this feature's specific risks (focus traps in modals, motion in transitions, async state announcements).
- Branch conditions that overlap or leave gaps ("if new user / if returning" — what about signed-out?).

## Best Practices

- Enumerate states as a table first, flows second — coverage gaps are visible in tables, invisible in diagrams.
- Preserve user intent across interruptions: any flow crossing auth/async boundaries states what context is restored on return.
- Name states like machine states (`EMPTY_CART`, `SYNC_FAILED`) — UI planning and implementation reuse the names, traceability comes free.
- Async transitions get explicit intermediate states (loading, retrying) with user-facing language planned — never raw internal errors surfaced to users.
- Steal patterns from S05 research; note which pattern each flow borrows — cheaper to defend at Design Review.
