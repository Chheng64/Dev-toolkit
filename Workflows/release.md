# Workflow — Release

> **Module:** Workflows
> **Stage:** `Merged` → `Released` (lifecycle states 11–12)
> **Skill:** Git Manager + Technical Writer
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Close the loop: ship the merged work, write honest release notes back to the BRD, freeze the record, mark done. A BRD is not finished when code merges — it's finished when the BRD says what shipped.

## Inputs

- `Status: Merged`; main green; `Approvals` contains `final` (current)
- S13 (what was verified), S14 (known concerns), S12 (deviations — what actually got built)
- Project deploy mechanism (if any: Vercel, tag-triggered, manual)

## Outputs

- Deploy executed per project (or explicit `no-deploy` note for library/internal work)
- S15 Release Notes — user-facing summary: what changed, why it matters, known limitations, date, version/tag
- `Release Tag` property + the S17 rollup row with `--state released` — the PO's last link, the one that says shipped
- BRD closed: `Status: Released`; terminal S16 entry; content sections frozen (post-release edits = new BRD or explicit reopen logged in S16)
- Deferred items from S03/S13 surfaced as candidate seeds for new BRDs

## BRD Sections It May Update

S15 (edit), S16 (append), S17 (append), `Status`/`Release Tag` properties.

## Responsibilities

1. Verify preconditions: merged, main green, approval current. Any doubt → do not ship; back to the owning stage.
2. Execute deploy per project convention; verify the deployed artifact (smoke-check the feature live, not just the pipeline exit code).
3. Post-deploy regression signal (feature broken live) → route: hotfix via debug workflow + new fast-tracked BRD, or rollback; log S16 either way.
4. Write S15 in product language: what a user/future-you gains; honest limitations from S14; no internal jargon.
5. Sweep deferred/minor items (S03 `deferred`, S13 `minor` bugs, S16 open notes) → list them in the terminal S16 entry as new-BRD candidates. Nothing evaporates silently.
6. Freeze: terminal S16 entry (date, version, deploy target, toolkit version), `Status: Released`. Set `Release Tag` and append the released rollup row before flipping `Status` — a released BRD whose delivery log stops at `merged` is a log that lies by omission.

## Completion Criteria

- [ ] Deployed and smoke-verified live (or `no-deploy` recorded with reason)
- [ ] S15 written: changes, limitations, date, version
- [ ] `Release Tag` set; S17 released rollup row appended
- [ ] Deferred-items sweep done; candidates listed in terminal S16 entry
- [ ] `Status: Released`; terminal S16 entry written
- [ ] No open change items anywhere in the BRD

## Failure & Loops

- Completeness regression caught here (unmet AC surfaces late) → do **not** ship; route to `Implementation`/`QA` with specifics. No silent shipping of incomplete work.
- Deploy failure → fix-forward via debug workflow or rollback; `Blocked` if neither lands same-session.

## Common Mistakes

- "Merged = done" — the BRD closes when S15 exists and the sweep ran, not when GitHub shows purple.
- Release notes as commit-log paste — S15 is product language, written for the reader who didn't watch the work.
- Hiding known limitations — they're in S14; omitting them from S15 is lying by curation.
- Letting deferred items evaporate — the sweep is mandatory; deferred work either becomes a BRD seed or is consciously dropped in writing.
- Pipeline-green ≠ feature-live — smoke-check the actual behavior.

## Best Practices

- Smoke-check the primary flow + one S09 recovery path live — two minutes, catches config/env drift.
- Date + version + toolkit version in the terminal entry — future archaeology thanks you.
- Batch minor deferred items into periodic "polish" BRDs instead of letting them rot as notes.
- Post-release, skim S16 end-to-end once — anything that reads like a recurring lesson → toolkit improvement (that's how this repo grows).
