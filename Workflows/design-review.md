# Workflow — Design Review (design states 09 · 10 · 11)

> **Module:** Workflows
> **Stage:** `Design Review` (lifecycle state 04) → `Dev Planning`
> **Skill:** UI Designer presents; orchestrator routes; **user** grants the Design Gate
> **Machine:** [design-state-machine.md](../Architecture/design-state-machine.md) states 09 `USER_REVIEW` + 10 `REVISION` + 11 `FINAL_OUTPUT`
> **Cloned from:** vendored [`09-user-review`](../design-toolkit/skills/09-user-review/SKILL.md) · [`10-revision`](../design-toolkit/skills/10-revision/SKILL.md) · [`11-final-output`](../design-toolkit/skills/11-final-output/SKILL.md) @ `4081c24`. Method text is the skills' text; only artifact locations are remapped. Re-clone on vendor upgrade.

**This stage used to be "orchestrator-managed" with no procedure.** It is the stage that spends the one resource the machine cannot manufacture — human attention — and the stage where approvals go stale, loops run past their ceilings, and deliverables disagree with what shipped. The method below is the procedure.

---

## 0. Execution contract

| State | Runs when | Produces | Gate |
|---|---|---|---|
| 09 `USER_REVIEW` | self-audit verdict `pass` | S14 gate record + `Approvals` | **Design Gate** (user) |
| 10 `REVISION` | audit `fail` **or** `request-changes` | S16 `[Revision]` iteration entries | Conflict Mini-Gate (user, on conflicts only) |
| 12 `FLOW_VISUALIZATION` | `approve` ∧ `C_HANDOFF_REQUIRED` | navigation map | Developer Handoff Gate ([flow-visualization](flow-visualization.md)) |
| 11 `FINAL_OUTPUT` | `approve` (and gate 12 granted, when in scope) | frozen prototype + handoff | exits into `Dev Planning` |

**Artifact remap:** the vendored `review-record.md` is **S14 gate-record subsection + the `Approvals` property**; `revision-log.md` is **S16 entries tagged `[Revision]`, one per iteration, carrying the frontmatter and tables below verbatim**; `deliverable/` is **the frozen prototype commit + `design/deliverable/<brd-id>/handoff.md`** ([design-handoff](../Templates/design-handoff.md)); `machine_state` is **Notion properties**.

---

# PART A — STATE 09 · `USER_REVIEW` (the Design Gate)

## A.1 Contract

| Field | Value |
|---|---|
| Reads | `design/prototype/<brd-id>/`, its traceability map, S14 design-audit |
| Writes | S14 gate record, `Approvals`, S16 |
| Depends on | `SELF_AUDIT` — the machine gates itself before spending user attention |
| Approval gate | **Design Gate** — the central human gate |
| Retry ceiling | clarification bounded to **2 rounds**; surrounding `L_REVISION` is **3 full cycles** → `Blocked` |
| Next | 12 or 11 (`approve`) / 10 (`request-changes`) / `Analysis` (`reject`) / `Blocked` (user unavailable) |

## A.2 Purpose

Present the audited prototype and capture structured approval or change requests.

Everything upstream exists to make human attention cheap — the audit runs first so the user never debugs, and the packet is built so the user never hunts. Everything downstream depends on this record being **exact**: REVISION routes from it, and FINAL_OUTPUT requires an `approve` *scoped to the final frozen versions*.

## A.3 Processing steps

1. **Run Local (default).** Serve the prototype over local HTTP and open the player. Server already listening → **Refresh Run Local**: reuse it, reopen the player. Command: `design/prototype/<brd-id>/run-local.sh [port]` (default **8765**). **Record the player URL.**
2. **Package** prototype + audit summary. Review happens against the *running* prototype, never static files.
3. **Present known limitations** transparently, from the S14 design-audit.
4. **Capture** the response: `approve` / `request-changes` / `reject`.
5. **Structure** change requests into actionable, spec-linked items with a target state.
6. **Record** the outcome.

## A.4 Review method (hardened)

### G1 — Run Local, never a static preview

`run-local.sh` serves the prototype tree through `serve.py` on the configured port (default **8765**) and opens **`play.html`** — the player with the sidebar (feature list, walkthrough progress, *open standalone*). The sidebar **is** the intended review chrome; opening a raw page bypasses it. The script is idempotent and replaces a plain server on the port with the live-reload one. All three files ship in [`Templates/prototype/`](../Templates/prototype/); state 07 copies them into the prototype directory.

Two operational facts that silently degrade the review if missed:

- **A new prototype page must be registered in `play.html`'s `FEATURES` array** or it never appears in the sidebar and the user reviews the flow set minus the new flow.
- **Live reload is gated on a state file.** `serve.py` reads `TOOLKIT_STATE_FILE` (or `../../state/machine_state.yaml`) and enables reload only while `current_state` is `USER_REVIEW`. **In this toolkit machine state lives in Notion, so no such file exists — and a missing/unreadable state file means reload is ON.** That is the intended behaviour here. Do not "fix" it by inventing a second state store.

