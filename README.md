# Dev-toolkit

A reusable AI product-development operating system for solo builders working with Claude, Notion, and Git. It turns feature development into a deterministic 13-stage state machine with living documents, hard quality gates, and full resumability — any session can die at any moment and the next one picks up exactly where it left off.

**Version: v1.4.0** · consumed by projects as a version-pinned git submodule · improve a rule once here, every project inherits it at its next pin bump.

---

## How It Works — Three Ideas

**1. Three sources of truth, nothing duplicated.**

| Artifact | Truth for | Lives in |
|----------|-----------|----------|
| `project-manifest.yaml` | project configuration (stack, design, integrations, git) | project repo |
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

---

## One-Time Setup (once ever, ~15 min)

1. **Requirements:** Claude Code (or Claude with MCP), Node 18+, `gh` CLI authenticated, Notion MCP connected.
2. **Create the BRD database** — one database for all projects. Say to Claude:
   ```text
   Create the BRD database per toolkit Documentation/notion-setup.md.
   ```
   (Exact properties, views, and page scaffold: [Documentation/notion-setup.md](Documentation/notion-setup.md).)
3. **Optional — Telegram gate approvals on your phone:** create a bot via @BotFather, `export TELEGRAM_BOT_TOKEN=…` in your shell profile. Wiring happens per-project at onboarding. ([extensions/telegram/README.md](extensions/telegram/README.md))

---

## Start a Project

### Step 0 — Register (repo optional at this point)

```text
Register a new project per toolkit project-onboarding step 0:
name <Name>, code <XX>, <product type>, stage <idea|mvp|...>, stack <headline>.
```

Identity + BRD-ID code reserved in Notion. A registered project with no repo yet is a valid resting state.

### Step 1 — Repo + pin

```bash
# new project (or cd into an existing repo — onboarding detects the stack)
npx create-next-app@latest <project> --typescript --tailwind --eslint --app --src-dir --use-npm --yes
cd <project>

git submodule add https://github.com/Chheng64/Dev-toolkit.git toolkit
cd toolkit && git fetch --tags && git checkout v1.4.0 && cd ..
git add -A && git commit -m "chore: pin toolkit v1.4.0"
```

### Step 2 — Onboard (mandatory; nothing runs without it)

```text
Run toolkit/Workflows/project-onboarding.md for this project.
```

~5 minutes: detects your stack (asks only what it can't detect) → validates every integration and URL → seeds known screens with stable Screen IDs → generates `project-manifest.yaml` + `context/` (AI session-bootstrap summaries) → asks about Telegram **once** (yes / no / later — "later" is never re-asked) → commits. Then push and protect `main` (PR-only + CI).

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
| Enable/change Telegram | `toolkit configure communication` |

Up to **3 BRDs run in parallel** (one branch + one PR each); the orchestrator serializes anything whose planned code areas overlap.

---

## Rules the Machine Enforces (the point of all this)

- Requirements need **falsifiable acceptance criteria**; QA never marks pass without evidence.
- Every feature designs its **non-happy paths** (error/empty/loading/offline/interrupted) — happy-path-only work bounces.
- UI composes from the **design system first**; ad-hoc styling is a defect, gaps become Extension Notes.
- Silent deviation from plan is forbidden — deviate and log, or route back.
- Reviews cover 7 dimensions (correctness, standards, security, performance, accessibility, DS conformance, plan conformance) on every diff.
- Screens carry stable **SCR-IDs** from onboarding through QA (`C_CONTRACT` blocks implementation on incomplete mappings).
- Approvals are scoped to what you saw — content changes revoke them automatically.
- Model routing: heavyweight reasoning (Opus-tier) only where wrong judgment cascades — Planning, UX, Dev Planning, Review; mechanical work rides cheap tiers. ([AI/model-routing.md](AI/model-routing.md))

---

## Repository Map

| Dir | Holds |
|-----|-------|
| [Architecture/](Architecture/) | Contracts: BRD schema (S01–S16), permission matrix, state machines, manifest, screen contract, stack profiles, versioning |
| [AI/](AI/) | Runtime: orchestrator, entry contract, BRD update protocol, model routing, MCP setup |
| [Workflows/](Workflows/) | 15 stage procedures (analysis → release, debug, onboarding) |
| [Skills/](Skills/) | 16 roles with decision boundaries |
| [Standards/](Standards/) | 17 tech standards (TS, React, Next.js, Tailwind v4, a11y, security, …) |
| [Templates/](Templates/) | 15 artifact formats (requirements, PR, bug report, mappings, …) |
| [Checklists/](Checklists/) | 12 machine-checkable gates |
| [Prompts/](Prompts/) | 11 invocation patterns |
| [Playbooks/](Playbooks/) | full-feature · parallel-brds · hotfix · design-only |
| [extensions/](extensions/telegram/README.md) | Opt-in adapters (Telegram v1) |
| [Documentation/](Documentation/) | [Module index](Documentation/module-index.md) · [Onboarding](Documentation/onboarding.md) · [Notion setup](Documentation/notion-setup.md) · [Changelog](Documentation/CHANGELOG.md) |

Deep-dive order for a new reader: this file → [integration-map](Architecture/integration-map.md) → [workflow-state-machine](Architecture/workflow-state-machine.md) → [module-index](Documentation/module-index.md).

---

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
