# Standard — Service Contracts

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** any project running two-phase BRDs.
> **Contract module:** [../Architecture/shared-contract.md](../Architecture/shared-contract.md)

## Rules

### The adapter boundary
1. One interface per domain, defined in the Shared Contract, implemented twice: a mock adapter in
   Phase 1, a real adapter in Phase 2.
2. Exactly one **selection point** file per domain chooses the implementation. It is named in
   `contract.md` and is the only file integration may touch on the front-end side.
3. Components never import an adapter implementation. They import the interface and receive the
   implementation through the selection point.

### Fixtures
4. A fixture set is a **recorded example set**, not test data. It is shared: Phase 2 checks its real
   responses against it.
5. Required per method: happy · empty · one per error variant · slow.
6. Every error fixture names the S09 state it renders. An error variant with no fixture is an
   unreachable state at review time.
7. Fixtures are data files, never inline literals — the back-end reads them without running the app.

### Exposure of a front-end merged on mocks
8. A front-end merged to `main` against mocks must not be reachable by users. `phases.fe_exposure`
   decides how: `flag` (default), `route-hidden`, or `staging-only`.
9. If the manifest declares no feature-flag system, the default degrades to `route-hidden` and the
   degradation is logged in S16 — never silently ignored.
10. The control is removed in Phase 2, in the BE PR, and its removal is checked by `C_PARITY`.

## Anti-patterns

- A component that knows whether it is talking to a mock.
- Mock behaviour that no fixture describes ("the mock just returns something sensible") — Phase 2
  cannot implement sensible.
- Deleting the mock adapter before `C_PARITY` runs; demote it to test-only, then delete.
- A second adapter path left wired behind an environment variable — that is a mock in production.