Deep-link into a flow with `play.html#<feature>`; the player splits `#id?query` so a hook survives into the stage iframe.

### G2 — The packet is the hook list

State 07's traceability table (B2) already names a deep-link hook for every flow state, variant and error case. **That table is the review packet.** Ship it with the verdict request so the user can reach the non-happy-path states directly instead of clicking toward them. A state the user cannot reach in one step is a state that gets approved unseen.

### G3 — An approval is scoped to the bytes it saw

- Freeze at the moment of approval and **record the sha256 of every approved file** in the gate record.
- Record `reads_versions` in frontmatter — the exact prototype version and the audit of record. A record that names its versions only in prose is not machine-checkable.
- If the audit of record pre-dates the reviewed bytes, that is a **waiver**, not a detail. Name it and give it a rider debt item (G6).

### G4 — Classify a post-approval delta before you ask about it

| Class | Evidence required | What to ask for |
|---|---|---|
| **Bug-fix only** | Byte-level proof: token/hex inventory identical, diff confined to named regions, and the pre-fix file **reconstructed from the inverse delta hashing back to the approved sha** | A one-line **scope confirm** |
| **Feature delta** | The new behaviour, plus what it changes in the approved surface | A **ruling** — the gate is `pending` until it lands |

Do not present a feature delta as a bug fix to avoid re-opening a gate. A record whose frontmatter names the bytes it *reviewed* and states plainly, in the outcome, the version the approval is *scoped to* when the two differ is the correct shape; it is the **silent re-freeze** that is the defect.

### G5 — Present limitations; do not launder them

The Known-limitations section of the design-audit is this state's input, not its embarrassment. An acceptance that carries qualifications is recorded **with its qualifications**. A clean-looking record of a qualified acceptance is a false record — and it is the artifact delivery is later checked against.

### G6 — Every waiver names its rider

A waiver ships only when all three hold: **the user grants it** (the machine cannot waive its own rules) · it is written into Known limitations **and** opened as a numbered debt item · it states **what would close it**. And what a waiver is *not*: a way to make a failing check pass — **a failing check that has not been confirmed at source is not eligible for a waiver**, it is eligible for the [false-positive catalogue](../Architecture/validation-engine.md).


A validation may be waived at the gate. It may not be waived *silently*. Each waiver records: which rule, why, who granted it, and **the debt item it rides on**. On the extraction run two validations were waived this way at one gate; both became tracked debt and both were closed the next day — that worked **because they were written down**.

### G7 — Keep the pass count honest

`pass N = 1 + revision rounds delivered`. One round is one prototype rebuild, however many sub-lettered asks it folds. Bump it in **every** place that states it — the progress snapshot, the flow row, the recommendation list — in the same edit, or they drift. Three pass counts were found stale at one gate and had to be corrected before it could close.

### G8 — Ambiguity is bounded, not absorbed

Ambiguous feedback → a targeted clarification sub-prompt, **bounded to 2 rounds**. After that, record it as a `non-blocking` note rather than guessing. A guess recorded as a requirement becomes a spec nobody chose.

## A.5 Output — BRD S14 gate record

```markdown
---
artifact: review-record
version: review-<brd-id>-NN
produced_by: user-review
reads_versions:
  prototype: <proto-<brd-id>-NN — the exact bytes reviewed>
  design-audit: <audit-<brd-id>-NN>
brd: <brd-id>
date: <YYYY-MM-DD>
gate: DesignGate
verdict: APPROVED | REQUEST-CHANGES | REJECTED
player_url: http://localhost:8765/play.html#<feature>
---

# Gate record — <feature>

## Decision

**<VERDICT>** on the **Nth presentation**, <date>.
User instruction, verbatim: *"<quote>"*.

| Field | Value |
|---|---|
| Flow | <flow + SCR ids> |
| Prototype at decision | `<proto-…>` |
| Audit of record | `<audit-…>` — <PASS N / N> |
| Reviewed at | `<player URL>` (Run Local rule V4) |
| Passes to approval | <N> |

## What was approved

<the ratified behaviour, decision by decision — this is what REVISION and
FINAL_OUTPUT will treat as settled.>

## Verification at approval

| Check | Result |
|---|---|
| Audit | <PASS N / N ACs> |
| Assertions (rendering-class) | <N / N> |
| Console | <N errors> |
| Screenshots | <N> |

## Change requests (if `request-changes`)

| ID | Verbatim ask | Target state | Spec link | Status |
|---|---|---|---|---|
| CR1 | *"<quote>"* | `UI_PLANNING` | R-x3 / F2 | open → S16 [Revision] |

_No request is dropped (V3). Anything not actioned is recorded as `deferred`
with a reason._

## Deltas ratified by this decision

| # | Delta | Class | Evidence |
|---|---|---|---|
| 1 | <change on top of frozen bytes> | bug-fix only \| **feature** | <inverse-delta hash / behaviour> |

## Known limitations presented

<verbatim from the design-audit — carried, not laundered (G5).>

## Opens carried forward

| ID | Question | Ships as |
|---|---|---|

## Validations waived

| Rule | Why | Granted by | Rides on |
|---|---|---|---|

## Freeze hashes

| Deliverable file | sha256 |
|---|---|
```

