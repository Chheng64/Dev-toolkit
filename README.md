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
| `Prompts/` | 11 reusable prompt patterns | Phase 5 |
| `Playbooks/` | End-to-end compositions (full feature, parallel BRDs, hotfix, design-only) | Phase 5 |
| `Documentation/` | Toolkit meta: module index, changelog, onboarding | Phase 6 |

## Start Here

- Operating contract for Claude: [AI/CLAUDE-global.md](AI/CLAUDE-global.md)
- How everything connects: [Architecture/integration-map.md](Architecture/integration-map.md)
- The lifecycle: [Architecture/workflow-state-machine.md](Architecture/workflow-state-machine.md)
- Add to a project: [Architecture/versioning.md](Architecture/versioning.md) §3 + [Architecture/integration-map.md](Architecture/integration-map.md) §5

## Rules of the Repo

- Single responsibility per file. Composition only in `Playbooks/`.
- Dependencies point down toward `Architecture/` only.
- No project-specific business logic, ever.
- Contract changes follow [Architecture/versioning.md](Architecture/versioning.md) (semver, changelog, tags).
