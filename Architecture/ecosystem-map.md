# Ecosystem Map — Dev-toolkit ↔ paul ↔ gsd-core ↔ carl

> **Module:** Architecture / Foundation
> **Status:** Informational (not executed by the orchestrator; no runtime dependency)
> **Purpose:** Concept-level bridge between this toolkit and three unrelated Claude Code systems the user also runs (`paul:*` plugin, `gsd-*` plugin family, `carl-mcp`). Answers "what's the equivalent of X" when moving between them. Does not wire them together — see §4.

## 1. The Four Systems

| System | What it is | State lives in | Unit of work |
|--------|-----------|-----------------|--------------|
| **Dev-toolkit** (this repo) | Versioned, submoduled process toolkit + Notion-backed state machine | Notion (Living BRD, properties) + `project-manifest.yaml` + `~/.toolkit/registry.yaml` | BRD, through 13 gated stages ([workflow-state-machine](workflow-state-machine.md)) |
| **paul** | Claude Code plugin: milestone → phase planning/execution workflow | Local files in the project repo (manifest via `paul:register`, phase/handoff docs) | Phase, driven by discuss → plan → apply → verify |
| **gsd-core** (`gsd-*`) | Claude Code plugin family: much larger phase-lifecycle system with specialized sub-agents per concern (UI, security, eval, AI integration, memory, knowledge graph) | Local `.planning/` files in the project repo (`ROADMAP.md`, `PLAN.md`, `SPEC.md`, etc.) | Phase, driven by discuss-phase → plan-phase → execute-phase → verify-work, with optional sub-phase contracts |
| **carl** (`carl-mcp`) | MCP server: persistent, cross-project rules + decision memory, auto-injected at session start via hook | Domain files outside any project repo (global, per-machine); a `<carl-rules>` block is pushed into every session | No lifecycle unit — it's a standing rules/decision layer, not a workflow |

Dev-toolkit and gsd-core both model a **gated feature lifecycle** with human checkpoints. paul is a lighter version of the same idea. carl is orthogonal — it never advances a feature through stages; it just remembers rules and decisions and reminds every session of them.

## 2. Concept Mapping

| Dev-toolkit concept | paul equivalent | gsd-core equivalent | carl equivalent |
|---|---|---|---|
| Living BRD (Notion page, S01–S16) | phase doc produced by `paul:discuss` / `paul:plan` | `SPEC.md` / `PLAN.md` per phase (`gsd-spec-phase`, `gsd-plan-phase`) | — (no per-feature document) |
| `project-manifest.yaml` ([project-manifest](project-manifest.md)) | `paul.toml` (`paul:register`) | `PROJECT.md` + `.planning/` config | `carl_get_manifest` — global, not per-project |
| Toolkit Registry (`~/.toolkit/registry.yaml`, [toolkit-registry](toolkit-registry.md)) | — (no user-global registry found) | global config via `gsd-config` / `gsd-settings` (model profile, workflow toggles) | the `always_on` global rule domain — loaded into every session regardless of project |
| S16 Decision Log | `paul:handoff` session handoff | `gsd-extract-learnings`; decisions recorded in `PLAN.md`/`ROADMAP.md` | `carl_log_decision` → per-domain decision log (`carl_get_decisions`, `carl_search_decisions`) |
| Standards/ (17 tech-rule files, always loaded by relevance) | — (no standards layer found) | implicit in specialized auditors (`gsd-security-auditor`, `gsd-code-reviewer`) rather than a standalone rules set | domain rules (`carl_get_domain_rules`), keyword-triggered per session — e.g. this repo's `BILLING` / `DESIGN` / `ONBOARDING` domains |
| Workflow Orchestrator ([orchestrator](../AI/orchestrator.md)) | `paul:progress` (routes to next action) | `gsd-next` / `gsd-progress` (routes to next action) | none — carl never routes, only injects context |
| 13-stage BRD state machine | discuss → plan → apply → verify, milestone/phase CRUD (`paul:milestone`, `paul:add-phase`) | discuss-phase → plan-phase → execute-phase → verify-work, plus optional `spec-phase`, `ui-phase`, `ai-integration-phase`, `secure-phase`, `eval-review` contracts | — |
| Screen Contract ([screen-contract](screen-contract.md), `C_CONTRACT`) | — (no design-traceability concept found) | `UI-SPEC.md` (`gsd-ui-phase`, `gsd-ui-checker`, `gsd-ui-review`) | — |
| Skills/ (16 roles, [permission-matrix](permission-matrix.md)) | — (no per-role permission model found) | specialized sub-agents per concern (`gsd-planner`, `gsd-executor`, `gsd-verifier`, `gsd-security-auditor`, …) — closest analog, but agent-scoped, not rights-matrix-scoped | — |
| Session resume (Notion state only, no session memory) | `paul:pause` / `paul:resume` (handoff file) | `gsd-pause-work` / `gsd-resume-work`, `gsd-thread` | session-start rule re-injection (`<carl-rules>` block) — re-establishes rule context every session, not a work-resume mechanism |
| Codebase mapping at onboarding ([project-onboarding](../Workflows/project-onboarding.md)) | `paul:map-codebase` | `gsd-map-codebase`, `gsd-onboard`, `gsd-ingest-docs` | — |
| Cross-project reuse unit | none observed — paul is per-repo, no pinned shared dependency | none observed — same | domains are global and live across every project on the machine, unversioned |

## 3. What's Genuinely Different (not just naming)

- **Where state lives.** Dev-toolkit externalizes all feature state to Notion — human-readable, human-editable, survives outside any repo. paul and gsd-core keep state as files inside the project repo. carl keeps state outside every repo, machine-global.
- **Gate mechanics.** Dev-toolkit gates are typed tokens in Notion properties (`Approvals` contains `direction`/`design`/`final`), checked programmatically, invalidated on stale content (§6 of [workflow-state-machine](workflow-state-machine.md)). paul/gsd-core gates are conversational checkpoints (`AskUserQuestion`, review prompts) — no persisted approval token to go stale.
- **Distribution model.** Dev-toolkit is a semver-tagged git submodule — a project pins a version and upgrades deliberately ([versioning](versioning.md)). paul and gsd-core are Claude Code plugins installed at the tool level, not pinned per-project; upgrading the plugin upgrades every project at once.
- **carl has no lifecycle.** It doesn't compete with the other three's phase machines — it's a standing rules-injection + decision-log layer that runs underneath whatever workflow is active. It's closer in spirit to Dev-toolkit's Standards/ + S16 Decision Log combined, but scoped globally instead of per-toolkit-version and per-BRD.

## 4. Boundary (why this is a map, not a wire)

These four systems are **not connected**. Running paul or gsd-core commands inside a Dev-toolkit-managed project would create a second, competing source of truth (local `.planning/`/`.paul/` files vs. the Notion BRD) — the Project Boundary Rule ([integration-map](integration-map.md) §2b) and `C_MANIFEST` guard don't know about either. This document is descriptive only: it exists so a session or a human can translate a request between vocabularies ("do the paul equivalent of a Direction Gate") without guessing. It creates no dependency, changes no gate, and nothing here is read by [orchestrator](../AI/orchestrator.md).

If real integration is ever wanted, the two lowest-risk seams are:
- **carl → S16**: mirror BRD Decision Log entries into a carl domain via `carl_log_decision`, since carl's decision log is additive and doesn't own a lifecycle it could conflict with.
- **gsd-core sub-agents as optional executors** inside a single Dev-toolkit stage (e.g. `gsd-security-auditor` invoked *from* the Tech Review stage) — additive, doesn't touch the state machine.
Both are deliberately out of scope here.
