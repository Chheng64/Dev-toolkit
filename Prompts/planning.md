# Prompt — Planning

> **Use:** invoke a planning pass (product or dev) with the toolkit contract loaded. Fill `<>`, paste.

```text
Act per toolkit AI/orchestrator.md. BRD: <notion link | BRD-ID>.
Stage: <Planning | Dev Planning>. Role: <Product Manager | Frontend Engineer | Backend Engineer>.

Run the stage per Workflows/<product-planning | frontend-planning | backend-planning>.md:
- Inputs to verify first: <sections per workflow — bounce if missing, don't improvise>
- Constraint focus this pass: <e.g. "webhook delay handling is the risk center">
- My priorities, if they bend defaults: <or "none — toolkit defaults">

Plan against the templates (technical-specification / development-plan).
Surface, don't bury: contradictions with evidence, scope you had to refuse,
alternatives rejected (one line each → S16).
Exit through the stage checklist; list any box you cannot tick and why.
```

## Notes

- Never combine Planning + Dev Planning in one pass — different roles, different gates.
- If the plan reveals upstream gaps, expect a back-transition recommendation, not a patched-over plan; that's correct behavior.
- Output lands in the BRD (S03/S06 or S10/S11), not in chat — chat gets the summary + open questions only.
