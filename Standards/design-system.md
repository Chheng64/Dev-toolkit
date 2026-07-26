# Standard — Design System

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** every project's DS (tokens + primitives + components, code-first, shadcn/ui-based; Figma library mirrors where one exists).
> **Workflow:** structural changes go through [../Workflows/design-system-workflow.md](../Workflows/design-system-workflow.md).

## Rules

### Structure
1. Three layers, dependencies downward only: **tokens** (color/space/type/radius/motion in `@theme` + semantic vars) → **primitives** (Button, Input, Card — shadcn base) → **composites** (feature-agnostic assemblies: FormField, EmptyState, PageHeader).
2. Code is the implementation source of truth. Figma (when present) is the UX/interaction guidance layer — divergence is a bug filed against whichever side is wrong.
3. Every component lives in the DS dir per [folder-structure.md](folder-structure.md), documented per [../Templates/component-documentation.md](../Templates/component-documentation.md).

### Component quality bar (nothing ships below it)
4. Full interaction states: default, hover, focus-visible, active, disabled, loading, error/invalid — as applicable, all designed, not discovered.
5. A11y built in: keyboard operable, visible focus, correct roles/names, contrast-passing token pairs, `motion-reduce` variants ([accessibility.md](accessibility.md)).
6. Themed: light + dark via semantic vars from birth — no "dark later".
7. Variants via `cva`; props are the API — documented, typed, minimal. Boolean-prop explosions get redesigned into variants/slots.

### Change discipline
8. DS is an API: **add** freely (minor), **change** carefully (survey + migrate all usages in the same change), **remove** via deprecation note first.
9. Extension altitude: token < variant < new component — smallest that solves it. New component needs ≥2 plausible usage sites or 1 + trajectory.
10. Rejection is a valid outcome and ships with a composition recipe.
11. Every asset records its origin (BRD ID) in its doc.

### Consumption (feature code)
12. Compose from DS vocabulary only. Can't name the primitive you need → Extension Note, not inline styling.
13. No feature-local wrappers that re-skin DS components ("BillingButton") — variants belong in the DS or nowhere.
14. Token references only in feature code; raw values are review blockers ([tailwind.md](tailwind.md) rule 3).

## Anti-patterns

- DS as dumping ground: single-use feature composites promoted without reuse trajectory.
- Silent forks: copied component + one tweak, now two sources of truth.
- Doc rot: props changed, doc not — undocumented = doesn't exist, will be reinvented.
- Figma and code drifting with nobody assigned the reconcile ([design-system-workflow](../Workflows/design-system-workflow.md) owns it).
- "Temporary" hardcoded values with permanent lifespans.
