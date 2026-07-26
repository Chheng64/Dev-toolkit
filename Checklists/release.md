# Checklist — Release

> **Gate for:** `Merged` → `Released` ([release workflow](../Workflows/release.md)). The last chance to catch a regression before the BRD closes.

## Preconditions
- [ ] `Approvals: final` current — zero commits after approval (else back to Human Review)
- [ ] Merged to main; main CI green post-merge
- [ ] 100% ACs `pass` or user-waived in S16 (final completeness check — unmet AC → do NOT ship, route back)

## Ship
- [ ] Deploy executed per project convention (or `no-deploy` + reason recorded)
- [ ] **Smoke-check live:** primary flow walked on the deployed target
- [ ] **Smoke-check live:** ≥1 S09 recovery path walked on the deployed target
- [ ] No new errors in logs/monitoring during smoke window

## Record
- [ ] S15 written per [release-notes template](../Templates/release-notes.md): outcome language, honest limitations, each limitation's fate stated
- [ ] Deferred-items sweep: S03 `deferred` + S13 `minor` + open S16 notes → BRD-seed candidates listed in terminal entry (nothing evaporates)
- [ ] Terminal S16 entry: date, version/tag, deploy target, toolkit version
- [ ] `Status: Released`; branch deleted post-confirmation
- [ ] Retro trigger check: ceiling hits / gate denials / >1 revision cycle → schedule [retrospective](../Templates/retrospective.md)
