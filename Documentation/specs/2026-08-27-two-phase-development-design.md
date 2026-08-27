# Design — two-phase development: front-end validation, then back-end integration

> **Status:** approved design, not yet implemented
> **Date:** 2026-08-27
> **Scope:** lifecycle states 05–11 (`Dev Planning` → `Merged`), the Screen Contract API block,
> the BRD schema, and the four workflows that run those states. Design sub-machine states 01–12
> are **unchanged**.
> **Spec location note:** filed under `Documentation/` for the reason given in
> [2026-08-26-feature-prototype-design.md](2026-08-26-feature-prototype-design.md) — a second
> docs root in a toolkit this opinionated about structure is a defect, not a convenience.

## 1. Problem

One `Implementation` stage builds front-end and back-end together, against S10/S11 plans written
at `Dev Planning` — before either exists. The back-end contract is therefore **derived from
documents**: S03 acceptance criteria and S07 flows, read by a planner who has never seen the
product run.

Three costs follow, all of them paid late:

| Cost | Where it surfaces today |
|---|---|
| Contract churn — the screen needs a field, an error variant, or an ordering the API never planned | mid-`Implementation`, after server code exists |
| Product problems — the experience is wrong, not the code | `Human Review`, after both halves are built |
| Gate overload — one Final Gate carries "is this the product?" **and** "is this correct code?" | every BRD |

The prototype does not solve this. It is throwaway HTML in `design/prototype/<brd-id>/`: it proves
*arrangement and flow*, and deliberately proves nothing about data shape, error variants, latency
or state ownership in real code.

**The fix is ordering.** Build the front-end first, against mocks, until a human approves the
running product. The approved front-end is then the executable specification the back-end derives
its contract from — observed behaviour instead of guessed requirements.

## 2. Decisions taken

Five decisions were settled during brainstorming and constrain everything below.

| # | Decision | Consequence |
|---|---|---|
| **D1** | The Phase-1 artifact is **real front-end code on mocks** — production FE in the repo, data behind an adapter interface with a mock adapter and fixtures | Not the throwaway prototype. The reviewed artifact is the app |
| **D2** | The split applies **only to BRDs with server scope** | FE-only and BE-only BRDs run `Phase: single` and behave exactly as v1.10.0 |
| **D3** | The contract handed to Phase 2 is **documented** (S11), not an executable swap-suite | Parity is pinned where it is free — see §4.3 |
| **D4** | Phase 1 keeps **two** human stops: Design Gate on the prototype, Product Gate on the running FE | A wrong design is caught before FE code exists; the product is approved on real code |
| **D5** | **Two branches, two PRs.** FE merges to `main` behind an exposure control | The approved front-end is frozen in `main` as the spec |

## 3. Machine shape

### 3.1 The two passes

The 13 `Status` values are unchanged. The build segment `Dev Planning → Implementation → QA →
Tech Review → PR → Human Review → Merged` runs **twice** for server-scope BRDs.

```
Ready → Analysis → Planning →[Direction]→ Design → Design Review →[Design]→
  ┌ Phase = FE ─────────────────────────────────────────────────────┐
  │ Dev Planning → Implementation →🔒→ QA → Tech Review → PR →       │
  │ Human Review ═[PRODUCT GATE]═ → Merged (FE)                     │
  └───────────────────────────┬─────────────────────────────────────┘
                     phase flip · product freeze (sha)
  ┌ Phase = BE ───────────────▼─────────────────────────────────────┐
  │ Dev Planning → Implementation →🔒→ QA → Tech Review → PR →       │
  │ Human Review ═[FINAL GATE]═ → Merged (BE) → Released            │
  └─────────────────────────────────────────────────────────────────┘
```

`Phase: single` runs the segment once, ending at the Final Gate — the v1.10.0 path exactly.

### 3.2 New BRD property

| Property | Type | Values | Set by |
|---|---|---|---|
| `Phase` | Select | `FE` · `BE` · `single` | orchestrator at `Planning` exit; flipped at `Merged (FE)` |

