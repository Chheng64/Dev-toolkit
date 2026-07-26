# Workflow — Debug

> **Module:** Workflows
> **Stage:** Off-path — invocable from any stage (Implementation, QA, post-release incident) or standalone for production bugs
> **Skill:** Debug Specialist
> **Machine:** not a lifecycle state; runs inside the current stage's status, or under a dedicated bug BRD

## Purpose

Systematic root-cause work when behavior defies the plan: reproduce → isolate → prove cause → smallest fix → regression-proof → document. Replaces guess-and-rerun churn with method.

## Inputs

- Bug signal: failing S13 entry, incident report, or dev-time anomaly
- Access to the failing environment; repro context (data, env, timing)
- S10/S11 (expected architecture), S09 (expected behavior in edge states)

## Outputs

- Root-cause statement with proof (the falsifying experiment), in S13 (bug entry) or S12 (dev-time)
- Smallest viable fix + regression test named after the bug
- S16 — root cause, fix decision, alternatives rejected; systemic pattern → `Affects:` the owning section
- New edge case discovered → S09 (append)

## BRD Sections It May Update

S12 (append), S13 (append), S09 (append), S05 (append), S16 (append).

## Responsibilities

1. **Reproduce first.** No repro → no fix; instrument until it reproduces or document exact non-repro conditions with frequency. "Can't reproduce" with evidence beats a blind patch.
2. **State expected vs actual** precisely, anchored to S09/S03 — half of "bugs" are unspecified behavior; those route to `Affects: S07/S03`, not to a code fix.
3. **Hypothesize → falsify:** one variable per experiment; binary-search the surface (git bisect, layer isolation, data minimization). Record hypotheses killed — that's the audit trail that prevents re-treading.
4. **Prove the cause:** the fix must follow from a demonstrated mechanism, not from "this change makes the symptom stop."
5. **Smallest fix** at the root — not the widest patch at the symptom. Root cause in another BRD's territory / systemic → S16 `Affects:`, spawn or route; don't sprawl this branch.
6. **Regression test** that fails before the fix, passes after — named after the bug.
7. Timebox: no repro or no mechanism after a bounded effort (default ~3 focused sessions) → escalate in S16 with everything known; `Blocked` if it gates the stage.

## Completion Criteria

- [ ] Repro documented (or non-repro conditions + frequency + instrumentation left in place)
- [ ] Root cause stated with proving experiment
- [ ] Fix is smallest viable, at the root, within scope
- [ ] Regression test fails-before / passes-after — proven, not asserted
- [ ] BRD updated: bug trail (S13/S12), cause + decision (S16), new edge case (S09)
- [ ] Systemic findings routed via `Affects:`

## Common Mistakes

- Fixing the symptom where it surfaces instead of the cause where it lives.
- Shotgun changes — three edits at once, symptom gone, zero knowledge gained, regression guaranteed.
- "Works now" without knowing why — the bug isn't fixed, it's hiding.
- Debugging in production data recklessly — snapshot/minimize into a safe repro first.
- Skipping the regression test because the fix is "obvious" — obvious fixes are where regressions breed.
- Scope sprawl — refactoring everything ugly you meet on the way; note it, route it, stay on the bug.

## Best Practices

- Write the repro as a failing test immediately when possible — repro and regression test become the same artifact.
- Keep a visible hypothesis ledger in S12/S13 while working (hypothesis → experiment → verdict) — survives session death, prevents circular debugging.
- Read the error actually thrown, not the error you expect; quote it exactly in the trail.
- For async/state bugs: draw the actual sequence (who fires when) before theorizing — most "random" bugs are ordering bugs.
- After the fix: one-line S16 lesson if the bug class is preventable (lint rule? standard addition? checklist item?) — feed the toolkit.
