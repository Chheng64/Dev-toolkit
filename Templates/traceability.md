# Template — Traceability Map

> **Module:** Templates
> **Produced by:** design state 07 ([ui-workflow](../Workflows/ui-workflow.md) §B.7) · **Lives in:** `design/prototype/<brd-id>/traceability.md`
> **Consumed by:** state 08 (V1/V2 evidence), the Design Gate (**this table is the review packet**, G2), state 12 (deep links, E4), state 11 (completeness, P3)
>
> Every prototype element traces to a spec entry (V2), and every flow state is represented (V1). A state with no **deep-link hook** cannot be audited or demonstrated — V5 fails on the missing hook, not on the missing state.

```yaml
---
artifact: traceability
version: trace-<brd-id>-NN
produced_by: prototype
reads_versions:
  S03: <rev>
  S07: <rev>
  S09: <rev>
  S08: <ui-<brd-id>-NN>
brd: <brd-id>
---
```

## Requirement → task → flow → component → prototype element

| Req | Task | Flow | UI component | Prototype element / hook |
|---|---|---|---|---|
| R-x1 | TK1 | F1 | <component from the S08 inventory> | `<selector>`, `<fn()>`, `?hook=` |

## Flow state → prototype representation (V1)

| Flow node | SCR-id | Representation | Hook |
|---|---|---|---|
| <state name> | SCR-nnn | default entry \| selector \| overlay | `?view=…` |

*Every node in S07, including recovery and non-happy-path states.*

## Transition → wiring (V4)

| Flow transition | Wired as | Destination paints |
|---|---|---|
| <from> → <to> (D<n>) | `<fn()>` | yes — <evidence> |

## Decision → implementation

| Decision | Where it lives |
|---|---|
| D-x1 <text> | `<const / selector / guard>` |

## Superseded — stripped, not left dead (B7)

| Removed | Superseded by | Selectors / keys stripped |
|---|---|---|
| <component> | <revision> | `.a`, `.b`, `strKey1`, `fnName()` |

*A rebuild that cannot produce this list did not do the strip.*

## Un-specced additions

<none — or each one named, with the spec entry it needs before V2 can pass.>

## Verification record (B8)

<node --check · hex inventory · views driven · screenshots read · sweeps run (duplicate keys, boundary call sites, per-glyph font) · console sweep.>
