# Checklist — Screen Contract Validation

> **Gate for:** `Design Review` (approved) → `Dev Planning` — guard `C_CONTRACT`, run automatically by the orchestrator per owning BRD. Normative spec: [screen-contract](../Architecture/screen-contract.md) §6. **Any unticked box stops the workflow with a missing-mappings report; no partial pass.**

## Registry completeness
- [ ] Every screen named in BRD S07 flows exists in `screens/registry.md` (walk the flow list, tick per screen)
- [ ] Every registry entry owned by this BRD has: ID, name, route, parent flow, status ≥ `designed`, owner
- [ ] No un-registered screens in the prototype (prototype routes ⊆ registry routes)

## Design mapping (per owned screen)
- [ ] Design block complete: DS components + tokens listed; states designed listed
- [ ] Figma mapping present when `manifest.resources.figma.product_design_file` bound (frame + component refs); prototype mapping otherwise ([screen-contract](../Architecture/screen-contract.md) §4 Figma-optional rule)
- [ ] Figma and prototype agree where both exist (divergence = design-qa finding, not a tick)

## Frontend mapping (per approved screen)
- [ ] Frontend block complete: route, page component file, shared components, layout, state refs
- [ ] Every referenced component is an approved DS component or a justified `new` from S08 — zero unmapped/one-off components

## API mapping (per owned screen)
- [ ] API block present: required APIs listed, each with `demanded:` (+ `provided:` once filled) and error states → screen states — or explicit `api: none`
- [ ] Every API dependency is documented: for `Phase: single` BRDs, the API block ↔ S11 contract ([api-specification](../Templates/api-specification.md) entry); for split BRDs, every `demanded:` line names a method of the cited `CTR-<brd-id>-v<n>`, and at Phase-2 QA exit every `demanded:` line has a `provided:` line (`C_PARITY` check 2)

## QA mapping (per owned screen)
- [ ] ACs covering this screen listed (every screen traces to ≥1 AC)
- [ ] Test cases + edge cases (S09 states landing on this screen) listed
- [ ] Accessibility checks listed; responsive validation (3 viewports) listed

## On failure
- [ ] Report names each missing mapping: `SCR-<id> · <block> · <what's absent>`
- [ ] Routed to owning stage: registry/design gaps → UX/UI workflow; frontend/API gaps → Dev Planning owners; QA gaps → QA plan
- [ ] Failure + routing logged in owning BRD S16
