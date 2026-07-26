# Workflow — Code Review

> **Module:** Workflows
> **Stage:** `Tech Review` (lifecycle state 08)
> **Skill:** Code Reviewer (Security Reviewer / Performance Optimizer / Accessibility Specialist append on their dimensions)
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Review the full branch diff before it becomes a PR: correctness, standards conformance, security, performance, accessibility, DS conformance, maintainability. Machine gate before human gate — the user's Final Review attention is spent only on work that already passed here.

## Inputs

- QA exit: S13 all-pass, zero open blockers
- Full branch diff vs main; S10/S11 (plan conformance basis); S12 (deviation log)
- Standards/ + `project-overrides.md`

## Outputs

- S14 Review Summary — findings by dimension + severity, plan-conformance check, verdict `approve` / `request-changes` with rationale
- S16 — verdict record; systemic findings routed via `Affects:`

## BRD Sections It May Update

S14 (edit), S16 (append). Specialist roles: S14 (append), S05/S06/S10 (append per matrix).

## Responsibilities

1. **Plan conformance:** diff ⊆ plan + logged deviations. Unlogged out-of-scope changes → finding (process violation, not just code issue).
2. **Correctness:** logic errors, race conditions, unhandled promise/async paths, state bugs — read the code, don't skim the shape.
3. **Standards conformance:** react/nextjs/typescript/tailwind/naming/structure standards; suppressions justified; boundaries (server/client) sane.
4. **Security dimension:** input validation at boundaries, authz on every new surface, secrets, injection surfaces, raw-error leakage (error language must be normalized).
5. **Performance dimension:** render waste (unstable refs, missing memo where measured), bundle additions, unbounded queries, N+1, missing pagination.
6. **Accessibility dimension:** keyboard reachability, focus management, ARIA correctness, contrast tokens, reduced-motion variants present.
7. **DS conformance:** token references only, no one-off styling, extensions went through design-system workflow.
8. Classify findings `blocker`/`major`/`minor` + concrete fix direction. Verdict: zero blockers → `approve`; else `request-changes` → Implementation (`L_REVIEW`).

## Completion Criteria

- [ ] All seven dimensions reviewed — none skipped, each with explicit result (clean or findings)
- [ ] Every finding: location, severity, why it matters, fix direction
- [ ] Plan-conformance check done; unlogged deviations flagged
- [ ] Verdict written with rationale in S14
- [ ] S16 stage-exit entry written

## Failure & Loops

- `request-changes` → Implementation, ceiling 2 (`L_REVIEW`) → `Blocked` + escalation.
- Finding reveals plan-level flaw → S16 `Affects: S10` and route to `Dev Planning`, not a patch-in-review.

## Common Mistakes

- Reviewing the diff shape, not the behavior — approving well-formatted bugs.
- Style-nit flood drowning the one real blocker — severity discipline is the reviewer's craft.
- Re-litigating approved design/plan decisions — gaps route back via S16; taste disagreements don't.
- Skipping dimensions on "small" diffs — small diffs hide authz misses and error-leak paths just fine.
- Fixing while reviewing — reviewer files, implementer fixes; same boundary as QA.
- Rubber-stamping own recent code after a loop — re-review the changed area fully.

## Best Practices

- Read in execution order (entry → data → render), not file order.
- Ask of every new surface: who can call this, with what garbage, and what leaks when it fails?
- Check the diff's *absences*: missing tests for changed logic, missing error states, missing cleanup on unmount/abort.
- Findings reference standards by file+section — teaches the pattern, not just the instance.
- Two clean loops on the same area later? Note the pattern in S16 as toolkit-standard candidate.
