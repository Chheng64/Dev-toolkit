# Design — two-phase development: front-end validation, then back-end integration

> **Status:** approved design, not yet implemented
> **Date:** 2026-08-27
> **Scope:** lifecycle states 05–11 (`Dev Planning` → `Merged`), a new Shared Contract artifact,
> the Screen Contract API block, the BRD schema, and the workflows that run those states. Design
> sub-machine states 01–12 are **unchanged**.
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
| **D6** | The contract is a **third artifact** — not a file in the front-end's tree, not a BRD section | Front-end and back-end each implement it; neither reads the other's working context |
| **D7** | Contract home follows project shape: `contracts/<brd-id>/` at a single repo's root, or a bound `resources.contracts` slot when front-end and back-end are separate repos | A monorepo pays for no extra repo; a split project gets no artifact living in one side's house |

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

**D5 (locked decision, §2): two branches, two PRs.** The branch name carries the phase — split
BRDs run `feat/<brd-id>-<slug>-fe` then, cut fresh from main after the FE merge,
`feat/<brd-id>-<slug>-be`; `Phase: single` keeps the unsuffixed `feat/<brd-id>-<slug>`. The FE
branch is merged at the Product Gate and deleted only after the phase flip records the product
freeze sha; see [Workflows/git.md](../../Workflows/git.md) and
[Architecture/brd-schema.md](../../Architecture/brd-schema.md) §1 (`Branch`/`PR`/`FE PR`/`BE PR`).

### 3.2 New BRD property

| Property | Type | Values | Set by |
|---|---|---|---|
| `Phase` | Select | `FE` · `BE` · `single` | orchestrator at `Planning` exit; flipped at `Merged (FE)` |

`Phase` is machine state, never set by hand except to correct a mis-scoped BRD (logged S16).

### 3.3 New guard `C_SERVER_SCOPE`

**Two-step** (amended by the whole-branch review, v2.0.0 — the original single-step form decided
this from S07 at `Planning` exit, but S07 is a `Design` output and does not exist until `Design`
runs; see CHANGELOG `[2.0.0]` Fixed).

**Provisional**, at **`Planning` exit**, from what exists there — S02 business goal/scope, S03
acceptance criteria, S06 risks — logged in S16 with its evidence:

> Does anything imply persistence, authentication, or an external service?

**Confirmed**, at **`Design Review` exit**, against the actual S07 flow transitions once they
exist:

> Does any S07 flow transition touch persistence, authentication, or an external service?

A flip from the provisional value is logged in S16 naming the flow transition that caused it, and
`Phase` is re-tagged before `Dev Planning`.

- **True** → `Phase: FE`, split run.
- **False** → `Phase: single`, one pass.
- BE-only BRDs (jobs, migrations, no UI) are `single` by the same test — no UI to validate, so the
  contract comes from S03/S11 as today.

Deciding it provisionally at `Planning` rather than at `Dev Planning` means the split is known
before design starts, so the design stage knows whether it is feeding a two-pass build; confirming
it again at `Design Review` exit is what makes the decision correct once S07 exists.

### 3.4 Transition deltas

Additions and changes to [workflow-state-machine §3](../../Architecture/workflow-state-machine.md):

| From | Trigger | To |
|---|---|---|
| Planning | Direction approved ∧ `C_SERVER_SCOPE` (provisional) | Design (`Phase: FE`, provisional) |
| Planning | Direction approved ∧ ¬`C_SERVER_SCOPE` (provisional) | Design (`Phase: single`, provisional) |
| Design Review | `C_SERVER_SCOPE` confirmed against S07 (`Phase` re-tagged if it flips, logged S16) | Dev Planning |
| Human Review (`FE`) | approval `product` | Merged (FE) |
| **Merged (`FE`)** | **product freeze recorded** | **Dev Planning (`Phase: BE`)** |
| Merged (`BE` \| `single`) | release steps done | Released |
| any Phase-`BE` state | server constraint contradicts approved FE behaviour | Dev Planning (`Phase: FE`), loop `L_CONTRACT` |

`Merged (FE)` **does not** reach `Released`. Release is a Phase-2 event; a front-end on mocks is
not a shipped product.

## 4. The Shared Contract

The seam between the phases, and **a third artifact**. Front-end and back-end each implement it;
neither reads the other's working context.

```
Front-end ──implements──┐
                        ├──►  Shared Contract  ──►  Integration
Back-end  ──implements──┘      CTR-<brd-id>-v<n>
```

This is the discipline the toolkit already runs on. The Screen Contract holds design-to-development
mappings that neither the BRD nor the code duplicates, and pasting mapping content into the BRD is
listed as an anti-pattern. A back-end planner reading `src/services/**` to learn what the API must
return is the same defect wearing different clothes: it couples two phases through a working tree
instead of through an artifact.

