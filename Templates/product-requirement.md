# Template — Product Requirement (S03 entry format)

> **Use:** every requirement written into S03 during Business Analysis follows this shape. Uniformity is what makes traceability + QA mechanical.

```markdown
### R<n> — <requirement name>
- **Statement:** As <actor>, <need>, so that <outcome>.
- **Priority:** (set in Planning) P0-must | P1-should | P2-could | deferred
- **Rationale:** <why this exists — evidence link to S05 theme or user ask>
- **Acceptance criteria:**
  - AC<n>.1 — Given <context>, when <action>, then <observable, falsifiable outcome>.
  - AC<n>.2 — …
- **Edge scope:** <which S09 states this requirement owns, once UX enumerates>
- **Status:** draft | validated | in-build | verified | dropped (see S16)
```

## Rules

- IDs stable forever: never renumber; dropped requirements keep their ID with `dropped (see S16)`.
- Every AC falsifiable by a QA stage that never met the requester: observable behavior, measurable threshold, or verifiable state. Words banned in ACs: *fast, easy, intuitive, clean, properly, correctly* (unquantified).
- One requirement = one need. "And" in the statement is usually two requirements.
- Non-functional requirements (perf budgets, a11y beyond floor) are requirements too — same format, measurable ACs (`LCP < 2.5s on /r/{token} at P75`).
- Traceability chain this format feeds: R → AC → S07 task → S11 test → S13 verification row. Break the format, break the chain.
