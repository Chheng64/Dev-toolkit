# Workflow — Security Certification

> **Module:** Workflows
> **Stage:** exit step of `Implementation` (lifecycle state 06) — runs **before** `QA`, gating the edge via `C_SECURITY` ([workflow-state-machine](../Architecture/workflow-state-machine.md) §4). Not a lifecycle `Status` value; the BRD stays in `Implementation` until the certificate issues.
> **Skill:** [Security Reviewer](../Skills/security-reviewer.md) (Backend/Frontend Engineer fixes; reviewer never fixes what it certifies)
> **Standard:** [Standards/security.md](../Standards/security.md) · **Validator:** [Checklists/security.md](../Checklists/security.md) · **Artifact:** [security-certificate template](../Templates/security-certificate.md)

## Purpose

Prove — on the record, against a named commit — that the branch is safe to spend QA and human attention on. Security stops being a late review dimension and becomes a **precondition with an artifact**: what was checked, by what, at which sha, with which threats verified present in code.

Two failures this exists to prevent:
1. **Late discovery.** An authz miss or a leaked secret found at Tech Review has already consumed a full QA cycle, and the fix re-enters QA behind it.
2. **Claimed ≠ present.** S06 lists a mitigation, nobody ever verified it exists in the code that shipped.

## Inputs

- Implementation exit claim: S12 current, typecheck + lint + tests green, branch pushed
- **S06 threat model** — surface → asset → attacker → mitigation → verification method (written at Dev Planning, appended during Implementation when new surfaces appear)
- S10 authz matrix; S11 API contracts (error codes, auth, idempotency)
- Full branch diff `<base>..<head>`; `project-manifest.yaml` `security:` block (scanner commands, `fail_on`, `high_risk_scopes`)
- Open S16 `Affects: S06 / S10` entries

## Outputs

- **S14 · Security Certificate** subsection — the certificate per template: certified commit sha, automated evidence with exit codes, threat-model verification matrix, manual verification results, findings, waivers, verdict `certified` / `not-certified`
- S06 (append) — mitigations verified/missing; residual risks accepted by the user in writing
- S16 — certification verdict, waivers with riders, systemic findings routed via `Affects:`
- On `not-certified`: bug entries routed to Implementation (`L_QA` accounting, ceiling 3)

## BRD Sections It May Update

S14 (append — the certificate), S06 (append), S10 (append — authz gaps), S05 (append), S16 (append). Per [permission-matrix](../Architecture/permission-matrix.md); no edits to another role's content.

## Responsibilities

1. **Freeze the target.** Record `certified_commit` = current branch head before anything runs. Everything below is a claim about *that sha* and nothing else.
2. **Scope the claim.** Name what the certificate covers and what it does not, inside the certificate. A clearance written about one surface gets read as holding for the set.
3. **Run the automated evidence** from the manifest `security:` block — secret scan, dependency audit, SAST/licence when configured, plus typecheck/lint/tests re-run. Record tool, version, command, **exit code**.
4. **Degrade loudly.** A scanner that isn't installed or configured is recorded as `gap: <check> unavailable — closes when <x>`, and its **manual equivalent runs instead** (targeted grep for secret patterns, dependency diff read by hand). Never a silent skip; a gap is a visible line in the certificate, and `fail_on` still applies to what did run.
5. **Treat every hit as a hypothesis.** Confirm at source before reporting: scanners produce false positives at volume, and an unconfirmed finding wastes an Implementation loop. Correct the instrument, re-run, then judge.
6. **Verify the threat model in code.** Every S06 mitigation gets a `file:line` and a verification method. Missing → `blocker`. A surface added during Implementation that no threat row covers means the model is stale: append S06 first, then certify.
7. **Run [Checklists/security.md](../Checklists/security.md) in full over the diff** — boundaries, authN/authZ, secrets & leakage, injection & abuse. Record section results, not just ticks.
8. **Classify honestly.** `blocker` = auth bypass, injection, secret exposure, data-integrity risk. A blocker is never downgraded to ship; it routes back to Implementation.
9. **Waive with all five fields or not at all** — rule, why, grantor (the user, in writing), rider debt item, closing condition. Residual-risk acceptance is a user signature in S06 + S16, never a reviewer's tick.
10. **Issue the verdict** and write the certificate in the same edit as the S16 entry. `certified` → QA may start. `not-certified` → Implementation, with findings ordered by exposure.
11. **Keep it current.** Branch head moves after issue → the certificate is stale. Re-verify the **delta** (changed files + every surface they touch) and re-issue; go **full** when the delta touches auth, payment, PII, data export, or any file carrying an S06 mitigation.

