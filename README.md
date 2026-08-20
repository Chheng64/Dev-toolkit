# Dev-toolkit

A reusable AI product-development operating system for solo builders working with Claude, Notion, and Git. It turns feature development into a deterministic 13-stage state machine with living documents, hard quality gates, and full resumability — any session can die at any moment and the next one picks up exactly where it left off.

**Version: v1.5.0** · consumed by projects as a version-pinned git submodule · improve a rule once here, every project inherits it at its next pin bump.

---

## High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │      YOU  (three gates)      │
                        │  direction · design · final  │
                        └──────▲───────────────▲───────┘
                       terminal│               │Telegram plugin
                               │               │(extensions/, opt-in)
┌──────────────────────────────┴───────────────┴──────────────────────────────┐
│                          WORKFLOW ORCHESTRATOR                              │
│         state-machine executor · stage routing · model routing ·            │
│         gate enforcement · loop ceilings · resume-from-state                │
│                             AI/orchestrator.md                              │
└───────┬───────────────────────┬───────────────────────┬─────────────────────┘
        │ reads config          │ reads/writes state    │ loads process
┌───────▼────────────┐  ┌───────▼────────────┐  ┌───────▼─────────────────────┐
│ PROJECT MANIFEST   │  │ LIVING BRD         │  │ Workflows/  (15 stages)     │
│ + RESOURCE REGISTRY│  │ Notion, per feature│  │ Skills/     (16 roles)      │
│ project repo       │  │ properties = state │  │ Standards/  Templates/      │
│ SCREEN CONTRACT    │  │ S01–S16 = content  │  │ Checklists/ Prompts/        │
│ project repo       │  │                    │  │ Playbooks/                  │
└────────────────────┘  └─────────▲──────────┘  └─────────────────────────────┘
                                  │ MCP (registry-scoped)
                     External services: Notion (MCP) · GitHub (gh) ·
                     browser (prototype review) · your project repo(s)
                     — only resources BOUND in the registry, never the
                       whole workspace (Project Boundary Rule)
```

The orchestrator is the only component that advances state. Everything it needs to resume lives in the three sources of truth — never in the session. External access is scoped to the Project Resource Registry — the toolkit never searches your workspace once a project is onboarded. Full wiring: [Architecture/integration-map.md](Architecture/integration-map.md).

## Design Philosophy

- **Single source of truth** — every fact has exactly one home (manifest, BRD, or Screen Contract). Workflows consume, never re-ask, never duplicate.
- **Explicit resource ownership** — every project **binds** its external resources (Notion DBs, Figma files, repos, docs, chats) at onboarding, by stable identifier. The registry is a hard boundary: the toolkit touches only what's bound, and asks connect-or-create when something's missing — it never searches your workspace, never guesses. ([Architecture/project-manifest.md](Architecture/project-manifest.md) §3)
- **AI executes, human directs** — Claude runs all 13 stages; you decide at three gates. See [Decision Boundaries](#decision-boundaries).
- **Stage-based development** — features move through a gated state machine with checklisted exits, not freeform prompting.
- **Resume from state, not session** — machine position is reconstructed from Notion properties + the S16 Decision Log. Kill any session, nothing is lost.
- **Modular & versioned** — single-responsibility modules, semver-tagged, consumed as a pinned submodule. Projects upgrade deliberately.
- **Plugin-based integrations** — the core never depends on extensions; adapters (Telegram today) talk only to the orchestrator.

---

## How It Works — Three Ideas

**1. Three sources of truth, nothing duplicated.**

| Artifact | Truth for | Lives in |
|----------|-----------|----------|
| `project-manifest.yaml` | project configuration + **Resource Registry** (every bound external resource, by stable ID) | project repo |
| **Living BRD** (one Notion page per feature) | requirements, decisions, progress, history | Notion database |
| **Screen Contract** (`screens/`) | design → development traceability per screen | project repo |

Workflows consume these; they never re-ask what an artifact already answers. Feature knowledge evolves in the BRD mid-work — findings land the moment they're discovered, never in side documents.

**2. A gated state machine runs every feature.**

```
Ready → Analysis → Planning → Design → Design Review → Dev Planning →
Implementation → QA → Tech Review → PR → Human Review → Merged → Released
        🚦 Direction Gate   🚦 Design Gate              🚦 Final Gate
