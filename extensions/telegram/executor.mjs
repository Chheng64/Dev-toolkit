#!/usr/bin/env node
/**
 * Dev-toolkit Telegram extension — inbox executor
 *
 * Consumes `.toolkit/telegram/inbox/*.json` command events and runs them through
 * Claude Code headless (`claude -p`), streaming progress back as outbox events.
 * It never talks to Telegram: the filesystem spool remains the whole contract.
 *
 *   inbox/*.json {type:"command"} ──▶ claude -p ──▶ outbox/*.json {type:"exec_*"}
 *
 * Disabled unless `communication.telegram.exec.enabled: true` in project-manifest.yaml.
 */

import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { readTelegramConfig } from "./config.mjs";
import { readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

// ---------- telegram formatting ----------

/** Split text into Telegram-sendable chunks, preferring newline boundaries. */
export function chunkForTelegram(text, limit = 4096) {
  const body = String(text ?? "").trim();
  if (!body) return [];
  const chunks = [];
  let rest = body;
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const nl = window.lastIndexOf("\n");
    const cut = nl > limit * 0.5 ? nl : limit;
    chunks.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(nl > limit * 0.5 ? cut + 1 : cut);
  }
  if (rest.length) chunks.push(rest);
  return chunks;
}

// ---------- stream-json parsing ----------

/** Reduce one `--output-format stream-json` line to the progress we relay, or null. */
export function parseStreamLine(line) {
  let ev;
  try { ev = JSON.parse(line); } catch { return null; }
  if (ev?.type === "system" && ev.subtype === "init" && ev.session_id) {
    return { kind: "session", text: ev.session_id };
  }
  if (ev?.type === "result") {
    return { kind: "result", text: String(ev.result ?? ""), isError: Boolean(ev.is_error) };
  }
  if (ev?.type === "assistant") {
    for (const block of ev.message?.content ?? []) {
      if (block.type === "text" && block.text?.trim()) return { kind: "text", text: block.text };
      if (block.type === "tool_use") return { kind: "tool", text: describeTool(block) };
    }
  }
  return null;
}

function describeTool(block) {
  const target = block.input?.file_path ?? block.input?.path ?? block.input?.command ?? block.input?.pattern;
  if (!target) return block.name;
  const short = String(target).includes("/") ? basename(String(target)) : String(target);
  return `${block.name} ${short}`;
}

// ---------- authorization ----------

/**
 * Default-closed gate for command events. Exec must be turned on explicitly and
 * the sender must appear in `exec.allowed_user_ids`; an empty list allows nobody.
 */
export function isExecAuthorized(event, execCfg = {}) {
  if (!execCfg.enabled) return { ok: false, reason: "exec is disabled for this project" };
  const allowed = (execCfg.allowed_user_ids ?? []).map(String);
  if (!allowed.length) return { ok: false, reason: "exec allow-list is empty" };
  const from = event?.from_id;
  if (from === undefined || from === null || from === "") return { ok: false, reason: "sender is not authorized" };
  if (!allowed.includes(String(from))) return { ok: false, reason: "sender is not authorized" };
  return { ok: true };
}

// ---------- claude invocation ----------

const DEFAULT_PERMISSION_MODE = "acceptEdits";

/** argv for `claude`. The prompt is one argv entry — never interpolated into a shell. */
export function buildClaudeArgs({ prompt, sessionId, isNew, permissionMode, allowedTools }) {
  const args = [
    "-p", String(prompt),
    "--output-format", "stream-json",
    "--verbose",
    "--permission-mode", permissionMode || DEFAULT_PERMISSION_MODE,
  ];
  args.push(isNew ? "--session-id" : "--resume", sessionId);
  if (allowedTools?.length) args.push("--allowedTools", allowedTools.join(","));
  return args;
}

// ---------- session continuity ----------

/**
 * One Claude session per project so Telegram follow-ups keep context.
 * A missing or unreadable file means "start fresh".
 */
export function loadSession(file) {
  try {
    const id = readFileSync(file, "utf8").trim();
    if (id) return { sessionId: id, isNew: false };
  } catch { /* fall through to a new session */ }
  return { sessionId: randomUUID(), isNew: true };
}

export function saveSession(file, sessionId) {
  writeFileSync(file, sessionId);
}

export function resetSession(file) {
  try { rmSync(file); } catch { /* already gone */ }
}

// ---------- single-flight lock ----------

const isProcessAlive = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

/** Take the exec lock, reclaiming it if the recorded holder is corrupt or gone. */
export function acquireLock(file, { pid = process.pid, isAlive = isProcessAlive } = {}) {
  try {
    const held = JSON.parse(readFileSync(file, "utf8"));
    if (Number.isInteger(held?.pid) && isAlive(held.pid)) return false;
  } catch { /* no lock, or an unreadable one we may reclaim */ }
  writeFileSync(file, JSON.stringify({ pid, since: new Date().toISOString() }));
  return true;
}

export function releaseLock(file) {
  try { rmSync(file); } catch { /* already gone */ }
}

// ---------- inbox scanning ----------

/**
 * Command events only. Approval events stay untouched — they belong to the
 * orchestrator's gate rules, which the executor must never pre-empt.
 */
export function readInboxEvents(inboxDir, type) {
  let names;
  try { names = readdirSync(inboxDir); } catch { return []; }
  const out = [];
  for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
    const file = join(inboxDir, name);
    try {
      const event = JSON.parse(readFileSync(file, "utf8"));
      if (event?.type === type) out.push({ file, event });
    } catch { /* malformed event — leave it for a human to inspect */ }
  }
  return out;
}

export const readCommandEvents = (inboxDir) => readInboxEvents(inboxDir, "command");

