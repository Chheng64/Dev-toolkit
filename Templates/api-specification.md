# Template — API Specification

> **Use:** per server surface, in S11 at planning (contract of record) and beside code for long-lived/public surfaces. Zod schemas are the normative shapes — this doc points at them.

```markdown
# <intent-name>  (e.g. resolve-identity)

<One sentence: what flow step this serves (link S07 task/transition).>

- **Surface:** `POST /api/identity/resolve` | server action `resolveIdentity`
- **Auth:** <requirement per S10 authz matrix; default deny>
- **Idempotency:** natural | key-accepted (`Idempotency-Key`) | at-most-once (<why>)
- **Rate/abuse posture:** <limit or n/a + why>

## Request
- Schema: `ResolveIdentityInput` (src/features/identity/schemas.ts)
- <notes on fields needing context>

## Response (success)
- Schema: `ResolveIdentityResult`
- <semantic notes: which S07 state each result variant drives>

## Errors
| code | HTTP | When | Client behavior (S09 state) |
|------|------|------|------------------------------|
| `profile_missing` | 404 | auth ok, no product profile | → PROFILE_CREATE flow |
| `provider_mismatch` | 409 | … | → recovery route per S07 |
<codes stable API; messages presentation-only; internals never leak>

## External effects
<db writes, external calls, webhooks emitted, cache invalidations (tags)>

## Failure behavior
<timeouts, retries/backoff, partial-failure semantics, webhook-delay handling>
```

## Rules

- Contract frozen before consumption; changes after freeze = additive or explicit re-plan ([api-design](../Standards/api-design.md) rule 14).
- Every error row maps to a client-side S09 state — an error the UX can't render is an unfinished contract.
- Schemas referenced by name+path, never duplicated into the doc.
