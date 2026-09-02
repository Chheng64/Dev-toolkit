# Template — Project Configuration (Onboarding Interview)

> **Use:** [project-onboarding workflow](../Workflows/project-onboarding.md) steps 0–3 + 7 (Registration · Collect · Resource Binding · Screens seed). Detect-first: fields marked ⚙ are auto-detected from the repo and only confirmed. Answers land in [project-manifest.yaml](../Architecture/project-manifest.md) — this template never becomes a standalone document.

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
- Database: postgresql | mysql | mongodb | firebase | supabase | sqlite | none | other:<name>
- Styling: tailwind | material-ui | chakra | custom-ds | other:<name>
- Package manager: pnpm | npm | yarn | bun   ⚙ lockfile

## Design Configuration (code-side)   ⚙ all detectable
- Component library (code):   ⚙ e.g. shadcn/ui from deps
- Design token source:        ⚙ e.g. src/styles/globals.css @theme
- Icon library:               ⚙ from deps
- Typography source:          ⚙ e.g. next/font

## Project Resource Binding   (step 3 — every slot: [connect] existing / [create] new / [skip] if optional)
### Notion
- BRD Database (REQUIRED):        connect <URL → id resolved> | create per notion-setup
- Project Page:                   connect | create | skip
- Sprint Database:                connect | create | skip
- Decision-log Database:          connect | create | skip   (default: in-BRD S16)
### Figma   (skip both = prototype-only design flow)
- Product Design File:            connect <URL → file key> | create | skip
  - Pages in scope (if bound):
- Design System Library:          connect | create | skip
### GitHub   (≥1 of frontend/backend REQUIRED; monorepo → same repo both slots)   ⚙ git remote
- Frontend Repository:            connect <owner/repo → repo id> | create | skip
- Backend Repository:             connect | create | skip
- Infrastructure Repository:      connect | create | skip
- Primary repository (hosts manifest, toolkit pin, screens/): frontend | backend | infrastructure
### Documentation   (each: notion-page | repo-path | url)
- API Documentation:              connect | create | skip
- Architecture Documentation:     connect | create | skip
- Product Documentation:          connect | create | skip
### Communication   (asked ONCE — "skip" is never re-asked)
- Telegram: yes (connect chat / create chat) | no | configure later
  - Mode: private | group | topic (recommended)
  - chat_id / topic_id: (resolved at bind time; token stays in TELEGRAM_BOT_TOKEN env)
### Other
- Additional MCP-backed resources (name + MCP server + stable id each):
  - …

## Git Behavior   (step 1)   ⚙ detect from repo settings
- Branch naming: (toolkit default feat/<brd-id>-<slug> unless overridden)
- PR strategy: squash | merge | rebase
- Release strategy: tag | vercel | manual-deploy | none
- (Per-repo default branch is confirmed at step 3 as each repo is bound — not asked here)

## Initial Screens   (optional seed — Screen Contract init, step 7)
- Known top-level screens to register now (name + route each; product-type
  defaults offered, e.g. website → Home /, Settings /settings):
  - <Screen name> — /<route>
  - …
```

## Rules

- Every **connect** answer resolves to a **stable identifier** before entering the manifest — Notion database/page id, Figma file key, GitHub numeric repo id, Telegram chat id. URLs are convenience pointers; display names are never stored ([project-manifest](../Architecture/project-manifest.md) §3).
- Every binding gets access-validated before entering the registry (onboarding step 5) — no unchecked links, no dead ids.
- Every **skip** is recorded in the registry's `skipped:` list — explicit, never re-asked, never guessed at runtime.
- `other:<name>` anywhere in Stack → stack-profile gap warning surfaced immediately, not at Dev Planning.
- Optional Notion databases skipped cost nothing — S16-in-BRD is the default decision log; don't create ceremony databases without need.
- Re-onboarding uses only the affected section(s)/slot(s) of this template.
