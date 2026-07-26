# Standard — React

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all React code (assumes React 18+ with Server Components via Next.js — see [nextjs.md](nextjs.md)).

## Rules

### Components
1. Function components only. One exported component per file (small private helpers in-file are fine).
2. Props typed explicitly, destructured in the signature; no `React.FC`.
3. Components render state; they don't own business logic. Logic lives in hooks/lib functions that are testable without rendering.
4. Composition over configuration: children/slots over boolean-prop explosions (`variant` props from the DS are the sanctioned configuration).
5. UI states mirror the UX enumeration: a component consuming async data renders every S09-relevant state (loading/empty/error) explicitly — no implicit blank renders.

### State
6. Smallest sufficient altitude: local `useState` < lifted state < context < store. Promotion needs a reason written in S10.
7. Derive, don't sync: values computable from existing state/props are computed in render (memoized if measured), never mirrored into `useState` + effect.
8. `useEffect` is for synchronizing with external systems (DOM, subscriptions, network side effects) — not for reacting to state changes that belong in event handlers. Every effect has a cleanup or a comment stating why none is needed.
9. Server state (fetched data) is not `useState` — it belongs to the framework's data layer (RSC props, or the project's query lib) with caching semantics decided in planning.

### Correctness
10. Keys are stable identities, never array index on reorderable/mutable lists.
11. Stable references for props crossing memo boundaries — but memoize because a profile said so, not by reflex.
12. All interactive elements are real elements (`button`, `a`, `label`) — no clickable `div`s. A11y standard applies at component level ([accessibility.md](accessibility.md)).
13. Abortable async in components: effects that fetch handle unmount/abort; no setState-after-unmount warnings tolerated.

### Hooks
14. Custom hooks for any stateful logic used twice, or complex enough to test in isolation. Named `useX`, returning stable shapes.
15. Hook deps are honest — no `eslint-disable exhaustive-deps` without written justification; restructure instead.

## Anti-patterns

- `useEffect`-driven data flow chains (effect sets state → triggers effect → …) — model the state machine instead.
- Prop drilling ≥3 levels of data one leaf needs → composition or context, decided consciously.
- God components mixing fetch + transform + layout + interaction — split by responsibility.
- Copy-pasted variant components differing by styling only — that's a DS variant, not a new component.
- Conditional hook calls, hooks in loops — structural, non-negotiable.
