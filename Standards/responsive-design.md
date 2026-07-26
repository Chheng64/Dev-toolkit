# Standard — Responsive Design

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all UI.

## Rules

1. **Mobile-first:** base styles are the smallest viewport; `sm:`/`md:`/`lg:`/`xl:` layer enhancements up. Desktop-first overrides are a review finding.
2. Breakpoints come from the DS scale — no per-feature magic numbers. Break where the *content* breaks, using the nearest scale stop.
3. **Container queries for components, media queries for layout:** a component adapting to its slot uses `@container`; page-level arrangement uses viewport breakpoints.
4. Fluid by default: relative units (`rem`, `%`, `fr`, `min()/max()/clamp()` via tokens) over fixed px; fixed dimensions need a reason.
5. No horizontal page scroll, ever. Wide content (tables, code, diagrams) scrolls inside its own `overflow-x-auto` container.
6. Touch parity: hover-revealed information/actions have a touch-reachable equivalent; hover is enhancement, never the only path.
7. Every screen is designed and verified at minimum: 360px (small mobile), 768px (tablet), 1280px (desktop). UX flows (S07) note viewport-specific behavior where it diverges; otherwise behavior is identical, layout adapts.
8. Text wraps, truncation is designed: `truncate`/line-clamp is a deliberate decision with the full value reachable (title, tooltip, detail view) — never accidental overflow.
9. Layouts survive 200% zoom and user font scaling (a11y rule 14 — same mechanism: relative units).
10. Images/media: `max-width: 100%`, aspect ratio reserved (no CLS), responsive sources via `next/image`.

## Anti-patterns

- Pixel-perfect breakpoint chasing (`min-[847px]:`) instead of content-driven scale stops.
- Hidden-on-mobile as a design strategy — if it's hidden everywhere small, question whether it earns its place anywhere.
- Separate mobile/desktop component forks for layout-only differences — one component, responsive classes.
- Fixed-height containers holding variable content.
- Testing at one viewport and shipping ("looked fine on my screen") — three-viewport minimum is the floor.
