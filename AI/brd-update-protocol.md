# BRD Update Protocol

> **Module:** AI / Runtime
> **Status:** Stable
> **Purpose:** How Claude edits a Living BRD in Notion. Implements [../Architecture/permission-matrix.md](../Architecture/permission-matrix.md) at write time. Applies to every workflow and skill, no exceptions.

## 1. Core Rules

1. **Living document** — the BRD evolves; never replace it, fork it, or shadow it with side documents. New finding → update the BRD **at the moment of discovery**, mid-stage.
2. **Role-scoped writes** — before any write, know: acting role (Notion `Stage Owner`), target section ID, matrix right (E/A/R). No right → cross-domain protocol (§3).
3. **Additive by default** — revise-mode sections: rewrite own prior content freely, never delete or rewrite another role's content. Append-mode sections: add entries, touch nothing existing.
4. **Preserve history** — significant reversals don't erase the old position; the new content states the change and S16 records why (`Supersedes:` ref).
5. **No global knowledge in BRDs** — standards/process content is linked from the toolkit, never pasted in. One-line pointer max.
6. **Normalize language** — BRD text is human-readable product language. Raw tool output, stack traces, dumps → summarize; long evidence goes to the repo/PR, linked.

## 2. Write Procedure (per edit)

1. Fetch current section content (`notion-fetch` the page/section) — never write against stale content from earlier in the session if the stage spans other writes.
2. Verify right: role × section = E or A.
3. Compose the edit:
   - **revise + own content** → update in place under the section heading.
   - **append section** → new dated entry at section end: `**[YYYY-MM-DD · Role]** — <entry>`.
4. Write via `notion-update-page`.
5. If the edit is a decision, a deviation, or affects other sections → also append S16 entry (schema format).
6. If the edit changes content a granted approval was scoped to → tell the orchestrator: approval token must be revoked (stale-approval rule).

## 3. Cross-Domain Findings

Discover something owned by a foreign section:

```
1. Write the finding where you have rights (usually S05 Research Notes, dated entry).
2. Append S16: "[date] [stage] [role] — <finding>. Affects: S<nn>. Why: <evidence>."
3. Do NOT touch the foreign section. Owner applies it on next activation
   (orchestrator surfaces open Affects entries at stage entry).
```

Human explicitly directs a cross-domain edit → do it, log the override in S16.

## 4. Section-Specific Notes

- **S03 Requirements** — requirement IDs (`R1..`) and AC IDs (`AC1.1..`) are stable once created; drop a requirement by marking `dropped (see S16)`, never renumber.
- **S12 Progress** — append-mode, one dated entry per work session minimum; deviations from S10/S11 plan get their own entry + S16.
- **S13 Verification** — every AC row ends `pass`/`fail`/`blocked` + evidence pointer (test name, command, screenshot). Never `pass` without proof.
- **S16 Decision Log** — append-only for everyone. Corrections are new entries with `Supersedes:`. Never edit an existing entry, even for typos.

## 5. Conflict Handling

- Same-section concurrent edit detected (content differs from fetch) → re-fetch, merge additively, log S16 if resolution was non-trivial.
- Two BRDs claim the same decision territory → orchestrator surfaces; user decides; both BRDs' S16 record the outcome with cross-references.

## 6. Anti-Patterns

- Batch-updating the BRD "at the end" — findings land when found.
- Deleting anything another role wrote.
- Editing S16 history.
- Pasting standards/workflow text into a BRD.
- Writing `pass` in S13 without runnable evidence.
- Creating a side doc ("notes.md", scratch Notion page) for feature knowledge that belongs in the BRD.
