# Standard — Component Structure

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all React components (DS and feature).

## Rules

### File anatomy (top → bottom, consistent everywhere)
1. Order: imports (external → internal → types) → constants → schema/types → variants (`cva`) → component(s) → private helpers. Reader finds things by position.
2. One exported component per file ([react.md](react.md) rule 1). Private sub-components allowed in-file while they serve only this component; extract on second consumer.
3. Props interface named `<Component>Props`, declared above the component, JSDoc on non-obvious props. Spread-through props (`...rest` to DOM) typed via the element's ComponentProps.

### Size & altitude
4. A component has one job at one altitude: **layout** components arrange, **container** components wire data/state, **presentational** components render props. Mixing altitudes in one body is the split signal.
5. Soft ceiling ~150 lines / ~3 levels of JSX nesting — beyond it, extract sub-components or hooks. Hard smell: scrolling to understand one render path.
6. Conditional rendering: early returns for whole-state branches (loading/error/empty per S09), ternaries only for small inline forks, never nested ternaries in JSX.

### State placement
7. Async/state components render the full S09 state set explicitly — a discriminated union switch, not `{data && ...}` optimism.
8. Logic beyond trivial handlers lives in a hook or lib function the component calls — component bodies read as: derive → branch → render.
9. Variants/styling via `cva` at the top of the file; className merging via `cn` at the single spread point; no class logic scattered through JSX.

### Contracts
10. Accept the narrowest props that do the job (id + fields used, not whole entities "for convenience") — narrow props = honest dependencies = cheap tests.
11. Callbacks communicate events up (`onRetry`, `onDismiss`); components don't reach into parents' concerns.
12. `forwardRef` + prop spread for DS primitives meant to compose; feature components only when a real consumer needs the ref.

## Anti-patterns

- The 400-line component that fetches, transforms, branches, and renders — four jobs, four homes.
- Boolean-prop APIs (`compact`, `borderless`, `inverse`, `mini` …) — that's `cva` variants asking to exist.
- `{isLoading ? A : isError ? B : isEmpty ? C : D}` chains — early returns or a state switch.
- Props named for the caller's context (`sidebarUser`) instead of the component's contract (`user`).
- Extracting single-use "reusable" components upward before a second consumer exists (premature promotion — see [folder-structure.md](folder-structure.md) rule 3).
