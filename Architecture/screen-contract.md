# Screen Contract

> **Module:** Architecture / Foundation (v1.2)
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
- **At onboarding** — known top-level screens seeded with real SCR-IDs, status `planned`, owner `unassigned`, parent flow empty. IDs exist before design/development begin.
- **At UI planning** — flow-implied screens registered per BRD (UX names them, UI planning registers them).

UI planning **claims** seeded rows when a BRD's flows cover them (owner ← BRD-ID, parent flow filled) rather than creating duplicates — one screen, one ID, forever. One screen serving multiple flows lists all parent flows. `C_CONTRACT` validation only evaluates rows owned by the BRD under validation; `unassigned` rows are inert until claimed.

## 3. Per-Screen Contract (`screens/SCR-<nnn>.md`)

Five mapping blocks, filled by the stage that owns each ([../Templates/design-mapping.md](../Templates/design-mapping.md), [frontend-mapping](../Templates/frontend-mapping.md), [api-mapping](../Templates/api-mapping.md) templates):

| Block | Filled at | Owner | Content |
|-------|-----------|-------|---------|
| **Design** | UI planning / prototype | UI Designer | Figma frame + component refs (when manifest has Figma) · DS components + tokens used · states designed |
| **Prototype** | Prototype | UI Designer | prototype route, interactive behaviors wired, recovery routes reachable |
| **Frontend** | Dev Planning | FE Engineer | frontend route, page component file, shared components, layout, state mgmt refs (S10/S11 pointers) |
| **API** | Dev Planning | BE/FS Engineer | required APIs (S11 spec names), request/response models, error states → screen states |
| **QA** | Dev Planning (plan) / QA (verdicts) | QA Engineer | ACs covering this screen, test cases, edge cases (S09 states landing here), a11y checks, responsive checks |

Screens with no API dependencies state `api: none` explicitly — absence is declared, never implied.

## 4. Figma-Optional Rule

`manifest.design.figma_file: null` → Design block maps to **prototype + DS components only**; Figma fields marked `n/a (no figma in manifest)`. Contract validation adapts: the "exists in Figma" check becomes "exists in served prototype". When Figma exists, both prototype and Figma mappings are required and must agree — divergence is a design-qa finding.

## 5. Ownership & Edit Rules

- Contract files follow the same role discipline as BRD sections: each block edited by its owning role (table §3); cross-block findings route via owning BRD's S16 `Affects:`.
- Registry Status advanced only by the stage that completed the work (UI → `designed`/`prototyped`, Implementation → `implemented`, QA → `verified`).
- Contract changes after Design Gate approval = design change → stale-approval rule fires on the owning BRD.

## 6. Validation (the six checks — guard `C_CONTRACT`)

Run at Dev Planning entry, automatically, per owning BRD ([../Checklists/screen-contract.md](../Checklists/screen-contract.md) is the executable form):

1. Every screen named in BRD S07 flows exists in the registry.
2. Every registry entry owned by this BRD has a complete Design mapping (Figma per §4 rule).
3. Every approved (Design-Gate-passed) screen has a Frontend mapping plan.
4. Every Frontend mapping references approved DS components only (no unmapped/one-off components).
5. Every API dependency is documented (API block ↔ S11 contract, or explicit `api: none`).
6. Every screen has QA coverage (ACs + edge cases + a11y + responsive entries).

**Any check fails → workflow stops; validator reports the exact missing mappings; orchestrator routes to the owning stage (registry gap → UX/UI; mapping gap → the block's owner). No partial pass.**

## 7. Anti-Patterns

- Screens born in code that never entered the registry ("quick page") — untracked = unvalidatable; register or delete.
- Mapping content pasted into the BRD (or vice versa) — reference by ID, one source each.
- Reusing a retired SCR-ID.
- Contract updated after approval without the stale-approval consequence.
- `api:` block silently absent instead of explicit `none`.
