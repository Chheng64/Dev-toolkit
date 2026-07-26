# Workflow — Integration Validation

> **Module:** Workflows (v1.2)
> **Stage:** Per-project utility — runs inside [project-onboarding](project-onboarding.md) step 3, on manifest staleness (>30 days at pickup), after environment changes, or on demand.
> **Executor:** orchestrator. Writes only `manifest.integrations.*` + `last_validated`.

## Purpose

Detect and validate every integration the toolkit relies on for this project; record results in the manifest; warn loudly about gaps. Stages then trust `manifest.integrations` instead of discovering failures mid-work.

## Checks

| Integration | Required? | Check | On pass | On fail |
|-------------|-----------|-------|---------|---------|
| Notion MCP | **yes** | fetch BRD DB; verify schema (property names + option values vs [brd-schema](../Architecture/brd-schema.md) §1) | `validated` | **block** — no BRD work possible; report exact schema drift if any |
| Git access (`gh` CLI) | **yes** | `gh auth status`; repo reachable; default branch exists | `validated` | **block** for pipeline; local-only work may continue with warning |
| Filesystem/shell | **yes** | build tooling runs (`<pm> --version`, project builds or scaffold intact) | `validated` | **block** implementation stages |
| Figma MCP | if `design.figma_file` non-null | fetch declared file + pages | `validated` | warning — design stages run prototype-only ([screen-contract](../Architecture/screen-contract.md) §4); user told which mappings degrade |
| Browser automation (browser/playwright MCP) | no | tool responds | `validated` | warning — QA loses automated browser walks; manual walk rules still apply |
| Other MCP declared in project CLAUDE.md | per declaration | tool responds | `validated` | warning + degradation note |

## Procedure

1. Read manifest (or candidate config during onboarding).
2. Run each applicable check; **never fake a pass** — timeouts/errors record as `error:<short note>`.
3. Write results to `manifest.integrations.*`; stamp `onboarding.last_validated`.
4. Report: table of results + consequences of each warning (which stage degrades how, per [mcp-setup](../AI/mcp-setup.md) degradation rules).
5. Any **required** check failed → project is not pickable (`C_MANIFEST` fails); say what unblocks it.

## Completion Criteria

- [ ] Every applicable integration checked this run — none skipped, none assumed from a prior run
- [ ] Results written to manifest; `last_validated` stamped
- [ ] Warnings reported with per-stage consequences (not just "Figma missing")
- [ ] Required failures reported as blocking with the unblock action

## Common Mistakes

- Caching yesterday's pass — auth expires, schemas drift; the check is cheap, run it.
- Warning fatigue by vagueness — a warning that doesn't name the degraded stage + behavior teaches nothing.
- Treating optional-integration failure as blocking (or required as optional) — the table is the contract.
- Validating the connection but not the *content* (Notion reachable ≠ BRD DB schema intact — schema drift is the dangerous one).