## A.6 Validation rules

- **V1:** Outcome ∈ {`approve`, `request-changes`, `reject`}.
- **V2:** If `request-changes`, **≥1** change request, each linked to a target state.
- **V3:** **No change request silently dropped** — every captured ask appears as `resolved`, `open` or explicitly `deferred` with a reason.
- **V4:** **Run Local executed** — reviewed against a served prototype, **player URL recorded**, not file previews.
- **V5** *(per G3)*: `reads_versions` names the exact prototype and audit versions, and **freeze hashes are recorded** for every approved file.
- **V6** *(per G6)*: Every waived validation names its rider debt item.

## A.7 Failure recovery

- **User unavailable** → `Blocked` (resumable). Not a failure.
- **Ambiguous feedback** → clarification sub-prompt, bounded to **2 rounds**, else a `non-blocking` note (G8).
- **Conflicting change requests** → surfaced at the **Conflict Mini-Gate** in REVISION, not resolved here. This state records the conflict faithfully, **including both sides**.
- **`reject`** → lifecycle `Analysis`. Reject means the direction is wrong at the root — an upstream fault, not a revision.
- **`L_REVISION` ceiling (3 full cycles)** → `Blocked` with an escalation summary. The loop can never silently continue.

## A.8 Recorded failure modes

### A. Gate integrity

| Case | What happened | Rule |
|---|---|---|
| **Bytes moved after approval, three times in one session** | Two bug-fix deltas and one **feature** delta — a whole screen rebuilt as a new surface — all landed on top of already-frozen deliverables. The feature one needed a ruling, not a confirm. | G3, G4 |
| **A stale machine record while the machine reported shipping** | The state record sat **two days stale** — still naming an earlier flow at `USER_REVIEW / pending` — while four completion conditions were unmet. | G3 |
| **Pass counts stale in three places at once** | Three flows each understated their presentation count by two to four rounds; all had to be corrected before the gate could close. | G7 |
| **Frontmatter drift** | Records split into two shapes; the most recent **dropped `reads_versions` entirely**. That is the exact field delivery needs to check "approval scoped to the final frozen versions". | V5 |
| **V4 evidence not actually recorded** | Three of six records named the player and hook in prose; **none recorded a player URL**. The rule was satisfied in practice and unevidenced in the artifact. | V4, G1 |

### B. Packaging

- **A flow missing from the player sidebar is a flow the user does not review.** Register new pages in `play.html`'s `FEATURES` array in the same edit that creates the page.
- **Reviewing raw pages bypasses the player chrome.** This was a direct user correction, and it is why V4 exists.

### C. Waivers that worked

Audit currency and a missing traceability matrix were both waived at a gate and both recorded as debt with a named owner and a fix. Both were closed the next day — the audit re-run against the frozen bytes, the matrix backfilled. **The waiver was not the problem; it would have been the silence.**

---

# PART B — STATE 10 · `REVISION`

## B.1 Contract

| Field | Value |
|---|---|
| Reads | S14 design-audit and/or the gate record, all sections |
| Writes | S16 `[Revision]` entries (one per iteration) |
| Depends on | `SELF_AUDIT` (`fail`) **or** `USER_REVIEW` (`request-changes`) — a change set with no named source is scope creep, not a revision |
| Approval gate | **None to start.** **Conflict Mini-Gate** blocks dispatch of conflicting change requests |
| Retry ceiling | `L_REVISION` **3 full cycles** → `Blocked` + escalation summary. `L_AUDIT_FIX` **3** → escalates *into* `L_REVISION` accounting |
| Next | any upstream state (root-cause dispatch) / `SELF_AUDIT` (rebuild complete) / `Blocked` (ceiling) |

## B.2 Purpose

Apply audit findings and/or user change requests by routing work back to the correct upstream state(s), tracking each change to closure.

Every other state produces its own artifact. **This one produces work for other states**, which makes it the only place where a misrouted fault becomes three wasted cycles instead of one. On the run this method was extracted from, it ran **13 times across five flows with no written dispatch rule**. The rules below are that rule.

## B.3 Processing steps

1. **Merge** findings + change requests into a single change set.
2. **Triage** each change to its root-cause state.
3. **Order** changes by dependency (upstream before downstream).
4. **Dispatch** via back-transition; on return, re-run downstream states as needed.
5. **Track** each item to `resolved` / `deferred` with reason.

## B.4 Revision method (hardened)

