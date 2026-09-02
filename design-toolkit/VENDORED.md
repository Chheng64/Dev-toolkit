# Vendored — AI Product Design Agent toolkit

> **Status:** Vendored copy. **Do not edit files in this directory.**
> **Source:** `design-toolkit` @ `4081c24` (2026-08-08)
> **Vendored:** 2026-08-24, verbatim except `.git/` and `.github/`.

This directory is the **normative process source** for the design sub-machine used by
Dev-toolkit's `Design` and `Design Review` stages. The toolkit's own adapter lives in
[../Architecture/design-state-machine.md](../Architecture/design-state-machine.md); where the
adapter and this directory disagree about *process*, this directory wins and the adapter is
the bug. Where they disagree about *where artifacts live*, the adapter wins — see below.

## What is normative here

| Path | Role |
|---|---|
| [`docs/workflow.md`](docs/workflow.md) | The 12-state spec: states, validations, transitions, guards, gates, retry + loop logic |
| [`docs/method-rules.md`](docs/method-rules.md) | Hardened rule catalogue — cite by code (`B5`, `M2`, `G3`, `R2`, `P4`, `W1`, `E6`) |
| [`docs/artifact-contracts.md`](docs/artifact-contracts.md) | Artifact frontmatter (`reads_versions`, `supersedes`), naming, gate-record fields |
| [`skills/01`–`12`](skills/) | One skill per state — the full statement of each state's rules and validations |
| [`tools/`](tools/) | The verification harness (derivation, audit, probes) — exit codes, not prose |
| [`templates/`](templates/) | Artifact templates |

## What is NOT normative here — the two overrides

1. **Artifact store.** The vendored spec writes loose `.md` files into `artifacts/`. In this
   toolkit, feature knowledge lives in the **Living BRD** (Notion) and build artifacts live in
   the **project repo**. The remapping table is [../Architecture/design-state-machine.md](../Architecture/design-state-machine.md) §1.
   Do not create a second artifact store.
2. **Machine state.** `state/machine_state.yaml` here is an **example file**, not this
   toolkit's state. Machine state lives in Notion properties (`Status`, `Stage Owner`,
   `Approvals`, `Loop Count`, `Blocked Reason`) — see
   [../Architecture/workflow-state-machine.md](../Architecture/workflow-state-machine.md).

`artifacts/`, `reference/`, `state/` and `examples/` are shipped as **worked examples**
(`examples/signin/` is the only filled-in set). Read them; do not run a project out of them.

## Upgrading this copy

Re-vendor the whole directory from source, then re-read the adapter's Deltas section and
reconcile. Never hand-patch a vendored file — a patched vendor is indistinguishable from a
stale one, and the next re-vendor silently discards it.
