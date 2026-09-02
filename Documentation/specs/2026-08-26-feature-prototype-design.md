# Design — the feature prototype

> **Status:** approved design, not yet implemented
> **Date:** 2026-08-26
> **Scope:** design sub-machine states 07 · 08 · 09 · 12, adapter layer only
> **Spec location note:** the brainstorming default is `docs/superpowers/specs/`. This repo
> already roots its prose at `Documentation/`, and a second docs root in a toolkit this
> opinionated about structure is a defect, not a convenience. Filed here instead.

## 1. Problem

The stated complaint was "design-toolkit focuses on too many `.screen` elements; I want one
feature prototype whose click covers flows, scenarios, states and variants."

Investigation put the cause somewhere else. Screens are not over-weighted — they are the
traceability key, and they earn it. The defect is that **the same hook set is hand-written in
three unlinked places**:

| # | File | Authored at | Holds |
|---|---|---|---|
| 1 | `traceability.md` | state 07 | `Prototype element / hook` column |
| 2 | `reference/audit-plan.json` | state 08 | `screens[]` + `states[]` — the same URLs |
| 3 | `play.html` `FEATURES[]` | state 09 | one row per page — the same pages |

The vendored `examples/signin/` demonstrates the drift risk directly: the string
`signin.html?view=signin&state=locked` exists in both `audit-plan.json` and
`traceability-signin.md`, hand-copied, with no checker between them.

Two consequences follow:

- **Review is manual.** Reaching a scenario, error state or variant means reading the
  traceability table, copying a hook, and pasting it into the URL bar. That is the clicking
  cost.
- **Coverage is unverifiable.** Nothing proves the audit drove every hook the prototype
  ships, because the two lists are independent documents.

## 2. Decisions taken

Three decisions were settled during brainstorming and constrain everything below.

**D1 — Feature is the review unit; the screen stays the key.**
`sid` remains `S-XXX-nn`. `Architecture/screen-contract.md`, the `C_CONTRACT` guard, the
Figma/frontend/API/QA mapping blocks and the dev handoff are untouched. Feature is what you
browse and report on, not what anything is keyed by.

**D2 — Adapter override only.**
`design-toolkit/**` stays byte-identical, with the single exception of `VENDORED.md`, which
is adapter-authored rather than vendored (it links to `../Architecture/*`, paths upstream
cannot know). No `.mjs` tool is edited. Every behaviour change is expressed through generated
input files and CLI flags the tools already accept.

**D3 — Feature is a shell concept, not a file concept.**
Prototype pages stay one self-contained file per flow. Rule B1's record is explicit: whole-file
writes crashed and lost work, and a flow file already runs 1,300–2,000 lines. A merged feature
page would be the sum of its flows — 4,000+ lines — and would reintroduce exactly that failure.

## 3. The featuremap

One generated file replaces the three hand-written lists.

**Path:** `design/prototype/<brd-id>/featuremap.json` — **inside the prototype directory,
deliberately.** Every Chrome-driving tool serves `toolkit.config.json` `paths.prototype` as the
web root (`serve(PROTO, PORT)` in `audit.mjs`, `smoke.mjs`, `stateprobe.mjs`), so a sibling
`design/featuremap/` directory is outside the served root and the player's `fetch` would 404.
It is registered in `toolkit.config.json` `review.harnessFiles` alongside `play.html`,
`run-local.sh` and `serve.py`, so state 08's palette sweep and state 12's network sweep exclude
it the same way they exclude the rest of the review chrome.
**Written by:** state 07 (prototype), as data, in the same edit that creates the pages.
**Read by:** state 08 (audit-plan generation), state 09 (review player), state 12 (hook scan).
**Never hand-authored.** Regenerated on every prototype change, like the `screen-registry.csv`
export in `Workflows/flow-visualization.md` §0 and the `toolkit.config.json` bridge in
`Workflows/ui-workflow.md` §0.3.

### 3.1 Schema

