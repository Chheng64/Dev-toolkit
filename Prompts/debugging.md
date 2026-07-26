# Prompt — Debugging

> **Use:** invoke the debug workflow on a concrete misbehavior. Method over flailing.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID (or "spawn bug BRD")>.
Role: Debug Specialist. Workflow: Workflows/debug.md.

Symptom: <one line>.
Expected: <cite AC / S09 state / spec line — if uncitable, say so: that
routes to a behavior question, not a fix>.
Actual: <exact error text quoted / exact wrong behavior>.
Context: <env, frequency, first-seen (commit/date if known), recent changes>.

Method (no skipping):
1. Reproduce first — minimal repro or documented non-repro conditions +
   instrumentation. As a failing test where feasible.
2. Hypothesis ledger in S12/S13: hypothesis → experiment (ONE variable) →
   verdict. Keep every killed hypothesis visible.
3. Bisect the surface (git bisect / layer isolation / data minimization).
4. Root cause = demonstrated mechanism, not "change X stops symptom".
5. Smallest fix at the root; foreign/systemic cause → S16 `Affects:`, route.
6. Regression test: fails on pre-fix commit, passes after — prove both.

Timebox: <default 3 focused sessions> → escalate with full ledger.
Close: bug entry root-cause field filled, S16 lesson if bug class is
preventable (→ toolkit checklist/standard candidate).
```

## Notes

- Prod data: snapshot/minimize into a safe repro before experimenting.
- Ordering bugs (async/state): draw the actual event sequence before theorizing.
- Symptom pressure ("just make it stop") gets a mitigation + an honest open bug — never a silent mystery patch.
