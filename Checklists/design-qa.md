# Checklist — Design QA (Self-Audit)

> **Gate for:** design state 08 ([ui-workflow](../Workflows/ui-workflow.md) audit step) → `Design Review`. The machine gating itself before spending human attention. Verdict `pass` requires every box.
> **Normative rules:** `M1`–`M7` (+ `B2`, `B6`, `B8`) in [method-rules](../design-toolkit/docs/method-rules.md); vendored [skill 08](../design-toolkit/skills/08-self-audit/SKILL.md).
>
> **A DOM-assertion suite is not a substitute for looking at the render.** "N/N assertions passed" is a statement about the suite, not about the product.

## Prototype completeness
- [ ] Every S07 flow state represented in the prototype (walk the list, tick each)
- [ ] Every transition wired per flows — including all recovery routes — **and every destination paints** (`B6`), no boundary mock outliving its boundary
- [ ] Every S09 state **reachable by interaction** in the served prototype (not just built)
- [ ] Deep-link hook present per state/variant/error case and recorded in the traceability map (`B2`)
- [ ] `run-local.sh` serves it; player walkable start-to-finish without console errors

## Conformance
- [ ] Every prototype element traces to a spec entry (zero un-specced additions) — and zero leftovers from a superseded rebuild (`B7`)
- [ ] DS pre-build check evidence: every element maps to DS token/primitive/component or a logged Extension Note; the DS is named by source id
- [ ] Zero hardcoded values where a DS entry exists (grep the prototype for raw hex/px against token list)
- [ ] Cross-state consistency: naming, hierarchy, spacing rhythm, motion language uniform
- [ ] **Arrangement fidelity (`M7`)**: every screen bound to a product-file frame compared to its render on chrome · reading order · alignment · hierarchy · presentation, from the contract's §4a fields, each recorded `match` / `deviates (F-nn + ruling)`; the arrangement test exists per screen (`arrangement:check` green)

## Audit method (`M1`–`M4`)
- [ ] Tool runs recorded with their **exit codes** — an exit `2` is *unevaluable*, never counted as a pass ([validation-engine](../Architecture/validation-engine.md) §2)
- [ ] Every check is **rendering-class** — computed visibility and geometry, never DOM presence (`M1`)
- [ ] **Screenshots read**, across language × theme × reduced-motion × state (`M2`) — not just captured
- [ ] Every rendered number read against its own copy (`B8`) — progress fills, counters, ceremony states
- [ ] Every failing probe **confirmed at source** before it is reported; harness corrected and re-run; nothing waived unconfirmed (`M3`)
- [ ] **Source swept**, not just the surface (`M4`): duplicate string/config keys across files *and* locales, stale placeholder routes, per-glyph font fallback on the base stack

## Audit dimensions
- [ ] Accessibility audit executed (not skipped): keyboard walk complete, focus visible + managed, contrast token-pairs verified, semantics correct
- [ ] Reduced-motion variant exercised (OS flag / emulation) — every animation has its fallback
- [ ] Every design-relevant AC marked met/unmet **with evidence**
- [ ] Findings classified `blocker`/`major`/`minor` in S14 design-audit subsection
- [ ] Conflicts between approved artifacts **recorded as findings with a recommendation**, never silently resolved (`M6`)
- [ ] Frame deviations on arrangement/hierarchy carry a **Product Owner ruling**, not a "composition choice" (`M6` extended to layout, `M7`)

## Verdict
- [ ] Zero unresolved `blocker` findings
- [ ] Verdict **scoped to the bytes audited**: `reads_versions` names the exact prototype version (`M5`) — targeted assertions from a revision round are not an audit
- [ ] Known limitations listed transparently at full strength (they go in the gate package)
- [ ] Verdict `pass`/`fail` recorded with rationale in S14 + S16
