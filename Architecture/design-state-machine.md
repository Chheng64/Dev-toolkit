# Design State Machine

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Normative process source:** [`../design-toolkit/docs/workflow.md`](../design-toolkit/docs/workflow.md) — vendored @ `4081c24`, see [VENDORED.md](../design-toolkit/VENDORED.md). Where this file and the vendored spec disagree about **process**, the spec wins. Where they disagree about **where artifacts live**, this file wins (§1).
> **Consumed by:** Workflows/ux-workflow, Workflows/ui-workflow, Workflows/design-review, Workflows/flow-visualization, Workflows/design-system-workflow, AI/orchestrator
>
> **The executable procedure is in the Workflows, not here.** Each vendored skill is **cloned in full** into its workflow file — this file is the machine (states, guards, gates, remapping), those are the method:
> [ux-workflow](../Workflows/ux-workflow.md) 04–05 · [ui-workflow](../Workflows/ui-workflow.md) 06–08 · [design-review](../Workflows/design-review.md) 09–11 · [flow-visualization](../Workflows/flow-visualization.md) 12

The sub-machine that runs **inside** lifecycle states `Design` → `Design Review` (see [workflow-state-machine.md](workflow-state-machine.md)), plus one conditional state on the `Design Review → Dev Planning` edge. Lifecycle states `Analysis`/`Planning` already execute design states 01–03; this file keeps the full catalog so the design flow is auditable end to end.

**Twelve states, not eleven.** State 12 `FLOW_VISUALIZATION` is numbered by authoring order, not machine order: it runs *after* state 09 approves and *before* state 11 packages, and only when `C_HANDOFF_REQUIRED` holds.

---

## 1. Artifact Remapping (vendored spec → this toolkit)

Feature knowledge lives in Notion (single source of truth). Only build artifacts live in the repo. The vendored spec's `artifacts/*.md` store is **not used**; every artifact below has exactly one home here.

| Vendored artifact | Lives in |
|-----------------|----------|
| `requirements.md` | BRD S03 (+ S04 assumptions) |
| `research.md` | BRD S05 |
| `product-review.md` | BRD S03 (prioritized) + S06 (risks) + S16 (decision record) |
| `ux-plan.md` | BRD S07 + S09 |
| `flows.md` | BRD S07 (flow subsection; graphs as embeds/links) |
| `ui-plan.md` | BRD S08 |
| `prototype/` + `traceability.md` | **Repo**: `design/prototype/<brd-id>/` on the BRD branch; link + version id recorded in S08 |
| `audit-report.md` | BRD S14 (design-audit subsection) |
| `review-record.md` | BRD S14 + `Approvals` property + S16 |
| `revision-log.md` | BRD S16 (Decision Log entries, tagged `[Revision]`) |
| `navgraph.json` · `navmap-report.md` | **Repo**: `design/navmap/<brd-id>/` — derived, regenerated, committed |
| `flow-visualization.md` | BRD S07 (navigation subsection) + the design file when Figma is bound |
| `deliverable/` | Approved prototype (repo, frozen commit) + S07–S09 as handoff spec |
| `machine_state` | Notion properties: `Status`, `Stage Owner`, `Approvals`, `Loop Count`, `Blocked Reason` |

**Reference inputs** the vendored spec expects the product to own:

| Vendored reference input | This toolkit's home |
|---|---|
| `reference/screen-registry.csv` | **[Screen Contract](screen-contract.md)** — `screens/registry.md` + `screens/SCR-<nnn>.md`. State 12 derives from the Screen Contract; no parallel CSV is created. |
| `reference/nav-lanes.json` · `state-vocabulary.md` · `state-machines.json` · `edge-annotations.json` | `design/navmap/` in the project repo, seeded from [`../design-toolkit/templates/`](../design-toolkit/templates/) |
| design-system reference | Project DS in the repo + Figma library when bound ([project-manifest](project-manifest.md) §3) |
| `toolkit.config.json` | `project-manifest.yaml` `design:` block; the vendored [`toolkit.config.json`](../design-toolkit/toolkit.config.json) is the field reference |

