#!/usr/bin/env node
/**
 * Dev-toolkit Telegram extension — v1
 *
 * Communication adapter ONLY. Bridges the Workflow Orchestrator and a Telegram
 * bot via a filesystem spool. Contains zero business logic: it cannot execute
 * workflows, update BRDs, or touch Git/Figma. See README.md for the contract.
 *
 *   orchestrator ──writes──▶ .toolkit/telegram/outbox/*.json ──▶ Telegram message
 *   Telegram button/command ──▶ .toolkit/telegram/inbox/*.json ◀──reads── orchestrator
 *   orchestrator ──writes──▶ .toolkit/telegram/status.json ──▶ /status reply
 *
 * Free-text messages are spooled as `type: "command"` events. Running them is
 * executor.mjs's job, in its own process — this file never spawns anything.
 *
 * Config: project-manifest.yaml `communication.telegram` (chat routing, non-secret)
 * Token:  TELEGRAM_BOT_TOKEN env var (never stored in the repo/manifest)
 *
 * Usage (from project root):
 *   node toolkit/extensions/telegram/telegram-plugin.mjs           # daemon (poll + spool)
 *   node toolkit/extensions/telegram/telegram-plugin.mjs --once    # flush outbox, exit
 *   node toolkit/extensions/telegram/telegram-plugin.mjs --test    # send connection test
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readTelegramConfig } from "./config.mjs";
import { chunkForTelegram } from "./executor.mjs";

const ROOT = process.cwd();
const SPOOL = join(ROOT, ".toolkit", "telegram");
const OUTBOX = join(SPOOL, "outbox");
const INBOX = join(SPOOL, "inbox");
const SENT = join(SPOOL, "sent");
const STATUS_FILE = join(SPOOL, "status.json");
const OFFSET_FILE = join(SPOOL, ".offset");

function fail(msg) { console.error(`[telegram-plugin] ${msg}`); process.exit(1); }

// ---------- telegram api ----------

async function tg(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!body.ok) console.error(`[telegram-plugin] ${method} failed: ${body.description}`);
  return body;
}

function baseMsg(text, extra = {}) {
  const msg = { chat_id: CFG.chatId, text, parse_mode: "HTML", ...extra };
  if (CFG.topicId) msg.message_thread_id = CFG.topicId;
  return msg;
}

// ---------- outbox: events → notifications ----------

const GATE_BUTTONS = (gate, brd) => ({
  inline_keyboard: [[
    { text: "✅ Approve", callback_data: `approve:${gate}:${brd}` },
    { text: "❌ Reject", callback_data: `reject:${gate}:${brd}` },
  ], [
    { text: "⏸ Pause", callback_data: `pause:-:${brd}` },
    { text: "▶️ Resume", callback_data: `resume:-:${brd}` },
  ]],
});

export function formatEvent(ev, notifications = {}) {
  const head = `<b>${esc(ev.project ?? PROJECT_NAME())}</b> · ${esc(ev.brd ?? "")}`;
  switch (ev.type) {
    case "gate": {
      const label = ev.gate === "direction" ? "Direction Approval" : "Design Approval";
      return {
        text: `🚦 <b>Waiting for ${label}</b>\n${head}\n${esc(ev.title ?? "")}\n\n${esc(ev.detail ?? "")}${ev.url ? `\n\n🔗 ${esc(ev.url)}` : ""}`,
        keyboard: GATE_BUTTONS(ev.gate, ev.brd),
        wanted: notifications.approvals !== false,
      };
    }
    case "pr":
      return {
        text: `🔀 <b>Pull Request Ready</b>\n${head}\n${esc(ev.title ?? "")}${ev.url ? `\n\n🔗 ${esc(ev.url)}` : ""}`,
        keyboard: GATE_BUTTONS("final", ev.brd),
        wanted: notifications.approvals !== false,
      };
    case "failure":
      return {
        text: `🛑 <b>Pipeline Failed</b>\n${head}\n${esc(ev.title ?? "")}\n\n${esc(ev.detail ?? "")}`,
        keyboard: undefined,
        wanted: notifications.failures !== false,
      };
    case "exec_started":
      return { text: `🤖 <b>Running</b>\n${esc(ev.request ?? "")}`, keyboard: undefined, wanted: true };
    case "exec_progress":
      return { text: `⚙️ ${esc(ev.detail ?? "")}`, keyboard: undefined, wanted: notifications.exec_progress !== false };
    case "exec_result":
      return { text: `✅ <b>Done</b>\n\n${esc(ev.detail ?? "")}`, keyboard: undefined, wanted: true };
    case "exec_error":
      return { text: `🛑 <b>Failed</b>\n\n${esc(ev.detail ?? "")}`, keyboard: undefined, wanted: true };
    case "exec_denied":
      return { text: `⛔️ <b>Refused</b> — ${esc(ev.detail ?? "")}`, keyboard: undefined, wanted: true };
    case "exec_busy":
      return { text: `⏳ ${esc(ev.detail ?? "")}`, keyboard: undefined, wanted: true };
    default:
      return { text: `ℹ️ ${head}\n${esc(ev.title ?? JSON.stringify(ev))}`, keyboard: undefined, wanted: true };
  }
}

/** Route an incoming Telegram text message. Pure: no I/O, no config. */
export function classifyMessage(text) {
  const body = String(text ?? "").trim();
  if (!body) return { kind: "ignore" };
  const command = body.match(/^\/([a-z_]+)(?:@\S+)?$/i)?.[1]?.toLowerCase();
  if (command === "status") return { kind: "status" };
  if (command === "cancel") return { kind: "cancel" };
  return { kind: "command", text: body };
}

