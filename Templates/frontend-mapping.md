# Template — Frontend Mapping (Screen Contract block)

> **Use:** the **Frontend** block of `screens/SCR-<nnn>.md`. Filled at Dev Planning by the Frontend Engineer. Spec: [screen-contract](../Architecture/screen-contract.md) §3.

```markdown
## Frontend
- **Frontend route:** /<route>                     <!-- must equal registry route -->
- **Page component:** src/app/<segment>/page.tsx   <!-- or feature entry component -->
- **Feature components:** <src/features/<f>/components/… — from S11 table>
- **Shared/DS components:** <components/ui + components/shared consumed>
- **Layout:** <layout file / route group>
- **State management:** <owner of each screen state: local | context | store — S10 refs;
  state names reuse S07/S09 names>
- **Data:** <RSC props | query lib | none — fetch + cache semantics per S10>
- **States implemented:** <full S09 list for this screen — each with its rendering home>
```

## Rules

- Every component referenced must be an approved DS component or a justified `new` from S08 — validator check 4.
- "States implemented" must equal the Design block's "States designed" list — a state designed but unmapped here fails `C_CONTRACT`.
- Routes match the registry exactly; route changes go through the registry (and stale-approval fires if post-approval).
- Pointers into S10/S11, never duplicated plans — one source of truth per layer.
