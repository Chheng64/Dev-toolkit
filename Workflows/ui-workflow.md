# Workflow — UI

> **Module:** Workflows
> **Stage:** `Design` (lifecycle state 03, second half) → hands to `Design Review`
> **Skill:** UI Designer (Design System Engineer supports on DS gaps)
> **Machine:** executes [design-state-machine.md](../Architecture/design-state-machine.md) states 06 `UI_PLANNING` + 07 `PROTOTYPE` + 08 `SELF_AUDIT`

## Purpose

Turn flows into a concrete, design-system-conformant UI plan and a working prototype — then self-audit it before spending the user's review attention. **DS reuse first, always.**

## Inputs

- S07/S09 complete (UX workflow exit criteria met)
- Design-system reference (project DS: tokens, primitives, components; Figma refs if the BRD links them)
- Open S16 `Affects:` entries targeting S08
- Change requests routed here by REVISION

## Outputs

- S08 UI Decisions & Prototype — component inventory (reuse-vs-new classified), DS mapping, layout/hierarchy rules per state, token references, Extension Notes, prototype link
- `design/prototype/<brd-id>/` on the BRD branch — running prototype + `run-local.sh` + traceability map (element → S07/S08 entry + DS token/component used)
- S14 design-audit subsection — self-audit findings by severity + verdict
- S16 — UI decisions, Extension Notes raised, audit verdict record

## BRD Sections It May Update

S08 (edit), S07 (append), S09 (append), S05 (append), S14 design-audit subsection (via audit step), S16 (append).

## Responsibilities

**UI_PLANNING (state 06):**
0. **Register screens:** every screen the flows imply gets a `SCR-<nnn>` row in `screens/registry.md` (allocate from manifest `next_id`) and a contract file with the Design block started ([design-mapping template](../Templates/design-mapping.md)). Overlays are screens too.
1. Decompose each flow state into UI regions/components.
2. Map to existing DS primitives/components first; every `new` component carries a written justification.
3. Define layout + hierarchy rules per state; tokens by reference (spacing/color/type/motion), never ad-hoc values.
4. Genuine DS gap → **Extension Note** in S08; large gaps → invoke [design-system-workflow.md](design-system-workflow.md).

**PROTOTYPE (state 07):**
5. **Mandatory pre-build DS check** — load the DS reference, confirm every needed token/primitive/component exists before assembling any screen. No ad-hoc hex/spacing/type where a DS entry exists.
6. Instantiate every flow state incl. non-happy paths; wire all transitions incl. recovery routes per S07.
7. Build traceability map; ship `run-local.sh [port]` (default 8765) so review runs against a served prototype.

**SELF_AUDIT (state 08):**
8. Audit conformance S03→S07→S08→prototype; run accessibility + reduced-motion audit (never skipped); verify non-happy-path states reachable in the prototype; classify findings `blocker`/`major`/`minor`; mark every design-relevant AC met/unmet with evidence; verdict `pass`/`fail`.
9. `pass` → orchestrator advances to `Design Review`. `fail` → REVISION routing with findings attached.

## Completion Criteria

- [ ] Every flow state maps to a component set; every element traces to spec (no un-specced additions)
- [ ] DS mapping: reuse preferred; every `new` justified; zero one-off styling where a DS entry exists
- [ ] Token references resolve to the DS or carry an Extension Note
- [ ] Prototype: all states represented, all transitions (incl. recovery) wired, runs via `run-local.sh`
- [ ] Traceability map complete (element → spec → DS asset)
- [ ] Self-audit executed: a11y audited, ACs marked with evidence, verdict recorded in S14
- [ ] Verdict `pass` with zero unresolved `blocker` findings
- [ ] S16 stage-exit entry written

## Failure & Loops

- Reuse/mapping failure → re-map toward DS, ceiling 2; unavoidable new components → Extension Note (informational, non-blocking).
- Spec insufficient to assemble → back-transition to UI_PLANNING; repeated → to UX workflow (flow gap). Ceiling 3.
- Audit `fail` is a normal outcome, not an error — deterministic route to REVISION.

## Common Mistakes

- Skipping the pre-build DS check and "fixing tokens later" — later never comes; V5 exists because of this.
- Prototyping only happy paths — S09 states must be reachable in the prototype, not just documented.
- Un-specced additions ("looked empty, added a card") — everything traces or it goes.
- Isolated one-off styling for a special flow (auth-only buttons, billing-only spacing) — extend the DS or reuse; never fork styling per feature.
- Self-audit as rubber stamp — audit adversarially; finding your own blockers is the point, cheaper than the user finding them.
- Hardcoded values "temporarily" — prototype hardcodes become implementation hardcodes.

## Best Practices

- Compose screens exclusively from DS vocabulary; if you can't name the primitive, that's an Extension Note, not an inline style.
- Reuse UX state names (`SYNC_FAILED`) as prototype route/state names — traceability for free.
- Motion: reference DS motion tokens; provide reduced-motion variant from the start, not as a patch.
- Keep the traceability map a boring table — it's what makes Design Review and Dev Planning fast.
- Present known limitations honestly in S14 — surfacing them beats the user discovering them.
