# Workflow Orchestrator

> **Module:** AI / Runtime
> **Status:** Stable
> **Role:** The orchestrator IS the state machine executor. Workflows are the states; this module fires the transitions. It is not a Skill and edits no BRD content sections itself — its only writes are properties and S16 entries.
> **Executes:** [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) + [../Architecture/design-state-machine.md](../Architecture/design-state-machine.md)

## 1. Responsibilities

0. **Manifest Gate** — at session entry, before ANY project work (pickup **and** resume alike). A fixed pipeline; each step's failure action is the only permitted next move:
   1. Load the **Toolkit Registry** (`~/.toolkit/registry.yaml`, [../Architecture/toolkit-registry.md](../Architecture/toolkit-registry.md)). Missing → offer one-time setup (README); nothing else runs.
   2. Load `project-manifest.yaml`. Missing / `onboarding.status: incomplete` → refuse BRD work, offer [project-onboarding](../Workflows/project-onboarding.md).
   3. `manifest_version` older than current → run **Migration** ([project-onboarding §Migration](../Workflows/project-onboarding.md)) — automatic offer, seeded from the old fields, resumable; runs **before** staleness/validation (those need registry ids the old manifest lacks). In-flight BRDs resume normally once it completes.
   4. `last_validated` stale (>30 days) → run [integration-validation](../Workflows/integration-validation.md).
   5. `C_MANIFEST` full check ([../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4) → fail: report exactly what unblocks.
   Project facts come from the manifest — never re-ask the user for manifest-held values.
0b. **Resource boundary** (v1.5 — [Project Boundary Rule](../Architecture/integration-map.md) §2b). All external access resolves through the Project Resource Registry by **stable identifier**. Never workspace-search Notion, browse Figma, or list repositories; never guess a resource. A stage requiring a slot that is missing, skipped, or `health: unreachable` → raise a **Resource Decision** ([project-manifest §3](../Architecture/project-manifest.md)): *connect existing / create new / confirm absence*. While it is pending, set `Status: Blocked`, `Blocked Reason: resource: <slot> — <reason>` — this makes the stop resumable at session entry (§2) and fires the Telegram failure trigger (responsibility 9). Log the decision S16; clear `Blocked` on resolution.
1. **Pickup** — select next BRD from `Ready` (priority order) when a slot is free (<3 in-flight) and `C_MANIFEST` holds for its project.
2. **Stage routing** — map `Status` → workflow module → skill → model tier per [model-routing.md](model-routing.md); load only what the stage needs; log the model in the Stage-Enter S16 entry.
2b. **Phase handling (v2.0)** — the phase decision, the Phase-1→Phase-2 flip, and the Product Gate ([../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §3 transitions, §4 guards, §6 gates; gate conduct: [../Workflows/product-validation.md](../Workflows/product-validation.md)):
   1. At `Planning` exit, decide `C_SERVER_SCOPE`, set `Phase`, and log the decision with its
      evidence in S16. Never infer the phase later from the diff.
   2. At `Merged` with `Phase: FE`: record the product freeze sha in S08, flip `Phase` to `BE`,
      **reset `Loop Count`** and log the reset, then re-enter `Dev Planning`. Do not pass to
      `Released` — release is a Phase-2 event.
   3. Present the Product Gate as a *product* decision package (running app, flows walked, states
      walked, limitations at full strength), not a diff summary.
   4. On `L_CONTRACT`: drop the `product` token from `Approvals`, log the conflict with the
      contradicting constraint named, and re-enter `Dev Planning` with `Phase: FE`.
   5. Resume reads `Phase` from the property, never from the branch name. A BRD whose `Phase` is
      unset and whose Status is past `Planning` is a migration case: set `single` and log it.
3. **Input verification** — before running a stage, check `C_SECTIONS(required)`: required BRD sections exist and are non-empty. Missing input → back-transition to the producing stage, never improvise the input.
4. **Gate enforcement** — never cross a human gate without the approval token in `Approvals`; revoke tokens when gated content changes (stale-approval rule; classify the delta first — bug-fix-only → scope confirm with byte-level evidence, feature delta → a ruling). On `Design Gate` approval, evaluate `C_HANDOFF_REQUIRED` ([../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4): true → run design state 12 ([../Workflows/flow-visualization.md](../Workflows/flow-visualization.md)) and hold the BRD in `Design Review` until the **Developer Handoff Gate** resolves; false → log the skip in S16 and continue. At **QA entry and again at Tech Review entry** run `C_SECURITY` ([../Checklists/security.md](../Checklists/security.md)): S14 must carry a `certified` Security Certificate whose `certified_commit` equals the current branch head — stale or missing → stop, route to [../Workflows/security-certification.md](../Workflows/security-certification.md), log S16. No QA on uncertified code, no review on a certificate that predates the fixes. At Dev Planning entry additionally run `C_CONTRACT` ([../Checklists/screen-contract.md](../Checklists/screen-contract.md)): any missing mapping → stop, report `SCR-id · block · gap` lines, route to the owning stage, log S16. No implementation on an incomplete Screen Contract.
4b. **Check evidence, not claims** — where a gate's evidence is a tool run ([../Architecture/validation-engine.md](../Architecture/validation-engine.md)), read the **exit code**: `0` pass, `1` findings, `2` **the check did not run** — *unevaluable*, never a pass. A stage reporting "checks passed" with no exit code recorded has not produced gate evidence.

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

0. Run the **Manifest Gate** (responsibility 0, all five steps). Only after it passes may any external system be touched.
1. Query the BRD DB — via the registry binding (`resources.notion.brd_database.id`): in-flight pages (Status ∈ Analysis…Human Review) + `Ready` pages, filtered to this project unless told otherwise.
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
        design fidelity: when a PO handoff skips the Design Gate, schedule the
        fidelity review (ui-workflow M7, a reviewer who did not build the screen)
        BEFORE device proof — never skipped silently; the skip would be logged S16
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
2. **Gate** — which (Direction / Design / **Product** / **Developer Handoff** / Final) and what approval unlocks.
3. **Review target** — Direction: S01–S06 summary. Design: running prototype URL (Run Local, port 8765 default) + the **deep-link hook table** + S07–S09. Product: the running front-end (local URL, at the FE PR head sha) + the S07/S09 walk evidence + the issued `CTR-<brd-id>-v<n>` + the frozen prototype version + the mock-backed limitations statement — conduct: [../Workflows/product-validation.md](../Workflows/product-validation.md). Developer Handoff: the **derivation report** (`navmap-report.md`) — never the picture — plus registry sha, derivation run and prototype versions. Final: PR link + diff summary + S13/S14 verdicts.
4. **Known limitations** — from audits, transparently, at full strength. Every waiver names its rider debt item, grantor and closing condition; an acceptance with qualifications is recorded with its qualifications.
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
- Never lands a screen whose Design block lacks reading order / chrome / alignment for its bound frame, or that deviates from the frame on arrangement or hierarchy without a recorded Product Owner ruling (screen-contract §4a).
- Never touches a resource outside the Project Resource Registry — no workspace searches, no repo listing, no unregistered files. Missing resource → connect/create offer, never a guess (responsibility 0b).
