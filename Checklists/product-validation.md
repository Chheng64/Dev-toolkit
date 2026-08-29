# Checklist — Product Validation (Product Gate)

> **Gate for:** `Human Review` (`Phase: FE`) → `Merged` — the Phase-1 exit ([product-validation](../Workflows/product-validation.md)). Any unchecked item → the gate is not granted.

## Preconditions
- [ ] `Phase: FE`, FE PR open, CI green
- [ ] `C_SECURITY`: certificate `certified` against the FE PR head
- [ ] `C_ISOLATION`: the FE branch touches no server paths
- [ ] `CTR-<brd-id>-v<n>` issued; S11 cites it; `VERSION` names `issued_against` (the FE PR head sha) — `product_freeze` does not exist yet at this gate

## The walk
- [ ] Every S07 flow walked in the running app
- [ ] Every recovery route reachable
- [ ] Every S09 state reached, each by a named fixture
- [ ] Every S03 AC that is front-end-observable verified, S13 marked `Verified on: mocks`

## The packet
- [ ] Mock-backed limitations stated at full strength, before the verdict
- [ ] Prototype version and contract version named
- [ ] Head sha named

## The verdict
- [ ] Captured as `approve` / `request-changes` / `reject`
- [ ] Change requests structured and routed to owning stages
- [ ] Qualifications recorded with rider, grantor, closing condition
- [ ] S16 gate record written
