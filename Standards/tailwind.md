# Standard — Tailwind (v4)

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all styling; assumes Tailwind v4 CSS-first config + shadcn/ui.

## Rules

### Tokens first
1. Design tokens live in `@theme` (CSS-first config) as the single styling source of truth. Utilities consume tokens; no parallel token systems.
2. Semantic tokens over raw scale where meaning exists: `bg-surface`, `text-muted-foreground` (shadcn semantic vars) over `bg-gray-50` hardcoding. Raw palette utilities allowed only where no semantic exists — that gap is a DS Extension Note.
3. **No arbitrary values** (`w-[437px]`, `text-[#3ab7c9]`) where a token exists. A needed arbitrary value = missing token = Extension Note, not an inline escape.
4. Dark mode via semantic variables (shadcn pattern), not per-utility `dark:` sprawl on every class list. `dark:` allowed for genuinely one-off structural differences.

### Class discipline
5. Class order: layout → spacing → sizing → typography → color → effects → states. Prettier-plugin-tailwindcss enforces; don't fight it.
6. Conditional/variant styling via `cva` + `cn` (class-variance-authority + tailwind-merge) — never string concatenation or nested ternaries in `className`.
7. Repeated class clusters (≥3 occurrences of the same meaningful cluster) → extract: a component, a `cva` variant, or (rarely) an `@utility`. Not `@apply` soup — `@apply` is a last resort, justified in a comment.
8. Responsive: mobile-first (base = mobile, `sm:`/`md:`/`lg:` layer up) per [responsive-design.md](responsive-design.md); container queries (`@container`) where a component adapts to its slot, not the viewport.

### Components & DS
9. shadcn/ui components are the base vocabulary; restyle via their variant/token seams (CSS vars, `cva` extension), never by fighting their internals with override chains.
10. Motion respects tokens + `motion-reduce:` variants — every animation ships its reduced-motion behavior ([accessibility.md](accessibility.md)).
11. Z-index, radius, shadow, spacing come from the scale — no invented one-offs; extend the scale in `@theme` deliberately if it's genuinely missing.

## Anti-patterns

- Arbitrary-value styling around a token gap instead of raising the gap.
- `dark:` on 40 utilities where one semantic variable would flip the whole component.
- `@apply` recreating the CSS-file world Tailwind replaced.
- Feature-scoped styling forks (auth-only button paddings, billing-only grays) — DS rule 2 from the design domain applies: extend the system, never fork per feature.
- Copy-pasting a shadcn component to tweak one style instead of using its variant seam.
