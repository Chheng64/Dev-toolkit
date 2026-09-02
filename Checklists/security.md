# Checklist — Security

> **Gate for:** `C_SECURITY` on the `Implementation → QA` edge — the executable form of [security-certification](../Workflows/security-certification.md). Also runs as code-review dimension 4 ([code-review](../Workflows/code-review.md)), where it **verifies the certificate is current**, rather than repeating it.
> **Standard:** [Standards/security.md](../Standards/security.md) · **Artifact:** [security-certificate](../Templates/security-certificate.md). Defensive verification only. Residual risk acceptance = user-signed S06/S16 entry, never a silent tick.

## Preconditions
- [ ] `certified_commit` recorded **before** any check ran, and equal to the branch head
- [ ] Scope stated inside the certificate: what it covers, what it does not, diff basis `<base>..<head>`
- [ ] S06 threat model present and covering every new/changed surface in the diff (stale → append S06 first, then certify)

## Automated evidence (exit codes, not impressions)
- [ ] Secret scan run — tool, version, command, exit code recorded (unavailable → `gap` + closing condition + manual pattern sweep executed)
- [ ] Dependency audit run — findings at/above `fail_on` triaged, not muted
- [ ] SAST / licence checks run where configured; unconfigured recorded as `gap`
- [ ] Typecheck + lint + test suite re-run by the certifier, output referenced
- [ ] **Every hit confirmed at source** before being reported — unconfirmed scanner output is neither a finding nor a waiver
- [ ] Instrument corrected and re-run wherever it was wrong (a broken tool never reads as a clean pass)

## Threat-model verification (claimed ≠ present)
- [ ] Every S06 mitigation located at `file:line` with its verification method recorded
- [ ] Every threat with no mitigation present → `blocker` finding (never a note)
- [ ] Surfaces added during Implementation appear in the model; additions appended to S06 before certification

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
- [ ] Secret found in history → rotation started, not just deletion (a deleted secret in a pushed commit is a published secret)

## Injection & abuse
- [ ] Queries parameterized; zero string-built queries from input
- [ ] No `dangerouslySetInnerHTML` with user-influenced content (or sanitization decided in planning)
- [ ] Redirect/return-to targets validated (no open redirects)
- [ ] Webhooks: signature verified; duplicate + out-of-order tolerated
- [ ] Rate limits on exposed unauthenticated surfaces

## Verdict & closure
- [ ] Findings classified honestly — `blocker` = auth bypass, injection, secret exposure, data-integrity risk; zero open blockers to certify
- [ ] Every waiver names rule + why + user grantor + rider debt item + closing condition
- [ ] Verdict `certified` / `not-certified` with rationale; certificate written into S14 in the same edit as the S16 entry
- [ ] Vuln found → sibling sweep done, sweep count recorded + S16 lesson (checklist/standard candidate)

## Currency (re-verification)
- [ ] Branch head moved since issue → certificate marked stale, delta re-verified, re-issued with `supersedes`
- [ ] Delta touching auth / payment / PII / data export / any file carrying an S06 mitigation → **full** pass, not delta
- [ ] At Tech Review: certificate exists, verdict `certified`, `certified_commit` equals the final branch head — else re-open certification before reviewing
