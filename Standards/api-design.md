# Standard — API Design

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** route handlers, server actions, and any server surface clients consume.

## Rules

### Contracts
1. Every surface has a written contract before implementation (S11): input schema, output schema, error union, auth requirement. Zod schemas ARE the contract — types derive from them, both sides import them.
2. Validate at entry, always: parse input with the schema; invalid → typed 400-class error. Nothing inward of the parse handles raw input.
3. Output is as-declared or a declared error — no undocumented fields leaking, no shape drift between success paths.

### Errors
4. One normalized error shape project-wide: `{ code: <stable-machine-code>, message: <safe-human-string>, details?: <typed> }`. Codes are stable API; messages are presentation.
5. **Nothing internal leaks:** no stack traces, no provider/library error passthrough, no internal state names in responses. Raw cause → logged server-side with correlation id; client gets the normalized code.
6. Error language maps to UX vocabulary (S09): clients can render "Checking your account… failed — retry" states from `code` alone without parsing prose.
7. HTTP semantics honest: 400 caller-fixable, 401 unauthenticated, 403 unauthorized, 404 absent-or-hidden, 409 conflict, 422 semantic rejection, 5xx ours. No 200-with-error-body.

### Mutations & reliability
8. Every mutation states its idempotency story: naturally idempotent, idempotency-key accepted, or explicitly at-most-once with rationale. Retried requests must not double-apply (payments, sends, creates).
9. External-service webhooks: verify signature, tolerate duplicates + out-of-order delivery, process async where latency allows, reconcile on delay (webhook lateness is a normal state, not an error — S09 language applies to the waiting UX).
10. Timeouts on all outbound calls; failure behavior declared per call (retry with backoff / degrade / surface).

### Shape & access
11. Model resources/actions from flows (S07), not from tables — the client consumes intent (`resolve-identity`, `unlock-roadmap`), not schema plumbing.
12. List surfaces: paginated + bounded from day one (cursor preferred), sort/filter contracts explicit. No unbounded queries reachable from clients.
13. Authz per surface, default deny, checked server-side regardless of any client gating; the authz matrix lives in S10.
14. Versioning by additive evolution: add optional fields freely; breaking change = new surface or explicit project decision, never silent mutation of an existing contract.

## Anti-patterns

- Contract-by-implementation ("whatever the handler happens to return").
- Two error formats in one project.
- `catch (e) { return json({ error: e.message }) }` — internals straight to the client.
- Mutations that assume exactly-once delivery from the network.
- Endpoint sprawl: three surfaces doing one flow's job because they mirror three tables.
