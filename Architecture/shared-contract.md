# Shared Contract

> **Module:** Architecture / Foundation (v2.0)
> **Status:** Stable
> **Purpose:** The seam between the two development phases. A **third artifact** that the front-end
> and the back-end each implement, so neither reads the other's working context.
> **Gated by:** `C_ISOLATION` (Tech Review, both phases) and `C_PARITY` (Phase-2 QA exit) —
> [workflow-state-machine](workflow-state-machine.md) §4.

## 1. Why it is not in either codebase

The Screen Contract already establishes the rule: one fact, one home, referenced by id. A back-end
planner reading `src/services/**` to learn what an API must return is the same defect as pasting
screen mappings into the BRD — it couples two phases through a working tree instead of an artifact.

```
Front-end ──implements──┐
                        ├──►  Shared Contract  ──►  Integration
Back-end  ──implements──┘      CTR-<brd-id>-v<n>
```

## 2. Location — by project shape

| Project shape | Location |
|---|---|
| Single repo | `contracts/<brd-id>/` at the repo root |
| Separate bound repos (`repos.frontend` ≠ `repos.backend`) | the bound registry slot `resources.contracts`, consumed by both at a pinned ref |

The manifest decides ([project-manifest](project-manifest.md) §3). Onboarding binds
`resources.contracts` only for the split shape; once the shape requires the slot it is a **required**
binding and `C_RESOURCES` treats it as one.

## 3. File set

| File | Content | Written by |
|---|---|---|
| `contract.ts` | the interface and entity types both adapters implement | FE, at Phase-1 exit |
| `contract.md` | per method: inputs, outputs, every error variant, ordering and idempotency assumptions, latency tolerance, which S09 state each error renders, and the **adapter selection point** integration is allowed to touch | FE, at Phase-1 exit |
| `fixtures/` | the recorded example set — happy, empty, error, slow | FE, at Phase-1 exit |
| `VERSION` | `CTR-<brd-id>-v<n>` and the product freeze sha it was issued against | FE, at Phase-1 exit |

Written from what the front-end **actually does** — read out of the running app and its mock
adapter, never out of the Phase-1 plan. A contract written from the plan reintroduces the guessing
the two-phase split exists to remove.

## 4. Identity, versioning, freeze

- Identity `CTR-<brd-id>-v<n>`, issued at Phase-1 exit, frozen by the FE merge sha it names.
- **Superseded, never edited.** A change issues `v<n+1>` naming what it supersedes and why. An edit
  in place destroys the record of what Phase 2 was built against.
- BRD S11 **cites** id + version. The Screen Contract API block carries `demanded` → `provided`,
  both naming contract methods.

## 5. Ownership and isolation

| Role | Reads | Writes |
|---|---|---|
| Front-end, Phase 1 | S03/S06/S07/S09, screen contracts, its own tree | its own tree; **issues** the contract at phase exit |
| Back-end, Phase 2 | the contract, S03/S06/S07/S09, screen-contract `demanded` blocks | its own tree; the `provided` blocks |
| Back-end, Phase 2 | — | **never** the contract, **never** front-end behaviour |

`C_ISOLATION` enforces this mechanically off the S10 touched-areas list. Integration's adapter
wiring is the one bounded exception: one file per domain, the selection point named in
`contract.md`, declared in the Phase-2 S10. Anything wider is a violation, not a bigger allowance.

## 6. Anti-patterns

- The interface living in the front-end tree "because that is where the types are" — reverts the
  artifact to a coupling.
- Back-end editing the contract to fit what the server can do. Route: finding → Product Owner
  ruling → `L_CONTRACT` → front-end reissues `v<n+1>`.
- Fixtures that only cover the happy path — the error, empty and slow examples are the ones the
  back-end's failure behaviour is checked against.
- A contract written at Phase-1 *planning* time. It is issued at Phase-1 **exit**, from observed
  behaviour.
