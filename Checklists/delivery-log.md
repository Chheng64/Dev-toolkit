# Checklist — Delivery Log (`C_DELIVERY`)

> Validator run at **`Implementation` exit** (and [backend-integration](../Workflows/backend-integration.md) exit) and again at **`Tech Review` → `PR`**. Guard: [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md) §4.
> Mechanical form: `python3 toolkit/tools/delivery-log.py --repo <repo> --branch <branch> --requirements <R-ids from S03> --screens <repo>/screens` — exit 0 passes, exit 1 lists the unbound shas, exit 2 means the run could not judge and is never a pass.
> Any unchecked item → stop, report the unbound shas, route to Implementation. A bounce here does not count against `L_QA`.

## 1. Coverage
- [ ] Every sha in `<base>..<branch>` appears in S17 — no commit is missing a row
- [ ] Every bound repo of a multi-repo BRD was run separately; each row names its `Repo:`
- [ ] Shas without a `Scope:` trailer carry an S17 **backfill row** naming sha (or range), scope and reason
- [ ] No sha was "covered" by rewriting pushed history

## 2. Token resolution
- [ ] Every `R<n>` in a row exists as a requirement in S03
- [ ] Every `SCR-<nnn>` in a row exists in the project's `screens/registry.md`
- [ ] `chore` appears only on commits that deliver no requirement (merge, revert, hygiene, tooling)
- [ ] Every commit touching a screen-bound path names that screen in `Scope:` or `Screen:`

## 3. Properties
- [ ] `Compare` is set and points at the **current phase's** branch
- [ ] `PR` (and `FE PR` / `BE PR` for split BRDs) unchanged by this check — the delivery log never overwrites them
- [ ] At `Merged`: `Merge SHA` set · at `Released`: `Release Tag` set

## 4. Log integrity
- [ ] Rows were appended, never edited; no row was deleted
- [ ] One Notion write per push, carrying that push's rows — not one write per commit
- [ ] Commit rows carry their commit's date; only rollup rows carry the write date