```

Claude runs every stage; **you only act at the three gates** (approve scope → review the running prototype → approve the PR). Everything else — research with citations, edge-case enumeration, prototype, code, evidence-based QA, 7-dimension review — executes and logs itself to the BRD. Loops are bounded (no infinite revision), approvals go stale if content changes after them, and nothing ships with unmet acceptance criteria.

**3. State lives in Notion, never in the session.** Every transition writes the BRD's Decision Log (S16) and its status properties. Kill any session; the next one reconstructs everything from Notion alone.

## Runtime Execution Model

What actually happens when you say "pick up the ready BRD" — every stage, every session:

```
User request
  ↓
Workflow Orchestrator (AI/orchestrator.md)
  ↓  manifest gate: load + validate project-manifest.yaml (incl. bound Resource Registry)
  ↓  boundary: all external access resolves through the registry — nothing outside it
  ↓  load Living BRD — properties give exact machine position
  ↓  check Screen Contract (blocks Dev Planning if mappings incomplete)
  ↓  load the stage's Workflow + Skill + referenced Standards, at routed model tier
  ↓
Execute current stage  →  findings written to the BRD as discovered
  ↓
Run exit validation (Checklists/) — fail → bounded retry with corrective constraint
  ↓
Update BRD: status + S16 transition entry (atomic)
  ↓
Next stage — or stop and present a decision package if a human gate is pending
```

The orchestrator loads only what the current stage needs; nothing global sits in context. Contract details: [AI/orchestrator.md](AI/orchestrator.md) · [Architecture/workflow-state-machine.md](Architecture/workflow-state-machine.md).

## Toolkit Layer Architecture

```
Layer 1 · CORE ENGINE            orchestrator, state machines, model routing
         fires transitions, enforces gates — the only writer of machine state
                                    ↓
Layer 2 · PROJECT CONFIGURATION  project-manifest.yaml (config + Resource
         Registry), project-overrides.md — tells the engine what this project
         is and which external resources it OWNS; validated before any work
                                    ↓
Layer 3 · DEVELOPMENT SYSTEM     Living BRD, Screen Contract, Workflows,
         Skills, Standards — what each stage does and to what quality bar
                                    ↓
Layer 4 · COMMUNICATION          extensions/ — Telegram v1 (Slack/Discord
         possible later); adapters that relay gates, never advance state
                                    ↓
Layer 5 · EXTERNAL SERVICES      Notion (MCP), GitHub (gh), browser
         where state, code, and review surfaces physically live — reached
         only through Layer-2 registry bindings (Project Boundary Rule)
```

Lower layers never depend on higher ones; extensions and services are replaceable without touching the engine.

---

## One-Time Setup (once ever, ~15 min)

1. **Requirements:** Claude Code (or Claude with MCP), Node 18+, `gh` CLI authenticated, Notion MCP connected.
2. **Create the BRD database + Toolkit Registry** — one database for all projects. Say to Claude:
   ```text
   Create the BRD database per toolkit Documentation/notion-setup.md,
   then write the Toolkit Registry (§3b).
   ```
   The registry (`~/.toolkit/registry.yaml`) records the DB's identity so no project ever searches for it. (Exact properties, views, scaffold: [Documentation/notion-setup.md](Documentation/notion-setup.md); registry contract: [Architecture/toolkit-registry.md](Architecture/toolkit-registry.md).)
3. **Optional — Telegram gate approvals on your phone:** create a bot via @BotFather, `export TELEGRAM_BOT_TOKEN=…` in your shell profile. Wiring happens per-project at onboarding. ([extensions/telegram/README.md](extensions/telegram/README.md))

---

## Start a Project

### Step 0 — Register (optional here; repo not needed yet)

In any session that has the toolkit on disk (your Dev-toolkit clone works):

```text
Register a new project per toolkit project-onboarding step 0:
name <Name>, code <XX>, "<short description>", <product type>,
stage <idea|mvp|...>, stack <headline>.
```

Identity + BRD-ID code reserved in Notion (via the Toolkit Registry). A registered project with no repo yet is a valid resting state. Skipping this is fine — onboarding (Step 2) runs registration as its own step 0.

### Step 1 — Repo + pin

```bash
# new project (or cd into an existing repo — onboarding detects the stack)
npx create-next-app@latest <project> --typescript --tailwind --eslint --app --src-dir --use-npm --yes
cd <project>

