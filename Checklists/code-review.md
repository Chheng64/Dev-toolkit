# Checklist — Code Review

> **Gate for:** `Tech Review` → `PR` ([code-review workflow](../Workflows/code-review.md)). Seven dimensions, each explicitly resulted — clean or findings; none skipped regardless of diff size.

## Preconditions
- [ ] S13 complete: all ACs pass, zero open blockers (QA actually exited)
- [ ] Full diff vs main reviewed in execution order (not file order)

## Dimension results (each: ✅ clean | findings filed)
- [ ] **1 Plan conformance:** diff ⊆ S10/S11 + logged deviations; out-of-scope changes flagged
- [ ] **2 Correctness:** logic, async/abort paths, race windows, state transitions vs S07 machine
- [ ] **3 Standards:** typescript/react/nextjs/tailwind/naming/structure rules; every suppression justified
- [ ] **4 Security:** boundary validation, authz default-deny on new surfaces, secrets, injection, error-leakage ([security standard](../Standards/security.md))
- [ ] **5 Performance:** unbounded queries, N+1, waterfalls, bundle additions, unmeasured memo-confetti ([performance standard](../Standards/performance.md))
- [ ] **6 Accessibility:** semantics, keyboard, focus management, aria, reduced-motion present ([accessibility standard](../Standards/accessibility.md))
- [ ] **7 DS conformance:** tokens only, no styling forks, extensions went through the DS workflow

## Absences checked (what's NOT in the diff)
- [ ] Missing tests for changed logic
- [ ] Missing error/empty/loading states the plan promised
- [ ] Missing cleanup (unmount/abort/subscription)
- [ ] Docs not updated with behavior ([documentation](../Standards/documentation.md) rule 8)
- [ ] No out-of-phase paths (`C_ISOLATION`, v2.0): a `Phase: BE` diff touches no front-end path beyond the declared selection point and no contract file; a `Phase: FE` diff touches no server path

## Exit
- [ ] Every finding: location, severity, why, fix direction
- [ ] Verdict `approve`/`request-changes` + rationale in S14; S16 entry written
- [ ] Zero `blocker` findings on `approve`
