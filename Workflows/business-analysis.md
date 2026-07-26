# Workflow — Business Analysis

> **Module:** Workflows
> **Stage:** `Analysis` (lifecycle state 01)
> **Skill:** Business Analyst
> **Machine:** [workflow-state-machine.md](../Architecture/workflow-state-machine.md) §2; executes [design-state-machine.md](../Architecture/design-state-machine.md) states 01 `REQUIREMENT_ANALYSIS` + 02 `RESEARCH`

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

- Validation failure → re-run with the failed rule as corrective constraint. Retry ceiling 3 (`L_CLARIFY`) → `Blocked`.
- Research coverage gap → targeted re-run on failed goals only, ceiling 2, then logged `gap` and continue.
- User unavailable at Clarification Gate → `Blocked` (resumable), never guess through a blocking question.

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
