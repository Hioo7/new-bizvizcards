---
category: Utilities
---

# ThemeRoot

Scopes the `bizviz` daisyUI theme to a subtree via `data-theme="bizviz"`. The
theme is also emitted at `:root`, so this is only needed when embedding BizViz UI
inside a surface that already carries a different `data-theme`.

```tsx
<ThemeRoot><App /></ThemeRoot>
```
