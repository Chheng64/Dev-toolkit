# Dev-toolkit

Reusable AI product-development toolkit. Global operating system for all personal software projects — consumed as a version-pinned git submodule. Feature knowledge lives in Notion Living BRDs; this repo holds only global process knowledge.

## Structure

| Dir | Holds | Status |
|-----|-------|--------|
| `Architecture/` | Contracts: BRD schema, permission matrix, lifecycle + design state machines, integration map, versioning | ✅ Phase 0 |
| `AI/` | Claude runtime: entry contract, workflow orchestrator, BRD update protocol, MCP setup | ✅ Phase 0 |
| `Workflows/` | 13 stage procedures (business analysis → release, debug) | ✅ Phase 1 |
| `Skills/` | 16 role definitions | ✅ Phase 2 |
| `Standards/` | 17 tech standards (React, Next.js, TS, Tailwind, …) | ✅ Phase 3 |
| `Templates/` | 11 artifact templates | ✅ Phase 4 |
| `Checklists/` | 11 gate checklists | ✅ Phase 4 |
| `Prompts/` | 11 reusable prompt patterns | ✅ Phase 5 |
| `Playbooks/` | End-to-end compositions (full feature, parallel BRDs, hotfix, design-only) | ✅ Phase 5 |
| `Documentation/` | Toolkit meta: module index, changelog, onboarding, Notion setup | ✅ Phase 6 |

**Status: v1.0.0 — complete.** All 9 layers built: 6 contracts, 4 runtime, 13 workflows, 16 skills, 17 standards, 11 templates, 11 checklists, 11 prompts, 4 playbooks.

## Start Here

- New project in 10 minutes: [Documentation/onboarding.md](Documentation/onboarding.md)
- One-time Notion DB: [Documentation/notion-setup.md](Documentation/notion-setup.md)
- Map of every module: [Documentation/module-index.md](Documentation/module-index.md)
- Operating contract for Claude: [AI/CLAUDE-global.md](AI/CLAUDE-global.md)
- How everything connects: [Architecture/integration-map.md](Architecture/integration-map.md)
- The lifecycle: [Architecture/workflow-state-machine.md](Architecture/workflow-state-machine.md)

## Rules of the Repo

- Single responsibility per file. Composition only in `Playbooks/`.
- Dependencies point down toward `Architecture/` only.
- No project-specific business logic, ever.
- Contract changes follow [Architecture/versioning.md](Architecture/versioning.md) (semver, changelog, tags).
