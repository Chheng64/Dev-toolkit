# Standard — Code Quality

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all code; enforced at implementation exit + code-review dimension 3.

## Rules

### Gates (mechanical, non-negotiable)
1. Typecheck clean, lint clean, formatter applied, tests green — before any ready-for-QA claim. Fix, don't suppress; suppressions carry written justification ([typescript.md](typescript.md) rule 2).
2. Warnings are debt with a deadline: new code introduces zero; existing warnings in touched files get fixed or ticketed (S16), not accumulated.
3. Dead code is deleted, not commented out — git history is the archive. No `// old version` blocks, no unused exports, no unreachable branches.

### Testing
4. Test what the AC claims, at the cheapest layer that proves it: pure logic → unit; component behavior/states → component test; critical flows (incl. one recovery path) → e2e. The S11 test plan assigns layers.
5. Tests assert behavior, not implementation: query by role/text like a user ([react] testing-library idiom), assert outcomes not internal calls; snapshot tests only for genuinely stable serialized output.
6. Every S09 state named in the plan has a test forcing it (error thrown, empty list, abort mid-flight). Happy-path-only suites fail review.
7. A test that never failed proves nothing — new tests are watched failing first (or written red→green); regression tests must fail on the pre-fix commit ([debug workflow](../Workflows/debug.md)).
8. Deterministic: no real network/clock/random in unit+component layers — inject/mock at the boundary; flaky tests get fixed or quarantined-with-ticket same day, never retried-until-green.

### Readability & altitude
9. Optimize for the reader: straight-line code over clever, guard clauses over nesting (≤3 levels), functions do one thing at one altitude.
10. Comments state the *why* the code can't (constraints, invariants, spec links) — never narrate the what, never talk to the reviewer. Stale comment = bug.
11. Duplication rule of three: second occurrence may stand; third extracts — to the right home per [folder-structure.md](folder-structure.md) promotion path. Wrong abstraction is costlier than duplication; extract along proven seams only.
12. Magic values get names (`STALE_ENTITLEMENT_TTL_MS`), colocated with their domain.

### Dependencies
13. New runtime dependency = a decision: maintained? typed? size-justified? already-solvable in-stack? Recorded in S10/S16. Micro-utility packages don't pass.
14. Lockfile committed; upgrades deliberate (their own commits), never drive-by alongside feature work.

## Anti-patterns

- Suppression creep as velocity strategy.
- Mock-everything tests asserting mocks called mocks — green and worthless.
- Abstraction speculation ("we might need to swap the ORM") — YAGNI until the third caller exists.
- Drive-by refactors inside feature commits — separate commits or separate BRD.
- "Temporary" hacks without an S16 note — there is no temporary without a ticket.
