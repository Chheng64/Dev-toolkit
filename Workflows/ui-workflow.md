# Workflow — UI (design states 06 · 07 · 08)

> **Module:** Workflows
> **Stage:** `Design` (lifecycle state 03, second half) → hands to `Design Review`
> **Skill:** UI Designer (Design System Engineer supports on DS gaps)
> **Machine:** [design-state-machine.md](../Architecture/design-state-machine.md) states 06 `UI_PLANNING` + 07 `PROTOTYPE` + 08 `SELF_AUDIT`
> **Cloned from:** vendored [`06-ui-planning`](../design-toolkit/skills/06-ui-planning/SKILL.md) · [`07-prototype`](../design-toolkit/skills/07-prototype/SKILL.md) · [`08-self-audit`](../design-toolkit/skills/08-self-audit/SKILL.md) @ `4081c24`. Method text is the skills' text; only artifact locations are remapped (§0.2). Re-clone on vendor upgrade — do not let the two drift.

**This file is the procedure, not a pointer to one.** Everything needed to plan, build and audit is below. The rules in it were each written by a defect that shipped past a green check; a cheaper method is not a substitute.

---

## 0. Execution contract

### 0.1 Order and gates

| State | Produces | Gate before leaving |
|---|---|---|
| 06 `UI_PLANNING` | S08 UI plan + screen registration | [ui-review](../Checklists/ui-review.md) |
| 07 `PROTOTYPE` | `design/prototype/<brd-id>/` + `traceability.md` | V1–V6 below |
| 08 `SELF_AUDIT` | S14 design-audit subsection | [design-qa](../Checklists/design-qa.md), verdict `pass` |

Retry ceilings: 06 → 2, 07 → 3, 08 → 3 (`L_AUDIT_FIX`). Back-transitions go to the state that owed the missing input — never around it.

### 0.2 Where artifacts live here

The vendored skills write loose files under `artifacts/`. In this toolkit:

| Vendored artifact | Here |
|---|---|
| `ui-plan.md` | **BRD S08** |
| `flows.md` · `ux-plan.md` | **BRD S07 · S09** |
| `requirements.md` · `research.md` | **BRD S03/S04 · S05** |
| `prototype/` | **repo** `design/prototype/<brd-id>/` on the BRD branch |
| `traceability.md` | **repo** `design/prototype/<brd-id>/traceability.md` |
| `audit-report.md` | **BRD S14**, `design-audit` subsection |
| `screen-registry.csv` | **[Screen Contract](../Architecture/screen-contract.md)** — `screens/registry.md` |
| `toolkit.config.json` | generated — see §0.3 |

Frontmatter blocks below are written **verbatim into their BRD section or file**: `version`, `reads_versions` and `supersedes` are load-bearing, and the gate records downstream check them.

### 0.3 The config bridge — do this before running any tool

The vendored harnesses (`audit.mjs`, `smoke.mjs`, `stateprobe.mjs`, `navgraph.mjs`) read `toolkit.config.json` from the **project root**. That file is **generated**, never hand-authored:

- source: `project-manifest.yaml` → `design:` block (viewport, scripts, ports, paths, DS source id, loops)
- plus this BRD's colour allowlist, written by state 06 (§1.4)
- regenerate whenever the manifest or the allowlist changes; it is a derived cache like `context/`

```
paths.prototype  → design/prototype/<brd-id>
paths.shots      → design/prototype/<brd-id>/shots
paths.registry   → design/navmap/<brd-id>/screen-registry.csv   (exported from the Screen Contract)
audit.colorAllowlist / colorBanned  ← S08 §STRICT colour allowlist
designSystem.sourceId ← manifest design.design_system.source_id
```

An allowlist that lives only in S08 is an allowlist nothing enforces. Write both, in the same edit.

### 0.4 Inputs

- S07/S09 complete (UX workflow exit criteria met — [ux-workflow](ux-workflow.md))
- Design-system reference **named by source id**; Figma refs when bound in the Resource Registry
- Open S16 `Affects:` entries targeting S08; change requests routed here by REVISION

---

# PART A — STATE 06 · `UI_PLANNING`

## A.1 Contract

| Field | Value |
|---|---|
| Reads | S07, S09, S05, design-system reference |
| Writes | S08; Screen Contract rows + Design blocks |
| Depends on | `FLOW_GENERATION` (must precede) |
| Approval gate | None — may raise an informational, non-blocking **Extension Note** |
| Retry ceiling | 2, then unavoidable new components route through an Extension Note |
| Next | `PROTOTYPE` / back to `FLOW_GENERATION` (flow gap) / self-loop (reuse or mapping fix) |

## A.2 Purpose

Define UI structure, component inventory and design-system usage — **still specification, not rendered UI** — so `PROTOTYPE` assembles a plan instead of improvising one.

