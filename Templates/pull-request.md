# Template — Pull Request

> **Use:** every PR body. The Final Gate's decision package — decidable in one read without opening the diff cold.

```markdown
## [BRD-<XX>-<nnn>] <feature name>

**BRD:** <notion page URL>
**Toolkit:** v<X.Y.Z>

### What & why
<2–4 sentences from S01/S03: the problem, what this ships, the cut-line
(what's deliberately NOT in).>

### How to see it
<the 30-second path: URL/route + steps to the primary flow; test account
notes if needed>

### Screenshots / recording
<before/after for changes; every new screen incl. one non-happy state>

### Verification (from S13)
- ACs: <n>/<n> pass — evidence in S13
- Suite: `<command>` ✅ · typecheck ✅ · lint ✅
- Edge states walked: <list the S09 states QA exercised>

### Review (from S14)
- Verdict: approve · dimensions clean: <list> · findings resolved: <n>

### Known limitations
<from S14 — stated, not curated away; "none" only if truly none>

### Deviations from plan
<from S12 — what changed vs S10/S11 and why; "none" if none>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Rules

- Title contract: `[BRD-ID] name`. First body line links the BRD (bidirectional per [integration-map](../Architecture/integration-map.md) §3).
- Screenshots mandatory for anything visual; include ≥1 non-happy state — the happy screenshot hides the work that matters.
- Verification section quotes real command results, not intentions.
- New commits after Final approval → approval revoked, PR body's verification section re-stamped ([git workflow](../Workflows/git.md)).
