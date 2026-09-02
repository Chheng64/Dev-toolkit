# Workflow — Integration Validation

> **Module:** Workflows (v1.5)
> **Stage:** Per-project utility — runs inside [project-onboarding](project-onboarding.md) step 4, on manifest staleness (>30 days at pickup), after environment changes, or on demand.
> **Executor:** orchestrator. Writes only `manifest.integrations.*`, `manifest.resources.*.validated` + `manifest.communication.*.validated` stamps + `last_validated`.

## Purpose

Detect and validate every integration the toolkit relies on for this project; record results in the manifest; warn loudly about gaps. Stages then trust `manifest.integrations` instead of discovering failures mid-work. Two layers, both checked: **integrations** = tools available (this file's table); **resource bindings** = what those tools may touch ([Project Resource Registry](../Architecture/project-manifest.md) §3) — re-validated on the same staleness triggers. All checks stay inside the registry ([integration-map](../Architecture/integration-map.md) §2b) — validation never becomes workspace discovery.

## Checks

| Integration | Required? | Check | On pass | On fail |
|-------------|-----------|-------|---------|---------|
| Notion MCP | **yes** | fetch BRD DB **by registry id** (`resources.notion.brd_database.id`); verify schema (property names + option values vs [brd-schema](../Architecture/brd-schema.md) §1) | `validated` | **block** — no BRD work possible; report exact schema drift if any |
| Git access (`gh` CLI) | **yes** | `gh auth status`; every bound repo (`resources.github.*`) reachable by id; default branch exists | `validated` | **block** for pipeline; local-only work may continue with warning |
| Filesystem/shell | **yes** | build tooling runs (`<pm> --version`, project builds or scaffold intact) | `validated` | **block** implementation stages |
| Figma MCP | if `resources.figma.product_design_file` bound | fetch bound file key + pages (+ design-system library if bound) | `validated` | warning — design stages run prototype-only ([screen-contract](../Architecture/screen-contract.md) §4); user told which mappings degrade |
| Browser automation (browser/playwright MCP) | no | tool responds | `validated` | warning — QA loses automated browser walks; manual walk rules still apply |
| Other MCP with registry entries (`resources.other[]`) | per binding | tool responds; bound identifier resolves | `validated` | warning + degradation note |
| **Resource bindings** (registry re-check) | required slots **yes** | each bound resource resolves via its stable identifier; `resources.*.validated` restamped | registry stays `bound`, `health: ok` | binding marked `health: unreachable` + **Resource Decision** raised ([project-manifest §3](../Architecture/project-manifest.md)): required slot → **block** (`C_MANIFEST` fails) until resolved; optional slot → decision may be deferred to first use (warning now, `Blocked (resource)` then) |
| Telegram binding | if `communication.telegram.enabled` | `telegram-plugin.mjs --test` send via stored `chat_id`/`topic_id`; `communication.telegram.validated` restamped | `validated` | `health: unreachable` + Resource Decision — gate notifications are silently lost until rebind or confirmed absence |

**Skipped slots:** a deliberately skipped slot's tool check does not run; record `integrations.<tool>: n/a (skipped)`. Degradation rules apply to bound slots only — skip is a chosen mode, never reported as a failure.

## Procedure

1. Read manifest (or candidate config during onboarding).
2. Run each applicable check; **never fake a pass** — timeouts/errors record as `error:<short note>`.
3. Write results to `manifest.integrations.*`; restamp `manifest.resources.*.validated` for re-checked bindings; stamp `onboarding.last_validated`.
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
- "Fixing" a dead binding by searching the workspace for a similar-looking resource — that's a boundary violation; the fix is a connect/create re-bind, decided by the user.
