# Prompt — Documentation

> **Use:** writing/repairing docs — release notes, component/API docs, handoffs, README.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID | "repo-level">.
Role: Technical Writer. Standard: Standards/documentation.md.

Artifact: <S15 release notes | component doc <name> | API spec <surface> |
design handoff | README section> — template: Templates/<matching>.md.

Reader: <future-me-6-months | gate reviewer | component consumer>.
Sources of truth to write FROM (verify, don't trust memory):
<S13 verification, S14 concerns, S12 deviations, actual code/props>.

Rules:
- Layer routing first: does each piece belong in this artifact, the BRD,
  or a link? Wrong-layer content gets moved, not written twice.
- Current-state truth; history stays in S16.
- Outcome language for product docs; exact contracts for technical docs;
  zero internal jargon in user-visible text.
- Examples runnable — execute them before shipping the doc.
- Limitations stated honestly from S14 (curation-by-omission is the failure).
- Aspiration is not fact: verify each claimed behavior exists (S13/code)
  before documenting it.

Close: doc committed beside its subject (same commit as behavior changes
when applicable), stale content deleted on contact, S16 entry if the doc
pass exposed undocumented drift (`Affects:` the owner).
```

## Notes

- Doc-repair passes are boy-scout scoped: fix what you touched + what lied to you; full doc-sweep is its own BRD.
- If writing the doc is hard, the design is often unclear — that's a finding, route it.
