# Integration Map — Notion ↔ Claude ↔ Git

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Consumed by:** AI/CLAUDE-global, AI/orchestrator, Workflows/git, Playbooks

## 1. The Three Systems

| System | Holds | Never holds |
|--------|-------|-------------|
| **Notion** (one DB, all projects) | All feature knowledge: Living BRDs (S01–S16), workflow state (properties), approvals, decision history | Code, build artifacts, global standards |
| **Toolkit repo** (this repo, submoduled) | All global knowledge: workflows, skills, standards, templates, checklists, prompts | Project business logic, feature knowledge, secrets |
| **Project repo** | Code, prototypes, tests, thin `CLAUDE.md`, project overrides, toolkit submodule pin | Copies of toolkit content, feature knowledge that belongs in the BRD |

**Knowledge separation rule (hard):** feature knowledge → Notion BRD. Global process knowledge → toolkit. Project-specific technical knowledge (stack quirks, env setup, project conventions that override standards) → project repo `CLAUDE.md` + `project-overrides.md`. Anything written in the wrong layer gets moved, not duplicated.

## 2. Wiring Diagram

```
┌────────────── NOTION (MCP) ──────────────┐
│ BRD DB: one page per feature, all projects│
│  properties = machine state               │
│  S01–S16 = living content                 │
└───────▲──────────────────▲────────────────┘
        │ read state,      │ write sections,
        │ pick BRD         │ advance status, log S16
┌───────┴──────────────────┴────────────────┐
│ CLAUDE session (any machine, any day)     │
│  project CLAUDE.md → toolkit submodule    │
│  AI/orchestrator routes stage → workflow  │
│  workflow loads skill + standards         │
└───────▲──────────────────▲────────────────┘
        │ branch/commit/PR │ CI status, merge
┌───────┴──────────────────┴────────────────┐
│ PROJECT REPO (GitHub, gh CLI)             │
│  feat/<brd-id>-<slug> · PR ↔ BRD link     │
│  toolkit/ submodule @ vX.Y.Z              │
└───────────────────────────────────────────┘
```

## 3. Naming Contracts

| Thing | Format | Example |
|-------|--------|---------|
| BRD ID | `BRD-<project-code>-<nnn>` | `BRD-RP-042` |
| Branch | `feat/<brd-id-lower>-<slug>` | `feat/brd-rp-042-identity-resolution` |
| Commit | `<type>(<brd-id>): <subject>` | `feat(BRD-RP-042): add profile lookup state` |
| PR title | `[<brd-id>] <feature name>` | `[BRD-RP-042] Identity resolution` |
| PR body | from Templates/pull-request; first line links the BRD page URL | — |
| Prototype dir | `design/prototype/<brd-id-lower>/` | `design/prototype/brd-rp-042/` |

Bidirectional links: BRD `Branch` + `PR` properties point at Git; PR body + commits point at BRD. Either side reachable from the other in one hop.

## 4. Lifecycle Loop (end to end)

1. **Intake** — you create/refine a BRD page, set `Project`, `Priority`, tick `Ready`.
2. **Pickup** — orchestrator lists `Ready` BRDs, checks `C_SLOT_FREE` (<3 in-flight), picks by priority, sets `Status: Analysis`, `Toolkit Version`, logs S16.
3. **Stages run** — per [workflow-state-machine.md](workflow-state-machine.md). Each stage: orchestrator loads workflow module → workflow declares its skill → Claude acts with that role's matrix rights → writes BRD sections via Notion MCP → exit checklist → status advances → S16 entry.
4. **Design** — design sub-machine (states 04–08); prototype lives on the BRD branch; Design Gate reviews the running prototype.
5. **Build** — Dev Planning fills S10/S11; Implementation works the branch with S12 progress entries; new findings update the BRD **immediately, mid-stage**, not at stage end.
6. **Verify** — QA fills S13 against ACs; Tech Review fills S14; Git workflow opens PR.
7. **Ship** — Final Gate on the PR; merge; Release workflow writes S15 back to the BRD; `Status: Released`.
8. **Anytime** — blocking issue → `Status: Blocked` + `Blocked Reason`; any later session resumes from Notion state alone.

## 5. Project Onboarding (new project, ~10 min)

1. `git submodule add <toolkit-url> toolkit && cd toolkit && git checkout <latest-tag>`
2. Copy `toolkit/AI/CLAUDE-global.md` reference block into project `CLAUDE.md` (points at submodule; adds project code, stack notes, overrides file path).
3. Create `project-overrides.md` (empty scaffold) — the only place project rules may differ from Standards/.
4. In Notion: add project to the DB `Project` select. Done — BRDs immediately pickable.

## 6. MCP / Tool Requirements per Layer

| Integration | Tool | Used by |
|-------------|------|---------|
| Notion | Notion MCP (`notion-fetch`, `notion-update-page`, `notion-search`, `notion-query-data-sources`) | orchestrator, every workflow |
| GitHub | `gh` CLI | Workflows/git, release, code-review |
| Figma | Figma MCP | ui-workflow, design-system-workflow (when Figma refs exist) |
| Local | Bash, file tools | implementation, qa, debug |

Details in [../AI/mcp-setup.md](../AI/mcp-setup.md).