## 2. Artifact Discipline (from `artifact-contracts.md`)

Applies to every design artifact, wherever §1 puts it:

- **Versions increment, never overwrite.** A revision creates a new version and names what it supersedes. One prefix per artifact, fixed — a gate record that cannot resolve a version id is the defect `reads_versions` exists to prevent:

| Artifact | Version id | Written by |
|---|---|---|
| requirements (S01–S04) | `req-<brd-id>-NN` | state 01 |
| research (S05) | `res-<brd-id>-NN` | state 02 |
| product review (S03/S06) | `pr-<brd-id>-NN` | state 03 |
| ux plan (S07/S09) | `ux-<brd-id>-NN` | state 04 |
| flows (S07) | `flow-<brd-id>-NN` | state 05 |
| ui plan (S08) | `ui-<brd-id>-NN` | state 06 |
| prototype | `proto-<brd-id>-NN` | state 07 |
| traceability | `trace-<brd-id>-NN` | state 07 |
| design audit (S14) | `audit-<brd-id>-NN` | state 08 |
| gate record (S14) | `review-<brd-id>-NN` | state 09 |
| revision entry (S16) | `rev-<brd-id>-NN` | state 10 |
| navigation map | `navmap-<brd-id>-NN` | state 12 |
| security certificate (S14) | `cert-<brd-id>-NN` | `C_SECURITY` |
- **`reads_versions` is load-bearing.** Every audit verdict and gate record names the *exact* versions it consumed — not "the latest". This is the field `FINAL_OUTPUT` checks completion rule 2 against; a record that names its inputs only in prose is not machine-checkable.
- **A gate record carries sha256** of every approved file plus the player URL the review was actually conducted at. An approval is scoped to the bytes it saw (`G3`, `M5`, `P1`).
- **A freeze is a hash, not a copy** (`P2`). A screen in no frozen deliverable is not delivered, however finished it looks.

## 3. State Catalog (condensed; validations normative)

Lifecycle mapping: 01–02 under `Analysis`, 03 under `Planning`, 04–08 under `Design`, 09 = `Design Review`, 10 routes per target, **12 on the `Design Review → Dev Planning` edge when `C_HANDOFF_REQUIRED`**, 11 exits into `Dev Planning`.

### 01 `REQUIREMENT_ANALYSIS` — under lifecycle `Analysis`
Converts raw request → S01–S04. Validations: ≥1 goal + ≥1 AC; every requirement has a falsifiable AC; no item both `assumed` and `confirmed`; open questions carry severity (`blocking`/`non-blocking`). Exit: valid AND no unresolved blocking question. **Clarification Gate** on blocking ambiguity. Retry ceiling 3 → `Blocked`.

### 02 `RESEARCH` — under lifecycle `Analysis`
Evidence gathering → S05. Validations: every theme cites ≥1 resolvable source; every S03 goal maps to ≥1 theme or is marked `no-research-needed`; contradictions listed, not silently resolved; no fabricated citations. Retry ceiling 2 → downgrade unreachable themes to logged `gap`, continue.

### 03 `PRODUCT_REVIEW` — under lifecycle `Planning`
Proceed / re-scope / stop with rationale → S03 prioritized, S06 scored, S16 decision record. Validations: recommendation ∈ {proceed, re-scope, stop} with rationale; every high-risk item mitigated or explicitly accepted; prioritized set introduces no new scope. **Direction Gate** (human) before Design. Deny → back to Analysis.

### 04 `UX_PLANNING` — under lifecycle `Design`
UX strategy, no screens → S07 (tasks, IA) + S09 (edge-case matrix). Validations: every primary task has happy path + **≥3 non-happy-path states** (error, empty, loading, interrupted, offline, permission-denied as applicable); accessibility + reduced-motion strategy present; every task traces to a prioritized S03 requirement; no visual design content. Retry ceiling 2 → `partial-coverage` flag only if risk tolerance in S06 allows.

