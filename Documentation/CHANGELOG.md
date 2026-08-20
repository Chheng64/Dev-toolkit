# Changelog

All notable toolkit changes. Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [../Architecture/versioning.md](../Architecture/versioning.md).

## [Unreleased]

## [1.5.0] — 2026-08-21

**Project Resource Binding** — every project explicitly owns and binds its external resources; the toolkit never searches the user's workspace once a project is onboarded.

### Added — architecture (flow-review hardening)
- `Architecture/ecosystem-map.md` — **Ecosystem Map**: concept-level bridge between this toolkit and the `paul` / `gsd-*` / `carl-mcp` systems the user also runs (equivalence table, state-ownership boundaries). Informational — no runtime dependency, not executed by the orchestrator.
- `Architecture/toolkit-registry.md` — **Toolkit Registry** (`~/.toolkit/registry.yaml`): user-global config layer owning the BRD DB identity (one DB, all projects = toolkit-level resource), projects parent page, bot presence. Written at one-time setup; inherited by every manifest. Kills the registration↔binding bootstrap circularity — step 0 reads it, never searches.
- **Resource lifecycle model** (`project-manifest.md` §3): `binding` (disposition — immutable decision) split from `health` (`ok`/`unreachable` — runtime, restamped by validation). One **Resource Decision** primitive (connect / create / confirm-absence) covers missing, skipped-but-required, and unreachable slots; per-slot **absence behavior** table generalizes the Figma prototype-only rule; rebind-fallout + rebind-logging rules.
- **Manifest Gate pipeline** (`orchestrator.md` responsibility 0): fixed order — Toolkit Registry → manifest → **version migration** → staleness → C_MANIFEST — at session entry, pickup and resume alike. `Migration (v1→v2)` is now an orchestrator-triggered, seeded, resumable procedure (`project-onboarding.md` §Migration, with per-field seeding table); the "v1 remains pickable" contradiction removed.
- **State machine**: `Blocked Reason` taxonomy (typed: `resource:` / `paused-by-user` / `ceiling:` / `ambiguity:` / `error:`); missing-resource transition (any in-flight → Blocked, resumable, fires Telegram trigger); new guard **`C_RESOURCES`** at Dev Planning exit (plan-implied slots must be bound + healthy — gaps stop at the cheap point, not mid-Implementation).
- **Onboarding end-to-end fixes**: step 0 reads the registry + creates the identity page (circularity gone); GitHub create-new pushes so the default branch exists for validation; step 6 writes `incomplete`, step 9 scaffolds CI + pushes + applies branch protection (`gh api`, actor defined) + stamps complete; unified rebind rule (any mutation = step 3+4+5 for the slot); re-open phrases defined as say-to-Claude routes; Telegram yes-path made executable (user creates chat, `getUpdates` discovery, test-send after manifest write, failure → `deferred` without consuming ask-once).
- Screen contract: pre-existing screens seed as `implemented (pre-toolkit)` (backfill-on-claim rule); §4 keys off "no **healthy** Figma binding"; multi-repo BRD branch/PR contract (`integration-map.md` §3).

### Added
- `Architecture/project-manifest.md` §3 — **Project Resource Registry**: `resources:` block (manifest_version 2) as the sole home of external resource identity. Slots per provider — Notion (BRD DB **required**, project page, sprint/decision-log DBs), Figma (product design file, design-system library), GitHub (frontend/backend — ≥1 **required** — + optional infrastructure repo), documentation (API/architecture/product), communication (Telegram, stable `communication.*` path kept for the plugin), other MCP-backed resources. Uniform binding record: **stable identifier** (database id / file key / numeric repo id / chat id — never display names) + `binding: connected | created | skipped` + `bound`/`validated` stamps. Explicit-skip rule: optional slots are resolved or skipped, never silently absent, never re-asked, never guessed.
- `Architecture/integration-map.md` §2b — **Project Boundary Rule (hard)**: after onboarding, orchestrator + workflows access only registry resources; workspace-wide Notion search, Figma browsing, and repo listing are forbidden. Missing resource → stop + *connect existing / create new* offer (targeted rebind). §6 gains a per-integration boundary-scope column.
- `Workflows/project-onboarding.md` step 3 — **Project Resource Binding stage**: per-slot Connect Existing / Create New / Skip table with per-provider stable-ID resolution; step 5 binding validation with verbatim `✓ / ○ Skipped` checklist; "After Onboarding — the Boundary Holds" section. Communication step (v1.4 7b) folded into the binding stage; asked-once rule unchanged.
- `AI/orchestrator.md` responsibility 0b + anti-rule — resource-boundary enforcement: registry-scoped access, connect/create escalation, S16 logging.
- Manifest v1→v2 migration path (`project-manifest.md` §1): first pickup offers a binding re-run seeded from existing `notion.*`/`design.*`/`git.repository` values.

