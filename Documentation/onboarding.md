# Onboarding — New Project in ~10 Minutes

> Estimate covers steps 1–3 below; the first BRD (§4) is its own, longer exercise — it proves the loop, not the clock.
> Prereqs (once ever): BRD database exists **and the Toolkit Registry is written** (`~/.toolkit/registry.yaml` — both per [notion-setup](notion-setup.md); onboarding stops without the registry, by design); toolkit repo has a remote; `gh auth status` ✅; Notion MCP connected ([mcp-setup](../AI/mcp-setup.md)).

## 1. Pin the toolkit

```bash
cd <project>
git submodule add <toolkit-remote-url> toolkit
cd toolkit && git fetch --tags && git checkout <latest-vX.Y.Z> && cd ..
git add .gitmodules toolkit && git commit -m "chore: pin toolkit <vX.Y.Z>"
```

## 2. Run the onboarding workflow (mandatory — nothing runs without it)

```text
Run toolkit/Workflows/project-onboarding.md for this project.
```

The workflow interviews once, detect-first, and produces the manifest. It opens with **registration** (step 0 — project name, code, identity; reads the BRD DB from the Toolkit Registry; if you already registered via the README's pre-repo Step 0, it just confirms). Its core stage is **Project Resource Binding**: for every supported resource — Notion (BRD database, project page, optional sprint / decision-log databases), Figma (product design file, design-system library), GitHub (frontend / backend / optional infrastructure repos), documentation (API / architecture / product), Telegram, other MCP-backed resources — you choose:

- **Connect Existing** — point at what you already have; the toolkit resolves and stores the **stable identifier** (database ID, file key, repo ID, chat ID — never a display name), or
- **Create New** — the toolkit creates it for you (BRD DB per [notion-setup](notion-setup.md), `gh repo create`, Figma file, doc scaffold), or
- **Skip** — optional slots only; recorded explicitly and never re-asked proactively. (If work later genuinely needs a skipped resource, you get exactly one connect / create / confirm-absence decision — never a guess.)

Everything bound is access-validated before onboarding can finish:

```
✓ Notion BRD Database accessible
✓ Figma Product Design File accessible
✓ GitHub frontend repository accessible
✓ Telegram connected
○ Skipped: infrastructure repo, sprint DB
```

Required bindings (BRD database, ≥1 GitHub repo) failing → onboarding stays incomplete and tells you what unblocks it.

**Why binding matters:** the resulting registry is a hard boundary. After onboarding, the toolkit only ever touches what's registered — it never searches your Notion workspace, browses your Figma teams, or lists your GitHub repos ([Project Boundary Rule](../Architecture/integration-map.md) §2b). If a stage ever needs something unregistered, it stops and asks you to connect or create it — it never guesses.

The workflow also scaffolds for you: project `CLAUDE.md` block, `project-overrides.md` (*"Sanctioned deviations from toolkit Standards/. Every entry: rule overridden → replacement → why."*), `screens/registry.md` with optional seeded screens, and `context/` summaries. Its closing step (9) **pushes created repos, scaffolds CI** (minimum: typecheck, lint, test, build) where none exists, **applies branch protection** (PR-only + required CI, per [git-strategy](../Standards/git-strategy.md) rule 11 — the orchestrator does this via `gh api`, solo repos too), commits the lot, and only then stamps onboarding complete.

If you enabled Telegram: **start the daemon** ([extension README](../extensions/telegram/README.md) Setup 4) — without it, notifications spool but never send.

## 3. Verify Git wiring

Onboarding applied protection for you — verify: PRs required on `main`, CI checks listed as required. Adjust in repo settings only via `project-overrides.md`-sanctioned deviations.

## 4. First BRD (the real onboarding test)

1. New page from DB template → fill [feature-request](../Templates/feature-request.md) seed → `Ready` ✓.
2. Start a Claude session in the project:
   ```text
   Act per toolkit AI/orchestrator.md. Pick up the ready BRD for <project>
   and run Analysis.
   ```
3. Follow the machine: it will run stages, stop at your three gates (Direction → Design → Final), and close with S15. First run, pick something small — the point is proving the loop, not shipping big.

## 5. Health signs (first BRD retro-lite)

- ✅ Every stage exit wrote S16; you can reconstruct the run from the BRD alone.
- ✅ Gates presented decision packages (not "approve?" blobs).
- ✅ No content written outside matrix rights; findings landed at discovery time.
- ✅ Every external touch (Notion page, Figma file, repo) was a registry resource — nothing outside the binding.
- ⚠️ Claude improvised a missing input instead of bouncing → that's an orchestrator-contract violation; note it, tighten with [prompt-improvement](../Prompts/prompt-improvement.md).
- ⚠️ Claude searched the workspace for an unbound resource instead of asking connect-or-create → boundary violation; same treatment.

## Project evolves — rebind, don't re-onboard

New Figma file, moved database, extra repo → targeted re-run of the Resource Binding slot (`toolkit onboard --update`). Un-skipping a slot works the same way. Full re-onboarding only when the manifest is untrusted.

## Upgrading a project later

```bash
cd <project>/toolkit && git fetch --tags && git checkout <new-tag> && cd ..
git add toolkit && git commit -m "chore: upgrade toolkit <old> -> <new>"
```
Major bumps: read the CHANGELOG migration notes first ([versioning](../Architecture/versioning.md)). Projects on manifest v1 (pre-v1.5): first pickup offers the Resource Binding migration — existing manifest URLs seed the registry, stable IDs get resolved and validated ([project-manifest](../Architecture/project-manifest.md) §1). In-flight BRDs finish under their pinned version unless you decide otherwise (log in S16).

## Removing / resetting

Submodule removal is standard git (`git submodule deinit`, remove entry, commit). BRDs are untouched — Notion outlives any repo.
