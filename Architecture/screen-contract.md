# Screen Contract

> **Module:** Architecture / Foundation (v1.5)
> **Status:** Stable
> **Purpose:** Single source of truth for **design-to-development traceability**. Canonical mapping per screen: BRD requirements ↔ user flows ↔ Figma ↔ prototype ↔ frontend ↔ API ↔ QA. **Implementation may not begin while the contract is incomplete** — enforced by guard `C_CONTRACT` at Dev Planning entry ([workflow-state-machine.md](workflow-state-machine.md); validator: [../Checklists/screen-contract.md](../Checklists/screen-contract.md)).

## 1. Location & Structure

Lives in the project repo (versioned, diffable, PR-reviewable):

```
screens/
├── registry.md          # master index — every screen, one row
└── SCR-<nnn>.md         # one contract file per screen (mappings)
```

BRD sections reference screens by ID only (S07 flows name them, S08/S11/S13 cite them); the contract files hold the mappings. No mapping content duplicated into the BRD.

## 2. Screen Registry (`screens/registry.md`)

| Field | Content |
|-------|---------|
| Screen ID | `SCR-<nnn>`, allocated from `manifest.screen_contract.next_id`, **never reused** — deprecated screens keep their row, status `retired` |
| Screen Name | stable human name |
| Route | app route (or `modal:`/`sheet:` host route for overlays) |
| Parent Flow | S07 task/flow it belongs to + owning BRD-ID |
| Status | `planned → designed → prototyped → implemented → verified` (regression: allowed, logged in owning BRD S16) |
| Owner | current stage owner role |

Registry rows are created two ways (v1.3):
- **At onboarding** — known top-level screens seeded with real SCR-IDs, owner `unassigned`, parent flow empty. Greenfield screens seed as `planned`; screens that already exist in a shipped app seed as **`implemented (pre-toolkit)`** — an honest state, not a false `planned`. When a BRD first claims a pre-toolkit screen, `C_CONTRACT` requires mappings only for the parts that BRD touches (backfill, not retro-design).
- **At UI planning** — flow-implied screens registered per BRD (UX names them, UI planning registers them).

UI planning **claims** seeded rows when a BRD's flows cover them (owner ← BRD-ID, parent flow filled) rather than creating duplicates — one screen, one ID, forever. One screen serving multiple flows lists all parent flows. `C_CONTRACT` validation only evaluates rows owned by the BRD under validation; `unassigned` rows are inert until claimed.

## 3. Per-Screen Contract (`screens/SCR-<nnn>.md`)

Five mapping blocks, filled by the stage that owns each ([../Templates/design-mapping.md](../Templates/design-mapping.md), [frontend-mapping](../Templates/frontend-mapping.md), [api-mapping](../Templates/api-mapping.md) templates):

| Block | Filled at | Owner | Content |
|-------|-----------|-------|---------|
| **Design** | UI planning / prototype | UI Designer | Figma frame + component refs (when manifest has Figma) · **Reading order · Chrome / presentation · Alignment** per bound frame (§4a) · DS components + tokens used · states designed · deviations from the frame as findings with the ruling that allowed them |
| **Prototype** | Prototype | UI Designer | prototype route, interactive behaviors wired, recovery routes reachable |
| **Frontend** | Dev Planning | FE Engineer | frontend route, page component file, shared components, layout, state mgmt refs (S10/S11 pointers) |
| **API** | Dev Planning | BE/FS Engineer | required APIs (S11 spec names), request/response models, error states → screen states |
| **QA** | Dev Planning (plan) / QA (verdicts) | QA Engineer | ACs covering this screen, test cases, edge cases (S09 states landing here), a11y checks, responsive checks |

Screens with no API dependencies state `api: none` explicitly — absence is declared, never implied.

**The registry is the spine.** Design state 12 derives the **entire** navigation model from these cells ([validation-engine §5](validation-engine.md)). Two consequences: if the diagram and the derivation disagree, **the diagram is wrong**; and a cell carrying prose where an id belongs is a finding (`N10-unparsed`), not a stylistic quibble — it silently drops an edge. Two separators, **not interchangeable**: `states` is **comma**-separated; `entry_from` and `navigates_to` are **pipe**-separated.