`Phase` is machine state, never set by hand except to correct a mis-scoped BRD (logged S16).

### 3.3 New guard `C_SERVER_SCOPE`

Decided at **`Planning` exit**, logged in S16 with its evidence:

> Does any S07 flow transition touch persistence, authentication, or an external service?

- **True** → `Phase: FE`, split run.
- **False** → `Phase: single`, one pass.
- BE-only BRDs (jobs, migrations, no UI) are `single` by the same test — no UI to validate, so the
  contract comes from S03/S11 as today.

Deciding it at `Planning` rather than at `Dev Planning` means the split is known before design
starts, so the design stage knows whether it is feeding a two-pass build.

### 3.4 Transition deltas

Additions and changes to [workflow-state-machine §3](../../Architecture/workflow-state-machine.md):

| From | Trigger | To |
|---|---|---|
| Planning | Direction approved ∧ `C_SERVER_SCOPE` | Design (`Phase: FE`) |
| Planning | Direction approved ∧ ¬`C_SERVER_SCOPE` | Design (`Phase: single`) |
| Human Review (`FE`) | approval `product` | Merged (FE) |
| **Merged (`FE`)** | **product freeze recorded** | **Dev Planning (`Phase: BE`)** |
| Merged (`BE` \| `single`) | release steps done | Released |
| any Phase-`BE` state | server constraint contradicts approved FE behaviour | Dev Planning (`Phase: FE`), loop `L_CONTRACT` |

`Merged (FE)` **does not** reach `Released`. Release is a Phase-2 event; a front-end on mocks is
not a shipped product.

## 4. The Product Contract

The seam between the phases. Frozen at `Merged (FE)`.

### 4.1 What it consists of

| Part | Location | Written by |
|---|---|---|
| Adapter interface + entity types (TypeScript) | `src/services/<domain>/types.ts` (default; overridable per stack profile) | FE, Phase 1 |
| Mock adapter + fixtures — including error, empty, and slow cases | `src/services/<domain>/mock.ts`, `fixtures/` | FE, Phase 1 |
| **S11.1 Observed Contract** — per adapter method: inputs, outputs, every error variant, ordering and latency assumptions, and **which S09 state each error renders** | BRD S11 subsection | FE, at Phase-1 exit |
| Screen Contract API block: `demanded` at Phase-1 exit → `provided` + agreement in Phase 2 | `screens/SCR-<nnn>.md` | FE demands, BE provides |

S11.1 is written **from what the front-end actually does** — read out of the mock adapter and the
running app, never from the Phase-1 plan. A contract written from the plan reintroduces exactly the
guessing this design removes.

### 4.2 The freeze

The FE merge commit sha is the **product freeze**, recorded in S08 and S16. It is the artifact the
`product` approval token is scoped to. Any later change to front-end behaviour fires the existing
stale-approval rule: the `product` token is removed and Phase 2 stops until it is re-granted.

### 4.3 How parity is actually enforced (given D3)

The contract is documented, so there is no swap-the-adapter test suite. Three mechanisms carry the
weight instead, in order of cost:

1. **Free — the type system.** The real adapter implements the *same* TypeScript interface as the
   mock. Shape drift is a compile error, not a review opinion.
2. **Cheap — S11.1.** Semantics that types cannot express (ordering, idempotency, latency
   tolerance, which error renders which S09 state) live in the Observed Contract, and backend
   planning is required to answer every line of it.
3. **Paid once — QA.** Every acceptance criterion verified on mocks in Phase 1 is **re-verified
   integrated** in Phase 2. S13 gains a `Verified on: mocks | integrated` column per AC.

### 4.4 What Phase 2 may not do

A server constraint that contradicts approved front-end behaviour is a **finding plus a Product
Owner ruling before landing** — never a silent redesign of the product to suit the server. It
back-transitions through `L_CONTRACT` (§5.2) and drops the `product` token.

