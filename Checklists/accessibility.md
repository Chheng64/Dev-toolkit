# Checklist — Accessibility

> **Runs inside:** design-qa (prototype), qa-testing (built app), code-review dimension 6. Mechanism-level checks — screenshots prove nothing here. Floor: WCAG 2.2 AA ([accessibility standard](../Standards/accessibility.md)).

## Keyboard
- [ ] Full task walk keyboard-only: every action reachable, logical tab order
- [ ] Focus visible on every interactive element (`focus-visible` styling present)
- [ ] No traps; modals: focus in on open, restored to trigger on close, Esc works
- [ ] Route/context change moves focus deliberately (heading/main), not lost to body

## Semantics
- [ ] Real elements: `button`/`a`/`label` — zero clickable `div`s in the diff/prototype
- [ ] Headings hierarchical (one `h1`, no skips); landmarks present
- [ ] Every form control labeled programmatically; errors associated via `aria-describedby` and announced
- [ ] Icon-only controls carry accessible names; decorative images `alt=""`

## Dynamic content
- [ ] Async states announced (`aria-live` at correct politeness) — loading/success/failure audible, not spinner-only
- [ ] Disclosure/expansion states (`aria-expanded` etc.) reflect reality
- [ ] Normalized user-facing language in all announced text

## Visual & motion
- [ ] Contrast via passing DS token pairs: 4.5:1 text, 3:1 large/UI (verify pairs used, not re-derive)
- [ ] Layout survives 200% zoom + user font scaling without loss
- [ ] Touch targets ≥44×44 on touch surfaces
- [ ] Every animation: `prefers-reduced-motion` behavior exists and was **exercised with the flag on**
- [ ] Nothing flashes >3×/s; no unpausable autoplay motion
