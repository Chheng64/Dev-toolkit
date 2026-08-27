# Workflow — Flow Visualization (design state 12 · navigation mapping)

> **Module:** Workflows
> **Stage:** conditional — runs on the `Design Review → Dev Planning` edge, **only when `C_HANDOFF_REQUIRED`** ([design-state-machine](../Architecture/design-state-machine.md) §6). Skipped by default; the skip is logged in S16.
> **Skill:** UI Designer (owns the design file) with Frontend Engineer review on routes + deep links
> **Machine:** [design-state-machine.md](../Architecture/design-state-machine.md) state 12 `FLOW_VISUALIZATION`
> **Cloned from:** vendored [`12-flow-visualization`](../design-toolkit/skills/12-flow-visualization/SKILL.md) @ `4081c24`. Method text is the skill's text; only artifact locations are remapped. Re-clone on vendor upgrade.

**This file is the procedure, not a pointer to one.**

---

## 0. Execution contract

| Field | Value |
|---|---|
| Reads | S07 flow graphs, **Screen Contract** (`screens/registry.md`), the lane/vocabulary/annotation files under `design/navmap/<brd-id>/`, `design/prototype/<brd-id>/` (hook scan), traceability, the Figma file when bound |
| Writes | `design/navmap/<brd-id>/` (`screen-registry.csv` export, `navgraph.json`, `navmap-report.md`, `flow-visualization.md`), S07 navigation subsection, S14 gate record, and the Figma Sections / cross-feature map / overview page |
| Depends on | `FLOW_GENERATION` (graphs exist) **and** the Design Gate = `approve` for every flow being mapped |
| Approval gate | **Developer Handoff Gate** — blocks the exit into `Dev Planning` |
| Retry ceiling | 3, then back-transition to `FLOW_GENERATION` |
| Next | `FINAL_OUTPUT` / `FLOW_GENERATION` (a registry route no flow graph ratified) / `REVISION` (registry and prototype disagree about a route) / self-loop (sync or connector fix) |

**Artifact remap.** The vendored skill reads `reference/screen-registry.csv`. Here the registry of record is the **[Screen Contract](../Architecture/screen-contract.md)**; step 0 below **exports** it to `design/navmap/<brd-id>/screen-registry.csv` — a generated file, regenerated every run, never hand-authored. Reference inputs (`nav-lanes.json`, `state-vocabulary.md`, `state-machines.json`, `edge-annotations.json`) are seeded from [vendored templates](../design-toolkit/templates/) into the same directory. Tool paths come from the generated `toolkit.config.json` ([ui-workflow §0.3](ui-workflow.md)).

## Purpose

Generate the navigation visualization so the design is **ready for development**, not merely visually complete.

## Why this is not state 05

`FLOW_GENERATION` and this state both hold graphs, and they are not the same object.

| | State 05 · `FLOW_GENERATION` | State 12 · `FLOW_VISUALIZATION` |
|---|---|---|
| Node | a *state the user is in* | a *frame in the design file* |
| Question | is this flow correct? | can a developer build from this file without asking? |
| Screens | deliberately screen-free | screen-only — a node with no frame is a finding |
| Truth | ratified by review of the prototype | derived from the registry, checked by exit code |
| When | before any screen is named | after the Design Gate, before the freeze |

State 05 rules what the flow *is*. **State 12 proves the design file says so, to somebody who was not in the room.** A flow graph can be perfect and still hand off badly: the extraction run shipped eight per-flow map pages and still could not answer *"which screens does the home screen reach, and which reach it"* without a person reading eleven documents.

## Processing steps