### R1 — Merge first, dedup against `seen_changes`

One change set per cycle, drawn from both sources at once. Deduplicate against a `seen` set so a rejected change cannot re-enter the loop endlessly. When an item returns, classify it:

- **Same item, no new evidence** → drop it and cite the prior decision.
- **Same item, new evidence** → re-open it and name the evidence.

An item that reappears with no evidence and no citation is the loop running on its own exhaust.

### R2 — Route the class, not the instance

The reported defect is a sample. Before dispatch, state the **class** and sweep for it.

One defect was diagnosed as six selectors rendering a script on the wrong font stack in one file. Three were patched; **the class was never swept.** The actual root cause — the script token was an *opt-in* layer under a foreign base — surfaced **24 days later at 138 instances across 7 flows**, and behind it a second defect: the base stack carried no face for that script at all.

The class may also live in the **machine** rather than the artifact. One change request read "colours deviate from the DS"; the root cause was that the audit had *no token-conformance rule* — it checked DS presence, never non-DS absence. The dispatch was therefore **two** states: `SELF_AUDIT` (a new permanent rule) and `PROTOTYPE` (the values). Fixing only the values would have left the class open.

Record the sweep count. "Fixed in 1 file" and "fixed in 11 files" are different claims.

### R3 — Root cause is where the fault was introduced, not where it is visible

Everything is visible in the prototype. That is not evidence it belongs to `PROTOTYPE`.

| The ask is… | Root-cause state |
|---|---|
| a goal, scope, persona or constraint never captured | `Analysis` (S01–S04) |
| a convention, benchmark or platform claim that turned out wrong | `Analysis` (S05 research) |
| a change in *what* to build or its priority (direction, not execution) | `Planning` — the Direction Gate re-opens |
| a missing journey, an unserved need, an uncovered edge | `UX_PLANNING` (04) |
| a missing/unreachable state, a wrong branch or guard, a boundary that no longer holds | `FLOW_GENERATION` (05) |
| a component, token, layout, motion, contrast or density spec | `UI_PLANNING` (06) |
| the spec was right and the build does not match it | `PROTOTYPE` (07) |
| the defect passed a green check | `SELF_AUDIT` (08) **and** the owning artifact state — the check gap is its own item (R2) |

**A repeat is evidence of misrouting.** If an item is dispatched, returns, and comes back again, the root cause is upstream of where it was sent. Four consecutive change requests dispatched palette work to `UI_PLANNING`/`PROTOTYPE`; the machine ran to its ceiling before it was established that the real fault was **wrong-document adoption at `UI_PLANNING`** — a design-system spec belonging to a different project.

### R4 — Dispatch a bounded scope

Each dispatched item carries what changes **and what must not**.

One request asked for a palette change on a single screen. `PROTOTYPE` over-applied it and remixed the brand mark. The next cycle's first item was *"restore the original mark"*, and the log gained a permanent constraint: **the logo is an untouchable brand asset**. A revision that does more than the item asked manufactures the next revision item.

Constraints discovered this way are recorded in the log, not carried in memory.

### R5 — Supersession is part of the change; aged items are re-verified

When a revision replaces a component, the replaced one **leaves in the same change** (state 07 B7). A leftover selector or string is an un-specced element and fails the V-rules exactly as an addition does.

The mirror of this: **an open change item ages against a moving prototype.** By the time one carried defect was fixed, three of its six reported selectors *no longer existed*. Re-verify every carried item against current bytes before dispatch; an item that no longer applies is closed as `superseded`, naming the round that removed it — never silently dropped.

### R6 — Re-validate through `SELF_AUDIT`, or record a waiver

There is exactly one return edge: REVISION → rebuild complete → `SELF_AUDIT` → `USER_REVIEW`.

The extraction run shortcut that edge repeatedly, verifying rebuilds with targeted headless assertions and returning straight to the gate. Result: **five of seven approved flows arrived at their gate past their audit of record**, one four rounds past. When the audit was finally re-run against the frozen bytes (PASS 386/386) it immediately found **three more real defects**.

Targeted verification is evidence *inside* the loop. It is not the audit. Returning to the gate without a current audit is a **waiver**, and a waiver names its rider (G6). An in-review delta that claims to be audit-neutral must **say what makes it neutral** — one did: asset wiring only, no layout or copy change, screenshots re-verified. That is defensible because it was written down.

### R7 — Count the loop, out loud, every cycle

`L_REVISION` is per BRD. `L_AUDIT_FIX` is per audit round and, on breach, **escalates into `L_REVISION` accounting** — it does not reset it.

**One loop, two names.** `L_REVISION` (design machine) **is** `L_DESIGN` (lifecycle) — the same cycle counted in two places: the S16 `[Revision]` entry and Notion's `Loop Count` property. They are bumped **in the same edit**; if they disagree, the machine has two ceilings and enforces neither. Ceilings: manifest `design.loops` mirrors [workflow-state-machine §5](../Architecture/workflow-state-machine.md).

