import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readTelegramConfig } from "./config.mjs";

function manifest(body) {
  const file = join(mkdtempSync(join(tmpdir(), "tg-cfg-")), "project-manifest.yaml");
  writeFileSync(file, body);
  return file;
}

const BASE = `project:
  name: Toolkit Pilot
communication:
  telegram:
    enabled: true
    mode: topic
    chat_id: "-1001234567890"
    topic_id: 42
`;

test("readTelegramConfig reads routing and project name", () => {
  const cfg = readTelegramConfig(manifest(BASE));
  assert.equal(cfg.projectName, "Toolkit Pilot");
  assert.equal(cfg.chatId, "-1001234567890");
  assert.equal(cfg.topicId, 42);
});

test("readTelegramConfig ignores topic_id unless mode is topic", () => {
  const cfg = readTelegramConfig(manifest(BASE.replace("mode: topic", "mode: group")));
  assert.equal(cfg.topicId, undefined);
});

test("readTelegramConfig reads notification flags", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    notifications:
      approvals: true
      failures: false
`));
  assert.deepEqual(cfg.notifications, { approvals: true, failures: false });
});

test("readTelegramConfig throws when telegram is not enabled", () => {
  assert.throws(() => readTelegramConfig(manifest(BASE.replace("enabled: true", "enabled: false"))), /not true/i);
});

test("readTelegramConfig throws when the manifest is missing", () => {
  assert.throws(() => readTelegramConfig(join(tmpdir(), "nope-does-not-exist.yaml")), /not found/i);
});

test("readTelegramConfig throws when chat_id is absent", () => {
  assert.throws(() => readTelegramConfig(manifest(BASE.replace(/    chat_id:.*\n/, ""))), /chat_id/i);
});

// ---------- exec block ----------

test("readTelegramConfig reports exec disabled when the block is absent", () => {
  assert.deepEqual(readTelegramConfig(manifest(BASE)).exec, { enabled: false });
});

test("readTelegramConfig reads the exec block", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    exec:
      enabled: true
      permission_mode: acceptEdits
      timeout_minutes: 5
`));
  assert.equal(cfg.exec.enabled, true);
  assert.equal(cfg.exec.permission_mode, "acceptEdits");
  assert.equal(cfg.exec.timeout_minutes, 5);
});

test("readTelegramConfig parses an inline allow-list", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    exec:
      enabled: true
      allowed_user_ids: [111, 222]
`));
  assert.deepEqual(cfg.exec.allowed_user_ids, ["111", "222"]);
});

test("readTelegramConfig parses a block allow-list", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    exec:
      enabled: true
      allowed_user_ids:
        - 111
        - 222
`));
  assert.deepEqual(cfg.exec.allowed_user_ids, ["111", "222"]);
});

test("readTelegramConfig parses a quoted allowed_tools list", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    exec:
      enabled: true
      allowed_tools: ["Read", "Bash(git *)"]
`));
  assert.deepEqual(cfg.exec.allowed_tools, ["Read", "Bash(git *)"]);
});

test("readTelegramConfig defaults exec.enabled to false when unset inside the block", () => {
  const cfg = readTelegramConfig(manifest(BASE + `    exec:
      permission_mode: plan
`));
  assert.equal(cfg.exec.enabled, false);
});

test("readTelegramConfig ignores a trailing comment on a value", () => {
  const cfg = readTelegramConfig(manifest(BASE.replace('chat_id: "-1001234567890"', 'chat_id: "-100123" # the group')));
  assert.equal(cfg.chatId, "-100123");
});