0. **Export** the Screen Contract to `design/navmap/<brd-id>/screen-registry.csv` (`screen_id, flow, screen_name, purpose, data_content, key_components, states, entry_from, navigates_to, status, notes`). Missing route fields are **reported** by the derivation, never guessed — see [screen-contract §3](../Architecture/screen-contract.md) navigation fields.
1. **Derive** the navigation graph from the export — `navgraph.mjs`.
2. **Reconcile** the derived graph against S07. Registry routes with no ratified edge, and ratified edges with no registry route, are **findings, not merge candidates**.
3. **Lay out** one Section per journey, screens left → right on an 8pt grid, branches vertical, merges reconnecting cleanly.
4. **Draw** connectors, styled by class, each carrying its trigger / action / condition label.
5. **Place** decision nodes at every branch, with mutually exhaustive labels carried over from the flow graph's guards.
6. **Stamp** screen metadata on every frame (W6).
7. **Generate** the extensions E1–E7.
8. **Validate**, then present the **report — not the picture** — at the gate.

---

## 1. Method (hardened)

### W1 — Derive the graph; never draw it

Every connector traces to a cell in the registry export. The derivation is a tool with an exit code, so "the map matches the registry" is a check rather than a claim:

```bash
node design-toolkit/tools/navgraph.mjs --root <project> --fail-on major
# → design/navmap/<brd-id>/navgraph.json   (nodes, edges, heat, states, deep links, findings)
# → design/navmap/<brd-id>/navmap-report.md
```

Findings, severities and their fixes: [validation-engine §5](../Architecture/validation-engine.md). **Run order matters** — `navgraph` → `stategraph` → `stateprobe` → `annotate`, because `annotate` reads `navgraph.json` (§11 there carries the full suite and the gate-check script).

A connector drawn by hand is an assertion nobody can re-check. **If a route belongs in the map and not in the registry, the fix is to fix the registry** — that is the Screen Contract, and fixing it there is what keeps design and development reading the same thing.

### W2 — One Section per journey, never per feature

```
FLOW-001 • New User Onboarding
FLOW-002 • Existing User Login
FLOW-003 • Password Reset
```

Format `FLOW-XXX • Journey Name`. Journeys do not share a Section, because the reason to open a Section is to follow one path end to end. A Section named after a *feature* silently becomes a bucket, and a bucket answers no question.

### W3 — Layout is a contract, not taste

- Screens ordered left → right in traversal order.
- 240–320 px between frames, uniform within a Section.
- Everything on the 8pt grid.
- Branches descend vertically from their decision node; merge points reconnect to the main line rather than crossing it.

A reviewer scanning right is reading the happy path. That only holds if the ordering is enforced, so it is **checked (V4), not assumed**.

### W4 — Arrow style carries meaning, and the legend ships in the file

| Class | Style | Means |
|---|---|---|
| Primary navigation | solid 2 px, arrow head | the ratified happy route |
| Alternative path | dashed | a ruled non-default branch |
| Error / failure | red dashed | a route taken only on failure |
| Modal / sheet | curved | overlay, not a view push |
| External link | dotted | leaves the app |

Without a **Flow Legend** frame in the same file, four line styles are decoration. The legend is part of the output, not documentation about it.

### W5 — In a Design file, a connector is a vector and it does not reflow

Figma's re-routing connector object is **FigJam**. In a Design file the arrows are vectors: move a frame and the arrow stays where it was, still looking correct. **This is the single most dangerous property of the artifact**, because a stale arrow is indistinguishable from a fresh one.

1. Connectors are **regenerated wholesale** from `navgraph.json` on every sync. Never hand-patched — a hand patch is a fact that exists in exactly one place.
2. When a journey is large or volatile enough that regeneration is expensive, the auto-routing copy belongs in **FigJam**, and the Design file carries the frames. `navgraph.json` stays the authority for both.

`use_figma` writes require the `figma-use` skill loaded first — mandatory, every call — and go to the **bound file key only** ([integration-map](../Architecture/integration-map.md)).

### W6 — Every frame carries its own metadata

Seven fields, on the frame, in the file:

```
Screen ID · Screen Name · Route · Feature · Flow · Version · Status
```

`Version` is the prototype version the frame was rendered from (`proto-<brd-id>-NN`); `Status` is the Screen Contract status. **A frame that cannot say which bytes it depicts cannot be checked against them** — which is exactly how one design page drifted four revision rounds behind its prototype and nothing detected it.

### W7 — Sync is triggered by a hash, not by memory

