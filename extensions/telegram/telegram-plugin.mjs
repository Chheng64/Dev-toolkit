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
 * Config: project-manifest.yaml `communication.telegram` (chat routing, non-secret)
 * Token:  TELEGRAM_BOT_TOKEN env var (never stored in the repo/manifest)
 *
 * Usage (from project root):
 *   node toolkit/extensions/telegram/telegram-plugin.mjs           # daemon (poll + spool)
 *   node toolkit/extensions/telegram/telegram-plugin.mjs --once    # flush outbox, exit
 *   node toolkit/extensions/telegram/telegram-plugin.mjs --test    # send connection test
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.cwd();
const SPOOL = join(ROOT, ".toolkit", "telegram");
const OUTBOX = join(SPOOL, "outbox");
const INBOX = join(SPOOL, "inbox");
const SENT = join(SPOOL, "sent");
const STATUS_FILE = join(SPOOL, "status.json");
const OFFSET_FILE = join(SPOOL, ".offset");

// ---------- config ----------

function readTelegramConfig() {
  const manifestPath = join(ROOT, "project-manifest.yaml");
  if (!existsSync(manifestPath)) fail(`project-manifest.yaml not found in ${ROOT} — run from the project root.`);
  const lines = readFileSync(manifestPath, "utf8").split("\n");
  // Minimal indentation-scoped reader for the known communication.telegram block.
  const cfg = {};
  let inComm = false, inTg = false, inNotif = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trimEnd();
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const [key, ...rest] = line.trim().split(":");
    const val = rest.join(":").trim();
    if (indent === 0) { inComm = key === "communication"; inTg = inNotif = false; continue; }
    if (inComm && indent === 2) { inTg = key === "telegram"; inNotif = false; continue; }
    if (inTg && indent === 4) {
      if (key === "notifications") { inNotif = true; continue; }
      inNotif = false;
      cfg[key] = val;
      continue;
    }
    if (inTg && inNotif && indent === 6) (cfg.notifications ??= {})[key] = val === "true";
  }
  if (cfg.enabled !== "true") fail("communication.telegram.enabled is not true in project-manifest.yaml — nothing to do.");
  if (!cfg.chat_id) fail("communication.telegram.chat_id missing.");
  return {
    chatId: cfg.chat_id,
    topicId: cfg.mode === "topic" && cfg.topic_id ? Number(cfg.topic_id) : undefined,
    notifications: cfg.notifications ?? { approvals: true, failures: true, pipeline: true },
    projectName: readProjectName(lines),
  };
}

function readProjectName(lines) {
  let inProject = false;
  for (const raw of lines) {
    const indent = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (indent === 0) inProject = t.startsWith("project:");
    else if (inProject && indent === 2 && t.startsWith("name:")) return t.slice(5).trim();
  }
  return "Project";
}

function fail(msg) { console.error(`[telegram-plugin] ${msg}`); process.exit(1); }

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) fail("TELEGRAM_BOT_TOKEN env var not set. Create a bot via @BotFather; export the token. It is never stored in the repo.");
const CFG = readTelegramConfig();
const API = `https://api.telegram.org/bot${TOKEN}`;

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

function formatEvent(ev) {
  const head = `<b>${esc(ev.project ?? CFG.projectName)}</b> · ${esc(ev.brd ?? "")}`;
  switch (ev.type) {
    case "gate": {
      const label = ev.gate === "direction" ? "Direction Approval" : "Design Approval";
      return {
        text: `🚦 <b>Waiting for ${label}</b>\n${head}\n${esc(ev.title ?? "")}\n\n${esc(ev.detail ?? "")}${ev.url ? `\n\n🔗 ${esc(ev.url)}` : ""}`,
        keyboard: GATE_BUTTONS(ev.gate, ev.brd),
        wanted: CFG.notifications.approvals !== false,
      };
    }
    case "pr":
      return {
        text: `🔀 <b>Pull Request Ready</b>\n${head}\n${esc(ev.title ?? "")}${ev.url ? `\n\n🔗 ${esc(ev.url)}` : ""}`,
        keyboard: GATE_BUTTONS("final", ev.brd),
        wanted: CFG.notifications.approvals !== false,
      };
    case "failure":
      return {
        text: `🛑 <b>Pipeline Failed</b>\n${head}\n${esc(ev.title ?? "")}\n\n${esc(ev.detail ?? "")}`,
        keyboard: undefined,
        wanted: CFG.notifications.failures !== false,
      };
    default:
      return { text: `ℹ️ ${head}\n${esc(ev.title ?? JSON.stringify(ev))}`, keyboard: undefined, wanted: true };
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function flushOutbox() {
  mkdirSync(OUTBOX, { recursive: true });
  mkdirSync(SENT, { recursive: true });
  for (const f of readdirSync(OUTBOX).filter((f) => f.endsWith(".json")).sort()) {
    const p = join(OUTBOX, f);
    let ev;
    try { ev = JSON.parse(readFileSync(p, "utf8")); }
    catch { console.error(`[telegram-plugin] bad event ${f} — skipped`); renameSync(p, join(SENT, `bad-${f}`)); continue; }
    const { text, keyboard, wanted } = formatEvent(ev);
    if (wanted) await tg("sendMessage", baseMsg(text, keyboard ? { reply_markup: keyboard } : {}));
    renameSync(p, join(SENT, f));
    console.log(`[telegram-plugin] sent ${f} (${ev.type})`);
  }
}

// ---------- inbox: telegram → orchestrator events ----------

function writeInbox(event) {
  mkdirSync(INBOX, { recursive: true });
  const name = `${Date.now()}-${event.action}-${event.brd ?? "na"}.json`;
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
  if (u.message?.text?.startsWith("/status")) {
    if (String(u.message.chat.id) !== String(CFG.chatId)) return; // ignore foreign chats
    await tg("sendMessage", baseMsg(statusText()));
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

const arg = process.argv[2];
if (arg === "--test") {
  await tg("sendMessage", baseMsg(`✅ ${esc(CFG.projectName)} has been successfully connected to the Dev Toolkit.`));
  console.log("[telegram-plugin] test message sent.");
} else if (arg === "--once") {
  await flushOutbox();
} else if (arg === "--help") {
  console.log("telegram-plugin: (no args) daemon · --once flush outbox · --test connection test");
} else {
  await pollLoop();
}