On the extraction run the counters stopped being written after the second round. That flow was recorded at `L_REVISION=2` and delivered three more — **five against a ceiling of three**. The inner loop ran ×4 on one flow and ×8 on another. **A ceiling nobody counts is not a ceiling.** Every entry carries `iteration` and `loop: L_REVISION (n/3)`; ceilings live in the manifest `design.loops`, mirrored to Notion `Loop Count`.

**One round = one prototype rebuild, however many sub-lettered asks it folds.** Bump the count in the S16 entry, the progress snapshot and the flow row in the same edit, or they drift (same rule as G7).

The ceiling resets **only** by explicit user authorization, recorded. One flow did this correctly: 3/3 consumed → `Blocked` with an escalation summary → the user authorized a fresh bounded window → reset to 1/3, written down.

### R8 — A conflict goes to the Mini-Gate, never into the bytes

Two classes reach this state:

1. **Two change requests contradicting each other.**
2. **A change request contradicting an already-ratified decision** — the class the extraction run actually hit three times: a control whose ownership had already been ruled onto a different screen (twice); a supplied mockup's navigation contradicting a logged user decision across six files; a spec asking for two colours the allowlist does not contain.

Neither class is a build decision. When the user is not at the gate: ship the **reversible** reading, open an `o-` item naming both sides and what each would cost, and put it to the gate. Never silently pick a side inside the prototype.

The same applies to canon conflicts between two *approved* deliverables: silently editing one to hide a disagreement with another is worse than the disagreement, and it moves frozen bytes without a ruling.

## B.5 Output — S16 `[Revision]` entry, one per iteration

```markdown
---
artifact: revision-log
version: rev-<brd-id>-NN
produced_by: revision
reads_versions:
  review-record: review-<brd-id>-NN
  design-audit: audit-<brd-id>-NN
iteration: <n>
loop: L_REVISION (<n>/3)          # L_AUDIT_FIX (<n>/3) if this is an audit-fix cycle
brd: <brd-id>
---

# Iteration <n> — <source: audit `fail` | user `request-changes`>, <date>

## Change set

| # | Change item | Raised by | Class + sweep | Root cause | Target state | Status |
|---|---|---|---|---|---|---|
| CR1 | *"<verbatim ask or finding>"* | user-review \| self-audit | <class — N instances across M files, or "single instance"> | <where the fault was introduced> | `UI_PLANNING` → `PROTOTYPE` | resolved \| deferred \| superseded |

_Every item carries a target state and a status (V1). Nothing exits `open` (V2)._

## Conflicts — Conflict Mini-Gate

| # | Conflict | Side A | Side B | Ships as | Gate outcome |
|---|---|---|---|---|---|
| o-x1 | <the contradiction, both sides stated> | <new ask> | <ratified decision + id> | <the reversible reading> | pending ruling \| ruled <date> |

## Dependency order (upstream → downstream)

1. `<STATE>` → <artifact vNN> (<items>)
2. `PROTOTYPE` → proto-<brd-id>-NN
3. `SELF_AUDIT` → audit-<brd-id>-NN
4. `USER_REVIEW` → `Approvals` loses `design` (stale-approval rule)

## Superseded by this revision

| Component / rule / string | Superseded by | Removed from |
|---|---|---|

## Constraints recorded

<discovered scope limits — untouchable assets, decisions that must not move.>

## Deliberately not changed

| Item | Why not |
|---|---|

_Recorded so silence is not mistaken for oversight (V2)._

## Impact analysis

| Section / artifact | Effect |
|---|---|
| S03 | unchanged |
| S08 | **ui-<brd-id>-NN** (supersedes -NN) |
| prototype | **proto-<brd-id>-NN** |
| S14 design-audit | **audit-<brd-id>-NN** |

## Re-validation

| Check | Result |
|---|---|
| Re-audit on the rebuilt bytes | `audit-<brd-id>-NN` PASS N / N — or **WAIVED**, rider: debt #<n> |
| Rendering-class assertions | N / N |
| Class sweeps from R2 | <class: N instances, all fixed> |

## Validation self-check

- **V1** ✅/❌ every item has a target state and a status
- **V2** ✅/❌ no item left `open`
- **V3** ✅/❌ iteration incremented; `L_REVISION <n>/3`, `L_AUDIT_FIX <n>/3` written
- **V4** ✅/❌ every item names its class and sweep result
- **V5** ✅/❌ superseded components removed; carried items re-verified against current bytes
- **V6** ✅/❌ conflicts recorded with both sides; none resolved in the bytes
- **V7** ✅/❌ return edge passes through `SELF_AUDIT`, or a waiver names its rider
```

## B.6 Validation rules

