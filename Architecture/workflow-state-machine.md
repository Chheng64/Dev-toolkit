# Workflow State Machine

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Consumed by:** AI/orchestrator, all Workflows, Playbooks
> **Executed by:** the Orchestrator ([../AI/orchestrator.md](../AI/orchestrator.md)) — this file defines the machine; the orchestrator runs it.

The 13-stage lifecycle every BRD moves through. Machine state lives in Notion properties (`Status`, `Stage Owner`, `Approvals`, `Loop Count`, `Blocked Reason`) — nothing is held in session memory, so any session can resume any BRD.

---

## 1. Design Principles

| Principle | Consequence |
|-----------|-------------|
| Deterministic | Same BRD state + same inputs → same transition. |
| Resumable | State persisted in Notion properties after every transition. Session death loses nothing. |
| Gated | No path to `Merged` without every validation and every human gate. |
| Bounded | Every loop has a ceiling and an escalation path. |
| Auditable | Every transition = one S16 Decision Log entry. |

## 1b. Project Pre-Pipeline (per project, before any BRD)

BRD stages run per-BRD; these run **once per project** (re-run on evolution) and gate the whole pipeline:

```
TOOLKIT_SETUP (once ever: BRD DB + Toolkit Registry)
        ↓
PROJECT_ONBOARDING → INTEGRATION_VALIDATION → MANIFEST_GENERATED
        ↑
MANIFEST_V1 ──(Manifest Gate detects old version)──→ MIGRATION ──→ MANIFEST_GENERATED (v2)
```

- Executed by [../Workflows/project-onboarding.md](../Workflows/project-onboarding.md) (+ its §Migration) + [../Workflows/integration-validation.md](../Workflows/integration-validation.md); state lives in `project-manifest.yaml` (`onboarding.status`, `manifest_version`) and `~/.toolkit/registry.yaml` ([toolkit-registry](toolkit-registry.md)), not in Notion Status values.
- Guard **`C_MANIFEST`** (see §4) blocks all project work without a complete, validated, current-version manifest. No BRD, workflow, or skill executes before it. Version migration is a *gate outcome*, not a user chore — the Manifest Gate runs it automatically ([../AI/orchestrator.md](../AI/orchestrator.md) responsibility 0).

## 2. State Catalog

Each state maps to one Workflow module (toolkit build phase 1). Format per state: primary workflow, entry requires, exit produces, gate.

| # | State (`Status` value) | Workflow module | Entry requires | Exit produces (BRD sections) | Gate |
|---|------------------------|-----------------|----------------|------------------------------|------|
| 00 | `Ready` | — (intake) | Human sets `Ready` ✓; S01 has ≥1 problem line | — | — |
| 01 | `Analysis` | business-analysis | S01 seed | S01–S06 populated; ACs falsifiable | Clarification Gate (only on blocking ambiguity) |
| 02 | `Planning` | product-planning | S01–S06 valid | S03 prioritized; S06 risks scored; direction recommendation in S16 | **Direction Gate** (human) |
| 03 | `Design` | ux-workflow → ui-workflow (runs [design-state-machine.md](design-state-machine.md) states 04–08) | Direction approved | S07, S08, S09 populated; prototype link; self-audit pass | — (machine self-gates via SELF_AUDIT) |
| 04 | `Design Review` | [design-review](../Workflows/design-review.md) (runs [design-state-machine.md](design-state-machine.md) states 09 `USER_REVIEW` + 10 `REVISION` + 11 `FINAL_OUTPUT`) | Self-audit verdict `pass` | Approval `design` granted with freeze hashes + `reads_versions`, or structured change requests in S16 | **Design Gate** (human) |
| 05 | `Dev Planning` | frontend-planning / backend-planning | Design approved | S10, S11 populated; plan traceable to S03 + S07/S08 | — |
| 06 | `Implementation` | implementation → security-certification | S10–S11 valid; branch created | Code on branch; S12 progress entries; deviations logged; **S14 Security Certificate `certified`** | — (machine self-gates via `C_SECURITY`) |
| 07 | `QA` | qa | Implementation complete claim | S13: every AC verified `pass`/`fail`; bugs filed with severity | — |
| 08 | `Tech Review` | code-review | S13 zero open blockers | S14 review summary; concerns; verdict | — |
| 09 | `PR` | git | Tech review verdict `approve` | PR opened from template; BRD `PR` property set | — |
| 10 | `Human Review` | — (human, orchestrator-managed) | PR open, CI green | Approval `final` (`product` for `Phase: FE`), or change requests in S16 | **Final Gate** (human) — **Product Gate** for `Phase: FE` (v2.0, §6) |
| 11 | `Merged` | git + release | Final approval | Branch merged; S15 release notes; BRD frozen sections | — |
| 12 | `Released` | release | Merged; deploy done (if applicable) | S15 final; terminal S16 entry | — |

