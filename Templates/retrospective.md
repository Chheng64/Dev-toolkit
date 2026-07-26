# Template — Retrospective

> **Use:** optional, after Release on BRDs that fought back (ceiling hits, gate denials, >1 revision cycle) or periodically across several BRDs. Output feeds the toolkit — that's the point.

```markdown
## Retro — [BRD-ID(s)] · <date>

### The numbers
- Cycle: Ready → Released in <n> sessions/days
- Loops: L_DESIGN <n>/3 · L_QA <n>/3 · L_REVIEW <n>/2 · L_HUMAN <n>/3
- Gate outcomes: direction <1st-pass?> · design <…> · final <…>
- Bugs by stage found: QA <n> · review <n> · post-release <n>

### What the S16 log says (read it end-to-end first)
- <pattern 1 — e.g. "3 of 5 QA bounces were unhandled S09 states">
- <pattern 2>

### Worked — keep
- <practice that earned its cost>

### Hurt — change
- <friction/failure → root cause (process? standard gap? skill boundary?)>

### Toolkit changes proposed
| Change | Module | Type |
|--------|--------|------|
| <add webhook-delay item> | Checklists/qa-testing.md | patch |
| <new rule: X> | Standards/react.md | minor |

### Project-only lessons (→ project-overrides.md / CLAUDE.md)
- <stack quirk that isn't global>
```

## Rules

- Evidence over vibes: every "hurt" claim cites S16 entries or loop counts.
- Every lesson lands somewhere concrete — toolkit PR, override file, or explicit "not worth encoding". Lessons without a landing rot.
- Blame the process, fix the process: recurring human/AI error = missing gate/checklist item, not a resolution to try harder.
- Toolkit changes ship via the toolkit repo's own flow ([versioning](../Architecture/versioning.md) §4) — retro proposes, changelog disposes.
