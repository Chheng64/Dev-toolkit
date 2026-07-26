# Prompt — Refactoring

> **Use:** behavior-preserving structure change — its own BRD (or explicit slice), never smuggled into feature work.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID — refactor-scoped>.
Role: <matching engineer skill>. Branch: <refactor/... per git-strategy>.

Target: <what structure changes and WHY — the smell, with evidence:
duplication count, file length, dependency tangle, standard violation>.
Explicit non-goals: behavior change, new features, drive-by fixes.

Method:
1. Characterize first: tests covering current behavior of the touched
   surface exist and pass — write missing ones BEFORE moving anything.
2. Small reversible steps; each commit compiles + passes (bisectable).
3. Consumers migrate in the same change — no half-migrated dual patterns
   left behind (design-system rule 8 / folder-structure promotion path).
4. Rule of three governs extraction; wrong abstraction > duplication check
   at every extraction (code-quality rule 11).
5. Behavior delta discovered mid-refactor → STOP, it's a bug or a feature;
   file it (S16/bug-report), don't absorb it.

Close: suite green, before/after structure summary in S12, S16 entry
(what moved, why, what to watch).
```

## Notes

- A refactor with no failing smell evidence is churn — decline it in Analysis.
- Perf-motivated changes are performance work (measure-first), not refactoring — different prompt, different proof.
- Standards updated mid-refactor (pattern proved out) → toolkit change proposal, not silent local divergence.