```json
{
  "brd": "BRD-004",
  "generated_by": "prototype",
  "reads_versions": {
    "ui-plan-checkout.md": "ui-checkout-02",
    "flows-checkout.md": "flows-checkout-01"
  },
  "axes": [
    { "id": "base", "label": "Base",           "query": "" },
    { "id": "dark", "label": "Dark",           "query": "mode=dark" },
    { "id": "rm",   "label": "Reduced motion", "query": "rm=1" },
    { "id": "km",   "label": "Khmer",          "query": "lang=km" }
  ],
  "features": [
    {
      "id": "FEAT-checkout",
      "label": "Checkout",
      "pri": "P0",
      "flows": [
        {
          "id": "F1",
          "label": "Card payment",
          "page": "checkout.html",
          "screens": [
            {
              "sid": "S-CHK-01",
              "label": "Cart review",
              "view": "cart",
              "states": [
                { "id": "happy",   "query": "view=cart" },
                { "id": "empty",   "query": "view=cart&state=empty" },
                { "id": "error", "qualifier": "network", "query": "view=cart&state=neterr" }
              ],
              "axes": ["base", "dark"],
              "axes_reason": "no motion on this screen; all copy is numerals — rm and km add no coverage"
            }
          ]
        }
      ]
    }
  ]
}
```

### 3.2 Field rules

- **`state.id` must be a member of the closed vocabulary** defined once at
  `design-toolkit/tools/config.mjs` `CANON_STATES`: `happy`, `loading`, `empty`, `error`,
  `fail`, `success`, `in-progress`, `timeout`, `guest`, `locked`, `confirm`, `filtered`,
  `offline`, `permission-denied`. Anything narrower goes in `qualifier`, per the existing
  qualifier rule that `navgraph` (`N11-state-vocab`) and `stategraph` (`S1-vocab`) already
  enforce. The featuremap does not introduce a fifteenth term and does not define a second
  copy of the set — the generator imports it from `config.mjs`.
- **Axes are not states.** `guest` is a canon *state*, so a "guest checkout" case is
  `{"id":"guest"}` under `states`, never an axis value. Axes are presentation dimensions
  only: locale, theme, motion preference, density. A generator that finds a canon state term
  used as an axis id fails with a `blocking` finding rather than guessing.
- **`axes` on a screen is optional.** Absent means every axis in the top-level `axes` array
  applies. Present means narrowed — and then `axes_reason` is **required**; the generator
  exits non-zero without it.
- **`sid` must resolve** against the exported `screen-registry.csv` for the same BRD. An
  unresolvable `sid` is a `blocking` finding, not a skipped row — the same treatment
  `navgraph` gives an unparsed nav token.

## 4. What consumes it

### 4.1 `play.html` — the review player

Rewritten at `Templates/prototype/play.html`. The vendored copy at
`design-toolkit/templates/prototype/play.html` is not touched.

Today `FEATURES[]` is a hand-maintained array of pages and the stage is a bare iframe. After:
the player fetches `featuremap.json` over HTTP and renders a feature list plus four in-stage switchers —
`flow ▾  screen ▾  state ▾  axis ▾`. Selecting any of them sets the iframe `src` from the
leaf's `page` + `query` + axis query. **One click into a feature; no hooks typed by hand.**

Unchanged in the player: it stays review chrome, stays listed in `toolkit.config.json`
`review.harnessFiles`, and is therefore still excluded from state 08's palette sweep and state
12's network sweep. Its own colours must not reappear as product findings — that regression is
on record.

The empty-state behaviour is preserved in new terms: no featuremap, or a featuremap with no
features, renders the existing "nothing registered yet" message rather than a blank stage. A
`fetch` that fails renders the reason — opening `play.html` from `file://` cannot read the
featuremap, and the player says so rather than presenting an empty feature list, which would be
indistinguishable from a prototype that registered nothing.

### 4.2 `audit-plan.json` — generated, not authored

`design-toolkit/tools/audit.mjs` reads `reference/audit-plan.json` via `--plan` and does not
care who wrote it. The generator writes it.

Two emission rules, both taken from the vendored signin example's own note:

1. **`id` appears only on a screen's happy row in the base axis.** The `id matches registry`
   assertion compares the page's printed `data-sid` to this field; a state row and a screen
   row are different claims, and repeating `id` across axes would count one screen many times.
   So: `state.id === "happy"` and `axis === "base"` → emit into `screens[]` with `id: sid`.
   Everything else → emit into `states[]` with a label and no `id`.
