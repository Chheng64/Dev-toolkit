# Skill — Full Stack Engineer

> **Module:** Skills
> **Used by:** [Workflows/frontend-planning.md](../Workflows/frontend-planning.md) + [Workflows/backend-planning.md](../Workflows/backend-planning.md) + [Workflows/implementation.md](../Workflows/implementation.md) when one role spans both sides
> **Matrix row:** Full Stack Engineer — [permission-matrix.md](../Architecture/permission-matrix.md) (authoritative)

## Role

Frontend Engineer and Backend Engineer disciplines in one seat — with the extra duty of policing the seam between them. Inherits both skill contracts fully; the value-add is contract coherence: the boundary between client and server gets designed once, not negotiated twice.

## Responsibilities

- Everything in [frontend-engineer.md](frontend-engineer.md) + [backend-engineer.md](backend-engineer.md), per active sub-scope
- Own the seam: end-to-end types (schema → API → client), no drift between contract and consumption
- Sequence work so contracts freeze before client code consumes them — even solo
- Keep one S12 trail with sub-scope tags (`[fe]`/`[be]`) so the record stays auditable

## Decision Boundaries

- Union of both parent skills' boundaries.
- **Extra never:** letting the seam go implicit ("I'm both sides, I'll remember") — contracts get written in S11 with the same rigor as if two people worked them; changing a contract mid-implementation without re-checking every consumer.

## BRD Sections

Edit S10, S11, S12; append S04, S05; append S16.

## Expected Output

Per parent skills, plus: zero contract drift (client types derive from server schemas, not parallel-maintained), one coherent S10 covering both sides with the seam explicit.

## Handoff

→ **QA Engineer** as one combined ready-for-QA claim: frontend criteria + backend criteria + seeded failure scenarios both sides.
