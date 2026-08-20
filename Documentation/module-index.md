# Module Index

Every module, one line. Load only what the task needs — this index is the map, not the cargo.

## Architecture/ (contracts — everything references these)
- [brd-schema](../Architecture/brd-schema.md) — Living BRD contract: Notion properties, S01–S16, update modes, decision-log format
- [permission-matrix](../Architecture/permission-matrix.md) — 16 roles × 16 sections rights; cross-domain `Affects:` protocol
- [workflow-state-machine](../Architecture/workflow-state-machine.md) — 13-stage lifecycle: transitions, guards, loops, gates, parallelism
- [design-state-machine](../Architecture/design-state-machine.md) — design sub-machine (states 01–11), artifacts→BRD remapping
- [integration-map](../Architecture/integration-map.md) — Notion↔Claude↔Git wiring, naming contracts, knowledge layers, Project Boundary Rule (§2b), onboarding
- [versioning](../Architecture/versioning.md) — semver, submodule pin/upgrade, compatibility promise
- [project-manifest](../Architecture/project-manifest.md) — per-project config contract + Project Resource Registry (stable-ID bindings, health, Resource Decision, §3); `C_MANIFEST` gates all BRD work
- [toolkit-registry](../Architecture/toolkit-registry.md) — user-global config (`~/.toolkit/registry.yaml`): BRD DB identity, projects parent page; inherited by every manifest
- [screen-contract](../Architecture/screen-contract.md) — SCR registry + 5 mapping blocks; `C_CONTRACT` gates Dev Planning
- [stack-profiles](../Architecture/stack-profiles.md) — manifest stack → applicable Standards + honest gaps
- [context-package](../Architecture/context-package.md) — generated `context/` session-bootstrap summaries (derived cache, never edited)
- [ecosystem-map](../Architecture/ecosystem-map.md) — concept bridge to paul/gsd-core/carl (informational only, no runtime dependency)

## AI/ (runtime)
- [CLAUDE-global](../AI/CLAUDE-global.md) — per-project entry contract + CLAUDE.md stub
- [orchestrator](../AI/orchestrator.md) — the machine executor: pickup, routing, gates, loops, resume, Notion state
- [brd-update-protocol](../AI/brd-update-protocol.md) — role-scoped Notion writes, living-doc rules
- [mcp-setup](../AI/mcp-setup.md) — per-stage integrations + loud-degradation rules
- [model-routing](../AI/model-routing.md) — model tier per stage, escalation rules, cross-model handoffs

## Workflows/ (stage procedures)
- [business-analysis](../Workflows/business-analysis.md) · [product-planning](../Workflows/product-planning.md) · [ux-workflow](../Workflows/ux-workflow.md) · [ui-workflow](../Workflows/ui-workflow.md) · [design-system-workflow](../Workflows/design-system-workflow.md)
- [frontend-planning](../Workflows/frontend-planning.md) · [backend-planning](../Workflows/backend-planning.md) · [implementation](../Workflows/implementation.md)
- [qa](../Workflows/qa.md) · [code-review](../Workflows/code-review.md) · [git](../Workflows/git.md) · [release](../Workflows/release.md) · [debug](../Workflows/debug.md)
- Per-project: [project-onboarding](../Workflows/project-onboarding.md) · [integration-validation](../Workflows/integration-validation.md)

## Skills/ (roles)
- Pipeline: [business-analyst](../Skills/business-analyst.md) · [product-manager](../Skills/product-manager.md) · [ux-designer](../Skills/ux-designer.md) · [ui-designer](../Skills/ui-designer.md) · [frontend-engineer](../Skills/frontend-engineer.md) · [backend-engineer](../Skills/backend-engineer.md) · [fullstack-engineer](../Skills/fullstack-engineer.md) · [qa-engineer](../Skills/qa-engineer.md) · [code-reviewer](../Skills/code-reviewer.md) · [git-manager](../Skills/git-manager.md)
- Support: [design-system-engineer](../Skills/design-system-engineer.md) · [technical-writer](../Skills/technical-writer.md) · [debug-specialist](../Skills/debug-specialist.md)
- Dimensions: [performance-optimizer](../Skills/performance-optimizer.md) · [accessibility-specialist](../Skills/accessibility-specialist.md) · [security-reviewer](../Skills/security-reviewer.md)

