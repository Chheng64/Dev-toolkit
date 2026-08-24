import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import {
  chunkForTelegram,
  parseStreamLine,
  isExecAuthorized,
  buildClaudeArgs,
  loadSession,
  saveSession,
  resetSession,
  acquireLock,
  releaseLock,
  readCommandEvents,
  runCommand,
} from "./executor.mjs";

// ---------- chunkForTelegram ----------

test("chunkForTelegram returns a single chunk when text fits", () => {
  assert.deepEqual(chunkForTelegram("hello", 100), ["hello"]);
});

test("chunkForTelegram splits oversized text into limit-sized chunks", () => {
  const chunks = chunkForTelegram("a".repeat(250), 100);
  assert.equal(chunks.length, 3);
  assert.deepEqual(chunks.map((c) => c.length), [100, 100, 50]);
});

test("chunkForTelegram prefers splitting on a newline near the limit", () => {
  const text = "x".repeat(90) + "\n" + "y".repeat(90);
  const chunks = chunkForTelegram(text, 100);
  assert.equal(chunks[0], "x".repeat(90));
  assert.equal(chunks[1], "y".repeat(90));
});

test("chunkForTelegram drops empty input", () => {
  assert.deepEqual(chunkForTelegram("   ", 100), []);
});

// ---------- parseStreamLine ----------

test("parseStreamLine extracts assistant text", () => {
  const line = JSON.stringify({
    type: "assistant",
    message: { content: [{ type: "text", text: "working on it" }] },
  });
  assert.deepEqual(parseStreamLine(line), { kind: "text", text: "working on it" });
});

test("parseStreamLine reports tool use by name", () => {
  const line = JSON.stringify({
    type: "assistant",
    message: { content: [{ type: "tool_use", name: "Edit", input: { file_path: "/a/b.ts" } }] },
  });
  assert.deepEqual(parseStreamLine(line), { kind: "tool", text: "Edit b.ts" });
});

test("parseStreamLine captures the session id from the init event", () => {
  const line = JSON.stringify({ type: "system", subtype: "init", session_id: "abc-123" });
  assert.deepEqual(parseStreamLine(line), { kind: "session", text: "abc-123" });
});

test("parseStreamLine returns the final result", () => {
  const line = JSON.stringify({ type: "result", subtype: "success", result: "all done", is_error: false });
  assert.deepEqual(parseStreamLine(line), { kind: "result", text: "all done", isError: false });
});

test("parseStreamLine flags an error result", () => {
  const line = JSON.stringify({ type: "result", subtype: "error_during_execution", result: "boom", is_error: true });
  assert.deepEqual(parseStreamLine(line), { kind: "result", text: "boom", isError: true });
});

test("parseStreamLine ignores malformed json instead of throwing", () => {
  assert.equal(parseStreamLine("{not json"), null);
});

test("parseStreamLine ignores unrecognised event types", () => {
  assert.equal(parseStreamLine(JSON.stringify({ type: "user", message: {} })), null);
});

// ---------- isExecAuthorized ----------

const EXEC_ON = { enabled: true, allowed_user_ids: [42, 7] };

test("isExecAuthorized rejects when exec is disabled", () => {
  const v = isExecAuthorized({ from_id: 42 }, { enabled: false, allowed_user_ids: [42] });
  assert.equal(v.ok, false);
  assert.match(v.reason, /disabled/i);
});

test("isExecAuthorized rejects when no user ids are allow-listed", () => {
  const v = isExecAuthorized({ from_id: 42 }, { enabled: true, allowed_user_ids: [] });
  assert.equal(v.ok, false);
  assert.match(v.reason, /allow.?list/i);
});

test("isExecAuthorized rejects a sender outside the allow-list", () => {
  const v = isExecAuthorized({ from_id: 99 }, EXEC_ON);
  assert.equal(v.ok, false);
  assert.match(v.reason, /not authorized/i);
});

test("isExecAuthorized rejects an event carrying no sender id", () => {
  assert.equal(isExecAuthorized({}, EXEC_ON).ok, false);
});

test("isExecAuthorized accepts an allow-listed sender", () => {
  assert.deepEqual(isExecAuthorized({ from_id: 7 }, EXEC_ON), { ok: true });
});

test("isExecAuthorized compares ids as strings so yaml scalars match", () => {
  assert.equal(isExecAuthorized({ from_id: "42" }, EXEC_ON).ok, true);
});

