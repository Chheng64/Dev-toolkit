# Template — Design Mapping (Screen Contract block)

> **Use:** the **Design** + **Prototype** blocks of `screens/SCR-<nnn>.md`. Filled at UI planning / prototype by UI Designer. Spec: [screen-contract](../Architecture/screen-contract.md) §3–4.

```markdown
# SCR-<nnn> — <Screen Name>

- **Route:** /<route>            · **Parent flow:** <S07 task> (BRD-<XX>-<nnn>)
- **Registry status:** planned | designed | prototyped | implemented | verified

## Design
- **Figma frame:** <url#node-id>            <!-- or: n/a (no figma in manifest) -->
- **Figma components used:** <names/links>   <!-- or n/a -->
- **Reading order:** <top → bottom, node IDs: close × `n:m` → mark `n:m` → title `n:m` → … — what the arrangement test pins>
- **Chrome / presentation:** <bar | no bar (status bar only) · capsule position · page | sheet over <what> · safe-area>
- **Alignment:** <per text block: centred | start · per block: vertically centred | anchored top/bottom>
- **DS components:** <Button variant=…, Card, Switch …— from S08 inventory>
- **Design tokens:** <semantic tokens consumed: color/space/type/motion refs>
- **States designed:** <DEFAULT, LOADING, EMPTY, SYNC_FAILED … — S09 names, list all>
- **Extension Notes touching this screen:** <resolved refs | none>

## Prototype
- **Prototype route:** design/prototype/<brd-id>/#/<route>
- **Interactive behaviors wired:** <toggle persists, retry action, focus trap …>
- **Recovery routes reachable:** <per S07: SYNC_FAILED → retry → DEFAULT, …>
- **Reduced-motion variant:** <behavior with flag on>
```

## Rules

- Every state listed under "States designed" must be reachable in the prototype — the design-qa checklist walks this list.
- DS components/tokens listed by exact name — validator cross-checks against S08 + DS docs.
- Figma and prototype must agree when both exist; divergence gets fixed or logged as design-qa finding before Design Gate.
- Bind with `get_design_context` (layout + screenshot), never `get_metadata` alone; the three arrangement fields are mandatory for every bound frame and a node-ID list without them is not a mapping ([screen-contract §4a](../Architecture/screen-contract.md)). A deviation from the frame on arrangement or hierarchy is a finding with a Product Owner ruling, never a "composition choice".
- Every screen bound to a frame of the product design file ships an arrangement test (`readingOrder()` on the rendered tree) — validation check 7.
- Overlays (modals/sheets) are screens too: route as `modal:<host-route>/<name>`, registered like any screen.