Whenever a screen is renamed, moved, deleted, added, or re-routed, the map is out of date. The trigger is mechanical: `navgraph.json` records the registry it was derived from, and a re-derivation whose edge set differs from the committed one **is** the sync signal. On that signal:

1. Regenerate connectors (W5).
2. Re-lay the Section (W3).
3. Refresh decision nodes and flow labels.
4. Re-run E2/E3 — a new edge changes the cross-feature map and the heatmap.
5. Record the change in S07 and in the state's record.

**"We updated the Figma" is not a sync record. A diff of the edge set is.**

### W8 — A boundary is a dated claim

State 05's `⟂` boundary node is correct **when written** and silently wrong the moment the owning flow ships. The extraction run carried **eleven live boundary call sites** routing to a placeholder long after every destination flow existed.

Here the equivalent is a cross-feature port drawn as external when the target is now a real frame in the same file. So: every boundary port is re-derived at each sync, and the boundary table records the **date** its status was last checked. **A status with no date is not a status.**

### W9 — Render-backed frames are fine here; state variants are not optional

Render-backed images rather than component-decomposed vector designs are acceptable for navigation mapping — connectors attach to the frame, and the frame is the node.

What is *not* optional is that **every state a screen can be in exists as its own frame**. E5 attaches a state machine to a screen; if `loading` and `error` live only inside the prototype, the state diagram has nothing to point at, and the developer reads the map as "this screen has one state". The extraction run built 93 frames for 48 screens precisely because of this.

### W10 — The gate passes on the report, not on the picture

A screenshot of a flow map is persuasive and proves nothing. What is presented at the Developer Handoff Gate is `navmap-report.md` plus the tool's exit code, with every finding either cleared or carrying a named waiver and a rider debt item. **A picture that looks right over a report that says `2 blocking` is the exact failure this state exists to prevent.**

---

## 2. Extensions E1–E7

Not optional garnish; each answers a question the base map cannot, and each is **derived** by the same tool that derives the edges. An extension maintained by hand goes stale — so where the data does not exist, **the extension reports its absence instead of inventing it.**

### E1 — Swimlane layout (customer / admin / system / api)

Within a Section, frames are banded into horizontal lanes by the actor that drives the transition. Lane order is fixed top → bottom so lanes read the same across every Section.

**Derivation.** The registry has no actor column, so lanes come from `nav-lanes.json`. Unassigned screens are **reported (`N8`), never guessed into a lane** — a wrong lane reads as a ruling about who owns a screen.

**A single-actor product is the honest degenerate case**: every screen in `customer`, with `admin`, `system` and `api` declared and empty. That is *why* system/API attribution is carried at the **edge** level by E6's annotation columns rather than by node lanes — an auto-advance splash and a payment webhook are properties of the *transition*, not of the screen.

### E2 — Cross-feature flow mapping

The base map shows a journey. This shows the **seams** — every edge whose source and target live in different features.

**Expect roughly half the edge set to cross a feature boundary** — it was 46 of 100 on the extraction run. That is precisely the half no single flow document owns. Output: a dedicated **`🗺 Cross-Feature Map`** page (features as nodes, edge weight = screen-level routes), and a **boundary port** on each Section for every inbound and outbound cross-flow edge, naming the owning flow and the date its status was checked (W8).

This is the machine version of state 05's `⟂` node, and it is what would have caught the stale-boundary class: a port whose target is now a real frame in the same file cannot keep rendering as external, because the derivation says otherwise.

### E3 — Navigation heatmap

**Derivation.** In-degree per screen, plus the count of *distinct source features* — a screen reached six times from one feature is a busy screen; **a screen reached from six features is a hub, and hubs are where regressions land.**

Rendered as a three-step fill ramp on the frame chrome, **with the raw numbers printed** — a colour with no number is a vibe. The handoff consumes the top rows directly: hub screens get the caching, the back-stack rules and the regression budget. On the extraction run the top screen carried **11 inbound routes from 8 features** — that is the screen whose back behaviour must be specified before build starts, not during it.

**Heat is measured, never assigned.** A designer's sense of which screen is important is exactly the input this extension exists to replace.

### E4 — Deep-link visualization

