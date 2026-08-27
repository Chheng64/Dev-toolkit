# Validation Engine

> **Module:** Architecture / Foundation
> **Status:** Stable
> **Cloned from:** vendored [`VALIDATION_ENGINE.md`](../design-toolkit/VALIDATION_ENGINE.md) @ `4081c24`; tools in [`../design-toolkit/tools/`](../design-toolkit/tools/). Paths remapped to this toolkit's layout. Re-clone on vendor upgrade.
> **Consumed by:** Workflows/ui-workflow (07, 08), Workflows/flow-visualization (12), Workflows/design-review (10, 11), Checklists/design-qa, Checklists/flow-visualization

Every tool here exists to move a statement from **asserted** to **checked**. A claim a person can only re-check by reading is an assertion, and it decays silently. A claim anyone can re-check by running a command has an **exit code**.

Two rules bind every tool in this layer — contract, not advice:

> **M1 — Every check is rendering-class.** Computed visibility and measured geometry, never DOM presence. A node can exist, lay out, and accept a programmatic click while painting nothing. On the extraction run, **84 of 84 DOM assertions passed against a screen that displayed nothing.**

> **M3 — A failing probe is a hypothesis, not a finding.** One audit's first run reported **60 failures and 3 were real**. A state probe reported **37 failures and all 37 were the harness.** Confirm at source, correct the instrument, re-run. Never waive, never report unconfirmed.

---

## 1. Where each tool runs

| State | Tool | Question it answers |
|---|---|---|
| 07 `PROTOTYPE` | `smoke.mjs` | does this view paint? (cheap pre-filter, rule B8) |
| 08 `SELF_AUDIT` | `audit.mjs` | paint · targets · overflow · spill · contrast · scripts · source sweeps → **then read `shots/`** |
| 12 `FLOW_VISUALIZATION` | `navgraph.mjs` | screen → screen |
| 12 | `stategraph.mjs` | within a screen |
| 12 | `stateprobe.mjs` | does the state actually paint? |
| 12 | `annotate.mjs` | at the connector |
| any | `linkcheck.mjs` · `mermaidcheck.mjs` | do the documents' own links and diagrams hold? |
| — | `cdp.mjs` · `config.mjs` | shared layer — not validators; they are why the validators have zero dependencies |

## 2. Shared conventions

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No findings at or above `--fail-on`. |
| `1` | Findings at or above `--fail-on`. |
| `2` | **Tool error** — missing input, unparseable config, unknown flag. **Not** a product defect. |

**Distinguishing `1` from `2` matters: a `2` means the check did not run, which is *unevaluable*, not *passing*.** A gate that reads an exit-2 run as green is a gate that ships unchecked bytes.

### Severity ladder

`blocking` → `major` → `advisory`. `--fail-on <level>` names the lowest rung that causes a non-zero exit; default `blocking`.

### Common flags

| Flag | Effect | On |
|---|---|---|
| `--root <dir>` | Override the project root. Otherwise `$TOOLKIT_ROOT` → nearest ancestor containing `toolkit.config.json` → cwd. | all |
| `--json <file>` | Machine-readable output. | navgraph, stategraph, stateprobe, annotate, audit |
| `--md <file>` | Human-readable report. | navgraph, stategraph, annotate |
| `--fail-on <sev>` | Severity threshold. | navgraph, stategraph, annotate |
| `--shots <dir>` | Screenshot destination. | audit, stateprobe |
| `--plan <file>` | Explicit audit plan. | audit |
| `--quiet` | Suppress progress; the exit code still holds. | all |

### Configuration

No tool contains a product-specific value. Everything comes from the **generated** `toolkit.config.json` at the project root ([ui-workflow §0.3](../Workflows/ui-workflow.md)), merged over defaults section by section, every path absolutised once — so no tool ever joins a path itself.

**Change a convention in the config, never in a tool.** A prototype whose views are invisible to the harness contract reports as *blank*, which is indistinguishable from the defect the contract exists to catch.

---

## 3. `smoke.mjs` — build-time paint check · state 07 · rule B8