git submodule add https://github.com/Chheng64/Dev-toolkit.git toolkit
cd toolkit && git fetch --tags && git checkout v1.5.0 && cd ..
git add -A && git commit -m "chore: pin toolkit v1.5.0"
```

### Step 2 — Onboard (mandatory; nothing runs without it)

```text
Run toolkit/Workflows/project-onboarding.md for this project.
```

~5–10 minutes: detects your stack (asks only what it can't detect) → **Project Resource Binding**: for every supported resource — Notion BRD DB (required, inherited from the Toolkit Registry) + project page (+ optional sprint / decision-log DBs), Figma design file + DS library, GitHub repos (frontend/backend — at least one required — + optional infra), API/architecture/product docs, Telegram (asked **once**: yes / no / later — "later" is never re-asked), and any other MCP-backed resources — you **connect an existing** one, have the toolkit **create a new** one, or **skip** (optional slots; recorded, never re-asked); stable IDs (never display names) land in the Resource Registry → validates every integration and binding (`✓ Notion BRD Database accessible`, `✓ GitHub repository accessible`, …) → generates `project-manifest.yaml` → seeds known screens with stable Screen IDs → generates `context/` (AI session-bootstrap summaries) → **pushes, scaffolds CI if absent, protects `main` (PR-only + required CI), commits, and stamps complete**. From then on the toolkit touches **only registry resources** — it never searches your workspace.

### Step 3 — First BRD

In the BRDs database: new page → `[BRD-<XX>-001] <feature>` → write a one-paragraph problem seed in S01 → set Project + Priority → tick **Ready**. Keep the first feature small — you're proving the loop.

### Step 4 — Run

```text
Act per toolkit/AI/orchestrator.md. Pick up the ready BRD for <project>.
```

The machine runs. You'll be stopped at the Direction Gate first: a summary of the analyzed scope with a recommendation and cut-line. Reply `approve` / `request-changes` / `reject`. Same pattern at Design (review the prototype at `localhost:8765`) and Final (review the PR).

---

## Daily Use — What to Say

| Situation | Say |
|-----------|-----|
| Continue work | `Act per toolkit/AI/orchestrator.md. Resume <BRD-ID>` (or just "pick up where we left off") |
| New feature idea | Create the BRD page, tick Ready, then "pick up the ready BRD" |
| Check state | `Status of all in-flight BRDs` (or `/status` in Telegram) |
| Something's broken | `Run toolkit/Workflows/debug.md on: <symptom>` |
| Production emergency | `Run the hotfix playbook: <symptom>` |
| Project config changed | `toolkit onboard --update` (targeted re-onboarding) |
| New/moved external resource (DB, Figma file, repo, doc) | `toolkit onboard --update` — rebind that slot (connect existing / create new) |
| Enable/change Telegram | `toolkit configure communication` |

Up to **3 BRDs run in parallel** (one branch + one PR each); the orchestrator serializes anything whose planned code areas overlap.

## Execution Lifecycle

End-to-end, from nothing to shipped — the three 🚦 marks are the only places you act:

```
Register → Onboard → Create BRD (Ready)
   ↓
Analysis ──🚦 Direction Gate (approve scope)
   ↓
Planning → Design → Design Review ──🚦 Design Gate (review running prototype)
   ↓
Dev Planning → Implementation → QA → Tech Review → PR
   ↓
Human Review ──🚦 Final Gate (approve PR)
   ↓