- **V1:** Every change item has a target state and a status.
- **V2:** No item left `open` — `resolved`, `superseded`, or explicitly `deferred` **with a reason**.
- **V3:** Iteration incremented; ceilings not exceeded **and the counters actually written**.
- **V4** *(per R2)*: Every item names its **defect class** and the sweep result. An item recorded as a single instance asserts the class was checked, not that it was not looked for.
- **V5** *(per R5)*: Replaced components are removed, not left as dead style/strings; every carried item was re-verified against current bytes before dispatch.
- **V6** *(per R8)*: Every conflict recorded with **both sides** and its Mini-Gate outcome. No conflict resolved inside the prototype.
- **V7** *(per R6)*: The return edge passes through `SELF_AUDIT` on the rebuilt bytes, or a waiver names its rider.

## B.7 Failure recovery

- **`L_REVISION` ceiling (3)** → `Blocked` with an **escalation summary** of unresolved items — never a 4th unbounded cycle.
- **`L_AUDIT_FIX` ceiling (3)** → escalate into `L_REVISION` accounting; it does not reset the outer loop.
- **Conflicting requests** → Conflict Mini-Gate before dispatch.
- **`request-changes` with nothing specified** → the loop cannot be entered on an empty change set. Halt, write the escalation summary, state the resume path: the concrete change list plus an explicit authorization that resets the window.
- **Missing input** (no audit, no gate record) → back-transition to the state that owed it. A revision with no source is not a revision.

## B.8 Recorded failure modes

| Case | What happened | Rule |
|---|---|---|
| **Class never swept** | Six selectors patched, class dropped; root cause resurfaced 24 days later at **138 instances across 7 flows**. | R2, V4 |
| **Root cause in the machine, not the artifact** | Invented colours passed a green audit because the audit checked DS presence, never non-DS absence. Two dispatches were needed. | R2, R3 |
| **Three cycles on a misrouted root cause** | Palette work dispatched downstream four times; the real fault was wrong-document adoption upstream. | R3 |
| **Over-application creating the next item** | A one-screen palette change remixed the brand mark; next item: "restore the mark". | R4 |
| **Items aged against a moving prototype** | Three of six reported selectors no longer existed when the item was actioned. | R5 |
| **The counter stopped being written** | Recorded at 2, delivered five, ceiling 3, breach never detected. | R7, V3 |
| **The return edge skipped** | Five of seven approved flows were past their audit of record; the re-run found three more real defects. | R6, V7 |
| **The log covered one flow of eleven** | 13 rounds lived in prose, so "no open items" was unevaluable until a closure entry backfilled it. | V1, V2 |

**What worked:** the `Blocked` escalation (3/3 consumed → summary → user-authorized fresh window, written down), and the **Deliberately not changed** table — four items each with the reason it was left. "No open items" is satisfiable by silence; that table is what makes it honest.

---

# PART C — STATE 11 · `FINAL_OUTPUT` (exits into Dev Planning)

## C.1 Contract

| Field | Value |
|---|---|
| Reads | approved prototype, gate record (`approve`), traceability, S14 design-audit, S16 `[Revision]` entries, S03/S07–S09 |
| Writes | frozen prototype commit + `design/deliverable/<brd-id>/handoff.md` ([design-handoff](../Templates/design-handoff.md)); terminal S16 entry; `Status` → `Dev Planning` |
| Depends on | `USER_REVIEW` = `approve` — no other entry. Plus the Developer Handoff Gate when `C_HANDOFF_REQUIRED` |
| Approval gate | **None additional** — gated by the already-granted Design Gate; re-approval only if content changed post-approval |
| Retry ceiling | 2 for faults *inside* packaging (an unwritten hash, a missing handoff). A completeness regression is **not** a retry — it is the declared REVISION edge |
| Next | `Dev Planning` / `REVISION` (completeness regression caught at the last gate) |

## C.2 Purpose

Produce the finalized, packaged design deliverable and close the design machine.

This is the last place a wrong claim can be caught, and the only place the machine may say it is finished. Every other state produces an artifact someone downstream will check; this one produces the **record that the checking is over**.

The run this method was extracted from reached this state **eleven times** and closed once. At that closure: two of four validation rules had been waived at the previous gate, the machine record sat two days stale while the machine reported itself shipping, one handoff did not exist, and the "no open change items" rule was unevaluable for ten of eleven flows. All four were caught at the final sweep. The method below is what would have caught them **at the gate they were made at**.

## C.3 Processing steps

1. **Verify** the Design Gate outcome is `approve` and current.
2. **Freeze** artifact versions; assemble the package.
3. **Generate** handoff documentation (decisions, traceability, known limitations).
4. **Run** the final completeness check against acceptance criteria.
5. **Emit** the terminal record and advance the lifecycle.

## C.4 Packaging method (hardened)

### P1 — The approval must be current **and** must name its bytes

An approval is scoped to the artifact versions it saw. That makes `reads_versions` in the gate record a load-bearing field of **this** state. A record that cannot name its bytes cannot be shipped from, and the fix is to go and get the naming, not to infer it.

