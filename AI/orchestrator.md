# Workflow Orchestrator

> **Module:** AI / Runtime
> **Status:** Stable
> **Role:** The orchestrator IS the state machine executor. Workflows are the states; this module fires the transitions. It is not a Skill and edits no BRD content sections itself — its only writes are properties and S16 entries.
> **Executes:** [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) + [../Architecture/design-state-machine.md](../Architecture/design-state-machine.md)

## 1. Responsibilities

0. **Manifest gate** — before ANY project work: `C_MANIFEST` ([../Architecture/project-manifest.md](../Architecture/project-manifest.md)). Missing/incomplete manifest → refuse BRD work, offer [project-onboarding](../Workflows/project-onboarding.md). Stale `last_validated` → run [integration-validation](../Workflows/integration-validation.md) first. Project facts come from the manifest — never re-ask the user for manifest-held values.
1. **Pickup** — select next BRD from `Ready` (priority order) when a slot is free (<3 in-flight) and `C_MANIFEST` holds for its project.
2. **Stage routing** — map `Status` → workflow module → skill → model tier per [model-routing.md](model-routing.md); load only what the stage needs; log the model in the Stage-Enter S16 entry.
3. **Input verification** — before running a stage, check `C_SECTIONS(required)`: required BRD sections exist and are non-empty. Missing input → back-transition to the producing stage, never improvise the input.
4. **Gate enforcement** — never cross a human gate without the approval token in `Approvals`; revoke tokens when gated content changes (stale-approval rule). At Dev Planning entry additionally run `C_CONTRACT` ([../Checklists/screen-contract.md](../Checklists/screen-contract.md)): any missing mapping → stop, report `SCR-id · block · gap` lines, route to the owning stage, log S16. No implementation on an incomplete Screen Contract.
5. **Loop accounting** — increment `Loop Count` before re-entry; enforce ceilings; on breach set `Blocked` + escalation summary in S16, never loop silently.
6. **Notion updates** — advance `Status`, set `Stage Owner`, write the S16 transition entry after every transition (atomic: status + log together).
7. **Resume** — reconstruct everything from Notion properties + S16. Session memory is never machine state.
8. **Surfacing** — at stage entry, list open S16 `Affects:` entries targeting sections this stage owns; the stage must address or explicitly defer them.
9. **Telegram adapter duties** (v1.4 — only when `manifest.communication.telegram.enabled`; contract: [../extensions/telegram/README.md](../extensions/telegram/README.md)):
   - Write an outbox event at exactly four triggers: Direction gate raised, Design gate raised, PR ready (Human Review), pipeline failure (`Blocked`/CI red).
   - Refresh `.toolkit/telegram/status.json` at every transition (project, BRD, stage, owner, progress `n/13`, pending gate).
   - Read `.toolkit/telegram/inbox/` at session entry AND before every gate check: each approval event = the human's gate decision — apply under normal gate rules (stale-approval + scope checks still run), log S16 with `source: telegram`, delete the event file. `pause` → `Blocked (paused-by-user)`; `resume` → clear.
   - The plugin is an adapter; the orchestrator remains the only component that advances state.

## 2. Session Entry Procedure

On any session start (or `resume <brd-id>` request):

1. Query the BRD DB: in-flight pages (Status ∈ Analysis…Human Review) + `Ready` pages, filtered to this project unless told otherwise.
2. If a specific BRD named → load it. Else: continue oldest in-flight first; pick up new `Ready` BRDs only when slots free and user confirms pickup.
3. Read BRD properties + S16 tail (last 10 entries) → determine exact machine position, pending gates, open loops.
4. Announce: BRD, stage, pending gates/blockers, planned action. Then run the stage.

## 3. Stage Execution Protocol

For every stage, in order:

```
ENTER   verify C_SECTIONS(stage.inputs)          → missing? back-transition
        surface open Affects entries for stage-owned sections
        set Stage Owner = stage.skill; log S16 entry [Stage-Enter]
RUN     load Workflows/<stage>.md + Skills/<role>.md + referenced Standards/
        act ONLY with that role's permission-matrix rights
        write findings to BRD immediately when discovered (living doc), not at exit
EXIT    run stage exit checklist (Checklists/ when built; workflow
        Completion Criteria until then)
        pass → write outputs summary + S16 [Stage-Exit] entry → advance Status
        fail → retry with failed rule as corrective constraint (ceiling per
        state machine) → ceiling hit? escalation edge (back-transition or Blocked)
GATE    if stage exits through a human gate: present decision package
        (what to review, where — e.g. running prototype URL, PR link),
        capture approve/deny/change-requests verbatim, log S16, update Approvals
```

## 4. Gate Presentation Format

When a human gate is pending, present exactly:

1. **BRD** — ID, name, link.
2. **Gate** — which (Direction / Design / Final) and what approval unlocks.
3. **Review target** — Direction: S01–S06 summary. Design: running prototype URL (Run Local, port 8765 default) + S07–S09. Final: PR link + diff summary + S13/S14 verdicts.
4. **Known limitations** — from audits, transparently.
5. **Ask** — `approve` / `request-changes` (structured, each with target) / `reject` / `stop`.

Multiple pending gates across parallel BRDs → batch, oldest first.

## 5. Parallel BRD Rules

- Max 3 in-flight. Pickup blocked otherwise.
- One session works one BRD's stage at a time; switching BRDs is fine at stage boundaries (state is in Notion).
- At Dev Planning, S10 must list touched code areas; orchestrator cross-checks other in-flight BRDs' S10 for overlap → overlap = serialize or explicit user call, logged S16.

## 6. Blocked / Stopped Handling

- `Blocked`: set `Blocked Reason`, write S16 escalation summary (what's stuck, what unblocks it, ceiling counts). Resumable — session entry §2 surfaces blocked BRDs with their unblock condition.
- `Stopped`: only via human decision (Planning `stop` recommendation confirmed, or explicit instruction). Rationale in S16. Terminal.

## 7. Orchestrator Anti-Rules

- Never edits S01–S15 content (no role rights). Properties + S16 only.
- Never invents stage inputs to keep moving — back-transition instead.
- Never advances Status without the exit check passing.
- Never carries approvals across content changes.
- Never holds state only in conversation. If it isn't in Notion, it didn't happen.
