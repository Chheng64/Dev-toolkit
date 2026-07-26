# Workflow — Project Onboarding

> **Module:** Workflows (v1.2)
> **Stage:** Per-**project** pre-pipeline — runs once before any BRD work; re-run per section when the project evolves. Not a BRD stage; no BRD Status involved.
> **Executor:** orchestrator + user (interview) — no skill role; output is the manifest, not BRD content.
> **Hard rule:** `C_MANIFEST` — no BRD, workflow, or AI skill executes for a project until `onboarding.status: complete` in a validated [project-manifest](../Architecture/project-manifest.md).

## Purpose

Establish all project metadata, validate every required integration, and generate the Project Manifest every workflow module consumes. One interview instead of fifty mid-stage questions.

## Inputs

- Project repo (existing or empty)
- User answers per [../Templates/project-configuration.md](../Templates/project-configuration.md)
- Access to: Notion MCP, `gh` CLI, Figma MCP (if design resources declared)

## Outputs

- **Registration record** (Notion): code + name reserved in `Project` select; identity page in Project Database when declared
- `project-manifest.yaml` at repo root, complete + validated (`project.registered` stamped)
- `screens/registry.md` — initialized registry; seeded screens (if any) as `planned`/`unassigned` with allocated SCR-IDs
- `context/` — 5 generated summaries per [context-package](../Architecture/context-package.md)
- `project-overrides.md` scaffold (if absent)
- Project `CLAUDE.md` toolkit block (if absent) — references manifest + context/
- Onboarding record: manifest `onboarding.*` stamped

## Procedure

0. **Project Registration** (v1.3 — runs BEFORE repository initialization; repo may not exist yet). Establish stable identity: Project Name, Code (2–4 uppercase, uniqueness-checked), Short Description, Product Type, Development Stage, intended Tech Stack. Record it durably in Notion immediately: reserve the code + name in the BRD DB `Project` select; write an identity page in the Project Database when the manifest declares one. Registration output seeds steps 1–5; the identity fields copy into `manifest.project.*` with `registered: <date>` at generation. A registered-but-not-yet-initialized project is a valid resting state — the repo can come days later; the identity and code allocations don't move.
1. **Collect** — walk the [project-configuration template](../Templates/project-configuration.md) sections: Project Info (pre-filled from registration) → Stack → Design → Notion → Git. Ask only for what can't be detected; **detect first** (package.json → stack + package manager; git remote → repository; existing tokens file → token source). Confirm detections, don't re-ask them.
2. **Resolve stack profile** — per [stack-profiles](../Architecture/stack-profiles.md); surface coverage gaps immediately (user should know what the toolkit won't cover before work starts).
3. **Validate integrations** — run [integration-validation](integration-validation.md) full pass. Failures on *required* integrations (Notion MCP, git access) block completion; optional ones (Figma, browser automation) record warnings.
4. **Validate resources** — every declared design resource fetch-checked (Figma file opens, DS file accessible); Notion databases exist and match expected schema (BRD DB checked against [brd-schema](../Architecture/brd-schema.md) §1 — property names + option values); git repository reachable + default branch exists.
5. **Generate manifest** — write `project-manifest.yaml` per schema; `onboarding.status: complete` only when §Completion passes.
6. **Initialize Screen Contract** (v1.3 — first-class step, not just a scaffold). Create `screens/registry.md`; set `manifest.screen_contract.next_id`. Then offer to **seed known screens now**: obvious top-level screens the product type implies (e.g. website → Home, Settings) plus any the user already knows. Each seeded screen gets a real `SCR-<nnn>` row, status `planned`, owner `unassigned` — Screen IDs exist before any design or development begins; UI planning later *claims* rows (owner ← BRD) instead of creating them from zero. Seeding is optional and small — register what's known, never speculate a sitemap.
7. **Generate AI Context Package** (v1.3) — `context/` per [context-package](../Architecture/context-package.md): `design.md`, `stack.md`, `integrations.md`, `conventions.md`, `model-routing.md`. Generated summaries with source pointers; stamped with toolkit version + date.
7b. **Communication integrations** (v1.4 — asked ONCE, then never again). "Enable Telegram notifications for this project?" → Yes / No / Configure later.
   - **Yes:** token via `TELEGRAM_BOT_TOKEN` env (global bot reused if already set — never stored in repo/manifest); mode private | group | **topic (recommended)**; collect `chat_id` (+ `topic_id` for topic mode); test-send "✅ <Project Name> has been successfully connected to the Dev Toolkit." (`telegram-plugin.mjs --test`) — test must succeed before `enabled: true`; save `communication.telegram` block to the manifest.
   - **No / Configure later:** write `communication.telegram.enabled: false`. The toolkit never asks again — re-open only when the user explicitly says "toolkit configure communication" or "toolkit onboard --update" (targeted re-run of this step).
   - Slack/Discord/email: future siblings, same shape; do not ask about them in v1.
8. **Scaffold & commit** — `project-overrides.md`, CLAUDE.md block. Commit: `chore: project onboarding — toolkit <version>`.

## Re-Onboarding (project evolves)

Targeted, not full: stack change → steps 1–2 (affected fields) + 3; new design resource → step 4 (that resource); Notion/Git move → step 4 + manifest update. Always: `last_validated` stamped, change noted in the next BRD's S16. Full re-run only when the manifest is untrusted.

## Completion Criteria

- [ ] Manifest schema-valid: all required fields non-null ([project-manifest](../Architecture/project-manifest.md) §4)
- [ ] Project code unique; registered in Notion `Project` select
- [ ] Stack profile resolved; gaps (if any) recorded in manifest and acknowledged by user
- [ ] Required integrations `validated`; optional failures recorded as warnings, not silently
- [ ] All declared design/Notion/git resources access-checked (no dead URLs in the manifest)
- [ ] Registration durable in Notion (code reserved; identity page if Project DB declared); `project.registered` stamped
- [ ] `screens/registry.md` initialized; seeded screens (if any) have valid SCR-IDs, `planned`/`unassigned`; `next_id` consistent
- [ ] `context/` generated: all 5 files present, stamped with toolkit version + date, headers marked GENERATED
- [ ] `screens/registry.md` + `project-overrides.md` + CLAUDE.md block exist
- [ ] Manifest + scaffolds committed
- [ ] `onboarding.status: complete` + dates stamped

## Common Mistakes

- Interviewing for what `package.json` already says — detect, confirm, move on.
- Accepting dead URLs into the manifest ("will fix later") — validation is the point; a manifest with unchecked resources is a config rumor.
- Marking complete with required integrations missing — that's `incomplete` + a blocking report, however inconvenient.
- Skipping onboarding for "quick" projects — the gate exists precisely because every project feels like an exception at minute one.
- Treating the manifest as write-once — stale manifests rot into lies; re-onboard on evolution.

## Best Practices

- Run onboarding in the project repo with the toolkit already pinned — detections get sharper.
- Keep answers terse in the manifest; prose belongs in CLAUDE.md/README, config in YAML.
- Surface the stack-profile gap list at the end even when empty — "full coverage" is worth saying out loud once.