### 05 `FLOW_GENERATION` — under lifecycle `Design`
Flows + transitions → S07 flow subsection. Validations: no unreachable state; no dead end without terminal justification; every S09 non-happy-path state has a recovery route; every decision point has mutually exhaustive branch conditions. Retry ceiling 3; persistent unreachable state → back to `UX_PLANNING`. **Screen-free by construction** — state 05 rules what a flow *is*; state 12 proves the design file says so.

### 06 `UI_PLANNING` — under lifecycle `Design`
Component inventory + DS mapping → S08; screens registered in the Screen Contract. Validations: every flow state maps to a component set; DS reuse preferred — every `new` component justified; no one-off styling where a DS primitive exists; token references resolve to the project design system or are flagged as **Extension Note**. Name the DS by source id — *a plan built on the wrong design system validates perfectly against it*. Retry ceiling 2.

### 07 `PROTOTYPE` — under lifecycle `Design`
Assemble prototype in repo (`design/prototype/<brd-id>/`). **Mandatory pre-build gate: check the design system first** — load DS reference, confirm needed tokens/primitives/components exist; reuse, never invent ad-hoc values; genuine gap → Extension Note in S08. Wire all transitions incl. recovery routes. Produce traceability (element → S07/S08 entry + DS token used). Validations: every flow state represented; every element traces to spec (no un-specced additions); DS token usage matches S08; wired transitions match flows; pre-build DS check performed. **Build rules `B1`–`B8`, Figma traps `F1`–`F3`** ([method-rules](../design-toolkit/docs/method-rules.md)) — in particular: every state ships a **deep-link hook** recorded in traceability (`B2`), the token layer is the base and the base font stack is checked per script (`B5`), a transition is not wired until its **destination paints** (`B6`), supersession **deletes** (`B7`). Retry ceiling 3 → back to `UI_PLANNING` on spec insufficiency.

### 08 `SELF_AUDIT` — under lifecycle `Design`
Machine self-review before spending human attention → S14 design-audit subsection. Checks: conformance S03→S07→S08→prototype; accessibility + reduced-motion audit executed (never skipped); non-happy-path coverage reachable; findings classified `blocker`/`major`/`minor`; every AC marked met/unmet with evidence; verdict `pass`/`fail` with rationale. **Verification rules `M1`–`M6`**: every check is **rendering-class** (computed visibility + geometry, never DOM presence); **look at the render** — screenshots across language × theme × reduced-motion × state; a failing probe is a **hypothesis** — confirm at source, fix the instrument, re-run, never waive unconfirmed; sweep the **source** (duplicate keys, stale placeholder routes, per-glyph font fallback); the verdict is scoped to the bytes it audited. `pass` → lifecycle `Design Review`. `fail` → state 10 REVISION. Audit-fix loop ceiling 3.

### 09 `USER_REVIEW` — lifecycle `Design Review` (human)
**Run Local, never a static preview** (`G1`): serve the prototype over local HTTP (`design/prototype/<brd-id>/run-local.sh [port]`, default 8765; reuse a listening server), review through the player, record the player URL in S14. **The hook list is the packet** (`G2`) — ship state 07's traceability table with the verdict request. Present limitations at full strength; an acceptance with qualifications is recorded with its qualifications (`G5`). Capture `approve` / `request-changes` / `reject`; structure change requests, each linked to a target state; none silently dropped. Every waiver names its rider debt item, grantor and closing condition (`G6`). Ambiguity is bounded to two clarification rounds, then recorded as a non-blocking note (`G8`). **Design Gate.** Approve → state 12 if `C_HANDOFF_REQUIRED`, else state 11. Request-changes → state 10. Reject → lifecycle `Analysis`. User unavailable → `Blocked` (resumable).

### 10 `REVISION`
Merge audit findings + change requests into one change set; dedup against S16 `seen` entries (`R1`); triage each to its **root-cause state** — where the fault was *introduced*, not where it is visible (`R3`); **route the class, not the instance** — state the class, sweep for it, record the sweep count (`R2`); dispatch a **bounded scope** naming what changes *and what must not* (`R4`); re-verify aged items against current bytes before dispatch (`R5`); re-validate through `SELF_AUDIT`, or record a waiver with a rider (`R6`); **count the loop out loud every cycle** — one round = one prototype rebuild (`R7`). Every item ends `resolved` or `deferred` with reason — never silently `open`. Loop ceiling: **3 full revision cycles** → `Blocked` + escalation summary. Conflicting change requests → **Conflict Mini-Gate** before dispatch, never resolved in the bytes (`R8`).

