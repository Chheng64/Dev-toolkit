# Workflow — Backend Planning

> **Module:** Workflows
> **Stage:** `Dev Planning` (lifecycle state 05) — backend scope. Runs only when the BRD has server-side scope; frontend-only BRDs skip it.
> **Skill:** Backend Engineer
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Turn requirements + flows into an executable server-side plan: API contracts, data model, auth, integrations, failure behavior. Frontend planning consumes its contracts; implementation assembles them.

## Inputs

- **The Shared Contract** — `contract.ts`, `contract.md`, `fixtures/`, `VERSION`
  ([shared-contract](../Architecture/shared-contract.md)). For a split BRD this is the primary
  input, and **front-end source is not an input at all**
- `Approvals` contains `product`; the product freeze sha in S08
- S03 ACs, S07 flows, S09 edge cases, screen-contract `demanded:` blocks
- Existing backend architecture (project repo), external service docs
- Open S16 `Affects:` entries targeting S10/S11

## Outputs

- S10 Technical Plan (backend subsection) — architecture, data model changes, authz model, integration points, failure/retry/idempotency strategy, touched-areas list
- S11 API Notes — per endpoint/action: route, method, request/response contract, error contract, auth requirement; consumed by frontend planning
- S16 — decisions with alternatives; discovered constraints via `Affects:`

## BRD Sections It May Update

S10 (edit), S11 (edit), S12 (edit), S04 (append), S05 (append), S16 (append).

## Responsibilities

1. **Derive server work from the contract, not from the flows.** Every method in
   `CTR-<brd-id>-v<n>` gets an endpoint or action satisfying its inputs, outputs, **every error
   variant**, its ordering and idempotency statements, and its latency tolerance. An endpoint no
   contract method calls is orphan work; a contract method with no endpoint is a gap that fails
   `C_PARITY`.
2. Design API per Standards/api-design: consistent naming, typed request/response, **error contract normalized** (no raw provider/internal errors reaching clients — S09 language rules apply).
3. Data model: schema changes, migration plan, ownership of truth (e.g. auth provider identity ≠ product profile — name the source of truth per entity).
4. Failure planning is the core deliverable: timeouts, retries, idempotency keys for mutations, webhook delay/out-of-order handling, partial-failure recovery mapped to S09 states.
5. Authz matrix: who may call what; default deny.
6. **Threat model into S06** — one row per new/changed surface: surface → asset at risk → plausible attacker/abuse → mitigation → **how it will be verified** (test name, code read, probe). This is what [security-certification](security-certification.md) checks against before QA; a mitigation with no verification method is a wish. High-risk findings → S06 via `Affects:`.
7. Security pass with Standards/security: input validation boundaries, secrets handling, rate limits on exposed surfaces.
7. Fill the **API mapping block** of every owned `screens/SCR-<nnn>.md` ([api-mapping template](../Templates/api-mapping.md)) — screens without server needs get explicit `api: none`.
8. Contracts frozen before implementation — frontend plans against them.
9. **Answer every line of `contract.md`.** A method whose error variants are unimplemented has not
   been planned — it has been half-planned, and QA will find the half at integration.
10. **Check the real responses against `fixtures/`.** The fixtures are the recorded shape the
    front-end was approved against; a response that does not match one of them is a contract
    conflict, not a detail.
11. **Never edit the contract.** A server constraint that contradicts approved behaviour is a
    finding plus a Product Owner ruling, routed through `L_CONTRACT`; the front-end reissues
    `v<n+1>`. Editing the artifact in place destroys the record of what Phase 2 was built against.

## Completion Criteria

- [ ] Every server-touching flow transition has a contracted endpoint/action
- [ ] Error contracts defined; user-facing error language normalized
- [ ] Data model + migration plan written; source of truth named per entity
- [ ] Idempotency/retry/webhook behavior specified for every mutation + async integration
- [ ] Authz matrix present; default deny
- [ ] S06 threat model covers every new/changed surface, each row naming its mitigation **and its verification method**
- [ ] Touched-areas list present; conflict check done
- [ ] S16 stage-exit entry written
- [ ] Every `CTR-<brd-id>-v<n>` method has a contracted endpoint/action, error variants included
- [ ] Every screen-contract `demanded:` line has a planned `provided:` line
- [ ] Real response shapes checked against `fixtures/`
- [ ] Zero edits to the contract artifact from this stage

## Failure & Loops

- Flow ambiguity about server behavior → back to `Design` with the question named — don't invent product behavior server-side.
- External service constraint invalidates a requirement → S16 `Affects: S03`.

## Common Mistakes

- Happy-path APIs — no error contract, no idempotency, webhooks assumed instant and ordered.
- Leaking internals: raw provider errors, stack traces, or internal state names in responses.
- Conflating identities (auth record exists ≠ product account exists) — name the true source per entity.
- Designing endpoints from data shape instead of from flows — produces chatty or orphan APIs.
- Unbounded queries — no pagination/limits on list surfaces.
- Deferring authz ("add permissions later") — authz is contract, not polish.
- A threat row whose mitigation is "validate input" with no schema named and no verification method — unverifiable at certification, so it bounces the branch.
- Reading the front-end's source to work out what the API should return. That is the coupling the
  contract exists to remove, and `C_ISOLATION` will fail the branch that acts on it.
- Implementing the happy path of a contract method and deferring its error variants — the front-end
  already renders S09 states for them, and they were approved.
- "Adjusting" the contract because the server cannot do it that way. Route it; do not edit it.

## Best Practices

- Write contracts as TypeScript types/zod schemas in the plan — they become the implementation's source files.
- Every async boundary gets explicit user-visible states (frontend consumes: pending/retrying/failed language from S09).
- Plan the rollback path for every migration.
- Prefer one boring pattern (route handlers or server actions) per project — consistency beats per-feature optimization; deviations go to `project-overrides.md`.