### 4.1 Where it lives

| Project shape | Location |
|---|---|
| Single repo (front-end and back-end in one tree) | `contracts/<brd-id>/` at the repo root — symmetric, both sides are already there |
| Separate bound repos (`repos.frontend` ≠ `repos.backend`) | its own bound registry slot **`resources.contracts`**, consumed by both at a pinned ref |

The manifest decides, so a monorepo never onboards a repo it does not need and a split project never
gets an artifact living in one side's house. Onboarding binds `resources.contracts` only when the
split shape is detected — connect existing / create new, **never skip**: once the shape requires the
slot, it is a required binding and `C_RESOURCES` treats it as one.

### 4.2 What it consists of

| File | Content | Written by |
|---|---|---|
| `contract.ts` | the interface and entity types **both** adapters implement | FE, at Phase-1 exit |
| `contract.md` | per method: inputs, outputs, every error variant, ordering and idempotency assumptions, latency tolerance, and **which S09 state each error renders** | FE, at Phase-1 exit |
| `fixtures/` | the recorded example set — happy, empty, error, slow. Shared examples, not the front-end's private test data | FE, at Phase-1 exit |
| `VERSION` | `CTR-<brd-id>-v<n>` and the product freeze sha it was issued against | FE, at Phase-1 exit |

Written **from what the front-end actually does** — read out of the running app and its mock
adapter, never out of the Phase-1 plan. A contract written from the plan reintroduces exactly the
guessing this design removes.

The front-end's mock adapter and the back-end's real adapter both implement `contract.ts`. The mock
stays private to the front-end; the interface never was.

### 4.3 Identity, versioning, freeze

- Identity `CTR-<brd-id>-v<n>`, issued at Phase-1 exit, frozen by the FE merge sha it names.
- **Superseded, never edited.** A change issues `v<n+1>` naming what it supersedes and why — the
  same discipline as the append-only Decision Log. An edit in place destroys the record of what
  Phase 2 was actually built against.
- BRD **S11 cites** the contract id and version; it does not hold the contract. (This replaces the
  `S11.1 Observed Contract` subsection an earlier draft proposed — same reason the Screen Contract
  keeps mappings out of the BRD: one fact, one home.)
- The Screen Contract API block still carries `demanded` → `provided`, both naming **contract
  methods** — the per-screen view of the same artifact, by reference.

### 4.4 Ownership and isolation

| Role | Reads | Writes |
|---|---|---|
| Front-end, Phase 1 | S03/S06/S07/S09, screen contracts, its own tree | its own tree; **issues** the contract at phase exit |
| Back-end, Phase 2 | **the contract**, S03/S06/S07/S09, screen-contract `demanded` blocks | its own tree; the `provided` blocks |
| Back-end, Phase 2 | — | **never** the contract, **never** front-end behaviour |

New guard **`C_ISOLATION`**, checked at each phase's **Tech Review**, mechanically, off the
touched-areas list S10 already requires:

1. A `Phase: BE` branch touches no front-end paths and no contract files.
2. A `Phase: FE` branch touches no server paths.
3. Violations fail Tech Review with the offending paths named — caught there, not at merge, and
   never settled by discussion.

**Integration is the one bounded exception.** Swapping the real adapter in for the mock touches
front-end *wiring* — the adapter selection point, which `contract.md` names — and never front-end
behaviour. That allowance is declared in the Phase-2 S10 touched-areas list and is one file per
domain. Anything wider is a violation, not a bigger allowance.

### 4.5 How parity is actually enforced (given D3)

The contract is documented, so there is no swap-the-adapter test suite. Three mechanisms carry the
weight instead, in order of cost:

1. **Free — the type system.** Both adapters implement the *same* interface, and it lives in the
   contract rather than in either tree. Shape drift is a compile error, not a review opinion.
2. **Cheap — `contract.md`.** Semantics types cannot express (ordering, idempotency, latency
   tolerance, which error renders which S09 state) live there, and backend planning is required to
   answer every line of it.
3. **Paid once — QA.** Every acceptance criterion verified on mocks in Phase 1 is **re-verified
   integrated** in Phase 2. S13 gains a `Verified on: mocks | integrated` column per AC.

### 4.6 What Phase 2 may not do

