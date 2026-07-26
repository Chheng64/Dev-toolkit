# Template — Project Configuration (Onboarding Interview)

> **Use:** [project-onboarding workflow](../Workflows/project-onboarding.md) step 1. Detect-first: fields marked ⚙ are auto-detected from the repo and only confirmed. Answers land in [project-manifest.yaml](../Architecture/project-manifest.md) — this template never becomes a standalone document.

```markdown
## Project Registration   (step 0 — may run BEFORE the repo exists; recorded in Notion immediately)
- Name:
- Code (2–4 uppercase, unique — BRD-<code>-nnn):
- Short description (one line):
- Product type: website | mobile-app | desktop | backend-service | api | library | other:<name>
- Development stage: idea | discovery | mvp | production | maintenance
- Intended tech stack (headline, refined in Stack section later):

## Project Information   (pre-filled from registration; confirm only)

## Technology Stack   ⚙ detect from package.json / lockfile / config files first
- Frontend: nextjs | react | vue | angular | flutter | react-native | android | ios | none | other:<name>
- Backend: nestjs | laravel | aspnet | go | spring-boot | firebase | supabase | none | other:<name>
- Database: postgresql | mysql | mongodb | firebase | supabase | sqlite | none
- Styling: tailwind | material-ui | chakra | custom-ds | other:<name>
- Package manager: pnpm | npm | yarn | bun   ⚙ lockfile

## Design Configuration   (null = prototype-only design flow)
- Figma file URL:
- Figma page(s):
- Design-system file URL:
- Component library (code):   ⚙ e.g. shadcn/ui from deps
- Design token source:        ⚙ e.g. src/styles/globals.css @theme
- Icon library:               ⚙ from deps
- Typography source:          ⚙ e.g. next/font

## Notion Configuration
- Workspace:
- BRD database URL (required):
- Project database URL (optional):
- Sprint database URL (optional):
- Decision-log database URL (optional — default: in-BRD S16):

## Git Configuration   ⚙ detect from git remote / repo settings
- Repository URL:
- Default branch:
- Branch naming: (toolkit default feat/<brd-id>-<slug> unless overridden)
- PR strategy: squash | merge | rebase
- Release strategy: tag | vercel | manual-deploy | none

## Initial Screens   (optional seed — Screen Contract init, step 6)
- Known top-level screens to register now (name + route each; product-type
  defaults offered, e.g. website → Home /, Settings /settings):
  - <Screen name> — /<route>
  - …
```

## Rules

- Every URL answer gets access-validated before entering the manifest (onboarding step 4) — no unchecked links.
- `other:<name>` anywhere → stack-profile gap warning surfaced immediately, not at Dev Planning.
- Optional Notion databases left null cost nothing — S16-in-BRD is the default decision log; don't create ceremony databases without need.
- Re-onboarding uses only the affected section(s) of this template.
