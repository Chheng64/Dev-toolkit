# Changelog

All notable toolkit changes. Format: [Keep a Changelog](https://keepachangelog.com). Versioning: [../Architecture/versioning.md](../Architecture/versioning.md).

## [Unreleased]

## [1.10.0] — 2026-08-25

**Gap sweep against the vendored source.** A double-check of the vendored toolkit's process docs against what the toolkit actually carries found ten missing pieces. All ten are now in.

### Added
- `Architecture/validation-engine.md` — **the checker catalogue**, cloned from the vendored `VALIDATION_ENGINE.md`. The toolkit previously had a 7-row tool table and nothing else. Now: per-tool checks and failure/fix tables (`smoke`, `audit`, `navgraph`, `stategraph`, `stateprobe`, `annotate`, `linkcheck`, `mermaidcheck`), **exit-code semantics** (`2` = tool error = *unevaluable*, **not passing** — a gate reading exit 2 as green ships unchecked bytes), the severity ladder and `--fail-on`, the common flags, the **false-positive catalogue** (10 classes, each corrected in the harness and re-run — never waived), the **waiver rule** with its missing clause (*a failing check not confirmed at source is not eligible for a waiver*), the **full-suite run order** (`annotate` reads `navgraph.json` — order matters) and the gate-check script ending in a **scoped** `READY FOR DEVELOPMENT`, never a bare "handoff ready".
- `Architecture/design-state-machine.md` §9b **Cross-state rules** — the four rules binding more than one state (scope your clearance claims · an unruled question is carried, never defaulted · a shared component is a cross-flow contract · facts promised at a boundary are contracts), and §9c **Trimming the pipeline** — what may legitimately be skipped (state 12 without handoff; state 02 **per goal** marked `no-research-needed`) and what never may (08 before 09; 09 before 11).
- `Workflows/project-onboarding.md` step 8b — **design harness bootstrap**: generate `toolkit.config.json` from the manifest, seed `design/navmap/` from the vendored templates, verify Node ≥ 22 and Chrome. Without it states 08 and 12 cannot run at all, and a missing Chrome makes every rendering-class check exit 2.

### Changed
- `Workflows/business-analysis.md` (74 → 167 lines) — **full clone of skills 01 + 02**, the same fix v1.9.0 applied to states 04–12. Adds the `requirements` and `research` output shapes with frontmatter, both V-rule sets, the exit conditions, and the recovery edges that were missing entirely: research revealing a malformed requirement back-transitions to state 01, and repeated fabrication risk downgrades a theme to a **logged gap** rather than silence.
- `Workflows/product-planning.md` (67 → 138 lines) — **full clone of skill 03**: the scored prioritization table with bands, the risk register with named owners, scope contradictions, the decision record where **every decision names what would reverse it**, the cut list, V1–V4, and the gate rule that **unresolved contradictions are presented as unresolved** — a gate answered on a tidied-up picture is not an approval of the real direction.
- `Architecture/screen-contract.md` — **the registry is the spine**: state 12 derives the entire navigation model from these cells, so if the diagram and the derivation disagree the diagram is wrong, and prose where an id belongs is a finding (`N10-unparsed`) that silently drops an edge. Adds the separator rule — `states` is **comma**-separated, `entry_from` / `navigates_to` are **pipe**-separated.
- `Workflows/ui-workflow.md`, `Workflows/flow-visualization.md`, `Workflows/design-review.md`, `Checklists/design-qa.md`, `Checklists/flow-visualization.md`, `Documentation/module-index.md` — cite the validation engine for exit codes, run order and the waiver clause.

### Fixed — alignment sweep (cloned method vs this toolkit's process)
- `AI/model-routing.md` — **five stages had no model tier at all**: design states 09, 10, 11, 12 and security certification. The orchestrator routes tier per stage, so an unlisted stage had none. Revision triage (10) is **T3** — a misroute costs three cycles, and did; certification is **T3** because a miss ships. Loop escalation now names `L_REVISION` alongside `L_DESIGN`.
- `Workflows/design-review.md` — **one loop, two names**: `L_REVISION` (design machine) *is* `L_DESIGN` (lifecycle), counted in the S16 entry and Notion `Loop Count`, bumped in the same edit. Two counters for one loop is exactly the failure R7 was written by.
- `Architecture/design-state-machine.md` §2 — **version-id prefix table** (`req-` … `cert-`), one prefix per artifact. The clones introduced twelve id shapes with nothing naming them; a gate record that cannot resolve a version id is the defect `reads_versions` exists to prevent.
- `Workflows/code-review.md` — specialist append rights were stated as a blanket `S05/S06/S10`, which the matrix grants to Security Reviewer but **not** to Accessibility Specialist (S06/S10 = read) or Performance Optimizer (S06 = read). Now enumerated per role, with the `Affects:` route for anything outside a row.
- `AI/orchestrator.md` responsibility 4b — where a gate's evidence is a tool run, **read the exit code**: `2` means the check did not run. A stage reporting "checks passed" with no exit code recorded has not produced gate evidence.

Verified after the sweep: 0 vendored artifact paths (`artifacts/*`, `machine_state.yaml`, `reference/screen-registry.csv`) outside `design-toolkit/` · 0 vendored terminal or gate names (`HALT_BLOCKED`, `HALT_STOPPED`, `Primary User Approval Gate`) · every workflow's claimed BRD sections within its role's matrix rights · every lifecycle stage carries a model tier · 211 md files, 0 broken links.

### Notes
- States 01–12 are now all cloned rather than summarized. The remaining vendored docs (`ARCHITECTURE.md`, `ARTIFACT_FLOW.md`, `DESIGN_PRINCIPLES.md`, `WORKFLOW_GUIDE.md`) are reference reading; their normative content is in the workflows and the two state machines.

## [1.9.0] — 2026-08-25

**The design method is now the workflow, not a citation of one.** v1.7.0 vendored the design toolkit and *summarized* its skills into the workflow files. Executing a workflow therefore never loaded the hardened method, and prototype output showed it. Every design state's skill is now **cloned in full** into its workflow file.

### Added
- `Workflows/design-review.md` (603 lines) — **states 09 `USER_REVIEW` + 10 `REVISION` + 11 `FINAL_OUTPUT`**, cloned from the vendored skills. This stage previously had **no workflow file at all** ("orchestrator-managed"), leaving 1,121 lines of method unloaded: the Run Local rule and its player URL evidence, delta classification before asking (G4), waivers-with-riders (G6), honest pass counts (G7), root-cause routing (R3), class-not-instance sweeps (R2), loop counting (R7), the Conflict Mini-Gate (R8), freeze-is-a-hash (P2), audit-ran-on-the-frozen-bytes (P4), and completeness checked against the matrix (P3).
- `Templates/prototype/` — the **Run Local review player** (`run-local.sh`, `serve.py`, `play.html`, README). v1.7.0 told state 07 to "ship run-local.sh" without shipping the file. Carries a toolkit adaptation note: machine state lives in Notion, so the absent state file means live reload is ON by design.
- `Templates/traceability.md` — the seven-table traceability shape state 07 owes: it is state 08's V1/V2 evidence, the Design Gate's review packet, state 12's deep-link source, and state 11's completeness basis.

### Changed
- `Workflows/ui-workflow.md` (120 → 621 lines) — full clone of skills 06 + 07 + 08. Recovers **B7b, the harness contract** (`.view` / `active` / `data-view` / `data-sid` / `#sid` — what makes registry↔prototype id drift measurable rather than asserted, and what the three harnesses actually read), the B8 self-check command set, the traceability output shape, the `ui-plan` and `audit-report` frontmatter, the STRICT colour allowlist with its BANNED list, all V1–V6 rule sets, and the three recorded-failure-mode catalogues (assembly defects, build-ops, harness false-positives — including the run that reported 60 failures of which 3 were real).
- `Workflows/ux-workflow.md` (90 → 273 lines) — full clone of skills 04 + 05: the `ux-plan` and `flows` output shapes, the edge-case matrix, the reachability/recovery/boundary tables, and the five flow-generation failure modes.
- `Workflows/flow-visualization.md` (100 → 377 lines) — full clone of skill 12: E1–E7 in full (lane derivation, cross-feature seams, measured heat, deep-link scanning, the closed state vocabulary with its qualifier rule, the six annotation fields split by who owns the answer, the provenance block), V1–V13, the `S*`/`E*`/`N*` validation codes, and "what a first derivation finds".
- **§0.3 config bridge** in `ui-workflow.md` — the harnesses read `toolkit.config.json` from the project root. It is now defined as a **generated** file (manifest `design:` block + the BRD's S08 colour allowlist), regenerated on change, never hand-authored. An allowlist that lives only in S08 is an allowlist nothing enforces.
- `Architecture/design-state-machine.md` — states the executable procedure lives in the workflows and points at each clone; `Architecture/workflow-state-machine.md` — `Design Review` now names its workflow module instead of "human review, orchestrator-managed".
- `Documentation/module-index.md`, `Playbooks/full-feature.md`, `Playbooks/design-only.md`, `Skills/ui-designer.md`, `README.md`.

### Notes
- Clones carry a `Cloned from: <skill> @ 4081c24` line. On a vendor upgrade, re-clone — a summarized clone is how this defect happened in the first place.
- Only artifact locations are remapped (vendored `artifacts/*.md` → BRD sections + `design/` repo dirs). Method text is the skills' text.

## [1.8.0] — 2026-08-24

**Security certification before QA** — security stops being review dimension 4 (spent *after* a full QA cycle) and becomes a precondition with an artifact: a certificate issued against a named commit, gating `Implementation → QA`.

### Added
- `Workflows/security-certification.md` — exit step of Implementation, owned by the Security Reviewer. Freezes the sha, runs the configured evidence with exit codes, verifies every S06 mitigation at `file:line`, classifies findings, issues `certified` / `not-certified`. Loud degradation: an unavailable scanner is a recorded `gap` with a closing condition plus its manual equivalent — never a silent pass. Every scanner hit is a hypothesis confirmed at source before it is reported.
- `Templates/security-certificate.md` — the artifact: `certified_commit`, scope stated inside the claim, automated-evidence table (tool · version · command · exit code · gap), threat-model verification matrix, manual results, findings, waivers (rule · why · user grantor · rider · closing condition), verdict, currency record.
- **Guard `C_SECURITY`** (`Architecture/workflow-state-machine.md` §4) — checked at QA entry **and** Tech Review entry: S14 must carry a `certified` certificate whose `certified_commit` equals the current branch head. Machine gate, no human token; human signs only residual-risk waivers.
- **Stale-certificate rule** — branch head moves → certificate stale → delta re-verification and re-issue. Delta touching `high_risk_scopes` (auth, payment, PII, data-export) → full pass, never delta.
- `Architecture/project-manifest.md` §2 — `security:` block: `scanners.{secrets,dependencies,sast,licenses}`, `fail_on`, `high_risk_scopes`, `rotate_on_secret_hit`. An empty command is a recorded gap by construction.

### Changed
- `Workflows/implementation.md` — three new duties: each S06 mitigation implemented **in the slice that creates its surface**; every unplanned surface appended to the threat model as it is built; scanners run locally before push. Stage completes at a certificate, not at "tests green".
- `Workflows/backend-planning.md` + `Checklists/development-ready.md` — Dev Planning now produces the **S06 threat model**: surface → asset → attacker → mitigation → **verification method**. A mitigation with no verification method is a wish, and certification bounces it.
- `Workflows/qa.md` — `C_SECURITY` is an entry precondition and re-checked at exit (QA-loop fixes push commits, which stale the certificate).
- `Workflows/code-review.md` — dimension 4 **verifies the certificate is current** and spot-checks the highest-exposure claims, instead of repeating the pass. Anything it catches that the certificate missed is filed against the certification method, so the checklist gains the rule.
- `Checklists/security.md` — rewritten as the `C_SECURITY` validator: preconditions, automated evidence, threat-model verification, the original four dimension sections, verdict + closure, currency/re-verification. Added: rotation (not deletion) on a secret in a pushed commit.
- `Skills/security-reviewer.md` — owns the certificate and its currency; explicit certification boundary (reviewer files, implementer fixes, reviewer re-verifies).
- `Standards/security.md`, `AI/orchestrator.md`, `Architecture/brd-schema.md` (S14 subsections named), `Playbooks/full-feature.md` (step 6b), `Playbooks/hotfix.md` (certification **scope** compresses; certification itself does not), `Documentation/module-index.md`, `README.md`.

### Notes
- Still 13 stages and 3 human gates — `C_SECURITY` is a machine gate in the `C_CONTRACT` idiom, so no progress counters, Telegram status strings or playbook numbering change.
- A project with every scanner command empty still certifies: the certificate then carries four `gap` lines and the manual pass. The gap is visible to everyone downstream, which is the point.

## [1.7.0] — 2026-08-24

**Design process replaced from source** — the UI/UX design workflows now execute the current 12-state AI Product Design Agent machine, vendored into the repo as its normative process source instead of paraphrased from a 2026-08 snapshot.

### Added
- `design-toolkit/` — **vendored** design toolkit @ `4081c24` (2026-08-08), verbatim minus `.git/` and `.github/`: the 12-state spec (`docs/workflow.md`), the hardened rule catalogue (`docs/method-rules.md` — `B`/`F`/`M`/`G`/`R`/`P`/`W`/`E` codes), artifact contracts, 12 per-state skills, 22 templates, 10 verification tools, and the `signin` worked example. `design-toolkit/VENDORED.md` states provenance, the two overrides, and the no-hand-patch upgrade rule.
- `Workflows/flow-visualization.md` + `Checklists/flow-visualization.md` — design **state 12 `FLOW_VISUALIZATION`**: the navigation map is *derived* from the Screen Contract by `navgraph.mjs`, validated V1–V13, and put to the new **Developer Handoff Gate**. Conditional on `C_HANDOFF_REQUIRED`, **default off** — a fourth human gate is never imposed silently.
- `Architecture/project-manifest.md` §2 — `design:` block: `handoff_required`, `design_system.{name,source_id}`, `viewport`, `scripts`, `review_port`, `navmap_path`, `prototype_path`, `loops`. Replaces the vendored `toolkit.config.json` as this toolkit's one config per project.
- `Architecture/screen-contract.md` §3 — optional Prototype-block navigation fields (`entry_from`, `navigates_to`, `states`). Additive: `C_CONTRACT` is unchanged, and a missing route is *reported* by the derivation, never guessed.

### Changed
- `Architecture/design-state-machine.md` — rewritten as the adapter over the vendored spec: states 01–**12**, artifact remapping (incl. `design/navmap/<brd-id>/`), artifact discipline (`reads_versions`, sha256 gate records, freeze-is-a-hash), conditions, gates, loops, a method-rule index, a harness map, and an explicit deltas list.
- `Workflows/ux-workflow.md` — unruled guards carried as open decisions; boundary facts recorded in both flows' logs; scoped clearance claims; state 05 stated as screen-free against state 12's screen-only mandate.
- `Workflows/ui-workflow.md` — DS named by **source id** before planning; build rules `B1`–`B8` + Figma traps `F1`–`F3` (deep-link hooks, destination-paints, namespace claims, duplicate keys across locales, token layer as base, supersession deletes); self-audit is **rendering-class** with screenshots read, probes confirmed at source, source swept, verdict scoped to bytes.
- `Workflows/design-system-workflow.md` — DS source id confirmed first; base-layer token/asset completeness (`B5`); supersession strip recorded (`B7`); sweep the class, not the instance (`R2`).
- `Checklists/design-qa.md` rewritten around `M1`–`M6`; `Checklists/ui-review.md` gains the DS-source-id and screen-registration checks; `Checklists/ux-review.md` gains the carried-decisions section.
- `Architecture/workflow-state-machine.md` — `C_HANDOFF_REQUIRED` + `C_NAVMAP_CLEAN` guards, the conditional state-12 edge on `Design Review → Dev Planning`, and the Developer Handoff Gate row.
- `AI/orchestrator.md` — evaluates `C_HANDOFF_REQUIRED` on Design-Gate approval; gate presentation ships the hook table at the Design Gate and the **derivation report, not the picture**, at the Handoff Gate; post-approval deltas classified before they are asked about.
- `Playbooks/full-feature.md` (step 4b, skipped by default) · `Playbooks/design-only.md` (handoff **on** — the deliverable is built from later; re-derive the map before resuming into build).
- `Skills/ui-designer.md`, `Skills/ux-designer.md`, `Skills/design-system-engineer.md`, `AI/mcp-setup.md`, `Architecture/integration-map.md`, `Documentation/module-index.md`, `README.md` — updated for state 12, the vendored source, and the conditional gate.

### Fixed
- `Architecture/permission-matrix.md` — UI Designer gains **A** on S14. The design-audit subsection (state 08) and the handoff gate record (state 12) are written by that role, and the matrix said read-only; the workflow and the matrix now agree.

### Notes
- Nothing in the pipeline changes for a project that leaves `design.handoff_required: false`: same 13 stages, same three gates, same `C_CONTRACT`.
- The vendored directory is read-only by policy. Upgrade by re-vendoring the whole tree and reconciling the adapter's deltas — a hand-patched vendor is indistinguishable from a stale one.

## [1.6.0] — 2026-08-24

**Telegram remote execution** — the chat adapter gains an opt-in executor daemon: a message in the bound chat can run Claude Code headless on the host, default-closed behind two independent switches.

### Added — Telegram remote execution (extension v2, opt-in)
- `extensions/telegram/executor.mjs` — **inbox executor daemon**: consumes `type: "command"` spool events and runs them through Claude Code headless (`claude -p --output-format stream-json`) in the project root, streaming `exec_started` / `exec_progress` / `exec_result` / `exec_error` back through the outbox. Separate process from the adapter — the filesystem spool stays the whole contract, so the executor is optional and removable.
- `extensions/telegram/config.mjs` — shared `communication.telegram` manifest reader, now the single parser for both processes (the adapter's inline copy is gone). Adds the `exec` block: `enabled`, `allowed_user_ids`, `permission_mode`, `allowed_tools`, `timeout_minutes`.
- Chat surface: free text → queued command, `/new <text>` → fresh Claude session, `/cancel` → SIGTERM the running command. `/status` unchanged. One Claude session is reused per project (`.toolkit/telegram/.session`) so follow-ups keep context.
- `extensions/telegram/*.test.mjs` — 81 `node --test` cases covering parsing, message routing, authorization, session lifecycle, single-flight locking, timeout, and cancellation.

### Security
- Remote execution is **default-closed on two independent switches** — `exec.enabled: true` and a non-empty `exec.allowed_user_ids`; an empty allow-list authorizes nobody and a missing block refuses all free text. Chat identity (adapter, `chat_id`) and sender identity (executor, `allowed_user_ids`) are enforced separately.
- `permission_mode` defaults to `acceptEdits`; the executor never passes `--dangerously-skip-permissions`. `bypassPermissions` remains available but is documented as granting unrestricted execution to anyone who can post in the bound chat.
- Prompts are passed as a single argv entry to a shell-less spawn; `cwd` is pinned to the project root with no `--add-dir`. Runs are bounded by a single-flight lock (reclaimed if the holder dies) and a `timeout_minutes` SIGTERM.
- The executor never consumes `approval` events — gate decisions remain the orchestrator's, under its stale-approval and scope rules.

### Changed
- `extensions/telegram/telegram-plugin.mjs` — free-text messages are now spooled as `command` events instead of being silently dropped; outbox sends are chunked to Telegram's 4096-character limit; `formatEvent` takes notifications explicitly and gained the `exec_*` cases; module entry is guarded so the file can be imported by tests without connecting.
- `Architecture/project-manifest.md` §2 — documents `communication.telegram.exec` and the remote-execution rule.

## [1.5.0] — 2026-08-21

**Project Resource Binding** — every project explicitly owns and binds its external resources; the toolkit never searches the user's workspace once a project is onboarded.

### Added — architecture (flow-review hardening)
- `Architecture/ecosystem-map.md` — **Ecosystem Map**: concept-level bridge between this toolkit and the `paul` / `gsd-*` / `carl-mcp` systems the user also runs (equivalence table, state-ownership boundaries). Informational — no runtime dependency, not executed by the orchestrator.
- `Architecture/toolkit-registry.md` — **Toolkit Registry** (`~/.toolkit/registry.yaml`): user-global config layer owning the BRD DB identity (one DB, all projects = toolkit-level resource), projects parent page, bot presence. Written at one-time setup; inherited by every manifest. Kills the registration↔binding bootstrap circularity — step 0 reads it, never searches.
- **Resource lifecycle model** (`project-manifest.md` §3): `binding` (disposition — immutable decision) split from `health` (`ok`/`unreachable` — runtime, restamped by validation). One **Resource Decision** primitive (connect / create / confirm-absence) covers missing, skipped-but-required, and unreachable slots; per-slot **absence behavior** table generalizes the Figma prototype-only rule; rebind-fallout + rebind-logging rules.
- **Manifest Gate pipeline** (`orchestrator.md` responsibility 0): fixed order — Toolkit Registry → manifest → **version migration** → staleness → C_MANIFEST — at session entry, pickup and resume alike. `Migration (v1→v2)` is now an orchestrator-triggered, seeded, resumable procedure (`project-onboarding.md` §Migration, with per-field seeding table); the "v1 remains pickable" contradiction removed.
- **State machine**: `Blocked Reason` taxonomy (typed: `resource:` / `paused-by-user` / `ceiling:` / `ambiguity:` / `error:`); missing-resource transition (any in-flight → Blocked, resumable, fires Telegram trigger); new guard **`C_RESOURCES`** at Dev Planning exit (plan-implied slots must be bound + healthy — gaps stop at the cheap point, not mid-Implementation).
- **Onboarding end-to-end fixes**: step 0 reads the registry + creates the identity page (circularity gone); GitHub create-new pushes so the default branch exists for validation; step 6 writes `incomplete`, step 9 scaffolds CI + pushes + applies branch protection (`gh api`, actor defined) + stamps complete; unified rebind rule (any mutation = step 3+4+5 for the slot); re-open phrases defined as say-to-Claude routes; Telegram yes-path made executable (user creates chat, `getUpdates` discovery, test-send after manifest write, failure → `deferred` without consuming ask-once).
- Screen contract: pre-existing screens seed as `implemented (pre-toolkit)` (backfill-on-claim rule); §4 keys off "no **healthy** Figma binding"; multi-repo BRD branch/PR contract (`integration-map.md` §3).

### Added
- `Architecture/project-manifest.md` §3 — **Project Resource Registry**: `resources:` block (manifest_version 2) as the sole home of external resource identity. Slots per provider — Notion (BRD DB **required**, project page, sprint/decision-log DBs), Figma (product design file, design-system library), GitHub (frontend/backend — ≥1 **required** — + optional infrastructure repo), documentation (API/architecture/product), communication (Telegram, stable `communication.*` path kept for the plugin), other MCP-backed resources. Uniform binding record: **stable identifier** (database id / file key / numeric repo id / chat id — never display names) + `binding: connected | created | skipped` + `bound`/`validated` stamps. Explicit-skip rule: optional slots are resolved or skipped, never silently absent, never re-asked, never guessed.
- `Architecture/integration-map.md` §2b — **Project Boundary Rule (hard)**: after onboarding, orchestrator + workflows access only registry resources; workspace-wide Notion search, Figma browsing, and repo listing are forbidden. Missing resource → stop + *connect existing / create new* offer (targeted rebind). §6 gains a per-integration boundary-scope column.
- `Workflows/project-onboarding.md` step 3 — **Project Resource Binding stage**: per-slot Connect Existing / Create New / Skip table with per-provider stable-ID resolution; step 5 binding validation with verbatim `✓ / ○ Skipped` checklist; "After Onboarding — the Boundary Holds" section. Communication step (v1.4 7b) folded into the binding stage; asked-once rule unchanged.
- `AI/orchestrator.md` responsibility 0b + anti-rule — resource-boundary enforcement: registry-scoped access, connect/create escalation, S16 logging.
- Manifest v1→v2 migration path (`project-manifest.md` §1): first pickup offers a binding re-run seeded from existing `notion.*`/`design.*`/`git.repository` values.

### Changed
- `Architecture/project-manifest.md` — `design:` reduced to code-side config (figma resource identity → `resources.figma`); `notion:` block dissolved into `resources.notion`; `git:` keeps behavior only (`primary_repository` names the manifest-hosting repo slot; identity → `resources.github`); consumption rule 2 (registry-only access) + validation §5 require `resources.status: bound` and stable ids.
- `Architecture/workflow-state-machine.md` — `C_MANIFEST` now also requires `resources.status: bound` with required bindings validated.
- `Workflows/integration-validation.md` — checks resolve via registry ids; new registry re-check row (staleness re-validates bindings, restamps `resources.*.validated`); validation never becomes workspace discovery.
- `Templates/project-configuration.md` — Design/Notion/Git resource questions replaced by a Project Resource Binding section (connect/create/skip per slot); Git Behavior section retains strategy-only fields.
- `Architecture/screen-contract.md` §4 + `Checklists/screen-contract.md` — Figma-optional rule keys off `resources.figma.product_design_file` binding.
- `AI/mcp-setup.md` — Notion toolset drops `notion-search` (boundary); Figma MCP applicability keyed to the registry binding, not BRD mentions; all rows note registry scope.
- `Architecture/context-package.md` — `design.md` source of truth includes `resources.figma.*`.
- `extensions/telegram/README.md` — setup points at the Resource Binding stage; re-open phrases limited to the sanctioned two.
- `Documentation/onboarding.md`, `README.md` — Resource Binding + boundary as first-class architecture concepts; v1.5.0 pins.

### Fixed
- `extensions/telegram/telegram-plugin.mjs` — manifest reader now strips surrounding quotes from values; previously `chat_id: "-100…"` (as the schema shows) yielded literal quote characters — every send targeted an invalid chat and the allow-list never matched.
- Manifest schema — undefined `notifications.pipeline` flag removed (no event type maps to it; `failures` already covers pipeline-failed).
- `extensions/telegram/telegram-plugin.mjs` — project-name reader now strips inline comments and surrounding quotes; `name: "My Project"` previously reached every notification with literal quote characters.
- `extensions/telegram/telegram-plugin.mjs` — dead `pipeline: true` key dropped from the notifications default (only `approvals` and `failures` are read).

## [1.4.1] — 2026-07-26

### Changed
- `README.md` — rewritten as a complete getting-started guide: three core ideas, one-time setup, start-a-project runbook (register → pin → onboard → first BRD → run), daily-use phrase table, enforced-rules summary, repo map with reading order, upgrade + toolkit-improvement flow.

## [1.4.0] — 2026-07-26

Telegram Plugin v1 (extension) + communication integrations in onboarding.

### Added
- `extensions/telegram/` — communication adapter (NOT core): `telegram-plugin.mjs` (zero-dependency Node daemon — outbox flush, long-poll, /status, inline Approve/Reject/Pause/Resume; chat allow-list; `--test`/`--once`) + README with the file-spool event contract (`.toolkit/telegram/{outbox,inbox}/`, `status.json`). Four notification triggers only: Direction gate, Design gate, PR ready, pipeline failed. Approvals are recorded intents — orchestrator applies them under normal gate rules (`source: telegram` in S16). v2 seams declared (AI chat, notes, voice, daily summaries; Slack/Discord/email as sibling adapters over the same spool).
- `Architecture/project-manifest.md` — `communication.telegram` block (routing only; tokens env-only, never in repo).
- `Workflows/project-onboarding.md` — step 7b: communication integrations asked ONCE (Yes / No / Configure later); test-send required before `enabled: true`; never re-asked except explicit "toolkit configure communication" / "toolkit onboard --update".
- `AI/orchestrator.md` — responsibility 9: outbox events at the four triggers, status.json refresh per transition, inbox read at session entry + before gate checks.

## [1.3.0] — 2026-07-26

Onboarding enhancements — incremental, existing flow remains the default shape.

### Added
- `Architecture/context-package.md` — AI Context Package spec: `context/` with 5 generated summaries (design, stack, integrations, conventions, model-routing); derived-only rule, regeneration triggers, session bootstrap order, staleness check.
- Onboarding step 0 **Project Registration** — stable identity (name, code, product type, stage, intended stack) established and reserved in Notion BEFORE repository initialization; registered-not-initialized is a valid resting state; `manifest.project.registered` stamp.
- Onboarding step 6 **Screen Contract initialization** — registry created at onboarding; known screens optionally seeded with real SCR-IDs (`planned`/`unassigned`); UI planning claims seeded rows instead of creating duplicates.
- Onboarding step 7 **Context Package generation**.

### Changed
- `Workflows/project-onboarding.md` — procedure now 0–8; outputs + completion criteria extended.
- `Architecture/screen-contract.md` — two registration paths (onboarding seed / UI planning); claim semantics; `C_CONTRACT` evaluates owned rows only, `unassigned` rows inert.
- `Architecture/project-manifest.md` — `project.registered`, `context_package` block.
- `Templates/project-configuration.md` — Registration section (pre-repo) + optional Initial Screens seed section.
- `AI/CLAUDE-global.md` — context/ in project stub + session bootstrap order.

## [1.2.0] — 2026-07-26

Project Onboarding System + Screen Contract System. Two new hard guards; no breaking changes (Status values untouched — both stages run as guards/pre-pipeline).

### Added
- `Architecture/project-manifest.md` — per-project config contract (`project-manifest.yaml`): project info, stack, design, Notion, git, integrations, screen-contract state. Single source of truth for project configuration; workflows read it instead of re-asking.
- `Architecture/screen-contract.md` — `screens/` registry (SCR-nnn, never reused) + per-screen contracts with 5 mapping blocks (design/prototype/frontend/API/QA); Figma-optional rule; ownership per role; six-check validation.
- `Architecture/stack-profiles.md` — manifest stack → applicable Standards; honest gap declarations; design-stage collapse for headless profiles.
- `Workflows/project-onboarding.md` — detect-first interview → resource validation → manifest generation → scaffolds. Once per project; targeted re-runs on evolution.
- `Workflows/integration-validation.md` — per-integration checks (required vs optional), manifest recording, per-stage degradation warnings; 30-day staleness re-check.
- `Checklists/screen-contract.md` — `C_CONTRACT` executable validator (registry, design, frontend, API, QA mappings; failure reporting format).
- `Templates/project-configuration.md`, `design-mapping.md`, `frontend-mapping.md`, `api-mapping.md`.

### Changed
- `Architecture/workflow-state-machine.md` — §1b project pre-pipeline (Onboarding → Integration Validation → Manifest); guards `C_MANIFEST` (every pickup) + `C_CONTRACT` (Dev Planning entry); Design Review transition split on contract pass/fail.
- `AI/orchestrator.md` — responsibility 0: manifest gate before any project work; `C_CONTRACT` run at Dev Planning entry with `SCR-id · block · gap` reporting.
- `AI/CLAUDE-global.md` — project stub now points at the manifest; onboarding is the only permitted work without one.
- `Architecture/integration-map.md` — three-sources-of-truth table (manifest / BRD / screen contract).
- `Architecture/brd-schema.md` — SCR-ID reference rule (sections cite IDs; mappings live in the contract).
- `Workflows/ui-workflow.md` (screen registration step 0), `frontend-planning.md` (+frontend mapping duty), `backend-planning.md` (+API mapping duty), `Checklists/development-ready.md` (+`C_CONTRACT` precondition).

## [1.1.0] — 2026-07-26

### Added
- `AI/model-routing.md` — Model Routing Strategy: tier table (Haiku/Sonnet/Opus/frontier) per workflow stage, 7 escalation rules (retry +1 tier, loop escalates producer, debug triggers, no mid-stage downgrade, de-escalation, T4 reserve, ceiling posture), cross-model verification pairs (producer ≠ verifier), 6 handoff rules across model/session boundaries (BRD-only channel, fresh-session verify stages, escalation receives failure evidence), cost posture.
- `Architecture/brd-schema.md` — optional `Prototype` URL property (design artifact quick link); live in the BRDs database.

### Changed
- `AI/orchestrator.md` — stage routing consults model-routing and logs the model tier in Stage-Enter S16 entries.

## [1.0.0] — 2026-07-26

Phase 6 — Meta. Toolkit complete.

### Added
- `Documentation/module-index.md` — every module, one line, grouped by layer.
- `Documentation/onboarding.md` — new project in ~10 minutes + first-BRD health signs.
- `Documentation/notion-setup.md` — exact BRD database recipe (properties, views, page scaffold, MCP-driven create).

### Milestone
- All 9 layers complete: Architecture (6), AI (4), Workflows (13), Skills (16), Standards (17), Templates (11), Checklists (11), Prompts (11), Playbooks (4) — 93 modules + meta. Contracts frozen at 1.0: BRD schema S01–S16, permission matrix, Status values, gate tokens. Breaking changes from here follow versioning.md majors.

## [0.6.0] — 2026-07-26

Phase 5 — Prompts + Playbooks.

### Added
- `Prompts/` — 11 reusable invocation patterns, each binding a task to its workflow/skill/checklist with required inputs and bounce rules: planning, research (citations-or-nothing), architecture (options + recommendation), design (per machine-state cluster), development (slice sessions), refactoring (characterize-first), testing (QA + gap modes), debugging (hypothesis ledger), documentation (layer routing), review (full + dimension modes), prompt-improvement (evidence-based toolkit self-repair).
- `Playbooks/` — 4 compositions (the only composing layer): full-feature (13 stages + loop wiring + session pattern), parallel-brds (cap 3, conflict rules, gate batching), hotfix (compressed ceremony, gates-that-matter preserved, mandatory prevention sweep), design-only (design-terminal path + staleness check on build resume).

## [0.5.0] — 2026-07-26

Phase 4 — Gates: templates + checklists.

### Added
- `Templates/` — 11 fill-in structures: feature-request (BRD seed), product-requirement (S03 entry format, R/AC IDs), technical-specification (S10 with failure table + slices), development-plan (S11 with AC→test mapping), bug-report (S13 entry, repro-or-nothing), design-handoff (links-not-copies, NOT-authoritative list), component-documentation (DS doc beside code), api-specification (contract of record, error→S09 mapping), pull-request (Final Gate decision package), release-notes (S15 outcome language), retrospective (evidence-based, feeds toolkit).
- `Checklists/` — 11 machine-checkable gates: analysis, ux-review, ui-review, design-qa (self-audit), development-ready, code-review (7 dimensions + absences), qa-testing (evidence per verdict), accessibility (mechanism-level), performance (banned-waste sweep + budgets), security (boundary/authz/leakage/closure), release (smoke-check + deferred sweep).
- Phase 3 forward links now resolve.

## [0.4.0] — 2026-07-26

Phase 3 — Standards.

### Added
- `Standards/` — 17 opinionated tech standards, each with rules + anti-patterns: typescript (strict, discriminated unions, boundary parsing), react (composition, state altitude, effect discipline), nextjs (RSC-default, explicit caching, S09 framework homes), tailwind (v4 tokens-first, no arbitrary values), design-system (3 layers, API discipline, quality bar), accessibility (WCAG 2.2 AA floor, non-negotiable), responsive-design (mobile-first, container queries), naming-conventions (semantic honesty, UX-name traceability), folder-structure (feature modules, import direction), component-structure (altitude split, state rendering), api-design (zod contracts, normalized errors, idempotency), code-quality (gates, testing layers, rule of three), performance (measure-first, structural waste banned), security (trust boundaries, default deny, defensive floor), internationalization (i18n-ready floor + full i18n), documentation (routing table, same-commit updates), git-strategy (trunk-based, 1 BRD = 1 branch = 1 PR).

### Note
- Forward links to `Templates/`/`Checklists/` resolve in 0.5.0.

## [0.3.0] — 2026-07-26

Phase 2 — Roles.

### Added
- `Skills/` — 16 role definitions, each: role identity, responsibilities, decision boundaries (decides / escalates / never), BRD rights (matrix-referenced), expected output, handoff. Business Analyst, Product Manager, UX Designer, UI Designer, Design System Engineer, Frontend Engineer, Backend Engineer, Full Stack Engineer, QA Engineer, Code Reviewer, Technical Writer, Git Manager, Debug Specialist, Performance Optimizer, Accessibility Specialist, Security Reviewer.

## [0.2.0] — 2026-07-26

Phase 1 — Workflow spine.

### Added
- `Workflows/business-analysis.md` — Analysis stage; runs design states 01–02; Clarification Gate.
- `Workflows/product-planning.md` — Planning stage; design state 03; proceed/re-scope/stop + Direction Gate.
- `Workflows/ux-workflow.md` — Design states 04–05; tasks, IA, flows, ≥3 non-happy paths per task, a11y strategy.
- `Workflows/ui-workflow.md` — Design states 06–08; DS-first planning, prototype, self-audit.
- `Workflows/design-system-workflow.md` — supporting workflow; Extension Note triage, smallest-altitude extensions.
- `Workflows/frontend-planning.md` — Dev Planning (FE); S10/S11, touched-areas conflict check, test plan per AC.
- `Workflows/backend-planning.md` — Dev Planning (BE); API/error contracts, idempotency, authz default-deny.
- `Workflows/implementation.md` — build per plan; logged deviations; DS composition; suppression justification.
- `Workflows/qa.md` — evidence-based AC verification; S09 walk; severity discipline; L_QA loop.
- `Workflows/code-review.md` — 7 review dimensions; plan-conformance; L_REVIEW loop.
- `Workflows/git.md` — branch/commit/PR contracts; CI gate; stale-approval merge protection.
- `Workflows/release.md` — deploy + smoke-check; S15 notes; deferred-items sweep; BRD freeze.
- `Workflows/debug.md` — off-path; reproduce→falsify→root-cause→smallest fix→regression test.

## [0.1.0] — 2026-07-26

Phase 0 — Foundation.

### Added
- `Architecture/brd-schema.md` — Living BRD contract: Notion DB properties, sections S01–S16, update modes, decision-log format.
- `Architecture/permission-matrix.md` — 16 roles × 16 sections edit rights; cross-domain findings protocol.
- `Architecture/workflow-state-machine.md` — 13-stage lifecycle, transitions, guards, loops, human gates, 3-BRD parallelism.
- `Architecture/design-state-machine.md` — design sub-machine (states 01–11) adapted from "AI Product Design Agent — Workflow Architecture"; artifacts remapped to BRD sections.
- `Architecture/integration-map.md` — Notion ↔ Claude ↔ Git wiring, naming contracts, knowledge-layer separation, project onboarding.
- `Architecture/versioning.md` — semver rules, submodule distribution, upgrade path.
- `AI/CLAUDE-global.md` — per-project entry contract + project CLAUDE.md stub.
- `AI/orchestrator.md` — Workflow Orchestrator: stage routing, input verification, gate enforcement, loop accounting, Notion state updates, resume.
- `AI/brd-update-protocol.md` — role-scoped Notion write procedure, cross-domain protocol, anti-patterns.
- `AI/mcp-setup.md` — integration requirements per stage + degradation rules.
- Folder scaffold for Phases 1–6.
