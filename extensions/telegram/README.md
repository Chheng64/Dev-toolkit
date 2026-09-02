# Extension — Telegram Plugin (v2)

> **Module:** extensions/ — NOT core toolkit. Opt-in per project via `manifest.communication.telegram`.
> **Purpose:** monitor workflow progress, answer approval gates, and (opt-in) drive Claude Code remotely.
> **Identity:** two processes over one filesystem spool — a communication **adapter** and an optional **executor**.

## Processes

| File | Role |
|------|------|
| `telegram-plugin.mjs` | Adapter. Talks to Telegram, reads/writes the spool. Executes nothing. |
| `executor.mjs` | Executor. Reads `command` events from the spool and runs them through `claude -p`. Never talks to Telegram. |
| `config.mjs` | Shared `communication.telegram` manifest reader (one parser, both processes). |

Neither process calls the other. The spool is the whole contract, so the executor stays optional and removable.

## Boundaries (hard)

**Adapter — `telegram-plugin.mjs`:**

| Does | Never |
|------|-------|
| Receive workflow events (file spool) | Execute anything |
| Send Telegram notifications | Update BRDs directly |
| Capture approvals via inline buttons | Modify Git |
| Answer `/status` | Modify Figma |
| Spool free text as a `command` event | Spawn a process |

**Executor — `executor.mjs`:**

