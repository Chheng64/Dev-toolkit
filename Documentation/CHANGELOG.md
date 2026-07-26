# Changelog

All notable toolkit changes. Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [../Architecture/versioning.md](../Architecture/versioning.md).

## [Unreleased]

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