Per `(page, view)` pair: does the view **paint** (computed display/visibility + box above 100px) · is the **right** view active (`data-view`) · **console errors** (plus local responses ≥ 400, benign filtered by name) · **tap targets** below `audit.tapTargetFloorPx` · **horizontal overflow**. It prints the `data-sid` the page reports — the first place registry ↔ prototype id drift becomes visible.

```bash
node design-toolkit/tools/smoke.mjs "signin:main,error,reset" "home:dash,stack"
```

| Output | Means | Fix |
|---|---|---|
| `BLANK` | The view exists and paints nothing — almost always `.active` never added, so the container stays `visibility:hidden`. Defect class **B6**. | Wire the activation. **Do not lower the paint threshold.** |
| `view: null` | Nothing matched `viewSelector` + `activeClass`. | The prototype does not honour the harness contract (B7b). Fix the markup, or change the contract in the config — never in the tool. |
| `small:…` | Interactive element below the floor. | Raise it, or confirm the measurement reads a deliberate `::after` hit-area expansion. |
| `H-OVERFLOW` | The document scrolls horizontally at the review viewport. | Usually a fixed width or an un-wrapped row. Genuine scroll rails are a known false positive — §9. |
| `errs:404 …/favicon.ico` | Environment noise. | Add the name to `audit.benignConsole`. Filter **by name**, never wholesale. |

**Why it exists:** the audit is expensive — it drives every screen across every pass and produces screenshots a human must read. Spending that budget on defects assembly could have caught is waste.

## 4. `audit.mjs` — the rendering-class audit · state 08 · rules M1–M4

Per driven URL, entirely from computed style and measured geometry: **paints** · **no console errors** · **tap targets** (zero-size, `[hidden]`, `visibility:hidden`, `tabindex="-1"` excluded — not reachable targets) · **no h-overflow** · **no content spill** (`overflow:visible` with `scrollHeight > clientHeight` paints over neighbours, which structural assertions never see) · **contrast** on **composited** backgrounds (semi-transparent layers alpha-composited up the ancestor chain; gradients counted as skipped rather than guessed) · **script fonts** (every `product.scripts` range resolves on a stack matching `fontMatch` — CSS falls back per glyph) · **id matches registry** (`data-sid` vs the plan row).

Plus three **source sweeps** (M4), invisible on any single screen: **off-palette** (hexes outside `audit.colorAllowlist`, after stripping CSS id/class selectors — `#feed` is a selector) · **duplicate-keys** (keys defined more times than `product.locales.length`; the later definition silently wins, and one locale can hide it completely) · **network-call-site** (`fetch` / `XHR` / `WebSocket` / `sendBeacon` / `EventSource` — if the prototype issues real requests, the handoff must say so).

And a **screenshot per driven URL per pass**.

```bash
node design-toolkit/tools/audit.mjs --shots design/prototype/<brd-id>/shots
```

What to drive comes from the audit plan (seed from [vendored template](../design-toolkit/templates/audit-plan.json)); its `passes` array is how M2's **locale × theme × reduced-motion × state** matrix is expressed — every row driven once per pass, every combination getting its own screenshot.

### The two steps that make this an audit rather than a rumour

1. **Confirm each failure at source.** Work the false-positive catalogue (§9) first. Correct the harness, re-run, and record the correction in the report's **Harness corrections** section — an uncorrected harness re-reports the same noise next run.
2. **Read the screenshots.** Every one. Required audit step, not a supplement.

