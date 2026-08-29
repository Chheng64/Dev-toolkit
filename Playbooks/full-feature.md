# Playbook — Full Feature

> **Module:** Playbooks — the only layer allowed to compose. The default path: one BRD, Ready → Released, all 13 stages.
> **Machine:** [workflow-state-machine](../Architecture/workflow-state-machine.md) end to end.

## Sequence

| # | Status | Do | Gate / Exit |
|---|--------|-----|-------------|
| 0 | `Backlog`→`Ready` | Seed BRD ([feature-request](../Templates/feature-request.md)), set Project/Priority, tick Ready | human tick |
| 1 | `Analysis` | [business-analysis](../Workflows/business-analysis.md) — S01–S06 | [analysis](../Checklists/analysis.md) ✚ Clarification Gate if blocking |
| 2 | `Planning` | [product-planning](../Workflows/product-planning.md) — prioritize, recommend | **Direction Gate** |
| 3 | `Design` | [ux-workflow](../Workflows/ux-workflow.md) → [ui-workflow](../Workflows/ui-workflow.md) (design states 04–08) | [ux-review](../Checklists/ux-review.md), [ui-review](../Checklists/ui-review.md), [design-qa](../Checklists/design-qa.md) `pass` |
| 4 | `Design Review` | [design-review](../Workflows/design-review.md) — Run Local, hook table as the packet, limitations at full strength; REVISION routing on changes | **Design Gate** |
| 4b | `Design Review` *(only if `design.handoff_required`)* | [flow-visualization](../Workflows/flow-visualization.md) — derive the navigation map from the Screen Contract, validate, present the report | [flow-visualization](../Checklists/flow-visualization.md) → **Developer Handoff Gate** |
| 5 | `Dev Planning` `FE` | [frontend-planning](../Workflows/frontend-planning.md) — adapter boundary, fixture set, no server decisions | [development-ready](../Checklists/development-ready.md) |
| 6 | `Implementation` `FE` | [implementation](../Workflows/implementation.md) + [security-certification](../Workflows/security-certification.md) | `C_SECURITY` |
| 7 | `QA` `FE` | [qa](../Workflows/qa.md) mock-backed mode; S13 `Verified on: mocks` | [qa-testing](../Checklists/qa-testing.md) |
| 8 | `Tech Review` `FE` | [code-review](../Workflows/code-review.md) | [code-review](../Checklists/code-review.md) → `C_ISOLATION` |
| 9 | `PR` `FE` | [git](../Workflows/git.md) — PR from [template](../Templates/pull-request.md); exposure control in place | CI ✅ |
| 10 | `Human Review` `FE` | [product-validation](../Workflows/product-validation.md) — issue `CTR-<brd-id>-v<n>` (`issued_against` the PR head sha); walk the running app | **Product Gate** |
| 11 | `Merged` `FE` | merge; record the product freeze sha (`VERSION.product_freeze` + S16); **flip to `Phase: BE`**, reset loop counts | phase flip logged S16 |
| — | — **Phase 1 → Phase 2 seam** — | the Shared Contract (`CTR-<brd-id>-v<n>`) is the only channel; back-end planning reads it, S03/S06/S07/S09 and screen-contract `demanded:` blocks — never front-end source (`C_ISOLATION`) | — |
| 12 | `Dev Planning` `BE` | [backend-planning](../Workflows/backend-planning.md) — derive from the contract; front-end source is not an input | [development-ready](../Checklists/development-ready.md) |
| 13 | `Implementation` `BE` | [implementation](../Workflows/implementation.md) → [backend-integration](../Workflows/backend-integration.md) + certification | `C_SECURITY` |
| 14 | `QA` `BE` | [qa](../Workflows/qa.md) integrated mode; re-verify every `mocks` row | [integration-parity](../Checklists/integration-parity.md) → `C_PARITY` |
| 15 | `Tech Review` `BE` | [code-review](../Workflows/code-review.md) | [code-review](../Checklists/code-review.md) → `C_ISOLATION` |
| 16 | `PR` `BE` | [git](../Workflows/git.md) — PR from [template](../Templates/pull-request.md) | CI ✅ |
| 17 | `Human Review` `BE` | Present PR decision package | **Final Gate** |
| 18 | `Merged` `BE` | merge mechanics | merged, main green |
| 19 | `Released` | [release](../Workflows/release.md) | [release](../Checklists/release.md) |

