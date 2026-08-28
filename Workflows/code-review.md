# Workflow — Code Review

> **Module:** Workflows
> **Stage:** `Tech Review` (lifecycle state 08)
> **Skill:** Code Reviewer (Security Reviewer / Performance Optimizer / Accessibility Specialist append on their dimensions)
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2

## Purpose

Review the full branch diff before it becomes a PR: correctness, standards conformance, security, performance, accessibility, DS conformance, maintainability. Machine gate before human gate — the user's Final Review attention is spent only on work that already passed here.

## Inputs

- QA exit: S13 all-pass, zero open blockers
- S14 Security Certificate, `certified`, naming the current branch head (`C_SECURITY` re-checked here)
- Full branch diff vs main; S10/S11 (plan conformance basis); S12 (deviation log)
- Standards/ + `project-overrides.md`

## Outputs

- S14 Review Summary — findings by dimension + severity, plan-conformance check, verdict `approve` / `request-changes` with rationale
- S16 — verdict record; systemic findings routed via `Affects:`

## BRD Sections It May Update

S14 (edit), S16 (append). **Specialist roles append only, and only where their own matrix row grants it** — Security Reviewer: S05/S06/S10/S14 · Performance Optimizer: S05/S10/S14 · Accessibility Specialist: S05/S07/S08/S14. A specialist writing outside its row routes via S16 `Affects:` instead ([permission-matrix](../Architecture/permission-matrix.md) §3).

## Responsibilities

1. **Plan conformance:** diff ⊆ plan + logged deviations. Unlogged out-of-scope changes → finding (process violation, not just code issue).
2. **Correctness:** logic errors, race conditions, unhandled promise/async paths, state bugs — read the code, don't skim the shape.
3. **Standards conformance:** react/nextjs/typescript/tailwind/naming/structure standards; suppressions justified; boundaries (server/client) sane.
4. **Security dimension — verify the certificate, don't repeat it:** confirm S14 carries a `certified` certificate whose `certified_commit` equals the final branch head; read its scope, gaps and waivers. Stale or missing → stop, re-open [security-certification](security-certification.md), do not review around it. Current → spot-check the highest-exposure claims (authz on new surfaces, secrets, raw-error leakage) and file anything the certificate missed as a finding **against the certification method**, so the checklist gains the rule.
5. **Performance dimension:** render waste (unstable refs, missing memo where measured), bundle additions, unbounded queries, N+1, missing pagination.
6. **Accessibility dimension:** keyboard reachability, focus management, ARIA correctness, contrast tokens, reduced-motion variants present.
7. **DS conformance:** token references only, no one-off styling, extensions went through design-system workflow.
8. **Phase isolation (`C_ISOLATION`, v2.0)** — check the diff's paths against the S10 touched-areas list: a `Phase: BE` branch must touch no front-end paths beyond the declared selection point (one file per domain) and no contract files; a `Phase: FE` branch must touch no server paths. This is a path check, not a judgment call — report the offending paths and stop.
9. Classify findings `blocker`/`major`/`minor` + concrete fix direction. Verdict: zero blockers → `approve`; else `request-changes` → Implementation (`L_REVIEW`).

## Completion Criteria

- [ ] All seven dimensions reviewed — none skipped, each with explicit result (clean or findings)
- [ ] Security certificate present, `certified`, current against the final head; gaps and waivers read and accepted or challenged
- [ ] Every finding: location, severity, why it matters, fix direction
- [ ] Plan-conformance check done; unlogged deviations flagged
- [ ] Verdict written with rationale in S14
- [ ] S16 stage-exit entry written

## Failure & Loops

- `request-changes` → Implementation, ceiling 2 (`L_REVIEW`) → `Blocked` + escalation.
- Finding reveals plan-level flaw → S16 `Affects: S10` and route to `Dev Planning`, not a patch-in-review.

## Common Mistakes

- Reviewing the diff shape, not the behavior — approving well-formatted bugs.
- Style-nit flood drowning the one real blocker — severity discipline is the reviewer's craft.
- Re-litigating approved design/plan decisions — gaps route back via S16; taste disagreements don't.
- Skipping dimensions on "small" diffs — small diffs hide authz misses and error-leak paths just fine.
- Re-running the whole security pass here instead of verifying the certificate — duplicated work that still misses the stale-sha case, which is the one that actually bites.
- Accepting a certificate whose sha predates the QA-loop fixes.
- Fixing while reviewing — reviewer files, implementer fixes; same boundary as QA.
- Rubber-stamping own recent code after a loop — re-review the changed area fully.

## Best Practices

- Read in execution order (entry → data → render), not file order.
- Ask of every new surface: who can call this, with what garbage, and what leaks when it fails?
- Check the diff's *absences*: missing tests for changed logic, missing error states, missing cleanup on unmount/abort.
- Findings reference standards by file+section — teaches the pattern, not just the instance.
- Two clean loops on the same area later? Note the pattern in S16 as toolkit-standard candidate.