| Output | Cause | Fix |
|---|---|---|
| `prototype dir not found` (**exit 2**) | State 07 has not run, or `paths.prototype` is wrong. | Check the config. **Exit 2 means the check did not run.** |
| `no audit-plan and no state-machines` (**exit 2**) | Nothing to drive. | Seed the plan and list your URLs. |
| `the plan drives nothing` (**exit 2**) | Plan parsed, no `screens` and no `states`. | Populate it. |
| `painted=false` on an empty state | Paint floor tuned to a busy screen. | An empty state is **sparse by design**. Keep the floor low; do not raise it to silence the check. |
| Hundreds of overflow findings | Horizontal scroll rails; `genuinelyClipped: 0`. | Check overflow **ancestry** before reporting. |
| Off-palette hexes across every file | Demo bar / device bezel — harness chrome. | The sweep is **file**-level: chrome in its own file goes in `review.harnessFiles`; chrome inside a product file earns its colours from the allowlist like anything else. |
| A 20px target with `::after{inset:-12px}` | Explicit hit-area expansion. | Measure the hit area, not the box. Confirm at source. |
| One screen fails in one theme, renders on re-run | Timing flake. | Re-run before reporting. **Two stable consecutive runs is the bar.** |
| `duplicate-keys` on a legitimately repeated key | Threshold is `product.locales.length`. | Make sure every locale is listed. The tool reports the count; the reviewer rules it (M6). |

## 5. `navgraph.mjs` — the navigation derivation · state 12 · rules W1, E1–E5

Reads the registry export and **derives** the navigation model. Not an authoring surface: every edge traces to a registry cell.

| Code | Severity | Meaning |
|---|---|---|
| `N1-broken-edge` | blocking | `navigates_to` / `entry_from` names a screen not in the registry. |
| `N2-orphan` | blocking | No inbound edge and no external entry — the screen is unreachable. |
| `N2b-inbound-only-declared` | major | Reachable only via `entry_from`; no source names it in `navigates_to`, so the forward edge cannot be drawn. Reachable in the product, broken in the registry. |
| `N3-asymmetric` | major | `entry_from` claims a source that does not name it back. A forward edge is missing. |
| `N3b-backedge` | advisory | Forward edge exists, `entry_from` does not name it. The map draws correctly; the column a developer reads to answer *"who can send me here"* is stale. |
| `N4-terminal` | major | No outbound edge and no recorded terminal justification. |
| `N8-lane` | major / advisory | Screens with no swimlane assignment. Major when the lane file exists. |
| `N9-deeplink` | major / advisory | A flow page exposes no query hook at all (major — its states cannot be re-driven after handoff), no `?view` hook (advisory), or no page resolved for a prefix (advisory). |
| `N10-unparsed` | advisory | A registry cell carries prose where an id belongs — a token could not be fully machine-read, so an edge silently drops. |
| `N11-state-vocab` / `N11-state-syntax` | advisory | State labels outside the closed set, or not `canon` / `canon{qualifier}`. |

Derived, not authored: `crossFlow` (E2) · `heat` (E3) · `states` (E5) · `deepLinks` (E4 — the hooks each page **actually reads**).

| Finding | Fix |
|---|---|
| `N1-broken-edge` | **Fix the registry** — if a route belongs in the map and not in the registry, the registry is what is wrong. |
| `N2-orphan` | Add the inbound route to the source's `navigates_to`, or declare the external entry (`app launch`, `deep link`, `push notification`) in `entry_from`. |
| `N3-asymmetric` | Verify against the flow graphs **and** the prototype first. Exactly one of the two is wrong and the tool cannot tell which. |
| `N8-lane` | Assign in the lane file. **Never guess a lane** — a wrong lane reads as a ruling about who owns a screen. |
| `N9-deeplink` (major) | The flow has no hooks at all. This is a state 07 **B2** failure. A debt item once recorded this for *one* flow; the scan found it in **three**. |
| `N10-unparsed` | Hand-editing put prose where an id belongs. A token like `START-02/03 skip` carries a second id the pattern cannot see. |
| `N11-*` | **Normalize to the closed vocabulary before generating anything.** |

## 6. `stategraph.mjs` · `stateprobe.mjs` — inside a screen · state 12 · rules E5, W9, M1

`navgraph` answers *which screen leads to which*. `stategraph` answers one level down: within a screen, which states exist, what moves between them, how a developer or QA reaches each.

**The node set is derived; the edge set is authored with evidence.** The registry owns the state **set**; the state-machines file owns the **transitions**, each carrying `evidence` as `file:line` into the frozen prototype and each state carrying the `hook` that drives it. Every authored claim is checked back against the bytes.