const PROJECT_NAME = () => CFG?.projectName ?? "Project";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function flushOutbox() {
  mkdirSync(OUTBOX, { recursive: true });
  mkdirSync(SENT, { recursive: true });
  for (const f of readdirSync(OUTBOX).filter((f) => f.endsWith(".json")).sort()) {
    const p = join(OUTBOX, f);
    let ev;
    try { ev = JSON.parse(readFileSync(p, "utf8")); }
    catch { console.error(`[telegram-plugin] bad event ${f} — skipped`); renameSync(p, join(SENT, `bad-${f}`)); continue; }
    const { text, keyboard, wanted } = formatEvent(ev, CFG.notifications);
    if (wanted) {
      const chunks = chunkForTelegram(text);
      for (const [i, chunk] of chunks.entries()) {
        const last = i === chunks.length - 1;
        await tg("sendMessage", baseMsg(chunk, last && keyboard ? { reply_markup: keyboard } : {}));
      }
    }
    renameSync(p, join(SENT, f));
    console.log(`[telegram-plugin] sent ${f} (${ev.type})`);
  }
}

// ---------- inbox: telegram → orchestrator events ----------

function writeInbox(event) {
  mkdirSync(INBOX, { recursive: true });
  const name = `${Date.now()}-${event.action ?? event.type}-${event.brd ?? "na"}.json`;
  writeFileSync(join(INBOX, name), JSON.stringify({ ...event, ts: new Date().toISOString(), source: "telegram" }, null, 2));
  console.log(`[telegram-plugin] inbox ← ${name}`);
}

function statusText() {
  if (!existsSync(STATUS_FILE)) return "No status yet — orchestrator has not written status.json.";
  try {
    const s = JSON.parse(readFileSync(STATUS_FILE, "utf8"));
    return [
      `📊 <b>${esc(s.project ?? CFG.projectName)}</b>`,
      `BRD: ${esc(s.brd ?? "—")} ${s.title ? "· " + esc(s.title) : ""}`,
      `Stage: <b>${esc(s.stage ?? "—")}</b> · Owner: ${esc(s.owner ?? "—")}`,
      `Progress: ${esc(s.progress ?? "—")}`,
      s.pending_gate ? `🚦 Waiting on: ${esc(s.pending_gate)}` : "",
      s.updated ? `<i>updated ${esc(s.updated)}</i>` : "",
    ].filter(Boolean).join("\n");
  } catch { return "status.json unreadable."; }
}

async function handleUpdate(u) {
  if (u.message?.text !== undefined) {
    if (String(u.message.chat.id) !== String(CFG.chatId)) return; // ignore foreign chats
    const routed = classifyMessage(u.message.text);
    if (routed.kind === "status") { await tg("sendMessage", baseMsg(statusText())); return; }
    if (routed.kind === "cancel") {
      writeInbox({ type: "cancel", from_id: u.message.from?.id });
      await tg("sendMessage", baseMsg("⏹ Cancel requested."));
      return;
    }
    if (routed.kind === "command") {
      if (!CFG.exec.enabled) {
        await tg("sendMessage", baseMsg("⛔️ Remote execution is off for this project (set <code>communication.telegram.exec.enabled: true</code>)."));
        return;
      }
      writeInbox({ type: "command", text: routed.text, from_id: u.message.from?.id });
      await tg("sendMessage", baseMsg("📥 Queued."));
    }
    return;
  }
  if (u.callback_query) {
    const q = u.callback_query;
    if (String(q.message?.chat?.id) !== String(CFG.chatId)) { await tg("answerCallbackQuery", { callback_query_id: q.id }); return; }
    const [action, gate, brd] = String(q.data ?? "").split(":");
    if (!["approve", "reject", "pause", "resume"].includes(action)) { await tg("answerCallbackQuery", { callback_query_id: q.id }); return; }
    writeInbox({ type: "approval", action, gate: gate === "-" ? undefined : gate, brd });
    await tg("answerCallbackQuery", { callback_query_id: q.id, text: `Recorded: ${action}` });
    await tg("editMessageText", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
      text: `${q.message.text}\n\n➡️ <b>${action.toUpperCase()}</b> recorded ${new Date().toISOString()} — orchestrator applies it next session.`,
      parse_mode: "HTML",
    });
  }
}

async function pollLoop() {
  let offset = existsSync(OFFSET_FILE) ? Number(readFileSync(OFFSET_FILE, "utf8")) || 0 : 0;
  console.log(`[telegram-plugin] daemon up — chat ${CFG.chatId}${CFG.topicId ? ` topic ${CFG.topicId}` : ""}`);
  for (;;) {
    await flushOutbox();
    const res = await tg("getUpdates", { timeout: 25, offset, allowed_updates: ["message", "callback_query"] });
    for (const u of res.result ?? []) {
      offset = u.update_id + 1;
      writeFileSync(OFFSET_FILE, String(offset));
      await handleUpdate(u);
    }
  }
}

// ---------- entry ----------

let TOKEN, CFG, API;

async function main() {
  const arg = process.argv[2];
  if (arg === "--help") {
    console.log("telegram-plugin: (no args) daemon · --once flush outbox · --test connection test");
    return;
  }
  TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TOKEN) fail("TELEGRAM_BOT_TOKEN env var not set. Create a bot via @BotFather; export the token. It is never stored in the repo.");
  try { CFG = readTelegramConfig(join(ROOT, "project-manifest.yaml")); }
  catch (err) { fail(err.message); }
  API = `https://api.telegram.org/bot${TOKEN}`;

  if (arg === "--test") {
    await tg("sendMessage", baseMsg(`✅ ${esc(CFG.projectName)} has been successfully connected to the Dev Toolkit.`));
    console.log("[telegram-plugin] test message sent.");
  } else if (arg === "--once") {
    await flushOutbox();
  } else {
    await pollLoop();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
