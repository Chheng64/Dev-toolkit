# Permission Matrix

> **Module:** Architecture / Foundation
> **Status:** Stable — single source of truth for role × section edit rights
> **Consumed by:** all Skills, brd-update-protocol, orchestrator
> **Rule:** No Skill file may restate or override these rights. Skills reference this matrix by section ID only.

## 1. Legend

- **E** — edit: may write and revise own content in the section (per section's update mode in [brd-schema.md](brd-schema.md))
- **A** — append: may add new entries; may not modify existing content
- **R** — read only
- All roles have **A** on S16 (Decision Log). S16 is append-only for everyone, always.
- **S14 append rights** cover audit findings and gate records — new entries produced by a self-audit or a gate, never edits to another role's review content. UI Designer holds it for the design-audit subsection (design state 08) and the Developer Handoff Gate record (design state 12).

## 2. Matrix

| Role \ Section | S01 | S02 | S03 | S04 | S05 | S06 | S07 | S08 | S09 | S10 | S11 | S12 | S13 | S14 | S15 | S16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Business Analyst | E | E | E | E | E | E | R | R | R | R | R | R | R | R | R | A |
| Product Manager | A | E | A | A | A | A | R | R | R | R | R | R | R | R | R | A |
| UX Designer | R | R | R | R | A | R | E | A | E | R | R | R | R | R | R | A |
| UI Designer | R | R | R | R | A | R | A | E | A | R | R | R | R | A | R | A |
| Design System Engineer | R | R | R | R | A | R | R | E | R | R | A | R | R | R | R | A |
| Frontend Engineer | R | R | R | A | A | R | R | R | R | E | E | E | R | R | R | A |
| Backend Engineer | R | R | R | A | A | R | R | R | R | E | E | E | R | R | R | A |
| Full Stack Engineer | R | R | R | A | A | R | R | R | R | E | E | E | R | R | R | A |
| QA Engineer | R | R | R | R | R | A | R | R | A | R | R | R | E | R | R | A |
| Code Reviewer | R | R | R | R | R | R | R | R | R | R | R | R | R | E | R | A |
| Technical Writer | R | R | R | R | R | R | R | R | R | R | R | R | R | R | E | A |
| Git Manager | R | R | R | R | R | R | R | R | R | R | R | R | R | R | E | A |
| Debug Specialist | R | R | R | R | A | R | R | R | A | R | R | A | A | R | R | A |
| Performance Optimizer | R | R | R | R | A | R | R | R | R | A | R | R | R | A | R | A |
| Accessibility Specialist | R | R | R | R | A | R | A | A | R | R | R | R | R | A | R | A |
| Security Reviewer | R | R | R | R | A | A | R | R | R | A | R | R | R | A | R | A |

## 3. Cross-Domain Findings Protocol

A role that discovers something belonging to a foreign section:

1. Does **not** write into the foreign section.
2. Writes the finding in a section it owns (usually S05 Research Notes via its A right) **and** logs an S16 entry with `Affects: <foreign section ID>`.
3. The owning role applies it on next activation. The orchestrator surfaces open `Affects` entries at stage entry (see [../AI/orchestrator.md](../AI/orchestrator.md)).

Exception — **explicit human override:** the user may direct any role to edit any section. Log the override in S16.

## 4. Enforcement

- [../AI/brd-update-protocol.md](../AI/brd-update-protocol.md) implements these rights at Notion-write time.
- The orchestrator sets `Stage Owner`; Claude acts with exactly one role's rights at a time. Multi-role stages (e.g. Full Stack in Implementation) still act as one declared role per write.
- Violation found in review = process bug: revert the foreign edit, re-route via S16.
