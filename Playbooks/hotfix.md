# Playbook — Hotfix

> **Module:** Playbooks. Production is broken; ship the smallest safe fix fast — reduced ceremony, **not** reduced gates-that-matter. The sanctioned alternative to "quick fix on main" (which stays forbidden).

## Trigger

Live regression/incident: users blocked, data at risk, or revenue path down. Not "small feature I'd like fast" — that's [full-feature](full-feature.md) with small content.

## Sequence (compressed)

1. **Spawn bug BRD** (2 min): title `[BRD-XX-nnn] HOTFIX: <symptom>`, S01 = symptom + impact + first-seen, `Priority: P0`. Cap-exempt: a hotfix may run as a 4th in-flight BRD; note the breach in S16.
2. **Debug** — [debug workflow](../Workflows/debug.md), full method, compressed scope: repro → root cause proven → smallest fix. No mystery patches under pressure — mitigation + honest open bug beats blind fix ([debugging prompt](../Prompts/debugging.md)).
3. **Branch** `fix/<brd-id>-<slug>` from main.
4. **Fix + regression test** — fails-before/passes-after proven. Fix stays minimal: no refactors, no bystander cleanup (S16-note them).
5. **Compressed QA** (not skipped): regression test + suite green + smoke the broken flow + its S09 recovery neighbors + quick boundary check around the change. Evidence in S13 — three rows beat zero rows.
6. **Compressed review**: correctness + security + plan-conformance dimensions minimum (the three that page you at night). S14 verdict.
7. **PR + Final Gate** — [pull-request template](../Templates/pull-request.md) with incident context; **Final Gate stands** (one message; the gate protects against tired-panic-you). CI green.
8. **Merge, deploy, verify live** — smoke the previously-broken flow on production. Watch logs through the smoke window.
9. **Close honest**: S15 hotfix note, root-cause S16 entry, and **mandatory follow-up sweep**: prevention candidates (missing test layer? checklist gap? standard gap?) → toolkit change or seed BRD. Every hotfix feeds prevention or it will repeat.

## What compresses vs what never does

| Compresses | Never |
|-----------|-------|
| Design stages (skipped — no design surface) | Repro before fix |
| Full S09 walk (→ affected neighborhood) | Regression test |
| 7-dimension review (→ 3 core) | Final Gate |
| Analysis depth (S01 symptom-level) | Live verification after deploy |
| | Root-cause honesty (S16) |

## Anti-patterns

- Hotfix scope-creeping into the real fix for the underlying design flaw — ship the tourniquet, BRD the surgery.
- Serial hotfixes on one area without the prevention sweep — the repeat is self-inflicted.
- Skipping the gate because "it's one line" — one-line diffs have taken sites down; the gate takes one message.
