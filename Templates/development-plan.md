# Template — Development Plan (S11 structure)

> **Use:** structure for S11 at Dev Planning. The executable half of the plan: files, components, contracts, tests. Implementation should be assembly against this.

```markdown
## S11 · Component Plan & API Notes

### Components
| Component | File | Class | DS assets | States handled | Props contract |
|-----------|------|-------|-----------|----------------|----------------|
| ProfileGate | src/features/identity/components/ProfileGate.tsx | new | Card, Spinner, Alert | LOADING, PROFILE_MISSING, SYNC_FAILED | `{ userId: string; onResolved(p: Profile): void }` |
<class: reuse | extend | new (new needs justification)>

### Hooks / lib
| Unit | File | Responsibility |
|------|------|----------------|

### API surfaces (backend scope)
#### <verb-intent name, e.g. resolve-identity>
- Route/action: `POST /api/identity/resolve` | `resolveIdentity()`
- Auth: <requirement> · Idempotency: <story>
- Input: `<zod schema name>` · Output: `<schema>` 
- Errors: `<code>` → <S09 state it maps to>

### Schema/migration
- <change + rollback path>

### Test plan (AC → test)
| AC | Layer | Test file / name |
|----|-------|------------------|
| AC1.1 | component | ProfileGate.test.tsx · "renders recovery on SYNC_FAILED" |
```

## Rules

- Every S08 inventory component appears; every planned S09 state appears in some component's "states handled".
- Props contracts written as real TS signatures — reviewable now, expensive later.
- Every AC has a test row; an AC with no test row is an unverifiable AC (bounce to planning).
- API names express intent (flows), not tables ([api-design](../Standards/api-design.md) rule 11).
