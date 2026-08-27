# Template — Security Certificate

> **Module:** Templates
> **Produced by:** [security-certification workflow](../Workflows/security-certification.md) (Security Reviewer), on the `Implementation → QA` edge
> **Lives in:** BRD **S14 · Security Certificate** subsection (append). Guard: `C_SECURITY` ([workflow-state-machine](../Architecture/workflow-state-machine.md) §4)
> **Rule:** a certificate is scoped to the **commit it names**. Branch head moves → certificate stale → delta re-verification, re-issue. A certificate on superseded bytes is not a certificate.

---

```yaml
---
artifact: security-certificate
version: cert-<brd-id>-01          # increments; never overwritten
produced_by: security-certification
certified_commit: <full-sha>       # THE load-bearing field — what was checked
branch: feat/<brd-id>-<slug>
branch_head_at_issue: <full-sha>   # equal to certified_commit, or the certificate is born stale
reads_versions:
  threat_model: S06 rev <n>        # the threat table this verifies against
  authz_matrix: S10 rev <n>
  test_run: <ci-run-or-local-sha>
supersedes: cert-<brd-id>-00       # when re-issued after a delta
verdict: certified | not-certified
issued: <YYYY-MM-DD>
---
```

## 1. Scope of this certificate

State what it covers **inside the claim** — a clearance written about one surface reads as holding for the set.

- **Covers:** `<paths / surfaces / endpoints certified>`
- **Does not cover:** `<untouched areas, third-party infra, anything out of diff>`
- **Diff basis:** `<base-sha>..<certified_commit>` · `<n>` files, `<n>` surfaces added/changed

## 2. Automated evidence

Every row is a command that ran, with its exit code. Unavailable tool = **`gap`**, recorded with what would close it — never a silent skip, never an implied pass.

| Check | Tool + version | Command | Exit | Result | Gap? |
|---|---|---|---|---|---|
| Secret scan | `<tool vX.Y>` | `<command>` | `0` | clean / `<n>` hits | — |
| Dependency audit | | | | `<n>` high / `<n>` critical | — |
| SAST | | | | | `gap: not configured — closes when <x>` |
| License check | | | | | |
| Typecheck + lint + tests | | | | | |

**Every hit is a hypothesis, not a finding.** Confirm at source, correct the instrument, re-run. Unconfirmed scanner output is never reported as a finding and never waived as one.

## 3. Threat-model verification (S06)

Mitigation *claimed* ≠ mitigation *present*. Every row is verified in code, at a location.

| Threat id | Surface / asset | Mitigation (S06) | Implemented at `file:line` | Verified how | Status |
|---|---|---|---|---|---|
| T-01 | | | | test / read / probe | present · missing · partial |

- Threats with no mitigation present → `blocker` finding, no exceptions.
- Surfaces added during Implementation that no threat row covers → the model is stale: append S06, then certify.

## 4. Manual verification

[Checklists/security.md](../Checklists/security.md) run in full for the diff. Record the section results, not just the tick:

| Section | Result | Notes |
|---|---|---|
| Boundaries | clean / `<n>` findings | |
| AuthN/AuthZ | | |
| Secrets & leakage | | |
| Injection & abuse | | |

## 5. Findings

| # | Severity | Attack path | Impact | Location | Fix direction | Status |
|---|---|---|---|---|---|---|
| F-01 | blocker · major · minor | | | `file:line` | | open · fixed in `<sha>` · waived |

Severity floor: **`blocker`** = auth bypass, injection, secret exposure, data-integrity risk. A blocker is never downgraded to ship.

## 6. Waivers

A waiver is a legitimate exit; **silence is not.** Every waiver names all five fields or it is not a waiver.

| Rule / finding | Why accepted | Grantor (user) | Rider debt item | Closing condition |
|---|---|---|---|---|

## 7. Verdict

- **Verdict:** `certified` / `not-certified`
- **Rationale:** `<one paragraph — what was checked, what stands open, why that is acceptable>`
- **Zero open blockers:** yes / no *(no → `not-certified`, route to Implementation)*
- **Residual risk accepted by:** `<user>` on `<date>` (S06 + S16 entries linked) — required when any waiver exists

## 8. Currency record

| Event | Sha | Action |
|---|---|---|
| Issued | `<certified_commit>` | full pass |
| Branch moved | `<new-sha>` | delta re-verification: `<files>` re-checked, `<sections>` re-run → re-issued as `cert-<brd-id>-02` |

Re-verification is **delta-scoped by default** (changed files + any surface they touch) and **full** when the delta touches auth, payment, PII, data export, or any file carrying an S06 mitigation.
