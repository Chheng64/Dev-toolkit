# Checklist — Performance

> **Runs inside:** code-review dimension 5; full pass on perf-scoped BRDs. Claims need numbers ([performance standard](../Standards/performance.md)).

## Structural (every BRD — banned-waste sweep)
- [ ] Zero unbounded list queries (every `findMany`-class call limited/paginated)
- [ ] Zero N+1 patterns (no per-item queries in render/loop paths)
- [ ] Independent awaits parallelized; waterfalls only where data depends on data
- [ ] Every fetch declares cache semantics; every mutation declares invalidation
- [ ] Lists >~100 rows virtualized or explicitly justified

## Client weight
- [ ] New client-island deps size-justified (analyzer evidence if non-trivial)
- [ ] Heavy conditional/below-fold widgets code-split (`dynamic()`)
- [ ] Images via `next/image` with dimensions; fonts via `next/font`
- [ ] No server-capable work shipped to the client bundle

## Render & interaction
- [ ] No effect-chain state cascades (effect→setState→effect)
- [ ] Memo/useMemo additions backed by profiler evidence (confetti removed)
- [ ] Expensive work off the interaction path (INP: transitions/defer/worker)
- [ ] Skeletons/placeholders reserve layout — zero intentional CLS

## Budgets (when S03 declares perf ACs — verified like any AC)
- [ ] Measured on production-like build + data, method recorded
- [ ] LCP / INP / CLS vs declared budgets: numbers in S13, pass/fail explicit
- [ ] Regression vs pre-change baseline stated (before/after)