### 12 `FLOW_VISUALIZATION` — on the `Design Review → Dev Planning` edge, when `C_HANDOFF_REQUIRED`
Proves the approved design is *ready for development*, not merely visually complete → `design/navmap/<brd-id>/` + S07 navigation subsection + design-file Sections when Figma is bound. **Derive the graph, never draw it** (`W1`) — from the Screen Contract registry, by tool, with an exit code; reconcile against the ratified S07 flows, and record disagreements as findings rather than merging them. One Section per **journey**, `FLOW-XXX • Journey Name` (`W2`); layout is a contract — left→right, uniform pitch, 8pt grid, branches vertical (`W3`); the legend ships in the file (`W4`); connectors regenerate **wholesale**, never hand-patched (`W5`); every frame carries its own metadata including the prototype version it depicts (`W6`); sync is triggered by a **hash diff of the edge set**, not by memory (`W7`); a boundary is a **dated claim** (`W8`); state variants are not optional (`W9`); **the gate passes on the report, not on the picture** (`W10`). Extensions E1–E7: lanes from an explicit assignment file (unassigned → reported, never guessed) · derived cross-feature map · **measured** heat (in-degree + distinct source features) · deep links read out of the implementation, not out of a doc claiming them · normalized state vocabulary before generation · `UNKNOWN` legal, a guessed value is not · provenance block on the overview page. Validations V1–V13 per the vendored skill. **Developer Handoff Gate.** Retry ceiling 3 → back to `FLOW_GENERATION`; registry ↔ prototype route conflict → state 10.

### 11 `FINAL_OUTPUT` — exits into lifecycle `Dev Planning`
Verify approval current, and that it **names its bytes** (`P1`); freeze the prototype commit — a freeze is a hash (`P2`); the audit of record must have run on the bytes being frozen (`P4`); S07–S09 constitute the handoff spec; final completeness check against the **traceability matrix**, never from memory (`P3`) — 100% design-relevant ACs `met` or user-waived, and `superseded` is a legitimate status that names its superseding revision. A waiver is a legitimate exit; silence is not (`P6`). **Known limitations ship inside the deliverable at full strength** (`P8`). Close the machine record in the same edit as the freeze (`P7`). Completeness regression → back to REVISION, never silent shipping.

## 4. Transitions (design-machine edges that leave a lifecycle stage)

| From | Trigger / condition | To |
|---|---|---|
| `SELF_AUDIT` | verdict `pass` | lifecycle `Design Review` (state 09) |
| `SELF_AUDIT` | verdict `fail` | `REVISION` |
| `USER_REVIEW` | `approve` ∧ `C_HANDOFF_REQUIRED` | `FLOW_VISUALIZATION` |
| `USER_REVIEW` | `approve` ∧ ¬`C_HANDOFF_REQUIRED` | `FINAL_OUTPUT` |
| `USER_REVIEW` | `request-changes` | `REVISION` |
| `USER_REVIEW` | `reject` | lifecycle `Analysis` |
| `FLOW_VISUALIZATION` | Developer Handoff Gate granted ∧ `C_NAVMAP_CLEAN` | `FINAL_OUTPUT` |
| `FLOW_VISUALIZATION` | registry route no flow graph ratified | `FLOW_GENERATION` |
| `FLOW_VISUALIZATION` | registry ↔ prototype route conflict | `REVISION` |
| `FINAL_OUTPUT` | validation pass | lifecycle `Dev Planning` |
| `FINAL_OUTPUT` | completeness regression | `REVISION` |

Full internal edge list: [vendored spec §3](../design-toolkit/docs/workflow.md).

## 5. Retry vs Back-Transition

- **Retry (self-loop):** fault is inside this state's output — fix here, `entry_count` +1, ceiling per state above.
- **Back-transition:** root cause is upstream — route to the owning state. Missing input artifact → back to producing state. Tool/runtime error → retry step ×2 → `Blocked` with diagnostic.

