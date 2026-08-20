# Toolkit Registry

> **Module:** Architecture / Foundation (v1.5)
> **Status:** Stable
> **Purpose:** Single source of truth for **user-global toolkit configuration** — facts shared by every project on this machine. Created once at one-time setup ([../Documentation/notion-setup.md](../Documentation/notion-setup.md)); read by project registration and Resource Binding. Kills the bootstrap circularity: project onboarding never has to discover global resources, and never searches the workspace to find them.

## 1. Ownership Boundary (the rule this file exists for)

| Layer | File | Owns | Never holds |
|-------|------|------|-------------|
| **Toolkit Registry** (user-global) | `~/.toolkit/registry.yaml` | BRD database identity, Notion workspace, projects parent page, communication bot presence | secrets, project configuration, feature knowledge |
| **Project Manifest** (per project) | `project-manifest.yaml` at primary repo root | project config + Project Resource Registry ([project-manifest](project-manifest.md)) | user-global facts (inherits them), secrets |

One direction only: projects **inherit** from the Toolkit Registry; the registry never references individual projects. The BRD database is a *toolkit-level* resource (one DB, all projects — [notion-setup](../Documentation/notion-setup.md) §4 invariant): its identity lives here, and each project manifest **copies** the binding at onboarding for local validation stamps. On mismatch, the Toolkit Registry wins — re-run the affected binding.

## 2. Location & Lifecycle

- File: `~/.toolkit/registry.yaml` — user home, machine-local, never inside any repo, never committed.
- Created by one-time setup, immediately after the BRD database is created or first connected.
- Missing registry → project registration and onboarding **stop with the remedy** ("run one-time setup per README") — they never search the workspace and never guess.
- Multi-machine: recreate per machine (one-time setup connects the existing DB — `Connect Existing`, not `Create New`).

## 3. Schema (normative)

```yaml
registry_version: 1
created: 2026-07-26

notion:
  workspace: <name>
  brd_database:                    # THE one DB for all projects — inherited by every manifest
    id: <32-hex database id>       # stable identifier — never the display name
    data_source: <collection://…>
    url: <URL>                     # convenience; id is authoritative
    validated: 2026-07-26          # last access check at this level
  projects_parent_page: null       # optional page id — project identity pages are created
                                   # under it at registration (durable pre-repo home for
                                   # registration fields); null = identity lives in the
                                   # manifest only once the repo exists

communication:
  telegram_bot: none               # configured | none — presence flag only;
                                   # the token itself stays in TELEGRAM_BOT_TOKEN env, always
```

**Secrets rule:** same as everywhere — tokens never enter this file.

## 4. Consumption

1. **Registration** ([../Workflows/project-onboarding.md](../Workflows/project-onboarding.md) step 0) reads `notion.brd_database` to reserve the project code and `projects_parent_page` to create the identity page — no asking, no searching.
2. **Resource Binding** (step 3) inherits the BRD DB binding into `manifest.resources.notion.brd_database` (`binding: connected`, confirmed not re-asked). `Create New` for a BRD DB is legal only when the registry has none — first project ever; the created DB is written here first, then inherited.
3. **Manifest Gate** ([../AI/orchestrator.md](../AI/orchestrator.md) responsibility 0) loads this file before anything else; missing → one-time setup is the only offered action.
4. Onboarding's Telegram question consults `communication.telegram_bot` — `none` → the yes-path first routes through bot creation ([../extensions/telegram/README.md](../extensions/telegram/README.md) Setup 1).
