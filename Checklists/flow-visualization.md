# Checklist — Flow Visualization (Developer Handoff Gate)

> **Gate for:** design state 12 ([flow-visualization](../Workflows/flow-visualization.md)) on the `Design Review → Dev Planning` edge — **only when `C_HANDOFF_REQUIRED`** ([design-state-machine](../Architecture/design-state-machine.md) §6). Normative rules: `W1`–`W10`, `E1`–`E7` in [method-rules](../design-toolkit/docs/method-rules.md); V-rules in the vendored [skill 12](../design-toolkit/skills/12-flow-visualization/SKILL.md).
>
> **The gate passes on the report, not on the picture** (`W10`). A map that renders beautifully over a derivation reporting broken routes is the failure this gate exists to prevent.

## Preconditions
- [ ] `Approvals` contains `design` — state 12 maps approved bytes, never bytes ahead of the gate
- [ ] Prototype versions cited here are the versions the audit of record ran on
- [ ] Registry export regenerated this run from the Screen Contract (no hand edits in the derived CSV)

## Derivation (`W1`)
- [ ] Run order honoured: `navgraph` → `stategraph` → `stateprobe` → `annotate` (**annotate reads `navgraph.json`**) ([validation-engine](../Architecture/validation-engine.md) §11)
- [ ] Graph **derived by tool**, not drawn — `navgraph.mjs` run recorded with its exit code
- [ ] Every connector traces to a registry cell
- [ ] Derivation reconciled against ratified S07 flows; disagreements recorded as findings, not merged
- [ ] Committed derivation **re-derives identically** from the current registry (V13)

## Coverage
- [ ] Every Screen Contract row owned by this BRD has a frame in a Section (V1)
- [ ] Every derived navigation path exists as a connector (V2); directions match derived edges (V8)
- [ ] No orphan screens (V3); no broken connectors — endpoints exist at current coordinates (V4)
- [ ] All branches terminate; every decision node's branch set is exhaustive (V5)
- [ ] Entry + exit screens identified per Section (V6)
- [ ] State variants drawn, not left to the prototype (`W9`)

## Presentation contract
- [ ] Section per **journey**, named `FLOW-XXX • Journey Name` (V7, `W2`) — not per feature
- [ ] Layout: left→right traversal order, uniform pitch, 8pt grid, branches vertical (`W3`)
- [ ] Connector styles carry meaning **and the legend ships in the file** (`W4`)
- [ ] Connectors regenerated wholesale this run — zero hand-patched arrows (`W5`)
- [ ] Every frame stamps ID, name, route, feature, flow, version, status **and the prototype version it depicts** (`W6`)

## Extensions
- [ ] Lane coverage reported; unassigned screens **reported, never guessed into a lane** (V9, `E1`)
- [ ] Cross-feature map derived, not authored (`E2`)
- [ ] Heat **measured** — in-degree + distinct source features (`E3`)
- [ ] Deep-link addressability reported per flow, read out of the implementation (V10, `E4`); a flow with no hooks is a major finding with a rider
- [ ] State vocabulary normalized **before** generation; edge set carries `file:line` evidence the tool resolves (V11, `E5`)
- [ ] No blank annotation field — `UNKNOWN` legal and counted, guessed values not (V12, `E6`)
- [ ] Overview page ships its provenance block: registry sha, derivation run, prototype versions, date (`E7`)

## Freshness & boundaries
- [ ] Sync recorded as an **edge-set hash diff**, not as a claim (`W7`)
- [ ] Every boundary re-dated this run (`W8`)

## Gate record
- [ ] Report presented at the gate (not the picture)
- [ ] Findings clean at the configured severity, **or** every remaining finding carries a granted waiver with a rider debt item, a grantor and a closing condition
- [ ] Gate record names registry sha, derivation run, prototype versions — in `reads_versions`, not only in prose
- [ ] `figma: n/a (no binding)` stated explicitly when the design file is unbound (loud degradation, never silent skip)
- [ ] S07 navigation subsection + S14 gate record + S16 entry written
