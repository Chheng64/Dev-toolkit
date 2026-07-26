# Prompt — Prompt Improvement

> **Use:** a toolkit prompt/workflow/skill produced weak output — improve the instruction, not just the instance.

```text
Role: toolkit maintainer (this edits the toolkit repo, not a project).

Underperformer: <Prompts/x.md | Workflows/y.md | Skills/z.md>.
Evidence (mandatory, ≥1 concrete case): what was asked, what came back,
what SHOULD have come back — S16/transcript references.

Diagnose before editing — which failure class:
1. Missing constraint (output violated an unstated rule → state it)
2. Wrong altitude (too vague to bind / so specific it overfits one case)
3. Missing input contract (pass lacked info and improvised instead of
   bouncing → add required-inputs + bounce rule)
4. Conflict (two modules disagree → Architecture/ contracts win; fix the
   loser, log the inconsistency)
5. Wrong home (instruction lives in a prompt but belongs in a standard/
   checklist where every stage inherits it)

Fix rules:
- Change the fewest words that close the failure class; general fix over
  case patch (case patches accrete into prompt blobs).
- Don't grow ceremony: every added instruction costs every future run —
  prefer moving to the right module over adding everywhere.
- Keep the module's skeleton; keep single responsibility.

Close: edit + CHANGELOG entry (patch/minor per versioning.md), one-line
before/after rationale. Re-run the original failing case as validation —
improvement proven, not assumed.
```

## Notes

- No evidence case → no edit; prompt tinkering without a failing example is superstition.
- Recurring same-class failures across modules → suspect the Architecture contract, not the leaf prompts.