**Phase dimension (v2.0).** `Phase` (`FE` · `BE` · `single`) is decided at **`Planning` exit** and
carried into states 05–11. A BRD with server scope runs the segment `Dev Planning → Implementation
→ QA → Tech Review → PR → Human Review → Merged` **twice**: once as `Phase: FE` (the front-end
built on mocks, exiting at the Product Gate),
then once as `Phase: BE` (the back-end built against the Shared Contract, exiting at the Final
Gate). `Phase: single` runs the segment once and is the pre-v2.0 path exactly. The phase is not a
`Status` value — no state is added, renamed or removed.

**Conditional sub-state on the `Design Review → Dev Planning` edge.** When `C_HANDOFF_REQUIRED` holds, design state 12 `FLOW_VISUALIZATION` runs between them ([flow-visualization](../Workflows/flow-visualization.md)): the navigation map is derived from the Screen Contract, validated, and put to the **Developer Handoff Gate**. It is not a lifecycle `Status` value — the BRD stays in `Design Review` until the gate resolves, and `Stage Owner` reads `UI Designer (handoff)`. When `C_HANDOFF_REQUIRED` is false (**the default**), the edge is unchanged and the skip is logged in S16.

**Off-path states:** `Blocked` (resumable; `Blocked Reason` set), `Stopped` (deliberate terminal, rationale in S16), `Backlog` (pre-Ready).

**`Blocked Reason` taxonomy (typed, machine-readable prefix):** `resource: <slot> — <missing|skipped-but-required|unreachable>` (Resource Decision pending — [project-manifest](project-manifest.md) §3) · `paused-by-user` · `ceiling: <loop>` · `ambiguity: <question>` · `error: <note>`. Session entry surfaces every Blocked BRD with its typed reason and unblock action; the Telegram failure trigger fires on every entry into `Blocked`.

## 3. Transition Table

