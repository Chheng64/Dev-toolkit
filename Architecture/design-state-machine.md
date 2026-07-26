# Design State Machine

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Source:** Adapted from "AI Product Design Agent — Workflow Architecture" (UI UX - Workflow.md). Gates, validation rules, retry ceilings, and loop bounds preserved. Artifact store remapped to the Living BRD.
> **Consumed by:** Workflows/ux-workflow, Workflows/ui-workflow, Workflows/design-system-workflow, AI/orchestrator

The sub-machine that runs **inside** lifecycle states `Design` → `Design Review` (see [workflow-state-machine.md](workflow-state-machine.md)). Lifecycle states `Analysis`/`Planning` already execute design states 01–03; this file keeps the full catalog so the design flow is auditable end-to-end.

---

## 1. Artifact Remapping (source doc → Living BRD)

Feature knowledge lives in Notion (single source of truth). Only build artifacts live in the repo.

| Source artifact | Lives in |
|-----------------|----------|
| `requirements.md` | BRD S03 (+ S04 assumptions) |
| `research.md` | BRD S05 |
| `product-review.md` | BRD S03 (prioritized) + S06 (risks) + S16 (decision record) |
| `ux-plan.md` | BRD S07 + S09 |
| `flows.md` | BRD S07 (flow subsection; graphs as embeds/links) |
| `ui-plan.md` | BRD S08 |
| `prototype/` + `traceability.md` | **Repo**: `design/prototype/<brd-id>/` on the BRD branch; link recorded in S08 |
| `audit-report.md` | BRD S14 (design-audit subsection) |
| `review-record.md` | BRD S14 + `Approvals` property + S16 |
| `revision-log.md` | BRD S16 (Decision Log entries, tagged `[Revision]`) |
| `deliverable/` | Approved prototype (repo, frozen commit) + S07–S09 as handoff spec |
| `machine_state` | Notion properties: `Status`, `Stage Owner`, `Approvals`, `Loop Count`, `Blocked Reason` |

## 2. State Catalog (condensed; validations normative)

Mapping to lifecycle: states 01–02 run under `Analysis`, state 03 under `Planning`, states 04–08 under `Design`, state 09 = `Design Review`, state 10 routes per target, state 11 exits into `Dev Planning`.

### 01 `REQUIREMENT_ANALYSIS` — under lifecycle `Analysis`
Converts raw request → S01–S04. Validations: ≥1 goal + ≥1 AC; every requirement has a falsifiable AC; no item both `assumed` and `confirmed`; open questions carry severity (`blocking`/`non-blocking`). Exit: valid AND no unresolved blocking question. **Clarification Gate** on blocking ambiguity. Retry ceiling 3 → `Blocked`.

### 02 `RESEARCH` — under lifecycle `Analysis`
Evidence gathering → S05. Validations: every theme cites ≥1 resolvable source; every S03 goal maps to ≥1 theme or is marked `no-research-needed`; contradictions listed, not silently resolved; no fabricated citations. Retry ceiling 2 → downgrade unreachable themes to logged `gap`, continue.

### 03 `PRODUCT_REVIEW` — under lifecycle `Planning`
Proceed / re-scope / stop with rationale → S03 prioritized, S06 scored, S16 decision record. Validations: recommendation ∈ {proceed, re-scope, stop} with rationale; every high-risk item mitigated or explicitly accepted; prioritized set introduces no new scope. **Direction Gate** (human) before Design. Deny → back to Analysis.

### 04 `UX_PLANNING` — under lifecycle `Design`
UX strategy, no screens → S07 (tasks, IA) + S09 (edge-case matrix). Validations: every primary task has happy path + **≥3 non-happy-path states** (error, empty, loading, interrupted, offline, permission-denied as applicable); accessibility + reduced-motion strategy present; every task traces to a prioritized S03 requirement; no visual design content. Retry ceiling 2 → `partial-coverage` flag only if risk tolerance in S06 allows.

