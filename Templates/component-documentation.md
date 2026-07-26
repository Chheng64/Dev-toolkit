# Template — Component Documentation

> **Use:** every DS component (primitives customized beyond stock shadcn, all composites). Lives beside the component file. Undocumented = doesn't exist ([design-system](../Standards/design-system.md) rule 3).

```markdown
# <ComponentName>

<One sentence: what it is, when to reach for it.>

- **Origin:** BRD-<XX>-<nnn> · **Layer:** primitive | composite
- **Status:** stable | experimental | deprecated (→ use <X> instead)

## Usage
​```tsx
<ComponentName variant="destructive" size="sm">
  Label
</ComponentName>
​```
<The 80% case. Runnable. One or two more examples max for key variants.>

## Props
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| variant | `'default' \| 'destructive' \| …` | `'default'` | |
| … | | | |

## States & behavior
<Interaction states covered (hover/focus/active/disabled/loading/error),
keyboard behavior, focus management, aria semantics, reduced-motion behavior.>

## Tokens consumed
<semantic vars / theme tokens this depends on — the theming contract>

## Do / Don't
- ✅ <intended pattern>
- ❌ <the misuse you can foresee — e.g. "don't wrap to re-skin; add a variant">
```

## Rules

- Doc changes in the same commit as prop/behavior changes ([documentation](../Standards/documentation.md) rule 8).
- Examples must run — copy-paste-works is the bar.
- The Don't section names the fork/misuse you'd otherwise meet in review.
- Deprecation: status flips + pointer to replacement; component deleted only after usages migrate.