| From | Trigger | To |
|------|---------|-----|
| Ready | orchestrator picks BRD ∧ `C_SLOT_FREE` | Analysis |
| Analysis | validation pass, no blocking ambiguity | Planning |
| Analysis | blocking ambiguity, human unavailable | Blocked |
| Planning | recommendation `re-scope` or gate denied | Analysis |
| Planning | recommendation `stop` + human confirms | Stopped |
| Planning | Direction approved ∧ `C_SERVER_SCOPE` (provisional) | Design (`Phase: FE`, provisional) |
| Planning | Direction approved ∧ ¬`C_SERVER_SCOPE` (provisional) | Design (`Phase: single`, provisional) |
| Design | design machine reaches SELF_AUDIT `pass` | Design Review |
| Design | design machine HALT | Blocked |
| Design Review | approval `design` ∧ ¬`C_HANDOFF_REQUIRED` ∧ `C_CONTRACT` pass ∧ `C_SERVER_SCOPE` confirmed against S07 (`Phase` re-tagged if it flips, logged S16) | Dev Planning |
| Design Review | approval `design` ∧ `C_HANDOFF_REQUIRED` | Design Review (design state 12 `FLOW_VISUALIZATION` runs) |
| Design Review (state 12) | Developer Handoff Gate granted ∧ `C_NAVMAP_CLEAN` ∧ `C_CONTRACT` pass ∧ `C_SERVER_SCOPE` confirmed against S07 (`Phase` re-tagged if it flips, logged S16) | Dev Planning |
| Design Review (state 12) | unratified registry route / registry ↔ prototype conflict | Design (design machine states 05 / 10) |
| Design Review | approval `design` ∧ `C_CONTRACT` fail | owning stage per validator report (Design / Dev Planning owners), S16 logged |
| Design Review | change requests | Design (design machine REVISION routing) |
| Design Review | reject (direction wrong) | Analysis |
| Dev Planning | plan validated ∧ `C_RESOURCES` pass | Implementation |
| Dev Planning | `C_RESOURCES` fail | Blocked (`resource: <slot>`) until Resource Decision resolves |
| Dev Planning | plan exposes design gap | Design |
| Implementation | complete claim + S12 current + `C_SECURITY` pass ∧ `C_DELIVERY` pass | QA |
| Implementation | `C_DELIVERY` fail | Implementation (unbound shas named; fixed by trailered commits or S17 backfill rows, not by history rewrite) |
| Implementation | `C_SECURITY` fail (`not-certified`) | Implementation (fix findings; counts against `L_QA`) |
| Implementation | certification exposes authz/contract-level flaw | Dev Planning (S16 `Affects: S10`) |
| QA | all ACs verified, zero open blockers ∧ `C_PARITY` pass (`Phase: BE` only) | Tech Review |
| QA | blocker bugs | Implementation (loop `L_QA`) |
| QA (`Phase: BE`) | `C_PARITY` fail | Implementation (`Phase: BE`), loop `L_QA` |
| Tech Review | verdict `approve` ∧ `C_ISOLATION` pass ∧ `C_DELIVERY` pass | PR |
| Tech Review | `C_DELIVERY` fail | Implementation (same phase), unbound shas named in S16 |
| Tech Review | verdict `request-changes` | Implementation (loop `L_REVIEW`) |
| Tech Review | `C_ISOLATION` fail | Implementation (same phase), offending paths named in S16 |
| PR | PR open + CI green | Human Review |
| Human Review (`Phase: FE`) | approval `product` | Merged (`Phase: FE`; product freeze recorded) |
| Human Review (`Phase: BE` \| `Phase: single`) | approval `final` | Merged |
| Merged (`Phase: FE`) | product freeze recorded in S16 | Dev Planning (`Phase: BE`), loop counts reset |
| any `Phase: BE` state | server constraint contradicts approved front-end behaviour | Dev Planning (`Phase: FE`) via `L_CONTRACT`; `product` token dropped |
| Human Review | change requests | Implementation (loop `L_HUMAN`) |
| Human Review | reject | Analysis |
| Merged (`Phase: BE` \| `Phase: single`) | release steps done | Released |
| any in-flight | required resource missing / skipped-but-required / unreachable → Resource Decision raised | Blocked (`resource: <slot>`) — cleared by the decision, stage resumes where it stopped |
| any | unrecoverable error / ceiling breach | Blocked |

## 4. Guards

