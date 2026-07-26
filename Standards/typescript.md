# Standard — TypeScript

> **Module:** Standards · Deviations only via project `project-overrides.md`, justified in writing.
> **Applies to:** all TypeScript code in all projects.

## Rules

### Strictness
1. `strict: true` always; additionally `noUncheckedIndexedAccess: true`. Never loosen the base config per feature.
2. `any` is banned. Escape hatch is `unknown` + narrowing. A remaining `any`/`@ts-ignore`/`as unknown as` requires an adjacent justification comment and an S12 note.
3. No non-null assertions (`!`) where a guard can exist. Assertions allowed only when invariance is provable one line above (and say why).

### Modeling
4. Model states as discriminated unions, not boolean soup. `{ status: 'idle' | 'loading' | 'error' | 'success', ... }` with per-variant payloads — mirrors UX state enumeration (S07/S09 names).
5. Make illegal states unrepresentable before writing runtime checks for them.
6. Derive, don't duplicate: `z.infer`/`ReturnType`/`Pick` over hand-copied shapes. One source of truth per type; server schemas are that source for API types.
7. `interface` for object shapes intended to be implemented/extended; `type` for unions, intersections, derivations. Don't churn between them.
8. `readonly` by default on public shapes; mutation is opt-in and local.

### Functions & modules
9. Explicit return types on exported functions; inference is fine inside module bodies.
10. No default exports except where the framework requires them (Next.js pages/layouts/route handlers). Named exports everywhere else.
11. Narrow at boundaries: parse/validate external data (API responses, env, storage, URL params) with zod at entry; trust types only inward of the parse.
12. Exhaustiveness enforced: `switch` over unions ends with `never` check (`assertNever`) so added variants fail to compile, not at runtime.

### Errors
13. Errors crossing module boundaries are typed (`Result`-style union or typed error classes) — `throw` freely inside, but catch-and-type at seams the UI consumes.
14. Never swallow: `catch` blocks either handle meaningfully, rethrow enriched, or route to the normalized error layer. Empty catch is a review blocker.

## Anti-patterns

- Type assertions to silence the compiler instead of fixing the model.
- Parallel-maintained types for the same data (client copy of server type).
- Enums where union literals do (string unions serialize, tree-shake, and narrow better).
- Generic-itis: type parameters that only one call site ever instantiates.
- Optional-everything interfaces (`field?:` sprawl) hiding which states actually co-occur — that's a discriminated union asking to exist.
