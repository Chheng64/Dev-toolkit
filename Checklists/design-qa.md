# Checklist — Design QA (Self-Audit)

> **Gate for:** design state 08 ([ui-workflow](../Workflows/ui-workflow.md) audit step) → `Design Review`. The machine gating itself before spending human attention. Verdict `pass` requires every box.

## Prototype completeness
- [ ] Every S07 flow state represented in the prototype (walk the list, tick each)
- [ ] Every transition wired per flows — including all recovery routes
- [ ] Every S09 state **reachable by interaction** in the served prototype (not just built)
- [ ] `run-local.sh` serves it; player walkable start-to-finish without console errors

## Conformance
- [ ] Every prototype element traces to a spec entry (zero un-specced additions)
- [ ] DS pre-build check evidence: every element maps to DS token/primitive/component or a logged Extension Note
- [ ] Zero hardcoded values where a DS entry exists (grep the prototype for raw hex/px against token list)
- [ ] Cross-state consistency: naming, hierarchy, spacing rhythm, motion language uniform

## Audit dimensions
- [ ] Accessibility audit executed (not skipped): keyboard walk complete, focus visible + managed, contrast token-pairs verified, semantics correct
- [ ] Reduced-motion variant exercised (OS flag / emulation) — every animation has its fallback
- [ ] Every design-relevant AC marked met/unmet **with evidence**
- [ ] Findings classified `blocker`/`major`/`minor` in S14 design-audit subsection

## Verdict
- [ ] Zero unresolved `blocker` findings
- [ ] Known limitations listed transparently (they go in the gate package)
- [ ] Verdict `pass`/`fail` recorded with rationale in S14 + S16
