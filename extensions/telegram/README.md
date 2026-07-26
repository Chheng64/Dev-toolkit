# Extension — Telegram Plugin (v1)

> **Module:** extensions/ — NOT core toolkit. Opt-in per project via `manifest.communication.telegram`.
> **Purpose:** monitor workflow progress and answer approval gates away from the computer.
> **Identity:** communication **adapter only**. All business logic stays in the Workflow Orchestrator.

## Boundaries (hard)

| Does | Never |
|------|-------|
| Receive workflow events (file spool) | Execute workflows |
| Send Telegram notifications | Update BRDs directly |
| Capture approvals via inline buttons | Modify Git |
| Answer `/status` | Modify Figma |
| | Replace or bypass the orchestrator |

An approval tapped in Telegram is **recorded, not applied** — the orchestrator reads it, applies gate rules (stale-approval, scope checks), and logs S16 with `source: telegram`. The plugin cannot advance a stage.

## Architecture

```
Workflow Orchestrator (Claude session)
   │ writes                        reads │
   ▼                                     │
.toolkit/telegram/outbox/*.json   .toolkit/telegram/inbox/*.json
.toolkit/telegram/status.json            ▲
   │                                     │ writes
   ▼                                     │
telegram-plugin.mjs  (daemon: flush outbox + long-poll getUpdates)
   │                                     ▲
   ▼                                     │
Telegram Bot API  ──── messages / inline buttons / /status ────
```

Filesystem spool = the whole contract. Orchestrator never talks to Telegram; plugin never touches BRD/Git/Figma/Notion.

## Event Contract

**Outbox** (orchestrator → plugin), one JSON file per event, `.toolkit/telegram/outbox/<ts>-<type>.json`:

```json
{ "type": "gate",    "gate": "direction" | "design", "brd": "BRD-TP-001",
  "project": "Toolkit Pilot", "title": "Transaction Sound toggle",
  "detail": "PROCEED recommended — cut-line R1+R2+R3.", "url": "https://app.notion.com/p/…" }
{ "type": "pr",      "brd": "…", "title": "…", "url": "<PR link>" }
{ "type": "failure", "brd": "…", "title": "<stage> failed", "detail": "<why + unblock>" }
```

Only these four notification triggers exist in v1: Direction gate, Design gate, PR ready, Pipeline failed. `notifications.*` flags in the manifest filter them.

**Status** (`status.json`, orchestrator-maintained at every transition):

```json
{ "project": "Toolkit Pilot", "brd": "BRD-TP-001", "title": "Transaction Sound toggle",
  "stage": "Planning", "owner": "Product Manager", "progress": "2/13 stages",
  "pending_gate": "direction", "updated": "2026-07-26T08:00:00Z" }
```

**Inbox** (plugin → orchestrator), written on button taps:

```json
{ "type": "approval", "action": "approve" | "reject" | "pause" | "resume",
  "gate": "direction" | "design" | "final", "brd": "BRD-TP-001",
  "ts": "…", "source": "telegram" }
```

Orchestrator duty (when `telegram.enabled`): write outbox events at the four triggers; refresh `status.json` each transition; **read inbox at session entry and before every gate check** — apply as the human's gate decision, log S16 (`source: telegram`), then delete the event file. `pause` → `Blocked (paused-by-user)`; `resume` → clear it.

## Setup

1. @BotFather → create bot → token. `export TELEGRAM_BOT_TOKEN=…` (shell profile / `.env.local`). **Token never enters manifest or repo.**
2. Onboarding communication step (or re-run: "run onboarding communication section") fills `manifest.communication.telegram` — mode `private` | `group` | `topic` (recommended), `chat_id`, `topic_id`.
3. Test: `node toolkit/extensions/telegram/telegram-plugin.mjs --test` → "✅ <Project> has been successfully connected to the Dev Toolkit."
4. Run daemon: `node toolkit/extensions/telegram/telegram-plugin.mjs` (keep alive via launchd/pm2/tmux as preferred). `--once` flushes outbox without the daemon.

## Security

- Token: env only. Chat allow-list: plugin ignores every chat except the configured `chat_id` (commands and callbacks both).
- Inline-button approvals are **recorded intents**, applied by the orchestrator under its gate rules — a stray tap cannot ship anything (stale-approval + scope checks still run).
- Messages contain no secrets: BRD titles, stages, links only.

## v2+ Hooks (designed-for, not built)

Adapter seams already in place: `formatEvent()` switch → new event types (daily summary); `handleUpdate()` → new commands (`/note`, voice messages routed to inbox as `type: note`); outbox is producer-agnostic → AI chat replies later write outbox events themselves. Slack/Discord/email = sibling adapters over the same spool contract (`communication.slack` etc.) — the spool format is the stable API, adapters are disposable.