2. **The axis query is baked into the row URL, and `passes` stays `[{"name":"base","query":""}]`.**
   `audit.mjs` multiplies its global `passes[]` across every row, which cannot express
   per-screen narrowing. Baking the axis into each row gives exact per-leaf control **and**
   keeps the whole run inside a single Chrome launch. Row labels carry the axis:
   `S-CHK-01 happy · dark`.

### 4.3 State 12

`Workflows/flow-visualization.md` currently scans the prototype directory for deep links.
It reads the featuremap instead. Scanning infers; reading does not. The `N9` finding for a
screen-id prefix with no page survives unchanged — it is now raised against a featuremap entry
rather than a filesystem guess.

### 4.4 `traceability.md`

The `Prototype element / hook` column is rendered from the featuremap rather than typed.
`Templates/traceability.md` gains a line saying so. The other six tables are untouched.

## 5. Harness runtime

### 5.1 Measured baseline

| Tool | Chrome | serve port | cdp port |
|---|---|---|---|
| `smoke.mjs` | yes | 8791 | 9335 |
| `stateprobe.mjs` | yes | **8791** | 9341 |
| `audit.mjs` | yes | 8797 | 9337 |
| `navgraph` `stategraph` `annotate` `linkcheck` `mermaidcheck` | no | — | — |

A full suite is 8 sequential node boots, 3 Chrome launches and 3 `python3 -m http.server`
processes. CDP ports were deliberately spread (+2 / +4 / +8); serve ports were not, and
`smoke` and `stateprobe` collide on 8791 — evidence the suite was authored to run strictly
sequentially.

### 5.2 `extensions/design/run-suite.mjs`

A runner, not a tool rewrite. Three levers:

**L1 — wave the five file-only tools.** The only ordering constraint is that `annotate` reads
`navgraph.json`. So wave 1 = `navgraph ∥ stategraph ∥ linkcheck ∥ mermaidcheck`, wave 2 =
`annotate`. Five sequential boots become two waves.

**L2 — overlap the Chrome tools with that wave.** `audit` already binds 8797 and clears.
`stateprobe` accepts `--port`, so it takes 8799 and the 8791 clash disappears. `smoke` has no
port flag and stays pinned to 8791, running alone. This is a flag, not a code change.

**L3 — per-leaf axis narrowing.** Section 3.2. Today every row pays every pass: the signin
example is 11 rows × 2 passes = 22 drives, including reduced-motion on screens with no motion.

> **L1 and L2 cost no coverage. L3 does.** That is why narrowing requires `axes_reason` and why
> every dropped row is printed in the run log with the reason that dropped it. A shrunk drive
> set reporting "all green" is precisely the failure the validation engine exists to prevent,
> and a silent cap would make it indistinguishable from full coverage.

**Exit codes are honoured as `Architecture/validation-engine.md` defines them.** Exit `2` is a
tool error — *unevaluable*, not passing. The runner aggregates per-tool exit codes and reports
the worst; a wave in which any tool exits 2 does not report success, and the runner never
substitutes its own verdict for a check that did not run.

## 6. Context load — splitting the cloned workflows

Both cloned workflow files already carry clean `PART A / B / C` boundaries. Split there.

| Today | Becomes | Approx. lines |
|---|---|---|
| `Workflows/ui-workflow.md` (621) | `ui-workflow.md` — §0 execution contract + index | 65 |
| ↳ PART A, state 06 | `Workflows/ui-planning.md` | 155 |
| ↳ PART B, state 07 | `Workflows/prototype.md` | 220 |
| ↳ PART C, state 08 | `Workflows/self-audit.md` | 180 |
| `Workflows/design-review.md` (608) | `design-review.md` — contract + index | 30 |
| ↳ PART A, state 09 | `Workflows/user-review.md` | 95 |
| ↳ PART B, state 10 | `Workflows/revision.md` | 225 |
| ↳ PART C, state 11 | `Workflows/final-output.md` | 155 |

