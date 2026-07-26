# Technology Stack Profiles

> **Module:** Architecture / Foundation (v1.2)
> **Status:** Stable
> **Purpose:** Resolve `manifest.stack.*` → which Standards/ apply, what the toolkit covers natively, and where the gaps are. Stages load only their profile's standards set. Profiles keep the toolkit honest about what it does and doesn't cover per stack.

## 1. Resolution

`manifest.stack.profile` names a profile below. Onboarding derives it from the stack answers; unknown combination → nearest profile + explicit gap notes in the manifest.

## 2. Profiles

### `nextjs-tailwind` (native — full coverage)
- **Matches:** frontend nextjs/react + styling tailwind (+ any/no backend).
- **Standards active:** all 17.
- **Gaps:** none.

### `react-spa`
- **Matches:** react without Next.js.
- **Standards active:** all except `nextjs.md`; `folder-structure.md` applies minus route-segment rules (features/lib structure stands).
- **Gaps:** routing/data conventions of the chosen router are project-level → `project-overrides.md` documents them.

### `mobile-react-native` / `mobile-flutter`
- **Standards active:** typescript (RN only), naming, code-quality, api-design, security, i18n, documentation, git-strategy, accessibility (principles; mechanisms differ), design-system (layer discipline).
- **Gaps:** react/nextjs/tailwind/responsive/component-structure don't apply as written; platform equivalents live in `project-overrides.md`. Screen Contract fully applies (screens are screens).

### `backend-service` / `api-only`
- **Matches:** product_type backend-service/api, frontend none.
- **Standards active:** typescript (if TS), api-design, code-quality, performance, security, naming, folder-structure (server sections), documentation, git-strategy.
- **Gaps:** UI stack standards inactive. **Design stages collapse:** lifecycle runs Analysis → Planning → Dev Planning (machine's Design/Design Review stages skipped by profile; API contract review replaces Design Gate — Direction + Final gates stand). Screen Contract not applicable → replaced by API surface registry (S11 api-specification per surface, validator checks 5–6 only against surfaces).

### `library`
- **Standards active:** language + code-quality + naming + documentation + git-strategy + api-design (public API discipline applies to exports).
- **Gaps:** app-shaped standards inactive; Screen Contract n/a; QA = consumer-perspective tests.

### `vue` / `angular` / native mobile / other backends (laravel, aspnet, go, spring-boot…)
- **Standards active:** stack-agnostic set — naming, code-quality, api-design, security, performance (doctrine sections), accessibility (frontend stacks), i18n, documentation, git-strategy, design-system (discipline, not implementation).
- **Gaps:** framework-specific standards missing by design — the toolkit doesn't fake coverage it lacks. Every Dev Planning under these profiles carries a standing note: framework conventions come from `project-overrides.md`. Recurring use of one such stack → write the standard, add the profile (minor toolkit bump — that's how coverage grows).

## 3. Rules

1. A profile never silently disables a **process** module — workflows/gates/checklists apply to every profile; only **tech standards** toggle (plus the documented design-stage collapse for headless profiles).
2. Security, code-quality gates, git-strategy, documentation: active in every profile, no exceptions.
3. Manifest `other:<name>` entries always produce a visible gap warning at Dev Planning until a profile covers them.
4. Profile changes mid-project (e.g. backend added) → re-run onboarding stack section; delta noted in next BRD's S16.
