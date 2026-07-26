# Changelog

All notable toolkit changes. Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [../Architecture/versioning.md](../Architecture/versioning.md).

## [Unreleased]

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
