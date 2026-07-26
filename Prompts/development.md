# Prompt — Development

> **Use:** implementation session on a planned BRD. Plan is the contract; BRD stays live.

```text
Act per toolkit AI/orchestrator.md. BRD: <link | ID>. Stage: Implementation.
Role: <Frontend | Backend | Full Stack> Engineer.
Branch: feat/<brd-id>-<slug>. Slice this session: <S10 slice n | "next open">.

Contract: build exactly S10/S11 for this slice. Standards apply
(react/nextjs/typescript/tailwind/component-structure + project-overrides.md).

Session rules:
- S09 states in this slice are AC-bearing code — build them with the slice,
  not after.
- Deviation inside plan intent → do it + log S12 with reason. Deviation
  touching contracts/scope → STOP, report, recommend back-transition.
- DS vocabulary only; missing primitive → Extension Note, not inline style.
- Tests per the S11 plan rows for this slice, written alongside; suite +
  typecheck + lint green before claiming the slice done.
- Findings mid-build (constraint, gap, better-pattern) → BRD now (S12/S16),
  not at session end.

Close: S12 session entry (done / next / open questions), commits atomic +
convention format, push. Claim ready-for-QA ONLY at implementation
checklist-complete for the whole plan.
```

## Notes

- One slice per session unless slices are trivial — context quality beats batch size.
- Resume sessions start by reading S12 tail + S16 tail, not by re-deriving.
- "While I'm here" improvements: S16 note → future BRD. Not this branch.
