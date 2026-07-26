# Template — Technical Specification (S10 structure)

> **Use:** structure for S10 written at Dev Planning (frontend + backend subsections as scoped). Big enough decisions only — this is the plan of record, not a diary.

```markdown
## S10 · Technical Plan & Architecture

### Approach
<3–6 sentences: the shape of the solution and why this shape. Alternatives
considered → one line each + why rejected (detail in S16).>

### Architecture
- Data flow: <source → server boundary → client boundary → render>
- State model: <machine states (reuse S07 names), ownership, altitude>
- Server/client split: <client islands + why each>

### Contracts (backend scope)
<summary + link to S11 API notes; sources of truth per entity>

### Failure & recovery
| S09 state | Handled where | Mechanism |
|-----------|---------------|-----------|
| <SYNC_FAILED> | <component/handler> | <retry w/ backoff + normalized error code> |

### Touched areas (parallel-BRD conflict check)
- <src/features/x/ …>

### Slices (build order)
1. <vertical slice 1 — thin, end-to-end, includes its error states>
2. …

### Risks & unknowns
- <risk → probe/mitigation>
```

## Rules

- Every S09 state appears in the failure table with a named home — the table is the anti-happy-path gate.
- Touched-areas list is mandatory (orchestrator cross-checks in-flight BRDs).
- Slices vertical, each shippable-ish; horizontal layering ("all components then all wiring") fails planning review.
- Decisions with alternatives → the alternative + rejection reason goes to S16; S10 states only the chosen path.