| Guard | Definition |
|-------|-----------|
| `C_VALID(stage)` | Exit checklist of the stage's workflow passes (Checklists/ module). |
| `C_APPROVED(gate)` | Notion `Approvals` contains the gate token, granted against current content (see §6). |
| `C_LOOP_OK(loop)` | `Loop Count` < ceiling for that loop. |
| `C_SLOT_FREE` | In-flight BRDs (Status between Analysis and Human Review, **or `Merged` with `Phase: FE`** — it re-enters `Dev Planning` immediately, so it is still occupying a slot) < 3. |
| `C_SECTIONS(ids)` | Required BRD sections exist and are non-empty. |
| `C_MANIFEST` | Toolkit Registry present ([toolkit-registry](toolkit-registry.md)); `project-manifest.yaml` exists, `manifest_version` current (older → Manifest Gate runs Migration first, automatically), schema-valid, `onboarding.status: complete`, `resources.status: bound` with required bindings validated and `health: ok` ([project-manifest](project-manifest.md) §3), required integrations `validated`, `last_validated` ≤ 30 days (else re-validate first). Checked at **session entry for any project work — pickup and resume alike**. |
| `C_CONTRACT` | Screen-contract validation passes for the BRD's owned screens ([../Checklists/screen-contract.md](../Checklists/screen-contract.md) — all six checks). Checked at Dev Planning entry. Fail → stop + missing-mappings report + route to owning stage. |
| `C_SECURITY` | A [Security Certificate](../Templates/security-certificate.md) exists in S14 with verdict `certified`, and its `certified_commit` **equals the current branch head**. Zero open `blocker` findings; every waiver carries a user grantor + rider debt item. Checked at **QA entry** and again at **Tech Review entry** — a certificate on superseded bytes is not a certificate. Fail → stop, report findings, route to Implementation ([security-certification](../Workflows/security-certification.md)). |
| `C_HANDOFF_REQUIRED` | The design goes to a build audience that was not in the room, so the navigation map is in scope. Source: `project-manifest.yaml` `design.handoff_required` (**default `false`**), overridable per BRD via a `Handoff Required` property. False → design state 12 is skipped, and the skip is logged S16. |
| `C_NAVMAP_CLEAN` | Navigation derivation ([design-state-machine](design-state-machine.md) §10, `navgraph.mjs`) exits clean at the configured severity, or every remaining finding carries a granted waiver + rider debt item. Checked at the Developer Handoff Gate only. |
| `C_RESOURCES` | Every registry slot the plan implies is bound and healthy: repos named by S10/S11, design file behind Design blocks, APIs' backing repo, doc targets the plan writes to. Checked at **Dev Planning exit** — moves resource gaps to the cheapest stop point instead of mid-Implementation. Fail → Resource Decision ([project-manifest](project-manifest.md) §3). |
| `C_SERVER_SCOPE` | Two-step. **Provisional**, decided at **`Planning` exit** from S02 business goal/scope, S03 acceptance criteria, and S06 risks (S07 does not exist yet — it is a `Design` output, §2 row 03): does anything imply persistence, authentication, or an external service? Logged S16 with its evidence; sets the provisional `Phase`. **Confirmed**, at **`Design Review` exit**, against the actual S07 flow transitions once they exist: does any S07 flow transition touch persistence, authentication, or an external service? A flip from the provisional value is logged S16 naming the flow transition that caused it, and `Phase` is re-tagged before `Dev Planning`. True → `Phase: FE` (two passes); false → `Phase: single` (one pass, pre-v2.0 behaviour). BE-only BRDs are `single` by the same test — there is no UI to validate. |
| `C_PARITY` | Checked at **Phase-2 QA exit**: (1) every AC marked `mocks` in S13 also carries an `integrated` verdict; (2) every method of the cited `CTR-<brd-id>-v<n>` has a `provided` API block in its screen's contract, and the shipped real adapter implements the contract interface unmodified; (3) zero live mock paths in shipped code — the mock adapter is deleted or demoted to test-only; (4) the Phase-1 exposure control is removed, and its removal is in the BE PR diff. Fail → Implementation (`Phase: BE`). |
| `C_ISOLATION` | Checked at **each phase's Tech Review**, mechanically, against the S10 touched-areas list: a `Phase: BE` branch touches no front-end paths and no contract files; a `Phase: FE` branch touches no server paths. The single bounded exception is integration's adapter wiring — one file per domain, declared in the Phase-2 S10. Fail → Tech Review stops with the offending paths named. |
| `C_DELIVERY` | Every commit sha in `<base>..<current-phase branch>`, in every repo bound to the BRD, appears in S17 bound to at least one resolving `Scope:` token (`R<n>` present in S03 · `SCR-<nnn>` present in the screens registry · `chore`), and the BRD `Compare` property is set for the current phase. Coverage is satisfied by a commit trailer **or** by an S17 backfill row naming the sha (or range), its scope and its reason — pushed history is never rewritten to satisfy this guard ([git](../Workflows/git.md) forbids rewriting after review starts). Checked at **`Implementation` exit** (and at [backend-integration](../Workflows/backend-integration.md) exit, the same stage class) and re-checked at **`Tech Review` → `PR`**, because QA-loop and re-certification commits land after the first check. Validator: [../Checklists/delivery-log.md](../Checklists/delivery-log.md), mechanically `tools/delivery-log.py`. Fail → stop, report the unbound shas, route to Implementation. **A `C_DELIVERY` bounce does not count against `L_QA`** — it is a thirty-second backfill, and charging it against a ceiling would create pressure to weaken the guard. |

A forward transition fires only when its guard conjunction holds; otherwise the stage's failure path runs (retry → escalate → Blocked).

## 5. Loops & Ceilings

