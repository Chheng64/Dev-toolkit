# Standard — Folder Structure

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** Next.js App Router projects.

## Canonical Layout

```
src/
├── app/                    # Routes ONLY: page/layout/loading/error/route files, thin
│   └── (groups)/...        # route groups for layout/auth boundaries
├── components/
│   ├── ui/                 # DS primitives (shadcn) — design-system workflow territory
│   └── shared/             # DS composites (feature-agnostic: EmptyState, PageHeader)
├── features/               # Feature modules — the unit of ownership
│   └── <feature>/          #   maps ~1:1 to BRD scope areas
│       ├── components/     #   feature-private components
│       ├── hooks/
│       ├── lib/            #   feature logic, pure + testable
│       ├── schemas.ts      #   zod schemas = type source of truth
│       └── index.ts        #   PUBLIC API of the feature (only sanctioned barrel)
├── lib/                    # Cross-feature pure utilities (dates, formatting, cn)
├── server/                 # Server-only: db, external clients, actions/, api helpers
│   └── (marked server-only)
├── hooks/                  # Cross-feature client hooks
├── styles/                 # globals.css (@theme tokens live here)
└── env.ts                  # zod-validated env access
design/
└── prototype/<brd-id>/     # BRD prototypes + run-local.sh (design machine artifact)
toolkit/                    # submodule, version-pinned — never edited from the project
project-overrides.md        # sanctioned deviations from toolkit Standards/
```

## Rules

1. **Features are the unit:** code belonging to one feature lives in its module; `app/` routes import from features and stay thin (compose, don't implement).
2. **Import direction (enforced):** `app → features → {components, lib, server, hooks}`; `components/ui` imports nothing above tokens/lib. Features never import from other features' internals — only via their `index.ts` public API; circular feature deps = design bug, refactor shared parts down into `lib`/`components/shared`.
3. **Promotion path:** used by 1 feature → lives in the feature. Used by 2+ → promote to `components/shared`/`lib`/`hooks` deliberately (small refactor commit, not a copy).
4. **Server code is fenced:** anything touching db/secrets/external service credentials lives under `server/` with `server-only` marker; client code imports its types, never its modules.
5. **One sanctioned barrel** per feature (`index.ts` = public API). No nested barrel pyramids — they hide dependency direction and wreck tree-shaking.
6. **Colocation:** tests beside subjects; feature-specific types/schemas inside the feature; a thing's home is next to the code that changes with it.
7. New top-level dirs are a `project-overrides.md` decision, not an improvisation.

## Anti-patterns

- Type-first layout at scale (`/components`, `/hooks`, `/utils` as the *only* axes) — features scatter across the tree and nothing is deletable.
- Feature A reaching into `features/b/lib/internal-thing` — API boundary violation.
- `app/` accumulating business logic until routes are the app.
- Junk-drawer growth (`lib/utils.ts` at 800 lines) — split by domain when a file stops having one reason to change.
- Editing the toolkit submodule from inside a project.
