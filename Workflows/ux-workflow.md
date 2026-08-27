# Workflow — UX (design states 04 · 05)

> **Module:** Workflows
> **Stage:** `Design` (lifecycle state 03, first half)
> **Skill:** UX Designer
> **Machine:** [design-state-machine.md](../Architecture/design-state-machine.md) states 04 `UX_PLANNING` + 05 `FLOW_GENERATION`
> **Cloned from:** vendored [`04-ux-planning`](../design-toolkit/skills/04-ux-planning/SKILL.md) · [`05-flow-generation`](../design-toolkit/skills/05-flow-generation/SKILL.md) @ `4081c24`. Method text is the skills' text; only artifact locations are remapped. Re-clone on vendor upgrade.

**This file is the procedure, not a pointer to one.**

---

## 0. Execution contract

| State | Produces | Retry | Next |
|---|---|---|---|
| 04 `UX_PLANNING` | S07 (tasks, IA, navigation) + S09 (state enumeration, edge matrix) | 2 (`L_UX_EDGE`) → `partial-coverage` flag | 05 / back to `Planning` |
| 05 `FLOW_GENERATION` | S07 flow subsection (graphs, decisions, reachability, boundaries) | 3 → back to 04 | 06 ([ui-workflow](ui-workflow.md)) / back to 04 |

**Artifact remap:** the vendored `ux-plan.md` is **S07 + S09**; `flows.md` is the **S07 flow subsection**; `requirements.md` is **S03/S04**; `research.md` is **S05**; `product-review.md` is **S03 prioritized + S06**. Frontmatter blocks below go verbatim into the section they head.

**Entry requires:** `Approvals` contains `direction` (Direction Gate passed).

---

# PART A — STATE 04 · `UX_PLANNING`

## A.1 Contract

| Field | Value |
|---|---|
| Reads | S03 (prioritized), S05, S06 |
| Writes | S07 (tasks, IA, navigation), S09 (state enumeration + edge matrix) |
| Depends on | `PRODUCT_REVIEW` — its Direction Gate must be approved |
| Approval gate | None — checkpoint review only, non-blocking |
| Retry ceiling | 2 (`L_UX_EDGE`), then flag `partial-coverage` |
| Next | `FLOW_GENERATION` / back to `Planning` (priorities unviable) / self-loop (edge-case gap) |

## A.2 Purpose

Define the UX **strategy** — information architecture, key tasks, states, and non-happy-path coverage — so that flow generation has something to sequence and UI planning has something to lay out.

This state is deliberately **screen-free**. The moment it names a screen or a visual treatment it has skipped the decision it exists to make, and V4 fails.

## A.3 Processing steps

1. Derive **primary user tasks** from the **prioritized** requirements — the `must` / `should` bands in S03, not the raw requirement set.
2. Model the **information architecture** and the **navigation model**.
3. Enumerate **states per task**: the happy path **and** the non-happy paths — error, empty, loading, interrupted, offline, permission-denied.
4. Define **accessibility and reduced-motion requirements** at the strategy level (targets, contrast posture, focus order, motion opt-out, script/locale handling).
5. Note **UX risks and open decisions**, each with an id that later states and the review gate can cite.

## A.4 Output — BRD S07 + S09

```markdown
---
artifact: ux-plan
version: ux-<brd-id>-NN
produced_by: ux-planning
reads_versions:
  S03: <rev>
  S05: <rev>
  S06: <rev>
brd: <brd-id>
coverage: <tasks with full state enumeration> / <total tasks>
---

# UX Plan — <feature>

## Primary tasks (→ requirements)      [S07]

| Task | User intent | Reqs |
|---|---|---|
| TASK-A | <what the user is trying to do> | R1, R4 |

## Information architecture             [S07]

<the content/entity model and where each task lives inside it>

## Navigation model                     [S07]

<how a user moves between the IA's regions: entry points, persistent
navigation, push vs replace, back semantics, deep-link posture>

## State enumeration                    [S09]

### TASK-A
| State | Kind | Trigger | Strategy |
|---|---|---|---|
| happy | happy | <trigger> | <what the user experiences> |
| loading | non-happy | <trigger> | ... |
| empty | non-happy | <trigger> | ... |
| error | non-happy | <trigger> | ... |
| interrupted | non-happy | <trigger> | ... |
| permission-denied | non-happy | <trigger> | ... |

## Edge-case matrix                     [S09]

| | loading | empty | error | interrupted | offline | permission-denied |
|---|---|---|---|---|---|---|
| TASK-A | ✅ | ✅ | ✅ | ✅ | n/a — <why> | ✅ |

## Accessibility strategy               [S07]

- Interactive target floor: <value> — **state the number here**; it becomes an
  acceptance criterion the audit checks against (config `audit.tapTargetFloorPx`),
  so an unrealistic one becomes debt later.
- Contrast posture, focus order, keyboard reachability, screen-reader
  expectations, motion opt-out, script/locale and per-glyph font handling.

## UX risks                             [S07 → S06 via `Affects:`]

- U1: <risk> — <what it threatens> — <planned response>

## Open decisions                       [S16]

- o-<id>: <question> — <what it blocks> — <who can rule>
```

