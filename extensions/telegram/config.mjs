/**
 * Dev-toolkit Telegram extension — manifest config reader.
 *
 * Shared by the adapter (telegram-plugin.mjs) and the executor (executor.mjs) so
 * `communication.telegram` has exactly one parser. Indentation-scoped reader for
 * the known block — not a general YAML implementation.
 */

import { readFileSync, existsSync } from "node:fs";

const LIST_KEYS = new Set(["allowed_user_ids", "allowed_tools"]);
const NUMBER_KEYS = new Set(["timeout_minutes"]);

const unquote = (v) => v.replace(/^(["'])(.*)\1$/, "$2");

function stripComment(line) {
  // Only strip a comment that follows whitespace, so "#" inside a quoted value survives.
  return line.replace(/(^|\s)#.*$/, "$1").trimEnd();
}

function parseInlineList(raw) {
  const inner = raw.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(",").map((v) => unquote(v.trim())).filter(Boolean);
}

export function readTelegramConfig(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`project-manifest.yaml not found at ${manifestPath} — run from the project root.`);
  }
  const lines = readFileSync(manifestPath, "utf8").split("\n");

  const cfg = {};
  const exec = {};
  let inComm = false, inTg = false, sub = null, listKey = null;

  for (const raw of lines) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Continuation of a block list: "- 111"
    if (listKey && trimmed.startsWith("- ")) {
      (sub === "exec" ? exec : cfg)[listKey].push(unquote(trimmed.slice(2).trim()));
      continue;
    }
    listKey = null;

    const [key, ...rest] = trimmed.split(":");
    const value = unquote(rest.join(":").trim());

    if (indent === 0) { inComm = key === "communication"; inTg = false; sub = null; continue; }
    if (inComm && indent === 2) { inTg = key === "telegram"; sub = null; continue; }
    if (!inTg) continue;

    if (indent === 4) {
      sub = value === "" && (key === "notifications" || key === "exec") ? key : null;
      if (sub === "notifications") cfg.notifications ??= {};
      if (sub) continue;
      cfg[key] = value;
      continue;
    }
    if (indent === 6 && sub === "notifications") { cfg.notifications[key] = value === "true"; continue; }
    if (indent === 6 && sub === "exec") {
      if (LIST_KEYS.has(key)) {
        exec[key] = value.startsWith("[") ? parseInlineList(value) : [];
        if (!value.startsWith("[")) listKey = key;
        continue;
      }
      exec[key] = NUMBER_KEYS.has(key) ? Number(value) : value === "true" ? true : value === "false" ? false : value;
    }
  }

  if (cfg.enabled !== "true") throw new Error("communication.telegram.enabled is not true — nothing to do.");
  if (!cfg.chat_id) throw new Error("communication.telegram.chat_id missing.");

  return {
    projectName: readProjectName(lines),
    chatId: cfg.chat_id,
    topicId: cfg.mode === "topic" && cfg.topic_id ? Number(cfg.topic_id) : undefined,
    notifications: cfg.notifications ?? { approvals: true, failures: true },
    exec: { ...exec, enabled: exec.enabled === true },
  };
}

function readProjectName(lines) {
  let inProject = false;
  for (const raw of lines) {
    const indent = raw.length - raw.trimStart().length;
    const t = raw.trim();
    if (indent === 0) inProject = t.startsWith("project:");
    else if (inProject && indent === 2 && t.startsWith("name:")) {
      return unquote(stripComment(t.slice(5)).trim()) || "Project";
    }
  }
  return "Project";
}
