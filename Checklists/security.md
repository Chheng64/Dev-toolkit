# Checklist — Security

> **Runs inside:** code-review dimension 4; full pass on auth/payment/data-scoped BRDs. Defensive verification ([security standard](../Standards/security.md)). Residual risk acceptance = user-signed S06/S16 entry, never a silent tick.

## Boundaries
- [ ] Every new/changed input surface parses with schema at entry (body/params/headers/webhook/storage/URL state)
- [ ] Every client-side check mirrored server-side
- [ ] Outbound calls: timeouts set; failure behavior declared

## AuthN/AuthZ
- [ ] Every new surface in the S10 authz matrix; checked server-side; default deny
- [ ] No "internal only"/"unguessable URL" authz arguments accepted
- [ ] Identity semantics correct: auth identity vs product profile not conflated; source of truth per entity respected
- [ ] Session/cookie flags: `httpOnly`, `secure`, explicit `sameSite`; invalidation on privilege change
- [ ] Mutations CSRF-protected per framework mechanism

## Secrets & leakage
- [ ] No secrets in code/client bundle (`NEXT_PUBLIC_` audit done) / logs / error payloads
- [ ] Server-only modules fenced (`server-only` marker on secret-touching libs)
- [ ] Error responses normalized: no stack traces, provider passthrough, or internal state names ([api-design](../Standards/api-design.md) rule 5)
- [ ] Responses return needed fields only (no whole-row leaks); no raw PII in logs

## Injection & abuse
- [ ] Queries parameterized; zero string-built queries from input
- [ ] No `dangerouslySetInnerHTML` with user-influenced content (or sanitization decided in planning)
- [ ] Redirect/return-to targets validated (no open redirects)
- [ ] Webhooks: signature verified; duplicate + out-of-order tolerated
- [ ] Rate limits on exposed unauthenticated surfaces

## Closure
- [ ] Every S06 security mitigation verified present in code (claimed ≠ implemented)
- [ ] Dependency audit signal triaged (not muted)
- [ ] Vuln found → sibling sweep done + S16 lesson (checklist/standard candidate)