**Navigation fields (v1.7, additive).** The Prototype block may carry three extra lines — `entry_from:`, `navigates_to:` (target `SCR-id` + condition per route), `states:` (from the project's normalized state vocabulary). They are **optional and do not affect `C_CONTRACT`**: a screen without them is a complete contract. They exist because design state 12 ([flow-visualization](../Workflows/flow-visualization.md)) derives the navigation map from this registry, and a missing route field is *reported as a finding* against the map, never guessed. Projects with `design.handoff_required: true` fill them at prototype time; everyone else can ignore them.

## 4. Figma-Optional Rule

**No healthy Figma binding** — `manifest.resources.figma.product_design_file` skipped, null, or `health: unreachable` ([project-manifest](project-manifest.md) §3) — → Design block maps to **prototype + DS components only**; Figma fields marked `n/a (no figma in manifest)`. Contract validation adapts: the "exists in Figma" check becomes "exists in served prototype". When a healthy binding exists, both prototype and Figma mappings are required and must agree — divergence is a design-qa finding.

Binding added or restored later: existing `n/a` Design blocks on `verified` screens stay valid as-is; screens not yet past Design Review acquire Figma mappings at their next design touch.

## 4a. Binding Method — the frame governs arrangement (v1.11)

Added after BRD-RP-002 F-29 (2026-08-27): five screens carried every node ID of their frames and still were not arranged like them, because the contracts inventoried nodes and described layout in prose, the frames were read through `get_metadata` (names and x/y only), and nothing executable checked arrangement. The rules below make the frame's authority over arrangement measurable.

1. **Bind with `get_design_context` (layout + screenshot), never `get_metadata` alone.** Metadata cannot show `text-center`, `justify-center`, that a "Mobile header" instance is only the status bar, or that a close control sits above the title. The screenshot is read, not just captured (`M2`).
2. **Three mandatory fields per bound frame in the Design block:**
   - `Reading order:` — top-to-bottom list of the frame's elements, node IDs attached (this is what the arrangement test pins);
   - `Chrome / presentation:` — bar or no bar, capsule position, sheet vs page, what sits behind a sheet, safe-area;
   - `Alignment:` — per text block (centred / start) and per block (vertically centred / anchored).
   A node-ID table without these three is **not** a design mapping (§7).
3. **Precedence, stated per authority.** The frame governs arrangement and hierarchy (which action is primary); the design system governs tokens, skins, type steps and motion; copy comes from the handoff/catalogue. Where the frame draws something the DS cannot express, the DS is extended **additively** and the extension is named in the contract.
4. **Deviation = finding + ruling, before landing.** A screen that departs from its frame on arrangement or hierarchy carries a finding row with the Product Owner's ruling; "composition choice" notes and ethics arguments in the contract are not rulings (`M6`, extended to layout).
5. **One arrangement test per designed screen bound to the product design file** — reading order, alignment and roles asserted on the rendered tree (`readingOrder()` pattern), so the next drift fails a test instead of waiting for a screenshot. Validation check 7 (§6) enforces presence; the fidelity review (`M7`, [ui-workflow](../Workflows/ui-workflow.md) C.4) checks content.

## 5. Ownership & Edit Rules

- Contract files follow the same role discipline as BRD sections: each block edited by its owning role (table §3); cross-block findings route via owning BRD's S16 `Affects:`.
- Registry Status advanced only by the stage that completed the work (UI → `designed`/`prototyped`, Implementation → `implemented`, QA → `verified`).
- Contract changes after Design Gate approval = design change → stale-approval rule fires on the owning BRD.
- **Rebind fallout:** a registry mutation replacing or unbinding a resource that Design/API blocks reference ([project-manifest](project-manifest.md) §3) marks those mappings invalid, regresses the affected screens' status (logged in the owning BRD's S16), and fires the stale-approval rule — a swapped design file is a design change, never silent.

## 6. Validation (the seven checks — guard `C_CONTRACT`)

Run at Dev Planning entry, automatically, per owning BRD ([../Checklists/screen-contract.md](../Checklists/screen-contract.md) is the executable form):

1. Every screen named in BRD S07 flows exists in the registry.
2. Every registry entry owned by this BRD has a complete Design mapping (Figma per §4 rule).
3. Every approved (Design-Gate-passed) screen has a Frontend mapping plan.
4. Every Frontend mapping references approved DS components only (no unmapped/one-off components).
5. Every API dependency is documented (API block ↔ S11 contract, or explicit `api: none`).
6. Every screen has QA coverage (ACs + edge cases + a11y + responsive entries).
7. Every screen at `designed` or beyond whose Design block binds a frame of the **product design file** has an arrangement test naming the screen ID and `readingOrder` (§4a rule 5) — executable form: the project's `arrangement:check` gate.

**Any check fails → workflow stops; validator reports the exact missing mappings; orchestrator routes to the owning stage (registry gap → UX/UI; mapping gap → the block's owner). No partial pass.**

## 7. Anti-Patterns

- Screens born in code that never entered the registry ("quick page") — untracked = unvalidatable; register or delete.
- Mapping content pasted into the BRD (or vice versa) — reference by ID, one source each.
- Reusing a retired SCR-ID.
- Contract updated after approval without the stale-approval consequence.
- `api:` block silently absent instead of explicit `none`.
- **Node inventory as design mapping** — every Figma node ID listed, reading order / chrome / alignment unspecified; the screen then takes the DS defaults and passes every gate while looking nothing like the frame (F-29).
- Reading a frame through `get_metadata` alone and binding from it.
- A recorded "composition choice" standing in for a Product Owner ruling on a frame deviation.
