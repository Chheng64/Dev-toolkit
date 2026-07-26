# CLAUDE-global — Toolkit Entry Point

> **Module:** AI / Runtime
> **Status:** Stable
> **Usage:** Referenced from every project's `CLAUDE.md`. This file is the contract Claude operates under in any toolkit-enabled project. Do not copy its content into projects — reference the submodule path.

## Project CLAUDE.md Stub (copy this block into each project, fill placeholders)

```markdown
# <Project Name>

## Toolkit
This project uses the Dev-toolkit (submodule at `toolkit/`, pinned — check `git submodule status`).
Operate per `toolkit/AI/CLAUDE-global.md`. Read it before acting on any BRD work.

- Project code: `<XX>` (BRD IDs: BRD-<XX>-nnn)
- Notion: BRD database "<db name>", Project = "<project select value>"
- Overrides: `project-overrides.md` (project-specific deviations from toolkit Standards/)
- Stack notes: <one-liners: framework versions, package manager, run commands>
```

## Operating Contract (Claude reads this)

### 1. Identity & Routing
- All feature work is BRD-driven. A request touching product work maps to a BRD; no BRD → offer to create one (Templates/feature-request when built; minimal S01 seed until then).
- Entry procedure, stage routing, gates, parallel limits: [orchestrator.md](orchestrator.md). Follow it for every BRD session.
- Ad-hoc questions / trivial fixes with no product impact: work normally, no BRD ceremony. Judgment line: would a future session need this context? → BRD/S16. Else ephemeral.

### 2. Knowledge Layers (strict separation)
| Knowledge | Lives in | Never in |
|-----------|----------|----------|
| Feature (requirements, decisions, findings, progress) | Notion BRD | repo files, chat only |
| Global process/standards | toolkit submodule | BRD pages, project repo copies |
| Project-specific (stack quirks, overrides, env) | project `CLAUDE.md` + `project-overrides.md` | toolkit, BRDs |

`project-overrides.md` is the only sanctioned deviation point from Standards/. Override there = documented + justified; silent divergence in code = bug.

### 3. BRD Editing
Every BRD write follows [brd-update-protocol.md](brd-update-protocol.md) under [../Architecture/permission-matrix.md](../Architecture/permission-matrix.md) rights for the active role. Update at discovery time. Living doc, never replaced.

### 4. Stage Discipline
- Act as one role at a time (`Stage Owner`). Load only the stage's workflow + skill + referenced standards — not the whole toolkit.
- Exit criteria are checklists, not vibes. Unmet → stage not done; say so plainly.
- Human gates block. Present the decision package (orchestrator §4) and stop.

### 5. Git Discipline
Naming contracts (branch/commit/PR ↔ BRD): [../Architecture/integration-map.md](../Architecture/integration-map.md) §3. One BRD = one branch = one PR. Commit style per Standards/git-strategy (until built: Conventional Commits + `(<BRD-ID>)` scope).

### 6. Precedence
1. Explicit user instruction (log overrides in S16 when they bend the process)
2. Project `project-overrides.md`
3. Toolkit Standards/ + Workflows/
4. General defaults

Conflicts between toolkit modules: Architecture/ contracts win; report the inconsistency as a toolkit bug.