The boundary that defines this state: it names components, tokens, geometry and motion **by reference**, and builds nothing. Everything it writes must be checkable against the design system before a line of the prototype exists. **A decision deferred to build time is a decision made by whoever builds fastest.**

## A.3 Processing steps

0. **Register screens.** Every screen the flows imply gets a `SCR-<nnn>` row in `screens/registry.md` (allocate from manifest `next_id`; **claim** seeded rows rather than duplicating) and a contract file with the Design block started ([design-mapping](../Templates/design-mapping.md)). Overlays are screens too. An unregistered screen is invisible to handoff mapping.
1. **Decompose each flow state** from S07 into its required UI regions and components.
2. **Map components to existing DS primitives first**; flag the gaps that need an extension. Reuse is the default, `new` is the exception that argues for itself.
3. **Define layout and hierarchy rules per state** — at the real viewport, with real numbers.
4. **Specify tokens** (spacing, colour, typography, motion) **by reference**. Values are not invented here.
5. **Produce the component inventory** with a reuse-vs-new classification, and a written justification against every `new`.

## A.4 Output — BRD S08

```markdown
---
artifact: ui-plan
version: ui-<brd-id>-NN
produced_by: ui-planning
reads_versions:
  S07: <rev>
  S09: <rev>
  S05: <rev>
  design-system: "<DS name + the source id it came from>"
brd: <brd-id>
inherits: <prior plan / shell this one builds on, and what it takes verbatim>
supersedes: <prior version, if any>
---

# UI Plan — <feature>

## Inherited, reused verbatim

<the token layer, chrome primitives, i18n pattern, asset resolvers, effects and
guards taken unchanged from the shell — named explicitly, because anything not
listed here is something this plan is claiming to introduce>

## STRICT colour allowlist (enforced at state 08)

<the exact hex set, grouped: brand / gray / semantic / exempt classes>
BANNED: <hexes that must not appear, and where they came from>

Write the same set into the generated `toolkit.config.json` → `audit.colorAllowlist`
/ `colorBanned` (§0.3). The **BANNED** list is not optional: the audit enforces
this allowlist by machine hex-extraction, and the lesson attached to that rule is
that an audit must check **non-DS absence, not just DS presence** — an allowlist
alone cannot catch a value that was never supposed to exist.

## Component inventory → DS mapping (reuse-first)

| Comp | Surface | DS mapping | new? |
|---|---|---|---|
| <component> | <flow state / SCR-id> | `<primitive>` | reuse |
| <component> | <state> | `<primitive>` + <variant> | reuse+variant |
| <component> | <state> | <what it is assembled from> | **new**, justified: <why no primitive covers it, and what it is built out of> |

<count line: N of M entries are reuse or variants; every `new` carries a
justification — this is V2's evidence>

## Layout rules (<viewport>)

<per state: the vertical budget in px, the grid of each repeated row, the
minimum tap target of every interactive element, scroll vs pinned, sheet
geometry, safe-area and small-viewport behaviour>

## Motion spec

| Element | Default | Reduced |
|---|---|---|
| <element> | <duration + curve, by token> | <static equivalent> |

<every row forked for `.reduce` and `prefers-reduced-motion` — S07's motion
opt-out is an acceptance criterion, not a nicety>

## Contrast

<the audited pairs, with ratios. Decided here on the token pair, not at audit
time. A pairing that fails is a plan change.>

## Token reference resolution

<every value resolves to a token or a documented exemption. State the count of
new hex introduced — the target is zero.>

## Superseded

| Component | Replaced by | Strip in prototype |
|---|---|---|
| <old component + its selectors> | <new one> | yes |

## Extension Note (informational, non-blocking)

<the `new` compositions, why the DS has no primitive, what they are built from,
and whether they are recommended for promotion into the DS — routed to
design-system-workflow>

## Open decisions

- o-<id>: <question> — <what it leaves unresolved> — <who can rule>

## Validation self-check

- **V1** ✅/❌ <every flow state maps to a component set — list the states>
- **V2** ✅/❌ <reuse ratio + every `new` justified>
- **V3** ✅/❌ <no one-off styling where a primitive exists>
- **V4** ✅/❌ <token references resolve; new hex count>
```

## A.5 Validation rules

- **V1:** Every flow state maps to a component set.
- **V2:** Component-to-DS mapping **prefers reuse**; every `new` component has a justification.
- **V3:** No isolated one-off styling introduced where a DS primitive exists.
- **V4:** Token references **resolve** to the provided design system, or are flagged as an extension.

V4 is the one that fails quietly. "Resolves" means the token exists in the named design system — not that a plausible-looking `var()` name was written down. A token the DS does not have is an extension request or an open decision; **it is never a hex quietly added to the allowlist.**

## A.6 Failure recovery

