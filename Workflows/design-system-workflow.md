# Workflow — Design System

> **Module:** Workflows
> **Stage:** Supporting workflow — not a lifecycle stage. Invoked from UI workflow (Extension Notes), from implementation (DS gap found in code), or as its own dedicated BRD for DS milestones.
> **Skill:** Design System Engineer

## Purpose

Keep the project design system the single implementation source of truth for visual/interaction vocabulary. Absorb justified extensions; refuse one-off divergence. The DS evolves deliberately — never by accretion of feature-local styling.

## Inputs

- Extension Notes from S08 (or a dedicated DS BRD's S03)
- Project DS source (tokens/primitives/components in repo; Figma library if bridged)
- Usage evidence: where the gap appeared, what nearly-fit exists

## Outputs

- DS changes in the project repo: tokens, primitives, components, variants — with docs per component (Phase 4 template when built)
- S08 updated on the requesting BRD — Extension Note resolved: `extended` (what was added) or `rejected` (what to reuse instead, why)
- S16 entry on the requesting BRD; DS BRD's own sections when running as dedicated BRD

## BRD Sections It May Update

S08 (edit), S11 (append), S05 (append), S16 (append).

## Responsibilities

1. **Triage the Extension Note:** genuinely new need, or existing asset nearly fits? Default answer is reuse — extension must earn its place (≥2 plausible usage sites, or 1 site + clear reuse trajectory; single-site one-offs get composed from primitives instead).
2. Design the extension at the right altitude: token change ≫ variant of existing component ≫ new component. Pick the smallest that solves it.
3. Implement with full state coverage (hover/focus/active/disabled/loading/error as applicable), a11y built in (focus visible, contrast, ARIA), theming (light/dark) and reduced-motion variants.
4. Name and document per Standards/design-system (Phase 3): purpose, props/variants, do/don't, token dependencies.
5. Check blast radius: does the change alter existing usage sites? Breaking DS change → survey usages first, migrate them in the same change.
6. Resolve the Extension Note on the requesting BRD; unblock the requesting workflow.

## Completion Criteria

- [ ] Every open Extension Note resolved: `extended` or `rejected` with reasoning
- [ ] Extension implemented at smallest sufficient altitude (token < variant < component)
- [ ] Full interaction-state coverage + a11y + theming + reduced-motion
- [ ] No existing usage site broken (checked, not assumed)
- [ ] Documented; discoverable by the next UI planning pass
- [ ] Requesting BRD's S08 + S16 updated

## Common Mistakes

- Approving every extension — the DS's value is what it refuses. Rejection with a reuse path is a success outcome.
- Building a new component when a token or variant would do.
- Shipping a component with happy-state styling only (no focus/disabled/error states) — it will fork the moment someone needs them.
- Extending the DS inside a feature branch without documentation — undiscoverable = will be reinvented.
- Renaming/retheming tokens mid-feature without migrating existing usages.

## Best Practices

- Treat the DS as an API: additions are cheap, changes are breaking, removals need deprecation.
- Every extension records its origin BRD — future audits can trace why each asset exists.
- Batch small token tweaks into deliberate DS BRDs rather than dribbling them through feature BRDs.
- When rejecting, hand back a concrete composition recipe ("use `Card` + `tone=warning` token"), not just "no".