// ---------- buildClaudeArgs ----------

test("buildClaudeArgs starts a fresh session with an explicit session id", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, permissionMode: "acceptEdits" });
  assert.deepEqual(args.slice(0, 2), ["-p", "hi"]);
  assert.ok(args.includes("--session-id"));
  assert.equal(args[args.indexOf("--session-id") + 1], "u-1");
  assert.ok(!args.includes("--resume"));
});

test("buildClaudeArgs resumes an existing session", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: false, permissionMode: "acceptEdits" });
  assert.ok(args.includes("--resume"));
  assert.equal(args[args.indexOf("--resume") + 1], "u-1");
  assert.ok(!args.includes("--session-id"));
});

test("buildClaudeArgs always requests parseable streaming output", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, permissionMode: "acceptEdits" });
  assert.equal(args[args.indexOf("--output-format") + 1], "stream-json");
  assert.ok(args.includes("--verbose"));
});

test("buildClaudeArgs passes the configured permission mode through", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, permissionMode: "plan" });
  assert.equal(args[args.indexOf("--permission-mode") + 1], "plan");
});

test("buildClaudeArgs defaults to acceptEdits when no mode is configured", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true });
  assert.equal(args[args.indexOf("--permission-mode") + 1], "acceptEdits");
});

test("buildClaudeArgs never emits a permission-bypass flag", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, permissionMode: "bypassPermissions" });
  assert.ok(!args.some((a) => a.startsWith("--dangerously")));
  assert.ok(!args.some((a) => a.startsWith("--allow-dangerously")));
});

test("buildClaudeArgs adds an allowed-tools allow-list when configured", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, allowedTools: ["Read", "Bash(git *)"] });
  assert.equal(args[args.indexOf("--allowedTools") + 1], "Read,Bash(git *)");
});

test("buildClaudeArgs omits allowed-tools when the list is empty", () => {
  const args = buildClaudeArgs({ prompt: "hi", sessionId: "u-1", isNew: true, allowedTools: [] });
  assert.ok(!args.includes("--allowedTools"));
});

test("buildClaudeArgs passes the prompt as one argv entry, never a shell string", () => {
  const args = buildClaudeArgs({ prompt: "rm -rf / ; echo $HOME", sessionId: "u-1", isNew: true });
  assert.equal(args[1], "rm -rf / ; echo $HOME");
});

// ---------- session file ----------

function tmp() {
  return mkdtempSync(join(tmpdir(), "tg-exec-"));
}

test("loadSession mints a new uuid session when no file exists", () => {
  const s = loadSession(join(tmp(), ".session"));
  assert.equal(s.isNew, true);
  assert.match(s.sessionId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

test("loadSession resumes the saved session on the next call", () => {
  const file = join(tmp(), ".session");
  const first = loadSession(file);
  saveSession(file, first.sessionId);
  const second = loadSession(file);
  assert.deepEqual(second, { sessionId: first.sessionId, isNew: false });
});

test("loadSession treats an unreadable session file as a new session", () => {
  const file = join(tmp(), ".session");
  writeFileSync(file, "");
  assert.equal(loadSession(file).isNew, true);
});

test("resetSession forces the next load to start fresh", () => {
  const file = join(tmp(), ".session");
  saveSession(file, "11111111-1111-4111-8111-111111111111");
  resetSession(file);
  const after = loadSession(file);
  assert.equal(after.isNew, true);
  assert.notEqual(after.sessionId, "11111111-1111-4111-8111-111111111111");
});

test("resetSession on a missing file is a no-op", () => {
  assert.doesNotThrow(() => resetSession(join(tmp(), ".session")));
});

// ---------- single-flight lock ----------

const ALIVE = () => true;
const DEAD = () => false;

test("acquireLock succeeds when no lock is held", () => {
  assert.equal(acquireLock(join(tmp(), ".lock"), { pid: 100, isAlive: ALIVE }), true);
});

test("acquireLock refuses while a live holder owns the lock", () => {
  const file = join(tmp(), ".lock");
  acquireLock(file, { pid: 100, isAlive: ALIVE });
  assert.equal(acquireLock(file, { pid: 200, isAlive: ALIVE }), false);
});

test("acquireLock reclaims a lock whose holder is gone", () => {
  const file = join(tmp(), ".lock");
  acquireLock(file, { pid: 100, isAlive: ALIVE });
  assert.equal(acquireLock(file, { pid: 200, isAlive: DEAD }), true);
});

test("acquireLock reclaims a corrupt lock file", () => {
  const file = join(tmp(), ".lock");
  writeFileSync(file, "garbage");
  assert.equal(acquireLock(file, { pid: 200, isAlive: ALIVE }), true);
});

test("releaseLock frees the lock for the next caller", () => {
  const file = join(tmp(), ".lock");
  acquireLock(file, { pid: 100, isAlive: ALIVE });
  releaseLock(file);
  assert.equal(acquireLock(file, { pid: 200, isAlive: ALIVE }), true);
});

test("releaseLock on a missing lock is a no-op", () => {
  assert.doesNotThrow(() => releaseLock(join(tmp(), ".lock")));
});

// ---------- inbox scanning ----------

function inboxWith(files) {
  const dir = tmp();
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), typeof body === "string" ? body : JSON.stringify(body));
  }
  return dir;
}