| Does | Never |
|------|-------|
| Consume `command` events | Touch `approval` events (those are the orchestrator's) |
| Run `claude -p` in the project root | Talk to the Telegram API |
| Emit `exec_*` progress to the outbox | Run for an unlisted sender |
| Hold a single-flight lock | Run two commands at once |

An approval tapped in Telegram is still **recorded, not applied** — the orchestrator reads it, applies gate rules (stale-approval, scope checks), and logs S16 with `source: telegram`. Neither process can advance a stage.

## Architecture

```
Workflow Orchestrator (Claude session)
   │ writes                        reads │
   ▼                                     │
.toolkit/telegram/outbox/*.json   .toolkit/telegram/inbox/*.json
.toolkit/telegram/status.json            ▲          │
   │                                     │          │ reads type:"command"
   ▼                                     │          ▼
telegram-plugin.mjs  (daemon: flush outbox + long-poll getUpdates)   executor.mjs
   │                                     ▲          │  (daemon: claim → claude -p)
   ▼                                     │          │ writes exec_* ──▶ outbox
Telegram Bot API  ──── messages / inline buttons / /status ────
```

Filesystem spool = the whole contract. Orchestrator never talks to Telegram; adapter never spawns; executor never touches the network.

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

**Inbox** (adapter → orchestrator / executor):

```json
{ "type": "approval", "action": "approve" | "reject" | "pause" | "resume",
  "gate": "direction" | "design" | "final", "brd": "BRD-TP-001",
  "ts": "…", "source": "telegram" }
{ "type": "command", "text": "run the test suite", "from_id": 111, "ts": "…", "source": "telegram" }
{ "type": "cancel",  "from_id": 111, "ts": "…", "source": "telegram" }
```

`approval` belongs to the orchestrator; `command` and `cancel` belong to the executor. Each consumer ignores the other's events — the executor explicitly leaves approval files in place.

**Exec events** (executor → outbox → Telegram):

```json
{ "type": "exec_started",  "request": "run the test suite" }
{ "type": "exec_progress", "detail": "Edit b.ts" }          // gated by notifications.exec_progress
{ "type": "exec_result",   "detail": "2 files changed" }
{ "type": "exec_error",    "detail": "Run timed out after 10 min and was terminated." }
{ "type": "exec_denied",   "detail": "sender is not authorized" }
{ "type": "exec_busy",     "detail": "another command is still running…" }
```

Orchestrator duty (when `telegram.enabled`): write outbox events at the four triggers; refresh `status.json` each transition; **read inbox at session entry and before every gate check** — apply as the human's gate decision, log S16 (`source: telegram`), then delete the event file. `pause` → `Blocked (paused-by-user)`; `resume` → clear it.

## Setup

1. @BotFather → create bot → token. `export TELEGRAM_BOT_TOKEN=…` (shell profile / `.env.local`). **Token never enters manifest or repo.**
2. Onboarding **Resource Binding** stage ([project-onboarding](../../Workflows/project-onboarding.md) step 3; re-open only via "toolkit configure communication" / "toolkit onboard --update") fills `manifest.communication.telegram` — mode `private` | `group` | `topic` (recommended), `chat_id`, `topic_id`.
3. Test: `node toolkit/extensions/telegram/telegram-plugin.mjs --test` → "✅ <Project> has been successfully connected to the Dev Toolkit."
4. Run daemon: `node toolkit/extensions/telegram/telegram-plugin.mjs` (keep alive via launchd/pm2/tmux as preferred). `--once` flushes outbox without the daemon.

### Remote execution (opt-in)

5. Add the `exec` block to `manifest.communication.telegram` — see [Architecture/project-manifest.md](../../Architecture/project-manifest.md) §2. Get your Telegram user id from `@userinfobot`; it is **not** the `chat_id`.
6. Run the second daemon alongside the first: `node toolkit/extensions/telegram/executor.mjs`. `--once` drains the inbox and exits (useful for verification).

Chat commands once both daemons run:

| Message | Effect |
|---------|--------|
| `/status` | Orchestrator status from `status.json` (no execution) |
| any free text | Queued as a `command` event → `claude -p`, replies stream back |
| `/new <text>` | Same, but starts a fresh Claude session first |
| `/cancel` | SIGTERM the running command |

One Claude session is reused per project (id in `.toolkit/telegram/.session`) so follow-up messages keep context.

## Security

- Token: env only. Chat allow-list: the adapter ignores every chat except the configured `chat_id` (messages and callbacks both).
- Inline-button approvals are **recorded intents**, applied by the orchestrator under its gate rules — a stray tap cannot ship anything (stale-approval + scope checks still run).
- Notification messages contain no secrets: BRD titles, stages, links only.

### Remote execution — read before enabling

Enabling `exec` means a chat message runs code on the machine hosting the executor. Understand these properties before turning it on:

- **Default-closed on two switches.** `exec.enabled: true` *and* a non-empty `exec.allowed_user_ids`. An empty allow-list authorizes nobody; a missing `exec` block refuses all free text with a message.
- **Sender identity is checked twice** — the chat must match `chat_id` (adapter) and the sender must appear in `allowed_user_ids` (executor). Both layers are enforced independently.
- **`permission_mode` defaults to `acceptEdits`** — file edits proceed unattended, other tools still gate. `--allowedTools` comes from `exec.allowed_tools`. The executor never passes `--dangerously-skip-permissions`.
- **`permission_mode: bypassPermissions` is unrestricted.** Anyone who can post in the bound chat gets arbitrary command execution as your user. Only choose it for a machine and a chat you fully control.
- **Prompts are never shell-interpolated** — the message is one argv entry to `claude`, spawned without a shell.
- **Bounded runs.** One command at a time (`.exec.lock`, reclaimed if the holder dies), `timeout_minutes` SIGTERM (default 10), `/cancel` to stop early. `cwd` is pinned to the project root; no `--add-dir`.
- **Residual risk:** whoever holds the bot token or joins the bound chat inherits this capability. Rotate the token via @BotFather if it leaks, and prefer a private chat over a group.

## Tests

```
node --test extensions/telegram/*.test.mjs
```

Pure logic only (parsing, routing, authorization, locking, session lifecycle) — no network, no real child process. End-to-end behaviour is verified by running `executor.mjs --once` against a scratch project.

## v3+ Hooks (designed-for, not built)

Adapter seams already in place: `formatEvent()` switch → new event types (daily summary); `handleUpdate()` → new commands (`/note`, voice messages routed to inbox as `type: note`); outbox is producer-agnostic → AI chat replies later write outbox events themselves. Slack/Discord/email = sibling adapters over the same spool contract (`communication.slack` etc.) — the spool format is the stable API, adapters are disposable.