## Loop wiring (bounded, per machine §5)

- Design Review changes → REVISION triage → root-cause design state → design-qa → Design Review (`L_DESIGN` ≤3)
- QA blockers → Implementation (`L_QA` ≤3) · Review changes → Implementation (`L_REVIEW` ≤2) · Final changes → Implementation → QA → Tech Review → PR (`L_HUMAN` ≤3)
- `not-certified` → Implementation, counted against `L_QA`. Any loop that pushes commits re-issues the certificate against the new head (delta re-verification; full pass when the delta touches `high_risk_scopes`).
- Any ceiling → `Blocked` + escalation summary. Never silent continuation.
- Step 4b is skipped by default (`design.handoff_required: false`) and the skip is logged S16 — a fourth gate is never imposed silently. Turn it on when the builder is not the designer.
- Loop ceilings are per phase and reset at the flip (logged S16). `L_CONTRACT` ≤2 is the exception —
  it counts across the flip, because it is the flip.
- A server constraint contradicting approved front-end behaviour → `L_CONTRACT`: `product` token
  dropped, back to `Dev Planning` (`Phase: FE`), contract reissued as `v<n+1>`. **The return path
  is a full second Phase-1 segment**: steps 5–10 re-run and `product` is re-earned at a **second
  Product Gate**; that Human Review is again `Merged (FE)`, which flips `Phase` back to `BE` and
  resets `Loop Count` a second time — so each `L_CONTRACT` round trip hands Phase 2 fresh
  `L_QA`/`L_REVIEW`/`L_HUMAN` budgets, bounded only by `L_CONTRACT`'s own ceiling of 2.

## Session pattern (solo reality)

- One stage per session is the healthy default; stage boundaries are the resume points (state fully in Notion).
- Session start: orchestrator entry §2 (read properties + S16 tail; announce position + plan).
- Human gates batch fine: run other BRDs' stages while one waits on you.

## Rules

- No stage skipped, no gate pre-granted, however small the feature feels — small features use small *content*, not fewer *gates* ([hotfix](hotfix.md) is the sanctioned reduced path for genuine emergencies).
- Findings land in the BRD at discovery time, every stage — the living-doc invariant.
- Stage inputs missing → back-transition, never improvise (orchestrator anti-rules).
- Bound-frame deviations on arrangement or hierarchy are **findings + Product Owner rulings before landing**, never "composition choices" (`M6` extended to layout; screen-contract §4a). Lane briefs say so.
- A Product Owner handoff that authorises implementation without the Design Gate **does not remove design review**: the fidelity review (`M7`) runs before device proof and is logged S16.
- The two phases communicate through the Shared Contract only. Back-end planning does not read
  front-end source, and back-end implementation does not edit the contract (`C_ISOLATION`).
- A front-end merged on mocks is never user-reachable: `phases.fe_exposure` holds until Phase 2
  removes it, in the BE PR, checked by `C_PARITY`.
- `Phase: single` BRDs run one pass end to end: `Dev Planning` covers whatever the BRD's scope
  needs — `frontend-planning`, `backend-planning`, or both — the pre-v2.0 behaviour `C_SERVER_SCOPE`
  preserves for BE-only BRDs as much as no-server ones. No mock adapter, no fixture set, no exposure
  control, and no contract are ever created; S13 carries the `integrated` column only, never
  `mocks`. `Human Review` is the **Final Gate**, not the Product Gate — there is no second phase to
  gate toward.
