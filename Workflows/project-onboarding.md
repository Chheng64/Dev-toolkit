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

- `project-manifest.yaml` at repo root, complete + validated
- `screens/registry.md` scaffold (empty registry, header row)
- `project-overrides.md` scaffold (if absent)
- Project `CLAUDE.md` toolkit block (if absent) — now references the manifest
- Notion: project added to BRD DB `Project` select; entry in Project Database if manifest declares one
- Onboarding record: manifest `onboarding.*` stamped

## Procedure

1. **Collect** — walk the [project-configuration template](../Templates/project-configuration.md) sections: Project Info → Stack → Design → Notion → Git. Ask only for what can't be detected; **detect first** (package.json → stack + package manager; git remote → repository; existing tokens file → token source). Confirm detections, don't re-ask them.
2. **Resolve stack profile** — per [stack-profiles](../Architecture/stack-profiles.md); surface coverage gaps immediately (user should know what the toolkit won't cover before work starts).
3. **Validate integrations** — run [integration-validation](integration-validation.md) full pass. Failures on *required* integrations (Notion MCP, git access) block completion; optional ones (Figma, browser automation) record warnings.
4. **Validate resources** — every declared design resource fetch-checked (Figma file opens, DS file accessible); Notion databases exist and match expected schema (BRD DB checked against [brd-schema](../Architecture/brd-schema.md) §1 — property names + option values); git repository reachable + default branch exists.
5. **Generate manifest** — write `project-manifest.yaml` per schema; `onboarding.status: complete` only when §Completion passes.
6. **Scaffold** — `screens/registry.md`, `project-overrides.md`, CLAUDE.md block. Commit: `chore: project onboarding — toolkit <version>`.
7. **Register** — Notion Project select option added; code uniqueness checked.

## Re-Onboarding (project evolves)

Targeted, not full: stack change → steps 1–2 (affected fields) + 3; new design resource → step 4 (that resource); Notion/Git move → step 4 + manifest update. Always: `last_validated` stamped, change noted in the next BRD's S16. Full re-run only when the manifest is untrusted.

## Completion Criteria

- [ ] Manifest schema-valid: all required fields non-null ([project-manifest](../Architecture/project-manifest.md) §4)
- [ ] Project code unique; registered in Notion `Project` select
- [ ] Stack profile resolved; gaps (if any) recorded in manifest and acknowledged by user
- [ ] Required integrations `validated`; optional failures recorded as warnings, not silently
- [ ] All declared design/Notion/git resources access-checked (no dead URLs in the manifest)
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