## Standards/ (tech rules)
- Language/framework: [typescript](../Standards/typescript.md) · [react](../Standards/react.md) · [nextjs](../Standards/nextjs.md) · [tailwind](../Standards/tailwind.md)
- Design: [design-system](../Standards/design-system.md) · [accessibility](../Standards/accessibility.md) · [responsive-design](../Standards/responsive-design.md)
- Structure: [naming-conventions](../Standards/naming-conventions.md) · [folder-structure](../Standards/folder-structure.md) · [component-structure](../Standards/component-structure.md)
- Server/quality: [api-design](../Standards/api-design.md) · [code-quality](../Standards/code-quality.md) · [performance](../Standards/performance.md) · [security](../Standards/security.md) · [internationalization](../Standards/internationalization.md)
- Process: [documentation](../Standards/documentation.md) · [git-strategy](../Standards/git-strategy.md)

## Templates/ (fill-in structures)
- BRD: [feature-request](../Templates/feature-request.md) · [product-requirement](../Templates/product-requirement.md) · [technical-specification](../Templates/technical-specification.md) · [development-plan](../Templates/development-plan.md) · [bug-report](../Templates/bug-report.md) · [release-notes](../Templates/release-notes.md)
- Artifacts: [design-handoff](../Templates/design-handoff.md) · [component-documentation](../Templates/component-documentation.md) · [api-specification](../Templates/api-specification.md) · [pull-request](../Templates/pull-request.md) · [retrospective](../Templates/retrospective.md)
- Onboarding + contract: [project-configuration](../Templates/project-configuration.md) · [design-mapping](../Templates/design-mapping.md) · [frontend-mapping](../Templates/frontend-mapping.md) · [api-mapping](../Templates/api-mapping.md)

## Checklists/ (gates)
- Stage exits: [analysis](../Checklists/analysis.md) · [ux-review](../Checklists/ux-review.md) · [ui-review](../Checklists/ui-review.md) · [design-qa](../Checklists/design-qa.md) · [development-ready](../Checklists/development-ready.md) · [qa-testing](../Checklists/qa-testing.md) · [code-review](../Checklists/code-review.md) · [release](../Checklists/release.md)
- Dimensions: [accessibility](../Checklists/accessibility.md) · [performance](../Checklists/performance.md) · [security](../Checklists/security.md)
- Guards: [screen-contract](../Checklists/screen-contract.md) (`C_CONTRACT` validator)

## Prompts/ (invocation patterns)
- [planning](../Prompts/planning.md) · [research](../Prompts/research.md) · [architecture](../Prompts/architecture.md) · [design](../Prompts/design.md) · [development](../Prompts/development.md) · [refactoring](../Prompts/refactoring.md) · [testing](../Prompts/testing.md) · [debugging](../Prompts/debugging.md) · [documentation](../Prompts/documentation.md) · [review](../Prompts/review.md) · [prompt-improvement](../Prompts/prompt-improvement.md)

## Playbooks/ (compositions — the only composing layer)
- [full-feature](../Playbooks/full-feature.md) · [parallel-brds](../Playbooks/parallel-brds.md) · [hotfix](../Playbooks/hotfix.md) · [design-only](../Playbooks/design-only.md)

## extensions/ (opt-in, not core)
- [telegram](../extensions/telegram/README.md) — mobile gate approvals + notifications via file-spool adapter; `telegram-plugin.mjs`

## Documentation/ (meta)
- [onboarding](onboarding.md) — add the toolkit to a project + run the first BRD
- [notion-setup](notion-setup.md) — exact BRD database spec
- [CHANGELOG](CHANGELOG.md)
