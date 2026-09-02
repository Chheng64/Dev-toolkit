import test from "node:test";
import assert from "node:assert/strict";
import { classifyMessage, formatEvent } from "./telegram-plugin.mjs";

// ---------- classifyMessage ----------

test("classifyMessage routes /status to the status reply", () => {
  assert.deepEqual(classifyMessage("/status"), { kind: "status" });
});

test("classifyMessage routes /status with a bot suffix", () => {
  assert.deepEqual(classifyMessage("/status@my_bot"), { kind: "status" });
});

test("classifyMessage routes /cancel to a cancel event", () => {
  assert.deepEqual(classifyMessage("/cancel"), { kind: "cancel" });
});

test("classifyMessage treats free text as a command", () => {
  assert.deepEqual(classifyMessage("run the test suite"), { kind: "command", text: "run the test suite" });
});

test("classifyMessage keeps /new as part of the command text", () => {
  assert.deepEqual(classifyMessage("/new refactor the parser"), { kind: "command", text: "/new refactor the parser" });
});

test("classifyMessage ignores empty or whitespace-only messages", () => {
  assert.equal(classifyMessage("   ").kind, "ignore");
  assert.equal(classifyMessage(undefined).kind, "ignore");
});

// ---------- formatEvent: exec events ----------

const NOTIF = { approvals: true, failures: true };

test("formatEvent announces the start of a run", () => {
  const out = formatEvent({ type: "exec_started", request: "run tests" }, NOTIF);
  assert.equal(out.wanted, true);
  assert.match(out.text, /run tests/);
});

test("formatEvent relays a successful result", () => {
  const out = formatEvent({ type: "exec_result", detail: "2 files changed" }, NOTIF);
  assert.equal(out.wanted, true);
  assert.match(out.text, /2 files changed/);
});

test("formatEvent relays an error", () => {
  const out = formatEvent({ type: "exec_error", detail: "boom" }, NOTIF);
  assert.equal(out.wanted, true);
  assert.match(out.text, /boom/);
});

test("formatEvent relays a denial so a blocked sender is never silently ignored", () => {
  const out = formatEvent({ type: "exec_denied", detail: "sender is not authorized" }, NOTIF);
  assert.equal(out.wanted, true);
  assert.match(out.text, /not authorized/);
});

test("formatEvent sends progress by default", () => {
  assert.equal(formatEvent({ type: "exec_progress", detail: "Edit b.ts" }, NOTIF).wanted, true);
});

test("formatEvent suppresses progress when exec_progress is disabled", () => {
  const out = formatEvent({ type: "exec_progress", detail: "Edit b.ts" }, { ...NOTIF, exec_progress: false });
  assert.equal(out.wanted, false);
});

test("formatEvent never suppresses a result even when progress is off", () => {
  const out = formatEvent({ type: "exec_result", detail: "done" }, { ...NOTIF, exec_progress: false });
  assert.equal(out.wanted, true);
});

test("formatEvent escapes html in executor output", () => {
  const out = formatEvent({ type: "exec_result", detail: "<script>alert(1)</script>" }, NOTIF);
  assert.ok(!out.text.includes("<script>"));
  assert.match(out.text, /&lt;script&gt;/);
});

test("formatEvent still honours the existing gate contract", () => {
  const out = formatEvent({ type: "gate", gate: "direction", brd: "BRD-1", title: "T" }, NOTIF);
  assert.equal(out.wanted, true);
  assert.ok(out.keyboard, "gate events must keep their approval buttons");
});

test("formatEvent respects the approvals flag for gates", () => {
  assert.equal(formatEvent({ type: "gate", gate: "direction", brd: "BRD-1" }, { approvals: false }).wanted, false);
});
