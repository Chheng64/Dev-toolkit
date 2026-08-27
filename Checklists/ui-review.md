# Checklist — UI Review

> **Gate for:** design state 06 exit ([ui-workflow](../Workflows/ui-workflow.md)) before prototype assembly. Normative source: vendored [skill 06](../design-toolkit/skills/06-ui-planning/SKILL.md).
>
> **Failure mode #1: a plan built on the wrong design system validates perfectly against it.** Confirm the source id before ticking anything below.

## Coverage
- [ ] Design system named by **source id** in S08 (library/repo + version), not by nickname
- [ ] Every S07 flow state maps to a component set (zero unmapped states)
- [ ] Every flow-implied screen registered in the Screen Contract (`SCR-<nnn>` row + contract file, overlays included) — an unregistered screen is invisible to handoff mapping
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
- [ ] Every component used by more than one flow names its owning plan (shared components are cross-flow contracts, or each file re-decides them and they drift)
- [ ] S16 stage-exit entry written
