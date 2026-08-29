# Workflow — Git

> **Module:** Workflows
> **Stage:** `PR` (lifecycle state 09) + branch ops at Implementation entry + merge mechanics at `Merged`
> **Skill:** Git Manager
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2; naming contracts in [integration-map.md](../Architecture/integration-map.md) §3

## Purpose

Own the Git ↔ BRD bridge: branch lifecycle, commit hygiene, PR assembly, CI status, merge mechanics. Every artifact bidirectionally linked to its BRD.

## Inputs

- Branch ops: BRD entering Implementation (branch needed) — BRD-ID + slug + `Phase`
- PR stage: Tech Review `approve` in S14; branch pushed; S13/S14 summaries
- Merge: `Approvals` contains `product` (`Phase: FE`) **or** `final` (`Phase: BE` | `Phase: single`)

## Outputs

- Branch, from current main: `feat/<brd-id>-<slug>` for `Phase: single`; `feat/<brd-id>-<slug>-fe` /
  `feat/<brd-id>-<slug>-be` for split BRDs (v2.0) — BRD `Branch` property set to the current
  phase's name
- PR from template (Phase 4; until then: title `[BRD-ID] name`, body = BRD link + S13/S14 summary + test evidence + known limitations); BRD `PR` property set to the current phase's PR (and `FE PR` / `BE PR` populated for split BRDs, [brd-schema §1](../Architecture/brd-schema.md))
- Merge per project strategy (default squash); branch deleted **once its phase is fully done with it**, never before — see Responsibility 5; S16 records
- Commit convention enforced: `<type>(<BRD-ID>): <subject>`

## BRD Sections It May Update

S15 (edit), S16 (append), `Branch`/`PR`/`FE PR`/`BE PR` properties.

## Responsibilities

1. **Branch creation** (Implementation entry): from up-to-date main, exactly one branch **per phase** — `Phase: single` cuts `feat/<brd-id>-<slug>` once; a split BRD cuts `feat/<brd-id>-<slug>-fe` for Phase 1, then cuts `feat/<brd-id>-<slug>-be` **fresh from main** (containing the FE merge) for Phase 2, after the flip. Long-lived branch → rebase on main at stage boundaries, never mid-QA (invalidates verification).
2. **Commit hygiene:** convention format, atomic commits; interactive-rebase cleanup before PR if history is noisy (never after review starts).
3. **PR assembly:** title/body contracts; first line links the BRD; includes: what/why summary (from S01/S03), test evidence (S13), review verdict (S14), known limitations, screenshots for UI. CI must be green before Human Review is raised.
4. **CI failure:** route to Implementation with the failing check named — PR stage doesn't fix code.
5. **Merge:**
   - `Phase: FE` (post-**Product** Gate, approval `product`): verify approval current (stale-approval rule), squash-merge with convention subject, confirm main green. **Delete the FE branch only after the phase flip records the product freeze sha** (S16) — never in the same step as the merge.
   - `Phase: BE` | `Phase: single` (post-**Final** Gate, approval `final`): verify approval current, squash-merge with convention subject, delete branch, confirm main green after merge.
6. Cross-BRD conflict at merge time → rebase + re-run QA-relevant checks; conflicts touching another in-flight BRD's declared areas → surface to user before resolving.

## Completion Criteria (PR stage)

- [ ] Branch pushed, history clean, convention-conformant
- [ ] PR open: title/body contracts met, BRD linked both directions (`PR` property set)
- [ ] CI green — all checks, no skips
- [ ] Evidence package in PR body: S13 + S14 summaries, limitations, UI screenshots
- [ ] S16 stage-exit entry written

## Failure & Loops

- CI red → Implementation (named failing check).
- Merge conflict invalidating verification → rebase, re-verify affected ACs (targeted, not full re-QA unless touched areas demand it), log S16.
- Approval stale at merge → back to Human Review with the delta since approval.

## Common Mistakes

- Branch from stale main — guaranteed conflict tax at merge.
- Mixed-BRD commits on one branch — breaks 1 BRD = 1 branch = 1 PR **per phase**, unrevertable.
- History rewrite after review started — invalidates what the reviewer saw.
- Merging on stale approval ("only tiny commits since") — the rule exists because "tiny" is where regressions hide.
- PR body that's just a link — the PR is the human gate's decision package; make it decidable in one read.
- Deleting the branch before confirming main is green post-merge.

## Best Practices

- Commit subjects state the change's effect, not the activity ("add profile lookup guard", not "update code").
- Screenshots/recordings for anything visual — cheapest review accelerant that exists.
- Keep PRs ≤ ~400 effective diff lines where the plan allows; bigger → slices were too big (feedback to planning).
- Tag the toolkit version in the PR body (`toolkit vX.Y.Z`) — process archaeology for later.
