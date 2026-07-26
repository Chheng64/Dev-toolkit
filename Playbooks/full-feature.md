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
| 4 | `Design Review` | Serve prototype (run-local), present package + limitations | **Design Gate** |
| 5 | `Dev Planning` | [frontend-planning](../Workflows/frontend-planning.md) ∥ [backend-planning](../Workflows/backend-planning.md) (backend only if server scope) | [development-ready](../Checklists/development-ready.md) |
| 6 | `Implementation` | [implementation](../Workflows/implementation.md), slice by slice | implementation criteria |
| 7 | `QA` | [qa](../Workflows/qa.md) — evidence per AC, S09 walk | [qa-testing](../Checklists/qa-testing.md) |
| 8 | `Tech Review` | [code-review](../Workflows/code-review.md) — 7 dimensions | [code-review](../Checklists/code-review.md) |
| 9 | `PR` | [git](../Workflows/git.md) — PR from [template](../Templates/pull-request.md), CI green | CI ✅ |
| 10 | `Human Review` | Present PR decision package | **Final Gate** |
| 11 | `Merged` | git merge mechanics (approval-currency check) | merged, main green |
| 12 | `Released` | [release](../Workflows/release.md) — deploy, smoke, S15, sweep | [release](../Checklists/release.md) |

## Loop wiring (bounded, per machine §5)

- Design Review changes → REVISION triage → root-cause design state → design-qa → Design Review (`L_DESIGN` ≤3)
- QA blockers → Implementation (`L_QA` ≤3) · Review changes → Implementation (`L_REVIEW` ≤2) · Final changes → Implementation → QA → Tech Review → PR (`L_HUMAN` ≤3)
- Any ceiling → `Blocked` + escalation summary. Never silent continuation.

## Session pattern (solo reality)

- One stage per session is the healthy default; stage boundaries are the resume points (state fully in Notion).
- Session start: orchestrator entry §2 (read properties + S16 tail; announce position + plan).
- Human gates batch fine: run other BRDs' stages while one waits on you.

## Rules

- No stage skipped, no gate pre-granted, however small the feature feels — small features use small *content*, not fewer *gates* ([hotfix](hotfix.md) is the sanctioned reduced path for genuine emergencies).
- Findings land in the BRD at discovery time, every stage — the living-doc invariant.
- Stage inputs missing → back-transition, never improvise (orchestrator anti-rules).
