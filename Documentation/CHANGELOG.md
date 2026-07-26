# Changelog

All notable toolkit changes. Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [../Architecture/versioning.md](../Architecture/versioning.md).

## [Unreleased]

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
