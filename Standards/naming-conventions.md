# Standard — Naming Conventions

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** files, code identifiers, git artifacts, BRD artifacts.

## Rules

### Files & directories
1. Directories + non-component files: `kebab-case` (`user-profile/`, `format-date.ts`).
2. React component files: `PascalCase.tsx` matching the exported component (`ProfileCard.tsx` exports `ProfileCard`). Hooks: `use-kebab.ts` exporting `useCamelCase`.
3. Test files sit beside their subject: `format-date.test.ts`, `ProfileCard.test.tsx`. E2E specs in the project's e2e dir, named by flow: `checkout-recovery.spec.ts`.
4. Route segments follow Next.js conventions; everything else avoids `index.ts` barrels except one per public module boundary (see [folder-structure.md](folder-structure.md)).

### Code identifiers
5. `camelCase` variables/functions; `PascalCase` components/types/classes; `SCREAMING_SNAKE` true constants only (compile-time invariants, not "I don't plan to change this").
6. Booleans read as predicates: `isOpen`, `hasProfile`, `canRetry` — never `open`, `flag`, `status2`.
7. Functions are verb phrases stating effect: `createProfile`, `resolveIdentity`, `normalizeError`. Event handlers: `handleX` internal, `onX` props.
8. State machine states/events reuse UX names verbatim (S07/S09): `PROFILE_MISSING`, `SYNC_FAILED` — traceability from BRD to code by grep.
9. Types: no `I`/`T` prefixes; suffix by role where it clarifies (`ProfileSchema`, `CheckoutState`, `CreateUserInput`).
10. No abbreviations except industry-universal (`id`, `url`, `api`, `db`). `usr`, `btn`, `cfg` — no.

### Semantic honesty
11. Names state what a thing IS/DOES now — not history (`newHelper`, `utilsV2`), not hope (`temp`, `finalFinal`), not vagueness (`data2`, `misc`, `helpers`).
12. Same concept = same name everywhere (BRD, code, tests, commits). Renaming a concept is a deliberate act: rename all layers or don't.
13. One name per concept, one concept per name — near-synonyms (`user`/`account`/`profile`) get defined once in S10 and used precisely.

### Git & BRD artifacts
14. Per [integration-map.md](../Architecture/integration-map.md) §3: branches `feat/<brd-id>-<slug>`, commits `<type>(<BRD-ID>): <subject>`, PRs `[BRD-ID] name`. Slugs: kebab, ≤4 words.

## Anti-patterns

- `utils.ts` / `helpers.ts` / `misc.ts` junk drawers — name the domain or it will collect everything.
- Plural/singular drift (`user.ts` exporting `Users` helpers).
- Renaming half the layers (code says `entitlement`, BRD says `subscription rights`).
- Comment compensating for a bad name — rename instead.
