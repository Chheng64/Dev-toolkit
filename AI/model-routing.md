# Model Routing Strategy

> **Module:** AI / Runtime
> **Status:** Stable (v1.1)
> **Purpose:** Which Claude model runs each workflow stage, when to escalate, and how stages hand off across model boundaries. Consulted by the orchestrator at every stage-enter.
> **Principle:** Route by failure cost × reasoning depth, not by habit. Cheap models for mechanical work with checklist-verifiable output; heavy models where a wrong judgment cascades downstream.

## 1. Model Tiers

| Tier | Model | Character | Use for |
|------|-------|-----------|---------|
| T1 | Haiku (latest, e.g. `claude-haiku-4-5`) | fast, cheap | Mechanical, checklist-verifiable work |
| T2 | Sonnet (latest, `claude-sonnet-5`) | strong default | Standard judgment work |
| T3 | Opus (latest, `claude-opus-5`) | deep reasoning | High-leverage decisions, adversarial passes |
| T4 | Frontier (when available, e.g. Fable) | maximum | Reserved cases (§4 rule 6) |

Pin to latest within each family; exact IDs live here so projects inherit updates with a toolkit bump.

## 2. Stage Routing Table

| Stage | Default | Why |
|-------|---------|-----|
| Orchestrator (routing, gates, properties) | T2 | Deterministic protocol; judgment only at edges |
| Analysis | T2 | Requirement extraction + AC quality need judgment; volume moderate |
| Planning | **T3** | Direction decision — highest leverage per token in the machine |
| Design: UX (states 04–05) | **T3** | Edge-case discovery + flow correctness cascade into everything downstream |
| Design: UI planning (06) | T2 | DS mapping against explicit inventory |
| Design: Prototype (07) | T2 | Assembly against spec; DS check is procedural |
| Design: Self-audit (08) | **T3** | Adversarial pass; catches what the builder can't (§5 cross-model rule) |
| Design Review: user review (09) | T2 | Packaging + capture; the judgment is the user's |
| Design Review: revision triage (10) | **T3** | Root-cause routing — a misroute costs three cycles, and did |
| Design Review: final output (11) | T2 | Freeze, hash and completeness are mechanical against the matrix |
| Design: flow visualization (12) | T2; **T3** for the first derivation's reconciliation and the state-vocabulary normalization | Derivation is a tool; deciding registry-vs-flows disagreements is not |
| Security certification (`C_SECURITY`) | **T3** | Adversarial, and a miss ships to production (§6 T4 reserve applies to auth/payment/PII scope) |
| Dev Planning (FE/BE) | **T3** | Architecture + contracts freeze here; rework cost peaks |
| Implementation | T2; T1 for mechanical slices (boilerplate, config, copy, codemods) | Plan quality already bought; assembly is standard work |
| QA | T2 | Procedural verification + exploratory judgment |
| Tech Review | **T3** | Seven dimensions + absence-checking = deepest read in the machine |
| Git / PR | T1 | Fully mechanical against naming contracts |
| Release | T1 mechanics; T2 for S15 writing | Deploy steps procedural; release notes are product writing |
| Debug | T2 → T3 per §4 rule 3 | Most bugs are shallow; escalation handles the deep ones |
| Design-system workflow | T2; T3 for API-shape decisions on new components | Blast-radius work |

## 3. Recording

Every S16 stage-enter entry appends the model: `— Stage-Enter (model: T2/sonnet)`. Escalations get their own entry with the trigger. No unlogged model switches — retro reads these to tune this table.

## 4. Escalation Rules

1. **Retry escalation:** a stage failing its exit checklist twice at its default tier re-runs at +1 tier, with the failed rules as corrective constraints. (First retry stays at-tier — most failures are attention, not capability.)
2. **Loop escalation:** re-entry via a loop (`L_QA`, `L_REVIEW`, `L_DESIGN`/`L_REVISION` second iteration onward) escalates the **producing** stage's model +1 tier — the bounce is evidence the work needed more depth, not more speed.
3. **Debug escalation:** T2 → T3 when 2 hypotheses die without narrowing the mechanism, or at half the timebox — whichever first.
4. **No mid-stage downgrade.** Tier changes happen at stage boundaries only; a stage finishes at the tier it escalated to.
5. **De-escalation:** next BRD's same stage returns to the table default — escalations don't ratchet permanently; recurring escalation of the same stage across BRDs = routing-table bug, fix it here (minor bump).
6. **T4 reserve:** cross-BRD blast-radius architecture, toolkit/machine contract changes, ceiling-breach postmortems, security-critical review passes. Never routine stages.
7. **Ceiling breach:** → `Blocked` per machine rules regardless of tier; post-unblock resume runs the failed stage at T3 minimum.

## 5. Cross-Model Verification Pairs

Verification stages should run a **different model** than the stage they verify — same-model blind spots survive same-model review:

| Producer | Verifier |
|----------|----------|
| Implementation (T2/T1) | Tech Review (T3) |
| Prototype (T2) | Self-audit (T3) |
| Any escalated-T3 production | Verifier stays T3 but MUST be a fresh session (§6 rule 3) |

QA's independence is procedural (evidence rules) more than model-tier; keep QA at T2 but never the same session that implemented.

## 6. Handoff Rules Between Stages

1. **The BRD is the only channel.** No session memory crosses a stage boundary — handoff completeness equals the producing stage's exit checklist, nothing more is transferable. If the next stage needs something unwritten, that's a back-transition, not a question to a dead session.
2. **Stage-enter read (any model, any tier):** properties → S16 tail (last ~10) → the stage's declared input sections → open `Affects:` entries for owned sections. Then work.
3. **Fresh-session boundaries:** Tech Review, Self-audit, and QA always start fresh sessions (no shared context with the producer) — cross-model pairing (§5) plus fresh context is the double blind that makes machine self-review worth anything.
4. **Continuity boundaries:** consecutive same-role stages (Analysis→Planning handover summary, Implementation slices) may share a session at the same tier; the S16 stage-exit entry is still mandatory — session sharing never substitutes for the written handoff.
5. **Escalation handoff:** the +1-tier re-run receives the failed checklist items + the prior attempt's S16 trail as explicit corrective constraints — escalation without the failure evidence wastes the stronger model.
6. **Human gates are model-free:** gate packages are assembled by whatever tier ran the stage; the orchestrator presents; approval scope rules (stale-approval) are tier-independent.

## 7. Cost Posture

Solo-dev default: the table above biases spend toward Planning / UX / Dev Planning / Review — the four places a wrong call multiplies. Everything mechanical rides T1/T2. Expected profile: ~15% of tokens at T3 doing ~80% of the damage prevention. Tune with retro evidence (S16 model logs), not vibes.
