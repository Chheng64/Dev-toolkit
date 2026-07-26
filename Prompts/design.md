# Prompt — Design

> **Use:** run UX or UI design passes (design machine states 04–08). One state cluster per pass.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>.
Pass: <UX (states 04–05) | UI planning (06) | Prototype (07) | Self-audit (08)>.
Role: <UX Designer | UI Designer>. Workflow: Workflows/<ux|ui>-workflow.md.

Design system reference: <path/link to DS + Figma refs if any>.
Direction constraints from the gate: <cut-line, approved emphasis>.

Non-negotiables this pass (from the machine):
- UX: every task ≥3 non-happy-path states; every state a recovery route;
  a11y strategy feature-specific; NO screens.
- UI planning: DS-first mapping; every `new` justified; gaps → Extension
  Notes, never silent styling.
- Prototype: pre-build DS check FIRST; all states incl. non-happy reachable;
  tokens by reference; traceability map; run-local.sh.
- Self-audit: adversarial — find your own blockers; a11y + reduced-motion
  actually exercised; verdict with evidence.

Write to <S07/S09 | S08 | prototype dir + S08 | S14 audit subsection>.
Exit through Checklists/<ux-review | ui-review | design-qa>.md — list
untickable boxes plainly.
```

## Notes

- Never run UX and UI in one pass — the altitude separation (structure vs surface) is what the machine enforces.
- Figma present → it guides UX/motion/interaction; the project DS stays implementation source of truth.
- Change requests from Design Review → route per REVISION triage first (root-cause state), then re-run this prompt at that state.
