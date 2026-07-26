# Template — Release Notes (S15 structure)

> **Use:** S15 at Release stage. Product language, written for the reader who didn't watch the work ([technical-writer](../Skills/technical-writer.md)).

```markdown
## S15 · Release Notes

### <version/tag> — <YYYY-MM-DD>

**<Feature name>** — <one sentence: what you can now do and why it matters.>

#### What changed
- <user-visible change 1 — outcome language, not implementation>
- <change 2>

#### Worth knowing
- <behavior notes a user/future-you would want: defaults chosen, where
  the feature lives, what it replaces>

#### Known limitations
- <from S14, honestly: what doesn't work yet, edge cases deferred —
  each with its follow-up status (new BRD seed / consciously dropped)>

#### Under the hood (optional, one line each)
- <notable technical shifts only if they affect operation: new service,
  migration ran, flag introduced>

Deploy: <target + date> · Verified live: <smoke-check result> · Toolkit: v<X.Y.Z>
```

## Rules

- Outcome language: "You can now recover an interrupted checkout" — not "Refactored checkout state machine".
- Limitations section mandatory and honest — omitting S14 known concerns is lying by curation ([release workflow](../Workflows/release.md)).
- No commit-log paste; no internal jargon; error/feature names in user vocabulary.
- Every limitation states its fate: seeded as BRD, or dropped in writing.
