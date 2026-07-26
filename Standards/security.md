# Standard — Security

> **Module:** Standards · Deviations: none for the floor; risk acceptance is a user-signed S06/S16 decision, never a silent skip.
> **Applies to:** all code; verified at review dimension 4 + [../Checklists/security.md](../Checklists/security.md). Defensive scope only.

## Rules

### Trust boundaries
1. Validate every input at every trust boundary — request bodies, params, headers, webhooks, storage reads, URL state — with schemas ([api-design.md](api-design.md) rule 2). Client-side validation is UX; server-side validation is security; both exist, only the server one counts.
2. Client checks are always mirrored server-side: hiding a button is not authorization.
3. Authorization on every surface, default deny, evaluated server-side against the S10 authz matrix. "Internal only" and "unguessable URL" are not authz arguments.
4. Auth semantics precise: authentication (who) ≠ authorization (may) ≠ account existence (auth identity ≠ product profile — name the source of truth per entity, per [backend-planning](../Workflows/backend-planning.md)).

### Secrets & data
5. Secrets live in env/secret managers only — never code, never client bundles (`NEXT_PUBLIC_` audit at review), never logs, never error payloads. `server-only` markers fence secret-touching modules.
6. Log with intent: no credentials, tokens, or raw PII in logs; correlation ids link client-safe errors to server-side detail ([api-design.md](api-design.md) rule 5).
7. Collect minimally, expose minimally: responses return the fields the flow needs, not the row.

### Injection & output
8. Parameterized queries only; no string-built SQL/queries from user input.
9. No `dangerouslySetInnerHTML` with user-influenced content; sanitize at the boundary if rich content is a requirement (decided in planning, not improvised).
10. External URLs/redirects validated against allowlists — no open redirects (intent-preserving return-to params validate their targets).

### Sessions & abuse
11. Cookies: `httpOnly`, `secure`, explicit `sameSite`; session invalidation on privilege change.
12. Mutations protected against CSRF per framework mechanism (server actions' built-in origin checks, or explicit tokens on route handlers).
13. Rate limits on exposed unauthenticated surfaces (auth attempts, webhooks, sends) — bounds decided in planning.
14. Webhooks verify signatures before processing ([api-design.md](api-design.md) rule 9).

### Dependencies & process
15. Dependency risk is real risk: audit signal (`npm audit`/Dependabot) triaged, not muted; new deps pass the [code-quality](code-quality.md) rule 13 gate with maintenance status considered.
16. Every S06 security mitigation is verified present in code at review — claimed ≠ implemented (Security Reviewer's matrix check).

## Anti-patterns

- Security as review-time seasoning — boundaries and authz are planned (S10), built, then *verified*.
- Normalizing exceptions ("just this endpoint skips auth for now").
- Roll-your-own crypto/session/token schemes where the platform provides one.
- Trusting webhook payloads because "they come from the provider".
- Fixing a vuln class in one place — sweep for siblings, add the checklist item (S16 lesson → toolkit).
