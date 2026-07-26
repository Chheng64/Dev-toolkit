# Checklist — UX Review

> **Gate for:** design states 04–05 exit ([ux-workflow](../Workflows/ux-workflow.md)) before UI planning. Mirrors design-machine validations — normative source: [design-state-machine](../Architecture/design-state-machine.md).

## Traceability
- [ ] Every primary task traces to a prioritized S03 requirement (zero orphan tasks)
- [ ] Every prioritized requirement with UX surface is covered by ≥1 task
- [ ] State/task names machine-style, stable (`SYNC_FAILED`) — code will reuse them

## State coverage
- [ ] Every task: happy path + ≥3 non-happy-path states (error/empty/loading/interrupted/offline/permission-denied as applicable)
- [ ] S09 matrix complete per task — table form, not prose
- [ ] Async boundaries have explicit intermediate states with planned user-facing language (no raw internal errors)
- [ ] Interruption points (auth, redirect, payment, tab-close) state what intent/context is preserved on return

## Flows
- [ ] Every flow state reachable (no orphans)
- [ ] No dead end without written terminal justification
- [ ] Every S09 state has a recovery route naming destination + preserved state
- [ ] Every decision point: mutually exhaustive branches (no gaps, no overlaps)
- [ ] Transitions annotated with triggers + guards

## Strategy
- [ ] Accessibility strategy present, feature-specific (focus order, announcements, motion risks) — not boilerplate
- [ ] Reduced-motion behavior decided at strategy level
- [ ] Zero screen-level/visual content in S07/S09 (altitude respected)
- [ ] S16 stage-exit entry written