## 6. Conditions

| Condition | Definition |
|---|---|
| `C_AUDIT_PASS` | S14 design-audit verdict = `pass`, zero `blocker`, run on the current prototype version |
| `C_ALL_CRITERIA_MET` | 100% design-relevant ACs `met`, `waived` (recorded), or `superseded` (naming the revision) |
| `C_HANDOFF_REQUIRED` | The design goes to a build audience that was not in the room, so the navigation map is in scope. Source: `project-manifest.yaml` `design.handoff_required` (**default `false`**), overridable per BRD via a `Handoff Required` property. Set `true` for design-only engagements resuming into build later, multi-flow features, and any BRD whose builder is not its designer. |
| `C_NAVMAP_CLEAN` | Navigation derivation exits clean at the configured severity, or every remaining finding carries a granted waiver + rider debt item |

## 7. Gates

| Gate | Location | Blocks | Grantor |
|---|---|---|---|
| Clarification | state 01 | leaving Analysis with blocking ambiguity | user |
| **Direction** | state 03 → 04 | spending design effort on unapproved direction | user |
| **Design** (primary) | state 09 | shipping an unapproved design | user |
| Conflict Mini-Gate | state 10 | dispatching conflicting change requests | user |
| **Developer Handoff** | state 12 → 11 | shipping a design a build team cannot navigate from | user |

An approval is scoped to the artifact versions it saw. Artifacts change after approval → the gate reverts to `pending` (stale-approval rule, [workflow-state-machine](workflow-state-machine.md) §6). Classify the delta before asking about it: bug-fix-only → scope confirm with byte-level evidence; feature delta → a ruling (`G4`).

## 8. Loops & Ceilings

| Loop | Path | Ceiling | On breach |
|---|---|---|---|
| `L_CLARIFY` | state 01 self-loop | 3 | `Blocked` |
| `L_RESEARCH` | state 02 self-loop | 2 | continue with logged `gap` |
| `L_UX_EDGE` | state 04 self-loop | 2 | `partial-coverage` flag (S06 risk tolerance permitting) |
| `L_REVISION` | 09 → 10 → upstream → 08 → 09 | 3 full cycles | `Blocked` + escalation summary |
| `L_AUDIT_FIX` | 08 ↔ 10 | 3 | escalates into `L_REVISION` accounting |

`L_REVISION` is the primary product loop and maps onto the lifecycle's `L_DESIGN`. It terminates by user `approve` or by ceiling — never silently.

## 9. Method Rules — the index

The vendored [`method-rules.md`](../design-toolkit/docs/method-rules.md) is the citable catalogue; each vendored skill carries the full statement of its own set. Cite by code in S14 findings, S16 entries and gate records.

| Prefix | Owner state | Concerns |
|---|---|---|
| `B1`–`B8` · `F1`–`F3` | 07 PROTOTYPE | build method; Figma plugin-API traps |
| `M1`–`M6` | 08 SELF_AUDIT | verification method |
| `G1`–`G8` | 09 USER_REVIEW | review + gate-record method |
| `R1`–`R8` | 10 REVISION | triage + routing method |
| `P1`–`P8` | 11 FINAL_OUTPUT | packaging + freeze method |
| `W1`–`W10` · `E1`–`E7` | 12 FLOW_VISUALIZATION | navigation mapping + extensions |

The three that shape the rest: **a DOM-assertion suite is not a substitute for looking at the render** · **a failing probe is a hypothesis, not a finding** · **an approval is scoped to the bytes it saw**.

## 9b. Cross-State Rules

Four rules bind more than one state. They are the ones most often broken by a change that looked local.