## Completion Criteria

- [ ] `certified_commit` recorded and equal to branch head at issue
- [ ] Scope stated inside the certificate — covered and not covered
- [ ] Every configured check ran with tool, version, command and exit code recorded
- [ ] Every unavailable check recorded as a `gap` with its closing condition, and its manual equivalent executed
- [ ] Every scanner hit confirmed at source before being reported; instrument corrected and re-run where it was wrong
- [ ] Every S06 threat has a mitigation verified at `file:line`, or a `blocker` finding
- [ ] Every new/changed surface in the diff appears in the threat model (stale model → S06 appended first)
- [ ] [Checklists/security.md](../Checklists/security.md) run in full over the diff, section results recorded
- [ ] Zero open `blocker` findings
- [ ] Every waiver carries rule + why + user grantor + rider + closing condition
- [ ] Verdict written with rationale; S14 certificate + S16 entry written in the same edit

Guard: `C_SECURITY` — QA does not start without a `certified` certificate whose `certified_commit` equals the branch head.

## Failure & Loops

- `not-certified` → `Implementation` with findings ordered by exposure. Counts against `L_QA` (ceiling 3) — a security bounce is a QA-loop bounce, not a free round.
- Same class of finding returns after a fix → **route the class, not the instance**: sweep for siblings across the branch, record the sweep count, then re-certify.
- Threat model proves wrong at contract level (authz model doesn't hold) → back-transition to `Dev Planning` via S16 `Affects: S10`; do not patch authorization inside a certification round.
- Scanner infrastructure broken (tool errors, not findings) → fix the instrument, re-run ×2, then record as a `gap` with the error; never let a broken tool read as a clean pass.
- User unavailable to sign a required residual-risk acceptance → `Blocked` (`ambiguity: residual-risk acceptance`), resumable; never self-granted.

## Common Mistakes

- **Certifying the branch instead of a commit.** "The branch is clean" expires the moment someone pushes; a sha does not.
- Reporting raw scanner output as findings — the first run of a new scanner is mostly instrument noise, and every false positive costs an Implementation round.
- Ticking a mitigation because S06 says it exists. S06 is a plan; the code is the fact.
- Treating an unavailable scanner as a pass. A gap that isn't written down reads as "checked, clean" to everyone downstream.
- Reviewer fixing what it certifies — same boundary as QA: reviewer files, implementer fixes, reviewer re-verifies.
- Downgrading an auth bypass to `major` because the release is close.
- Waiving without a rider — an accepted risk with no debt item and no closing condition is an abandoned risk.
- Re-certifying "the whole thing" on every QA-loop commit, then skipping it entirely when time runs short. Delta re-verification is the sustainable middle, and it is the rule.

## Best Practices

- Write the threat model at Dev Planning, then **implement each mitigation in the slice that creates its surface** — certification then verifies, rather than discovering.
- Run the scanners locally during Implementation, not only here; the certificate should confirm what the engineer already knows.
- Keep the manifest `security:` commands honest and current — an aspirational command that fails to run is a gap, and gaps are visible.
- Certify the smallest true scope. A narrow certificate that says exactly what it checked beats a broad one nobody can act on.
- Feed every confirmed finding back: missing checklist item, missing standard rule, or missing test layer → toolkit change or seed BRD. A finding that changes nothing structural will return.
