# Standard — Performance

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all code; verified at review dimension 5 + [../Checklists/performance.md](../Checklists/performance.md).

## Rules

### Doctrine
1. **Measure before optimizing; measure after to prove it.** Claims without numbers don't merge. Profile/trace/Lighthouse per claim type.
2. Budgets where the BRD declares them (S03 perf ACs) are ACs — verified at QA like any criterion. Default working targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 on production-like data.
3. Structural waste is banned by default (rules below) — that's not premature optimization, it's not digging holes. Micro-tuning beyond that requires a measurement.

### Server & data (where most wins live)
4. No N+1: list rendering fetches its data in bounded batch queries; ORM lazy-loading in loops is a review finding.
5. Every list surface paginated/limited ([api-design.md](api-design.md) rule 12); every query indexed for its access pattern (checked when the query is written, not when it's slow).
6. Parallelize independent awaits (`Promise.all`); waterfalls only where data depends on data ([nextjs.md](nextjs.md) rule 8).
7. Cache with explicit semantics; invalidation declared with the mutation. Stale-while-revalidate over cold refetch where UX allows.

### Client
8. Server Components carry the static weight; client bundles stay lean — new heavy dependency in a client island needs size justification (`next-bundle-analyzer` evidence at review).
9. Code-split at route + heavy-widget boundaries (`dynamic()` for below-fold/conditional heavyweights: editors, charts, players).
10. Images via `next/image` with dimensions (zero CLS), fonts via `next/font` (no FOIT swap chains), assets compressed.
11. Re-render hygiene: stable refs across memo boundaries, state colocated at lowest altitude ([react.md](react.md)) — but `memo`/`useMemo` added on profiler evidence, not reflex.
12. Lists >~100 rows virtualize; expensive work off the interaction path (defer, `startTransition`, worker) — INP protects tap-to-feedback.

### Perceived performance
13. Loading states designed (S09), skeletons reserve layout (CLS), optimistic updates where mutation semantics allow rollback.

## Anti-patterns

- Optimizing without a profile; "should be faster" as a merge argument.
- `useMemo`/`memo` confetti on unmeasured components — complexity cost, zero proven gain.
- Unbounded `findMany` behind a UI that "will never have many" — it will.
- Waterfalled sequential awaits of independent data.
- Perf regressions ratcheted in silently — budgets exist to make the ratchet visible.