Each frame carries the URL that drives it, so QA and developers reach the state directly instead of walking the flow.

**Derivation.** The tool scans the prototype pages for the query hooks each page actually reads — **hooks are read out of the implementation, not out of a doc that claims them.**

On the extraction run **8 of 11 flow pages exposed hooks; three exposed none at all** (`N9`, major ×3) — a reviewer could not *open* an error screen, only navigate to it. Worth stating precisely: the tracked debt item recorded "no deep-link hook" for **one** flow; the mechanical scan found the same defect in **three**. A finding scoped to one flow was read as scoped to one flow, and it was not.

### E5 — State-transition diagrams

Per screen: `Empty → Loading → Success → Error`, drawn as a compact state machine attached under the frame, with the trigger on each edge. **Derivation:** the registry's `states` column, one machine per screen.

**Expect the vocabulary to be the blocker, not the diagram.** The extraction run's registry carried **59 distinct free-text state labels across 48 screens, 49 of them outside any canonical set** — including *three* spellings of "empty for a new user". Each was locally sensible. The set was not a state machine, and no tool could tell whether two labels meant one concept or two. So the rule is ordering, not effort:

1. Normalize to a **closed vocabulary**, with the specific case as a **qualifier**, not a new label: `canon` or `canon{qualifier}` — `error{invalid-number}`, `empty{new-user}`.
2. **Then** generate. Generating first freezes 59 private vocabularies into a deliverable.

The vocabulary, the qualifier rule and the full original → normalized mapping live in `design/navmap/<brd-id>/state-vocabulary.md` (seed from the [vendored template](../design-toolkit/templates/state-vocabulary.md)). `navgraph.mjs` enforces the term set and the syntax; `stategraph.mjs` enforces the term set again over the authored edge set. Both import one constant — **one definition, two enforcers**. Adding a term is an edit to that constant plus a justification in the vocabulary file. On the extraction run 58 qualified labels resolved to 12 canon terms with **0 findings**, and the originals were preserved in the mapping table, so the rewrite lost nothing.

Two rules the normalization produced:

- **The qualifier is kept, never dropped.** `error{wrong-otp}` and `error{unchecked-terms}` are different screens' different recoveries.
- **Adding a canon term costs a justification.** A term only one screen would ever use is a qualifier, not a canon term.

What building the layer added:

- **The node set is derived; the edge set is authored *with evidence*.** The registry owns which states exist (`stategraph.mjs` fails the run if a machine adds or drops one). Transitions cannot be derived — they live in the prototype's control flow — so each carries `evidence` as `file:line` and a `kind` (`user` · `system` · `entry` · `data`), and the tool checks the cited line exists in the frozen bytes. **An unevidenced arrow looks like a spec and is a guess.**
- **Proving a hook is *read* is not proving the state is *shown*.** `stategraph` greps for the query parameter; `stateprobe.mjs` then drives every hook URL headlessly and asserts the active view is **computed-visible with ink on it**. The first probe run reported 37 failures and **every one was the harness** — corrected, not waived.
- **Three node flags carry what a plain diagram would hide.** `entry-only` (real, but only ever built on arrival), `terminal` (no outbound change by design), and **`NOT IMPLEMENTED`**, drawn dashed: the registry declares the state and the frozen bytes never render it. Seven of 118 states were dashed on the extraction run. Dropping them would have made the deliverable agree with itself by deleting the disagreement.
- **The probe measures id drift instead of asserting it.** Reading the prototype's own screen-id readout at every hook produced 11 observations where the registry id and the printed id differ. Recorded in `id_conflicts`, **not reconciled** — renumbering is a registry decision.

Validation codes: `S0` machine per registry screen · `S1` node set == registry and vocabulary-legal · `S2` initial declared and real · `S3` endpoints + trigger kinds · `S4` evidence resolves · `S5` hook actually read · `S6` reachable or `entry_only` · `S7` outbound or `terminal` · `S8` id drift · `S9` declared-but-unbuilt with the absence evidenced.

### E6 — Developer annotations

Four fields per connector, two per frame. **This is the layer that turns a diagram into a spec.**

