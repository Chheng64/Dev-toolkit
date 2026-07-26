# Checklist — UI Review

> **Gate for:** design state 06 exit ([ui-workflow](../Workflows/ui-workflow.md)) before prototype assembly.

## Coverage
- [ ] Every S07 flow state maps to a component set (zero unmapped states)
- [ ] Layout + hierarchy rules defined per state
- [ ] Loading/empty/error states have specified UI (skeleton/placeholder/recovery presentation), not just "shows error"

## Design-system conformance
- [ ] Every component mapped: `reuse` | `extend` | `new`
- [ ] Every `new` carries written justification; near-miss reuse checked first
- [ ] Zero one-off styling where a DS primitive exists
- [ ] All token references resolve to the DS (spacing/color/type/radius/motion) — or carry an Extension Note
- [ ] Extension Notes logged for every genuine gap (nothing silently styled around)
- [ ] No feature-local styling forks (no auth-only/billing-only variants outside the DS)

## Contracts
- [ ] Variants expressed as DS variant APIs (`cva`), not boolean-prop explosions
- [ ] Motion specified by DS motion tokens + reduced-motion variant named per animated element
- [ ] Component inventory consumable by [development-plan](../Templates/development-plan.md) without interpretation
- [ ] S16 stage-exit entry written
