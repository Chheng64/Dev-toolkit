# Standard — Next.js

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** Next.js App Router projects (the default for all new work).

## Rules

### Server/Client boundary
1. Server Components by default. `"use client"` is opt-in, placed at the **leaf-most** point interaction requires — never on layouts/pages wholesale.
2. The boundary is a planning decision (S10 names client islands), not a mid-implementation improvisation.
3. No secrets or server-only modules imported into client files; use `server-only` package marker on sensitive libs.
4. Serialization discipline: props crossing server→client are plain serializable data — no functions, class instances, or Dates-as-objects surprises.

### Data
5. Fetch on the server by default (RSC or route handlers); client fetching only for genuinely interactive/live data, via the project's query lib.
6. Caching is explicit: every fetch states its cache semantics (`cache`, `revalidate`, tags) — "whatever the default does" is not a strategy. Mutations invalidate by tag/path deliberately.
7. Mutations via Server Actions or route handlers per project convention (`project-overrides.md` picks one) — not mixed ad hoc. Actions validate input with zod at entry ([api-design.md](api-design.md) error contract applies).
8. Waterfalls are planned away: parallel `Promise.all` for independent data; sequential only when data depends on data.

### Routing & UX states
9. Every route segment with async data ships `loading.tsx` (or in-tree Suspense) and `error.tsx` — the S09 states have framework homes; use them.
10. `not-found.tsx` for missing-entity routes; redirects preserve intent (return-to param) per UX flow specs.
11. Route handlers return typed, normalized error shapes — never raw thrown errors serialized to clients.

### Structure & assets
12. Route segments own route concerns only (page/layout/loading/error); feature code lives in feature/lib dirs per [folder-structure.md](folder-structure.md) — pages stay thin.
13. `next/image` for images, `next/font` for fonts, `next/link` for navigation — no raw `img`/`@font-face`/`a` for internal routes.
14. Metadata via the Metadata API per route; no hand-rolled `<head>` manipulation.

### Env & config
15. Env access via a zod-validated `env.ts` module — fail fast at boot, typed at use. `NEXT_PUBLIC_` only for genuinely public values.

## Anti-patterns

- `"use client"` at the top of everything "to make it work" — boundary erosion is bundle + security erosion.
- `useEffect`-fetching in components RSC could have fed.
- Route handlers as a junk drawer (mixing unrelated endpoints per file).
- Silent cache surprises: mutated data still stale because no invalidation was declared.
- Middleware doing app logic (auth decisions belong at the data/action layer; middleware routes/rewrites at the edge).