- **V2 / V3** failure → re-map the offending components **toward DS reuse**. Fix the mapping, not the justification — a better-argued one-off is still a one-off.
- **V1** failure → check whether the unmapped state is a *missing state* rather than a missing component set. S07 short a state → back-transition to `FLOW_GENERATION`. Do not invent the state here.
- **V4** failure → raise an **extension request**. If the missing token encodes an unruled product decision (a colour nobody owns, a size nobody set), it is an **open decision** carried forward, not a value chosen here.
- Retry ceiling **2**. Unavoidable new components route through an Extension Note — informational, non-blocking. The Note is the escalation edge, not a back-transition.

## A.7 Recorded failure modes

| Class | What happened | Rule |
|---|---|---|
| **Wrong design system** | A spec belonging to a **different project** was adopted and survived four revision cycles; the machine hit the revision ceiling before the tell was spotted (a desktop-first viewport assumption inside a mobile product). A plan built on the wrong system validates **perfectly** against it, so no downstream rule can catch it. | Name the DS **by source id** in `reads_versions.design-system` and in the generated config's `designSystem.sourceId`, then sanity-check that the system's own assumptions (viewport, platform, brand) match this product's. A DS reference without an id is unverifiable — and every rule in this state is only as true as that one line. |
| **Token that does not exist** | A spec asked for two hues the palette does not contain. The nearest allowlisted ramps shipped and an open was raised — correctly. The failure mode is the alternative: adding two hexes to the allowlist to make the spec true. | A token that does not resolve is an **extension request or an open**, never a new hex. Counter-example from the same run: a five-rung tier ladder that resolved inside the existing allowlist with **zero additions**. |
| **Contrast decided after the fact** | A progress bar failed **3:1 against its own track**, so it shipped as the theme accent — contradicting the same spec's one-colour-per-category rule. | Contrast is decided **here, on the token pair**, with the ratio written down. A pairing that fails is a **plan** change, not a prototype patch. |
| **Selector namespace not claimed** | A descendant selector on a new card also matched status and lock icons elsewhere and inflated them to ~340px; an inline-span badge overflowed its card and clipped the lines below. Both were **new compositions dropped into an inherited shell**. | A `new` entry declares the **selector namespace it claims** and scopes its descendants (`> svg`). The inventory is where a collision is cheap to see. |
| **Inventory only added** | One revision superseded an entire component outright; two rebuilds later required stripping whole selector families and their string keys by hand. | When a revision replaces a component, record the **supersession** so the prototype strips it. An inventory that only grows accumulates dead style no audit reads. |
| **Token layer as opt-in** | The script→font token was **opt-in per component** over a foreign base, so anything that did not opt in rendered on an arbitrary OS fallback — **138 instances across 7 flows** — and the base stack carried no face for that script at all. | Script → font mapping is a **base rule of the token layer**, not a per-component choice. Anything a component can forget to do, some component will forget to do. |
| **Shared component, no owner** | The bottom navigation drifted into three variants across files; a re-cut relabelled a slot while every file kept the old glyph, so the tab read one thing under the icon for another. | A component used by more than one flow is a **cross-flow contract**. The inventory names its owning plan, or each file re-decides it. |
| **Geometry that contradicts the strategy** | Layout rules set four interactive elements between 29 and 38px against an S07 floor of **44px**. ~140 elements on 20 screens passed the external AA standard but missed the project's own acceptance criterion, and raising them would have restyled four approved gates. | S07's accessibility floor is an **acceptance criterion**, and it is the config's `audit.tapTargetFloorPx`. State target sizes as numbers here and check them against it — this is the last state where the number is free to change. |

---

# PART B — STATE 07 · `PROTOTYPE`

## B.1 Contract

| Field | Value |
|---|---|
| Reads | S08, S07, S09, the generated config |
| Writes | `design/prototype/<brd-id>/` + `design/prototype/<brd-id>/traceability.md`; S08 gets the prototype link + version id |
| Depends on | `UI_PLANNING` (must precede) |
| Approval gate | None — the prototype is **not** shown to the user from this state |
| Retry ceiling | 3 (assembly fix), then back-transition to `UI_PLANNING` |
| Next | `SELF_AUDIT` / `UI_PLANNING` (spec insufficient) / self-loop (assembly fix) |

## B.2 Purpose

Assemble the planned UI + flows into a coherent prototype per the specifications produced upstream.

This is the state where specs become bytes, and therefore the state where most defects are **born** — nearly every audit finding traces to an assembly decision made here. State 08 exists to catch them; **this state exists to not make them.** The two rule sets are complements, not duplicates: the build method below is written from the same defect record as Part C's verification method, stated as construction rules rather than detection rules.

## B.3 Processing steps

1. **Instantiate** each flow state using the component inventory from S08.
2. **Wire transitions** per S07 — including the recovery routes, not just the happy path.
3. **Apply DS tokens/primitives** per S08.
4. **Ensure cross-state consistency** — naming, hierarchy, motion.
5. **Produce the traceability map**: prototype element → source spec entry.

## B.4 Build method (hardened)

