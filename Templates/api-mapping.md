# Template — API Mapping (Screen Contract block)

> **Use:** the **API** + **QA** blocks of `screens/SCR-<nnn>.md`. API filled at Dev Planning (BE/FS Engineer); QA plan at Dev Planning, verdicts at QA. Spec: [screen-contract](../Architecture/screen-contract.md) §3.

```markdown
## API
<!-- No server dependencies? Write exactly: -->
<!-- api: none -->
- **<intent-name>** (S11: [api-specification](../Templates/api-specification.md) entry)
  - Request model: <schema name + path>
  - Response model: <schema name>
  - Error states → screen states: `profile_missing` → PROFILE_CREATE · `timeout` → SYNC_FAILED …
  - Trigger: <which interaction/state transition calls it>
- …one bullet per required API…

## QA
- **ACs covering this screen:** AC1.1, AC2.3, …          <!-- every screen ≥1 AC -->
- **Test cases:** <named tests from S11 test plan touching this screen>
- **Edge cases:** <S09 states landing here: EMPTY, OFFLINE, SYNC_FAILED …>
- **Accessibility checks:** <keyboard walk, focus mgmt on <interaction>, announcements, contrast pairs>
- **Responsive validation:** 360px ☐ · 768px ☐ · 1280px ☐   <!-- QA ticks at verification -->
- **Verdicts:** <filled by QA: per-check pass/fail + S13 row refs>
```

## Rules

- Absence is declared: screens without server needs carry explicit `api: none` — validator check 5 fails on a missing block, passes on declared none.
- Every error state maps to a screen state the Design block lists — an error the screen can't render is an unfinished contract ([api-design](../Standards/api-design.md) rule 6).
- QA block plan rows are pointers to S03 ACs / S11 tests / S09 states — verdicts and evidence live in S13; the contract holds the coverage map, not the proof.
