# Template — Bug Report (S13 bug entry format)

> **Use:** every bug filed by QA/Debug/anyone into S13. Reproducible from its own text alone or it isn't filed yet.

```markdown
### BUG-<brd>-<n> — <one-line symptom>
- **Severity:** blocker | major | minor
  <blocker: AC broken or data/auth integrity risk · major: wrong behavior,
  workaround exists · minor: polish>
- **Found in:** <stage> · <commit/branch> · <env: local/preview/prod>
- **Linked:** AC<x.y> / S09 state <NAME> / R<n>
- **Repro:**
  1. <exact step, exact data>
  2. …
  Frequency: always | intermittent (<n>/<m> tries) | once
- **Expected:** <per AC/S09 — cite it>
- **Actual:** <what happens; error text quoted EXACT>
- **Evidence:** <screenshot / log line / failing test name>
- **Status:** open | fixing | fixed-pending-verify | verified | wontfix (see S16)
- **Root cause:** <filled at fix time — mechanism, not "fixed by change X">
```

## Rules

- No repro steps → not a bug report yet; it's a lead. Instrument, then file.
- Expected cites the spec (AC or S09) — "I think it should" without a citation routes to `Affects: S07` instead (behavior question, not bug).
- Severity honest per the definitions — loop-ceiling math depends on it ([qa workflow](../Workflows/qa.md)).
- `verified` only by QA re-running the original repro against the fix — implementer's "fixed" is `fixed-pending-verify`.
- Error text quoted exactly, never paraphrased.
```