Steps 1–5 say *what* to assemble. This is the contract for *how*. Each rule was written by a defect that shipped. Cite the codes in S12/S16 and in findings.

### B1 — Emit in chunks, never one giant write

A whole flow file is ~1,300–2,000 lines. Write the head, then append sections (~≤300 lines each). Every parallel builder that tried to emit a full file in one write **crashed mid-response** and lost the work.

### B2 — Every flow state ships a deep-link hook

A state reachable only by clicking through four screens is a state that state 08 cannot drive and the Design Gate cannot demonstrate. Give every flow state, variant and error case a query hook (`?view=`, `?state=`, `?sheet=`, `?load=`) and **record the hook in `traceability.md`** — that table is what makes V1 checkable instead of assertable. The hook list is also the review packet: the Design Gate hands the user the same list.

### B3 — Claim the selector namespace before you use it

A single-file prototype has one global CSS namespace across every screen. Prefix per section and scope descendant rules with `>`. Generic names collide silently and repaint an unrelated panel: a list-row class repainted a hero on another screen; a descendant selector on one card also matched status and lock icons elsewhere and inflated them to ~340px; an inline-span badge overflowed its card and clipped the lines below it. All three were **geometry or screenshot finds**, invisible to structure.

### B4 — String and config keys are a namespace too

