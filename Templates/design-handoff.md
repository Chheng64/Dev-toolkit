# Template — Design Handoff

> **Use:** assembled at Design Review pass (Design Gate approved) — the package Dev Planning consumes. Mostly links + deltas; the BRD sections are the content.

```markdown
## Design Handoff — [BRD-ID] <feature>
Approved: <date> · `Approvals: design` · Prototype frozen @ <commit>

### Sources of truth
- Flows & states: S07 (+ S09 edge matrix)
- Component inventory & DS mapping: S08
- Running prototype: design/prototype/<brd-id>/ (`./run-local.sh`, port 8765)
- Traceability: prototype element → spec → DS asset (in prototype dir)

### What the prototype is authoritative for
<interaction, hierarchy, states, motion — the things to match>

### What the prototype is NOT authoritative for
<placeholder copy, mock data, unwired areas — listed explicitly>

### Extension Notes resolved
| Note | Resolution | Asset |
|------|-----------|-------|
| <needed toast variant> | extended | `Toast tone=syncing` |

### Known limitations carried into build (from S14 audit)
- <limitation — accepted at gate, expected in v1>

### Motion & a11y specifics
- <choreography notes, reduced-motion behavior, focus order decisions>

### Open items deferred to build
- <item → owner stage>
```

## Rules

- Handoff links to BRD sections; it never copies them (one source of truth — drift kills).
- The NOT-authoritative list is mandatory — implementers matching placeholder copy pixel-for-pixel is wasted fidelity.
- Every Extension Note must read `extended` or `rejected` before handoff — `open` blocks Dev Planning.
- Limitations here = accepted at the gate; anything new discovered later is a change, not a limitation.
