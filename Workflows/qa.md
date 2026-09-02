# Workflow — QA

> **Module:** Workflows
> **Stage:** `QA` (lifecycle state 07)
> **Skill:** QA Engineer
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Verify the implementation against S03 acceptance criteria and S09 states — adversarially, with evidence. QA verifies claims; it does not take the implementer's word.

## Inputs

- Implementation exit claim (S12 current, tests green claim)
- **`C_SECURITY` passed** — S14 Security Certificate `certified` for the current branch head ([security-certification](security-certification.md)). QA does not open on uncertified code; a certificate naming an older sha is stale and sends the BRD back before QA starts.
- S03 ACs (verbatim test basis), S09 edge-case matrix, S11 test plan
- Running app/branch build; prototype (behavior reference)

## Outputs

- S13 — verification table: every AC → `pass` / `fail` / `blocked` + evidence pointer (test name, command output, screenshot); bug list: repro steps, expected vs actual, severity (`blocker`/`major`/`minor`), linked AC/state
- S06 (append) — systemic quality risks discovered
- S16 — stage verdict; bugs routed

## BRD Sections It May Update

S13 (edit), S09 (append — newly discovered edge cases), S06 (append), S16 (append).

## Phase modes (v2.0)

| | `Phase: FE` (mock-backed) | `Phase: BE` (integrated) |
|---|---|---|
| Verify | every front-end-observable AC · every S09 state via its fixture · a11y · responsive · arrangement tests | every Phase-1 AC **re-run against the real service** · server-only ACs · latency, ordering, partial failure, retry, webhook delay |
| S13 | mark `Verified on: mocks` | mark `Verified on: integrated` |
| Exit | Tech Review | Tech Review, after `C_PARITY` ([integration-parity](../Checklists/integration-parity.md)) |

An AC verified on mocks is **not** verified. It is verified on mocks, which is why the column
exists. `Phase: single` BRDs use the integrated column only.

## Responsibilities

1. Execute every AC as written. AC untestable as written → `blocked` + S16 `Affects: S03` (BA owns AC quality); never reinterpret silently.
2. Walk the S09 matrix in the running app: force errors, empty data, interruptions, offline, permission-denied. Reachability in code ≠ correct behavior — verify the behavior.
3. Run the planned test suite + typecheck + lint yourself; re-run, don't trust the claim.
4. Exploratory pass beyond the matrix: boundaries, double-submits, rapid navigation, stale data, back-button. New edge case found → append S09 + file bug.
5. File bugs with exact repro; severity honest: `blocker` = AC broken or data/auth integrity risk; `major` = wrong behavior with workaround; `minor` = polish.
6. Verdict: zero open blockers + every AC `pass` (or user-waived in S16) → advance. Else → `Implementation` with bug list (`L_QA`).

## Completion Criteria

- [ ] `C_SECURITY` held at entry, and still holds at exit (QA-loop fixes push commits → certificate re-issued against the new head)
- [ ] Every AC has a row: pass/fail/blocked + evidence pointer — no evidence, no pass
- [ ] Every S09 state exercised in the running app, result recorded
- [ ] Test suite + typecheck + lint executed by QA, output referenced
- [ ] Every bug has repro steps, severity, linked AC/state
- [ ] Zero open `blocker` at exit (or explicit user waiver in S16)
- [ ] S16 stage-exit entry written

## Failure & Loops

- Blockers → back to `Implementation`, ceiling 3 (`L_QA`) → `Blocked` + open-bug escalation summary.
- Ambiguous expected behavior → S16 `Affects: S07` (UX owns behavior) — QA doesn't invent product behavior.

## Common Mistakes

- Pass without proof — the cardinal sin. Every `pass` cites its evidence.
- Testing only through the test suite — suites verify what implementers thought of; QA exists for what they didn't.
- Happy-path QA — S09 walk is the job, not the bonus round.
- Severity inflation/deflation — politeness downgrades and panic upgrades both corrupt the loop ceiling math.
- Fixing bugs while testing — QA files, implementation fixes; role bleed destroys the verification boundary.
- Vague repro ("sometimes breaks") — unactionable; pin it or mark it flaky-with-frequency.

## Best Practices

- Copy ACs verbatim into S13 rows — paraphrase drift is how criteria get silently weakened.
- Test the recovery routes, not just the errors: error state → recovery action → verify preserved context/intent (S07 promised it).
- Batch bug filing per session, one S16 routing entry — cleaner loop accounting.
- Note near-misses (worked, but fragile) in S06 — cheap systemic signal for review stage.
- Keep a scratch env checklist (viewport, reduced-motion, keyboard-only, slow network) — run it every BRD; it's the poor man's a11y/perf gate until those checklists build in Phase 4.