| Field | On | Values | Source |
|---|---|---|---|
| `nav` | edge | `push` · `replace` · `modal` · `sheet` · `tab` · `back` · `deep-link` | S07 transitions |
| `anim` | edge | the named motion preset, or `none` | S08 motion spec |
| `api` | edge | the call this transition triggers, or `none` (simulated) | S11 / data contract |
| `guard` | edge | the flow graph's guard expression | S07 |
| `auth` | frame | `guest-ok` · `auth-required` · `premium` | registry states + flows |
| `perm` | frame | OS permission the screen needs, or `none` | S07 a11y/permissions |

Two rules make this survivable:

- **`UNKNOWN` is a legal value and a guessed value is not.** An `api` field filled with a plausible endpoint is worse than an empty one, because the developer will build it. Every `UNKNOWN` is counted in the report.
- **Annotations cite, they do not restate.** The field carries the value *and* the artifact it came from. On the extraction run every `api` value read `none (simulated)` — and saying so was the single most useful thing this layer did for the receiving team.

What building it added:

- **Split the fields by who owns the answer.** `api` and `anim` are **derived** — a re-run sweep, and the CSS the page declares. `nav` and `guard` are **authored with evidence** (`file:line` of the call site, resolved against the frozen bytes). A citation landing past the end of a file, or on a line that has gone blank, is a finding — that is what makes the annotation survive the next revision instead of quietly aging.
- **Re-run the sweep; never trust the recorded claim.** The `api` column is only worth reading because the tool greps for `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` / `EventSource` itself on every run and fails (`E11`) if the column disagrees. **The most valuable column was the one where every value is identical — and only because it is measured each time.**
- **`nav` is the field that finds the missing routes.** Assigning a kind forces the question *which control does this?*, which the derivation never asks. That surfaced **four registry routes with no call site at all** and one new class: **`hook_only`** — a route that exists as a URL hook with no in-screen control behind it. Navigable by QA, unreachable by a user. "Navigable" and "implemented" are different claims.
- **State the value the bytes carry, not the value the plan asked for.** The plan specified a 280 ms view push; the build shipped 260 ms, and four files shipped none at all. Annotating the plan's number produces a document wrong in exactly the way a developer cannot detect.
- **Hash the drawing against the spec.** After the page is drawn, read its rows back out of the design file and hash them against `annotations.json` — identical signature, or the page and the artifact disagree.

Validation codes: `E0`/`E1` missing / blank · `E2` uncited · `E3` outside the closed set · `E4` citation does not resolve · `E5`/`E6`/`E7` duplicate / uncovered / orphan edge · `E8` `nav` = `UNKNOWN` · `E9`/`E10` frame coverage · `E11` `api` claim vs sweep · `E12` `anim` naming an undeclared animation · `E13` `hook_only`.

### E7 — Auto-generated flow overview page (for PM and QA)

```
🗺 Flow Overview
├── Counts        <n> screens · <n> edges · <n> flows · <n> cross-feature
├── Coverage      every registry screen → its Section + frame link
├── Heatmap       the E3 table, sorted
├── QA paths      every canon entry path, each with its deep-link URL
├── Findings      navmap-report.md's table, verbatim, with waivers
├── Legend        the W4 arrow classes + the E1 lane order
└── Provenance    registry sha · navgraph run · prototype versions · date
```

The **Provenance** block is what makes the page checkable a month later, and it is the block that gets dropped first. **It ships or the page does not.**

---

## 3. Output

### `design/navmap/<brd-id>/navgraph.json` + `navmap-report.md`

Machine-derived, regenerated, never hand-edited. `navgraph.json` is the authority every other output here is generated from.

### `design/navmap/<brd-id>/flow-visualization.md` — the state's record (mirrored into S07)

