# Prompt — Review

> **Use:** Tech Review stage, or a targeted single-dimension review.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>.
Mode: <full Tech Review (Workflows/code-review.md) | dimension pass:
<security | performance | accessibility | DS-conformance> on <scope>>.
Role: <Code Reviewer | matching specialist skill>.

Diff: <branch vs main | PR # | files>. Plan of record: S10/S11.
Deviation log: S12.

Full review: all 7 dimensions explicitly resulted (clean or findings) —
none skipped for diff size. Read in execution order. Check the absences
(missing tests / error states / cleanup / doc updates). Findings:
location, severity (blocker/major/minor), why it matters, fix direction.
Verdict per Checklists/code-review.md.

Dimension pass: run only that dimension + its checklist
(Checklists/<security|performance|accessibility>.md), mechanism-level
evidence, findings → S14 (append), routing via S16.

Discipline:
- Reviewer files, implementer fixes — no fixing mid-review.
- Approved design/plan decisions are not re-litigated; gaps route back
  via S16 `Affects:`, taste goes as non-blocking `minor`.
- Severity honest — loop math depends on it.
```

## Notes

- One real blocker surfaced clearly beats forty nits — write the review so severity is scannable.
- Recurring finding across BRDs → S16 toolkit-candidate note (standard/checklist addition), that's the compounding loop.
