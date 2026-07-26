# Standard — Internationalization

> **Module:** Standards · Deviations only via project `project-overrides.md` (single-locale projects may adopt the "i18n-ready" floor: rules 1–6 without a translation pipeline).
> **Applies to:** all user-facing text and formatting.

## Rules

### Structure (i18n-ready floor — applies even before a second locale exists)
1. No user-facing strings hardcoded mid-JSX in feature logic: copy lives in a messages layer (per-locale message files, or a `copy.ts` module in single-locale projects) — one home per string, keyed by stable IDs.
2. No string concatenation/interpolation building sentences from fragments (`"Found " + n + " items"`) — templates with named placeholders (`found_items: "Found {count} items"`); word order is not universal.
3. Plurals via plural rules (ICU/`Intl.PluralRules`), never `count === 1 ? … : …` — languages have more than two plural forms.
4. Dates, numbers, currency through `Intl.*` formatters with explicit locale — never hand-formatted (`toFixed` + "$" prefix is a bug factory).
5. Layout tolerates text expansion (+30–50% German, stacked scripts): no fixed-width text containers, truncation designed per [responsive-design.md](responsive-design.md) rule 8.
6. Normalized user-facing language everywhere — error copy comes from the messages layer keyed by error `code` ([api-design.md](api-design.md) rule 6), so translation covers failure states too, not just marketing paths.

### Full i18n (when a second locale lands)
7. Locale routing per Next.js convention (project picks: subpath default); locale detection respectful (accept-language as suggestion, user choice persisted, never IP-forced).
8. Message files per locale, missing-key handling loud in dev (visible marker), fallback-to-default in prod — untranslated ≠ crashed.
9. RTL-ready when an RTL locale is in scope: logical properties (`ms-`/`me-`/`ps-`/`pe-` Tailwind logical utilities) over physical (`ml-`/`mr-`) from that point on; icons with directional meaning flip deliberately.
10. Translated content is content, not code: adding a locale must not require component changes — that's the test of rules 1–5.

## Anti-patterns

- Copy scattered through JSX, harvested "later" — later is a full-codebase archaeology.
- Sentence-fragment keys (`prefix_1`, `middle_bold`, `suffix`) recomposed in markup — untranslatable.
- `en.json` as junk drawer with keys named by screen position (`home_text_3`) instead of meaning.
- Formatting money as string math anywhere near prices.
- Shipping error states English-only in an otherwise translated app.
