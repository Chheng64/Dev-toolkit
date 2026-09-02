# Workflow — Business Analysis

> **Module:** Workflows
> **Stage:** `Analysis` (lifecycle state 01)
> **Skill:** Business Analyst
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2; executes [design-state-machine.md](../Architecture/design-state-machine.md) states 01 `REQUIREMENT_ANALYSIS` + 02 `RESEARCH`
> **Cloned from:** vendored [`01-requirement-analysis`](../design-toolkit/skills/01-requirement-analysis/SKILL.md) · [`02-research`](../design-toolkit/skills/02-research/SKILL.md) @ `4081c24` — output shapes, V-rules and recovery below are the skills'; only artifact locations are remapped (`requirements.md` → S01–S04, `research.md` → S05).

## Purpose

Convert a raw BRD seed (one-line problem) into a structured, evidence-backed, testable foundation: problem, goal, requirements with falsifiable acceptance criteria, assumptions, constraints, research, risks. Everything downstream traces back to what this stage writes.

## Inputs

- BRD page with S01 seed (≥1 problem line), `Ready` ✓, `Status: Analysis`
- Any attachments/links on the page (briefs, references, prior decisions)
- Open S16 `Affects:` entries targeting S01–S06 (from a previous cycle)

## Outputs

- S01 Problem Statement — problem, who has it, why now
- S02 Business Goal — measurable outcome + success metrics
- S03 Requirements — `R1..Rn`, each with ≥1 falsifiable AC (`AC1.1..`)
- S04 Assumptions & Constraints — each tagged `assumed` | `confirmed`
- S05 Research Notes — themes with resolvable citations, competitor notes, pattern references
- S06 Risks — initial register: risk, severity, mitigation or accept note
- S16 entries — stage enter/exit, clarifications asked/answered, key findings

## BRD Sections It May Update

S01–S06 (edit), S16 (append). Per [permission-matrix.md](../Architecture/permission-matrix.md) — Business Analyst row.

## Responsibilities

1. Parse the request into goals, actors, constraints, **non-goals** (scope fence in S01/S03).
2. Detect ambiguity; classify each open question `blocking` / `non-blocking`. Blocking → **Clarification Gate**: ask the user; answers logged in S16, folded into sections.
3. Classify scope (`small`/`medium`/`large`) — recorded in S03 header. `large` spanning unrelated areas → recommend BRD split before proceeding.
4. Draft ACs that a QA stage can execute: observable behavior, measurable threshold, or verifiable state. "Works well" is not an AC.
5. Research per design-machine state 02: derive questions from requirements, fan out (domain / competitor / pattern / technical constraint), cite every theme, list contradictions openly, map every goal to ≥1 theme or mark `no-research-needed`.
6. Surface assumptions explicitly; never silently promote `assumed` → `confirmed` (confirmation = user answer or cited evidence, logged S16).

## Output shapes (write these into the BRD sections verbatim)

### State 01 → S01–S04

```markdown
---
artifact: requirements
version: req-<brd-id>-NN
produced_by: requirement-analysis
scope_class: small | medium | large
effort_tier: <tier>
---

## Problem statement          [S01]
<normalized one-paragraph statement>

## Goals                      [S02]
- G1: <goal>

## Actors                     [S01]
- <actor>: <role/need>

## Constraints                [S04]
- <constraint>

## Non-goals                  [S01/S03]
- <explicitly out of scope>

## Requirements & acceptance criteria   [S03]
- R1: <requirement>
  - AC1.1: <falsifiable, observable pass/fail condition>

## Assumptions                [S04]
- A1 [assumed|confirmed]: <assumption>

## Open questions             [S16 + Clarification Gate]
- Q1 [blocking|non-blocking]: <question>
```

### State 02 → S05