## A.5 Validation rules

- **V1:** Every primary task enumerates a happy path **AND ≥3 non-happy-path** states.
- **V2:** The accessibility strategy is present and non-empty.
- **V3:** Every task traces to ≥1 **prioritized** requirement.
- **V4:** **No screen-level or visual design content** — strategy only. No screen ids, no layout, no component names, no colour.

## A.6 Failure recovery

- **V1** failure → re-run the enumeration targeting **only** the tasks with missing coverage. Increment `L_UX_EDGE`.
- **V4** failure → strip the screen-level content back out. Design detail that arrives here is not free — it pre-commits `UI_PLANNING` to a layout nobody chose.
- Retry ceiling **2**, then flag `partial-coverage` and continue **only if** S06's risk tolerance allows it. Otherwise escalate.
- Prioritized set proves **unviable** → back-transition to `Planning`. Do not quietly re-prioritize here; that scope decision belongs to a gated state.

## A.7 Carried, not defaulted

**Open decisions recorded here are carried forward**, not resolved by assumption: an unruled question that reaches the prototype as an invented answer is how a placeholder ends up frozen into an approved deliverable.

---

# PART B — STATE 05 · `FLOW_GENERATION`

## B.1 Contract

| Field | Value |
|---|---|
| Reads | S07, S09, S03 |
| Writes | S07 flow subsection |
| Depends on | `UX_PLANNING` (must precede) |
| Approval gate | None — flows are ratified indirectly, at the Design Gate, through the prototype that implements them |
| Retry ceiling | 3, then back-transition to `UX_PLANNING` |
| Next | `UI_PLANNING` / back to `UX_PLANNING` (missing state) / self-loop (dead-end or reachability fix) |

## B.2 Purpose

Produce concrete user flows and state transitions that connect the UX plan's tasks and states, so `UI_PLANNING` has a graph to lay out instead of a list to interpret.

This state is **screen-free in the same sense state 04 is**: a node is a *state* the user is in, not a visual design. Naming a node after a screen id is fine — and is the convention, since those ids are the Screen Contract's `SCR-<nnn>` — but the node's contents are still triggers, guards and routes, never layout, component names or colour.

## B.3 Processing steps

1. For each task, **sequence its states into a directed flow**.
2. Insert **decision points** and their **branch conditions**.
3. Map **every non-happy-path state to a recovery route** — the state must lead somewhere the user can act, not just be reachable.
4. **Detect and eliminate dead ends and unreachable states.** Produce the reachability report as evidence, not as a claim.
5. **Annotate every transition with its trigger and guard.**

## B.4 Output — BRD S07 flow subsection

