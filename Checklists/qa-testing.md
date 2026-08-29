# Checklist — QA Testing

> **Gate for:** `QA` → `Tech Review` ([qa workflow](../Workflows/qa.md)). Evidence per verdict; no pass without proof.

## Entry preconditions
- [ ] `C_SECURITY` held at QA entry: S14 Security Certificate `certified`, `certified_commit` = branch head at entry ([security checklist](security.md))
- [ ] Still holds at exit — QA-loop fixes pushed commits → certificate re-issued against the new head before Tech Review

## Verification (S13)
- [ ] Every AC copied verbatim into a S13 row (no paraphrase drift)
- [ ] Every AC row: `pass`/`fail`/`blocked` + evidence pointer (test name / command output / screenshot)
- [ ] Every S13 AC row carries `Verified on: mocks | integrated` matching the BRD's `Phase` (`Phase: FE` → `mocks`; `Phase: BE` → `integrated`; `Phase: single` → `integrated`) — never omitted, `C_PARITY` check 1 reads this column
- [ ] Untestable-as-written ACs → `blocked` + S16 `Affects: S03` (never reinterpreted)
- [ ] Suite + typecheck + lint re-run by QA, output referenced (implementer claim not trusted)

## Edge-state walk (running app, forced conditions)
- [ ] Every S09 state exercised: behavior verified against spec, result recorded per state
- [ ] Recovery routes tested end-to-end: error → recovery action → context/intent preserved as S07 promised
- [ ] Async/interruption: slow network, mid-flight abort, double-submit, back-button, refresh-during-operation
- [ ] Error language check: no raw internal/provider errors visible anywhere

## Fidelity walk (device, screens with a bound frame)
- [ ] Per screen: the frame beside the shot, compared on chrome · reading order · alignment · hierarchy · presentation; result recorded per screen (`match` / `deviates F-nn`), shots named in walk order
- [ ] Safe area: nothing painted under the status bar or the home indicator on either platform
- [ ] Sheets: present on mount on **every** entry path (push and replace); close control, scrim and hardware back behave per contract; no "view not in window hierarchy" in the iOS log
- [ ] Dev-client floating button hidden before walking (`EXDevMenuShowFloatingActionButton=false`) — it sits on top-right close controls and swallows the tap

## Exploratory sweep
- [ ] Boundaries: empty/max/unicode/paste-junk inputs on every field touched
- [ ] Environment: 360px/768px/1280px viewports, keyboard-only pass, reduced-motion flag on
- [ ] New edge cases found → appended to S09 + bug filed (not silently absorbed)

## Bugs
- [ ] Every bug per [bug-report](../Templates/bug-report.md): exact repro, honest severity, linked AC/state
- [ ] `verified` status only via re-running original repro against the fix
- [ ] Zero open `blocker` at exit (or explicit user waiver in S16)
- [ ] S16 stage-exit verdict written