Codes `S0`–`S9`: machine per screen · node set == registry and vocabulary-legal · initial declared and real · endpoints + trigger `kind` (`user`/`system`/`entry`/`data`) · evidence resolves to a real line · hook parameter actually read · reachable or `entry_only` · outbound or `terminal` · id drift · declared-but-unbuilt with the absence evidenced.

| Finding | Fix |
|---|---|
| `S1` node set differs | The registry owns the set — reconcile **there**. |
| `S4` evidence does not resolve | The cited line moved or the file was rebuilt. Re-cite against current bytes — this is the check that stops annotations from quietly aging. |
| `S5` hook not read by the page | Documented and not implemented: a state 07 **B2** gap, not a documentation gap. |
| `S6` unreachable | Flag `entry_only` if that is the truth, or add the path. |
| `S8` id drift | **Record it, do not reconcile it** — renumbering is a registry decision. |
| `S9` declared but unbuilt | Keep it, dashed. **Do not delete the state to make the report clean.** |

`stateprobe.mjs` then drives every hook URL headlessly and asserts the active view is computed-visible **with ink on it**. `stategraph` proves the hook is *read*; **a hook that seeds state is not a hook that shows it.** The probe also reads back the prototype's own id readout at every load — that is how drift gets **measured** instead of asserted (11 observations on the extraction run, confirming one known conflict and opening the same class on a second flow).

First-run failures on this probe are **almost certainly the harness**: the extraction set's first run reported 37 failures and every one was the instrument. Corrected, not waived.

## 7. `annotate.mjs` — developer annotations · state 12 · rule E6

| Finding | Fix |
|---|---|
| `E1` blank field | Fill it, or write `UNKNOWN`. **Blank fails; `UNKNOWN` passes and is counted.** |
| `E4` citation does not resolve | Landed past end of file, or on a line that has gone blank. Re-cite against the frozen bytes. |
| `E8` `nav` = `UNKNOWN` | No call site found for a route the registry claims. Either the control is missing (a real defect) or the citation names the wrong place. |
| `E11` `api` claim vs sweep | The column says `none (simulated)` and the sweep found a request, or vice versa. **The sweep is authoritative** — it re-runs every time. |
| `E13` `hook_only` | Record it. A route reachable only by URL is a real finding for a build team, not a nuisance. |

## 8. `linkcheck.mjs` · `mermaidcheck.mjs` — document checks

The tools above validate a *product*; these validate the *documents*, for the same stated reason: a claim nobody re-checks is a claim that rots. A dead link inside a document set is the same class of defect as a dead deep-link hook inside a prototype — **the structure names a destination that is not there**, invisible to a reader who does not happen to click.

| Tool | Code | Severity | Fires when |
|---|---|---|---|
| `linkcheck` | `D1-missing` | blocking | a relative link points at a file or directory that does not exist |
| | `D2-anchor` | blocking | a `#fragment` names no heading in the target file |
| | `D3-dir` | advisory | a link points at a directory with no `README.md` |
| `mermaidcheck` | `D4-type` | blocking | the first token is not a recognised diagram type |
| | `D5-quotes` | major | a line carries an odd number of `"` — an unterminated label |
| | `D6-unclosed` | blocking | a mermaid fence never closes |
| | `D7-parens` | advisory | parentheses inside an unquoted `[label]` |

**Deliberately not checked** (the scope is stated inside the claim): `http(s):` targets — network state is not a property of a repository, and a check that fails on someone else's outage gets ignored · links inside fenced code blocks — those are examples of link syntax · whether a mermaid block *renders* — this is a syntax-smell check, not a parser; rendering is proved by looking (M2) · whether the writing is any good.

**Both tools were shaped by their own false positives**, which is M3 applied to the check itself: `linkcheck`'s first version collapsed whitespace when slugifying headings where GitHub replaces **each** space with a hyphen, and reported **167 correct links as broken** — a check that opens with 167 false positives does not get debugged, it gets deleted. `mermaidcheck`'s first version flagged twelve **valid** Mermaid shapes (`db[(Store)]` is a cylinder, `s([Go])` a stadium); compound delimiters are now recognised before the label scan, and the remaining check is advisory.

