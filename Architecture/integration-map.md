# Integration Map — Notion ↔ Claude ↔ Git

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Consumed by:** AI/CLAUDE-global, AI/orchestrator, Workflows/git, Playbooks

## 1. The Three Systems

| System | Holds | Never holds |
|--------|-------|-------------|
| **Notion** (one DB, all projects) | All feature knowledge: Living BRDs (S01–S16), workflow state (properties), approvals, decision history | Code, build artifacts, global standards |
| **Toolkit repo** (this repo, submoduled) | All global knowledge: workflows, skills, standards, templates, checklists, prompts | Project business logic, feature knowledge, secrets |
| **Toolkit Registry** (`~/.toolkit/registry.yaml`, per user/machine — [toolkit-registry](toolkit-registry.md)) | User-global config: BRD DB identity, projects parent page, bot presence | Secrets, project configuration, feature knowledge |
| **Project repo** | Code, prototypes, tests, thin `CLAUDE.md`, project overrides, toolkit submodule pin | Copies of toolkit content, feature knowledge that belongs in the BRD, user-global facts (inherited from the registry) |

**Knowledge separation rule (hard):** feature knowledge → Notion BRD. Global process knowledge → toolkit. Project-specific technical knowledge (stack quirks, env setup, project conventions that override standards) → project repo `CLAUDE.md` + `project-overrides.md`. Anything written in the wrong layer gets moved, not duplicated.

**Four sources of truth (v2.0):**
| Artifact | Truth for | Lives in |
|----------|-----------|----------|
| [`project-manifest.yaml`](project-manifest.md) | project configuration + **resource registry** | project repo root |
| Living BRD | feature requirements + decisions | Notion |
| [Screen Contract](screen-contract.md) (`screens/`) | design→development traceability | project repo |
| [Shared Contract](shared-contract.md) (`contracts/<brd-id>/`) | FE↔BE API contract for a split BRD, issued once at the phase flip | project repo (or bound `resources.contracts`, split-repo shape) |

Workflows consume these; they never re-collect or duplicate their content. Config change → manifest; requirement change → BRD; mapping change → contract; API-seam change → Shared Contract.

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

## 2b. Project Boundary Rule (v1.5 — hard)

Every project explicitly **owns and binds** its external resources at onboarding ([Project Resource Binding](../Workflows/project-onboarding.md) step 3). The Project Resource Registry — the manifest's `resources:` block plus the `communication:` section ([project-manifest](project-manifest.md) §3) — is the complete, closed list: Notion databases/pages, Figma files/libraries, GitHub repositories, documentation targets, communication channels, each stored by **stable identifier** (database id, file key, repo id, chat id — never display names).

After onboarding, the Workflow Orchestrator and every workflow operate **only inside that registry**. Forbidden, always:

- browsing or searching the user's full Notion workspace (`notion-search` beyond registered databases/pages)
- browsing the user's Figma teams/projects or opening unregistered files
- listing or reaching into GitHub repositories other than the bound ones
- reading documents, chats, or MCP resources not registered to the project

A stage that needs a resource the registry doesn't hold — or holds skipped or `health: unreachable` — does exactly this, nothing else: **stop**, set the BRD `Blocked (resource: <slot> — <reason>)` (resumable; fires the Telegram failure trigger), and raise a **Resource Decision** ([project-manifest](project-manifest.md) §3):

1. **connect an existing resource**, or
2. **create a new one** (either = targeted Resource Binding re-run for that slot), or
3. **confirm absence** — the slot stays/becomes `skipped` and its absence behavior applies.

**Never guess, never workspace-search, never substitute a look-alike.** Boundary violations are process defects; report them like any other broken rule. Enforcement lives in the orchestrator's Manifest Gate + anti-rules ([../AI/orchestrator.md](../AI/orchestrator.md)).

## 3. Naming Contracts

| Thing | Format | Example |
|-------|--------|---------|
| BRD ID | `BRD-<project-code>-<nnn>` | `BRD-RP-042` |
| Branch | `feat/<brd-id-lower>-<slug>` | `feat/brd-rp-042-identity-resolution` |
| Commit | `<type>(<brd-id>): <subject>` | `feat(BRD-RP-042): add profile lookup state` |
| Commit trailers (v2.1) | `Scope: <token>[, …]` mandatory; `Screen: SCR-<nnn>` when the diff touches a screen-bound file | `Scope: R3, R4` + `Screen: SCR-014` |
| PR title | `[<brd-id>] <feature name>` | `[BRD-RP-042] Identity resolution` |
| PR body | from Templates/pull-request; first line links the BRD page URL | — |
| Prototype dir | `design/prototype/<brd-id-lower>/` | `design/prototype/brd-rp-042/` |

Bidirectional links: BRD `Branch` + `PR` + `Compare` properties point at Git; PR body + commits point at BRD. Either side reachable from the other in one hop. **At scope and screen granularity** (v2.1) the bridge is the commit trailer plus its S17 row: `Scope:` names the S03 requirement (`R<n>`), `SCR-<nnn>` names the Screen Contract entity, `chore` is the reserved token for commits that deliver no requirement. Trailers are written at commit time — a rewrite to add or fix one is forbidden once review has started ([git workflow](../Workflows/git.md)); the sanctioned repair is an S17 backfill row.

**Multi-repo BRDs** (backend/infra repos bound beyond the primary): the same branch name is used in every affected repo; one PR per affected repo; the BRD `PR` property holds the primary repo's PR, whose body links the sibling PRs (and S16 lists them). The Final Gate reviews **all** PRs of the set — merge is atomic in intent: none merge until the gate approves the set.

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
2. Run [../Workflows/project-onboarding.md](../Workflows/project-onboarding.md): register → collect/detect stack → **bind every resource** (Connect Existing / Create New / Skip per slot; stable IDs into the registry) → validate integrations + bindings → generate manifest → seed Screen Contract + context/. BRDs pickable only after `onboarding.status: complete` + `resources.status: bound`.
3. Scaffolds land automatically: project `CLAUDE.md` block (from `toolkit/AI/CLAUDE-global.md`), `project-overrides.md` — the only place project rules may differ from Standards/.
4. From here the Project Boundary Rule (§2b) holds: sessions touch registry resources only.

## 6. MCP / Tool Requirements per Layer

| Integration | Tool | Used by | Boundary scope (§2b) |
|-------------|------|---------|----------------------|
| Notion | Notion MCP (`notion-fetch`, `notion-update-page`, `notion-query-data-sources`) | orchestrator, every workflow | registered databases/pages only; no workspace search |
| GitHub | `gh` CLI | Workflows/git, release, code-review | bound repositories only |
| Figma | Figma MCP | ui-workflow, design-system-workflow, flow-visualization (when Figma bound) | bound file keys only; no team browsing |
| Local | Bash, file tools | implementation, qa, debug | project repo(s) |

Details in [../AI/mcp-setup.md](../AI/mcp-setup.md).
