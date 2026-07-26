# Toolkit Versioning

> **Module:** Architecture / Foundation
> **Status:** Stable

## 1. Scheme

Semantic versioning, git-tagged: `v<major>.<minor>.<patch>`.

| Bump | When |
|------|------|
| **Major** | Breaking change to a contract: BRD schema section IDs/update modes, permission matrix rights removal, state machine states/transitions renamed or removed, orchestrator protocol change that old projects would violate. |
| **Minor** | New module (workflow, skill, standard, template, checklist, prompt, playbook), new BRD section (`S17+`), new optional property, expanded guidance. Backward compatible. |
| **Patch** | Wording fixes, clarifications, checklist item tweaks, typo/link fixes. No contract change. |

## 2. Changelog

`Documentation/CHANGELOG.md`, Keep-a-Changelog format. Every merged change adds an entry under `Unreleased`; tagging a release moves entries under the version heading. Entry names the module path touched.

## 3. Distribution — Git Submodule (version-pinned)

Each project consumes the toolkit as a submodule pinned to a tag:

```bash
# add to a project
git submodule add <toolkit-remote-url> toolkit
cd toolkit && git checkout v1.2.0 && cd ..
git add toolkit && git commit -m "chore: pin toolkit v1.2.0"

# upgrade a project (deliberate, per-project)
cd toolkit && git fetch --tags && git checkout v1.3.0 && cd ..
git add toolkit && git commit -m "chore: upgrade toolkit v1.2.0 -> v1.3.0"
```

Rules:
- Projects upgrade independently, deliberately. Never track `main` from a project.
- BRDs record `Toolkit Version` (Notion property) at pickup; a BRD finishes under the version it started with unless the user upgrades mid-flight (log in S16).
- Major upgrades: read the migration notes in the changelog entry first; they list which BRD sections/properties need manual touch-up.

## 4. Change Workflow for the Toolkit Itself

1. Edit modules on a branch in the toolkit repo.
2. Update `Documentation/CHANGELOG.md` (Unreleased).
3. Merge to `main`, tag when a coherent set is ready.
4. Improving a standard/workflow once here → every project gets it at next pin bump. Never copy toolkit content into project repos (submodule reference only).

## 5. Compatibility Promise

- Section IDs (`S01`–`S16`) never change meaning; deprecated IDs never reused.
- `Status` values only extend; renames are major.
- Skills/Workflows may strengthen guidance in minor versions, but may not silently gain edit rights — matrix changes are called out in the changelog, rights **removals** are major.