```markdown
---
artifact: flows
version: flow-<brd-id>-NN
supersedes: <prior version, if any>
produced_by: flow-generation
reads_versions: { S07: <rev>, S09: <rev>, S03: <rev> }
brd: <brd-id>
folds_in: [<revision rounds / decisions this version absorbs>]
---

# Flows — <feature>

Node ids = prototype views = Screen Contract `SCR-<nnn>`.
`⟂` = flow boundary (another flow's screen, mocked).

## Canon entry paths

<the named paths a user actually takes in, one line each — these are what a
reviewer checks the prototype against>

## F1 — <segment name> (<tasks covered>)

⟂OTHER-01 ──trigger──▶ [D1 <question>?]
   D1 no  ──▶ NODE-A ──trigger──▶ NODE-B
   D1 yes ──▶ NODE-B directly
NODE-B ──[D2 <question>?]
   D2 <case> ──▶ NODE-C
   D2 <case> ──▶ inline recovery (self-loop; recovery: <what the user can do>)

**D1:** <the guard, as a checkable expression> · **D2:** <guard> — all exhaustive.

<prose only where the diagram cannot carry it: contested tap targets, suppression
rules, decisions that changed a branch>

## Decision log                          [mirrored to S16]

| ID | Decision | Ruled by | Date |
|---|---|---|---|
| D-<x>N | <what was decided, and what it replaced> | user / audit / this state | <date> |

## Reachability report

| Node | Reachable from | Terminal? | Justification if terminal |
|---|---|---|---|
| NODE-A | entry, NODE-C | no | — |
| NODE-Z | NODE-C | **yes** | <why terminating here is correct> |

Unreachable nodes: **0**. Dead ends without justification: **0**.

## Recovery coverage

| Non-happy state (S09) | Recovery transition |
|---|---|
| TASK-A / error | → retry edge on NODE-B |
| TASK-A / empty | → NODE-A with a route-out CTA |

## Flow boundaries

| Boundary node | Owning flow | Status | Status checked |
|---|---|---|---|
| ⟂OTHER-01 | <flow / BRD-id> | mocked / real handoff | <date> |

## Open decisions

- o-<id>: <question> — <which branch it leaves unruled> — <who can rule>
```

## B.5 Validation rules

- **V1:** No unreachable state in any flow.
- **V2:** No dead-end state without an explicit terminal justification.
- **V3:** Every non-happy-path state from S09 has a recovery transition.
- **V4:** Every decision point has **mutually exhaustive** branch conditions.

V4 is the one that fails quietly. "Exhaustive" means the branch set covers the guard's whole domain — including null, not-yet-loaded and permission-denied — not merely that two plausible cases are listed.

## B.6 Failure recovery

- **V1 / V2** failure → patch the **offending flow segment** and re-validate **only that segment**. Do not regenerate the whole graph — a full rewrite loses the ratified decisions the diagram encodes.
- **V3** failure → the missing recovery is usually a missing *state*, not a missing edge; check whether the fault is upstream before adding an edge that invents one.
- **V4** failure → add the missing branch. If the missing branch has no ruled answer, it is an **open decision**, not a branch to invent.
- Retry ceiling **3**. A **persistent unreachable state** means S09 omitted a state → back-transition to `UX_PLANNING`. Do not add the state here.
- Design state 12 reports a registry route no flow graph ratified → it comes back **here**; state 12 may not rule a branch.

## B.7 Recorded failure modes

| Class | What happened | Rule |
|---|---|---|
| **Stale boundary** | Eleven live navigation call sites still routed to the placeholder boundary screen after every destination flow had shipped. A `⟂` node is correct *when written* and silently wrong once the owning flow exists. | The **Flow boundaries** table is re-checked whenever any other BRD reaches its final gate — a boundary's status is a **dated claim**, not a permanent property. |
| **Scoped claim read as global** | "No boundary mocks left" was written about one flow's mocks and read as holding for the set. | State the **scope of a clearance claim inside the claim itself**. |
| **Cross-flow canon drift** | Two approved flows shipped contradictory values for the same user-visible fact. Each flow graph was internally consistent. | A fact promised at a `⟂` boundary is a **cross-flow contract**. Record it in the decision log of **both** flows, or it drifts. |
| **Branch invented, not ruled** | Unruled product numbers and unowned scope questions entered flows as concrete branches and were frozen into approved deliverables. | An unanswered guard is an **open decision carried forward** (`o-<id>`), never a default silently chosen here. |
| **Graph green, screen blank** | A flow whose every node and edge was correct rendered nothing — the view container stayed `visibility:hidden` because nothing ever activated it. | Flow correctness is **not** implementation correctness. This state's verdict is scoped to the graph; the render is state 08's job (M1/M2). |

---

## Stage exit

- [ ] **04:** V1–V4 pass — every task traces to a prioritized requirement; happy + ≥3 non-happy states each; a11y strategy with the **target floor as a number**; zero screen/visual content
- [ ] **05:** V1–V4 pass — reachability report clean, recovery coverage complete, branches exhaustive, boundaries dated
- [ ] Open decisions carried as `o-<id>`, zero defaulted branches
- [ ] S16 stage-exit entry written

Gate: [ux-review](../Checklists/ux-review.md) → [ui-workflow](ui-workflow.md).
