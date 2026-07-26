# Prompt — Architecture

> **Use:** architecture decision inside Dev Planning, or standalone architecture review of existing code. Alternatives explicit, trade-offs written.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>. Role: <Frontend |
Backend | Full Stack> Engineer. Standards loaded: <relevant Standards/ files>.

Decision needed: <one sentence — e.g. "state architecture for the identity
resolution flow" / "review current checkout module structure">.

Ground rules:
- Existing patterns first: read <dirs/files> before proposing; new patterns
  need a written reason the existing one fails.
- Present exactly <2–3> viable options: shape, trade-offs, cost-to-change-later.
- Recommend one. State what evidence would flip the recommendation.
- Boring beats novel at equal fit (Standards/code-quality altitude rules).
- Name the seams: what stays swappable, what this decision welds shut.

Output: S10 architecture subsection per Templates/technical-specification.md;
rejected options → one line each in S16. Diagrams as mermaid where flow/
sequence clarifies.
```

## Notes

- Architecture answers "what shape and why", never "here's every possible shape" — a survey without a recommendation is an unfinished pass.
- For state machines: enumerate states/transitions/guards explicitly, reuse S07 names ([naming](../Standards/naming-conventions.md) rule 8).
- Standalone reviews route findings via S16 `Affects: S10` on the owning BRD, or seed a refactor BRD.