### Changed
- `Architecture/project-manifest.md` — `design:` reduced to code-side config (figma resource identity → `resources.figma`); `notion:` block dissolved into `resources.notion`; `git:` keeps behavior only (`primary_repository` names the manifest-hosting repo slot; identity → `resources.github`); consumption rule 2 (registry-only access) + validation §5 require `resources.status: bound` and stable ids.
- `Architecture/workflow-state-machine.md` — `C_MANIFEST` now also requires `resources.status: bound` with required bindings validated.
- `Workflows/integration-validation.md` — checks resolve via registry ids; new registry re-check row (staleness re-validates bindings, restamps `resources.*.validated`); validation never becomes workspace discovery.
- `Templates/project-configuration.md` — Design/Notion/Git resource questions replaced by a Project Resource Binding section (connect/create/skip per slot); Git Behavior section retains strategy-only fields.
- `Architecture/screen-contract.md` §4 + `Checklists/screen-contract.md` — Figma-optional rule keys off `resources.figma.product_design_file` binding.
- `AI/mcp-setup.md` — Notion toolset drops `notion-search` (boundary); Figma MCP applicability keyed to the registry binding, not BRD mentions; all rows note registry scope.
- `Architecture/context-package.md` — `design.md` source of truth includes `resources.figma.*`.
- `extensions/telegram/README.md` — setup points at the Resource Binding stage; re-open phrases limited to the sanctioned two.
- `Documentation/onboarding.md`, `README.md` — Resource Binding + boundary as first-class architecture concepts; v1.5.0 pins.

### Fixed
- `extensions/telegram/telegram-plugin.mjs` — manifest reader now strips surrounding quotes from values; previously `chat_id: "-100…"` (as the schema shows) yielded literal quote characters — every send targeted an invalid chat and the allow-list never matched.
- Manifest schema — undefined `notifications.pipeline` flag removed (no event type maps to it; `failures` already covers pipeline-failed).
- `extensions/telegram/telegram-plugin.mjs` — project-name reader now strips inline comments and surrounding quotes; `name: "My Project"` previously reached every notification with literal quote characters.
- `extensions/telegram/telegram-plugin.mjs` — dead `pipeline: true` key dropped from the notifications default (only `approvals` and `failures` are read).

## [1.4.1] — 2026-07-26

### Changed
- `README.md` — rewritten as a complete getting-started guide: three core ideas, one-time setup, start-a-project runbook (register → pin → onboard → first BRD → run), daily-use phrase table, enforced-rules summary, repo map with reading order, upgrade + toolkit-improvement flow.

## [1.4.0] — 2026-07-26

Telegram Plugin v1 (extension) + communication integrations in onboarding.

### Added
- `extensions/telegram/` — communication adapter (NOT core): `telegram-plugin.mjs` (zero-dependency Node daemon — outbox flush, long-poll, /status, inline Approve/Reject/Pause/Resume; chat allow-list; `--test`/`--once`) + README with the file-spool event contract (`.toolkit/telegram/{outbox,inbox}/`, `status.json`). Four notification triggers only: Direction gate, Design gate, PR ready, pipeline failed. Approvals are recorded intents — orchestrator applies them under normal gate rules (`source: telegram` in S16). v2 seams declared (AI chat, notes, voice, daily summaries; Slack/Discord/email as sibling adapters over the same spool).
- `Architecture/project-manifest.md` — `communication.telegram` block (routing only; tokens env-only, never in repo).
- `Workflows/project-onboarding.md` — step 7b: communication integrations asked ONCE (Yes / No / Configure later); test-send required before `enabled: true`; never re-asked except explicit "toolkit configure communication" / "toolkit onboard --update".
- `AI/orchestrator.md` — responsibility 9: outbox events at the four triggers, status.json refresh per transition, inbox read at session entry + before gate checks.