### 05 `FLOW_GENERATION` — under lifecycle `Design`
Flows + transitions → S07 flow subsection. Validations: no unreachable state; no dead end without terminal justification; every S09 non-happy-path state has a recovery route; every decision point has mutually exhaustive branch conditions. Retry ceiling 3; persistent unreachable state → back to `UX_PLANNING`.

### 06 `UI_PLANNING` — under lifecycle `Design`
Component inventory + DS mapping → S08. Validations: every flow state maps to a component set; DS reuse preferred — every `new` component justified; no one-off styling where a DS primitive exists; token references resolve to the project design system or are flagged as **Extension Note**. Retry ceiling 2.

### 07 `PROTOTYPE` — under lifecycle `Design`
Assemble prototype in repo (`design/prototype/<brd-id>/`). **Mandatory pre-build gate: check the design system first** — load DS reference, confirm needed tokens/primitives/components exist; reuse, never invent ad-hoc values; genuine gap → Extension Note in S08. Wire all transitions incl. recovery routes. Produce traceability (element → S07/S08 entry + DS token used). Validations: every flow state represented; every element traces to spec (no un-specced additions); DS token usage matches S08; wired transitions match flows; pre-build DS check performed. Retry ceiling 3 → back to `UI_PLANNING` on spec insufficiency.

### 08 `SELF_AUDIT` — under lifecycle `Design`
Machine self-review before spending human attention → S14 design-audit subsection. Checks: conformance S03→S07→S08→prototype; accessibility + reduced-motion audit executed (never skipped); non-happy-path coverage reachable; findings classified `blocker`/`major`/`minor`; every AC marked met/unmet with evidence; verdict `pass`/`fail` with rationale. `pass` → lifecycle `Design Review`. `fail` → state 10 REVISION. Audit-fix loop ceiling 3.

### 09 `USER_REVIEW` — lifecycle `Design Review` (human)
**Run Local default:** serve prototype over local HTTP (`design/prototype/<brd-id>/run-local.sh [port]`, default 8765; reuse listening server). Review happens against the running prototype, player URL recorded in S14. Present limitations from the audit transparently. Capture `approve` / `request-changes` / `reject`; structure change requests, each linked to a target state; none silently dropped. **Design Gate.** Approve → state 11. Request-changes → state 10. Reject → lifecycle `Analysis`. User unavailable → `Blocked` (resumable).

### 10 `REVISION`
Merge audit findings + change requests into one change set; triage each to its **root-cause state** (requirement? flow? UI? prototype?); order upstream-first; dispatch; re-run downstream; every item ends `resolved` or `deferred` with reason — never silently `open`. Dedupe against S16 `seen` entries so rejected changes don't re-enter. Loop ceiling: **3 full revision cycles** → `Blocked` + escalation summary. Conflicting change requests → mini-gate to user before dispatch.

### 11 `FINAL_OUTPUT` — exits into lifecycle `Dev Planning`
Verify approval current (not superseded); freeze prototype commit; S07–S09 constitute the handoff spec; final completeness check: 100% design-relevant ACs met or user-waived. Completeness regression → back to REVISION, never silent shipping.

## 3. Retry vs Back-Transition

- **Retry (self-loop):** fault is inside this state's output — fix here, `entry_count` +1, ceiling per state above.
- **Back-transition:** root cause is upstream — route to the owning state. Missing input artifact → back to producing state. Tool/runtime error → retry step ×2 → `Blocked` with diagnostic.

## 4. Deltas from Source Doc

1. Artifact store → Living BRD sections + repo prototype dir (§1). No loose `.md` files.
2. `machine_state` → Notion properties; resumable across sessions by construction.
3. `HALT_BLOCKED`/`HALT_STOPPED` → lifecycle `Blocked`/`Stopped`.
4. States 01–03 execute under lifecycle Analysis/Planning — one pass, not duplicated work; the design stage trusts their outputs and back-transitions if they prove malformed.
5. Skill-per-state → states map to toolkit Skills (UX Designer: 04–05; UI Designer: 06–07; DS Engineer: 06–07 support; orchestrator: 08–11 routing).
6. Validation rules → mirrored as Checklists/ items in Phase 4 (ux-review, ui-review, design-qa); this file stays normative.
