# Standard — Accessibility

> **Module:** Standards · Deviations: none — a11y floor is non-negotiable; only *additions* per project.
> **Applies to:** all UI. Target: WCAG 2.2 AA as the working floor.
> **Verified by:** a11y review dimension + [../Checklists/accessibility.md](../Checklists/accessibility.md).

## Rules

### Structure & semantics
1. Semantic HTML first: `button` for actions, `a` for navigation, `label` for labels, headings in order (`h1`→`h2`→…, no skips), landmarks (`main`, `nav`, `header`) present. ARIA is the fallback, not the default.
2. ARIA only where semantics can't reach — and then correct and complete: role + accessible name + state together, never decorative sprinkling.
3. Every form control has a programmatic label; errors are associated (`aria-describedby`) and announced, not just painted red.
4. Images: meaningful → descriptive `alt`; decorative → `alt=""`. Icon-only buttons carry `aria-label`.

### Keyboard
5. Everything mouse-doable is keyboard-doable, in a logical tab order. Keyboard traps are `major`-severity minimum, `blocker` in modals.
6. Focus visible always (`focus-visible` token styling); never `outline: none` without a replacement.
7. Focus managed on context shifts: modal open → into modal; modal close → back to trigger; route change → to page heading or main; destructive action → to safe ground. Per-flow behavior comes from the UX a11y strategy (S07).

### Content & state
8. Async states are announced: loading/success/error reach screen readers (`aria-live` regions at polite/assertive per urgency) — spinners alone are visual-only information.
9. User-facing language normalized — no raw internal/provider errors anywhere users can hear or see them.
10. Contrast via DS token pairs that pass AA (4.5:1 text, 3:1 large text/UI) — pairs validated once at the token level so features inherit compliance.
11. Touch targets ≥44×44px on touch surfaces; interactive spacing per DS scale.

### Motion & preferences
12. Every animation ships `prefers-reduced-motion` behavior: reduced or replaced (fade over slide/scale), decided at design time, implemented via `motion-reduce:` variants / motion tokens.
13. No content that flashes >3×/second; no autoplaying motion without pause control.
14. Respect user font/zoom: layouts survive 200% zoom and user font-size changes without loss ([responsive-design.md](responsive-design.md)).

## Anti-patterns

- `div onClick` interactivity — structural failure, not a style choice.
- ARIA as paint (`role="button"` on a div instead of `button`).
- A11y as a QA-time patch layer — it's designed in S07, built in implementation, *verified* at QA.
- Contrast checked per-feature by eyeball instead of guaranteed per-token-pair.
- Reduced-motion as an afterthought media query bolted on post-review.