Before freezing, classify any post-approval delta per **G4**: bug-fix-only → a one-line scope confirm with the byte-level evidence bar; feature delta → a ruling, gate `pending`, nothing to package yet.

One prototype rebuilt an entire screen as a new surface **after** its approval. It was a feature delta, and the deliverable still held the previous version — the deliverable and the prototype disagreed about what had shipped for a full day.

### P2 — A freeze is a hash, not a copy

Copying a folder records nothing. Every frozen file is listed with its **sha256** in the handoff and in S08, and those hashes are what the next gate, the next audit and the next revision compare against.

One deliverable per **approval gate**, named for what that gate approved. **A screen that is not in a frozen deliverable is not delivered.** One flow was built direct: its screens read `designed` in the Screen Contract and were never frozen into any deliverable. `designed` and `delivered` are different claims and the registry must not blur them.

### P3 — Completeness is checked against the traceability matrix, never from memory

Mechanical: every acceptance-criterion id in S03 appears in the traceability map with a status in `{met, waived, superseded}`. Anything else — **including absence** — is `unmet`.

One batch shipped 21 screens with condensed artifacts and **no traceability matrix at all**, so the rule was not failed — it was *unevaluable*, and a waiver was recorded instead. When the matrix was finally built it covered 26 requirements / 90 ACs: 83 met, 6 superseded, 1 met-with-advisory, **0 unmet**.

`superseded` is a legitimate status and it **names the ratified revision that superseded it**. An AC quietly dropped because a later round replaced its screen is indistinguishable from an AC that was never built, unless the supersession is written down.

### P4 — The audit of record must have run on the bytes being frozen

Not "an audit passed" — a `pass` **on the final prototype version**. Compare the sha the audit ran against with the sha being frozen. If they differ, this is not a packaging problem; it is a `SELF_AUDIT` problem, and R6's return edge exists precisely for it.

**Five of seven approved flows arrived at their gate past their audit of record** — one three rounds past, one four. Each had been verified by targeted assertions and screenshots, which is evidence *inside* the loop and is not the audit. The eventual re-run against the frozen bytes returned PASS 386/386 — and found **three more real defects** on the way, including one at 138 instances across 7 flows. **A green audit on superseded bytes is not a green audit.**

### P5 — "No open change items" needs a revision log that exists

A missing log does not read as "no open items" — it reads as **no evidence**, and it fails the rule. On the extraction run the log covered one flow of eleven; the other 13 revision rounds lived in status prose, not in the artifact this state reads.

### P6 — A waiver is a legitimate exit; silence is not

An acceptance criterion may be `waived` **with record**. The record is the whole of the permission. A waiver ships only when all three hold:

1. The **user grants it** — the machine cannot waive its own rules.
2. It is written into the deliverable's **Known limitations** *and* opened as a numbered debt item, with an id both sides can cite.
3. It states **what would close it**.

Two waivers granted this way at one gate were both closed the next day. **The waiver was never the problem. The silence would have been.**

### P7 — Close the machine record in the same edit as the freeze

A record written later is a reconstruction. `Status`, the terminal S16 entry, `Approvals`, the freeze hashes and an explicit completion check are written **in the same edit** that freezes the bytes.

The extraction run's state file sat **two days and two approval rounds stale** while seven flows had been approved and the machine reported itself shipping. Nothing detected it, because nothing was reading the file the completion rule is defined over.

Each completion rule gets a boolean **and a one-line reason**. `true` with no reason is the same silence P6 forbids.

### P8 — Known limitations ship inside the deliverable, at full strength

Every limitation the pipeline discovered goes into the handoff **in the terms it was discovered in** — not softened, not summarised into a reassurance. The receiving team will otherwise discover it in build, at a much higher price.

The extraction run shipped 20 parked open decisions, a provisional palette, a tap-target gap against its own acceptance criterion, and a design file whose 48 frames were **render-backed images, not component-decomposed vector designs**. The last one is the model: stated plainly, with why, rather than omitted because it reads badly.

## C.5 Output — `design/deliverable/<brd-id>/`

```
design/deliverable/<brd-id>/
├── prototype/     # the frozen bytes, hashed (or the frozen commit sha)
└── handoff.md     # V4 — see Templates/design-handoff.md
```

The handoff carries: what ships per screen (`SCR-id`) and its states · requirement source · key decisions · the pipeline artifact chain with versions · acceptance criteria with the audit run against the frozen bytes · **freeze hashes** · the **review packet** (`run-local.sh → play.html#<feature>` plus every deep-link hook, so the deliverable stays re-drivable after the loop closes) · waivers with riders · known limitations at full strength · the completion-rule table.

S07–S09 constitute the handoff spec for Dev Planning; the Screen Contract carries the per-screen mappings.

## C.6 Validation rules