This mirrors the rule already in force for bound-frame deviations
([screen-contract §4a](../../Architecture/screen-contract.md)): the authority that governs a
question is named, and departures from it are ruled on, not absorbed.

## 5. Gates, loops, QA

### 5.1 Gates — still four

| Gate | Token | Blocks | Scoped to |
|---|---|---|---|
| Direction | `direction` | entering Design | S01–S06 content seen |
| Design | `design` | entering Dev Planning | prototype + S07–S09 seen |
| **Product** *(new)* | `product` | leaving Phase 1 | **the running FE at the FE PR head sha** + the frozen prototype version + the S07/S09 walk evidence |
| Final | `final` | merging Phase 2 | BE PR diff + integrated BRD state seen |

The Product Gate **is** Phase-1's `Human Review` — one stop covering the running product and the FE
PR, not two. Total human stops per server-scope BRD: four — one more than a v1.10.0 BRD.

`Approvals` gains the value `product`.

### 5.2 Loops

| Loop | Path | Ceiling | Notes |
|---|---|---|---|
| `L_QA`, `L_REVIEW`, `L_HUMAN` | unchanged | unchanged | **Per phase.** `Loop Count` resets at the phase flip, logged S16 |
| **`L_CONTRACT`** *(new)* | Phase `BE` → Phase `FE` `Dev Planning` → back | **2** | Fires when approved FE behaviour proves unbuildable or wrong. Drops the `product` token. Breach → `Blocked` + escalation summary |

Per-phase ceilings matter: Phase-1 thrash must not consume Phase-2's revision budget, and a BRD
that burned three QA loops on the front-end is not thereby forbidden from fixing an integration bug.

### 5.3 QA in two modes

| | Phase 1 (mocks) | Phase 2 (integrated) |
|---|---|---|
| **Scope** | every FE-observable AC · every S09 state reachable · a11y · responsive · arrangement tests | every Phase-1 AC **re-run integrated** · server-only ACs · integration edges: latency, ordering, partial failure, retry, webhook delay |
| **Evidence** | recorded against the mock fixture set | recorded against the real service |
| **S13** | `Verified on: mocks` | `Verified on: integrated` |

An AC that passes on mocks and fails integrated is a **blocker**, not a note.

### 5.4 New guard `C_PARITY`

Checked at **Phase-2 QA exit**:

1. Every AC marked `mocks` in S13 also carries an `integrated` verdict.
2. Every adapter method in S11.1 has a `provided` API block in its screen's contract.
3. **Zero live mock paths in shipped code** — the mock adapter is deleted or demoted to
   test-only. Supersession deletes (`B7`); a dual path left wired is a mock in production.
4. The Phase-1 exposure control (§5.5) is removed, and its removal is in the BE PR diff.

Fail → stop, report, route to Implementation (`Phase: BE`).

### 5.5 Exposure of the merged front-end

A front-end merged to `main` on mocks must not be reachable by users. New manifest key:

```yaml
phases:
  fe_exposure: flag | route-hidden | staging-only   # default: flag
```

Resolution rule, so nothing is ambiguous: if the manifest declares a feature-flag system, `flag`
uses it; if it does not, the default degrades to `route-hidden` and the degradation is logged S16.
Checked at the **FE PR**, and again at `C_PARITY` (the control is removed in Phase 2, deliberately,
as part of the BE PR).

### 5.6 Security

`C_SECURITY` is unchanged and fires **once per phase** — each phase produces code and each phase
ends in a certificate against its own branch head.

| Phase | Certificate scope |
|---|---|
| FE | client surfaces: storage of tokens/PII, redirect targets, injection sinks, exposure control present |
| BE | server surfaces: authz matrix, input schemas, secrets, rate limits, error normalization |

## 6. Modules to change