Duplicate keys in a locale or config object do not error — the later definition silently wins. On the extraction run this happened three times to navigation labels clobbered by later-added categories, and **one locale hid the defect entirely** because both labels happened to read the same. Sweep for duplicate keys across every file **and** every locale object before handoff (`node design-toolkit/tools/audit.mjs` runs this sweep; the config's `product.locales` tells it how many legitimate repeats to expect).

### B5 — The token layer is the base, not an opt-in

Set the token on the container (`.screen{font-family:var(--ui-font)}`), never per-component. An opt-in token layer means anything that forgets to opt in falls through to whatever the platform picks — that is how **138 instances across 7 flows** rendered a script on a stack that had no face for it. Then check the stack itself: CSS falls back **per glyph**, so a stack carrying no face for a script it must render is a defect even where the token was applied correctly. Declare every script in the manifest `design.scripts` (→ config `product.scripts`) so state 08 can check it.

The same completeness rule holds for **asset registries**. A slug with no crop entry falls back to the default entry, which frames the wrong part of the asset. Every slug you reference needs a real entry.

### B6 — A transition is not wired until its destination paints

Two failure shapes, both of which pass structural assertions:

- **Boundary mocks that outlived their boundary.** Eleven live boundary call sites still routed to a placeholder after every destination existed. Re-check the whole set whenever another flow ships — a "no mocks left" claim is a dated claim about one flow, not a property of the set.
- **A state that exists but never becomes visible.** `.view` is `visibility:hidden` until `.active`; nothing added `.active`; **84/84 DOM assertions passed against a screen that displayed nothing**, because `visibility:hidden` keeps layout boxes and accepts programmatic clicks.

Verify each wired transition by driving it and asserting the destination **paints** — computed visibility and geometry.

### B7 — Supersession deletes

When a revision rebuilds a component, strip the old CSS, strings and JS rather than leaving them dead. S08's **Superseded** table names what goes; the prototype is where it actually goes. Leftovers are un-specced elements and violate V2 exactly as much as additions do. Record the strip in `traceability.md`, **itemised** — the removed selector and string-key list is the evidence, and a rebuild that cannot produce one did not do the strip.

### B7b — Honour the harness contract

Three harnesses read the prototype — `smoke.mjs`, `audit.mjs`, `stateprobe.mjs` — and they all read it the same way, through the generated `toolkit.config.json` → `prototype`:

| Config key | Default | What the prototype must do |
|---|---|---|
| `viewSelector` | `.view` | one element per flow state |
| `activeClass` | `active` | added to exactly the view being shown |
| `screenSelector` | `.screen` | the viewport-sized container |
| `sidSelector` | `#sid` | prints the active view's screen id |
| `minVisibleNodes` | `3` | paint floor — keep it low; an empty state is sparse by design |

Plus `data-view` and `data-sid` on every view. **`data-sid` is what makes Screen-Contract ↔ prototype id drift measurable rather than asserted**: the probe reads what the page prints and compares it to the id the registry claims.

Change the convention in the config, not in a tool. A prototype whose views are invisible to the contract reports as *blank* — indistinguishable from the defect B6 exists to catch.

### B8 — Self-check before handing to `SELF_AUDIT`

Do not spend the audit's budget on defects assembly can find:

```bash
node design-toolkit/tools/smoke.mjs "<page>:<view>,<view>" ...
```

- `node --check` on the extracted `<script>`.
- Hex inventory against the S08 allowlist — CSS **id selectors** (`#feed`) are not colours, and review-chrome **files** are excluded (config `review.harnessFiles`). The exclusion is by file, so chrome that lives inside a product file is swept like any other surface.
- Drive every view headless and **read the screenshots**. Renders break with zero console errors.
- Console sweep, with known-benign entries filtered **by name** (`audit.benignConsole`) rather than ignored wholesale.
- Read every rendered number and ceremony icon against its own copy once. A progress fill computed from a 0-based index shows empty on step 1; an "unlocked!" ceremony drew a **closed** padlock. Both were faithful to their code and wrong on the screen.

## B.5 Figma assembly — plugin-API traps

When this state's output includes pushing frames or variables into Figma, three API behaviours cost a full rebuild once and will again:

- **F1 — `setBoundVariableForPaint()` silently drops `paint.opacity`** (0.25 → 1, verified). A binding sweep flattened every alpha in the file. Working recipe: assign the bound paint → **re-read `node.fills[0]`** → spread the opacity on → reassign. Spreading the object *returned by* the bind call does not survive assignment.
- **F2 — a bad lookup fails silently, it does not throw.** `getVariableByIdAsync('1:3')` returns `null` — it needs the `VariableID:` prefix — and `setBoundVariableForPaint(p,'color',null)` returns the paint *unbound* rather than erroring. A wrong id therefore yields unbound paints with zero errors. Re-read and assert the binding.
- **F3 — `paint.opacity` round-trips as float32** (`0.12` → `0.11999999…`). Compare with an epsilon.

Figma writes go to the **bound file key only** ([integration-map](../Architecture/integration-map.md)); no binding → prototype-only, per the Screen Contract's Figma-Optional Rule.

## B.6 Output — `design/prototype/<brd-id>/`

The assembled artifact. Conventions the toolkit settled on: one self-contained file per flow, a shared player for review packaging — copy [`Templates/prototype/`](../Templates/prototype/) (`run-local.sh`, `serve.py`, `play.html`) in and **register the page in `play.html`'s `FEATURES` array in the same edit** — deep-link hooks per B2, and a demo bar for the states that cannot be reached by data alone.

Record in S08: prototype path, `version` id (`proto-<brd-id>-NN`), player URL convention (`run-local.sh [port]`, default 8765).

## B.7 Output — `traceability.md`

```markdown
---
artifact: traceability
version: trace-<brd-id>-NN
produced_by: prototype
reads_versions:
  S03: <rev>
  S07: <rev>
  S09: <rev>
  S08: <ui-<brd-id>-NN>
brd: <brd-id>
---

# Traceability — <feature> (<proto-<brd-id>-NN>)

Every prototype element traces to a spec entry (V2), and every flow state is
represented (V1). Files: `design/prototype/<brd-id>/<file>`.

## Requirement → task → flow → component → prototype element

| Req | Task | Flow | UI component | Prototype element / hook |
|---|---|---|---|---|
| R-x1 | TK1 | F1 | <component from S08 inventory> | `<selector>`, `<fn()>`, `?hook=` |

## Flow state → prototype representation (V1)

| <flow id> node | SCR-id | Representation | Hook |
|---|---|---|---|
| <state name> | SCR-nnn | <default entry \| selector \| overlay> | `?view=…` |

_Every node in S07, including recovery and non-happy-path states._

## Transition → wiring (V4)

| Flow transition | Wired as | Destination paints |
|---|---|---|
| <from> → <to> (D<n>) | `<fn()>` / `goFlow(...)` | yes — <evidence> |

## Decision → implementation

| Decision | Where it lives |
|---|---|
| D-x1 <text> | `<const / selector / guard>` |

## Superseded — stripped, not left dead (B7)

| Removed | Superseded by | Selectors / keys stripped |
|---|---|---|
| <component> | <revision> | `.a`, `.b`, `strKey1`, `fnName()` |

## Un-specced additions

<none — or each one named, with the spec entry it needs before V2 can pass.>

## Verification record (B8)

<node --check · hex inventory · views driven · screenshots read · sweeps run
(duplicate keys, boundary call sites, per-glyph font) · console sweep.>
```

## B.8 Validation rules

- **V1:** Every flow state from S07 is represented in the prototype.
- **V2:** Every prototype element traces to a spec entry — **no un-specced additions**.
- **V3:** DS token usage matches S08 references.
- **V4:** All wired transitions correspond to defined flow transitions.
- **V5** *(per B2)*: Every flow state in the V1 table carries a **deep-link hook**. A state that cannot be driven cannot be audited, so V1 is otherwise unverifiable.
- **V6** *(per B7)*: A superseded component leaves **no dead selectors, strings or handlers** behind. Leftovers are un-specced elements and fail V2.

## B.9 Failure recovery

- **V1/V2 failure** → assemble the missing states, or remove the un-specced additions, then re-validate. Retry ceiling **3**.
- **Repeated spec insufficiency** → back-transition to `UI_PLANNING`. *"The spec does not say"* is a routing signal, not a licence to invent. An invented value assembled here becomes a frozen number nobody owns.
- A missing upstream artifact → back-transition to the state that owed it. **Do not assemble around a missing spec.**

## B.10 Recorded failure modes

### A. Assembly defects

| Case | What happened | Rule |
|---|---|---|
| **View never activated** | The screen never became visible; **84/84 DOM assertions passed** against a screen displaying nothing. | B6 |
| **11 stale boundary call sites** | Boundary mocks still routed to a placeholder although every destination existed. One carried a source comment naming the destination flow as "still todo" — written before that flow shipped, never revisited. | B6 |
| **Class collisions** | A list-row class repainted a hero on another screen; a descendant selector inflated status/lock icons to ~340px; an inline badge overflowed its card and clipped the lines below. | B3 |
| **Duplicate string keys** | Navigation labels silently clobbered by later definitions in the same object, twice. **One locale hid the second one completely.** | B4 |
| **Opt-in token layer** | The script→font token applied per component over a foreign base → **138 instances across 7 flows** on an arbitrary platform fallback. Then the base stack itself carried **no face for that script at all**. | B5 |
| **Incomplete asset registry** | Asset slugs with no crop entry fell back to the default frame — twice, in two flows, with different slugs. | B5 |
| **Off-by-one and reversed semantics** | Progress fill computed as `i / N` showed empty on step 1; an unlock ceremony drew a **closed** padlock under "🔓 unlocked!". | B8 |
| **Sheet and scroll geometry** | `translateY(105%)` failed to clear a sheet shorter than its `max-height`, so a *closed* sheet bled back in; `scrollIntoView()` scrolled an `overflow:hidden` ancestor and pushed the header out of frame; a card ellipsized its most important word. All **screenshot-only** finds. | B8 |

**The lesson, stated once:** the assertions you write test the structure you were thinking about. The screenshot tests the screen.

### B. Build-ops

| Case | What happened | Rule |
|---|---|---|
| **Parallel builder crash** | Every agent emitting a whole file in one write died with *"connection closed mid-response"*; the chunked retry succeeded. | B1 |
| **Figma alpha flattening** | A binding sweep silently dropped `paint.opacity` on every bound paint — all base frames had to be rebuilt. | F1 |
| **Silently unbound paints** | A `VariableID:`-less lookup returned `null` and the bind call accepted it without throwing. | F2 |

### C. Scope discipline

- **Chrome that a ruling scoped to specific screens stays on those screens.** On the extraction run the locale toggle was ruled onto three surfaces only, while the locale itself inherited through the shared state record. Adding the control elsewhere because it is convenient in a builder is an un-specced addition and fails V2.
- **A spec that contradicts a ruled decision is not resolved here.** Assemble the ruled behaviour, ship the alternative behind a demo toggle, and raise the open for the Design Gate. Deciding it in the assembly hides the conflict inside bytes.

---

# PART C — STATE 08 · `SELF_AUDIT`

## C.1 Contract

| Field | Value |
|---|---|
| Reads | `design/prototype/<brd-id>/`, `traceability.md`, S03/S07/S08/S09 |
| Writes | S14 `design-audit` subsection |
| Depends on | `PROTOTYPE` (must precede) |
| Approval gate | None — the machine gates itself here, before spending user attention |
| Retry ceiling | 3 (`L_AUDIT_FIX`), then escalate into `L_REVISION` accounting |
| Next | `Design Review` (verdict `pass`) / `REVISION` (verdict `fail`) / self-loop (bounded re-audit after in-place minor fix) |

## C.2 Purpose

Machine self-review of the prototype against all upstream specs and quality dimensions **before showing the user**. A `fail` verdict is a normal outcome, not an error.

The audit's job is to find what the builder missed. That means it must be adversarial toward its **own instrument** as much as toward the prototype.

The harness is [`design-toolkit/tools/audit.mjs`](../design-toolkit/tools/audit.mjs): it drives what the audit plan (or the hooks in the state-machine file) names, and reads its floor, palette, viewport and scripts from the generated config. **It produces evidence, not a verdict** — the verdict is this state's, written after the screenshots have been read.

Every check class, every failure-and-fix, the exit-code semantics and the false-positive catalogue: **[validation-engine.md](../Architecture/validation-engine.md)**. Three that bind this state: exit `2` means the check **did not run** — *unevaluable*, never a pass · a failing probe is a hypothesis until confirmed at source · **a failing check not confirmed at source is not eligible for a waiver.**

## C.3 Processing steps

1. Check prototype **conformance** to S03 → S07 → S08.
2. Run the **accessibility + reduced-motion** audit against S07's strategy.
3. Verify **non-happy-path coverage** is present **and reachable**.
4. Detect **inconsistencies, orphan elements, unmet acceptance criteria**.
5. Classify findings by severity (`blocker` / `major` / `minor`).
6. Emit a **pass/fail verdict**.

## C.4 Verification method (hardened)

### M1 — Every check is rendering-class

Assert **computed visibility and geometry**, never DOM presence. `getComputedStyle` visibility/display/opacity, `getBoundingClientRect` width, height and position inside the viewport. A node can exist, lay out, and accept a programmatic click while painting nothing.

### M2 — Look at the render

Screenshot review is a **required** audit step, not a supplement. Capture every screen across locale × theme × reduced-motion × state (one pass per combination in the audit plan), and review the images. A finding class that only a human eye catches is not thereby out of scope.

### M3 — A failing probe is a hypothesis, not a finding

Confirm every failure at source before writing it into the report. Correct the harness and re-run; do not waive, and do not report unconfirmed. The known false-positive classes are in §C.8 B — rule them out first.

### M4 — Sweep the source, not just the surface

Duplicate keys in string/config objects, stale placeholder routes, and per-glyph font fallback are invisible to both assertions and screenshots in at least one locale or theme. Run explicit sweeps: duplicate keys across all files **and** every locale object; every navigation call site resolved to a destination that **paints**; every element carrying a declared script verified on a stack that actually contains that script's face.

### M5 — The verdict is scoped to the bytes it audited

An audit of record is invalidated by any later change to the prototype. Targeted assertions run during a revision round are **not** an audit. Record the exact version audited in `reads_versions`; if the frozen bytes have moved since, re-run before any gate depends on the verdict.

### M6 — Record, do not silently resolve

A conflict between a project acceptance criterion and an external standard, or between two approved artifacts, is **recorded as a finding with a recommendation** — never silently passed and never silently changed. Silently editing one of two disagreeing sources hides the disagreement rather than resolving it.

### M7 — Fidelity: the frame against the render, node by node (v1.11)

For every screen bound to a frame of the product design file, compare the **rendered** screen to the frame on five axes — chrome, reading order, alignment, hierarchy, presentation — using the contract's `Reading order:` / `Chrome / presentation:` / `Alignment:` fields ([screen-contract §4a](../Architecture/screen-contract.md)) as the checklist. Record per screen: `match` / `deviates (finding F-nn, ruling …)`. A screen with every node ID present and a different arrangement is `deviates`, not `match` — presence is not content. **Mandatory whenever a Product Owner handoff authorises implementation without the Design Gate**: it is then the only design review the screens get, and it runs before device proof, not after. Written by a reviewer who did not build the screen.

## C.5 Output — BRD S14 · `design-audit`

```markdown
---
artifact: audit-report
version: audit-<brd-id>-NN
produced_by: self-audit
reads_versions:
  prototype: <proto-<brd-id>-NN — the exact bytes audited>
  S03: <rev>
  S07: <rev>
  S08: <ui-<brd-id>-NN>
  traceability: <trace-<brd-id>-NN>
brd: <brd-id>
verdict: pass | fail
---

# <audit id> — <feature> — verdict: <PASS | FAIL>

## Verdict

<pass|fail> — <N> / <N> acceptance criteria met. <rationale>

## Method

<what was actually run: screens driven, runs, assertion count, screenshots
captured, sweeps executed. Name the check class per M1 — computed visibility
and geometry, not DOM presence.>

## Findings

| ID | Sev | Finding | Caught by | Status |
|---|---|---|---|---|
| AF-1 | blocker | <defect> | screenshot \| assertion \| sweep | fixed in-loop |
| AF-2 | major | <defect> | <method> | open |
| AF-3 | minor | <defect> | <method> | recorded → debt #N |

## Conformance matrix

| AC | Requirement | Met | Evidence |
|---|---|---|---|
| AC1 | <text> | met | <screen + probe or screenshot ref> |
| AC7 | <text> | unmet | <what is missing> |
| AC9 | <text> | waived | <who waived, why, recorded where> |

## Harness corrections

<per M3 — probes that failed and turned out to be the instrument's fault, with
the correction made. Recorded, because an uncorrected harness re-reports them
next run.>

## Known limitations

<carried to the Design Gate for transparent presentation>
```

## C.6 Validation rules

- **V1:** Every acceptance criterion from S03 is marked `met` / `unmet` / `waived` **with evidence**.
- **V2:** Zero unresolved `blocker` findings to pass.
- **V3:** The accessibility audit was **executed**, not skipped.
- **V4:** Verdict ∈ {`pass`, `fail`} with rationale.
- **V5** *(per M1)*: Every check in the method record is rendering-class. A report whose evidence is DOM presence alone does not satisfy V1.
- **V6** *(per M5)*: `reads_versions.prototype` matches the currently frozen prototype bytes. **A stale verdict is not a verdict.**

## C.7 Failure recovery

- A `fail` verdict is a **normal outcome** → deterministic route to REVISION with the findings attached.
- Minor findings may be fixed in place and re-audited via the bounded self-loop (`L_AUDIT_FIX`, ceiling 3), then escalate into `L_REVISION` accounting.
- Internal audit error (e.g. a missing input artifact) → back-transition to the state that owed it. **Do not audit around a missing spec.**

## C.8 Recorded failure modes

### A. Defects invisible to structural assertions

| Case | What happened | Rule |
|---|---|---|
| **View never painted** (blocker) | A screen **never became visible** — the view container is `visibility:hidden` until activated and nothing activated it — and **84/84 DOM assertions still passed**. Caught by looking at a screenshot. | M1, M2 |
| **Geometry defects, four in one flow** | A closed sheet bleeding back into the screen; `scrollIntoView()` pushing the header out of frame; a label ellipsized to its least useful word; an asset crop gap. **Four of that flow's six real defects were screenshot-only finds.** | M2 |
| **Label and glyph out of sync** (major) | A navigation re-cut relabelled a slot but every file kept the **old glyph**. Pre-existing in two **already-approved** files, so the re-cut would have propagated it. | M2 |
| **Duplicate keys** (major) | One file defined two navigation labels **twice** per locale object; the later definition silently clobbered them. **One locale hid it entirely.** | M4 |
| **Stale boundary routes** (major) | **Eleven live boundary call sites** still routed to a placeholder although every destination existed. An earlier *"no boundary mocks left"* claim had been written about one flow and did not hold for the set. | M4 |
| **Script on the wrong stack** (major) | Base token = foreign stack, script token opt-in per component → **138 instances across 7 flows** on an arbitrary fallback. Then the remaining ~40 explicit cases turned out to be the stack itself: **no face for that script at all**. CSS falls back **per glyph**, so the fix is verified per glyph, in every locale. | M4 |
| **Class collisions** | A descendant selector also matched status and lock icons and inflated them to ~340px; an inline badge overflowed its card. Both found by **geometry probes**, not by structure. | M1 |

**The lesson, stated once:** a DOM-assertion suite is not a substitute for looking at the render, and "N/N assertions passed" is a statement about the suite, not about the product.

### B. Harness false-positives — rule these out before reporting

One final audit's first run reported **60 failures; only 3 were real.** A later state probe reported **37 failures and all 37 were the harness.**

| Reported | Reality |
|---|---|
| Hundreds of overflow violations | Inside horizontal **scroll rails** — `genuinelyClipped: 0`. Check overflow **ancestry**. |
| Off-palette hexes across 8 files | The demo bar and device bezel — **harness chrome**. Chrome in its own file is excluded by `review.harnessFiles`; the sweep is file-level, so chrome embedded in a product file is not exempt and should not be. |
| A `#FEED` colour violation | The CSS **id selector** `#feed`. A hex scanner must not read selectors. |
| A foreign-stack token used 27–47× per file | The intended architecture for numerals; the check itself was wrong. |
| A 20px tap target | `::after{inset:-12px}` — an explicit hit-area expansion, commented in source. Measure the **hit area**, not the box. |
| A clipped `<img>` | A deliberate crop — an oversized asset inside `overflow:hidden`. |
| A screen failing to render in one theme | **Timing flake**; renders at every settle when measured. Re-run before reporting. |
| Console errors on nearly every page | An offline webfont CDN and a missing `favicon.ico` — neither belongs to the build. Filter benign entries **by name**, never wholesale. |
| Empty states "fail to paint" | A visible-node threshold tuned to a busy screen. An empty state is **sparse by design**. |
| A hook that renders nothing | The hook named an id the catalogue does not contain and the page threw. A wrong fixture is not a product defect. |

Each was corrected in the harness and the audit re-run — **not waived**.

### C. Recorded, not resolved

- **Interactive targets between the external standard and the project's own claim.** ~140 elements on 20 screens passed WCAG 2.5.8 **AA** (24px) and missed the project's own acceptance criterion of 44px. Pre-existing across four approved gates; raising them would restyle 20 approved screens. A **product decision** — recorded as debt with a recommendation, per M6.
- **Two approved deliverables disagreeing on a data value.** Reported as a conflict for a one-line ruling. Silently editing one to hide it would be worse than the conflict.

---

## Stage exit (all three states)

- [ ] **06:** V1–V4 pass; DS named by source id; screens registered in the Screen Contract; allowlist written to S08 **and** the generated config
- [ ] **07:** V1–V6 pass; harness contract honoured (B7b); every state hooked (B2); supersession stripped and itemised (B7); B8 self-check run
- [ ] **08:** V1–V6 pass; rendering-class evidence; screenshots read; harness corrections recorded; verdict `pass` with zero unresolved blockers
- [ ] Screen Contract Design + Prototype blocks filled for every screen this BRD owns
- [ ] S16 stage-exit entry written

Gates: [ui-review](../Checklists/ui-review.md) (06 exit) · [design-qa](../Checklists/design-qa.md) (08 exit) → `Design Review` ([design-review](design-review.md)).
