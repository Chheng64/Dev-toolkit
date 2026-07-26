# Prompt — Research

> **Use:** evidence-gathering pass (inside Analysis, or standalone spike). Citations or it didn't happen.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>. Role: Business Analyst
(research responsibilities per Workflows/business-analysis.md steps 5–6).

Research questions (derive more from S03 if thin):
1. <question tied to a goal/requirement>
2. …

Fan out by modality: domain practice · competitors/analogs · interaction
patterns · technical constraints. For each finding:
claim → evidence → resolvable source. No source, no claim.

Rules of the pass:
- Contradictions between sources: list openly, never smooth over.
- Map every finding to a goal/requirement ID; unmappable → flag as scope signal.
- Distinguish evidence from vendor marketing; note confidence.
- Gaps you couldn't close → explicit `gap` entries, not silence.

Write to S05 (dated append entries). S16 entry: research pass summary +
anything that contradicts the request's premise.
```

## Notes

- Research answers the BRD's questions — a pass that returns generic domain prose failed; re-aim at the specific goals.
- Fabricated/unresolvable citations are the cardinal failure ([analysis checklist](../Checklists/analysis.md) blocks on them).
- Standalone technical spikes (no BRD yet): same rigor, output seeds a feature-request instead.