## [1.3.0] — 2026-07-26

Onboarding enhancements — incremental, existing flow remains the default shape.

### Added
- `Architecture/context-package.md` — AI Context Package spec: `context/` with 5 generated summaries (design, stack, integrations, conventions, model-routing); derived-only rule, regeneration triggers, session bootstrap order, staleness check.
- Onboarding step 0 **Project Registration** — stable identity (name, code, product type, stage, intended stack) established and reserved in Notion BEFORE repository initialization; registered-not-initialized is a valid resting state; `manifest.project.registered` stamp.
- Onboarding step 6 **Screen Contract initialization** — registry created at onboarding; known screens optionally seeded with real SCR-IDs (`planned`/`unassigned`); UI planning claims seeded rows instead of creating duplicates.
- Onboarding step 7 **Context Package generation**.

### Changed
- `Workflows/project-onboarding.md` — procedure now 0–8; outputs + completion criteria extended.
- `Architecture/screen-contract.md` — two registration paths (onboarding seed / UI planning); claim semantics; `C_CONTRACT` evaluates owned rows only, `unassigned` rows inert.
- `Architecture/project-manifest.md` — `project.registered`, `context_package` block.
- `Templates/project-configuration.md` — Registration section (pre-repo) + optional Initial Screens seed section.
- `AI/CLAUDE-global.md` — context/ in project stub + session bootstrap order.

## [1.2.0] — 2026-07-26

Project Onboarding System + Screen Contract System. Two new hard guards; no breaking changes (Status values untouched — both stages run as guards/pre-pipeline).

### Added
- `Architecture/project-manifest.md` — per-project config contract (`project-manifest.yaml`): project info, stack, design, Notion, git, integrations, screen-contract state. Single source of truth for project configuration; workflows read it instead of re-asking.
- `Architecture/screen-contract.md` — `screens/` registry (SCR-nnn, never reused) + per-screen contracts with 5 mapping blocks (design/prototype/frontend/API/QA); Figma-optional rule; ownership per role; six-check validation.
- `Architecture/stack-profiles.md` — manifest stack → applicable Standards; honest gap declarations; design-stage collapse for headless profiles.
- `Workflows/project-onboarding.md` — detect-first interview → resource validation → manifest generation → scaffolds. Once per project; targeted re-runs on evolution.
- `Workflows/integration-validation.md` — per-integration checks (required vs optional), manifest recording, per-stage degradation warnings; 30-day staleness re-check.
- `Checklists/screen-contract.md` — `C_CONTRACT` executable validator (registry, design, frontend, API, QA mappings; failure reporting format).
- `Templates/project-configuration.md`, `design-mapping.md`, `frontend-mapping.md`, `api-mapping.md`.

### Changed
- `Architecture/workflow-state-machine.md` — §1b project pre-pipeline (Onboarding → Integration Validation → Manifest); guards `C_MANIFEST` (every pickup) + `C_CONTRACT` (Dev Planning entry); Design Review transition split on contract pass/fail.
- `AI/orchestrator.md` — responsibility 0: manifest gate before any project work; `C_CONTRACT` run at Dev Planning entry with `SCR-id · block · gap` reporting.
- `AI/CLAUDE-global.md` — project stub now points at the manifest; onboarding is the only permitted work without one.
- `Architecture/integration-map.md` — three-sources-of-truth table (manifest / BRD / screen contract).
- `Architecture/brd-schema.md` — SCR-ID reference rule (sections cite IDs; mappings live in the contract).
- `Workflows/ui-workflow.md` (screen registration step 0), `frontend-planning.md` (+frontend mapping duty), `backend-planning.md` (+API mapping duty), `Checklists/development-ready.md` (+`C_CONTRACT` precondition).

