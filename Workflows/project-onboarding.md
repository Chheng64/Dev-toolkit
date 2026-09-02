# Workflow — Project Onboarding

> **Module:** Workflows (v1.5)
> **Stage:** Per-**project** pre-pipeline — runs once before any BRD work; re-run per section when the project evolves. Not a BRD stage; no BRD Status involved.
> **Executor:** orchestrator + user (interview) — no skill role; output is the manifest, not BRD content.
> **Hard rule:** `C_MANIFEST` — no BRD, workflow, or AI skill executes for a project until `onboarding.status: complete` **and** `resources.status: bound` in a validated [project-manifest](../Architecture/project-manifest.md).

## Purpose

Establish all project metadata, **bind every external resource the project owns** (Project Resource Binding), validate every required integration and binding, and generate the Project Manifest every workflow module consumes. One interview instead of fifty mid-stage questions — and after it, the toolkit never searches the user's workspace again ([Project Boundary Rule](../Architecture/project-manifest.md) §3).

## Inputs

- **Toolkit Registry** (`~/.toolkit/registry.yaml`, [toolkit-registry](../Architecture/toolkit-registry.md)) — hard prerequisite; missing → stop, point at one-time setup
- Project repo (existing or empty)
- User answers per [../Templates/project-configuration.md](../Templates/project-configuration.md)
- Access to: Notion MCP, `gh` CLI, Figma MCP (if Figma resources will be bound)

## Outputs

- **Registration record** (Notion): code + name reserved in `Project` select; identity page under the registry's projects parent page when configured
- **Project Resource Registry** (`manifest.resources`) — every supported resource slot explicitly `connected` / `created` / `skipped`, stable identifiers stored, all bindings access-validated
- `project-manifest.yaml` at primary repo root, complete + validated (`project.registered` stamped, `resources.status: bound`)
- `screens/registry.md` — initialized registry; seeded screens (if any) as `planned`/`unassigned` with allocated SCR-IDs
- `context/` — 5 generated summaries per [context-package](../Architecture/context-package.md)
- `project-overrides.md` scaffold (if absent)
- Project `CLAUDE.md` toolkit block (if absent) — references manifest + context/
- Onboarding record: manifest `onboarding.*` stamped

## Procedure

