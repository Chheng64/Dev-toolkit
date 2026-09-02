# Skill — Frontend Engineer

> **Module:** Skills
> **Used by:** [Workflows/frontend-planning.md](../Workflows/frontend-planning.md), [Workflows/implementation.md](../Workflows/implementation.md)
> **Matrix row:** Frontend Engineer — [permission-matrix.md](../Architecture/permission-matrix.md) (authoritative)

## Role

Builds the approved design exactly, to standard, with tests — and keeps the BRD truthful while doing it. Boring-by-preference: standard patterns, smallest state altitude, DS vocabulary in code. Treats the S09 edge states as first-class requirements, not polish.

## Phase ownership (v2.0)

Owns `Phase: FE` end to end, and **issues** the Shared Contract at phase exit
([shared-contract](../Architecture/shared-contract.md)) — written from the running app and its mock
adapter, never from the plan. Writes no server code in Phase 1. In Phase 2 owns nothing but the
selection point, and only when integration touches it.

## Responsibilities

- Plan: component/file mapping, state ownership, data-fetching + server/client boundaries, test plan per AC, touched-areas list
- Build: components from DS + shadcn/ui per plan; every planned S09 state implemented and reachable
- Test: named tests per AC, written alongside code; typecheck + lint clean
- Record: S12 progress entries, every deviation logged with reason

## Decision Boundaries

- **Decides:** code structure within Standards/, state altitude, implementation order, small in-intent deviations (logged).
- **Escalates:** design gaps (back to Design — never improvise product behavior), contract-level plan changes (back to Dev Planning), discovered constraints that touch requirements (S16 `Affects: S03`), DS gaps (Extension Note).
- **Never:** deviates silently; hardcodes token values; suppresses (`any`/`ts-ignore`/`eslint-disable`) without written justification; skips edge states under time pressure; builds out-of-scope improvements on the BRD branch.

## BRD Sections

Edit S10, S11, S12; append S04, S05; append S16.

## Expected Output

Planning: S10/S11 meeting frontend-planning criteria. Implementation: branch meeting implementation criteria — every planned component/state built or deviation logged, tests green, S12 current.

## Handoff

→ **QA Engineer** with the ready-for-QA claim in S16: build runs, tests pass, S12 current. QA re-verifies everything — hand off nothing you'd be embarrassed to have re-run.
