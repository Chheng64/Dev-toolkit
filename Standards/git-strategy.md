# Standard — Git Strategy

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** all project repos + this toolkit repo. Mechanics executed by [../Workflows/git.md](../Workflows/git.md).

## Rules

### Model
1. Trunk-based with short-lived feature branches: `main` always releasable, one branch per BRD (`feat/<brd-id>-<slug>`), no develop/release branch ceremony solo work doesn't need.
2. One BRD = one branch = one PR — the invariant everything else leans on. Mixed-concern branches are the root of unrevertable history.
3. Branch lifetime target: days, not weeks. A branch outliving its second rebase is a slicing failure — feedback to planning.
4. Hotfixes ride the same model (`fix/<brd-id>-<slug>` from main) via the hotfix playbook — reduced ceremony, same gates that matter (QA on the fix path, Final Gate).

### Commits
5. Conventional Commits + BRD scope: `<type>(<BRD-ID>): <subject>` — types: `feat|fix|refactor|test|docs|chore|perf`. Subject imperative, ≤72 chars, states effect not activity.
6. Atomic: one logical change per commit; it builds and its tests pass (bisectable history). Body when the why isn't obvious from the subject + BRD.
7. No `wip`/`fixes`/`asdf` on anything reviewable — squash-cleanup before PR ([git workflow](../Workflows/git.md) rule: never after review starts).

### Sync & merge
8. Rebase feature branches on main at stage boundaries (never mid-QA); merge to main by squash with a convention-format subject — main history reads one commit per BRD.
9. Force-push only own feature branches (`--force-with-lease` always); never main, never after review began.
10. Conflicts resolved by understanding both sides — a conflict touching another in-flight BRD's declared areas escalates ([git workflow](../Workflows/git.md)).

### Protection & hygiene
11. Main protected: PR-only, CI green required, no direct pushes (applies to solo repos too — the gate protects against tired-you).
12. `.gitignore` complete before first commit (env files, `.DS_Store`, build output); secrets never enter history — a leaked secret rotates immediately, history-scrub is not the fix.
13. Tags for releases (`vX.Y.Z` semver) where the project versions; toolkit pins consume tags only ([versioning.md](../Architecture/versioning.md)).
14. PR body = decision package (BRD link, S13/S14 evidence, screenshots, limitations) per [pull-request template](../Templates/pull-request.md).

## Anti-patterns

- Long-lived divergence "to finish everything first" — integrate small, integrate often.
- Merge commits from main into feature branches mid-flight (rebase instead; history stays linear).
- Squashing away meaningful boundaries in multi-slice work before review saw them.
- Committing generated/build artifacts.
- "Quick fix directly on main" — the invariant has no small exceptions; that's what the hotfix path is for.