0. **Project Registration** (v1.3; v1.5 — reads the [Toolkit Registry](../Architecture/toolkit-registry.md), runs BEFORE repository initialization; repo may not exist yet). Load `~/.toolkit/registry.yaml` — **missing → stop with the remedy** ("run one-time setup per README"); never search the workspace for the BRD DB. Establish stable identity: Project Name, Code (2–4 uppercase, uniqueness-checked against the registry-named BRD DB's `Project` select), Short Description, Product Type, Development Stage, intended Tech Stack. Record it durably in Notion immediately: reserve the code + name in the BRD DB `Project` select; when `registry.notion.projects_parent_page` is set, create the **identity page** there now (all six identity fields — the durable pre-repo home; its id becomes the `resources.notion.project_page` binding at step 3, `binding: created`). No parent page configured → identity lives in the select (code+name) until the manifest exists; recommend configuring one for register-now-repo-later projects. Registration output seeds steps 1–5; the identity fields copy into `manifest.project.*` with `registered: <date>` at generation. A registered-but-not-yet-initialized project is a valid resting state — the repo can come days later; the identity and code allocations don't move.

1. **Collect** — walk the [project-configuration template](../Templates/project-configuration.md) Project Info (pre-filled from registration), Stack, Design Configuration (code-side), and Git Behavior sections. Ask only for what can't be detected; **detect first** (package.json → stack + package manager; git remote → candidate repository binding; existing tokens file → token source). Confirm detections, don't re-ask them. Resource questions belong to step 3, not here.

2. **Resolve stack profile** — per [stack-profiles](../Architecture/stack-profiles.md); surface coverage gaps immediately (user should know what the toolkit won't cover before work starts).

3. **Project Resource Binding** (v1.5 — mandatory stage). Walk every supported resource slot; for each, the user chooses **Connect Existing** or **Create New** (or **Skip** for optional slots — recorded explicitly, never re-asked proactively; only a stage that can't proceed without the slot may later raise one Resource Decision, [project-manifest §3](../Architecture/project-manifest.md)). Store **stable identifiers only** — database IDs, file keys, repo IDs, chat IDs; never display names ([project-manifest](../Architecture/project-manifest.md) §3 identifier table).

   | Provider | Slots | Required? | Connect Existing | Create New |
   |----------|-------|-----------|------------------|------------|
   | Notion | BRD Database | **yes** | **inherited from the [Toolkit Registry](../Architecture/toolkit-registry.md)** — confirmed, never re-asked | only if the registry has none (first project ever): create per [notion-setup](../Documentation/notion-setup.md), write to the registry first, then inherit |
   | Notion | Delivery (PO) view | **yes** | confirm the view exists on the bound BRD DB | create it via `notion-create-view`: columns `Name`, `Status`, `Phase`, `Compare`, `PR`, `Merge SHA`, `Release Tag`, filtered to this project, grouped by Status ([notion-setup](../Documentation/notion-setup.md) §1) |
   | Notion | Project Page | optional | identity page from step 0 binds automatically; or resolve URL → page id | create identity page (if step 0 didn't) |
   | Notion | Sprint DB · Decision-log DB | optional | resolve URL → database id | create (only on explicit need — no ceremony DBs) |
   | Figma | Product Design File | optional¹ | file key from URL, verify access | create file via Figma MCP |
   | Figma | Design System Library | optional | library file key, verify access | create library file |
   | GitHub | Frontend / Backend repo | **≥1 of the two** | step-1 detected remote(s) presented as pre-filled candidates (id resolved from remote URL; prefer `origin`) — user confirms slot assignment, never re-types owner/repo; undetected: `gh api repos/{owner}/{repo}` → numeric id | `gh repo create <name> --private --source . --push` — push included so the default branch exists for step 5 |
   | GitHub | Infrastructure repo | optional | same | same |
   | Docs | API / Architecture / Product documentation | optional | bind notion-page / repo-path / url | scaffold in the bound repo or create Notion page |
   | Communication | Telegram | optional² | existing chat/topic → `chat_id` (+`topic_id`) | user creates group/topic in Telegram and adds the bot (bots cannot create groups); then discovery below |
   | Other | additional MCP-backed resources | optional | stable id per provider | per provider |

   ¹ Skipped Figma → prototype-only design flow ([screen-contract](../Architecture/screen-contract.md) §4).
   ² Communication asked **ONCE** (v1.4 rule): Yes / No / Configure later. Yes → token via `TELEGRAM_BOT_TOKEN` env (never stored in repo/manifest; registry `telegram_bot: none` → route through bot creation first, [extension README](../extensions/telegram/README.md) Setup 1); mode private | group | **topic (recommended)**; **chat_id discovery:** user sends any message in the target chat, then the plugin/`getUpdates` reports `chat_id` (+`topic_id`) back — never typed from memory. The test-send "✅ <Project Name> has been successfully connected to the Dev Toolkit." (`telegram-plugin.mjs --test`) runs at step 6 **after the manifest is written** (the plugin reads it) and must succeed before `enabled: true` stands — failure reverts to `enabled: false, deferred: true` without consuming the ask-once. No → `enabled: false`. Later → `enabled: false, deferred: true`; the completion report prints the re-open phrase. Neither is ever re-asked except via the Re-Onboarding phrases. Slack/Discord/email: future siblings, same shape; do not ask in v1.
   Monorepo: bind the same repo (same id) to frontend + backend slots. Set `git.primary_repository` — the slot hosting manifest, toolkit pin, `screens/`; confirm each repo's default branch as it is bound (⚙ via `gh`). Each binding records `binding: connected|created`, `bound: <date>`.

   - **Shared Contract** — offered **only** when the frontend and backend repositories are different
     bindings. Connect existing / create new; **skip is not offered**, because a split-repo project
     with two-phase BRDs has nowhere else to put the artifact. Single-repo projects are not asked:
     `phases.contracts_path` (default `contracts/`) applies and is recorded without a question.

4. **Validate integrations** — run [integration-validation](integration-validation.md), **tool checks only on this first run** (the binding rows of its table belong to re-validation; step 5 owns first-run binding validation). Failures on *required* integrations (Notion MCP, git access) block completion; optional ones (Figma, browser automation) record warnings. During onboarding, all results accumulate in the candidate config and are written into the manifest at step 6.

5. **Validate resource bindings** — every bound resource access-checked via its **stable identifier** (not its URL): BRD DB fetches and matches [brd-schema](../Architecture/brd-schema.md) §1 (property names + option values); Figma file/library opens; each repo reachable + default branch exists; documentation targets resolve; Telegram test-send succeeded. Report the checklist verbatim:

   ```
   ✓ Notion BRD Database accessible        (id …f112, connected)
   ✓ Figma Product Design File accessible  (key AbC…, created)
   ✓ GitHub frontend repository accessible (id 8123…, connected)
   ✓ Telegram connected                    (chat -100…, topic 42)
   ○ Skipped: infrastructure repo, sprint DB, architecture/product docs
   ○ Telegram: configure later — say "toolkit configure communication"   (when deferred)
   ```

   Any required binding failing → onboarding stays `incomplete`; report what unblocks it. `resources.status: bound` only when this step passes.

6. **Generate manifest** — write `project-manifest.yaml` per schema (`manifest_version: 2`) with `onboarding.status: incomplete` — the completion stamp belongs to step 9, after every output exists. If Telegram was accepted at step 3, run the test-send now (the plugin reads the manifest just written); failure → `enabled: false, deferred: true` + report line.

7. **Initialize Screen Contract** (v1.3 — first-class step, not just a scaffold). Create `screens/registry.md`; set `manifest.screen_contract.next_id`. Then offer to **seed known screens now**: obvious top-level screens the product type implies (e.g. website → Home, Settings) plus any the user already knows. Each seeded screen gets a real `SCR-<nnn>` row, status `planned`, owner `unassigned` — Screen IDs exist before any design or development begins; UI planning later *claims* rows (owner ← BRD) instead of creating them from zero. Seeding is optional and small — register what's known, never speculate a sitemap.

8. **Generate AI Context Package** (v1.3) — `context/` per [context-package](../Architecture/context-package.md): `design.md`, `stack.md`, `integrations.md`, `conventions.md`, `model-routing.md`. Generated summaries with source pointers; stamped with toolkit version + date.

8b. **Bootstrap the design harness** (v1.10) — the design machine's tools read files that the pipeline **reads but never produces**; a project without them cannot run states 08 or 12 at all:
   - Generate `toolkit.config.json` at the repo root from the manifest `design:` block ([validation-engine §2](../Architecture/validation-engine.md)). **Generated, never hand-authored** — regenerate whenever the manifest changes.
   - Seed `design/navmap/` from the vendored templates: `nav-lanes.json`, `state-vocabulary.md`, `state-machines.json`, `edge-annotations.json`, `audit-plan.json` ([design-toolkit/templates/](../design-toolkit/templates/)).
   - Create `design/prototype/` and copy the review player in from [Templates/prototype/](../Templates/prototype/) at the first prototype, per [ui-workflow §B.6](ui-workflow.md).
   - Verify Node ≥ 22 and Chrome resolvable (`audit.chrome` or `$TOOLKIT_CHROME`) — a missing Chrome makes every rendering-class check **exit 2**, which is *unevaluable*, not passing.

9. **Scaffold, wire & complete** — the closing step owns everything that makes the project runnable and stamps completion:
   - Scaffold `project-overrides.md`, CLAUDE.md block.
   - **CI**: no workflow file in a bound repo → scaffold one from the stack profile (minimum: typecheck, lint, test, build) — the PR → Human Review transition requires CI green, so a repo without CI can never pass the pipeline.
   - Commit `chore: project onboarding — toolkit <version>`; **push** every `created` repo (connect-existing repos push per their own flow).
   - **Branch protection** (actor: orchestrator, via `gh api`, per [git-strategy](../Standards/git-strategy.md) rule 11): PR-only + required CI on every bound repo's default branch. Solo repos too.
   - Run **§Completion Criteria**; on full pass stamp `onboarding.status: complete` + dates and commit the stamp. Fail → report the exact unmet items; the manifest stays `incomplete` (C_MANIFEST holds the gate).
   - Report: validation checklist (step 5 format), stack-profile gaps, and — if Telegram is `deferred` — the re-open phrase.

## After Onboarding — the Boundary Holds

From this point the Workflow Orchestrator accesses **only** registry resources — no workspace-wide Notion search, no Figma browsing, no repo listing ([integration-map](../Architecture/integration-map.md) §2b). A stage that needs a missing, skipped-but-required, or unreachable resource goes `Blocked (resource)` and raises one **Resource Decision** — connect existing / create new / confirm absence ([project-manifest §3](../Architecture/project-manifest.md)); connect/create routes through the Re-Onboarding rebind rule below. Never guess.

## Re-Onboarding (project evolves)

**One rebind rule, every case:** any registry mutation — new resource, moved resource, un-skip, rebind after `unreachable`, Resource Decision outcome — runs **step 3 (that slot) + step 4 (that provider's tool check) + step 5 (that binding)**, restamping `validated`, the provider's `integrations.*`, and `last_validated`. No mutation path skips validation. Stack change → steps 1–2 (affected fields) + 4. Logging per [project-manifest §3](../Architecture/project-manifest.md): mid-BRD → that BRD's S16; otherwise → next pickup's S16; manifest commit `chore: rebind <slot>` on the primary repo's default branch. Full re-run only when the manifest is untrusted.

**Re-open phrases (said to Claude — this toolkit has no CLI binary; these route here):**
- **"toolkit onboard --update"** → present the slot/section menu; run the rebind rule for what the user picks.
- **"toolkit configure communication"** → run the rebind rule for the communication slot (the only sanctioned re-open of a `no`/`later` answer).

## Migration (manifest v1 → v2)

Triggered **only** by the Manifest Gate ([../AI/orchestrator.md](../AI/orchestrator.md) responsibility 0, step 3) when it finds `manifest_version: 1` — at session entry, pickup and resume alike, before staleness checks (which need registry ids v1 lacks). Automatic offer; resumable and idempotent (re-running continues where it stopped — connect-existing resolves to the same ids). In-flight BRDs are untouched and resume normally after.

1. **Seed** the registry from v1 fields — no re-asking for what v1 already knows:

   | v1 field | → slot | Mechanism | Fallback |
   |----------|--------|-----------|----------|
   | `notion.brd_database` (URL) | `resources.notion.brd_database` | inherit from Toolkit Registry; else URL → id via `notion-fetch` (+ data source) | ask for the URL |
   | `notion.project_database` etc. | matching `resources.notion.*` | URL → id | ask |
   | `design.figma_file` / `design_system_file` | `resources.figma.*` | URL → file key | not a URL → ask for the file URL (never browse Figma) |
   | `git.repository` | a `resources.github.*` slot — **user confirms which** (also sets `git.primary_repository`) | URL → `gh api` numeric id | ask |
2. **Walk NEW slots only** (docs, sprint/decision-log DBs, communication once, other) — connect / create / skip, exactly like step 3.
3. **Initialize missing v1.3+ artifacts** if absent: `screens/registry.md` (step 7), `context/` (step 8).
4. **Validate** every seeded + new binding (step 5) and stamp.
5. Stamp `manifest_version: 2`, `resources.status: bound`, `last_validated`; commit `chore: manifest migration v1→v2 — toolkit <version>`. Stamp only on full checklist pass — a half-migrated manifest stays v1 and re-enters here next session.

## Completion Criteria

- [ ] Manifest schema-valid: all required fields non-null ([project-manifest](../Architecture/project-manifest.md) §5), `manifest_version: 2`
- [ ] Project code unique; registered in Notion `Project` select
- [ ] Stack profile resolved; gaps (if any) recorded in manifest and acknowledged by user
- [ ] **Every supported resource slot explicitly resolved** — `connected` / `created` / `skipped`; no silent absences
- [ ] **Every binding stores a stable identifier** (id/key/repo-id/chat-id) — no display names, no unresolved URLs
- [ ] Required bindings (`resources.notion.brd_database`, ≥1 GitHub repo) validated; `resources.status: bound` + `bound` date stamped
- [ ] `Delivery (PO)` view exists on the bound BRD DB, filtered to this project
- [ ] Required integrations `validated`; optional failures recorded as warnings, not silently
- [ ] All bound resources access-checked this run via stable id (no dead bindings in the registry)
- [ ] Validation checklist (step 5 format) shown to the user, skips listed
- [ ] **Design harness bootstrapped**: `toolkit.config.json` generated from the manifest, `design/navmap/` seeded from templates, Node + Chrome resolvable (or the gap recorded — an unavailable checker is a recorded gap, never a silent pass)
- [ ] Registration durable in Notion (code reserved; identity page if bound); `project.registered` stamped
- [ ] `screens/registry.md` initialized; seeded screens (if any) have valid SCR-IDs, `planned`/`unassigned`; `next_id` consistent
- [ ] `context/` generated: all 5 files present, stamped with toolkit version + date, headers marked GENERATED
- [ ] `screens/registry.md` + `project-overrides.md` + CLAUDE.md block exist
- [ ] CI workflow present in every bound repo (scaffolded if absent); branch protection (PR-only + required CI) applied to every bound repo's default branch
- [ ] Manifest + scaffolds committed; created repos pushed
- [ ] `onboarding.status: complete` + dates stamped (step 9, after all of the above)

## Common Mistakes

- Interviewing for what `package.json` already says — detect, confirm, move on.
- Storing a URL or display name where a stable id exists — names rename, bindings break; resolve the id at bind time.
- Accepting dead bindings into the registry ("will fix later") — validation is the point; an unchecked binding is a config rumor.
- Leaving an optional slot silently absent instead of recording `skipped` — silence re-opens the question forever and invites runtime guessing.
- Marking complete with required bindings or integrations missing — that's `incomplete` + a blocking report, however inconvenient.
- Searching the workspace after onboarding "just to find that one doc" — boundary violation; bind it or leave it.
- Skipping onboarding for "quick" projects — the gate exists precisely because every project feels like an exception at minute one.
- Treating the manifest as write-once — stale manifests rot into lies; re-onboard on evolution.

## Best Practices

- Run onboarding in the project repo with the toolkit already pinned — detections get sharper.
- Prefer **Connect Existing** when a resource already exists; **Create New** is for genuinely new projects — never create a duplicate beside a connectable original.
- Keep answers terse in the manifest; prose belongs in CLAUDE.md/README, config in YAML.
- Surface the stack-profile gap list at the end even when empty — "full coverage" is worth saying out loud once.