A server constraint that contradicts approved front-end behaviour is a **finding plus a Product
Owner ruling before landing** — never a silent redesign of the product to suit the server, and
never a quiet edit of the contract. It back-transitions through `L_CONTRACT` (§5.2), drops the
`product` token, and the front-end reissues `CTR-<brd-id>-v<n+1>`.

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
2. Every method in the cited `CTR-<brd-id>-v<n>` has a `provided` API block in its screen's
   contract, and the shipped real adapter implements the contract interface unmodified.
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
| `Architecture/workflow-state-machine.md` | §2 catalog gains a Phase column · §3 transition deltas (§3.4) · §4 `C_SERVER_SCOPE`, `C_PARITY`, `C_ISOLATION` · §5 per-phase ceilings + `L_CONTRACT` · §6 Product Gate |
| `Architecture/brd-schema.md` | `Phase` property · `Approvals` += `product` · S11 **cites** `CTR-<brd-id>-v<n>` (no new subsection) · S13 `Verified on` column · `Branch`/`PR` gain phase-keyed forms; `FE PR`/`BE PR` added for split BRDs so the Product Gate's approval scope survives the Phase-2 PR overwriting `PR` |
| **`Architecture/shared-contract.md`** *(new)* | the Shared Contract module — location by project shape, file set, `CTR` identity and supersession, ownership and isolation rules (§4) |
| **`Templates/shared-contract.md`** *(new)* | the artifact's shape: `contract.ts` / `contract.md` / `fixtures/` / `VERSION` |
| `Architecture/screen-contract.md` | API block becomes `demanded` → `provided`, both naming contract methods; validation check 5 reads both |
| `Architecture/project-manifest.md` | `phases:` block (`fe_exposure`) · `resources.contracts` slot · contracts path for the single-repo shape |
| `Workflows/project-onboarding.md` | detect project shape; bind `resources.contracts` when front-end and back-end are separate repos |
| `Workflows/product-planning.md` | decide and log `C_SERVER_SCOPE` at exit |
| `Workflows/frontend-planning.md` | plan the adapter interface, the mock adapter and the fixture set; **no server assumptions**; issue the contract at phase exit |
| `Workflows/backend-planning.md` | inputs rewritten: read **the contract** first — `contract.ts`, `contract.md`, `fixtures/`. Front-end source is **not** an input. An endpoint no contract method calls is orphan work |
| `Workflows/implementation.md` | Phase-2 section: adapter swap, real error mapping, mock deletion |
| `Workflows/qa.md` | the two modes of §5.3 |
| `Checklists/qa-testing.md` | every S13 AC row carries `Verified on: mocks \| integrated` matching `Phase` — the mechanism `C_PARITY` check 1 reads; without it the check passes vacuously on a BRD that marks nothing `mocks` |
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
| `Workflows/git.md` | branch convention gains a phase suffix (`-fe`/`-be`) for split BRDs; merge input becomes `product` (`Phase: FE`) or `final` (`Phase: BE` \| `single`); FE branch deletion deferred to the phase flip; BE branch cut from main after the flip |
| `Standards/git-strategy.md`, `Skills/git-manager.md`, `AI/CLAUDE-global.md` | the "one BRD = one branch = one PR" invariant qualified **per phase** |
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
- **No new BRD sections.** S11 gains a citation and S13 a column; no `S17+`. The contract's content
  lives in the contract.
- **No third phase** for infrastructure or release engineering. Integration is a bounded sub-step
  of Phase 2 (§4.4), not a phase of its own.
- **The contract is not a code artifact of either side.** Moving it into the front-end tree "because
  that is where the types are" reverts D6 and re-couples the phases through a working tree.

## 9. Failure modes this design is built against

| Failure mode | The rule that catches it |
|---|---|
| Backend quietly reshapes the product to suit the server | `L_CONTRACT` + `product` token dropped (§4.4) |
| Contract written from the Phase-1 *plan* rather than the running app | the contract is read out of the running app and its mock adapter (§4.2) |
| Mocks ship to production | `C_PARITY` check 3 (§5.4) |
| A front-end on mocks becomes reachable by users | `phases.fe_exposure`, checked at the FE PR (§5.5) |
| Phase-1 loop thrash silently consumes Phase-2's budget | per-phase ceilings, reset logged (§5.2) |
| An AC declared "passing" on the strength of a fixture | S13 `Verified on`, re-verified integrated (§5.3) |
| Small BRDs pay two-phase ceremony for no reason | `C_SERVER_SCOPE` → `Phase: single` (§3.3) |
| Back-end learns the contract by reading front-end source | the contract is a third artifact; FE source is not a backend-planning input (§4, §6) |
| Back-end edits the contract to fit what the server can do | write table + `C_ISOLATION` check 1; changes route through `L_CONTRACT` and reissue (§4.4, §4.6) |
| A phase branch quietly touches the other side's code | `C_ISOLATION` at Tech Review, off the S10 touched-areas list (§4.4) |
| Contract edited in place, so what Phase 2 built against is unknowable | superseded never edited; `v<n+1>` names what it supersedes (§4.3) |