## [1.1.0] — 2026-07-26

### Added
- `AI/model-routing.md` — Model Routing Strategy: tier table (Haiku/Sonnet/Opus/frontier) per workflow stage, 7 escalation rules (retry +1 tier, loop escalates producer, debug triggers, no mid-stage downgrade, de-escalation, T4 reserve, ceiling posture), cross-model verification pairs (producer ≠ verifier), 6 handoff rules across model/session boundaries (BRD-only channel, fresh-session verify stages, escalation receives failure evidence), cost posture.
- `Architecture/brd-schema.md` — optional `Prototype` URL property (design artifact quick link); live in the BRDs database.

### Changed
- `AI/orchestrator.md` — stage routing consults model-routing and logs the model tier in Stage-Enter S16 entries.

## [1.0.0] — 2026-07-26

Phase 6 — Meta. Toolkit complete.

### Added
- `Documentation/module-index.md` — every module, one line, grouped by layer.
- `Documentation/onboarding.md` — new project in ~10 minutes + first-BRD health signs.
- `Documentation/notion-setup.md` — exact BRD database recipe (properties, views, page scaffold, MCP-driven create).

### Milestone
- All 9 layers complete: Architecture (6), AI (4), Workflows (13), Skills (16), Standards (17), Templates (11), Checklists (11), Prompts (11), Playbooks (4) — 93 modules + meta. Contracts frozen at 1.0: BRD schema S01–S16, permission matrix, Status values, gate tokens. Breaking changes from here follow versioning.md majors.

## [0.6.0] — 2026-07-26

Phase 5 — Prompts + Playbooks.

### Added
- `Prompts/` — 11 reusable invocation patterns, each binding a task to its workflow/skill/checklist with required inputs and bounce rules: planning, research (citations-or-nothing), architecture (options + recommendation), design (per machine-state cluster), development (slice sessions), refactoring (characterize-first), testing (QA + gap modes), debugging (hypothesis ledger), documentation (layer routing), review (full + dimension modes), prompt-improvement (evidence-based toolkit self-repair).
- `Playbooks/` — 4 compositions (the only composing layer): full-feature (13 stages + loop wiring + session pattern), parallel-brds (cap 3, conflict rules, gate batching), hotfix (compressed ceremony, gates-that-matter preserved, mandatory prevention sweep), design-only (design-terminal path + staleness check on build resume).

## [0.5.0] — 2026-07-26

Phase 4 — Gates: templates + checklists.

### Added
- `Templates/` — 11 fill-in structures: feature-request (BRD seed), product-requirement (S03 entry format, R/AC IDs), technical-specification (S10 with failure table + slices), development-plan (S11 with AC→test mapping), bug-report (S13 entry, repro-or-nothing), design-handoff (links-not-copies, NOT-authoritative list), component-documentation (DS doc beside code), api-specification (contract of record, error→S09 mapping), pull-request (Final Gate decision package), release-notes (S15 outcome language), retrospective (evidence-based, feeds toolkit).
- `Checklists/` — 11 machine-checkable gates: analysis, ux-review, ui-review, design-qa (self-audit), development-ready, code-review (7 dimensions + absences), qa-testing (evidence per verdict), accessibility (mechanism-level), performance (banned-waste sweep + budgets), security (boundary/authz/leakage/closure), release (smoke-check + deferred sweep).
- Phase 3 forward links now resolve.

## [0.4.0] — 2026-07-26

Phase 3 — Standards.

