# Onboarding — New Project in ~10 Minutes

> Prereqs (once ever): BRD database exists ([notion-setup](notion-setup.md)); toolkit repo has a remote; `gh auth status` ✅; Notion MCP connected ([mcp-setup](../AI/mcp-setup.md)).

## 1. Pin the toolkit

```bash
cd <project>
git submodule add <toolkit-remote-url> toolkit
cd toolkit && git fetch --tags && git checkout <latest-vX.Y.Z> && cd ..
git add .gitmodules toolkit && git commit -m "chore: pin toolkit <vX.Y.Z>"
```

## 2. Wire Claude

- Copy the stub block from [AI/CLAUDE-global.md](../AI/CLAUDE-global.md) into the project's `CLAUDE.md`; fill: project name, project code (`<XX>` for BRD IDs), Notion DB name + Project select value, stack one-liners.
- Create empty `project-overrides.md` at repo root with the header: *"Sanctioned deviations from toolkit Standards/. Every entry: rule overridden → replacement → why."*

## 3. Wire Notion

- Add the project to the DB's `Project` select options.
- That's all — pages created from the DB template are born conformant.

## 4. Wire Git

- Protect `main`: PR-only + required CI ([git-strategy](../Standards/git-strategy.md) rule 11). Solo repos too.
- CI runs minimum: typecheck, lint, test, build.

## 5. First BRD (the real onboarding test)

1. New page from DB template → fill [feature-request](../Templates/feature-request.md) seed → `Ready` ✓.
2. Start a Claude session in the project:
   ```text
   Act per toolkit AI/orchestrator.md. Pick up the ready BRD for <project>
   and run Analysis.
   ```
3. Follow the machine: it will run stages, stop at your three gates (Direction → Design → Final), and close with S15. First run, pick something small — the point is proving the loop, not shipping big.

## 6. Health signs (first BRD retro-lite)

- ✅ Every stage exit wrote S16; you can reconstruct the run from the BRD alone.
- ✅ Gates presented decision packages (not "approve?" blobs).
- ✅ No content written outside matrix rights; findings landed at discovery time.
- ⚠️ Claude improvised a missing input instead of bouncing → that's an orchestrator-contract violation; note it, tighten with [prompt-improvement](../Prompts/prompt-improvement.md).

## Upgrading a project later

```bash
cd <project>/toolkit && git fetch --tags && git checkout <new-tag> && cd ..
git add toolkit && git commit -m "chore: upgrade toolkit <old> -> <new>"
```
Major bumps: read the CHANGELOG migration notes first ([versioning](../Architecture/versioning.md)). In-flight BRDs finish under their pinned version unless you decide otherwise (log in S16).

## Removing / resetting

Submodule removal is standard git (`git submodule deinit`, remove entry, commit). BRDs are untouched — Notion outlives any repo.