test("readCommandEvents returns nothing when the inbox does not exist", () => {
  assert.deepEqual(readCommandEvents(join(tmp(), "absent")), []);
});

test("readCommandEvents leaves approval events for the orchestrator", () => {
  const dir = inboxWith({
    "1-approval.json": { type: "approval", action: "approve", brd: "BRD-1" },
    "2-command.json": { type: "command", text: "run tests", from_id: 42 },
  });
  const events = readCommandEvents(dir);
  assert.equal(events.length, 1);
  assert.equal(events[0].event.text, "run tests");
  assert.ok(existsSync(join(dir, "1-approval.json")), "approval file must stay in the inbox");
});

test("readCommandEvents returns commands oldest first", () => {
  const dir = inboxWith({
    "20-command.json": { type: "command", text: "second", from_id: 42 },
    "10-command.json": { type: "command", text: "first", from_id: 42 },
  });
  assert.deepEqual(readCommandEvents(dir).map((e) => e.event.text), ["first", "second"]);
});

test("readCommandEvents skips unparseable files without throwing", () => {
  const dir = inboxWith({
    "1-command.json": "{broken",
    "2-command.json": { type: "command", text: "ok", from_id: 42 },
  });
  assert.deepEqual(readCommandEvents(dir).map((e) => e.event.text), ["ok"]);
});

test("readCommandEvents ignores non-json files", () => {
  const dir = inboxWith({ "notes.txt": "hello", "1-command.json": { type: "command", text: "ok", from_id: 42 } });
  assert.equal(readCommandEvents(dir).length, 1);
});

// ---------- runCommand ----------

function fakeSpawn(lines, { code = 0, hang = false } = {}) {
  const calls = [];
  const fn = (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    const child = new EventEmitter();
    child.stdout = Readable.from(hang ? [] : lines.map((l) => JSON.stringify(l) + "\n"));
    child.stderr = Readable.from([]);
    child.killed = false;
    child.kill = () => { child.killed = true; child.emit("close", 143); };
    if (!hang) child.stdout.on("end", () => setImmediate(() => child.emit("close", code)));
    return child;
  };
  fn.calls = calls;
  return fn;
}

function paths() {
  const dir = tmp();
  return { root: dir, sessionFile: join(dir, ".session"), lockFile: join(dir, ".lock") };
}

const OK_EXEC = { enabled: true, allowed_user_ids: [42] };
const collect = () => { const out = []; return Object.assign((ev) => out.push(ev), { out }); };

test("runCommand refuses an unauthorized sender and never spawns", async () => {
  const emit = collect();
  const spawnFn = fakeSpawn([]);
  await runCommand({ event: { text: "hi", from_id: 99 }, paths: paths(), execCfg: OK_EXEC, spawnFn, emit });
  assert.equal(spawnFn.calls.length, 0);
  assert.deepEqual(emit.out.map((e) => e.type), ["exec_denied"]);
});

test("runCommand runs claude in the project root with the prompt as argv", async () => {
  const emit = collect();
  const p = paths();
  const spawnFn = fakeSpawn([{ type: "result", subtype: "success", result: "done", is_error: false }]);
  await runCommand({ event: { text: "run tests", from_id: 42 }, paths: p, execCfg: OK_EXEC, spawnFn, emit });
  assert.equal(spawnFn.calls[0].cmd, "claude");
  assert.equal(spawnFn.calls[0].args[1], "run tests");
  assert.equal(spawnFn.calls[0].opts.cwd, p.root);
  assert.equal(spawnFn.calls[0].opts.shell, undefined);
});