```markdown
---
artifact: flow-visualization
version: navmap-<brd-id>-NN
produced_by: flow-visualization
reads_versions: { screen-registry: <sha>, S07: <rev>, prototype: proto-<brd-id>-NN }
scope: <the flows this map covers — stated as scope, never a bare "handoff ready">
figma: { file: <key>, pages: [<name · node-id>] }   # or n/a (no binding)
gate: { developer_handoff: granted|pending|waived, date: <date> }
---

# Navigation Map — <scope>

## Sections built
| Section | Journey | Screens | Edges | Figma node |

## Findings at gate
| Severity | Code | Subject | Status (cleared / waived + rider debt) |

## Boundary status (W8)
| Port | Owning flow | Status | Checked on |

## Sync record (W7)
| Date | Trigger | Edge-set delta | Actions taken |

## Extensions
| Ext | Status | Evidence |
| E1 swimlanes | <n>/<n> screens laned | nav-lanes.json |
| E3 heatmap | derived | navgraph.json.heat |
| E4 deep links | <n>/<n> flows addressable | navgraph.json.deepLinks |
```

### In Figma (when bound)

Per journey: a `FLOW-XXX • Journey Name` Section holding frames, connectors, decision nodes, branch labels, entry/exit markers, lane bands, per-frame metadata + annotation blocks. Plus, once per file: the `🗺 Cross-Feature Map` page, the `🗺 Flow Overview` page, and the Flow Legend.

**No binding → loud degradation, not a silent skip:** derivation, report, state diagrams and overview still ship as markdown under `design/navmap/<brd-id>/`, and the gate record states `figma: n/a (no binding)`. The Screen Contract's Figma-Optional Rule applies unchanged.

## 4. Validation rules

- **V1:** Every Screen Contract entry owned by this BRD has a frame in a Section.
- **V2:** Every navigation path in `navgraph.json` exists as a connector.
- **V3:** No orphan screens — `0` `N2-orphan`.
- **V4:** No broken connectors: every connector's endpoints are frames that still exist, at the coordinates the connector was generated against (W5).
- **V5:** All branches terminate — every decision node's branch set exhaustive, every branch reaching a frame or a justified terminal.
- **V6:** Entry and exit screens identified; every Section has ≥1 marked entry.
- **V7:** Section names follow `FLOW-XXX • Journey Name`.
- **V8:** Connector directions match `navgraph.json` edge direction.
- **V9** *(E1)*: Every screen has a lane, or the unlaned set is named in the report — `N8` cleared or waived, **never absent**.
- **V10** *(E4)*: Every flow's deep-link addressability is reported; a flow with no hooks is a **major finding carrying a rider debt item**, not an omission.
- **V11** *(E5)*: State labels drawn from the closed vocabulary, case detail as qualifiers; `N11` cleared or waived with the count stated.
- **V12** *(E6)*: No annotation field blank. `UNKNOWN` is legal and counted; blank is a failure.
- **V13** *(W7)*: The committed `navgraph.json` **re-derives byte-identically** from the current registry. A drifted derivation means the map is stale, whatever the picture looks like.

## 5. Exit conditions

`navgraph.mjs --fail-on major` exits **0**, or every remaining finding carries a granted waiver with a rider debt item and a closing condition. V1–V13 pass. Developer Handoff Gate `granted`.

## 6. Failure recovery

- **V2 / V3 — a registry route no flow graph ratified** → back-transition to `FLOW_GENERATION` ([ux-workflow](ux-workflow.md)). **Do not draw the edge here; drawing it ratifies it, and this state has no authority to rule a branch.**
- **Registry and prototype disagree about a route** → `REVISION` ([design-review](design-review.md)). Exactly one of the two is wrong and this state cannot tell which; routing it to the state that owns the fault is R2.
- **V4 — connectors detached after frames moved** → self-loop: regenerate from `navgraph.json`. **Never nudge an arrow back into place.**
- **V13 — derivation drifted** → re-run, re-lay the affected Sections, record the edge-set delta in the sync table. **A sync with no recorded delta did not happen.**
- **Retry ceiling 3.** A persistent unreachable screen means the registry and the ratified flows disagree at the root → `FLOW_GENERATION`.

## 7. Approval gate — Developer Handoff Gate