Merged → Released
```

Approvals are scoped to what you saw — if gated content changes afterward, the approval is revoked and the gate re-raises.

---

## Rules the Machine Enforces (the point of all this)

- Requirements need **falsifiable acceptance criteria**; QA never marks pass without evidence.
- Every feature designs its **non-happy paths** (error/empty/loading/offline/interrupted) — happy-path-only work bounces.
- UI composes from the **design system first**; ad-hoc styling is a defect, gaps become Extension Notes.
- Silent deviation from plan is forbidden — deviate and log, or route back.
- Reviews cover 7 dimensions (correctness, standards, security, performance, accessibility, DS conformance, plan conformance) on every diff.
- Screens carry stable **SCR-IDs** from onboarding through QA (`C_CONTRACT` blocks implementation on incomplete mappings).
- External access stays inside the **Project Resource Registry** — a missing resource stops the stage with a connect-or-create ask; workspace searching and guessing are defects.
- Approvals are scoped to what you saw — content changes revoke them automatically.
- Model routing: heavyweight reasoning (Opus-tier) only where wrong judgment cascades — Planning, UX, Dev Planning, Review; mechanical work rides cheap tiers. ([AI/model-routing.md](AI/model-routing.md))

## Decision Boundaries

| Human decides | AI executes |
|---------------|-------------|
| Business direction & scope (Direction Gate) | Analysis, research with citations |
| Design approval (Design Gate) | Planning, UX, prototype, implementation |
| Merge approval (Final Gate) | QA with evidence, 7-dimension review, documentation |

If a decision isn't at a gate, it's Claude's — bounded by the permission matrix and logged in S16. ([Architecture/permission-matrix.md](Architecture/permission-matrix.md))

---

## Repository Map & Module Responsibilities

Dependencies point **down toward `Architecture/`** — it depends on nothing; `Playbooks/` alone composes across modules.

| Dir | Purpose | Depends on | Edit when | Claude loads |
|-----|---------|-----------|-----------|--------------|
| [Architecture/](Architecture/) | Contracts: BRD schema (S01–S16), permission matrix, state machines, manifest + Resource Registry, toolkit registry, screen contract, stack profiles, versioning | nothing (foundation) | contract changes — semver-gated | always (via orchestrator) |
| [AI/](AI/) | Runtime: orchestrator, entry contract, BRD update protocol, model routing, MCP setup | Architecture | runtime behavior changes | every session entry |
| [Workflows/](Workflows/) | 15 stage procedures (analysis → release, debug, onboarding) | Architecture | a stage's procedure improves | per stage |
| [Skills/](Skills/) | 16 roles with decision boundaries | Architecture | a role's judgment improves | per stage |
| [Standards/](Standards/) | 17 tech standards (TS, React, Next.js, Tailwind v4, a11y, security, …) | Architecture | a quality bar changes | as referenced by stage |
| [Templates/](Templates/) | 15 artifact formats (requirements, PR, bug report, mappings, …) | Architecture | an artifact format changes | when producing that artifact |
| [Checklists/](Checklists/) | 12 machine-checkable gates | Architecture | an exit criterion changes | at stage exit |
| [Prompts/](Prompts/) | 11 invocation patterns | Architecture | an invocation improves | when you invoke one |
| [Playbooks/](Playbooks/) | full-feature · parallel-brds · hotfix · design-only | everything (composition layer) | a composed flow changes | when a playbook is invoked |
| [extensions/](extensions/telegram/README.md) | Opt-in adapters (Telegram v1) | orchestrator contract only | adding/changing an adapter | only if enabled in manifest |
| [Documentation/](Documentation/) | [Module index](Documentation/module-index.md) · [Onboarding](Documentation/onboarding.md) · [Notion setup](Documentation/notion-setup.md) · [Changelog](Documentation/CHANGELOG.md) | — | docs drift | on demand |

New functionality goes where its single responsibility says: process → `Workflows/`, judgment → `Skills/`, quality bar → `Standards/`, contract → `Architecture/`, adapter → `extensions/`.

Deep-dive order for a new reader: this file → [integration-map](Architecture/integration-map.md) → [workflow-state-machine](Architecture/workflow-state-machine.md) → [module-index](Documentation/module-index.md).

## Extension Architecture

The core toolkit never depends on an extension. Extensions are adapters — they relay gate events out and approvals in **through the Workflow Orchestrator**, which remains the only component that advances state. Telegram ships today ([extensions/telegram/README.md](extensions/telegram/README.md)); Slack, Discord, email, or custom MCP adapters follow the same contract: outbox events at the four triggers, inbox events applied under normal gate rules, nothing else.

---

## Project Lifecycle

```
Register → Onboard → Configure → Develop features (BRD loop, above)
   → Maintain (debug/hotfix playbooks) → Upgrade toolkit pin → Archive
```

A project can rest at any point — registered-without-repo is valid, and an archived project's history stays fully readable in Notion.

## Upgrading a Project

```bash
cd <project>/toolkit && git fetch --tags && git checkout <new-tag> && cd ..
git add toolkit && git commit -m "chore: upgrade toolkit <old> -> <new>"
```

Projects upgrade independently and deliberately — never track `main`. Major bumps: read the changelog migration notes first. In-flight BRDs finish under their pinned version unless you decide otherwise. Semver rules: [Architecture/versioning.md](Architecture/versioning.md).

## Improving the Toolkit

Lessons flow back: retro findings → edit the module here → changelog entry → tag → projects inherit at next bump. Weak prompt/workflow output? Use [Prompts/prompt-improvement.md](Prompts/prompt-improvement.md) — evidence-based, fix the instruction class, re-run the failing case as proof.

## Rules of This Repo

- Single responsibility per file; composition only in `Playbooks/`.
- Dependencies point down toward `Architecture/` only.
- Zero project-specific business logic — project deviations live in each project's `project-overrides.md`.
- No secrets, ever (tokens are env-only).
- This README stays an entry point — overviews link out; detail lives in modules.