A stage loads roughly 200 lines where it previously loaded 621.

**This is re-filing, not summarizing.** Every line moves; none is dropped or condensed. The
distinction is load-bearing: summarizing the vendored skills is the exact defect v1.9.0 was
written to repair, and a split that quietly compressed anything would recreate it. The
`Cloned from: <skill> @ 4081c24` provenance line travels with each part.

Sixteen files cite the two original paths and are updated in the same change:
`Documentation/module-index.md`, `Documentation/CHANGELOG.md`, `Checklists/ui-review.md`,
`Checklists/design-qa.md`, `Workflows/ux-workflow.md`, `Workflows/flow-visualization.md`,
`Workflows/ui-workflow.md`, `Workflows/project-onboarding.md`, `Playbooks/full-feature.md`,
`Playbooks/design-only.md`, `Architecture/workflow-state-machine.md`,
`Architecture/validation-engine.md`, `Architecture/design-state-machine.md`,
`Templates/traceability.md`, `Templates/prototype/README.md`, `Skills/ui-designer.md`.

## 7. Vendor bookkeeping

`design-toolkit/VENDORED.md` gains **Override 3 — review unit**, in the idiom of the two
overrides it already carries: the vendored method's review surface is one page per flow
registered by hand; here the review unit is the feature, driven by a generated featuremap, and
the prototype pages remain per-flow beneath it.

The same edit fixes a pre-existing inaccuracy found while reading it: the header claims the
copy is "verbatim except `.git/` and `.github/`", but `design-toolkit/.github/` is present.
Either the directory goes or the claim does — the claim is corrected to match what is on disk,
since deleting it would make the copy diverge from source for no gain.

## 8. Out of scope

Explicitly unchanged, and any diff touching these is a defect in this work:

- `design-toolkit/**` apart from `VENDORED.md`
- all ten `.mjs` tools
- `Architecture/screen-contract.md`, the `SCR-<nnn>` key, and the `C_CONTRACT` guard
- Dev Planning, QA, Tech Review, security certification, and every stage downstream of the
  Design Gate
- the closed state vocabulary — no new terms
- `AI/model-routing.md` tiers

## 9. Verification

Evidence required before this is called done. Presence of a file is not evidence that it
carries the right content.

**Unit tests** — `extensions/design/featuremap.test.mjs` and `run-suite.test.mjs`, using
`node:test` + `node:assert/strict` with no dependencies, matching `extensions/telegram/`.
Run with `node --test extensions/design/*.test.mjs`. Cases:

1. A featuremap with a `state.id` outside `CANON_STATES` produces a `blocking` finding.
2. A canon state term used as an axis id produces a `blocking` finding.
3. A screen carrying `axes` without `axes_reason` exits non-zero.
4. Narrowed axes print every dropped row and its reason to the run log.
5. Generated `audit-plan.json` puts `id` on base-axis happy rows only, and no other row.
6. Generated `audit-plan.json` bakes axis queries into row URLs and leaves `passes` as the
   single base entry.
7. A `sid` absent from the exported registry produces a `blocking` finding, not a skip.
8. `run-suite` reports the worst exit code across a wave, and treats `2` as unevaluable rather
   than as a pass.
9. The featuremap is written inside `paths.prototype` and appears in `review.harnessFiles`, so
   the palette and network sweeps do not report it as product surface.

**End-to-end** — regenerate the vendored `examples/signin/` set through the new path *into a
scratch directory, never into the vendored tree*, and assert the generated `audit-plan.json`
drives the same 11 screen/state rows the hand-authored one drives. Equal coverage from a
generated plan is the proof that the second hand-written list was redundant.

**Repository invariants** — after the split, the link check reports 0 broken links across the
toolkit's markdown, and `git diff --stat design-toolkit/` shows `VENDORED.md` and nothing else.

## 10. Open question deferred, not answered

The four uncommitted versions (v1.7.0 → v1.10.0) and the two CHANGELOG claim defects found
before this work — the absolute "0 vendored artifact paths outside `design-toolkit/`" wording,
which greps to five deliberate remap notes — are a separate change. They are recorded here so
they are not lost, and are not folded into this one.