test("runCommand relays progress then the final result", async () => {
  const emit = collect();
  const spawnFn = fakeSpawn([
    { type: "system", subtype: "init", session_id: "sess-9" },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Edit", input: { file_path: "/a/b.ts" } }] } },
    { type: "result", subtype: "success", result: "2 files changed", is_error: false },
  ]);
  await runCommand({ event: { text: "go", from_id: 42 }, paths: paths(), execCfg: OK_EXEC, spawnFn, emit });
  assert.deepEqual(emit.out.map((e) => e.type), ["exec_started", "exec_progress", "exec_result"]);
  assert.equal(emit.out.at(-1).detail, "2 files changed");
});

test("runCommand persists the session id so the next command resumes it", async () => {
  const p = paths();
  const spawnFn = fakeSpawn([
    { type: "system", subtype: "init", session_id: "sess-9" },
    { type: "result", subtype: "success", result: "ok", is_error: false },
  ]);
  await runCommand({ event: { text: "go", from_id: 42 }, paths: p, execCfg: OK_EXEC, spawnFn, emit: collect() });
  assert.deepEqual(loadSession(p.sessionFile), { sessionId: "sess-9", isNew: false });
});

test("runCommand reports an error result as exec_error", async () => {
  const emit = collect();
  const spawnFn = fakeSpawn([{ type: "result", subtype: "error_during_execution", result: "boom", is_error: true }]);
  await runCommand({ event: { text: "go", from_id: 42 }, paths: paths(), execCfg: OK_EXEC, spawnFn, emit });
  assert.equal(emit.out.at(-1).type, "exec_error");
});

test("runCommand refuses to start while another run holds the lock", async () => {
  const p = paths();
  acquireLock(p.lockFile, { pid: process.pid });
  const emit = collect();
  const spawnFn = fakeSpawn([]);
  await runCommand({ event: { text: "go", from_id: 42 }, paths: p, execCfg: OK_EXEC, spawnFn, emit });
  assert.equal(spawnFn.calls.length, 0);
  assert.equal(emit.out.at(-1).type, "exec_busy");
});

test("runCommand releases the lock when the run finishes", async () => {
  const p = paths();
  const spawnFn = fakeSpawn([{ type: "result", subtype: "success", result: "ok", is_error: false }]);
  await runCommand({ event: { text: "go", from_id: 42 }, paths: p, execCfg: OK_EXEC, spawnFn, emit: collect() });
  assert.equal(acquireLock(p.lockFile, { pid: process.pid }), true);
});

test("runCommand kills a run that exceeds its timeout", async () => {
  const emit = collect();
  const spawnFn = fakeSpawn([], { hang: true });
  await runCommand({
    event: { text: "go", from_id: 42 }, paths: paths(),
    execCfg: { ...OK_EXEC, timeout_minutes: 0.001 }, spawnFn, emit,
  });
  assert.equal(emit.out.at(-1).type, "exec_error");
  assert.match(emit.out.at(-1).detail, /timed out/i);
});

test("runCommand starts a fresh session for /new and drops the marker from the prompt", async () => {
  const p = paths();
  saveSession(p.sessionFile, "old-session");
  const spawnFn = fakeSpawn([{ type: "result", subtype: "success", result: "ok", is_error: false }]);
  await runCommand({ event: { text: "/new refactor the parser", from_id: 42 }, paths: p, execCfg: OK_EXEC, spawnFn, emit: collect() });
  const args = spawnFn.calls[0].args;
  assert.ok(args.includes("--session-id"), "a /new command must not resume the old session");
  assert.equal(args[1], "refactor the parser");
});

test("runCommand terminates the child, reports cancellation, and frees the lock when aborted", async () => {
  const emit = collect();
  const p = paths();
  const spawnFn = fakeSpawn([], { hang: true });
  const ac = new AbortController();
  setTimeout(() => ac.abort(), 20);
  await runCommand({
    event: { text: "go", from_id: 42 }, paths: p,
    execCfg: { ...OK_EXEC, timeout_minutes: 0.05 }, spawnFn, emit, signal: ac.signal,
  });
  assert.equal(emit.out.at(-1).type, "exec_error");
  assert.match(emit.out.at(-1).detail, /cancelled/i);
  assert.equal(acquireLock(p.lockFile, { pid: process.pid }), true);
});