```markdown
---
artifact: research
version: res-<brd-id>-NN
produced_by: research
reads_versions: { requirements: req-<brd-id>-NN }
coverage: <mapped-or-waived % of goals>
---

## Themes
- T1: <theme statement>
  - sources: [S1, S3]
  - relevance: <which ACs / goals this informs>
  - maps_to: [G1, G2]

## Evidence & citations
- S1 [resolvable]: <claim/finding> — <source: url or reference>

## Competitor notes
- <competitor>: <observation> (sources: [S2])

## Pattern catalog
- P1: <interaction/design pattern> — <where observed> (sources: [S4])

## Constraints
- <technical / domain / regulatory constraint> (sources: [S5])

## Contradictions
- C1: <finding A> vs <finding B> — <both sources cited, left unresolved>

## Goal coverage
- G1 → [T1] | G2 → [T2] | G3 → no-research-needed

## Gaps
- GAP1: <unresolved evidence gap or downgraded theme> [reason]
```

## Validation rules

**State 01:** **V1** ≥1 goal AND ≥1 acceptance criterion · **V2** every requirement has ≥1 falsifiable AC · **V3** no requirement or assumption tagged both `assumed` and `confirmed` · **V4** `open_questions` empty, or every item carries a severity.

**State 02:** **V1** every theme cites ≥1 source · **V2** each goal maps to ≥1 theme **or** is explicitly `no-research-needed` · **V3** contradictions listed, not silently resolved · **V4** **no fabricated citations** — every source resolvable.

Exit 01: rules pass **and** no `blocking` open question remains — resolved by a user answer or an explicit assumption acceptance recorded in S04. Exit 02: rules pass **and** goal coverage ≥ threshold (default 100% mapped-or-waived).

## Completion Criteria

- [ ] S01–S06 populated; no section empty or placeholder
- [ ] Every requirement has ≥1 falsifiable AC
- [ ] No item tagged both `assumed` and `confirmed`
- [ ] Every S02 goal maps to ≥1 S05 theme or `no-research-needed`
- [ ] Every S05 theme cites ≥1 resolvable source; zero fabricated citations
- [ ] Contradictions in evidence listed, not silently resolved
- [ ] No unresolved `blocking` open question
- [ ] Scope class recorded; split recommended if warranted
- [ ] S16 stage-exit entry written

## Failure & Loops

- Validation failure → re-run steps 1–5 **with the failed rule injected as a corrective constraint**. Retry ceiling 3 (`L_CLARIFY`) → `Blocked`.
- Research coverage gap → targeted re-run on failed goals only, ceiling 2, then logged `gap` and continue.
- User unavailable at Clarification Gate → `Blocked` (resumable), never guess through a blocking question.
- Research reveals a requirement is **malformed or contradictory** → back-transition to state 01; the root cause is upstream, and re-researching around a broken requirement produces evidence for the wrong question.
- Repeated fabrication-risk failure → downgrade unreachable themes to a logged `gap` and continue. A `gap` is a visible line; silence is not.

## Approval gate

**Clarification Gate** — fires only when blocking ambiguity exists; no approval otherwise. Gate state persists in `Approvals`, and **an approval is scoped to the artifact version it saw**.

## Common Mistakes

- **Solutioning** — writing implementation ("use a modal", "add a table") into requirements. Requirements state need + outcome; solutions belong to Design/Dev Planning.
- Vague ACs ("fast", "intuitive", "user-friendly") — untestable, QA stage will bounce them back.
- Research theater — citing sources that don't support the claim, or padding S05 with generic filler.
- Swallowing contradictions between sources to look tidy.
- Treating the requester's proposed solution as a requirement without extracting the underlying need.
- Scope creep at birth — packing multiple unrelated features into one BRD.

## Best Practices

- Write the non-goals list early — cheapest scope control that exists.
- Phrase ACs as Given/When/Then or as a measurable assertion; future QA copies them verbatim into S13.
- Keep S05 entries short: claim → evidence → source. Depth goes in linked sources, not prose.
- When evidence contradicts the request, say so in S05 + S16 now — Product Planning needs it for the proceed/re-scope call.
- Number everything (`R`, `AC`, risk IDs). Stable IDs are what makes traceability work downstream.