| Rule | Statement | Binds states |
|---|---|---|
| **Scope your clearance claims** | "No boundary mocks left" was written about one flow and read as holding for the set. State the scope *inside* the claim. The mirror case: a gap recorded for one flow that a mechanical scan found in three. | 05, 07, 08, 12 |
| **An unruled question is carried, never defaulted** | An unanswered guard is an open decision (`o-<id>`), not a branch invented at build time. An invented value becomes a frozen number nobody owns. | 04, 05, 06, 07 |
| **A shared component is a cross-flow contract** | A component used by more than one flow names its owning plan, or each file re-decides it — and they drift. | 06, 07 |
| **Facts promised at a boundary are contracts** | A fact one flow promises at a `⟂` boundary belongs in **both** flows' decision logs, or two internally consistent flows will disagree. | 05, 10, 11 |

## 9c. Trimming the Pipeline

**Legitimately skippable:**

- **State 12** when the work is not going to a build team — `design.handoff_required: false` (the default here). The skip is logged in S16.
- **State 02 research** for a goal explicitly marked `no-research-needed` — **per goal, not wholesale**.

**Never skippable:**

- **State 08 before state 09.** The audit exists so the user never debugs.
- **State 09 before state 11.** The gate exists so the machine never ships on its own authority.

A "small feature" uses smaller *content*, never fewer *states*.

## 10. Verification Harness

Vendored under [`../design-toolkit/tools/`](../design-toolkit/tools/) (Node, no install). Rules that name a tool are evidenced by its exit code, not by assertion:

| Tool | Serves | Use |
|---|---|---|
| `audit.mjs` | 08 | rendering-class audit sweep (visibility, geometry, tap targets, palette, console) |
| `smoke.mjs` · `stateprobe.mjs` · `cdp.mjs` | 07, 08 | drive every view headless; confirm destinations paint (`B6`) |
| `linkcheck.mjs` · `mermaidcheck.mjs` | 07, 08, 12 | dead links + diagram syntax |
| `navgraph.mjs` | 12 | derive the navigation graph from the registry (`W1`) |
| `stategraph.mjs` | 12 | per-screen state machines from the normalized vocabulary (`E5`) |
| `annotate.mjs` | 12 | developer annotations with cited evidence (`E6`) |
| `config.mjs` · `config.schema.json` | all | config resolution; field reference for the manifest `design:` block |

Tools read the **generated** `toolkit.config.json` at the project root (manifest `design:` block + the BRD's S08 allowlist) — never the vendored file (see [VENDORED.md](../design-toolkit/VENDORED.md)).

**Full catalogue — what each tool checks, its exit codes, its failure-and-fix table, the false-positive catalogue, the waiver rule and the run order: [validation-engine.md](validation-engine.md).** Three things from it that bind every state: exit `2` means the check **did not run** (unevaluable, not passing) · a failing probe is a hypothesis until confirmed at source · a failing check that has not been confirmed at source **is not eligible for a waiver**.

## 11. Deltas from the Vendored Spec

1. **Artifact store** → Living BRD sections + repo directories (§1). No loose `artifacts/*.md`.
2. **Reference inputs** → the Screen Contract is the registry; state 12 derives from it rather than from a parallel `screen-registry.csv` (§1).
3. **`machine_state`** → Notion properties; resumable across sessions by construction.
4. **`HALT_BLOCKED`/`HALT_STOPPED`** → lifecycle `Blocked`/`Stopped`.
5. **States 01–03** execute under lifecycle Analysis/Planning — one pass, not duplicated work; the design stage trusts their outputs and back-transitions if they prove malformed.
6. **Skill-per-state → toolkit Skills:** UX Designer 04–05; UI Designer 06–07; DS Engineer supports 06–07; UI Designer + FE Engineer 12; orchestrator routes 08–12.
7. **`handoff_required` defaults to `false`** here, where the vendored spec leaves it unset. The lifecycle already carries design→dev traceability in the Screen Contract, so the navigation map is opt-in per project or per BRD (§6) — a fourth human gate is never imposed silently.
8. **`toolkit.config.json` → `project-manifest.yaml` `design:` block.** One config per project, not two.
9. **Validation rules** are mirrored as executable Checklists items ([ux-review](../Checklists/ux-review.md), [ui-review](../Checklists/ui-review.md), [design-qa](../Checklists/design-qa.md), [flow-visualization](../Checklists/flow-visualization.md)); this file plus the vendored spec stay normative.