Cannot pass until: navigation visualization complete (V1, V2, V6, V7) · Screen Contract synchronized (V13) · connectors validated (V4, V8) · Sections organized (V3, V5) · no broken navigation (tool exit 0 at `--fail-on major`, or waivers) · flow diagrams up to date (W7 sync record present **and dated**).

Grantor: the **user**. On deny: the denial names the failing rule, and the state self-loops or back-transitions per §6. The gate record goes into S14 and its frontmatter names the **versions it saw** — registry sha, the `navgraph.json` run, and the prototype versions the frames were rendered from. **A gate that cannot name its bytes is the defect one real gate record shipped.**

Status on pass: **READY FOR DEVELOPMENT**, scoped to the flows named in `scope` — scoped inside the claim, never as a bare "handoff ready".

## 8. What a first derivation finds

The first run is not tool noise. On the extraction run it opened at **2 blocking · 8 major · 52 advisory**, and *every finding was a real defect in the registry*.

| Code | What it means | Why it happens |
|---|---|---|
| `N2b-inbound-only-declared` | A screen reachable in the product and undrawable from the registry — the only evidence of the route lives on the receiving screen. | `entry_from` filled in, `navigates_to` not. |
| `N3-asymmetric` | A forward edge is missing. | Verify against the flow graphs **and** the prototype before touching the cell. |
| `N3b-backedge` | `entry_from` names a screen that no longer routes here, or omits one that now does. | It is written when a screen is designed and never updated when a *later* flow starts routing to it. Advisory — and worth fixing, because `entry_from` is what a developer reads to answer "who can send me here". |
| `N10-unparsed` | A registry cell carries prose where an id belongs. | Hand-editing. |
| `N11-state-vocab` | State labels outside the closed set. | See E5 — normalize before you generate. |

Two numbers worth carrying:

- Repairing **three cells** added **six edges** and **five cross-feature routes**. **A navigation model can be 6% wrong and look complete.**
- The most instructive single finding was a boundary **promoted to a real handoff in the code and never written back to the registry** — caught by derivation, invisible to reading.

Before E6 ran, **43 of 106 edges carried a label** and the other 63 were unlabelled routes. Assigning the E6 values closed that gap *and* found four more routes with no call site, plus one addressable only by URL.

## 9. Recorded failure modes

| Class | What happened | Rule |
|---|---|---|
| **The picture outlived the truth** | One flow's design page went out of sync at revision 5 and stayed wrong through revision 8 — four rebuilds missing — while the page still looked complete. | W6, W7, V13 |
| **A boundary that stopped being a boundary** | Eleven live call sites still routed to the placeholder after every destination flow had shipped. | W8, E2 |
| **A route with no edge behind it** | The registry claimed an edge the code does not implement — the destination re-implements the control inline. The E6 pass found three more of the same class, invisible to the derivation, because deriving a route never asks whether a control exists behind it. | V2, `E8` |
| **Navigable read as implemented** | One route is real and reachable — **by URL**. The control the registry names it after is non-interactive. A QA hook proves a state can be *shown*, never that a user can *get there*. | `E13` `hook_only` |
| **A destination that differs from the one named** | A route carried no query string, so it landed on a feature home screen rather than the checkout step the registry names. The edge exists; only the endpoint is wrong — the hardest version to see. | `nav` evidence, M6 |
| **A gap recorded at the wrong scope** | A debt item recorded "no deep-link hook" for one flow; the scan found it in two more. The finding was true and its scope was not. | E4 |
| **A vocabulary that cannot compose** | 59 state labels across 48 screens, three spellings of "empty for a new user". Normalized into 12 canon terms + qualifiers, originals preserved. | E5, V11 |
| **Frames that depict unnamed bytes** | Frames carrying no prototype version cannot be checked against the prototype, so drift is undetectable rather than merely undetected. | W6 |
| **Green picture, red report** | This state's whole risk: a map that renders beautifully over a derivation reporting broken routes. **The gate reads the report.** | W10, V13 |

---

## Stage exit

Gate: [flow-visualization checklist](../Checklists/flow-visualization.md) → **Developer Handoff Gate** → [design-review](design-review.md) Part C (`FINAL_OUTPUT`) → `Dev Planning`.
