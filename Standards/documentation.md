# Standard — Documentation

> **Module:** Standards · Deviations only via project `project-overrides.md`.
> **Applies to:** BRD prose, code docs, component/API docs, READMEs, release notes.

## Rules

### Where things go (the routing table)
1. Layer separation is absolute ([integration-map.md](../Architecture/integration-map.md) §1): feature knowledge → BRD; process/standards → toolkit; project stack quirks → project `CLAUDE.md`/`project-overrides.md`; code-adjacent contracts → doc files beside code. Written in the wrong layer = moved, not duplicated.
2. Code-adjacent docs: DS components per [component-documentation template](../Templates/component-documentation.md); server surfaces per [api-specification template](../Templates/api-specification.md); project README per its template. Everything else earns its existence — no doc without a reader.

### Writing rules
3. Write for the reader who wasn't there (six-months-future-you): no session-local shorthand, no codenames without definition, no "as discussed".
4. Lead with what/why, then how. First paragraph answers "what is this and when do I need it".
5. Product language for product docs (S15, user-facing); precise technical language for contracts; never internal jargon leaking into user-visible text.
6. Examples over prose where behavior is showable: one runnable example beats three paragraphs. Examples must actually run — broken examples are worse than none.
7. Honesty is structural: known limitations, unhandled cases, and sharp edges get stated ([technical-writer](../Skills/technical-writer.md) never documents aspiration as fact).

### Maintenance
8. Docs change in the same commit as the behavior they describe — doc drift is a review finding (code-review checks the absence).
9. Stale docs are deleted or fixed on contact — a wrong doc is worse than no doc; if you read it and it lied, fix it now (boy-scout rule, applies to everyone passing through).
10. Comments in code follow [code-quality](code-quality.md) rule 10: constraints and whys only.
11. Decision history lives in S16, not in doc files — docs state current truth; the log states how we got here.

## Anti-patterns

- Doc-as-apology: paragraphs explaining confusing code instead of fixing the code.
- Duplicated truth (README + BRD + comment all describing the same contract, drifting independently) — one home, links elsewhere.
- Auto-generated doc noise (empty JSDoc stubs on every function) — coverage theater.
- Changelog-style docs ("updated X, fixed Y") where the reader needs current-state truth.
- Writing docs nobody will route to — if no template/rule names its home, question the artifact.
