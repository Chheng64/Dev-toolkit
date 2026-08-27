# Workflow — Design System

> **Module:** Workflows
> **Stage:** Supporting workflow — not a lifecycle stage. Invoked from UI workflow (Extension Notes), from implementation (DS gap found in code), or as its own dedicated BRD for DS milestones.
> **Skill:** Design System Engineer
> **Machine:** supports [design-state-machine.md](../Architecture/design-state-machine.md) states 06 `UI_PLANNING` + 07 `PROTOTYPE`; rule codes `B5`, `B7` in [method-rules](../design-toolkit/docs/method-rules.md)

## Purpose

Keep the project design system the single implementation source of truth for visual/interaction vocabulary. Absorb justified extensions; refuse one-off divergence. The DS evolves deliberately — never by accretion of feature-local styling.

## Inputs

- Extension Notes from S08 (or a dedicated DS BRD's S03)
- Project DS source **named by source id** (tokens/primitives/components in repo; Figma library when bound in the Resource Registry). A plan built on the wrong design system validates perfectly against it — the id is the first thing this workflow confirms.
- Usage evidence: where the gap appeared, what nearly-fit exists, how many plausible usage sites

## Outputs

- DS changes in the project repo: tokens, primitives, components, variants — with docs per component ([component-documentation](../Templates/component-documentation.md))
- S08 updated on the requesting BRD — Extension Note resolved: `extended` (what was added) or `rejected` (what to reuse instead, why)
- S16 entry on the requesting BRD; DS BRD's own sections when running as dedicated BRD

## BRD Sections It May Update

S08 (edit), S11 (append), S05 (append), S16 (append).

## Responsibilities

1. **Confirm the DS by source id** before touching it. Extending the wrong library is indistinguishable from extending the right one until integration.
2. **Triage the Extension Note:** genuinely new need, or existing asset nearly fits? Default answer is reuse — extension must earn its place (≥2 plausible usage sites, or 1 site + clear reuse trajectory; single-site one-offs get composed from primitives instead).
3. Design the extension at the right altitude: token change ≫ variant of existing component ≫ new component. Pick the smallest that solves it.
4. Implement with full state coverage (hover/focus/active/disabled/loading/error as applicable), a11y built in (focus visible, contrast, ARIA), theming (light/dark) and reduced-motion variants.
5. **Treat the token layer as the base, not an opt-in** (`B5`) — and check the stack itself: a font token layered over a base stack that carries no face for a script the product renders falls back per glyph, silently, everywhere. Same completeness rule for icon/asset registries: a slug with no entry falls back to the default.
6. Name and document per [Standards/design-system](../Standards/design-system.md): purpose, props/variants, do/don't, token dependencies.
7. Check blast radius: does the change alter existing usage sites? Breaking DS change → survey usages first, migrate them in the same change. **Supersession deletes** (`B7`) — a replaced asset's old tokens, styles and handlers go with it, and the strip is recorded itemised.
8. Resolve the Extension Note on the requesting BRD; unblock the requesting workflow.

## Completion Criteria

- [ ] DS confirmed by source id before any change
- [ ] Every open Extension Note resolved: `extended` or `rejected` with reasoning
- [ ] Extension implemented at smallest sufficient altitude (token < variant < component)
- [ ] Full interaction-state coverage + a11y + theming + reduced-motion
- [ ] Token/asset completeness checked at the **base** layer, per script and per slug — not just at the opt-in layer
- [ ] No existing usage site broken (checked, not assumed); superseded assets stripped, strip recorded
- [ ] Documented; discoverable by the next UI planning pass
- [ ] Requesting BRD's S08 + S16 updated

## Common Mistakes

- Approving every extension — the DS's value is what it refuses. Rejection with a reuse path is a success outcome.
- Building a new component when a token or variant would do.
- Shipping a component with happy-state styling only (no focus/disabled/error states) — it will fork the moment someone needs them.
- Extending the DS inside a feature branch without documentation — undiscoverable = will be reinvented.
- Renaming/retheming tokens mid-feature without migrating existing usages.
- Fixing a font or asset defect at the opt-in layer and leaving the base untouched — the defect returns wherever the opt-in was not applied.
- Patching a reported instance instead of sweeping its class (`R2`) — a defect reported as six selectors in one file resurfaced later at 138 instances across 7 flows.

## Best Practices

- Treat the DS as an API: additions are cheap, changes are breaking, removals need deprecation.
- Every extension records its origin BRD — future audits can trace why each asset exists.
- A component used by more than one flow names its owning plan; otherwise each file re-decides it and they drift.
- Batch small token tweaks into deliberate DS BRDs rather than dribbling them through feature BRDs.
- When rejecting, hand back a concrete composition recipe ("use `Card` + `tone=warning` token"), not just "no".
