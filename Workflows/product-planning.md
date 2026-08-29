# Workflow — Product Planning

> **Module:** Workflows
> **Stage:** `Planning` (lifecycle state 02)
> **Skill:** Product Manager
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2; executes [design-state-machine.md](../Architecture/design-state-machine.md) state 03 `PRODUCT_REVIEW`
> **Cloned from:** vendored [`03-product-review`](../design-toolkit/skills/03-product-review/SKILL.md) @ `4081c24` — output shape, V-rules, recovery and gate rules below are the skill's; only artifact locations are remapped (`product-review.md` → S03 prioritized + S06 + S16).

**This is the last cheap place to stop or re-cut scope.** Everything downstream — UX plan, flows, UI plan, prototype — compounds on the direction ratified here. This state **judges** scope; it never **adds** scope.

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
- `Phase` set provisionally (`C_SERVER_SCOPE`, provisional — [workflow-state-machine §4](../Architecture/workflow-state-machine.md)), logged S16 with its evidence. Re-confirmed at `Design Review` exit against S07; not final here.

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
5. **Record the decision and its triggers** — what evidence would reverse it.
6. Raise the **Direction Gate** (orchestrator §4 format): S01–S06 summary + recommendation + cut-line. Capture outcome in S16 + `Approvals: direction`.
7. **Decide `C_SERVER_SCOPE` provisionally** (v2.0), from what exists at this exit — S02 business goal/scope, S03 acceptance criteria, S06 risks (S07 does not exist yet): does anything imply persistence, authentication, or an external service? Set `Phase` (`FE` or `single`) and log the decision with its evidence in S16. This is provisional — `Design Review` exit confirms it against the actual S07 flow transitions and re-tags `Phase` if it flips.

Present at the gate: the recommendation and its rationale, the priority bands, the high-risk items with their mitigation-or-acceptance, and the cut list. **Unresolved contradictions are presented as unresolved** — a gate answered on a tidied-up picture is not an approval of the real direction.

## Output shape (write into S03 / S06 / S16 verbatim)

```markdown
---
artifact: product-review
version: pr-<brd-id>-NN
produced_by: product-review
reads_versions: { requirements: req-<brd-id>-NN, research: res-<brd-id>-NN }
recommendation: proceed | re-scope | stop
gate: direction-approval
gate_state: pending | approved | denied
---

## Recommendation                      [S16]

**<proceed | re-scope | stop>** — <rationale, tied to the scores and
contradictions below. Name the two or three findings that actually drove it.>

## Prioritized requirements            [S03]

| ID | Requirement | Value | Effort | Risk | Band | Evidence |
|---|---|---|---|---|---|---|
| R1 | <text, verbatim from S03> | H/M/L | H/M/L | H/M/L | must | [T1, T4] |
| R7 | ... | | | | cut | unevidenced |

## Risk register                       [S06]

| ID | Risk | Sev | Mitigation **or** accept-risk | Owner |
|---|---|---|---|---|
| K2 | <risk statement> | high | **ACCEPTED** — <why, and by whom> | <role> |

## Scope contradictions                [S16]

- X1: <brief wants A> vs <research theme T3 shows B> — <resolution, or
  explicitly left open with an open-decision id>

## Decision record                     [S16]

- D1: <decision> — trigger: <what evidence or event would reverse it>
- Deferred: <open decisions handed to later states, with ids>

## Cut list                            [S03, marked `deferred (see S16)`]

- <requirement id> — <why it is out for this cycle, and what would bring it back>
```

Every decision names **what would reverse it**. A decision with no reversal trigger cannot be re-examined when the evidence changes — which is how three revision cycles once went to the wrong root cause.

## Validation rules

- **V1:** `recommendation` ∈ {`proceed`, `re-scope`, `stop`} **and** the rationale block is non-empty.
- **V2:** Every risk with `Sev = high` carries a mitigation **or** an explicit accept-risk note **with a named owner**.
- **V3:** The prioritized set is a **subset** of the validated requirements — every ID resolves in S03. **No new scope is introduced here.**
- **V4:** Every prioritized requirement cites its evidence (research theme IDs) **or** is explicitly marked `unevidenced`.

Exit: rules pass **and** the Direction Gate is resolved.

## Completion Criteria

- [ ] Every requirement scored (value/effort/risk) and reconciled against evidence
- [ ] Prioritized set introduces zero new scope
- [ ] Every high-risk item mitigated or explicitly accepted
- [ ] Recommendation written with rationale in S16
- [ ] Direction Gate resolved: `Approvals` contains `direction` (proceed) OR routed to Analysis (re-scope/deny) OR `Stopped` (stop confirmed)
- [ ] `C_SERVER_SCOPE` decided provisionally, `Phase` set, evidence logged in S16
- [ ] S16 stage-exit entry written

## Failure & Loops

- Validation failure → re-run scoring with the failed rule as constraint, ceiling 2 → `Blocked`.
- Gate denied → route to `Analysis` with the user's denial notes logged in S16 (they are the corrective input).
- `stop` recommended but user disagrees → treat as `proceed` with the disagreement logged; user owns the call.

## Failure & Loops (design state 03)

- Validation failure → re-run **scoring only**, with the failed rule as an explicit constraint. Retry ceiling **2**.
- **Escalate rather than widen scope to satisfy a rule** — a V3 failure means an upstream requirement is missing, not that this state should invent one.
- Gate **denied** → back-transition to `Analysis` carrying the denial notes as input.
- `re-scope` → `Analysis` with the cut list and contradictions attached. `stop` + gate confirms → `Stopped`.
- A later revision of the recommendation **re-opens the gate** — an approval is scoped to the artifact version it saw.

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
