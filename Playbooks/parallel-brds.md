# Playbook — Parallel BRDs

> **Module:** Playbooks. Running up to 3 BRDs in-flight without them corrupting each other. Composes [full-feature](full-feature.md) ×3 + conflict rules.

## Invariants

1. **Cap 3** in-flight (Status ∈ Analysis…Human Review). Slot frees at `Merged`. `C_SLOT_FREE` blocks pickup — no exceptions "just to start".
2. One BRD = one branch = one PR — never a shared branch, never mixed commits.
3. One session works one BRD's stage at a time; switch only at stage boundaries (Notion state makes switching free).
4. Machine state lives in Notion only — no cross-BRD memory carried in-session.

## Pickup discipline

- Order: oldest in-flight first (finish > start). New pickup only when a slot is free AND no in-flight BRD is waiting on machine work (human-gate waits don't count — that's exactly when you pick up parallel work).
- Priority ties → smaller scope class first (throughput beats WIP).

## Conflict management (the real risk)

| Point | Rule |
|-------|------|
| Dev Planning | Touched-areas list mandatory (S10); orchestrator cross-checks all in-flight S10s. Overlap → serialize the overlapping stages, or explicit user call logged in both S16s |
| Same DS asset | Two BRDs extending the same component → design-system workflow arbitrates once, both consume ([design-system-workflow](../Workflows/design-system-workflow.md)) |
| Decision territory | Two BRDs deciding the same thing (e.g. error-code scheme) → surface, user decides, both S16s cross-reference |
| Merge order | First-merged wins the base; later BRDs rebase at their next stage boundary; conflicts touching a declared area → escalate before resolving |
| Shared contracts | BRD-A consuming BRD-B's unfrozen contract = hidden dependency → make it explicit: B's contract freezes first, or A waits. Logged both S16s |

## Human-gate batching

- Orchestrator presents pending gates oldest-first, one decision package each — never merged into one blob decision.
- Gate wait ≠ idle: other BRDs advance meanwhile.

## Failure smells

- Constant rebase pain across the trio → touched-areas discipline failed at Dev Planning; serialize now, fix the planning habit at retro.
- Same file in 3 branches → the BRDs were one feature wrongly split, or the module needs a structure fix (refactor BRD).
- WIP creep (picking #4 "briefly") → cap is the system; breach = `Blocked`-level process violation, log it.