| Loop | Path | Ceiling | On breach |
|------|------|---------|-----------|
| `L_CLARIFY` | Analysis self-loop on clarifications | 3 | Blocked |
| `L_DESIGN` | Design Review → Design → Design Review | 3 | Blocked + escalation summary |
| `L_QA` | QA → Implementation → QA | 3 | Blocked + open-bug summary |
| `L_REVIEW` | Tech Review → Implementation → Tech Review | 2 | Blocked |
| `L_HUMAN` | Human Review → Implementation → Human Review | 3 | Blocked + escalation summary |
| `L_CONTRACT` | Phase `BE` → Dev Planning (`Phase: FE`) → Implementation → QA → Tech Review → PR → Human Review (**second Product Gate** — `product` re-earned) → Merged (FE) → back to Dev Planning (`Phase: BE`) | 2 | Blocked + escalation summary |

`Loop Count` property stores the dominant active loop count; the orchestrator logs which loop in S16. Ceiling breach never silently continues.

**Ceilings are per phase.** `Loop Count` resets at the phase flip and the reset is logged in S16.
Phase-1 thrash never consumes Phase-2's revision budget. `L_CONTRACT` is the exception: it counts
across the flip, because it *is* the flip. **The return path is a full second Phase-1 segment, not
a shortcut**: the `product` token was dropped when `L_CONTRACT` fired, so it can only be restored
by re-running Dev Planning → Implementation → QA → Tech Review → PR → Human Review and clearing a
**second Product Gate**. That second Human Review is itself `Merged (FE)`, which flips `Phase`
back to `BE` and **resets `Loop Count` again** (the standard per-phase reset, §5 above) — so each
`L_CONTRACT` round trip hands Phase 2 a fresh `L_QA`/`L_REVIEW`/`L_HUMAN` budget. This is bounded
only by `L_CONTRACT`'s own ceiling of 2: at most two round trips, however many times the
per-phase loops reset in between.

## 6. Approval Gates

| Gate | Blocks | Grantor | Scope rule |
|------|--------|---------|------------|
| Clarification | leaving Analysis with blocking ambiguity | user | answers logged S16 |
| **Direction** | entering Design | user | scoped to S01–S06 content seen |
| **Design** | entering Dev Planning | user | scoped to prototype + S07–S09 seen |
| **Product** | leaving Phase 1 (`Phase: FE` → `Merged`) | user | scoped to the running front-end at the FE PR head sha, the frozen prototype version, the issued `CTR-<brd-id>-v<n>`, and the S07/S09 walk evidence |
| **Developer Handoff** *(conditional)* | leaving Design Review for Dev Planning when `C_HANDOFF_REQUIRED` | user | scoped to registry sha + derivation run + prototype versions named in the gate record |
| **Final** | merging | user | scoped to PR diff + BRD state seen |

**Stale-approval rule:** if gated content changes after approval, the orchestrator removes the approval token from `Approvals` and logs S16. No shipping on stale approval.

**Stale-certificate rule (machine gate, no human token):** the Security Certificate is scoped to the commit it names. Branch head moves → the certificate is stale → delta re-verification and re-issue before the next gate ([security-certification](../Workflows/security-certification.md)). Delta touching auth, payment, PII, data export, or any file carrying an S06 mitigation → full pass, not delta.

## 7. Parallelism

Up to **3 BRDs in-flight** (`C_SLOT_FREE`). Rules:
- One BRD = one branch = one PR **per phase** (`feat/<brd-id>-<slug>` for `Phase: single`;
  `feat/<brd-id>-<slug>-fe` / `-be` for split BRDs — [brd-schema §1](brd-schema.md)). No shared
  branches.
- Human gates queue; the orchestrator presents pending gates batched, oldest first.
- Same-file conflicts across in-flight BRDs → flag at Dev Planning (S10 must list touched areas); prefer serializing conflicting BRDs.

## 8. Anti-Patterns (machine forbids)

- Reaching `Merged` without Final Gate.
- Skipping QA because "change is small" — use the hotfix playbook instead (explicit reduced path, still gated).
- Scope introduced after Analysis without routing back through Analysis.
- Infinite loops — every loop bounded (§5).
- State held only in session memory — Notion properties are the only machine state.