- **V1:** Design Gate = `approve`, not superseded by a later change request.
- **V2:** 100% of design-relevant ACs `met` (or user-waived, recorded).
- **V3:** All artifacts version-frozen and referenced.
- **V4:** Handoff doc present.
- **V5** *(per P1+P2)*: Every frozen file listed with its **sha256**, and that hash is the version the approval names.
- **V6** *(per P4)*: The audit of record ran on **the bytes being frozen**, or a waiver names its rider debt.
- **V7** *(per P5+P7)*: Every completion rule checked **explicitly and individually**, each with a boolean and a one-line reason. No rule asserted by silence; "no open items" is **failed, not passed**, when the revision record does not exist.
- **V8** *(per P6+P8)*: Every waived rule and every known limitation carries an **id**, a **rider debt item**, and **what would close it**.

## C.7 Completion rules (design machine)

| # | Rule | Evidence |
|---|---|---|
| 1 | Design machine closed in the same edit as the freeze | terminal S16 entry + `Status` |
| 2 | Approval scoped to the final frozen versions | gate record `reads_versions` + freeze sha |
| 3 | Every design-relevant AC `met` / `waived` / `superseded` — **0 unmet** | traceability matrix |
| 4 | Audit `pass` on the final version | S14 design-audit run on the frozen sha |
| 5 | Deliverable + handoff + traceability + decision log exist | `design/deliverable/<brd-id>/` |
| 6 | No `open` change items in the latest `[Revision]` entry | S16 |
| 7 | When `C_HANDOFF_REQUIRED`: Developer Handoff Gate granted, navigation report clean or waived with riders | S14 handoff-gate record |

## C.8 Failure recovery

- **V2 fails at the last moment** → do **not** ship. Route to REVISION with the **specific unmet criteria**, never a general "completeness failed".
- **Approval is stale** (bytes moved after approval) → gate reverts to `pending`. That is a `USER_REVIEW` return, not a freeze — classify the delta first (G4) so the return asks for the right thing.
- **Audit of record predates the frozen bytes** → back to `SELF_AUDIT` on the frozen bytes, or ship on an explicit user-granted waiver with a rider.
- **Missing input** (no traceability, no revision record, no handoff) → back-transition to the state that owed it. A completeness check run over a missing artifact is not a pass.
- **Packaging fault** (unwritten hash, unwritten handoff) → retry inside this state, ceiling 2, then `Blocked` with a diagnostic.

## C.9 Recorded failure modes

| Case | What happened | Rule |
|---|---|---|
| **The deliverable and the prototype disagreed** | A screen rebuilt as a new surface after approval; the deliverable still held the previous version. | P1, V1 |
| **The gate record dropped the field this state reads** | One record omitted `reads_versions` — the exact field completeness rule 2 is checked against. | P1, V5 |
| **`designed` mistaken for `delivered`** | A flow built direct read `designed` in the registry and was never frozen into any deliverable. | P2 |
| **External references age too** | Handoffs cited design-file pages that had stopped matching the prototype — one four revision rounds out of sync. A frozen deliverable does not freeze the things it links to. | P2, P8 |
| **Stale machine record while shipping** | The record read `USER_REVIEW / pending` for two days and two approval rounds after seven flows were approved. | P7, V7 |
| **A rule unevaluable, not failed** | No traceability matrix, so completeness could not be checked at all; a waiver was recorded instead. Backfill later found 0 unmet. | P3, V2 |
| **A green audit on superseded bytes** | Five of seven flows past their audit of record at approval; the re-run found three more real defects. | P4, V6 |
| **A handoff that did not exist at close** | V4's entire subject was written during the final sweep, after the flow was recorded as delivered. | P7, V4 |

**What worked:** the two waivers with numbered riders, both closed next day · the last handoff written — freeze hashes, a review packet listing every deep-link hook, and a Known-limitations table carrying a real canon conflict between two approved deliverables, **deliberately unpatched** rather than silently reconciled · the final audit re-run on the frozen bytes of every flow, stable over two consecutive runs, every check rendering-class.

---

## Stage exit

- [ ] **09:** V1–V6 — Run Local used, player URL recorded, hook table shipped, limitations presented at full strength, freeze hashes + `reads_versions` written, waivers carry riders, pass count honest
- [ ] **10 (if entered):** V1–V7 — every item classed and swept, routed to where the fault was introduced, bounded scope dispatched, counters written, conflicts at the Mini-Gate, return through `SELF_AUDIT`
- [ ] **12 (if `C_HANDOFF_REQUIRED`):** Developer Handoff Gate granted ([flow-visualization](flow-visualization.md))
- [ ] **11:** V1–V8 + the seven completion rules, each with a boolean and a one-line reason
- [ ] `Approvals` carries `design`, current against the frozen bytes; `C_CONTRACT` passes → `Dev Planning`

Gate: **Design Gate** (user) → [development-ready](../Checklists/development-ready.md) at the next stage.