| Module | Change |
|---|---|
| `Architecture/workflow-state-machine.md` | §2 catalog gains a Phase column · §3 transition deltas (§3.4) · §4 `C_SERVER_SCOPE`, `C_PARITY` · §5 per-phase ceilings + `L_CONTRACT` · §6 Product Gate |
| `Architecture/brd-schema.md` | `Phase` property · `Approvals` += `product` · S11.1 subsection · S13 `Verified on` column |
| `Architecture/screen-contract.md` | API block becomes `demanded` → `provided`; validation check 5 reads both |
| `Architecture/project-manifest.md` | `phases:` block (`fe_exposure`) |
| `Workflows/product-planning.md` | decide and log `C_SERVER_SCOPE` at exit |
| `Workflows/frontend-planning.md` | plan the adapter interface, the mock adapter and the fixture set; **no server assumptions** |
| `Workflows/backend-planning.md` | inputs rewritten: read the frozen adapter, the fixtures and S11.1 **first**. An endpoint no adapter method calls is orphan work |
| `Workflows/implementation.md` | Phase-2 section: adapter swap, real error mapping, mock deletion |
| `Workflows/qa.md` | the two modes of §5.3 |
| **`Workflows/product-validation.md`** *(new)* | Phase-1 exit conduct: run the app, walk every S07 flow and every S09 state on real code, assemble the decision package for the Product Gate |
| **`Workflows/backend-integration.md`** *(new)* | the seam work as its own module — named to avoid collision with the existing `integration-validation.md`, which is about onboarding integrations |
| `Checklists/development-ready.md` | phase-scoped exit criteria |
| **`Checklists/product-validation.md`** *(new)* | the Product Gate validator |
| **`Checklists/integration-parity.md`** *(new)* | the `C_PARITY` validator |
| **`Standards/service-contracts.md`** *(new)* | adapter pattern, fixture discipline, exposure-control rule |
| `Skills/frontend-engineer.md`, `backend-engineer.md`, `qa-engineer.md` | phase ownership |
| `Playbooks/full-feature.md` | sequence table gains phase rows |
| `Playbooks/design-only.md`, `hotfix.md` | declare `Phase: single` |
| `AI/orchestrator.md` | phase-aware resume, phase flip, gate presentation |
| `AI/model-routing.md` | tiers for the two new workflows |
| `README.md`, `Documentation/module-index.md`, `Documentation/CHANGELOG.md` | machine diagram, index rows, release notes |

## 7. Version and migration

**v2.0.0.** Projects must make two Notion edits: add the `Phase` select (`FE`, `BE`, `single`) and
add `product` to the `Approvals` multi-select.

Migration is one rule: **every existing BRD becomes `Phase: single`** and behaves exactly as it did
under v1.10.0. In-flight BRDs are unaffected mid-flight; the split applies to BRDs that pass
`Planning` under v2.0.0.

## 8. Non-goals

- **No executable contract suite.** D3 was decided deliberately; §4.3 is the whole enforcement
  story. Anyone adding a swap-the-adapter suite later is changing the decision, not filling a gap.
- **No release of the front-end to users** between phases. `Merged (FE)` is a spec freeze.
- **No changes to design states 01–12.** The prototype, its rules and the Design Gate stand.
- **No new BRD sections.** S11.1 is a subsection and S13 gains a column; no `S17+`.
- **No third phase** for infrastructure or release engineering.

## 9. Failure modes this design is built against

| Failure mode | The rule that catches it |
|---|---|
| Backend quietly reshapes the product to suit the server | `L_CONTRACT` + `product` token dropped (§4.4) |
| Contract written from the Phase-1 *plan* rather than the running app | S11.1 is read out of the adapter and the app (§4.1) |
| Mocks ship to production | `C_PARITY` check 3 (§5.4) |
| A front-end on mocks becomes reachable by users | `phases.fe_exposure`, checked at the FE PR (§5.5) |
| Phase-1 loop thrash silently consumes Phase-2's budget | per-phase ceilings, reset logged (§5.2) |
| An AC declared "passing" on the strength of a fixture | S13 `Verified on`, re-verified integrated (§5.3) |
| Small BRDs pay two-phase ceremony for no reason | `C_SERVER_SCOPE` → `Phase: single` (§3.3) |
