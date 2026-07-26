# Prompt — Testing

> **Use:** QA pass, or dedicated test-writing/gap-closing session.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>.
Mode: <QA stage (full Workflows/qa.md) | test-gap closure on <area>>.
Role: QA Engineer.

QA stage: run the workflow verbatim — S13 rows per AC verbatim-copied,
evidence per verdict, S09 walk in the running app (force the states, verify
the BEHAVIOR incl. recovery + preserved intent), independent re-run of
suite/typecheck/lint, exploratory sweep (boundaries, double-submit,
back-button, refresh-mid-op, 3 viewports, keyboard-only, reduced-motion).
Bugs per Templates/bug-report.md, honest severity. Exit through
Checklists/qa-testing.md.

Test-gap mode: map existing tests → ACs/S09 states for <area>; list
uncovered pairs ranked by risk; write tests for the top <n>:
- cheapest layer that proves the claim (code-quality rule 4)
- behavior assertions, user-visible queries — no implementation coupling
- each new test watched failing first (break it or write it red)
- deterministic: boundary-mocked network/clock/random

Report: coverage delta by AC/state (not line %), remaining gaps + risk.
```

## Notes

- QA mode never fixes — role boundary absolute; bounce with the bug list.
- Green-but-worthless detector: a test whose assertions survive deleting the feature is testing mocks.
- Coverage % is not the metric; AC/state coverage is.