// ---------- running one command ----------

const DEFAULT_TIMEOUT_MINUTES = 10;

/**
 * Run one command event through Claude Code headless.
 *
 * `spawnFn` and `emit` are injected so the whole path is testable without a real
 * child process or a real Telegram round-trip. Every exit path releases the lock.
 */
export async function runCommand({ event, paths, execCfg = {}, spawnFn = spawn, emit, signal }) {
  const auth = isExecAuthorized(event, execCfg);
  if (!auth.ok) {
    emit({ type: "exec_denied", detail: auth.reason, request: event.text });
    return;
  }
  if (!acquireLock(paths.lockFile)) {
    emit({ type: "exec_busy", detail: "another command is still running — try again when it finishes.", request: event.text });
    return;
  }

  const fresh = /^\/new\b/.test(String(event.text ?? ""));
  const prompt = String(event.text ?? "").replace(/^\/new\b\s*/, "").trim();
  if (fresh) resetSession(paths.sessionFile);
  const { sessionId, isNew } = loadSession(paths.sessionFile);

  const args = buildClaudeArgs({
    prompt,
    sessionId,
    isNew,
    permissionMode: execCfg.permission_mode,
    allowedTools: execCfg.allowed_tools,
  });

  emit({ type: "exec_started", request: prompt });

  const timeoutMs = (execCfg.timeout_minutes || DEFAULT_TIMEOUT_MINUTES) * 60_000;
  const child = spawnFn("claude", args, { cwd: paths.root, stdio: ["ignore", "pipe", "pipe"] });

  let ending = null;
  const timer = setTimeout(() => { ending ??= "timeout"; child.kill("SIGTERM"); }, timeoutMs);
  const onAbort = () => { ending ??= "cancelled"; child.kill("SIGTERM"); };
  signal?.addEventListener("abort", onAbort, { once: true });
  if (signal?.aborted) onAbort();

  let finished = false;
  const stderr = [];
  child.stderr?.on("data", (d) => stderr.push(String(d)));

  try {
    const rl = createInterface({ input: child.stdout });
    const closed = new Promise((resolve) => child.on("close", resolve));

    for await (const line of rl) {
      const ev = parseStreamLine(line);
      if (!ev) continue;
      if (ev.kind === "session") { saveSession(paths.sessionFile, ev.text); continue; }
      if (ev.kind === "result") {
        finished = true;
        emit({ type: ev.isError ? "exec_error" : "exec_result", detail: ev.text, request: prompt });
        continue;
      }
      emit({ type: "exec_progress", detail: ev.text, request: prompt });
    }
    await closed;

    if (!finished) {
      const detail =
        ending === "cancelled" ? "Run cancelled — the Claude process was terminated."
        : ending === "timeout" ? `Run timed out after ${execCfg.timeout_minutes || DEFAULT_TIMEOUT_MINUTES} min and was terminated.`
        : `Claude exited without a result. ${stderr.join("").trim() || "No stderr output."}`;
      emit({ type: "exec_error", detail, request: prompt });
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    releaseLock(paths.lockFile);
  }
}


// ---------- daemon ----------

const POLL_MS = 1500;

function emitToOutbox(outboxDir, event) {
  mkdirSync(outboxDir, { recursive: true });
  const name = `${Date.now()}-${event.type}-${randomUUID().slice(0, 8)}.json`;
  writeFileSync(join(outboxDir, name), JSON.stringify({ ...event, ts: new Date().toISOString() }, null, 2));
}

async function daemon({ once = false } = {}) {
  const root = process.cwd();
  const cfg = readTelegramConfig(join(root, "project-manifest.yaml"));
  if (!cfg.exec.enabled) {
    throw new Error("communication.telegram.exec.enabled is not true — the executor stays off.");
  }
  if (!(cfg.exec.allowed_user_ids ?? []).length) {
    throw new Error("communication.telegram.exec.allowed_user_ids is empty — nobody may run commands.");
  }

  const spool = join(root, ".toolkit", "telegram");
  const paths = { root, sessionFile: join(spool, ".session"), lockFile: join(spool, ".exec.lock") };
  const inbox = join(spool, "inbox");
  const outbox = join(spool, "outbox");
  const emit = (event) => emitToOutbox(outbox, event);

  releaseLock(paths.lockFile); // a lock left by a crashed run is ours to clear at startup
  console.log(`[telegram-executor] up — root ${root}, ${cfg.exec.allowed_user_ids.length} authorized user(s), mode ${cfg.exec.permission_mode || "acceptEdits"}`);

  for (;;) {
    for (const { file, event } of readCommandEvents(inbox)) {
      rmSync(file, { force: true }); // claim it before running so a crash cannot loop
      const ac = new AbortController();
      const watcher = setInterval(() => {
        for (const c of readInboxEvents(inbox, "cancel")) { rmSync(c.file, { force: true }); ac.abort(); }
      }, POLL_MS);
      try {
        await runCommand({ event, paths, execCfg: cfg.exec, emit, signal: ac.signal });
      } catch (err) {
        emit({ type: "exec_error", detail: `Executor failure: ${err.message}`, request: event.text });
      } finally {
        clearInterval(watcher);
      }
    }
    // Drain stray cancels so they cannot abort the next command.
    for (const c of readInboxEvents(inbox, "cancel")) rmSync(c.file, { force: true });
    if (once) return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--help") {
    console.log("telegram-executor: (no args) daemon · --once drain the inbox and exit");
    process.exit(0);
  }
  daemon({ once: process.argv[2] === "--once" }).catch((err) => { console.error(`[telegram-executor] ${err.message}`); process.exit(1); });
}