# MCP & Tool Setup

> **Module:** AI / Runtime
> **Status:** Stable
> **Purpose:** Which integrations each stage needs, and what to do when one is missing.

## 1. Required Integrations

| Integration | Provides | Required by |
|-------------|----------|-------------|
| **Notion MCP** | BRD read/write: `notion-search`, `notion-fetch`, `notion-update-page`, `notion-query-data-sources`, `notion-create-pages` | orchestrator + every stage (hard requirement) |
| **GitHub (`gh` CLI)** | branch/PR/CI/merge: `gh pr create/view/checks/merge` | git, code-review, release stages |
| **Figma MCP** | design context, screenshots, design-system reads | ui-workflow, design-system-workflow — only when the BRD references Figma |
| **Local shell/files** | build, test, serve prototype | implementation, qa, debug, prototype Run Local |

## 2. Setup Checks (per machine, once)

```bash
gh auth status                 # GitHub authenticated
claude mcp list                # Notion (+ Figma if used) connected
```

Notion MCP + Figma MCP connect via claude.ai connector settings or `claude mcp` in an interactive session.

## 3. Degradation Rules (integration missing mid-work)

| Missing | Rule |
|---------|------|
| Notion | **Hard stop for BRD stages.** No shadow files as substitute for BRD writes. Tell the user; queue nothing silently. Ad-hoc non-BRD work may continue. |
| GitHub | Implementation may continue locally; PR/merge stages block. Say so. |
| Figma | Proceed using the in-repo design system reference; log a S16 note that Figma guidance was unavailable. |

Principle: a missing integration degrades loudly, never silently. The BRD's S16 records any stage run in degraded mode.