---

## 9. The false-positive catalogue

**A failing probe is a hypothesis, not a finding.** Rule each class out before writing anything into a report or a finding.

| Reported | Reality | What to do |
|---|---|---|
| Hundreds of overflow violations | Inside horizontal **scroll rails** — `genuinelyClipped: 0`. | Check overflow **ancestry**. |
| Off-palette hexes across 8 files | Demo bar and device bezel — **harness chrome**, not app surface. | List chrome **files** in `review.harnessFiles`. The sweep excludes files, not selectors. |
| A `#FEED` colour violation | The CSS **id selector** `#feed`. | A hex scanner must not read selectors. |
| A foreign-stack font token used 27–47× per file | The intended architecture for numerals. | The check itself was wrong. |
| A 20px tap target | `::after{inset:-12px}` — an explicit, commented hit-area expansion. | Measure the **hit area**, not the box. |
| A clipped `<img>` | A deliberate crop — an oversized asset inside `overflow:hidden`. | Confirm at source. |
| A screen failing to render in one theme | **Timing flake** — renders at every settle when measured. | Re-run. **Two stable consecutive runs is the bar.** |
| Console errors on nearly every page | An offline webfont CDN and a missing `favicon.ico`. | Filter benign entries **by name**, never wholesale. |
| Empty states "fail to paint" | A visible-node threshold tuned to a busy screen. | An empty state is **sparse by design**. Lower the threshold. |
| A hook that renders nothing | The hook names a fixture id the catalogue does not contain, and the page threw. | **A wrong fixture is not a product defect.** |

Every one was **corrected in the harness and the run repeated — not waived.** Corrections are recorded in the audit's *Harness corrections* section.

## 10. Waivers

A rule may be **waived**, never skipped. A waiver ships only when all three hold:

1. **The user grants it.** The machine cannot waive its own rules.
2. It is written into the deliverable's **Known limitations** *and* opened as a **numbered debt item**, with an id both sides can cite.
3. It states **what would close it**.

Two validations waived at one gate on the extraction run — audit currency, and a missing traceability matrix — each riding a numbered debt item. **Both were closed the next day.** One by an audit re-run that immediately found three more real defects; the other by a backfill reporting 26 requirements / 90 ACs with 0 unmet.

> **The waiver was never the problem. The silence would have been.**

**What a waiver is not:** a way to make a failing check pass. **A failing check that has not been confirmed at source is not eligible for a waiver — it is eligible for §9.**

## 11. Running the full suite

```bash
# state 07 — before handing to the audit
node design-toolkit/tools/smoke.mjs "signin:main,error,reset" "home:dash,stack"

# state 08 — then READ design/prototype/<brd-id>/shots/
node design-toolkit/tools/audit.mjs --shots design/prototype/<brd-id>/shots

# state 12 — ORDER MATTERS: annotate reads navgraph.json
node design-toolkit/tools/navgraph.mjs   --fail-on major
node design-toolkit/tools/stategraph.mjs --fail-on major
node design-toolkit/tools/stateprobe.mjs
node design-toolkit/tools/annotate.mjs   --fail-on major
```

### As a gate check

```bash
set -e
node design-toolkit/tools/navgraph.mjs   --fail-on major --quiet
node design-toolkit/tools/stategraph.mjs --fail-on major --quiet
node design-toolkit/tools/stateprobe.mjs --quiet
node design-toolkit/tools/annotate.mjs   --fail-on major --quiet
echo "READY FOR DEVELOPMENT — scoped to: <the flows named in scope>"
```

**Never a bare "handoff ready".** The status is scoped to the flows named in `scope`, and the scope goes **inside** the claim.

### What the gate reads

The picture is persuasive and proves nothing. What passes the gate is the **report plus the exit code**, with every finding either cleared or carrying a named waiver with a rider debt item. **A picture that looks right over a report that says `2 blocking` is the exact failure state 12 exists to prevent.**