### Added
- `Standards/` — 17 opinionated tech standards, each with rules + anti-patterns: typescript (strict, discriminated unions, boundary parsing), react (composition, state altitude, effect discipline), nextjs (RSC-default, explicit caching, S09 framework homes), tailwind (v4 tokens-first, no arbitrary values), design-system (3 layers, API discipline, quality bar), accessibility (WCAG 2.2 AA floor, non-negotiable), responsive-design (mobile-first, container queries), naming-conventions (semantic honesty, UX-name traceability), folder-structure (feature modules, import direction), component-structure (altitude split, state rendering), api-design (zod contracts, normalized errors, idempotency), code-quality (gates, testing layers, rule of three), performance (measure-first, structural waste banned), security (trust boundaries, default deny, defensive floor), internationalization (i18n-ready floor + full i18n), documentation (routing table, same-commit updates), git-strategy (trunk-based, 1 BRD = 1 branch = 1 PR).

### Note
- Forward links to `Templates/`/`Checklists/` resolve in 0.5.0.

## [0.3.0] — 2026-07-26

Phase 2 — Roles.

### Added
- `Skills/` — 16 role definitions, each: role identity, responsibilities, decision boundaries (decides / escalates / never), BRD rights (matrix-referenced), expected output, handoff. Business Analyst, Product Manager, UX Designer, UI Designer, Design System Engineer, Frontend Engineer, Backend Engineer, Full Stack Engineer, QA Engineer, Code Reviewer, Technical Writer, Git Manager, Debug Specialist, Performance Optimizer, Accessibility Specialist, Security Reviewer.

## [0.2.0] — 2026-07-26

Phase 1 — Workflow spine.

### Added
- `Workflows/business-analysis.md` — Analysis stage; runs design states 01–02; Clarification Gate.
- `Workflows/product-planning.md` — Planning stage; design state 03; proceed/re-scope/stop + Direction Gate.
- `Workflows/ux-workflow.md` — Design states 04–05; tasks, IA, flows, ≥3 non-happy paths per task, a11y strategy.
- `Workflows/ui-workflow.md` — Design states 06–08; DS-first planning, prototype, self-audit.
- `Workflows/design-system-workflow.md` — supporting workflow; Extension Note triage, smallest-altitude extensions.
- `Workflows/frontend-planning.md` — Dev Planning (FE); S10/S11, touched-areas conflict check, test plan per AC.
- `Workflows/backend-planning.md` — Dev Planning (BE); API/error contracts, idempotency, authz default-deny.
- `Workflows/implementation.md` — build per plan; logged deviations; DS composition; suppression justification.
- `Workflows/qa.md` — evidence-based AC verification; S09 walk; severity discipline; L_QA loop.
- `Workflows/code-review.md` — 7 review dimensions; plan-conformance; L_REVIEW loop.
- `Workflows/git.md` — branch/commit/PR contracts; CI gate; stale-approval merge protection.
- `Workflows/release.md` — deploy + smoke-check; S15 notes; deferred-items sweep; BRD freeze.
- `Workflows/debug.md` — off-path; reproduce→falsify→root-cause→smallest fix→regression test.

## [0.1.0] — 2026-07-26

Phase 0 — Foundation.

### Added
- `Architecture/brd-schema.md` — Living BRD contract: Notion DB properties, sections S01–S16, update modes, decision-log format.
- `Architecture/permission-matrix.md` — 16 roles × 16 sections edit rights; cross-domain findings protocol.
- `Architecture/workflow-state-machine.md` — 13-stage lifecycle, transitions, guards, loops, human gates, 3-BRD parallelism.
- `Architecture/design-state-machine.md` — design sub-machine (states 01–11) adapted from "AI Product Design Agent — Workflow Architecture"; artifacts remapped to BRD sections.
- `Architecture/integration-map.md` — Notion ↔ Claude ↔ Git wiring, naming contracts, knowledge-layer separation, project onboarding.
- `Architecture/versioning.md` — semver rules, submodule distribution, upgrade path.
- `AI/CLAUDE-global.md` — per-project entry contract + project CLAUDE.md stub.
- `AI/orchestrator.md` — Workflow Orchestrator: stage routing, input verification, gate enforcement, loop accounting, Notion state updates, resume.
- `AI/brd-update-protocol.md` — role-scoped Notion write procedure, cross-domain protocol, anti-patterns.
- `AI/mcp-setup.md` — integration requirements per stage + degradation rules.
- Folder scaffold for Phases 1–6.
